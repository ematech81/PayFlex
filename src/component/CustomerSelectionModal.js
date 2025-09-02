import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from 'context/WalletContext';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

const CustomerSelectionModal = ({
  isVisible,
  onSelect,
  onClose,
  onNewCustomerAdded,
}) => {
  const walletContext = useWallet();
  const customers = walletContext?.customers || [];
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const handleAddCustomer = () => {
    onClose();
    navigation.navigate('CustomerRegistration', { onNewCustomerAdded });
  };

  const renderCustomer = ({ item }) => (
    <TouchableOpacity
      style={[styles.customerItem, { backgroundColor: themeColors.card }]}
      onPress={() => onSelect(item)}
    >
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
    </TouchableOpacity>
  );

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={[styles.container, { backgroundColor: themeColors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: themeColors.heading }]}>
            Select Customer
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={themeColors.heading} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={customers}
          renderItem={renderCustomer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: themeColors.heading }]}>
              No customers found
            </Text>
          }
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: themeColors.button }]}
          onPress={handleAddCustomer}
        >
          <Text style={styles.addButtonText}>Add New Customer</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    maxHeight: '80%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  customerItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  customerDetail: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
});

export default CustomerSelectionModal;
