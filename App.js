import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';

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
import { WalletProvider } from './src/context/WalletContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Bottom Tabs Component
function BottomTabs() {
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
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A00E0',
        tabBarInactiveTintColor: '#9AA0B4',
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Wallet" component={WalletsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        color="#4A00E0"
      />
    );
  }

  return (
    <WalletProvider>
      <PaperProvider>
        <NavigationContainer onReady={() => setIsLoading(false)}>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
          >
            {/* Auth Screens */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
            {/* Main Tabs after login */}
            <Stack.Screen name="MainTabs" component={BottomTabs} />
            {/* Other Screens */}
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
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </WalletProvider>
  );
}
