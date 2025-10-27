import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import * as Print from 'expo-print';
// import PDFView from 'react-native-pdf'; // This will be conditionally used
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { formatCurrency } from 'CONSTANT/formatCurrency';

const ReceiptModal = ({ visible, invoice, onClose }) => {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [pdfPath, setPdfPath] = useState(null);

  useEffect(() => {
    if (visible && !pdfPath) {
      generatePDF();
    }
  }, [visible, pdfPath]);

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'PayFlex Storage Permission',
            message: 'PayFlex needs access to your storage to save PDFs.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const generatePDF = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      console.log('Storage permission denied');
      return;
    }

    try {
      const htmlContent = `
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; }
            .details { font-size: 12px; margin: 10px 0; }
            .section { margin: 20px 0; }
            .product-table { width: 100%; border-collapse: collapse; }
            .product-table td { border: 1px solid #ddd; padding: 8px; font-size: 10px; }
            .total { font-size: 16px; font-weight: bold; }
            .footer { text-align: center; font-size: 10px; margin-top: 20px; border-top: 1px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Receipt - ${invoice?.id || 'INV-01'}</h1>
            <p class="details">Issued: ${new Date().toLocaleString()}</p>
            <p class="details">Due: ${new Date(
              invoice?.dueDate
            ).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}</p>
          </div>
          <div class="section">
            <p><strong>Invoice For:</strong> ${
              invoice?.customer?.name || 'No Customer'
            }</p>
            ${
              invoice?.customer?.email
                ? `<p>Email: ${invoice.customer.email}</p>`
                : ''
            }
            ${
              invoice?.customer?.phone
                ? `<p>Phone: ${invoice.customer.phone}</p>`
                : ''
            }
          </div>
          <div class="section">
            <table class="product-table">
              <tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr>
              ${
                invoice?.products
                  ?.map(
                    (p) => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.quantity}</td>
                  <td>${formatCurrency(p.price, invoice.currency)}</td>
                  <td>${formatCurrency(
                    p.quantity * p.price,
                    invoice.currency
                  )}</td>
                </tr>
              `
                  )
                  .join('') || '<tr><td colspan="4">No products</td></tr>'
              }
            </table>
            <p class="total">Subtotal: ${formatCurrency(
              invoice?.subtotal || 0,
              invoice?.currency || 'NGN'
            )}</p>
            <p class="total">Discount: -${formatCurrency(
              invoice?.discountAmount || 0,
              invoice?.currency || 'NGN'
            )} (${(invoice?.discount?.value * 100 || 0).toFixed(0)}% off)</p>
            <p class="total">VAT: +${formatCurrency(
              invoice?.taxAmount || 0,
              invoice?.currency || 'NGN'
            )} (additional ${(invoice?.tax?.value * 100 || 0).toFixed(0)}%)</p>
            <p class="total">Total: ${formatCurrency(
              invoice?.total || 0,
              invoice?.currency || 'NGN'
            )}</p>
          </div>
          <div class="section">
            <p><strong>Payment Should Be Made To:</strong></p>
            <p>Bank: ${invoice?.bank || 'N/A'}</p>
            <p>Account Number: ${invoice?.accountNumber || 'N/A'}</p>
            <p>Account Name: ${invoice?.accountName || 'N/A'}</p>
          </div>
          <div class="footer">
            <p>Powered by PayFlex</p>
            <a href="https://play.google.com/store/apps/details?id=com.payflex" style="color: #4a00e0; text-decoration: underline;">Get PayFlex on Play Store</a>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      setPdfPath(uri);
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  };

  const sharePDF = async () => {
    if (pdfPath) {
      try {
        await Sharing.shareAsync(pdfPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Invoice Receipt',
        });
      } catch (error) {
        console.log('Share error:', error);
      }
    }
  };

  const savePDF = async () => {
    if (pdfPath) {
      try {
        const destPath = `${FileSystem.documentDirectory}Receipt_${
          invoice?.id || 'INV-01'
        }.pdf`;
        await FileSystem.copyAsync({ from: pdfPath, to: destPath });
        console.log('PDF saved to:', destPath);
      } catch (error) {
        console.log('Save error:', error);
      }
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: themeColors.card }]}
        >
          {pdfPath ? (
            Platform.OS !== 'web' ? (
              <PDFView
                source={{ uri: pdfPath }}
                style={styles.pdfView}
                onError={(error) => console.log('PDF View error:', error)}
              />
            ) : (
              <Text
                style={[styles.loadingText, { color: themeColors.heading }]}
              >
                PDF viewing not supported on web. Download to view.
              </Text>
            )
          ) : (
            <Text style={[styles.loadingText, { color: themeColors.heading }]}>
              Generating PDF...
            </Text>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: themeColors.button },
              ]}
              onPress={sharePDF}
            >
              <Text style={styles.buttonText}>Share PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: themeColors.button },
              ]}
              onPress={savePDF}
            >
              <Text style={styles.buttonText}>Save to Device</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: themeColors.destructive },
              ]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  pdfView: {
    width: '100%',
    height: 500,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  closeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReceiptModal;
