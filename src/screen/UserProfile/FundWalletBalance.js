import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from 'component/SHARED';
import { useWallet } from 'context/WalletContext';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { STORAGE_KEYS } from 'utility/storageKeys';
import { PayStackApiIPAddress } from 'utility/apiIPAdress';

const BASE_URL = PayStackApiIPAddress; // /api/payment
const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS  = 5 * 60 * 1000; // 5 minutes

export default function FundWalletBalance({ navigation }) {
  const insets = useSafeAreaInsets();
  const isDarkMode  = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { refreshWallet } = useWallet();

  const [amount, setAmount]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [pollingRef, setPollingRef]   = useState(null);
  const [status, setStatus]           = useState('idle'); // idle | waiting | success | failed
  const [resultAmount, setResultAmount] = useState(0);

  const pollIntervalRef = useRef(null);
  const pollTimeoutRef  = useRef(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      clearInterval(pollIntervalRef.current);
      clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const selectQuickAmount = (val) => setAmount(String(val));

  const startPolling = async (reference) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

    const poll = async () => {
      try {
        const res  = await fetch(`${BASE_URL}/verify/${reference}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.status === 'success' || data.data?.status === 'success') {
          clearInterval(pollIntervalRef.current);
          clearTimeout(pollTimeoutRef.current);
          const paid = data.data?.amount ?? data.data?.amountAdded ?? 0;
          setResultAmount(paid);
          setStatus('success');
          refreshWallet();
          return;
        }
        if (data.data?.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          clearTimeout(pollTimeoutRef.current);
          setStatus('failed');
        }
      } catch {
        // network blip — keep polling
      }
    };

    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    pollTimeoutRef.current  = setTimeout(() => {
      clearInterval(pollIntervalRef.current);
      if (status !== 'success') setStatus('timeout');
    }, POLL_TIMEOUT_MS);

    setStatus('waiting');
    setPollingRef(reference);
  };

  const handleFundWallet = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 100) {
      Alert.alert('Invalid Amount', 'Minimum top-up amount is ₦100.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const res   = await fetch(`${BASE_URL}/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: numAmount }),
      });
      const data = await res.json();

      if (!data.success || !data.data?.checkout_url) {
        Alert.alert('Error', data.message || 'Failed to initialize payment. Please try again.');
        return;
      }

      // Open Kora Pay checkout in browser
      await Linking.openURL(data.data.checkout_url);

      // Start polling for confirmation
      await startPolling(data.data.reference);
    } catch (err) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetScreen = () => {
    setAmount('');
    setStatus('idle');
    setPollingRef(null);
    clearInterval(pollIntervalRef.current);
    clearTimeout(pollTimeoutRef.current);
  };

  // ── Waiting / success / failure states ────────────────────────────────────
  if (status === 'waiting') {
    return (
      <View style={[styles.root, { backgroundColor: themeColors.background }]}>
        <StatusBarComponent />
        <View style={[styles.stateScreen, { paddingTop: insets.top + 20 }]}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.stateTitle, { color: themeColors.heading }]}>
            Waiting for Payment
          </Text>
          <Text style={[styles.stateMsg, { color: themeColors.subheading }]}>
            Complete the payment in your browser. Your wallet will be credited automatically within seconds of confirmation.
          </Text>
          <TouchableOpacity style={[styles.outlineBtn, { borderColor: themeColors.primary }]} onPress={resetScreen}>
            <Text style={[styles.outlineBtnText, { color: themeColors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={[styles.root, { backgroundColor: themeColors.background }]}>
        <StatusBarComponent />
        <View style={[styles.stateScreen, { paddingTop: insets.top + 20 }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="checkmark-circle" size={56} color="#2E7D32" />
          </View>
          <Text style={[styles.stateTitle, { color: themeColors.heading }]}>Wallet Funded!</Text>
          <Text style={[styles.stateMsg, { color: themeColors.subheading }]}>
            ₦{Number(resultAmount || amount).toLocaleString()} has been added to your wallet.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: themeColors.primary }]}
            onPress={() => { resetScreen(); navigation.goBack(); }}
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'failed' || status === 'timeout') {
    return (
      <View style={[styles.root, { backgroundColor: themeColors.background }]}>
        <StatusBarComponent />
        <View style={[styles.stateScreen, { paddingTop: insets.top + 20 }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="close-circle" size={56} color="#C62828" />
          </View>
          <Text style={[styles.stateTitle, { color: themeColors.heading }]}>
            {status === 'timeout' ? 'Could Not Confirm' : 'Payment Failed'}
          </Text>
          <Text style={[styles.stateMsg, { color: themeColors.subheading }]}>
            {status === 'timeout'
              ? "We couldn't confirm your payment automatically. If you completed it, your wallet will be credited shortly. Check your transaction history."
              : 'Your payment did not go through. No money was deducted from your card.'}
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: themeColors.primary }]}
            onPress={resetScreen}
          >
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main fund wallet form ──────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />
      <ScreenHeader title="Fund Wallet" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Balance hint */}
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <Ionicons name="wallet-outline" size={22} color={themeColors.primary} />
          <Text style={[styles.cardText, { color: themeColors.subheading }]}>
            Funds are added to your PayFlex wallet instantly after payment.
          </Text>
        </View>

        {/* Quick amount selector */}
        <Text style={[styles.label, { color: themeColors.heading }]}>Select Amount</Text>
        {[QUICK_AMOUNTS.slice(0, 3), QUICK_AMOUNTS.slice(3)].map((row, ri) => (
          <View key={ri} style={styles.quickRow}>
            {row.map((q) => {
              const selected = amount === String(q);
              return (
                <TouchableOpacity
                  key={q}
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: selected ? themeColors.primary : themeColors.card,
                      borderColor: selected ? themeColors.primary : themeColors.border,
                    },
                  ]}
                  onPress={() => selectQuickAmount(q)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.quickChipText, { color: selected ? '#FFFFFF' : themeColors.heading }]}>
                    ₦{q.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Custom amount */}
        <Text style={[styles.label, { color: themeColors.heading, marginTop: 10 }]}>Or Enter Custom Amount</Text>
        <View style={[styles.inputRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.nairaSign, { color: themeColors.primary }]}>₦</Text>
          <TextInput
            style={[styles.input, { color: themeColors.heading }]}
            placeholder="0.00"
            placeholderTextColor={themeColors.subheading}
            keyboardType="numeric"
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
          />
        </View>
        {!!amount && Number(amount) < 100 && (
          <Text style={styles.errorText}>Minimum amount is ₦100</Text>
        )}

        {/* Summary row */}
        {!!amount && Number(amount) >= 100 && (
          <View style={[styles.summaryBox, { backgroundColor: `${themeColors.primary}10`, borderColor: themeColors.border }]}>
            <Text style={[styles.summaryText, { color: themeColors.subheading }]}>
              Amount to pay: <Text style={[styles.summaryBold, { color: themeColors.heading }]}>₦{Number(amount).toLocaleString()}</Text>
            </Text>
            <Text style={[styles.summaryText, { color: themeColors.subheading }]}>
              Wallet credit: <Text style={[styles.summaryBold, { color: themeColors.primary }]}>₦{Number(amount).toLocaleString()}</Text>
            </Text>
            <Text style={[styles.feeNote, { color: themeColors.subheading }]}>No convenience fee</Text>
          </View>
        )}

        {/* Pay button */}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { backgroundColor: themeColors.primary, marginTop: 24 },
            (loading || !amount || Number(amount) < 100) && styles.btnDisabled,
          ]}
          onPress={handleFundWallet}
          disabled={loading || !amount || Number(amount) < 100}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.primaryBtnText}>Proceed to Payment</Text>
          }
        </TouchableOpacity>

        <Text style={[styles.secureNote, { color: themeColors.subheading }]}>
          <Ionicons name="lock-closed-outline" size={13} color={themeColors.subheading} />{'  '}
          Payments are processed securely by Kora Pay
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  scroll:      { padding: 20 },
  stateScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  iconCircle:  { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stateTitle:  { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  stateMsg:    { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderRadius: 12, marginBottom: 20,
  },
  cardText:    { flex: 1, fontSize: 13, lineHeight: 19 },
  label:       { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  quickRow:  { flexDirection: 'row', gap: 10, marginBottom: 10 },
  quickChip: {
    flex: 1, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  quickChipText: { fontSize: 14, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4,
    marginBottom: 6,
  },
  nairaSign:   { fontSize: 20, fontWeight: '700', marginRight: 6 },
  input:       { flex: 1, fontSize: 22, fontWeight: '600', paddingVertical: 12 },
  errorText:   { fontSize: 12, color: '#E53935', marginBottom: 8 },
  summaryBox:  { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6, marginTop: 12 },
  summaryText: { fontSize: 14 },
  summaryBold: { fontWeight: '700' },
  feeNote:     { fontSize: 12, marginTop: 2 },
  primaryBtn: {
    borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  outlineBtn: {
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32,
    borderWidth: 1.5, alignItems: 'center', marginTop: 8,
  },
  outlineBtnText: { fontSize: 15, fontWeight: '600' },
  btnDisabled:    { opacity: 0.5 },
  secureNote:     { textAlign: 'center', fontSize: 12, marginTop: 12 },
});
