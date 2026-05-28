import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import PinInput from 'component/SHARED/INPUT/pinInput';
import { useWallet } from 'context/WalletContext';
import { deleteAccount } from 'AuthFunction/authService';

const CONSEQUENCES = [
  'Your wallet balance will be permanently lost',
  'All transaction history will be deleted',
  'Your referral code and earnings will be forfeited',
  'This action cannot be undone',
];

export default function DeleteAccountScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { logout } = useWallet();

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = () => {
    if (!confirmed) {
      Alert.alert('Please confirm', 'Check the confirmation box before proceeding.');
      return;
    }
    if (!pin || pin.length !== 6) {
      Alert.alert('PIN required', 'Enter your 6-digit login PIN to confirm deletion.');
      return;
    }

    Alert.alert(
      'Final confirmation',
      'Are you absolutely sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: performDelete,
        },
      ]
    );
  };

  const performDelete = async () => {
    try {
      setLoading(true);
      const result = await deleteAccount(pin);
      if (!result.success) {
        Alert.alert('Error', result.message || 'Failed to delete account');
        return;
      }
      await logout();
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E0E0E0' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Delete Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning icon */}
        <View style={[styles.warningCircle, { backgroundColor: '#FF4D4D20' }]}>
          <Ionicons name="warning" size={48} color="#FF4D4D" />
        </View>

        <Text style={[styles.title, { color: themeColors.heading }]}>Delete your account?</Text>
        <Text style={[styles.subtitle, { color: themeColors.subheading }]}>
          This will permanently erase all your data from PayFlex. There is no way to recover your account after this.
        </Text>

        {/* Consequences list */}
        <View style={[styles.consequencesCard, { backgroundColor: '#FF4D4D10', borderColor: '#FF4D4D30' }]}>
          {CONSEQUENCES.map((c, i) => (
            <View key={i} style={styles.consequenceRow}>
              <Ionicons name="close-circle" size={18} color="#FF4D4D" />
              <Text style={[styles.consequenceText, { color: themeColors.heading }]}>{c}</Text>
            </View>
          ))}
        </View>

        {/* Confirmation checkbox */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setConfirmed(v => !v)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, {
            backgroundColor: confirmed ? '#FF4D4D' : 'transparent',
            borderColor: confirmed ? '#FF4D4D' : themeColors.subheading,
          }]}>
            {confirmed && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
          <Text style={[styles.checkLabel, { color: themeColors.subheading }]}>
            I understand this action is permanent and cannot be reversed
          </Text>
        </TouchableOpacity>

        {/* PIN entry */}
        <View style={styles.pinSection}>
          <Text style={[styles.pinLabel, { color: themeColors.heading }]}>
            Enter your login PIN to confirm
          </Text>
          <PinInput
            value={pin}
            onChangeText={setPin}
            maxLength={6}
          />
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={[styles.deleteBtn, { opacity: loading ? 0.6 : 1 }]}
          onPress={handleDelete}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteBtnText}>
            {loading ? 'Deleting…' : 'Delete My Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelText, { color: themeColors.primary }]}>Cancel, keep my account</Text>
        </TouchableOpacity>
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
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40, alignItems: 'center' },
  warningCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  consequencesCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  consequenceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  consequenceText: { fontSize: 14, flex: 1, lineHeight: 20 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkLabel: { flex: 1, fontSize: 14, lineHeight: 20 },
  pinSection: { width: '100%', marginBottom: 24 },
  pinLabel: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  deleteBtn: {
    backgroundColor: '#FF4D4D',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
