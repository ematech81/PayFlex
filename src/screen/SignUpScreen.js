import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';

export default function SignUpScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');

  const validateForm = () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('Please fill in all fields.');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (!/^\d+$/.test(phone) || phone.length < 8) {
      setError('Please enter a valid phone number.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch(
        'http://192.168.100.137:5000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName,
            lastName,
            phone,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // ✅ Successfully registered
        alert('Registration successful!');
        // Save token if needed
        // AsyncStorage.setItem("token", data.token);
        navigation.navigate('Login');
      } else {
        // ❌ Show error from backend
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  // const handleSignUp = () => {
  //   if (!validateForm()) return;

  //   // Call backend to register user & send code
  //   navigation.navigate('VerifyCode', { email, phone });
  // };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        label="First Name"
        mode="outlined"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />
      <TextInput
        label="Last Name"
        mode="outlined"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />
      <TextInput
        label="Phone Number"
        mode="outlined"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
      />
      <TextInput
        label="Email"
        mode="outlined"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        label="Password"
        mode="outlined"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <TextInput
        label="Confirm Password"
        mode="outlined"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
      />

      <Button mode="contained" onPress={handleSignUp} style={styles.button}>
        Sign Up
      </Button>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: { marginBottom: 15 },
  button: { marginVertical: 10, padding: 5 },
  link: { textAlign: 'center', color: 'blue', marginTop: 15 },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' },
});
