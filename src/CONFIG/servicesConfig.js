

/**
 * VTPass Service Configuration
 * Maps service types to VTPass service IDs
 */

export const VTPASS_SERVICES = {
  // Airtime services
  AIRTIME: {
    MTN: 'mtn',
    AIRTEL: 'airtel',
    GLO: 'glo',
    NINE_MOBILE: '9mobile',
  },
  
  // Data services
  DATA: {
    MTN: 'mtn-data',
    AIRTEL: 'airtel-data',
    GLO: 'glo-data',
    NINE_MOBILE: 'etisalat-data',
  },
  
  // TV subscriptions
  TV: {
    DSTV: 'dstv',
    GOTV: 'gotv',
    STARTIMES: 'startimes',
    SHOWMAX: 'showmax',
  },
  
  // Electricity providers
  ELECTRICITY: {
    EKEDC: 'ekedc',
    IKEDC: 'ikeja-electric',
    AEDC: 'abuja-electric',
    PHED: 'portharcourt-electric',
    JED: 'jos-electric',
    IBEDC: 'ibadan-electric',
    KAEDCO: 'kano-electric',
    KEDCO: 'kaduna-electric',
  },
  
  // Education services
  EDUCATION: {
    WAEC: 'waec-registration',
    JAMB: 'jamb',
    NECO: 'neco',
  },
  
  // Betting services
  BETTING: {
    BET9JA: 'bet9ja',
    BETWAY: 'betway',
    NAIRABET: 'nairabet',
    SPORTYBET: 'sportybet',
    MERRYBET: 'merrybet',
  },
};

/**
 * Get service ID for airtime
 * @param {string} provider - Provider name (mtn, airtel, etc.)
 * @returns {string} VTPass service ID
 */
export const getAirtimeServiceId = (provider) => {
  const normalized = provider?.toLowerCase().trim();
  return VTPASS_SERVICES.AIRTIME[normalized?.toUpperCase()] || normalized;
};

/**
 * Get service ID for data
 * @param {string} provider - Provider name
 * @returns {string} VTPass service ID
 */
export const getDataServiceId = (provider) => {
  const normalized = provider?.toLowerCase().trim();
  const key = normalized === '9mobile' ? 'NINE_MOBILE' : normalized?.toUpperCase();
  return VTPASS_SERVICES.DATA[key] || `${normalized}-data`;
};

/**
 * Get service ID for TV
 * @param {string} provider - TV provider name
 * @returns {string} VTPass service ID
 */
export const getTVServiceId = (provider) => {
  const normalized = provider?.toLowerCase().trim();
  return VTPASS_SERVICES.TV[normalized?.toUpperCase()] || normalized;
};

/**
 * Get service ID for electricity
 * @param {string} disco - Distribution company code
 * @returns {string} VTPass service ID
 */
export const getElectricityServiceId = (disco) => {
  const normalized = disco?.toUpperCase().trim();
  return VTPASS_SERVICES.ELECTRICITY[normalized] || disco?.toLowerCase();
};