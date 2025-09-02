import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from 'context/WalletContext';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

const CustomerRegistrationScreen = ({ route }) => {
  const { customer, onNewCustomerAdded } = route.params || {};
  const walletContext = useWallet();
  const { addCustomer, updateCustomer } = walletContext || {};
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  // Debug: Log walletContext to verify
  console.log('WalletContext in CustomerRegistrationScreen:', walletContext);

  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');

  const handleSave = () => {
    if (!walletContext || !addCustomer || !updateCustomer) {
      Alert.alert('Error', 'Wallet context is unavailable');
      console.error(
        'WalletContext or addCustomer/updateCustomer is undefined in CustomerRegistrationScreen'
      );
      return;
    }

    if (!name) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const customerData = {
      id: customer?.id || Date.now().toString(),
      name,
      email: email || null,
      phone: phone || null,
    };

    if (customer?.id) {
      updateCustomer(customerData);
      navigation.goBack();
    } else {
      addCustomer(customerData);
      if (onNewCustomerAdded) {
        onNewCustomerAdded(customerData);
        navigation.goBack(); // Navigate back to InvoiceCreationScreen
      } else {
        navigation.goBack(); // Navigate back to CustomerTabScreen or other caller
      }
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
          {customer ? 'Edit Customer' : 'Add New Customer'}
        </Text>
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
            placeholderTextColor={themeColors.subtext}
          />
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Email (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            placeholderTextColor={themeColors.subtext}
            keyboardType="email-address"
          />
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Phone (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor={themeColors.subtext}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: themeColors.button }]}
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { backgroundColor: themeColors.destructive },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomerRegistrationScreen;
