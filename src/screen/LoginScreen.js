// src/screens/LoginScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, Switch,
  Modal, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { btnStyle, btnText, inputStyle, otpBox} from 'constants/Styles';
import { AuthService } from 'AuthFunction/authService';
import AuthHeader from 'component/AuthHeader';

export default function LoginScreen({ navigation }) {
  const isDark = useThem();
  const theme = isDark ? colors.dark : colors.light;
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [requirePin, setRequirePin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resetStep, setResetStep] = useState('phone'); // phone → otp → setpin
  const [resetPhone, setResetPhone] = useState('');
  const [resetOtp, setResetOtp] = useState(['', '', '', '', '', '']);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const pinRefs = useRef([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const stored = await AsyncStorage.getItem('phone');
    const req = await AsyncStorage.getItem('requirePinOnOpen');
    if (stored) setPhone(stored);
    if (req) setRequirePin(req === 'true');
  };

  const handleLogin = async () => {
    const pinStr = pin.join('');
    if (!phone || pinStr.length !== 6) return Alert.alert('Error', 'Enter phone and 6-digit PIN');

    setLoading(true);
    const res = await AuthService.login(phone, pinStr);
    setLoading(false);

    if (res.success && !res.isNewDevice) {
      await AsyncStorage.setItem('requirePinOnOpen', String(requirePin));
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } else if (res.isNewDevice) {
      navigation.navigate('VerifyCode', {
        phone: res.phone,
        userId: res.userId,
        pin: pinStr,
        isDeviceVerification: true,
      });
    } else {
      Alert.alert('Login Failed', res.message);
    }
  };

  const startForgotPin = () => {
    setResetPhone(phone);
    setModalVisible(true);
    AuthService.forgotPin(phone);
  };

  const verifyResetCode = async () => {
    const code = resetOtp.join('');
    const res = await AuthService.verifyResetCode(resetPhone, code);
    if (res.success) {
      setResetStep('setpin');
    } else {
      Alert.alert('Invalid Code', res.message);
    }
  };

  const completeReset = async () => {
    if (newPin !== confirmPin || newPin.length !== 6) {
      return Alert.alert('Error', 'PINs do not match');
    }
    const res = await AuthService.setPinAfterReset(res.resetToken, newPin);
    if (res.success) {
      Alert.alert('Success', 'PIN reset! Please login.', [{ text: 'OK', onPress: () => setModalVisible(false) }]);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
     <StatusBar barStyle='light-content' backgroundColor='transparent' translucent/>
      <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
        <AuthHeader title="Welcome Back" subtitle="Login to your account" />
        <View style={{ padding: 24 }}>
          <TextInput
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={inputStyle(theme)}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 }}>
            {pin.map((d, i) => (
              <TextInput
                key={i}
                ref={el => pinRefs.current[i] = el}
                style={otpBox(theme)}
                value={d}
                onChangeText={v => {
                  if (/^\d?$/.test(v)) {
                    const newPin = [...pin];
                    newPin[i] = v;
                    setPin(newPin);
                    if (v && i < 5) pinRefs.current[i + 1]?.focus();
                    if (newPin.every(x => x)) handleLogin();
                  }
                }}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry
              />
            ))}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ color: theme.heading, fontWeight: '600' }}>Require PIN on app open</Text>
              <Text style={{ color: theme.subtext, fontSize: 12 }}>Disable to skip PIN on launch</Text>
            </View>
            <Switch value={requirePin} onValueChange={setRequirePin} />
          </View>

          <TouchableOpacity style={btnStyle(theme)} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={theme.card} /> : <Text style={btnText(theme)}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={startForgotPin}>
            <Text style={{ textAlign: 'center', color: theme.primary, marginVertical: 16 }}>Forgot PIN?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={{ textAlign: 'center', color: theme.subtext }}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Forgot PIN Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 24 }}>
            {resetStep === 'phone' && (
              <>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Reset PIN</Text>
                <TextInput
                  placeholder="Enter phone"
                  value={resetPhone}
                  onChangeText={setResetPhone}
                  style={inputStyle(theme)}
                />
                <TouchableOpacity style={btnStyle(theme)} onPress={() => { AuthService.forgotPin(resetPhone); setResetStep('otp'); }}>
                  <Text style={btnText(theme)}>Send Code</Text>
                </TouchableOpacity>
              </>
            )}
            {resetStep === 'otp' && (
              <>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Enter Code</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {resetOtp.map((d, i) => (
                    <TextInput key={i} style={otpBox(theme)} value={d} onChangeText={v => {
                      if (/^\d?$/.test(v)) {
                        const newOtp = [...resetOtp];
                        newOtp[i] = v;
                        setResetOtp(newOtp);
                        if (v && i < 5) refs.current[i + 1]?.focus();
                        if (newOtp.every(x => x)) verifyResetCode();
                      }
                    }} keyboardType="number-pad" maxLength={1} />
                  ))}
                </View>
              </>
            )}
            {resetStep === 'setpin' && (
              <>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Set New PIN</Text>
                <TextInput placeholder="New 6-digit PIN" secureTextEntry maxLength={6} style={inputStyle(theme)} onChangeText={setNewPin} />
                <TextInput placeholder="Confirm PIN" secureTextEntry maxLength={6} style={inputStyle(theme)} onChangeText={setConfirmPin} />
                <TouchableOpacity style={btnStyle(theme)} onPress={completeReset}>
                  <Text style={btnText(theme)}>Reset PIN</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ textAlign: 'center', color: theme.destructive, marginTop: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}