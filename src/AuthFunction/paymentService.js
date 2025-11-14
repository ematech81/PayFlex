
// src/services/PaymentService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaymentApiIPAddress } from 'utility/apiIPAdress';
import { STORAGE_KEYS } from 'utility/storageKeys';

// ---------- Configuration ----------
const BASE_URL = PaymentApiIPAddress;
const REQUEST_TIMEOUT = 30000; // 30 seconds for payment operations

// ---------- Helper Functions ----------

/**
 * Creates fetch request with timeout
 */
const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection.');
    }
    throw error;
  }
};

/**
 * Handles API response and errors consistently
 */
// const handleResponse = async (response) => {
//   // ✅ Log everything for debugging
//   console.log('📥 Response Status:', response.status);
//   console.log('📥 Response Headers:', response.headers);
//   console.log('📥 Content-Type:', response.headers.get('content-type'));
  
//   // Get raw text first
//   const text = await response.text();
//   console.log('📥 Raw Response:', text.substring(0, 500)); // First 500 chars
  
//   const contentType = response.headers.get('content-type');
  
//   // Check if response is JSON
//   if (!contentType || !contentType.includes('application/json')) {
//     console.error('❌ Expected JSON but got:', contentType);
//     console.error('❌ Response body:', text);
//     throw new Error('Server returned invalid response format');
//   }

//   // Try to parse JSON
//   let data;
//   try {
//     data = JSON.parse(text);
//   } catch (error) {
//     console.error('❌ JSON Parse Error:', error.message);
//     console.error('❌ Response text:', text);
//     throw new Error('Server returned invalid response format');
//   }

//   // For non-2xx responses, throw error with message
//   if (!response.ok) {
//     throw new Error(data.message || `Request failed with status ${response.status}`);
//   }

//   return data;
// };


const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  // Check if response is JSON
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server returned invalid response format');
  }

  const data = await response.json();

  // For non-2xx responses, throw error with message
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

/**
 * Makes authenticated payment request
 * @param {string} endpoint - API endpoint (e.g., '/buy-airtime', '/buy-data')
 * @param {object} paymentData - Payment data to send
 * @returns {Promise<object>} API response
 */
const makePaymentRequest = async (endpoint, paymentData) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    console.log('📤 Request URL:', `${BASE_URL}${endpoint}`);
    console.log('📤 Request Body:', JSON.stringify(paymentData, null, 2));
    console.log('📤 Token exists:', !!token);
    
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    const result = await handleResponse(response);
    console.log('✅ Payment request successful:', result);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Payment Error [${endpoint}]:`, error.message);
    throw error;
  }
};



// ---------- Payment Service Methods ----------

/**
 * Purchase airtime
 * @param {string} pin - Transaction PIN
 * @param {object} paymentData - Airtime payment data
 * @returns {Promise<object>} Purchase result
 */
export const purchaseAirtime = async (pin, paymentData) => {
  return makePaymentRequest('/buy-airtime', {
    phoneNumber: paymentData.phoneNumber,
    provider: paymentData.provider,
    amount: paymentData.amount,
    pin,
  });
};

/**
 * Purchase data bundle
 * @param {string} pin - Transaction PIN
 * @param {object} paymentData - Data payment data
 * @returns {Promise<object>} Purchase result
 */
export const purchaseData = async (pin, paymentData) => {

  console.log('🔐 PIN received in purchaseData:', pin);
  console.log('📦 Payment data received:', paymentData);
  
  return makePaymentRequest('/buy-data', {
    phoneNumber: paymentData.phoneNumber,
    provider: paymentData.provider,
    variation_code: paymentData.planId, // ✅ Changed from planId to variation_code
    amount: paymentData.planAmount || paymentData.amount,
    pin,
  });

};

/**
 * Pay electricity bill
 * @param {string} pin - Transaction PIN
 * @param {object} paymentData - Electricity payment data
 * @returns {Promise<object>} Payment result
 */
export const payElectricityBill = async (pin, paymentData) => {
  return makePaymentRequest('/pay-electricity', {
    meterNumber: paymentData.meterNumber,
    disco: paymentData.disco,
    meterType: paymentData.meterType,
    amount: paymentData.amount,
    phoneNumber: paymentData.phoneNumber,
    pin,
  });
};

/**
 * Pay cable TV subscription
 * @param {string} pin - Transaction PIN
 * @param {object} paymentData - Cable TV payment data
 * @returns {Promise<object>} Payment result
 */
export const payCableTVSubscription = async (pin, paymentData) => {
  return makePaymentRequest('/pay-cable-tv', {
    smartCardNumber: paymentData.smartCardNumber,
    provider: paymentData.provider,
    package: paymentData.package,
    amount: paymentData.amount,
    pin,
  });
};

/**
 * Pay internet subscription
 * @param {string} pin - Transaction PIN
 * @param {object} paymentData - Internet payment data
 * @returns {Promise<object>} Payment result
 */
export const payInternetSubscription = async (pin, paymentData) => {
  return makePaymentRequest('/pay-internet', {
    accountNumber: paymentData.accountNumber,
    provider: paymentData.provider,
    package: paymentData.package,
    amount: paymentData.amount,
    pin,
  });
};

/**
 * Verify meter number
 * @param {object} meterData - Meter verification data
 * @returns {Promise<object>} Verification result
 */
export const verifyMeter = async (meterData) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetchWithTimeout(`${BASE_URL}/verify-meter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(meterData),
    });

    return await handleResponse(response);
    
  } catch (error) {
    console.error('❌ Meter verification error:', error.message);
    throw error;
  }
};

/**
 * Verify smart card number
 * @param {object} cardData - Card verification data
 * @returns {Promise<object>} Verification result
 */
export const verifySmartCard = async (cardData) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetchWithTimeout(`${BASE_URL}/verify-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cardData),
    });

    return await handleResponse(response);
    
  } catch (error) {
    console.error('❌ Card verification error:', error.message);
    throw error;
  }
};

/**
 * Get transaction history
 * @param {object} filters - Filter parameters
 * @returns {Promise<object>} Transaction history
 */
export const getTransactionHistory = async (filters = {}) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const queryParams = new URLSearchParams(filters).toString();
    const url = `${BASE_URL}/transactions${queryParams ? `?${queryParams}` : ''}`;

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return await handleResponse(response);
    
  } catch (error) {
    console.error('❌ Transaction history error:', error.message);
    throw error;
  }
};

/**
 * Get transaction details
 * @param {string} reference - Transaction reference
 * @returns {Promise<object>} Transaction details
 */
export const getTransactionDetails = async (reference) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetchWithTimeout(`${BASE_URL}/transactions/${reference}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return await handleResponse(response);
    
  } catch (error) {
    console.error('❌ Transaction details error:', error.message);
    throw error;
  }
};

// Export the service
export default {
  purchaseAirtime,
  purchaseData,
  payElectricityBill,
  payCableTVSubscription,
  payInternetSubscription,
  verifyMeter,
  verifySmartCard,
  getTransactionHistory,
  getTransactionDetails,
};