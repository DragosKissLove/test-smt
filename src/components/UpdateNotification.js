import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';

const UpdateNotification = ({ updateInfo, onInstall, downloadProgress }) => {
  const { theme, primaryColor } = useTheme();

  return (
    <AnimatePresence>
      {updateInfo && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: theme.cardBg,
            borderRadius: 12,
            padding: 20,
            boxShadow: `0 0 20px ${primaryColor}40`,
            border: `1px solid ${primaryColor}33`,
            maxWidth: 300,
            zIndex: 1000
          }}
        >
          <div style={{ marginBottom: 15 }}>
            <h3 style={{ 
              color: primaryColor,
              marginBottom: 8,
              fontSize: 18,
              fontWeight: 600
            }}>
              Update Available!
            </h3>
            <p style={{ 
              color: theme.text,
              fontSize: 14,
              opacity: 0.8
            }}>
              Version {updateInfo.version} is ready to install
            </p>
          </div>

          {downloadProgress !== null && (
            <div style={{ marginBottom: 15 }}>
              <div style={{
                height: 4,
                background: `${primaryColor}33`,
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${downloadProgress}%` }}
                  style={{
                    height: '100%',
                    background: primaryColor,
                    borderRadius: 2
                  }}
                />
              </div>
              <p style={{ 
                color: theme.text,
                fontSize: 12,
                opacity: 0.6,
                marginTop: 4,
                textAlign: 'center'
              }}>
                {downloadProgress}% Downloaded
              </p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onInstall}
            style={{
              width: '100%',
              padding: '10px',
              background: primaryColor,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {downloadProgress === null ? (
              <>
                <FiDownload />
                Download & Install
              </>
            ) : downloadProgress === 100 ? (
              <>
                <FiRefreshCw />
                Restart to Install
              </>
            ) : (
              <>
                <FiDownload />
                Downloading...
              </>
            )}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotification;