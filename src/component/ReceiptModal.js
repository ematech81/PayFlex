import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { formatCurrency } from 'CONSTANT/formatCurrency';

const ReceiptModal = ({ visible, invoice, onClose, senderName }) => {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [pdfUri, setPdfUri] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  useEffect(() => {
    if (visible) {
      setPdfUri(null);
      setGenError(null);
      generatePDF();
    }
  }, [visible]);

  const buildHtml = () => {
    const issuedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dueDateStr = invoice?.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A';
    const isOverdue = invoice?.dueDate && new Date(invoice.dueDate) < new Date() && invoice?.status !== 'Paid';
    const rawStatus = (invoice?.status || 'DRAFT').toUpperCase();
    const status = isOverdue ? 'OVERDUE' : rawStatus;
    const statusColor = isOverdue ? '#EF4444'
      : status === 'PAID' ? '#059669'
      : status === 'PENDING' ? '#2563EB'
      : '#6B7280';

    const productsHtml = (invoice?.products || []).map(p => `
      <div class="card product-card">
        <div class="product-header">
          <span class="product-name">${p.name}</span>
          <span class="qty-badge">&times;${p.quantity}</span>
        </div>
        <div class="product-row">
          <span class="product-label">Price Each</span>
          <span class="product-val">${formatCurrency(p.price, invoice?.currency)}</span>
        </div>
        <hr class="thin-divider" />
        <div class="product-row">
          <span class="product-label">Subtotal</span>
          <span class="product-val">${formatCurrency(p.quantity * p.price, invoice?.currency)}</span>
        </div>
      </div>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #F4F5F7; color: #111; font-size: 20px; }

  .header {
    background: linear-gradient(135deg, #2D0080 0%, #5B2BDB 100%);
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
    padding: 40px 28px 48px;
    margin-bottom: 18px;
    color: #fff;
  }
  .inv-id-label {
    font-size: 16px; font-weight: 700; letter-spacing: 2px;
    color: rgba(255,255,255,0.7); margin-bottom: 8px;
  }
  .inv-number {
    font-size: 64px; font-weight: 900; letter-spacing: -1px;
    color: #fff; margin-bottom: 22px; line-height: 1;
  }
  .date-pills { display: flex; gap: 14px; margin-bottom: 22px; }
  .date-pill {
    background: rgba(255,255,255,0.15); border-radius: 12px;
    padding: 14px 18px; flex: 1;
  }
  .date-pill-label {
    font-size: 14px; font-weight: 700; letter-spacing: 1.5px;
    color: rgba(255,255,255,0.65); margin-bottom: 5px; display: block;
  }
  .date-pill-value { font-size: 18px; font-weight: 600; color: #fff; display: block; }
  .status-badge {
    display: inline-block; background: ${statusColor}; color: #fff;
    font-size: 16px; font-weight: 700; letter-spacing: 1.5px;
    border-radius: 20px; padding: 6px 20px; margin-bottom: 22px;
  }
  .total-label {
    font-size: 16px; font-weight: 700; letter-spacing: 1.5px;
    color: rgba(255,255,255,0.7); margin-bottom: 6px;
  }
  .total-amount { font-size: 48px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }

  .card {
    background: #fff; border-radius: 16px; padding: 22px 24px;
    margin: 0 16px 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  }
  .card-title {
    font-size: 16px; font-weight: 700; letter-spacing: 1.5px;
    color: #9CA3AF; margin-bottom: 12px;
  }
  .billed-name { font-size: 26px; font-weight: 800; color: #111; margin-bottom: 8px; }
  .billed-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .billed-icon { font-size: 18px; color: #6B7280; }
  .billed-text { font-size: 18px; color: #6B7280; }
  .from-name { font-size: 22px; font-weight: 700; color: #4a00e0; }

  .product-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;
  }
  .product-name { font-size: 22px; font-weight: 700; color: #111; }
  .qty-badge {
    background: #E5E7EB; color: #374151; font-size: 17px;
    font-weight: 700; border-radius: 20px; padding: 4px 14px;
  }
  .product-row {
    display: flex; justify-content: space-between; align-items: center; padding: 6px 0;
  }
  .product-label { font-size: 18px; color: #6B7280; }
  .product-val { font-size: 18px; font-weight: 600; color: #111; }
  .thin-divider { border: none; border-top: 1px solid #F3F4F6; margin: 10px 0; }

  .payment-card { border: 1px solid #E5E7EB; }
  .bank-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .bank-icon-box {
    width: 42px; height: 42px; background: rgba(74,0,224,0.1);
    border-radius: 10px; display: flex; align-items: center;
    justify-content: center; font-size: 22px;
  }
  .bank-name { font-size: 22px; font-weight: 700; color: #111; }
  .acct-label { font-size: 16px; font-weight: 700; letter-spacing: 1px; color: #9CA3AF; margin-bottom: 6px; }
  .acct-number { font-size: 28px; font-weight: 800; color: #4a00e0; letter-spacing: 1px; }
  .acct-holder { font-size: 18px; color: #6B7280; margin-top: 6px; }

  .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
  .summary-label { font-size: 20px; color: #6B7280; }
  .summary-val { font-size: 20px; font-weight: 600; color: #111; }
  .summary-val-red { font-size: 20px; font-weight: 600; color: #EF4444; }
  .summary-divider { border: none; border-top: 1px solid #E5E7EB; margin: 12px 0; }
  .total-row-label { font-size: 24px; font-weight: 800; color: #111; }
  .total-row-val { font-size: 34px; font-weight: 900; color: #111; }

  .footer { text-align: center; padding: 28px 20px 40px; }
  .footer-main { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 8px; }
  .footer-sub { font-size: 17px; color: #9CA3AF; margin-bottom: 12px; }
  .footer-links { font-size: 16px; color: #9CA3AF; }
  .footer-link { color: #4a00e0; }
</style>
</head>
<body>

  <div class="header">
    <div class="inv-id-label">INVOICE IDENTIFICATION</div>
    <div class="inv-number">${invoice?.invoiceNumber || invoice?.id || 'INV-01'}</div>
    <div class="date-pills">
      <div class="date-pill">
        <span class="date-pill-label">ISSUED DATE</span>
        <span class="date-pill-value">${issuedDate}</span>
      </div>
      <div class="date-pill">
        <span class="date-pill-label">DUE DATE</span>
        <span class="date-pill-value">${dueDateStr}</span>
      </div>
    </div>
    <div class="status-badge">${status}</div>
    <div class="total-label">TOTAL AMOUNT DUE</div>
    <div class="total-amount">${formatCurrency(invoice?.total || 0, invoice?.currency)}</div>
  </div>

  <div class="card">
    <div class="card-title">BILLED TO</div>
    <div class="billed-name">${invoice?.customer?.name || 'No Customer'}</div>
    ${invoice?.customer?.email ? `<div class="billed-row"><span class="billed-icon">&#9993;</span><span class="billed-text">${invoice.customer.email}</span></div>` : ''}
    ${invoice?.customer?.phone ? `<div class="billed-row"><span class="billed-icon">&#128222;</span><span class="billed-text">${invoice.customer.phone}</span></div>` : ''}
  </div>

  <div class="card">
    <div class="card-title">FROM</div>
    <div class="from-name">${senderName || 'PayFlex Solutions'}</div>
  </div>

  ${productsHtml}

  ${invoice?.bank ? `
  <div class="card payment-card">
    <div class="card-title">PAYMENT INSTRUCTIONS</div>
    <div class="bank-row">
      <div class="bank-icon-box">&#127981;</div>
      <div class="bank-name">${invoice.bank}</div>
    </div>
    <div class="acct-label">ACCOUNT NUMBER</div>
    <div class="acct-number">${invoice.accountNumber || 'N/A'}</div>
    <div class="acct-holder">${invoice.accountName || 'N/A'}</div>
  </div>` : ''}

  <div class="card">
    <div class="card-title">SUMMARY</div>
    <div class="summary-row">
      <span class="summary-label">Subtotal</span>
      <span class="summary-val">${formatCurrency(invoice?.subtotal || 0, invoice?.currency)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Discount</span>
      <span class="summary-val-red">-${formatCurrency(invoice?.discountAmount || 0, invoice?.currency)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">VAT</span>
      <span class="summary-val">+${formatCurrency(invoice?.taxAmount || 0, invoice?.currency)}</span>
    </div>
    <hr class="summary-divider" />
    <div class="summary-row">
      <span class="total-row-label">Total Due</span>
      <span class="total-row-val">${formatCurrency(invoice?.total || 0, invoice?.currency)}</span>
    </div>
  </div>

  <div class="footer">
    <div class="footer-main">Thank you for your business!</div>
    <div class="footer-sub">We appreciate your prompt payment and look forward to continuing our partnership.</div>
    <div class="footer-links">
      <span class="footer-link">Terms of Service</span> &bull; <span class="footer-link">Privacy Policy</span>
    </div>
  </div>

</body>
</html>`;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const { uri } = await Print.printToFileAsync({ html: buildHtml() });
      setPdfUri(uri);
    } catch (err) {
      console.error('PDF generation error:', err);
      setGenError('Could not generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sharePDF = async () => {
    if (!pdfUri) return;
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing not available on this device');
        return;
      }
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Invoice Receipt',
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to share PDF.');
    }
  };

  const savePDF = async () => {
    if (!pdfUri) return;
    try {
      const filename = `Invoice_${invoice?.invoiceNumber || invoice?.id || Date.now()}.pdf`;
      const dest = `${FileSystem.documentDirectory}${filename}`;

      const srcInfo = await FileSystem.getInfoAsync(pdfUri);
      if (!srcInfo.exists) {
        Alert.alert('Error', 'PDF file not found. Please close and try again.');
        return;
      }

      await FileSystem.copyAsync({ from: pdfUri, to: dest });
      Alert.alert('Saved!', `"${filename}" saved to your app documents folder.`);
    } catch (err) {
      console.warn('Save PDF failed, falling back to share:', err);
      try {
        const available = await Sharing.isAvailableAsync();
        if (available) {
          await Sharing.shareAsync(pdfUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save Invoice PDF',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Error', 'Could not save PDF on this device. Try using Share instead.');
        }
      } catch {
        Alert.alert('Error', 'Could not save PDF on this device.');
      }
    }
  };

  const ready = !isGenerating && !genError && !!pdfUri;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.heading, { color: themeColors.heading }]}>
            Invoice Receipt
          </Text>

          {/* Status area */}
          <View style={styles.statusBox}>
            {isGenerating && (
              <>
                <ActivityIndicator size="large" color="#4a00e0" />
                <Text style={[styles.statusText, { color: themeColors.subheading }]}>
                  Generating PDF…
                </Text>
              </>
            )}
            {genError && (
              <>
                <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
                <Text style={[styles.statusText, { color: '#EF4444' }]}>{genError}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={generatePDF}>
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
            {ready && (
              <>
                <Ionicons name="checkmark-circle-outline" size={44} color="#059669" />
                <Text style={[styles.statusText, { color: '#059669' }]}>
                  PDF is ready!
                </Text>
              </>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: themeColors.button, opacity: ready ? 1 : 0.35 }]}
              onPress={sharePDF}
              disabled={!ready}
            >
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Share PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: themeColors.button, opacity: ready ? 1 : 0.35 }]}
              onPress={savePDF}
              disabled={!ready}
            >
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#6B7280' }]}
              onPress={onClose}
            >
              <Ionicons name="close-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    width: '88%',
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusBox: {
    alignItems: 'center',
    paddingVertical: 24,
    minHeight: 100,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryBtn: {
    marginTop: 14,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#4a00e0',
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 5,
  },
  btnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ReceiptModal;
