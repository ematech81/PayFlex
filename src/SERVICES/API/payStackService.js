
import axios from 'axios';
import { PayStackApiIPAddress } from 'utility/apiIPAdress';

const API_URL = PayStackApiIPAddress;

export const initializePayment = async (amount, service, serviceData, token) => {
  const response = await axios.post(
    `${API_URL}/initialize`,
    { amount, service, serviceData },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const verifyPayment = async (reference, token) => {
  const response = await axios.get(
    `${API_URL}/verify/${reference}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getPaymentHistory = async (token) => {
  const response = await axios.get(
    `${API_URL}/history`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};