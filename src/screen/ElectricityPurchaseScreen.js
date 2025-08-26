import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  useColorScheme,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const ElectricityPurchaseScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const backgroundColor = isDark ? '#121212' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const primaryColor = '#512DA8'; // Deep purple for primary colors
  const cardColor = '#D1C4E9'; // Light purple for cards

  const [selectedCompany, setSelectedCompany] = useState('Ikeja Electric');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Prepaid');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');

  // Mock data for electric companies, aligned with VTpass API (serviceID, name)
  const mockCompanies = [
    { serviceID: 'ikeja-electric', name: 'Ikeja Electric' },
    { serviceID: 'eko-electric', name: 'Eko Electric' },
    { serviceID: 'abuja-electric', name: 'Abuja Electric' },
    { serviceID: 'kano-electric', name: 'Kano Electric' },
    { serviceID: 'portharcourt-electric', name: 'Port Harcourt Electric' },
    { serviceID: 'jos-electric', name: 'Jos Electric' },
  ];

  const predefinedAmounts = [1000, 2000, 3000, 5000, 10000, 20000];

  const isPayEnabled = meterNumber.length > 0 && amount.length > 0; // Placeholder for verification logic

  return (
    <View
      style={{
        flex: 1,
        backgroundColor,
        paddingHorizontal: 20,
        paddingVertical: 20,
      }}
    >
      <Text
        style={{
          color: textColor,
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 20,
        }}
      >
        Electricity Purchase
      </Text>

      {/* Company selection card */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 15,
          backgroundColor: cardColor,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: primaryColor, fontSize: 16, fontWeight: 'bold' }}>
          {selectedCompany}
        </Text>
        <Text style={{ color: primaryColor, fontSize: 20 }}>▼</Text>{' '}
        {/* Arrow icon placeholder */}
      </TouchableOpacity>

      {/* Modal for company selection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <View
            style={{
              width: width * 0.8,
              backgroundColor,
              borderRadius: 10,
              padding: 20,
            }}
          >
            <Text
              style={{
                color: textColor,
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 10,
              }}
            >
              Select Electricity Company
            </Text>
            <FlatList
              data={mockCompanies}
              keyExtractor={(item) => item.serviceID}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCompany(item.name);
                    setModalVisible(false);
                  }}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#CCCCCC',
                  }}
                >
                  <Text style={{ color: textColor, fontSize: 16 }}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 20, alignSelf: 'center' }}
            >
              <Text style={{ color: primaryColor, fontWeight: 'bold' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tabs for Prepaid/Postpaid */}
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => setSelectedTab('Prepaid')}
          style={{
            flex: 1,
            paddingVertical: 10,
            backgroundColor:
              selectedTab === 'Prepaid' ? primaryColor : cardColor,
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: selectedTab === 'Prepaid' ? '#FFFFFF' : primaryColor,
              fontWeight: 'bold',
            }}
          >
            Prepaid
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedTab('Postpaid')}
          style={{
            flex: 1,
            paddingVertical: 10,
            backgroundColor:
              selectedTab === 'Postpaid' ? primaryColor : cardColor,
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: selectedTab === 'Postpaid' ? '#FFFFFF' : primaryColor,
              fontWeight: 'bold',
            }}
          >
            Postpaid
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meter number input */}
      <TextInput
        placeholder="Enter meter number"
        placeholderTextColor={isDark ? '#AAAAAA' : '#777777'}
        value={meterNumber}
        onChangeText={setMeterNumber}
        style={{
          borderWidth: 1,
          borderColor: primaryColor,
          borderRadius: 10,
          paddingHorizontal: 15,
          paddingVertical: 12,
          marginBottom: 20,
          color: textColor,
          backgroundColor: isDark ? '#333333' : '#FFFFFF',
        }}
      />

      {/* Conditional content based on tab */}
      {selectedTab === 'Prepaid' && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          {predefinedAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              onPress={() => setAmount(amt.toString())}
              style={{
                width: (width - 60) / 3, // Responsive width for 3 columns
                height: (width - 60) / 3, // Square cards
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: cardColor,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: primaryColor, fontWeight: 'bold' }}>
                ₦{amt.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Amount input and Pay button */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          placeholder="Enter amount"
          placeholderTextColor={isDark ? '#AAAAAA' : '#777777'}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: primaryColor,
            borderRadius: 10,
            paddingHorizontal: 15,
            paddingVertical: 12,
            marginRight: 10,
            color: textColor,
            backgroundColor: isDark ? '#333333' : '#FFFFFF',
          }}
        />
        <TouchableOpacity
          disabled={!isPayEnabled}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: isPayEnabled ? primaryColor : '#CCCCCC',
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ElectricityPurchaseScreen;
