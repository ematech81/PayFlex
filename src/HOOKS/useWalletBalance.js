
// hooks/useWalletBalance.js
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from 'context/WalletContext';
import { FormatUtils } from 'UTILS/formatUtils';

/**
 * Wallet Balance Hook
 * Handles wallet balance display and management
 */

export const useWalletBalance = () => {
  const { wallet } = useWallet();
  const [balance, setBalance] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [formattedBalance, setFormattedBalance] = useState('₦0.00');

  /**
   * Update balance when wallet changes
   */
  useEffect(() => {
    if (wallet?.user?.walletBalance !== undefined) {
      setBalance(wallet.user.walletBalance);
    }
  }, [wallet?.user?.walletBalance]);

  /**
   * Update formatted balance
   */
  useEffect(() => {
    if (isVisible) {
      setFormattedBalance(FormatUtils.formatCurrency(balance, 'NGN'));
    } else {
      setFormattedBalance('₦ ****.**');
    }
  }, [balance, isVisible]);

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
   * @returns {Object} Balance status
   */
  const getBalanceStatus = useCallback(() => {
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
  }, [balance]);

  /**
   * Calculate balance after transaction
   * @param {number} amount - Transaction amount
   * @returns {number}
   */
  const getBalanceAfter = useCallback((amount) => {
    return balance - Number(amount);
  }, [balance]);

  return {
    balance,
    formattedBalance,
    isVisible,
    toggleVisibility,
    isSufficient,
    getBalanceStatus,
    getBalanceAfter,
  };
};