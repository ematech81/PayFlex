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

const WalletContext = createContext();

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
  });

  // Load stored data on app startup
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const user = await AsyncStorage.getItem('user');
        if (token && user) {
          setWallet({
            token,
            user: JSON.parse(user),
          });
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };
    loadStoredData();
  }, []);

  const login = async (token, user) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setWallet({ token, user });
    } catch (error) {
      console.error('Error storing login data:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setWallet({ token: null, user: null });
    } catch (error) {
      console.error('Error clearing stored data:', error);
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
    walletBalance,
    setWalletBalance,
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
    login,
    logout,
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
