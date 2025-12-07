// constants/educationConstant.js

import { customImages } from 'constants/serviceImages';

export const EXAM_PROVIDERS = {
  waec: {
    label: 'WAEC',
    value: 'waec',
    logo: customImages.Waec, 
    color: '#1E40AF',
    description: 'West African Examinations Council',
  },
  neco: {
    label: 'NECO',
    value: 'neco',
    logo: customImages.Neco,
    color: '#059669',
    description: 'National Examinations Council',
  },
  nabteb: {
    label: 'NABTEB',
    value: 'nabteb',
    logo: customImages.Nabteb,
    color: '#DC2626',
    description: 'National Business and Technical Examinations Board',
  },
  jamb: {
    label: 'JAMB',
    value: 'jamb',
    logo: customImages.Jamb,
    color: '#7C3AED',
    description: 'Joint Admissions and Matriculation Board',
  },
};

export const EXAM_PRODUCTS = {
  waec: [
    { code: '1', name: 'Result Checking PIN', requiresProfile: false },
    { code: '2', name: 'GCE Registration PIN', requiresProfile: false },
    { code: '3', name: 'Verification PIN', requiresProfile: false },
  ],
  neco: [
    { code: '1', name: 'Result Checking Token', requiresProfile: false },
    { code: '2', name: 'GCE Registration PIN', requiresProfile: false },
  ],
  nabteb: [
    { code: '1', name: 'Result Checking PIN', requiresProfile: false },
    { code: '2', name: 'GCE Registration PIN', requiresProfile: false },
  ],
  jamb: [
    { code: '1', name: 'UTME Registration PIN', requiresProfile: true },
    { code: '2', name: 'Direct Entry Registration PIN', requiresProfile: true },
  ],
};

// Estimated prices (will be replaced by actual API prices)
export const EXAM_PRICES = {
  waec: { '1': 3500, '2': 7000, '3': 2000 },
  neco: { '1': 1000, '2': 5000 },
  nabteb: { '1': 1500, '2': 5500 },
  jamb: { '1': 4700, '2': 4700 },
};