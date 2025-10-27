

// components/shared/cards/WalletBalanceCard.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { FormatUtils } from 'UTILS/formatUtils';



/**
 * Wallet Balance Card Component
 * Reusable wallet balance display with hide/show functionality
 */

export default function WalletBalanceCard({
  balance,
  onTopUp,
  style,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [balanceVisible, setBalanceVisible] = useState(true);

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible);
  };

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[themeColors.primary, themeColors.button]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.label}>Wallet Balance</Text>
          <TouchableOpacity
            onPress={toggleBalanceVisibility}
            accessibilityLabel={balanceVisible ? 'Hide balance' : 'Show balance'}
          >
            <Ionicons
              name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="rgba(255,255,255,0.9)"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.balance}>
          {balanceVisible
            ? FormatUtils.formatCurrency(balance, 'NGN')
            : '₦ ****.**'}
        </Text>

        <TouchableOpacity
          style={styles.topUpButton}
          onPress={onTopUp}
          accessibilityLabel="Top up wallet"
          accessibilityRole="button"
        >
          <Ionicons name="add-circle" size={18} color={themeColors.primary} />
          <Text style={[styles.topUpText, { color: themeColors.primary }]}>
            Top Up
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  gradient: {
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  topUpText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
});