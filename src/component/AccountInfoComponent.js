import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Collapsible from 'react-native-collapsible';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

const AccountInfoComponent = ({
  products,
  discount,
  setDiscount,
  tax,
  setTax,
  calculateInvoice,
  currency,
}) => {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [isAccountCollapsed, setIsAccountCollapsed] = useState(true);
  const [accountNumber, setAccountNumber] = useState('');
  const [bank, setBank] = useState('');
  const [accountName, setAccountName] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [discountType, setDiscountType] = useState(discount.type || 'Fixed');
  const [discountValue, setDiscountValue] = useState(
    discount.value.toString() || '0'
  );
  const [taxType, setTaxType] = useState(tax.type || 'Fixed');
  const [taxValue, setTaxValue] = useState(tax.value.toString() || '0');

  const subTotal = products.reduce(
    (sum, product) => sum + product.quantity * product.price,
    0
  );
  const { discountAmount, taxAmount, total } = calculateInvoice(
    products,
    { type: discountType, value: parseFloat(discountValue) || 0 },
    { type: taxType, value: parseFloat(taxValue) || 0 }
  );

  // Reusable currency formatting function
  const formatCurrency = (amount, currencyCode) => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const formattedAmount = formatter.format(amount);
    const symbols = { NGN: '₦', USD: '$', EUR: '€' };
    const currencySymbol = symbols[currencyCode] || '₦';
    return `${currencySymbol}${formattedAmount}`;
  };

  useEffect(() => {
    setDiscount({ type: discountType, value: parseFloat(discountValue) || 0 });
    setTax({ type: taxType, value: parseFloat(taxValue) || 0 });
  }, [discountType, discountValue, taxType, taxValue, setDiscount, setTax]);

  const banks = [
    'Access Bank',
    'First Bank',
    'Guaranty Trust Bank',
    'Zenith Bank',
    'United Bank for Africa',
    'Ecobank',
    'Fidelity Bank',
    'Stanbic IBTC',
    'Union Bank',
    'Others',
  ];

  return (
    <View style={[styles.section, { backgroundColor: themeColors.card }]}>
      <TouchableOpacity
        onPress={() => setIsAccountCollapsed(!isAccountCollapsed)}
      >
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Account Info
        </Text>
      </TouchableOpacity>
      <Collapsible collapsed={isAccountCollapsed}>
        <Text style={[styles.label, { color: themeColors.heading }]}>
          User Account Number
        </Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: themeColors.subheading, color: themeColors.heading },
          ]}
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="numeric"
          placeholder="Enter account number"
          placeholderTextColor={themeColors.subtext}
        />
        <Text style={[styles.label, { color: themeColors.heading }]}>Bank</Text>
        <View
          style={[
            styles.pickerContainer,
            { borderColor: themeColors.subheading },
          ]}
        >
          <Picker
            selectedValue={bank}
            onValueChange={(itemValue) => setBank(itemValue)}
            style={{ color: themeColors.heading }}
          >
            {banks.map((bankName) => (
              <Picker.Item key={bankName} label={bankName} value={bankName} />
            ))}
          </Picker>
        </View>
        <Text style={[styles.label, { color: themeColors.heading }]}>
          Account Name
        </Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: themeColors.subheading, color: themeColors.heading },
          ]}
          value={accountName}
          onChangeText={setAccountName}
          placeholder="Enter account name"
          placeholderTextColor={themeColors.subtext}
        />
        <Text
          style={[
            styles.subHeading,
            { color: themeColors.heading, fontSize: 14 },
          ]}
        >
          Discount
        </Text>
        <View
          style={[styles.rowContainer, { borderColor: themeColors.subheading }]}
        >
          <Picker
            selectedValue={discountType}
            onValueChange={(value) => setDiscountType(value)}
            style={[styles.pickerSmall, { color: themeColors.heading }]}
          >
            <Picker.Item label="Fixed" value="Fixed" />
            <Picker.Item label="Percentage" value="Percentage" />
          </Picker>
          <TextInput
            style={[
              styles.inputSmall,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={discountValue}
            onChangeText={setDiscountValue}
            keyboardType="numeric"
            placeholder="₦0"
            placeholderTextColor={themeColors.subtext}
          />
          <TextInput
            style={[
              styles.inputSmall,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={formatCurrency(subTotal - discountAmount, currency)}
            editable={false}
            placeholder="0.00"
            placeholderTextColor={themeColors.subtext}
          />
        </View>
        <Text
          style={[
            styles.subHeading,
            { color: themeColors.heading, fontSize: 14 },
          ]}
        >
          Tax
        </Text>
        <View
          style={[styles.rowContainer, { borderColor: themeColors.subheading }]}
        >
          <Picker
            selectedValue={taxType}
            onValueChange={(value) => setTaxType(value)}
            style={[styles.pickerSmall, { color: themeColors.heading }]}
          >
            <Picker.Item label="Fixed" value="Fixed" />
            <Picker.Item label="Percentage" value="Percentage" />
          </Picker>
          <TextInput
            style={[
              styles.inputSmall,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={taxValue}
            onChangeText={setTaxValue}
            keyboardType="numeric"
            placeholder="₦0"
            placeholderTextColor={themeColors.subtext}
          />
          <TextInput
            style={[
              styles.inputSmall,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={formatCurrency(subTotal + taxAmount, currency)}
            editable={false}
            placeholder="0.00"
            placeholderTextColor={themeColors.subtext}
          />
        </View>
        <TouchableOpacity
          style={[styles.hideButton, { backgroundColor: themeColors.button }]}
          onPress={() => setIsAccountCollapsed(true)}
        >
          <Text style={styles.buttonText}>Hide Account</Text>
        </TouchableOpacity>
      </Collapsible>
      <Text style={[styles.labelPair, { color: themeColors.heading }]}>
        Sub-Total
        <Text style={[styles.valuePair, { color: themeColors.subheading }]}>
          {formatCurrency(subTotal, currency)}
        </Text>
      </Text>
      <Text style={[styles.labelPair, { color: themeColors.heading }]}>
        Discount
        <Text style={[styles.valuePair, { color: themeColors.subheading }]}>
          {formatCurrency(discountAmount, currency)}
        </Text>
      </Text>
      <Text style={[styles.labelPair, { color: themeColors.heading }]}>
        Tax
        <Text style={[styles.valuePair, { color: themeColors.subheading }]}>
          {formatCurrency(taxAmount, currency)}
        </Text>
      </Text>
      <Text style={[styles.labelPair, { color: themeColors.heading }]}>
        Total
        <Text
          style={[
            styles.valuePair,
            { color: themeColors.heading, fontWeight: '600' },
          ]}
        >
          {formatCurrency(total, currency)}
        </Text>
      </Text>
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Additional Info
      </Text>
      <TextInput
        style={[
          styles.textArea,
          { borderColor: themeColors.subheading, color: themeColors.heading },
        ]}
        value={additionalInfo}
        onChangeText={setAdditionalInfo}
        placeholder="Additional Info"
        placeholderTextColor={themeColors.subtext}
        multiline
        numberOfLines={4}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
  subHeading: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    padding: 8,
  },
  pickerSmall: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  inputSmall: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    fontSize: 16,
  },
  hideButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  labelPair: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    flex: 1,
  },
  valuePair: {
    fontSize: 16,
    marginBottom: 8,
    flex: 1,
    textAlign: 'right',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
});

export default AccountInfoComponent;
