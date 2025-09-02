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
  FlatList,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomerSelectionModal from 'component/CustomerSelectionModal';
import ActionModal from 'constants/ActionModal';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from '../context/WalletContext';
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
          value={dueDate || new Date()}
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

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
    setIsModalVisible(false);
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
    setIsEditModalVisible(false);
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setQuantity(product.quantity.toString());
    setPrice(product.price.toString());
    setIsEditModalVisible(true);
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
          Price: {currency || '₦'}
          {item.price.toFixed(2)}
        </Text>
        <Text style={[styles.productDetail, { color: themeColors.subheading }]}>
          Total: {currency || '₦'}
          {(item.quantity * item.price).toFixed(2)}
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
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: themeColors.button }]}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Add Product</Text>
      </TouchableOpacity>
      <ActionModal
        isVisible={isModalVisible}
        onClose={() => {
          setProductName('');
          setQuantity('');
          setPrice('');
          setIsModalVisible(false);
        }}
        actions={[
          {
            label: 'Add',
            onPress: handleAddProduct,
            style: { color: themeColors.heading },
          },
          {
            label: 'Cancel',
            onPress: () => {
              setProductName('');
              setQuantity('');
              setPrice('');
              setIsModalVisible(false);
            },
            style: { color: themeColors.destructive },
          },
        ]}
        isDarkMode={isDarkMode}
      >
        <View style={styles.modalContent}>
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
            Price ({currency || 'NGN'})
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
        </View>
      </ActionModal>
      <ActionModal
        isVisible={isEditModalVisible}
        onClose={() => {
          setProductName('');
          setQuantity('');
          setPrice('');
          setIsEditModalVisible(false);
        }}
        actions={[
          {
            label: 'Save',
            onPress: handleEditProduct,
            style: { color: themeColors.heading },
          },
          {
            label: 'Cancel',
            onPress: () => {
              setProductName('');
              setQuantity('');
              setPrice('');
              setIsEditModalVisible(false);
            },
            style: { color: themeColors.destructive },
          },
        ]}
        isDarkMode={isDarkMode}
      >
        <View style={styles.modalContent}>
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
            Price ({currency || 'NGN'})
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
        </View>
      </ActionModal>
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
  const [discountType, setDiscountType] = useState(discount.type || 'Fixed');
  const [discountValue, setDiscountValue] = useState(
    discount.value.toString() || '0'
  );
  const [taxType, setTaxType] = useState(tax.type || 'Fixed');
  const [taxValue, setTaxValue] = useState(tax.value.toString() || '0');

  const { subtotal, discountAmount, taxAmount, total } = calculateInvoice(
    products,
    { type: discountType, value: parseFloat(discountValue) || 0 },
    { type: taxType, value: parseFloat(taxValue) || 0 }
  );

  useEffect(() => {
    setDiscount({ type: discountType, value: parseFloat(discountValue) || 0 });
    setTax({ type: taxType, value: parseFloat(taxValue) || 0 });
  }, [discountType, discountValue, taxType, taxValue, setDiscount, setTax]);

  return (
    <View style={[styles.section, { backgroundColor: themeColors.card }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
        Financials
      </Text>
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Discount Type
      </Text>
      <View
        style={[
          styles.pickerContainer,
          { borderColor: themeColors.subheading },
        ]}
      >
        <Picker
          selectedValue={discountType}
          onValueChange={(value) => setDiscountType(value)}
          style={{ color: themeColors.heading }}
        >
          <Picker.Item label="Fixed" value="Fixed" />
          <Picker.Item label="Percentage" value="Percentage" />
        </Picker>
      </View>
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Discount Value
      </Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: themeColors.subheading, color: themeColors.heading },
        ]}
        value={discountValue}
        onChangeText={setDiscountValue}
        keyboardType="numeric"
        placeholder={
          discountType === 'Fixed'
            ? `Enter amount (${currency})`
            : 'Enter percentage'
        }
        placeholderTextColor={themeColors.subtext}
      />
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Tax Type
      </Text>
      <View
        style={[
          styles.pickerContainer,
          { borderColor: themeColors.subheading },
        ]}
      >
        <Picker
          selectedValue={taxType}
          onValueChange={(value) => setTaxType(value)}
          style={{ color: themeColors.heading }}
        >
          <Picker.Item label="Fixed" value="Fixed" />
          <Picker.Item label="Percentage" value="Percentage" />
        </Picker>
      </View>
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Tax Value
      </Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: themeColors.subheading, color: themeColors.heading },
        ]}
        value={taxValue}
        onChangeText={setTaxValue}
        keyboardType="numeric"
        placeholder={
          taxType === 'Fixed'
            ? `Enter amount (${currency})`
            : 'Enter percentage'
        }
        placeholderTextColor={themeColors.subtext}
      />
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Subtotal
      </Text>
      <Text style={[styles.value, { color: themeColors.subheading }]}>
        {currency || '₦'}
        {subtotal.toFixed(2)}
      </Text>
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Discount
      </Text>
      <Text style={[styles.value, { color: themeColors.subheading }]}>
        {currency || '₦'}
        {discountAmount.toFixed(2)}
      </Text>
      <Text style={[styles.label, { color: themeColors.heading }]}>Tax</Text>
      <Text style={[styles.value, { color: themeColors.subheading }]}>
        {currency || '₦'}
        {taxAmount.toFixed(2)}
      </Text>
      <Text style={[styles.label, { color: themeColors.heading }]}>Total</Text>
      <Text
        style={[
          styles.value,
          { color: themeColors.heading, fontWeight: '600' },
        ]}
      >
        {currency || '₦'}
        {total.toFixed(2)}
      </Text>
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
      alert('Please select a customer');
      return;
    }
    if (!title) {
      alert('Please enter an invoice title');
      return;
    }
    if (products.length === 0) {
      alert('Please add at least one product');
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
        <ProductComponent
          products={products}
          setProducts={setProducts}
          currency={currency}
        />
        <FinancialsComponent
          products={products}
          discount={discount}
          setDiscount={setDiscount}
          tax={tax}
          setTax={setTax}
          currency={currency}
          calculateInvoice={calculateInvoice}
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
  modalContent: {
    padding: 16,
  },
  value: {
    fontSize: 16,
    marginBottom: 16,
  },
});

export default InvoiceCreationScreen;
