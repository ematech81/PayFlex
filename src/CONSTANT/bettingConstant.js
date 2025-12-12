// constants/bettingConstant.js

import { customImages } from 'constants/serviceImages';

export const BETTING_PROVIDERS = [
  {
    label: 'Bet9ja',
    value: 'bet9ja',
    logo: customImages.Bet9ja,
    color: '#00A859',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'BetKing',
    value: 'betking',
    logo: customImages.Betking,
    color: '#FF6B00',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: '1xBet',
    value: '1xbet',
    logo: customImages.Xbet,
    color: '#1C64F2',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'SportyBet',
    value: 'sportybet',
    logo: customImages.SportyBet,
    color: '#E31E24',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'NairaBet',
    value: 'nairabet',
    logo: customImages.Nairabet,
    color: '#008000',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'Betway',
    value: 'betway',
    logo: customImages.Betway,
    color: '#000000',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'MerryBet',
    value: 'merrybet',
    logo: customImages.Merrybet,
    color: '#FFA500',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'BetBiga',
    value: 'betbiga',
    logo: customImages.Betbiga,
    color: '#1E40AF',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'NaijaBet',
    value: 'naijabet',
    logo: customImages.Naijabet,
    color: '#10B981',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'BangBet',
    value: 'bangbet',
    logo: customImages.Bangbet,
    color: '#8B5CF6',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'MelBet',
    value: 'melbet',
    logo: customImages.Melbet,
    color: '#F59E0B',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'LiveScoreBet',
    value: 'livescorebet',
    logo: customImages.LivesoreBet,
    color: '#EF4444',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'Naira Million',
    value: 'naira-million',
    logo: customImages.NairaMillion,
    color: '#059669',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'CloubBet',
    value: 'cloudbet',
    logo: customImages.Cloudbet,
    color: '#279605ff',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'Paripesa',
    value: 'paripesa',
    logo: customImages.Paripesa,
    color: '#bbc805ff',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    label: 'Myloto-Hub',
    value: 'myloto-hub',
    logo: customImages.MylotoHub,
    color: '#c80577ff',
    minAmount: 100,
    maxAmount: 500000,
  },
];

// Charge percentage (6% as per documentation)
export const BETTING_CHARGE_PERCENTAGE = 6;

export const calculateBettingCharge = (amount) => {
  return Math.ceil((amount * BETTING_CHARGE_PERCENTAGE) / 100);
};

export const calculateTotalAmount = (amount) => {
  return amount + calculateBettingCharge(amount);
};
