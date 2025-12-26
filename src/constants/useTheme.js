// constants/useTheme.js - UPDATED VERSION

import { useTheme } from 'context/ThemeContext';

/**
 * Backward compatible hook
 * Returns boolean for isDarkMode
 */
export const useThem = () => {
  const { isDarkMode } = useTheme();
  return isDarkMode;
};

