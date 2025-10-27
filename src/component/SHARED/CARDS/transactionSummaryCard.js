
// components/shared/cards/TransactionSummaryCard.jsx
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { FormatUtils } from 'UTILS/formatUtils';
import { TransactionUtils } from 'UTILS/transactionUtils';
// import { TransactionUtils } from '../../../utils/transaction.utils';

/**
 * Transaction Summary Card Component
 * Reusable card for displaying transaction details
 */

export default function TransactionSummaryCard({
  transaction,
  onPress,
  showStatus = true,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const statusColor = TransactionUtils.getStatusColor(transaction.status);
  const statusText = TransactionUtils.getStatusText(transaction.status);
  const typeIcon = TransactionUtils.getTypeIcon(transaction.type);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: themeColors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Transaction ${transaction.reference}`}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        {/* Icon/Logo */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${themeColors.primary}15` },
          ]}
        >
          {transaction.providerLogo ? (
            <Image
              source={transaction.providerLogo}
              style={styles.providerLogo}
            />
          ) : (
            <Ionicons
              name={typeIcon}
              size={24}
              color={themeColors.primary}
            />
          )}
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={[styles.title, { color: themeColors.heading }]}>
            {transaction.serviceName || transaction.type}
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.subheading }]}>
            {transaction.recipient}
          </Text>
          <Text style={[styles.date, { color: themeColors.subtext }]}>
            {FormatUtils.formatRelativeTime(transaction.createdAt)}
          </Text>
        </View>

        {/* Amount & Status */}
        <View style={styles.right}>
          <Text style={[styles.amount, { color: themeColors.heading }]}>
            {FormatUtils.formatCurrency(transaction.amount, 'NGN')}
          </Text>
          {showStatus && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusColor}20` },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerLogo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    borderRadius: 16,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});