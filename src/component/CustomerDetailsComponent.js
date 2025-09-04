import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CustomerSelectionModal from 'component/CustomerSelectionModal';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from 'context/WalletContext';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { MaterialIcons } from '@expo/vector-icons';

const CustomerDetailsComponent = () => {
  const walletContext = useWallet();
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [selectedCustomer, setSelectedCustomer] = useState(
    walletContext?.selectedCustomer || null
  );
  const [modalVisible, setModalVisible] = useState(false);

  const handleEditCustomer = (customer) => {
    navigation.navigate('CustomerRegistration', { customer });
  };

  return (
    <View style={[styles.section, { backgroundColor: themeColors.card }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
        Customer Details
      </Text>
      <TouchableOpacity
        style={[styles.customerInput, { borderColor: themeColors.border }]}
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
          onPress={() => handleEditCustomer(selectedCustomer)}
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
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    // marginTop: 20,
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
});

export default CustomerDetailsComponent;
