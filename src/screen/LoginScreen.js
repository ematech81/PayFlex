import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Switch,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  CommonActions,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import AppImage from 'component/allImage';
import { useWallet } from 'context/WalletContext';

const BASE_URL = 'http://192.168.100.137:5000/api/auth';
const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;
const boxSize = cardWidth / 8;

const LoginScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { phone: initialPhone = '', fromSignup = false } = route.params || {};
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [formData, setFormData] = useState({
    phone: initialPhone,
    pin: ['', '', '', '', '', ''],
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requirePinOnOpen, setRequirePinOnOpen] = useState(true);
  const { wallet, login } = useWallet();

  const inputRefs = useRef([]);

  // Temporary useEffect to clear AsyncStorage for testing
  // useEffect(() => {
  //   const clearAsyncStorage = async () => {
  //     try {
  //       await AsyncStorage.clear();
  //       console.log('AsyncStorage cleared for testing');
  //     } catch (error) {
  //       console.error('Error clearing AsyncStorage:', error);
  //     }
  //   };
  //   clearAsyncStorage();
  // }, []); // Comment out this useEffect after testing

  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        const pinSetting = await AsyncStorage.getItem('requirePinOnOpen');
        const requirePin = pinSetting !== null ? JSON.parse(pinSetting) : true;
        setRequirePinOnOpen(requirePin);

        if (!requirePin && !fromSignup) {
          const token = await AsyncStorage.getItem('token');
          console.log('Auto-login token:', token);
          if (token) {
            const response = await fetch(`${BASE_URL}/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
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
              setFormData((prev) => ({ ...prev, phone: '' })); // Clear phone field
            }
          } else {
            console.log('No token found, staying on Login');
          }
        } else {
          console.log('PIN required or from signup, staying on Login');
          if (!initialPhone && !fromSignup) {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
              const user = JSON.parse(userData);
              console.log('Retrieved user from AsyncStorage:', user);
              if (user.phone) {
                setFormData((prev) => ({
                  ...prev,
                  phone: user.phone,
                  pin: prev.pin || ['', '', '', '', '', ''],
                }));
              }
            }
          }
        }
      } catch (error) {
        console.error('Auto-login error:', error);
      }
    };
    checkAutoLogin();
  }, [navigation, fromSignup, initialPhone]);

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
    const pin = formData.pin.join('');
    console.log('Starting login process', {
      phone: formData.phone,
      pin,
      pinLength: pin.length,
      isNumeric: /^\d{6}$/.test(pin),
    });
    if (
      !formData.phone ||
      !pin.trim() ||
      pin.length !== 6 ||
      !/^\d{6}$/.test(pin)
    ) {
      console.log('Validation failed: Phone or PIN invalid');
      setError('Phone number and PIN must be exactly 6 digits.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Verify login PIN
      console.log('Verifying login PIN:', { phone: formData.phone, pin });
      const pinResponse = await fetch(`${BASE_URL}/verify-login-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formData.phone, pin }),
      });

      const pinData = await pinResponse.json();
      console.log('Verify login PIN response:', {
        status: pinResponse.status,
        data: pinData,
      });

      if (!pinResponse.ok || !pinData.success) {
        console.log('PIN verification failed:', pinData.message);
        setError(pinData.message || 'Invalid Login PIN');
        setIsLoading(false);
        return;
      }

      // Proceed with login
      console.log('Sending login payload:', { phone: formData.phone, pin });
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formData.phone, pin }),
      });

      const data = await response.json();
      console.log('Login response:', { status: response.status, data });

      if (response.ok) {
        // Update WalletContext with token and user
        console.log('Login successful, updating WalletContext');
        await login(data.token, data.user);
        console.log('Navigating to MainTabs -> Home');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'MainTabs', state: { routes: [{ name: 'Home' }] } },
            ],
          })
        );
      } else if (data.code === 'PHONE_NOT_VERIFIED') {
        console.log('Phone not verified:', data.message);
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
        console.log('Login failed:', data.message);
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error.message);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
      console.log('Login process completed');
    }
  };

  const handlePinChange = (text, index) => {
    if (/[^0-9]/.test(text)) return;
    const newPin = [...formData.pin];
    newPin[index] = text;
    setFormData((prev) => ({
      ...prev,
      pin: newPin,
    }));

    if (text && index < 5) {
      inputRefs.current[index + 1].focus();
    }
    if (!text && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleKeyPress = ({ nativeEvent: { key } }, index) => {
    if (key === 'Backspace' && !formData.pin[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSignUpNavigation = () => {
    try {
      console.log('Attempting to navigate to SignUp');
      navigation.navigate('SignUp');
      console.log('Navigation to SignUp triggered');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        'Failed to navigate to Sign Up screen. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.card }]}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="#4a00e0"
      />

      <View
        style={[styles.contentHeader, { backgroundColor: themeColors.primary }]}
      >
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <AppImage />
          <Text style={[styles.welcomeText, { color: themeColors.card }]}>
            Welcome Back Emmanuel
          </Text>
          <Text style={[styles.text, { color: themeColors.border }]}>
            All In One App, Pay Securely With One Click
          </Text>
        </View>
      </View>

      <View
        style={[styles.cardContainer, { backgroundColor: themeColors.primary }]}
      >
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <Text
            style={[styles.textInstruction, { color: themeColors.heading }]}
          >
            Please Enter Your 6 digits PIN to Login
          </Text>
          {error ? (
            <Text style={[styles.error, { color: themeColors.destructive }]}>
              {error}
            </Text>
          ) : null}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themeColors.background,
                color: themeColors.heading,
              },
            ]}
            placeholder="Phone Number"
            placeholderTextColor={themeColors.subtext}
            value={formData.phone}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, phone: text }))
            }
            keyboardType="phone-pad"
            // editable={!formData.phone}
          />
          <View style={styles.pinContainer}>
            {(formData.pin || ['', '', '', '', '', '']).map((digit, index) => (
              <TextInput
                key={index}
                style={[
                  styles.pinInput,
                  {
                    backgroundColor: themeColors.background,
                    color: themeColors.heading,
                    borderColor: digit
                      ? themeColors.button
                      : themeColors.border,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handlePinChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                ref={(ref) => (inputRefs.current[index] = ref)}
                textAlign="center"
              />
            ))}
          </View>
          <View style={styles.switchContainer}>
            <Text
              style={[styles.switchLabel, { color: themeColors.subheading }]}
            >
              Require PIN on app open
            </Text>
            <Switch
              value={requirePinOnOpen}
              onValueChange={handleTogglePinRequirement}
              trackColor={{
                false: themeColors.subtext,
                true: themeColors.button,
              }}
              thumbColor={themeColors.card}
            />
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.button }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={themeColors.card} />
            ) : (
              <Text style={[styles.buttonText, { color: themeColors.card }]}>
                Login
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleSignUpNavigation}
          >
            <Text style={[styles.linkText, { color: themeColors.button }]}>
              New user? Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentHeader: {
    padding: 20,
    width: '100%',
    minHeight: '45%',
    alignItems: 'center',
    justifyCntent: 'center',
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 20,
    marginVertical: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  textInstruction: {
    fontSize: 15,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 15,
  },
  card: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  error: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  pinInput: {
    width: 43,
    height: 43,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 14,
  },
  button: {
    width: '100%',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 10,
  },
  linkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
    marginBottom: 10,
  },
});

export default LoginScreen;
