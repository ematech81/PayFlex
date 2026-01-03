// src/screens/SetLoginPinScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert, 
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { AuthService } from 'AuthFunction/authService';
import AuthHeader from 'component/AuthHeader';
import { btnStyle, btnText, inputStyle } from 'constants/Styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from 'utility/storageKeys';

export default function SetLoginPinScreen({ route, navigation }) {
  const { phone, userId } = route.params || {}; // ✅ include userId
  const isDark = useThem();
  const theme = isDark ? colors.dark : colors.light;

  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (pin.length !== 6 || confirm.length !== 6) {
      Alert.alert('Error', 'PIN must be 6 digits');
      return;
    }

    if (pin !== confirm) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    try {
      setLoading(true);

      // ✅ Send both phone and userId to backend
      const res = await AuthService.setPin({ userId, pin: pin.toString() });

      setLoading(false);

      if (res.success) {
        await AsyncStorage.setItem(STORAGE_KEYS.PHONE, phone);
        Alert.alert('Success', 'PIN set successfully!', [
          {
            text: 'OK',
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
          },
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to set PIN');
      }
    } catch (error) {
      console.error('❌ Set PIN error:', error);
      setLoading(false);
      Alert.alert('Network Error', 'Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <AuthHeader title="Set Login PIN" subtitle="" />
<View style={{padding: 16, marginTop: 30, marginBottom: 10}}><Text style={{fontSize: 17,color: theme.subtext}}>Create 6-Digit PIN for login</Text></View>
      <View style={{ padding: 24 }}>
        <TextInput
          placeholder="Enter 6-digit PIN"
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          style={inputStyle(theme)}
        />

        <TextInput
          placeholder="Confirm PIN"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          style={inputStyle(theme)}
        />

        <TouchableOpacity
          style={[
            btnStyle(theme),
            { opacity: loading ? 0.6 : 1 },
          ]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.textLight} />
          ) : (
            <Text style={btnText(theme)}>Set PIN</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
