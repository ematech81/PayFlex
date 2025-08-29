import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { useWallet } from '../context/WalletContext';

export const useWalletNavigation = () => {
  const navigation = useNavigation();
  const { walletBalance } = useWallet();

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

  return { validateTransaction };
};
