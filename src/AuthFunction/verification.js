// AuthFunction/verificationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NINApiIPAddress } from 'utility/apiIPAdress';
import { STORAGE_KEYS } from 'utility/storageKeys';

// Base URL
const BASE_URL = NINApiIPAddress;
const REQUEST_TIMEOUT = 30000;

/**
 * Fetch with timeout
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
 * Handle API Response
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server returned invalid response format');
  }

  if (response.status === 304) {
    console.log('⚠️ 304 Not Modified - using cached data');
    return { success: true, data: {} };
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  if (data.success === false) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

/**
 * Make authenticated verification request
 */
const makeVerificationRequest = async (endpoint, requestData) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    console.log('📤 Verification Request:', endpoint, requestData);

    const response = await fetchWithTimeout(
      `${BASE_URL}${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      }
    );

    const result = await handleResponse(response);
    console.log('✅ Verification Response:', result);

    return result;
  } catch (error) {
    console.error(`❌ Verification Error [${endpoint}]:`, error.message);
    throw error;
  }
};

// ============================================
// NIN VERIFICATION SERVICES
// ============================================

/**
 * Verify NIN by Number
 * @param {string} pin - 4-digit transaction PIN
 * @param {object} paymentData - { nin: string }
 * @returns {Promise<Object>} Verification result
 */
export const verifyNIN = async (pin, paymentData) => {
  return makeVerificationRequest('/verification/verify-nin', {
    nin: paymentData.nin,
    pin,
  });
};

/**
 * Search NIN by Phone Number (₦200)
 * @param {string} pin - 4-digit transaction PIN
 * @param {object} paymentData - { phone: string }
 * @returns {Promise<Object>} Search result
 */
export const searchNINByPhone = async (pin, paymentData) => {
  return makeVerificationRequest('/verification/nin-by-phone', {
    phone: paymentData.phone,
    pin,
  });
};

/**
 * Search NIN by Tracking ID (₦200)
 * @param {string} pin - 4-digit transaction PIN
 * @param {object} paymentData - { trackingId: string }
 * @returns {Promise<Object>} Search result
 */
export const searchNINByTracking = async (pin, paymentData) => {
  return makeVerificationRequest('/verification/nin-by-tracking', {
    trackingId: paymentData.trackingId,
    pin,
  });
};

// ============================================
// BVN VERIFICATION SERVICES
// ============================================

/**
 * Verify BVN by Number (₦100)
 * @param {string} pin - 4-digit transaction PIN
 * @param {object} paymentData - { bvn: string }
 * @returns {Promise<Object>} Verification result
 */
export const verifyBVN = async (pin, paymentData) => {
  return makeVerificationRequest('/verification/verify-bvn', {
    bvn: paymentData.bvn,
    pin,
  });
};

/**
 * Search BVN by Phone Number (₦150)
 * @param {string} pin - 4-digit transaction PIN
 * @param {object} paymentData - { phone: string }
 * @returns {Promise<Object>} Search result
 */
export const searchBVNByPhone = async (pin, paymentData) => {
  return makeVerificationRequest('/verification/bvn-by-phone', {
    phone: paymentData.phone,
    pin,
  });
};