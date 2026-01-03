import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from 'context/WalletContext';
import { MaterialIcons } from '@expo/vector-icons';
import ActionModal from 'constants/ActionModal';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

const CustomerTabScreen = () => {
  const { customers = [], deleteCustomer } = useWallet();
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleCreateNew = () => {
    navigation.navigate('CustomerRegistration');
  };

  const handleEdit = (customer) => {
    navigation.navigate('CustomerRegistration', { customer });
  };

  const handleDelete = (customerId) => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCustomer(customerId),
        },
      ]
    );
  };

  const openMenu = (customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setIsMenuVisible(true);
    }
  };

  const getMenuActions = (customer) => {
    if (!customer) return [];
    return [
      {
        label: 'Edit',
        onPress: () => handleEdit(customer),
        style: { color: themeColors.heading },
      },
      {
        label: 'Delete',
        onPress: () => handleDelete(customer.id),
        style: { color: themeColors.destructive },
      },
    ];
  };

  const renderCustomer = ({ item }) => (
    <TouchableOpacity
      style={[styles.customerItem, { backgroundColor: themeColors.card }]}
      onPress={() =>
        navigation.navigate('CustomerRegistration', { customer: item })
      }
    >
      <View style={styles.customerInfo}>
        <Text style={[styles.customerName, { color: themeColors.heading }]}>
          {item.name}
        </Text>
        {item.email && (
          <Text
            style={[styles.customerDetail, { color: themeColors.subheading }]}
          >
            {item.email}
          </Text>
        )}
        {item.phone && (
          <Text
            style={[styles.customerDetail, { color: themeColors.subheading }]}
          >
            {item.phone}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => openMenu(item)}>
        <MaterialIcons name="more-vert" size={24} color={themeColors.heading} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeColors.heading }]}>
              No customers found
            </Text>
            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: themeColors.button },
              ]}
              onPress={handleCreateNew}
            >
              <Text style={styles.createButtonText}>Create New Customer</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: themeColors.button }]}
        onPress={handleCreateNew}
      >
        <MaterialIcons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      <ActionModal
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        actions={getMenuActions(selectedCustomer)}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for the add button
  },
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  customerDetail: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 16,
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default CustomerTabScreen;
