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
// import flightService from 'AuthFunction/transport/flightServices';
import bookingService from 'AuthFunction/bookingService';
import PassengerSearchFirst from 'component/transport/TransportSearchFirst';


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

function PassengerForm({
  passengerNumber, data, onChange, onRemove, canRemove, themeColors, isFlightBooking = false // ← NEW PROP
}) {
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
              {isFlightBooking ? 'Traveler' : 'Passenger'} {passengerNumber}
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
            color={themeColors.subtext} />
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
              placeholder={isFlightBooking ? "e.g. JOHN DOE (as on passport)" : "e.g. John Doe"}
              placeholderTextColor={themeColors.subtext}
              value={data.fullName}
              onChangeText={(text) => onChange('fullName', text)}
              autoCapitalize={isFlightBooking ? "characters" : "words"} />
            {isFlightBooking && (
              <Text style={[styles.fieldHint, { color: themeColors.subtext }]}>
                Must match passport exactly (UPPERCASE)
              </Text>
            )}
          </View>

          {/* Age (Transport) OR Date of Birth (Flight) */}
          {!isFlightBooking ? (
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
                maxLength={3} />
            </View>
          ) : (
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
                Date of Birth <Text style={styles.required}>*</Text>
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
                placeholder="YYYY-MM-DD (e.g. 1990-01-15)"
                placeholderTextColor={themeColors.subtext}
                value={data.dateOfBirth}
                onChangeText={(text) => onChange('dateOfBirth', text)}
                maxLength={10} />
              <Text style={[styles.fieldHint, { color: themeColors.subtext }]}>
                Format: YYYY-MM-DD (as on passport)
              </Text>
            </View>
          )}

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
                    color={data.gender === gender ? '#FFFFFF' : themeColors.subtext} />
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
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
                Phone Number <Text style={styles.required}>*</Text>
              </Text>
              {data.phone && data.phone.length === 11 && (
                <TouchableOpacity
                  style={[styles.searchButton, { backgroundColor: `${themeColors.primary}20` }]}
                  onPress={() => onChange('searchPhone', true)}
                >
                  <Ionicons name="search" size={14} color={themeColors.primary} />
                  <Text style={[styles.searchButtonText, { color: themeColors.primary }]}>
                    Auto-fill
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
              maxLength={11} />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
              Email Address {isFlightBooking && <Text style={styles.required}>*</Text>}
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
              onChangeText={(text) => onChange('email', text)} />
          </View>

          {/* FLIGHT-ONLY FIELDS */}
          {isFlightBooking && (
            <>
              {/* Passport Number */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
                  Passport Number <Text style={styles.required}>*</Text>
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
                  placeholder="e.g. A12345678"
                  placeholderTextColor={themeColors.subtext}
                  value={data.passportNumber}
                  onChangeText={(text) => onChange('passportNumber', text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={9} />
              </View>

              {/* Passport Expiry */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
                  Passport Expiry Date <Text style={styles.required}>*</Text>
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
                  placeholder="YYYY-MM-DD (e.g. 2030-12-31)"
                  placeholderTextColor={themeColors.subtext}
                  value={data.passportExpiry}
                  onChangeText={(text) => onChange('passportExpiry', text)}
                  maxLength={10} />
                <Text style={[styles.fieldHint, { color: themeColors.subtext }]}>
                  Must be valid for at least 6 months
                </Text>
              </View>

              {/* Nationality */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
                  Nationality <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.nationalityButtons}>
                  {[
                    { code: 'NG', name: 'Nigerian', flag: '🇳🇬' },
                    { code: 'US', name: 'American', flag: '🇺🇸' },
                    { code: 'GB', name: 'British', flag: '🇬🇧' },
                    { code: 'OTHER', name: 'Other', flag: '🌍' },
                  ].map((nat) => (
                    <TouchableOpacity
                      key={nat.code}
                      style={[
                        styles.nationalityButton,
                        data.nationality === nat.code && { backgroundColor: themeColors.primary },
                        data.nationality !== nat.code && {
                          backgroundColor: themeColors.background,
                          borderWidth: 1,
                          borderColor: themeColors.border
                        },
                      ]}
                      onPress={() => onChange('nationality', nat.code)}
                    >
                      <Text style={styles.nationalityFlag}>{nat.flag}</Text>
                      <Text
                        style={[
                          styles.nationalityText,
                          { color: data.nationality === nat.code ? '#FFFFFF' : themeColors.subtext },
                        ]}
                      >
                        {nat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Emergency Contact Section (Transport Only) */}
          {!isFlightBooking && (
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
                  onChangeText={(text) => onChange('nextOfKin', text)} />
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
                  maxLength={11} />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================
// MAIN SCREEN
// ============================================
export default function PassengerDetailsScreen({ route, navigation }) {
  const { trip, flight, searchParams, bookingType = 'transport' } = route.params;
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const isFlightBooking = bookingType === 'flight';
  const bookingData = isFlightBooking ? flight : trip;

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
      // Flight-specific fields
      dateOfBirth: '',
      passportNumber: '',
      passportExpiry: '',
      nationality: 'NG',
      // Search flags
      isSearched: false,
      profileFound: false,
    },
  ]);

  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Handle passenger data change
  const handlePassengerChange = (id, field, value) => {
    // Handle phone search trigger
    if (field === 'searchPhone' && value === true) {
      searchPassengerByPhone(id);
      return;
    }

    // Auto-format phone numbers
    if (field === 'phone' || field === 'nextOfKinPhone') {
      // Remove non-numeric characters
      let cleaned = value.replace(/\D/g, '');
      
      // If starts with 234, convert to 0 format
      if (cleaned.startsWith('234')) {
        cleaned = '0' + cleaned.substring(3);
      }
      
      // Limit to 11 digits
      cleaned = cleaned.substring(0, 11);
      
      value = cleaned;
    }

    setPassengers(passengers.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Search passenger by phone
  const searchPassengerByPhone = async (passengerId) => {
    const passenger = passengers.find(p => p.id === passengerId);
    
    if (!passenger || !passenger.phone || passenger.phone.length !== 11) {
      return;
    }

    try {
      const response = await bookingService.searchPassengerByPhone(passenger.phone);
      
      if (response && response.success) {
        const profile = response.data;
        
        // Auto-fill passenger data
        setPassengers(passengers.map(p => 
          p.id === passengerId ? {
            ...p,
            title: profile.title || p.title,
            fullName: profile.fullName || p.fullName,
            age: profile.age?.toString() || p.age,
            gender: profile.gender || p.gender,
            email: profile.email || p.email,
            nextOfKin: profile.nextOfKin || p.nextOfKin,
            nextOfKinPhone: profile.nextOfKinPhone || p.nextOfKinPhone,
          } : p
        ));

        Alert.alert('Success', 'Passenger details loaded successfully');
      }
    } catch (error) {
      // Silently fail - profile not found is expected
      console.log('No saved profile found for:', passenger.phone);
    }
  };

  // Add passenger
  const handleAddPassenger = () => {
    if (passengers.length >= 4) {
      Alert.alert('Maximum Reached', 'You can only add up to 4 passengers');
      return;
    }
  
    const newPassenger = {
      id: (passengers.length + 1).toString(),
      fullName: '',
      phone: '',
      email: '',
      age: '',
      gender: '',
      title: 'Mr',
      nextOfKin: '',
      nextOfKinPhone: '',
      // Flight fields
      dateOfBirth: '',
      passportNumber: '',
      passportExpiry: '',
      nationality: 'NG',
      // Search flags
      isSearched: false,     
      profileFound: false,   
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
      
      // Common fields (both transport & flight)
      if (!p.title || !p.fullName || !p.gender || !p.phone) {
        Alert.alert('Incomplete Information', `Please fill all required fields for ${isFlightBooking ? 'Traveler' : 'Passenger'} ${i + 1}`);
        return false;
      }
  
      // Transport-specific validation
      if (!isFlightBooking) {
        if (!p.age || !p.nextOfKin || !p.nextOfKinPhone) {
          Alert.alert('Incomplete Information', `Please fill all required fields for Passenger ${i + 1}`);
          return false;
        }
  
        // Validate age
        const age = parseInt(p.age);
        if (isNaN(age) || age < 1 || age > 120) {
          Alert.alert('Invalid Age', `Invalid age for Passenger ${i + 1}`);
          return false;
        }
  
        // Validate emergency contact phone
        const cleanNextOfKinPhone = p.nextOfKinPhone.replace(/[\s\-\(\)]/g, '');
        const phonePattern = /^(0[789]\d{9}|234[789]\d{9}|\+234[789]\d{9})$/;
        
        if (!phonePattern.test(cleanNextOfKinPhone)) {
          Alert.alert(
            'Invalid Phone', 
            `Invalid emergency contact number for Passenger ${i + 1}.\n\nValid formats:\n• 08012345678\n• 07012345678\n• 09012345678`
          );
          return false;
        }
      }
  
      // Flight-specific validation
      if (isFlightBooking) {
        if (!p.email || !p.dateOfBirth || !p.passportNumber || !p.passportExpiry || !p.nationality) {
          Alert.alert('Incomplete Information', `Please fill all required fields for Traveler ${i + 1}`);
          return false;
        }
  
        // Validate date of birth format (YYYY-MM-DD)
        const dobPattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!dobPattern.test(p.dateOfBirth)) {
          Alert.alert('Invalid Date', `Date of birth must be in YYYY-MM-DD format for Traveler ${i + 1}`);
          return false;
        }
  
        // Validate DOB is in the past
        const dob = new Date(p.dateOfBirth);
        if (dob >= new Date()) {
          Alert.alert('Invalid Date', `Date of birth must be in the past for Traveler ${i + 1}`);
          return false;
        }
  
        // Validate passport expiry format
        if (!dobPattern.test(p.passportExpiry)) {
          Alert.alert('Invalid Date', `Passport expiry must be in YYYY-MM-DD format for Traveler ${i + 1}`);
          return false;
        }
  
        // Validate passport expiry is in the future (at least 6 months)
        const expiry = new Date(p.passportExpiry);
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        
        if (expiry < sixMonthsFromNow) {
          Alert.alert('Invalid Passport', `Passport must be valid for at least 6 months for Traveler ${i + 1}`);
          return false;
        }
  
        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(p.email)) {
          Alert.alert('Invalid Email', `Please enter a valid email address for Traveler ${i + 1}`);
          return false;
        }
      }
  
      // Validate phone number (both transport & flight)
      const cleanPhone = p.phone.replace(/[\s\-\(\)]/g, '');
      const phonePattern = /^(0[789]\d{9}|234[789]\d{9}|\+234[789]\d{9})$/;
      
      if (!phonePattern.test(cleanPhone)) {
        Alert.alert(
          'Invalid Phone', 
          `Invalid phone number for ${isFlightBooking ? 'Traveler' : 'Passenger'} ${i + 1}.\n\nValid formats:\n• 08012345678\n• 07012345678\n• 09012345678`
        );
        return false;
      }
    }
  
    return true;
  };


  // Continue to seat selection
  const handleContinue = () => {
    if (!validateForm()) return;
  
    if (isFlightBooking) {
      // Flight booking flow: Details → Seats → Payment
      navigation.navigate('FlightSeatSelection', {
        flight: bookingData,
        searchParams,
        passengers,
      });
    } else {
      // Transport booking flow: Details → Seats → Payment
      navigation.navigate('SeatSelection', {
        trip: bookingData,
        searchParams,
        passengers,
        passengerCount: passengers.length,
      });
    }
  };

  
    /**
   * Called when existing profile is found
   */
  const handleProfileFound = (profileData) => {
    setPassengers((prev) =>
      prev.map((p) =>
        p.id === profileData.id
          ? {
              ...p,
              ...profileData,
              isSearched: true,
              profileFound: true,
            }
          : p
      )
    );
  };
  
  /**
   * Called when new user (no profile found)
   */
  const handleNewUser = (userData) => {
    setPassengers((prev) =>
      prev.map((p) =>
        p.id === userData.id
          ? {
              ...p,
              phone: userData.phone,
              isSearched: true,
              profileFound: false,
            }
          : p
      )
    );
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
  title={isFlightBooking ? "Traveler Details" : "Passenger Details"}
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
  {isFlightBooking 
    ? "Enter traveler details exactly as shown on passport. You can add up to 4 travelers."
    : "Add passenger details. You can add up to 4 passengers. Each passenger will be assigned a seat."
  }
</Text>
        </View>


        {/* Passenger Forms */}      
 {passengers.map((passenger, index) => (
   <View 
     key={passenger.id} 
     style={[styles.passengerCard, { backgroundColor: themeColors.card }]}
   >
     {/* Passenger Header */}
     <View style={styles.passengerHeader}>
       <View style={styles.passengerHeaderLeft}>
        <View style={[styles.passengerBadge, { backgroundColor: themeColors.primary }]}>
           <Text style={styles.passengerBadgeText}>{index + 1}</Text>
         </View>
         <Text style={[styles.passengerTitle, { color: themeColors.heading }]}>
           Passenger {index + 1}
         </Text>
       </View>
      
       {passengers.length > 1 && (
         <TouchableOpacity
           style={styles.removeButton}
           onPress={() => handleRemovePassenger(passenger.id)}
         >
           <Ionicons name="trash-outline" size={20} color="#EF4444" />
         </TouchableOpacity>
       )}
     </View>
     {/* Phone Search (if not searched) */}     {!passenger.isSearched && (       <PassengerSearchFirst         passengerId={passenger.id}         onProfileFound={handleProfileFound}
        onNewUser={handleNewUser}
         initialPhone={passenger.phone}
      />
   )}
     {/* Success Banner (if found) */}
    {passenger.isSearched && passenger.profileFound && (       <View style={[styles.successBanner, { backgroundColor: '#10B98120' }]}>
         <Ionicons name="checkmark-circle" size={20} color="#10B981" />
      <Text style={[styles.successText, { color: '#10B981' }]}>
           Welcome back! Your details have been auto-filled.
         </Text>
       </View>
     )}

    {/* Full Form (if searched) */}
    {passenger.isSearched && (
       <PassengerForm
         passengerNumber={passenger.id}
         data={passenger}
        onChange={(field, value) => handlePassengerChange(passenger.id, field, value)}
         onRemove={() => handleRemovePassenger(passenger.id)}
         canRemove={passengers.length > 1}
         themeColors={themeColors}
         isFlightBooking={isFlightBooking} 
      />
    )}
  </View>
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
        {!isFlightBooking && (
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
      )}
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
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  searchButtonText: {
    fontSize: 11,
    fontWeight: '700',
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
  // Flight-specific styles
fieldHint: {
  fontSize: 11,
  marginTop: 4,
  fontStyle: 'italic',
},
nationalityButtons: {
  gap: 8,
},
nationalityButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 10,
  gap: 10,
  marginBottom: 8,
},
nationalityFlag: {
  fontSize: 24,
},
nationalityText: {
  fontSize: 14,
  fontWeight: '600',
  flex: 1,
},
});




// // ============================================
// // STEP INDICATOR COMPONENT
// // ============================================
// const StepIndicator = ({ currentStep, themeColors }) => {
//   const steps = [
//     { id: 1, label: 'Search', icon: 'search' },
//     { id: 2, label: 'Select', icon: 'bus' },
//     { id: 3, label: 'Details', icon: 'person' },
//     { id: 4, label: 'Seats', icon: 'grid' },
//     { id: 5, label: 'Payment', icon: 'card' },
//   ];

//   return (
//     <View style={styles.stepContainer}>
//       {steps.map((step, index) => (
//         <React.Fragment key={step.id}>
//           <View style={styles.stepItem}>
//             <View
//               style={[
//                 styles.stepCircle,
//                 {
//                   backgroundColor:
//                     step.id <= currentStep
//                       ? themeColors.primary
//                       : themeColors.border,
//                 },
//               ]}
//             >
//               {step.id < currentStep ? (
//                 <Ionicons name="checkmark" size={16} color="#FFFFFF" />
//               ) : (
//                 <Text
//                   style={[
//                     styles.stepNumber,
//                     { color: step.id === currentStep ? '#FFFFFF' : themeColors.subtext },
//                   ]}
//                 >
//                   {step.id}
//                 </Text>
//               )}
//             </View>
//             <Text
//               style={[
//                 styles.stepLabel,
//                 {
//                   color:
//                     step.id <= currentStep
//                       ? themeColors.heading
//                       : themeColors.subtext,
//                   fontWeight: step.id === currentStep ? '700' : '500',
//                 },
//               ]}
//             >
//               {step.label}
//             </Text>
//           </View>
//           {index < steps.length - 1 && (
//             <View
//               style={[
//                 styles.stepConnector,
//                 {
//                   backgroundColor:
//                     step.id < currentStep
//                       ? themeColors.primary
//                       : themeColors.border,
//                 },
//               ]}
//             />
//           )}
//         </React.Fragment>
//       ))}
//     </View>
//   );
// };

// // ============================================
// // PASSENGER FORM COMPONENT
// // ============================================
// const PassengerForm = ({ 
//   passengerNumber, 
//   data, 
//   onChange, 
//   onRemove, 
//   canRemove,
//   themeColors 
// }) => {
//   const [isExpanded, setIsExpanded] = useState(passengerNumber === 1);

//   return (
//     <View style={[styles.passengerCard, { backgroundColor: themeColors.card }]}>
//       {/* Header */}
//       <TouchableOpacity
//         style={styles.passengerHeader}
//         onPress={() => setIsExpanded(!isExpanded)}
//         activeOpacity={0.7}
//       >
//         <View style={styles.passengerHeaderLeft}>
//           <View style={[styles.passengerBadge, { backgroundColor: `${themeColors.primary}20` }]}>
//             <Ionicons name="person" size={20} color={themeColors.primary} />
//           </View>
//           <View>
//             <Text style={[styles.passengerTitle, { color: themeColors.heading }]}>
//               Passenger {passengerNumber}
//             </Text>
//             {data.fullName && (
//               <Text style={[styles.passengerName, { color: themeColors.subtext }]}>
//                 {data.fullName}
//               </Text>
//             )}
//           </View>
//         </View>
//         <View style={styles.passengerHeaderRight}>
//           {canRemove && (
//             <TouchableOpacity
//               style={styles.removeButton}
//               onPress={onRemove}
//             >
//               <Ionicons name="trash-outline" size={20} color="#FF3B30" />
//             </TouchableOpacity>
//           )}
//           <Ionicons
//             name={isExpanded ? 'chevron-up' : 'chevron-down'}
//             size={20}
//             color={themeColors.subtext}
//           />
//         </View>
//       </TouchableOpacity>

//       {/* Form Fields */}
//       {isExpanded && (
//         <View style={styles.formFields}>
//           {/* Title */}
//           <View style={styles.fieldGroup}>
//             <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
//               Title <Text style={styles.required}>*</Text>
//             </Text>
//             <View style={styles.titleButtons}>
//               {['Mr', 'Mrs', 'Miss', 'Dr'].map((title) => (
//                 <TouchableOpacity
//                   key={title}
//                   style={[
//                     styles.titleButton,
//                     data.title === title && { backgroundColor: themeColors.primary },
//                     data.title !== title && { 
//                       backgroundColor: themeColors.background,
//                       borderWidth: 1,
//                       borderColor: themeColors.border 
//                     },
//                   ]}
//                   onPress={() => onChange('title', title)}
//                 >
//                   <Text
//                     style={[
//                       styles.titleButtonText,
//                       { color: data.title === title ? '#FFFFFF' : themeColors.subtext },
//                     ]}
//                   >
//                     {title}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>

//           {/* Full Name */}
//           <View style={styles.fieldGroup}>
//             <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
//               Full Name <Text style={styles.required}>*</Text>
//             </Text>
//             <TextInput
//               style={[
//                 styles.input,
//                 { 
//                   backgroundColor: themeColors.background,
//                   borderColor: themeColors.border,
//                   color: themeColors.heading 
//                 }
//               ]}
//               placeholder="e.g. John Doe"
//               placeholderTextColor={themeColors.subtext}
//               value={data.fullName}
//               onChangeText={(text) => onChange('fullName', text)}
//             />
//           </View>

//           {/* Age */}
//           <View style={styles.fieldGroup}>
//             <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
//               Age <Text style={styles.required}>*</Text>
//             </Text>
//             <TextInput
//               style={[
//                 styles.input,
//                 { 
//                   backgroundColor: themeColors.background,
//                   borderColor: themeColors.border,
//                   color: themeColors.heading 
//                 }
//               ]}
//               placeholder="e.g. 32"
//               placeholderTextColor={themeColors.subtext}
//               keyboardType="numeric"
//               value={data.age}
//               onChangeText={(text) => onChange('age', text)}
//               maxLength={3}
//             />
//           </View>

//           {/* Gender */}
//           <View style={styles.fieldGroup}>
//             <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
//               Gender <Text style={styles.required}>*</Text>
//             </Text>
//             <View style={styles.genderButtons}>
//               {['Male', 'Female'].map((gender) => (
//                 <TouchableOpacity
//                   key={gender}
//                   style={[
//                     styles.genderButton,
//                     data.gender === gender && { backgroundColor: themeColors.primary },
//                     data.gender !== gender && { 
//                       backgroundColor: themeColors.background,
//                       borderWidth: 1,
//                       borderColor: themeColors.border 
//                     },
//                   ]}
//                   onPress={() => onChange('gender', gender)}
//                 >
//                   <Ionicons
//                     name={gender === 'Male' ? 'male' : 'female'}
//                     size={20}
//                     color={data.gender === gender ? '#FFFFFF' : themeColors.subtext}
//                   />
//                   <Text
//                     style={[
//                       styles.genderButtonText,
//                       { color: data.gender === gender ? '#FFFFFF' : themeColors.subtext },
//                     ]}
//                   >
//                     {gender}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>

//           {/* Phone */}
//           <View style={styles.fieldGroup}>
//             <View style={styles.fieldLabelRow}>
//               <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
//                 Phone Number <Text style={styles.required}>*</Text>
//               </Text>
//               {data.phone && data.phone.length === 11 && (
//                 <TouchableOpacity
//                   style={[styles.searchButton, { backgroundColor: `${themeColors.primary}20` }]}
//                   onPress={() => onChange('searchPhone', true)}
//                 >
//                   <Ionicons name="search" size={14} color={themeColors.primary} />
//                   <Text style={[styles.searchButtonText, { color: themeColors.primary }]}>
//                     Auto-fill
//                   </Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//             <TextInput
//               style={[
//                 styles.input,
//                 { 
//                   backgroundColor: themeColors.background,
//                   borderColor: themeColors.border,
//                   color: themeColors.heading 
//                 }
//               ]}
//               placeholder="e.g. 08012345678"
//               placeholderTextColor={themeColors.subtext}
//               keyboardType="phone-pad"
//               value={data.phone}
//               onChangeText={(text) => onChange('phone', text)}
//               maxLength={11}
//             />
//           </View>

//           {/* Email */}
//           <View style={styles.fieldGroup}>
//             <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
//               Email Address
//             </Text>
//             <TextInput
//               style={[
//                 styles.input,
//                 { 
//                   backgroundColor: themeColors.background,
//                   borderColor: themeColors.border,
//                   color: themeColors.heading 
//                 }
//               ]}
//               placeholder="e.g. john@example.com"
//               placeholderTextColor={themeColors.subtext}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               value={data.email}
//               onChangeText={(text) => onChange('email', text)}
//             />
//           </View>

//           {/* Emergency Contact Section */}
//           <View style={[styles.emergencySection, { backgroundColor: `${themeColors.primary}10` }]}>
//             <View style={styles.emergencySectionHeader}>
//               <Ionicons name="medkit" size={20} color={themeColors.primary} />
//               <Text style={[styles.emergencySectionTitle, { color: themeColors.heading }]}>
//                 Emergency Contact
//               </Text>
//             </View>

//             {/* Next of Kin Name */}
//             <View style={styles.fieldGroup}>
//               <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
//                 Full Name <Text style={styles.required}>*</Text>
//               </Text>
//               <TextInput
//                 style={[
//                   styles.input,
//                   { 
//                     backgroundColor: themeColors.card,
//                     borderColor: themeColors.border,
//                     color: themeColors.heading 
//                   }
//                 ]}
//                 placeholder="e.g. Jane Doe"
//                 placeholderTextColor={themeColors.subtext}
//                 value={data.nextOfKin}
//                 onChangeText={(text) => onChange('nextOfKin', text)}
//               />
//             </View>

//             {/* Next of Kin Phone */}
//             <View style={styles.fieldGroup}>
//               <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
//                 Phone Number <Text style={styles.required}>*</Text>
//               </Text>
//               <TextInput
//                 style={[
//                   styles.input,
//                   { 
//                     backgroundColor: themeColors.card,
//                     borderColor: themeColors.border,
//                     color: themeColors.heading 
//                   }
//                 ]}
//                 placeholder="e.g. 08012345678"
//                 placeholderTextColor={themeColors.subtext}
//                 keyboardType="phone-pad"
//                 value={data.nextOfKinPhone}
//                 onChangeText={(text) => onChange('nextOfKinPhone', text)}
//                 maxLength={11}
//               />
//             </View>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// };

// // ============================================
// // MAIN SCREEN
// // ============================================
// export default function PassengerDetailsScreen({ route, navigation }) {
//   const { trip, searchParams } = route.params;
//   const { isDarkMode } = useTheme();
//   const themeColors = isDarkMode ? colors.dark : colors.light;

//   const [passengers, setPassengers] = useState([
//     {
//       id: 1,
//       title: '',
//       fullName: '',
//       age: '',
//       gender: '',
//       phone: '',
//       email: '',
//       nextOfKin: '',
//       nextOfKinPhone: '',
//       isSearched: false, 
//       profileFound: false, 
//     },
//   ]);

//   const [agreeToTerms, setAgreeToTerms] = useState(false);

//   /**
//    * Called when existing profile is found
//    */
//   const handleProfileFound = (profileData) => {
//     setPassengers((prev) =>
//       prev.map((p) =>
//         p.id === profileData.id
//           ? {
//               ...p,
//               ...profileData,
//               isSearched: true,
//               profileFound: true,
//             }
//           : p
//       )
//     );
//   };
  
//   /**
//    * Called when new user (no profile found)
//    */
//   const handleNewUser = (userData) => {
//     setPassengers((prev) =>
//       prev.map((p) =>
//         p.id === userData.id
//           ? {
//               ...p,
//               phone: userData.phone,
//               isSearched: true,
//               profileFound: false,
//             }
//           : p
//       )
//     );
//   };


//   // Handle passenger data change
//   const handlePassengerChange = (id, field, value) => {
//     // Handle phone search trigger
//     if (field === 'searchPhone' && value === true) {
//       searchPassengerByPhone(id);
//       return;
//     }

//     // Auto-format phone numbers
//     if (field === 'phone' || field === 'nextOfKinPhone') {
//       // Remove non-numeric characters
//       let cleaned = value.replace(/\D/g, '');
      
//       // If starts with 234, convert to 0 format
//       if (cleaned.startsWith('234')) {
//         cleaned = '0' + cleaned.substring(3);
//       }
      
//       // Limit to 11 digits
//       cleaned = cleaned.substring(0, 11);
      
//       value = cleaned;
//     }

//     setPassengers(passengers.map(p => 
//       p.id === id ? { ...p, [field]: value } : p
//     ));
//   };

//   // Search passenger by phone
//   const searchPassengerByPhone = async (passengerId) => {
//     const passenger = passengers.find(p => p.id === passengerId);
    
//     if (!passenger || !passenger.phone || passenger.phone.length !== 11) {
//       return;
//     }

//     try {
//       const response = await bookingService.searchPassengerByPhone(passenger.phone);
      
//       if (response && response.success) {
//         const profile = response.data;
        
//         // Auto-fill passenger data
//         setPassengers(passengers.map(p => 
//           p.id === passengerId ? {
//             ...p,
//             title: profile.title || p.title,
//             fullName: profile.fullName || p.fullName,
//             age: profile.age?.toString() || p.age,
//             gender: profile.gender || p.gender,
//             email: profile.email || p.email,
//             nextOfKin: profile.nextOfKin || p.nextOfKin,
//             nextOfKinPhone: profile.nextOfKinPhone || p.nextOfKinPhone,
//           } : p
//         ));

//         Alert.alert('Success', 'Passenger details loaded successfully');
//       }
//     } catch (error) {
//       // Silently fail - profile not found is expected
//       console.log('No saved profile found for:', passenger.phone);
//     }
//   };

//   // Add passenger
//   const handleAddPassenger = () => {
//     if (passengers.length >= 4) {
//       Alert.alert('Maximum Reached', 'You can only add up to 4 passengers');
//       return;
//     }
  
//     const newPassenger = {
//       id: (passengers.length + 1).toString(),
//       fullName: '',
//       phone: '',
//       email: '',
//       age: '',
//       gender: '',
//       title: 'Mr',
//       nextOfKin: '',
//       nextOfKinPhone: '',
//       isSearched: false,     
//       profileFound: false,   
//     };
  
//     setPassengers([...passengers, newPassenger]);
//   };

//   // Remove passenger
//   const handleRemovePassenger = (id) => {
//     if (passengers.length === 1) {
//       Alert.alert('Error', 'At least one passenger is required');
//       return;
//     }

//     Alert.alert(
//       'Remove Passenger',
//       'Are you sure you want to remove this passenger?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Remove',
//           style: 'destructive',
//           onPress: () => setPassengers(passengers.filter(p => p.id !== id)),
//         },
//       ]
//     );
//   };

//   // Validate form
//   const validateForm = () => {
//     // Check if terms agreed
//     if (!agreeToTerms) {
//       Alert.alert('Terms Required', 'Please agree to the terms and conditions');
//       return false;
//     }

//     // Validate each passenger
//     for (let i = 0; i < passengers.length; i++) {
//       const p = passengers[i];
      
//       if (!p.title || !p.fullName || !p.age || !p.gender || !p.phone || !p.nextOfKin || !p.nextOfKinPhone) {
//         Alert.alert('Incomplete Information', `Please fill all required fields for Passenger ${i + 1}`);
//         return false;
//       }

//       // Clean phone numbers (remove spaces, dashes, etc.)
//       const cleanPhone = p.phone.replace(/[\s\-\(\)]/g, '');
//       const cleanNextOfKinPhone = p.nextOfKinPhone.replace(/[\s\-\(\)]/g, '');

//       // Validate phone numbers (accept with or without +234)
//       const phonePattern = /^(0[789]\d{9}|234[789]\d{9}|\+234[789]\d{9})$/;
      
//       if (!phonePattern.test(cleanPhone)) {
//         Alert.alert(
//           'Invalid Phone', 
//           `Invalid phone number for Passenger ${i + 1}.\n\nValid formats:\n• 08012345678\n• 07012345678\n• 09012345678\n• +2348012345678`
//         );
//         return false;
//       }

//       if (!phonePattern.test(cleanNextOfKinPhone)) {
//         Alert.alert(
//           'Invalid Phone', 
//           `Invalid emergency contact number for Passenger ${i + 1}.\n\nValid formats:\n• 08012345678\n• 07012345678\n• 09012345678\n• +2348012345678`
//         );
//         return false;
//       }

//       // Validate age
//       const age = parseInt(p.age);
//       if (isNaN(age) || age < 1 || age > 120) {
//         Alert.alert('Invalid Age', `Invalid age for Passenger ${i + 1}`);
//         return false;
//       }
//     }

//     return true;
//   };

//   // Continue to seat selection
//   const handleContinue = () => {
//     if (!validateForm()) return;

//     navigation.navigate('SeatSelection', {
//       trip,
//       searchParams,
//       passengers,
//       passengerCount: passengers.length,
//     });
//   };

//   // View terms
//   const handleViewTerms = () => {
//     // Navigate to terms screen or open URL
//     Alert.alert(
//       'Terms & Conditions',
//       'Terms will be hosted on GitHub Pages.\n\nURL: https://yourorg.github.io/transport-terms',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'View Online', 
//           onPress: () => {
//             // Open in browser - Linking.openURL('https://yourorg.github.io/transport-terms')
//           }
//         },
//       ]
//     );
//   };

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
//       <StatusBarComponent />

//       <ScreenHeader
//         title="Passenger Details"
//         onBackPress={() => navigation.goBack()}
//       />

//       {/* Step Indicator */}
//       <StepIndicator currentStep={3} themeColors={themeColors} />

//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Info Card */}
//         <View style={[styles.infoCard, { backgroundColor: `${themeColors.primary}15` }]}>
//           <Ionicons name="information-circle" size={24} color={themeColors.primary} />
//           <Text style={[styles.infoText, { color: themeColors.subheading }]}>
//             Add passenger details. You can add up to 4 passengers. Each passenger will be assigned a seat.
//           </Text>
//         </View>

      
//         {/* Passenger Forms */}
// {passengers.map((passenger, index) => (
//   <View 
//     key={passenger.id} 
//     style={[styles.passengerCard, { backgroundColor: themeColors.card }]}
//   >
//     {/* Passenger Header */}
//     <View style={styles.passengerHeader}>
//       <View style={styles.passengerHeaderLeft}>
//         <View style={[styles.passengerBadge, { backgroundColor: themeColors.primary }]}>
//           <Text style={styles.passengerBadgeText}>{index + 1}</Text>
//         </View>
//         <Text style={[styles.passengerTitle, { color: themeColors.heading }]}>
//           Passenger {index + 1}
//         </Text>
//       </View>
      
//       {passengers.length > 1 && (
//         <TouchableOpacity
//           style={styles.removeButton}
//           onPress={() => handleRemovePassenger(passenger.id)}
//         >
//           <Ionicons name="trash-outline" size={20} color="#EF4444" />
//         </TouchableOpacity>
//       )}
//     </View>

//     {/* Phone Search (if not searched) */}
//     {!passenger.isSearched && (
//       <PassengerSearchFirst
//         passengerId={passenger.id}
//         onProfileFound={handleProfileFound}
//         onNewUser={handleNewUser}
//         initialPhone={passenger.phone}
//       />
//     )}

//     {/* Success Banner (if found) */}
//     {passenger.isSearched && passenger.profileFound && (
//       <View style={[styles.successBanner, { backgroundColor: '#10B98120' }]}>
//         <Ionicons name="checkmark-circle" size={20} color="#10B981" />
//         <Text style={[styles.successText, { color: '#10B981' }]}>
//           Welcome back! Your details have been auto-filled.
//         </Text>
//       </View>
//     )}

//     {/* Full Form (if searched) */}
//     {passenger.isSearched && (
//       <PassengerForm
//         passengerNumber={passenger.id}
//         data={passenger}
//         onChange={(field, value) => handlePassengerChange(passenger.id, field, value)}
//         onRemove={() => handleRemovePassenger(passenger.id)}
//         canRemove={passengers.length > 1}
//         themeColors={themeColors}
//       />
//     )}
//   </View>
// ))}

        

//         {/* Add Passenger Button */}
//         {passengers.length < 4 && (
//           <TouchableOpacity
//             style={[styles.addButton, { backgroundColor: themeColors.card }]}
//             onPress={handleAddPassenger}
//           >
//             <Ionicons name="add-circle" size={24} color={themeColors.primary} />
//             <Text style={[styles.addButtonText, { color: themeColors.primary }]}>
//               Add Another Passenger
//             </Text>
//           </TouchableOpacity>
//         )}

//         {/* Terms & Conditions */}
//         <View style={[styles.termsCard, { backgroundColor: themeColors.card }]}>
//           <View style={styles.termsRow}>
//             <Switch
//               value={agreeToTerms}
//               onValueChange={setAgreeToTerms}
//               trackColor={{ false: themeColors.border, true: `${themeColors.primary}50` }}
//               thumbColor={agreeToTerms ? themeColors.primary : themeColors.subtext}
//             />
//             <View style={styles.termsTextContainer}>
//               <Text style={[styles.termsText, { color: themeColors.subheading }]}>
//                 I agree to the{' '}
//                 <Text
//                   style={[styles.termsLink, { color: themeColors.primary }]}
//                   onPress={handleViewTerms}
//                 >
//                   Terms and Conditions
//                 </Text>
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Trip Summary */}
//         <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
//           <Text style={[styles.summaryTitle, { color: themeColors.heading }]}>
//             Booking Summary
//           </Text>
//           <View style={styles.summaryRow}>
//             <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
//               Route
//             </Text>
//             <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
//               {searchParams.departure} → {searchParams.destination}
//             </Text>
//           </View>
//           <View style={styles.summaryRow}>
//             <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
//               Provider
//             </Text>
//             <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
//               {trip.provider.name}
//             </Text>
//           </View>
//           <View style={styles.summaryRow}>
//             <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
//               Passengers
//             </Text>
//             <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
//               {passengers.length}
//             </Text>
//           </View>
//           <View style={styles.summaryRow}>
//             <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
//               Fare per Seat
//             </Text>
//             <Text style={[styles.summaryValue, { color: themeColors.primary }]}>
//               {formatCurrency(trip.fare, 'NGN')}
//             </Text>
//           </View>
//         </View>
//       </ScrollView>

//       {/* Bottom Action Bar */}
//       <View style={[styles.bottomBar, { backgroundColor: themeColors.card }]}>
//         <View style={styles.bottomBarContent}>
//           <View style={styles.bottomBarLeft}>
//             <Text style={[styles.bottomBarLabel, { color: themeColors.subtext }]}>
//               {passengers.length} passenger{passengers.length !== 1 ? 's' : ''}
//             </Text>
//             <Text style={[styles.bottomBarAmount, { color: themeColors.heading }]}>
//               Next: Select Seats
//             </Text>
//           </View>
//           <TouchableOpacity
//             style={[styles.continueButton, { backgroundColor: themeColors.primary }]}
//             onPress={handleContinue}
//           >
//             <Text style={styles.continueButtonText}>Continue</Text>
//             <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }


// // ============================================
// // STYLES
// // ============================================
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 120,
//   },

//   // Step Indicator
//   stepContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     justifyContent: 'space-between',
//   },
//   stepItem: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   stepCircle: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 6,
//   },
//   stepNumber: {
//     fontSize: 13,
//     fontWeight: '700',
//   },
//   stepLabel: {
//     fontSize: 10,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
//   stepConnector: {
//     height: 2,
//     flex: 1,
//     marginHorizontal: 4,
//     marginBottom: 26,
//   },

//   // Info Card
//   infoCard: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginHorizontal: 16,
//     marginBottom: 16,
//     padding: 12,
//     borderRadius: 12,
//     gap: 10,
//   },
//   infoText: {
//     flex: 1,
//     fontSize: 13,
//     lineHeight: 18,
//   },

//   // Passenger Card
//   passengerCard: {
//     marginHorizontal: 16,
//     marginBottom: 12,
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   passengerHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 16,
//   },
//   passengerHeaderLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     gap: 12,
//   },
//   passengerBadge: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   passengerTitle: {
//     fontSize: 15,
//     fontWeight: '700',
//     marginBottom: 2,
//   },
//   passengerName: {
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   passengerHeaderRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   removeButton: {
//     padding: 4,
//   },

//   // Form Fields
//   formFields: {
//     padding: 16,
//     paddingTop: 0,
//     gap: 16,
//   },
//   fieldGroup: {
//     gap: 8,
//   },
//   fieldLabelRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   fieldLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   searchButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 6,
//     gap: 4,
//   },
//   searchButtonText: {
//     fontSize: 11,
//     fontWeight: '700',
//   },
//   required: {
//     color: '#FF3B30',
//   },
//   input: {
//     borderWidth: 1,
//     borderRadius: 10,
//     paddingVertical: 12,
//     paddingHorizontal: 14,
//     fontSize: 14,
//     fontWeight: '500',
//   },

//   // Title Buttons
//   titleButtons: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   titleButton: {
//     flex: 1,
//     paddingVertical: 10,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   titleButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//   },

//   // Gender Buttons
//   genderButtons: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   genderButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 10,
//     gap: 8,
//   },
//   genderButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//   },

//   // Emergency Section
//   emergencySection: {
//     padding: 12,
//     borderRadius: 12,
//     gap: 12,
//   },
//   emergencySectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     marginBottom: 4,
//   },
//   emergencySectionTitle: {
//     fontSize: 14,
//     fontWeight: '700',
//   },

//   // Add Button
//   addButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginHorizontal: 16,
//     marginBottom: 16,
//     padding: 16,
//     borderRadius: 12,
//     gap: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   addButtonText: {
//     fontSize: 15,
//     fontWeight: '700',
//   },

//   // Terms Card
//   termsCard: {
//     marginHorizontal: 16,
//     marginBottom: 16,
//     padding: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   termsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   termsTextContainer: {
//     flex: 1,
//   },
//   termsText: {
//     fontSize: 13,
//     lineHeight: 18,
//   },
//   termsLink: {
//     fontWeight: '700',
//     textDecorationLine: 'underline',
//   },

//   // Summary Card
//   summaryCard: {
//     marginHorizontal: 16,
//     marginBottom: 16,
//     padding: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   summaryTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     marginBottom: 12,
//   },
//   summaryRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   summaryLabel: {
//     fontSize: 13,
//     fontWeight: '500',
//   },
//   summaryValue: {
//     fontSize: 14,
//     fontWeight: '700',
//   },

//   // Bottom Bar
//   bottomBar: {
//     position: 'absolute',
//     bottom: 36,
//     left: 0,
//     right: 0,
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(0,0,0,0.05)',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   bottomBarContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 16,
//   },
//   bottomBarLeft: {
//     flex: 1,
//   },
//   bottomBarLabel: {
//     fontSize: 12,
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   bottomBarAmount: {
//     fontSize: 15,
//     fontWeight: '700',
//   },
//   continueButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 14,
//     paddingHorizontal: 24,
//     borderRadius: 12,
//     gap: 8,
//   },
//   continueButtonText: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   // NEW STYLES - Add these at the end
//   passengerCard: {
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   passengerHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   passengerHeaderLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   passengerBadge: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   passengerBadgeText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   passengerTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   removeButton: {
//     padding: 8,
//   },
//   successBanner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     borderRadius: 10,
//     marginBottom: 16,
//     gap: 10,
//   },
//   successText: {
//     fontSize: 13,
//     fontWeight: '600',
//     flex: 1,
//   },
// });