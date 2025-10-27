import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import AppImage from 'component/allImage';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;
const boxSize = cardWidth / 8;
const BASE_URL = 'http://192.168.100.210:5000/api/auth';
// const BASE_URL = 'http://192.168.100.210:5000/api/auth';

const SignUpScreen = () => {
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const pinRefs = useRef([]);
  const confirmPinRefs = useRef([]);

  const handleRegister = async () => {
    const { firstName, lastName, email, phone, password, confirmPassword } =
      formData;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserId(data.userId);
        navigation.navigate('VerifyCode', {
          email,
          phone,
          userId: data.userId,
          onVerifySuccess: async (token, userData) => {
            try {
              console.log('Storing token and user:', { token, user: userData });
              setToken(token);
              setUser(userData);
              await AsyncStorage.setItem('token', token);
              await AsyncStorage.setItem('user', JSON.stringify(userData));
              await AsyncStorage.setItem(
                'requirePinOnOpen',
                JSON.stringify(true)
              );
              console.log(
                'Token, user, and requirePinOnOpen stored successfully'
              );
              setModalVisible(true);
            } catch (storageError) {
              console.error('AsyncStorage save error:', storageError);
              setError('Failed to store user data. Please try again.');
            }
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

  const handlePinChange = (text, index, isConfirm = false) => {
    if (/[^0-9]/.test(text)) return;
    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = text;
    isConfirm ? setConfirmPin(newPin) : setPin(newPin);

    if (text && index < 5) {
      (isConfirm ? confirmPinRefs : pinRefs).current[index + 1].focus();
    }
    if (!text && index > 0) {
      (isConfirm ? confirmPinRefs : pinRefs).current[index - 1].focus();
    }
  };

  const handleKeyPress = (
    { nativeEvent: { key } },
    index,
    isConfirm = false
  ) => {
    if (
      key === 'Backspace' &&
      !(isConfirm ? confirmPin : pin)[index] &&
      index > 0
    ) {
      (isConfirm ? confirmPinRefs : pinRefs).current[index - 1].focus();
    }
  };

  const handlePinSubmit = async () => {
    const pinStr = pin.join('');
    const confirmPinStr = confirmPin.join('');
    if (pinStr.length !== 6 || confirmPinStr.length !== 6) {
      setError('PIN must be 6 digits.');
      return;
    }
    if (pinStr !== confirmPinStr) {
      setError('PINs do not match.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      console.log('Sending PIN to set:', { userId, pin: pinStr, token });
      const response = await fetch(`${BASE_URL}/set-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, pin: pinStr }),
      });

      const data = await response.json();
      console.log('Set PIN response:', data);

      if (response.ok) {
        setModalVisible(false);
        setPin(['', '', '', '', '', '']);
        setConfirmPin(['', '', '', '', '', '']);
        navigation.navigate('Login', {
          phone: formData.phone,
          fromSignup: true,
        });
      } else {
        setError(data.message || 'Failed to set PIN. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while setting PIN. Please try again.');
      console.error('Set PIN error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="#4a00e0"
      />

      <AppImage style={{ width: 200, height: 200 }} />
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.primary }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View
          style={[
            styles.cardContainer,
            { backgroundColor: themeColors.primary },
          ]}
        >
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.title, { color: themeColors.heading }]}>
              Sign Up
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
              placeholder="First Name"
              placeholderTextColor={themeColors.subtext}
              value={formData.firstName}
              onChangeText={(text) =>
                setFormData({ ...formData, firstName: text })
              }
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.background,
                  color: themeColors.heading,
                },
              ]}
              placeholder="Last Name"
              placeholderTextColor={themeColors.subtext}
              value={formData.lastName}
              onChangeText={(text) =>
                setFormData({ ...formData, lastName: text })
              }
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.background,
                  color: themeColors.heading,
                },
              ]}
              placeholder="Email"
              placeholderTextColor={themeColors.subtext}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.background,
                  color: themeColors.heading,
                },
              ]}
              placeholder="Phone"
              placeholderTextColor={themeColors.subtext}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.background,
                  color: themeColors.heading,
                },
              ]}
              placeholder="Password"
              placeholderTextColor={themeColors.subtext}
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              secureTextEntry
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.background,
                  color: themeColors.heading,
                },
              ]}
              placeholder="Confirm Password"
              placeholderTextColor={themeColors.subtext}
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, confirmPassword: text })
              }
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.button }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={themeColors.card} />
              ) : (
                <Text style={[styles.buttonText, { color: themeColors.card }]}>
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkText, { color: themeColors.button }]}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal for PIN Creation */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[styles.modalCard, { backgroundColor: themeColors.card }]}
          >
            <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
              Create Login PIN
            </Text>
            <Text
              style={[styles.modalSubtitle, { color: themeColors.subheading }]}
            >
              Create a 6-digit PIN for login authorization
            </Text>
            {error ? (
              <Text style={[styles.error, { color: themeColors.destructive }]}>
                {error}
              </Text>
            ) : null}
            <View style={styles.pinContainer}>
              {pin.map((digit, index) => (
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
                  ref={(ref) => (pinRefs.current[index] = ref)}
                  textAlign="center"
                  secureTextEntry
                />
              ))}
            </View>
            <Text
              style={[styles.modalSubtitle, { color: themeColors.subheading }]}
            >
              Confirm PIN
            </Text>
            <View style={styles.pinContainer}>
              {confirmPin.map((digit, index) => (
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
                  onChangeText={(text) => handlePinChange(text, index, true)}
                  onKeyPress={(e) => handleKeyPress(e, index, true)}
                  keyboardType="numeric"
                  maxLength={1}
                  ref={(ref) => (confirmPinRefs.current[index] = ref)}
                  textAlign="center"
                  secureTextEntry
                />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.button }]}
              onPress={handlePinSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={themeColors.card} />
              ) : (
                <Text style={[styles.buttonText, { color: themeColors.card }]}>
                  Submit PIN
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    // paddingBottom: 100, // Extra padding to ensure content is scrollable above keyboard
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
    width: 45,
    height: 45,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'center',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default SignUpScreen;
