
// utils/textFormatUtils.js

/**
 * Text Formatting Utilities for VTpass Services
 * Handles cleaning and formatting of service names, amounts, etc.
 */

/**
 * Remove amount prefix from plan/service names
 * Transforms:
 * - "N1000 1.5GB - 30 days" → "1.5GB - 30 days"
 * - "₦2000 4.5GB - 30 days" → "4.5GB - 30 days"
 * - "N500 GOTV Max" → "GOTV Max"
 * 
 * @param {string} name - The original name with amount prefix
 * @returns {string} - Clean name without amount
 */
export const cleanPlanName = (name) => {
  if (!name) return '';
  
  // Remove patterns like "N1000 ", "₦2000 ", "N500.00 ", etc.
  // Regex breakdown:
  // ^         - Start of string
  // [N₦]      - Match either N or ₦
  // \d+       - One or more digits
  // (?:\.\d{2})? - Optional decimal part (non-capturing group)
  // \s+       - One or more spaces
  return name.replace(/^[N₦]\d+(?:\.\d{2})?\s+/, '').trim();
};

/**
 * Extract amount from plan/service names
 * Useful if you need to validate or compare amounts
 * 
 * @param {string} name - The name with amount prefix
 * @returns {number|null} - Extracted amount or null
 */
export const extractAmountFromName = (name) => {
  if (!name) return null;
  
  const match = name.match(/^[N₦](\d+(?:\.\d{2})?)/);
  return match ? parseFloat(match[1]) : null;
};

/**
 * Clean phone number - remove spaces, dashes, parentheses
 * Transforms:
 * - "0801 234 5678" → "08012345678"
 * - "0801-234-5678" → "08012345678"
 * - "(0801) 234-5678" → "08012345678"
 * 
 * @param {string} phoneNumber - Phone number with formatting
 * @returns {string} - Clean phone number
 */
export const cleanPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters except leading +
  return phoneNumber.replace(/[\s\-\(\)]/g, '');
};

/**
 * Format phone number for display
 * Transforms: "08012345678" → "0801 234 5678"
 * 
 * @param {string} phoneNumber - Clean phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  const cleaned = cleanPhoneNumber(phoneNumber);
  
  // Nigerian format: 0XXX XXX XXXX
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return cleaned;
};

/**
 * Validate Nigerian phone number
 * 
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const isValidNigerianPhone = (phoneNumber) => {
  const cleaned = cleanPhoneNumber(phoneNumber);
  const phoneRegex = /^0[7-9][0-1]\d{8}$/;
  
  return phoneRegex.test(cleaned);
};

/**
 * Clean meter number - remove spaces and dashes
 * 
 * @param {string} meterNumber - Meter number with formatting
 * @returns {string} - Clean meter number
 */
export const cleanMeterNumber = (meterNumber) => {
  if (!meterNumber) return '';
  
  return meterNumber.replace(/[\s\-]/g, '');
};

/**
 * Format meter number for display
 * Transforms: "12345678901" → "1234 5678 901"
 * 
 * @param {string} meterNumber - Clean meter number
 * @returns {string} - Formatted meter number
 */
export const formatMeterNumber = (meterNumber) => {
  if (!meterNumber) return '';
  
  const cleaned = cleanMeterNumber(meterNumber);
  
  // Group in sets of 4-4-3
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  }
  
  return cleaned;
};

/**
 * Clean card number (for cable TV, etc.)
 * 
 * @param {string} cardNumber - Card number with formatting
 * @returns {string} - Clean card number
 */
export const cleanCardNumber = (cardNumber) => {
  if (!cardNumber) return '';
  
  return cardNumber.replace(/[\s\-]/g, '');
};

/**
 * Truncate long text with ellipsis
 * 
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Capitalize first letter of each word
 * Transforms: "eko electricity" → "Eko Electricity"
 * 
 * @param {string} text - Text to capitalize
 * @returns {string} - Capitalized text
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Remove special characters from text (keep alphanumeric and spaces)
 * 
 * @param {string} text - Text to clean
 * @returns {string} - Clean text
 */
export const removeSpecialCharacters = (text) => {
  if (!text) return '';
  
  return text.replace(/[^a-zA-Z0-9\s]/g, '');
};

/**
 * Parse validity string from plan names
 * Extracts: "1.5GB - 30 days" → "30 days"
 * 
 * @param {string} planName - Plan name with validity
 * @returns {string|null} - Validity string or null
 */
export const extractValidity = (planName) => {
  if (!planName) return null;
  
  // Match patterns like "30 days", "7 days", "24 hrs"
  const match = planName.match(/(\d+\s*(?:days?|hrs?|hours?|months?))/i);
  return match ? match[1] : null;
};

/**
 * Parse data allowance from plan names
 * Extracts: "1.5GB - 30 days" → "1.5GB"
 * 
 * @param {string} planName - Plan name with allowance
 * @returns {string|null} - Data allowance or null
 */
export const extractDataAllowance = (planName) => {
  if (!planName) return null;
  
  // Match patterns like "1.5GB", "500MB", "10GB"
  const match = planName.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|TB))/i);
  return match ? match[1] : null;
};

// ========================================
// USAGE EXAMPLES
// ========================================

/*
// Data Plans
const planName = "N1000 1.5GB - 30 days";
console.log(cleanPlanName(planName));           // "1.5GB - 30 days"
console.log(extractAmountFromName(planName));   // 1000
console.log(extractDataAllowance(planName));    // "1.5GB"
console.log(extractValidity(planName));         // "30 days"

// Phone Numbers
const phone = "0801 234 5678";
console.log(cleanPhoneNumber(phone));           // "08012345678"
console.log(formatPhoneNumber(phone));          // "0801 234 5678"
console.log(isValidNigerianPhone(phone));       // true

// Meter Numbers
const meter = "12345678901";
console.log(formatMeterNumber(meter));          // "1234 5678 901"

// Text Formatting
console.log(capitalizeWords("eko electricity")); // "Eko Electricity"
console.log(truncateText("Very long text...", 10)); // "Very long..."
*/

export default {
  cleanPlanName,
  extractAmountFromName,
  cleanPhoneNumber,
  formatPhoneNumber,
  isValidNigerianPhone,
  cleanMeterNumber,
  formatMeterNumber,
  cleanCardNumber,
  truncateText,
  capitalizeWords,
  removeSpecialCharacters,
  extractValidity,
  extractDataAllowance,
};