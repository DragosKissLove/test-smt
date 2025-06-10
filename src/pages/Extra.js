import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { FiDownload, FiRefreshCw, FiClock, FiSettings } from 'react-icons/fi';
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
  const [selectedChannel, setSelectedChannel] = useState('LIVE');
  const [selectedBinaryType, setSelectedBinaryType] = useState('WindowsPlayer');

  const channels = ['LIVE', 'zcanary', 'zintegration'];
  const binaryTypes = [
    { value: 'WindowsPlayer', label: 'Windows Player' },
    { value: 'WindowsStudio64', label: 'Windows Studio 64' },
    { value: 'MacPlayer', label: 'Mac Player' },
    { value: 'MacStudio', label: 'Mac Studio' }
  ];

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
        version_hash: robloxVersion,
        channel: selectedChannel,
        binary_type: selectedBinaryType
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

  const handleVersionSelect = (event) => {
    const selectedVersion = event.target.value;
    if (selectedVersion) {
      const version = savedVersions.find(v => `${v.hash} – ${v.description}` === selectedVersion);
      if (version) {
        setRobloxVersion(version.hash);
      }
    }
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
        }}>Roblox Downgrade</h3>

        {/* Channel Selection */}
        <div style={{ marginBottom: '16px', position: 'relative', zIndex: 1 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            color: theme.text, 
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Channel:
          </label>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${primaryColor}33`,
              background: theme.cardBg,
              color: theme.text,
              outline: 'none',
              fontSize: '14px'
            }}
          >
            {channels.map(channel => (
              <option key={channel} value={channel}>{channel}</option>
            ))}
          </select>
        </div>

        {/* Binary Type Selection */}
        <div style={{ marginBottom: '16px', position: 'relative', zIndex: 1 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            color: theme.text, 
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Binary Type:
          </label>
          <select
            value={selectedBinaryType}
            onChange={(e) => setSelectedBinaryType(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${primaryColor}33`,
              background: theme.cardBg,
              color: theme.text,
              outline: 'none',
              fontSize: '14px'
            }}
          >
            {binaryTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Saved Versions Dropdown */}
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
            <select
              onChange={handleVersionSelect}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: `1px solid ${primaryColor}33`,
                background: theme.cardBg,
                color: theme.text,
                outline: 'none',
                fontSize: '14px',
                maxHeight: '200px'
              }}
            >
              <option value="">Select a saved version...</option>
              {savedVersions.map((version, index) => (
                <option key={index} value={`${version.hash} – ${version.description}`}>
                  {version.hash} – {version.description}
                </option>
              ))}
            </select>
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
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${primaryColor}33`,
              background: theme.cardBg,
              color: theme.text,
              outline: 'none',
              fontSize: '14px'
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