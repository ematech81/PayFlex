
// src/screens/LoginScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { btnStyle, btnText, inputStyle, otpBox } from 'constants/Styles';
import { AuthService } from 'AuthFunction/authService';
import AuthHeader from 'component/AuthHeader';
import { STORAGE_KEYS } from 'utility/storageKeys';

export default function LoginScreen({ navigation }) {
  const isDark = useThem();
  const theme = isDark ? colors.dark : colors.light;

  // Main login state
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [requirePin, setRequirePin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Forgot PIN flow state
  const [modalVisible, setModalVisible] = useState(false);
  const [resetStep, setResetStep] = useState('phone'); // phone → otp → setpin
  const [resetPhone, setResetPhone] = useState('');
  const [resetOtp, setResetOtp] = useState(['', '', '', '', '', '']);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [resetToken, setResetToken] = useState(null);

  // Refs
  const pinRefs = useRef([]);
  const otpRefs = useRef([]);

  // ==============================
  // Load Saved Data on Mount
  // ==============================
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedPhone = await AsyncStorage.getItem(STORAGE_KEYS.PHONE);
      const savedRequirePin = await AsyncStorage.getItem(STORAGE_KEYS.REQUIRE_PIN);

      if (savedPhone) {
        console.log('✅ Loaded saved phone:', savedPhone);
        setPhone(savedPhone.trim()); // Remove any stray spaces
      }

      if (savedRequirePin !== null) {
        setRequirePin(savedRequirePin === 'true');
      }

      // Focus first PIN input after loading
      setTimeout(() => {
        pinRefs.current[0]?.focus();
      }, 100);

    } catch (err) {
      console.error('❌ Error loading stored data:', err);
    }
  };

  // ==============================
  // PIN Input Handler
  // ==============================
  const handlePinChange = (value, index) => {
    // Only allow digits
    if (!/^\d?$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newPin.every(d => d) && newPin.join('').length === 6) {
      // ✅ Prevent toggle from being affected during auto-submit
      // Blur all inputs to dismiss keyboard
      pinRefs.current.forEach(ref => ref?.blur());
      
      // Small delay to ensure UI state is stable
      setTimeout(() => handleLogin(newPin), 150);
    }
  };

  // Handle backspace navigation
  const handlePinKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };


  // ==============================
  // Handle RequirePin Toggle Change
  // ==============================
  const handleRequirePinToggle = async (newValue) => {
    setRequirePin(newValue);
    
    // Save to AsyncStorage immediately
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REQUIRE_PIN, String(newValue));
      console.log('✅ RequirePin saved to AsyncStorage:', newValue);
    } catch (err) {
      console.error('❌ Error saving requirePin to AsyncStorage:', err);
    }

    // Update backend if user is logged in (has token)
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      
      if (token) {
        const res = await AuthService.updateRequirePin(newValue);
        if (res.success) {
          console.log('✅ RequirePin updated on backend:', newValue);
        } else {
          console.warn('⚠️ Failed to update requirePin on backend:', res.message);
        }
      } else {
        console.log('ℹ️  No token found, will sync requirePin on next login');
      }
    } catch (err) {
      console.error('❌ Error updating requirePin on backend:', err);
    }
  };

  // ==============================
  // Handle Login
  // ==============================
  const handleLogin = async (pinArray = pin) => {
    // Prevent duplicate submissions
    if (loading) return;

    const pinStr = pinArray.join('').trim();
    const formattedPhone = phone?.trim();

    console.log('📱 Login attempt:', { phone: formattedPhone, pinLength: pinStr.length });

    // ✅ Input Validation
    if (!formattedPhone) {
      return Alert.alert('Error', 'Please enter your phone number');
    }

    if (pinStr.length !== 6) {
      return Alert.alert('Error', `PIN must be exactly 6 digits (you entered ${pinStr.length})`);
    }

    if (!/^\d{6}$/.test(pinStr)) {
      return Alert.alert('Error', 'PIN must contain only numbers');
    }

    try {
      setLoading(true);

      // Call login API (handles device detection automatically)
      const res = await AuthService.login(formattedPhone, pinStr);

      console.log('✅ Login response:', { 
        success: res.success, 
        isNewDevice: res.isNewDevice 
      });

      // ✅ Known Device - Login Successful
      if (res.success && !res.isNewDevice && res.token) {
        console.log('✅ Known device, navigating to Home');

        // Save phone and PIN preference
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.PHONE, formattedPhone],
          [STORAGE_KEYS.REQUIRE_PIN, String(requirePin)],
        ]);


        // ✅ Update requirePin setting on backend
        try {
          const updateRes = await AuthService.updateRequirePin(requirePin);
          if (updateRes.success) {
            console.log('✅ RequirePin setting updated:', requirePin);
          } else {
            console.warn('⚠️ Failed to update requirePin on backend:', updateRes.message);
          }
        } catch (updateErr) {
          console.warn('⚠️ Error updating requirePin:', updateErr);
          // Don't block login if this fails
        }


        // Navigate to home
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

      // 🆕 New Device Detected - Require OTP Verification
      if (res.success && res.isNewDevice) {
        console.log('🆕 New device detected, navigating to OTP verification');

        Alert.alert(
          'New Device Detected',
          res.message || 'We sent a verification code to your phone for security.',
          [
            {
              text: 'Verify',
              onPress: () => {
                navigation.navigate('VerifyCode', {
                  phone: formattedPhone,
                  isDeviceVerification: true,
                  fromLogin: true,
                });
              },
            },
          ],
          { cancelable: false }
        );
        return;
      }

      // ❌ Login Failed
      Alert.alert(
        'Login Failed',
        res.message || 'Invalid phone number or PIN'
      );

    } catch (err) {
      console.error('❌ Login Error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Forgot PIN Flow
  // ==============================
  const startForgotPin = async () => {
    if (!phone) {
      return Alert.alert('Error', 'Please enter your phone number first');
    }

    try {
      const res = await AuthService.forgotPin(phone);
      if (res.success) {
        setResetPhone(phone);
        setResetStep('otp');
        setModalVisible(true);
        Alert.alert('Success', 'Reset code sent to your phone');
      } else {
        Alert.alert('Error', res.message || 'Unable to send reset code');
      }
    } catch (err) {
      console.error('❌ Forgot PIN error:', err);
      Alert.alert('Error', 'Unable to send reset code');
    }
  };

  const verifyResetCode = async () => {
    const code = resetOtp.join('');
    if (code.length !== 6) {
      return Alert.alert('Error', 'Enter the 6-digit code');
    }

    try {
      const res = await AuthService.verifyResetCode(resetPhone, code);
      if (res.success) {
        setResetToken(res.resetToken);
        setResetStep('setpin');
      } else {
        Alert.alert('Invalid Code', res.message);
      }
    } catch (err) {
      console.error('❌ Reset code verification error:', err);
      Alert.alert('Error', 'Code verification failed');
    }
  };

  const completeReset = async () => {
    if (!newPin || !confirmPin) {
      return Alert.alert('Error', 'Please enter both PIN fields');
    }

    if (newPin.length !== 6 || confirmPin.length !== 6) {
      return Alert.alert('Error', 'PIN must be exactly 6 digits');
    }

    if (newPin !== confirmPin) {
      return Alert.alert('Error', 'PINs do not match');
    }

    try {
      const res = await AuthService.setPinAfterReset(resetToken, newPin);
      if (res.success) {
        Alert.alert('Success', 'PIN has been reset successfully', [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              setResetStep('phone');
              setResetOtp(['', '', '', '', '', '']);
              setNewPin('');
              setConfirmPin('');
              setResetToken(null);
            },
          },
        ]);
      } else {
        Alert.alert('Error', res.message || 'PIN reset failed');
      }
    } catch (err) {
      console.error('❌ PIN reset error:', err);
      Alert.alert('Error', 'PIN reset failed');
    }
  };

  // Handle OTP input for reset flow
  const handleResetOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...resetOtp];
    updated[index] = value;
    setResetOtp(updated);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (updated.every(x => x) && updated.join('').length === 6) {
      setTimeout(() => verifyResetCode(), 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* <ScrollView style={{  backgroundColor: theme.background }}> */}
        <AuthHeader title="Welcome Back" subtitle="Login to your account" />
        
        <View style={{ padding: 24 }}>
          {/* Phone Number Input */}
          <TextInput
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={inputStyle(theme)}
            editable={!loading}
          />

<View style={{marginVertical: 10}}><Text style={{fontSize: 17, color: theme.subtext}}>Enter Your Login PIN</Text></View>
          {/* PIN Input Boxes */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 10,
              marginBottom: 16,
              gap: 10
   
            }}
          >
            {pin.map((digit, i) => (
              <TextInput
                key={i}
                ref={(el) => (pinRefs.current[i] = el)}
                style={otpBox(theme)}
                value={digit}
                onChangeText={(v) => handlePinChange(v, i)}
                onKeyPress={(e) => handlePinKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry
                editable={!loading}
              />
            ))}
          </View>

          {/* Require PIN Toggle */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.heading, fontWeight: '600' }}>
                Require PIN on app open
              </Text>
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight:'600' }}>
              <Text>
  {requirePin ? 'PIN required every time' : 'PIN skipped on app launch'}
</Text>
              </Text>
            </View>
            <Switch 
              value={requirePin} 
              onValueChange={handleRequirePinToggle}
              disabled={loading}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={requirePin ? theme.card : theme.subtext}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[
              btnStyle(theme),
              loading && { opacity: 0.7 }
            ]} 
            onPress={() => handleLogin()} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.card} />
            ) : (
              <Text style={btnText(theme)}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Forgot PIN Link */}
          <TouchableOpacity 
            onPress={startForgotPin}
            disabled={loading}
          >
            <Text style={{ 
              textAlign: 'center', 
              color: theme.primary, 
              marginVertical: 16 
            }}>
              Forgot PIN?
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('SignUp')}
            disabled={loading}
          >
            <Text style={{ textAlign: 'center', color: theme.heading }}>
              Don't have an account?{' '}
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>
                Sign Up
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      {/* </ScrollView> */}

      {/* ==============================
          Forgot PIN Modal
          ============================== */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View style={{ 
            backgroundColor: theme.card, 
            borderRadius: 16, 
            padding: 24,
            maxHeight: '80%'
          }}>
            {/* OTP Entry Step */}
            {resetStep === 'otp' && (
              <>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  marginBottom: 8,
                  color: theme.heading 
                }}>
                  Enter Reset Code
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: theme.subtext, 
                  marginBottom: 16 
                }}>
                  We sent a 6-digit code to {resetPhone}
                </Text>
                
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  marginBottom: 16 
                }}>
                  {resetOtp.map((d, i) => (
                    <TextInput
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      style={otpBox(theme)}
                      value={d}
                      onChangeText={(v) => handleResetOtpChange(v, i)}
                      keyboardType="number-pad"
                      maxLength={1}
                    />
                  ))}
                </View>

                <TouchableOpacity 
                  style={btnStyle(theme)} 
                  onPress={verifyResetCode}
                >
                  <Text style={btnText(theme)}>Verify Code</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Set New PIN Step */}
            {resetStep === 'setpin' && (
              <>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  marginBottom: 8,
                  color: theme.heading 
                }}>
                  Set New PIN
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: theme.subtext, 
                  marginBottom: 16 
                }}>
                  Enter a new 6-digit PIN
                </Text>

                <TextInput
                  placeholder="New 6-digit PIN"
                  secureTextEntry
                  maxLength={6}
                  keyboardType="number-pad"
                  style={inputStyle(theme)}
                  value={newPin}
                  onChangeText={setNewPin}
                />
                
                <TextInput
                  placeholder="Confirm PIN"
                  secureTextEntry
                  maxLength={6}
                  keyboardType="number-pad"
                  style={inputStyle(theme)}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                />
                
                <TouchableOpacity 
                  style={btnStyle(theme)} 
                  onPress={completeReset}
                >
                  <Text style={btnText(theme)}>Reset PIN</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Cancel Button */}
            <TouchableOpacity 
              onPress={() => {
                setModalVisible(false);
                setResetStep('phone');
                setResetOtp(['', '', '', '', '', '']);
                setNewPin('');
                setConfirmPin('');
                setResetToken(null);
              }}
            >
              <Text style={{ 
                textAlign: 'center', 
                color: theme.destructive, 
                marginTop: 16,
                fontSize: 16 
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}