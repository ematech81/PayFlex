
// src/AuthFunction/PaymentService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaymentApiIPAddress, GeneralApiIPAddress } from 'utility/apiIPAdress';
import { STORAGE_KEYS } from 'utility/storageKeys';

// ---------- Configuration ----------
const BASE_URL     = PaymentApiIPAddress;   // /api/payments  (legacy VTPass routes)
const GENERAL_BASE = GeneralApiIPAddress;   // /api           (new VTU Africa routes)
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

  // 304 Not Modified — backend now sends Cache-Control: no-store for MERPI
  // routes so this should not occur. If it does, return null so callers
  // treat it as no data rather than silently returning stale transaction data.
  if (response.status === 304) {
    console.warn('⚠️ 304 Not Modified — unexpected for this endpoint');
    return null;
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



// POST helper for the new /api/* routes (exam-pins, betting)
const makeGeneralRequest = async (path, body) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!token) throw new Error('Authentication required. Please log in again.');

  const response = await fetchWithTimeout(`${GENERAL_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

// GET helper for the new /api/* routes
const makeGeneralGet = async (path) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!token) throw new Error('Authentication required. Please log in again.');

  const response = await fetchWithTimeout(`${GENERAL_BASE}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  return handleResponse(response);
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
 * @returns {Promise<Array>} Available exam products
 */
export const getExamProducts = async () => {
  try {
    const result = await makeGeneralGet('/exam-pins/catalog');
    return result.products || [];
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
    if (!token) throw new Error('Authentication required');

    const response = await fetchWithTimeout(`${GENERAL_BASE}/exam-pins/verify-jamb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ profilecode, productCode: product_code }),
    });

    const result = await handleResponse(response);
    // Normalise to the shape expected by EducationPurchaseScreen / JAMBVerificationCard
    return {
      success: result.success,
      data: {
        customerName: result.candidateName,
        profileCode:  result.profileCode,
        service:      result.productName,
        sellingPrice: result.sellingPrice,
      },
    };
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
  const examBody = paymentData.service || paymentData.examBody;

  const requestBody = {
    examBody,
    productCode:    paymentData.product_code  || paymentData.productCode,
    quantity:       paymentData.quantity,
    recipientPhone: paymentData.phone         || paymentData.recipientPhone,
    pin,
  };

  if (examBody === 'jamb') {
    requestBody.profilecode    = paymentData.profilecode;
    requestBody.recipientEmail = paymentData.sender         || paymentData.recipientEmail;
    requestBody.candidateName  = paymentData.verifiedCandidate?.customerName;
  }

  return makeGeneralRequest('/exam-pins/purchase', requestBody);
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





// ----------betting ----------

/**
 * Verify Betting Account
 * @param {string} service - Betting platform code (e.g. 'bet9ja')
 * @param {string} userid  - Betting account user ID
 * @returns {Promise<Object>} Verification result with customer name
 */
export const verifyBettingAccount = async (service, userid) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) throw new Error('Authentication required');

    const response = await fetchWithTimeout(`${GENERAL_BASE}/betting/verify-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ platform: service, userid }),
    });

    const result = await handleResponse(response);
    // Normalise to the shape expected by BettingScreen / VerifiedAccountCard
    return {
      success: result.success,
      data: {
        customerName: result.customerName,
        userId:       result.userId,
        service:      result.platformName,
        platform:     result.platform,
      },
    };
  } catch (error) {
    console.error('❌ Verify Betting Account Error:', error.message);
    throw error;
  }
};

/**
 * Get Betting Platform Catalog (fee tiers, supported platforms)
 * @returns {Promise<object>} { normalFee, microFee, microThreshold, minAmount, maxAmount, platforms }
 */
export const getBettingPlatforms = async () => {
  try {
    const result = await makeGeneralGet('/betting/platforms');
    return result;
  } catch (error) {
    console.error('❌ Get Betting Platforms Error:', error.message);
    throw error;
  }
};

/**
 * Fund Betting Account
 * @param {string} pin         - Transaction PIN
 * @param {object} fundingData - { service, userid, verifiedAccount, amount }
 * @returns {Promise<object>} Funding result
 */
export const fundBettingAccount = async (pin, fundingData) => {
  return makeGeneralRequest('/betting/fund', {
    platform:     fundingData.service,
    userid:       fundingData.userid,
    customerName: fundingData.verifiedAccount?.customerName || null,
    amount:       fundingData.amount,
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
// ─── CAC VAS ──────────────────────────────────────────────────────────────────

/** Free BN name availability check — no PIN required */
export const cacValidateName = (proposedName) =>
  makeGeneralRequest('/cac/validate-name', { proposedName });

/** BN compliance pre-check with advanceCheck=true — free, returns statusCode + suggestions */
export const cacCheckCompliance = (proposedName, lineOfBusiness) =>
  makeGeneralRequest('/cac/compliance', { proposedName, lineOfBusiness });

/** Validate full registration payload (images stripped server-side) before wallet deduction */
export const cacValidatePayload = (payload) =>
  makeGeneralRequest('/cac/validate', payload);

/** Fetch public pricing for BN registration and validation */
export const cacGetPrices = () => makeGeneralGet('/cac/prices');

/** Submit Business Name registration — PIN sent in body (backend verifyPin middleware) */
export const cacRegisterBusinessName = (pin, form) =>
  makeGeneralRequest('/cac/register/business-name', {
    proposedName:    form.proposedOption1,
    priorityService: !!form.priorityService,
    pin,
    registrationData: {
      proposedOption1:             form.proposedOption1,
      proposedOption2:             form.proposedOption2,
      lineOfBusiness:              form.lineOfBusiness,
      businessCommencementDate:    form.businessCommencementDate,
      proprietorFirstname:         form.proprietorFirstname,
      proprietorOthername:         form.proprietorOthername,
      proprietorSurname:           form.proprietorSurname,
      proprietorGender:            form.proprietorGender,
      proprietorDob:               form.proprietorDob,
      proprietorNationality:       form.proprietorNationality,
      proprietorPhonenumber:       form.proprietorPhonenumber,
      proprietorEmail:             form.proprietorEmail,
      proprietorStreetNumber:      form.proprietorStreetNumber,
      proprietorServiceAddress:    form.proprietorServiceAddress,
      proprietorCity:              form.proprietorCity,
      proprietorState:             form.proprietorState,
      proprietorLga:               form.proprietorLga,
      proprietorPostcode:          form.proprietorPostcode,
      companyEmail:                form.companyEmail,
      companyStreetNumber:         form.companyStreetNumber,
      companyAddress:              form.companyAddress,
      companyCity:                 form.companyCity,
      companyState:                form.companyState,
      passport:                    form.passport,
      meansOfId:                   form.meansOfId,
      signature:                   form.signature,
      ...(form.supportingDoc            && { supportingDoc:            form.supportingDoc }),
      ...(form.proprietorProofOfAddress && { proprietorProofOfAddress: form.proprietorProofOfAddress }),
      ...(form.businessProofOfAddress   && { businessProofOfAddress:   form.businessProofOfAddress }),
    },
  });

/** Poll registration status by transactionRef */
export const cacGetRegistrationStatus = (transactionRef) =>
  makeGeneralGet(`/cac/registration/${transactionRef}`);

/** Download CAC certificate after approval — PIN required (wallet deduction) */
export const cacDownloadCertificate = (pin, transactionRef) =>
  makeGeneralRequest(`/cac/registration/${transactionRef}/certificate`, { transactionRef, pin });

/** Business validation search — PIN sent in body */
export const cacSearchBusiness = (pin, validationType, searchParam) =>
  makeGeneralRequest('/cac/search', { validationType, searchParam, pin });

/** CAC registration + validation history */
export const cacGetHistory = () => makeGeneralGet('/cac/history');

// ─── GET helper with query params ────────────────────────────────────────────
const makeGeneralGetQuery = async (path, params = {}) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!token) throw new Error('Authentication required. Please log in again.');
  const query = Object.keys(params).filter(k => params[k] != null)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
  const url = `${GENERAL_BASE}${path}${query ? `?${query}` : ''}`;
  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  return handleResponse(response);
};

// ─── MERPI / Syticks — Bus Tickets ───────────────────────────────────────────
export const merpiGetStates    = (params)     => makeGeneralGetQuery('/merpi/bus/states', params);
export const merpiGetCities    = (params)     => makeGeneralGetQuery('/merpi/bus/cities', params);
export const merpiGetRoutes    = (params)     => makeGeneralGetQuery('/merpi/bus/routes', params);
// Buses are physical vehicles assigned to a schedule — fetched by schedule_id path param
export const merpiGetBuses     = (scheduleId) => makeGeneralGet(`/merpi/bus/buses/${scheduleId}`);
export const merpiGetSchedules = (params)     => makeGeneralGetQuery('/merpi/bus/schedules', params);
// V2 packages — for random schedules, returns operating_hours + buses[] (bus_id/start_time/end_time)
export const merpiGetSchedulePackages = (params) => makeGeneralGetQuery('/merpi/bus/schedules/packages', params);
// Seat grid is keyed by schedule_id/bus_id/departure_date path params (YYYY-MM-DD)
export const merpiGetSeats     = (scheduleId, busId, departureDate) =>
  makeGeneralGet(`/merpi/bus/seats/${scheduleId}/${busId}/${departureDate}`);
export const merpiBuyBusTicket = (pin, data)  => makeGeneralRequest('/merpi/bus/buy', { ...data, pin });

// ─── MERPI / Syticks — Events ─────────────────────────────────────────────────
export const merpiGetEvents          = (params) => makeGeneralGetQuery('/merpi/events', params);
export const merpiGetEventDetails    = (id)     => makeGeneralGet(`/merpi/events/${id}`);
export const merpiGetEventTickets    = (id)     => makeGeneralGet(`/merpi/events/${id}/tickets`);
export const merpiBuyEventTickets    = (pin, data) => makeGeneralRequest('/merpi/events/buy', { ...data, pin });

// ─── MERPI / Syticks — Cinema ─────────────────────────────────────────────────
export const merpiGetMovies          = (params) => makeGeneralGetQuery('/merpi/cinema', params);
export const merpiGetCinemaDetails   = (id)     => makeGeneralGet(`/merpi/cinema/${id}`);
export const merpiGetCinemaDates     = (id, month) => makeGeneralGet(`/merpi/cinema/${id}/dates/${month}`);
export const merpiGetCinemaTickets   = (id, cinemaLocationId) =>
  makeGeneralGetQuery(`/merpi/cinema/${id}/tickets`, { cinema_location_id: cinemaLocationId });
export const merpiBuyCinemaTickets   = (pin, data) => makeGeneralRequest('/merpi/cinema/buy', { ...data, pin });

// ─── MERPI / Syticks — Hospitality (Hotels/Apartments/Resorts) ────────────────
export const merpiGetHotels          = (params) => makeGeneralGetQuery('/merpi/hotels', params);
export const merpiGetHotelRooms      = (hotelId, params) => makeGeneralGetQuery(`/merpi/hotels/${hotelId}/rooms`, params);
export const merpiBookHotelRoom      = (pin, data) => makeGeneralRequest('/merpi/hotels/buy', { ...data, pin });

// ─── MERPI / Syticks — General ────────────────────────────────────────────────
export const merpiGetCategories  = ()          => makeGeneralGet('/merpi/categories');
export const merpiGetBusinesses  = (params)    => makeGeneralGetQuery('/merpi/businesses', params);
export const merpiGetTransaction = (reference) => makeGeneralGet(`/merpi/transactions/${reference}`);

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

  // betting
  verifyBettingAccount,
  fundBettingAccount,
  getBettingPlatforms,
};

