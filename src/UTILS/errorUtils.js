

import { COMMON_ERROR_MESSAGES } from "CONSTANT/validationConstant";

/**
 * Error Handling Utilities
 */

export class ErrorUtils {
  /**
   * Parse API error response
   * @param {Error} error - Axios error object
   * @returns {Object} Parsed error
   */
  static parseApiError(error) {
    console.error('API Error:', error);

    // Network error (no response)
    if (error.request && !error.response) {
      return {
        success: false,
        message: COMMON_ERROR_MESSAGES.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
        details: null,
      };
    }

    // Server responded with error
    if (error.response) {
      const { status, data } = error.response;

      return {
        success: false,
        message: data?.message || this.getStatusMessage(status),
        code: data?.code || `HTTP_${status}`,
        statusCode: status,
        details: data?.details || null,
      };
    }

    // Request setup error
    return {
      success: false,
      message: error.message || COMMON_ERROR_MESSAGES.SERVER_ERROR,
      code: 'REQUEST_ERROR',
      details: null,
    };
  }

  /**
   * Get user-friendly message for HTTP status codes
   * @param {number} status - HTTP status code
   * @returns {string} User-friendly message
   */
  static getStatusMessage(status) {
    const messages = {
      400: 'Invalid request. Please check your input',
      401: 'Authentication required. Please log in',
      403: 'Access denied. You do not have permission',
      404: 'Resource not found',
      408: COMMON_ERROR_MESSAGES.TIMEOUT,
      422: 'Validation error. Please check your input',
      429: 'Too many requests. Please try again later',
      500: COMMON_ERROR_MESSAGES.SERVER_ERROR,
      502: 'Service temporarily unavailable',
      503: 'Service temporarily unavailable',
      504: COMMON_ERROR_MESSAGES.TIMEOUT,
    };

    return messages[status] || COMMON_ERROR_MESSAGES.SERVER_ERROR;
  }

  /**
   * Check if error is a network error
   * @param {Error} error - Error object
   * @returns {boolean}
   */
  static isNetworkError(error) {
    return error.request && !error.response;
  }

  /**
   * Check if error is authentication error
   * @param {Error} error - Error object
   * @returns {boolean}
   */
  static isAuthError(error) {
    return error.response?.status === 401 || error.response?.status === 403;
  }

  /**
   * Check if error is validation error
   * @param {Error} error - Error object
   * @returns {boolean}
   */
  static isValidationError(error) {
    return error.response?.status === 400 || error.response?.status === 422;
  }

  /**
   * Create user-friendly error message
   * @param {Error} error - Error object
   * @param {string} context - Context of the error (e.g., "purchasing airtime")
   * @returns {string} User-friendly message
   */
  static createUserMessage(error, context = '') {
    const parsed = this.parseApiError(error);
    
    if (context) {
      return `Error ${context}: ${parsed.message}`;
    }
    
    return parsed.message;
  }

  /**
   * Log error for debugging (with context)
   * @param {Error} error - Error object
   * @param {string} context - Context information
   * @param {Object} additionalData - Additional data to log
   */
  static logError(error, context = '', additionalData = {}) {
    const timestamp = new Date().toISOString();
    const parsed = this.parseApiError(error);

    console.error('=== ERROR LOG ===');
    console.error('Timestamp:', timestamp);
    console.error('Context:', context);
    console.error('Message:', parsed.message);
    console.error('Code:', parsed.code);
    console.error('Status:', parsed.statusCode);
    console.error('Details:', parsed.details);
    console.error('Additional Data:', additionalData);
    console.error('Stack:', error.stack);
    console.error('================');

    // In production, you might want to send this to a logging service
    // Example: Sentry, LogRocket, etc.
  }

  /**
   * Retry handler for failed requests
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Delay between retries (ms)
   * @returns {Promise}
   */
  static async retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on validation or auth errors
        if (this.isValidationError(error) || this.isAuthError(error)) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }
}