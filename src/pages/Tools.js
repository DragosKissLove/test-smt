import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiTool, FiDownload, FiShield, FiTrash2, FiBox, FiEye, FiSearch, FiPrinter, FiBell, FiGamepad2, FiWifi, FiBluetooth, FiLayers, FiPlay } from 'react-icons/fi';
import { invoke } from '@tauri-apps/api/tauri';

const tools = [
  { name: 'WinRAR Crack', function: 'winrar_crack', icon: FiDownload },
  { name: 'WiFi Passwords', function: 'wifi_passwords', icon: FiShield },
  { name: 'Activate Windows', function: 'activate_windows', icon: FiBox },
  { name: 'TFY Optimizations', function: 'run_optimization', icon: FiZap },
  { name: 'Clean Temp Files', function: 'clean_temp', icon: FiTrash2 },
  { name: 'Atlas Tools', function: 'install_atlas_tools', icon: FiTool }
];

const windowsFeatures = [
  { name: 'Windows Visual Effects', key: 'visual_effects', icon: FiEye },
  { name: 'Search Indexing', key: 'search_indexing', icon: FiSearch },
  { name: 'Printing Service', key: 'printing', icon: FiPrinter },
  { name: 'Notifications', key: 'notifications', icon: FiBell },
  { name: 'FSO & Game Bar', key: 'fso_gamebar', icon: FiGamepad2 },
  { name: 'VPN Service', key: 'vpn', icon: FiWifi },
  { name: 'Bluetooth', key: 'bluetooth', icon: FiBluetooth },
  { name: 'Background Apps', key: 'background_apps', icon: FiLayers },
  { name: 'Game Mode', key: 'game_mode', icon: FiPlay }
];

const Tools = () => {
  const { theme, primaryColor } = useTheme();
  const [activeButton, setActiveButton] = useState(null);
  const [status, setStatus] = useState('');
  const [featureStates, setFeatureStates] = useState({
    visual_effects: true,
    search_indexing: true,
    printing: true,
    notifications: true,
    fso_gamebar: true,
    vpn: true,
    bluetooth: true,
    background_apps: true,
    game_mode: true
  });

  const handleClick = async (funcName) => {
    try {
      setActiveButton(funcName);
      setStatus('Processing...');
      const result = await invoke('run_function', { 
        name: funcName,
        args: null
      });
      setStatus(result || 'Operation completed successfully!');
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setActiveButton(null);
    }
  };

  const handleFeatureToggle = async (featureKey) => {
    const newState = !featureStates[featureKey];
    setFeatureStates(prev => ({
      ...prev,
      [featureKey]: newState
    }));

    try {
      setStatus(`${newState ? 'Enabling' : 'Disabling'} ${windowsFeatures.find(f => f.key === featureKey)?.name}...`);
      
      // TODO: Add actual function calls here
      // const result = await invoke('toggle_windows_feature', { 
      //   feature: featureKey,
      //   enabled: newState
      // });
      
      setStatus(`${windowsFeatures.find(f => f.key === featureKey)?.name} ${newState ? 'enabled' : 'disabled'} successfully!`);
      
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      // Revert state on error
      setFeatureStates(prev => ({
        ...prev,
        [featureKey]: !newState
      }));
      setStatus(`Error toggling ${windowsFeatures.find(f => f.key === featureKey)?.name}: ${error}`);
    }
  };

  return (
    <motion.div
      style={{ padding: '30px' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h2 style={{ 
        fontSize: '28px',
        fontWeight: '600',
        marginBottom: '20px',
        color: theme.text,
        borderBottom: `2px solid ${primaryColor}`,
        paddingBottom: '10px',
        display: 'inline-block'
      }}>
        Useful Tools
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        padding: '20px 0',
        marginBottom: '40px'
      }}>
        <AnimatePresence mode="popLayout">
          {tools.map((tool, index) => (
            <motion.button
              key={tool.function}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => handleClick(tool.function)}
              style={{
                height: '60px',
                borderRadius: '12px',
                border: `1px solid ${primaryColor}33`,
                background: `linear-gradient(135deg, ${theme.cardBg} 0%, ${primaryColor}11 100%)`,
                color: theme.text,
                fontSize: '15px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0 20px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 8px 32px ${primaryColor}22`
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tool.icon size={20} color={primaryColor} style={{
                filter: `drop-shadow(0 0 8px ${primaryColor}66)`
              }} />
              {tool.name}
              {activeButton === tool.function && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  style={{
                    position: 'absolute',
                    right: '20px',
                    width: '20px',
                    height: '20px',
                    border: `2px solid ${primaryColor}`,
                    borderTopColor: 'transparent',
                    borderRadius: '50%'
                  }}
                />
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: theme.cardBg,
          padding: '24px',
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          marginBottom: '24px'
        }}
      >
        <h3 style={{ 
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '20px',
          color: primaryColor,
          filter: `drop-shadow(0 0 10px ${primaryColor}66)`
        }}>
          Windows Features
        </h3>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '16px'
        }}>
          {windowsFeatures.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${theme.cardBg} 0%, ${primaryColor}08 100%)`,
                border: `1px solid ${primaryColor}22`,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <feature.icon 
                  size={20} 
                  color={primaryColor} 
                  style={{ filter: `drop-shadow(0 0 6px ${primaryColor}66)` }}
                />
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500,
                  color: theme.text
                }}>
                  {feature.name}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFeatureToggle(feature.key)}
                style={{
                  width: '50px',
                  height: '26px',
                  borderRadius: '13px',
                  border: 'none',
                  background: featureStates[feature.key] 
                    ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`
                    : 'rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  boxShadow: featureStates[feature.key] 
                    ? `0 0 12px ${primaryColor}66`
                    : '0 0 8px rgba(0, 0, 0, 0.2)'
                }}
              >
                <motion.div
                  animate={{
                    x: featureStates[feature.key] ? 24 : 0
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '11px',
                    background: '#fff',
                    position: 'absolute',
                    top: '2px',
                    left: '2px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: '20px',
              padding: '16px',
              borderRadius: '12px',
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              color: theme.text
            }}
          >
            {status}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Tools;