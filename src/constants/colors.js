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
    button: '#5403f5',
    border: '#E5E5EA',
    processing: '#F9FC77',
    success: '#34C759',
    warning: '#FF9500',
    info: '#007AFF',
    neutral: 'rgba(84, 3, 245, 0.08)',
    
    // Additional UI elements
    divider: '#E5E5EA',
    placeholder: '#C7C7CC',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  dark: {
    // Telegram-inspired dark theme
    primary: '#8B5CF6',              // Softer purple for dark mode
    background: '#0E1621',           // Deep blue-black (Telegram-like)
    buttonBackground: 'rgba(139, 92, 246, 0.2)',
    card: '#1A2332',                 // Slightly lighter than background
    heading: '#FFFFFF',              // Pure white for contrast
    subheading: '#A8B4C0',           // Soft blue-gray
    subtext: '#6B7A8C',              // Muted blue-gray
    destructive: '#FF6B6B',          // Softer red
    button: '#8B5CF6',
    border: '#2A3441',               // Subtle border
    processing: '#F59E0B',           // Warm amber
    success: '#10B981',              // Soft green
    warning: '#F59E0B',              // Amber
    info: '#3B82F6',                 // Soft blue
    neutral: 'rgba(139, 92, 246, 0.1)',
    
    // Additional UI elements
    divider: '#2A3441',
    placeholder: '#4A5568',
    shadow: 'rgba(0, 0, 0, 0.3)',
    
    // Telegram-specific
    messageOut: '#8B5CF6',           // Sent message bubble
    messageIn: '#1F2937',            // Received message bubble
    online: '#10B981',               // Online indicator
    typing: '#6B7A8C',               // Typing indicator
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



// export const colors = {
//   light: {
//     primary: '#5403f5ff',
//     background: '#f6f6f8',
//     buttonBackground: 'rgba(84, 3, 245, 0.1)', 
//     card: '#FFFFFF',
//     heading: '#333',
//     subheading: '#666',
//     subtext: '#999',
//     destructive: '#ff3b30',
//     button: '#007AFF',
//     border: '#ccc',
//     processing: '#f9fc77ff',

//     // neutral: 'rgba(74,0,224,0.08)',
//   },
  
  
//   dark: {
//     primary: '#6b5bff',
//     background: '#171e28',
//     buttonBackground: 'rgba(107, 91, 255, 0.3)',
//     card: '#1c252c',
//     heading: '#fff',
//     subheading: '#ccc',
//     subtext: '#999',
//     destructive: '#ff6b6b',
//     button: '#4a90e2',
//     processing: '#eef108ff',

//     neutral: 'rgba(74,0,224,0.03)',
//   },
// };
