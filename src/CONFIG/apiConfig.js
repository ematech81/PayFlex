

/**
 * Central API Configuration
 * Manages all API endpoints and request settings
 */
 
import { PaymentApiIPAddress } from "utility/apiIPAdress";

// import { PaymentApiIPAddress} from "utility/apiIPAdress";

// Base URL - To be updated this for production
const BASE_URL = __DEV__ 
  ? PaymentApiIPAddress 
  : 'https://your-production-api.com/api';

export const API_CONFIG = {
  BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  
  ENDPOINTS: {
    // Payment endpoints
    PAYMENTS: {
      // BASE: '/payments',
      BUY_AIRTIME: '/buy-airtime',
      BUY_DATA: '/buy-data',
      PAY_TV: '/pay-tv',
      PAY_ELECTRICITY: '/pay-electricity',      
      VERIFY_METER: '/verify-meter',            
      ELECTRICITY_TARIFF: '/electricity/tariff', 
      PAY_EDUCATION: '/pay-education',
      PAY_BETTING: '/pay-betting',
      VERIFY_PIN: '/verify-transaction-pin',
      VERIFY_TRANSACTION: '/verify-transaction',
      TRANSACTION_HISTORY: '/history',
    },
    
    // Data plan endpoints
    DATA_PLANS: '/data-plans',
    
    // Verification endpoints
    VERIFY_METER: '/verify-meter',
    VERIFY_SMARTCARD: '/verify-smartcard',
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