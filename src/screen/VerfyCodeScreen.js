import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { TextInput, Button } from 'react-native-paper';

export default function VerifyCodeScreen({ navigation, route }) {
  const { email, phone } = route.params || {};
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (!code.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    if (code.length < 4) {
      setError('Code must be at least 4 digits.');
      return;
    }
    setError('');

    // Call backend to verify
    console.log(`Verifying code: ${code} for ${email} / ${phone}`);
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Account</Text>
      <Text style={styles.subtitle}>
        A verification code was sent to {phone} and {email}.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        label="Enter Verification Code"
        mode="outlined"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        style={styles.input}
      />

      <Button mode="contained" onPress={handleVerify} style={styles.button}>
        Verify
      </Button>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>Go back to Sign Up</Text>
      </TouchableOpacity>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: { marginBottom: 15 },
  button: { marginVertical: 10, padding: 5 },
  link: { textAlign: 'center', color: 'blue', marginTop: 15 },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' },
});
