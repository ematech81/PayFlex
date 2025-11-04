// src/screens/SignUpScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { AuthService } from 'AuthFunction/authService';
import AuthHeader from 'component/AuthHeader';
import { btnStyle, btnText, inputStyle } from 'constants/Styles';
import {
  Ionicons,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function SignUpScreen({ navigation }) {
  const isDark = useThem();
  const theme = isDark ? colors.dark : colors.light;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  
 

  /**
 * Handles user registration form submission
 * Validates input, calls AuthService, and navigates on success
 */
const handleSubmit = async () => {
  // Clear previous error state
  setError('');
  setLoading(true);

  try {
    // Call AuthService.register (it handles validation, timeout, and errors internally)
    const response = await AuthService.register(form);

    // Handle unsuccessful registration
    if (!response.success) {
      // Display validation errors
      if (response.errors && response.errors.length > 0) {
        const errorMessage = response.errors
          .map(err => err.message || err.msg)
          .join(', ');
        setError(errorMessage);
        return;
      }

      // Display specific error messages
      if (response.isTimeout) {
        setError('Request timeout. Please check your connection and try again.');
        return;
      }

      if (response.isNetworkError) {
        setError('Network error. Please check your internet connection.');
        return;
      }

      // Display general error message
      setError(response.message || 'Registration failed. Please try again.');
      return;
    }

    // Handle successful registration
    if (response.success && response.userId && response.phone) {
      // Extract last 3 digits for masking (phone is already masked from backend)
      const maskedPhone = response.phone; // Backend returns "****5098"
      
      // Show success message
      Alert.alert(
        'Registration Successful',
        `We sent a verification code to ${maskedPhone}`,
        [
          {
            text: 'Verify Now',
            onPress: () => {
              navigation.replace('VerifyCode', {
                userId: response.userId,
                phone: form.phone, // Pass original unmasked phone for verification
                fromSignup: true,
              });
            },
          },
        ],
        { cancelable: false } // Prevent dismissing without action
      );
      return;
    }

    // Fallback error for unexpected response format
    setError('Unexpected response from server. Please try again.');

  } catch (error) {
    // This catch block handles unexpected errors that AuthService didn't catch
    console.error('❌ Unexpected registration error:', error);
    setError('An unexpected error occurred. Please try again.');
  } finally {
    // Always reset loading state
    setLoading(false);
  }
};
return (
  <KeyboardAvoidingView
    style={{ flex: 1, backgroundColor: theme.background }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
   <AuthHeader title="Create Account" subtitle="Join PayFlex today" />
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 120,
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled"
    >
     

      {/* First Name */}
      <TextInput
        placeholder="First Name"
        value={form.firstName}
        onChangeText={(t) => setForm({ ...form, firstName: t })}
        style={inputStyle(theme)}
        editable={!loading}
      />

      {/* Last Name */}
      <TextInput
        placeholder="Last Name"
        value={form.lastName}
        onChangeText={(t) => setForm({ ...form, lastName: t })}
        style={inputStyle(theme)}
        editable={!loading}
      />

      {/* Phone */}
      <TextInput
        placeholder="Phone Number"
        value={form.phone}
        onChangeText={(t) => setForm({ ...form, phone: t })}
        keyboardType="phone-pad"
        style={inputStyle(theme)}
        editable={!loading}
      />

      {/* Email */}
      <TextInput
        placeholder="Email"
        value={form.email}
        onChangeText={(t) => setForm({ ...form, email: t })}
        keyboardType="email-address"
        autoCapitalize="none"
        style={inputStyle(theme)}
        editable={!loading}
      />

      {/* Password */}
      <View style={{ position: 'relative' }}>
        <TextInput
          placeholder="Password"
          value={form.password}
          onChangeText={(t) => setForm({ ...form, password: t })}
          secureTextEntry={!showPassword}
          style={inputStyle(theme)}
          editable={!loading}
        />
        <TouchableWithoutFeedback onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color={theme.subtext}
            style={{ position: 'absolute', right: 16, top: 16 }}
          />
        </TouchableWithoutFeedback>
      </View>

      {error ? (
        <Text style={{ color: theme.destructive, textAlign: 'center', marginVertical: 12 }}>
          {error}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[btnStyle(theme), loading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.card} />
        ) : (
          <Text style={btnText(theme)}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
        <Text style={{ textAlign: 'center', color: theme.primary, marginTop: 16 }}>
          Already have an account?{' '}
          <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  </KeyboardAvoidingView>
);
}

