
import AsyncStorage from '@react-native-async-storage/async-storage';

const BENEFICIARY_KEYS = {
  AIRTIME: '@beneficiaries_airtime',
  DATA: '@beneficiaries_data',
  ELECTRICITY: '@beneficiaries_electricity',
  TV: '@beneficiaries_tv',
  EDUCATION: '@beneficiaries_education',
};

/**
 * Beneficiary Storage Utility
 * Manages saved beneficiaries for different services
 */

/**
 * Get beneficiaries for a service
 * @param {string} serviceType - Service type (airtime, data, electricity, tv, education)
 * @returns {Promise<Array>} Array of beneficiaries
 */
export const getBeneficiaries = async (serviceType) => {
  try {
    const key = BENEFICIARY_KEYS[serviceType.toUpperCase()];
    if (!key) {
      console.warn('Invalid service type:', serviceType);
      return [];
    }

    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting beneficiaries:', error);
    return [];
  }
};

/**
 * Save a new beneficiary
 * @param {string} serviceType - Service type
 * @param {Object} beneficiary - Beneficiary data
 * @returns {Promise<boolean>} Success status
 */
export const saveBeneficiary = async (serviceType, beneficiary) => {
  try {
    const key = BENEFICIARY_KEYS[serviceType.toUpperCase()];
    if (!key) {
      console.warn('Invalid service type:', serviceType);
      return false;
    }

    const existing = await getBeneficiaries(serviceType);
    
    // Check if beneficiary already exists (by identifier)
    const identifier = beneficiary.phoneNumber || beneficiary.meterNumber || 
                      beneficiary.smartcardNumber || beneficiary.profileCode;
    
    const exists = existing.some(b => {
      const existingId = b.phoneNumber || b.meterNumber || 
                        b.smartcardNumber || b.profileCode;
      return existingId === identifier;
    });

    if (exists) {
      console.log('Beneficiary already exists');
      return true;
    }

    // Add timestamp and limit to 10 beneficiaries
    const newBeneficiary = {
      ...beneficiary,
      savedAt: new Date().toISOString(),
    };

    const updated = [newBeneficiary, ...existing].slice(0, 10);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    
    console.log('✅ Beneficiary saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving beneficiary:', error);
    return false;
  }
};

/**
 * Delete a beneficiary
 * @param {string} serviceType - Service type
 * @param {string} identifier - Beneficiary identifier (phone, meter, etc.)
 * @returns {Promise<boolean>} Success status
 */
export const deleteBeneficiary = async (serviceType, identifier) => {
  try {
    const key = BENEFICIARY_KEYS[serviceType.toUpperCase()];
    if (!key) return false;

    const existing = await getBeneficiaries(serviceType);
    const filtered = existing.filter(b => {
      const id = b.phoneNumber || b.meterNumber || 
                b.smartcardNumber || b.profileCode;
      return id !== identifier;
    });

    await AsyncStorage.setItem(key, JSON.stringify(filtered));
    console.log('✅ Beneficiary deleted');
    return true;
  } catch (error) {
    console.error('Error deleting beneficiary:', error);
    return false;
  }
};

/**
 * Update beneficiary (moves to top of list on reuse)
 * @param {string} serviceType - Service type
 * @param {string} identifier - Beneficiary identifier
 * @returns {Promise<boolean>} Success status
 */
export const updateBeneficiaryUsage = async (serviceType, identifier) => {
  try {
    const existing = await getBeneficiaries(serviceType);
    const beneficiary = existing.find(b => {
      const id = b.phoneNumber || b.meterNumber || 
                b.smartcardNumber || b.profileCode;
      return id === identifier;
    });

    if (beneficiary) {
      await deleteBeneficiary(serviceType, identifier);
      await saveBeneficiary(serviceType, {
        ...beneficiary,
        lastUsed: new Date().toISOString(),
      });
    }
    return true;
  } catch (error) {
    console.error('Error updating beneficiary:', error);
    return false;
  }
};

/**
 * Clear all beneficiaries for a service
 * @param {string} serviceType - Service type
 * @returns {Promise<boolean>} Success status
 */
export const clearBeneficiaries = async (serviceType) => {
  try {
    const key = BENEFICIARY_KEYS[serviceType.toUpperCase()];
    if (!key) return false;

    await AsyncStorage.removeItem(key);
    console.log('✅ All beneficiaries cleared');
    return true;
  } catch (error) {
    console.error('Error clearing beneficiaries:', error);
    return false;
  }
};