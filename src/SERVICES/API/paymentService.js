

import { API_CONFIG } from "CONFIG/apiConfig";
import { apiService } from "./apiBaseService";

/**
 * Generic Payment Service
 * Handles common payment operations
 */

export class PaymentService {
  /**
   * Verify transaction PIN
   * @param {string} pin - Transaction PIN
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async verifyTransactionPin(pin, token) {
    return await apiService.post(
      API_CONFIG.ENDPOINTS.PAYMENTS.VERIFY_PIN,
      { pin },
      token
    );
  }

  /**
   * Verify transaction status
   * @param {string} reference - Transaction reference
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async verifyTransaction(reference, token) {
    return await apiService.get(
      `${API_CONFIG.ENDPOINTS.PAYMENTS.VERIFY_TRANSACTION}/${reference}`,
      token
    );
  }

  /**
   * Get transaction history
   * @param {string} token - JWT token
   * @param {Object} params - Query parameters (page, limit, type, etc.)
   * @returns {Promise}
   */
  static async getTransactionHistory(token, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString 
      ? `${API_CONFIG.ENDPOINTS.PAYMENTS.TRANSACTION_HISTORY}?${queryString}`
      : API_CONFIG.ENDPOINTS.PAYMENTS.TRANSACTION_HISTORY;
    
    return await apiService.get(url, token);
  }

  /**
   * Get single transaction details
   * @param {string} reference - Transaction reference
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async getTransactionDetails(reference, token) {
    return await apiService.get(
      `${API_CONFIG.ENDPOINTS.PAYMENTS.BASE}/transaction/${reference}`,
      token
    );
  }
}