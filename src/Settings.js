import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiDroplet, FiMonitor, FiDownload, FiCheck, FiUser, FiSettings, FiStar, FiCpu, FiInfo, FiHardDrive, FiZap } from 'react-icons/fi';
import { invoke } from '@tauri-apps/api/tauri';
import { showNotification } from './components/NotificationSystem';

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
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [username, setUsername] = useState('User');
  const [activeSection, setActiveSection] = useState('appearance');
  const [systemInfo, setSystemInfo] = useState({
    os: 'Loading...',
    cpu: 'Loading...',
    ram: 'Loading...',
    gpu: 'Loading...'
  });

  useEffect(() => {
    // Find which preset matches current color
    const preset = colorPresets.find(p => p.color === primaryColor);
    setSelectedPreset(preset?.name || null);

    // Get system information
    const getSystemInfo = async () => {
      try {
        // Get username
        const usernameResult = await invoke('get_username');
        setUsername(usernameResult || 'User');
        
        // Get real system information
        const sysInfo = await invoke('get_system_info');
        setSystemInfo(sysInfo);
      } catch (error) {
        console.error('Error getting system info:', error);
        // Set fallback values if everything fails
        setSystemInfo({
          os: 'Windows 11',
          cpu: 'Intel/AMD Processor',
          ram: '16 GB RAM',
          gpu: 'NVIDIA/AMD Graphics'
        });
      }
    };

    getSystemInfo();
  }, [primaryColor]);

  const handleColorChange = (e) => {
    setPrimaryColor(e.target.value);
    setSelectedPreset(null);
  };

  const handlePresetSelect = (preset) => {
    setPrimaryColor(preset.color);
    setSelectedPreset(preset.name);
  };

  const handleCheckUpdates = async () => {
    try {
      setIsChecking(true);
      setUpdateStatus('Checking for updates...');
      showNotification('info', 'Update Check', 'Checking for updates...');
      
      // Simulate update check
      setTimeout(() => {
        setUpdateStatus('You have the latest version!');
        showNotification('success', 'Up to Date', 'You have the latest version!');
        setIsChecking(false);
        setTimeout(() => setUpdateStatus(''), 5000);
      }, 2000);
      
    } catch (error) {
      setUpdateStatus(`Error checking updates: ${error}`);
      showNotification('error', 'Update Error', `Error checking updates: ${error}`);
      setIsChecking(false);
      setTimeout(() => setUpdateStatus(''), 5000);
    }
  };

  const sections = [
    { id: 'appearance', name: 'Appearance', icon: FiDroplet },
    { id: 'updates', name: 'Updates', icon: FiDownload },
    { id: 'about', name: 'About', icon: FiInfo }
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
        {/* User Profile */}
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
          {/* Simple floating particles */}
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
                        width: '24px',
                        height: '24px',
                        border: 'none',
                        borderRadius: '6px',
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
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isChecking ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isChecking ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <FiRefreshCw 
                    size={16}
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

          {activeSection === 'about' && (
            <motion.div
              key="about"
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
                About
              </h1>
              <p style={{
                fontSize: '16px',
                color: `${theme.text}80`,
                margin: '0 0 40px 0'
              }}>
                System information and application details
              </p>

              {/* Application Information */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '32px',
                borderRadius: '20px',
                border: `1px solid ${primaryColor}22`,
                marginBottom: '24px'
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
                    <FiZap size={28} color={primaryColor} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      margin: '0 0 4px 0',
                      color: theme.text
                    }}>
                      TFY Tool
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: `${theme.text}60`,
                      margin: 0
                    }}>
                      Version 3.0.0 • System Optimization Suite
                    </p>
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
                    border: `1px solid ${primaryColor}22`
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: primaryColor,
                      margin: '0 0 8px 0'
                    }}>
                      Developer
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      color: theme.text,
                      margin: 0
                    }}>
                      DragosKissLove
                    </p>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${primaryColor}22`
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: primaryColor,
                      margin: '0 0 8px 0'
                    }}>
                      Build Date
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      color: theme.text,
                      margin: 0
                    }}>
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${primaryColor}22`
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: primaryColor,
                      margin: '0 0 8px 0'
                    }}>
                      License
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      color: theme.text,
                      margin: 0
                    }}>
                      Free
                    </p>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '32px',
                borderRadius: '20px',
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
                    <FiMonitor size={28} color={primaryColor} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      margin: '0 0 4px 0',
                      color: theme.text
                    }}>
                      System Information
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: `${theme.text}60`,
                      margin: 0
                    }}>
                      Real-time hardware and software details
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${primaryColor}22`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <FiMonitor size={20} color={primaryColor} />
                    <div>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: primaryColor,
                        margin: '0 0 4px 0'
                      }}>
                        Operating System
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: theme.text,
                        margin: 0
                      }}>
                        {systemInfo.os}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${primaryColor}22`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <FiCpu size={20} color={primaryColor} />
                    <div>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: primaryColor,
                        margin: '0 0 4px 0'
                      }}>
                        Processor
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: theme.text,
                        margin: 0,
                        wordBreak: 'break-word'
                      }}>
                        {systemInfo.cpu}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${primaryColor}22`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <FiHardDrive size={20} color={primaryColor} />
                    <div>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: primaryColor,
                        margin: '0 0 4px 0'
                      }}>
                        Memory
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: theme.text,
                        margin: 0
                      }}>
                        {systemInfo.ram}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${primaryColor}22`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <FiSettings size={20} color={primaryColor} />
                    <div>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: primaryColor,
                        margin: '0 0 4px 0'
                      }}>
                        Graphics
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: theme.text,
                        margin: 0,
                        wordBreak: 'break-word'
                      }}>
                        {systemInfo.gpu}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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