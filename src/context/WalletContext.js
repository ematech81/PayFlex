import React, {
  createContext,
  useContext,
  useState,
  useReducer,
  useCallback,
  useEffect,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ApiIPAddress } from 'utility/apiIPAdress';
import { STORAGE_KEYS } from 'utility/storageKeys';
import { getTransactionHistory } from 'AuthFunction/paymentService';


const WalletContext = createContext();
const BASE_URL = ApiIPAddress;

const initialInvoiceState = {
  invoices: [], // { id, customer, title, dueDate, currency, products, discount, tax, total, notes, paymentDetails, status }
  customers: [], // { id, name, phone, email, extraDetails }
  currentInvoice: null, // For creation/editing
};

const invoiceReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_INVOICE':
      return {
        ...state,
        invoices: [...state.invoices, { ...action.payload, id: uuidv4() }],
        currentInvoice: null,
      };
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map((inv) =>
          inv.id === action.payload.id ? action.payload : inv
        ),
        currentInvoice: null,
      };
    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter((inv) => inv.id !== action.payload),
      };
    case 'SET_CURRENT_INVOICE':
      return { ...state, currentInvoice: action.payload };
    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [...state.customers, { ...action.payload, id: uuidv4() }],
      };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map((cust) =>
          cust.id === action.payload.id ? action.payload : cust
        ),
      };
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter((cust) => cust.id !== action.payload),
      };
    case 'SET_PAID':
      return {
        ...state,
        invoices: state.invoices.map((inv) =>
          inv.id === action.payload ? { ...inv, status: 'Paid' } : inv
        ),
      };
    default:
      return state;
  }
};

export const WalletProvider = ({ children }) => {
  const [invoiceState, invoiceDispatch] = useReducer(
    invoiceReducer,
    initialInvoiceState
  );
 

//wallet section
const [walletBalance, setWalletBalance] = useState(0); 
const [wallet, setWallet] = useState({
  token: null,
  user: null,
  transactionPinSet: false,
  isLoading: true,
});
const [transactions, setTransactions] = useState([]);
const [transactionStats, setTransactionStats] = useState(null);
const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

const normalizeUserData = (user) => {
  if (!user) return null;
  return {
    ...user,
    walletBalance: Number(user.walletBalance) || 0,
  };
};

// Load stored data on mount
useEffect(() => {
  loadStoredData();
}, []);

const loadStoredData = async () => {
  try {
    const [token, userStr, pinSetStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.USER),
      AsyncStorage.getItem('transactionPinSet'),
    ]);

    if (token && userStr) {
      const user = normalizeUserData(JSON.parse(userStr));
      const transactionPinSet = pinSetStr === 'true';

      setWallet({
        token,
        user,
        transactionPinSet,
        isLoading: false,
      });

      // Background verify (non-blocking)
      verifyUserSession(token, user);
    } else {
      setWallet(prev => ({ ...prev, isLoading: false }));
    }
  } catch (error) {
    console.error('Error loading wallet data:', error);
    setWallet(prev => ({ ...prev, isLoading: false }));
  }
};

const verifyUserSession = async (token, localUser) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });

    const serverUser = normalizeUserData(data.user || localUser);
    const serverPinSet = !!data.transactionPinSet;

    // Sync PIN if different
    if (serverPinSet !== wallet.transactionPinSet) {
      await AsyncStorage.setItem('transactionPinSet', String(serverPinSet));
      setWallet(prev => ({ ...prev, transactionPinSet: serverPinSet }));
    }

    // Sync user data if changed
    if (JSON.stringify(serverUser) !== JSON.stringify(localUser)) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(serverUser));
      setWallet(prev => ({ ...prev, user: serverUser }));
    }
  } catch (error) {
    if (error.response?.status === 401) {
      logout();
    }
  }
};

// ✅ FIX: Enhanced wallet refresh with retry logic
const refreshWallet = async (options = {}) => {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  
  if (!wallet.token) {
    console.log('❌ No token available for wallet refresh');
    return { success: false };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Refreshing wallet (attempt ${attempt}/${maxRetries})...`);
      
      const { data } = await axios.get(`${BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${wallet.token}` },
        timeout: 10000,
      });

      // ✅ FIX: Handle both possible response structures
      const user = normalizeUserData(data.user);
      const transactionPinSet = data.transactionPinSet === true || data.transactionPinSet === 'true';

      console.log('📡 Server response:', {
        success: data.success,
        transactionPinSet,
        walletBalance: user?.walletBalance,
        rawPinStatus: data.transactionPinSet,
      });

      // Validate we got proper data
      if (!user) {
        throw new Error('Invalid user data received from server');
      }

      // ✅ FIX: Save to AsyncStorage first, then update state
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
        AsyncStorage.setItem('transactionPinSet', String(transactionPinSet)),
      ]);

      // Update state after storage is confirmed
      setWallet(prev => ({
        ...prev,
        user,
        transactionPinSet,
        isLoading: false,
      }));

      console.log('✅ Wallet refreshed successfully:', { transactionPinSet });
      return { success: true, data: { user, transactionPinSet } };
      
    } catch (error) {
      console.error(`❌ Wallet refresh attempt ${attempt} failed:`, error.message);
      
      // If this isn't the last attempt, wait and retry
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // Last attempt failed
      console.error('❌ All wallet refresh attempts failed');
      return { success: false, error };
    }
  }
  
  return { success: false };
};

const login = async (token, userData) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = normalizeUserData(data.user || userData);
    const transactionPinSet = !!data.transactionPinSet;

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      AsyncStorage.setItem('transactionPinSet', String(transactionPinSet)),
    ]);

    setWallet({
      token,
      user,
      transactionPinSet,
      isLoading: false,
    });

    return { success: true };
  } catch (error) {
    console.error('Login server check failed:', error);
    // Fallback to local
    const user = normalizeUserData(userData);
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    setWallet({ token, user, transactionPinSet: false, isLoading: false });
    return { success: true };
  }
};

const logout = async () => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.TOKEN,
    STORAGE_KEYS.USER,
    'transactionPinSet',
  ]);
  setWallet({
    token: null,
    user: null,
    transactionPinSet: false,
    isLoading: false,
  });
};

// ✅ FIX: Updated PIN status handler - no background refresh
const updateTransactionPinStatus = async (pinSet = true) => {
  try {
    console.log('🔐 Updating transaction PIN status locally:', pinSet);
    
    // Update AsyncStorage
    await AsyncStorage.setItem('transactionPinSet', String(pinSet));
    
    // Update state
    setWallet(prev => ({ 
      ...prev, 
      transactionPinSet: pinSet 
    }));
    
    console.log('✅ Transaction PIN status updated locally:', pinSet);
    
    // ✅ FIX: Do NOT call refreshWallet here
    // Let the calling screen handle the refresh with proper timing
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to update PIN status:', error);
    throw error;
  }
};

const updateWalletBalance = async (newBalance) => {
  const balance = Number(newBalance) || 0;
  setWallet(prev => ({
    ...prev,
    user: prev.user ? { ...prev.user, walletBalance: balance } : null,
  }));

  if (wallet.user) {
    const updatedUser = { ...wallet.user, walletBalance: balance };
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
  }
};




/**
 * Fetch Transaction History
 */


const fetchTransactions = async (filters = {}) => {
  setIsLoadingTransactions(true);
  try {
    console.log('🔵 WalletContext: Fetching with filters:', filters);
    
    const response = await getTransactionHistory(filters);
    
    console.log('🔵 WalletContext: Response received:', response); // ✅ Add this
    
    if (response.success) {
      console.log('🔵 WalletContext: Transactions count:', response.data.transactions.length); // ✅ Add this
      
      setTransactions(response.data.transactions);
      setTransactionStats(response.data.stats);
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch transactions');
  } catch (error) {
    console.error('❌ WalletContext: Fetch Transactions Error:', error);
    setTransactions([]); // ✅ Add this - clear transactions on error
    throw error;
  } finally {
    setIsLoadingTransactions(false);
  }
};

  const calculateInvoice = useCallback((products, discount, tax) => {
    const subtotal = products.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    let discountAmount = 0;
    if (discount.value > 0) {
      discountAmount =
        discount.type === 'Fixed'
          ? discount.value
          : (subtotal * discount.value) / 100;
    }
    let taxAmount = 0;
    if (tax.value > 0) {
      taxAmount =
        tax.type === 'Fixed' ? tax.value : (subtotal * tax.value) / 100;
    }
    const total = subtotal - discountAmount + taxAmount;
    return { subtotal, discountAmount, taxAmount, total };
  }, []);

  const addInvoice = useCallback(
    (invoice) => {
      const {
        products,
        discount = { type: 'Fixed', value: 0 },
        tax = { type: 'Fixed', value: 0 },
      } = invoice;
      const { subtotal, discountAmount, taxAmount, total } = calculateInvoice(
        products,
        discount,
        tax
      );
      invoiceDispatch({
        type: 'ADD_INVOICE',
        payload: {
          ...invoice,
          subtotal,
          discountAmount,
          taxAmount,
          total,
          status: invoice.status || 'Draft',
        },
      });
    },
    [calculateInvoice]
  );

  const updateInvoice = useCallback(
    (invoice) => {
      const {
        products,
        discount = { type: 'Fixed', value: 0 },
        tax = { type: 'Fixed', value: 0 },
      } = invoice;
      const { subtotal, discountAmount, taxAmount, total } = calculateInvoice(
        products,
        discount,
        tax
      );
      invoiceDispatch({
        type: 'UPDATE_INVOICE',
        payload: { ...invoice, subtotal, discountAmount, taxAmount, total },
      });
    },
    [calculateInvoice]
  );

  const deleteInvoice = useCallback((id) => {
    invoiceDispatch({ type: 'DELETE_INVOICE', payload: id });
  }, []);

  const setCurrentInvoice = useCallback((invoice) => {
    invoiceDispatch({ type: 'SET_CURRENT_INVOICE', payload: invoice });
  }, []);

  const setInvoicePaid = useCallback((id) => {
    invoiceDispatch({ type: 'SET_PAID', payload: id });
  }, []);

  const addCustomer = useCallback((customer) => {
    invoiceDispatch({ type: 'ADD_CUSTOMER', payload: customer });
  }, []);

  const updateCustomer = useCallback((customer) => {
    invoiceDispatch({ type: 'UPDATE_CUSTOMER', payload: customer });
  }, []);

  const deleteCustomer = useCallback((id) => {
    invoiceDispatch({ type: 'DELETE_CUSTOMER', payload: id });
  }, []);

  const value = {
    invoices: invoiceState.invoices || [],
    customers: invoiceState.customers || [],
    currentInvoice: invoiceState.currentInvoice,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    setCurrentInvoice,
    setInvoicePaid,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    calculateInvoice,
    wallet,
    setWallet,
    walletBalance,
    setWalletBalance,
    updateWalletBalance,
    invoiceState,
    invoiceDispatch,
    login,
    logout,
    updateTransactionPinStatus,
    refreshWallet,
    wallet,
    transactions, 
    isLoadingTransactions, 
    fetchTransactions, 
    
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
