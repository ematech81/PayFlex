import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from '../context/WalletContext';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import ActionModal from 'constants/ActionModal';

const CustomerDetailsComponent = ({
  selectedCustomer,
  setSelectedCustomer,
  onEditCustomer,
}) => {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={[styles.section, { backgroundColor: themeColors.card }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
        Customer Details
      </Text>
      <TouchableOpacity
        style={[styles.customerInput, { borderColor: themeColors.subheading }]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.customerText,
            {
              color: selectedCustomer
                ? themeColors.heading
                : themeColors.subtext,
            },
          ]}
        >
          {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
        </Text>
      </TouchableOpacity>
      {selectedCustomer && (
        <>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Phone Number
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={selectedCustomer.phone || ''}
            editable={false}
            placeholder="Phone number"
            placeholderTextColor={themeColors.subtext}
          />
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Email Address
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={selectedCustomer.email || ''}
            editable={false}
            placeholder="Email address"
            placeholderTextColor={themeColors.subtext}
          />
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: themeColors.button }]}
            onPress={() => onEditCustomer(selectedCustomer)}
          >
            <Text style={styles.editButtonText}>Edit Customer</Text>
          </TouchableOpacity>
        </>
      )}
      <ActionModalModal
        isVisible={modalVisible}
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          setModalVisible(false);
        }}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const InvoiceDetailsComponent = ({
  title,
  setTitle,
  dueDate,
  setDueDate,
  currency,
  setCurrency,
}) => {
  const isDarkMode = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <View style={[styles.section, { backgroundColor: themeColors.card }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
        Invoice Details
      </Text>
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Invoice Title
      </Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: themeColors.subheading, color: themeColors.heading },
        ]}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter invoice title"
        placeholderTextColor={themeColors.subtext}
      />
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Due Date
      </Text>
      <TouchableOpacity
        style={[styles.input, { borderColor: themeColors.subheading }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.customerText, { color: themeColors.heading }]}>
          {dueDate ? dueDate.toLocaleDateString() : 'Select due date'}
        </Text>
      </TouchableOpacity>
      {/* {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )} */}
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Currency
      </Text>
      <View
        style={[
          styles.pickerContainer,
          { borderColor: themeColors.subheading },
        ]}
      >
        <Picker
          selectedValue={currency}
          onValueChange={(itemValue) => setCurrency(itemValue)}
          style={{ color: themeColors.heading }}
        >
          <Picker.Item label="NGN (₦)" value="NGN" />
          <Picker.Item label="USD ($)" value="USD" />
          <Picker.Item label="EUR (€)" value="EUR" />
        </Picker>
      </View>
    </View>
  );
};

const InvoiceCreationScreen = ({ route }) => {
  const { invoice } = route.params || {};
  const { addInvoice, updateInvoice } = useWallet();
  const navigation = useNavigation();
  const isDarkMode = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [selectedCustomer, setSelectedCustomer] = useState(
    invoice?.customer || null
  );
  const [title, setTitle] = useState(invoice?.title || '');
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate ? new Date(invoice.dueDate) : null
  );
  const [currency, setCurrency] = useState(invoice?.currency || 'NGN');

  const handleSave = () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    if (!title) {
      alert('Please enter an invoice title');
      return;
    }
    const invoiceData = {
      ...invoice,
      customer: selectedCustomer,
      title,
      dueDate,
      currency,
      products: invoice?.products || [],
      discount: invoice?.discount || { type: 'Fixed', value: 0 },
      tax: invoice?.tax || { type: 'Fixed', value: 0 },
      status: invoice?.status || 'Draft',
    };
    if (invoice?.id) {
      updateInvoice(invoiceData);
    } else {
      addInvoice(invoiceData);
    }
    navigation.goBack();
  };

  const handleEditCustomer = (customer) => {
    navigation.navigate('CustomerRegistration', { customer });
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
          {invoice ? 'Edit Invoice' : 'Create New Invoice'}
        </Text>
        <CustomerDetailsComponent
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          onEditCustomer={handleEditCustomer}
        />
        <InvoiceDetailsComponent
          title={title}
          setTitle={setTitle}
          dueDate={dueDate}
          setDueDate={setDueDate}
          currency={currency}
          setCurrency={setCurrency}
        />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  customerInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  customerText: {
    fontSize: 16,
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  editButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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

export default InvoiceCreationScreen;
