import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { useWallet } from 'context/WalletContext';
import { verifyMyNIN } from 'AuthFunction/authService';

const InfoRow = ({ label, value, themeColors }) => (
  <View style={[styles.infoRow, { borderBottomColor: themeColors.border || '#F0F0F0' }]}>
    <Text style={[styles.infoLabel, { color: themeColors.subheading }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: themeColors.heading }]}>{value || '—'}</Text>
  </View>
);

export default function VerifyNINScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet, refreshWallet } = useWallet();
  const user = wallet?.user;

  const [nin, setNin] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pinVisible, setPinVisible] = useState(false);
  const [noPinSet, setNoPinSet] = useState(false);

  const alreadyVerified = !!user?.isNINVerified;

  const handleVerify = async () => {
    if (!nin || nin.length !== 11) {
      Alert.alert('Invalid NIN', 'NIN must be exactly 11 digits.');
      return;
    }
    if (!pin || pin.length !== 4) {
      Alert.alert('PIN required', 'Enter your 4-digit transaction PIN to proceed.');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setNoPinSet(false);
      const res = await verifyMyNIN(nin, pin);

      if (!res.success) {
        const msg = res.message || '';
        if (msg.toLowerCase().includes('pin not set') || msg.toLowerCase().includes('transaction pin')) {
          setNoPinSet(true);
          return;
        }
        Alert.alert('Verification Failed', msg || 'Could not verify NIN. Please try again.');
        return;
      }

      setResult(res);
      await refreshWallet();
    } catch (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('pin not set') || msg.toLowerCase().includes('transaction pin')) {
        setNoPinSet(true);
      } else {
        Alert.alert('Error', msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E0E0E0', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>NIN Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: alreadyVerified ? '#4CAF5020' : '#FF980020' }]}>
          <Ionicons
            name={alreadyVerified ? 'shield-checkmark' : 'shield-outline'}
            size={20}
            color={alreadyVerified ? '#4CAF50' : '#FF9800'}
          />
          <Text style={[styles.statusText, { color: alreadyVerified ? '#4CAF50' : '#FF9800' }]}>
            {alreadyVerified ? 'Your NIN is verified' : 'Identity not yet verified'}
          </Text>
        </View>

        {/* Description */}
        <View style={[styles.infoCard, { backgroundColor: `${themeColors.primary}10` }]}>
          <Ionicons name="information-circle-outline" size={18} color={themeColors.primary} />
          <Text style={[styles.infoCardText, { color: themeColors.heading }]}>
            Verifying your NIN increases your account trust level, may raise transaction limits, and is required for some services. A small verification fee is deducted from your wallet.
          </Text>
        </View>

        {/* No transaction PIN set — guide card */}
        {noPinSet && (
          <View style={[styles.noPinCard, { backgroundColor: '#FF980015', borderColor: '#FF980040' }]}>
            <Ionicons name="lock-open-outline" size={22} color="#FF9800" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.noPinTitle, { color: '#FF9800' }]}>Transaction PIN not set</Text>
              <Text style={[styles.noPinBody, { color: themeColors.heading }]}>
                NIN verification requires your 4-digit transaction PIN. You haven't set one yet.{'\n\n'}
                Tap the button below to create your PIN, then come back to complete verification.
              </Text>
              <TouchableOpacity
                style={[styles.noPinBtn, { backgroundColor: '#FF9800' }]}
                onPress={() => navigation.navigate('SetTransactionPin', { fromScreen: 'VerifyNIN' })}
              >
                <Ionicons name="lock-closed-outline" size={16} color="#FFF" />
                <Text style={styles.noPinBtnText}>Set Transaction PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!alreadyVerified && (
          <>
            {/* NIN input */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: themeColors.subheading }]}>YOUR NIN (11 digits)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.card, color: themeColors.heading, borderColor: themeColors.border || '#E0E0E0' }]}
                value={nin}
                onChangeText={t => setNin(t.replace(/\D/g, '').slice(0, 11))}
                placeholder="Enter your 11-digit NIN"
                placeholderTextColor={themeColors.subtext}
                keyboardType="number-pad"
                maxLength={11}
              />
              <Text style={[styles.fieldHint, { color: themeColors.subtext }]}>
                {nin.length}/11 digits
              </Text>
            </View>

            {/* Transaction PIN */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: themeColors.subheading }]}>TRANSACTION PIN</Text>
              <View style={styles.pinRow}>
                <TextInput
                  style={[styles.input, styles.pinInput, { backgroundColor: themeColors.card, color: themeColors.heading, borderColor: themeColors.border || '#E0E0E0' }]}
                  value={pin}
                  onChangeText={t => setPin(t.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4-digit PIN"
                  placeholderTextColor={themeColors.subtext}
                  keyboardType="number-pad"
                  secureTextEntry={!pinVisible}
                  maxLength={4}
                />
                <TouchableOpacity onPress={() => setPinVisible(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={pinVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={themeColors.subheading} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.verifyBtn, { backgroundColor: themeColors.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.verifyBtnText}>Verify NIN</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* Result */}
        {result?.success && result.data && (
          <View style={[styles.resultCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.resultHeader}>
              <View style={[styles.resultBadge, { backgroundColor: '#4CAF5020' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={[styles.resultTitle, { color: '#4CAF50' }]}>Verified</Text>
              </View>
            </View>
            <InfoRow label="First Name" value={result.data.firstName} themeColors={themeColors} />
            <InfoRow label="Middle Name" value={result.data.middleName} themeColors={themeColors} />
            <InfoRow label="Surname" value={result.data.surname} themeColors={themeColors} />
            <InfoRow label="Date of Birth" value={result.data.dateOfBirth} themeColors={themeColors} />
            <InfoRow label="Gender" value={result.data.gender} themeColors={themeColors} />
            <InfoRow label="Phone" value={result.data.phoneNumber} themeColors={themeColors} />
            <InfoRow label="State" value={result.data.residenceState} themeColors={themeColors} />
          </View>
        )}

        {alreadyVerified && (
          <View style={[styles.resultCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.alreadyText, { color: themeColors.subheading }]}>
              Your identity has already been verified. No further action is needed.
            </Text>
          </View>
        )}
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
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: { fontSize: 14, fontWeight: '600' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoCardText: { flex: 1, fontSize: 13, lineHeight: 20 },
  fieldWrap: { marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    flex: 1,
  },
  fieldHint: { fontSize: 11, marginTop: 4 },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pinInput: { flex: 1 },
  eyeBtn: { padding: 10 },
  verifyBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  resultCard: {
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  resultHeader: { marginBottom: 12 },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  resultTitle: { fontSize: 15, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  alreadyText: { fontSize: 14, lineHeight: 22, textAlign: 'center', padding: 8 },
  noPinCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  noPinTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  noPinBody: { fontSize: 13, lineHeight: 20 },
  noPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  noPinBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
