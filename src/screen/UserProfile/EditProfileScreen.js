import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { useWallet } from 'context/WalletContext';
import { updateProfile } from 'AuthFunction/authService';

const Field = ({ label, value, onChangeText, placeholder, keyboardType, themeColors, error }) => (
  <View style={styles.fieldContainer}>
    <Text style={[styles.label, { color: themeColors.subheading }]}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: themeColors.card,
          color: themeColors.heading,
          borderColor: error ? '#FF6B6B' : themeColors.border || '#E0E0E0',
        },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={themeColors.subtext}
      keyboardType={keyboardType || 'default'}
      autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

export default function EditProfileScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, refreshWallet } = useWallet();
  const user = wallet?.user;

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!firstName.trim() || firstName.trim().length < 2) e.firstName = 'Min 2 characters';
    if (!lastName.trim() || lastName.trim().length < 2) e.lastName = 'Min 2 characters';
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Invalid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {};
    if (firstName.trim() !== user?.firstName) payload.firstName = firstName.trim();
    if (lastName.trim() !== user?.lastName) payload.lastName = lastName.trim();
    if (email.trim() !== user?.email) payload.email = email.trim();

    if (Object.keys(payload).length === 0) {
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const result = await updateProfile(payload);
      if (!result.success) {
        Alert.alert('Error', result.message || 'Failed to update profile');
        return;
      }
      await refreshWallet();
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E0E0E0' }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.saveBtn, { color: loading ? themeColors.subtext : themeColors.primary }]}>
            {loading ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar placeholder */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.avatarText}>
              {firstName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.avatarHint, { color: themeColors.subheading }]}>
            Photo upload coming soon
          </Text>
        </View>

        <Field
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First name"
          themeColors={themeColors}
          error={errors.firstName}
        />
        <Field
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last name"
          themeColors={themeColors}
          error={errors.lastName}
        />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          keyboardType="email-address"
          themeColors={themeColors}
          error={errors.email}
        />

        {/* Read-only phone */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: themeColors.subheading }]}>Phone</Text>
          <View style={[styles.input, styles.readOnly, { backgroundColor: themeColors.card, borderColor: themeColors.border || '#E0E0E0' }]}>
            <Text style={[styles.readOnlyText, { color: themeColors.subtext }]}>
              {user?.phone || '—'}
            </Text>
            <Ionicons name="lock-closed-outline" size={16} color={themeColors.subtext} />
          </View>
          <Text style={[styles.hint, { color: themeColors.subtext }]}>
            Phone number cannot be changed
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  saveBtn: { fontSize: 16, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  avatarHint: { fontSize: 13 },
  fieldContainer: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  readOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readOnlyText: { fontSize: 16 },
  hint: { fontSize: 12, marginTop: 4 },
  errorText: { fontSize: 12, color: '#FF6B6B', marginTop: 4 },
});
