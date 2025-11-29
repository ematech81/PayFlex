// screens/ShareReceiptScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ImageBackground,
} from 'react-native';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { PaymentApiIPAddress } from 'utility/apiIPAdress';
import { STORAGE_KEYS } from 'utility/storageKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackBtn from 'utility/BackBtn';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MobileProviders, TvProviders, ElectricityProviders, customImages } from 'constants/serviceImages';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import AppImage from 'component/allImage';

const BASE_URL = PaymentApiIPAddress;


export default function ShareReceiptScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const receiptRef = useRef();

  // Get data from route params
  const { reference, transaction: passedTransaction } = route.params || {};

  // State
  const [transaction, setTransaction] = useState(passedTransaction || null);
  const [isLoading, setIsLoading] = useState(!passedTransaction);
  const [error, setError] = useState(null);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [isSharingPDF, setIsSharingPDF] = useState(false);

  // ========================================
  // Fetch Transaction if not passed
  // ========================================
  useEffect(() => {
    if (!transaction && reference) {
      fetchTransactionDetails();
    } else if (!transaction && !reference) {
      setError('No transaction reference provided');
      setIsLoading(false);
    }
  }, [reference, transaction]);

  const fetchTransactionDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      const response = await fetch(`${BASE_URL}/transactions/${reference}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }

      const data = await response.json();
      setTransaction(data.data || data);
    } catch (err) {
      console.error('❌ Error fetching transaction:', err);
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'successful':
      case 'delivered':
        return '#4CAF50';
      case 'failed':
        return '#ff3b30';
      case 'pending':
        return '#FFC107';
      default:
        return '#999';
    }
  };

  const getServiceLogo = (serviceID) => {
    const allProviders = [...MobileProviders, ...TvProviders, ...ElectricityProviders];
    const provider = allProviders.find(p => serviceID?.toLowerCase().includes(p.value));
    return provider ? provider.logo : require('../asset/fallback.jpg');
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
    
    // Electricity
    if (serviceID.includes('ikeja')) return 'Ikeja Electric';
    if (serviceID.includes('eko')) return 'Eko Electric';
    if (serviceID.includes('kano')) return 'Kano Electric';
    if (serviceID.includes('portharcourt')) return 'Port Harcourt Electric';
    if (serviceID.includes('jos')) return 'Jos Electric';
    if (serviceID.includes('ibadan')) return 'Ibadan Electric';
    if (serviceID.includes('kaduna')) return 'Kaduna Electric';
    if (serviceID.includes('abuja')) return 'Abuja Electric';
    
    return serviceID.toUpperCase();
  };
  // ========================================
  // Share as Image Handler
  // ========================================
  const handleShareAsImage = async () => {
    setIsSharingImage(true);
    
    try {
      console.log('📸 Capturing receipt as image...');
      
      // Capture the receipt view as image
      const uri = await receiptRef.current.capture({
        format: 'png',
        quality: 1.0,
      });
      
      console.log('✅ Image captured:', uri);
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }
      
      // Share the image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share PayFlex Receipt',
        UTI: 'public.png',
      });
      
      console.log('✅ Receipt shared successfully');
      
    } catch (error) {
      console.error('❌ Share image error:', error);
      Alert.alert('Share Failed', 'Could not share receipt as image. Please try again.');
    } finally {
      setIsSharingImage(false);
    }
  };
  
  // ========================================
  // Share as PDF Handler
  // ========================================
  const handleShareAsPDF = async () => {
    setIsSharingPDF(true);
    
    try {
      console.log('📄 Generating PDF receipt...');
      
      // First capture as image
      const imageUri = await receiptRef.current.capture({
        format: 'png',
        quality: 1.0,
      });
      
      // Read the image as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Create HTML with embedded image
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #f5f5f5;
              }
              .receipt-container {
                max-width: 100%;
                width: auto;
                height: auto;
              }
              img {
                max-width: 100%;
                height: auto;
                display: block;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <img src="data:image/png;base64,${base64}" alt="PayFlex Receipt" />
            </div>
          </body>
        </html>
      `;
      
      // Generate PDF
      const { uri: pdfUri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      
      console.log('✅ PDF generated:', pdfUri);
      
      // Rename file to something more descriptive
      const newUri = `${FileSystem.documentDirectory}PayFlex_Receipt_${transaction.reference}.pdf`;
      await FileSystem.moveAsync({
        from: pdfUri,
        to: newUri,
      });
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }
      
      // Share the PDF
      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share PayFlex Receipt',
        UTI: 'com.adobe.pdf',
      });
      
      console.log('✅ PDF shared successfully');
      
    } catch (error) {
      console.error('❌ Share PDF error:', error);
      Alert.alert('Share Failed', 'Could not generate PDF receipt. Please try again.');
    } finally {
      setIsSharingPDF(false);
    }
  };

  // ========================================
  // Render Receipt Details
  // ========================================
  const renderReceiptDetails = () => {
    if (!transaction) return null;

    const { type } = transaction;

    const commonDetails = (
      <>
        <ReceiptRow label="Reference" value={transaction.reference} />
        {/* <ReceiptRow label="Transaction ID" value={transaction.transactionId || 'N/A'} /> */}
      </>
    );

    switch (type) {
      case 'airtime':
        return (
          <>
            <ReceiptRow label="Phone Number" value={transaction.phoneNumber} />
            <ReceiptRow label="Network" value={getProviderName(transaction.serviceID)} />
            {commonDetails}
          </>
        );

      case 'data':
        return (
          <>
            <ReceiptRow label="Phone Number" value={transaction.phoneNumber} />
            <ReceiptRow label="Network" value={getProviderName(transaction.serviceID)} />
            <ReceiptRow label="Data Plan" value={transaction.variation_code || 'N/A'} />
            {commonDetails}
          </>
        );

      case 'electricity':
        return (
          <>
            <ReceiptRow label="Meter Number" value={transaction.billersCode} />
            <ReceiptRow label="DISCO" value={getProviderName(transaction.serviceID)} />
            <ReceiptRow label="Meter Type" value={transaction.variation_code || 'N/A'} />
            {transaction.purchasedCode && (
              <ReceiptRow label="Token" value={transaction.purchasedCode} highlighted />
            )}
            {commonDetails}
          </>
        );

      case 'tv':
        return (
          <>
            <ReceiptRow label="Smartcard" value={transaction.billersCode} />
            <ReceiptRow label="Provider" value={getProviderName(transaction.serviceID)} />
            <ReceiptRow label="Package" value={transaction.variation_code || 'N/A'} />
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
            Loading receipt...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: themeColors.heading }]}>
            {error || 'Transaction not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
            onPress={fetchTransactionDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.card }]}>
        <BackBtn onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>
          Share Receipt
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
      <ViewShot 
          ref={receiptRef}
          options={{ 
            format: 'png', 
            quality: 1.0,
            result: 'tmpfile' 
          }}
        >
        {/* Receipt Card with Background Image */}
        <ImageBackground 
          ref={receiptRef}
          style={styles.receiptContainer}
          source={customImages.ReceiptBackground} //  Canva background here
            resizeMode="cover"
        >
          
          {/* Receipt Content Overlay */}
          <View style={styles.receiptContent}>
            {/* Logo/Brand Section */}
            <View style={styles.brandSection}>
           
              <AppImage/> 
           
               <Text style={styles.footerSubtext}>Transaction Resceipt</Text>
            </View>

            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(transaction.status) },
              ]}
            >
              <Ionicons 
                name={transaction.status === 'success' ? 'checkmark-circle' : 'close-circle'} 
                size={24} 
                color="#FFF" 
              />
              <Text style={styles.statusText}>
                {transaction.status?.toUpperCase()}
              </Text>
            </View>

            {/* Service Info */}
            <View style={styles.serviceSection}>
              <Image 
                source={getServiceLogo(transaction.serviceID)} 
                style={styles.serviceLogo}
              />
              <Text style={styles.serviceName}>
                {getServiceName(transaction.type)}
              </Text>
            </View>

            {/* Amount */}
            <Text style={styles.amountText}>
              {formatCurrency(transaction.amount, 'NGN')}
            </Text>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Transaction Details */}
            <View style={styles.detailsSection}>
              {renderReceiptDetails()}
              <ReceiptRow label="Date" value={formatDate(transaction.createdAt)} />
            </View>

            {/* Footer */}
            <View style={styles.receiptFooter}>
              <Text style={styles.footerText}>
                Thank you for using PayFlex
              </Text>
              <Text style={styles.footerSubtext}>
                We Are Commited To Serving you Best
              </Text>
            </View>
          </View>
        </ImageBackground>
        </ViewShot>

        {/* Share Buttons */}
        <View style={styles.shareButtons}>
          <TouchableOpacity
            style={[
              styles.shareButton,
              { backgroundColor: themeColors.primary },
              isSharingImage && styles.shareButtonDisabled,
            ]}
            onPress={handleShareAsImage}
            disabled={isSharingImage}
          >
            {isSharingImage ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <AntDesign name="picture" size={24} color="#FFF" />
                <Text style={styles.shareButtonText}>Share as Image</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shareButton,
              { backgroundColor: 'rgba(84, 3, 245, 0.2)' },
              isSharingPDF && styles.shareButtonDisabled,
            ]}
            onPress={handleShareAsPDF}
            disabled={isSharingPDF}
          >
            {isSharingPDF ? (
              <ActivityIndicator size="small" color={themeColors.primary} />
            ) : (
              <>
                <AntDesign name="pdffile1" size={24} color={themeColors.primary} />
                <Text style={[styles.shareButtonText, { color: themeColors.primary }]}>
                  Share as PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ========================================
// Receipt Row Component
// ========================================
const ReceiptRow = ({ label, value, highlighted }) => (
  <View style={styles.receiptRow}>
    <Text style={styles.receiptLabel}>{label}</Text>
    <Text style={[styles.receiptValue, highlighted && styles.highlightedValue]}>
      {value}
    </Text>
  </View>
);

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
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 40,
  },
  receiptContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 24,
  },
  receiptBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  receiptContent: {
    padding: 24,
    // backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent overlay
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
    padding: 2
  },
  brandLogo: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5403f5ff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    marginBottom: 20,
    gap: 2,
  },
  statusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  serviceSection: {
    alignItems: 'center',
    // marginBottom: 16,
  },
  serviceLogo: {
    width: 30,
    height: 30,
    marginBottom: 8,
    borderRadius: 25,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  amountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#5403f5ff',
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  detailsSection: {
    // marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  receiptLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  highlightedValue: {
    color: '#5403f5ff',
    fontWeight: 'bold',
  },
  receiptFooter: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
  shareButtons: {
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});


