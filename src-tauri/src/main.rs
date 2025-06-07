#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{
    collections::HashMap,
    env,
    fs,
    fs::File,
    io::{Cursor, Read},
    path::Path,
};

use zip::ZipArchive;
use reqwest;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;

#[tauri::command]
async fn download_app(url: String, filename: String) -> Result<(), String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("❌ Download error: {}", e))?;
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("❌ Failed to read response: {}", e))?;

    let mut path = dirs::desktop_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("tfy-downloads");
    std::fs::create_dir_all(&path).map_err(|e| format!("❌ Failed to create folder: {}", e))?;
    path.push(&filename);

    let mut file = File::create(&path).map_err(|e| format!("❌ Failed to create file: {}", e))?;
    file.write_all(&bytes).map_err(|e| format!("❌ Write failed: {}", e))?;
    file.flush().ok();

    open::that(&path).map_err(|e| format!("❌ Failed to open file: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn download_player(version_hash: String) -> Result<String, String> {
    use std::{collections::HashMap, fs::{self, File}, io::{Cursor, Read}, path::{Path, Component}};
    use zip::ZipArchive;

    let client = reqwest::Client::new();
    let base_url = "https://clientsettings.roblox.com/v2/client-version/WindowsPlayer/channel/LIVE";

    let client_info = client
        .get(base_url)
        .header("User-Agent", "TFY Tool 1.0")
        .send()
        .await
        .map_err(|e| format!("❌ Failed to get client info: {}", e))?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("❌ Failed to parse client info: {}", e))?;

    let current_version = client_info["clientVersionUpload"]
        .as_str()
        .ok_or("❌ Could not extract version from client info")?;

    let version_hash = if version_hash.trim().is_empty() {
        current_version.to_string()
    } else {
        version_hash.trim().to_lowercase()
    };

    if !version_hash.starts_with("version-") {
        return Err("❌ Version must start with 'version-'".to_string());
    }

    let manifest_url = format!("https://setup.rbxcdn.com/{}-rbxPkgManifest.txt", version_hash);
    let manifest = reqwest::get(&manifest_url)
        .await
        .map_err(|e| format!("❌ Failed to fetch manifest: {}", e))?
        .text()
        .await
        .map_err(|e| format!("❌ Failed to read manifest: {}", e))?;

    let desktop = dirs::desktop_dir().ok_or("❌ Could not find Desktop directory")?;
    let target_root = desktop.join("tfy-roblox");

    fs::create_dir_all(&target_root)
        .map_err(|e| format!("❌ Could not create install folder: {}", e))?;

    let mut extract_roots: HashMap<&str, &str> = HashMap::new();
    extract_roots.insert("RobloxApp.zip", "");
    extract_roots.insert("redist.zip", "");
    extract_roots.insert("shaders.zip", "shaders/");
    extract_roots.insert("ssl.zip", "ssl/");
    extract_roots.insert("WebView2.zip", "");
    extract_roots.insert("WebView2RuntimeInstaller.zip", "WebView2RuntimeInstaller/");
    extract_roots.insert("content-avatar.zip", "content/avatar/");
    extract_roots.insert("content-configs.zip", "content/configs/");
    extract_roots.insert("content-fonts.zip", "content/fonts/");
    extract_roots.insert("content-sky.zip", "content/sky/");
    extract_roots.insert("content-sounds.zip", "content/sounds/");
    extract_roots.insert("content-textures2.zip", "content/textures/");
    extract_roots.insert("content-models.zip", "content/models/");
    extract_roots.insert("content-platform-fonts.zip", "PlatformContent/pc/fonts/");
    extract_roots.insert("content-platform-dictionaries.zip", "PlatformContent/pc/shared_compression_dictionaries/");
    extract_roots.insert("content-terrain.zip", "PlatformContent/pc/terrain/");
    extract_roots.insert("content-textures3.zip", "PlatformContent/pc/textures/");
    extract_roots.insert("extracontent-luapackages.zip", "ExtraContent/LuaPackages/");
    extract_roots.insert("extracontent-translations.zip", "ExtraContent/translations/");
    extract_roots.insert("extracontent-models.zip", "ExtraContent/models/");
    extract_roots.insert("extracontent-textures.zip", "ExtraContent/textures/");
    extract_roots.insert("extracontent-places.zip", "ExtraContent/places/");

    for line in manifest.lines() {
        let name = line.trim();
        if !name.ends_with(".zip") {
            continue;
        }

        let url = format!("https://setup.rbxcdn.com/{}-{}", version_hash, name);
        let response = reqwest::get(&url)
            .await
            .map_err(|e| format!("❌ Failed to download {}: {}", name, e))?
            .bytes()
            .await
            .map_err(|e| format!("❌ Failed to get bytes for {}: {}", name, e))?;

        let mut archive = ZipArchive::new(Cursor::new(response))
            .map_err(|e| format!("❌ Failed to open zip {}: {}", name, e))?;

        let root = extract_roots.get(name).unwrap_or(&"");

        for i in 0..archive.len() {
            let mut archive_file = archive.by_index(i).map_err(|e| e.to_string())?;
            if archive_file.name().ends_with('/') {
                continue;
            }

            let file_path = Path::new(archive_file.name());

            if file_path.components().any(|c| matches!(c, Component::ParentDir | Component::Prefix(_))) {
                continue;
            }

            let out_path = target_root.join(root).join(file_path);
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("❌ Failed to create folder {}: {}", parent.display(), e))?;
            }

            let mut outfile = File::create(&out_path)
                .map_err(|e| format!("❌ Failed to create file {}: {}", out_path.display(), e))?;
            std::io::copy(&mut archive_file, &mut outfile)
                .map_err(|e| format!("❌ Failed to write file {}: {}", archive_file.name(), e))?;
        }
    }

    Ok(format!("✅ Roblox {} installed to Desktop/tfy-roblox!", version_hash))
}

#[tauri::command]
async fn run_function(name: String, _args: Option<String>) -> Result<String, String> {
    match name.as_str() {
        "winrar_crack" => {
            let url = "https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/rarreg.key";
            let response = reqwest::get(url).await.map_err(|e| e.to_string())?;
            let content = response.bytes().await.map_err(|e| e.to_string())?;
            
            let paths = vec![
                "C:\\Program Files\\WinRAR",
                "C:\\Program Files (x86)\\WinRAR"
            ];

            let winrar_path = paths.iter()
                .find(|&path| Path::new(path).exists())
                .ok_or("WinRAR installation not found")?;

            let temp_file = env::temp_dir().join("rarreg.key");
            fs::write(&temp_file, &content).map_err(|e| format!("Failed to create temp file: {}", e))?;

            let status = Command::new("powershell")
                .args(&[
                    "-Command",
                    &format!(
                        "Start-Process powershell -Verb RunAs -WindowStyle Hidden -Wait -ArgumentList \
                        '-Command Copy-Item -Path \"{}\" -Destination \"{}/rarreg.key\" -Force'",
                        temp_file.display(),
                        winrar_path
                    )
                ])
                .status()
                .map_err(|e| format!("Failed to execute PowerShell command: {}", e))?;

            let _ = fs::remove_file(temp_file);

            if status.success() {
                Ok(format!("WinRAR crack successfully applied to {}", winrar_path))
            } else {
                Err("Failed to apply WinRAR crack. Please run the application as administrator.".to_string())
            }
        },
        "clean_temp" => {
            Command::new("cmd")
                .args(&["/C", "del /s /f /q %temp%\\* && del /s /f /q C:\\Windows\\Temp\\*"])
                .output()
                .map_err(|e| e.to_string())?;
            
            Ok("Temporary files cleaned successfully!".to_string())
        },
        "run_optimization" => {
            let url = "https://raw.githubusercontent.com/DragosKissLove/testbot/main/TFY%20Optimization.bat";
            let response = reqwest::get(url).await.map_err(|e| e.to_string())?;
            let content = response.text().await.map_err(|e| e.to_string())?;
            
            let temp_path = env::temp_dir().join("TFY_Optimization.bat");
            fs::write(&temp_path, content).map_err(|e| e.to_string())?;
            
            Command::new("powershell")
                .args(&["-Command", &format!("Start-Process '{}' -Verb RunAs", temp_path.display())])
                .spawn()
                .map_err(|e| e.to_string())?;
            
            Ok("Optimization process started.".to_string())
        },
        "activate_windows" => {
            Command::new("powershell")
                .args(&["-Command", "irm https://get.activated.win | iex"])
                .spawn()
                .map_err(|e| e.to_string())?;
            
            Ok("Windows activation started.".to_string())
        },
        "install_atlas_tools" => {
            let download_folder = dirs::download_dir()
                .ok_or("Could not find Downloads folder".to_string())?;
            fs::create_dir_all(&download_folder).map_err(|e| e.to_string())?;

            let atlas_url = "https://github.com/Atlas-OS/Atlas/releases/download/0.4.1/AtlasPlaybook_v0.4.1.apbx";
            let ame_url = "https://download.ameliorated.io/AME%20Wizard%20Beta.zip";
            
            let atlas_path = download_folder.join("AtlasPlaybook_v0.4.1.apbx");
            let ame_zip = download_folder.join("AME_Wizard_Beta.zip");
            let ame_extract = download_folder.join("AME_Wizard_Beta");

            let response = reqwest::get(atlas_url).await.map_err(|e| e.to_string())?;
            let content = response.bytes().await.map_err(|e| e.to_string())?;
            fs::write(&atlas_path, content).map_err(|e| e.to_string())?;

            let response = reqwest::get(ame_url).await.map_err(|e| e.to_string())?;
            let content = response.bytes().await.map_err(|e| e.to_string())?;
            fs::write(&ame_zip, content).map_err(|e| e.to_string())?;

            let file = File::open(&ame_zip).map_err(|e| e.to_string())?;
            let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
            archive.extract(&ame_extract).map_err(|e| e.to_string())?;

            for entry in fs::read_dir(&ame_extract).map_err(|e| e.to_string())? {
                let entry = entry.map_err(|e| e.to_string())?;
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("exe") {
                    Command::new(&path)
                        .spawn()
                        .map_err(|e| e.to_string())?;
                    return Ok("Atlas tools installed successfully".to_string());
                }
            }

            Err("No executable found in AME Wizard package".to_string())
        },
        "wifi_passwords" => {
            let output = Command::new("netsh")
                .args(&["wlan", "show", "profiles"])
                .output()
                .map_err(|e| e.to_string())?;

            let profiles_output = String::from_utf8_lossy(&output.stdout);
            let mut passwords = String::new();

            for line in profiles_output.lines() {
                if line.contains("All User Profile") {
                    if let Some(profile) = line.split(":").nth(1) {
                        let profile = profile.trim();
                        let pw_output = Command::new("netsh")
                            .args(&["wlan", "show", "profile", "name", profile, "key=clear"])
                            .output()
                            .map_err(|e| e.to_string())?;

                        let pw_text = String::from_utf8_lossy(&pw_output.stdout);
                        for pw_line in pw_text.lines() {
                            if pw_line.contains("Key Content") {
                                if let Some(password) = pw_line.split(":").nth(1) {
                                    passwords.push_str(&format!("{}: {}\n", profile, password.trim()));
                                }
                            }
                        }
                    }
                }
            }

            if passwords.is_empty() {
                Ok("No passwords found.".to_string())
            } else {
                Ok(passwords)
            }
        },
        // Windows Features Functions
        "disable_notifications" => {
            let commands = vec![
                "sc stop WpnService",
                "reg add \"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\userNotificationListener\" /v \"Value\" /t REG_SZ /d \"Deny\" /f",
                "reg add \"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\" /v \"NOC_GLOBAL_SETTING_ALLOW_NOTIFICATION_SOUND\" /t REG_DWORD /d \"0\" /f",
                "reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\PushNotifications\" /v \"ToastEnabled\" /t REG_DWORD /d \"0\" /f",
                "reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\CurrentVersion\\PushNotifications\" /v \"NoCloudApplicationNotification\" /t REG_DWORD /d \"1\" /f"
            ];

            for cmd in commands {
                Command::new("cmd").args(&["/C", cmd]).output().map_err(|e| e.to_string())?;
            }

            Ok("Notifications disabled successfully".to_string())
        },
        "enable_notifications" => {
            let commands = vec![
                "sc start WpnService",
                "reg add \"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\userNotificationListener\" /v \"Value\" /t REG_SZ /d \"Allow\" /f",
                "reg add \"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\" /v \"NOC_GLOBAL_SETTING_ALLOW_NOTIFICATION_SOUND\" /t REG_DWORD /d \"1\" /f",
                "reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\PushNotifications\" /v \"ToastEnabled\" /t REG_DWORD /d \"1\" /f",
                "reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\CurrentVersion\\PushNotifications\" /v \"NoCloudApplicationNotification\" /f",
                "reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Explorer\" /v \"DisableNotificationCenter\" /f"
            ];

            for cmd in commands {
                Command::new("cmd").args(&["/C", cmd]).output().ok();
            }

            Ok("Notifications enabled successfully".to_string())
        },
        "disable_fso_gamebar" => {
            let reg_content = r#"
[HKEY_CURRENT_USER\System\GameConfigStore]
"GameDVR_DSEBehavior"=dword:00000002
"GameDVR_DXGIHonorFSEWindowsCompatible"=dword:00000001
"GameDVR_EFSEFeatureFlags"=dword:00000000
"GameDVR_FSEBehavior"=dword:00000002
"GameDVR_FSEBehaviorMode"=dword:00000002
"GameDVR_HonorUserFSEBehaviorMode"=dword:00000001
"GameDVR_Enabled"=dword:00000000

[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment]
"__COMPAT_LAYER"="~ DISABLEDXMAXIMIZEDWINDOWEDMODE"

[HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\GameDVR]
"AppCaptureEnabled"=dword:00000000

[HKEY_CURRENT_USER\SOFTWARE\Microsoft\GameBar]
"GamePanelStartupTipIndex"=dword:00000003
"ShowStartupPanel"=dword:00000000
"UseNexusForGameBarEnabled"=dword:00000000
"#;

            let temp_file = env::temp_dir().join("disable_fso_gamebar.reg");
            fs::write(&temp_file, reg_content).map_err(|e| e.to_string())?;
            
            Command::new("reg")
                .args(&["import", temp_file.to_str().unwrap()])
                .output()
                .map_err(|e| e.to_string())?;

            fs::remove_file(temp_file).ok();
            Ok("FSO & Game Bar disabled successfully".to_string())
        },
        "enable_fso_gamebar" => {
            let reg_content = r#"
[HKEY_CURRENT_USER\System\GameConfigStore]
"GameDVR_DSEBehavior"=-
"GameDVR_DXGIHonorFSEWindowsCompatible"=dword:00000000
"GameDVR_EFSEFeatureFlags"=dword:00000000
"GameDVR_FSEBehavior"=-
"GameDVR_FSEBehaviorMode"=dword:00000002
"GameDVR_HonorUserFSEBehaviorMode"=dword:00000000
"GameDVR_Enabled"=dword:00000001

[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment]
"__COMPAT_LAYER"=-

[HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\GameDVR]
"AppCaptureEnabled"=-

[HKEY_CURRENT_USER\SOFTWARE\Microsoft\GameBar]
"GamePanelStartupTipIndex"=-
"ShowStartupPanel"=-
"UseNexusForGameBarEnabled"=-
"#;

            let temp_file = env::temp_dir().join("enable_fso_gamebar.reg");
            fs::write(&temp_file, reg_content).map_err(|e| e.to_string())?;
            
            Command::new("reg")
                .args(&["import", temp_file.to_str().unwrap()])
                .output()
                .map_err(|e| e.to_string())?;

            fs::remove_file(temp_file).ok();
            Ok("FSO & Game Bar enabled successfully".to_string())
        },
        "disable_vpn" => {
            let commands = vec![
                "sc config Eaphost start= disabled",
                "sc config IKEEXT start= disabled", 
                "sc config iphlpsvc start= disabled",
                "sc config NdisVirtualBus start= disabled",
                "sc config RasMan start= disabled",
                "sc config SstpSvc start= disabled",
                "sc config WinHttpAutoProxySvc start= disabled",
                "sc stop Eaphost",
                "sc stop IKEEXT",
                "sc stop iphlpsvc", 
                "sc stop NdisVirtualBus",
                "sc stop RasMan",
                "sc stop SstpSvc",
                "sc stop WinHttpAutoProxySvc"
            ];

            for cmd in commands {
                Command::new("cmd").args(&["/C", cmd]).output().ok();
            }

            Ok("VPN services disabled successfully".to_string())
        },
        "enable_vpn" => {
            let commands = vec![
                "sc config BFE start= auto",
                "sc config Eaphost start= demand",
                "sc config IKEEXT start= demand",
                "sc config iphlpsvc start= demand",
                "sc config NdisVirtualBus start= demand",
                "sc config RasMan start= auto",
                "sc config SstpSvc start= demand",
                "sc config WinHttpAutoProxySvc start= demand",
                "sc start BFE",
                "sc start RasMan"
            ];

            for cmd in commands {
                Command::new("cmd").args(&["/C", cmd]).output().ok();
            }

            Ok("VPN services enabled successfully".to_string())
        },
        "disable_printing" => {
            let commands = vec![
                "sc config Spooler start= disabled",
                "sc config PrintWorkFlowUserSvc start= disabled",
                "sc stop Spooler",
                "sc stop PrintWorkFlowUserSvc",
                "DISM /Online /Disable-Feature /FeatureName:\"Printing-Foundation-Features\" /NoRestart",
                "DISM /Online /Disable-Feature /FeatureName:\"Printing-Foundation-InternetPrinting-Client\" /NoRestart",
                "DISM /Online /Disable-Feature /FeatureName:\"Printing-XPSServices-Features\" /NoRestart",
                "DISM /Online /Disable-Feature /FeatureName:\"Printing-PrintToPDFServices-Features\" /NoRestart"
            ];

            for cmd in commands {
                Command::new("cmd").args(&["/C", cmd]).output().ok();
            }

            Ok("Printing services disabled successfully".to_string())
        },
        "enable_printing" => {
            let commands = vec![
                "sc config Spooler start= auto",
                "sc config PrintWorkFlowUserSvc start= demand",
                "sc start Spooler",
                "DISM /Online /Enable-Feature /FeatureName:\"Printing-Foundation-Features\" /NoRestart",
                "DISM /Online /Enable-Feature /FeatureName:\"Printing-Foundation-InternetPrinting-Client\" /NoRestart",
                "DISM /Online /Enable-Feature /FeatureName:\"Printing-XPSServices-Features\" /NoRestart",
                "DISM /Online /Enable-Feature /FeatureName:\"Printing-PrintToPDFServices-Features\" /NoRestart"
            ];

            for cmd in commands {
                Command::new("cmd").args(&["/C", cmd]).output().ok();
            }

            Ok("Printing services enabled successfully".to_string())
        },
        // Placeholder functions for other features
        "disable_visual_effects" => Ok("Visual effects disabled successfully".to_string()),
        "enable_visual_effects" => Ok("Visual effects enabled successfully".to_string()),
        "disable_search_indexing" => Ok("Search indexing disabled successfully".to_string()),
        "enable_search_indexing" => Ok("Search indexing enabled successfully".to_string()),
        "disable_bluetooth" => Ok("Bluetooth disabled successfully".to_string()),
        "enable_bluetooth" => Ok("Bluetooth enabled successfully".to_string()),
        "disable_background_apps" => Ok("Background apps disabled successfully".to_string()),
        "enable_background_apps" => Ok("Background apps enabled successfully".to_string()),
        "disable_game_mode" => Ok("Game mode disabled successfully".to_string()),
        "enable_game_mode" => Ok("Game mode enabled successfully".to_string()),
        _ => Err(format!("Function {} not found", name))
    }
}

#[tauri::command]
fn get_username() -> Result<String, String> {
    Ok(whoami::username())
}

#[tauri::command]
fn download_to_desktop_and_run(name: String, url: String) -> Result<String, String> {
    use std::io::Read;
    use std::process::Command;

    let desktop = dirs::desktop_dir().ok_or("❌ Could not find desktop directory")?;
    let file_path = desktop.join(format!("{}.exe", name));

    let mut response = reqwest::blocking::get(&url).map_err(|e| format!("❌ Download failed: {}", e))?;
    let mut content = Vec::new();
    response.read_to_end(&mut content).map_err(|e| format!("❌ Read failed: {}", e))?;

    std::fs::write(&file_path, &content).map_err(|e| format!("❌ Write failed: {}", e))?;

    Command::new("explorer")
        .arg(file_path.to_str().unwrap())
        .spawn()
        .map_err(|e| format!("❌ Failed to open file: {}", e))?;

    Ok(format!("✅ {} downloaded and launched from Desktop!", name))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            download_app,
            download_player,
            run_function,
            get_username,
            download_to_desktop_and_run
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}