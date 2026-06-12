
// src/screens/VerifyOTPScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StatusBar, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import AuthHeader from 'component/AuthHeader';
import { AuthService, } from 'AuthFunction/authService';
import { otpBox } from 'constants/Styles';
import { STORAGE_KEYS } from 'utility/storageKeys';


export default function VerifyOTPScreen({ route, navigation }) {
  const { userId, phone, fromSignup, isDeviceVerification, pin } = route.params; 
  const isDark = useThem();
  const theme = isDark ? colors.dark : colors.light;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const refs = useRef([]);

  // Focus first input when screen loads
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);
  
  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.every(d => d) && otp.join('').length === 6 && !loading) {
      submit();
    }
  }, [otp]);

  const handleChange = (value, index) => {
    if (!/^[A-Za-z0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.toUpperCase();
    setOtp(newOtp);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  /**
   * Main OTP submission handler
   * Handles both phone verification (signup) and device verification (login)
   */
  const submit = async () => {
    const code = otp.join('');
    
    // Prevent duplicate submissions
    if (loading) return;
    
    setLoading(true);
    console.log("📤 Verifying OTP:", { phone, isDeviceVerification, fromSignup });

    try {
      let res;

      // ✅ DEVICE VERIFICATION FLOW (New device during login)
      if (isDeviceVerification) {
        console.log("🆕 Device verification flow");
        
        // Get device ID from storage using STORAGE_KEYS
        const deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
        
        // Call device verification endpoint
        res = await AuthService.verifyDeviceOtp(phone, code, deviceId);
        console.log("✅ Device verification response:", res);

        if (res.success && res.token && res.user) {
          // Token already stored by AuthService
          console.log("✅ Device verified, navigating to Home");
          
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'MainTabs',
                state: {
                  index: 0,
                  routes: [{ name: 'Home' }],
                },
              },
            ],
          });
          return;
        }
      } 
      
      // ✅ PHONE VERIFICATION FLOW (After signup)
      else if (fromSignup) {
        console.log("📱 Phone verification flow (signup)");
        
        res = await AuthService.verifyOtp(phone, code, userId);
        console.log("✅ Phone verification response:", res);

        if (res.success && res.token && res.user) {
          await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, res.token);

          console.log("✅ Token stored successfully:", res.token);
          console.log("✅ Phone verified, navigating to Set PIN");
          
          navigation.replace('LoginPinScreen', { 
            phone, 
            userId: res.user.id 
          });
          return;
        }
      }
      
      // ✅ DEFAULT FLOW (Forgot PIN or re-verification)
      else {
        console.log("🔄 Default verification flow");
        
        res = await AuthService.verifyOtp(phone, code);
        console.log("✅ Verification response:", res);

        if (res.success && res.token && res.user) {
          console.log("✅ Verified, navigating to Home");
          
            navigation.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              state: {
                index: 0,
                routes: [{ name: 'Home' }],
              },
            },
          ],
        });
          return;
        }
      }

      // ❌ Handle verification failure
      if (!res.success) {
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        refs.current[0]?.focus();

        // Show appropriate error message
        if (res.alreadyVerified) {
          Alert.alert(
            'Already Verified',
            res.message,
            [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
          );
        } else if (res.shouldResend || res.isExpired) {
          Alert.alert(
            'Verification Failed',
            res.message,
            [{ text: 'OK' }]
          );
        } else if (res.shouldRetryLogin) {
          Alert.alert(
            'Session Expired',
            res.message,
            [{ text: 'Login Again', onPress: () => navigation.navigate('Login') }]
          );
        } else {
          Alert.alert('Verification Failed', res.message || 'Invalid OTP code');
        }
      } else {
        // Unexpected response format
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }

    } catch (error) {
      console.error('❌ OTP verification error:', error);
      
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
      
      Alert.alert('Network Error', 'Check your connection and try again');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend OTP handler
   * Uses appropriate resend method based on verification type
   */
  const handleResendOtp = async () => {
    if (resendLoading) return;
    
    setResendLoading(true);
    console.log("📤 Resending OTP:", { phone, isDeviceVerification });

    try {
      let res;

      // Choose correct resend method
      if (isDeviceVerification) {
        res = await AuthService.resendDeviceOtp(phone);
      } else {
        res = await AuthService.resendOtp(phone);
      }

      if (res.success) {
        Alert.alert(
          'Success',
          res.message || 'Verification code sent successfully',
          [{ text: 'OK' }]
        );
      } else {
        // Handle rate limiting
        if (res.waitSeconds) {
          Alert.alert(
            'Please Wait',
            res.message || `Please wait ${res.waitSeconds} seconds before requesting a new code`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', res.message || 'Failed to resend code');
        }
      }
    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle='light-content' backgroundColor='transparent' translucent />
      
      <AuthHeader 
        title={isDeviceVerification ? "Verify Device" : "Verify Phone"} 
        subtitle={`Access key sent to ${phone}`}
        showBack 
        onBack={() => navigation.goBack()} 
      />
      
      <View style={{ padding: 24, alignItems: 'center' }}>
        {/* OTP Input Boxes */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 50 }}>
          {otp.map((d, i) => (
            <TextInput
              key={i}
              ref={el => (refs.current[i] = el)}
              style={otpBox(theme)}
              value={d}
              onChangeText={v => handleChange(v, i)}
              keyboardType="default"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={1}
              textAlign="center"
              editable={!loading}
            />
          ))}
        </View>

        {/* Manual Verify Button */}
        <TouchableOpacity
          style={{
            marginTop: 30,
            backgroundColor: loading ? theme.disabled : theme.primary,
            padding: 12,
            borderRadius: 8,
            minWidth: 150,
            alignItems: 'center',
          }}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              Verify Access Key
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend OTP Button */}
        <TouchableOpacity
          style={{ marginTop: 20 }}
          onPress={handleResendOtp}
          disabled={resendLoading}
        >
          {resendLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Text style={{ color: theme.primary, fontSize: 16 }}>
              Resend Access Key
            </Text>
          )}
        </TouchableOpacity>

        {/* Context indicator */}
        {isDeviceVerification && (
          <Text style={{ 
            color: theme.subtext, 
            marginTop: 20, 
            textAlign: 'center',
            fontSize: 12 
          }}>
            Verifying new device for security
          </Text>
        )}
      </View>
    </View>
  );
}