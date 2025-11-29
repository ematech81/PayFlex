// screens/TransactionHistoryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import BackBtn from 'utility/BackBtn';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * Transaction History Screen
 * Features: Category filter, Status filter, Date picker, Pagination
 */
export default function TransactionHistoryScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { transactions, isLoadingTransactions, fetchTransactions } = useWallet();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Categories
  const CATEGORIES = [
    { label: 'All Categories', value: 'all', icon: '📋' },
    { label: 'Airtime', value: 'airtime', icon: '📱' },
    { label: 'Data', value: 'data', icon: '📊' },
    { label: 'Electricity', value: 'electricity', icon: '⚡' },
    { label: 'TV Subscription', value: 'tv', icon: '📺' },
    { label: 'Education', value: 'education', icon: '📚' },
    { label: 'Flight Booking', value: 'flight', icon: '✈️' },
    { label: 'Betting', value: 'betting', icon: '🎰' },
    { label: 'CAC Registration', value: 'cac', icon: '📄' },
    { label: 'NIN Services', value: 'nin', icon: '🆔' },
  ];

  // Statuses
  const STATUSES = [
    { label: 'All Status', value: 'all', color: '#999' },
    { label: 'Success', value: 'success', color: '#4CAF50' },
    { label: 'Failed', value: 'failed', color: '#ff3b30' },
    { label: 'Pending', value: 'pending', color: '#FFC107' },
  ];

  // ========================================
  // Load Transactions
  // ========================================
  useEffect(() => {
    loadTransactions();
  }, [selectedCategory, selectedStatus, selectedDate]);

  // In TransactionHistoryScreen.js - loadTransactions function

const loadTransactions = async (page = 1) => {
  try {
    const filters = {
      category: selectedCategory,
      status: selectedStatus,
      page,
      limit: 20,
    };

    if (selectedDate) {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      filters.startDate = startDate.toISOString();
      filters.endDate = endDate.toISOString();
    }

    console.log('🔴 Screen: Loading with filters:', filters);

    const result = await fetchTransactions(filters);
    
    console.log('🔴 Screen: Result received:', result); // ✅ Check this
    console.log('🔴 Screen: Transactions array:', result?.transactions); // ✅ Check this
    
    if (result.pagination) {
      setHasMore(result.pagination.hasMore);
      setCurrentPage(result.pagination.currentPage);
    }
  } catch (error) {
    console.error('❌ Screen: Load transactions error:', error);
  }
};

  // ========================================
  // Refresh Handler
  // ========================================
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadTransactions(1);
    setRefreshing(false);
  }, [selectedCategory, selectedStatus, selectedDate]);

  // ========================================
  // Load More Handler
  // ========================================
  const handleLoadMore = () => {
    if (!isLoadingTransactions && hasMore) {
      loadTransactions(currentPage + 1);
    }
  };

  // ========================================
  // Date Picker Handler
  // ========================================
  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const clearDate = () => {
    setSelectedDate(null);
  };

  // ========================================
  // Format Date
  // ========================================
  const formatTransactionDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${month} ${day}${suffix}, ${hours}:${minutes}:${seconds}`;
  };

  // ========================================
  // Get Service Name
  // ========================================
  const getServiceName = (type) => {
    const names = {
      airtime: 'Airtime Recharge',
      data: 'Data Bundle',
      electricity: 'Electricity Payment',
      tv: 'TV Subscription',
      education: 'Educational Service',
      flight: 'Flight Booking',
      betting: 'Betting',
      cac: 'CAC Registration',
      nin: 'NIN Services',
    };
    return names[type] || 'Transaction';
  };

  // ========================================
  // Get Status Color
  // ========================================
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'successful':
      case 'delivered':
        return '#4CAF50';
      case 'failed':
        return '#ff3b30';
      case 'pending':
        return '#FFC107';
      default:
        return '#999';
    }
  };

  // ========================================
  // Render Transaction Item
  // ========================================
  const renderTransactionItem = ({ item }) => {
    const isDebit = true; // All payments are debits
    const amountSign = isDebit ? '-' : '+';
    const amountColor = isDebit ? themeColors.destructive : '#4CAF50';

    return (
      <TouchableOpacity
        style={[styles.transactionItem, { backgroundColor: themeColors.card }]}
        onPress={() => navigation.navigate('TransactionDetails', { reference: item.reference })}
        activeOpacity={0.7}
      >
        {/* Left Section */}
        <View style={styles.transactionLeft}>
          {/* Service Icon */}
          <View style={[styles.serviceIconContainer, { backgroundColor: `${themeColors.primary}15` }]}>
            <Text style={styles.serviceIcon}>
              {CATEGORIES.find(c => c.value === item.type)?.icon || '💳'}
            </Text>
          </View>

          {/* Service Details */}
          <View style={styles.transactionDetails}>
            <Text style={[styles.serviceName, { color: themeColors.heading }]}>
              {getServiceName(item.type)}
            </Text>
            <Text style={[styles.transactionDate, { color: themeColors.subtext }]}>
              {formatTransactionDate(item.createdAt)}
            </Text>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Section - Amount */}
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {amountSign}{formatCurrency(item.amount, 'NGN')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={themeColors.subtext} />
        </View>
      </TouchableOpacity>
    );
  };

  // ========================================
  // Render Empty State
  // ========================================
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={[styles.emptyText, { color: themeColors.heading }]}>
        No transactions found
      </Text>
      <Text style={[styles.emptySubtext, { color: themeColors.subtext }]}>
        Try adjusting your filters
      </Text>
    </View>
  );

  // ========================================
  // Render Footer
  // ========================================
  const renderFooter = () => {
    if (!isLoadingTransactions) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  };

  // ========================================
  // Main Render
  // ========================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.card }]}>
        <BackBtn onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>
          Transaction History
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: themeColors.card }]}>
        {/* Category Dropdown */}
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: themeColors.background }]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={[styles.filterButtonText, { color: themeColors.heading }]}>
            {CATEGORIES.find(c => c.value === selectedCategory)?.label}
          </Text>
          <AntDesign name="down" size={16} color={themeColors.subtext} />
        </TouchableOpacity>

        {/* Status Dropdown */}
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: themeColors.background }]}
          onPress={() => setShowStatusModal(true)}
        >
          <Text style={[styles.filterButtonText, { color: themeColors.heading }]}>
            {STATUSES.find(s => s.value === selectedStatus)?.label}
          </Text>
          <AntDesign name="down" size={16} color={themeColors.subtext} />
        </TouchableOpacity>

        {/* Date Picker */}
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: themeColors.background }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={themeColors.primary} />
          <Text style={[styles.filterButtonText, { color: themeColors.heading }]}>
            {selectedDate ? selectedDate.toLocaleDateString() : 'Select Date'}
          </Text>
          {selectedDate && (
            <TouchableOpacity onPress={clearDate} style={styles.clearDateBtn}>
              <Ionicons name="close-circle" size={20} color={themeColors.destructive} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item._id || item.reference}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!isLoadingTransactions && renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.primary}
          />
        }
      />

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
                Select Category
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.modalItem,
                    selectedCategory === category.value && {
                      backgroundColor: `${themeColors.primary}15`,
                    },
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.value);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          selectedCategory === category.value
                            ? themeColors.primary
                            : themeColors.heading,
                      },
                    ]}
                  >
                    {category.label}
                  </Text>
                  {selectedCategory === category.value && (
                    <Ionicons name="checkmark" size={24} color={themeColors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
                Select Status
              </Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {STATUSES.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.modalItem,
                    selectedStatus === status.value && {
                      backgroundColor: `${status.color}15`,
                    },
                  ]}
                  onPress={() => {
                    setSelectedStatus(status.value);
                    setShowStatusModal(false);
                  }}
                >
                  <View
                    style={[styles.statusDot, { backgroundColor: status.color }]}
                  />
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          selectedStatus === status.value
                            ? status.color
                            : themeColors.heading,
                      },
                    ]}
                  >
                    {status.label}
                  </Text>
                  {selectedStatus === status.value && (
                    <Ionicons name="checkmark" size={24} color={status.color} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}

// ========================================
// Styles
// ========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  clearDateBtn: {
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceIcon: {
    fontSize: 24,
  },
  transactionDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  modalItemIcon: {
    fontSize: 24,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});