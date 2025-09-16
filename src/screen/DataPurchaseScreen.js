import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  useColorScheme,
  Dimensions,
  StyleSheet,
  Image,
} from 'react-native';
import BackBtn from 'utility/BackBtn';

const { width } = Dimensions.get('window');

const providers = [
  { id: 'mtn', name: 'MTN', logo: require('../asset/mtn.jpg') },
  {
    id: 'airtel',
    name: 'airtel',
    logo: require('../asset/airtel.jpeg'),
  },
  { id: 'glo', name: 'glo', logo: require('../asset/glo.jpg') },
  {
    id: '9mobile',
    name: '9mobile',
    logo: require('../asset/etisalat.jpg'),
  },
];

const BASE_URL = 'http://192.168.100.137:5000/api/';

export default function DataPurchaseScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('local');
  const [selectedProvider, setSelectedProvider] = useState('mtn');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pin, setPin] = useState('');
  // const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const [phoneNumber, setPhoneNumber] = useState('');

  // Theme Colors
  const colors = {
    background: colorScheme === 'dark' ? '#121212' : '#F6f6f8',
    text: colorScheme === 'dark' ? '#EDEDED' : '#222',
    card: colorScheme === 'dark' ? '#2D1B4E' : '#ffffff', // light purple card
    heading: '#4a00e0', // deep purple
    button: '#4a00e0', // purple for CTA
  };

  const fetchDataPlans = async (network) => {
    try {
      const res = await fetch(`${BASE_URL}/data-plans?network=${network}`);
      const data = await res.json();

      let variations = data?.content?.variations || [];

      // Filter out unwanted glo plans
      variations = variations.filter(
        (v) =>
          ![
            'glo-wtf-25',
            'glo-wtf-50',
            'glo-wtf-100',
            'Glo-opera-25',
            'Glo-opera-50',
            'Glo-opera-100',
            'mtn-xtratalk-300',
          ].includes(v.variation_code)
      );

      return variations;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      const data = await fetchDataPlans(selectedProvider);
      console.log('data retured', data);
      setPlans(data);
    })();
  }, [selectedProvider, selectedTab]);

  const handlePurchase = async () => {
    try {
      // call your backend purchase endpoint
      const res = await fetch(`${BASE_URL}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: selectedProvider,
          variation_code: selectedPlan.variation_code,
          phone: '080xxxxxxxx', // replace with recipient input
          pin,
        }),
      });

      const result = await res.json();
      console.log('Purchase Result:', result);
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const renderPlan = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => {
        setSelectedPlan(item);
        setShowModal(true);
      }}
    >
      <Text style={[styles.planName, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.planPrice, { color: colors.heading }]}>
        ₦,{item.variation_amount}
      </Text>
      {item.name.toLowerCase().includes('oneoff') && (
        <Text style={styles.note}>
          No auto renewal. To be renewed manually.
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackBtn
        onPress={() => navigation.goBack()}
        style={{ alignSelf: 'start', marginTop: 20, marginBottom: 10 }}
      />
      <View style={{ marginVertical: 20, paddingHorizontal: 16 }}>
        <Text style={{ textAlign: 'left', fontWeight: 'bold', fontSize: 20 }}>
          Data Subscription
        </Text>
      </View>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {['local', 'international'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              {
                borderBottomColor:
                  selectedTab === tab ? colors.button : 'transparent',
              },
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={{
                color: selectedTab === tab ? colors.button : colors.text,
                fontWeight: '600',
              }}
            >
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Provider Selector */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginVertical: 30,
        }}
      >
        {providers.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[
              {
                padding: 6,
                borderRadius: 12,
                backgroundColor: 'transparent',
                alignItems: 'center',
              },
              selectedProvider === p.id && { backgroundColor: '#f3aeaeff' },
            ]}
            onPress={() => setSelectedProvider(p.id)}
          >
            <View style={styles.imageWrapper}>
              <Image source={p.logo} style={styles.image} resizeMode="cover" />
            </View>
            {/* <Text style={{ fontSize: 12 }}>{p.name}</Text> */}
          </TouchableOpacity>
        ))}
      </View>

      {/* Phone Number Input */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 6,
            marginLeft: 5,
          }}
        >
          Recipient Phone Number
        </Text>
        <TextInput
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          style={{
            backgroundColor: '#fff',
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#4a00e0',
            fontSize: 14,
            width: '100%',
            alignSelf: 'center',
          }}
        />
      </View>

      {/* Plans List */}
      <FlatList
        data={plans}
        keyExtractor={(item) => item.variation_code}
        renderItem={renderPlan}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Purchase Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.heading }]}>
              Confirm Purchase
            </Text>
            {selectedPlan && (
              <>
                <Text style={{ color: colors.text }}>
                  Plan: {selectedPlan.name}
                </Text>
                <Text style={{ color: colors.text }}>
                  Price: ₦{selectedPlan.variation_amount}
                </Text>
              </>
            )}

            <TextInput
              style={[styles.input, { borderColor: colors.button }]}
              placeholder="Enter PIN"
              placeholderTextColor="#999"
              secureTextEntry
              value={pin}
              onChangeText={setPin}
            />

            <TouchableOpacity
              style={[styles.proceedBtn, { backgroundColor: colors.button }]}
              onPress={handlePurchase}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Proceed</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={{ color: '#fff', marginTop: 10 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  activeTab: {
    backgroundColor: '#4a00e0',
  },
  tab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
  },
  card: {
    padding: 10,
    marginVertical: 8,
    borderRadius: 12,
    width: width * 0.9,
    alignSelf: 'center',
  },
  planName: { fontSize: 16, fontWeight: '500' },
  planPrice: { fontSize: 18, fontWeight: '700', marginTop: 5 },
  note: { fontSize: 10, color: 'red', marginTop: 4 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 16,
    width: width * 0.85,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 15,
    padding: 10,
    color: '#000',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  proceedBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  imageWrapper: {
    // width: width * 0.1,
    // height: width * 0.1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'hidden',
    borderRadius: 50,
  },
  image: {
    width: width * 0.11,
    height: width * 0.11,
    // width: '100%',
    // height: '100%',

    borderRadius: 50,
  },
});
