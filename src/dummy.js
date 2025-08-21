// colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.22)']}

// {/* Recent Transactions */}
//             <View style={styles.section}>
//               <View style={styles.sectionHeader}>
//                 <Text style={styles.sectionTitle}>Recent Transactions</Text>
//                 <TouchableOpacity>
//                   <Text style={styles.viewAll}>See all</Text>
//                 </TouchableOpacity>
//               </View>

//               <FlatList
//                 data={transactions}
//                 keyExtractor={(item) => item.id}
//                 style={{ marginTop: 8 }}
//                 scrollEnabled={false}
//                 renderItem={({ item }) => (
//                   <View style={styles.txRow}>
//                     <View style={styles.txLeft}>
//                       <View style={styles.txIcon}>
//                         <Ionicons
//                           name="receipt-outline"
//                           size={18}
//                           color="#4A00E0"
//                         />
//                       </View>
//                       <View>
//                         <Text style={styles.txTitle}>{item.title}</Text>
//                         <Text style={styles.txDate}>{item.date}</Text>
//                       </View>
//                     </View>
//                     <Text
//                       style={[
//                         styles.txAmount,
//                         {
//                           color: item.amount.startsWith('-')
//                             ? '#FF4D4F'
//                             : '#1B9C85',
//                         },
//                       ]}
//                     >
//                       {item.amount}
//                     </Text>
//                   </View>
//                 )}
//               />
//             </View>

// const promoData = [
//   {
//     // image: require('../assets/refer.png'),
//     title: 'Refer & Earn',
//     subtitle: 'Invite friends and win ₦500 each!',
//     screen: 'ReferFriendScreen',
//   },
//   {
//     // image: require('../assets/dstv.png'),
//     title: '5% Cashback on DSTV',
//     subtitle: 'Valid for first subscription',
//     screen: 'DSTVScreen',
//   },
//   {
//     // image: require('../assets/electricity.png'),
//     title: 'Pay Bills Easily',
//     subtitle: 'Quick electricity & water bill payments',
//     screen: 'BillPaymentScreen',
//   },
// ];

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   FlatList,
//   useColorScheme,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';

// // Mock VTpass integration (replace with actual API calls)
// const fetchVTpassServices = async () => {
//   // Simulate VTpass API call for services like airtime, data, electricity, etc.
//   return {
//     quickActions: [
//       {
//         id: 'airtime',
//         title: 'Airtime',
//         icon: 'call',
//         color: '#FF6B6B',
//         screen: 'Airtime',
//       },
//       {
//         id: 'data',
//         title: 'Data',
//         icon: 'wifi',
//         color: '#4ECDC4',
//         screen: 'Data',
//       },
//       {
//         id: 'electricity',
//         title: 'Electricity',
//         icon: 'flash',
//         color: '#FFD93D',
//         screen: 'ElectricityScreen',
//       },
//       {
//         id: 'more_quick',
//         title: 'More',
//         icon: 'ellipsis-horizontal',
//         color: '#6C5CE7',
//         screen: 'MoreQuickActionsScreen',
//       },
//     ],
//     services: [
//       {
//         id: 'betting',
//         title: 'Betting',
//         icon: 'football',
//         color: '#FF8C42',
//         screen: 'BettingScreen',
//       },
//       {
//         id: 'jamb',
//         title: 'JAMB',
//         icon: 'school',
//         color: '#1DD1A1',
//         screen: 'JAMBScreen',
//       },
//       {
//         id: 'bills',
//         title: 'Bills',
//         icon: 'receipt',
//         color: '#0984E3',
//         screen: 'BillsScreen',
//       },
//       {
//         id: 'tv_subs',
//         title: 'TV Subs',
//         icon: 'tv',
//         color: '#00C4CC',
//         screen: 'TVSubsScreen',
//       },
//       {
//         id: 'flights',
//         title: 'Flights',
//         icon: 'airplane',
//         color: '#4A00E0',
//         screen: 'FlightsScreen',
//       },
//       {
//         id: 'hotels',
//         title: 'Hotels',
//         icon: 'bed',
//         color: '#FF6B6B',
//         screen: 'HotelsScreen',
//       },
//       {
//         id: 'waec',
//         title: 'WAEC',
//         icon: 'document-text',
//         color: '#4ECDC4',
//         screen: 'WAECScreen',
//       },
//       {
//         id: 'more_services',
//         title: 'More',
//         icon: 'ellipsis-horizontal',
//         color: '#FFD93D',
//         screen: 'MoreServicesScreen',
//       },
//     ],
//   };
// };

// export default function HomeScreen() {
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === 'dark';
//   const navigation = useNavigation();

//   const [walletBalance, setWalletBalance] = useState(15000); // Mock balance
//   const [servicesData, setServicesData] = useState({
//     quickActions: [],
//     services: [],
//   });

//   useEffect(() => {
//     const loadServices = async () => {
//       const data = await fetchVTpassServices();
//       setServicesData(data);
//     };
//     loadServices();
//   }, []);

//   const theme = {
//     background: isDark ? '#1A1A1A' : '#F7F9FC',
//     text: isDark ? '#FFFFFF' : '#2C3E50',
//     subText: isDark ? '#A0A0A0' : '#7F8C8D',
//     card: isDark ? '#2C2C2C' : '#FFFFFF',
//     primary: '#4A00E0', // Deep purple
//     accent: '#FFB800',
//     positive: '#27AE60',
//     banner: isDark ? '#FFA000' : '#FFB800',
//   };

//   const renderQuickAction = ({ item }) => (
//     <TouchableOpacity
//       style={[styles.quickAction, { backgroundColor: item.color }]}
//       onPress={() => navigation.navigate(item.screen)}
//     >
//       <Ionicons name={item.icon} size={24} color="#FFFFFF" />
//       <Text style={styles.quickActionText}>{item.title}</Text>
//     </TouchableOpacity>
//   );

//   const renderService = ({ item }) => (
//     <TouchableOpacity
//       style={styles.serviceItem}
//       onPress={() => navigation.navigate(item.screen)}
//     >
//       <View style={[styles.serviceIcon, { backgroundColor: item.color }]}>
//         <Ionicons name={item.icon} size={24} color="#FFFFFF" />
//       </View>
//       <Text style={[styles.serviceText, { color: theme.text }]}>
//         {item.title}
//       </Text>
//     </TouchableOpacity>
//   );

//   return (
//     <ScrollView
//       style={[styles.container, { backgroundColor: theme.background }]}
//     >
//       <View style={styles.header}>
//         <Text style={[styles.greeting, { color: theme.text }]}>
//           Hi Emmanuel
//         </Text>
//         <Ionicons
//           name="notifications-outline"
//           size={24}
//           color={theme.text}
//           style={styles.notification}
//         />
//       </View>
//       <Text style={[styles.subGreeting, { color: theme.subText }]}>
//         What do you want to pay for today?
//       </Text>

//       <View style={[styles.walletCard, { backgroundColor: theme.card }]}>
//         <View style={styles.walletHeader}>
//           <Text style={[styles.walletTitle, { color: theme.text }]}>
//             Wallet Balance
//           </Text>
//           <TouchableOpacity>
//             <Text style={[styles.historyLink, { color: theme.primary }]}>
//               History
//             </Text>
//           </TouchableOpacity>
//         </View>
//         <Text style={[styles.walletAmount, { color: theme.text }]}>
//           ₦{walletBalance.toLocaleString()}
//         </Text>
//         <View style={styles.walletButtons}>
//           <TouchableOpacity
//             style={[styles.walletButton, { backgroundColor: theme.primary }]}
//           >
//             <Text style={styles.walletButtonText}>Quick Deposit</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.walletButton, { backgroundColor: theme.primary }]}
//           >
//             <Text style={styles.walletButtonText}>Withdraw</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <Text style={[styles.sectionTitle, { color: theme.text }]}>
//         Quick Actions
//       </Text>
//       <FlatList
//         data={servicesData.quickActions}
//         renderItem={renderQuickAction}
//         keyExtractor={(item) => item.id}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         style={styles.quickActionsList}
//       />

//       <Text style={[styles.sectionTitle, { color: theme.text }]}>Services</Text>
//       <FlatList
//         data={servicesData.services}
//         renderItem={renderService}
//         keyExtractor={(item) => item.id}
//         numColumns={4}
//         columnWrapperStyle={styles.serviceRow}
//         scrollEnabled={false}
//       />

//       <View style={[styles.referBanner, { backgroundColor: theme.banner }]}>
//         <Ionicons
//           name="gift"
//           size={24}
//           color="#FFFFFF"
//           style={styles.referIcon}
//         />
//         <View style={styles.referTextContainer}>
//           <Text style={styles.referTitle}>Refer And Win</Text>
//           <Text style={styles.referSubtitle}>
//             Invite your Friends and earn up to ₦10,000
//           </Text>
//         </View>
//         <TouchableOpacity style={styles.referButton}>
//           <Text style={styles.referButtonText}>Refer</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   greeting: {
//     fontSize: 24,
//     fontWeight: 'bold',
//   },
//   notification: {
//     marginRight: 8,
//   },
//   subGreeting: {
//     fontSize: 16,
//     marginBottom: 16,
//   },
//   walletCard: {
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   walletHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   walletTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   historyLink: {
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   walletAmount: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     marginBottom: 12,
//   },
//   walletButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   walletButton: {
//     flex: 1,
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginHorizontal: 4,
//   },
//   walletButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 12,
//   },
//   quickActionsList: {
//     marginBottom: 16,
//   },
//   quickAction: {
//     padding: 12,
//     borderRadius: 50,
//     marginRight: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: 80,
//     height: 80,
//   },
//   quickActionText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '600',
//     marginTop: 4,
//     textAlign: 'center',
//   },
//   serviceRow: {
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   serviceItem: {
//     alignItems: 'center',
//     width: '25%',
//   },
//   serviceIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   serviceText: {
//     fontSize: 12,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
//   referBanner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     borderRadius: 12,
//     marginTop: 8,
//   },
//   referIcon: {
//     marginRight: 12,
//   },
//   referTextContainer: {
//     flex: 1,
//   },
//   referTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//   },
//   referSubtitle: {
//     fontSize: 12,
//     color: '#FFFFFF',
//   },
//   referButton: {
//     backgroundColor: '#FFFFFF',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//   },
//   referButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#FFB800',
//   },
// });

// import React, { useState, useEffect } from 'react';
// import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { Ionicons } from '@expo/vector-icons';

// // Mock data for networks and data plans (replace with VTpass API fetch)
// const mockNetworks = ['MTN', 'Glo', 'Airtel', '9mobile'];

// const mockDataPlans = {
//   HOT: [
//     { id: '1', size: '1GB', price: '₦500', validity: '1 day', cashback: '#10 cash back' },
//     { id: '2', size: '2.5GB', price: '₦900', validity: '2 Days' },
//     { id: '3', size: '3GB', price: '₦1200', validity: '3 Days' },
//     { id: '4', size: '5GB', price: '₦2000', validity: '5 Days' },
//     { id: '5', size: '10GB', price: '₦3500', validity: '7 Days' },
//     { id: '6', size: '15GB', price: '₦5000', validity: '10 Days' },
//   ],
//   Daily: [
//     { id: '7', size: '40MB', price: '₦50', validity: '1 day' },
//     { id: '8', size: '350MB', price: '₦300', validity: '1 day' },
//     { id: '9', size: '1GB', price: '₦500', validity: '1 day' },
//     { id: '10', size: '2GB', price: '₦1000', validity: '1 day' },
//     { id: '11', size: '3GB', price: '₦1500', validity: '1 day' },
//   ],
//   Weekly: [
//     { id: '12', size: '1GB', price: '₦500', validity: '7 days' },
//     { id: '13', size: '2GB', price: '₦1000', validity: '7 days' },
//     { id: '14', size: '6GB', price: '₦1500', validity: '7 days' },
//     { id: '15', size: '10GB', price: '₦2500', validity: '7 days' },
//   ],
//   Monthly: [
//     { id: '16', size: '2GB', price: '₦1200', validity: '30 days' },
//     { id: '17', size: '3GB', price: '₦1500', validity: '30 days' },
//     { id: '18', size: '10GB', price: '₦3500', validity: '30 days' },
//     { id: '19', size: '20GB', price: '₦6000', validity: '30 days' },
//     { id: '20', size: '40GB', price: '₦10000', validity: '30 days' },
//   ],
//   Xtravalue: [
//     { id: '21', size: '500MB + 300Min', price: '₦1000', validity: '30 days' },
//     { id: '22', size: '1GB + 500Min', price: '₦2000', validity: '30 days' },
//     { id: '23', size: '2GB + 1000Min', price: '₦3000', validity: '30 days' },
//     { id: '24', size: '5GB + 2000Min', price: '₦5000', validity: '30 days' },
//   ],
// };

// export default function DataPurchaseScreen() {
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === 'dark';

//   const [activeType, setActiveType] = useState('Local');
//   const [network, setNetwork] = useState(mockNetworks[0]);
//   const [phone, setPhone] = useState('');
//   const [activeTab, setActiveTab] = useState('HOT');
//   const [plans, setPlans] = useState(mockDataPlans.HOT);

//   useEffect(() => {
//     // Fetch data plans from VTpass API (sandbox for testing)
//     // Example VTpass API call (uncomment and add authentication)
//     /*
//     const fetchPlans = async () => {
//       try {
//         const response = await fetch(`https://sandbox.vtpass.com/api/service-variations?serviceID=${network.toLowerCase()}-data`);
//         const data = await response.json();
//         // Parse and set plans based on VTpass response
//         setPlans(data.content.varations); // Adjust based on API structure
//       } catch (error) {
//         console.error('VTpass API error:', error);
//       }
//     };
//     fetchPlans();
//     */
//     setPlans(mockDataPlans[activeTab]);
//   }, [network, activeTab]);

//   const theme = {
//     background: isDark ? '#1A1A1A' : '#F7F9FC',
//     card: isDark ? '#2C2C2C' : '#FFFFFF',
//     text: isDark ? '#FFFFFF' : '#2C3E50',
//     subText: isDark ? '#A0A0A0' : '#7F8C8D',
//     input: isDark ? '#3C3C3C' : '#FFFFFF',
//     inputText: isDark ? '#FFFFFF' : '#2C3E50',
//     button: '#4A00E0', // Deep purple primary
//     buttonText: '#FFFFFF',
//     tabActive: '#4A00E0',
//     tabInactive: isDark ? '#A0A0A0' : '#9AA0B4',
//     toggleActive: '#4A00E0',
//     toggleInactive: '#9AA0B4',
//     toggleBackground: isDark ? '#2C2C2C' : '#E0E0E0',
//   };

//   const tabs = ['HOT', 'Daily', 'Weekly', 'Monthly', 'Xtravalue'];

//   const renderPlan = ({ item }) => (
//     <TouchableOpacity style={[styles.planCard, { backgroundColor: theme.card }]}>
//       <Text style={[styles.planSize, { color: theme.text }]}>{item.size}</Text>
//       <Text style={[styles.planPrice, { color: theme.button }]}>{item.price}</Text>
//       <Text style={[styles.planValidity, { color: theme.subText }]}>{item.validity}</Text>
//       {item.cashback && <Text style={[styles.planCashback, { color: '#27AE60' }]}>{item.cashback}</Text>}
//     </TouchableOpacity>
//   );

//   return (
//     <View style={[styles.container, { backgroundColor: theme.background }]}>
//       <View style={styles.header}>
//         <TouchableOpacity>
//           <Ionicons name="arrow-back" size={24} color={theme.text} />
//         </TouchableOpacity>
//         <Text style={[styles.title, { color: theme.text }]}>Airtime</Text>
//         <TouchableOpacity>
//           <Text style={[styles.history, { color: theme.button }]}>History</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.toggleContainer}>
//         <TouchableOpacity
//           style={[styles.toggleButton, { backgroundColor: activeType === 'Local' ? theme.toggleActive : theme.toggleBackground }]}
//           onPress={() => setActiveType('Local')}
//         >
//           <Text style={[styles.toggleText, { color: activeType === 'Local' ? theme.buttonText : theme.tabInactive }]}>Local</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.toggleButton, { backgroundColor: activeType === 'International' ? theme.toggleActive : theme.toggleBackground }]}
//           onPress={() => setActiveType('International')}
//         >
//           <Text style={[styles.toggleText, { color: activeType === 'International' ? theme.buttonText : theme.tabInactive }]}>International</Text>
//         </TouchableOpacity>
//       </View>

//       <Text style={[styles.providerLabel, { color: theme.text }]}>Select a service Provider</Text>
//       <View style={styles.providerRow}>
//         <View style={[styles.networkPicker, { backgroundColor: theme.input, borderColor: theme.subText }]}>
//           <Picker
//             selectedValue={network}
//             onValueChange={(itemValue) => setNetwork(itemValue)}
//             style={{ color: theme.inputText }}
//           >
//             {mockNetworks.map((net) => (
//               <Picker.Item key={net} label={net} value={net} />
//             ))}
//           </Picker>
//         </View>
//         <TextInput
//           style={[styles.phoneInput, { backgroundColor: theme.input, color: theme.inputText, borderColor: theme.subText }]}
//           value={phone}
//           onChangeText={setPhone}
//           placeholder="0XXX-XXX-XXXX"
//           placeholderTextColor={theme.subText}
//           keyboardType="phone-pad"
//         />
//         <TouchableOpacity style={styles.contactIcon}>
//           <Ionicons name="person-circle-outline" size={32} color={theme.button} />
//         </TouchableOpacity>
//       </View>

//       <Text style={[styles.dataPlansLabel, { color: theme.text }]}>Data plans</Text>
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
//         {tabs.map((tab) => (
//           <TouchableOpacity
//             key={tab}
//             style={[styles.tab, activeTab === tab ? { borderBottomColor: theme.tabActive } : {}]}
//             onPress={() => setActiveTab(tab)}
//           >
//             <Text style={[styles.tabText, { color: activeTab === tab ? theme.tabActive : theme.tabInactive }]}>
//               {tab}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>

//       <FlatList
//         data={plans}
//         renderItem={renderPlan}
//         keyExtractor={(item) => item.id}
//         numColumns={3}
//         style={styles.planGrid}
//         columnWrapperStyle={styles.planRow}
//       />

//       <View style={[styles.carouselPlaceholder, { backgroundColor: theme.toggleActive }]}>
//         <Text style={[styles.carouselText, { color: theme.buttonText }]}>Placeholder for carousel of service display</Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   history: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   toggleContainer: {
//     flexDirection: 'row',
//     backgroundColor: '#E0E0E0', // Adjusted in theme
//     borderRadius: 50,
//     overflow: 'hidden',
//     marginBottom: 16,
//   },
//   toggleButton: {
//     flex: 1,
//     paddingVertical: 12,
//     alignItems: 'center',
//   },
//   toggleText: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   providerLabel: {
//     fontSize: 16,
//     fontWeight: '500',
//     marginBottom: 8,
//   },
//   providerRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   networkPicker: {
//     flex: 1,
//     borderWidth: 1,
//     borderRadius: 8,
//     marginRight: 8,
//   },
//   phoneInput: {
//     flex: 2,
//     borderWidth: 1,
//     borderRadius: 8,
//     padding: 12,
//     marginRight: 8,
//     fontSize: 16,
//   },
//   contactIcon: {
//     padding: 8,
//   },
//   dataPlansLabel: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 8,
//   },
//   tabScroll: {
//     marginBottom: 16,
//   },
//   tab: {
//     paddingHorizontal: 16,
//     paddingBottom: 8,
//     borderBottomWidth: 2,
//     borderBottomColor: 'transparent',
//   },
//   tabText: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   planGrid: {
//     marginBottom: 16,
//   },
//   planRow: {
//     justifyContent: 'space-between',
//   },
//   planCard: {
//     flex: 1,
//     margin: 8,
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   planSize: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   planPrice: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 4,
//   },
//   planValidity: {
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   planCashback: {
//     fontSize: 12,
//     fontWeight: '500',
//     marginTop: 4,
//   },
//   carouselPlaceholder: {
//     borderRadius: 12,
//     padding: 16,
//     alignItems: 'center',
//   },
//   carouselText: {
//     fontSize: 14,
//     fontWeight: '500',
//   },
// });
