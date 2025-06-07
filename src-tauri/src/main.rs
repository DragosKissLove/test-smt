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

            // Prevenim căi dubioase (../ sau absolute)
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
    use std::process::Command; // AICI!

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
			get_username
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}