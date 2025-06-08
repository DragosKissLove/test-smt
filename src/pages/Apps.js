import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import { showNotification } from '../components/NotificationSystem';
import { ring } from 'ldrs';

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
  { name: 'Geek Utility', icon: 'geek.png', url: 'https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/geek.exe', filename: 'geek.exe', color: '#E74C3C' },
  { name: 'Visual Studio Code', icon: 'visual.png', url: 'https://update.code.visualstudio.com/latest/win32-x64-user/stable', filename: 'VSCodeSetup.exe', isComplex: true, color: '#007ACC' }
];

const Apps = () => {
  const { theme, primaryColor } = useTheme();
  const [hoveredApp, setHoveredApp] = useState(null);
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

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.03
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring", stiffness: 500, damping: 25, duration: 0.3 }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, x: -15 },
    show: {
      opacity: 1, x: 0,
      transition: { type: "spring", stiffness: 500, damping: 25, duration: 0.2 }
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
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      <motion.h2
        variants={headerVariants}
        style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '20px',
          color: theme.text,
          borderBottom: `2px solid ${primaryColor}`,
          paddingBottom: '10px',
          display: 'inline-block'
        }}
      >
        Install Apps
      </motion.h2>

      <motion.div
        variants={containerVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '20px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '16px',
          border: `1px solid ${primaryColor}22`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'relative'
        }}
      >
        {apps.map((app) => {
          const isHovered = hoveredApp === app.name;
          const isDownloading = downloadingApps.has(app.name);
          const appColor = app.color || primaryColor;
          
          return (
            <motion.button
              key={app.name}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                y: -4
              }}
              whileTap={{ scale: 0.98 }}
              onMouseEnter={() => setHoveredApp(app.name)}
              onMouseLeave={() => setHoveredApp(null)}
              onClick={() => !isDownloading && installApp(app)}
              disabled={isDownloading}
              style={{
                background: isHovered 
                  ? `linear-gradient(135deg, ${appColor}15 0%, rgba(255, 255, 255, 0.05) 100%)`
                  : `linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)`,
                border: isHovered 
                  ? `1px solid ${appColor}44`
                  : `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: '16px',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: theme.text,
                padding: '18px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                boxShadow: isHovered
                  ? `0 8px 25px ${appColor}33`
                  : `0 4px 15px rgba(0, 0, 0, 0.2)`,
                filter: hoveredApp && hoveredApp !== app.name ? 'blur(1px) brightness(0.7)' : 'none',
                opacity: (hoveredApp && hoveredApp !== app.name) || isDownloading ? 0.6 : 1,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <motion.div
                animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  marginBottom: '10px'
                }}
              >
                <img
                  src={`icons/${app.icon}`}
                  alt={app.name}
                  style={{ 
                    width: '32px', 
                    height: '32px',
                    borderRadius: '6px'
                  }}
                />
              </motion.div>
              
              <motion.span
                animate={isHovered ? { 
                  color: appColor
                } : { 
                  color: theme.text
                }}
                transition={{ duration: 0.2 }}
              >
                {app.name}
              </motion.span>
              
              {isDownloading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.85)',
                    borderRadius: '50%',
                    width: '45px',
                    height: '45px',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${appColor}33`
                  }}
                >
                  {app.isComplex ? (
                    <l-ring
                      size="24"
                      stroke="3"
                      bg-opacity="0"
                      speed="2"
                      color={appColor}
                    />
                  ) : (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{
                        width: '20px',
                        height: '20px',
                        border: `2px solid ${appColor}`,
                        borderTopColor: 'transparent',
                        borderRadius: '50%'
                      }}
                    />
                  )}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default Apps;