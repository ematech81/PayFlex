import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiIPAddress } from 'utility/apiIPAdress';
import { useWallet } from 'context/WalletContext';
import { STORAGE_KEYS } from 'utility/storageKeys';

export default function AddWalletFund() {
    const {  refreshWallet, } = useWallet();
    const [loading, setLoading] = useState(false);
  
    const addTestFunds = async (amount) => {
      try {
        setLoading(true);
        
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        
        const response = await fetch(`${ApiIPAddress}/add-test-funds`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
        });
  
        const data = await response.json();
  
        if (data.success) {
          Alert.alert('Success', `₦${amount} added to wallet!`);
          
          // Refresh wallet data
          await  refreshWallet();
        } else {
          Alert.alert('Error', data.message);
        }
      } catch (error) {
        console.error('Error adding test funds:', error);
        Alert.alert('Error', 'Failed to add funds');
      } finally {
        setLoading(false);
      }
    };
  
    // Only show in development
    if (!__DEV__) return null;
  
    return (
      <View style={{ padding: 20, backgroundColor: '#fff3cd', borderRadius: 8, margin: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          🛠️ Developer Tools
        </Text>
        <Text style={{ fontSize: 12, color: '#856404', marginBottom: 10 }}>
          Add test funds to wallet (Dev only)
        </Text>
        
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={{ 
              backgroundColor: '#28a745', 
              padding: 12, 
              borderRadius: 8,
              flex: 1,
            }}
            onPress={() => addTestFunds(1000)}
            disabled={loading}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
              {loading ? '...' : '+ ₦1,000'}
            </Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            style={{ 
              backgroundColor: '#007bff', 
              padding: 12, 
              borderRadius: 8,
              flex: 1,
            }}
            onPress={() => addTestFunds(5000)}
            disabled={loading}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
              {loading ? '...' : '+ ₦5,000'}
            </Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            style={{ 
              backgroundColor: '#17a2b8', 
              padding: 12, 
              borderRadius: 8,
              flex: 1,
            }}
            onPress={() => addTestFunds(10000)}
            disabled={loading}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
              {loading ? '...' : '+ ₦10,000'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
}



// const BASE_URL = ApiIPAddress;

