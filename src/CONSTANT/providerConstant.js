


/**
 * Network Providers Configuration
 * Shared across Airtime and Data services
 */

export const NETWORK_PROVIDERS = [
  {
    id: 'mtn',
    label: 'MTN',
    value: 'mtn',
    logo: require('../asset/mtn.jpg'),
    color: '#FFCC00',
    shortCode: '0803,0806,0703,0706,0813,0816,0810,0814,0903,0906,0913,0916',
  },
  {
    id: 'airtel',
    label: 'Airtel',
    value: 'airtel',
    logo: require('../asset/airtel.jpeg'),
    color: '#FF0000',
    shortCode: '0802,0808,0708,0812,0701,0902,0901,0904,0907,0912',
  },
  {
    id: 'glo',
    label: 'Glo',
    value: 'glo',
    logo: require('../asset/glo.jpg'),
    color: '#00B140',
    shortCode: '0805,0807,0705,0815,0811,0905,0915',
  },
  {
    id: '9mobile',
    label: '9mobile',
    value: '9mobile',
    logo: require('../asset/etisalat.jpg'),
    color: '#00A65E',
    shortCode: '0809,0818,0817,0909,0908',
  },
];

/**
 * TV Service Providers
 */
export const TV_PROVIDERS = [
  {
    id: 'dstv',
    label: 'DSTV',
    value: 'dstv',
    logo: require('../asset/dstv.jpg'),
    requiresSmartcard: true,
  },
  {
    id: 'gotv',
    label: 'GOtv',
    value: 'gotv',
    logo: require('../asset/gotv.jpg'),
    requiresSmartcard: true,
  },
  {
    id: 'startimes',
    label: 'Startimes',
    value: 'startimes',
    logo: require('../asset/starTimes.jpg'),
    requiresSmartcard: true,
  },
  {
    id: 'showmax',
    label: 'Showmax',
    value: 'showmax',
    logo: require('../asset/showMax.jpg'),
    requiresSmartcard: false,
  },
];

/**
 * Electricity Distribution Companies (DISCOs)
 */
export const ELECTRICITY_PROVIDERS = [
  {
    id: 'ekedc',
    label: 'Eko Electric (EKEDC)',
    value: 'ekedc',
    shortName: 'EKEDC',
    region: 'Lagos',
    logo: require('../asset/electricity/ekoLogo.jpg'),

  },
  {
    id: 'ikedc',
    label: 'Ikeja Electric (IKEDC)',
    value: 'ikedc',
    shortName: 'IKEDC',
    region: 'Lagos',
    logo: require('../asset/electricity/ikejaLogo.jpg'),

  },
  {
    id: 'aedc',
    label: 'Abuja Electric (AEDC)',
    value: 'aedc',
    shortName: 'AEDC',
    region: 'Abuja',
    logo: require('../asset/electricity/abujaLogo.jpg'),

  },
  {
    id: 'phed',
    label: 'Port Harcourt Electric (PHED)',
    value: 'phed',
    shortName: 'PHED',
    region: 'Rivers',
    logo: require('../asset/electricity/portharcoutLogo.jpg'),

  },
  {
    id: 'ibedc',
    label: 'Ibadan Electric (IBEDC)',
    value: 'ibedc',
    shortName: 'IBEDC',
    region: 'Oyo',
    logo: require('../asset/electricity/ibadanLogo.jpg'),

  },
  {
    id: 'kaedco',
    label: 'Kano Electric (KAEDCO)',
    value: 'kaedco',
    shortName: 'KAEDCO',
    region: 'Kano',
    logo: require('../asset/electricity/kanoLogo.jpg'),

  },
  {
    id: 'kedco',
    label: 'Kaduna Electric (KEDCO)',
    value: 'kedco',
    shortName: 'KEDCO',
    region: 'Kaduna',
    logo: require('../asset/electricity/kadunaLogo.jpg'),

  },
  {
    id: 'jed',
    label: 'Jos Electric (JED)',
    value: 'jed',
    shortName: 'JED',
    region: 'Plateau',
    logo: require('../asset/electricity/josLogo.jpg'),

  },
  {
    id: 'eedc',
    label: 'Enugu Electric (EEDC)',
    value: 'eedc',
    shortName: 'EEDC',
    region: 'Enugu',
    logo: require('../asset/electricity/enuguLogo.jpg'),

  },
  {
    id: 'bedc',
    label: 'Benin Electric (BEDC)',
    value: 'bedc',
    shortName: 'BEDC',
    region: 'Benin',
    logo: require('../asset/electricity/beninLogo.jpg'),

  },
  {
    id: 'aba',
    label: 'ABA Electric (ABA)',
    value: 'aba',
    shortName: 'BEDC',
    region: 'Benin',
    logo: require('../asset/electricity/abaLogo.jpg'),

  },
];

/**
 * Education Service Providers
 */
export const EDUCATION_PROVIDERS = [
  {
    id: 'waec',
    label: 'WAEC',
    value: 'waec',
    fullName: 'West African Examinations Council',
    requiresCandidateInfo: true,
  },
  {
    id: 'jamb',
    label: 'JAMB',
    value: 'jamb',
    fullName: 'Joint Admissions and Matriculation Board',
    requiresCandidateInfo: true,
  },
  {
    id: 'neco',
    label: 'NECO',
    value: 'neco',
    fullName: 'National Examinations Council',
    requiresCandidateInfo: true,
  },
];

/**
 * Betting Service Providers
 */
export const BETTING_PROVIDERS = [
  {
    id: 'bet9ja',
    label: 'Bet9ja',
    value: 'bet9ja',
    logo: require('../asset/bet9ja.jpg'),
    requiresUserId: true,
  },
  {
    id: 'sportybet',
    label: 'SportyBet',
    value: 'sportybet',
    logo: require('../asset/sportyBet.jpg'),
    requiresUserId: true,
  },
  {
    id: 'betway',
    label: 'Betway',
    value: 'betway',
    logo: require('../asset/betway.webp'),
    requiresUserId: true,
  },
  {
    id: 'nairabet',
    label: 'NairaBet',
    value: 'nairabet',
    logo: require('../asset/nairaBet.jpg'),
    requiresUserId: true,
  },
];

/**
 * Get provider by value
 * @param {Array} providers - Providers array
 * @param {string} value - Provider value
 * @returns {Object|null} Provider object
 */
export const getProviderByValue = (providers, value) => {
  return providers.find((p) => p.value === value) || null;
};

/**
 * Auto-detect network from phone number
 * @param {string} phone - Phone number
 * @returns {string|null} Network provider value
 */
export const detectNetworkFromPhone = (phone) => {
  if (!phone || phone.length < 4) return null;
  
  const prefix = phone.substring(0, 4);
  
  for (const provider of NETWORK_PROVIDERS) {
    if (provider.shortCode.includes(prefix)) {
      return provider.value;
    }
  }
  
  return null;
};