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
import { useWallet } from '../context/WalletContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import ActionModal from 'constants/ActionModal';

const InvoiceTabScreen = () => {
  const { invoices, deleteInvoice, setInvoicePaid } = useWallet();
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleCreateNew = () => {
    navigation.navigate('InvoiceCreation');
  };

  const handleEdit = (invoice) => {
    navigation.navigate('InvoiceCreation', { invoice });
  };

  const handleDelete = (invoiceId) => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteInvoice(invoiceId),
        },
      ]
    );
  };

  const handleViewDetails = (invoice) => {
    if (invoice.status === 'Pending') {
      navigation.navigate('InvoiceDetails', { invoice });
    }
  };

  const handleMarkAsPaid = (invoiceId) => {
    Alert.alert('Mark as Paid', 'Confirm that this invoice has been paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => setInvoicePaid(invoiceId),
      },
    ]);
  };

  const openMenu = (invoice) => {
    setSelectedInvoice(invoice);
    setIsMenuVisible(true);
  };

  const getMenuActions = (invoice) => {
    const actions = [];
    if (invoice?.status !== 'Paid') {
      actions.push({
        label: 'Edit',
        onPress: () => handleEdit(invoice),
        style: { color: themeColors.heading },
      });
    }
    if (invoice?.status !== 'Pending') {
      actions.push({
        label: 'Delete',
        onPress: () => handleDelete(invoice?.id),
        style: { color: themeColors.destructive },
      });
    }
    if (invoice?.status === 'Pending') {
      actions.push({
        label: 'Mark as Paid',
        onPress: () => handleMarkAsPaid(invoice?.id),
        style: { color: themeColors.heading },
      });
    }
    return actions;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Draft':
        return { color: themeColors.destructive };
      case 'Pending':
        return { color: '#f1c40f' }; // Yellow, kept as is for visibility
      case 'Paid':
        return { color: '#2ecc71' }; // Green, kept as is for visibility
      default:
        return { color: themeColors.heading };
    }
  };

  const renderInvoice = ({ item }) => (
    <TouchableOpacity
      style={[styles.invoiceItem, { backgroundColor: themeColors.card }]}
      onPress={() => handleViewDetails(item)}
      disabled={item.status !== 'Pending'}
    >
      <View style={styles.invoiceInfo}>
        <Text style={[styles.invoiceTitle, { color: themeColors.heading }]}>
          {item.title}
        </Text>
        <Text style={[styles.invoiceDetail, { color: themeColors.subheading }]}>
          Customer: {item.customer?.name || 'N/A'}
        </Text>
        <Text
          style={[
            styles.invoiceDetail,
            { color: themeColors.subheading },
            getStatusStyle(item.status),
          ]}
        >
          Status: {item.status}
        </Text>
        <Text style={[styles.invoiceDetail, { color: themeColors.subheading }]}>
          Total: ₦{item.total.toFixed(2)}
        </Text>
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
      {invoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: themeColors.heading }]}>
            No invoices found
          </Text>
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: themeColors.button },
            ]}
            onPress={handleCreateNew}
          >
            <Text style={styles.createButtonText}>Create New Invoice</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderInvoice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
      <ActionModal
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        actions={getMenuActions(selectedInvoice)}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  invoiceItem: {
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
  invoiceInfo: {
    flex: 1,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  invoiceDetail: {
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
});

export default InvoiceTabScreen;
