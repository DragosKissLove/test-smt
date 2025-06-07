import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw } from 'react-icons/fi';
import UpdateNotification from './components/UpdateNotification';

const Settings = () => {
  const { primaryColor, setPrimaryColor, theme } = useTheme();
  const [updateStatus, setUpdateStatus] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);

  useEffect(() => {
    if (window.electron) {
      window.electron.onUpdateStatus((event, message) => {
        setUpdateStatus(message);
      });

      window.electron.onUpdateAvailable((event, info) => {
        setUpdateInfo(info);
      });

      window.electron.onUpdateNotAvailable(() => {
        setUpdateStatus('You have the latest version!');
        setTimeout(() => setUpdateStatus(''), 3000);
      });

      window.electron.onDownloadProgress((event, progress) => {
        setDownloadProgress(progress.percent);
      });

      window.electron.onUpdateDownloaded(() => {
        setDownloadProgress(100);
      });
    }
  }, []);

  const handleColorChange = (e) => {
    setPrimaryColor(e.target.value);
  };

  const handleCheckUpdates = async () => {
    try {
      setIsChecking(true);
      setUpdateStatus('Checking for updates...');
      await window.electron.startUpdate();
    } catch (error) {
      setUpdateStatus(`Error checking updates: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (downloadProgress === 100) {
      await window.electron.installUpdate();
    } else {
      await window.electron.startUpdate();
    }
  };

  return (
    <motion.div
      style={{ padding: 30 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <motion.h2 
        style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '20px',
          color: theme.text,
          borderBottom: `2px solid ${primaryColor}`,
          paddingBottom: '10px',
          display: 'inline-block',
          position: 'relative'
        }}
      >
        Settings
      </motion.h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            padding: 20,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <h3 style={{ marginBottom: 16 }}>Appearance</h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16 
          }}>
            <motion.div
              style={{
                position: 'relative',
                width: '200px',
                height: '40px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: `0 0 20px ${primaryColor}40`,
                border: `1px solid ${primaryColor}33`
              }}
            >
              <input
                type="color"
                value={primaryColor}
                onChange={handleColorChange}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  background: 'transparent',
                  marginRight: '10px',
                  filter: `drop-shadow(0 0 8px ${primaryColor})`
                }}
              />
              <span style={{ 
                color: theme.text,
                fontSize: '14px',
                opacity: 0.8
              }}>
                Accent Color
              </span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            padding: 20,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <h3 style={{ marginBottom: 16 }}>Updates</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCheckUpdates}
            disabled={isChecking}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: theme.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 0 20px ${primaryColor}40`,
              transition: 'all 0.3s ease'
            }}
          >
            <FiRefreshCw 
              style={{ 
                animation: isChecking ? 'spin 1s linear infinite' : 'none',
                color: primaryColor
              }} 
            />
            Check for Updates
          </motion.button>

          <AnimatePresence>
            {updateStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {updateStatus}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <UpdateNotification 
        updateInfo={updateInfo}
        onInstall={handleInstallUpdate}
        downloadProgress={downloadProgress}
      />
    </motion.div>
  );
};

export default Settings;