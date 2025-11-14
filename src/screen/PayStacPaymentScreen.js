import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'YOUR_BACKEND_URL/api';

export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [token, setToken] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userToken = await AsyncStorage.getItem('userToken');
    setToken(userToken);
    await fetchBalance(userToken);
    await fetchTransactions(userToken);
  };

  // Fetch wallet balance
  const fetchBalance = async (userToken) => {
    try {
      const response = await axios.get(`${API_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setBalance(response.data.data.balance);
    } catch (error) {
      Alert.alert('Error', 'Failed to load balance');
    }
  };

  // Fetch transaction history
  const fetchTransactions = async (userToken) => {
    try {
      const response = await axios.get(`${API_URL}/wallet/transactions`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Failed to load transactions');
    }
  };

  // Fund wallet function
  const fundWallet = async () => {
    if (!amount || parseFloat(amount) < 100) {
      Alert.alert('Error', 'Minimum amount is ₦100');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Initialize payment
      const response = await axios.post(
        `${API_URL}/wallet/fund`,
        { amount: parseFloat(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { authorization_url, reference } = response.data.data;

      // Step 2: Open Paystack payment page in browser
      const result = await WebBrowser.openBrowserAsync(authorization_url);

      // Step 3: After browser closes, verify payment
      if (result.type === 'cancel' || result.type === 'dismiss') {
        // User closed the browser, now check if payment was successful
        setTimeout(async () => {
          await verifyPayment(reference);
        }, 1000); // Wait 1 second then verify
      }

    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // Verify payment
  const verifyPayment = async (reference) => {
    try {
      const response = await axios.get(
        `${API_URL}/wallet/verify/${reference}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Alert.alert(
          'Success!',
          `₦${response.data.data.amount} has been added to your wallet`,
          [{ text: 'OK', onPress: () => loadData() }]
        );
        setAmount(''); // Clear input
      } else {
        Alert.alert('Failed', 'Payment was not successful');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not verify payment');
    }
  };

  return (
    <View style={styles.container}>
      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>₦{balance.toLocaleString()}</Text>
      </View>

      {/* Fund Wallet Section */}
      <View style={styles.fundSection}>
        <Text style={styles.sectionTitle}>Fund Wallet</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        
        {/* Quick amount buttons */}
        <View style={styles.quickAmounts}>
          {[1000, 2000, 5000, 10000].map((amt) => (
            <TouchableOpacity
              key={amt}
              style={styles.quickButton}
              onPress={() => setAmount(amt.toString())}
            >
              <Text>₦{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.fundButton, loading && styles.disabledButton]}
          onPress={fundWallet}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.fundButtonText}>Fund Wallet</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Transaction History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <View>
                <Text style={styles.transactionDesc}>
                  {item.description}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  item.type === 'credit' ? styles.credit : styles.debit
                ]}
              >
                {item.type === 'credit' ? '+' : '-'}₦{item.amount}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  balanceCard: {
    backgroundColor: '#4CAF50',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 16
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 10
  },
  fundSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  quickButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  fundButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  fundButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  historySection: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500'
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  credit: {
    color: '#4CAF50'
  },
  debit: {
    color: '#f44336'
  }
});