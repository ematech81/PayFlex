// hooks/useWalletBalance.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from 'context/WalletContext';
import { FormatUtils } from 'UTILS/formatUtils';

/**
 * Wallet Balance Hook
 * Handles wallet balance display and management
 * 
 * @returns {Object} Wallet balance utilities
 */
export const useWalletBalance = () => {
  const { wallet } = useWallet();
  
  // ✅ Don't use hardcoded default - derive from wallet
  const [isVisible, setIsVisible] = useState(true);

  /**
   * Get balance from wallet context
   * Default to 0 if not available
   */
  const balance = useMemo(() => {
    // Return actual balance or 0 (not 200!)
    return wallet?.user?.walletBalance ?? 0;
  }, [wallet?.user?.walletBalance]);

  /**
   * Check if wallet is loading
   */
  const isLoading = useMemo(() => {
    return wallet?.isLoading ?? true;
  }, [wallet?.isLoading]);

  /**
   * Format balance based on visibility
   */
  const formattedBalance = useMemo(() => {
    if (isLoading) {
      return '₦ ---.--'; // Show loading state
    }

    if (isVisible) {
      return FormatUtils.formatCurrency(balance, 'NGN');
    } else {
      return '₦ ****.**';
    }
  }, [balance, isVisible, isLoading]);

  /**
   * Toggle balance visibility
   */
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  /**
   * Check if balance is sufficient
   * @param {number} amount - Amount to check
   * @returns {boolean}
   */
  const isSufficient = useCallback((amount) => {
    return balance >= Number(amount);
  }, [balance]);

  /**
   * Get balance status
   * @returns {Object} Balance status with status, message, and color
   */
  const getBalanceStatus = useCallback(() => {
    if (isLoading) {
      return {
        status: 'loading',
        message: 'Loading balance...',
        color: '#999999',
      };
    }

    if (balance === 0) {
      return {
        status: 'empty',
        message: 'Your wallet is empty',
        color: '#FF6B6B',
      };
    } else if (balance < 1000) {
      return {
        status: 'low',
        message: 'Low balance',
        color: '#FFA500',
      };
    } else {
      return {
        status: 'good',
        message: 'Good balance',
        color: '#4CAF50',
      };
    }
  }, [balance, isLoading]);

  /**
   * Calculate balance after transaction
   * @param {number} amount - Transaction amount
   * @returns {number}
   */
  const getBalanceAfter = useCallback((amount) => {
    return balance - Number(amount);
  }, [balance]);

  /**
   * Format amount as currency
   * @param {number} amount - Amount to format
   * @returns {string}
   */
  const formatAmount = useCallback((amount) => {
    return FormatUtils.formatCurrency(amount, 'NGN');
  }, []);

  // ✅ Log for debugging (remove in production)
  useEffect(() => {
    if (__DEV__) {
      console.log('💰 Wallet Balance Hook:', {
        balance,
        formattedBalance,
        isLoading,
        hasUser: !!wallet?.user,
        rawWalletBalance: wallet?.user?.walletBalance,
      });
    }
  }, [balance, formattedBalance, isLoading, wallet?.user]);

  return {
    balance,
    formattedBalance,
    isVisible,
    isLoading,
    toggleVisibility,
    isSufficient,
    getBalanceStatus,
    getBalanceAfter,
    formatAmount,
  };
};