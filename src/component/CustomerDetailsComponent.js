import { useWallet } from 'context/WalletContext';
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const CustomerDetailsComponent = ({ customer = [], onSubmit, onCancel }) => {
  const { addCustomer, updateCustomer } = useContext(useWallet);
  const [name, setName] = useState(customer.name || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [email, setEmail] = useState(customer.email || '');
  const [showExtra, setShowExtra] = useState(false);
  const [billingAddress, setBillingAddress] = useState(
    customer.extraDetails?.billingAddress || ''
  );
  const [location, setLocation] = useState(
    customer.extraDetails?.location || ''
  );
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }
    const customerData = {
      id: customer.id || undefined,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      extraDetails: showExtra
        ? { billingAddress: billingAddress.trim(), location: location.trim() }
        : {},
    };
    if (customer.id) {
      updateCustomer(customerData);
    } else {
      addCustomer(customerData);
    }
    onSubmit();
  };

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.label}>Customer Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter customer name"
      />
      <Text style={styles.label}>Phone Number (Optional)</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
      />
      <Text style={styles.label}>Email Address (Optional)</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email address"
        keyboardType="email-address"
      />
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowExtra(!showExtra)}
      >
        <Text style={styles.toggleButtonText}>
          {showExtra ? 'Hide Extra Details' : 'Add More Details'}
        </Text>
      </TouchableOpacity>
      {showExtra && (
        <View style={styles.extraDetails}>
          <Text style={styles.label}>Billing Address</Text>
          <TextInput
            style={styles.input}
            value={billingAddress}
            onChangeText={setBillingAddress}
            placeholder="Enter billing address"
            multiline
          />
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter location"
          />
        </View>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  toggleButton: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  extraDetails: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 16,
  },
});

export default CustomerDetailsComponent;
