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

const WalletContext = createContext();
const BASE_URL = 'http://192.168.43.191:5000/api/auth';

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
  const [walletBalance, setWalletBalance] = useState(200); // Example initial balance
  const [invoiceState, invoiceDispatch] = useReducer(
    invoiceReducer,
    initialInvoiceState
  );
 

  const [wallet, setWallet] = useState({
    token: null,
    user: null,
    transactionPinSet: false,
    isLoading: true, // ✅ Add loading state
  });


  
  const [isCheckingPin, setIsCheckingPin] = useState(false);


  /**
   * Load stored data on app startup
   */
  useEffect(() => {
    loadStoredData();
  }, []);

  /**
   * Load user data from AsyncStorage
   */
  const loadStoredData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const pinSetStr = await AsyncStorage.getItem('transactionPinSet'); // ✅ Store locally

      if (token && userStr) {
        const parsedUser = JSON.parse(userStr);
        const transactionPinSet = pinSetStr === 'true'; // ✅ Check local first

        setWallet({
          token,
          user: parsedUser,
          transactionPinSet,
          isLoading: false,
        });

        // ✅ Verify with server in background (don't block UI)
        verifyUserSession(token, parsedUser);
      } else {
        setWallet(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
      setWallet(prev => ({ ...prev, isLoading: false }));
    }
  };


  /**
   * Verify user session with server (background check)
   */
  const verifyUserSession = async (token, user) => {
    try {
      const response = await axios.get(`${BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 second timeout
      });

      const serverPinSet = !!response.data.transactionPinSet;
      const serverUser = response.data.user || user;

      // ✅ Update if server data differs from local
      if (serverPinSet !== wallet.transactionPinSet) {
        await AsyncStorage.setItem('transactionPinSet', String(serverPinSet));
        setWallet(prev => ({
          ...prev,
          transactionPinSet: serverPinSet,
          user: serverUser,
        }));
      }



      // ✅ Update user info if changed
      if (JSON.stringify(serverUser) !== JSON.stringify(user)) {
        await AsyncStorage.setItem('user', JSON.stringify(serverUser));
        setWallet(prev => ({
          ...prev,
          user: serverUser,
        }));
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      // ✅ Don't logout on network error - keep local data
      if (error.response?.status === 401) {
        // Only logout if token is actually invalid
        logout();
      }
    }
  };




  /**
   * Login user
   */
  const login = async (token, user) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // ✅ Check transaction PIN from server
      try {
        const response = await axios.get(`${BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        
        const transactionPinSet = !!response.data.transactionPinSet;
        await AsyncStorage.setItem('transactionPinSet', String(transactionPinSet));

        setWallet({
          token,
          user: response.data.user || user,
          transactionPinSet,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching user data on login:', error);
        
        // ✅ Still allow login even if PIN check fails
        setWallet({
          token,
          user,
          transactionPinSet: false, // Default to false
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error storing login data:', error);
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user', 'transactionPinSet']);
      setWallet({
        token: null,
        user: null,
        transactionPinSet: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  };

  /**
   * Update transaction PIN status
   * Called after user sets PIN for first time
   */
  const updateTransactionPinStatus = async (pinSet = true) => {
    setIsCheckingPin(true);
    
    try {
      // ✅ Update locally immediately (optimistic update)
      await AsyncStorage.setItem('transactionPinSet', String(pinSet));
      setWallet(prev => ({
        ...prev,
        transactionPinSet: pinSet,
      }));

      // ✅ Verify with server in background
      if (wallet.token) {
        try {
          const response = await axios.get(`${BASE_URL}/me`, {
            headers: { Authorization: `Bearer ${wallet.token}` },
            timeout: 10000,
          });
          
          const serverPinSet = !!response.data.transactionPinSet;
          
          // Update if server differs
          if (serverPinSet !== pinSet) {
            await AsyncStorage.setItem('transactionPinSet', String(serverPinSet));
            setWallet(prev => ({
              ...prev,
              transactionPinSet: serverPinSet,
            }));
          }
        } catch (error) {
          console.error('Error syncing PIN status with server:', error);
          // Keep local value if server check fails
        }
      }
    } catch (error) {
      console.error('Error updating transaction PIN status:', error);
    } finally {
      setIsCheckingPin(false);
    }
  };

  /**
   * Refresh user data from server
   */
  const refreshUserData = async () => {
    if (!wallet.token) return;

    try {
      const response = await axios.get(`${BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${wallet.token}` },
        timeout: 10000,
      });

      const serverUser = response.data.user;
      const serverPinSet = !!response.data.transactionPinSet;

      await AsyncStorage.setItem('user', JSON.stringify(serverUser));
      await AsyncStorage.setItem('transactionPinSet', String(serverPinSet));

      setWallet(prev => ({
        ...prev,
        user: serverUser,
        transactionPinSet: serverPinSet,
      }));

      return { success: true };
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return { success: false, error };
    }
  };

  /**
   * Update wallet balance locally
   */
  const updateWalletBalance = (newBalance) => {
    setWalletBalance(newBalance);
    
    // Also update in wallet.user if it exists there
    if (wallet.user) {
      setWallet(prev => ({
        ...prev,
        user: {
          ...prev.user,
          walletBalance: newBalance,
        },
      }));
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
    refreshUserData,
    isCheckingPin,
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
