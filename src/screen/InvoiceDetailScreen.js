import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import ActionModal from 'constants/ActionModal';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from 'context/WalletContext';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { useWalletNavigation } from 'constants/useWalletNavigation';

const InvoiceDetailsScreen = ({ route }) => {
  const { invoice } = route.params || {};
  const { setInvoicePaid } = useWallet();
  const { validateTransaction } = useWalletNavigation();
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pin, setPin] = useState('');

  const handleMarkAsPaid = () => {
    if (invoice.status !== 'Pending') {
      Alert.alert('Error', 'Only Pending invoices can be marked as Paid');
      return;
    }
    if (!validateTransaction(invoice.total)) {
      return;
    }
    setIsPinModalVisible(true);
  };

  const handleConfirmPin = () => {
    if (pin.length === 4) {
      // Example: Assume 4-digit PIN
      setInvoicePaid(invoice.id);
      setPin('');
      setIsPinModalVisible(false);
      Alert.alert('Success', 'Invoice marked as Paid');
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Please enter a valid 4-digit PIN');
    }
  };

  const getPinModalActions = () => [
    {
      label: 'Confirm',
      onPress: handleConfirmPin,
      style: { color: themeColors.heading },
    },
    {
      label: 'Cancel',
      onPress: () => {
        setPin('');
        setIsPinModalVisible(false);
      },
      style: { color: themeColors.destructive },
    },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Draft':
        return { color: themeColors.destructive };
      case 'Pending':
        return { color: '#f1c40f' };
      case 'Paid':
        return { color: '#2ecc71' };
      default:
        return { color: themeColors.heading };
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[styles.title, { color: themeColors.heading }]}>
          Invoice Details
        </Text>
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          {/* <Text style={[styles.label, { color: themeColors.heading }]}>
            Title
          </Text> */}
          <Text style={[styles.value, { color: themeColors.subheading }]}>
            {invoice?.title || 'N/A'}
          </Text>
          {/* <Text style={[styles.label, { color: themeColors.heading }]}>
            Customer
          </Text>
          <Text style={[styles.value, { color: themeColors.subheading }]}>
            {invoice?.customer?.name || 'N/A'}
          </Text>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Due Date
          </Text>
          <Text style={[styles.value, { color: themeColors.subheading }]}>
            {invoice?.dueDate
              ? new Date(invoice.dueDate).toLocaleDateString()
              : 'N/A'}
          </Text>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Currency
          </Text>
          <Text style={[styles.value, { color: themeColors.subheading }]}>
            {invoice?.currency || 'NGN'}
          </Text>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Total
          </Text>
          <Text style={[styles.value, { color: themeColors.subheading }]}>
            {invoice?.currency || '₦'}
            {invoice?.total.toFixed(2)}
          </Text> */}
          {/* <Text style={[styles.label, { color: themeColors.heading }]}>
            Status
          </Text> */}
          <Text
            style={[
              styles.value,
              { color: themeColors.subheading },
              getStatusStyle(invoice?.status),
            ]}
          >
            {invoice?.status || 'N/A'}
          </Text>
        </View>
        {invoice?.status === 'Pending' && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.button }]}
            onPress={handleMarkAsPaid}
          >
            <Text style={styles.buttonText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <ActionModal
        isVisible={isPinModalVisible}
        onClose={() => {
          setPin('');
          setIsPinModalVisible(false);
        }}
        actions={getPinModalActions()}
        isDarkMode={isDarkMode}
      >
        <View style={styles.pinContainer}>
          <Text style={[styles.pinLabel, { color: themeColors.heading }]}>
            Enter Transaction PIN
          </Text>
          <TextInput
            style={[
              styles.pinInput,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            secureTextEntry
            maxLength={4}
            placeholder="Enter 4-digit PIN"
            placeholderTextColor={themeColors.subtext}
          />
        </View>
      </ActionModal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pinContainer: {
    padding: 16,
    alignItems: 'center',
  },
  pinLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
});

export default InvoiceDetailsScreen;
