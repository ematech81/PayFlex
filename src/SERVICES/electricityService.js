

import { API_CONFIG } from "CONFIG/apiConfig";
import { getElectricityServiceId } from "CONFIG/servicesConfig";
import { apiService } from "./API/apiBaseService";

/**
 * Electricity Service
 * Handles electricity bill payment operations
 */

export class ElectricityService {
  /**
   * Verify meter number
   * @param {string} meterNumber - Meter number
   * @param {string} disco - Distribution company
   * @param {string} meterType - Meter type (prepaid/postpaid)
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async verifyMeter(meterNumber, disco, meterType, token) {
    const serviceId = getElectricityServiceId(disco);
    
    return await apiService.post(
      API_CONFIG.ENDPOINTS.VERIFY_METER,
      { 
        meterNumber, 
        serviceID: `${serviceId}-${meterType}`,
        disco: serviceId 
      },
      token
    );
  }

  /**
   * Pay electricity bill
   * @param {Object} data - Payment data
   * @param {string} data.meterNumber - Meter number
   * @param {string} data.disco - Distribution company
   * @param {string} data.meterType - Meter type (prepaid/postpaid)
   * @param {number} data.amount - Amount
   * @param {string} data.phone - Phone number
   * @param {string} data.pin - Transaction PIN
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async payElectricityBill(data, token) {
    const discoId = getElectricityServiceId(data.disco);
    
    const payload = {
      meterNumber: data.meterNumber,
      disco: discoId,
      serviceID: `${discoId}-${data.meterType}`,
      amount: Number(data.amount),
      phone: data.phone,
      pin: data.pin,
    };

    return await apiService.post(
      API_CONFIG.ENDPOINTS.PAYMENTS.PAY_ELECTRICITY,
      payload,
      token
    );
  }

  /**
   * Get tariff information
   * @param {string} disco - Distribution company
   * @param {string} token - JWT token (optional)
   * @returns {Promise}
   */
  static async getTariffInfo(disco, token = null) {
    const discoId = getElectricityServiceId(disco);
    
    return await apiService.get(
      `${API_CONFIG.ENDPOINTS.PAYMENTS.BASE}/tariff-info?disco=${discoId}`,
      token
    );
  }
}