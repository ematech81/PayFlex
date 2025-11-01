
import axios from 'axios';
import { API_CONFIG, createRequestConfig } from 'CONFIG/apiConfig';

export const fetchDataPlans = async (provider, token) => {
  try {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DATA_PLANS}?network=${provider}`;
    const config = createRequestConfig(token);

    console.log('📡 Fetching data plans:', url);

    const response = await axios.get(url, config);
    console.log('✅ Data plans response:', response.data);
    return response.data?.content?.variations || [];
  } catch (error) {
    console.error('❌ Failed to load data plans:', error.response?.data || error.message);
    return [];
  }
};
