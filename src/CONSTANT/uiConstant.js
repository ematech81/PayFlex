

import { Dimensions } from 'react-native';

/**
 * UI Constants - Dimensions, Spacing, etc.
 */

const { width, height } = Dimensions.get('window');

export const UI_CONSTANTS = {
  // Screen dimensions
  SCREEN: {
    WIDTH: width,
    HEIGHT: height,
    IS_SMALL_DEVICE: width < 375,
    IS_LARGE_DEVICE: width >= 768,
  },
  
  // Spacing
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
  },
  
  // Border radius
  RADIUS: {
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 20,
    ROUND: 9999,
  },
  
  // Font sizes
  FONT_SIZE: {
    XS: 12,
    SM: 13,
    MD: 14,
    LG: 16,
    XL: 18,
    XXL: 20,
    XXXL: 24,
  },
  
  // Icon sizes
  ICON_SIZE: {
    SM: 16,
    MD: 20,
    LG: 24,
    XL: 28,
    XXL: 32,
  },
  
  // Animation durations (ms)
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Z-index layers
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL: 2000,
    TOAST: 3000,
    LOADING: 4000,
  },
};

/**
 * Modal sizing
 */
export const MODAL_SIZES = {
  SM: {
    width: width * 0.8,
    maxHeight: height * 0.4,
  },
  MD: {
    width: width * 0.9,
    maxHeight: height * 0.6,
  },
  LG: {
    width: width * 0.95,
    maxHeight: height * 0.8,
  },
};

