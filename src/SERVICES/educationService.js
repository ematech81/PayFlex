import { API_CONFIG } from "CONFIG/apiConfig";
import { apiService } from "./API/apiBaseService";

/**
 * Education Service
 * Handles educational payment operations (WAEC, JAMB, NECO)
 */



export class EducationService {
  /**
   * Get exam types and prices
   * @param {string} examBody - Exam body (waec, jamb, neco)
   * @param {string} token - JWT token (optional)
   * @returns {Promise}
   */
  static async getExamTypes(examBody, token = null) {
    return await apiService.get(
      `${API_CONFIG.ENDPOINTS.PAYMENTS.BASE}/education/exam-types?provider=${examBody}`,
      token
    );
  }

  /**
   * Verify candidate details
   * @param {Object} data - Candidate data
   * @param {string} data.examBody - Exam body
   * @param {string} data.candidateNumber - Candidate number
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async verifyCandidateDetails(data, token) {
    return await apiService.post(
      `${API_CONFIG.ENDPOINTS.PAYMENTS.BASE}/education/verify-candidate`,
      {
        examBody: data.examBody,
        candidateNumber: data.candidateNumber,
      },
      token
    );
  }

  /**
   * Pay for exam
   * @param {Object} data - Payment data
   * @param {string} data.examBody - Exam body (waec, jamb, neco)
   * @param {string} data.examType - Exam type/variation
   * @param {number} data.quantity - Number of pins
   * @param {number} data.amount - Amount
   * @param {string} data.pin - Transaction PIN
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async payForExam(data, token) {
    const payload = {
      examBody: data.examBody.toLowerCase(),
      examType: data.examType,
      quantity: Number(data.quantity),
      amount: Number(data.amount),
      pin: data.pin,
    };

    return await apiService.post(
      API_CONFIG.ENDPOINTS.PAYMENTS.PAY_EDUCATION,
      payload,
      token
    );
  }

  /**
   * Get exam history
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  static async getExamHistory(token) {
    return await apiService.get(
      `${API_CONFIG.ENDPOINTS.PAYMENTS.BASE}/education/history`,
      token
    );
  }
}