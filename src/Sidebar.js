import React from 'react';
import { useTheme } from './ThemeContext';
import { motion } from 'framer-motion';
import { FiGrid, FiTool, FiStar, FiSettings, FiInfo, FiLogOut } from 'react-icons/fi';

const tabs = [
  { id: 'Apps', icon: FiGrid, tooltip: 'Install Applications' },
  { id: 'Tools', icon: FiTool, tooltip: 'System Tools' },
  { id: 'Extra', icon: FiStar, tooltip: 'Extra Features' },
  { id: 'Settings', icon: FiSettings, tooltip: 'Preferences' },
  { id: 'Info', icon: FiInfo, tooltip: 'Info' }
];

const Sidebar = ({ active, onChange, user }) => {
  const { theme, primaryColor } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('guestSession');
    window.location.replace(window.location.href);
  };

  const handleOpenDiscord = () => {
    window.open('https://discord.gg/xDN3eSyfqU', '_blank');
  };

  const sidebarVariants = {
    initial: { x: -100, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { x: -20, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  // Discord SVG Logo Component with theme color
  const DiscordLogo = ({ size = 20, color = primaryColor }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );

  return (
    <motion.div
      variants={sidebarVariants}
      initial="initial"
      animate="animate"
      style={{
        width: 80,
        height: '100vh',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: `1px solid ${primaryColor}22`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 0',
        gap: 16,
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
        WebkitAppRegion: 'drag'
      }}
    >
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 16, 
        marginTop: 20,
        WebkitAppRegion: 'no-drag'
      }}>
        {tabs.map(({ id, icon: Icon, tooltip }) => (
          <motion.div
            key={id}
            variants={itemVariants}
            style={{ position: 'relative' }}
            whileHover="hover"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(id)}
              style={{
                width: 48,
                height: 48,
                border: 'none',
                borderRadius: '12px',
                background: id === active ? primaryColor : 'transparent',
                color: id === active ? '#FFF' : theme.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              <Icon size={24} />
              {id === active && (
                <motion.div
                  layoutId="activeTab"
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '12px',
                    background: primaryColor,
                    zIndex: -1
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30 
                  }}
                />
              )}
            </motion.button>
            
            <motion.div
              variants={{
                hover: { opacity: 1, x: 60, transition: { duration: 0.2 } },
                initial: { opacity: 0, x: 0 }
              }}
              initial="initial"
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                color: theme.text,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                boxShadow: `0 4px 12px ${primaryColor}33`,
                border: `1px solid ${primaryColor}22`,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 1000
              }}
            >
              {tooltip}
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 12,
        marginTop: 'auto',
        marginBottom: 20,
        WebkitAppRegion: 'no-drag'
      }}>
        {/* Discord Button with smaller Discord Logo using theme color */}
        <motion.div
          variants={itemVariants}
          style={{ position: 'relative' }}
          whileHover="hover"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenDiscord}
            style={{
              width: 40,
              height: 40,
              border: 'none',
              borderRadius: '10px',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            <DiscordLogo size={20} color={primaryColor} />
          </motion.button>
          
          <motion.div
            variants={{
              hover: { opacity: 1, x: 50, transition: { duration: 0.2 } },
              initial: { opacity: 0, x: 0 }
            }}
            initial="initial"
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              color: theme.text,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              boxShadow: `0 4px 12px ${primaryColor}33`,
              border: `1px solid ${primaryColor}22`,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 1000
            }}
          >
            Join Discord
          </motion.div>
        </motion.div>

        {/* Logout Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
          style={{
            width: 48,
            height: 48,
            border: 'none',
            borderRadius: '12px',
            background: 'transparent',
            color: theme.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <FiLogOut size={24} />
        </motion.button>
        
        <motion.span
          variants={itemVariants}
          style={{
            fontSize: '8px',
            color: theme.text,
            opacity: 0.2
          }}
        >
          v3.0.0
        </motion.span>
      </div>
    </motion.div>
  );
};

export default Sidebar;