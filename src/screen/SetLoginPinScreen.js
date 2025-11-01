// src/screens/SetLoginPinScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { AuthService } from 'AuthFunction/authService';
import AuthHeader from 'component/AuthHeader';
import { btnStyle, btnText, inputStyle, otpBox} from 'constants/Styles';

export default function SetLoginPinScreen({ route, navigation }) {
  const { phone } = route.params;
  const isDark = useThem();
  const theme = isDark ? colors.dark : colors.light;
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');

  const submit = async () => {
    if (pin !== confirm || pin.length !== 6) {
      Alert.alert('Error', 'PINs do not match or invalid length');
      return;
    }
    const res = await AuthService.setPin(pin);
    if (res.success) {
      Alert.alert('Success', 'PIN set! Please login.', [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
    <StatusBar barStyle='light-content' backgroundColor='transparent' translucent/>
      <AuthHeader title="Set Login PIN" subtitle="Choose a 6-digit PIN" />
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
        <TouchableOpacity style={btnStyle(theme)} onPress={submit}>
          <Text style={btnText(theme)}>Set PIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}