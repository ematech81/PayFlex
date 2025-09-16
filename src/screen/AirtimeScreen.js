import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import ActionModal from 'constants/ActionModal';
import { formatCurrency } from 'constants/formatCurrency';
import { useWallet } from 'context/WalletContext';

const BASE_URL = 'http://192.168.100.137:5000/api';
const { width, height } = Dimensions.get('window');
const CARD_PADDING = 13;
const ICON_SIZE = 19;

export default function AirtimeScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet } = useWallet();

  const [selectedTab, setSelectedTab] = useState('Local');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [modalActions, setModalActions] = useState([]);
  const [pin, setPin] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(''); // Store selected amount for modal

  const amounts = ['50', '100', '200', '500', '1000', '2000'];

  const providers = [
    { label: 'MTN', value: 'mtn', logo: require('../asset/mtn.jpg') },
    { label: 'Airtel', value: 'airtel', logo: require('../asset/airtel.jpeg') },
    { label: 'Glo', value: 'glo', logo: require('../asset/glo.jpg') },
    {
      label: '9mobile',
      value: '9mobile',
      logo: require('../asset/etisalat.jpg'),
    },
  ];

  const validateInputs = (amt) => {
    if (!phone.match(/^\d{11}$/)) {
      return 'Please enter a valid 11-digit phone number';
    }
    if (!provider) {
      return 'Please select a service provider';
    }
    if (!amt || isNaN(amt) || Number(amt) <= 0) {
      return 'Please enter a valid amount';
    }
    return null;
  };

  const showConfirmationModal = (amt) => {
    const validationError = validateInputs(amt);
    if (validationError) {
      setModalActions([
        {
          label: validationError,
          onPress: () => {},
          style: { color: themeColors.destructive },
        },
        { label: 'OK', onPress: () => setModalVisible(false) },
      ]);
      setModalVisible(true);
      return;
    }

    setSelectedAmount(amt);
    setModalActions([
      {
        label: (
          <View style={styles.modalHeader}>
            <Text style={[styles.modalAmount, { color: themeColors.heading }]}>
              {formatCurrency(Number(amt), 'NGN')}
            </Text>
          </View>
        ),
        onPress: () => {},
      },
      {
        label: (
          <View style={styles.modalRow}>
            <Text
              style={[styles.modalLabel, { color: themeColors.subheading }]}
            >
              Product Name:
            </Text>
            <View style={styles.modalProduct}>
              {provider && (
                <Image
                  source={providers.find((p) => p.value === provider)?.logo}
                  style={styles.modalLogo}
                />
              )}
              <Text style={[styles.modalValue, { color: themeColors.heading }]}>
                Airtime
              </Text>
            </View>
          </View>
        ),
        onPress: () => {},
      },
      {
        label: (
          <View style={styles.modalRow}>
            <Text
              style={[styles.modalLabel, { color: themeColors.subheading }]}
            >
              Recipient Mobile:
            </Text>
            <Text style={[styles.modalValue, { color: themeColors.heading }]}>
              {phone}
            </Text>
          </View>
        ),
        onPress: () => {},
      },
      {
        label: (
          <View style={styles.modalRow}>
            <Text
              style={[styles.modalLabel, { color: themeColors.subheading }]}
            >
              Amount:
            </Text>
            <Text style={[styles.modalValue, { color: themeColors.heading }]}>
              {formatCurrency(Number(amt), 'NGN')}
            </Text>
          </View>
        ),
        onPress: () => {},
      },
      {
        label: (
          <View style={styles.modalRow}>
            <Text
              style={[styles.modalLabel, { color: themeColors.subheading }]}
            >
              Wallet Balance:
            </Text>
            <Text style={[styles.modalValue, { color: themeColors.heading }]}>
              ₦0.00
            </Text>
          </View>
        ),
        onPress: () => {},
      },
      {
        label: (
          <View
            style={[styles.payButton, { backgroundColor: themeColors.primary }]}
          >
            <Text
              style={[
                { color: themeColors.card, fontWeight: 'bold', fontSize: 16 },
              ]}
            >
              Pay
            </Text>
          </View>
        ),
        onPress: () => {
          setModalVisible(false);
          setPinModalVisible(true);
        },
      },
      {
        label: 'Cancel',
        onPress: () => setModalVisible(false),
        style: { color: themeColors.destructive },
      },
    ]);
    setModalVisible(true);
  };

  const handlePinSubmit = async () => {
    // Placeholder PIN validation (replace with backend call to /verify-transaction-pin)
    if (pin !== '1234') {
      setModalActions([
        {
          label: 'Incorrect PIN. Please try again.',
          onPress: () => {},
          style: { color: themeColors.destructive },
        },
        { label: 'OK', onPress: () => setPinModalVisible(true) },
      ]);
      setPinModalVisible(false);
      setModalVisible(true);
      return;
    }

    setPinModalVisible(false);
    setIsLoading(true);
    setModalVisible(true); // Reopen confirmation modal

    try {
      const response = await axios.post(
        `${BASE_URL}/payments/buy-airtime`,
        {
          phoneNumber: phone,
          amount: Number(selectedAmount),
          network: provider,
        },
        {
          headers: {
            Authorization: `Bearer ${wallet.token}`,
          },
        }
      );

      if (response.data.success) {
        setModalActions([
          {
            label: `Airtime purchase successful: ${response.data.message}`,
            onPress: () => {},
          },
          {
            label: 'View Transaction',
            onPress: () =>
              navigation.navigate('TransactionDetails', {
                reference: response.data.data.reference,
              }),
          },
          { label: 'OK', onPress: () => navigation.navigate('Home') },
        ]);
      } else {
        setModalActions([
          {
            label: `Transaction failed: ${response.data.message}`,
            onPress: () => {},
            style: { color: themeColors.destructive },
          },
          { label: 'OK', onPress: () => {} },
        ]);
      }
    } catch (error) {
      setModalActions([
        {
          label: `Error: ${error.response?.data?.message || 'Network error'}`,
          onPress: () => {},
          style: { color: themeColors.destructive },
        },
        { label: 'OK', onPress: () => setModalVisible(false) },
      ]);
    } finally {
      setIsLoading(false);
      setPin('');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 120 }}
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.heading }]}>
            Airtime
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={[styles.historyText, { color: themeColors.primary }]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View
          style={[styles.tabContainer, { backgroundColor: themeColors.card }]}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'Local' && {
                backgroundColor: themeColors.primary,
              },
            ]}
            onPress={() => setSelectedTab('Local')}
          >
            <Text
              style={[
                styles.tabText,
                { color: themeColors.heading },
                selectedTab === 'Local' && { color: themeColors.card },
              ]}
            >
              Local
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'International' && {
                backgroundColor: themeColors.primary,
              },
            ]}
            onPress={() => setSelectedTab('International')}
            disabled // Disable until international flow is implemented
          >
            <Text
              style={[
                styles.tabText,
                { color: themeColors.heading },
                selectedTab === 'International' && { color: themeColors.card },
              ]}
            >
              International
            </Text>
          </TouchableOpacity>
        </View>

        {/* Service Provider */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Select a Service Provider
        </Text>
        <View
          style={[styles.providerBox, { backgroundColor: themeColors.card }]}
        >
          <Dropdown
            style={styles.dropdown}
            data={providers}
            labelField="label"
            valueField="value"
            value={provider}
            placeholder="Select Provider"
            placeholderStyle={{ color: themeColors.subtext, fontSize: 13 }}
            selectedTextStyle={{ color: themeColors.heading }}
            onChange={(item) => setProvider(item.value)}
            renderLeftIcon={() =>
              provider ? (
                <Image
                  source={providers.find((p) => p.value === provider)?.logo}
                  style={styles.logo}
                />
              ) : (
                <Ionicons
                  name="cellular-outline"
                  size={22}
                  color={themeColors.subtext}
                />
              )
            }
          />
          <TextInput
            style={[styles.input, { color: themeColors.heading }]}
            placeholder="0XXX-XXXX-XXXX"
            placeholderTextColor={themeColors.subtext}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            accessibilityLabel="Phone number input"
          />
          <TouchableOpacity style={styles.contactBtn}>
            <Ionicons
              name="person-circle-outline"
              size={28}
              color={themeColors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Top-up */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Top-up Amount
        </Text>
        <View style={styles.amountContainer}>
          {amounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.amountBtn, { backgroundColor: themeColors.card }]}
              onPress={() => showConfirmationModal(amt)}
            >
              <Text style={[styles.amountText, { color: themeColors.primary }]}>
                ₦{amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Input */}
        <View
          style={[styles.customInputRow, { backgroundColor: themeColors.card }]}
        >
          <Text style={[styles.hash, { color: themeColors.heading }]}>₦</Text>
          <TextInput
            style={[styles.customInput, { color: themeColors.heading }]}
            placeholder="Enter Amount"
            placeholderTextColor={themeColors.subtext}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            accessibilityLabel="Custom amount input"
          />
          <TouchableOpacity
            style={[
              styles.payBtn,
              {
                backgroundColor:
                  !provider || !phone || !amount || isLoading
                    ? themeColors.subtext
                    : themeColors.button,
              },
            ]}
            disabled={!provider || !phone || !amount || isLoading}
            onPress={() => showConfirmationModal(amount)}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={themeColors.card} />
            ) : (
              <Text style={[styles.payText, { color: themeColors.card }]}>
                Pay
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Promotions Banner */}
        <View style={styles.promoSection}>
          <LinearGradient
            colors={[themeColors.neutral, themeColors.primary]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.promoCard}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.promoTitle, { color: themeColors.heading }]}>
                🎉 Refer And Win
              </Text>
              <Text
                style={[
                  styles.promoSubtitle,
                  { color: themeColors.subheading },
                ]}
              >
                Invite your Friends and earn up to ₦10,000
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.promoBtn, { backgroundColor: themeColors.card }]}
            >
              <Text
                style={[styles.promoBtnText, { color: themeColors.primary }]}
              >
                Refer
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <ActionModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        actions={modalActions}
        isDarkMode={isDarkMode}
      />

      {/* PIN Modal */}
      <ActionModal
        isVisible={pinModalVisible}
        onClose={() => {
          setPin('');
          setPinModalVisible(false);
          setModalVisible(true); // Reopen confirmation modal
        }}
        actions={[
          {
            label: (
              <View style={styles.pinModalWrapper}>
                <Text
                  style={[
                    {
                      color: themeColors.heading,
                      fontSize: 16,
                      fontWeight: '600',
                      marginBottom: 30,
                    },
                  ]}
                >
                  Enter Your 4-Digit Transaction PIN
                </Text>
                <TextInput
                  style={[
                    styles.pinInput,
                    {
                      color: themeColors.heading,
                      borderColor: themeColors.border,
                    },
                  ]}
                  placeholder="****"
                  placeholderTextColor={themeColors.subtext}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={pin}
                  onChangeText={setPin}
                  accessibilityLabel="Transaction PIN input"
                />
              </View>
            ),
            onPress: () => {},
          },
          {
            label: (
              <View
                style={[
                  styles.payButton,
                  { backgroundColor: themeColors.primary },
                ]}
              >
                <Text
                  style={[
                    {
                      color: themeColors.card,
                      fontWeight: 'bold',
                      fontSize: 16,
                    },
                  ]}
                >
                  Submit
                </Text>
              </View>
            ),
            onPress: handlePinSubmit,
          },
          {
            label: 'Cancel',
            onPress: () => {
              setPin('');
              setPinModalVisible(false);
              setModalVisible(false); // Reopen confirmation modal
            },
            style: { color: themeColors.destructive },
          },
        ]}
        isDarkMode={isDarkMode}
        style={styles.pinModal} // Smaller modal for PIN
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  historyText: {
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '500',
    fontSize: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginVertical: 10,
    fontSize: 16,
  },
  providerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 20,
  },
  dropdown: {
    flex: 1,
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 8,
    resizeMode: 'contain',
    borderRadius: 25,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 16,
  },
  contactBtn: {
    marginLeft: 6,
  },
  amountContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  amountBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    margin: 5,
    width: '30%',
    height: height * 0.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountText: {
    fontWeight: '600',
    fontSize: 15,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 6,
    marginBottom: 20,
  },
  hash: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
  customInput: {
    flex: 1,
    fontSize: 16,
  },
  payBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  payText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  promoSection: {
    marginVertical: 20,
  },
  promoCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  promoSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  promoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  promoBtnText: {
    fontWeight: '700',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  modalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalProduct: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  pinInput: {
    width: 200,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginLeft: 10,
    textAlign: 'center',
    fontSize: 16,
  },
  payButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    alignSelf: 'center',
    marginVertical: 10,
  },
  pinModalWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
});
