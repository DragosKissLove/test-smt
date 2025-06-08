import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiBrush, FiMonitor, FiInfo, FiCheck } from 'react-icons/fi';
import UpdateNotification from './components/UpdateNotification';

const colorPresets = [
  { name: 'Red', color: '#DC2626', gradient: 'linear-gradient(135deg, #DC2626, #EF4444)' },
  { name: 'Blue', color: '#2563EB', gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)' },
  { name: 'Green', color: '#059669', gradient: 'linear-gradient(135deg, #059669, #10B981)' },
  { name: 'Purple', color: '#7C3AED', gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)' },
  { name: 'Orange', color: '#EA580C', gradient: 'linear-gradient(135deg, #EA580C, #F97316)' },
  { name: 'Pink', color: '#DB2777', gradient: 'linear-gradient(135deg, #DB2777, #EC4899)' },
  { name: 'Cyan', color: '#0891B2', gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)' },
  { name: 'Yellow', color: '#D97706', gradient: 'linear-gradient(135deg, #D97706, #F59E0B)' }
];

const Settings = () => {
  const { primaryColor, setPrimaryColor, theme } = useTheme();
  const [updateStatus, setUpdateStatus] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);

  useEffect(() => {
    // Find which preset matches current color
    const preset = colorPresets.find(p => p.color === primaryColor);
    setSelectedPreset(preset?.name || 'Custom');

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
  }, [primaryColor]);

  const handleColorChange = (e) => {
    setPrimaryColor(e.target.value);
    setSelectedPreset('Custom');
  };

  const handlePresetSelect = (preset) => {
    setPrimaryColor(preset.color);
    setSelectedPreset(preset.name);
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
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '30px',
          color: theme.text,
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}aa)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        Settings
      </motion.h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
            borderRadius: '20px',
            padding: '24px',
            border: `1px solid rgba(255, 255, 255, 0.2)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Section Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}44)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiBrush size={20} color={primaryColor} />
            </div>
            <div>
              <h3 style={{ 
                fontSize: '20px',
                fontWeight: '600',
                color: theme.text,
                margin: 0
              }}>
                Appearance
              </h3>
              <p style={{
                fontSize: '14px',
                color: `${theme.text}aa`,
                margin: 0
              }}>
                Customize your theme and colors
              </p>
            </div>
          </div>

          {/* Color Presets */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '500',
              color: theme.text,
              marginBottom: '16px'
            }}>
              Color Presets
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '12px'
            }}>
              {colorPresets.map((preset) => (
                <motion.button
                  key={preset.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePresetSelect(preset)}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: selectedPreset === preset.name 
                      ? `2px solid ${preset.color}` 
                      : '2px solid transparent',
                    background: preset.gradient,
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {selectedPreset === preset.name && <FiCheck size={16} />}
                  {preset.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '500',
              color: theme.text,
              marginBottom: '16px'
            }}>
              Custom Color
            </h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid rgba(255, 255, 255, 0.1)`
            }}>
              <input
                type="color"
                value={primaryColor}
                onChange={handleColorChange}
                style={{
                  width: '48px',
                  height: '48px',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: 'transparent'
                }}
              />
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.text,
                  margin: 0
                }}>
                  Pick a custom color
                </p>
                <p style={{
                  fontSize: '12px',
                  color: `${theme.text}aa`,
                  margin: 0
                }}>
                  Current: {primaryColor}
                </p>
              </div>
            </div>
          </div>

          {/* Accent Border */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}aa)`,
            borderRadius: '20px 20px 0 0'
          }} />
        </motion.div>

        {/* Updates Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
            borderRadius: '20px',
            padding: '24px',
            border: `1px solid rgba(255, 255, 255, 0.2)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Section Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}44)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiRefreshCw size={20} color={primaryColor} />
            </div>
            <div>
              <h3 style={{ 
                fontSize: '20px',
                fontWeight: '600',
                color: theme.text,
                margin: 0
              }}>
                Updates
              </h3>
              <p style={{
                fontSize: '14px',
                color: `${theme.text}aa`,
                margin: 0
              }}>
                Keep your application up to date
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCheckUpdates}
            disabled={isChecking}
            style={{
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isChecking ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              opacity: isChecking ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            <FiRefreshCw 
              size={20}
              style={{ 
                animation: isChecking ? 'spin 1s linear infinite' : 'none'
              }} 
            />
            {isChecking ? 'Checking for Updates...' : 'Check for Updates'}
          </motion.button>

          <AnimatePresence>
            {updateStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid rgba(255, 255, 255, 0.1)`,
                  color: theme.text,
                  fontSize: '14px'
                }}
              >
                {updateStatus}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Accent Border */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}aa)`,
            borderRadius: '20px 20px 0 0'
          }} />
        </motion.div>

        {/* App Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
            borderRadius: '20px',
            padding: '24px',
            border: `1px solid rgba(255, 255, 255, 0.2)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Section Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}44)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiInfo size={20} color={primaryColor} />
            </div>
            <div>
              <h3 style={{ 
                fontSize: '20px',
                fontWeight: '600',
                color: theme.text,
                margin: 0
              }}>
                Application Info
              </h3>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid rgba(255, 255, 255, 0.1)`
            }}>
              <p style={{
                fontSize: '12px',
                color: `${theme.text}aa`,
                margin: '0 0 4px 0'
              }}>
                Version
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.text,
                margin: 0
              }}>
                3.0.0
              </p>
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid rgba(255, 255, 255, 0.1)`
            }}>
              <p style={{
                fontSize: '12px',
                color: `${theme.text}aa`,
                margin: '0 0 4px 0'
              }}>
                Build
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.text,
                margin: 0
              }}>
                Release
              </p>
            </div>
          </div>

          {/* Accent Border */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}aa)`,
            borderRadius: '20px 20px 0 0'
          }} />
        </motion.div>
      </div>

      <UpdateNotification 
        updateInfo={updateInfo}
        onInstall={handleInstallUpdate}
        downloadProgress={downloadProgress}
      />

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </motion.div>
  );
};

export default Settings;