const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  runFunction: async (name, args) => {
    try {
      return await ipcRenderer.invoke('run-function', { name, args });
    } catch (error) {
      console.error('Function execution error:', error);
      throw error;
    }
  },
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  platform: process.platform,
  minimize: () => ipcRenderer.invoke('minimize-window'),
  close: () => ipcRenderer.invoke('close-window'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', callback),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', callback),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  startUpdate: () => ipcRenderer.invoke('start-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  downloadRobloxPlayer: async (versionHash, progressCallback) => {
    try {
      ipcRenderer.on('roblox-progress', (event, message) => {
        if (progressCallback) progressCallback(message);
      });
      return await ipcRenderer.invoke('download-roblox', versionHash);
    } catch (error) {
      console.error('Roblox download error:', error);
      throw error;
    }
  }
});