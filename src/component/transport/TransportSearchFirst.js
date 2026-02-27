// components/transport/PassengerSearchFirst.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import bookingService from 'AuthFunction/bookingService';
import { colors } from 'constants/colors';
import { useTheme } from 'context/ThemeContext';

const PassengerSearchFirst = ({ 
  passengerId, 
  onProfileFound, 
  onNewUser, 
}) => {
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;


  const handleSearch = async () => {
    // Validate phone number
    if (phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }
  
    setSearching(true);
    
    try {
      const response = await bookingService.searchPassengerByPhone(phone);
  
      if (response.success && response.data) {
        // ✅ Profile found - auto-fill all fields
        onProfileFound({
          id: passengerId,
          ...response.data,
          phone: phone,
        });
        
        // Optional: Show success message
        Alert.alert(
          'Welcome Back!',
          'Your profile has been loaded successfully.',
          [{ text: 'Great!', style: 'default' }]
        );
      } else {
        // ❌ New passenger - show message and form
        Alert.alert(
          'New Passenger',
          'No saved profile found. Please fill in your details below.',
          [{ text: 'OK', style: 'default' }]
        );
        
        setSearched(true);
        onNewUser({ id: passengerId, phone: phone });
      }
    } catch (error) {
      // Real error (network, auth, etc.)
      console.error('Search error:', error);
      
      Alert.alert(
        'Connection Error',
        'Unable to search. Please check your internet connection.',
        [{ text: 'OK', style: 'default' }]
      );
      
      // Still show form so user can continue
      setSearched(true);
      onNewUser({ id: passengerId, phone: phone });
    } finally {
      setSearching(false);
    }
  };

  if (searched) {
    // Show "Edit" button to search again
    return (
      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: themeColors.card }]}
        onPress={() => setSearched(false)}
      >
        <Ionicons name="create-outline" size={20} color={themeColors.primary} />
        <Text style={[styles.editText, { color: themeColors.primary }]}>
          Search Different Number
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: themeColors.destructive }]}>
        Enter phone number to auto-fill (if registered before)
      </Text>
      
      <View style={[styles.searchRow, { backgroundColor: themeColors.card }]}>
        <TextInput
          style={[styles.input, { color: themeColors.heading }]}
          placeholder="08012345678"
          placeholderTextColor={themeColors.subtext}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={11}
          autoFocus
        />
        
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: themeColors.primary }]}
          onPress={handleSearch}
          disabled={searching || phone.length < 10}
        >
          {searching ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="search" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.hint, { color: themeColors.subtext }]}>
        {phone.length >= 10
          ? 'Tap search to check if you\'re registered'
          : 'Enter your phone number to continue'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 10
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PassengerSearchFirst;