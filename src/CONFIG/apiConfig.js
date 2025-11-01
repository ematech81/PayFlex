

/**
 * Central API Configuration
 * Manages all API endpoints and request settings
 */

// Base URL - To be updated this for production
const BASE_URL = __DEV__ 
  ? 'http://192.168.43.191:5000/api' 
  // ? 'http://192.168.100.210:5000/api' 
  : 'https://your-production-api.com/api';

export const API_CONFIG = {
  BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  
  ENDPOINTS: {
    // Payment endpoints
    PAYMENTS: {
      BASE: '/payments',
      BUY_AIRTIME: '/payments/buy-airtime',
      BUY_DATA: '/payments/buy-data',
      PAY_TV: '/payments/pay-tv',
      PAY_ELECTRICITY: '/payments/pay-electricity',      
      VERIFY_METER: '/payments/verify-meter',            
      ELECTRICITY_TARIFF: '/payments/electricity/tariff', 
      PAY_EDUCATION: '/payments/pay-education',
      PAY_BETTING: '/payments/pay-betting',
      VERIFY_PIN: '/payments/verify-transaction-pin',
      VERIFY_TRANSACTION: '/payments/verify-transaction',
      TRANSACTION_HISTORY: '/payments/history',
    },
    
    // Data plan endpoints
    DATA_PLANS: '/payments/data-plans',
    
    // Verification endpoints
    VERIFY_METER: '/payments/verify-meter',
    VERIFY_SMARTCARD: '/payments/verify-smartcard',
  },
};

/**
 * Create authorization header
 * @param {string} token - JWT token
 * @returns {Object} Header object
 */
export const createAuthHeader = (token) => {
  if (!token) {
    console.warn('No token provided for auth header');
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Create request config with auth
 * @param {string} token - JWT token
 * @param {Object} additionalConfig - Additional axios config
 * @returns {Object} Axios config object
 */
export const createRequestConfig = (token, additionalConfig = {}) => ({
  headers: createAuthHeader(token),
  timeout: API_CONFIG.TIMEOUT,
  ...additionalConfig,
});