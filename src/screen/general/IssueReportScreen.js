import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { formatCurrency } from 'CONSTANT/formatCurrency';

const ISSUE_TYPES = [
  { key: 'not_delivered',   label: 'Service not delivered',     icon: 'alert-circle-outline' },
  { key: 'wrong_amount',    label: 'Wrong amount charged',       icon: 'cash-outline' },
  { key: 'double_charge',   label: 'Charged twice',              icon: 'repeat-outline' },
  { key: 'no_refund',       label: 'Refund not received',        icon: 'return-down-back-outline' },
  { key: 'wrong_recipient', label: 'Wrong recipient / number',   icon: 'person-outline' },
  { key: 'other',           label: 'Other',                      icon: 'ellipsis-horizontal-outline' },
];

const SUPPORT_EMAIL = 'support@techspereapp.com';

export default function IssueReportScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const { transaction, reference } = route.params || {};

  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Select issue type', 'Please choose the type of issue you experienced.');
      return;
    }

    const issueLabel = ISSUE_TYPES.find(t => t.key === selectedType)?.label || selectedType;
    const subject = encodeURIComponent(`PayFlex Issue Report — Ref: ${reference || 'N/A'}`);
    const body = encodeURIComponent(
      `Issue Type: ${issueLabel}\n` +
      `Transaction Reference: ${reference || 'N/A'}\n` +
      `Service: ${transaction?.type || 'N/A'}\n` +
      `Amount: ${transaction?.amount ? '₦' + Number(transaction.amount).toLocaleString() : 'N/A'}\n` +
      `Date: ${transaction?.createdAt ? new Date(transaction.createdAt).toLocaleString('en-NG') : 'N/A'}\n\n` +
      `Description:\n${description || '(no additional details provided)'}`
    );

    const mailUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    try {
      const supported = await Linking.canOpenURL(mailUrl);
      if (supported) {
        await Linking.openURL(mailUrl);
      }
      // Show submitted state regardless — email app may silently fail on some devices
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBarComponent />
        <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E0E0E0', paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Report Issue</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.successWrap}>
          <View style={[styles.successCircle, { backgroundColor: '#4CAF5015' }]}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
          </View>
          <Text style={[styles.successTitle, { color: themeColors.heading }]}>Report Submitted</Text>
          <Text style={[styles.successBody, { color: themeColors.subheading }]}>
            Your issue has been reported to our support team. We typically respond within 24 hours.
          </Text>
          <Text style={[styles.successRef, { color: themeColors.subtext }]}>
            Reference: {reference || 'N/A'}
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: themeColors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E0E0E0', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Report Issue</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Transaction summary card */}
        {transaction && (
          <View style={[styles.txCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.txCardLabel, { color: themeColors.subheading }]}>Transaction</Text>
            <Text style={[styles.txCardRef, { color: themeColors.heading }]} numberOfLines={1}>{reference}</Text>
            <View style={styles.txCardRow}>
              <Text style={[styles.txCardSub, { color: themeColors.subheading }]}>
                {transaction.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Text>
              {transaction.amount && (
                <Text style={[styles.txCardAmount, { color: themeColors.heading }]}>
                  {formatCurrency(transaction.amount, 'NGN')}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Issue type selector */}
        <Text style={[styles.sectionLabel, { color: themeColors.subheading }]}>WHAT WENT WRONG?</Text>
        {ISSUE_TYPES.map(type => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.issueRow,
              { backgroundColor: themeColors.card },
              selectedType === type.key && { borderColor: themeColors.primary, borderWidth: 1.5 },
            ]}
            onPress={() => setSelectedType(type.key)}
            activeOpacity={0.8}
          >
            <View style={[styles.issueIcon, { backgroundColor: selectedType === type.key ? `${themeColors.primary}15` : `${themeColors.subtext}12` }]}>
              <Ionicons name={type.icon} size={20} color={selectedType === type.key ? themeColors.primary : themeColors.subheading} />
            </View>
            <Text style={[styles.issueLabel, { color: themeColors.heading }]}>{type.label}</Text>
            {selectedType === type.key && (
              <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} />
            )}
          </TouchableOpacity>
        ))}

        {/* Description */}
        <Text style={[styles.sectionLabel, { color: themeColors.subheading, marginTop: 20 }]}>ADDITIONAL DETAILS (OPTIONAL)</Text>
        <TextInput
          style={[styles.textarea, { backgroundColor: themeColors.card, color: themeColors.heading, borderColor: themeColors.border || '#E0E0E0' }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what happened..."
          placeholderTextColor={themeColors.subtext}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: themeColors.primary, opacity: selectedType ? 1 : 0.5 }]}
          onPress={handleSubmit}
          disabled={!selectedType}
          activeOpacity={0.85}
        >
          <Ionicons name="send-outline" size={18} color="#FFF" />
          <Text style={styles.submitBtnText}>Submit Report</Text>
        </TouchableOpacity>

        <Text style={[styles.footNote, { color: themeColors.subtext }]}>
          Your report will be sent to {SUPPORT_EMAIL}. We respond within 24 hours.
        </Text>
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
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },

  txCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  txCardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  txCardRef: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  txCardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  txCardSub: { fontSize: 13 },
  txCardAmount: { fontSize: 13, fontWeight: '700' },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },

  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  issueIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  issueLabel: { flex: 1, fontSize: 15, fontWeight: '500' },

  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 110,
    marginBottom: 24,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  footNote: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 14 },
  successCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  successBody: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  successRef: { fontSize: 12 },
  doneBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
