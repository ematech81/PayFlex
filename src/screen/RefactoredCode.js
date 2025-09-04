import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomerSelectionModal from 'component/CustomerSelectionModal';
import Collapsible from 'react-native-collapsible';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from 'context/WalletContext';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { MaterialIcons } from '@expo/vector-icons';

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
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: themeColors.button }]}
          onPress={() => onEditCustomer(selectedCustomer)}
        >
          <Text style={styles.editButtonText}>Edit Customer</Text>
        </TouchableOpacity>
      )}
      <CustomerSelectionModal
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
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  // Set default due date to today (September 03, 2025)
  const today = new Date('2025-09-03T17:25:00Z'); // 05:25 PM WAT
  useEffect(() => {
    if (!dueDate) setDueDate(today);
  }, [dueDate]);

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
      {showDatePicker && (
        <DateTimePicker
          value={dueDate || today}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
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

const ProductComponent = ({ products, setProducts, currency }) => {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const subTotal = products.reduce(
    (sum, product) => sum + product.quantity * product.price,
    0
  );

  const handleAddProduct = () => {
    if (!productName || !quantity || !price) {
      Alert.alert('Error', 'Please fill in all product details');
      return;
    }
    const newProduct = {
      id: Date.now().toString(),
      name: productName,
      quantity: parseInt(quantity),
      price: parseFloat(price),
    };
    setProducts([...products, newProduct]);
    setProductName('');
    setQuantity('');
    setPrice('');
    setIsCollapsed(true);
  };

  const handleEditProduct = () => {
    if (!productName || !quantity || !price) {
      Alert.alert('Error', 'Please fill in all product details');
      return;
    }
    setProducts(
      products.map((p) =>
        p.id === selectedProduct.id
          ? {
              ...p,
              name: productName,
              quantity: parseInt(quantity),
              price: parseFloat(price),
            }
          : p
      )
    );
    setProductName('');
    setQuantity('');
    setPrice('');
    setSelectedProduct(null);
    setIsEditMode(false);
    setIsCollapsed(true);
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setQuantity(product.quantity.toString());
    setPrice(product.price.toString());
    setIsEditMode(true);
    setIsCollapsed(false);
  };

  const renderProduct = ({ item }) => (
    <View style={[styles.productItem, { backgroundColor: themeColors.card }]}>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: themeColors.heading }]}>
          {item.name}
        </Text>
        <Text style={[styles.productDetail, { color: themeColors.subheading }]}>
          Quantity: {item.quantity}
        </Text>
        <Text style={[styles.productDetail, { color: themeColors.subheading }]}>
          Price: ₦{item.price.toFixed(2)}
        </Text>
        <Text style={[styles.productDetail, { color: themeColors.subheading }]}>
          Total: ₦{(item.quantity * item.price).toFixed(2)}
        </Text>
      </View>
      <TouchableOpacity onPress={() => openEditModal(item)}>
        <MaterialIcons name="edit" size={24} color={themeColors.heading} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteProduct(item.id)}>
        <MaterialIcons
          name="delete"
          size={24}
          color={themeColors.destructive}
        />
      </TouchableOpacity>
    </View>
  );

  const isAddButtonActive = productName.trim().length > 0;

  return (
    <View style={[styles.section, { backgroundColor: themeColors.card }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
        Products
      </Text>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: themeColors.subheading }]}>
            No products added
          </Text>
        }
      />
      {products.length > 0 && (
        <Text style={[styles.subTotal, { color: themeColors.heading }]}>
          Sub-Total: ₦{subTotal.toFixed(2)}
        </Text>
      )}
      {!isCollapsed && (
        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Product Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={productName}
            onChangeText={setProductName}
            placeholder="Enter product name"
            placeholderTextColor={themeColors.subtext}
          />
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Quantity
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="Enter quantity"
            placeholderTextColor={themeColors.subtext}
          />
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Price (₦)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: themeColors.subheading,
                color: themeColors.heading,
              },
            ]}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="Enter price"
            placeholderTextColor={themeColors.subtext}
          />
          <View style={styles.formButtonContainer}>
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  backgroundColor: themeColors.button,
                  opacity: isAddButtonActive ? 1 : 0.5,
                },
              ]}
              onPress={
                isAddButtonActive
                  ? isEditMode
                    ? handleEditProduct
                    : handleAddProduct
                  : undefined
              }
              disabled={!isAddButtonActive}
            >
              <Text style={styles.addButtonText}>
                {isEditMode ? 'Save' : 'Add'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: themeColors.destructive,
                  opacity: isAddButtonActive ? 1 : 0.5,
                },
              ]}
              onPress={
                isAddButtonActive
                  ? () => {
                      setProductName('');
                      setQuantity('');
                      setPrice('');
                      setSelectedProduct(null);
                      setIsEditMode(false);
                      setIsCollapsed(true);
                    }
                  : undefined
              }
              disabled={!isAddButtonActive}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {isCollapsed && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: themeColors.button }]}
          onPress={() => setIsCollapsed(false)}
        >
          <Text style={styles.addButtonText}>
            {products.length > 0 ? 'Add More Product' : 'Add Product'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const FinancialsComponent = ({
  products,
  discount,
  setDiscount,
  tax,
  setTax,
  currency,
  calculateInvoice,
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
  const [accountNumber, setAccountNumber] = useState('');
  const [bank, setBank] = useState('');
  const [accountName, setAccountName] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const subTotal = products.reduce(
    (sum, product) => sum + product.quantity * product.price,
    0
  );
  const { discountAmount, taxAmount, total } = calculateInvoice(
    products,
    { type: discountType, value: parseFloat(discountValue) || 0 },
    { type: taxType, value: parseFloat(taxValue) || 0 }
  );

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
            value={(subTotal - discountAmount).toFixed(2)}
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
            value={(subTotal + taxAmount).toFixed(2)}
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
          ₦{subTotal.toFixed(2)}
        </Text>
      </Text>
      <Text style={[styles.labelPair, { color: themeColors.heading }]}>
        Discount
        <Text style={[styles.valuePair, { color: themeColors.subheading }]}>
          ₦{discountAmount.toFixed(2)}
        </Text>
      </Text>
      <Text style={[styles.labelPair, { color: themeColors.heading }]}>
        Tax
        <Text style={[styles.valuePair, { color: themeColors.subheading }]}>
          ₦{taxAmount.toFixed(2)}
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
          ₦{total.toFixed(2)}
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

  const handleSave = () => {
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
    const invoiceData = {
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

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'customer':
        return (
          <CustomerDetailsComponent
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            onEditCustomer={handleEditCustomer}
          />
        );
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
      case 'financials':
        return (
          <FinancialsComponent
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
          { type: 'financials' },
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
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>
                {invoice?.id ? 'Save' : 'Create Invoice'}
              </Text>
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
    flex: 0.7, // Shorter than add button
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
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productDetail: {
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  productList: {
    marginBottom: 16,
  },
  formContainer: {
    paddingTop: 8,
  },
  formButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  subTotal: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
  },
  subHeading: {
    fontSize: 14, // Smaller text for discount/tax
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
  picker: {
    flex: 1,
    height: 40,
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

export default InvoiceCreationScreen;
