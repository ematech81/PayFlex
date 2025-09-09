import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Switch,
} from 'react-native';
import Collapsible from 'react-native-collapsible';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import Separator from 'component/Separator';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Picker } from '@react-native-picker/picker';

const AccountInfoComponent = ({
  products,
  discount,
  setDiscount,
  tax,
  setTax,
  calculateInvoice,
  currency,
  debt: initialDebt = 0,
  setDebt,
  bank,
  setBank,
  accountNumber,
  setAccountNumber,
  accountName,
  setAccountName,
  additionalInfo,
  setAdditionalInfo,
}) => {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [isAccountCollapsed, setIsAccountCollapsed] = useState(true);
  const [discountType, setDiscountType] = useState(discount.type || 'Fixed');
  const [discountValue, setDiscountValue] = useState(
    discount.value.toString() || '0'
  );
  const [taxType, setTaxType] = useState(tax.type || 'Fixed');
  const [taxValue, setTaxValue] = useState(tax.value.toString() || '0');
  const [searchBankText, setSearchBankText] = useState(bank || ''); // Sync with parent bank
  const [isCustomerOwing, setIsCustomerOwing] = useState(false);
  const [debt, setLocalDebt] = useState(initialDebt.toString() || '0');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Bank list
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

  // Filter banks based on search text
  const filteredBanks = banks.filter((bankName) =>
    bankName.toLowerCase().includes(searchBankText.toLowerCase())
  );

  const subTotal = products.reduce(
    (sum, product) => sum + product.quantity * product.price,
    0
  );

  const {
    discountAmount,
    taxAmount,
    total: baseTotal,
  } = calculateInvoice(
    products,
    { type: discountType, value: parseFloat(discountValue) || 0 },
    { type: taxType, value: parseFloat(taxValue) || 0 }
  );
  const debtAmount = isCustomerOwing ? parseFloat(debt) || 0 : 0;
  const total = baseTotal + debtAmount;

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
    if (setDebt) setDebt(parseFloat(debt) || 0);
    // Sync searchBankText with bank prop on mount or change
    if (bank !== searchBankText) setSearchBankText(bank || '');
  }, [
    discountType,
    discountValue,
    taxType,
    taxValue,
    setDiscount,
    setTax,
    debt,
    setDebt,
    bank, // Add bank to dependency array
  ]);

  const handleBankSelect = (selectedBank) => {
    setBank(selectedBank); // Update parent state
    setSearchBankText(selectedBank); // Update local search text
    setShowSuggestions(false); // Hide dropdown
  };

  return (
    <View style={[styles.section, { backgroundColor: themeColors.card }]}>
      <TouchableOpacity
        onPress={() => setIsAccountCollapsed(!isAccountCollapsed)}
        style={styles.accountWrapper}
      >
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Account Info
        </Text>
        <AntDesign
          name={isAccountCollapsed ? 'downcircleo' : 'upcircleo'}
          size={24}
          color={themeColors.heading}
        />
      </TouchableOpacity>
      <Collapsible collapsed={isAccountCollapsed}>
        <Text
          style={[
            styles.subHeading,
            { color: themeColors.primary, fontSize: 16 },
          ]}
        >
          Discount
        </Text>
        <View
          style={[styles.pickerWrapper, { borderColor: themeColors.border }]}
        >
          <Picker
            selectedValue={discountType}
            onValueChange={(value) => setDiscountType(value)}
            style={[styles.pickerSmall, { color: themeColors.heading }]}
          >
            <Picker.Item label="Fixed" value="Fixed" />
            <Picker.Item label="Percentage" value="Percentage" />
          </Picker>
        </View>
        <View
          style={[styles.rowContainer, { borderColor: themeColors.subheading }]}
        >
          <TextInput
            style={[
              styles.inputSmall,
              { borderColor: themeColors.border, color: themeColors.heading },
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
              { borderColor: themeColors.border, color: themeColors.heading },
            ]}
            value={formatCurrency(subTotal - discountAmount, currency)}
            editable={false}
            placeholder="0.00"
            placeholderTextColor={themeColors.subtext}
          />
        </View>

        <Separator />

        <Text
          style={[
            styles.subHeading,
            { color: themeColors.primary, fontSize: 16 },
          ]}
        >
          Tax
        </Text>
        <View
          style={[styles.pickerWrapper, { borderColor: themeColors.border }]}
        >
          <Picker
            selectedValue={taxType}
            onValueChange={(value) => setTaxType(value)}
            style={[styles.pickerSmall, { color: themeColors.heading }]}
          >
            <Picker.Item label="Fixed" value="Fixed" />
            <Picker.Item label="Percentage" value="Percentage" />
          </Picker>
        </View>
        <View
          style={[styles.rowContainer, { borderColor: themeColors.subheading }]}
        >
          <TextInput
            style={[
              styles.inputSmall,
              { borderColor: themeColors.border, color: themeColors.heading },
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
              { borderColor: themeColors.border, color: themeColors.heading },
            ]}
            value={formatCurrency(subTotal + taxAmount, currency)}
            editable={false}
            placeholder="0.00"
            placeholderTextColor={themeColors.subtext}
          />
        </View>

        <Separator />

        <Text
          style={[
            styles.subHeading,
            { color: themeColors.primary, fontSize: 16 },
          ]}
        >
          Bank Info
        </Text>
        <Text style={[styles.label, { color: themeColors.heading }]}>
          Bank Name
        </Text>
        <View
          style={[
            styles.pickerContainer,
            { borderColor: themeColors.subheading, position: 'relative' },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { borderColor: themeColors.border, color: themeColors.heading },
            ]}
            value={searchBankText}
            onChangeText={setSearchBankText}
            placeholder="Search or enter bank"
            placeholderTextColor={themeColors.subtext}
            onFocus={() => setShowSuggestions(true)}
          />
          {searchBankText && showSuggestions && (
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bankSuggestion}
                  onPress={() => handleBankSelect(item)}
                >
                  <Text
                    style={{
                      color: themeColors.primary,
                      padding: 8,
                      fontWeight: 'bold',
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionList}
            />
          )}
        </View>
        <Text style={[styles.label, { color: themeColors.heading }]}>
          Account Number
        </Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: themeColors.border, color: themeColors.heading },
          ]}
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="numeric"
          placeholder="Enter account number"
          placeholderTextColor={themeColors.subtext}
        />
        <Text style={[styles.label, { color: themeColors.heading }]}>
          Account Name
        </Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: themeColors.border, color: themeColors.heading },
          ]}
          value={accountName}
          onChangeText={setAccountName}
          placeholder="Enter account name"
          placeholderTextColor={themeColors.subtext}
        />

        <View style={styles.rowContainer}>
          <Text style={[styles.label, { color: themeColors.heading, flex: 1 }]}>
            Is the customer owing?
          </Text>
          <Switch
            trackColor={{
              false: themeColors.subheading,
              true: themeColors.primary,
            }}
            thumbColor={isCustomerOwing ? themeColors.card : themeColors.border}
            ios_backgroundColor={themeColors.subheading}
            onValueChange={setIsCustomerOwing}
            value={isCustomerOwing}
          />
        </View>
        {isCustomerOwing && (
          <View style={styles.rowContainer}>
            <Text
              style={[styles.label, { color: themeColors.heading, flex: 1 }]}
            >
              Debt Amount
            </Text>
            <TextInput
              style={[
                styles.inputSmall,
                { borderColor: themeColors.border, color: themeColors.heading },
              ]}
              value={debt}
              onChangeText={setLocalDebt}
              keyboardType="numeric"
              placeholder="₦0.00"
              placeholderTextColor={themeColors.subtext}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.hideButton, { backgroundColor: themeColors.button }]}
          onPress={() => setIsAccountCollapsed(true)}
        >
          <Text style={styles.buttonText}>Hide Account</Text>
        </TouchableOpacity>
      </Collapsible>

      {(products.length > 0 || debtAmount > 0) && (
        <>
          <Separator />
          <View style={styles.rowContainer}>
            <Text style={[styles.labelPair, { color: themeColors.heading }]}>
              Sub-Total
            </Text>
            <Text style={[styles.valuePair, { color: themeColors.primary }]}>
              {formatCurrency(subTotal, currency)}
            </Text>
          </View>
          <View style={styles.rowContainer}>
            <Text style={[styles.labelPair, { color: themeColors.heading }]}>
              Discount
            </Text>
            <Text style={[styles.valuePair, { color: themeColors.primary }]}>
              {formatCurrency(discountAmount, currency)}
            </Text>
          </View>
          <View style={styles.rowContainer}>
            <Text style={[styles.labelPair, { color: themeColors.heading }]}>
              Tax
            </Text>
            <Text style={[styles.valuePair, { color: themeColors.primary }]}>
              {formatCurrency(taxAmount, currency)}
            </Text>
          </View>
          {isCustomerOwing && debtAmount > 0 && (
            <View style={styles.rowContainer}>
              <Text style={[styles.labelPair, { color: themeColors.heading }]}>
                Outstanding Debt
              </Text>
              <Text style={[styles.valuePair, { color: themeColors.primary }]}>
                {formatCurrency(debtAmount, currency)}
              </Text>
            </View>
          )}
          <View style={styles.rowContainer}>
            <Text style={[styles.labelPair, { color: themeColors.heading }]}>
              Total
            </Text>
            <Text
              style={[
                styles.valuePair,
                {
                  color: themeColors.primary,
                  fontWeight: 'bold',
                  fontSize: 18,
                },
              ]}
            >
              {formatCurrency(total, currency)}
            </Text>
          </View>
        </>
      )}

      <Separator />
      <Text style={[styles.label, { color: themeColors.primary }]}>
        Additional Info
      </Text>
      <TextInput
        style={[
          styles.textArea,
          { borderColor: themeColors.border, color: themeColors.heading },
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
    fontSize: 22,
    fontWeight: 'bold',
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
    position: 'relative',
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
    marginBottom: 16,
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
    fontSize: 16,
    marginRight: 6,
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
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    height: 70,
  },
  accountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  bankSuggestion: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  suggestionList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    zIndex: 10,
  },
});

export default AccountInfoComponent;
