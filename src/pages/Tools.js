import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiTool, FiDownload, FiShield, FiTrash2, FiBox } from 'react-icons/fi';
import { invoke } from '@tauri-apps/api/tauri';

const tools = [
  { name: 'WinRAR Crack', function: 'winrar_crack', icon: FiDownload },
  { name: 'WiFi Passwords', function: 'wifi_passwords', icon: FiShield },
  { name: 'Activate Windows', function: 'activate_windows', icon: FiBox },
  { name: 'TFY Optimizations', function: 'run_optimization', icon: FiZap },
  { name: 'Clean Temp Files', function: 'clean_temp', icon: FiTrash2 },
  { name: 'Atlas Tools', function: 'install_atlas_tools', icon: FiTool }
];

const Tools = () => {
  const { theme, primaryColor } = useTheme();
  const [activeButton, setActiveButton] = useState(null);
  const [status, setStatus] = useState('');

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
        padding: '20px 0'
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