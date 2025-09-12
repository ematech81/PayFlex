import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import AppImage from 'component/allImage';

const BASE_URL = 'http://192.168.100.137:5000/api/auth'; // Updated to match SignUpScreen endpoint
const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;
const boxSize = cardWidth / 9; // Size for each OTP box

const VerifyCodeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, email, phone, onVerifySuccess } = route.params;
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

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
    const code = otp.join('');
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
      const response = await fetch(`${BASE_URL}/phone/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, otp: code }),
      });

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
      const response = await fetch(`${BASE_URL}/phone/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

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

  const handleOtpChange = (text, index) => {
    if (/[^0-9]/.test(text)) return; // Allow only digits
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move focus to next input
    if (text && index < 5) {
      inputRefs.current[index + 1].focus();
    }
    // Move focus to previous input on delete
    if (!text && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleKeyPress = ({ nativeEvent: { key } }, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.primary }]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <AppImage style={{ width: 200, height: 200 }} />
      <View
        style={[styles.cardContainer, { backgroundColor: themeColors.primary }]}
      >
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.title, { color: themeColors.heading }]}>
            OTP Verification
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.subheading }]}>
            Enter the 6-digit code sent to your phone
          </Text>
          {error ? (
            <Text style={[styles.error, { color: themeColors.destructive }]}>
              {error}
            </Text>
          ) : null}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: themeColors.background,
                    color: themeColors.heading,
                    borderColor: digit
                      ? themeColors.button
                      : themeColors.border,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                ref={(ref) => (inputRefs.current[index] = ref)}
                textAlign="center"
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.button }]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={themeColors.card} />
            ) : (
              <Text style={[styles.buttonText, { color: themeColors.card }]}>
                Verify OTP
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.resendButton,
              { backgroundColor: themeColors.button },
            ]}
            onPress={handleResendOTP}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending ? (
              <ActivityIndicator color={themeColors.card} />
            ) : (
              <Text style={[styles.buttonText, { color: themeColors.card }]}>
                {resendCooldown > 0
                  ? `Resend OTP (${resendCooldown}s)`
                  : 'Resend OTP'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  card: {
    width: cardWidth,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  otpInput: {
    width: boxSize,
    height: boxSize,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 20,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  resendButton: {
    width: '100%',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VerifyCodeScreen;
