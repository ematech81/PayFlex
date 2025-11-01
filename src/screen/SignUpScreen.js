// src/screens/SignUpScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { AuthService } from 'AuthFunction/authService';
import AuthHeader from 'component/AuthHeader';
import { btnStyle, btnText, inputStyle } from 'constants/Styles';
import {
  Ionicons,
} from '@expo/vector-icons';


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

  // Timeout controller
  let timeoutId = null;

  const handleSubmit = async () => {
    // Clear previous error
    setError('');
    setLoading(true);
  
    // Validation
    if (!form.firstName || !form.lastName || !form.phone || !form.email || !form.password) {
      setError('All fields are required');
      setLoading(false);
      return;
    }
  
    // Set timeout (8 seconds)
    timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Network timeout. Please try again.');
    }, 8000);
  
    try {
      const res = await AuthService.register(form);
  
      clearTimeout(timeoutId); // Clear timeout on response
  
      // Check if response contains errors (validation errors or conflict)
      if (res.errors || res.message?.toLowerCase().includes('already in use')) {
        // Handle validation errors
        if (res.errors && res.errors.length > 0) {
          setError(res.errors[0].msg || 'Validation failed');
        } else {
          setError(res.message || 'Registration failed');
        }
      } else if (res.userId && res.phone) {
        // Success: mask phone number and navigate to OTP
        const maskedPhone = res.phone.slice(-3);
        Alert.alert(
          'Success',
          `Registration successful, we sent a code to the phone ***${maskedPhone}`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.replace('VerifyCode', {
                  userId: res.userId,
                  phone: res.phone,
                  fromSignup: true,
                });
              },
            },
          ]
        );
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Registration error:', err);
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={{  backgroundColor: theme.background }}>
      <AuthHeader title="Create Account" subtitle="Join PayFlex today" />

      <View style={{ padding: 24 }}>
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

        {/* Password with Toggle */}
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

        {/* Error Message */}
        {error ? (
          <Text style={{ color: theme.destructive, textAlign: 'center', marginVertical: 12 }}>
            {error}
          </Text>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            btnStyle(theme),
            loading && { opacity: 0.7 },
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.card} />
          ) : (
            <Text style={btnText(theme)}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={{ textAlign: 'center', color: theme.primary, marginTop: 16 }}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    </KeyboardAvoidingView>
  );
}

