

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
    console.log('=== VERIFY METER SERVICE ===');
    console.log('Meter Number:', meterNumber);
    console.log('DISCO:', disco);
    console.log('Meter Type:', meterType);
    console.log('==========================');

    try {
      const response = await apiService.post(
        '/payments/verify-meter',
        {
          meterNumber,
          disco,
          meterType,
        },
        token
      );

      console.log('Verification Response:', response);
      return response;
    } catch (error) {
      console.error('ElectricityService.verifyMeter error:', error);
      throw error;
    }
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
    console.log('=== PAY ELECTRICITY SERVICE ===');
    console.log('Payload:', data);
    console.log('==============================');

    const payload = {
      meterNumber: data.meterNumber,
      disco: data.disco,
      meterType: data.meterType,
      amount: Number(data.amount),
      phone: data.phone,
      pin: data.pin,
    };

    try {
      const response = await apiService.post(
        '/payments/pay-electricity',
        payload,
        token
      );

      console.log('Payment Response:', response);
      return response;
    } catch (error) {
      console.error('ElectricityService.payElectricityBill error:', error);
      throw error;
    }
  }

  /**
   * Get tariff information
   * @param {string} disco - Distribution company
   * @param {string} token - JWT token (optional)
   * @returns {Promise}
   */
  static async getTariffInfo(disco, token = null) {
    return await apiService.get(
      `/payments/electricity/tariff?disco=${disco}`,
      token
    );
  }
}

    
   