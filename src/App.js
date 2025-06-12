import React, { useState, useEffect } from 'react';
import './App.css';
import { useTheme } from './ThemeContext';
import Sidebar from './Sidebar';
import Apps from './pages/Apps';
import Tools from './pages/Tools';
import Extra from './pages/Extra';
import Settings from './Settings';
import About from './pages/About';
import Login from './components/Login';
import NotificationSystem from './components/NotificationSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMinus, FiX } from 'react-icons/fi';
import { appWindow } from '@tauri-apps/api/window';

const App = () => {
  const { theme, primaryColor } = useTheme();
  const [activeTab, setActiveTab] = useState('Apps');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const guestSession = localStorage.getItem('guestSession');
    if (guestSession) {
      setUser(JSON.parse(guestSession));
    }
  }, []);

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleClose = () => {
    appWindow.close();
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    const Component = {
      Apps,
      Tools,
      Extra,
      Settings,
      About
    }[activeTab];

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ 
            flex: 1,
            height: '100vh',
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${theme.background}00 0%, ${theme.background} 100%)`,
          }}
        >
          <Component />
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div style={{ 
      display: 'flex',
      background: theme.background,
      color: theme.text,
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>
        {`
          /* Global scrollbar styles */
          ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
          
          ::-webkit-scrollbar-thumb {
            background: transparent;
          }
          
          /* Firefox */
          * {
            scrollbar-width: none;
          }
          
          /* Smooth scrolling */
          * {
            scroll-behavior: smooth;
          }
        `}
      </style>

      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 120,
          height: '40px',
          WebkitAppRegion: 'drag',
          zIndex: 1000,
          // background: 'rgba(255, 0, 0, 0.1)' // Decomentează pentru a vedea zona
        }}
        onDoubleClick={() => appWindow.toggleMaximize()}
      />
      <div style={{
        position: 'fixed',
        top: 12,
        right: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 1000,
        WebkitAppRegion: 'no-drag'
      }}>
        <span style={{
          fontSize: '10px',
          color: theme.text,
          opacity: 0.3,
          marginRight: 8
        }}>
          v3.0.0
        </span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMinimize}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: primaryColor,
            cursor: 'pointer',
            filter: `drop-shadow(0 0 8px ${primaryColor}66)`
          }}
        >
          <FiMinus size={20} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: primaryColor,
            cursor: 'pointer',
            filter: `drop-shadow(0 0 8px ${primaryColor}66)`
          }}
        >
          <FiX size={20} />
        </motion.button>
      </div>
      
      <Sidebar active={activeTab} onChange={setActiveTab} user={user} />
      {renderContent()}
      <NotificationSystem /> 
    </div>
  );
};

export default App;
