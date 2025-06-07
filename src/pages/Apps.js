import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { motion } from 'framer-motion';

const apps = [
  { name: 'Spotify', icon: 'spotify.png', url: 'https://download.scdn.co/SpotifySetup.exe', filename: 'SpotifySetup.exe' },
  { name: 'Steam', icon: 'steam.png', url: 'https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe', filename: 'SteamSetup.exe' },
  { name: 'Discord', icon: 'discord.png', url: 'https://discord.com/api/download?platform=win', filename: 'DiscordSetup.exe' },
  { name: 'Brave', icon: 'brave.png', url: 'https://referrals.brave.com/latest/BraveBrowserSetup.exe', filename: 'BraveBrowserSetup.exe' },
  { name: 'Faceit AC', icon: 'faceit.png', url: 'https://cdn.faceit.com/faceit/anticheat/FaceitAC_1.0.17.36.exe', filename: 'FACEITInstaller_64.exe' },
  { name: 'VLC', icon: 'vlc.png', url: 'https://get.videolan.org/vlc/3.0.20/win64/vlc-3.0.20-win64.exe', filename: 'vlc.exe' },
  { name: 'Malwarebytes', icon: 'malwarebytes.png', url: 'https://downloads.malwarebytes.com/file/mb4_offline', filename: 'mbsetup.exe' },
  { name: 'WinRAR', icon: 'winrar.png', url: 'https://www.rarlab.com/rar/winrar-x64-624.exe', filename: 'winrar.exe' },
  { name: 'Epic Games', icon: 'epic.png', url: 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/installer/download/EpicGamesLauncherInstaller.msi', filename: 'epic_installer.msi' },
  { name: 'Stremio', icon: 'stremio.png', url: 'https://www.stremio.com/StremioSetup.exe', filename: 'StremioSetup.exe' },
  { name: 'TuxlerVPN', icon: 'tuxler.png', url: 'https://cdn.tuxlervpn.com/windows/TuxlerVPNSetup.exe', filename: 'TuxlerVPNSetup.exe' },
  { name: 'Logitech Manager', icon: 'logitech.png', url: 'https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/LogitechManager.exe', filename: 'LogitechManager.exe' },
  { name: 'Filter Keys Setter', icon: 'filterkeys.png', url: 'https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/FilterKeysSetter.exe', filename: 'FilterKeysSetter.exe' },
  { name: 'Geek Utility', icon: 'geek.png', url: 'https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/geek.exe', filename: 'geek.exe' },
  { name: 'Visual Studio Code', icon: 'visual.png', url: 'https://update.code.visualstudio.com/latest/win32-x64-user/stable', filename: 'VSCodeSetup.exe' }
];

const Apps = () => {
  const { theme, primaryColor } = useTheme();
  const [hoveredApp, setHoveredApp] = useState(null);

  const installApp = async (app) => {
    try {
      await window.electron.runFunction('downloadAndRun', [app.name, app.url]);
    } catch (e) {
      console.error(`Eroare la instalarea ${app.name}:`, e);
    }
  };

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    show: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring", stiffness: 400, damping: 15 }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.95 },
    show: {
      opacity: 1, x: 0, scale: 1,
      transition: { type: "spring", stiffness: 400, damping: 20, duration: 0.2 }
    }
  };

  return (
    <motion.div
      style={{ padding: '30px' }}
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '20px'
        }}
      >
        {apps.map((app) => {
          const isHovered = hoveredApp === app.name;
          return (
            <motion.button
              key={app.name}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setHoveredApp(app.name)}
              onMouseLeave={() => setHoveredApp(null)}
              onClick={() => installApp(app)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${primaryColor}33`,
                borderRadius: '16px',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: theme.text,
                padding: '16px 12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                boxShadow: isHovered
                  ? `0 4px 22px ${primaryColor}66`
                  : `0 2px 12px ${primaryColor}33`,
                filter: hoveredApp && hoveredApp !== app.name ? 'blur(2px) brightness(0.7)' : 'none',
                opacity: hoveredApp && hoveredApp !== app.name ? 0.6 : 1
              }}
            >
              <img
                src={`icons/${app.icon}`}
                alt={app.name}
                style={{ width: '28px', height: '28px', marginBottom: '10px' }}
              />
              {app.name}
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
};



export default Apps;