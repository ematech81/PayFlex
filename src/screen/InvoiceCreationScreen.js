import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  FlatList,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from 'context/WalletContext';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import CustomerDetailsComponent from 'component/CustomerDetailsComponent';
import InvoiceDetailsComponent from 'component/InvoiceDetailsComponent';
import ProductComponent from 'component/ProductComponent';
import AccountInfoComponent from 'component/AccountInfoComponent';

const InvoiceCreationScreen = ({ route }) => {
  const { invoice } = route.params || {};
  const { addInvoice, updateInvoice, calculateInvoice } = useWallet();
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [selectedCustomer, setSelectedCustomer] = useState(
    invoice?.customer || null
  );
  const [title, setTitle] = useState(invoice?.title || '');
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate ? new Date(invoice.dueDate) : null
  );
  const [currency, setCurrency] = useState(invoice?.currency || 'NGN');
  const [products, setProducts] = useState(invoice?.products || []);
  const [discount, setDiscount] = useState(
    invoice?.discount || { type: 'Fixed', value: 0 }
  );
  const [tax, setTax] = useState(invoice?.tax || { type: 'Fixed', value: 0 });

  const handleCreateInvoice = () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    if (!title) {
      Alert.alert('Error', 'Please enter an invoice title');
      return;
    }
    if (products.length === 0) {
      Alert.alert('Error', 'Please add at least one product');
      return;
    }
    const { subtotal, discountAmount, taxAmount, total } = calculateInvoice(
      products,
      discount,
      tax
    );
    const newInvoice = {
      ...invoice,
      customer: selectedCustomer,
      title,
      dueDate,
      currency,
      products,
      discount,
      tax,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      status: 'Processing',
      id:
        invoice?.id ||
        `INV-${String((invoice?.id?.split('-')[1] || 0) + 1).padStart(2, '0')}`,
    };
    navigation.navigate('InvoiceProcessing', { invoice: newInvoice });
  };

  const handleEditCustomer = (customer) => {
    navigation.navigate('CustomerRegistration', { customer });
  };

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'customer':
        return <CustomerDetailsComponent />;
      case 'invoice':
        return (
          <InvoiceDetailsComponent
            title={title}
            setTitle={setTitle}
            dueDate={dueDate}
            setDueDate={setDueDate}
            currency={currency}
            setCurrency={setCurrency}
          />
        );
      case 'products':
        return (
          <ProductComponent
            products={products}
            setProducts={setProducts}
            currency={currency}
          />
        );
      case 'account':
        return (
          <AccountInfoComponent
            products={products}
            discount={discount}
            setDiscount={setDiscount}
            tax={tax}
            setTax={setTax}
            currency={currency}
            calculateInvoice={calculateInvoice}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
    >
      <FlatList
        data={[
          { type: 'customer' },
          { type: 'invoice' },
          { type: 'products' },
          { type: 'account' },
        ]}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.contentContainer}
        ListFooterComponent={
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: themeColors.button },
              ]}
              onPress={handleCreateInvoice}
            >
              <Text style={styles.buttonText}>Create Invoice</Text>
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
        }
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButton: {
    flex: 0.7,
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
