
// context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { STORAGE_KEYS } from 'utility/storageKeys';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Apply theme based on mode
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  // Load theme preference from storage
  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
      
      if (savedTheme) {
        setThemeMode(savedTheme);
      } else {
        // Default to system
        setThemeMode('system');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      setThemeMode('system');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply theme based on selected mode
  const applyTheme = (mode) => {
    if (mode === 'system') {
      // Follow system preference
      const systemColorScheme = Appearance.getColorScheme();
      setIsDarkMode(systemColorScheme === 'dark');

      // Listen for system theme changes
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setIsDarkMode(colorScheme === 'dark');
      });

      return () => subscription.remove();
    } else {
      // Use manual preference
      setIsDarkMode(mode === 'dark');
    }
  };

  // Change theme mode
  const setTheme = async (mode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
      setThemeMode(mode);
      console.log('✅ Theme changed to:', mode);
    } catch (error) {
      console.error('❌ Failed to save theme preference:', error);
    }
  };

  const value = {
    themeMode,
    isDarkMode,
    isLoading,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  
  return context;
};