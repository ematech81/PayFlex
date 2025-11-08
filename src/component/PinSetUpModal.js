
// components/PinSetupModal.jsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * Reusable modal to prompt users to create a transaction PIN
 * Used across all service payment flows
 */
export default function PinSetupModal({
  visible,
  serviceName = 'service',
  paymentAmount,
  onCreatePin,
  onCancel,
  isDarkMode = false,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.modalContainer,
          isDarkMode ? styles.modalDark : styles.modalLight
        ]}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Icon name="lock-closed" size={48} color="#FF6B35" />
          </View>

          {/* Title */}
          <Text style={[
            styles.title,
            isDarkMode ? styles.textDark : styles.textLight
          ]}>
            Transaction PIN Required
          </Text>

          {/* Message */}
          <Text style={[
            styles.message,
            isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight
          ]}>
            To complete your {serviceName.toLowerCase()} purchase
            {paymentAmount ? ` of ₦${paymentAmount.toLocaleString()}` : ''}, 
            you need to set up a transaction PIN first.
          </Text>

          {/* Info Box */}
          <View style={[
            styles.infoBox,
            isDarkMode ? styles.infoBoxDark : styles.infoBoxLight
          ]}>
            <Icon 
              name="information-circle" 
              size={20} 
              color={isDarkMode ? '#64B5F6' : '#1976D2'} 
              style={styles.infoIcon}
            />
            <Text style={[
              styles.infoText,
              isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight
            ]}>
              Your transaction will be saved and automatically resumed after PIN setup.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onCreatePin}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Create PIN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                isDarkMode ? styles.secondaryButtonDark : styles.secondaryButtonLight
              ]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.secondaryButtonText,
                isDarkMode ? styles.textDark : styles.textLight
              ]}>
                Cancel
              </Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalLight: {
    backgroundColor: '#FFFFFF',
  },
  modalDark: {
    backgroundColor: '#1E1E1E',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  textLight: {
    color: '#000000',
  },
  textDark: {
    color: '#FFFFFF',
  },
  textSecondaryLight: {
    color: '#666666',
  },
  textSecondaryDark: {
    color: '#AAAAAA',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoBoxLight: {
    backgroundColor: '#E3F2FD',
  },
  infoBoxDark: {
    backgroundColor: '#1A237E',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  secondaryButtonLight: {
    borderColor: '#E0E0E0',
  },
  secondaryButtonDark: {
    borderColor: '#444444',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});