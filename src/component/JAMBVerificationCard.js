
import React from 'react';
import {
  View,
  Text, 
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * JAMB Verification Card Component
 * Handles profile code verification for JAMB purchases
 */
export default function JAMBVerificationCard({
  profileCode,
  onProfileCodeChange,
  senderEmail,
  onSenderEmailChange,
  verifiedCandidate,
  onVerify,
  verifying,
  themeColors,
}) {
  return (
    <View style={[styles.container, { backgroundColor: themeColors.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={24} color={themeColors.primary} />
        <Text style={[styles.title, { color: themeColors.heading }]}>
          JAMB Profile Verification
        </Text>
      </View>

      <Text style={[styles.subtitle, { color: themeColors.subheading }]}>
        Verify candidate profile code before purchase
      </Text>

      {/* Profile Code Input */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: themeColors.subheading }]}>
          Profile Code
        </Text>
        <View style={[styles.inputWrapper, { backgroundColor: themeColors.background }]}>
          <TextInput
            style={[styles.input, { color: themeColors.heading }]}
            value={profileCode}
            onChangeText={onProfileCodeChange}
            placeholder="Enter profile code"
            placeholderTextColor={themeColors.subtext}
            keyboardType="numeric"
            maxLength={15}
            editable={!verifiedCandidate}
          />
          {verifiedCandidate && (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          )}
        </View>
      </View>

      {/* Sender Email Input */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: themeColors.subheading }]}>
          Email Address
        </Text>
        <View style={[styles.inputWrapper, { backgroundColor: themeColors.background }]}>
          <TextInput
            style={[styles.input, { color: themeColors.heading }]}
            value={senderEmail}
            onChangeText={onSenderEmailChange}
            placeholder="Enter email address"
            placeholderTextColor={themeColors.subtext}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!verifiedCandidate}
          />
        </View>
        <Text style={[styles.helpText, { color: themeColors.subtext }]}>
          JAMB PIN will be sent to this email
        </Text>
      </View>

      {/* Verified Candidate Info */}
      {verifiedCandidate && (
        <View style={[styles.verifiedCard, { backgroundColor: themeColors.neutral }]}>
          <View style={styles.verifiedHeader}>
            <Ionicons name="person-circle-outline" size={20} color={themeColors.primary} />
            <Text style={[styles.verifiedLabel, { color: themeColors.subheading }]}>
              Verified Candidate
            </Text>
          </View>
          <Text style={[styles.candidateName, { color: themeColors.heading }]}>
            {verifiedCandidate.customerName}
          </Text>
          <View style={styles.verifiedDetails}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
                Profile Code:
              </Text>
              <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                {verifiedCandidate.profileCode}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
                Service:
              </Text>
              <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                {verifiedCandidate.service}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Verify Button or Change Button */}
      {!verifiedCandidate ? (
        <TouchableOpacity
          style={[
            styles.verifyButton,
            { 
              backgroundColor: themeColors.primary,
              opacity: (!profileCode || !senderEmail || verifying) ? 0.5 : 1,
            },
          ]}
          onPress={onVerify}
          disabled={!profileCode || !senderEmail || verifying}
          activeOpacity={0.7}
        >
          {verifying ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.verifyButtonText}>Verify Profile</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.changeButton,
            { 
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
            },
          ]}
          onPress={() => {
            onProfileCodeChange('');
            onSenderEmailChange('');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color={themeColors.primary} />
          <Text style={[styles.changeButtonText, { color: themeColors.primary }]}>
            Change Profile
          </Text>
        </TouchableOpacity>
      )}

      {/* Info Note */}
      <View style={[styles.infoNote, { backgroundColor: `${themeColors.primary}10` }]}>
        <Ionicons name="information-circle-outline" size={16} color={themeColors.primary} />
        <Text style={[styles.infoText, { color: themeColors.primary }]}>
          Profile verification is required for all JAMB purchases
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // ========================================
  // HEADER
  // ========================================
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },

  // ========================================
  // INPUT FIELDS
  // ========================================
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },

  // ========================================
  // VERIFIED CANDIDATE CARD
  // ========================================
  verifiedCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  verifiedLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  verifiedDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ========================================
  // BUTTONS
  // ========================================
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
    marginBottom: 12,
  },
  changeButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // ========================================
  // INFO NOTE
  // ========================================
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});