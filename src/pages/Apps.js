import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import { showNotification } from '../components/NotificationSystem';
import { ring } from 'ldrs';
import { FiDownload } from 'react-icons/fi';

// Register the ring component
ring.register();

const apps = [
  { name: 'Spotify', icon: 'spotify.png', url: 'https://download.scdn.co/SpotifySetup.exe', filename: 'SpotifySetup.exe', isComplex: true, color: '#1DB954' },
  { name: 'Steam', icon: 'steam.png', url: 'https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe', filename: 'SteamSetup.exe', isComplex: true, color: '#1B2838' },
  { name: 'Discord', icon: 'discord.png', url: 'https://discord.com/api/download?platform=win', filename: 'DiscordSetup.exe', isComplex: true, color: '#5865F2' },
  { name: 'Brave', icon: 'brave.png', url: 'https://referrals.brave.com/latest/BraveBrowserSetup.exe', filename: 'BraveBrowserSetup.exe', isComplex: true, color: '#FB542B' },
  { name: 'Faceit AC', icon: 'faceit.png', url: 'https://cdn.faceit.com/faceit/anticheat/FaceitAC_1.0.17.36.exe', filename: 'FACEITInstaller_64.exe', isComplex: true, color: '#FF5500' },
  { name: 'VLC', icon: 'vlc.png', url: 'https://get.videolan.org/vlc/3.0.20/win64/vlc-3.0.20-win64.exe', filename: 'vlc.exe', isComplex: true, color: '#FF8800' },
  { name: 'Malwarebytes', icon: 'malwarebytes.png', url: 'https://downloads.malwarebytes.com/file/mb4_offline', filename: 'mbsetup.exe', isComplex: true, color: '#0078D4' },
  { name: 'WinRAR', icon: 'winrar.png', url: 'https://www.rarlab.com/rar/winrar-x64-624.exe', filename: 'winrar.exe', isComplex: true, color: '#FFD700' },
  { name: 'Epic Games', icon: 'epic.png', url: 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/installer/download/EpicGamesLauncherInstaller.msi', filename: 'epic_installer.msi', isComplex: true, color: '#313131' },
  { name: 'Stremio', icon: 'stremio.png', url: 'https://www.stremio.com/StremioSetup.exe', filename: 'StremioSetup.exe', isComplex: true, color: '#7B2CBF' },
  { name: 'TuxlerVPN', icon: 'tuxler.png', url: 'https://cdn.tuxlervpn.com/windows/TuxlerVPNSetup.exe', filename: 'TuxlerVPNSetup.exe', isComplex: true, color: '#00D4AA' },
  { name: 'Logitech Manager', icon: 'logitech.png', url: 'https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/LogitechManager.exe', filename: 'LogitechManager.exe', color: '#00B8FC' },
  { name: 'Filter Keys Setter', icon: 'filterkeys.png', url: 'https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/FilterKeysSetter.exe', filename: 'FilterKeysSetter.exe', color: '#9B59B6' },
  { name: 'Geek Utility', icon: 'geek.png', url: 'https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/geek.exe', filename: 'geek.exe', color: '#C0C0C0' },
  { name: 'Visual Studio Code', icon: 'visual.png', url: 'https://update.code.visualstudio.com/latest/win32-x64-user/stable', filename: 'VSCodeSetup.exe', isComplex: true, color: '#007ACC' }
];

const Apps = () => {
  const { theme, primaryColor } = useTheme();
  const [downloadingApps, setDownloadingApps] = useState(new Set());

  const installApp = async (app) => {
    try {
      setDownloadingApps(prev => new Set([...prev, app.name]));
      showNotification('info', 'Download Started', `Downloading ${app.name}...`);
      
      await invoke('download_app', { url: app.url, filename: app.filename });
      
      showNotification('success', 'Download Complete', `${app.name} has been downloaded and launched successfully!`);
    } catch (e) {
      console.error(`Error installing ${app.name}:`, e);
      showNotification('error', 'Download Failed', `Failed to download ${app.name}: ${e}`);
    } finally {
      setDownloadingApps(prev => {
        const newSet = new Set(prev);
        newSet.delete(app.name);
        return newSet;
      });
    }
  };

  return (
    <motion.div
      style={{ 
        padding: '30px',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '30px',
          color: '#FFFFFF',
          borderBottom: `2px solid ${primaryColor}`,
          paddingBottom: '10px',
          display: 'inline-block',
          position: 'relative'
        }}
      >
        Install Applications
      </motion.h2>

      {/* Compact Apps Grid */}
      <motion.div
        layout
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
          maxWidth: '1200px'
        }}
      >
        {apps.map((app, index) => {
          const isDownloading = downloadingApps.has(app.name);
          const appColor = app.color || primaryColor;
          
          return (
            <motion.div
              key={app.name}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.02,
                layout: { duration: 0.3 }
              }}
              whileHover={{ y: -4, scale: 1.01 }}
              style={{
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)`,
                borderRadius: '16px',
                padding: '16px',
                border: `1px solid ${appColor}33`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${appColor}30, 0 0 0 1px ${appColor}22`,
                transition: 'all 0.3s ease'
              }}
              onClick={() => !isDownloading && installApp(app)}
            >
              {/* Glowing border effect */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.005, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                style={{
                  position: 'absolute',
                  inset: '-1px',
                  borderRadius: '16px',
                  padding: '1px',
                  background: `linear-gradient(45deg, 
                    ${appColor}00 0%, 
                    ${appColor}66 25%,
                    ${appColor} 50%,
                    ${appColor}66 75%,
                    ${appColor}00 100%
                  )`,
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'exclude',
                  pointerEvents: 'none'
                }}
              />

              {/* App Icon and Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                position: 'relative',
                zIndex: 1
              }}>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${appColor}22, ${appColor}44)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: `0 4px 12px ${appColor}40`
                  }}
                >
                  <img
                    src={`icons/${app.icon}`}
                    alt={app.name}
                    style={{ 
                      width: '28px', 
                      height: '28px',
                      borderRadius: '6px'
                    }}
                  />
                </motion.div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: theme.text,
                    margin: '0 0 2px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {app.name}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    Ready to install
                  </p>
                </div>
              </div>

              {/* Compact Download Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={isDownloading}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isDownloading 
                    ? 'rgba(255, 255, 255, 0.1)'
                    : `linear-gradient(135deg, ${appColor}, ${appColor}cc)`,
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: isDownloading ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: isDownloading ? 'none' : `0 2px 8px ${appColor}40`
                }}
              >
                {isDownloading ? (
                  <>
                    <l-ring
                      size="16"
                      stroke="2"
                      bg-opacity="0"
                      speed="2"
                      color="#fff"
                    />
                    Installing...
                  </>
                ) : (
                  <>
                    <FiDownload size={14} />
                    Install
                  </>
                )}
              </motion.button>

              {/* Accent Border */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, ${appColor}, ${appColor}aa)`,
                borderRadius: '16px 16px 0 0',
                zIndex: 1
              }} />
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default Apps;