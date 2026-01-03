// screens/TransactionDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { PaymentApiIPAddress } from 'utility/apiIPAdress';
import { STORAGE_KEYS } from 'utility/storageKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackBtn from 'utility/BackBtn';
import HistoryComponent from 'component/historyComponent';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { MobileProviders, TvProviders, ElectricityProviders, customImages } from 'constants/serviceImages';
import { StatusBarComponent } from 'component/StatusBar';

const BASE_URL = PaymentApiIPAddress;

// ========================================
// Transaction Details Screen (Updated)
// ========================================
export default function TransactionDetailsScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet } = useWallet();
  
  const { reference } = route.params || {};

  // State
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ========================================
  // Fetch Transaction Details
  // ========================================
  useEffect(() => {
    if (reference) {
      fetchTransactionDetails();
    } else {
      setError('No transaction reference provided');
      setIsLoading(false);
    }
  }, [reference]);

  const fetchTransactionDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      const response = await fetch(
        `${BASE_URL}/transactions/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }

      const data = await response.json();
      setTransaction(data.data || data);
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError(err.message || 'Failed to load transaction details');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // Helper Functions
  // ========================================
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'successful':
      case 'delivered':
        return '#4CAF50';
      case 'failed':
        return themeColors.destructive;
      case 'pending':
        return '#FFC107';
      default:
        return themeColors.subtext;
    }
  };

  const getServiceLogo = (serviceID) => {
    const allProviders = [...MobileProviders, ...TvProviders, ...ElectricityProviders];
    const provider = allProviders.find(p => serviceID?.toLowerCase().includes(p.value));
    return provider ? provider.logo : customImages.FallBack;
  };

  const getServiceName = (type) => {
    const names = {
      airtime: 'Airtime Recharge',
      data: 'Data Bundle',
      electricity: 'Electricity Payment',
      tv: 'TV Subscription',
      education: 'Educational Service',
    };
    return names[type] || 'Transaction';
  };

  const getProviderName = (serviceID) => {
    if (!serviceID) return 'N/A';
    
    if (serviceID.includes('mtn')) return 'MTN';
    if (serviceID.includes('airtel')) return 'Airtel';
    if (serviceID.includes('glo')) return 'Glo';
    if (serviceID.includes('etisalat') || serviceID.includes('9mobile')) return '9mobile';
    if (serviceID.includes('dstv')) return 'DSTV';
    if (serviceID.includes('gotv')) return 'GOTV';
    if (serviceID.includes('startimes')) return 'Startimes';
    if (serviceID.includes('showmax')) return 'Showmax';
    
    if (serviceID.includes('ikeja')) return 'Ikeja Electric (IKEDC)';
    if (serviceID.includes('eko')) return 'Eko Electric (EKEDC)';
    if (serviceID.includes('kano')) return 'Kano Electric (KEDCO)';
    if (serviceID.includes('portharcourt')) return 'Port Harcourt Electric (PHED)';
    if (serviceID.includes('jos')) return 'Jos Electric (JED)';
    if (serviceID.includes('ibadan')) return 'Ibadan Electric (IBEDC)';
    if (serviceID.includes('kaduna')) return 'Kaduna Electric (KAEDCO)';
    if (serviceID.includes('abuja')) return 'Abuja Electric (AEDC)';
    
    return serviceID.toUpperCase();
  };

  // ========================================
  // Action Handlers
  // ========================================
  const handleShare = () => {
    // if (!transaction) {
    //   Alert.alert('Error', 'No transaction data available');
    //   return;
    // }
    
    console.log('📤 Navigating to ShareReceipt with reference:', transaction.reference);
    
    // ✅ TASK 1: Pass the transaction reference
    navigation.navigate('ShareReceipt', { 
      reference: transaction.reference,
      transaction: transaction //  pass full transaction for immediate use
    });
  };

  // ✅ TASK 2: Report Issue Handler (Always visible, navigates to IssueReport screen)
  const handleReportIssue = () => {
    if (!transaction) {
      Alert.alert('Error', 'No transaction data available');
      return;
    }
    
    console.log('⚠️ Navigating to IssueReport with transaction:', transaction.reference);
    
    // Navigate to IssueReport screen with transaction data
    navigation.navigate('IssueReport', { 
      transaction: transaction,
      reference: transaction.reference
    });
  };

  // ========================================
  // Render Service-Specific Details
  // ========================================
  // ========================================
// Render Service-Specific Details
// ========================================
const renderServiceDetails = (txn, colors) => {
  if (!txn) return null;

  const { type } = txn;

  const commonDetails = (
    <>
      <DetailRow label="Reference" value={txn.reference} copiable themeColors={colors} />
      <DetailRow label="Transaction ID" value={txn.transactionId || 'N/A'} themeColors={colors} />
    </>
  );

  switch (type) {
    case 'airtime':
      return (
        <>
          <DetailRow label="Phone Number" value={txn.phoneNumber} themeColors={colors} />
          <DetailRow label="Network" value={getProviderName(txn.serviceID)} themeColors={colors} />
          {commonDetails}
        </>
      );

    case 'data':
      return (
        <>
          <DetailRow label="Phone Number" value={txn.phoneNumber} themeColors={colors} />
          <DetailRow label="Network" value={getProviderName(txn.serviceID)} themeColors={colors} />
          <DetailRow label="Data Plan" value={txn.variation_code || 'N/A'} themeColors={colors} />
          {commonDetails}
        </>
      );

    case 'electricity':
      return (
        <>
          <DetailRow label="Meter Number" value={txn.billersCode} themeColors={colors} />
          <DetailRow label="Distribution Company" value={getProviderName(txn.serviceID)} themeColors={colors} />
          <DetailRow label="Meter Type" value={txn.variation_code || 'N/A'} themeColors={colors} />
          {txn.purchasedCode && <DetailRow label="Token" value={txn.purchasedCode} copiable highlighted themeColors={colors} />}
          {commonDetails}
        </>
      );

    case 'tv':
      return (
        <>
          <DetailRow label="Smartcard Number" value={txn.billersCode} themeColors={colors} />
          <DetailRow label="Provider" value={getProviderName(txn.serviceID)} themeColors={colors} />
          <DetailRow label="Package" value={txn.variation_code || 'N/A'} themeColors={colors} />
          <DetailRow label="Subscription Type" value={txn.subscription_type || 'N/A'} themeColors={colors} />
          {commonDetails}
        </>
      );

    default:
      return commonDetails;
  }
};


  // ========================================
  // Render States
  // ========================================
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.subtext }]}>
            Loading transaction details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorIcon, { color: themeColors.destructive }]}>⚠️</Text>
          <Text style={[styles.errorText, { color: themeColors.heading }]}>
            {error || 'Transaction not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
            onPress={fetchTransactionDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: themeColors.primary }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ========================================
  // Main Render
  // ========================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
    <StatusBarComponent/>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.card }]}>
        <BackBtn onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>
          Transaction Details
        </Text>
        <HistoryComponent
  onPress={() => navigation.navigate('MainTabs', { screen: 'Orders' })}
/>

      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.statusIconContainer}>
            <Image 
              source={getServiceLogo(transaction.serviceID || transaction.type)} 
              style={{ width: 40, height: 40, resizeMode: 'cover', borderRadius: 100 }}
            />
          </View>
          <Text style={[styles.serviceTitle, { color: themeColors.heading }]}>
            {getServiceName(transaction.type)}
          </Text>
          <Text style={[styles.amountText, { color: themeColors.primary }]}>
            {formatCurrency(transaction.amount, 'NGN')}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(transaction.status)}20` },
            ]}
          >
            <Text
              style={[styles.statusText, { color: getStatusColor(transaction.status) }]}
            >
              {transaction.status?.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: themeColors.subtext }]}>
            {formatDate(transaction.createdAt)}
          </Text>
        </View>

        {/* Details Section */}
        <View style={[styles.detailsCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
            Transaction Details
          </Text>
          {renderServiceDetails(transaction, themeColors)}
          
          {/* Commission & Discount */}
          {(transaction.commission || transaction.discount) && (
            <>
              {transaction.commission > 0 && (
                <DetailRow
                  label="Commission"
                  value={formatCurrency(transaction.commission, 'NGN')}
                  themeColors={themeColors}
                />
              )}
              {transaction.discount > 0 && (
                <DetailRow
                  label="Discount"
                  value={formatCurrency(transaction.discount, 'NGN')}
                  themeColors={themeColors}
                />
              )}
            </>
          )}
        </View>

        {/* Failure Reason (if failed) */}
        {transaction.status === 'failed' && transaction.failureReason && (
          <View
            style={[
              styles.failureCard,
              { backgroundColor: `${themeColors.destructive}20` },
            ]}
          >
            <Text style={[styles.failureTitle, { color: themeColors.destructive }]}>
              Failure Reason
            </Text>
            <Text style={[styles.failureText, { color: themeColors.heading }]}>
              {transaction.failureReason}
            </Text>
          </View>
        )}
 
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Share Receipt Button */}
          <View style={styles.receiptShare}>
            <TouchableOpacity 
              onPress={handleShare} 
              style={[styles.actionButton, { backgroundColor: 'rgba(84, 3, 245, 0.2)' }]}
            >
              <Entypo name="share" size={24} color="#5403f5ff" />
              <Text style={[styles.actionButtonText, { color: themeColors.primary }]}>
                Share Receipt
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* ✅ TASK 2: Report Issue Button (Always Visible) */}
          <TouchableOpacity
            style={[
              styles.reportButton,
              { 
                backgroundColor: themeColors.destructive,
                borderColor: themeColors.destructive,
              },
            ]}
            onPress={handleReportIssue}
          >
            <AntDesign name="warning" size={20} color="#FFF" />
            <Text style={styles.reportButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ========================================
// Detail Row Component
// ========================================
const DetailRow = ({ label, value, copiable, highlighted, themeColors }) => {
  const handleCopy = () => {
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: themeColors.subtext }]}>{label}</Text>
      <View style={styles.detailValueContainer}>
        <Text
          style={[
            styles.detailValue,
            { color: highlighted ? themeColors.primary : themeColors.heading },
            highlighted && styles.highlightedValue,
          ]}
        >
          {value}
        </Text>
        {copiable && (
          <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
            <Text style={[styles.copyIcon, { color: themeColors.primary }]}>copy</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ========================================
// Styles
// ========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: 'rgba(84, 3, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
  },
  detailsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
    justifyContent: 'flex-end',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  highlightedValue: {
    fontWeight: '700',
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  copyIcon: {
    fontSize: 12,
  },
  failureCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  failureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  failureText: {
    fontSize: 13,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
    marginVertical: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  receiptShare: {
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    // width: 100,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  reportButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  reportButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});