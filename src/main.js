const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const extract = require('extract-zip');
const os = require('os');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const store = new Store();

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = false;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    transparent: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  }

  // Add window control handlers
  ipcMain.handle('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.handle('close-window', () => {
    mainWindow.close();
  });

  // Check for updates immediately
  autoUpdater.checkForUpdates();
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  mainWindow.webContents.send('update-status', 'Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  mainWindow.webContents.send('update-available', info);
});

autoUpdater.on('update-not-available', () => {
  mainWindow.webContents.send('update-not-available');
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow.webContents.send('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update-downloaded');
});

// Handle update installation
ipcMain.handle('start-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

// Handle function calls from renderer
ipcMain.handle('run-function', async (event, { name, args }) => {
  const functions = require('./functions');
  if (typeof functions[name] === 'function') {
    try {
      return await functions[name](args);
    } catch (error) {
      console.error(`Error running function ${name}:`, error);
      throw error;
    }
  } else {
    throw new Error(`Function ${name} not found`);
  }
});

// Handle settings
ipcMain.handle('get-settings', () => {
  return store.get('settings');
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set('settings', settings);
});

// Clear login data on app quit
app.on('before-quit', () => {
  store.delete('guestSession');
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});