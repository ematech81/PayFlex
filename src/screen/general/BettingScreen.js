// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   SafeAreaView,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   TextInput,
//   Image,
//   Dimensions,
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';

// import {
//   ScreenHeader,
//   PayButton,
//   ConfirmationModal,
//   PinModal,
//   ResultModal,
//   LoadingOverlay,
// } from 'component/SHARED';

// import { useServicePayment } from 'HOOKS/UseServicePayment';
// import PinSetupModal from 'component/PinSetUpModal';
// import { useWallet } from 'context/WalletContext';

// import { BETTING_PROVIDERS } from 'CONSTANT/bettingConstant';
// import { formatCurrency } from 'CONSTANT/formatCurrency';
// import { colors } from 'constants/colors';
// import { useThem } from 'constants/useTheme';
// import { StatusBarComponent } from 'component/StatusBar';
// import { verifyBettingAccount, fundBettingAccount } from 'AuthFunction/paymentService';
// import AmountInput from 'component/SHARED/INPUT/amountInput';

// const { width } = Dimensions.get('window');
// const CELL_WIDTH = (width - 82) / 2;

// const MIN_AMOUNT = 100;
// const MAX_AMOUNT = 100_000;

// // ─── Verified Account Card ────────────────────────────────────────────────────
// const VerifiedAccountCard = ({ customerName, userId, service, themeColors }) => (
//   <View style={[styles.verifiedCard, { backgroundColor: themeColors.neutral }]}>
//     <View style={styles.verifiedHeader}>
//       <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
//       <Text style={[styles.verifiedTitle, { color: themeColors.heading }]}>
//         Account Verified
//       </Text>
//     </View>
//     <View style={styles.verifiedDetails}>
//       <View style={styles.detailRow}>
//         <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>Customer Name:</Text>
//         <Text style={[styles.detailValue, { color: themeColors.heading }]}>{customerName}</Text>
//       </View>
//       <View style={styles.detailRow}>
//         <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>User ID:</Text>
//         <Text style={[styles.detailValue, { color: themeColors.heading }]}>{userId}</Text>
//       </View>
//       <View style={styles.detailRow}>
//         <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>Platform:</Text>
//         <Text style={[styles.detailValue, { color: themeColors.heading }]}>{service}</Text>
//       </View>
//     </View>
//   </View>
// );

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// export default function BettingScreen({ navigation, route }) {
//   const isDarkMode   = useThem();
//   const themeColors  = isDarkMode ? colors.dark : colors.light;
//   const insets       = useSafeAreaInsets();
//   const { wallet, refreshWallet } = useWallet();

//   const [provider,          setProvider]          = useState('');
//   const [userId,            setUserId]            = useState('');
//   const [amount,            setAmount]            = useState('');
//   const [validationErrors,  setValidationErrors]  = useState({});
//   const [verifying,         setVerifying]         = useState(false);
//   const [verifiedAccount,   setVerifiedAccount]   = useState(null);

//   // ── Validation ─────────────────────────────────────────────────────────────
//   const validateBettingFunding = useCallback((fundingData) => {
//     const errors = {};

//     if (!fundingData.service) {
//       errors.provider = 'Please select a betting platform';
//     }
//     if (!fundingData.userid) {
//       errors.userid = 'User ID is required';
//     } else if (String(fundingData.userid).length < 3) {
//       errors.userid = 'User ID must be at least 3 characters';
//     }
//     if (!fundingData.amount || fundingData.amount < MIN_AMOUNT) {
//       errors.amount = `Minimum amount is ₦${MIN_AMOUNT.toLocaleString()}`;
//     }
//     if (fundingData.amount > MAX_AMOUNT) {
//       errors.amount = `Maximum amount is ₦${MAX_AMOUNT.toLocaleString()}`;
//     }
//     if (!verifiedAccount) {
//       errors.verification = 'Please verify user ID first';
//     }

//     const isValid = Object.keys(errors).length === 0;
//     setValidationErrors(errors);
//     return { isValid, errors };
//   }, [verifiedAccount]);

//   // ── Payment hook ───────────────────────────────────────────────────────────
//   const payment = useServicePayment({
//     serviceName:     'Betting',
//     validatePayment: validateBettingFunding,
//     executePurchase: async (pin, fundingData) => fundBettingAccount(pin, fundingData),
//     navigation,
//     route,
//   });

//   // ── Restore form data after PIN setup redirect ─────────────────────────────
//   useEffect(() => {
//     payment.restoreFormData((data) => {
//       setProvider(data.service);
//       setUserId(data.userid);
//       setAmount(data.amount?.toString());
//       setVerifiedAccount(data.verifiedAccount);
//     });
//   }, [payment.pendingPaymentData]);

//   useEffect(() => { refreshWallet(); }, []);

//   // Reset verification when provider/userId changes
//   useEffect(() => {
//     setVerifiedAccount(null);
//     setValidationErrors({});
//   }, [provider, userId]);

//   // ── Verify account ─────────────────────────────────────────────────────────
//   const handleVerifyAccount = useCallback(async () => {
//     if (!provider || !userId) {
//       Alert.alert('Error', 'Please select a platform and enter user ID');
//       return;
//     }
//     try {
//       setVerifying(true);
//       const result = await verifyBettingAccount(provider, userId);
//       if (result.success) {
//         setVerifiedAccount(result.data);
//         Alert.alert('Success', `Account verified: ${result.data.customerName}`);
//       } else {
//         Alert.alert('Verification Failed', result.message || 'Invalid user ID');
//       }
//     } catch (error) {
//       Alert.alert('Error', error.message || 'Failed to verify account');
//     } finally {
//       setVerifying(false);
//     }
//   }, [provider, userId]);

//   // ── Fund account ───────────────────────────────────────────────────────────
//   const handleFundAccount = useCallback(() => {
//     setValidationErrors({});
//     payment.initiatePayment({
//       service:         provider,
//       userid:          userId,
//       amount:          parseFloat(amount),
//       verifiedAccount,
//     });
//   }, [provider, userId, amount, verifiedAccount, payment]);

//   const handleTransactionComplete = useCallback(() => {
//     payment.handleTransactionComplete(payment.result?.reference);
//   }, [payment]);

//   const getProviderInfo = useCallback(() =>
//     BETTING_PROVIDERS.find(p => p.value === provider),
//   [provider]);

//   // ── Loading state ──────────────────────────────────────────────────────────
//   if (wallet?.isLoading) {
//     return (
//       <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
//         <ScreenHeader title="Betting" onBackPress={() => navigation.goBack()} />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={themeColors.primary} />
//           <Text style={[styles.loadingText, { color: themeColors.heading }]}>Loading...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // ── Render ─────────────────────────────────────────────────────────────────
//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
//       <StatusBarComponent />

//       <ScreenHeader
//         title="Betting"
//         onBackPress={() => navigation.goBack()}
//         rightText="History"
//         onRightPress={() => navigation.navigate('TransactionDetails')}
//       />

//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Info Banner */}
//         <View style={[styles.infoBanner, { backgroundColor: themeColors.card }]}>
//           <Ionicons name="trophy-outline" size={32} color={themeColors.primary} />
//           <View style={styles.infoContent}>
//             <Text style={[styles.infoTitle, { color: themeColors.heading }]}>
//               Fund Betting Account
//             </Text>
//             <Text style={[styles.infoDescription, { color: themeColors.subheading }]}>
//               Quick and secure betting wallet funding
//             </Text>
//           </View>
//         </View>

//         {/* Platform Selection Grid */}
//         <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
//           Select Betting Platform
//         </Text>
//         {validationErrors.provider && (
//           <Text style={[styles.fieldError, { color: themeColors.destructive }]}>
//             {validationErrors.provider}
//           </Text>
//         )}

//         <View style={styles.providerGrid}>
//           {BETTING_PROVIDERS.map((p) => {
//             const isSelected = provider === p.value;
//             return (
//               <TouchableOpacity
//                 key={p.value}
//                 style={[
//                   styles.providerCell,
//                   {
//                     backgroundColor: themeColors.card,
//                     borderColor: isSelected ? themeColors.primary : themeColors.border,
//                     borderWidth: isSelected ? 2 : 1,
//                     opacity: verifiedAccount && !isSelected ? 0.4 : 1,
//                   },
//                 ]}
//                 onPress={() => !verifiedAccount && setProvider(p.value)}
//                 disabled={!!verifiedAccount}
//                 activeOpacity={0.7}
//               >
//                 {isSelected && (
//                   <View style={[styles.providerCheck, { backgroundColor: themeColors.primary }]}>
//                     <Ionicons name="checkmark" size={10} color="#fff" />
//                   </View>
//                 )}
//                 {p.logo ? (
//                   <Image source={p.logo} style={styles.providerCellLogo} resizeMode="contain" />
//                 ) : (
//                   <View style={[styles.providerPlaceholder, { backgroundColor: p.color }]}>
//                     <Text style={styles.providerPlaceholderText}>
//                       {p.label.slice(0, 3).toUpperCase()}
//                     </Text>
//                   </View>
//                 )}
//                 <Text
//                   style={[styles.providerCellLabel, { color: themeColors.heading }]}
//                   numberOfLines={1}
//                 >
//                   {p.label}
//                 </Text>
//               </TouchableOpacity>
//             );
//           })}
//         </View>

//         {/* User ID Input */}
//         <View style={styles.inputContainer}>
//           <Text style={[styles.label, { color: themeColors.heading }]}>
//             User ID / Account Number
//           </Text>
//           <View
//             style={[
//               styles.inputWrapper,
//               {
//                 backgroundColor: themeColors.background,
//                 borderColor: validationErrors.userid ? themeColors.destructive : themeColors.border,
//               },
//             ]}
//           >
//             <Ionicons name="person-outline" size={20} color={themeColors.subtext} style={styles.inputIcon} />
//             <TextInput
//               style={[styles.input, { color: themeColors.heading }]}
//               value={userId}
//               onChangeText={setUserId}
//               placeholder="Enter your user ID"
//               placeholderTextColor={themeColors.subtext}
//               editable={!verifiedAccount}
//             />
//             {verifiedAccount && (
//               <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
//             )}
//           </View>
//           {validationErrors.userid && (
//             <Text style={[styles.fieldError, { color: themeColors.destructive }]}>
//               {validationErrors.userid}
//             </Text>
//           )}
//         </View>

//         {/* Verify / Change button */}
//         {!verifiedAccount ? (
//           <PayButton
//             title="Verify Account"
//             onPress={handleVerifyAccount}
//             loading={verifying}
//             disabled={!provider || !userId || verifying}
//             style={styles.verifyButton}
//             icon="shield-checkmark-outline"
//           />
//         ) : (
//           <>
//             <VerifiedAccountCard
//               customerName={verifiedAccount.customerName}
//               userId={verifiedAccount.userId}
//               service={verifiedAccount.service}
//               themeColors={themeColors}
//             />

//             {/* Amount */}
//             <AmountInput
//               value={amount}
//               onChangeText={setAmount}
//               label="Amount to Fund"
//               placeholder="Enter amount"
//               error={validationErrors.amount}
//               minAmount={MIN_AMOUNT}
//               maxAmount={MAX_AMOUNT}
//             />

//             {/* Funding Summary */}
//             {amount && parseFloat(amount) >= MIN_AMOUNT && (
//               <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
//                 <Text style={[styles.summaryTitle, { color: themeColors.heading }]}>
//                   Funding Summary
//                 </Text>
//                 <View style={styles.summaryRow}>
//                   <Text style={[styles.summaryLabel, { color: themeColors.subheading }]}>
//                     Funding Amount:
//                   </Text>
//                   <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
//                     {formatCurrency(parseFloat(amount), 'NGN')}
//                   </Text>
//                 </View>
//                 <View style={[styles.summaryRow, styles.feeNote]}>
//                   <Ionicons name="information-circle-outline" size={14} color={themeColors.subtext} />
//                   <Text style={[styles.feeNoteText, { color: themeColors.subtext }]}>
//                     A small service fee may apply. The exact total is confirmed at checkout.
//                   </Text>
//                 </View>
//               </View>
//             )}

//             {/* Change account */}
//             <TouchableOpacity
//               style={[styles.changeAccountButton, { borderColor: themeColors.border }]}
//               onPress={() => {
//                 setVerifiedAccount(null);
//                 setUserId('');
//                 setAmount('');
//               }}
//             >
//               <Ionicons name="refresh" size={20} color={themeColors.primary} />
//               <Text style={[styles.changeAccountText, { color: themeColors.primary }]}>
//                 Change Account
//               </Text>
//             </TouchableOpacity>
//           </>
//         )}

//         {/* Error displays */}
//         {validationErrors.verification && (
//           <View style={[styles.errorContainer, { backgroundColor: `${themeColors.destructive}20` }]}>
//             <Text style={[styles.errorText, { color: themeColors.destructive }]}>
//               {validationErrors.verification}
//             </Text>
//           </View>
//         )}
//         {payment.flowError && (
//           <View style={[styles.errorContainer, { backgroundColor: `${themeColors.destructive}20` }]}>
//             <Text style={[styles.errorText, { color: themeColors.destructive }]}>
//               {payment.flowError}
//             </Text>
//           </View>
//         )}
//       </ScrollView>

//       {/* Sticky Fund Button */}
//       {verifiedAccount && amount && parseFloat(amount) >= MIN_AMOUNT && (
//         <View
//           style={[
//             styles.stickyFooter,
//             { marginBottom: insets.bottom + 8, borderColor: themeColors.border },
//           ]}
//         >
//           <View style={styles.footerContent}>
//             <Text style={[styles.footerLabel, { color: themeColors.subheading }]}>
//               {getProviderInfo()?.label} — {verifiedAccount.customerName}
//             </Text>
//             <Text style={[styles.footerPrice, { color: themeColors.primary }]}>
//               {formatCurrency(parseFloat(amount), 'NGN')}
//             </Text>
//           </View>
//           <PayButton
//             title="Fund Account"
//             onPress={handleFundAccount}
//             disabled={payment.step === 'processing'}
//             loading={payment.step === 'processing'}
//             style={styles.fundButton}
//           />
//         </View>
//       )}

//       {/* ── Modals ─────────────────────────────────────────────────────────── */}
//       <PinSetupModal
//         visible={payment.showPinSetupModal}
//         serviceName="Betting Funding"
//         paymentAmount={parseFloat(amount) || 0}
//         onCreatePin={payment.handleCreatePin}
//         onCancel={payment.handleCancelPinSetup}
//         isDarkMode={isDarkMode}
//       />

//       <ConfirmationModal
//         visible={payment.step === 'confirm'}
//         onClose={payment.handleCancelPayment}
//         onConfirm={payment.confirmPayment}
//         amount={parseFloat(amount) || 0}
//         serviceName={`${getProviderInfo()?.label} Funding`}
//         providerLogo={getProviderInfo()?.logo}
//         providerName={getProviderInfo()?.label}
//         recipient={userId}
//         recipientLabel="User ID"
//         walletBalance={wallet?.user?.walletBalance}
//         additionalDetails={[
//           { label: 'Customer',       value: verifiedAccount?.customerName || 'N/A' },
//           { label: 'Funding Amount', value: formatCurrency(parseFloat(amount || 0), 'NGN') },
//           { label: 'Service Fee',    value: 'Included (charged by provider)' },
//         ]}
//         loading={false}
//       />

//       <PinModal
//         visible={payment.step === 'pin'}
//         onClose={payment.handleCancelPayment}
//         onSubmit={(enteredPin) => payment.submitPayment(enteredPin)}
//         onForgotPin={payment.handleForgotPin}
//         loading={payment.step === 'processing'}
//         error={payment.pinError}
//         title="Enter Transaction PIN"
//         subtitle={`Confirm funding of ${formatCurrency(parseFloat(amount || 0), 'NGN')}`}
//       />

//       <ResultModal
//         visible={payment.step === 'result'}
//         onClose={payment.resetFlow}
//         type={payment.result ? 'success' : 'error'}
//         title={payment.result ? 'Funding Successful!' : 'Funding Failed'}
//         message={
//           payment.result
//             ? `Your ${getProviderInfo()?.label} account (${userId}) has been funded with ${formatCurrency(parseFloat(amount || 0), 'NGN')}.`
//             : 'Your betting account funding could not be completed. Please try again.'
//         }
//         primaryAction={{ label: 'View Details', onPress: handleTransactionComplete }}
//         secondaryAction={{ label: 'Done',        onPress: payment.resetFlow }}
//       />

//       <LoadingOverlay visible={payment.step === 'processing'} message="Processing funding..." />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container:       { flex: 1 },
//   scrollView:      { flex: 1 },
//   scrollContent:   { paddingHorizontal: 16, paddingBottom: 120 },
//   loadingContainer:{ flex: 1, justifyContent: 'center', alignItems: 'center' },
//   loadingText:     { marginTop: 12, fontSize: 16, fontWeight: '500' },

//   infoBanner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     borderRadius: 12,
//     marginTop: 16,
//     marginBottom: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   infoContent:     { flex: 1, marginLeft: 16 },
//   infoTitle:       { fontSize: 16, fontWeight: '700', marginBottom: 4 },
//   infoDescription: { fontSize: 13, lineHeight: 18 },

//   sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 12 },

//   // Provider grid
//   providerGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginHorizontal: -5,
//     marginBottom: 8,
//   },
//   providerCell: {
//     width: CELL_WIDTH,
//     marginHorizontal: 5,
//     marginBottom: 10,
//     borderRadius: 12,
//     paddingVertical: 10,
//     paddingHorizontal: 8,
//     alignItems: 'center',
//     position: 'relative',
//   },
//   providerCellLogo: { width: 34, height: 34, marginBottom: 6 },
//   providerPlaceholder: {
//     width: 34,
//     height: 34,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 6,
//   },
//   providerPlaceholderText: { color: '#fff', fontWeight: '700', fontSize: 10 },
//   providerCellLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
//   providerCheck: {
//     position: 'absolute',
//     top: 6,
//     right: 6,
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   // Input
//   inputContainer: { marginBottom: 16 },
//   label:          { fontSize: 14, fontWeight: '600', marginBottom: 8 },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 12,
//     borderRadius: 10,
//     borderWidth: 1.5,
//   },
//   inputIcon: { marginRight: 10 },
//   input:     { flex: 1, fontSize: 15, fontWeight: '500' },
//   fieldError:{ fontSize: 12, fontWeight: '500', marginTop: 4 },

//   verifyButton: { marginTop: 16, marginBottom: 8 },

//   // Verified card
//   verifiedCard:    { marginTop: 16, padding: 16, borderRadius: 12, marginBottom: 16 },
//   verifiedHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
//   verifiedTitle:   { fontSize: 16, fontWeight: '700' },
//   verifiedDetails: { gap: 12 },
//   detailRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   detailLabel:     { fontSize: 14, fontWeight: '500' },
//   detailValue:     { fontSize: 14, fontWeight: '700' },

//   // Summary card
//   summaryCard: {
//     marginTop: 20,
//     padding: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
//   summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
//   summaryLabel: { fontSize: 14, fontWeight: '500' },
//   summaryValue: { fontSize: 14, fontWeight: '600' },
//   feeNote:      { alignItems: 'flex-start', gap: 6, marginBottom: 0 },
//   feeNoteText:  { flex: 1, fontSize: 12, lineHeight: 16 },

//   changeAccountButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 10,
//     borderWidth: 1.5,
//     marginTop: 16,
//     gap: 8,
//   },
//   changeAccountText: { fontSize: 15, fontWeight: '600' },

//   errorContainer: {
//     marginTop: 16,
//     padding: 12,
//     borderRadius: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   errorText: { fontSize: 14, fontWeight: '500', flex: 1 },

//   // Sticky footer
//   stickyFooter: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#FFFFFF',
//     paddingHorizontal: 16,
//     paddingTop: 12,
//     paddingBottom: 8,
//     borderTopWidth: 1,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   footerContent: { marginBottom: 12 },
//   footerLabel:   { fontSize: 14, fontWeight: '600', marginBottom: 4 },
//   footerPrice:   { fontSize: 22, fontWeight: '700' },
//   fundButton:    { width: '100%' },
// });


import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Dimensions,
  Animated,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import {
  ScreenHeader,
  PayButton,
  ConfirmationModal,
  PinModal,
  ResultModal,
  LoadingOverlay,
} from 'component/SHARED';

import { useServicePayment } from 'HOOKS/UseServicePayment';
import PinSetupModal from 'component/PinSetUpModal';
import { useWallet } from 'context/WalletContext';

import { BETTING_PROVIDERS } from 'CONSTANT/bettingConstant';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { StatusBarComponent } from 'component/StatusBar';
import {
  verifyBettingAccount,
  fundBettingAccount,
  getBettingPlatforms,
} from 'AuthFunction/paymentService';
import AmountInput from 'component/SHARED/INPUT/amountInput';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3;

const MIN_AMOUNT = 100;
const MAX_AMOUNT = 100_000;

// ─── Utility: Animated Pressable ─────────────────────────────────────────────
const ScalePressable = ({ onPress, children, style, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// ─── Wallet Balance Chip ──────────────────────────────────────────────────────
const WalletChip = ({ balance, themeColors }) => (
  <View style={[styles.walletChip, { backgroundColor: `${themeColors.primary}15` }]}>
    <Ionicons name="wallet-outline" size={14} color={themeColors.primary} />
    <Text style={[styles.walletChipText, { color: themeColors.primary }]}>
      {formatCurrency(balance ?? 0, 'NGN')}
    </Text>
  </View>
);

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ currentStep, themeColors }) => {
  const steps = ['Platform', 'Verify', 'Amount'];
  return (
    <View style={styles.stepRow}>
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isDone = currentStep > stepNum;
        const isActive = currentStep === stepNum;
        return (
          <React.Fragment key={label}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: isDone
                      ? '#22C55E'
                      : isActive
                      ? themeColors.primary
                      : themeColors.border,
                  },
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={styles.stepNumber}>{stepNum}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: isActive
                      ? themeColors.primary
                      : isDone
                      ? '#22C55E'
                      : themeColors.subtext,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </View>
            {idx < steps.length - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  {
                    backgroundColor: isDone ? '#22C55E' : themeColors.border,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ─── Provider Card ─────────────────────────────────────────────────────────────
const ProviderCard = ({ provider, isSelected, onPress, disabled, themeColors }) => {
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [themeColors.border, themeColors.primary],
  });

  return (
    <ScalePressable
      onPress={() => {
        if (!disabled) {
          Haptics.selectionAsync();
          onPress();
        }
      }}
      disabled={disabled}
      style={{ width: CARD_WIDTH, marginBottom: 10 }}
    >
      <Animated.View
        style={[
          styles.providerCard,
          {
            backgroundColor: isSelected
              ? `${themeColors.primary}12`
              : themeColors.card,
            borderColor,
            borderWidth: isSelected ? 2 : 1,
            opacity: disabled && !isSelected ? 0.45 : 1,
          },
        ]}
      >
        {isSelected && (
          <View
            style={[
              styles.providerBadge,
              { backgroundColor: themeColors.primary },
            ]}
          >
            <Ionicons name="checkmark" size={9} color="#fff" />
          </View>
        )}

        {provider.logo ? (
          <Image
            source={provider.logo}
            style={styles.providerLogo}
            resizeMode="contain"
          />
        ) : (
          <LinearGradient
            colors={[provider.color ?? '#6366F1', `${provider.color ?? '#6366F1'}99`]}
            style={styles.providerLogoPlaceholder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.providerLogoText}>
              {provider.label.slice(0, 2).toUpperCase()}
            </Text>
          </LinearGradient>
        )}

        <Text
          style={[
            styles.providerLabel,
            {
              color: isSelected ? themeColors.primary : themeColors.heading,
              fontWeight: isSelected ? '700' : '600',
            },
          ]}
          numberOfLines={1}
        >
          {provider.label}
        </Text>
      </Animated.View>
    </ScalePressable>
  );
};

// ─── Verified Account Card ────────────────────────────────────────────────────
const VerifiedAccountCard = ({ customerName, userId, service, themeColors }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 6,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <LinearGradient
        colors={['#22C55E18', '#16A34A0A']}
        style={[styles.verifiedCard, { borderColor: '#22C55E40' }]}
      >
        <View style={styles.verifiedCardHeader}>
          <View style={styles.verifiedIconWrap}>
            <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.verifiedTitle, { color: '#15803D' }]}>
              Account Verified
            </Text>
            <Text style={[styles.verifiedSubtitle, { color: '#166534' }]}>
              Ready to fund
            </Text>
          </View>
        </View>

        <View style={styles.verifiedDivider} />

        <View style={styles.verifiedGrid}>
          <VerifiedDetail label="Name" value={customerName} />
          <VerifiedDetail label="User ID" value={userId} />
          <VerifiedDetail label="Platform" value={service} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const VerifiedDetail = ({ label, value }) => (
  <View style={styles.verifiedDetailItem}>
    <Text style={styles.verifiedDetailLabel}>{label}</Text>
    <Text style={styles.verifiedDetailValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

// ─── Amount Quick Select ───────────────────────────────────────────────────────
const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

const QuickAmountPills = ({ onSelect, selectedAmount, themeColors }) => (
  <View style={styles.pillsRow}>
    {QUICK_AMOUNTS.map((val) => {
      const isActive = selectedAmount === val.toString();
      return (
        <ScalePressable
          key={val}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(val.toString());
          }}
          style={[
            styles.pill,
            {
              backgroundColor: isActive
                ? themeColors.primary
                : `${themeColors.primary}12`,
              borderColor: isActive ? themeColors.primary : 'transparent',
            },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              { color: isActive ? '#fff' : themeColors.primary },
            ]}
          >
            ₦{val >= 1000 ? `${val / 1000}K` : val}
          </Text>
        </ScalePressable>
      );
    })}
  </View>
);

// ─── Summary Row ──────────────────────────────────────────────────────────────
const SummaryRow = ({ label, value, highlight, themeColors }) => (
  <View style={styles.summaryRowItem}>
    <Text style={[styles.summaryRowLabel, { color: themeColors.subheading }]}>
      {label}
    </Text>
    <Text
      style={[
        styles.summaryRowValue,
        {
          color: highlight ? themeColors.primary : themeColors.heading,
          fontWeight: highlight ? '700' : '600',
        },
      ]}
    >
      {value}
    </Text>
  </View>
);

// ─── Field Error ──────────────────────────────────────────────────────────────
const FieldError = ({ message, themeColors }) => {
  if (!message) return null;
  return (
    <View style={styles.fieldErrorRow}>
      <Ionicons
        name="alert-circle-outline"
        size={13}
        color={themeColors.destructive}
      />
      <Text
        style={[styles.fieldErrorText, { color: themeColors.destructive }]}
      >
        {message}
      </Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BettingScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet, refreshWallet } = useWallet();

  const [provider, setProvider] = useState('');
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [verifying, setVerifying] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [bettingCatalog, setBettingCatalog] = useState(null);

  const footerAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  // ── Derived step ────────────────────────────────────────────────────────────
  const currentStep = !provider ? 1 : !verifiedAccount ? 2 : 3;

  // ── Footer slide-up ─────────────────────────────────────────────────────────
  const showFooter =
    verifiedAccount && amount && parseFloat(amount) >= MIN_AMOUNT;

  useEffect(() => {
    Animated.spring(footerAnim, {
      toValue: showFooter ? 1 : 0,
      useNativeDriver: true,
      speed: 14,
      bounciness: 4,
    }).start();
  }, [showFooter]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateBettingFunding = useCallback(
    (fundingData) => {
      const errors = {};
      if (!fundingData.service) errors.provider = 'Please select a betting platform';
      if (!fundingData.userid) {
        errors.userid = 'User ID is required';
      } else if (String(fundingData.userid).length < 3) {
        errors.userid = 'User ID must be at least 3 characters';
      }
      if (!fundingData.amount || fundingData.amount < MIN_AMOUNT) {
        errors.amount = `Minimum amount is ₦${MIN_AMOUNT.toLocaleString()}`;
      }
      if (fundingData.amount > MAX_AMOUNT) {
        errors.amount = `Maximum amount is ₦${MAX_AMOUNT.toLocaleString()}`;
      }
      if (!verifiedAccount) errors.verification = 'Please verify user ID first';

      setValidationErrors(errors);
      return { isValid: Object.keys(errors).length === 0, errors };
    },
    [verifiedAccount]
  );

  // ── Payment hook ─────────────────────────────────────────────────────────────
  const payment = useServicePayment({
    serviceName: 'Betting',
    validatePayment: validateBettingFunding,
    executePurchase: async (pin, fundingData) =>
      fundBettingAccount(pin, fundingData),
    navigation,
    route,
  });

  // ── Restore form state ───────────────────────────────────────────────────────
  useEffect(() => {
    payment.restoreFormData((data) => {
      setProvider(data.service);
      setUserId(data.userid);
      setAmount(data.amount?.toString());
      setVerifiedAccount(data.verifiedAccount);
    });
  }, [payment.pendingPaymentData]);

  useEffect(() => {
    refreshWallet();
    getBettingPlatforms()
      .then((res) => setBettingCatalog(res))
      .catch(() => {});
  }, []);

  // Reset verification on provider/userId change
  useEffect(() => {
    setVerifiedAccount(null);
    setValidationErrors({});
  }, [provider, userId]);

  // ── Verify account ───────────────────────────────────────────────────────────
  const handleVerifyAccount = useCallback(async () => {
    if (!provider || !userId) {
      setValidationErrors({
        provider: !provider ? 'Please select a platform first' : undefined,
        userid: !userId ? 'Enter a user ID to verify' : undefined,
      });
      return;
    }
    try {
      setVerifying(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await verifyBettingAccount(provider, userId);
      if (result.success) {
        setVerifiedAccount(result.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(
          () => scrollRef.current?.scrollTo({ y: 400, animated: true }),
          300
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setValidationErrors({
          userid: result.message || 'Invalid user ID. Please try again.',
        });
      }
    } catch (error) {
      setValidationErrors({
        userid: error.message || 'Failed to verify account.',
      });
    } finally {
      setVerifying(false);
    }
  }, [provider, userId]);

  // ── Fund account ─────────────────────────────────────────────────────────────
  const handleFundAccount = useCallback(() => {
    setValidationErrors({});
    payment.initiatePayment({
      service: provider,
      userid: userId,
      amount: parseFloat(amount),
      verifiedAccount,
    });
  }, [provider, userId, amount, verifiedAccount, payment]);

  const handleTransactionComplete = useCallback(() => {
    payment.handleTransactionComplete(payment.result?.reference);
  }, [payment]);

  const getProviderInfo = useCallback(
    () => BETTING_PROVIDERS.find((p) => p.value === provider),
    [provider]
  );

  // ── Fee computation (uses catalog from /betting/platforms, falls back to defaults) ─
  const normalFee      = bettingCatalog?.normalFee      ?? 30;
  const microFee       = bettingCatalog?.microFee       ?? 50;
  const microThreshold = bettingCatalog?.microThreshold ?? 500;
  const numAmount      = parseFloat(amount) || 0;
  const isMicro        = numAmount > 0 && numAmount < microThreshold;
  const serviceFee     = numAmount > 0 ? (isMicro ? microFee : normalFee) : 0;
  const totalCharged   = numAmount + serviceFee;

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (wallet?.isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ScreenHeader title="Betting" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.subheading }]}>
            Loading wallet…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBarComponent />

      <ScreenHeader
        title="Fund Betting Account"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={[styles.historyBtn, { borderColor: themeColors.border }]}
            onPress={() => navigation.navigate('TransactionDetails')}
          >
            <Ionicons
              name="time-outline"
              size={15}
              color={themeColors.primary}
            />
            <Text style={[styles.historyBtnText, { color: themeColors.primary }]}>
              History
            </Text>
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: showFooter ? 160 : 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <LinearGradient
          colors={
            isDarkMode
              ? [`${themeColors.primary}30`, `${themeColors.primary}08`]
              : [`${themeColors.primary}18`, `${themeColors.primary}04`]
          }
          style={styles.heroBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroLeft}>
            <View
              style={[
                styles.heroIconWrap,
                { backgroundColor: `${themeColors.primary}20` },
              ]}
            >
              <Ionicons
                name="trophy"
                size={24}
                color={themeColors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: themeColors.heading }]}>
                Betting Wallet
              </Text>
              <Text
                style={[
                  styles.heroSubtitle,
                  { color: themeColors.subheading },
                ]}
              >
                Fund instantly · Secure · Fast
              </Text>
            </View>
          </View>
          <WalletChip
            balance={wallet?.user?.walletBalance}
            themeColors={themeColors}
          />
        </LinearGradient>

        {/* ── Step Indicator ───────────────────────────────────────────────── */}
        <View
          style={[
            styles.stepCard,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            },
          ]}
        >
          <StepIndicator currentStep={currentStep} themeColors={themeColors} />
        </View>

        {/* ── Platform Section ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionBadge,
                { backgroundColor: `${themeColors.primary}18` },
              ]}
            >
              <Text
                style={[styles.sectionBadgeText, { color: themeColors.primary }]}
              >
                01
              </Text>
            </View>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Select Platform
            </Text>
          </View>

          <FieldError
            message={validationErrors.provider}
            themeColors={themeColors}
          />

          <View style={styles.providerGrid}>
            {BETTING_PROVIDERS.map((p) => (
              <ProviderCard
                key={p.value}
                provider={p}
                isSelected={provider === p.value}
                onPress={() => setProvider(p.value)}
                disabled={!!verifiedAccount && provider !== p.value}
                themeColors={themeColors}
              />
            ))}
          </View>
        </View>

        {/* ── User ID Section ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionBadge,
                {
                  backgroundColor: provider
                    ? `${themeColors.primary}18`
                    : themeColors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionBadgeText,
                  { color: provider ? themeColors.primary : themeColors.subtext },
                ]}
              >
                02
              </Text>
            </View>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Verify Account
            </Text>
          </View>

          {/* Input card */}
          <View
            style={[
              styles.inputCard,
              {
                backgroundColor: themeColors.card,
                borderColor: validationErrors.userid
                  ? themeColors.destructive
                  : verifiedAccount
                  ? '#22C55E'
                  : themeColors.border,
                borderWidth: verifiedAccount || validationErrors.userid ? 2 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.inputIconBox,
                { backgroundColor: `${themeColors.primary}15` },
              ]}
            >
              <Ionicons
                name="person"
                size={18}
                color={themeColors.primary}
              />
            </View>
            <TextInput
              style={[styles.inputField, { color: themeColors.heading }]}
              value={userId}
              onChangeText={setUserId}
              placeholder="Enter betting user ID"
              placeholderTextColor={themeColors.subtext}
              editable={!verifiedAccount}
              keyboardType="default"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleVerifyAccount}
            />
            {verifiedAccount ? (
              <View style={styles.verifiedBadgeSmall}>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#22C55E"
                />
              </View>
            ) : userId.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setUserId('');
                  setValidationErrors({});
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={themeColors.subtext}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <FieldError
            message={validationErrors.userid}
            themeColors={themeColors}
          />

          {/* Verify button — only if not yet verified */}
          {!verifiedAccount && (
            <TouchableOpacity
              style={[
                styles.verifyBtn,
                {
                  backgroundColor:
                    !provider || !userId || verifying
                      ? themeColors.border
                      : themeColors.primary,
                },
              ]}
              onPress={handleVerifyAccount}
              disabled={!provider || !userId || verifying}
              activeOpacity={0.85}
            >
              {verifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={17}
                    color="#fff"
                  />
                  <Text style={styles.verifyBtnText}>Verify Account</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Verified account card */}
          {verifiedAccount && (
            <VerifiedAccountCard
              customerName={verifiedAccount.customerName}
              userId={verifiedAccount.userId}
              service={verifiedAccount.service}
              themeColors={themeColors}
            />
          )}
        </View>

        {/* ── Amount Section ───────────────────────────────────────────────── */}
        {verifiedAccount && (
          <Animated.View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionBadge,
                  { backgroundColor: `${themeColors.primary}18` },
                ]}
              >
                <Text
                  style={[
                    styles.sectionBadgeText,
                    { color: themeColors.primary },
                  ]}
                >
                  03
                </Text>
              </View>
              <Text
                style={[styles.sectionTitle, { color: themeColors.heading }]}
              >
                Enter Amount
              </Text>
            </View>

            {/* Quick pills */}
            <QuickAmountPills
              onSelect={setAmount}
              selectedAmount={amount}
              themeColors={themeColors}
            />

            <AmountInput
              value={amount}
              onChangeText={setAmount}
              label="Custom Amount"
              placeholder={`Min ₦${MIN_AMOUNT.toLocaleString()} — Max ₦${MAX_AMOUNT.toLocaleString()}`}
              error={validationErrors.amount}
              minAmount={MIN_AMOUNT}
              maxAmount={MAX_AMOUNT}
            />

            {/* Summary card */}
            {amount && parseFloat(amount) >= MIN_AMOUNT && (
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.summaryCardTitle,
                    { color: themeColors.heading },
                  ]}
                >
                  Order Summary
                </Text>

                <SummaryRow
                  label="Platform"
                  value={getProviderInfo()?.label ?? '—'}
                  themeColors={themeColors}
                />
                <SummaryRow
                  label="Account"
                  value={verifiedAccount.customerName}
                  themeColors={themeColors}
                />
                <SummaryRow
                  label="User ID"
                  value={userId}
                  themeColors={themeColors}
                />

                <View
                  style={[
                    styles.summaryDivider,
                    { backgroundColor: themeColors.border },
                  ]}
                />

                <SummaryRow
                  label="Funding Amount"
                  value={formatCurrency(numAmount, 'NGN')}
                  themeColors={themeColors}
                />
                <SummaryRow
                  label="Service Fee"
                  value={formatCurrency(serviceFee, 'NGN')}
                  themeColors={themeColors}
                />
                <View
                  style={[
                    styles.summaryDivider,
                    { backgroundColor: themeColors.border },
                  ]}
                />
                <SummaryRow
                  label="Total Charged"
                  value={formatCurrency(totalCharged, 'NGN')}
                  highlight
                  themeColors={themeColors}
                />
              </View>
            )}

            {/* Change account */}
            <TouchableOpacity
              style={[
                styles.changeAccountBtn,
                { borderColor: themeColors.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setVerifiedAccount(null);
                setUserId('');
                setAmount('');
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={16}
                color={themeColors.subtext}
              />
              <Text
                style={[
                  styles.changeAccountText,
                  { color: themeColors.subtext },
                ]}
              >
                Change account
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Flow / Verification Errors ──────────────────────────────────── */}
        {(validationErrors.verification || payment.flowError) && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: `${themeColors.destructive}12` },
            ]}
          >
            <Ionicons
              name="warning-outline"
              size={18}
              color={themeColors.destructive}
            />
            <Text
              style={[styles.errorBannerText, { color: themeColors.destructive }]}
            >
              {validationErrors.verification || payment.flowError}
            </Text>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky Footer ─────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.stickyFooter,
          {
            backgroundColor: themeColors.background,
            borderTopColor: themeColors.border,
            paddingBottom: insets.bottom + 12,
            transform: [
              {
                translateY: footerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [120, 0],
                }),
              },
            ],
            opacity: footerAnim,
          },
        ]}
        pointerEvents={showFooter ? 'auto' : 'none'}
      >
        <View style={styles.footerMeta}>
          <View>
            <Text
              style={[styles.footerMetaLabel, { color: themeColors.subheading }]}
            >
              {getProviderInfo()?.label} · {verifiedAccount?.customerName}
            </Text>
            <Text
              style={[styles.footerAmount, { color: themeColors.heading }]}
            >
              {numAmount > 0 ? formatCurrency(totalCharged, 'NGN') : '₦0.00'}
            </Text>
          </View>
          <View
            style={[
              styles.footerBalanceChip,
              { backgroundColor: `${themeColors.primary}12` },
            ]}
          >
            <Text
              style={[styles.footerBalanceLabel, { color: themeColors.subtext }]}
            >
              Balance
            </Text>
            <Text
              style={[styles.footerBalanceValue, { color: themeColors.primary }]}
            >
              {formatCurrency(wallet?.user?.walletBalance ?? 0, 'NGN')}
            </Text>
          </View>
        </View>

        <PayButton
          title="Fund Account"
          onPress={handleFundAccount}
          disabled={payment.step === 'processing'}
          loading={payment.step === 'processing'}
          icon="arrow-forward"
          style={styles.fundBtn}
        />
      </Animated.View>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName="Betting Funding"
        paymentAmount={parseFloat(amount) || 0}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={totalCharged}
        serviceName={`${getProviderInfo()?.label} Funding`}
        providerLogo={getProviderInfo()?.logo}
        providerName={getProviderInfo()?.label}
        recipient={userId}
        recipientLabel="User ID"
        walletBalance={wallet?.user?.walletBalance}
        additionalDetails={[
          { label: 'Customer',       value: verifiedAccount?.customerName ?? 'N/A' },
          { label: 'Funding Amount', value: formatCurrency(numAmount, 'NGN') },
          { label: 'Service Fee',    value: formatCurrency(serviceFee, 'NGN') },
          { label: 'Total Charged',  value: formatCurrency(totalCharged, 'NGN') },
        ]}
        loading={false}
      />

      <PinModal
        visible={payment.step === 'pin'}
        onClose={payment.handleCancelPayment}
        onSubmit={(pin) => payment.submitPayment(pin)}
        onForgotPin={payment.handleForgotPin}
        loading={payment.step === 'processing'}
        error={payment.pinError}
        title="Enter PIN"
        subtitle={`Confirm ${formatCurrency(totalCharged, 'NGN')} total charge`}
      />

      <ResultModal
        visible={payment.step === 'result'}
        onClose={payment.resetFlow}
        type={payment.result ? 'success' : 'error'}
        title={payment.result ? '🎉 Funded Successfully!' : 'Funding Failed'}
        message={
          payment.result
            ? `Your ${getProviderInfo()?.label} account (${userId}) has been funded with ${formatCurrency(parseFloat(amount || 0), 'NGN')}.`
            : 'We could not complete your funding. Please try again.'
        }
        primaryAction={{ label: 'View Receipt', onPress: handleTransactionComplete }}
        secondaryAction={{ label: 'Done', onPress: payment.resetFlow }}
      />

      <LoadingOverlay
        visible={payment.step === 'processing'}
        message="Processing your funding…"
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, fontWeight: '500' },

  // History button
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  historyBtnText: { fontSize: 13, fontWeight: '600' },

  // Hero banner
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  heroSubtitle: { fontSize: 12, fontWeight: '500' },

  // Wallet chip
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  walletChipText: { fontSize: 13, fontWeight: '700' },

  // Step card
  stepCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: { alignItems: 'center', gap: 5 },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 11 },
  stepConnector: { flex: 1, height: 2, marginHorizontal: 6, marginBottom: 16 },

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionBadgeText: { fontSize: 11, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },

  // Provider grid
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  providerBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerLogo: { width: 36, height: 36, marginBottom: 7 },
  providerLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 7,
  },
  providerLogoText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  providerLabel: { fontSize: 11, textAlign: 'center' },

  // Input card
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 8,
  },
  inputIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputField: { flex: 1, fontSize: 15, fontWeight: '600' },
  verifiedBadgeSmall: { marginLeft: 4 },

  // Verify button
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  verifyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Field error
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  fieldErrorText: { fontSize: 12, fontWeight: '500' },

  // Verified account card
  verifiedCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  verifiedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  verifiedIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#22C55E20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedTitle: { fontSize: 14, fontWeight: '700' },
  verifiedSubtitle: { fontSize: 12, fontWeight: '500' },
  verifiedDivider: {
    height: 1,
    backgroundColor: '#22C55E30',
    marginBottom: 14,
  },
  verifiedGrid: { gap: 10 },
  verifiedDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedDetailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#166534',
  },
  verifiedDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    maxWidth: '60%',
  },

  // Quick pills
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pillText: { fontSize: 13, fontWeight: '700' },

  // Summary card
  summaryCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  summaryCardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  summaryRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowLabel: { fontSize: 13, fontWeight: '500' },
  summaryRowValue: { fontSize: 13 },
  summaryDivider: { height: 1, marginVertical: 4 },
  feeNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  feeNoteText: { flex: 1, fontSize: 12, lineHeight: 17 },

  // Change account
  changeAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  changeAccountText: { fontSize: 13, fontWeight: '600' },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  errorBannerText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },

  // Sticky footer
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
  },
  footerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerMetaLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  footerAmount: { fontSize: 22, fontWeight: '800' },
  footerBalanceChip: {
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  footerBalanceLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  footerBalanceValue: { fontSize: 14, fontWeight: '700' },
  fundBtn: { width: '100%' },
});
