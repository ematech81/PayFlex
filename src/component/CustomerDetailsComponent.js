import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CustomerSelectionModal from 'component/CustomerSelectionModal'; // Adjust path as needed
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

const CustomerDetailsComponent = ({
  selectedCustomer,
  setSelectedCustomer,
  onEditCustomer,
}) => {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSelectCustomer = (customer) => {
    console.log('Selected Customer in Component:', customer); // Debug log
    setSelectedCustomer(customer); // Update parent state
    setIsModalVisible(false); // Close modal
  };

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Customer
      </Text>
      {selectedCustomer ? (
        <View style={styles.customerInfo}>
          <Text style={[styles.customerName, { color: themeColors.heading }]}>
            {selectedCustomer.name}
          </Text>
          {selectedCustomer.email && (
            <Text
              style={[styles.customerDetail, { color: themeColors.subheading }]}
            >
              {selectedCustomer.email}
            </Text>
          )}
          {selectedCustomer.phone && (
            <Text
              style={[styles.customerDetail, { color: themeColors.subheading }]}
            >
              {selectedCustomer.phone}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: themeColors.button }]}
            onPress={() => onEditCustomer(selectedCustomer)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.selectButton, { backgroundColor: themeColors.button }]}
          onPress={handleOpenModal}
        >
          <Text style={styles.selectButtonText}>Select Customer</Text>
        </TouchableOpacity>
      )}
      <CustomerSelectionModal
        isVisible={isModalVisible}
        onSelect={handleSelectCustomer}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff', // Adjust based on theme if needed
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  customerInfo: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  customerDetail: {
    fontSize: 14,
    marginTop: 4,
  },
  selectButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CustomerDetailsComponent;
