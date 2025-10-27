
/**
 * Transaction Utilities
 * Helper functions for transaction handling
 */

export class TransactionUtils {
  /**
   * Generate unique transaction reference
   * @param {string} prefix - Reference prefix (e.g., 'AIR', 'DATA')
   * @returns {string} Transaction reference
   */
  static generateReference(prefix = 'TXN') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Get transaction status color
   * @param {string} status - Transaction status
   * @returns {string} Status color
   */
  static getStatusColor(status) {
    const colors = {
      pending: '#f9fc77ff',
      processing: '#FFA500',
      success: '#4CAF50',
      completed: '#4CAF50',
      failed: '#ff3b30',
      cancelled: '#999',
      refunded: '#2196F3',
    };

    return colors[status?.toLowerCase()] || '#999';
  }

  /**
   * Get transaction status display text
   * @param {string} status - Transaction status
   * @returns {string} Display text
   */
  static getStatusText(status) {
    const texts = {
      pending: 'Pending',
      processing: 'Processing',
      success: 'Successful',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };

    return texts[status?.toLowerCase()] || status;
  }

  /**
   * Get transaction type icon
   * @param {string} type - Transaction type
   * @returns {string} Icon name (Ionicons)
   */
  static getTypeIcon(type) {
    const icons = {
      airtime: 'call-outline',
      data: 'wifi-outline',
      tv: 'tv-outline',
      electricity: 'flash-outline',
      education: 'school-outline',
      betting: 'game-controller-outline',
      transfer: 'swap-horizontal-outline',
      wallet: 'wallet-outline',
    };

    return icons[type?.toLowerCase()] || 'receipt-outline';
  }

  /**
   * Calculate transaction fee
   * @param {number} amount - Transaction amount
   * @param {number} feePercentage - Fee percentage (default 0%)
   * @param {number} fixedFee - Fixed fee amount (default 0)
   * @returns {Object} { fee, total }
   */
  static calculateFee(amount, feePercentage = 0, fixedFee = 0) {
    const percentageFee = (amount * feePercentage) / 100;
    const totalFee = percentageFee + fixedFee;
    const total = amount + totalFee;

    return {
      fee: Math.round(totalFee * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Check if transaction can be retried
   * @param {Object} transaction - Transaction object
   * @returns {boolean}
   */
  static canRetry(transaction) {
    const retryableStatuses = ['failed', 'cancelled'];
    return retryableStatuses.includes(transaction.status?.toLowerCase());
  }

  /**
   * Check if transaction can be refunded
   * @param {Object} transaction - Transaction object
   * @returns {boolean}
   */
  static canRefund(transaction) {
    const refundableStatuses = ['success', 'completed'];
    const status = transaction.status?.toLowerCase();
    
    // Check if transaction was successful and within refund window (e.g., 24 hours)
    if (!refundableStatuses.includes(status)) return false;
    
    const transactionDate = new Date(transaction.createdAt);
    const now = new Date();
    const hoursSince = (now - transactionDate) / (1000 * 60 * 60);
    
    return hoursSince <= 24;
  }

  /**
   * Group transactions by date
   * @param {Array} transactions - Array of transactions
   * @returns {Object} Grouped transactions
   */
  static groupByDate(transactions) {
    const grouped = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(transaction);
    });

    return grouped;
  }

  /**
   * Filter transactions by type
   * @param {Array} transactions - Array of transactions
   * @param {string} type - Transaction type
   * @returns {Array} Filtered transactions
   */
  static filterByType(transactions, type) {
    if (!type || type === 'all') return transactions;
    return transactions.filter(t => t.type?.toLowerCase() === type.toLowerCase());
  }

  /**
   * Filter transactions by status
   * @param {Array} transactions - Array of transactions
   * @param {string} status - Transaction status
   * @returns {Array} Filtered transactions
   */
  static filterByStatus(transactions, status) {
    if (!status || status === 'all') return transactions;
    return transactions.filter(t => t.status?.toLowerCase() === status.toLowerCase());
  }

  /**
   * Sort transactions
   * @param {Array} transactions - Array of transactions
   * @param {string} sortBy - Sort field (date, amount)
   * @param {string} order - Sort order (asc, desc)
   * @returns {Array} Sorted transactions
   */
  static sort(transactions, sortBy = 'date', order = 'desc') {
    const sorted = [...transactions];

    sorted.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === 'date') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else if (sortBy === 'amount') {
        aValue = a.amount;
        bValue = b.amount;
      }

      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }
}

