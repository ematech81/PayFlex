import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Modal, Portal } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUpScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // 192.168.100.137

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !phone || !password) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(
        'http://192.168.43.99:5000/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, email, phone, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUserId(data.userId);
        navigation.navigate('VerifyCode', {
          email,
          phone,
          userId: data.userId,
          onVerifySuccess: (token, userData) => {
            setToken(token);
            setUser(userData);
            setModalVisible(true);
          },
        });
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again later.');
      console.error('Register error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPin = async () => {
    if (!pin || !confirmPin) {
      setError('Please enter and confirm your PIN.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/set-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, pin }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setModalVisible(false);
        navigation.navigate('Login');
      } else {
        setError(data.message || 'Failed to set PIN. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again later.');
      console.error('Set PIN error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        label="First Name"
        mode="outlined"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
        disabled={isLoading}
      />
      <TextInput
        label="Last Name"
        mode="outlined"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
        disabled={isLoading}
      />
      <TextInput
        label="Email"
        mode="outlined"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
        disabled={isLoading}
      />
      <TextInput
        label="Phone Number"
        mode="outlined"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
        disabled={isLoading}
      />
      <TextInput
        label="Password"
        mode="outlined"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        disabled={isLoading}
      />

      <Button
        mode="contained"
        onPress={handleRegister}
        style={styles.button}
        disabled={isLoading}
        loading={isLoading}
      >
        Register
      </Button>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Set Your PIN</Text>
          <Text style={styles.modalSubtitle}>
            Create a 6-digit PIN for login and transactions.
          </Text>
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
          <TextInput
            label="Confirm PIN"
            mode="outlined"
            value={confirmPin}
            onChangeText={(text) => setConfirmPin(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
            disabled={isLoading}
          />

          <Button
            mode="contained"
            onPress={handleSetPin}
            style={styles.button}
            disabled={isLoading}
            loading={isLoading}
          >
            Set PIN
          </Button>
        </Modal>
      </Portal>
    </View>
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
    fontSize: 16,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 20,
    textAlign: 'center',
  },
});
