// services/bookingService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utility/storageKeys';
import { GeneralApiIPAddress } from 'utility/apiIPAdress';

const API_BASE_URL = GeneralApiIPAddress; // Update with your API URL
const REQUEST_TIMEOUT = 30000;

// ============================================
// HELPER FUNCTIONS
// ============================================

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

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server returned invalid response format');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

// ============================================
// BOOKING API FUNCTIONS
// ============================================

/**
 * Create new booking
 */
export const createBooking = async (bookingData) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🎫 Creating booking...');

    const response = await fetchWithTimeout(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });

    const result = await handleResponse(response);
    console.log('✅ Booking created:', result.data.bookingReference);

    return result;
  } catch (error) {
    console.error('❌ Create Booking Error:', error.message);
    throw error;
  }
};

/**
 * Get user bookings
 */
export const getUserBookings = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const { status, page = 1, limit = 20 } = params;
    const queryParams = new URLSearchParams();
    
    if (status) queryParams.append('status', status);
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    console.log('📋 Fetching bookings...');

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/bookings?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await handleResponse(response);
    console.log(`✅ Loaded ${result.data.bookings.length} bookings`);

    return result;
  } catch (error) {
    console.error('❌ Get Bookings Error:', error.message);
    throw error;
  }
};

/**
 * Get single booking by ID
 */
export const getBooking = async (bookingId) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('📄 Fetching booking:', bookingId);

    const response = await fetchWithTimeout(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('❌ Get Booking Error:', error.message);
    throw error;
  }
};

/**
 * Get booking by reference
 */
export const getBookingByReference = async (reference) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🔍 Searching booking:', reference);

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/bookings/reference/${reference}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('❌ Get Booking By Reference Error:', error.message);
    throw error;
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (bookingId, reason) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('❌ Cancelling booking:', bookingId);

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/bookings/${bookingId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      }
    );

    const result = await handleResponse(response);
    console.log('✅ Booking cancelled');

    return result;
  } catch (error) {
    console.error('❌ Cancel Booking Error:', error.message);
    throw error;
  }
};

/**
 * Get saved passenger profiles
 */
export const getPassengerProfiles = async () => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('👥 Fetching passenger profiles...');

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/bookings/passengers/profiles`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('❌ Get Passenger Profiles Error:', error.message);
    throw error;
  }
};

/**
 * Search passenger by phone
 */
/**
 * Search passenger by phone
 */
export const searchPassengerByPhone = async (phone) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🔍 Searching passenger:', phone);

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/bookings/passengers/search/${phone}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await handleResponse(response);
    console.log('✅ Passenger found');

    return result;
  } catch (error) {
    // ✅ UPDATED: Return an object instead of throwing
    // This way the component can handle it gracefully
    console.log('ℹ️ No saved profile found for:', phone);
    
    return {
      success: false,
      message: error.message || 'Passenger not found',
      data: null,
    };
  }
};
export default {
  createBooking,
  getUserBookings,
  getBooking,
  getBookingByReference,
  cancelBooking,
  getPassengerProfiles,
  searchPassengerByPhone,
};