import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useWallet } from 'context/WalletContext';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import ReceiptModal from 'component/ReceiptModal';
import AlertMessage from 'component/AlertMessage';
import Separator from 'component/Separator';

const InvoiceProcessingScreen = () => {
  const { params } = useRoute();
  const { invoice } = params || {};
  const { updateInvoice } = useWallet();
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [showReceipt, setShowReceipt] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [invoiceId, setInvoiceId] = useState(
    invoice?.id ||
      `INV-${String((invoice?.id?.split('-')[1] || 0) + 1).padStart(2, '0')}`
  );

  useEffect(() => {
    if (!invoice?.id) {
      setInvoiceId(`INV-01`);
    }
  }, [invoice?.id]);

  const handleSaveAsDraft = () => {
    const updatedInvoice = { ...invoice, status: 'Draft', id: invoiceId };
    updateInvoice(updatedInvoice);
    setAlertMessage('Invoice saved as draft!');
    setShowAlert(true);
    navigation.navigate('InvoiceDetails', { invoice: updatedInvoice });
  };

  const handleSubmit = () => {
    const updatedInvoice = { ...invoice, status: 'Pending', id: invoiceId };
    updateInvoice(updatedInvoice);
    setAlertMessage('Invoice submitted successfully!');
    setShowAlert(true);
    setShowReceipt(true); // Show receipt modal
    // Navigation delayed until user closes the modal
  };

  const handleMarkAsPaid = () => {
    const updatedInvoice = { ...invoice, status: 'Paid' };
    updateInvoice(updatedInvoice);
    setAlertMessage('Invoice marked as paid!');
    setShowAlert(true);
    navigation.navigate('InvoiceDetails', { invoice: updatedInvoice });
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productItem}>
      <Text style={[styles.productText, { color: themeColors.heading }]}>
        {item.name} ={' '}
        {formatCurrency(item.quantity * item.price, invoice.currency)}
      </Text>
      <Text style={[styles.productDetail, { color: themeColors.subheading }]}>
        {item.quantity} x {formatCurrency(item.price, invoice.currency)}
      </Text>
    </View>
  );

  const issuedDate = invoice?.dueDate ? new Date(invoice.dueDate) : new Date();
  const dueDate = invoice?.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ backgroundColor: themeColors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: themeColors.heading, fontWeight: 'bold' },
            ]}
          >
            {invoice?.title || 'New Invoice'}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <Text style={[styles.status, { color: themeColors.subheading }]}>
              INV-{invoiceId.split('-')[1]}
            </Text>
            <Text style={[styles.status, { color: themeColors.processing }]}>
              Processing
            </Text>
          </View>
        </View>
        <Separator />

        <View style={styles.amountDue}>
          <Text style={[styles.smallText, { color: themeColors.subheading }]}>
            Amount Due
          </Text>
          <Text style={[styles.amount, { color: '#4a00e0' }]}>
            {formatCurrency(invoice?.total || 0, invoice?.currency || 'NGN')}
          </Text>
        </View>
        <Separator />

        <View style={styles.dates}>
          <View style={styles.rowContainer}>
            <Text style={[styles.dateText, { color: themeColors.heading }]}>
              Issued:
            </Text>
            <Text style={[styles.dateText, { color: themeColors.heading }]}>
              {issuedDate.toLocaleString()}
            </Text>
          </View>
          <View style={styles.rowContainer}>
            <Text style={[styles.dateText, { color: themeColors.heading }]}>
              Due:
            </Text>
            <Text style={[styles.dateText, { color: themeColors.heading }]}>
              {dueDate}
            </Text>
          </View>
        </View>
        <View style={styles.customer}>
          <Text style={[styles.smallText, { color: themeColors.subheading }]}>
            Invoice For
          </Text>
          <Text style={[styles.customerText, { color: themeColors.heading }]}>
            {invoice?.customer?.name || 'No Customer Selected'}
          </Text>
          {invoice?.customer?.email && (
            <Text
              style={[styles.customerDetail, { color: themeColors.subheading }]}
            >
              {invoice.customer.email}
            </Text>
          )}
          {invoice?.customer?.phone && (
            <Text
              style={[styles.customerDetail, { color: themeColors.subheading }]}
            >
              {invoice.customer.phone}
            </Text>
          )}
        </View>
        <View style={styles.products}>
          <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
            Products
          </Text>
        </View>
        <FlatList
          data={invoice?.products || []}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productList}
        />
        <View style={styles.rowContainer}>
          <Text
            style={[
              styles.summaryText,
              { color: themeColors.heading, fontWeight: 'bold' },
            ]}
          >
            Subtotal:
          </Text>
          <Text
            style={[
              styles.summaryText,
              { color: themeColors.heading, fontWeight: 'bold' },
            ]}
          >
            {formatCurrency(invoice?.subtotal || 0, invoice?.currency || 'NGN')}
          </Text>
        </View>
        <View style={styles.rowContainer}>
          <Text style={[styles.summaryText, { color: themeColors.heading }]}>
            Discount:
          </Text>
          <Text style={[styles.summaryText, { color: themeColors.heading }]}>
            -
            {formatCurrency(
              invoice?.discountAmount || 0,
              invoice?.currency || 'NGN'
            )}
            {invoice?.discount?.value > 0
              ? `${(invoice.discount.value * 100).toFixed(0)}% off`
              : '% off'}
          </Text>
        </View>
        <View style={styles.rowContainer}>
          <Text style={[styles.summaryText, { color: themeColors.heading }]}>
            VAT:
          </Text>
          <Text style={[styles.summaryText, { color: themeColors.heading }]}>
            +
            {formatCurrency(
              invoice?.taxAmount || 0,
              invoice?.currency || 'NGN'
            )}{' '}
            {invoice?.tax?.value > 0
              ? `additional ${invoice.tax.value * 100}%`
              : '%'}
          </Text>
        </View>
        <Separator />
        <View style={styles.payment}>
          <Text style={[styles.smallText, { color: themeColors.subheading }]}>
            Payment Should Be Made To:
          </Text>
          <View style={styles.rowContainer}>
            <Text style={[styles.paymentText, { color: themeColors.heading }]}>
              Bank:
            </Text>
            <Text style={[styles.paymentText, { color: themeColors.heading }]}>
              {invoice?.bank || 'N/A'}
            </Text>
          </View>
          <View style={styles.rowContainer}>
            <Text style={[styles.paymentText, { color: themeColors.heading }]}>
              Account Number:
            </Text>
            <Text style={[styles.paymentText, { color: themeColors.heading }]}>
              {invoice?.accountNumber || 'N/A'}
            </Text>
          </View>
          <View style={styles.rowContainer}>
            <Text style={[styles.paymentText, { color: themeColors.heading }]}>
              Account Name:
            </Text>
            <Text style={[styles.paymentText, { color: themeColors.heading }]}>
              {invoice?.accountName || 'N/A'}
            </Text>
          </View>
        </View>
        {invoice?.status === 'Pending' && (
          <TouchableOpacity
            style={[
              styles.markPaidButton,
              { backgroundColor: themeColors.button },
            ]}
            onPress={handleMarkAsPaid}
          >
            <Text style={styles.buttonText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.draftButton,
              { backgroundColor: themeColors.subheading },
            ]}
            onPress={handleSaveAsDraft}
          >
            <Text style={styles.buttonText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: themeColors.button },
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>Submit Invoice</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    marginTop: 30,
  },
  status: {
    fontSize: 14,
    marginLeft: 8,
  },
  amountDue: {
    marginBottom: 16,
  },
  smallText: {
    fontSize: 12,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  dates: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    marginTop: 4,
  },
  customer: {
    marginBottom: 16,
  },
  customerText: {
    fontSize: 16,
  },
  customerDetail: {
    fontSize: 14,
    marginTop: 4,
  },
  products: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  productItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  productText: {
    fontSize: 14,
  },
  productDetail: {
    fontSize: 12,
  },
  productList: {
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    marginTop: 4,
  },
  payment: {
    marginBottom: 16,
  },
  paymentText: {
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  draftButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  markPaidButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    padding: 8,
  },
});

export default InvoiceProcessingScreen;

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
// } from 'react-native';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import { useWallet } from 'context/WalletContext';
// import { useThem } from 'constants/useTheme';
// import { colors } from 'constants/colors';
// import { formatCurrency } from 'constants/formatCurrency';
// import ReceiptModal from 'component/ReceiptModal';
// import AlertMessage from 'component/AlertMessage';
// import Separator from 'component/Separator';

// const InvoiceProcessingScreen = () => {
//   const { params } = useRoute();
//   const { invoice } = params || {};
//   const { updateInvoice } = useWallet();
//   const navigation = useNavigation();
//   const isDarkMode = useThem();
//   const themeColors = isDarkMode ? colors.dark : colors.light;
//   const [showReceipt, setShowReceipt] = useState(false);
//   const [showAlert, setShowAlert] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [invoiceId, setInvoiceId] = useState(
//     invoice?.id ||
//       `INV-${String((invoice?.id?.split('-')[1] || 0) + 1).padStart(2, '0')}`
//   );

//   useEffect(() => {
//     if (!invoice?.id) {
//       setInvoiceId(`INV-01`);
//     }
//   }, [invoice?.id]);

//   const handleSaveAsDraft = () => {
//     const updatedInvoice = { ...invoice, status: 'Draft', id: invoiceId };
//     updateInvoice(updatedInvoice);
//     setAlertMessage('Invoice saved as draft!');
//     setShowAlert(true);
//     navigation.navigate('InvoiceDetails', { invoice: updatedInvoice });
//   };

//   const handleSubmit = () => {
//     setShowReceipt(true);
//     const updatedInvoice = { ...invoice, status: 'Pending', id: invoiceId };
//     updateInvoice(updatedInvoice);
//     setAlertMessage('Invoice submitted successfully!');
//     setShowAlert(true);
//     navigation.navigate('InvoiceDetails', { invoice: updatedInvoice });
//   };

//   const handleMarkAsPaid = () => {
//     const updatedInvoice = { ...invoice, status: 'Paid' };
//     updateInvoice(updatedInvoice);
//     setAlertMessage('Invoice marked as paid!');
//     setShowAlert(true);
//     navigation.navigate('InvoiceDetails', { invoice: updatedInvoice });
//   };

//   const renderProduct = ({ item }) => (
//     <View style={styles.productItem}>
//       <Text style={[styles.productText, { color: themeColors.heading }]}>
//         {item.name} ={' '}
//         {formatCurrency(item.quantity * item.price, invoice.currency)}
//       </Text>
//       <Text style={[styles.productDetail, { color: themeColors.subheading }]}>
//         {item.quantity} x {formatCurrency(item.price, invoice.currency)}
//       </Text>
//     </View>
//   );

//   const issuedDate = invoice?.dueDate ? new Date(invoice.dueDate) : new Date();
//   const dueDate = invoice?.dueDate
//     ? new Date(invoice.dueDate).toLocaleDateString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         year: 'numeric',
//       })
//     : 'N/A';

//   return (
//     <View style={{ flex: 1 }}>
//       <ScrollView
//         style={{ backgroundColor: themeColors.background }}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.container}
//       >
//         <View style={styles.header}>
//           <Text
//             style={[
//               styles.title,
//               { color: themeColors.heading, fontWeight: 'bold' },
//             ]}
//           >
//             {invoice?.title || 'New Invoice'}
//           </Text>
//           <View style={{ flexDirection: 'row' }}>
//             <Text style={[styles.status, { color: themeColors.subheading }]}>
//               INV-{invoiceId.split('-')[1]}
//             </Text>
//             <Text style={[styles.status, { color: themeColors.processing }]}>
//               Processing
//             </Text>
//           </View>
//         </View>
//         <Separator />
//         <View style={styles.amountDue}>
//           <Text style={[styles.smallText, { color: themeColors.subheading }]}>
//             Amount Due
//           </Text>
//           <Text style={[styles.amount, { color: '#4a00e0' }]}>
//             {formatCurrency(invoice?.total || 0, invoice?.currency || 'NGN')}
//           </Text>
//         </View>
//         <Separator />
//         <View style={styles.dates}>
//           <View style={styles.rowContainer}>
//             <Text style={[styles.dateText, { color: themeColors.heading }]}>
//               Issued:
//             </Text>
//             <Text style={[styles.dateText, { color: themeColors.heading }]}>
//               {issuedDate.toLocaleString()}
//             </Text>
//           </View>
//           <View style={styles.rowContainer}>
//             <Text style={[styles.dateText, { color: themeColors.heading }]}>
//               Due:
//             </Text>
//             <Text style={[styles.dateText, { color: themeColors.heading }]}>
//               {dueDate}
//             </Text>
//           </View>
//         </View>
//         <View style={styles.customer}>
//           <Text style={[styles.smallText, { color: themeColors.subheading }]}>
//             Invoice For
//           </Text>
//           <Text style={[styles.customerText, { color: themeColors.heading }]}>
//             {invoice?.customer?.name || 'No Customer Selected'}
//           </Text>
//           {invoice?.customer?.email && (
//             <Text
//               style={[styles.customerDetail, { color: themeColors.subheading }]}
//             >
//               {invoice.customer.email}
//             </Text>
//           )}
//           {invoice?.customer?.phone && (
//             <Text
//               style={[styles.customerDetail, { color: themeColors.subheading }]}
//             >
//               {invoice.customer.phone}
//             </Text>
//           )}
//         </View>
//         <View style={styles.products}>
//           <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
//             Products
//           </Text>
//         </View>
//         <FlatList
//           data={invoice?.products || []}
//           renderItem={renderProduct}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.productList}
//         />
//         <View style={styles.rowContainer}>
//           <Text
//             style={[
//               styles.summaryText,
//               { color: themeColors.heading, fontWeight: 'bold' },
//             ]}
//           >
//             Subtotal:
//           </Text>
//           <Text
//             style={[
//               styles.summaryText,
//               { color: themeColors.heading, fontWeight: 'bold' },
//             ]}
//           >
//             {formatCurrency(invoice?.subtotal || 0, invoice?.currency || 'NGN')}
//           </Text>
//         </View>
//         <View style={styles.rowContainer}>
//           <Text style={[styles.summaryText, { color: themeColors.heading }]}>
//             Discount:
//           </Text>
//           <Text style={[styles.summaryText, { color: themeColors.heading }]}>
//             -
//             {formatCurrency(
//               invoice?.discountAmount || 0,
//               invoice?.currency || 'NGN'
//             )}
//             {invoice?.discount?.value > 0
//               ? `${(invoice.discount.value * 100).toFixed(0)}% off`
//               : '% off'}
//           </Text>
//         </View>
//         <View style={styles.rowContainer}>
//           <Text style={[styles.summaryText, { color: themeColors.heading }]}>
//             VAT:
//           </Text>
//           <Text style={[styles.summaryText, { color: themeColors.heading }]}>
//             +
//             {formatCurrency(
//               invoice?.taxAmount || 0,
//               invoice?.currency || 'NGN'
//             )}{' '}
//             {invoice?.tax?.value > 0
//               ? `additional ${invoice.tax.value * 100}%`
//               : '%'}
//           </Text>
//         </View>
//         <Separator />
//         <View style={styles.payment}>
//           <Text style={[styles.smallText, { color: themeColors.subheading }]}>
//             Payment Should Be Made To:
//           </Text>
//           <View style={styles.rowContainer}>
//             <Text style={[styles.paymentText, { color: themeColors.heading }]}>
//               Bank:
//             </Text>
//             <Text style={[styles.paymentText, { color: themeColors.heading }]}>
//               {invoice?.bank || 'N/A'}
//             </Text>
//           </View>
//           <View style={styles.rowContainer}>
//             <Text style={[styles.paymentText, { color: themeColors.heading }]}>
//               Account Number:
//             </Text>
//             <Text style={[styles.paymentText, { color: themeColors.heading }]}>
//               {invoice?.accountNumber || 'N/A'}
//             </Text>
//           </View>
//           <View style={styles.rowContainer}>
//             <Text style={[styles.paymentText, { color: themeColors.heading }]}>
//               Account Name:
//             </Text>
//             <Text style={[styles.paymentText, { color: themeColors.heading }]}>
//               {invoice?.accountName || 'N/A'}
//             </Text>
//           </View>
//         </View>
//         {invoice?.status === 'Pending' && (
//           <TouchableOpacity
//             style={[
//               styles.markPaidButton,
//               { backgroundColor: themeColors.button },
//             ]}
//             onPress={handleMarkAsPaid}
//           >
//             <Text style={styles.buttonText}>Mark as Paid</Text>
//           </TouchableOpacity>
//         )}
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity
//             style={[
//               styles.draftButton,
//               { backgroundColor: themeColors.subheading },
//             ]}
//             onPress={handleSaveAsDraft}
//           >
//             <Text style={styles.buttonText}>Save as Draft</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               styles.submitButton,
//               { backgroundColor: themeColors.button },
//             ]}
//             onPress={handleSubmit}
//           >
//             <Text style={styles.buttonText}>Submit Invoice</Text>
//           </TouchableOpacity>
//         </View>
//         <View style={{ height: 20 }} />{' '}
//         {/* Spacer to ensure scrolling to buttons */}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     padding: 16,
//     paddingBottom: 100, // Increased to ensure buttons are accessible
//   },
//   header: {
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 24,
//     marginTop: 30,
//   },
//   status: {
//     fontSize: 14,
//     marginLeft: 8,
//   },
//   amountDue: {
//     marginBottom: 16,
//   },
//   smallText: {
//     fontSize: 12,
//   },
//   amount: {
//     fontSize: 32,
//     fontWeight: 'bold',
//   },
//   dates: {
//     marginBottom: 16,
//   },
//   dateText: {
//     fontSize: 14,
//     marginTop: 4,
//   },
//   customer: {
//     marginBottom: 16,
//   },
//   customerText: {
//     fontSize: 16,
//   },
//   customerDetail: {
//     fontSize: 14,
//     marginTop: 4,
//   },
//   products: {
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginBottom: 12,
//   },
//   productItem: {
//     padding: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//   },
//   productText: {
//     fontSize: 14,
//   },
//   productDetail: {
//     fontSize: 12,
//   },
//   productList: {
//     marginBottom: 8,
//   },
//   summaryText: {
//     fontSize: 14,
//     marginTop: 4,
//   },
//   payment: {
//     marginBottom: 16,
//   },
//   paymentText: {
//     fontSize: 14,
//     marginTop: 4,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 16,
//     marginBottom: 16,
//   },
//   draftButton: {
//     flex: 1,
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginRight: 8,
//   },
//   submitButton: {
//     flex: 1,
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginLeft: 8,
//   },
//   markPaidButton: {
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 16,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   rowContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginVertical: 6,
//     padding: 8,
//   },
// });

// export default InvoiceProcessingScreen;

// // import React, { useState, useEffect } from 'react';
// // import {
// //   View,
// //   Text,
// //   FlatList,
// //   StyleSheet,
// //   TouchableOpacity,
// //   ScrollView,
// // } from 'react-native';
// // import { useNavigation, useRoute } from '@react-navigation/native';
// // import { useWallet } from 'context/WalletContext';
// // import { useThem } from 'constants/useTheme';
// // import { colors } from 'constants/colors';
// // import { formatCurrency } from 'constants/formatCurrency';
// // import ReceiptModal from 'component/ReceiptModal';
// // import AlertMessage from 'component/AlertMessage';
// // import Separator from 'component/Separator';

// // const InvoiceProcessingScreen = () => {
// //   const { params } = useRoute();
// //   const { invoice } = params || {};
// //   const { updateInvoice } = useWallet();
// //   const navigation = useNavigation();
// //   const isDarkMode = useThem();
// //   const themeColors = isDarkMode ? colors.dark : colors.light;
// //   const [showReceipt, setShowReceipt] = useState(false);
// //   const [showAlert, setShowAlert] = useState(false);
// //   const [alertMessage, setAlertMessage] = useState('');
// //   const [invoiceId, setInvoiceId] = useState(
// //     invoice?.id ||
// //       `INV-${String((invoice?.id?.split('-')[1] || 0) + 1).padStart(2, '0')}`
// //   );

// //   useEffect(() => {
// //     if (!invoice?.id) {
// //       setInvoiceId(`INV-01`);
// //     }
// //   }, [invoice?.id]);

// //   const handleSaveAsDraft = () => {
// //     const updatedInvoice = { ...invoice, status: 'Draft', id: invoiceId };
// //     updateInvoice(updatedInvoice);
// //     setAlertMessage('Invoice saved as draft!');
// //     setShowAlert(true);
// //     navigation.navigate('InvoiceDetails', { invoice: updatedInvoice });
// //   };

// //   const handleSubmit = () => {
// //     setShowReceipt(true);
// //     const updatedInvoice = { ...invoice, status: 'Pending', id: invoiceId };
// //     updateInvoice(updatedInvoice);
// //     setAlertMessage('Invoice submitted successfully!');
// //     setShowAlert(true);
// //     navigation.navigate('InvoiceDetails', { invoice: updatedInvoice });
// //   };

// //   const handleMarkAsPaid = () => {
// //     const updatedInvoice = { ...invoice, status: 'Paid' };
// //     updateInvoice(updatedInvoice);
// //     setAlertMessage('Invoice marked as paid!');
// //     setShowAlert(true);
// //     navigation.navigate('InvoiceDetails', { invoice: updatedInvoice });
// //   };

// //   const renderProduct = ({ item }) => (
// //     <View style={styles.productItem}>
// //       <Text style={[styles.productText, { color: themeColors.heading }]}>
// //         {item.name} ={' '}
// //         {formatCurrency(item.quantity * item.price, invoice.currency)}
// //       </Text>
// //       <Text style={[styles.productDetail, { color: themeColors.subheading }]}>
// //         {item.quantity} x {formatCurrency(item.price, invoice.currency)}
// //       </Text>
// //     </View>
// //   );

// //   const issuedDate = invoice?.dueDate ? new Date(invoice.dueDate) : new Date();
// //   const dueDate = invoice?.dueDate
// //     ? new Date(invoice.dueDate).toLocaleDateString('en-US', {
// //         month: 'short',
// //         day: 'numeric',
// //         year: 'numeric',
// //       })
// //     : 'N/A';

// //   return (
// //     <ScrollView
// //       style={[{ backgroundColor: themeColors.background }]}
// //       showsVerticalScrollIndicator={false}
// //       contentContainerStyle={styles.container}
// //     >
// //       <View style={styles.header}>
// //         <Text
// //           style={[
// //             styles.title,
// //             { color: themeColors.heading, fontWeight: 'bold' },
// //           ]}
// //         >
// //           {invoice?.title || 'New Invoice'}
// //         </Text>
// //         <View style={{ flexDirection: 'row' }}>
// //           <Text style={[styles.status, { color: themeColors.subheading }]}>
// //             INV-{invoiceId.split('-')[1]}
// //           </Text>
// //           <Text style={[styles.status, { color: themeColors.processing }]}>
// //             Processing
// //           </Text>
// //         </View>
// //       </View>
// //       <Separator />

// //       <View style={styles.amountDue}>
// //         <Text style={[styles.smallText, { color: themeColors.subheading }]}>
// //           Amount Due
// //         </Text>
// //         <Text style={[styles.amount, { color: '#4a00e0' }]}>
// //           {formatCurrency(invoice?.total || 0, invoice?.currency || 'NGN')}
// //         </Text>
// //       </View>
// //       <Separator />

// //       <View style={styles.dates}>
// //         <View style={styles.rowContainer}>
// //           <Text style={[styles.dateText, { color: themeColors.heading }]}>
// //             Issued:
// //           </Text>
// //           <Text style={[styles.dateText, { color: themeColors.heading }]}>
// //             {issuedDate.toLocaleString()}
// //           </Text>
// //         </View>

// //         {/* due date */}
// //         <View style={styles.rowContainer}>
// //           <Text style={[styles.dateText, { color: themeColors.heading }]}>
// //             Due:
// //           </Text>
// //           <Text style={[styles.dateText, { color: themeColors.heading }]}>
// //             {dueDate}
// //           </Text>
// //         </View>
// //       </View>
// //       <View style={styles.customer}>
// //         <Text style={[styles.smallText, { color: themeColors.subheading }]}>
// //           Invoice For
// //         </Text>
// //         <Text style={[styles.customerText, { color: themeColors.heading }]}>
// //           {invoice?.customer?.name || 'No Customer Selected'}
// //         </Text>
// //         {invoice?.customer?.email && (
// //           <Text
// //             style={[styles.customerDetail, { color: themeColors.subheading }]}
// //           >
// //             {invoice.customer.email}
// //           </Text>
// //         )}
// //         {invoice?.customer?.phone && (
// //           <Text
// //             style={[styles.customerDetail, { color: themeColors.subheading }]}
// //           >
// //             {invoice.customer.phone}
// //           </Text>
// //         )}
// //       </View>
// //       <View style={styles.products}>
// //         <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
// //           Products
// //         </Text>
// //       </View>
// //       <FlatList
// //         data={invoice?.products || []}
// //         renderItem={renderProduct}
// //         keyExtractor={(item) => item.id}
// //         contentContainerStyle={styles.productList}
// //       />
// //       {/* subtotal */}
// //       <View style={styles.rowContainer}>
// //         <Text
// //           style={[
// //             styles.summaryText,
// //             { color: themeColors.heading, fontWeight: 'bold' },
// //           ]}
// //         >
// //           Subtotal:
// //         </Text>
// //         <Text
// //           style={[
// //             styles.summaryText,
// //             { color: themeColors.heading, fontWeight: 'bold' },
// //           ]}
// //         >
// //           {formatCurrency(invoice?.subtotal || 0, invoice?.currency || 'NGN')}
// //         </Text>
// //       </View>
// //       {/* discount */}
// //       <View style={styles.rowContainer}>
// //         <Text style={[styles.summaryText, { color: themeColors.heading }]}>
// //           Discount:
// //         </Text>
// //         <Text style={[styles.summaryText, { color: themeColors.heading }]}>
// //           -
// //           {formatCurrency(
// //             invoice?.discountAmount || 0,
// //             invoice?.currency || 'NGN'
// //           )}
// //           {invoice?.discount?.value > 0
// //             ? `${(invoice.discount.value * 100).toFixed(0)}% off`
// //             : '% off'}
// //         </Text>
// //       </View>
// //       {/* tax */}
// //       <View style={styles.rowContainer}>
// //         <Text style={[styles.summaryText, { color: themeColors.heading }]}>
// //           VAT:
// //         </Text>
// //         <Text style={[styles.summaryText, { color: themeColors.heading }]}>
// //           +{formatCurrency(invoice?.taxAmount || 0, invoice?.currency || 'NGN')}{' '}
// //           {invoice?.tax?.value > 0
// //             ? `additional ${invoice.tax.value * 100}%`
// //             : '%'}
// //         </Text>
// //       </View>
// //       <Separator />
// //       <View style={styles.payment}>
// //         <Text style={[styles.smallText, { color: themeColors.subheading }]}>
// //           Payment Should Be Made To:
// //         </Text>
// //         {/* bank */}
// //         <View style={styles.rowContainer}>
// //           <Text style={[styles.paymentText, { color: themeColors.heading }]}>
// //             Bank:
// //           </Text>
// //           <Text style={[styles.paymentText, { color: themeColors.heading }]}>
// //             {invoice?.bank || 'N/A'}
// //           </Text>
// //         </View>

// //         <View style={styles.rowContainer}>
// //           <Text style={[styles.paymentText, { color: themeColors.heading }]}>
// //             Account Number:
// //           </Text>
// //           <Text style={[styles.paymentText, { color: themeColors.heading }]}>
// //             {invoice?.accountNumber || 'N/A'}
// //           </Text>
// //         </View>

// //         <View style={styles.rowContainer}>
// //           <Text style={[styles.paymentText, { color: themeColors.heading }]}>
// //             Account Name:
// //           </Text>
// //           <Text style={[styles.paymentText, { color: themeColors.heading }]}>
// //             {invoice?.accountName || 'N/A'}
// //           </Text>
// //         </View>
// //       </View>
// //       {invoice?.status === 'Pending' && (
// //         <TouchableOpacity
// //           style={[
// //             styles.markPaidButton,
// //             { backgroundColor: themeColors.button },
// //           ]}
// //           onPress={handleMarkAsPaid}
// //         >
// //           <Text style={styles.buttonText}>Mark as Paid</Text>
// //         </TouchableOpacity>
// //       )}
// //       <View style={styles.buttonContainer}>
// //         <TouchableOpacity
// //           style={[
// //             styles.draftButton,
// //             { backgroundColor: themeColors.subheading },
// //           ]}
// //           onPress={handleSaveAsDraft}
// //         >
// //           <Text style={styles.buttonText}>Save as Draft</Text>
// //         </TouchableOpacity>
// //         <TouchableOpacity
// //           style={[styles.submitButton, { backgroundColor: themeColors.button }]}
// //           onPress={handleSubmit}
// //         >
// //           <Text style={styles.buttonText}>Submit Invoice</Text>
// //         </TouchableOpacity>
// //       </View>
// //       <ReceiptModal
// //         visible={showReceipt}
// //         invoice={invoice}
// //         onClose={() => setShowReceipt(false)}
// //       />
// //       <AlertMessage
// //         visible={showAlert}
// //         message={alertMessage}
// //         onClose={() => setShowAlert(false)}
// //       />
// //     </ScrollView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     padding: 16,
// //     paddingBottom: 100,
// //   },
// //   header: {
// //     marginBottom: 16,
// //   },
// //   title: {
// //     fontSize: 24,
// //     marginTop: 30,
// //   },
// //   status: {
// //     fontSize: 14,
// //   },
// //   amountDue: {
// //     marginBottom: 16,
// //   },
// //   smallText: {
// //     fontSize: 12,
// //   },
// //   amount: {
// //     fontSize: 32,
// //     fontWeight: 'bold',
// //   },
// //   dates: {
// //     marginBottom: 16,
// //   },
// //   dateText: {
// //     fontSize: 14,
// //     marginTop: 4,
// //   },
// //   customer: {
// //     marginBottom: 16,
// //   },
// //   customerText: {
// //     fontSize: 16,
// //   },
// //   customerDetail: {
// //     fontSize: 14,
// //     marginTop: 4,
// //   },
// //   products: {
// //     marginBottom: 16,
// //   },
// //   sectionTitle: {
// //     fontSize: 18,
// //     fontWeight: '600',
// //     marginBottom: 12,
// //   },
// //   productItem: {
// //     padding: 8,
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#ccc',
// //   },
// //   productText: {
// //     fontSize: 14,
// //   },
// //   productDetail: {
// //     fontSize: 12,
// //   },
// //   productList: {
// //     marginBottom: 8,
// //   },
// //   summaryText: {
// //     fontSize: 14,
// //     marginTop: 4,
// //   },
// //   payment: {
// //     marginBottom: 16,
// //   },
// //   paymentText: {
// //     fontSize: 14,
// //     marginTop: 4,
// //   },
// //   buttonContainer: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     marginTop: 16,
// //   },
// //   draftButton: {
// //     flex: 1,
// //     padding: 12,
// //     borderRadius: 8,
// //     alignItems: 'center',
// //     marginRight: 8,
// //   },
// //   submitButton: {
// //     flex: 1,
// //     padding: 12,
// //     borderRadius: 8,
// //     alignItems: 'center',
// //     marginLeft: 8,
// //   },
// //   markPaidButton: {
// //     padding: 12,
// //     borderRadius: 8,
// //     alignItems: 'center',
// //     marginTop: 16,
// //   },
// //   buttonText: {
// //     color: '#fff',
// //     fontSize: 16,
// //     fontWeight: '600',
// //   },
// //   rowContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //     marginVertical: 6,
// //     padding: 8,
// //   },
// // });

// // export default InvoiceProcessingScreen;
