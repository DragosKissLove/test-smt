import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { FiDownload, FiRefreshCw, FiClock, FiChevronDown } from 'react-icons/fi';
import { invoke } from '@tauri-apps/api/tauri';
import { showNotification } from '../components/NotificationSystem';
import { ring } from 'ldrs';

// Register the ring component
ring.register();

const Extra = () => {
  const { theme, primaryColor } = useTheme();
  const [status, setStatus] = useState('');
  const [robloxVersion, setRobloxVersion] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [savedVersions, setSavedVersions] = useState([]);
  const [activeButton, setActiveButton] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('');

  useEffect(() => {
    // Load saved versions from the API
    const loadSavedVersions = async () => {
      try {
        const versions = await invoke('get_saved_versions');
        setSavedVersions(versions);
      } catch (error) {
        console.error('Failed to load saved versions:', error);
      }
    };

    loadSavedVersions();
  }, []);

  const handleClick = async (name, url) => {
    try {
      setActiveButton(name);
      setStatus('Downloading...');
      showNotification('info', 'Download Started', `Downloading ${name}...`);
      
      const result = await invoke('download_to_desktop_and_run', { name, url });
      setStatus(result || `${name} has been downloaded and started`);
      showNotification('success', 'Download Complete', `${name} has been downloaded and launched successfully!`);
    } catch (error) {
      setStatus(`❌ Error downloading ${name}: ${error}`);
      showNotification('error', 'Download Failed', `Failed to download ${name}: ${error}`);
    } finally {
      setActiveButton(null);
    }
  };

  const handleRobloxDowngrade = async () => {
    if (!robloxVersion) {
      setStatus('Please enter a version hash');
      showNotification('warning', 'Missing Version', 'Please enter a Roblox version hash');
      return;
    }

    try {
      setIsDownloading(true);
      setStatus('Starting Roblox downgrade...');
      showNotification('info', 'Roblox Downgrade', 'Starting Roblox downgrade process...');

      const result = await invoke('download_player', { 
        versionHash: robloxVersion,
        channel: 'LIVE',
        binaryType: 'WindowsPlayer'
      });
      
      setStatus(result || '✅ Roblox downgrade completed successfully!');
      showNotification('success', 'Roblox Downgrade Complete', 'Roblox has been successfully downgraded!');
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
      showNotification('error', 'Downgrade Failed', `Roblox downgrade failed: ${error}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleVersionSelect = (version) => {
    setRobloxVersion(version.hash);
    setSelectedVersion(`${version.hash} – ${version.description}`);
    setIsDropdownOpen(false);
  };

  return (
    <motion.div
      style={{ 
        padding: 30,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 style={{ 
        fontSize: '28px',
        fontWeight: '600',
        marginBottom: '20px',
        color: theme.text,
        borderBottom: `2px solid ${primaryColor}`,
        paddingBottom: '10px',
        display: 'inline-block',
        position: 'relative'
      }}>
        Extra Features
      </h2>
      
      <div style={{
        marginTop: 20,
        padding: '24px',
        borderRadius: '16px',
        background: theme.cardBg,
        border: `1px solid ${primaryColor}22`,
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
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
          marginBottom: 16,
          color: primaryColor,
          filter: `drop-shadow(0 0 10px ${primaryColor}66)`,
          position: 'relative',
          zIndex: 1
        }}>Roblox Downgrade (Windows Player - LIVE Channel)</h3>

        {/* Custom Saved Versions Dropdown */}
        {savedVersions.length > 0 && (
          <div style={{ marginBottom: '16px', position: 'relative', zIndex: 1 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: theme.text, 
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Saved Versions:
            </label>
            <div style={{ position: 'relative' }}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${primaryColor}33`,
                  background: `linear-gradient(135deg, ${theme.cardBg}, ${primaryColor}08)`,
                  color: theme.text,
                  outline: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 16px ${primaryColor}22`
                }}
              >
                <span style={{ opacity: selectedVersion ? 1 : 0.7 }}>
                  {selectedVersion || 'Select a saved version...'}
                </span>
                <motion.div
                  animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown size={16} color={primaryColor} />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: `linear-gradient(135deg, ${theme.cardBg}, ${primaryColor}08)`,
                      border: `1px solid ${primaryColor}33`,
                      borderRadius: '12px',
                      boxShadow: `0 8px 32px ${primaryColor}44`,
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000
                    }}
                  >
                    {savedVersions.map((version, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ 
                          backgroundColor: `${primaryColor}22`,
                          x: 4
                        }}
                        onClick={() => handleVersionSelect(version)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'transparent',
                          color: theme.text,
                          fontSize: '14px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          borderRadius: index === 0 ? '12px 12px 0 0' : index === savedVersions.length - 1 ? '0 0 12px 12px' : '0',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: primaryColor,
                          opacity: 0.6
                        }} />
                        {version.hash} – {version.description}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Version Hash Input */}
        <div style={{ marginBottom: '16px', position: 'relative', zIndex: 1 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            color: theme.text, 
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Version Hash:
          </label>
          <input
            type="text"
            value={robloxVersion}
            onChange={(e) => setRobloxVersion(e.target.value)}
            placeholder="Enter Roblox version hash"
            style={{
              width: 'calc(100% - 20px)',
              padding: '12px',
              borderRadius: '12px',
              border: `1px solid ${primaryColor}33`,
              background: `linear-gradient(135deg, ${theme.cardBg}, ${primaryColor}08)`,
              color: theme.text,
              outline: 'none',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              boxShadow: `0 4px 16px ${primaryColor}22`
            }}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRobloxDowngrade}
          disabled={isDownloading}
          style={{
            padding: '12px 24px',
            background: isDownloading ? theme.cardBg : primaryColor,
            border: `1px solid ${primaryColor}22`,
            borderRadius: '12px',
            color: isDownloading ? theme.text : '#FFF',
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            fontWeight: 500,
            opacity: isDownloading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            position: 'relative',
            zIndex: 1
          }}
        >
          {isDownloading ? (
            <>
              <l-ring
                size="20"
                stroke="3"
                bg-opacity="0"
                speed="2"
                color={primaryColor}
              />
              Downloading...
            </>
          ) : (
            <>
              <FiDownload size={20} />
              Downgrade Roblox
            </>
          )}
        </motion.button>

        <h3 style={{ 
          marginBottom: 16,
          color: primaryColor,
          filter: `drop-shadow(0 0 10px ${primaryColor}66)`,
          opacity: 0.8,
          fontSize: '16px',
          position: 'relative',
          zIndex: 1
        }}>Executors</h3>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '16px',
          position: 'relative',
          zIndex: 1
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleClick('Swift', 'https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/Swift.exe')}
            disabled={activeButton === 'Swift'}
            style={{
              padding: '12px 24px',
              background: activeButton === 'Swift' ? theme.cardBg : primaryColor,
              border: 'none',
              borderRadius: '12px',
              color: activeButton === 'Swift' ? theme.text : '#FFF',
              cursor: activeButton === 'Swift' ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: activeButton === 'Swift' ? 0.7 : 1,
              position: 'relative'
            }}
          >
            {activeButton === 'Swift' ? (
              <l-ring
                size="20"
                stroke="3"
                bg-opacity="0"
                speed="2"
                color={primaryColor}
              />
            ) : (
              <FiDownload size={20} />
            )}
            Swift
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleClick('Solara', 'https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/BootstrapperNew.exe')}
            disabled={activeButton === 'Solara'}
            style={{
              padding: '12px 24px',
              background: activeButton === 'Solara' ? theme.cardBg : primaryColor,
              border: 'none',
              borderRadius: '12px',
              color: activeButton === 'Solara' ? theme.text : '#FFF',
              cursor: activeButton === 'Solara' ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: activeButton === 'Solara' ? 0.7 : 1,
              position: 'relative'
            }}
          >
            {activeButton === 'Solara' ? (
              <l-ring
                size="20"
                stroke="3"
                bg-opacity="0"
                speed="2"
                color={primaryColor}
              />
            ) : (
              <FiDownload size={20} />
            )}
            Solara
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '12px 24px',
              background: `${theme.cardBg}`,
              border: `1px solid ${primaryColor}33`,
              borderRadius: '12px',
              color: theme.text,
              cursor: 'not-allowed',
              fontSize: '15px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: 0.6
            }}
          >
            <FiClock size={20} />
            Velocity (Soon...)
          </motion.button>
        </div>

        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: '20px',
                padding: '12px',
                borderRadius: '8px',
                background: theme.cardBg,
                border: `1px solid ${primaryColor}22`,
                position: 'relative',
                zIndex: 1,
                fontSize: '14px',
                color: theme.text
              }}
            >
              {status}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Extra;