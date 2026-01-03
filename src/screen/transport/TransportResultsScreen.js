// screens/TransportResultsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'context/ThemeContext';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader } from 'component/SHARED';
import { formatCurrency } from 'CONSTANT/formatCurrency';

// ============================================
// STEP INDICATOR COMPONENT
// ============================================
const StepIndicator = ({ currentStep, themeColors }) => {
  const steps = [
    { id: 1, label: 'Search', icon: 'search' },
    { id: 2, label: 'Select', icon: 'bus' },
    { id: 3, label: 'Seats', icon: 'grid' },
    { id: 4, label: 'Details', icon: 'person' },
    { id: 5, label: 'Payment', icon: 'card' },
  ];

  return (
    <View style={styles.stepContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* Step Circle */}
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor:
                    step.id <= currentStep
                      ? themeColors.primary
                      : themeColors.border,
                },
              ]}
            >
              {step.id < currentStep ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    { color: step.id === currentStep ? '#FFFFFF' : themeColors.subtext },
                  ]}
                >
                  {step.id}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                {
                  color:
                    step.id <= currentStep
                      ? themeColors.heading
                      : themeColors.subtext,
                  fontWeight: step.id === currentStep ? '700' : '500',
                },
              ]}
            >
              {step.label}
            </Text>
          </View>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <View
              style={[
                styles.stepConnector,
                {
                  backgroundColor:
                    step.id < currentStep
                      ? themeColors.primary
                      : themeColors.border,
                },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

// ============================================
// SEARCH SUMMARY COMPONENT
// ============================================
const SearchSummary = ({ searchParams, resultCount, onModify, themeColors }) => (
  <View style={[styles.summaryCard, { backgroundColor: `${themeColors.primary}15` }]}>
    <View style={styles.summaryLeft}>
      <View style={styles.summaryRoute}>
        <Text style={[styles.summaryCity, { color: themeColors.heading }]}>
          {searchParams.departure}
        </Text>
        <Ionicons name="arrow-forward" size={18} color={themeColors.primary} />
        <Text style={[styles.summaryCity, { color: themeColors.heading }]}>
          {searchParams.destination}
        </Text>
      </View>
      <View style={styles.summaryDetails}>
        <View style={styles.summaryDetailItem}>
          <Ionicons name="calendar-outline" size={14} color={themeColors.subtext} />
          <Text style={[styles.summaryDetailText, { color: themeColors.subtext }]}>
            {searchParams.travelDate}
          </Text>
        </View>
        <View style={styles.summaryDetailItem}>
          <Ionicons name="bus-outline" size={14} color={themeColors.subtext} />
          <Text style={[styles.summaryDetailText, { color: themeColors.subtext }]}>
            {resultCount} {resultCount === 1 ? 'trip' : 'trips'} found
          </Text>
        </View>
      </View>
    </View>
    <TouchableOpacity
      style={[styles.modifyButton, { backgroundColor: themeColors.card }]}
      onPress={onModify}
    >
      <Ionicons name="pencil" size={16} color={themeColors.primary} />
    </TouchableOpacity>
  </View>
);

// ============================================
// TRIP CARD COMPONENT
// ============================================
const TripCard = ({ trip, onSelect, themeColors }) => {
  const departureTime = trip.departure_time.split(' ')[1]; // Extract time
  const availableSeatsCount = trip.available_seats.length;

  return (
    <TouchableOpacity
      style={[styles.tripCard, { backgroundColor: themeColors.card }]}
      onPress={() => onSelect(trip)}
      activeOpacity={0.7}
    >
      {/* Provider Header */}
      <View style={styles.tripHeader}>
        <View style={styles.providerInfo}>
          {trip.provider.logo ? (
            <Image
              source={{ uri: trip.provider.logo }}
              style={styles.providerLogo}
            />
          ) : (
            <View style={[styles.providerLogoPlaceholder, { backgroundColor: `${themeColors.primary}20` }]}>
              <Text style={[styles.providerLogoText, { color: themeColors.primary }]}>
                {trip.provider.short_name}
              </Text>
            </View>
          )}
          <View style={styles.providerDetails}>
            <Text style={[styles.providerName, { color: themeColors.heading }]}>
              {trip.provider.name}
            </Text>
            <Text style={[styles.vehicleType, { color: themeColors.subtext }]}>
              {trip.vehicle}
            </Text>
          </View>
        </View>
        <View style={[styles.fareTag, { backgroundColor: `${themeColors.primary}15` }]}>
          <Text style={[styles.fareAmount, { color: themeColors.primary }]}>
            {formatCurrency(trip.fare, 'NGN')}
          </Text>
        </View>
      </View>

      {/* Trip Timeline */}
      <View style={styles.timeline}>
        <View style={styles.timelinePoint}>
          <View style={[styles.timelineDot, { backgroundColor: themeColors.primary }]} />
          <View style={styles.timelineInfo}>
            <Text style={[styles.timelineTime, { color: themeColors.heading }]}>
              {departureTime}
            </Text>
            <Text style={[styles.timelineTerminal, { color: themeColors.subtext }]}>
              {trip.departure_terminal}
            </Text>
            <Text style={[styles.timelineAddress, { color: themeColors.subtext }]}>
              {trip.departure_address}
            </Text>
          </View>
        </View>

        <View style={[styles.timelineLine, { backgroundColor: themeColors.border }]} />

        <View style={styles.timelinePoint}>
          <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
          <View style={styles.timelineInfo}>
            <Text style={[styles.timelineTerminal, { color: themeColors.subtext }]}>
              {trip.destination_terminal}
            </Text>
            <Text style={[styles.timelineAddress, { color: themeColors.subtext }]}>
              {trip.destination_address}
            </Text>
          </View>
        </View>
      </View>

      {/* Trip Details Footer */}
      <View style={styles.tripFooter}>
        <View style={styles.tripDetailBadge}>
          <Ionicons name="calendar-outline" size={14} color={themeColors.subtext} />
          <Text style={[styles.tripDetailText, { color: themeColors.subtext }]}>
            {trip.trip_date}
          </Text>
        </View>
        <View style={styles.tripDetailBadge}>
          <Ionicons name="receipt-outline" size={14} color={themeColors.subtext} />
          <Text style={[styles.tripDetailText, { color: themeColors.subtext }]}>
            Trip #{trip.trip_no}
          </Text>
        </View>
        <View style={[
          styles.seatsBadge,
          {
            backgroundColor: availableSeatsCount > 5
              ? '#10B98120'
              : availableSeatsCount > 0
              ? '#F59E0B20'
              : '#FF3B3020'
          }
        ]}>
          <Ionicons
            name="people"
            size={14}
            color={availableSeatsCount > 5 ? '#10B981' : availableSeatsCount > 0 ? '#F59E0B' : '#FF3B30'}
          />
          <Text style={[
            styles.seatsText,
            {
              color: availableSeatsCount > 5 ? '#10B981' : availableSeatsCount > 0 ? '#F59E0B' : '#FF3B30'
            }
          ]}>
            {availableSeatsCount} seat{availableSeatsCount !== 1 ? 's' : ''} left
          </Text>
        </View>
      </View>

      {/* Select Button */}
      <TouchableOpacity
        style={[styles.selectButton, { backgroundColor: themeColors.primary }]}
        onPress={() => onSelect(trip)}
      >
        <Text style={styles.selectButtonText}>Select Trip</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ============================================
// FILTER BAR COMPONENT
// ============================================
const FilterBar = ({ onSortChange, activeSort, themeColors }) => {
  const sortOptions = [
    { id: 'price_low', label: 'Lowest Price', icon: 'arrow-down' },
    { id: 'price_high', label: 'Highest Price', icon: 'arrow-up' },
    { id: 'departure', label: 'Departure Time', icon: 'time' },
    { id: 'seats', label: 'Available Seats', icon: 'people' },
  ];

  return (
    <View style={styles.filterBar}>
      <Text style={[styles.filterTitle, { color: themeColors.heading }]}>
        Sort By
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterOptions}
      >
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterOption,
              activeSort === option.id && { backgroundColor: themeColors.primary },
              activeSort !== option.id && { backgroundColor: themeColors.card, borderWidth: 1, borderColor: themeColors.border },
            ]}
            onPress={() => onSortChange(option.id)}
          >
            <Ionicons
              name={option.icon}
              size={14}
              color={activeSort === option.id ? '#FFFFFF' : themeColors.subtext}
            />
            <Text
              style={[
                styles.filterOptionText,
                { color: activeSort === option.id ? '#FFFFFF' : themeColors.subtext },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ============================================
// MAIN SCREEN
// ============================================
export default function TransportResultsScreen({ route, navigation }) {
  const { trips, searchParams } = route.params;
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [sortedTrips, setSortedTrips] = useState(trips);
  const [activeSort, setActiveSort] = useState('departure');

  // Handle sorting
  const handleSort = (sortType) => {
    setActiveSort(sortType);
    let sorted = [...trips];

    switch (sortType) {
      case 'price_low':
        sorted.sort((a, b) => a.fare - b.fare);
        break;
      case 'price_high':
        sorted.sort((a, b) => b.fare - a.fare);
        break;
      case 'departure':
        sorted.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
        break;
      case 'seats':
        sorted.sort((a, b) => b.available_seats.length - a.available_seats.length);
        break;
      default:
        break;
    }

    setSortedTrips(sorted);
  };

  // Handle trip selection
  const handleSelectTrip = (trip) => {
    navigation.navigate('PassengerDetails', {
      trip,
      searchParams,
    });
  };

  // Modify search
  const handleModifySearch = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <ScreenHeader
        title="Available Trips"
        onBackPress={() => navigation.goBack()}
      />

      {/* Step Indicator */}
      <StepIndicator currentStep={2} themeColors={themeColors} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Summary */}
        <SearchSummary
          searchParams={searchParams}
          resultCount={sortedTrips.length}
          onModify={handleModifySearch}
          themeColors={themeColors}
        />

        {/* Filter Bar */}
        <FilterBar
          onSortChange={handleSort}
          activeSort={activeSort}
          themeColors={themeColors}
        />

        {/* Results Count */}
        <Text style={[styles.resultsCount, { color: themeColors.subheading }]}>
          {sortedTrips.length} {sortedTrips.length === 1 ? 'trip' : 'trips'} available
        </Text>

        {/* Trip Cards */}
        {sortedTrips.map((trip) => (
          <TripCard
            key={trip.trip_id}
            trip={trip}
            onSelect={handleSelectTrip}
            themeColors={themeColors}
          />
        ))}

        {/* Empty State */}
        {sortedTrips.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
            <Ionicons name="bus-outline" size={64} color={themeColors.subtext} />
            <Text style={[styles.emptyTitle, { color: themeColors.heading }]}>
              No Trips Found
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.subtext }]}>
              Try adjusting your search criteria
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: themeColors.primary }]}
              onPress={handleModifySearch}
            >
              <Text style={styles.emptyButtonText}>Modify Search</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Step Indicator
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepConnector: {
    height: 2,
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 26,
  },

  // Search Summary
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  summaryCity: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryDetailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modifyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filter Bar
  filterBar: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 16,
    marginBottom: 12,
  },
  filterOptions: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Results Count
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 12,
  },

  // Trip Card
  tripCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // Provider Header
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  providerLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerLogoText: {
    fontSize: 14,
    fontWeight: '700',
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 12,
    fontWeight: '500',
  },
  fareTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  fareAmount: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Timeline
  timeline: {
    marginBottom: 16,
  },
  timelinePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  timelineInfo: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  timelineTerminal: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineAddress: {
    fontSize: 12,
    lineHeight: 16,
  },
  timelineLine: {
    width: 2,
    height: 24,
    marginLeft: 5,
    marginBottom: 8,
  },

  // Trip Footer
  tripFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tripDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripDetailText: {
    fontSize: 11,
    fontWeight: '500',
  },
  seatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  seatsText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Select Button
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty State
  emptyState: {
    marginHorizontal: 16,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});