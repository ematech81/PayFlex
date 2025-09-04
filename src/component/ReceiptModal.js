import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Share,
} from 'react-native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { formatCurrency } from 'component/formatCurrency';

const ReceiptModal = ({ visible, invoice, onClose }) => {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const generatePDF = async () => {
    // Simulate PDF generation (replace with actual PDF library like react-native-pdf-lib)
    const pdfContent = `
      <!DOCTYPE html>
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
          .button { padding: 10px; background-color: #4a00e0; color: white; text-decoration: none; border-radius: 5px; }
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
          <a href="https://play.google.com/store/apps/details?id=com.payflex" class="button">Get PayFlex on Play Store</a>
        </div>
      </body>
      </html>
    `;
    // Simulate sharing (replace with actual PDF generation and sharing logic)
    await Share.share({
      message: 'Here is your invoice receipt.',
      url: 'data:application/pdf;base64,' + btoa(pdfContent), // Placeholder; use a PDF library
      title: 'Invoice Receipt',
    });
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
          <Text style={[styles.receiptTitle, { color: themeColors.heading }]}>
            Receipt - {invoice?.id || 'INV-01'}
          </Text>
          <View style={styles.receiptSection}>
            <Text style={[styles.receiptText, { color: themeColors.heading }]}>
              Invoice For: {invoice?.customer?.name || 'No Customer'}
            </Text>
            {invoice?.customer?.email && (
              <Text style={styles.receiptText}>{invoice.customer.email}</Text>
            )}
            {invoice?.customer?.phone && (
              <Text style={styles.receiptText}>{invoice.customer.phone}</Text>
            )}
          </View>
          <View style={styles.receiptSection}>
            <Text style={styles.receiptText}>
              Subtotal:{' '}
              {formatCurrency(
                invoice?.subtotal || 0,
                invoice?.currency || 'NGN'
              )}
            </Text>
            <Text style={styles.receiptText}>
              Discount: -
              {formatCurrency(
                invoice?.discountAmount || 0,
                invoice?.currency || 'NGN'
              )}{' '}
              ({(invoice?.discount?.value * 100 || 0).toFixed(0)}% off)
            </Text>
            <Text style={styles.receiptText}>
              VAT: +
              {formatCurrency(
                invoice?.taxAmount || 0,
                invoice?.currency || 'NGN'
              )}{' '}
              (additional {(invoice?.tax?.value * 100 || 0).toFixed(0)}%)
            </Text>
            <Text style={[styles.receiptTotal, { color: themeColors.heading }]}>
              Total:{' '}
              {formatCurrency(invoice?.total || 0, invoice?.currency || 'NGN')}
            </Text>
          </View>
          <View style={styles.receiptSection}>
            <Text style={styles.receiptText}>Payment To:</Text>
            <Text style={styles.receiptText}>
              Bank: {invoice?.bank || 'N/A'}
            </Text>
            <Text style={styles.receiptText}>
              Account Number: {invoice?.accountNumber || 'N/A'}
            </Text>
            <Text style={styles.receiptText}>
              Account Name: {invoice?.accountName || 'N/A'}
            </Text>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by PayFlex</Text>
            <TouchableOpacity
              style={styles.playStoreButton}
              onPress={() => console.log('Redirect to Play Store')}
            >
              <Text style={styles.playStoreText}>
                Get PayFlex on Play Store
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.shareButton,
                { backgroundColor: themeColors.button },
              ]}
              onPress={generatePDF}
            >
              <Text style={styles.buttonText}>Share PDF</Text>
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
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  receiptSection: {
    marginBottom: 15,
  },
  receiptText: {
    fontSize: 12,
    marginBottom: 5,
  },
  receiptTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
  },
  playStoreButton: {
    marginTop: 5,
  },
  playStoreText: {
    color: '#4a00e0',
    fontSize: 10,
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  shareButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 5,
  },
  closeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReceiptModal;
