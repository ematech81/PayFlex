// src/services/AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { ApiIPAddress } from 'utility/apiIPAdress';
import { STORAGE_KEYS } from 'utility/storageKeys';

// ---------- Configuration ----------
const BASE_URL = ApiIPAddress;

const REQUEST_TIMEOUT = 15000; // 15 seconds


// ---------- Helper Functions ----------

/**
 * Generates or retrieves unique device identifier
 * @returns {Promise<string>} Device ID
 */
// ---------- Helper Functions ----------

/**
 * Generates or retrieves unique device identifier
 * IMPORTANT: Reuses existing ID to prevent "new device" on every login
 * @returns {Promise<string>} Device ID
 */
const getDeviceId = async () => {
  try {
    // Check if device ID already exists
    let id = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    
    if (id) {
      console.log('✅ Using existing device ID:', id);
      return id;
    }
    
    // Generate new device ID only if none exists
    // Use device info + random string (not timestamp to keep it stable)
    const randomPart = Math.random().toString(36).substring(2, 15);
    id = `${Device.modelName || 'unknown'}-${Device.osName || 'unknown'}-${randomPart}`;
    
    // CRITICAL: Save it immediately so it's reused next time
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    
    console.log('🆕 Created new device ID:', id);
    return id;
    
  } catch (error) {
    console.error('❌ Error getting device ID:', error);
    // Fallback: Create temporary ID (won't be saved, so will be "new device" each time)
    return `temp-device-${Math.random().toString(36).substring(2, 15)}`;
  }
};

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
 * @param {Response} response - Fetch response
 * @returns {Promise<object>} Parsed JSON response
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  // Check if response is JSON
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server returned invalid response format');
  }

  const data = await response.json();

  // For non-2xx responses, ensure we return the error in expected format
  if (!response.ok) {
    return {
      success: false,
      message: data.message || `Request failed with status ${response.status}`,
      errors: data.errors || null,
      statusCode: response.status,
    };
  }

  return data;
};


/**
 * Makes authenticated API request

 */
const makeAuthRequest = async (endpoint, options = {}) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`❌ API Error [${endpoint}]:`, error.message);
    
    // Network errors
    if (error.message.includes('Network request failed') || 
        error.message.includes('Failed to fetch')) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        isNetworkError: true,
      };
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return {
        success: false,
        message: 'Request timeout. Please try again.',
        isTimeout: true,
      };
    }

    // Generic error
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
};


/**
 * Converts Nigerian phone numbers to E.164 format
 * Matches backend toE164() function exactly
 */
const toE164 = (phone) => {
  const p = (phone || '').trim();
  if (p.startsWith('+')) return p;
  if (/^0[789]\d{9}$/.test(p)) return `+234${p.slice(1)}`;
  if (/^234[789]\d{9}$/.test(p)) return `+${p}`;
  return p;
};

// ---------- Auth Service ----------

export const AuthService = {
  /**
   * Registers a new user
  
   */
  register: async (data) => {
    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'password'];
      const missingFields = requiredFields.filter(field => !data[field]?.trim());
      
      if (missingFields.length > 0) {
        return {
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          errors: missingFields.map(field => ({
            field,
            message: `${field} is required`,
          })),
        };
      }

      // Helper: Convert Nigerian phone to E.164 format
      const toE164 = (phone) => {
        const p = phone.trim();
        if (p.startsWith('+')) return p;
        if (/^0\d{10}$/.test(p)) return `+234${p.slice(1)}`;
        if (/^234\d{10}$/.test(p)) return `+${p}`;
        return p;
      };

      // Sanitize input data
      const sanitizedData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: toE164(data.phone), // Convert to E.164 format
        password: data.password,
      };

      const response = await fetchWithTimeout(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.message.includes('timeout')) {
        return {
          success: false,
          message: 'Registration timeout. Please try again.',
          isTimeout: true,
        };
      }

      if (error.message.includes('Network')) {
        return {
          success: false,
          message: 'Network error. Check your connection.',
          isNetworkError: true,
        };
      }

      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
  },

    
  /**
   * Verifies phone OTP
   * @param {string} phone - User's phone number
   * @param {string} otp - OTP code
   * @returns {Promise<object>} { success, message, token?, user? }
   */
  verifyOtp: async (phone, otp) => {
    if (!phone || !otp) {
      return {
        success: false,
        message: 'Phone number and OTP are required',
      };
    }

    // Get device ID to add to user's trusted devices
    const deviceId = await getDeviceId();

    return await makeAuthRequest('/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ 
        phone: phone.trim(), 
        otp: otp.trim(),
        deviceId  // ✅ Send deviceId to backend
      }),
    });
  },



  /**
   * Resends OTP to user's phone
   
   */
  resendOtp: async (phone) => {
    if (!phone) {
      return {
        success: false,
        message: 'Phone number is required',
      };
    }

    return await makeAuthRequest('/phone/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: phone.trim() }),
    });
  },

  /**
   * Sets user's login PIN
   
   */
  setPin: async ({ userId, pin }) => {
    const pinStr = String(pin);
  
    if (!pinStr || !/^\d{6}$/.test(pinStr)) {
      return {
        success: false,
        message: 'PIN must be exactly 6 digits',
      };
    }
  
    return await makeAuthRequest('/set-pin', {
      method: 'POST',
      body: JSON.stringify({ userId, pin: pinStr }),
    });
  },
  

  /**
   * Authenticates user with phone and PIN
   * @param {string} phone - User's phone number
   * @param {string} pin - User's 6-digit PIN
   * @returns {Promise<object>} { success, message, token?, user?, isNewDevice? }
   */
  login: async (phone, pin) => {
    try {
      if (!phone || !pin) {
        return {
          success: false,
          message: 'Phone number and PIN are required',
        };
      }

      if (!/^\d{6}$/.test(pin)) {
        return {
          success: false,
          message: 'PIN must be exactly 6 digits',
        };
      }

      const deviceId = await getDeviceId();
      
      const data = await makeAuthRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ 
          phone: phone.trim(), 
          pin, 
          deviceId 
        }),
      });

      // Store authentication data on successful login (not new device)
      if (data.success && !data.isNewDevice && data.token) {
        try {
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.TOKEN, data.token],
            [STORAGE_KEYS.USER, JSON.stringify(data.user)],
            [STORAGE_KEYS.PHONE, phone],
            [STORAGE_KEYS.REQUIRE_PIN, String(data.user?.requirePinOnOpen ?? true)],
          ]);
        } catch (storageError) {
          console.error('❌ Error storing auth data:', storageError);
          return {
            success: false,
            message: 'Failed to save login data. Please try again.',
          };
        }
      }

      return data;
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  },



  /**
   * Verifies device OTP and completes login
   * Stores token and user data on success
   * @param {string} phone - User's phone number
   * @param {string} otp - 6-digit OTP code
   * @param {string} deviceId - Device identifier (optional, will get from storage if not provided)
   * @returns {Promise<object>} { success, token?, user?, message }
   */
  verifyDeviceOtp: async (phone, otp, deviceId) => {
    try {
      // Validation
      if (!phone || !otp) {
        return {
          success: false,
          message: 'Phone number and OTP are required',
        };
      }
  
      if (!/^\d{6}$/.test(otp.trim())) {
        return {
          success: false,
          message: 'OTP must be exactly 6 digits',
        };
      }
  
      // Get device ID if not provided
      if (!deviceId) {
        deviceId = await getDeviceId();
      }
  
      // Normalize phone
      const normalizedPhone = toE164(phone);
  
      // API Request (use fetchWithTimeout, not makeAuthRequest - no token yet)
      const response = await fetchWithTimeout(`${BASE_URL}/verify-device-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          otp: otp.trim(),
          deviceId,
        }),
      });
  
      const data = await handleResponse(response);
  
      // ✅ Successful device verification
      if (data.success && data.token && data.user) {
        try {
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.TOKEN, data.token],
            [STORAGE_KEYS.USER, JSON.stringify(data.user)],
            [STORAGE_KEYS.PHONE, normalizedPhone],
            [STORAGE_KEYS.DEVICE_ID, deviceId],
            [STORAGE_KEYS.REQUIRE_PIN, String(data.user?.requirePinOnOpen ?? true)],
          ]);
          console.log('✅ Device verified, data stored');
        } catch (storageError) {
          console.error('❌ Error storing auth data:', storageError);
          return {
            success: false,
            message: 'Verification successful but failed to save data. Please login again.',
          };
        }
      }
  
      return data;
  
    } catch (error) {
      console.error('❌ Device verification error:', error);
  
      if (error.message.includes('timeout')) {
        return {
          success: false,
          message: 'Verification timeout. Please try again.',
          isTimeout: true,
        };
      }
  
      if (error.message.includes('Network')) {
        return {
          success: false,
          message: 'Network error. Please check your connection.',
          isNetworkError: true,
        };
      }
  
      return {
        success: false,
        message: 'Verification failed. Please try again.',
      };
    }
  },
  
  /**
   * Resends OTP for device verification
   * Includes rate limiting from backend (60s cooldown)
   * @param {string} phone - User's phone number
   * @returns {Promise<object>} { success, message, waitSeconds? }
   */
  resendDeviceOtp: async (phone) => {
    try {
      if (!phone) {
        return {
          success: false,
          message: 'Phone number is required',
        };
      }
  
      // Normalize phone
      const normalizedPhone = toE164(phone);
  
      // API Request (use fetchWithTimeout - no token needed)
      const response = await fetchWithTimeout(`${BASE_URL}/resend-device-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
  
      const data = await handleResponse(response);
  
      return data;
  
    } catch (error) {
      console.error('❌ Resend device OTP error:', error);
  
      if (error.message.includes('timeout')) {
        return {
          success: false,
          message: 'Request timeout. Please try again.',
          isTimeout: true,
        };
      }
  
      if (error.message.includes('Network')) {
        return {
          success: false,
          message: 'Network error. Please check your connection.',
          isNetworkError: true,
        };
      }
  
      return {
        success: false,
        message: 'Failed to resend code. Please try again.',
      };
    }
  },


  /**
   * Verifies PIN reset code
   * @param {string} phone - User's phone number
   * @param {string} code - Reset code
   * @returns {Promise<object>} { success, message, resetToken? }
   */
  verifyResetCode: async (phone, code) => {
    if (!phone || !code) {
      return {
        success: false,
        message: 'Phone number and reset code are required',
      };
    }

    return await makeAuthRequest('/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ 
        phone: phone.trim(), 
        code: code.trim() 
      }),
    });
  },

  /**
   * Sets new PIN after reset
   * @param {string} resetToken - Reset token from verification
   * @param {string} pin - New 6-digit PIN
   * @returns {Promise<object>} { success, message }
   */
  setPinAfterReset: async (resetToken, pin) => {
    if (!resetToken || !pin) {
      return {
        success: false,
        message: 'Reset token and PIN are required',
      };
    }

    if (!/^\d{6}$/.test(pin)) {
      return {
        success: false,
        message: 'PIN must be exactly 6 digits',
      };
    }

    return await makeAuthRequest('/set-pin-after-reset', {
      method: 'POST',
      body: JSON.stringify({ resetToken, pin }),
    });
  },

  /**
   * Updates PIN requirement on app open
   * @param {boolean} requirePin - Whether to require PIN on app open
   * @returns {Promise<object>} { success, message }
   */
  updateRequirePin: async (requirePin) => {
    const result = await makeAuthRequest('/update-require-pin', {
      method: 'POST',
      body: JSON.stringify({ requirePin: Boolean(requirePin) }),
    });

    // Update local storage on success
    if (result.success) {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.REQUIRE_PIN, 
          String(requirePin)
        );
      } catch (error) {
        console.error('❌ Error updating local PIN setting:', error);
      }
    }

    return result;
  },

  /**
   * Logs out user and clears local data
   * @returns {Promise<boolean>} Success status
   */
  logout: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.PHONE,
        STORAGE_KEYS.REQUIRE_PIN,
      ]);
      return true;
    } catch (error) {
      console.error('❌ Logout error:', error);
      return false;
    }
  },

  /**
   * Gets stored user data
   * @returns {Promise<object|null>} User data or null
   */
  getStoredUser: async () => {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('❌ Error getting stored user:', error);
      return null;
    }
  },

  /**
   * Gets stored auth token
   * @returns {Promise<string|null>} Token or null
   */
  getStoredToken: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('❌ Error getting stored token:', error);
      return null;
    }
  },
};


// ================================================
// settings and it related logics
// ================================================
/**
 * Change Login PIN
 * @param {string} currentPin - Current 6-digit login PIN
 * @param {string} newPin - New 6-digit login PIN
 * @returns {Promise<Object>} Response
 */
export const changeLoginPin = async (currentPin, newPin) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetchWithTimeout(
      `${BASE_URL}/change-login-pin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPin, newPin }),
      }
    );

    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('❌ Change Login PIN Error:', error.message);
    throw error;
  }
};