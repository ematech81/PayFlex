
// constants/services/airtime.constants.js

/**
 * Airtime Service Constants
 */

export const AIRTIME_CONSTANTS = {
  // Service type
  SERVICE_TYPE: 'airtime',
  SERVICE_NAME: 'Airtime',
  
  // Tabs
  TABS: {
    LOCAL: 'Local',
    INTERNATIONAL: 'International',
  },
  
  // Quick amount presets (in Naira)
  QUICK_AMOUNTS: [
    { value: '50', label: '₦50' },
    { value: '100', label: '₦100' },
    { value: '200', label: '₦200' },
    { value: '500', label: '₦500' },
    { value: '1000', label: '₦1,000' },
    { value: '2000', label: '₦2,000' },
  ],
  
  // Amount limits
  LIMITS: {
    MIN_AMOUNT: 50,
    MAX_AMOUNT: 50000,
    MIN_INTERNATIONAL: 500,
    MAX_INTERNATIONAL: 100000,
  },
  
  // Validation
  VALIDATION: {
    PHONE_REGEX: /^\d{11}$/,
    PHONE_LENGTH: 11,
    INTERNATIONAL_PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  },
  
  // Error messages
  ERROR_MESSAGES: {
    INVALID_PHONE: 'Please enter a valid 11-digit phone number',
    INVALID_INTERNATIONAL_PHONE: 'Please enter a valid international phone number',
    NO_PROVIDER: 'Please select a service provider',
    INVALID_AMOUNT: 'Please enter a valid amount',
    AMOUNT_TOO_LOW: 'Minimum amount is ₦50',
    AMOUNT_TOO_HIGH: 'Maximum amount is ₦50,000',
    INSUFFICIENT_BALANCE: 'Insufficient wallet balance',
    NETWORK_ERROR: 'Network error. Please try again',
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    PURCHASE_SUCCESSFUL: 'Airtime purchase successful',
    PIN_VERIFIED: 'Transaction PIN verified',
  },
};