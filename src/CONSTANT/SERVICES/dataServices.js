
// constants/services/data.constants.js

/**
 * Data Service Constants
 */

export const DATA_CONSTANTS = {
  SERVICE_TYPE: 'data',
  SERVICE_NAME: 'Data Bundle',
  
  // Data types
  DATA_TYPES: {
    SME: 'SME',
    GIFTING: 'Gifting',
    CORPORATE_GIFTING: 'Corporate Gifting',
    DIRECT: 'Direct',
  },
  
  // Validation
  VALIDATION: {
    PHONE_REGEX: /^\d{11}$/,
    PHONE_LENGTH: 11,
  },
  
  // Plan categories (for UI grouping)
  PLAN_CATEGORIES: {
    DAILY: 'Daily Plans',
    WEEKLY: 'Weekly Plans',
    MONTHLY: 'Monthly Plans',
    YEARLY: 'Yearly Plans',
  },
  
  ERROR_MESSAGES: {
    INVALID_PHONE: 'Please enter a valid 11-digit phone number',
    NO_PROVIDER: 'Please select a network provider',
    NO_PLAN_SELECTED: 'Please select a data plan',
    PLAN_LOAD_FAILED: 'Failed to load data plans',
    INSUFFICIENT_BALANCE: 'Insufficient wallet balance',
  },
  
  SUCCESS_MESSAGES: {
    PURCHASE_SUCCESSFUL: 'Data bundle purchase successful',
  },
};