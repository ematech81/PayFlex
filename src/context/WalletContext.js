import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ApiIPAddress, InvoiceApiIPAddress } from 'utility/apiIPAdress';
import { STORAGE_KEYS } from 'utility/storageKeys';
import { getTransactionHistory } from 'AuthFunction/paymentService';
import { clearPushToken } from 'utility/pushNotifications';

const WalletContext = createContext();
const BASE_URL = ApiIPAddress;

// ─── axios instance for invoice API (token injected per-call) ─────────────────
const invoiceApi = axios.create({ baseURL: InvoiceApiIPAddress, timeout: 15000 });

export const WalletProvider = ({ children }) => {
  // ─── wallet / auth state ────────────────────────────────────────────────────
  const [wallet, setWallet] = useState({
    token: null,
    user: null,
    transactionPinSet: false,
    isLoading: true,
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [transactionStats, setTransactionStats] = useState(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // ─── invoice state ──────────────────────────────────────────────────────────
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [currentInvoice, setCurrentInvoiceState] = useState(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  // Keep a ref so API helpers always see the latest token without stale closure
  const tokenRef = useRef(null);

  const authHeader = () => ({ Authorization: `Bearer ${tokenRef.current}` });

  // ─── wallet helpers ─────────────────────────────────────────────────────────
  const normalizeUserData = (user) => {
    if (!user) return null;
    return { ...user, walletBalance: Number(user.walletBalance) || 0 };
  };

  useEffect(() => {
    loadStoredData();
  }, []);

  // Sync ref whenever token changes
  useEffect(() => {
    tokenRef.current = wallet.token;
  }, [wallet.token]);

  const loadStoredData = async () => {
    try {
      const [token, userStr, pinSetStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem('transactionPinSet'),
      ]);

      if (token && userStr) {
        tokenRef.current = token;
        const user = normalizeUserData(JSON.parse(userStr));
        setWallet({ token, user, transactionPinSet: pinSetStr === 'true', isLoading: false });
        verifyUserSession(token, user);
      } else {
        setWallet((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setWallet((prev) => ({ ...prev, isLoading: false }));
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
      if (serverPinSet !== wallet.transactionPinSet) {
        await AsyncStorage.setItem('transactionPinSet', String(serverPinSet));
        setWallet((prev) => ({ ...prev, transactionPinSet: serverPinSet }));
      }
      if (JSON.stringify(serverUser) !== JSON.stringify(localUser)) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(serverUser));
        setWallet((prev) => ({ ...prev, user: serverUser }));
      }
    } catch (error) {
      if (error.response?.status === 401) logout();
    }
  };

  const refreshWallet = async (options = {}) => {
    const { maxRetries = 3, retryDelay = 1000 } = options;
    if (!tokenRef.current) return { success: false };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data } = await axios.get(`${BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${tokenRef.current}` },
          timeout: 10000,
        });
        const user = normalizeUserData(data.user);
        const transactionPinSet =
          data.transactionPinSet === true || data.transactionPinSet === 'true';
        if (!user) throw new Error('Invalid user data received');
        console.log(`[refreshWallet] server returned walletBalance=${data.user?.walletBalance} for phone=${data.user?.phone}`);
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
          AsyncStorage.setItem('transactionPinSet', String(transactionPinSet)),
        ]);
        setWallet((prev) => ({ ...prev, user, transactionPinSet, isLoading: false }));
        return { success: true, data: { user, transactionPinSet } };
      } catch (error) {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, retryDelay));
          continue;
        }
        return { success: false, error };
      }
    }
    return { success: false };
  };

  const login = async (token, userData) => {
    try {
      tokenRef.current = token;
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
      setWallet({ token, user, transactionPinSet, isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('Login server check failed:', error);
      tokenRef.current = token;
      const user = normalizeUserData(userData);
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      setWallet({ token, user, transactionPinSet: false, isLoading: false });
      return { success: true };
    }
  };

  const logout = async () => {
    tokenRef.current = null;
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER, 'transactionPinSet']);
    await clearPushToken().catch(() => {});
    setWallet({ token: null, user: null, transactionPinSet: false, isLoading: false });
  };

  const updateTransactionPinStatus = async (pinSet = true) => {
    await AsyncStorage.setItem('transactionPinSet', String(pinSet));
    setWallet((prev) => ({ ...prev, transactionPinSet: pinSet }));
    return { success: true };
  };

  const updateWalletBalance = async (newBalance) => {
    const balance = Number(newBalance) || 0;
    setWallet((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, walletBalance: balance } : null,
    }));
    if (wallet.user) {
      const updatedUser = { ...wallet.user, walletBalance: balance };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  };

  // ─── transactions ───────────────────────────────────────────────────────────
  const fetchTransactions = async (filters = {}) => {
    setIsLoadingTransactions(true);
    try {
      const response = await getTransactionHistory(filters);
      if (response.success) {
        setTransactions(response.data.transactions);
        setTransactionStats(response.data.stats);
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch transactions');
    } catch (error) {
      console.error('❌ WalletContext: Fetch Transactions Error:', error);
      setTransactions([]);
      throw error;
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // ─── invoice calculations (replicated from original, kept for offline use) ──
  const calculateInvoice = useCallback((products, discount, tax) => {
    const subtotal = products.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const discountAmount =
      discount.value > 0
        ? discount.type === 'Fixed'
          ? discount.value
          : (subtotal * discount.value) / 100
        : 0;
    const taxAmount =
      tax.value > 0
        ? tax.type === 'Fixed'
          ? tax.value
          : (subtotal * tax.value) / 100
        : 0;
    return { subtotal, discountAmount, taxAmount, total: subtotal - discountAmount + taxAmount };
  }, []);

  // ─── customer API functions ─────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    try {
      const { data } = await invoiceApi.get('/customers', { headers: authHeader() });
      setCustomers(data.data || []);
      return data.data;
    } catch (error) {
      console.error('❌ Fetch Customers Error:', error.message);
      throw error;
    }
  }, []);

  const addCustomer = useCallback(async (customer) => {
    try {
      const { data } = await invoiceApi.post('/customers', customer, {
        headers: authHeader(),
      });
      setCustomers((prev) => [data.data, ...prev]);
      return data.data;
    } catch (error) {
      console.error('❌ Add Customer Error:', error.message);
      throw error;
    }
  }, []);

  const updateCustomer = useCallback(async (customer) => {
    try {
      const { data } = await invoiceApi.put(`/customers/${customer._id || customer.id}`, customer, {
        headers: authHeader(),
      });
      setCustomers((prev) =>
        prev.map((c) => (c._id === data.data._id ? data.data : c))
      );
      return data.data;
    } catch (error) {
      console.error('❌ Update Customer Error:', error.message);
      throw error;
    }
  }, []);

  const deleteCustomer = useCallback(async (id) => {
    try {
      await invoiceApi.delete(`/customers/${id}`, { headers: authHeader() });
      setCustomers((prev) => prev.filter((c) => c._id !== id && c.id !== id));
    } catch (error) {
      console.error('❌ Delete Customer Error:', error.message);
      throw error;
    }
  }, []);

  // ─── invoice API functions ──────────────────────────────────────────────────
  const fetchInvoices = useCallback(async (filters = {}) => {
    setIsLoadingInvoices(true);
    try {
      const { data } = await invoiceApi.get('/', {
        params: filters,
        headers: authHeader(),
      });
      setInvoices(data.data || []);
      return data.data;
    } catch (error) {
      console.error('❌ Fetch Invoices Error:', error.message);
      throw error;
    } finally {
      setIsLoadingInvoices(false);
    }
  }, []);

  const addInvoice = useCallback(async (invoice) => {
    try {
      const { data } = await invoiceApi.post('/', invoice, { headers: authHeader() });
      setInvoices((prev) => [data.data, ...prev]);
      return data.data;
    } catch (error) {
      console.error('❌ Add Invoice Error:', error.message);
      throw error;
    }
  }, []);

  const updateInvoice = useCallback(async (invoice) => {
    try {
      // _id is only present on invoices that already exist in the database.
      // Screens (InvoiceProcessingScreen) call updateInvoice for both new and
      // existing invoices, so route accordingly.
      const mongoId = invoice._id;
      if (!mongoId) {
        // No _id → this is a brand-new invoice coming from the creation flow
        const { data } = await invoiceApi.post('/', invoice, { headers: authHeader() });
        setInvoices((prev) => [data.data, ...prev]);
        return data.data;
      }
      const { data } = await invoiceApi.put(`/${mongoId}`, invoice, { headers: authHeader() });
      setInvoices((prev) => prev.map((inv) => (inv._id === data.data._id ? data.data : inv)));
      return data.data;
    } catch (error) {
      console.error('❌ Update Invoice Error:', error.message);
      throw error;
    }
  }, []);

  const deleteInvoice = useCallback(async (id) => {
    try {
      await invoiceApi.delete(`/${id}`, { headers: authHeader() });
      setInvoices((prev) => prev.filter((inv) => inv._id !== id && inv.id !== id));
    } catch (error) {
      console.error('❌ Delete Invoice Error:', error.message);
      throw error;
    }
  }, []);

  const setInvoicePaid = useCallback(async (id) => {
    try {
      const { data } = await invoiceApi.patch(`/${id}/mark-paid`, {}, { headers: authHeader() });
      setInvoices((prev) =>
        prev.map((inv) => (inv._id === id || inv.id === id ? data.data : inv))
      );
      return data.data;
    } catch (error) {
      console.error('❌ Mark Invoice Paid Error:', error.message);
      throw error;
    }
  }, []);

  const setCurrentInvoice = useCallback((invoice) => {
    setCurrentInvoiceState(invoice);
  }, []);

  // Load invoices & customers once the user is authenticated
  useEffect(() => {
    if (wallet.token && !wallet.isLoading) {
      fetchInvoices().catch(() => {});
      fetchCustomers().catch(() => {});
    }
  }, [wallet.token, wallet.isLoading]);

  const value = {
    // auth / wallet
    wallet,
    setWallet,
    walletBalance,
    setWalletBalance,
    updateWalletBalance,
    login,
    logout,
    refreshWallet,
    updateTransactionPinStatus,
    // transactions
    transactions,
    transactionStats,
    isLoadingTransactions,
    fetchTransactions,
    // invoices
    invoices,
    customers,
    currentInvoice,
    isLoadingInvoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    setCurrentInvoice,
    setInvoicePaid,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    calculateInvoice,
    fetchInvoices,
    fetchCustomers,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};
