// context/WalletContext.js
import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletBalance, setWalletBalance] = useState(200); // example initial balance
  const navigation = useNavigation();

  /**
   * Validate wallet balance for any purchase
   * If insufficient, redirect to Deposit screen
   */
  const validateTransaction = (purchaseAmount) => {
    if (!walletBalance || walletBalance <= 0) {
      Alert.alert(
        'Insufficient Balance',
        'Your wallet balance is low, please deposit to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Deposit Now',
            onPress: () => navigation.navigate('DepositScreen'),
          },
        ]
      );
      return false;
    }

    if (walletBalance < purchaseAmount) {
      Alert.alert(
        'Low Balance',
        'You don’t have enough funds to complete this transaction.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Deposit Now',
            onPress: () => navigation.navigate('DepositScreen'),
          },
        ]
      );
      return false;
    }

    return true;
  };

  return (
    <WalletContext.Provider
      value={{ walletBalance, setWalletBalance, validateTransaction }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
