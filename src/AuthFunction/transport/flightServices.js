// services/flightService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from 'utility/storageKeys';
import { GeneralApiIPAddress } from 'utility/apiIPAdress';

const API_BASE_URL = GeneralApiIPAddress; // Update with your PayFlex backend URL
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
// AIRPORT & CITY SEARCH
// ============================================

/**
 * Search airports and cities
 * @param {string} keyword - Search keyword (min 2 chars)
 * @param {object} options - Optional parameters
 * @param {string} options.subType - 'AIRPORT', 'CITY', or 'AIRPORT,CITY'
 * @param {string} options.countryCode - ISO 3166-1 alpha-2 country code
 * @param {number} options.limit - Max items per page (default 10)
 * @param {number} options.offset - Page offset (default 0)
 * @param {string} options.sort - Sort order (default 'analytics.travelers.score')
 * @param {string} options.view - 'FULL' or 'LIGHT' (default 'FULL')
 */
export const searchAirports = async (keyword, options = {}) => {
  try {
    if (!keyword || keyword.length < 2) {
      return { success: true, data: [], meta: { count: 0 } };
    }

    console.log('🔍 Searching airports:', keyword);

    // Build query parameters
    const queryParams = new URLSearchParams({
      keyword: keyword.toUpperCase(),
    });

    // Add optional parameters
    if (options.subType) {
      queryParams.append('subType', options.subType);
    }

    if (options.countryCode) {
      queryParams.append('countryCode', options.countryCode.toUpperCase());
    }

    if (options.limit !== undefined) {
      queryParams.append('page[limit]', options.limit.toString());
    }

    if (options.offset !== undefined) {
      queryParams.append('page[offset]', options.offset.toString());
    }

    if (options.sort) {
      queryParams.append('sort', options.sort);
    }

    if (options.view) {
      queryParams.append('view', options.view);
    }

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/flights/airports/search?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await handleResponse(response);
    // console.log(`✅ Found ${result.data.length} locations`);

    return result;
  } catch (error) {
    console.error('❌ Airport search error:', error.message);
    throw error;
  }
};

/**
 * Get specific airport or city by location ID
 * @param {string} locationId - Location identifier (e.g., CMUC, AMUC)
 */
export const getAirportById = async (locationId) => {
  try {
    if (!locationId) {
      throw new Error('Location ID is required');
    }

    console.log('📍 Getting airport by ID:', locationId);

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/flights/airports/${locationId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await handleResponse(response);
    console.log('✅ Location retrieved');

    return result;
  } catch (error) {
    console.error('❌ Get airport error:', error.message);
    throw error;
  }
};

// ============================================
// FLIGHT SEARCH
// ============================================

/**
 * Search for flight offers
 */
export const searchFlights = async (searchParams) => {
  try {
    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0,
      travelClass = 'ECONOMY',
      nonStop = false,
      currencyCode = 'NGN',
      maxResults = 50,
    } = searchParams;

    console.log('✈️ Searching flights:', {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults,
    });

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/flights/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originLocationCode,
          destinationLocationCode,
          departureDate,
          returnDate,
          adults,
          children,
          infants,
          travelClass,
          nonStop,
          currencyCode,
          maxResults,
        }),
      }
    );

    const result = await handleResponse(response);
    // console.log(`✅ Found ${result.data.length} flight offers`);

    return result;
  } catch (error) {
    console.error('❌ Flight search error:', error.message);
    throw error;
  }
};

// ============================================
// FLIGHT INSPIRATION (POPULAR ROUTES)
// ============================================

/**
 * Get popular destinations from origin
 */
export const getFlightInspiration = async (origin, options = {}) => {
  try {
    console.log('💡 Getting flight inspiration from:', origin);

    const queryParams = new URLSearchParams({
      origin,
      ...options,
    }).toString();

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/flights/inspiration?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await handleResponse(response);
    // console.log(`✅ Found ${result.data.length} destinations`);

    return result;
  } catch (error) {
    console.error('❌ Flight inspiration error:', error.message);
    throw error;
  }
};

// ============================================
// PRICE CONFIRMATION
// ============================================

/**
 * Confirm flight price and availability
 * @param {object|array} flightOffers - Flight offer(s) to confirm
 * @returns {object} Confirmed pricing with updated fare details
 */
export const confirmFlightPrice = async (flightOffers) => {
  try {
    console.log('💰 Confirming flight price...');

    // Ensure flightOffers is array
    const offersArray = Array.isArray(flightOffers) ? flightOffers : [flightOffers];

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/flights/price-confirm`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            type: 'flight-offers-pricing',
            flightOffers: offersArray,
          },
        }),
      }
    );

    const result = await handleResponse(response);
    console.log('✅ Price confirmed');

    return result;
  } catch (error) {
    console.error('❌ Price confirmation error:', error.message);
    throw error;
  }
};

// ============================================
// SEATMAP
// ============================================

/**
 * Get seatmap for flight (before booking)
 * @param {object|array} flightOffers - Flight offer(s)
 * @returns {object} Seatmap data with seat availability
 */
export const getFlightSeatmap = async (flightOffers) => {
  try {
    console.log('💺 Getting flight seatmap...');

    // Ensure flightOffers is array
    const offersArray = Array.isArray(flightOffers) ? flightOffers : [flightOffers];

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/flights/seatmap`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightOffers: offersArray,
        }),
      }
    );

    const result = await handleResponse(response);
    console.log('✅ Seatmap retrieved');

    return result;
  } catch (error) {
    console.error('❌ Seatmap error:', error.message);
    throw error;
  }
};

/**
 * Get seatmap for existing order (after booking)
 * @param {string} orderId - Amadeus order ID
 * @returns {object} Seatmap data
 */
export const getSeatmapByOrderId = async (orderId) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('💺 Getting seatmap for order:', orderId);

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/flights/seatmap/${orderId}`,
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
    console.error('❌ Get seatmap error:', error.message);
    throw error;
  }
};

// ============================================
// FLIGHT BOOKING
// ============================================

/**
 * Create flight booking
 */
export const createFlightBooking = async (bookingData) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('📝 Creating flight booking...');

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/flights/book`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      }
    );

    const result = await handleResponse(response);
    console.log('✅ Flight booking created');

    return result;
  } catch (error) {
    console.error('❌ Flight booking error:', error.message);
    throw error;
  }
};

// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * Get flight order details
 */
export const getFlightOrder = async (orderId) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('📋 Getting flight order:', orderId);

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/flights/orders/${orderId}`,
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
    console.error('❌ Get flight order error:', error.message);
    throw error;
  }
};

/**
 * Cancel flight order
 */
export const cancelFlightOrder = async (orderId) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('❌ Cancelling flight order:', orderId);

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/flights/orders/${orderId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await handleResponse(response);
    console.log('✅ Flight order cancelled');

    return result;
  } catch (error) {
    console.error('❌ Cancel flight order error:', error.message);
    throw error;
  }
};

// ============================================
// CHECK-IN LINKS
// ============================================

/**
 * Get check-in links for airline
 */
export const getCheckinLinks = async (airlineCode) => {
  try {
    console.log('🔗 Getting check-in link for:', airlineCode);

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/flights/checkin-links?airlineCode=${airlineCode}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('❌ Check-in links error:', error.message);
    throw error;
  }
};

// ============================================
// FLIGHT STATUS
// ============================================

/**
 * Get real-time flight status
 */
export const getFlightStatus = async (flightNumber, flightDate) => {
  try {
    console.log('🛫 Getting flight status:', flightNumber, flightDate);

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/flights/status?flightNumber=${flightNumber}&flightDate=${flightDate}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('❌ Flight status error:', error.message);
    throw error;
  }
};

// ============================================
// EXPORT
// ============================================

export default {
  searchAirports,
  getAirportById,
  searchFlights,
  getFlightInspiration,
  confirmFlightPrice,
  getFlightSeatmap,
  getSeatmapByOrderId,
  createFlightBooking,
  getFlightOrder,
  cancelFlightOrder,
  getCheckinLinks,
  getFlightStatus,
};