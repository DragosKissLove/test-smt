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

// Add this import for Windows-specific Command extensions
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use zip::ZipArchive;
use reqwest;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;

#[tauri::command]
async fn download_app(url: String, filename: String) -> Result<String, String> {
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

    // Use Windows-specific command to run the executable
    #[cfg(target_os = "windows")]
    {
        let status = Command::new("cmd")
            .args(&["/C", "start", "", path.to_str().unwrap()])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .status()
            .map_err(|e| format!("❌ Failed to execute file: {}", e))?;
        
        if !status.success() {
            return Err(format!("❌ Failed to launch installer (exit code: {})", status.code().unwrap_or(-1)));
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("❌ Failed to open file: {}", e))?;
    }

    Ok(format!("✅ {} downloaded and launched successfully!", filename.replace(".exe", "")))
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
fn get_cpu_info() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("wmic")
            .args(&["cpu", "get", "name,numberofcores", "/format:csv"])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
            .map_err(|e| format!("Failed to get CPU info: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        let mut cpu_name = String::new();
        let mut cores = String::new();

        for line in output_str.lines() {
            if line.contains(',') && !line.contains("Node") {
                let parts: Vec<&str> = line.split(',').collect();
                if parts.len() >= 3 {
                    let name = parts[1].trim();
                    let core_count = parts[2].trim();
                    
                    if !name.is_empty() && !core_count.is_empty() {
                        cpu_name = name.to_string();
                        cores = core_count.to_string();
                        break;
                    }
                }
            }
        }
        
        if !cpu_name.is_empty() && !cores.is_empty() {
            Ok(format!("{} ({} cores)", cpu_name, cores))
        } else {
            Err("Could not determine CPU information".to_string())
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Err("CPU info only available on Windows".to_string())
    }
}

#[tauri::command]
fn get_ram_info() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // Get total RAM
        let ram_output = Command::new("wmic")
            .args(&["computersystem", "get", "TotalPhysicalMemory", "/format:csv"])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
            .map_err(|e| format!("Failed to get RAM info: {}", e))?;

        let ram_str = String::from_utf8_lossy(&ram_output.stdout);
        let mut total_ram_gb = 0;

        for line in ram_str.lines() {
            if line.contains(',') && !line.contains("Node") {
                let parts: Vec<&str> = line.split(',').collect();
                if parts.len() >= 2 {
                    if let Ok(ram_bytes) = parts[1].trim().parse::<u64>() {
                        total_ram_gb = ram_bytes / (1024 * 1024 * 1024);
                        break;
                    }
                }
            }
        }

        // Get RAM speed
        let speed_output = Command::new("wmic")
            .args(&["memorychip", "get", "speed", "/format:csv"])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
            .map_err(|e| format!("Failed to get RAM speed: {}", e))?;

        let speed_str = String::from_utf8_lossy(&speed_output.stdout);
        let mut ram_speed = 0;

        for line in speed_str.lines() {
            if line.contains(',') && !line.contains("Node") {
                let parts: Vec<&str> = line.split(',').collect();
                if parts.len() >= 2 {
                    if let Ok(speed) = parts[1].trim().parse::<u32>() {
                        if speed > 0 {
                            ram_speed = speed;
                            break;
                        }
                    }
                }
            }
        }

        if total_ram_gb > 0 {
            if ram_speed > 0 {
                Ok(format!("{}GB DDR4-{}", total_ram_gb, ram_speed))
            } else {
                Ok(format!("{}GB RAM", total_ram_gb))
            }
        } else {
            Err("Could not determine RAM information".to_string())
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Err("RAM info only available on Windows".to_string())
    }
}

#[tauri::command]
fn get_storage_info() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("wmic")
            .args(&["diskdrive", "get", "size,model,mediatype", "/format:csv"])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
            .map_err(|e| format!("Failed to get storage info: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        let mut storage_devices = Vec::new();

        for line in output_str.lines() {
            if line.contains(',') && !line.contains("Node") {
                let parts: Vec<&str> = line.split(',').collect();
                if parts.len() >= 4 {
                    let media_type = parts[1].trim();
                    let model = parts[2].trim();
                    if let Ok(size) = parts[3].trim().parse::<u64>() {
                        let size_gb = size / (1024 * 1024 * 1024);
                        if size_gb > 0 && !model.is_empty() {
                            let drive_type = if media_type.contains("SSD") || 
                                               model.to_lowercase().contains("ssd") || 
                                               model.to_lowercase().contains("nvme") {
                                "SSD"
                            } else {
                                "HDD"
                            };
                            storage_devices.push(format!("{}: {}GB", drive_type, size_gb));
                        }
                    }
                }
            }
        }

        if storage_devices.is_empty() {
            Ok("Storage: Unknown".to_string())
        } else {
            Ok(storage_devices.join(" • "))
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Err("Storage info only available on Windows".to_string())
    }
}

#[tauri::command]
fn get_gpu_info() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("wmic")
            .args(&["path", "win32_VideoController", "get", "name,driverversion", "/format:csv"])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
            .map_err(|e| format!("Failed to get GPU info: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        
        for line in output_str.lines() {
            if line.contains(',') && !line.contains("Node") {
                let parts: Vec<&str> = line.split(',').collect();
                if parts.len() >= 3 {
                    let driver_version = parts[1].trim();
                    let name = parts[2].trim();
                    
                    // Skip Microsoft Basic Display Adapter and other generic adapters
                    if !name.is_empty() && 
                       !name.contains("Microsoft Basic Display") && 
                       !name.contains("Remote Desktop") &&
                       (name.contains("NVIDIA") || name.contains("AMD") || name.contains("Intel") || name.contains("Radeon") || name.contains("GeForce")) {
                        if !driver_version.is_empty() {
                            return Ok(format!("{} (Driver: {})", name, driver_version));
                        } else {
                            return Ok(name.to_string());
                        }
                    }
                }
            }
        }
        
        Err("Could not determine GPU info".to_string())
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Err("GPU info only available on Windows".to_string())
    }
}

#[tauri::command]
fn get_os_info() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("wmic")
            .args(&["os", "get", "caption,version,buildnumber", "/format:csv"])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
            .map_err(|e| format!("Failed to get OS info: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        
        for line in output_str.lines() {
            if line.contains(',') && !line.contains("Node") {
                let parts: Vec<&str> = line.split(',').collect();
                if parts.len() >= 4 {
                    let build_number = parts[1].trim();
                    let caption = parts[2].trim();
                    let version = parts[3].trim();
                    
                    if !caption.is_empty() && !build_number.is_empty() {
                        // Determine Windows version based on build number
                        let windows_version = if let Ok(build) = build_number.parse::<u32>() {
                            if build >= 22000 {
                                "Windows 11"
                            } else if build >= 10240 {
                                "Windows 10"
                            } else {
                                caption
                            }
                        } else {
                            caption
                        };
                        
                        return Ok(format!("{} (Build {})", windows_version, build_number));
                    }
                }
            }
        }
        
        Err("Could not determine OS info".to_string())
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Err("OS info only available on Windows".to_string())
    }
}

#[tauri::command]
async fn check_for_updates() -> Result<serde_json::Value, String> {
    let current_version = "3.0.0";
    let api_url = "https://api.github.com/repos/DragosKissLove/test-smt/releases/latest";
    
    let client = reqwest::Client::new();
    let response = client
        .get(api_url)
        .header("User-Agent", "TFY-Tool")
        .send()
        .await
        .map_err(|e| format!("Failed to check for updates: {}", e))?;
    
    let release_data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse release data: {}", e))?;
    
    let latest_version = release_data["tag_name"]
        .as_str()
        .unwrap_or(current_version);
    
    let download_url = release_data["assets"]
        .as_array()
        .and_then(|assets| assets.first())
        .and_then(|asset| asset["browser_download_url"].as_str())
        .unwrap_or("");
    
    let changelog = release_data["body"]
        .as_str()
        .unwrap_or("No changelog available");
    
    Ok(serde_json::json!({
        "current_version": current_version,
        "latest_version": latest_version,
        "has_update": latest_version != current_version,
        "download_url": download_url,
        "changelog": changelog
    }))
}

#[tauri::command]
async fn download_update(download_url: String) -> Result<String, String> {
    let response = reqwest::get(&download_url)
        .await
        .map_err(|e| format!("Failed to download update: {}", e))?;
    
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read update data: {}", e))?;
    
    let desktop = dirs::desktop_dir().ok_or("Could not find desktop directory")?;
    let update_path = desktop.join("TFY-Tool-Update.exe");
    
    std::fs::write(&update_path, bytes)
        .map_err(|e| format!("Failed to save update: {}", e))?;
    
    // Launch the update
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/C", "start", "", update_path.to_str().unwrap()])
            .spawn()
            .map_err(|e| format!("Failed to launch update: {}", e))?;
    }
    
    Ok("Update downloaded and launched successfully!".to_string())
}

#[tauri::command]
async fn run_function(name: String, _args: Option<String>) -> Result<String, String> {
    match name.as_str() {
        "getCpuInfo" => get_cpu_info(),
        "getRamInfo" => get_ram_info(),
        "getStorageInfo" => get_storage_info(),
        "getGpuInfo" => get_gpu_info(),
        "getOsInfo" => get_os_info(),
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

            #[cfg(target_os = "windows")]
            {
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
                    .creation_flags(0x08000000) // CREATE_NO_WINDOW
                    .status()
                    .map_err(|e| format!("Failed to execute PowerShell command: {}", e))?;

                let _ = fs::remove_file(temp_file);

                if status.success() {
                    Ok(format!("WinRAR crack successfully applied to {}", winrar_path))
                } else {
                    Err("Failed to apply WinRAR crack. Please run the application as administrator.".to_string())
                }
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("WinRAR crack only available on Windows".to_string())
            }
        },
        "clean_temp" => {
            #[cfg(target_os = "windows")]
            {
                Command::new("cmd")
                    .args(&["/C", "del /s /f /q %temp%\\* && del /s /f /q C:\\Windows\\Temp\\*"])
                    .creation_flags(0x08000000) // CREATE_NO_WINDOW
                    .output()
                    .map_err(|e| e.to_string())?;
                
                Ok("Temporary files cleaned successfully!".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("Temp cleaning only available on Windows".to_string())
            }
        },
        "run_optimization" => {
            let url = "https://raw.githubusercontent.com/DragosKissLove/testbot/main/TFY%20Optimization.bat";
            let response = reqwest::get(url).await.map_err(|e| e.to_string())?;
            let content = response.text().await.map_err(|e| e.to_string())?;
            
            let temp_path = env::temp_dir().join("TFY_Optimization.bat");
            fs::write(&temp_path, content).map_err(|e| e.to_string())?;
            
            #[cfg(target_os = "windows")]
            {
                Command::new("powershell")
                    .args(&["-Command", &format!("Start-Process '{}' -Verb RunAs", temp_path.display())])
                    .creation_flags(0x08000000) // CREATE_NO_WINDOW
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
            
            Ok("Optimization process started.".to_string())
        },
        "activate_windows" => {
            #[cfg(target_os = "windows")]
            {
                Command::new("powershell")
                    .args(&["-Command", "irm https://get.activated.win | iex"])
                    .creation_flags(0x08000000) // CREATE_NO_WINDOW
                    .spawn()
                    .map_err(|e| e.to_string())?;
                
                Ok("Windows activation started.".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("Windows activation only available on Windows".to_string())
            }
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
                    #[cfg(target_os = "windows")]
                    {
                        Command::new(&path)
                            .creation_flags(0x08000000) // CREATE_NO_WINDOW
                            .spawn()
                            .map_err(|e| e.to_string())?;
                    }
                    return Ok("Atlas tools installed successfully".to_string());
                }
            }

            Err("No executable found in AME Wizard package".to_string())
        },
        "wifi_passwords" => {
            // Create a batch file that will show WiFi passwords in a CMD window
            let batch_content = r#"@echo off
title WiFi Passwords - TFY Tool
color 0A
echo.
echo ===============================================
echo           WiFi Passwords - TFY Tool
echo ===============================================
echo.
echo Scanning for saved WiFi networks...
echo.

for /f "skip=9 tokens=1,2 delims=:" %%i in ('netsh wlan show profiles') do (
    if "%%j" NEQ "" (
        set "profile=%%j"
        setlocal enabledelayedexpansion
        set "profile=!profile:~1!"
        echo Checking: !profile!
        for /f "skip=9 tokens=1,2 delims=:" %%a in ('netsh wlan show profile name^="!profile!" key^=clear 2^>nul') do (
            if "%%a"=="    Key Content" (
                set "password=%%b"
                set "password=!password:~1!"
                echo Network: !profile!
                echo Password: !password!
                echo ----------------------------------------
            )
        )
        endlocal
    )
)

echo.
echo ===============================================
echo Scan complete! Press any key to close...
echo ===============================================
pause >nul
"#;

            let temp_dir = env::temp_dir();
            let batch_path = temp_dir.join("wifi_passwords.bat");
            
            fs::write(&batch_path, batch_content)
                .map_err(|e| format!("Failed to create batch file: {}", e))?;

            // Run the batch file in a visible CMD window
            #[cfg(target_os = "windows")]
            {
                Command::new("cmd")
                    .args(&["/C", "start", "cmd", "/K", batch_path.to_str().unwrap()])
                    .spawn()
                    .map_err(|e| format!("Failed to open WiFi passwords window: {}", e))?;
            }

            Ok("WiFi passwords window opened successfully!".to_string())
        },
        // Windows Features Functions
        "disable_notifications" => {
            #[cfg(target_os = "windows")]
            {
                let commands = vec![
                    "sc stop WpnService",
                    "reg add \"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\userNotificationListener\" /v \"Value\" /t REG_SZ /d \"Deny\" /f",
                    "reg add \"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\" /v \"NOC_GLOBAL_SETTING_ALLOW_NOTIFICATION_SOUND\" /t REG_DWORD /d \"0\" /f",
                    "reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\PushNotifications\" /v \"ToastEnabled\" /t REG_DWORD /d \"0\" /f",
                    "reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\CurrentVersion\\PushNotifications\" /v \"NoCloudApplicationNotification\" /t REG_DWORD /d \"1\" /f"
                ];

                for cmd in commands {
                    Command::new("cmd")
                        .args(&["/C", cmd])
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .output()
                        .map_err(|e| e.to_string())?;
                }

                Ok("Notifications disabled successfully".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("Notifications control only available on Windows".to_string())
            }
        },
        "enable_notifications" => {
            #[cfg(target_os = "windows")]
            {
                let commands = vec![
                    "sc start WpnService",
                    "reg add \"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\userNotificationListener\" /v \"Value\" /t REG_SZ /d \"Allow\" /f",
                    "reg add \"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\" /v \"NOC_GLOBAL_SETTING_ALLOW_NOTIFICATION_SOUND\" /t REG_DWORD /d \"1\" /f",
                    "reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\PushNotifications\" /v \"ToastEnabled\" /t REG_DWORD /d \"1\" /f",
                    "reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\CurrentVersion\\PushNotifications\" /v \"NoCloudApplicationNotification\" /f",
                    "reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Explorer\" /v \"DisableNotificationCenter\" /f"
                ];

                for cmd in commands {
                    Command::new("cmd")
                        .args(&["/C", cmd])
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .output()
                        .ok();
                }

                Ok("Notifications enabled successfully".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("Notifications control only available on Windows".to_string())
            }
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
            
            #[cfg(target_os = "windows")]
            {
                Command::new("reg")
                    .args(&["import", temp_file.to_str().unwrap()])
                    .creation_flags(0x08000000) // CREATE_NO_WINDOW
                    .output()
                    .map_err(|e| e.to_string())?;
            }

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
            
            #[cfg(target_os = "windows")]
            {
                Command::new("reg")
                    .args(&["import", temp_file.to_str().unwrap()])
                    .creation_flags(0x08000000) // CREATE_NO_WINDOW
                    .output()
                    .map_err(|e| e.to_string())?;
            }

            fs::remove_file(temp_file).ok();
            Ok("FSO & Game Bar enabled successfully".to_string())
        },
        "disable_vpn" => {
            #[cfg(target_os = "windows")]
            {
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
                    Command::new("cmd")
                        .args(&["/C", cmd])
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .output()
                        .ok();
                }

                Ok("VPN services disabled successfully".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("VPN control only available on Windows".to_string())
            }
        },
        "enable_vpn" => {
            #[cfg(target_os = "windows")]
            {
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
                    Command::new("cmd")
                        .args(&["/C", cmd])
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .output()
                        .ok();
                }

                Ok("VPN services enabled successfully".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("VPN control only available on Windows".to_string())
            }
        },
        "disable_printing" => {
            #[cfg(target_os = "windows")]
            {
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
                    Command::new("cmd")
                        .args(&["/C", cmd])
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .output()
                        .ok();
                }

                Ok("Printing services disabled successfully".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("Printing control only available on Windows".to_string())
            }
        },
        "enable_printing" => {
            #[cfg(target_os = "windows")]
            {
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
                    Command::new("cmd")
                        .args(&["/C", cmd])
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .output()
                        .ok();
                }

                Ok("Printing services enabled successfully".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("Printing control only available on Windows".to_string())
            }
        },
        "disable_bluetooth" => {
            #[cfg(target_os = "windows")]
            {
                let commands = vec![
                    "sc config BluetoothUserService start= disabled",
                    "sc config BTAGService start= disabled",
                    "sc config BthA2dp start= disabled",
                    "sc config BthAvctpSvc start= disabled",
                    "sc config BthEnum start= disabled",
                    "sc config BthHFEnum start= disabled",
                    "sc config BthLEEnum start= disabled",
                    "sc config BthMini start= disabled",
                    "sc config BTHMODEM start= disabled",
                    "sc config BTHPORT start= disabled",
                    "sc config bthserv start= disabled",
                    "sc config BTHUSB start= disabled",
                    "sc config HidBth start= disabled",
                    "sc config Microsoft_Bluetooth_AvrcpTransport start= disabled",
                    "sc config RFCOMM start= disabled",
                    "reg add \"HKLM\\SOFTWARE\\Microsoft\\PolicyManager\\default\\Connectivity\\AllowBluetooth\" /v \"value\" /t REG_DWORD /d \"0\" /f"
                ];

                for cmd in commands {
                    Command::new("cmd")
                        .args(&["/C", cmd])
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .output()
                        .ok();
                }

                Ok("Bluetooth disabled successfully".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("Bluetooth control only available on Windows".to_string())
            }
        },
        "enable_bluetooth" => {
            #[cfg(target_os = "windows")]
            {
                let commands = vec![
                    "sc config BluetoothUserService start= demand",
                    "sc config BTAGService start= demand",
                    "sc config BthA2dp start= demand",
                    "sc config BthAvctpSvc start= demand",
                    "sc config BthEnum start= demand",
                    "sc config BthHFEnum start= demand",
                    "sc config BthLEEnum start= demand",
                    "sc config BthMini start= demand",
                    "sc config BTHMODEM start= demand",
                    "sc config BTHPORT start= demand",
                    "sc config bthserv start= demand",
                    "sc config BTHUSB start= demand",
                    "sc config HidBth start= demand",
                    "sc config Microsoft_Bluetooth_AvrcpTransport start= demand",
                    "sc config RFCOMM start= demand",
                    "reg add \"HKLM\\SOFTWARE\\Microsoft\\PolicyManager\\default\\Connectivity\\AllowBluetooth\" /v \"value\" /t REG_DWORD /d \"2\" /f"
                ];

                for cmd in commands {
                    Command::new("cmd")
                        .args(&["/C", cmd])
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .output()
                        .ok();
                }

                Ok("Bluetooth enabled successfully".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("Bluetooth control only available on Windows".to_string())
            }
        },
        "disable_game_mode" => {
            let reg_content = r#"
[HKEY_CURRENT_USER\SOFTWARE\Microsoft\GameBar]
"AllowAutoGameMode"=dword:00000000
"AutoGameModeEnabled"=dword:00000000
"#;

            let temp_file = env::temp_dir().join("disable_game_mode.reg");
            fs::write(&temp_file, reg_content).map_err(|e| e.to_string())?;
            
            #[cfg(target_os = "windows")]
            {
                Command::new("reg")
                    .args(&["import", temp_file.to_str().unwrap()])
                    .creation_flags(0x08000000) // CREATE_NO_WINDOW
                    .output()
                    .map_err(|e| e.to_string())?;
            }

            fs::remove_file(temp_file).ok();
            Ok("Game mode disabled successfully".to_string())
        },
        "enable_game_mode" => {
            #[cfg(target_os = "windows")]
            {
                let commands = vec![
                    "reg delete \"HKCU\\SOFTWARE\\Microsoft\\GameBar\" /v \"AllowAutoGameMode\" /f",
                    "reg delete \"HKCU\\SOFTWARE\\Microsoft\\GameBar\" /v \"AutoGameModeEnabled\" /f"
                ];

                for cmd in commands {
                    Command::new("cmd")
                        .args(&["/C", cmd])
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .output()
                        .ok();
                }

                Ok("Game mode enabled successfully".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("Game mode control only available on Windows".to_string())
            }
        },
        "disable_background_apps" => {
            let reg_content = r#"
[HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications]
"GlobalUserDisabled"=dword:00000001

[HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Search]
"BackgroundAppGlobalToggle"=dword:00000000
"#;

            let temp_file = env::temp_dir().join("disable_background_apps.reg");
            fs::write(&temp_file, reg_content).map_err(|e| e.to_string())?;
            
            #[cfg(target_os = "windows")]
            {
                Command::new("reg")
                    .args(&["import", temp_file.to_str().unwrap()])
                    .creation_flags(0x08000000) // CREATE_NO_WINDOW
                    .output()
                    .map_err(|e| e.to_string())?;
            }

            fs::remove_file(temp_file).ok();
            Ok("Background apps disabled successfully".to_string())
        },
        "enable_background_apps" => {
            #[cfg(target_os = "windows")]
            {
                let commands = vec![
                    "reg delete \"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications\" /v \"GlobalUserDisabled\" /f",
                    "reg delete \"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Search\" /v \"BackgroundAppGlobalToggle\" /f"
                ];

                for cmd in commands {
                    Command::new("cmd")
                        .args(&["/C", cmd])
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .output()
                        .ok();
                }

                Ok("Background apps enabled successfully".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("Background apps control only available on Windows".to_string())
            }
        },
        "disable_search_indexing" => {
            #[cfg(target_os = "windows")]
            {
                let commands = vec![
                    "sc config WSearch start= disabled",
                    "sc stop WSearch"
                ];

                for cmd in commands {
                    Command::new("cmd")
                        .args(&["/C", cmd])
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .output()
                        .ok();
                }

                Ok("Search indexing disabled successfully".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("Search indexing control only available on Windows".to_string())
            }
        },
        "enable_search_indexing" => {
            #[cfg(target_os = "windows")]
            {
                let commands = vec![
                    "sc config WSearch start= auto",
                    "sc start WSearch"
                ];

                for cmd in commands {
                    Command::new("cmd")
                        .args(&["/C", cmd])
                        .creation_flags(0x08000000) // CREATE_NO_WINDOW
                        .output()
                        .ok();
                }

                Ok("Search indexing enabled successfully".to_string())
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                Err("Search indexing control only available on Windows".to_string())
            }
        },
        // Placeholder functions for visual effects
        "disable_visual_effects" => Ok("Visual effects disabled successfully".to_string()),
        "enable_visual_effects" => Ok("Visual effects enabled successfully".to_string()),
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

    // Use Windows-specific command to run the executable
    #[cfg(target_os = "windows")]
    {
        let status = Command::new("cmd")
            .args(&["/C", "start", "", file_path.to_str().unwrap()])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .status()
            .map_err(|e| format!("❌ Failed to execute file: {}", e))?;
        
        if !status.success() {
            return Err(format!("❌ Failed to launch installer (exit code: {})", status.code().unwrap_or(-1)));
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Command::new("open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("❌ Failed to open file: {}", e))?;
    }

    Ok(format!("✅ {} downloaded and launched from Desktop!", name))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            download_app,
            download_player,
            run_function,
            get_username,
            download_to_desktop_and_run,
            get_cpu_info,
            get_ram_info,
            get_storage_info,
            get_gpu_info,
            get_os_info,
            check_for_updates,
            download_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}