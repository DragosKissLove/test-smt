import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { FiCheck, FiX, FiAlertTriangle, FiInfo } from 'react-icons/fi';

const NotificationSystem = () => {
  const { theme, primaryColor } = useTheme();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNotification = (event) => {
      const { type, title, message, duration = 4000 } = event.detail;
      const id = Date.now() + Math.random();
      
      const notification = {
        id,
        type,
        title,
        message,
        duration
      };

      setNotifications(prev => [...prev, notification]);

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    };

    window.addEventListener('showNotification', handleNotification);
    return () => window.removeEventListener('showNotification', handleNotification);
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return FiCheck;
      case 'error': return FiX;
      case 'warning': return FiAlertTriangle;
      default: return FiInfo;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success': return { bg: '#10B981', border: '#059669' };
      case 'error': return { bg: '#EF4444', border: '#DC2626' };
      case 'warning': return { bg: '#F59E0B', border: '#D97706' };
      default: return { bg: primaryColor, border: primaryColor };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none'
    }}>
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = getIcon(notification.type);
          const colors = getColors(notification.type);
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.4
              }}
              style={{
                background: `linear-gradient(135deg, ${colors.bg}22, ${colors.bg}11)`,
                border: `1px solid ${colors.border}44`,
                borderRadius: '12px',
                padding: '16px',
                minWidth: '300px',
                maxWidth: '400px',
                boxShadow: `0 8px 32px ${colors.bg}33, 0 0 0 1px ${colors.border}22`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                pointerEvents: 'auto',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Animated background glow */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at center, ${colors.bg}22 0%, transparent 70%)`,
                  pointerEvents: 'none'
                }}
              />

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                position: 'relative',
                zIndex: 1
              }}>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: colors.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 0 16px ${colors.bg}66`
                  }}
                >
                  <Icon size={18} color="#fff" />
                </motion.div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <motion.h4
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#fff',
                      marginBottom: '4px',
                      filter: `drop-shadow(0 0 8px ${colors.bg}66)`
                    }}
                  >
                    {notification.title}
                  </motion.h4>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: '1.4',
                      wordBreak: 'break-word'
                    }}
                  >
                    {notification.message}
                  </motion.p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeNotification(notification.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FiX size={16} />
                </motion.button>
              </div>

              {/* Progress bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ 
                  duration: notification.duration / 1000,
                  ease: "linear"
                }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: colors.bg,
                  transformOrigin: 'left',
                  opacity: 0.7
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Helper function to show notifications
export const showNotification = (type, title, message, duration = 4000) => {
  const event = new CustomEvent('showNotification', {
    detail: { type, title, message, duration }
  });
  window.dispatchEvent(event);
};

export default NotificationSystem;