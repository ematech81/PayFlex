// services/referralService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReferralApiIPAddress } from 'utility/apiIPAdress';
import { STORAGE_KEYS } from 'utility/storageKeys';


const API_BASE_URL = ReferralApiIPAddress; // Update with your API URL
const REQUEST_TIMEOUT = 30000;

// ============================================
// HELPER FUNCTIONS
// ============================================

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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

// ============================================
// REFERRAL API FUNCTIONS
// ============================================

/**
 * Get user's referral information
 */
const getReferralInfo = async () => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('📊 Fetching referral info');

    const response = await fetchWithTimeout(`${API_BASE_URL}/referral`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await handleResponse(response);
    console.log('✅ Referral info loaded');

    return result;
  } catch (error) {
    console.error('❌ Get Referral Info Error:', error.message);
    throw error;
  }
};

/**
 * Validate referral code
 */
const validateReferralCode = async (referralCode) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🔍 Validating referral code:', referralCode);

    const response = await fetchWithTimeout(`${API_BASE_URL}/referral/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ referralCode }),
    });

    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('❌ Validate Referral Code Error:', error.message);
    throw error;
  }
};

/**
 * Apply referral code
 */
const applyReferralCode = async (referralCode) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🎁 Applying referral code:', referralCode);

    const response = await fetchWithTimeout(`${API_BASE_URL}/referral/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ referralCode }),
    });

    const result = await handleResponse(response);
    console.log('✅ Referral code applied');

    return result;
  } catch (error) {
    console.error('❌ Apply Referral Code Error:', error.message);
    throw error;
  }
};

/**
 * Get leaderboard
 */
const getLeaderboard = async (limit = 50) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🏆 Fetching leaderboard');

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/referral/leaderboard?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('❌ Get Leaderboard Error:', error.message);
    throw error;
  }
};

/**
 * Claim milestone reward
 */
const claimMilestoneReward = async (milestone) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🎉 Claiming milestone reward:', milestone);

    const response = await fetchWithTimeout(`${API_BASE_URL}/referral/claim-milestone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ milestone }),
    });

    const result = await handleResponse(response);
    console.log('✅ Milestone reward claimed');

    return result;
  } catch (error) {
    console.error('❌ Claim Milestone Reward Error:', error.message);
    throw error;
  }
};

export {
  getReferralInfo,
  validateReferralCode,
  applyReferralCode,
  getLeaderboard,
  claimMilestoneReward,
};

export default {
  getReferralInfo,
  validateReferralCode,
  applyReferralCode,
  getLeaderboard,
  claimMilestoneReward,
};