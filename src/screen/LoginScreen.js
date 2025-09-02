import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

export default function LoginScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requirePinOnOpen, setRequirePinOnOpen] = useState(true);

  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        const pinSetting = await AsyncStorage.getItem('requirePinOnOpen');
        const requirePin = pinSetting !== null ? JSON.parse(pinSetting) : true;
        console.log('Require PIN on open:', requirePin);
        setRequirePinOnOpen(requirePin);

        if (!requirePin) {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            console.log('Checking token validity:', token);
            const response = await fetch(
              'http://192.168.43.99:5000/api/auth/me',
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (response.ok) {
              console.log('Token valid, navigating to MainTabs -> Home');
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [
                    { name: 'MainTabs', state: { routes: [{ name: 'Home' }] } },
                  ],
                })
              );
            } else {
              console.log('Token invalid or expired, clearing AsyncStorage');
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
            }
          } else {
            console.log('No token found, staying on Login');
          }
        } else {
          console.log('PIN required, staying on Login');
        }
      } catch (error) {
        console.error('Auto-login error:', error);
      }
    };
    checkAutoLogin();
  }, [navigation]);

  const handleTogglePinRequirement = async () => {
    const newValue = !requirePinOnOpen;
    setRequirePinOnOpen(newValue);
    try {
      await AsyncStorage.setItem('requirePinOnOpen', JSON.stringify(newValue));
      console.log('Set requirePinOnOpen:', newValue);
    } catch (error) {
      console.error('Save pin setting error:', error);
    }
  };

  const handleLogin = async () => {
    if (!pin.trim() || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Sending PIN login payload:', { pin });
      const response = await fetch('http://localhost:5000/api/auth/login-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();
      console.log('PIN login response:', data);

      if (response.ok) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'MainTabs', state: { routes: [{ name: 'Home' }] } },
            ],
          })
        );
      } else if (
        response.status === 401 &&
        data.message === 'Token expired, please log in again'
      ) {
        setError('Session expired. Please log in again.');
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } else if (data.code === 'PHONE_NOT_VERIFIED') {
        setError(data.message);
        Alert.alert('Phone Not Verified', data.message, [
          {
            text: 'Verify Now',
            onPress: () =>
              navigation.navigate('VerifyCode', {
                userId: data.userId,
                phone: data.phone,
                email: data.user?.email || '',
              }),
          },
          { text: 'Cancel' },
        ]);
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again later.');
      console.error('PIN login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Text style={styles.title}>Login</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        label="Enter 6-Digit PIN"
        mode="outlined"
        value={pin}
        onChangeText={(text) => setPin(text.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={6}
        style={styles.input}
        disabled={isLoading}
      />

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Require PIN on next app open</Text>
        <Switch
          value={requirePinOnOpen}
          onValueChange={handleTogglePinRequirement}
          disabled={isLoading}
        />
      </View>

      <Button
        mode="contained"
        onPress={handleLogin}
        style={styles.button}
        disabled={isLoading}
        loading={isLoading}
      >
        Login
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('SignUp')}
        style={styles.button}
        disabled={isLoading}
      >
        Sign Up
      </Button>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginVertical: 10,
    padding: 5,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
});
