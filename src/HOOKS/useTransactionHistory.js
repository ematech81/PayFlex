
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from 'context/WalletContext';
import { PaymentService } from 'SERVICES/API/paymentService';
import { TransactionUtils } from 'UTILS/transactionUtils';
import { ErrorUtils } from 'UTILS/errorUtils';

/**
 * Transaction History Hook
 * Handles transaction history fetching and filtering
 */

export const useTransactionHistory = (autoLoad = true) => {
  const { wallet } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    sortBy: 'date',
    order: 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    hasMore: true,
  });

  /**
   * Load transaction history
   * @param {boolean} refresh - Whether this is a refresh operation
   */
  const loadTransactions = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const params = {
        page: refresh ? 1 : pagination.page,
        limit: pagination.limit,
      };

      if (filters.type !== 'all') {
        params.type = filters.type;
      }

      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      const response = await PaymentService.getTransactionHistory(
        wallet.token,
        params
      );

      if (response.success) {
        const newTransactions = response.data?.data || [];
        
        if (refresh) {
          setTransactions(newTransactions);
          setPagination({
            ...pagination,
            page: 1,
            hasMore: newTransactions.length >= pagination.limit,
          });
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
          setPagination(prev => ({
            ...prev,
            page: prev.page + 1,
            hasMore: newTransactions.length >= prev.limit,
          }));
        }
      } else {
        setError('Failed to load transactions');
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'loading transactions');
      setError(errorMessage);
      ErrorUtils.logError(error, 'loadTransactions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [wallet.token, pagination.page, pagination.limit, filters]);

  /**
   * Auto-load on mount
   */
  useEffect(() => {
    if (autoLoad && wallet.token) {
      loadTransactions();
    }
  }, [autoLoad, wallet.token]);

  /**
   * Apply filters
   */
  useEffect(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = TransactionUtils.filterByType(filtered, filters.type);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = TransactionUtils.filterByStatus(filtered, filters.status);
    }

    // Sort
    filtered = TransactionUtils.sort(filtered, filters.sortBy, filters.order);

    setFilteredTransactions(filtered);
  }, [transactions, filters]);

  /**
   * Refresh transactions
   */
  const refresh = () => {
    loadTransactions(true);
  };

  /**
   * Load more transactions
   */
  const loadMore = () => {
    if (!isLoading && pagination.hasMore) {
      loadTransactions(false);
    }
  };

  /**
   * Update filters
   * @param {Object} newFilters - New filter values
   */
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  /**
   * Reset filters
   */
  const resetFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      sortBy: 'date',
      order: 'desc',
    });
  };

  /**
   * Get grouped transactions by date
   */
  const getGroupedTransactions = () => {
    return TransactionUtils.groupByDate(filteredTransactions);
  };

  /**
   * Search transactions
   * @param {string} query - Search query
   * @returns {Array} Filtered transactions
   */
  const searchTransactions = (query) => {
    if (!query.trim()) return filteredTransactions;

    const lowerQuery = query.toLowerCase();
    return filteredTransactions.filter(t => 
      t.reference?.toLowerCase().includes(lowerQuery) ||
      t.recipient?.toLowerCase().includes(lowerQuery) ||
      t.serviceName?.toLowerCase().includes(lowerQuery) ||
      t.type?.toLowerCase().includes(lowerQuery)
    );
  };

  /**
   * Get transaction by reference
   * @param {string} reference - Transaction reference
   * @returns {Object|null}
   */
  const getTransactionByReference = (reference) => {
    return transactions.find(t => t.reference === reference) || null;
  };

  return {
    transactions: filteredTransactions,
    allTransactions: transactions,
    isLoading,
    isRefreshing,
    error,
    filters,
    pagination,
    loadTransactions,
    refresh,
    loadMore,
    updateFilters,
    resetFilters,
    getGroupedTransactions,
    searchTransactions,
    getTransactionByReference,
  };
};