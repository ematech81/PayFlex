import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  StyleSheet,
} from 'react-native';
import BackBtn from 'utility/BackBtn';

const { width } = Dimensions.get('window');

const TVSubscriptionScreen = ({ navigation }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const backgroundColor = isDark ? '#121212' : '#f6f6f8';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const primaryColor = '#512DA8'; // Deep purple for primary colors
  const cardColor = '#ffffff'; // Light purple for cards

  const [selectedProvider, setSelectedProvider] = useState('DStv');
  const [smartCardNumber, setSmartCardNumber] = useState('');

  const providers = ['DStv', 'GOtv', 'StarTimes', 'ShowMax'];

  // Mock data aligned with VTpass API response structure (variation_code, name, variation_amount)
  const mockPlans = {
    DStv: [
      {
        variation_code: 'dstv-padi',
        name: 'DStv Padi',
        variation_amount: '2150',
      },
      {
        variation_code: 'dstv-yanga',
        name: 'DStv Yanga',
        variation_amount: '2950',
      },
      {
        variation_code: 'dstv-confam',
        name: 'DStv Confam',
        variation_amount: '5300',
      },
      {
        variation_code: 'dstv-compact',
        name: 'DStv Compact',
        variation_amount: '9000',
      },
      {
        variation_code: 'dstv-compact-plus',
        name: 'DStv Compact Plus',
        variation_amount: '14250',
      },
      {
        variation_code: 'dstv-premium',
        name: 'DStv Premium',
        variation_amount: '21500',
      },
    ],
    GOtv: [
      {
        variation_code: 'gotv-smallie',
        name: 'GOtv Smallie',
        variation_amount: '1300',
      },
      {
        variation_code: 'gotv-jinja',
        name: 'GOtv Jinja',
        variation_amount: '2700',
      },
      {
        variation_code: 'gotv-jolli',
        name: 'GOtv Jolli',
        variation_amount: '3950',
      },
      {
        variation_code: 'gotv-max',
        name: 'GOtv Max',
        variation_amount: '5700',
      },
      {
        variation_code: 'gotv-supamax',
        name: 'GOtv SupaMax',
        variation_amount: '8600',
      },
    ],
    StarTimes: [
      {
        variation_code: 'startimes-nova',
        name: 'StarTimes Nova',
        variation_amount: '1200',
      },
      {
        variation_code: 'startimes-basic',
        name: 'StarTimes Basic',
        variation_amount: '2000',
      },
      {
        variation_code: 'startimes-smart',
        name: 'StarTimes Smart',
        variation_amount: '2800',
      },
      {
        variation_code: 'startimes-classic',
        name: 'StarTimes Classic',
        variation_amount: '3000',
      },
      {
        variation_code: 'startimes-super',
        name: 'StarTimes Super',
        variation_amount: '5000',
      },
    ],
    ShowMax: [
      {
        variation_code: 'showmax-mobile',
        name: 'ShowMax Mobile',
        variation_amount: '2900',
      },
      {
        variation_code: 'showmax-entertainment',
        name: 'ShowMax Entertainment',
        variation_amount: '3700',
      },
      {
        variation_code: 'showmax-premier-league',
        name: 'ShowMax Premier League',
        variation_amount: '5000',
      },
      {
        variation_code: 'showmax-pro',
        name: 'ShowMax Pro',
        variation_amount: '6300',
      },
    ],
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor,
        padding: 16,
      }}
    >
      <BackBtn style={{ marginTop: 10 }} onPress={() => navigation.goBack()} />
      <Text
        style={{
          color: textColor,
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 20,
          marginTop: 30,
        }}
      >
        TV Subscription
      </Text>

      {/* Horizontal list for providers */}
      <FlatList
        data={providers}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedProvider(item)}
            style={[
              styles.providerContainer,
              {
                backgroundColor:
                  selectedProvider === item ? primaryColor : cardColor,
              },
            ]}
          >
            <Text
              style={{
                color: selectedProvider === item ? '#FFFFFF' : primaryColor,
                fontWeight: 'bold',
                fontSize: 16,
              }}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        style={{ marginBottom: 20 }}
      />

      {/* Text input for smart card number */}
      <TextInput
        placeholder="Enter Smart Card Number"
        placeholderTextColor={isDark ? '#AAAAAA' : '#777777'}
        value={smartCardNumber}
        onChangeText={setSmartCardNumber}
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

      {/* Plans list for selected provider */}
      <Text
        style={{
          color: textColor,
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 10,
        }}
      >
        Plans for {selectedProvider}
      </Text>
      <FlatList
        data={mockPlans[selectedProvider] || []}
        keyExtractor={(item) => item.variation_code}
        renderItem={({ item }) => (
          <View
            style={{
              width: width - 40, // Responsive width based on screen dimensions
              padding: 15,
              marginBottom: 10,
              backgroundColor: cardColor,
              borderRadius: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: textColor, fontSize: 16, flex: 1 }}>
              {item.name}
            </Text>
            <Text
              style={{ color: primaryColor, fontSize: 16, fontWeight: 'bold' }}
            >
              ₦{item.variation_amount}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

export default TVSubscriptionScreen;

// const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  providerContainer: {
    paddingHorizontal: 2,

    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'space-around',
    margin: 5,
    width: width * 0.3,
    height: width * 0.12,
  },
});
