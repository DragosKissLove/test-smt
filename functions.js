const fs = require('fs');
const https = require('https');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const axios = require('axios');
const extract = require('extract-zip');

// Apps installation function
async function downloadAndRun(name, url) {
  try {
    const tempPath = path.join(os.tmpdir(), `${name}.exe`);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer'
    });

    fs.writeFileSync(tempPath, response.data);
    exec(tempPath);
    return `${name} has been downloaded and launched.`;
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

// Clean temp files
function cleanTemp() {
  return new Promise((resolve, reject) => {
    exec('del /s /f /q %temp%\\* && del /s /f /q C:\\Windows\\Temp\\*', (error) => {
      if (error) {
        reject(new Error(`Failed to clean temp files: ${error.message}`));
      } else {
        resolve('Temporary files cleaned successfully!');
      }
    });
  });
}

// Run optimization
async function runOptimization() {
  try {
    const url = "https://raw.githubusercontent.com/DragosKissLove/testbot/main/TFY%20Optimization.bat";
    const tempPath = path.join(os.tmpdir(), "TFY_Optimization.bat");
    
    const response = await axios.get(url);
    fs.writeFileSync(tempPath, response.data);
    
    exec(`powershell -Command "Start-Process '${tempPath}' -Verb RunAs"`, (error) => {
      if (error) throw error;
    });
    
    return "Optimization process started.";
  } catch (error) {
    throw new Error(`Optimization failed: ${error.message}`);
  }
}

// Activate Windows
function activateWindows() {
  return new Promise((resolve, reject) => {
    exec('powershell -Command "irm https://get.activated.win | iex"', (error) => {
      if (error) {
        reject(new Error(`Activation failed: ${error.message}`));
      } else {
        resolve('Windows activation started.');
      }
    });
  });
}

// WinRAR crack
async function winrarCrack() {
  try {
    const url = "https://github.com/jtlw99/crack-winrar/releases/download/v1/rarreg.key";
    const response = await axios.get(url);
    
    const paths = [
      'C:\\Program Files\\WinRAR\\rarreg.key',
      'C:\\Program Files (x86)\\WinRAR\\rarreg.key'
    ];

    for (const path of paths) {
      try {
        fs.writeFileSync(path, response.data);
        return `WinRAR crack applied successfully to ${path}`;
      } catch (err) {
        continue;
      }
    }
    throw new Error('No valid WinRAR installation found');
  } catch (error) {
    throw new Error(`WinRAR crack failed: ${error.message}`);
  }
}

// Install Atlas tools
async function installAtlasTools() {
  try {
    const downloadFolder = path.join(os.homedir(), 'Downloads');
    fs.mkdirSync(downloadFolder, { recursive: true });

    const atlasUrl = 'https://github.com/Atlas-OS/Atlas/releases/download/0.4.1/AtlasPlaybook_v0.4.1.apbx';
    const ameUrl = 'https://download.ameliorated.io/AME%20Wizard%20Beta.zip';
    
    const atlasPath = path.join(downloadFolder, 'AtlasPlaybook_v0.4.1.apbx');
    const ameZip = path.join(downloadFolder, 'AME_Wizard_Beta.zip');
    const ameExtract = path.join(downloadFolder, 'AME_Wizard_Beta');

    await Promise.all([
      axios({ url: atlasUrl, responseType: 'arraybuffer' }).then(response => 
        fs.writeFileSync(atlasPath, response.data)),
      axios({ url: ameUrl, responseType: 'arraybuffer' }).then(response => 
        fs.writeFileSync(ameZip, response.data))
    ]);

    await extract(ameZip, { dir: ameExtract });
    
    const files = fs.readdirSync(ameExtract);
    const exeFile = files.find(file => file.endsWith('.exe'));
    
    if (exeFile) {
      exec(path.join(ameExtract, exeFile));
      return 'Atlas tools installed successfully';
    }
    throw new Error('No executable found in AME Wizard package');
  } catch (error) {
    throw new Error(`Atlas tools installation failed: ${error.message}`);
  }
}

// Get WiFi passwords
function wifiPasswords() {
  return new Promise((resolve, reject) => {
    exec('netsh wlan show profiles', (error, stdout) => {
      if (error) {
        reject(new Error(`Failed to get WiFi profiles: ${error.message}`));
        return;
      }

      const profiles = stdout.match(/All User Profile\s*:\s(.*)/g)
        ?.map(line => line.split(':')[1].trim()) || [];

      if (!profiles.length) {
        resolve('No WiFi profiles found.');
        return;
      }

      let passwords = '';
      let completed = 0;

      profiles.forEach(profile => {
        exec(`netsh wlan show profile name="${profile}" key=clear`, (err, output) => {
          completed++;
          
          if (!err) {
            const match = output.match(/Key Content\s*:\s(.*)/);
            if (match) {
              passwords += `${profile}: ${match[1].trim()}\n`;
            }
          }

          if (completed === profiles.length) {
            resolve(passwords || 'No passwords found.');
          }
        });
      });
    });
  });
}

// Get Windows username
function getUsername() {
  return os.userInfo().username;
}

// Download Roblox player
async function downloadRobloxPlayer(versionHash, progressCallback) {
  try {
    const baseUrl = "https://setup-cfly.rbxcdn.com";
    versionHash = versionHash.trim().toLowerCase();
    if (!versionHash.startsWith("version-")) {
      versionHash = `version-${versionHash}`;
    }

    const manifestUrl = `${baseUrl}/${versionHash}-rbxPkgManifest.txt`;
    progressCallback(`Fetching manifest: ${manifestUrl}`);
    
    const response = await axios.get(manifestUrl);
    const lines = response.data.split('\n').filter(line => line.trim().endsWith('.zip'));

    const targetRoot = path.join('C:', 'Program Files (x86)', 'Roblox', 'Versions', versionHash);
    fs.mkdirSync(targetRoot, { recursive: true });
    progressCallback(`Created folder: ${targetRoot}`);

    const xml = '<?xml version="1.0" encoding="UTF-8"?><Settings><ContentFolder>content</ContentFolder><BaseUrl>http://www.roblox.com</BaseUrl></Settings>';
    fs.writeFileSync(path.join(targetRoot, 'AppSettings.xml'), xml);

    const extractRoots = {
      "RobloxApp.zip": "",
      "redist.zip": "",
      "shaders.zip": "shaders/",
      "ssl.zip": "ssl/",
      "WebView2.zip": "",
      "WebView2RuntimeInstaller.zip": "WebView2RuntimeInstaller/",
      "content-avatar.zip": "content/avatar/",
      "content-configs.zip": "content/configs/",
      "content-fonts.zip": "content/fonts/",
      "content-sky.zip": "content/sky/",
      "content-sounds.zip": "content/sounds/",
      "content-textures2.zip": "content/textures/",
      "content-models.zip": "content/models/",
      "content-platform-fonts.zip": "PlatformContent/pc/fonts/",
      "content-platform-dictionaries.zip": "PlatformContent/pc/shared_compression_dictionaries/",
      "content-terrain.zip": "PlatformContent/pc/terrain/",
      "content-textures3.zip": "PlatformContent/pc/textures/",
      "extracontent-luapackages.zip": "ExtraContent/LuaPackages/",
      "extracontent-translations.zip": "ExtraContent/translations/",
      "extracontent-models.zip": "ExtraContent/models/",
      "extracontent-textures.zip": "ExtraContent/textures/",
      "extracontent-places.zip": "ExtraContent/places/"
    };

    for (const name of lines) {
      const blobUrl = `${baseUrl}/${versionHash}-${name}`;
      progressCallback(`Downloading ${name}`);
      
      const response = await axios({
        url: blobUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progressCallback(`Downloading ${name}: ${percentCompleted}%`);
        }
      });

      progressCallback(`Extracting ${name}`);
      const root = extractRoots[name] || "";
      const extractPath = path.join(targetRoot, root);
      
      const tempZipPath = path.join(os.tmpdir(), `${name}_temp.zip`);
      fs.writeFileSync(tempZipPath, response.data);
      
      await extract(tempZipPath, { dir: extractPath });
      fs.unlinkSync(tempZipPath);

      progressCallback(`${name} done`);
    }

    return "✅ All files extracted successfully!";
  } catch (error) {
    throw new Error(`❌ Error: ${error.message}`);
  }
}

module.exports = {
  downloadAndRun,
  cleanTemp,
  runOptimization,
  activateWindows,
  winrarCrack,
  installAtlasTools,
  wifiPasswords,
  getUsername,
  downloadRobloxPlayer
};