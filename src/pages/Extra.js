import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { FiDownload, FiRefreshCw, FiClock } from 'react-icons/fi';


const Extra = () => {
  const { theme, primaryColor } = useTheme();
  const [status, setStatus] = useState('');
  const [robloxVersion, setRobloxVersion] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [activeButton, setActiveButton] = useState(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/DragosKissLove/testbot/main/versions.json')
      .then(res => res.json())
      .then(data => setVersions(data))
      .catch(err => console.error('Failed to fetch versions:', err));
  }, []);

  // ✅ Aici pui funcția handleClick:
  const handleClick = async (name, url) => {
    try {
      setActiveButton(name);
      setStatus('Downloading...');
      
      const result = await window.electron.runFunction('downloadAndRun', [name, url]);
      setStatus(result || `${name} has been downloaded and started`);
    } catch (error) {
      setStatus(`❌ Error downloading ${name}: ${error}`);
    } finally {
      setActiveButton(null);
    }
  };

  // ✅ Aici pui funcția handleRobloxDowngrade:
  const handleRobloxDowngrade = async () => {
    if (!robloxVersion) {
      setStatus('Please enter a version hash');
      return;
    }

    try {
      setIsDownloading(true);
      setStatus('Starting Roblox downgrade...');

      const result = await window.electron.downloadRobloxPlayer(robloxVersion, (message) => setStatus(message));


      setStatus(result || '✅ Roblox downgrade completed successfully!');
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
    } finally {
      setIsDownloading(false);
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
        border: `1px solid ${theme.border}`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <h3 style={{ 
          marginBottom: 16,
          color: primaryColor,
          filter: `drop-shadow(0 0 10px ${primaryColor}66)`
        }}>Roblox Downgrade</h3>

        <div style={{
          marginBottom: '20px',
          fontSize: '12px',
          opacity: 0.4,
          color: theme.text,
          fontFamily: 'monospace'
        }}>
          {versions.map((v, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              {v.version}: {v.hash}
            </div>
          ))}
        </div>

        <input
          type="text"
          value={robloxVersion}
          onChange={(e) => setRobloxVersion(e.target.value)}
          placeholder="Enter Roblox version hash"
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            borderRadius: '8px',
            border: `1px solid ${primaryColor}33`,
            background: theme.cardBg,
            color: theme.text,
            outline: 'none'
          }}
        />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRobloxDowngrade}
          disabled={isDownloading}
          style={{
            padding: '12px 24px',
            background: isDownloading ? theme.cardBg : primaryColor,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            color: isDownloading ? theme.text : '#FFF',
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            fontWeight: 500,
            opacity: isDownloading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}
        >
          {isDownloading ? (
            <>
              <FiRefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
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
          fontSize: '16px'
        }}>Executors</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
              opacity: activeButton === 'Swift' ? 0.7 : 1
            }}
          >
            {activeButton === 'Swift' ? (
              <FiRefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
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
              opacity: activeButton === 'Solara' ? 0.7 : 1
            }}
          >
            {activeButton === 'Solara' ? (
              <FiRefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
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
                border: `1px solid ${theme.border}`
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