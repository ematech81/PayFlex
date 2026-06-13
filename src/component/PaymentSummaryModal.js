import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from 'CONSTANT/formatCurrency';

/**
 * Reusable bottom-sheet modal for the final "review & pay" step of any
 * MERPI service flow (Bus, Events, Cinema, Hotels, etc.).
 *
 * Shows an order-summary card (title + rows + total + wallet balance),
 * a 4-digit transaction PIN pad, and a confirm/pay button.
 */
export default function PaymentSummaryModal({
  visible,
  onClose,
  tc,
  title = 'Order Summary',
  rows = [],            // [{ label, value }]
  totalLabel = 'Total',
  totalAmount = 0,
  walletBalance = 0,
  pin = '',
  onPinChange,
  onConfirm,
  confirmLabel,
  loading = false,
}) {
  const insufficient = walletBalance < totalAmount;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ss.overlay}>
        <Pressable style={ss.backdrop} onPress={onClose} />
        <View style={[ss.sheet, { backgroundColor: tc.background }]}>
          <View style={ss.handleRow}>
            <View style={[ss.handle, { backgroundColor: tc.border || '#E5E5EA' }]} />
            <TouchableOpacity onPress={onClose} style={ss.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={tc.heading} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Order summary */}
            <View style={ss.payCard}>
              <Text style={ss.payTitle}>{title}</Text>
              {rows.map((r, i) => (
                <View key={i} style={ss.payRow}>
                  <Text style={ss.payLabel}>{r.label}</Text>
                  <Text style={ss.payVal}>{r.value}</Text>
                </View>
              ))}
              <View style={[ss.payRow, ss.payTotal]}>
                <Text style={ss.payTotalLabel}>{totalLabel}</Text>
                <Text style={ss.payTotalAmt}>{formatCurrency(totalAmount, 'NGN')}</Text>
              </View>
              <View style={ss.walletRow}>
                <Ionicons name="wallet-outline" size={15} color="#FFF" />
                <Text style={ss.walletLabel}>Wallet Balance</Text>
                <Text style={[ss.walletBal, { color: insufficient ? '#FFB3B3' : '#7FFFB3' }]}>
                  {formatCurrency(walletBalance, 'NGN')}
                </Text>
              </View>
            </View>

            {/* PIN pad */}
            {insufficient ? (
              <View style={[ss.warnBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="warning-outline" size={16} color="#EF4444" />
                <Text style={{ fontSize: 13, color: '#EF4444', flex: 1 }}>Insufficient balance. Please fund your wallet.</Text>
              </View>
            ) : (
              <View style={[ss.pinCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
                <Text style={[{ fontSize: 13, fontWeight: '600', color: tc.heading, marginBottom: 8 }]}>Transaction PIN</Text>
                <View style={ss.numPad}>
                  {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                    <TouchableOpacity key={i}
                      style={[ss.numKey, { backgroundColor: k ? tc.background : 'transparent', borderColor: tc.border || '#E5E5EA' }]}
                      onPress={() => {
                        if (!k) return;
                        if (k === '⌫') onPinChange(pin.slice(0, -1));
                        else if (pin.length < 4) onPinChange(pin + k);
                      }}
                      disabled={!k}
                    >
                      <Text style={[ss.numKeyText, { color: tc.heading }]}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={[ss.pinDots, { borderColor: tc.border || '#E5E5EA' }]}>
                  {[0,1,2,3].map((i) => (
                    <View key={i} style={[ss.pinDot, { backgroundColor: i < pin.length ? tc.primary : tc.border || '#E5E5EA' }]} />
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[ss.primaryBtn, { backgroundColor: tc.primary,
                opacity: (loading || insufficient || pin.length !== 4) ? 0.5 : 1 }]}
              onPress={onConfirm}
              disabled={loading || insufficient || pin.length !== 4}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Text style={ss.primaryBtnText}>{confirmLabel || `Pay — ${formatCurrency(totalAmount, 'NGN')}`}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const ss = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  handleRow: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  closeBtn: { position: 'absolute', right: 0, top: -4 },

  payCard:          { borderRadius: 14, backgroundColor: '#3B0CB0', padding: 20, marginBottom: 12, marginTop: 8 },
  payTitle:         { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 10 },
  payRow:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  payLabel:         { fontSize: 13, color: 'rgba(255,255,255,0.8)', flexShrink: 1, paddingRight: 8 },
  payVal:           { fontSize: 13, fontWeight: '600', color: '#FFF' },
  payTotal:         { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 8, marginTop: 4 },
  payTotalLabel:    { fontSize: 15, fontWeight: '700', color: '#FFF' },
  payTotalAmt:      { fontSize: 20, fontWeight: '900', color: '#FFF' },
  walletRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  walletLabel:      { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  walletBal:        { fontSize: 14, fontWeight: '700' },

  pinCard:          { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  numPad:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  numKey:           { width: '30%', paddingVertical: 14, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  numKeyText:       { fontSize: 18, fontWeight: '600' },
  pinDots:          { flexDirection: 'row', justifyContent: 'center', gap: 12, borderTopWidth: 1, paddingTop: 12 },
  pinDot:           { width: 14, height: 14, borderRadius: 7 },

  warnBox:          { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, marginBottom: 12 },

  primaryBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 4 },
  primaryBtnText:   { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
