import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

const AlertMessage = ({ visible, message, onClose }) => {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: themeColors.card }]}
        >
          <Text style={[styles.messageText, { color: themeColors.heading }]}>
            {message}
          </Text>
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: themeColors.button },
            ]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AlertMessage;
