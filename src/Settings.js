import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiDroplet, FiMonitor, FiInfo, FiCheck, FiUser, FiSettings, FiDownload, FiStar, FiCpu, FiHardDrive } from 'react-icons/fi';
import UpdateNotification from './components/UpdateNotification';

const colorPresets = [
  { name: 'Crimson', color: '#DC2626', gradient: 'linear-gradient(135deg, #DC2626, #EF4444)' },
  { name: 'Ocean', color: '#0EA5E9', gradient: 'linear-gradient(135deg, #0EA5E9, #3B82F6)' },
  { name: 'Emerald', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #059669)' },
  { name: 'Violet', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
  { name: 'Amber', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  { name: 'Rose', color: '#F43F5E', gradient: 'linear-gradient(135deg, #F43F5E, #E11D48)' },
  { name: 'Cyan', color: '#06B6D4', gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)' },
  { name: 'Indigo', color: '#6366F1', gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)' }
];

const Settings = () => {
  const { primaryColor, setPrimaryColor, theme } = useTheme();
  const [updateStatus, setUpdateStatus] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [username, setUsername] = useState('User');
  const [activeSection, setActiveSection] = useState('appearance');
  const [systemInfo, setSystemInfo] = useState({
    cpu: 'Loading...',
    ram: 'Loading...',
    gpu: 'Loading...',
    os: 'Loading...',
    platform: 'Loading...'
  });

  useEffect(() => {
    // Find which preset matches current color
    const preset = colorPresets.find(p => p.color === primaryColor);
    setSelectedPreset(preset?.name || 'Custom');

    // Get username and system info using electron function
    const getSystemInfo = async () => {
      try {
        if (window.electron && window.electron.runFunction) {
          const result = await window.electron.runFunction('getUsername');
          setUsername(result || 'User');
        }
        
        // Get system information
        if (navigator.userAgent) {
          const userAgent = navigator.userAgent;
          let osInfo = 'Unknown OS';
          
          if (userAgent.includes('Windows NT 10.0')) osInfo = 'Windows 10/11';
          else if (userAgent.includes('Windows NT 6.3')) osInfo = 'Windows 8.1';
          else if (userAgent.includes('Windows NT 6.2')) osInfo = 'Windows 8';
          else if (userAgent.includes('Windows NT 6.1')) osInfo = 'Windows 7';
          else if (userAgent.includes('Windows')) osInfo = 'Windows';
          
          setSystemInfo(prev => ({
            ...prev,
            os: osInfo,
            platform: navigator.platform || 'Unknown',
            ram: `${Math.round(navigator.deviceMemory || 0)}GB` || 'Unknown',
            cpu: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : 'Unknown'
          }));
        }

        // Try to get GPU info
        if (navigator.gpu) {
          try {
            const adapter = await navigator.gpu.requestAdapter();
            if (adapter) {
              setSystemInfo(prev => ({
                ...prev,
                gpu: 'WebGPU Compatible'
              }));
            }
          } catch (e) {
            setSystemInfo(prev => ({
              ...prev,
              gpu: 'DirectX/OpenGL'
            }));
          }
        } else {
          setSystemInfo(prev => ({
            ...prev,
            gpu: 'DirectX/OpenGL'
          }));
        }
      } catch (error) {
        console.error('Error getting system info:', error);
      }
    };
    getSystemInfo();

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

  const sections = [
    { id: 'appearance', name: 'Appearance', icon: FiDroplet },
    { id: 'updates', name: 'Updates', icon: FiDownload },
    { id: 'info', name: 'Info', icon: FiInfo }
  ];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: theme.background,
      color: theme.text
    }}>
      {/* Sidebar Navigation */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        style={{
          width: '280px',
          padding: '30px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRight: `1px solid ${primaryColor}22`,
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* User Profile - Simplified with only floating particles */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08)`,
            border: `1px solid ${primaryColor}30`,
            marginBottom: '30px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Simple floating particles - no border animations */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-20, -40, -20],
                x: [-10, 10, -10],
                opacity: [0.2, 0.6, 0.2],
                scale: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.8,
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                top: `${15 + i * 15}%`,
                left: `${10 + i * 15}%`,
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: primaryColor,
                filter: `blur(0.5px)`,
                pointerEvents: 'none'
              }}
            />
          ))}
          
          <motion.div 
            whileHover={{ 
              scale: 1.05,
              boxShadow: `0 12px 40px ${primaryColor}60`
            }}
            transition={{ duration: 0.3 }}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: `0 8px 32px ${primaryColor}40`,
              position: 'relative',
              zIndex: 1
            }}
          >
            <FiUser size={28} color="#fff" />
          </motion.div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 4px 0',
            color: theme.text,
            position: 'relative',
            zIndex: 1
          }}>
            {username}
          </h3>
          <p style={{
            fontSize: '14px',
            color: `${theme.text}80`,
            margin: 0,
            position: 'relative',
            zIndex: 1
          }}>
            TFY Tool User
          </p>
        </motion.div>

        {/* Navigation Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sections.map((section, index) => (
            <motion.button
              key={section.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ x: 4 }}
              onClick={() => setActiveSection(section.id)}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: 'none',
                background: activeSection === section.id 
                  ? `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`
                  : 'transparent',
                color: activeSection === section.id ? primaryColor : theme.text,
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              <section.icon size={20} />
              {section.name}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: '30px',
        overflowY: 'auto'
      }}>
        <AnimatePresence mode="wait">
          {activeSection === 'appearance' && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                margin: '0 0 8px 0',
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}aa)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Appearance
              </h1>
              <p style={{
                fontSize: '16px',
                color: `${theme.text}80`,
                margin: '0 0 40px 0'
              }}>
                Customize your theme and visual preferences
              </p>

              {/* Color Presets */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '20px',
                padding: '32px',
                border: `1px solid ${primaryColor}22`,
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: '0 0 24px 0',
                  color: theme.text
                }}>
                  Color Themes
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '16px',
                  marginBottom: '32px'
                }}>
                  {colorPresets.map((preset, index) => (
                    <motion.button
                      key={preset.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePresetSelect(preset)}
                      style={{
                        padding: '20px 16px',
                        borderRadius: '16px',
                        border: selectedPreset === preset.name 
                          ? `2px solid ${preset.color}` 
                          : '2px solid transparent',
                        background: preset.gradient,
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: selectedPreset === preset.name 
                          ? `0 8px 32px ${preset.color}40`
                          : '0 4px 16px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {selectedPreset === preset.name && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FiCheck size={14} />
                        </motion.div>
                      )}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FiStar size={16} />
                      </div>
                      {preset.name}
                    </motion.button>
                  ))}
                </div>

                {/* Custom Color Picker */}
                <div style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${primaryColor}22`
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 16px 0',
                    color: theme.text
                  }}>
                    Custom Color
                  </h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                  }}>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={handleColorChange}
                      style={{
                        width: '60px',
                        height: '60px',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        background: 'transparent'
                      }}
                    />
                    <div>
                      <p style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: theme.text,
                        margin: '0 0 4px 0'
                      }}>
                        Pick your own color
                      </p>
                      <p style={{
                        fontSize: '14px',
                        color: `${theme.text}60`,
                        margin: 0,
                        fontFamily: 'monospace'
                      }}>
                        {primaryColor}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'updates' && (
            <motion.div
              key="updates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                margin: '0 0 8px 0',
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}aa)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Updates
              </h1>
              <p style={{
                fontSize: '16px',
                color: `${theme.text}80`,
                margin: '0 0 40px 0'
              }}>
                Keep your application up to date with the latest features
              </p>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '20px',
                padding: '32px',
                border: `1px solid ${primaryColor}22`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}40)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiRefreshCw size={28} color={primaryColor} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      margin: '0 0 4px 0',
                      color: theme.text
                    }}>
                      Software Updates
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: `${theme.text}60`,
                      margin: 0
                    }}>
                      Automatically check for and install updates
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckUpdates}
                  disabled={isChecking}
                  style={{
                    padding: '16px 32px',
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
                        marginTop: '20px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${primaryColor}30`,
                        color: theme.text,
                        fontSize: '14px'
                      }}
                    >
                      {updateStatus}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeSection === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                margin: '0 0 8px 0',
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}aa)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Info
              </h1>
              <p style={{
                fontSize: '16px',
                color: `${theme.text}80`,
                margin: '0 0 40px 0'
              }}>
                Information about TFY Tool and system details
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '20px',
                  padding: '32px',
                  border: `1px solid ${primaryColor}22`
                }}>
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
                      background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}40)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiSettings size={20} color={primaryColor} />
                    </div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      margin: 0,
                      color: theme.text
                    }}>
                      Application Info
                    </h3>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span style={{ color: `${theme.text}80` }}>Version</span>
                      <span style={{ fontWeight: '600', color: primaryColor }}>3.0.0</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span style={{ color: `${theme.text}80` }}>Build</span>
                      <span style={{ fontWeight: '600', color: theme.text }}>Release</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span style={{ color: `${theme.text}80` }}>Runtime</span>
                      <span style={{ fontWeight: '600', color: theme.text }}>Electron</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0'
                    }}>
                      <span style={{ color: `${theme.text}80` }}>Theme</span>
                      <span style={{ fontWeight: '600', color: primaryColor }}>{selectedPreset}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '20px',
                  padding: '32px',
                  border: `1px solid ${primaryColor}22`
                }}>
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
                      background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}40)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiCpu size={20} color={primaryColor} />
                    </div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      margin: 0,
                      color: theme.text
                    }}>
                      System Info
                    </h3>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span style={{ color: `${theme.text}80` }}>User</span>
                      <span style={{ fontWeight: '600', color: theme.text }}>{username}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span style={{ color: `${theme.text}80` }}>Operating System</span>
                      <span style={{ fontWeight: '600', color: theme.text }}>{systemInfo.os}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span style={{ color: `${theme.text}80` }}>Platform</span>
                      <span style={{ fontWeight: '600', color: theme.text }}>{systemInfo.platform}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span style={{ color: `${theme.text}80` }}>CPU Cores</span>
                      <span style={{ fontWeight: '600', color: theme.text }}>{systemInfo.cpu}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span style={{ color: `${theme.text}80` }}>Memory</span>
                      <span style={{ fontWeight: '600', color: theme.text }}>{systemInfo.ram}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0'
                    }}>
                      <span style={{ color: `${theme.text}80` }}>Graphics</span>
                      <span style={{ fontWeight: '600', color: theme.text }}>{systemInfo.gpu}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
    </div>
  );
};

export default Settings;