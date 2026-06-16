import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Linking, Animated, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { cacGetRegistrationStatus, cacDownloadCertificate } from 'AuthFunction/paymentService';

const POLL_INTERVAL = 30000; // 30 seconds
const TERMINAL_STATUSES = ['approved', 'queried', 'failed'];

const STATUS_CONFIG = {
  pending:    { label: 'Pending',            color: '#9CA3AF', icon: 'time-outline',          pulse: false },
  processing: { label: 'Processing',         color: '#3B82F6', icon: 'sync-outline',           pulse: true  },
  approved:   { label: 'Approved',           color: '#4CAF50', icon: 'checkmark-circle',       pulse: false },
  queried:    { label: 'Queried — Check Email', color: '#FF9800', icon: 'mail-outline',        pulse: false },
  failed:     { label: 'Failed',             color: '#EF4444', icon: 'close-circle',           pulse: false },
};

export default function CACStatusScreen({ navigation, route }) {
  const { transactionRef, businessName } = route.params || {};
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [certLoading, setCertLoading] = useState(false);
  const [certPin, setCertPin] = useState('');
  const [showCertPin, setShowCertPin] = useState(false);
  const [error,   setError]   = useState('');
  const pollRef   = useRef(null);
  const statusRef = useRef(null); // tracks terminal status for polling closure
  const pulse     = useRef(new Animated.Value(1)).current;

  const fetchStatus = useCallback(async (quiet = false) => {
    if (!transactionRef) return;
    if (!quiet) setLoading(true);
    try {
      const res = await cacGetRegistrationStatus(transactionRef);
      if (res?.success) {
        // Backend returns { success, registration, vasStatus } — not { success, data }
        const reg = res.registration || res.data || res;
        setData(reg);
        statusRef.current = reg?.status;
        setError('');
      } else {
        setError(res?.message || 'Could not fetch status');
      }
    } catch (e) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [transactionRef]);

  // Start polling on mount; use statusRef (not stale closure state) for terminal check
  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(() => {
      if (statusRef.current && TERMINAL_STATUSES.includes(statusRef.current)) {
        clearInterval(pollRef.current);
        return;
      }
      fetchStatus(true);
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []);

  // Pulse animation for "processing"
  useEffect(() => {
    if (data?.status === 'processing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [data?.status]);

  const handleDownloadCert = async () => {
    if (!certPin || certPin.length !== 4) {
      alert('Enter your 4-digit transaction PIN to download the certificate.');
      return;
    }
    setCertLoading(true);
    try {
      const res = await cacDownloadCertificate(certPin, transactionRef);
      const url = res?.data?.certificateUrl || res?.certificateUrl;
      if (url) {
        await Linking.openURL(url);
        setShowCertPin(false);
        setCertPin('');
      } else {
        alert('Certificate not yet available. Try again shortly.');
      }
    } catch (e) {
      alert(e.message || 'Could not download certificate');
    } finally {
      setCertLoading(false);
    }
  };

  const status  = data?.status || 'pending';
  const cfg     = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isApproved = status === 'approved';

  const InfoRow = ({ label, value }) => value ? (
    <View style={[styles.infoRow, { borderBottomColor: tc.border || '#F0F0F0' }]}>
      <Text style={[styles.infoLabel, { color: tc.subheading }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: tc.heading }]} numberOfLines={2}>{value}</Text>
    </View>
  ) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      <View style={[styles.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.heading }]}>Registration Status</Text>
        <TouchableOpacity onPress={() => fetchStatus()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="refresh-outline" size={22} color={tc.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Status badge */}
        <View style={[styles.statusCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Animated.View style={[styles.statusIconWrap, { backgroundColor: `${cfg.color}20`, opacity: cfg.pulse ? pulse : 1 }]}>
            <Ionicons name={cfg.icon} size={36} color={cfg.color} />
          </Animated.View>
          <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={[styles.statusSub, { color: tc.subheading }]}>
            {status === 'pending'    && 'Your application has been received and is awaiting review.'}
            {status === 'processing' && 'Your application is currently being processed by CAC.'}
            {status === 'approved'   && 'Congratulations! Your business name has been registered.'}
            {status === 'queried'    && 'CAC has a query on your application. Check your email for details.'}
            {status === 'failed'     && 'Your application could not be processed. Please contact support.'}
          </Text>
        </View>

        {/* Details */}
        {data && (
          <View style={[styles.detailCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <Text style={[styles.sectionTitle, { color: tc.subheading }]}>APPLICATION DETAILS</Text>
            <InfoRow label="Business Name"    value={businessName || data.registrationData?.proposedOption1} />
            <InfoRow label="Transaction Ref"  value={transactionRef} />
            <InfoRow label="RC Number"        value={data.rcNumber} />
            <InfoRow label="TIN"              value={data.tin} />
            <InfoRow label="Submitted"        value={data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null} />
            <InfoRow label="Last Updated"     value={data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null} />
            {Array.isArray(data.queries) && data.queries.length > 0 && (
              <InfoRow label="Query Reason" value={data.queries.map(q => q.reason || q.comment).filter(Boolean).join(' | ')} />
            )}
          </View>
        )}

        {/* Certificate / actions — only when approved */}
        {isApproved && (
          <View style={[styles.actionsCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <Text style={[styles.sectionTitle, { color: tc.subheading }]}>NEXT STEPS</Text>
            {showCertPin ? (
              <>
                <Text style={[styles.pinLabel, { color: tc.heading }]}>Enter Transaction PIN to download:</Text>
                <TextInput
                  style={[styles.pinInput, { backgroundColor: tc.background, color: tc.heading, borderColor: tc.border || '#E5E5EA' }]}
                  value={certPin} onChangeText={setCertPin}
                  placeholder="••••" placeholderTextColor={tc.subtext}
                  keyboardType="number-pad" secureTextEntry maxLength={4}
                />
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: tc.primary, opacity: (certLoading || certPin.length !== 4) ? 0.6 : 1 }]}
                  onPress={handleDownloadCert}
                  disabled={certLoading || certPin.length !== 4}
                  activeOpacity={0.85}
                >
                  {certLoading
                    ? <ActivityIndicator color="#FFF" />
                    : <>
                        <Ionicons name="document-text-outline" size={20} color="#FFF" />
                        <Text style={styles.actionBtnText}>Confirm & Download</Text>
                      </>
                  }
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowCertPin(false); setCertPin(''); }} style={{ alignItems: 'center', marginTop: 4 }}>
                  <Text style={[{ fontSize: 13, color: tc.subheading }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: tc.primary }]}
                onPress={() => setShowCertPin(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="document-text-outline" size={20} color="#FFF" />
                <Text style={styles.actionBtnText}>Download Certificate</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Loading / error */}
        {loading && !data && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={tc.primary} />
            <Text style={[styles.loadingText, { color: tc.subheading }]}>Fetching status…</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Polling notice */}
        {!TERMINAL_STATUSES.includes(status) && (
          <View style={[styles.pollingNote, { backgroundColor: `${tc.primary}10` }]}>
            <Ionicons name="sync-outline" size={14} color={tc.primary} />
            <Text style={[styles.pollingText, { color: tc.subheading }]}>
              Status updates automatically every 30 seconds.
            </Text>
          </View>
        )}

        {/* Back to services */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={[styles.backBtnText, { color: tc.primary }]}>← Back to Services</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48 },

  statusCard: {
    borderRadius: 16, borderWidth: 1, padding: 24,
    alignItems: 'center', marginBottom: 16, gap: 10,
  },
  statusIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  statusLabel: { fontSize: 20, fontWeight: '800' },
  statusSub:   { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  detailCard:  { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  sectionTitle:{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  infoLabel:   { fontSize: 13, flex: 1 },
  infoValue:   { fontSize: 13, fontWeight: '600', flex: 1.5, textAlign: 'right' },

  actionsCard:  { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginBottom: 10 },
  actionBtnText:{ color: '#FFF', fontSize: 15, fontWeight: '700' },
  pinLabel:     { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  pinInput:     { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 20, letterSpacing: 8, textAlign: 'center', marginBottom: 12 },

  centered:    { paddingVertical: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  errorBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText:   { fontSize: 13, color: '#EF4444', flex: 1 },

  pollingNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 20 },
  pollingText: { fontSize: 12, flex: 1 },

  backBtn:     { alignItems: 'center', paddingVertical: 8 },
  backBtnText: { fontSize: 15, fontWeight: '600' },
});
