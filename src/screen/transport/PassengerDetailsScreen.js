// screens/PassengerDetailsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
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
    { id: 3, label: 'Details', icon: 'person' },
    { id: 4, label: 'Seats', icon: 'grid' },
    { id: 5, label: 'Payment', icon: 'card' },
  ];

  return (
    <View style={styles.stepContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
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
// PASSENGER FORM COMPONENT
// ============================================
const PassengerForm = ({ 
  passengerNumber, 
  data, 
  onChange, 
  onRemove, 
  canRemove,
  themeColors 
}) => {
  const [isExpanded, setIsExpanded] = useState(passengerNumber === 1);

  return (
    <View style={[styles.passengerCard, { backgroundColor: themeColors.card }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.passengerHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.passengerHeaderLeft}>
          <View style={[styles.passengerBadge, { backgroundColor: `${themeColors.primary}20` }]}>
            <Ionicons name="person" size={20} color={themeColors.primary} />
          </View>
          <View>
            <Text style={[styles.passengerTitle, { color: themeColors.heading }]}>
              Passenger {passengerNumber}
            </Text>
            {data.fullName && (
              <Text style={[styles.passengerName, { color: themeColors.subtext }]}>
                {data.fullName}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.passengerHeaderRight}>
          {canRemove && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={onRemove}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={themeColors.subtext}
          />
        </View>
      </TouchableOpacity>

      {/* Form Fields */}
      {isExpanded && (
        <View style={styles.formFields}>
          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.titleButtons}>
              {['Mr', 'Mrs', 'Miss', 'Dr'].map((title) => (
                <TouchableOpacity
                  key={title}
                  style={[
                    styles.titleButton,
                    data.title === title && { backgroundColor: themeColors.primary },
                    data.title !== title && { 
                      backgroundColor: themeColors.background,
                      borderWidth: 1,
                      borderColor: themeColors.border 
                    },
                  ]}
                  onPress={() => onChange('title', title)}
                >
                  <Text
                    style={[
                      styles.titleButtonText,
                      { color: data.title === title ? '#FFFFFF' : themeColors.subtext },
                    ]}
                  >
                    {title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.heading 
                }
              ]}
              placeholder="e.g. John Doe"
              placeholderTextColor={themeColors.subtext}
              value={data.fullName}
              onChangeText={(text) => onChange('fullName', text)}
            />
          </View>

          {/* Age */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
              Age <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.heading 
                }
              ]}
              placeholder="e.g. 32"
              placeholderTextColor={themeColors.subtext}
              keyboardType="numeric"
              value={data.age}
              onChangeText={(text) => onChange('age', text)}
              maxLength={3}
            />
          </View>

          {/* Gender */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
              Gender <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.genderButtons}>
              {['Male', 'Female'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    data.gender === gender && { backgroundColor: themeColors.primary },
                    data.gender !== gender && { 
                      backgroundColor: themeColors.background,
                      borderWidth: 1,
                      borderColor: themeColors.border 
                    },
                  ]}
                  onPress={() => onChange('gender', gender)}
                >
                  <Ionicons
                    name={gender === 'Male' ? 'male' : 'female'}
                    size={20}
                    color={data.gender === gender ? '#FFFFFF' : themeColors.subtext}
                  />
                  <Text
                    style={[
                      styles.genderButtonText,
                      { color: data.gender === gender ? '#FFFFFF' : themeColors.subtext },
                    ]}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.heading 
                }
              ]}
              placeholder="e.g. 08012345678"
              placeholderTextColor={themeColors.subtext}
              keyboardType="phone-pad"
              value={data.phone}
              onChangeText={(text) => onChange('phone', text)}
              maxLength={11}
            />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
              Email Address
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.heading 
                }
              ]}
              placeholder="e.g. john@example.com"
              placeholderTextColor={themeColors.subtext}
              keyboardType="email-address"
              autoCapitalize="none"
              value={data.email}
              onChangeText={(text) => onChange('email', text)}
            />
          </View>

          {/* Emergency Contact Section */}
          <View style={[styles.emergencySection, { backgroundColor: `${themeColors.primary}10` }]}>
            <View style={styles.emergencySectionHeader}>
              <Ionicons name="medkit" size={20} color={themeColors.primary} />
              <Text style={[styles.emergencySectionTitle, { color: themeColors.heading }]}>
                Emergency Contact
              </Text>
            </View>

            {/* Next of Kin Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.border,
                    color: themeColors.heading 
                  }
                ]}
                placeholder="e.g. Jane Doe"
                placeholderTextColor={themeColors.subtext}
                value={data.nextOfKin}
                onChangeText={(text) => onChange('nextOfKin', text)}
              />
            </View>

            {/* Next of Kin Phone */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
                Phone Number <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.border,
                    color: themeColors.heading 
                  }
                ]}
                placeholder="e.g. 08012345678"
                placeholderTextColor={themeColors.subtext}
                keyboardType="phone-pad"
                value={data.nextOfKinPhone}
                onChangeText={(text) => onChange('nextOfKinPhone', text)}
                maxLength={11}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ============================================
// MAIN SCREEN
// ============================================
export default function PassengerDetailsScreen({ route, navigation }) {
  const { trip, searchParams } = route.params;
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [passengers, setPassengers] = useState([
    {
      id: 1,
      title: '',
      fullName: '',
      age: '',
      gender: '',
      phone: '',
      email: '',
      nextOfKin: '',
      nextOfKinPhone: '',
    },
  ]);

  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Handle passenger data change
  const handlePassengerChange = (id, field, value) => {
    setPassengers(passengers.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Add passenger
  const handleAddPassenger = () => {
    if (passengers.length >= 4) {
      Alert.alert('Maximum Reached', 'You can add up to 4 passengers per booking');
      return;
    }

    const newPassenger = {
      id: passengers.length + 1,
      title: '',
      fullName: '',
      age: '',
      gender: '',
      phone: '',
      email: '',
      nextOfKin: '',
      nextOfKinPhone: '',
    };

    setPassengers([...passengers, newPassenger]);
  };

  // Remove passenger
  const handleRemovePassenger = (id) => {
    if (passengers.length === 1) {
      Alert.alert('Error', 'At least one passenger is required');
      return;
    }

    Alert.alert(
      'Remove Passenger',
      'Are you sure you want to remove this passenger?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setPassengers(passengers.filter(p => p.id !== id)),
        },
      ]
    );
  };

  // Validate form
  const validateForm = () => {
    // Check if terms agreed
    if (!agreeToTerms) {
      Alert.alert('Terms Required', 'Please agree to the terms and conditions');
      return false;
    }

    // Validate each passenger
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      
      if (!p.title || !p.fullName || !p.age || !p.gender || !p.phone || !p.nextOfKin || !p.nextOfKinPhone) {
        Alert.alert('Incomplete Information', `Please fill all required fields for Passenger ${i + 1}`);
        return false;
      }

      // Validate phone numbers
      if (!/^0[789]\d{9}$/.test(p.phone)) {
        Alert.alert('Invalid Phone', `Invalid phone number for Passenger ${i + 1}`);
        return false;
      }

      if (!/^0[789]\d{9}$/.test(p.nextOfKinPhone)) {
        Alert.alert('Invalid Phone', `Invalid emergency contact number for Passenger ${i + 1}`);
        return false;
      }

      // Validate age
      const age = parseInt(p.age);
      if (isNaN(age) || age < 1 || age > 120) {
        Alert.alert('Invalid Age', `Invalid age for Passenger ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  // Continue to seat selection
  const handleContinue = () => {
    if (!validateForm()) return;

    navigation.navigate('SeatSelection', {
      trip,
      searchParams,
      passengers,
      passengerCount: passengers.length,
    });
  };

  // View terms
  const handleViewTerms = () => {
    // Navigate to terms screen or open URL
    Alert.alert(
      'Terms & Conditions',
      'Terms will be hosted on GitHub Pages.\n\nURL: https://yourorg.github.io/transport-terms',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'View Online', 
          onPress: () => {
            // Open in browser - Linking.openURL('https://yourorg.github.io/transport-terms')
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <ScreenHeader
        title="Passenger Details"
        onBackPress={() => navigation.goBack()}
      />

      {/* Step Indicator */}
      <StepIndicator currentStep={3} themeColors={themeColors} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: `${themeColors.primary}15` }]}>
          <Ionicons name="information-circle" size={24} color={themeColors.primary} />
          <Text style={[styles.infoText, { color: themeColors.subheading }]}>
            Add passenger details. You can add up to 4 passengers. Each passenger will be assigned a seat.
          </Text>
        </View>

        {/* Passenger Forms */}
        {passengers.map((passenger) => (
          <PassengerForm
            key={passenger.id}
            passengerNumber={passenger.id}
            data={passenger}
            onChange={(field, value) => handlePassengerChange(passenger.id, field, value)}
            onRemove={() => handleRemovePassenger(passenger.id)}
            canRemove={passengers.length > 1}
            themeColors={themeColors}
          />
        ))}

        {/* Add Passenger Button */}
        {passengers.length < 4 && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: themeColors.card }]}
            onPress={handleAddPassenger}
          >
            <Ionicons name="add-circle" size={24} color={themeColors.primary} />
            <Text style={[styles.addButtonText, { color: themeColors.primary }]}>
              Add Another Passenger
            </Text>
          </TouchableOpacity>
        )}

        {/* Terms & Conditions */}
        <View style={[styles.termsCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.termsRow}>
            <Switch
              value={agreeToTerms}
              onValueChange={setAgreeToTerms}
              trackColor={{ false: themeColors.border, true: `${themeColors.primary}50` }}
              thumbColor={agreeToTerms ? themeColors.primary : themeColors.subtext}
            />
            <View style={styles.termsTextContainer}>
              <Text style={[styles.termsText, { color: themeColors.subheading }]}>
                I agree to the{' '}
                <Text
                  style={[styles.termsLink, { color: themeColors.primary }]}
                  onPress={handleViewTerms}
                >
                  Terms and Conditions
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Trip Summary */}
        <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.summaryTitle, { color: themeColors.heading }]}>
            Booking Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
              Route
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {searchParams.departure} → {searchParams.destination}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
              Provider
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {trip.provider.name}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
              Passengers
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {passengers.length}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
              Fare per Seat
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.primary }]}>
              {formatCurrency(trip.fare, 'NGN')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: themeColors.card }]}>
        <View style={styles.bottomBarContent}>
          <View style={styles.bottomBarLeft}>
            <Text style={[styles.bottomBarLabel, { color: themeColors.subtext }]}>
              {passengers.length} passenger{passengers.length !== 1 ? 's' : ''}
            </Text>
            <Text style={[styles.bottomBarAmount, { color: themeColors.heading }]}>
              Next: Select Seats
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: themeColors.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: 120,
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

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  // Passenger Card
  passengerCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  passengerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  passengerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  passengerName: {
    fontSize: 12,
    fontWeight: '500',
  },
  passengerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  removeButton: {
    padding: 4,
  },

  // Form Fields
  formFields: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
  },

  // Title Buttons
  titleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  titleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  titleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Gender Buttons
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Emergency Section
  emergencySection: {
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  emergencySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  emergencySectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Terms Card
  termsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 13,
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Summary Card
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  bottomBarLeft: {
    flex: 1,
  },
  bottomBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  bottomBarAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});