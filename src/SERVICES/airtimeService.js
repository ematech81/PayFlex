

import { API_CONFIG } from "CONFIG/apiConfig";
import { getAirtimeServiceId } from "CONFIG/servicesConfig";
import { apiService } from "./API/apiBaseService";

/**
 * Airtime Service
 * Handles airtime purchase operations
 */

export class AirtimeService {
  /**
   * Purchase airtime
   * @param {Object} data - Purchase data
   * @param {string} data.phoneNumber - Phone number
   * @param {number} data.amount - Amount
   * @param {string} data.network - Network provider
   * @param {string} data.pin - Transaction PIN
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async purchaseAirtime(data, token) {
    const payload = {
      phoneNumber: data.phoneNumber,
      amount: Number(data.amount),
      network: getAirtimeServiceId(data.network),
      pin: data.pin,
    };

    return await apiService.post(
      API_CONFIG.ENDPOINTS.PAYMENTS.BUY_AIRTIME,
      payload,
      token
    );
  }

  /**
   * Validate phone number with network (optional backend check)
   * @param {string} phoneNumber - Phone number
   * @param {string} network - Network provider
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async validatePhoneNumber(phoneNumber, network, token) {
    return await apiService.post(
      `${API_CONFIG.ENDPOINTS.PAYMENTS.BASE}/validate-phone`,
      { phoneNumber, network },
      token
    );
  }
}