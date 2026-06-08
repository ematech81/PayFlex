// constants/colors.js - IMPROVED VERSION

export const colors = {
  light: {
    primary: '#5403f5',
    background: '#f6f6f8',
    buttonBackground: 'rgba(84, 3, 245, 0.1)',
    card: '#FFFFFF',
    heading: '#000000',
    subheading: '#666666',
    subtext: '#999999',
    destructive: '#FF3B30',
    error: '#EF4444',                // Modern error red (new design)
    button: '#5403f5',
    border: '#E5E5EA',
    processing: '#F9FC77',
    success: '#10B981',              // Updated to match new design
    warning: '#FF9500',
    info: '#007AFF',
    neutral: 'rgba(84, 3, 245, 0.08)',

    // New gradient pair (HomeScreen & AirtimeScreen header/buttons)
    gradientStart: '#667EEA',        // Periwinkle blue
    gradientEnd: '#764BA2',          // Purple

    // Additional UI elements
    divider: '#E5E5EA',
    placeholder: '#C7C7CC',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },

  dark: {
    primary: '#8B5CF6',
    background: '#0E1621',
    buttonBackground: 'rgba(139, 92, 246, 0.2)',
    card: '#1A2332',
    heading: '#FFFFFF',
    subheading: '#A8B4C0',
    subtext: '#6B7A8C',
    destructive: '#FF6B6B',
    error: '#EF4444',                // Shared with light — same modern red
    button: '#8B5CF6',
    border: '#2A3441',
    processing: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    neutral: 'rgba(139, 92, 246, 0.1)',

    // New gradient pair (dark mode header)
    gradientStart: '#1a1a2e',        // Deep navy
    gradientEnd: '#16213e',          // Darker navy

    // Additional UI elements
    divider: '#2A3441',
    placeholder: '#4A5568',
    shadow: 'rgba(0, 0, 0, 0.3)',

    messageOut: '#8B5CF6',
    messageIn: '#1F2937',
    online: '#10B981',
    typing: '#6B7A8C',
  },
};

// ✅ Optional: Export theme utilities
export const getThemedColor = (colorKey, isDarkMode) => {
  return isDarkMode ? colors.dark[colorKey] : colors.light[colorKey];
};

// ✅ Optional: Export semantic colors
export const semanticColors = {
  error: (isDarkMode) => isDarkMode ? '#FF6B6B' : '#FF3B30',
  success: (isDarkMode) => isDarkMode ? '#10B981' : '#34C759',
  warning: (isDarkMode) => isDarkMode ? '#F59E0B' : '#FF9500',
  info: (isDarkMode) => isDarkMode ? '#3B82F6' : '#007AFF',
};



