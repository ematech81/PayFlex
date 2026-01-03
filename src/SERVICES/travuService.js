// services/travuService.js
// Unified Travu Service
// Automatically switches between mock and real API based on configuration

import mockTravuAPI from "../constants/mockTravuAPI";

// ============================================
// CONFIGURATION
// ============================================

// Set to true when you have your real API key
const USE_REAL_API = false;

// Choose which API to use
const api = USE_REAL_API ? realTravuAPI : mockTravuAPI;

console.log(`🚌 Travu Service: Using ${USE_REAL_API ? 'REAL' : 'MOCK'} API`);

// ============================================
// UNIFIED API INTERFACE
// ============================================

/**
 * Check available trips
 * @param {Object} params
 * @param {string} params.origin - Origin city
 * @param {string} params.destination - Destination city
 * @param {string} params.date - Trip date (YYYY-MM-DD)
 * @param {string} params.sort - Sort type: 'provider' or 'date'
 * @returns {Promise<Object>}
 */
const checkTrip = async (params) => {
  return await api.checkTrip(params);
};

/**
 * Book a trip
 * @param {Object} bookingData
 * @param {number} bookingData.trip_id
 * @param {Array<number>} bookingData.seat_numbers
 * @param {Object} bookingData.passenger_info
 * @param {number} bookingData.amount
 * @returns {Promise<Object>}
 */
const bookTrip = async (bookingData) => {
  return await api.bookTrip(bookingData);
};

/**
 * Get booking details
 * @param {string} bookingId
 * @returns {Promise<Object>}
 */
const getBooking = async (bookingId) => {
  return await api.getBooking(bookingId);
};

/**
 * Cancel booking (only available in real API)
 * @param {string} bookingId
 * @returns {Promise<Object>}
 */
const cancelBooking = async (bookingId) => {
  if (!USE_REAL_API) {
    // Mock cancellation
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      error: false,
      message: "Booking cancelled successfully",
      data: { booking_id: bookingId, status: "cancelled" }
    };
  }
  return await api.cancelBooking(bookingId);
};

/**
 * Get available routes (mock only)
 * @returns {Promise<Object>}
 */
const getRoutes = async () => {
  if (USE_REAL_API) {
    // Real API might have a different endpoint
    console.warn('getRoutes not implemented for real API yet');
    return mockTravuAPI.getRoutes();
  }
  return await mockTravuAPI.getRoutes();
};

/**
 * Get available origins
 * @returns {Array<string>}
 */
const getAvailableOrigins = () => {
  if (USE_REAL_API) {
    // For real API, you might fetch this from an endpoint
    return mockTravuAPI.getAvailableOrigins();
  }
  return mockTravuAPI.getAvailableOrigins();
};

/**
 * Get available destinations
 * @returns {Array<string>}
 */
const getAvailableDestinations = () => {
  if (USE_REAL_API) {
    return mockTravuAPI.getAvailableDestinations();
  }
  return mockTravuAPI.getAvailableDestinations();
};

/**
 * Get transport providers
 * @returns {Array<Object>}
 */
const getProviders = () => {
  return mockTravuAPI.getProviders();
};

/**
 * Check if seat is available
 * @param {Object} trip
 * @param {number} seatNumber
 * @returns {boolean}
 */
const isSeatAvailable = (trip, seatNumber) => {
  return mockTravuAPI.isSeatAvailable(trip, seatNumber);
};

/**
 * Calculate total fare
 * @param {Object} trip
 * @param {Array<number>} seatNumbers
 * @returns {number}
 */
const calculateTotalFare = (trip, seatNumbers) => {
  return mockTravuAPI.calculateTotalFare(trip, seatNumbers);
};

// ============================================
// CONFIGURATION HELPERS
// ============================================

/**
 * Check if using real API
 * @returns {boolean}
 */
const isUsingRealAPI = () => USE_REAL_API;

/**
 * Get API info
 * @returns {Object}
 */
const getAPIInfo = () => ({
  isReal: USE_REAL_API,
  mode: USE_REAL_API ? 'production' : 'development',
  provider: USE_REAL_API ? 'Travu Africa' : 'Mock Service',
});

// ============================================
// MODULE EXPORTS
// ============================================

export default {
  checkTrip,
  bookTrip,
  getBooking,
  cancelBooking,
  getRoutes,
  getAvailableOrigins,
  getAvailableDestinations,
  getProviders,
  isSeatAvailable,
  calculateTotalFare,
  isUsingRealAPI,
  getAPIInfo,
};