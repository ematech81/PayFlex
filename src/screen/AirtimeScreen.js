import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Switch,
  ScrollView,
  Image,
  Dimensions,
  SaveAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import { LinearGradient } from 'expo-linear-gradient';

// const { width } = Dimensions.get('window');
const CARD_PADDING = 13;
const ICON_SIZE = 19;

export default function AirtimeScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('Local');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [provider, setProvider] = useState(null);

  const amounts = ['50', '100', '200', '500', '1,000', '2,000'];

  // Dummy provider list with logos
  const providers = [
    { label: 'MTN', value: 'mtn', logo: require('../asset/mtn.jpg') },
    {
      label: 'Airtel',
      value: 'airtel',
      logo: require('../asset/airtel.jpeg'),
    },
    { label: 'Glo', value: 'glo', logo: require('../asset/glo.jpg') },
    {
      label: '9mobile',
      value: '9mobile',
      logo: require('../asset/etisalat.jpg'),
    },
  ];

  return (
    // <SaveAreaView style={{ flex: 1, backgroundColor: '#f6f6f8' }}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 120 }}
        >
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Airtime</Text>
        <Text style={styles.historyText}>History</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'Local' && styles.activeTab]}
          onPress={() => setSelectedTab('Local')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'Local' && styles.activeTabText,
            ]}
          >
            Local
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'International' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('International')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'International' && styles.activeTabText,
            ]}
          >
            International
          </Text>
        </TouchableOpacity>
      </View>

      {/* Service Provider */}
      <Text style={styles.sectionTitle}>Select a service Provider</Text>
      <View style={styles.providerBox}>
        {/* Dropdown */}
        <Dropdown
          style={styles.dropdown}
          data={providers}
          labelField="label"
          valueField="value"
          value={provider}
          // placeholder="Select Provider"
          onChange={(item) => setProvider(item.value)}
          renderLeftIcon={() =>
            provider ? (
              <Image
                source={providers.find((p) => p.value === provider)?.logo}
                style={styles.logo}
              />
            ) : (
              <Ionicons name="cellular-outline" size={22} color="gray" />
            )
          }
        />

        {/* Phone Input */}
        <TextInput
          style={styles.input}
          placeholder="0XXX-XXXX-XXXX"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {/* Contact Button */}
        <TouchableOpacity style={styles.contactBtn}>
          <Ionicons name="person-circle-outline" size={28} color="#5e2ced" />
        </TouchableOpacity>
      </View>

      {/* Top-up */}
      <Text style={styles.sectionTitle}>Topup</Text>
      <ScrollView contentContainerStyle={styles.amountContainer}>
        {amounts.map((amt) => (
          <TouchableOpacity
            key={amt}
            style={[styles.amountBtn, amount === amt && styles.activeAmount]}
            onPress={() => setAmount(amt)}
          >
            <Text
              style={[
                styles.amountText,
                amount === amt && styles.activeAmountText,
              ]}
            >
              ₦{amt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Custom Input */}
      <View style={styles.customInputRow}>
        <Text style={styles.hash}>#</Text>
        <TextInput
          style={styles.customInput}
          placeholder="Enter Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TouchableOpacity style={styles.payBtn}>
          <Text style={styles.payText}>Pay</Text>
        </TouchableOpacity>
      </View>

      {/* Save Beneficiary */}
      <View style={styles.switchRow}>
        <Text style={styles.sectionTitle}>Save as Beneficiary</Text>
        <Switch
          value={saveBeneficiary}
          onValueChange={setSaveBeneficiary}
          trackColor={{ false: '#ccc', true: '#a78bfa' }}
          thumbColor={saveBeneficiary ? '#5e2ced' : '#f4f3f4'}
        />
      </View>

      {/* Carousel Placeholder */}
      {/* Promotions Banner */}
      <View style={[styles.promoSection, {}]}>
        <LinearGradient
          colors={['#FFD98E', '#FFB800']}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.promoCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>🎉 Refer And Win</Text>
            <Text style={styles.promoSubtitle}>
              Invite your Friends and earn up to ₦10,000
            </Text>
          </View>
          <TouchableOpacity style={styles.promoBtn}>
            <Text style={styles.promoBtnText}>Refer</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </ScrollView>
    // </SaveAreaView>
  );
}
const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f8',
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
    color: '#4A00E0',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4A00E0',
  },
  tabText: {
    color: 'black',
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginVertical: 10,
  },
  providerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
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
    marginRight: 1,
    resizeMode: 'contain',
    borderRadius: 25,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
  },
  contactBtn: {
    marginLeft: 6,
  },
  amountContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: 10,
    marginBottom: 20,
    width: '100%',
    // backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBtn: {
    backgroundColor: '#ffffff',
    // backgroundColor: 'rgba(74,0,224,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    margin: 5,
    width: '30%',
    height: height * 0.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeAmount: {
    backgroundColor: '#4A00E0',
  },
  amountText: {
    fontWeight: '600',
    color: '#4a00e0',
    fontSize: 15,
  },
  activeAmountText: {
    color: 'white',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
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
  },
  payBtn: {
    backgroundColor: '#5e2ced',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  payText: {
    color: 'white',
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  carouselBox: {
    backgroundColor: '#5e2ced',
    padding: 20,
    borderRadius: 12,
  },
  promoCard: {
    borderRadius: 16,
    padding: 10,
    // paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // marginTop: 12,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2b2b2b',
  },
  promoSubtitle: {
    fontSize: 13,
    color: '#2b2b2b',
    marginTop: 4,
  },
  promoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  promoBtnText: {
    fontWeight: '700',
    color: '#FF9A00',
  },
});
