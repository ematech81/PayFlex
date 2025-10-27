


import { API_CONFIG } from "CONFIG/apiConfig";
import { apiService } from "./API/apiBaseService";
import { getTVServiceId } from "CONFIG/servicesConfig";


/**
 * TV Subscription Service
 * Handles TV/Cable subscription operations
 */

export class TVService {
  /**
   * Verify smartcard number
   * @param {string} smartcardNumber - Smartcard/IUC number
   * @param {string} provider - TV provider (dstv, gotv, etc.)
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async verifySmartcard(smartcardNumber, provider, token) {
    const serviceId = getTVServiceId(provider);
    
    return await apiService.post(
      API_CONFIG.ENDPOINTS.VERIFY_SMARTCARD,
      { 
        smartcardNumber, 
        serviceID: serviceId 
      },
      token
    );
  }

  /**
   * Get TV packages/bouquets
   * @param {string} provider - TV provider
   * @param {string} token - JWT token (optional)
   * @returns {Promise}
   */
  static async getTVPackages(provider, token = null) {
    const serviceId = getTVServiceId(provider);
    
    return await apiService.get(
      `${API_CONFIG.ENDPOINTS.PAYMENTS.BASE}/tv-packages?provider=${serviceId}`,
      token
    );
  }

  /**
   * Subscribe to TV package
   * @param {Object} data - Subscription data
   * @param {string} data.smartcardNumber - Smartcard number
   * @param {string} data.provider - TV provider
   * @param {string} data.packageCode - Package/bouquet code
   * @param {number} data.amount - Amount
   * @param {string} data.pin - Transaction PIN
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async subscribeTVPackage(data, token) {
    const payload = {
      smartcardNumber: data.smartcardNumber,
      provider: getTVServiceId(data.provider),
      packageCode: data.packageCode,
      amount: Number(data.amount),
      pin: data.pin,
    };

    return await apiService.post(
      API_CONFIG.ENDPOINTS.PAYMENTS.PAY_TV,
      payload,
      token
    );
  }
}