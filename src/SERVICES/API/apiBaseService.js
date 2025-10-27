

import axios from 'axios';
import { API_CONFIG, createRequestConfig } from 'CONFIG/apiConfig';
import { ErrorUtils } from 'UTILS/errorUtils';


/**
 * Base API Service
 * Handles all HTTP requests with centralized error handling
 */

class BaseApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[API Response Error]', error.response?.status, error.config?.url);
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   * @param {string} url - Endpoint URL
   * @param {string} token - JWT token
   * @param {Object} config - Additional axios config
   * @returns {Promise}
   */
  async get(url, token = null, config = {}) {
    try {
      const requestConfig = token 
        ? createRequestConfig(token, config)
        : { timeout: API_CONFIG.TIMEOUT, ...config };

      const response = await this.client.get(url, requestConfig);
      return this.handleSuccess(response);
    } catch (error) {
      throw this.handleError(error, 'GET', url);
    }
  }

  /**
   * POST request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request body
   * @param {string} token - JWT token
   * @param {Object} config - Additional axios config
   * @returns {Promise}
   */
  async post(url, data, token = null, config = {}) {
    try {
      const requestConfig = token 
        ? createRequestConfig(token, config)
        : { timeout: API_CONFIG.TIMEOUT, ...config };

      const response = await this.client.post(url, data, requestConfig);
      return this.handleSuccess(response);
    } catch (error) {
      throw this.handleError(error, 'POST', url);
    }
  }

  /**
   * PUT request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request body
   * @param {string} token - JWT token
   * @param {Object} config - Additional axios config
   * @returns {Promise}
   */
  async put(url, data, token = null, config = {}) {
    try {
      const requestConfig = token 
        ? createRequestConfig(token, config)
        : { timeout: API_CONFIG.TIMEOUT, ...config };

      const response = await this.client.put(url, data, requestConfig);
      return this.handleSuccess(response);
    } catch (error) {
      throw this.handleError(error, 'PUT', url);
    }
  }

  /**
   * DELETE request
   * @param {string} url - Endpoint URL
   * @param {string} token - JWT token
   * @param {Object} config - Additional axios config
   * @returns {Promise}
   */
  async delete(url, token = null, config = {}) {
    try {
      const requestConfig = token 
        ? createRequestConfig(token, config)
        : { timeout: API_CONFIG.TIMEOUT, ...config };

      const response = await this.client.delete(url, requestConfig);
      return this.handleSuccess(response);
    } catch (error) {
      throw this.handleError(error, 'DELETE', url);
    }
  }

  /**
   * Handle successful response
   * @param {Object} response - Axios response
   * @returns {Object}
   */
  handleSuccess(response) {
    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  }

  /**
   * Handle error response
   * @param {Error} error - Axios error
   * @param {string} method - HTTP method
   * @param {string} url - Endpoint URL
   * @returns {Error}
   */
  handleError(error, method, url) {
    ErrorUtils.logError(error, `${method} ${url}`);
    const parsed = ErrorUtils.parseApiError(error);
    
    const enhancedError = new Error(parsed.message);
    enhancedError.code = parsed.code;
    enhancedError.statusCode = parsed.statusCode;
    enhancedError.details = parsed.details;
    
    return enhancedError;
  }
}

// Export singleton instance
export const apiService = new BaseApiService();