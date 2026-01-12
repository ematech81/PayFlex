// screens/BookingHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'context/ThemeContext';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader } from 'component/SHARED';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import bookingService from 'AuthFunction/bookingService';

// ============================================
// BOOKING CARD COMPONENT
// ============================================
const BookingCard = ({ booking, onPress, themeColors }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'completed':
        return '#3B82F6';
      case 'cancelled':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return themeColors.subtext;
    }
  };

  const statusColor = getStatusColor(booking.status);

  return (
    <TouchableOpacity
      style={[styles.bookingCard, { backgroundColor: themeColors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.providerIcon, { backgroundColor: `${themeColors.primary}20` }]}>
            <Ionicons name="bus" size={20} color={themeColors.primary} />
          </View>
          <View>
            <Text style={[styles.providerName, { color: themeColors.heading }]}>
              {booking.tripDetails.provider.name}
            </Text>
            <Text style={[styles.bookingRef, { color: themeColors.subtext }]}>
              {booking.bookingReference}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {booking.status}
          </Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeSection}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: themeColors.primary }]} />
          <Text style={[styles.routeText, { color: themeColors.heading }]}>
            {booking.tripDetails.origin}
          </Text>
        </View>
        <View style={styles.routeArrow}>
          <Ionicons name="arrow-forward" size={16} color={themeColors.subtext} />
        </View>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.routeText, { color: themeColors.heading }]}>
            {booking.tripDetails.destination}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color={themeColors.subtext} />
          <Text style={[styles.detailText, { color: themeColors.subtext }]}>
            {new Date(booking.tripDetails.departureDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={themeColors.subtext} />
          <Text style={[styles.detailText, { color: themeColors.subtext }]}>
            {booking.tripDetails.departureTime}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={16} color={themeColors.subtext} />
          <Text style={[styles.detailText, { color: themeColors.subtext }]}>
            {booking.passengers.length} passenger{booking.passengers.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
        <Text style={[styles.amountLabel, { color: themeColors.subtext }]}>
          Total Paid
        </Text>
        <Text style={[styles.amountValue, { color: themeColors.primary }]}>
          {formatCurrency(booking.payment.amount, 'NGN')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// MAIN SCREEN
// ============================================
export default function BookingHistoryScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadBookings();
  }, [activeFilter]);

  const loadBookings = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const params = {
        page: pageNum,
        limit: 20,
      };

      if (activeFilter !== 'all') {
        params.status = activeFilter;
      }

      const response = await bookingService.getUserBookings(params);

      if (response.success) {
        if (pageNum === 1) {
          setBookings(response.data.bookings);
        } else {
          setBookings([...bookings, ...response.data.bookings]);
        }

        setPage(pageNum);
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadBookings(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadBookings(page + 1);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPage(1);
    setHasMore(true);
  };

  const handleBookingPress = (booking) => {
    navigation.navigate('Receipt', {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
    });
  };

  const renderBooking = ({ item }) => (
    <BookingCard
      booking={item}
      onPress={() => handleBookingPress(item)}
      themeColors={themeColors}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: `${themeColors.primary}20` }]}>
        <Ionicons name="receipt-outline" size={48} color={themeColors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: themeColors.heading }]}>
        No Bookings Found
      </Text>
      <Text style={[styles.emptyText, { color: themeColors.subtext }]}>
        {activeFilter === 'all'
          ? "You haven't made any bookings yet"
          : `No ${activeFilter} bookings found`}
      </Text>
      {activeFilter === 'all' && (
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: themeColors.primary }]}
          onPress={() => navigation.navigate('Transport')}
        >
          <Text style={styles.emptyButtonText}>Book Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={themeColors.primary} />
      </View>
    );
  };

  const filters = [
    { id: 'all', label: 'All', icon: 'list' },
    { id: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle' },
    { id: 'completed', label: 'Completed', icon: 'checkmark-done-circle' },
    { id: 'cancelled', label: 'Cancelled', icon: 'close-circle' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <ScreenHeader
        title="Booking History"
        onBackPress={() => navigation.goBack()}
      />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterTab,
              activeFilter === filter.id && {
                backgroundColor: themeColors.primary,
              },
              activeFilter !== filter.id && {
                backgroundColor: themeColors.card,
              },
            ]}
            onPress={() => handleFilterChange(filter.id)}
          >
            <Ionicons
              name={filter.icon}
              size={18}
              color={activeFilter === filter.id ? '#FFFFFF' : themeColors.subtext}
            />
            <Text
              style={[
                styles.filterText,
                {
                  color: activeFilter === filter.id ? '#FFFFFF' : themeColors.subtext,
                },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.subtext }]}>
            Loading bookings...
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={themeColors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // List
  listContent: {
    padding: 16,
    paddingTop: 8,
  },

  // Booking Card
  bookingCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  bookingRef: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // Route
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  routeArrow: {
    marginHorizontal: 8,
  },

  // Details
  detailsSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Footer Loader
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});