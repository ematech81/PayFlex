
// src/services/PaymentService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaymentApiIPAddress } from 'utility/apiIPAdress';
import { STORAGE_KEYS } from 'utility/storageKeys';

// ---------- Configuration ----------
const BASE_URL = PaymentApiIPAddress;
const REQUEST_TIMEOUT = 30000; // 30 seconds for payment operations

// ---------- Helper Functions ----------

/**
 * Creates fetch request with timeout
 */
const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection.');
    }
    throw error;
  }
};


const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server returned invalid response format');
  }

  // ✅ Handle 304 Not Modified (cached response)
  if (response.status === 304) {
    console.log('⚠️ 304 Not Modified - using cached data');
    return { success: true, data: { transactions: [], pagination: {}, stats: {} } };
  }

  const data = await response.json();

  // Check HTTP layer
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  //  Check backend success flag
  if (data.success === false) {
    throw new Error(data.message || 'Transaction failed. Please try again.');
  }

  // 🔥 Also check VTpass transaction status
  if (data.vtpassStatus === 'failed' || data.status === 'failed') {
    throw new Error(data.message || 'VTpass rejected the transaction.');
  }

  return data;
};



/**
 * Makes authenticated payment request
 * @param {string} endpoint - API endpoint (e.g., '/buy-airtime', '/buy-data')
 * @param {object} paymentData - Payment data to send
 * @returns {Promise<object>} API response
 */
const makePaymentRequest = async (endpoint, paymentData) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    console.log('📤 Request URL:', `${BASE_URL}${endpoint}`);
    console.log('📤 Request Body:', JSON.stringify(paymentData, null, 2));
    console.log('📤 Token exists:', !!token);
    
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    const result = await handleResponse(response);
    console.log('✅ Payment request successful:', result);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Payment Error [${endpoint}]:`, error.message);
    throw error;
  }
};



// ---------- Payment Service Methods ----------

/**
 * Purchase airtime
 * @param {string} pin - Transaction PIN
 * @param {object} paymentData - Airtime payment data
 * @returns {Promise<object>} Purchase result
 */
export const purchaseAirtime = async (pin, paymentData) => {
  return makePaymentRequest('/buy-airtime', {
    phoneNumber: paymentData.phoneNumber,
    network: paymentData.network,  // ✅ CHANGED: provider → network
    amount: paymentData.amount,
    pin,
  });
};



/**
 * Purchase data bundle
 * @param {string} pin - Transaction PIN
 * @param {object} paymentData - Data payment data
 * @returns {Promise<object>} Purchase result
 */
export const purchaseData = async (pin, paymentData) => {

  console.log('🔐 PIN received in purchaseData:', pin);
  console.log('📦 Payment data received:', paymentData);
  
  return makePaymentRequest('/buy-data', {
    phoneNumber: paymentData.phoneNumber,
    network: paymentData.network,
    variation_code: paymentData.planId, // ✅ Changed from planId to variation_code
    amount: paymentData.planAmount || paymentData.amount,
    pin,
  });

};



// ----------ALL ELECTRICTY SUBSCRIPTION LOGICS ----------

/**
 * Pay electricity bill
 * @param {string} pin - Transaction PIN
 * @param {object} paymentData - Electricity payment data
 * @returns {Promise<object>} Payment result
 */
export const payElectricityBill = async (pin, paymentData) => {
  return makePaymentRequest('/pay-electricity', {
    meterNumber: paymentData.meterNumber,
    disco: paymentData.disco,
    meterType: paymentData.meterType,
    amount: paymentData.amount,
    phoneNumber: paymentData.phoneNumber,
    pin,
  });
};




/**
 * Verify meter number
 * @param {object} meterData - Meter verification data
 * @returns {Promise<object>} Verification result
 */
export const verifyMeter = async (meterData) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetchWithTimeout(`${BASE_URL}/verify-meter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(meterData),
    });

    return await handleResponse(response);
    
  } catch (error) {
    console.error('❌ Meter verification error:', error.message);
    throw error;
  }
};



/**
 * Pay internet subscription
 * @param {string} pin - Transaction PIN
 * @param {object} paymentData - Internet payment data
 * @returns {Promise<object>} Payment result
 */
export const payInternetSubscription = async (pin, paymentData) => {
  return makePaymentRequest('/pay-internet', {
    accountNumber: paymentData.accountNumber,
    provider: paymentData.provider,
    package: paymentData.package,
    amount: paymentData.amount,
    pin,
  });
};



// ----------ALL TV SUBSCRIPTION LOGICS ----------


/**
 * Purchase TV Subscription
 */
export const purchaseTVSubscription = async (pin, paymentData) => {
  return makePaymentRequest('/subscribe-tv', {
    smartcardNumber: paymentData.smartcardNumber,
    provider: paymentData.provider,
    variation_code: paymentData.variation_code,
    amount: paymentData.amount,
    phone: paymentData.phone || paymentData.phoneNumber,
    pin,
  });
};

/**
 * Renew TV Subscription
 */
export const renewTVSubscription = async (pin, paymentData) => {
  return makePaymentRequest('/renew-tv', {
    smartcardNumber: paymentData.smartcardNumber,
    provider: paymentData.provider,
    amount: paymentData.amount,
    phone: paymentData.phone || paymentData.phoneNumber,
    pin,
  });
}; 

/**
 * Verify Smartcard
 */
export const verifySmartcard = async (smartcardNumber, provider) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetchWithTimeout(`${BASE_URL}/verify-smartcard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ smartcardNumber, provider }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('❌ Verify Smartcard Error:', error.message);
    throw error;
  }
};

/**
 * Get Data Plans
 * @param {string} network - Network provider (mtn, airtel, glo, 9mobile)
 * @returns {Promise<Object>} Data plans response
 */
export const getDataPlans = async (network) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('📊 Fetching data plans for:', network);

    const response = await fetchWithTimeout(
      `${BASE_URL}/data-plans?network=${network}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await handleResponse(response);
    
    // Extract variations from the nested response structure
    const variations = result.data?.content?.variations || 
                      result.content?.variations || 
                      [];

    console.log(`✅ Loaded ${variations.length} data plans for ${network}`);

    return variations;
  } catch (error) {
    console.error('❌ Get Data Plans Error:', error.message);
    throw error;
  }
};



/**
 * Get TV Bouquets
 */
export const getTVBouquets = async (provider) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetchWithTimeout(
      `${BASE_URL}/tv-plans?provider=${provider}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return await handleResponse(response);
  } catch (error) {
    console.error('❌ Get TV Bouquets Error:', error.message);
    throw error;
  }
};





// ---------- EDUCATION SERVICE METHODS (VTU AFRICA) ----------

/**
 * Get Available Exam Products
 * @returns {Promise<Object>} Exam products by type
 */
export const getExamProducts = async () => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('📊 Fetching exam products...');

    const response = await fetchWithTimeout(
      `${BASE_URL}/exam-products`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await handleResponse(response);
    console.log('✅ Loaded exam products:', result.data);

    return result.data;
  } catch (error) {
    console.error('❌ Get Exam Products Error:', error.message);
    throw error;
  }
};

/**
 * Verify JAMB Profile Code
 * @param {string} profilecode - JAMB profile code
 * @param {string} product_code - Product code (1 = UTME, 2 = Direct Entry)
 * @returns {Promise<Object>} Verification result with candidate name
 */
export const verifyJAMBProfile = async (profilecode, product_code) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🔍 Verifying JAMB profile:', profilecode);

    const response = await fetchWithTimeout(
      `${BASE_URL}/verify-jamb-profile`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profilecode, product_code }),
      }
    );

    const result = await handleResponse(response);
    console.log('✅ JAMB profile verified:', result.data);

    return result;
  } catch (error) {
    console.error('❌ Verify JAMB Profile Error:', error.message);
    throw error;
  }
};

/**
 * Purchase Exam PIN
 * @param {string} pin - Transaction PIN
 * @param {object} paymentData - Exam payment data
 * @returns {Promise<object>} Purchase result with PINs
 */
export const purchaseExamPin = async (pin, paymentData) => {
  console.log('🔐 PIN received in purchaseExamPin:', pin);
  console.log('📦 Payment data received:', paymentData);
  
  const requestBody = {
    service: paymentData.service,
    product_code: paymentData.product_code,
    quantity: paymentData.quantity,
    phone: paymentData.phone,
    pin,
  };

  // Add JAMB specific fields if present
  if (paymentData.service === 'jamb') {
    requestBody.profilecode = paymentData.profilecode;
    requestBody.sender = paymentData.sender;
  }

  return makePaymentRequest('/purchase-exam-pin', requestBody);
};

/**
 * Verify Airtime to Cash Service
 * @param {string} network - Network provider
 * @returns {Promise<Object>} Service availability with transfer phone
 */
export const verifyAirtimeToCash = async (network) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🔍 Verifying Airtime to Cash service:', network);

    const response = await fetchWithTimeout(
      `${BASE_URL}/verify-airtime-to-cash`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ network }),
      }
    );

    const result = await handleResponse(response);
    console.log('✅ Service verification:', result);

    return result;
  } catch (error) {
    console.error('❌ Verify Airtime to Cash Error:', error.message);
    throw error;
  }
};

/**
 * Convert Airtime to Cash
 * @param {string} pin - Transaction PIN
 * @param {object} conversionData - Conversion data
 * @returns {Promise<object>} Conversion result
 */
export const convertAirtimeToCash = async (pin, conversionData) => {
  console.log('🔐 PIN received:', pin);
  console.log('📦 Conversion data:', conversionData);
  
  return makePaymentRequest('/convert-airtime-to-cash', {
    network: conversionData.network,
    senderNumber: conversionData.senderNumber,
    amount: conversionData.amount,
    sitePhone: conversionData.sitePhone,
    pin,
  });
};



// ----------CUSTOM FUNTION LOGICS ----------

/**
 * Get transaction details
 * @param {string} reference - Transaction reference
 * @returns {Promise<object>} Transaction details
 */
export const getTransactionDetails = async (reference) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetchWithTimeout(`${BASE_URL}/transactions/${reference}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return await handleResponse(response);
    
  } catch (error) {
    console.error('❌ Transaction details error:', error.message);
    throw error;
  }
};

/**
 * Get Transaction History with Filters
 */
// In PaymentService.js - Update this function

export const getTransactionHistory = async (filters = {}) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    // Build query params
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'all') {
      params.append('category', filters.category);
    }
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.limit) {
      params.append('limit', filters.limit);
    }

    const queryString = params.toString();
    const url = `${BASE_URL}/transactions/history${queryString ? `?${queryString}` : ''}`;

    console.log('🟢 PaymentService: Fetching from:', url);

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse(response);
    
    console.log('🟢 PaymentService: Data received:', data); // ✅ Add this
    
    return data;
  } catch (error) {
    console.error('❌ PaymentService: Get Transaction History Error:', error.message);
    throw error;
  }
};
// Export the service
export default {
  // Basic services
  purchaseAirtime,
  purchaseData,
  // tv sevice 
  purchaseTVSubscription,
  renewTVSubscription,
  verifySmartcard,
  getTVBouquets,
// electricity services 
  payElectricityBill,
  verifyMeter,
 
  payInternetSubscription,
  
// transaction services 
  getTransactionHistory,
  getTransactionDetails,

  
};

