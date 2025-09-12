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

const BASE_URL = 'http://localhost:5000/api/auth';
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
    pin: ['', '', '', '', '', ''], // Ensure pin is always an array
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requirePinOnOpen, setRequirePinOnOpen] = useState(true);
  const inputRefs = useRef([]);

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
                  pin: prev.pin || ['', '', '', '', '', ''], // Ensure pin is preserved
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
    if (
      !formData.phone ||
      !pin.trim() ||
      pin.length !== 6 ||
      !/^\d{6}$/.test(pin)
    ) {
      setError('Phone number and PIN must be exactly 6 digits.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      console.log('Sending login payload:', { phone: formData.phone, pin });
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formData.phone, pin }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        console.log('Login successful, navigating to MainTabs -> Home');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'MainTabs', state: { routes: [{ name: 'Home' }] } },
            ],
          })
        );
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
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
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

  return (
    <View style={[styles.container, { backgroundColor: themeColors.primary }]}>
      <AppImage style={{ width: 200, height: 200 }} />
      <View
        style={[styles.cardContainer, { backgroundColor: themeColors.primary }]}
      >
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.title, { color: themeColors.heading }]}>
            Login
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
            editable={!formData.phone}
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
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.linkText, { color: themeColors.button }]}>
              New user? Sign Up
            </Text>
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
    width: boxSize,
    height: boxSize,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 20,
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
  linkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
