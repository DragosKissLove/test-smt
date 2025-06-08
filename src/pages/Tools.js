import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiTool, FiDownload, FiShield, FiTrash2, FiBox, FiEye, FiSearch, FiPrinter, FiBell, FiMonitor, FiWifi, FiBluetooth, FiLayers, FiPlay } from 'react-icons/fi';
import { invoke } from '@tauri-apps/api/tauri';
import { ring } from 'ldrs';

// Register the ring component
ring.register();

const tools = [
  { name: 'WinRAR Crack', function: 'winrar_crack', icon: FiDownload },
  { name: 'WiFi Passwords', function: 'wifi_passwords', icon: FiShield },
  { name: 'Activate Windows', function: 'activate_windows', icon: FiBox },
  { name: 'TFY Optimizations', function: 'run_optimization', icon: FiZap, isComplex: true },
  { name: 'Clean Temp Files', function: 'clean_temp', icon: FiTrash2, isComplex: true },
  { name: 'Atlas Tools', function: 'install_atlas_tools', icon: FiTool, isComplex: true }
];

const windowsFeatures = [
  { name: 'Windows Visual Effects', key: 'visual_effects', icon: FiEye },
  { name: 'Search Indexing', key: 'search_indexing', icon: FiSearch, isComplex: true },
  { name: 'Printing Service', key: 'printing', icon: FiPrinter, isComplex: true },
  { name: 'Notifications', key: 'notifications', icon: FiBell },
  { name: 'FSO & Game Bar', key: 'fso_gamebar', icon: FiMonitor },
  { name: 'VPN Service', key: 'vpn', icon: FiWifi, isComplex: true },
  { name: 'Bluetooth', key: 'bluetooth', icon: FiBluetooth, isComplex: true },
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

  const handleClick = async (funcName, isComplex = false) => {
    try {
      setActiveButton(funcName);
      setStatus('Processing...');
      const result = await invoke('run_function', { name: funcName, args: null });
      setStatus(result || 'Operation completed successfully!');
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setActiveButton(null);
    }
  };

  const handleFeatureToggle = async (featureKey, isComplex = false) => {
    const newState = !featureStates[featureKey];
    setFeatureStates(prev => ({
      ...prev,
      [featureKey]: newState
    }));

    try {
      setStatus(`${newState ? 'Enabling' : 'Disabling'} ${windowsFeatures.find(f => f.key === featureKey)?.name}...`);
      
      // Call the appropriate function based on feature and state
      const functionName = `${newState ? 'enable' : 'disable'}_${featureKey}`;
      const result = await invoke('run_function', { name: functionName, args: null });
      
      setStatus(result || `${windowsFeatures.find(f => f.key === featureKey)?.name} ${newState ? 'enabled' : 'disabled'} successfully!`);
      
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
      style={{ 
        padding: '30px',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <style>
        {`
          /* Custom Scrollbar */
          ::-webkit-scrollbar {
            width: 6px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: ${primaryColor};
            border-radius: 3px;
            opacity: 0.7;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: ${primaryColor}dd;
            opacity: 1;
          }
          
          /* Firefox */
          * {
            scrollbar-width: thin;
            scrollbar-color: ${primaryColor} rgba(255, 255, 255, 0.05);
          }
        `}
      </style>

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: theme.cardBg,
          padding: '24px',
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 0%'],
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{
            duration: 4,
            ease: "linear",
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '16px',
            padding: '1px',
            background: `linear-gradient(90deg, 
              ${primaryColor}00 0%, 
              ${primaryColor} 50%,
              ${primaryColor}00 100%
            )`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
          }}
        />

        <h3 style={{ 
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '20px',
          color: primaryColor,
          filter: `drop-shadow(0 0 10px ${primaryColor}66)`
        }}>
          System Tools
        </h3>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px'
        }}>
          <AnimatePresence mode="popLayout">
            {tools.map((tool, index) => (
              <motion.button
                key={tool.function}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onClick={() => handleClick(tool.function, tool.isComplex)}
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
                  boxShadow: `0 8px 32px ${primaryColor}22`,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: `0 12px 40px ${primaryColor}44`
                }}
                whileTap={{ scale: 0.98 }}
              >
                <tool.icon size={20} color={primaryColor} style={{
                  filter: `drop-shadow(0 0 8px ${primaryColor}66)`
                }} />
                {tool.name}
                {activeButton === tool.function && (
                  <div style={{
                    position: 'absolute',
                    right: '20px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {tool.isComplex ? (
                      <l-ring
                        size="20"
                        stroke="3"
                        bg-opacity="0"
                        speed="2"
                        color={primaryColor}
                      />
                    ) : (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1, rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        style={{
                          width: '20px',
                          height: '20px',
                          border: `2px solid ${primaryColor}`,
                          borderTopColor: 'transparent',
                          borderRadius: '50%'
                        }}
                      />
                    )}
                  </div>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: theme.cardBg,
          padding: '24px',
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated glow border effect - only on container */}
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 0%'],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            duration: 3,
            ease: "linear",
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '16px',
            padding: '2px',
            background: `linear-gradient(90deg, 
              ${primaryColor}00 0%, 
              ${primaryColor}88 25%,
              ${primaryColor} 50%,
              ${primaryColor}88 75%,
              ${primaryColor}00 100%
            )`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
          }}
        />

        <h3 style={{ 
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '20px',
          color: primaryColor,
          filter: `drop-shadow(0 0 10px ${primaryColor}66)`,
          position: 'relative',
          zIndex: 1
        }}>
          Windows Features
        </h3>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '16px',
          position: 'relative',
          zIndex: 1
        }}>
          {windowsFeatures.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              whileHover={{
                boxShadow: `0 8px 32px ${primaryColor}44`
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${theme.cardBg} 0%, ${primaryColor}08 100%)`,
                border: `1px solid ${primaryColor}22`,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Individual item glow effect */}
              <motion.div
                animate={{
                  opacity: featureStates[feature.key] ? [0.2, 0.4, 0.2] : [0, 0, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '12px',
                  background: `radial-gradient(circle at center, ${primaryColor}22 0%, transparent 70%)`,
                  pointerEvents: 'none'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                <motion.div
                  animate={{
                    filter: featureStates[feature.key] 
                      ? `drop-shadow(0 0 8px ${primaryColor}88)` 
                      : `drop-shadow(0 0 4px ${primaryColor}44)`
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <feature.icon 
                    size={20} 
                    color={primaryColor}
                  />
                </motion.div>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500,
                  color: theme.text
                }}>
                  {feature.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                {/* Loading indicator for complex operations */}
                {activeButton === `${featureStates[feature.key] ? 'disable' : 'enable'}_${feature.key}` && feature.isComplex && (
                  <l-ring
                    size="20"
                    stroke="3"
                    bg-opacity="0"
                    speed="2"
                    color={primaryColor}
                  />
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFeatureToggle(feature.key, feature.isComplex)}
                  disabled={activeButton === `${featureStates[feature.key] ? 'disable' : 'enable'}_${feature.key}`}
                  style={{
                    width: '50px',
                    height: '26px',
                    borderRadius: '13px',
                    border: 'none',
                    background: featureStates[feature.key] 
                      ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`
                      : 'rgba(255, 255, 255, 0.1)',
                    cursor: activeButton === `${featureStates[feature.key] ? 'disable' : 'enable'}_${feature.key}` ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    boxShadow: featureStates[feature.key] 
                      ? `0 0 16px ${primaryColor}88, inset 0 0 8px ${primaryColor}44`
                      : '0 0 8px rgba(0, 0, 0, 0.2)',
                    opacity: activeButton === `${featureStates[feature.key] ? 'disable' : 'enable'}_${feature.key}` ? 0.7 : 1
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
                      boxShadow: featureStates[feature.key]
                        ? `0 2px 8px rgba(0, 0, 0, 0.3), 0 0 4px ${primaryColor}66`
                        : '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}
                  />
                </motion.button>
              </div>
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
              color: theme.text,
              boxShadow: `0 0 20px ${primaryColor}33`
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