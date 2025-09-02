import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';

export default function VerifyCodeScreen({ navigation, route }) {
  const { email, phone, userId, onVerifySuccess } = route.params || {};
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    if (code.length !== 6) {
      setError('Code must be exactly 6 digits.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(
        'http://192.168.43.99:5000/api/auth/phone/verify-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, otp: code }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log('Verification response:', data);
        onVerifySuccess(data.token, data.user);
        navigation.goBack();
      } else {
        setError(data.message || 'Failed to verify OTP. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again later.');
      console.error('Verify OTP error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) {
      Alert.alert(
        'Please Wait',
        `Please wait ${resendCooldown}s before requesting another code.`
      );
      return;
    }

    setError('');
    setIsResending(true);

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/phone/resend-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'A new verification code has been sent to your phone.'
        );
      } else {
        if (response.status === 429) {
          const match = data.message.match(/(\d+)s/);
          const waitTime = match ? parseInt(match[1], 10) : 30;
          setResendCooldown(waitTime);
          setError(data.message);
        } else {
          setError(data.message || 'Failed to resend OTP. Please try again.');
        }
      }
    } catch (error) {
      setError('An error occurred while resending OTP. Please try again.');
      console.error('Resend OTP error:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phone Verification</Text>
      <Text style={styles.subtitle}>
        We sent a verification code to {phone} and {email}. Enter the code to
        verify your phone number.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        label="Enter Verification Code"
        mode="outlined"
        keyboardType="number-pad"
        value={code}
        onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
        maxLength={6}
        style={styles.input}
        disabled={isLoading}
      />

      <Button
        mode="contained"
        onPress={handleVerify}
        style={styles.button}
        disabled={isLoading}
        loading={isLoading}
      >
        Verify Phone
      </Button>

      <Button
        mode="outlined"
        onPress={handleResendOTP}
        style={styles.resendButton}
        disabled={isResending || isLoading || resendCooldown > 0}
        loading={isResending}
      >
        {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
      </Button>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Back to Sign Up</Text>
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
  input: {
    marginBottom: 15,
  },
  button: {
    marginVertical: 10,
    padding: 5,
  },
  resendButton: {
    marginVertical: 10,
    padding: 5,
    borderColor: '#6200ee',
  },
  link: {
    textAlign: 'center',
    color: 'blue',
    marginTop: 15,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});
