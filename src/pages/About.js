import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { FiDownload, FiZap, FiTool } from 'react-icons/fi';

const Info = () => {
  const { theme, primaryColor } = useTheme();

  const features = [
    {
      icon: FiDownload,
      title: "One-Click Installers",
      description: "Quick and easy installation of popular applications"
    },
    {
      icon: FiZap,
      title: "Performance Boosters",
      description: "Advanced tools to enhance your system's speed"
    },
    {
      icon: FiTool,
      title: "System Utilities",
      description: "Essential tools for system maintenance and optimization"
    }
  ];

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
        marginBottom: '30px',
        color: theme.text,
        borderBottom: `2px solid ${primaryColor}`,
        paddingBottom: '10px',
        display: 'inline-block',
        position: 'relative'
      }}>
        Info
      </h2>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '32px',
        borderRadius: '20px',
        border: `1px solid ${primaryColor}22`,
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 0%'],
            opacity: [0.5, 1, 0.5]
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
            borderRadius: '20px',
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            textAlign: 'center',
            marginBottom: '30px',
            position: 'relative',
            zIndex: 1
          }}
        >
          <h3 style={{ 
            fontSize: '24px',
            marginBottom: '16px',
            color: primaryColor,
            filter: `drop-shadow(0 0 10px ${primaryColor}66)`
          }}>
            Welcome to TFY Tool 2025
          </h3>
          <p style={{ 
            fontSize: '16px',
            lineHeight: '1.6',
            color: theme.text,
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Your all-in-one solution for system optimization and application management
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginTop: '30px',
          position: 'relative',
          zIndex: 1
        }}>
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              style={{
                padding: '20px',
                background: `linear-gradient(145deg, rgba(255, 255, 255, 0.05), ${primaryColor}11)`,
                borderRadius: '12px',
                border: `1px solid ${primaryColor}22`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'center'
              }}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.5 }}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}44)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 20px ${primaryColor}33`
                }}
              >
                <feature.icon size={24} color={primaryColor} />
              </motion.div>
              <h4 style={{ 
                fontSize: '18px',
                color: theme.text,
                marginBottom: '8px'
              }}>
                {feature.title}
              </h4>
              <p style={{ 
                fontSize: '14px',
                color: `${theme.text}cc`,
                lineHeight: '1.4'
              }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Info;