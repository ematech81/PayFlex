import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import Collapsible from 'react-native-collapsible';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { MaterialIcons } from '@expo/vector-icons';

const ProductComponent = ({ products, setProducts, currency }) => {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isOwing, setIsOwing] = useState(false);
  const [outstandingDebt, setOutstandingDebt] = useState('');

  const subTotal = products.reduce(
    (sum, product) => sum + product.quantity * product.price,
    0
  );
  const debtAmount =
    isOwing && outstandingDebt ? parseFloat(outstandingDebt) || 0 : 0;

  // Function to format number with thousand separators and currency symbol
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
          Price: {formatCurrency(item.price, currency)}
        </Text>
        <Text style={[styles.productDetail, { color: themeColors.subheading }]}>
          Total: {formatCurrency(item.quantity * item.price, currency)}
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
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 20,
            flexDirection: 'row',
          }}
        >
          <Text style={[styles.subTotal, { color: themeColors.subheading }]}>
            Sub-Total:
          </Text>
          <Text style={[styles.subTotal, { color: themeColors.heading }]}>
            {formatCurrency(subTotal, currency)}
          </Text>
        </View>
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
                borderColor: themeColors.border,
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
                borderColor: themeColors.border,
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
                borderColor: themeColors.border,
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
              onPress={() => {
                setProductName('');
                setQuantity('');
                setPrice('');
                setSelectedProduct(null);
                setIsEditMode(false);
                setIsCollapsed(true);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {isCollapsed && (
        <TouchableOpacity
          style={[styles.addButton]}
          onPress={() => setIsCollapsed(false)}
        >
          <Text style={styles.addButtonText}>
            {products.length > 0 ? 'Add More Product' : 'Add Product'}
          </Text>
        </TouchableOpacity>
      )}
      <View
        style={[styles.debtContainer, { backgroundColor: themeColors.card }]}
      ></View>
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
  debtTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingTop: 10,
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
    color: '#4a00e0',
    fontSize: 17,
    fontWeight: 'bold',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleButton: {
    padding: 4,
    borderRadius: 8,
    //     marginLeft: 16,
  },
  toggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  debtContainer: {
    marginTop: 50,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
});

export default ProductComponent;
