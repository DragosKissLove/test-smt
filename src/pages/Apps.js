import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import { showNotification } from '../components/NotificationSystem';
import { ring } from 'ldrs';
import { FiDownload, FiCheck } from 'react-icons/fi';

// Register the ring component
ring.register();

const apps = [
  { name: 'Spotify', icon: 'spotify.png', url: 'https://download.scdn.co/SpotifySetup.exe', filename: 'SpotifySetup.exe', isComplex: true, color: '#1DB954', category: 'Media' },
  { name: 'Steam', icon: 'steam.png', url: 'https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe', filename: 'SteamSetup.exe', isComplex: true, color: '#1B2838', category: 'Gaming' },
  { name: 'Discord', icon: 'discord.png', url: 'https://discord.com/api/download?platform=win', filename: 'DiscordSetup.exe', isComplex: true, color: '#5865F2', category: 'Communication' },
  { name: 'Brave', icon: 'brave.png', url: 'https://referrals.brave.com/latest/BraveBrowserSetup.exe', filename: 'BraveBrowserSetup.exe', isComplex: true, color: '#FB542B', category: 'Browser' },
  { name: 'Faceit AC', icon: 'faceit.png', url: 'https://cdn.faceit.com/faceit/anticheat/FaceitAC_1.0.17.36.exe', filename: 'FACEITInstaller_64.exe', isComplex: true, color: '#FF5500', category: 'Gaming' },
  { name: 'VLC', icon: 'vlc.png', url: 'https://get.videolan.org/vlc/3.0.20/win64/vlc-3.0.20-win64.exe', filename: 'vlc.exe', isComplex: true, color: '#FF8800', category: 'Media' },
  { name: 'Malwarebytes', icon: 'malwarebytes.png', url: 'https://downloads.malwarebytes.com/file/mb4_offline', filename: 'mbsetup.exe', isComplex: true, color: '#0078D4', category: 'Security' },
  { name: 'WinRAR', icon: 'winrar.png', url: 'https://www.rarlab.com/rar/winrar-x64-624.exe', filename: 'winrar.exe', isComplex: true, color: '#FFD700', category: 'Utility' },
  { name: 'Epic Games', icon: 'epic.png', url: 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/installer/download/EpicGamesLauncherInstaller.msi', filename: 'epic_installer.msi', isComplex: true, color: '#313131', category: 'Gaming' },
  { name: 'Stremio', icon: 'stremio.png', url: 'https://www.stremio.com/StremioSetup.exe', filename: 'StremioSetup.exe', isComplex: true, color: '#7B2CBF', category: 'Media' },
  { name: 'TuxlerVPN', icon: 'tuxler.png', url: 'https://cdn.tuxlervpn.com/windows/TuxlerVPNSetup.exe', filename: 'TuxlerVPNSetup.exe', isComplex: true, color: '#00D4AA', category: 'Security' },
  { name: 'Logitech Manager', icon: 'logitech.png', url: 'https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/LogitechManager.exe', filename: 'LogitechManager.exe', color: '#00B8FC', category: 'Utility' },
  { name: 'Filter Keys Setter', icon: 'filterkeys.png', url: 'https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/FilterKeysSetter.exe', filename: 'FilterKeysSetter.exe', color: '#9B59B6', category: 'Utility' },
  { name: 'Geek Utility', icon: 'geek.png', url: 'https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/geek.exe', filename: 'geek.exe', color: '#C0C0C0', category: 'Utility' },
  { name: 'Visual Studio Code', icon: 'visual.png', url: 'https://update.code.visualstudio.com/latest/win32-x64-user/stable', filename: 'VSCodeSetup.exe', isComplex: true, color: '#007ACC', category: 'Development' }
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
          marginBottom: '20px',
          color: '#FFFFFF',
          borderBottom: `2px solid ${primaryColor}`,
          paddingBottom: '10px',
          display: 'inline-block',
          position: 'relative'
        }}
      >
        Install Applications
      </motion.h2>

      {/* Apps Grid */}
      <motion.div
        layout
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
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
                delay: index * 0.05,
                layout: { duration: 0.3 }
              }}
              whileHover={{ y: -5 }}
              style={{
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
                borderRadius: '16px',
                padding: '20px',
                border: `1px solid ${appColor}44`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: `0 0 20px ${appColor}66, 0 8px 32px rgba(0, 0, 0, 0.3)`
              }}
              onClick={() => !isDownloading && installApp(app)}
            >
              {/* Glowing border effect */}
              <motion.div
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.02, 1]
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
                    ${appColor}88 25%,
                    ${appColor} 50%,
                    ${appColor}88 75%,
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
                gap: '16px',
                marginBottom: '16px',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${appColor}22, ${appColor}44)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <img
                    src={`icons/${app.icon}`}
                    alt={app.name}
                    style={{ 
                      width: '32px', 
                      height: '32px',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: theme.text,
                    margin: '0 0 4px 0'
                  }}>
                    {app.name}
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    {app.category}
                  </span>
                </div>
              </div>

              {/* Download Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isDownloading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isDownloading 
                    ? 'rgba(255, 255, 255, 0.1)'
                    : `linear-gradient(135deg, ${appColor}, ${appColor}cc)`,
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: isDownloading ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                {isDownloading ? (
                  <>
                    <l-ring
                      size="20"
                      stroke="3"
                      bg-opacity="0"
                      speed="2"
                      color="#fff"
                    />
                    Downloading...
                  </>
                ) : (
                  <>
                    <FiDownload size={16} />
                    Install {app.name}
                  </>
                )}
              </motion.button>

              {/* Accent Border */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
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