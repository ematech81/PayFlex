// components/VerificationSlip.js - FIXED VERSION (JavaScript)
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  ScrollView,
  PermissionsAndroid,

} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';

/**
 * Regular NIMS Design (Official Style)
 */
const RegularSlipDesign = ({ data, verificationType }) => (
  <View style={[styles.slip, styles.regularSlip]}>
    {/* Header */}
    <View style={styles.regularHeader}>
      <View style={styles.regularLogo}>
        <Text style={styles.logoPlaceholder}>🇳🇬</Text>
      </View>
      <View style={styles.regularTitle}>
        <Text style={styles.regularMainTitle}>National Identity Management System</Text>
        <Text style={styles.regularSubtitle}>Federal Republic of Nigeria</Text>
        <Text style={styles.regularSlipType}>
          National Identification Number Slip (NINS)
        </Text>
      </View>
      <View style={styles.regularLogo}>
        <Text style={styles.logoPlaceholder}>NIMC</Text>
      </View>
    </View>

    {/* Content */}
    <View style={styles.regularContent}>
      {/* Left Section */}
      <View style={styles.regularLeft}>
        <View style={styles.regularField}>
          <Text style={styles.regularFieldLabel}>Tracking ID</Text>
          <Text style={styles.regularFieldValue}>{data.reportId || 'N/A'}</Text>
        </View>
        <View style={styles.regularField}>
          <Text style={styles.regularFieldLabel}>NIN</Text>
          <Text style={[styles.regularFieldValue, styles.ninHighlight]}>{data.nin}</Text>
        </View>
        <View style={styles.regularField}>
          <Text style={styles.regularFieldLabel}>Issue Date</Text>
          <Text style={styles.regularFieldValue}>
            {new Date(data.verifiedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.regularField}>
          <Text style={styles.regularFieldLabel}>Surname</Text>
          <Text style={styles.regularFieldValue}>{data.fullName.split(' ')[2] || 'N/A'}</Text>
        </View>
        <View style={styles.regularField}>
          <Text style={styles.regularFieldLabel}>First Name</Text>
          <Text style={styles.regularFieldValue}>{data.fullName.split(' ')[0] || 'N/A'}</Text>
        </View>
        <View style={styles.regularField}>
          <Text style={styles.regularFieldLabel}>Middle Name</Text>
          <Text style={styles.regularFieldValue}>{data.fullName.split(' ')[1] || 'N/A'}</Text>
        </View>
        <View style={styles.regularField}>
          <Text style={styles.regularFieldLabel}>Gender</Text>
          <Text style={styles.regularFieldValue}>{data.gender}</Text>
        </View>
      </View>

      {/* Right Section */}
      <View style={styles.regularRight}>
        <Image
          source={{ uri: `data:image/jpeg;base64,${data.photo}` }}
          style={styles.regularPhoto}
          resizeMode="cover"
        />
        <View style={styles.regularAddressBox}>
          <Text style={styles.regularAddressLabel}>Address:</Text>
          <Text style={styles.regularAddressText}>{data.address || 'N/A'}</Text>
          <Text style={styles.regularAddressText}>{data.lga}</Text>
          <Text style={styles.regularAddressText}>{data.state}</Text>
        </View>
      </View>
    </View>

    {/* Footer */}
    <View style={styles.regularFooter}>
      <Text style={styles.regularFooterText}>📧 helpdesk@nimc.gov.ng</Text>
      <Text style={styles.regularFooterText}>🌐 www.nimc.gov.ng</Text>
      <Text style={styles.regularFooterText}>📞 07040144452</Text>
      <Text style={styles.regularFooterText}>NIMC HQ, Wuse Abuja</Text>
    </View>

    <Text style={styles.regularNote}>
      Note: This transaction slip does not confer the right to the General Multipurpose Card
    </Text>
  </View>
);

/**
 * Premium Digital Design (Card Style)
 */
const PremiumSlipDesign = ({ data, verificationType }) => (
  <View style={[styles.slip, styles.premiumSlip]}>
    {/* Header with Green Pattern */}
    <View style={styles.premiumHeader}>
      <Text style={styles.premiumCountry}>FEDERAL REPUBLIC OF NIGERIA</Text>
      <Text style={styles.premiumSlipType}>DIGITAL NIN SLIP</Text>
    </View>

    {/* Main Content */}
    <View style={styles.premiumContent}>
      {/* Photo */}
      <View style={styles.premiumPhotoContainer}>
        <Image
          source={{ uri: `data:image/jpeg;base64,${data.photo}` }}
          style={styles.premiumPhoto}
          resizeMode="cover"
        />
      </View>

      {/* Details */}
      <View style={styles.premiumDetails}>
        <View style={styles.premiumField}>
          <Text style={styles.premiumLabel}>SURNAME/NOM</Text>
          <Text style={styles.premiumValue}>{data.fullName.split(' ')[2] || 'RESIDENT'}</Text>
        </View>

        <View style={styles.premiumField}>
          <Text style={styles.premiumLabel}>GIVEN NAMES/PRÉNOMS</Text>
          <Text style={styles.premiumValue}>
            {data.fullName.split(' ').slice(0, 2).join(', ')}
          </Text>
        </View>

        <View style={styles.premiumRow}>
          <View style={styles.premiumFieldHalf}>
            <Text style={styles.premiumLabel}>DATE OF BIRTH</Text>
            <Text style={styles.premiumValue}>{data.dateOfBirth}</Text>
          </View>
          <View style={styles.premiumFieldHalf}>
            <Text style={styles.premiumLabel}>SEX/SEXE</Text>
            <Text style={styles.premiumValue}>{data.gender}</Text>
          </View>
        </View>
      </View>

      {/* QR Code Placeholder */}
      <View style={styles.premiumQR}>
        <Text style={styles.qrPlaceholder}>◼◼◼{'\n'}◼◼◼{'\n'}◼◼◼</Text>
        <Text style={styles.premiumCountryCode}>NGA</Text>
      </View>
    </View>

    {/* Issue Date */}
    <View style={styles.premiumIssueDate}>
      <Text style={styles.premiumIssueDateLabel}>ISSUE DATE</Text>
      <Text style={styles.premiumIssueDateValue}>
        {new Date(data.verifiedAt).toLocaleDateString()}
      </Text>
    </View>

    {/* NIN Number */}
    <View style={styles.premiumNIN}>
      <Text style={styles.premiumNINLabel}>National Identification Number (NIN)</Text>
      <Text style={styles.premiumNINValue}>{data.nin}</Text>
    </View>
  </View>
);

/**
 * Enhanced Verification Slip Component
 * FIXED: PDF shows image properly, Image save works
 */
export default function VerificationSlip({ 
  data, 
  verificationType,
  onClose,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const slipRef = useRef();
  
  const [slipDesign, setSlipDesign] = useState('regular');
  const [isDownloading, setIsDownloading] = useState(false);

  // Open NIMC Portal
  const handleOpenNIMCPortal = async () => {
    const url = 'https://selfservice.nimc.gov.ng/#/dashboard';
    
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open NIMC portal');
    }
  };

  // FIXED: Save as Image with proper permissions
  const handleSaveAsImage = async () => {
    try {
      setIsDownloading(true);

      // Request permissions
      if (Platform.OS === 'android') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Storage permission is required to save images');
          return;
        }
      }

      // Capture screenshot
      const uri = await slipRef.current.capture();
      
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('PayFlex', asset, false);
      
      Alert.alert(
        'Success',
        'Verification slip saved to gallery',
        [
          {
            text: 'Share',
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
              }
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', error.message || 'Failed to save image');
    } finally {
      setIsDownloading(false);
    }
  };

  // FIXED: Download PDF with embedded image (base64)
  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);

      // Generate HTML with embedded base64 image
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif;
              padding: 20px;
              background: #fff;
            }
            .slip {
              width: 100%;
              max-width: 1000px;
              margin: 0 auto;
              border: 3px solid #000;
              padding: 30px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 25px;
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 40px;
              font-weight: bold;
              width: 100px;
              text-align: center;
            }
            .title {
              text-align: center;
              flex: 1;
            }
            .title h1 {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .title h2 {
              font-size: 18px;
              font-weight: normal;
            }
            .title h3 {
              font-size: 14px;
              margin-top: 8px;
            }
            .content {
              display: flex;
              gap: 30px;
              margin-bottom: 25px;
            }
            .left-section {
              flex: 2;
              border-right: 2px solid #000;
              padding-right: 30px;
            }
            .right-section {
              flex: 1;
              text-align: center;
            }
            .field {
              display: flex;
              border-bottom: 2px solid #000;
              padding: 15px 0;
            }
            .field-label {
              font-weight: bold;
              width: 140px;
              font-size: 14px;
            }
            .field-value {
              flex: 1;
              font-size: 14px;
            }
            .nin-highlight {
              font-size: 22px;
              font-weight: bold;
              color: #d32f2f;
            }
            .photo {
              width: 100%;
              max-width: 250px;
              height: 250px;
              border: 3px solid #000;
              margin: 0 auto 15px;
              object-fit: cover;
              display: block;
            }
            .address-box {
              border: 2px solid #000;
              padding: 15px;
              text-align: left;
              font-size: 13px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px solid #000;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              flex-wrap: wrap;
              gap: 10px;
            }
            .note {
              margin-top: 15px;
              font-size: 10px;
              font-style: italic;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="slip">
            <div class="header">
              <div class="logo">🇳🇬</div>
              <div class="title">
                <h1>National Identity Management System</h1>
                <h2>Federal Republic of Nigeria</h2>
                <h3>National Identification Number Slip (NINS)</h3>
              </div>
              <div class="logo">NIMC</div>
            </div>

            <div class="content">
              <div class="left-section">
                <div class="field">
                  <div class="field-label">Tracking ID</div>
                  <div class="field-value">${data.reportId || 'N/A'}</div>
                </div>
                <div class="field">
                  <div class="field-label">NIN</div>
                  <div class="field-value nin-highlight">${data.nin}</div>
                </div>
                <div class="field">
                  <div class="field-label">Issue Date</div>
                  <div class="field-value">${new Date(data.verifiedAt).toLocaleDateString()}</div>
                </div>
                <div class="field">
                  <div class="field-label">Surname</div>
                  <div class="field-value">${data.fullName.split(' ')[2] || 'N/A'}</div>
                </div>
                <div class="field">
                  <div class="field-label">First Name</div>
                  <div class="field-value">${data.fullName.split(' ')[0] || 'N/A'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Middle Name</div>
                  <div class="field-value">${data.fullName.split(' ')[1] || 'N/A'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Gender</div>
                  <div class="field-value">${data.gender}</div>
                </div>
              </div>

              <div class="right-section">
                <img src="data:image/jpeg;base64,${data.photo}" class="photo" alt="Photo" />
                <div class="address-box">
                  <strong>Address:</strong><br/>
                  ${data.address || 'N/A'}<br/>
                  ${data.lga || ''}<br/>
                  ${data.state || ''}
                </div>
              </div>
            </div>

            <div class="footer">
              <div>📧 helpdesk@nimc.gov.ng</div>
              <div>🌐 www.nimc.gov.ng</div>
              <div>📞 07040144452, 07040144453</div>
              <div>NIMC HQ, Wuse Abuja</div>
            </div>
            
            <div class="note">
              Note: This transaction slip does not confer the right to the General Multipurpose Card
            </div>
          </div>
        </body>
        </html>
      `;

      // Request permissions on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to save PDF',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is required');
          return;
        }
      }

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ 
        html,
        base64: false,
      });

      // Save to downloads
      const pdfName = `${verificationType}_Slip_${Date.now()}.pdf`;
      const downloadPath = `${FileSystem.documentDirectory}${pdfName}`;
      await FileSystem.moveAsync({
        from: uri,
        to: downloadPath,
      });

      Alert.alert(
        'Success',
        'PDF saved successfully',
        [
          {
            text: 'Share',
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadPath);
              }
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', error.message || 'Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Design Toggle */}
        <View style={[styles.designToggle, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.designLabel, { color: themeColors.heading }]}>
            Slip Design:
          </Text>
          <View style={styles.designButtons}>
            <TouchableOpacity
              style={[
                styles.designButton,
                slipDesign === 'regular' && { backgroundColor: themeColors.primary },
                slipDesign !== 'regular' && { backgroundColor: themeColors.background },
              ]}
              onPress={() => setSlipDesign('regular')}
            >
              <Text style={[
                styles.designButtonText,
                { color: slipDesign === 'regular' ? '#FFFFFF' : themeColors.heading },
              ]}>
                Regular
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.designButton,
                slipDesign === 'premium' && { backgroundColor: themeColors.primary },
                slipDesign !== 'premium' && { backgroundColor: themeColors.background },
              ]}
              onPress={() => setSlipDesign('premium')}
            >
              <Text style={[
                styles.designButtonText,
                { color: slipDesign === 'premium' ? '#FFFFFF' : themeColors.heading },
              ]}>
                Premium
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Slip Preview */}
        <ViewShot ref={slipRef} options={{ format: 'png', quality: 1 }}>
          {slipDesign === 'regular' ? (
            <RegularSlipDesign data={data} verificationType={verificationType} />
          ) : (
            <PremiumSlipDesign data={data} verificationType={verificationType} />
          )}
        </ViewShot>

        {/* Disclaimer */}
        <View style={[styles.disclaimerCard, { backgroundColor: `${themeColors.destructive}15` }]}>
          <Ionicons name="alert-circle-outline" size={20} color={themeColors.destructive} />
          <Text style={[styles.disclaimerText, { color: themeColors.destructive }]}>
            <Text style={{ fontWeight: '700' }}>Disclaimer: </Text>
            This slip is for reference purposes only and does not confer any official rights. 
            For official {verificationType} slip, please visit the NIMC portal.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Official NIMC Portal Button */}
          <TouchableOpacity
            style={[styles.nimcButton, { backgroundColor: '#4CAF50' }]}
            onPress={handleOpenNIMCPortal}
          >
            <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
            <Text style={styles.nimcButtonText}>Get Official {verificationType} Slip</Text>
          </TouchableOpacity>

          {/* Download PDF */}
          <TouchableOpacity
            style={[
              styles.actionButton, 
              { 
                backgroundColor: themeColors.primary,
                opacity: isDownloading ? 0.6 : 1,
              }
            ]}
            onPress={handleDownloadPDF}
            disabled={isDownloading}
          >
            <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </Text>
          </TouchableOpacity>

          {/* Save as Image */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { 
                backgroundColor: themeColors.card,
                borderWidth: 1,
                borderColor: themeColors.primary,
                opacity: isDownloading ? 0.6 : 1,
              }
            ]}
            onPress={handleSaveAsImage}
            disabled={isDownloading}
          >
            <Ionicons 
              name="image-outline" 
              size={20} 
              color={themeColors.primary} 
            />
            <Text style={[
              styles.actionButtonText, 
              { color: themeColors.primary }
            ]}>
              Save as Image
            </Text>
          </TouchableOpacity>

          {/* Close Button */}
          {onClose && (
            <TouchableOpacity
              style={[styles.closeButton, { borderColor: themeColors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: themeColors.heading }]}>
                Close
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ========================================
// STYLES
// ========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Design Toggle
  designToggle: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  designLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  designButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  designButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  designButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Slip Base
  slip: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Regular Design
  regularSlip: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderWidth: 3,
    borderColor: '#000',
  },
  regularHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: '#000',
    marginBottom: 20,
  },
  regularLogo: {
    width: 60,
    alignItems: 'center',
  },
  logoPlaceholder: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  regularTitle: {
    flex: 1,
    alignItems: 'center',
  },
  regularMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  regularSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  regularSlipType: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  regularContent: {
    flexDirection: 'row',
    gap: 20,
  },
  regularLeft: {
    flex: 2,
    borderRightWidth: 2,
    borderRightColor: '#000',
    paddingRight: 20,
  },
  regularField: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingVertical: 12,
  },
  regularFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    width: 100,
  },
  regularFieldValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  ninHighlight: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d32f2f',
  },
  regularRight: {
    flex: 1,
    alignItems: 'center',
  },
  regularPhoto: {
    width: 140,
    height: 140,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: 12,
  },
  regularAddressBox: {
    borderWidth: 2,
    borderColor: '#000',
    padding: 12,
    width: '100%',
  },
  regularAddressLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  regularAddressText: {
    fontSize: 10,
    lineHeight: 16,
  },
  regularFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  regularFooterText: {
    fontSize: 9,
  },
  regularNote: {
    fontSize: 9,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },

  // Premium Design
  premiumSlip: {
    backgroundColor: '#a8e6a1',
    padding: 24,
    height: 340,
  },
  premiumHeader: {
    marginBottom: 16,
  },
  premiumCountry: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b5e20',
    letterSpacing: 1,
  },
  premiumSlipType: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 4,
  },
  premiumContent: {
    flexDirection: 'row',
    gap: 16,
  },
  premiumPhotoContainer: {
    width: 120,
  },
  premiumPhoto: {
    width: 120,
    height: 140,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  premiumDetails: {
    flex: 1,
  },
  premiumField: {
    marginBottom: 10,
  },
  premiumLabel: {
    fontSize: 9,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  premiumValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  premiumRow: {
    flexDirection: 'row',
    gap: 16,
  },
  premiumFieldHalf: {
    flex: 1,
  },
  premiumQR: {
    alignItems: 'center',
    width: 80,
  },
  qrPlaceholder: {
    fontSize: 40,
    lineHeight: 32,
    color: '#000',
    textAlign: 'center',
  },
  premiumCountryCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1b5e20',
    marginTop: 8,
  },
  premiumIssueDate: {
    position: 'absolute',
    top: 180,
    right: 24,
  },
  premiumIssueDateLabel: {
    fontSize: 9,
    color: '#666',
  },
  premiumIssueDateValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  premiumNIN: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    borderTopWidth: 2,
    borderTopColor: '#000',
    paddingTop: 12,
    alignItems: 'center',
  },
  premiumNINLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  premiumNINValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 6,
  },

  // Disclaimer
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  // Actions
  actions: {
    padding: 16,
    gap: 12,
  },
  nimcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  nimcButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});