import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomerDetailsComponent from 'component/CustomerDetailsComponent';

const CustomerRegistrationScreen = () => {
  const navigation = useNavigation();

  const handleSubmit = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Customer</Text>
      <CustomerDetailsComponent onSubmit={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    padding: 16,
    textAlign: 'center',
  },
});

export default CustomerRegistrationScreen;
