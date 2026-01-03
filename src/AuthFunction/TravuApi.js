// services/travuAPI.js
// Real Travu API Service
// This will be used when you get your API key from Travu

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from 'utility/storageKeys';

const TRAVU_BASE_URL = 'https://api.travu.africa/api/v1';
const REQUEST_TIMEOUT = 30000;

// ============================================
// CONFIGURATION
// ============================================

// Set this to true when you have the real API key
const USE_REAL_API = false;

// Your Travu API Key (to be set when available)
const TRAVU_API_KEY = process.env.TRAVU_API_KEY || '';

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

  if (data.error === true) {
    throw new Error(data.info || data.message || 'Request failed');
  }

  return data;
};

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Check available trips
 * POST /api/v1/check_trip
 */
export const checkTrip = async ({ origin, destination, date, sort = 'provider' }) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🚌 Checking trips:', { origin, destination, date, sort });

    const response = await fetchWithTimeout(`${TRAVU_BASE_URL}/check_trip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-KEY': TRAVU_API_KEY,
      },
      body: JSON.stringify({
        origin,
        destination,
        date,
        sort,
      }),
    });

    const result = await handleResponse(response);
    console.log('✅ Trips found:', result);

    return result;
  } catch (error) {
    console.error('❌ Check Trip Error:', error.message);
    throw error;
  }
};

/**
 * Book a trip
 * POST /api/v1/book_trip
 */
export const bookTrip = async (bookingData) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🎫 Booking trip:', bookingData);

    const response = await fetchWithTimeout(`${TRAVU_BASE_URL}/book_trip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-KEY': TRAVU_API_KEY,
      },
      body: JSON.stringify(bookingData),
    });

    const result = await handleResponse(response);
    console.log('✅ Booking successful:', result);

    return result;
  } catch (error) {
    console.error('❌ Book Trip Error:', error.message);
    throw error;
  }
};

/**
 * Get booking details
 * GET /api/v1/booking/{booking_id}
 */
export const getBooking = async (bookingId) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetchWithTimeout(
      `${TRAVU_BASE_URL}/booking/${bookingId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-KEY': TRAVU_API_KEY,
        },
      }
    );

    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('❌ Get Booking Error:', error.message);
    throw error;
  }
};

/**
 * Cancel booking
 * POST /api/v1/cancel_booking
 */
export const cancelBooking = async (bookingId) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetchWithTimeout(`${TRAVU_BASE_URL}/cancel_booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-KEY': TRAVU_API_KEY,
      },
      body: JSON.stringify({ booking_id: bookingId }),
    });

    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('❌ Cancel Booking Error:', error.message);
    throw error;
  }
};

export default {
  checkTrip,
  bookTrip,
  getBooking,
  cancelBooking,
};