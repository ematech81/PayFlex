import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    logo: require('../asset/9mobile.jpg'),
  },
];

const BASE_URL = 'http://192.168.100.137:5000/api/payments';

const DataPurchaseScreen = () => {
  const [selectedProvider, setSelectedProvider] = useState('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [plans, setPlans] = useState({});
  const [activeCategory, setActiveCategory] = useState('HOT');

  const fetchDataPlans = async (network) => {
    try {
      const res = await fetch(
        `${BASE_URL}/data-plans?network=${network.toLowerCase()}`
      );
      const data = await res.json();
      console.log('data returned', data);
      return data.content.variations || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // ❌ Unwanted Glo plans
  const excludedGloCodes = [
    'glo-wtf-25',
    'glo-wtf-50',
    'glo-wtf-100',
    'glo-opera-25',
    'glo-opera-50',
    'glo-opera-100',
  ];

  const cleanPlans = (network, variations) => {
    return variations
      .filter((plan) => {
        // If provider is Glo, exclude the unwanted ones
        if (network.toLowerCase() === 'glo') {
          return !excludedGloCodes.includes(plan.variation_code?.toLowerCase());
        }
        return true;
      })
      .map((plan) => ({
        ...plan,
        note: /oneoff/i.test(plan.name)
          ? 'No auto renewal, renewed manually'
          : null,
      }));
  };

  useEffect(() => {
    (async () => {
      const data = await fetchDataPlans(selectedProvider);
      const cleaned = cleanPlans(selectedProvider, data);
      setPlans(cleaned); // store final list directly
    })();
  }, [selectedProvider]);

  const renderPlan = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: '#fff',
        padding: 12,
        marginVertical: 6,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        width: width * 0.9,
        alignSelf: 'center',
      }}
      onPress={() => {
        if (!phoneNumber) {
          alert('Please enter recipient phone number first.');
          return;
        }
        alert(`Purchasing ${item.name} for ${phoneNumber}`);
        // 🔹 call your purchase API here
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>
        {item.name}
      </Text>
      <Text
        style={{ fontSize: 14, color: '#666', marginTop: 4 }}
      >{`₦${item.amount}`}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Title */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            textAlign: 'center',
            marginVertical: 16,
          }}
        >
          Buy Data
        </Text>

        {/* Provider Selector */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginVertical: 10,
          }}
        >
          {providers.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={{
                padding: 8,
                borderRadius: 12,
                backgroundColor:
                  selectedProvider === p.id ? '#e0e0e0' : 'transparent',
                alignItems: 'center',
              }}
              onPress={() => setSelectedProvider(p.id)}
            >
              <Image
                source={p.logo}
                style={{ width: 50, height: 50, resizeMode: 'contain' }}
              />
              <Text style={{ fontSize: 12 }}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Phone Number Input */}
        <View style={{ marginHorizontal: 20, marginVertical: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
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
              borderColor: '#ddd',
              fontSize: 16,
            }}
          />
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: 10 }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={{
                backgroundColor: activeCategory === cat ? '#007bff' : '#eee',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                marginHorizontal: 6,
              }}
            >
              <Text
                style={{
                  color: activeCategory === cat ? '#fff' : '#333',
                  fontWeight: '600',
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Plans List */}
        {plans[activeCategory] && (
          <FlatList
            data={plans}
            keyExtractor={(item) => item.variation_code}
            renderItem={renderPlan}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DataPurchaseScreen;
