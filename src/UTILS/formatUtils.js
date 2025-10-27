


/**
 * Formatting Utilities
 * Functions for formatting data display
 */

export class FormatUtils {
  /**
   * Format phone number with spaces for readability
   * @param {string} phone - Raw phone number
   * @returns {string} Formatted phone number
   */
  static formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as: 0803 456 7890
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    
    return cleaned;
  }

  /**
   * Format currency (uses your existing formatCurrency)
   * Extended version with more options
   * @param {number} amount - Amount to format
   * @param {string} currencyCode - Currency code (NGN, USD, etc.)
   * @param {boolean} showDecimals - Whether to show decimal places
   * @returns {string} Formatted currency
   */
  static formatCurrency(amount, currencyCode = 'NGN', showDecimals = true) {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'decimal',
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    });
    
    const formattedAmount = formatter.format(amount);
    const symbols = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };
    const currencySymbol = symbols[currencyCode] || '₦';
    
    return `${currencySymbol}${formattedAmount}`;
  }

  /**
   * Format large numbers with K, M suffixes
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  static formatCompactNumber(num) {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  /**
   * Format date and time
   * @param {Date|string} date - Date to format
   * @param {boolean} includeTime - Whether to include time
   * @returns {string} Formatted date
   */
  static formatDate(date, includeTime = true) {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
      return 'Invalid date';
    }

    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return d.toLocaleDateString('en-NG', options);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   * @param {Date|string} date - Date to format
   * @returns {string} Relative time string
   */
  static formatRelativeTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return this.formatDate(date, false);
    }
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  }

  /**
   * Mask sensitive data (e.g., card numbers, phone numbers)
   * @param {string} value - Value to mask
   * @param {number} visibleChars - Number of characters to show at end
   * @returns {string} Masked value
   */
  static maskSensitiveData(value, visibleChars = 4) {
    if (!value) return '';
    
    const length = value.length;
    if (length <= visibleChars) return value;
    
    const masked = '*'.repeat(length - visibleChars);
    const visible = value.slice(-visibleChars);
    
    return `${masked}${visible}`;
  }

  /**
   * Format data size (MB, GB)
   * @param {number} mb - Size in megabytes
   * @returns {string} Formatted size
   */
  static formatDataSize(mb) {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)}GB`;
    }
    return `${mb}MB`;
  }

  /**
   * Format transaction reference for display
   * @param {string} reference - Transaction reference
   * @returns {string} Formatted reference
   */
  static formatTransactionReference(reference) {
    if (!reference) return '';
    
    // Format as: REF-XXXX-XXXX-XXXX
    const cleaned = reference.replace(/[^a-zA-Z0-9]/g, '');
    const parts = cleaned.match(/.{1,4}/g) || [];
    
    return parts.join('-').toUpperCase();
  }

  /**
   * Capitalize first letter of each word
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  static capitalizeWords(str) {
    if (!str) return '';
    
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  static truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return `${text.substring(0, maxLength)}...`;
  }
}