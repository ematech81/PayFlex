
import { API_CONFIG } from "CONFIG/apiConfig";
import { apiService } from "./API/apiBaseService";

/**
 * Betting Service
 * Handles betting account funding operations
 */

export class BettingService {
  /**
   * Verify betting account
   * @param {string} customerId - Customer/User ID
   * @param {string} provider - Betting provider
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async verifyBettingAccount(customerId, provider, token) {
    return await apiService.post(
      `${API_CONFIG.ENDPOINTS.PAYMENTS.BASE}/betting/verify-account`,
      { 
        customerId, 
        provider: provider.toLowerCase() 
      },
      token
    );
  }

  /**
   * Fund betting account
   * @param {Object} data - Funding data
   * @param {string} data.customerId - Customer/User ID
   * @param {string} data.provider - Betting provider
   * @param {number} data.amount - Amount
   * @param {string} data.pin - Transaction PIN
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async fundBettingAccount(data, token) {
    const payload = {
      customerId: data.customerId,
      provider: data.provider.toLowerCase(),
      amount: Number(data.amount),
      pin: data.pin,
    };

    return await apiService.post(
      API_CONFIG.ENDPOINTS.PAYMENTS.PAY_BETTING,
      payload,
      token
    );
  }

  /**
   * Get betting transaction history
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async getBettingHistory(token) {
    return await apiService.get(
      `${API_CONFIG.ENDPOINTS.PAYMENTS.BASE}/betting/history`,
      token
    );
  }
}