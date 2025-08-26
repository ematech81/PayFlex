import React, { useState, useEffect } from 'react';
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

export default function DataPurchaseScreen() {
  const [selectedTab, setSelectedTab] = useState('local');
  const [selectedProvider, setSelectedProvider] = useState('mtn');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pin, setPin] = useState('');
  const colorScheme = useColorScheme();
  // const [selectedProvider, setSelectedProvider] = useState('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Theme Colors
  const colors = {
    background: colorScheme === 'dark' ? '#121212' : '#F8F6FA',
    text: colorScheme === 'dark' ? '#EDEDED' : '#222',
    card: colorScheme === 'dark' ? '#2D1B4E' : '#E9D8FD', // light purple card
    heading: '#5B21B6', // deep purple
    button: '#7C3AED', // purple for CTA
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
        ₦{item.variation_amount}
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
          marginVertical: 10,
        }}
      >
        {providers.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={{
              padding: 8,
              borderRadius: 12,
              backgroundColor: '#e0e0e0',
              alignItems: 'center',
            }}
            onPress={() => setSelectedProvider(p.id)}
          >
            <View style={styles.imageWrapper}>
              <Image source={p.logo} style={styles.image} />
            </View>
            {/* <Text style={{ fontSize: 12 }}>{p.name}</Text> */}
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
              <Text style={{ color: colors.text, marginTop: 10 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
  },
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    width: width * 0.9,
    alignSelf: 'center',
  },
  planName: { fontSize: 16, fontWeight: '500' },
  planPrice: { fontSize: 18, fontWeight: '700', marginTop: 5 },
  note: { fontSize: 12, color: 'red', marginTop: 4 },
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
  },
  proceedBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  imageWrapper: {
    width: width * 0.11,
    height: width * 0.11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'hidden',
    borderRadius: '50%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: '50%',
  },
});

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   Image,
//   TouchableOpacity,
//   FlatList,
//   Dimensions,
//   ScrollView,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const { width } = Dimensions.get('window');

// const providers = [
//   { id: 'mtn', name: 'MTN', logo: require('../asset/mtn.jpg') },
//   {
//     id: 'airtel',
//     name: 'airtel',
//     logo: require('../asset/airtel.jpeg'),
//   },
//   { id: 'glo', name: 'glo', logo: require('../asset/glo.jpg') },
//   {
//     id: '9mobile',
//     name: '9mobile',
//     logo: require('../asset/9mobile.jpg'),
//   },
// ];

// const BASE_URL = 'http://192.168.100.137:5000/api/payments';

// const DataPurchaseScreen = () => {
//   const [selectedProvider, setSelectedProvider] = useState('mtn');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [plans, setPlans] = useState({});
//   const [activeCategory, setActiveCategory] = useState('HOT');

//   const fetchDataPlans = async (network) => {
//     try {
//       const res = await fetch(
//         `${BASE_URL}/data-plans?network=${network.toLowerCase()}`
//       );
//       const data = await res.json();
//       console.log('data returned', data);
//       return data.content.variations || [];
//     } catch (err) {
//       console.error(err);
//       return [];
//     }
//   };

//   // ❌ Unwanted Glo plans
//   const excludedGloCodes = [
//     'glo-wtf-25',
//     'glo-wtf-50',
//     'glo-wtf-100',
//     'glo-opera-25',
//     'glo-opera-50',
//     'glo-opera-100',
//   ];

//   const cleanPlans = (network, variations) => {
//     return variations
//       .filter((plan) => {
//         // If provider is Glo, exclude the unwanted ones
//         if (network.toLowerCase() === 'glo') {
//           return !excludedGloCodes.includes(plan.variation_code?.toLowerCase());
//         }
//         return true;
//       })
//       .map((plan) => ({
//         ...plan,
//         note: /oneoff/i.test(plan.name)
//           ? 'No auto renewal, renewed manually'
//           : null,
//       }));
//   };

//   useEffect(() => {
//     (async () => {
//       const data = await fetchDataPlans(selectedProvider);
//       const cleaned = cleanPlans(selectedProvider, data);
//       setPlans(cleaned); // store final list directly
//     })();
//   }, [selectedProvider]);

//   const renderPlan = ({ item }) => (
//     <TouchableOpacity
//       style={{
//         backgroundColor: '#fff',
//         padding: 12,
//         marginVertical: 6,
//         borderRadius: 12,
//         shadowColor: '#000',
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 2,
//         width: width * 0.9,
//         alignSelf: 'center',
//       }}
//       onPress={() => {
//         if (!phoneNumber) {
//           alert('Please enter recipient phone number first.');
//           return;
//         }
//         alert(`Purchasing ${item.name} for ${phoneNumber}`);
//         // 🔹 call your purchase API here
//       }}
//     >
//       <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>
//         {item.name}
//       </Text>
//       <Text
//         style={{ fontSize: 14, color: '#666', marginTop: 4 }}
//       >{`₦${item.amount}`}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
//       <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
//         {/* Title */}
//         <Text
//           style={{
//             fontSize: 22,
//             fontWeight: '700',
//             textAlign: 'center',
//             marginVertical: 16,
//           }}
//         >
//           Buy Data
//         </Text>

//         {/* Provider Selector */}
//         <View
//           style={{
//             flexDirection: 'row',
//             justifyContent: 'space-around',
//             marginVertical: 10,
//           }}
//         >
//           {providers.map((p) => (
//             <TouchableOpacity
//               key={p.id}
//               style={{
//                 padding: 8,
//                 borderRadius: 12,
//                 backgroundColor:
//                   selectedProvider === p.id ? '#e0e0e0' : 'transparent',
//                 alignItems: 'center',
//               }}
//               onPress={() => setSelectedProvider(p.id)}
//             >
//               <Image
//                 source={p.logo}
//                 style={{ width: 50, height: 50, resizeMode: 'contain' }}
//               />
//               <Text style={{ fontSize: 12 }}>{p.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Phone Number Input */}
//         <View style={{ marginHorizontal: 20, marginVertical: 10 }}>
//           <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
//             Recipient Phone Number
//           </Text>
//           <TextInput
//             placeholder="Enter phone number"
//             keyboardType="phone-pad"
//             value={phoneNumber}
//             onChangeText={setPhoneNumber}
//             style={{
//               backgroundColor: '#fff',
//               padding: 12,
//               borderRadius: 10,
//               borderWidth: 1,
//               borderColor: '#ddd',
//               fontSize: 16,
//             }}
//           />
//         </View>

//         {/* Tabs */}
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           style={{ marginVertical: 10 }}
//         >
//           {categories.map((cat) => (
//             <TouchableOpacity
//               key={cat}
//               onPress={() => setActiveCategory(cat)}
//               style={{
//                 backgroundColor: activeCategory === cat ? '#007bff' : '#eee',
//                 paddingVertical: 8,
//                 paddingHorizontal: 16,
//                 borderRadius: 20,
//                 marginHorizontal: 6,
//               }}
//             >
//               <Text
//                 style={{
//                   color: activeCategory === cat ? '#fff' : '#333',
//                   fontWeight: '600',
//                 }}
//               >
//                 {cat}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* Plans List */}
//         {plans[activeCategory] && (
//           <FlatList
//             data={plans}
//             keyExtractor={(item) => item.variation_code}
//             renderItem={renderPlan}
//             scrollEnabled={false}
//           />
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default DataPurchaseScreen;
