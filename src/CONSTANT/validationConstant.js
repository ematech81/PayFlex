


/**
 * Shared Validation Constants
 */

export const VALIDATION_CONSTANTS = {
  // PIN validation
  PIN: {
    LENGTH: 4,
    REGEX: /^\d{4}$/,
    ERROR_MESSAGE: 'Please enter a valid 4-digit PIN',
  },
  
  // Phone validation
  PHONE: {
    LENGTH: 11,
    REGEX: /^\d{11}$/,
    INTERNATIONAL_REGEX: /^\+?[1-9]\d{1,14}$/,
    ERROR_MESSAGE: 'Please enter a valid phone number',
  },
  
  // Amount validation
  AMOUNT: {
    MIN: 50,
    MAX: 1000000,
    REGEX: /^\d+(\.\d{1,2})?$/,
    ERROR_MESSAGE: 'Please enter a valid amount',
  },
  
  // Meter number validation (Electricity)
  METER: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 13,
    REGEX: /^\d{10,13}$/,
    ERROR_MESSAGE: 'Please enter a valid meter number',
  },
  
  // Smartcard validation (TV)
  SMARTCARD: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 11,
    REGEX: /^\d{10,11}$/,
    ERROR_MESSAGE: 'Please enter a valid smartcard number',
  },
  
  // Email validation
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    ERROR_MESSAGE: 'Please enter a valid email address',
  },
};

/**
 * Common validation error messages
 */
export const COMMON_ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  INSUFFICIENT_BALANCE: 'Insufficient wallet balance',
  PIN_NOT_SET: 'Transaction PIN not set',
  INVALID_PIN: 'Invalid transaction PIN',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  TIMEOUT: 'Request timeout. Please try again',
};