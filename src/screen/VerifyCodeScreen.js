// src/screens/VerifyOTPScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import AuthHeader from 'component/AuthHeader';
import { AuthService } from 'AuthFunction/authService';
import { otpBox } from 'constants/Styles';

export default function VerifyOTPScreen({ route, navigation }) {
  const { userId, phone, fromSignup, isDeviceVerification } = route.params; 
  const isDark = useThem();
  const theme = isDark ? colors.dark : colors.light;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) refs.current[index + 1]?.focus();
    if (newOtp.every(d => d)) submit();
  };


  const submit = async () => {
    const code = otp.join('');
    
    try {
      const res = await AuthService.verifyOtp(phone, code);
      
      // Success: backend returns { message, token, user }
      if (res.token && res.user) {
        // Store token if needed
        // await AsyncStorage.setItem('token', res.token);
        
        if (fromSignup) {
          navigation.navigate('LoginPin', { phone, userId: res.user.id });
        } else if (isDeviceVerification) {
          const loginRes = await AuthService.login(phone, route.params.pin);
          if (loginRes.success || loginRes.token) {
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          } else {
            Alert.alert('Login Failed', loginRes.message || 'Unable to login');
          }
        }
      } 
      // Error: backend returns { message }
      else if (res.message) {
        Alert.alert('Verification Failed', res.message);
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        refs.current[0]?.focus();
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Network Error', 'Check your connection and try again');
    }
  };


  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle='light-content' backgroundColor='transparent' translucent />
      <AuthHeader title="Verify Phone" subtitle={`Code sent to ${phone}`} showBack onBack={() => navigation.goBack()} />
      <View style={{ padding: 24, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 50 }}>
          {otp.map((d, i) => (
            <TextInput
              key={i}
              ref={el => (refs.current[i] = el)}
              style={otpBox(theme)}
              value={d}
              onChangeText={v => handleChange(v, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>
        <TouchableOpacity onPress={() => AuthService.resendOtp(phone)}>
          <Text style={{ color: theme.primary, marginTop: 20 }}>Resend OTP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
