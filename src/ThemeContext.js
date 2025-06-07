import React, { createContext, useContext, useState, useEffect } from 'react';

const darkTheme = {
  background: '#0A0A0A',
  text: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  hover: 'rgba(255, 255, 255, 0.1)',
  shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  accent: '#DC2626'
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState(() => {
    const savedColor = localStorage.getItem('primaryColor');
    return savedColor || '#DC2626'; // Changed to red
  });

  useEffect(() => {
    localStorage.setItem('primaryColor', primaryColor);
  }, [primaryColor]);

  const theme = {
    ...darkTheme,
    primary: primaryColor
  };

  return (
    <ThemeContext.Provider value={{ theme, primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);