use tauri::Manager;
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::Path;
use std::process::Command;
use reqwest;
use serde_json::Value;
use zip::ZipArchive;
use std::io::{Read, Cursor};
use dirs;
use whoami;
use std::os::windows::process::CommandExt;

#[derive(serde::Serialize)]
struct VersionInfo {
    hash: String,
    description: String,
}

#[tauri::command]
async fn download_player(
    app_handle: tauri::AppHandle,
    version_hash: String,
    channel: Option<String>,
    binary_type: Option<String>,
) -> Result<String, String> {
    let channel = channel.unwrap_or_else(|| "LIVE".to_string());
    let binary_type = binary_type.unwrap_or_else(|| "WindowsPlayer".to_string());
    
    // Emit progress updates to the frontend
    let emit_progress = |message: &str| {
        let _ = app_handle.emit_all("roblox-progress", message);
    };

    emit_progress("▶ Starting download…");

    // Normalize version hash
    let version_norm = if version_hash.to_lowercase().starts_with("version-") {
        version_hash.to_lowercase()
    } else {
        format!("version-{}", version_hash.to_lowercase())
    };

    // Binary type configuration
    let binary_configs = get_binary_configs();
    let binary_config = binary_configs.get(&binary_type)
        .ok_or_else(|| format!("Unknown binary type: {}", binary_type))?;

    // Build base URL
    let base_url = if channel.to_uppercase() == "LIVE" {
        "https://setup.rbxcdn.com".to_string()
    } else {
        format!("https://setup.rbxcdn.com/channel/{}", channel.to_lowercase())
    };

    // Fetch manifest
    let manifest_url = format!("{}{}{}-rbxPkgManifest.txt", base_url, binary_config.blob_dir, version_norm);
    emit_progress(&format!("⎙ Fetching manifest: {}", manifest_url));

    let client = reqwest::Client::new();
    let manifest_response = client.get(&manifest_url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch manifest: {}", e))?;

    if manifest_response.status() == 403 {
        return Err("❌ Error: version hash invalid or service unavailable.".to_string());
    }

    let manifest_text = manifest_response.text().await
        .map_err(|e| format!("Failed to read manifest: {}", e))?;

    let zip_files: Vec<&str> = manifest_text
        .lines()
        .map(|line| line.trim())
        .filter(|line| line.ends_with(".zip"))
        .collect();

    if zip_files.is_empty() {
        return Err("No zip files found in manifest".to_string());
    }

    // Determine extract roots based on binary type
    let extract_roots = if binary_type.contains("Player") {
        get_player_extract_roots()
    } else {
        get_studio_extract_roots()
    };

    // Create output directory in Downloads folder
    let downloads_dir = dirs::download_dir()
        .ok_or_else(|| "Could not find Downloads directory".to_string())?;
    let output_dir = downloads_dir.join(&version_norm);
    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    emit_progress(&format!("⎙ Created folder: {}", output_dir.display()));

    // Create AppSettings.xml
    let app_settings_xml = r#"<?xml version="1.0" encoding="UTF-8"?><Settings><ContentFolder>content</ContentFolder><BaseUrl>http://www.roblox.com</BaseUrl></Settings>"#;
    fs::write(output_dir.join("AppSettings.xml"), app_settings_xml)
        .map_err(|e| format!("Failed to write AppSettings.xml: {}", e))?;

    // Download and extract each zip file
    for zip_name in zip_files {
        let blob_url = format!("{}{}{}-{}", base_url, binary_config.blob_dir, version_norm, zip_name);
        emit_progress(&format!("↓ Downloading {}", zip_name));

        let zip_response = client.get(&blob_url)
            .timeout(std::time::Duration::from_secs(60))
            .send()
            .await
            .map_err(|e| format!("Failed to download {}: {}", zip_name, e))?;

        let zip_bytes = zip_response.bytes().await
            .map_err(|e| format!("Failed to read zip data for {}: {}", zip_name, e))?;

        emit_progress(&format!("⎙ Extracting {}…", zip_name));

        // Extract zip file
        let cursor = Cursor::new(zip_bytes);
        let mut archive = ZipArchive::new(cursor)
            .map_err(|e| format!("Failed to open zip {}: {}", zip_name, e))?;

        let extract_root = extract_roots.get(zip_name).unwrap_or(&"");
        let extract_path = output_dir.join(extract_root);

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)
                .map_err(|e| format!("Failed to read file from {}: {}", zip_name, e))?;

            if file.is_dir() {
                continue;
            }

            let file_path = extract_path.join(file.name().replace('\\', "/"));
            
            if let Some(parent) = file_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create directory {}: {}", parent.display(), e))?;
            }

            let mut output_file = fs::File::create(&file_path)
                .map_err(|e| format!("Failed to create file {}: {}", file_path.display(), e))?;

            std::io::copy(&mut file, &mut output_file)
                .map_err(|e| format!("Failed to extract file {}: {}", file_path.display(), e))?;
        }

        emit_progress(&format!("→ {} done", zip_name));
    }

    emit_progress("✅ All files extracted successfully!");
    Ok(format!("✅ Roblox {} downloaded successfully to {}", binary_type, output_dir.display()))
}

#[tauri::command]
async fn get_saved_versions() -> Result<Vec<VersionInfo>, String> {
    let client = reqwest::Client::new();
    let response = client.get("https://pastebin.com/raw/vgqfphAY")
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch saved versions: {}", e))?;

    let json_text = response.text().await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let data: serde_json::Value = serde_json::from_str(&json_text)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    let mut versions = Vec::new();
    if let Value::Object(map) = data {
        for (full_ver, description) in map {
            let hash = if full_ver.to_lowercase().starts_with("version-") {
                full_ver[8..].to_string()
            } else {
                full_ver
            };
            
            let desc = description.as_str().unwrap_or("").to_string();
            versions.push(VersionInfo { hash, description: desc });
        }
    }

    versions.sort_by(|a, b| a.hash.cmp(&b.hash));
    Ok(versions)
}

struct BinaryConfig {
    blob_dir: String,
    version_file: String,
}

fn get_binary_configs() -> HashMap<String, BinaryConfig> {
    let mut configs = HashMap::new();
    
    configs.insert("WindowsPlayer".to_string(), BinaryConfig {
        blob_dir: "/".to_string(),
        version_file: "/version".to_string(),
    });
    
    configs.insert("WindowsStudio64".to_string(), BinaryConfig {
        blob_dir: "/".to_string(),
        version_file: "/versionQTStudio".to_string(),
    });
    
    configs.insert("MacPlayer".to_string(), BinaryConfig {
        blob_dir: "/mac/".to_string(),
        version_file: "/mac/version".to_string(),
    });
    
    configs.insert("MacStudio".to_string(), BinaryConfig {
        blob_dir: "/mac/".to_string(),
        version_file: "/mac/versionStudio".to_string(),
    });
    
    configs
}

fn get_player_extract_roots() -> HashMap<String, String> {
    let mut roots = HashMap::new();
    
    roots.insert("RobloxApp.zip".to_string(), "".to_string());
    roots.insert("redist.zip".to_string(), "".to_string());
    roots.insert("shaders.zip".to_string(), "shaders/".to_string());
    roots.insert("ssl.zip".to_string(), "ssl/".to_string());
    roots.insert("WebView2.zip".to_string(), "".to_string());
    roots.insert("WebView2RuntimeInstaller.zip".to_string(), "WebView2RuntimeInstaller/".to_string());
    roots.insert("content-avatar.zip".to_string(), "content/avatar/".to_string());
    roots.insert("content-configs.zip".to_string(), "content/configs/".to_string());
    roots.insert("content-fonts.zip".to_string(), "content/fonts/".to_string());
    roots.insert("content-sky.zip".to_string(), "content/sky/".to_string());
    roots.insert("content-sounds.zip".to_string(), "content/sounds/".to_string());
    roots.insert("content-textures2.zip".to_string(), "content/textures/".to_string());
    roots.insert("content-models.zip".to_string(), "content/models/".to_string());
    roots.insert("content-platform-fonts.zip".to_string(), "PlatformContent/pc/fonts/".to_string());
    roots.insert("content-platform-dictionaries.zip".to_string(), "PlatformContent/pc/shared_compression_dictionaries/".to_string());
    roots.insert("content-terrain.zip".to_string(), "PlatformContent/pc/terrain/".to_string());
    roots.insert("content-textures3.zip".to_string(), "PlatformContent/pc/textures/".to_string());
    roots.insert("extracontent-luapackages.zip".to_string(), "ExtraContent/LuaPackages/".to_string());
    roots.insert("extracontent-translations.zip".to_string(), "ExtraContent/translations/".to_string());
    roots.insert("extracontent-models.zip".to_string(), "ExtraContent/models/".to_string());
    roots.insert("extracontent-textures.zip".to_string(), "ExtraContent/textures/".to_string());
    roots.insert("extracontent-places.zip".to_string(), "ExtraContent/places/".to_string());
    
    roots
}

fn get_studio_extract_roots() -> HashMap<String, String> {
    let mut roots = HashMap::new();
    
    roots.insert("RobloxStudio.zip".to_string(), "".to_string());
    roots.insert("RibbonConfig.zip".to_string(), "RibbonConfig/".to_string());
    roots.insert("redist.zip".to_string(), "".to_string());
    roots.insert("Libraries.zip".to_string(), "".to_string());
    roots.insert("LibrariesQt5.zip".to_string(), "".to_string());
    roots.insert("WebView2.zip".to_string(), "".to_string());
    roots.insert("WebView2RuntimeInstaller.zip".to_string(), "WebView2RuntimeInstaller/".to_string());
    roots.insert("shaders.zip".to_string(), "shaders/".to_string());
    roots.insert("ssl.zip".to_string(), "ssl/".to_string());
    roots.insert("Qml.zip".to_string(), "Qml/".to_string());
    roots.insert("Plugins.zip".to_string(), "Plugins/".to_string());
    roots.insert("StudioFonts.zip".to_string(), "StudioFonts/".to_string());
    roots.insert("BuiltInPlugins.zip".to_string(), "BuiltInPlugins/".to_string());
    roots.insert("ApplicationConfig.zip".to_string(), "ApplicationConfig/".to_string());
    roots.insert("BuiltInStandalonePlugins.zip".to_string(), "BuiltInStandalonePlugins/".to_string());
    roots.insert("content-qt_translations.zip".to_string(), "content/qt_translations/".to_string());
    roots.insert("content-sky.zip".to_string(), "content/sky/".to_string());
    roots.insert("content-fonts.zip".to_string(), "content/fonts/".to_string());
    roots.insert("content-avatar.zip".to_string(), "content/avatar/".to_string());
    roots.insert("content-models.zip".to_string(), "content/models/".to_string());
    roots.insert("content-sounds.zip".to_string(), "content/sounds/".to_string());
    roots.insert("content-configs.zip".to_string(), "content/configs/".to_string());
    roots.insert("content-api-docs.zip".to_string(), "content/api_docs/".to_string());
    roots.insert("content-textures2.zip".to_string(), "content/textures/".to_string());
    roots.insert("content-studio_svg_textures.zip".to_string(), "content/studio_svg_textures/".to_string());
    roots.insert("content-platform-fonts.zip".to_string(), "PlatformContent/pc/fonts/".to_string());
    roots.insert("content-platform-dictionaries.zip".to_string(), "PlatformContent/pc/shared_compression_dictionaries/".to_string());
    roots.insert("content-terrain.zip".to_string(), "PlatformContent/pc/terrain/".to_string());
    roots.insert("content-textures3.zip".to_string(), "PlatformContent/pc/textures/".to_string());
    roots.insert("extracontent-translations.zip".to_string(), "ExtraContent/translations/".to_string());
    roots.insert("extracontent-luapackages.zip".to_string(), "ExtraContent/LuaPackages/".to_string());
    roots.insert("extracontent-textures.zip".to_string(), "ExtraContent/textures/".to_string());
    roots.insert("extracontent-scripts.zip".to_string(), "ExtraContent/scripts/".to_string());
    roots.insert("extracontent-models.zip".to_string(), "ExtraContent/models/".to_string());
    
    roots
}

#[tauri::command]
async fn download_app(url: String, filename: String) -> Result<String, String> {
    let downloads_dir = dirs::download_dir()
        .ok_or_else(|| "Could not find Downloads directory".to_string())?;
    
    // Create tfy-downloads subdirectory
    let tfy_downloads = downloads_dir.join("tfy-downloads");
    fs::create_dir_all(&tfy_downloads)
        .map_err(|e| format!("Failed to create tfy-downloads directory: {}", e))?;
    
    let file_path = tfy_downloads.join(&filename);
    
    // Download the file
    let client = reqwest::Client::new();
    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to download: {}", e))?;
    
    let bytes = response.bytes().await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    // Write to file
    fs::write(&file_path, &bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    // Try to execute the file with multiple fallback methods
    match Command::new(&file_path).spawn() {
        Ok(_) => Ok(format!("✅ {} downloaded and launched successfully!", filename)),
        Err(_) => {
            // Fallback 1: Try with explorer
            match Command::new("explorer").arg(&file_path).spawn() {
                Ok(_) => Ok(format!("✅ {} downloaded and opened with explorer!", filename)),
                Err(_) => {
                    // Fallback 2: Try with cmd /c
                    match Command::new("cmd")
                        .args(&["/c", &format!("\"{}\"", file_path.display())])
                        .status()
                    {
                        Ok(status) if status.success() => {
                            Ok(format!("✅ {} downloaded and launched via cmd!", filename))
                        }
                        _ => {
                            Ok(format!("✅ {} downloaded to {}. Please run it manually if it didn't start automatically.", filename, file_path.display()))
                        }
                    }
                }
            }
        }
    }
}

#[tauri::command]
async fn download_to_desktop_and_run(name: String, url: String) -> Result<String, String> {
    let desktop_dir = dirs::desktop_dir()
        .ok_or_else(|| "Could not find Desktop directory".to_string())?;
    
    let file_path = desktop_dir.join(format!("{}.exe", name));
    
    // Download the file
    let client = reqwest::Client::new();
    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to download: {}", e))?;
    
    let bytes = response.bytes().await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    // Write to file
    fs::write(&file_path, &bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    // Try to execute the file with multiple fallback methods
    match Command::new(&file_path).spawn() {
        Ok(_) => Ok(format!("✅ {} downloaded and launched successfully!", name)),
        Err(_) => {
            // Fallback 1: Try with explorer
            match Command::new("explorer").arg(&file_path).spawn() {
                Ok(_) => Ok(format!("✅ {} downloaded and opened with explorer!", name)),
                Err(_) => {
                    // Fallback 2: Try with cmd /c
                    match Command::new("cmd")
                        .args(&["/c", &format!("\"{}\"", file_path.display())])
                        .status()
                    {
                        Ok(status) if status.success() => {
                            Ok(format!("✅ {} downloaded and launched via cmd!", name))
                        }
                        _ => {
                            Ok(format!("✅ {} downloaded to {}. Please run it manually if it didn't start automatically.", name, file_path.display()))
                        }
                    }
                }
            }
        }
    }
}

#[tauri::command]
fn get_username() -> String {
    whoami::username()
}

#[tauri::command]
async fn run_function(name: String, args: Option<String>) -> Result<String, String> {
    match name.as_str() {
        "winrar_crack" => winrar_crack().await,
        "wifi_passwords" => wifi_passwords().await,
        "activate_windows" => activate_windows().await,
        "run_optimization" => run_optimization().await,
        "clean_temp" => clean_temp().await,
        "install_atlas_tools" => install_atlas_tools().await,
        _ => Err(format!("Unknown function: {}", name))
    }
}

async fn winrar_crack() -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client.get("https://github.com/jtlw99/crack-winrar/releases/download/v1/rarreg.key")
        .send()
        .await
        .map_err(|e| format!("Failed to download crack: {}", e))?;
    
    let key_content = response.bytes().await
        .map_err(|e| format!("Failed to read crack content: {}", e))?;
    
    let paths = [
        "C:\\Program Files\\WinRAR\\rarreg.key",
        "C:\\Program Files (x86)\\WinRAR\\rarreg.key"
    ];
    
    for path in &paths {
        if let Ok(_) = fs::write(path, &key_content) {
            return Ok(format!("✅ WinRAR crack applied successfully to {}", path));
        }
    }
    
    Err("❌ No valid WinRAR installation found".to_string())
}

async fn wifi_passwords() -> Result<String, String> {
    let output = Command::new("cmd")
        .args(&["/C", "netsh wlan show profiles"])
        .creation_flags(0x08000000) // CREATE_NO_WINDOW
        .output()
        .map_err(|e| format!("Failed to get WiFi profiles: {}", e))?;
    
    let profiles_output = String::from_utf8_lossy(&output.stdout);
    let mut passwords = String::new();
    
    for line in profiles_output.lines() {
        if line.contains("All User Profile") {
            if let Some(profile_name) = line.split(':').nth(1) {
                let profile_name = profile_name.trim();
                
                let password_output = Command::new("cmd")
                    .args(&["/C", &format!("netsh wlan show profile name=\"{}\" key=clear", profile_name)])
                    .creation_flags(0x08000000) // CREATE_NO_WINDOW
                    .output();
                
                if let Ok(pwd_output) = password_output {
                    let pwd_text = String::from_utf8_lossy(&pwd_output.stdout);
                    for pwd_line in pwd_text.lines() {
                        if pwd_line.contains("Key Content") {
                            if let Some(password) = pwd_line.split(':').nth(1) {
                                passwords.push_str(&format!("{}: {}\n", profile_name, password.trim()));
                            }
                        }
                    }
                }
            }
        }
    }
    
    if passwords.is_empty() {
        Ok("No WiFi passwords found.".to_string())
    } else {
        // Create a temporary file with the passwords and open it in notepad
        let temp_dir = std::env::temp_dir();
        let temp_file = temp_dir.join("wifi_passwords.txt");
        fs::write(&temp_file, &passwords)
            .map_err(|e| format!("Failed to write passwords file: {}", e))?;
        
        // Open the file in notepad
        Command::new("notepad")
            .arg(&temp_file)
            .spawn()
            .map_err(|e| format!("Failed to open notepad: {}", e))?;
        
        Ok("✅ WiFi passwords saved and opened in Notepad!".to_string())
    }
}

async fn activate_windows() -> Result<String, String> {
    let status = Command::new("powershell")
        .args(&["-Command", "irm https://get.activated.win | iex"])
        .creation_flags(0x08000000) // CREATE_NO_WINDOW
        .status()
        .map_err(|e| format!("Failed to run activation: {}", e))?;
    
    if status.success() {
        Ok("✅ Windows activation process started!".to_string())
    } else {
        Err("❌ Failed to start Windows activation".to_string())
    }
}

async fn run_optimization() -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client.get("https://raw.githubusercontent.com/DragosKissLove/testbot/main/TFY%20Optimization.bat")
        .send()
        .await
        .map_err(|e| format!("Failed to download optimization script: {}", e))?;
    
    let bat_content = response.text().await
        .map_err(|e| format!("Failed to read script content: {}", e))?;
    
    let temp_dir = std::env::temp_dir();
    let temp_path = temp_dir.join("TFY_Optimization.bat");
    
    fs::write(&temp_path, bat_content)
        .map_err(|e| format!("Failed to write script: {}", e))?;
    
    let status = Command::new("powershell")
        .args(&["-Command", &format!("Start-Process '{}' -Verb RunAs", temp_path.display())])
        .creation_flags(0x08000000) // CREATE_NO_WINDOW
        .status()
        .map_err(|e| format!("Failed to run optimization: {}", e))?;
    
    if status.success() {
        Ok("✅ TFY Optimization started successfully!".to_string())
    } else {
        Err("❌ Failed to start optimization".to_string())
    }
}

async fn clean_temp() -> Result<String, String> {
    let status = Command::new("cmd")
        .args(&["/C", "del /s /f /q %temp%\\* && del /s /f /q C:\\Windows\\Temp\\*"])
        .creation_flags(0x08000000) // CREATE_NO_WINDOW
        .status()
        .map_err(|e| format!("Failed to clean temp files: {}", e))?;
    
    if status.success() {
        Ok("✅ Temporary files cleaned successfully!".to_string())
    } else {
        Err("❌ Failed to clean temporary files".to_string())
    }
}

async fn install_atlas_tools() -> Result<String, String> {
    let downloads_dir = dirs::download_dir()
        .ok_or_else(|| "Could not find Downloads directory".to_string())?;
    
    let client = reqwest::Client::new();
    
    // Download Atlas Playbook
    let atlas_url = "https://github.com/Atlas-OS/Atlas/releases/download/0.4.1/AtlasPlaybook_v0.4.1.apbx";
    let atlas_response = client.get(atlas_url)
        .send()
        .await
        .map_err(|e| format!("Failed to download Atlas Playbook: {}", e))?;
    
    let atlas_path = downloads_dir.join("AtlasPlaybook_v0.4.1.apbx");
    fs::write(&atlas_path, atlas_response.bytes().await.unwrap())
        .map_err(|e| format!("Failed to save Atlas Playbook: {}", e))?;
    
    // Download AME Wizard
    let ame_url = "https://download.ameliorated.io/AME%20Wizard%20Beta.zip";
    let ame_response = client.get(ame_url)
        .send()
        .await
        .map_err(|e| format!("Failed to download AME Wizard: {}", e))?;
    
    let ame_zip_path = downloads_dir.join("AME_Wizard_Beta.zip");
    fs::write(&ame_zip_path, ame_response.bytes().await.unwrap())
        .map_err(|e| format!("Failed to save AME Wizard: {}", e))?;
    
    // Extract AME Wizard
    let ame_extract_dir = downloads_dir.join("AME_Wizard_Beta");
    fs::create_dir_all(&ame_extract_dir)
        .map_err(|e| format!("Failed to create extraction directory: {}", e))?;
    
    let file = fs::File::open(&ame_zip_path)
        .map_err(|e| format!("Failed to open AME zip: {}", e))?;
    
    let mut archive = ZipArchive::new(file)
        .map_err(|e| format!("Failed to read AME zip: {}", e))?;
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Failed to read file from AME zip: {}", e))?;
        
        if file.is_dir() {
            continue;
        }
        
        let file_path = ame_extract_dir.join(file.name());
        
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
        
        let mut output_file = fs::File::create(&file_path)
            .map_err(|e| format!("Failed to create extracted file: {}", e))?;
        
        std::io::copy(&mut file, &mut output_file)
            .map_err(|e| format!("Failed to extract file: {}", e))?;
        
        // If this is an exe file, try to run it
        if file_path.extension().and_then(|s| s.to_str()) == Some("exe") {
            let _ = Command::new(&file_path).spawn();
        }
    }
    
    Ok("✅ Atlas tools downloaded and AME Wizard launched!".to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            download_player,
            get_saved_versions,
            download_app,
            download_to_desktop_and_run,
            get_username,
            run_function
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}