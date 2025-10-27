
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { FormatUtils } from 'UTILS/formatUtils';
import PayButton from '../BUTTONS/payButton';


const { height } = Dimensions.get('window');

/**
 * Confirmation Modal Component
 * Reusable modal for transaction confirmation
 */

export default function ConfirmationModal({
  visible,
  onClose,
  onConfirm,
  amount,
  serviceName,
  providerLogo,
  providerName,
  recipient,
  recipientLabel = 'Recipient',
  walletBalance,
  additionalDetails = [],
  loading = false,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: themeColors.background },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: themeColors.heading }]}>
              Confirm Transaction
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={themeColors.heading} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Amount */}
            <View style={styles.amountContainer}>
              <Text style={[styles.amount, { color: themeColors.heading }]}>
                {FormatUtils.formatCurrency(amount, 'NGN')}
              </Text>
            </View>

            {/* Details Card */}
            <View
              style={[
                styles.detailsCard,
                { backgroundColor: themeColors.card },
              ]}
            >
              {/* Service Name */}
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: themeColors.subheading }]}>
                  Service:
                </Text>
                <View style={styles.serviceInfo}>
                  {providerLogo && (
                    <Image source={providerLogo} style={styles.providerLogo} />
                  )}
                  <Text style={[styles.value, { color: themeColors.heading }]}>
                    {serviceName}
                  </Text>
                </View>
              </View>

              {/* Provider Name */}
              {providerName && (
                <View style={styles.detailRow}>
                  <Text style={[styles.label, { color: themeColors.subheading }]}>
                    Provider:
                  </Text>
                  <Text style={[styles.value, { color: themeColors.heading }]}>
                    {providerName}
                  </Text>
                </View>
              )}

              {/* Recipient */}
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: themeColors.subheading }]}>
                  {recipientLabel}:
                </Text>
                <Text style={[styles.value, { color: themeColors.heading }]}>
                  {recipient}
                </Text>
              </View>

              {/* Additional Details */}
              {additionalDetails.map((detail, index) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={[styles.label, { color: themeColors.subheading }]}>
                    {detail.label}:
                  </Text>
                  <Text style={[styles.value, { color: themeColors.heading }]}>
                    {detail.value}
                  </Text>
                </View>
              ))}

              {/* Amount */}
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: themeColors.subheading }]}>
                  Amount:
                </Text>
                <Text style={[styles.value, { color: themeColors.heading }]}>
                  {FormatUtils.formatCurrency(amount, 'NGN')}
                </Text>
              </View>

              {/* Wallet Balance */}
              {walletBalance !== undefined && (
                <View style={[styles.detailRow, styles.balanceRow]}>
                  <Text style={[styles.label, { color: themeColors.subheading }]}>
                    Wallet Balance:
                  </Text>
                  <Text style={[styles.value, { color: themeColors.heading }]}>
                    {FormatUtils.formatCurrency(walletBalance, 'NGN')}
                  </Text>
                </View>
              )}
            </View>

            {/* Warning */}
            {walletBalance !== undefined && walletBalance < amount && (
              <View
                style={[
                  styles.warningContainer,
                  { backgroundColor: `${themeColors.destructive}20` },
                ]}
              >
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={themeColors.destructive}
                />
                <Text
                  style={[
                    styles.warningText,
                    { color: themeColors.destructive },
                  ]}
                >
                  Insufficient wallet balance
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: themeColors.border },
              ]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.cancelText, { color: themeColors.heading }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <PayButton
              title="Confirm & Pay"
              onPress={onConfirm}
              loading={loading}
              disabled={walletBalance !== undefined && walletBalance < amount}
              style={styles.confirmButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
  },
  amountContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  detailsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  balanceRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 8,
    paddingTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
  },
});