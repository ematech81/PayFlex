
// constants/services/electricity.constants.js

/**
 * Electricity Service Constants
 */

export const ELECTRICITY_CONSTANTS = {
  SERVICE_TYPE: 'electricity',
  SERVICE_NAME: 'Electricity',
  
  // Meter Types
  METER_TYPES: [
    { label: 'Prepaid', value: 'prepaid' },
    { label: 'Postpaid', value: 'postpaid' },
  ],
  
  // Amount limits
  LIMITS: {
    MIN_AMOUNT: 500,
    MAX_AMOUNT: 100000,
  },
  
  // Quick amount presets (in Naira)
  QUICK_AMOUNTS: [
    { value: '1000', label: '₦1,000' },
    { value: '2000', label: '₦2,000' },
    { value: '5000', label: '₦5,000' },
    { value: '10000', label: '₦10,000' },
    { value: '15000', label: '₦15,000' },
    { value: '20000', label: '₦20,000' },
  ],
  
  // Validation
  VALIDATION: {
    METER_REGEX: /^\d{10,13}$/,
    METER_MIN_LENGTH: 10,
    METER_MAX_LENGTH: 13,
    PHONE_REGEX: /^\d{11}$/,
  },
  
  // Error messages
  ERROR_MESSAGES: {
    INVALID_METER: 'Please enter a valid meter number (10-13 digits)',
    NO_DISCO: 'Please select a distribution company',
    NO_METER_TYPE: 'Please select meter type (Prepaid/Postpaid)',
    INVALID_AMOUNT: 'Please enter a valid amount',
    AMOUNT_TOO_LOW: 'Minimum amount is ₦500',
    AMOUNT_TOO_HIGH: 'Maximum amount is ₦100,000',
    INVALID_PHONE: 'Please enter a valid phone number',
    METER_NOT_VERIFIED: 'Please verify meter number first',
    VERIFICATION_FAILED: 'Could not verify meter number',
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    METER_VERIFIED: 'Meter verified successfully',
    PAYMENT_SUCCESSFUL: 'Electricity payment successful',
  },
};