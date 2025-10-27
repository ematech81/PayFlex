
import { API_CONFIG } from "CONFIG/apiConfig";
import { getDataServiceId } from "CONFIG/servicesConfig";
import { apiService } from "./API/apiBaseService";

/**
 * Data Service
 * Handles data bundle purchase operations
 */

export class DataService {
  /**
   * Get data plans for a network
   * @param {string} network - Network provider
   * @param {string} token - JWT token (optional)
   * @returns {Promise}
   */
  static async getDataPlans(network, token = null) {
    const serviceId = getDataServiceId(network);
    return await apiService.get(
      `${API_CONFIG.ENDPOINTS.DATA_PLANS}?network=${serviceId}`,
      token
    );
  }

  /**
   * Purchase data bundle
   * @param {Object} data - Purchase data
   * @param {string} data.phoneNumber - Phone number
   * @param {number} data.amount - Amount
   * @param {string} data.network - Network provider
   * @param {string} data.variation_code - Plan variation code
   * @param {string} data.pin - Transaction PIN
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async purchaseData(data, token) {
    const payload = {
      phoneNumber: data.phoneNumber,
      amount: Number(data.amount),
      network: getDataServiceId(data.network),
      variation_code: data.variation_code,
      pin: data.pin,
    };

    return await apiService.post(
      API_CONFIG.ENDPOINTS.PAYMENTS.BUY_DATA,
      payload,
      token
    );
  }

  /**
   * Get recommended data plans based on usage
   * @param {string} network - Network provider
   * @param {number} budget - User's budget
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async getRecommendedPlans(network, budget, token = null) {
    return await apiService.get(
      `${API_CONFIG.ENDPOINTS.DATA_PLANS}/recommended?network=${network}&budget=${budget}`,
      token
    );
  }
}