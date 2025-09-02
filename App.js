import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { Keyboard, Dimensions, StyleSheet, Platform } from 'react-native';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

// Screens
import HomeScreen from './src/screen/HomeScreen';
import OrdersScreen from './src/screen/OrdersScreen';
import WalletsScreen from './src/screen/WalletsScreen';
import ProfileScreen from './src/screen/ProfileScreen';
import LoginScreen from './src/screen/LoginScreen';
import SignUpScreen from './src/screen/SignUpScreen';
import VerifyCodeScreen from './src/screen/VerifyCodeScreen';
import DataPurchaseScreen from './src/screen/DataPurchaseScreen';
import TVSubscriptionScreen from './src/screen/TVSubscriptionScreen';
import ElectricityPurchaseScreen from './src/screen/ElectricityPurchaseScreen';
import AirtimeScreen from './src/screen/AirtimeScreen';
import CustomerTabScreen from './src/screen/CustomerTabScreen';
import CustomerRegistrationScreen from './src/screen/CustomerRegistrationScreen';
import InvoiceTabScreen from './src/screen/InvoiceTabScreen';
import InvoiceCreationScreen from './src/screen/InvoiceCreationScreen';

import { WalletProvider } from './src/context/WalletContext';
import InvoiceDetailsScreen from 'screen/InvoiceDetailScreen';

// Navigators
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const TopTab = createMaterialTopTabNavigator();

// Invoice Top Tabs (Invoice and Customer)
function InvoiceTabs() {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  return (
    <TopTab.Navigator
      initialRouteName="InvoiceList"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? '#444' : '#e0e0e0',
        },
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.subheading,
        tabBarIndicatorStyle: {
          backgroundColor: themeColors.primary,
        },
      }}
    >
      <TopTab.Screen
        name="InvoiceList"
        component={InvoiceTabScreen}
        options={{ title: 'Invoices' }}
      />
      <TopTab.Screen name="Customers" component={CustomerTabScreen} />
    </TopTab.Navigator>
  );
}

// Bottom Tabs Component
function BottomTabs() {
  const { height } = Dimensions.get('window');
  const tabBarHeight = height > 800 ? 70 : 60;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Invoices') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.light.primary,
        tabBarInactiveTintColor: colors.light.subheading,
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: 5,
          paddingTop: 5,
          backgroundColor: colors.light.card,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          display:
            keyboardVisible && Platform.OS === 'android' ? 'none' : 'flex',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Wallet" component={WalletsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Invoices" component={InvoiceTabs} />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const isDarkMode = useThem();

  // if (isLoading) {
  //   return (
  //     <PaperProvider theme={isDarkMode ? DarkTheme : DefaultTheme}>
  //       <ActivityIndicator
  //         size="large"
  //         style={styles.loading}
  //         color={colors.light.primary}
  //       />
  //     </PaperProvider>
  //   );
  // }

  return (
    <WalletProvider>
      <PaperProvider theme={isDarkMode ? DarkTheme : DefaultTheme}>
        <NavigationContainer
          onReady={() => setIsLoading(false)}
          theme={isDarkMode ? DarkTheme : DefaultTheme}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SiguUp" component={SignUpScreen} />
            <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
            <Stack.Screen name="MainTabs" component={BottomTabs} />
            <Stack.Screen name="Data" component={DataPurchaseScreen} />
            <Stack.Screen name="Airtime" component={AirtimeScreen} />
            <Stack.Screen
              name="TVSubscription"
              component={TVSubscriptionScreen}
            />
            <Stack.Screen
              name="ElectricityPurchase"
              component={ElectricityPurchaseScreen}
            />
            <Stack.Screen
              name="CustomerRegistration"
              component={CustomerRegistrationScreen}
            />
            <Stack.Screen
              name="InvoiceCreation"
              component={InvoiceCreationScreen}
            />
            <Stack.Screen
              name="InvoiceDetails"
              component={InvoiceDetailsScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </WalletProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
