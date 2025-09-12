import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import { Keyboard, Dimensions, StyleSheet, Platform } from 'react-native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { WalletProvider } from 'context/WalletContext';

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
import InvoiceProcessingScreen from './src/screen/InvoiceProcessingScreen';
import InvoiceDetailsScreen from 'screen/InvoiceDetailScreen';

// 👇 Keep splash screen visible until resources load
// SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();

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
          marginTop: 30,
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

function BottomTabs() {
  const { height } = Dimensions.get('window');
  const tabBarHeight = height > 800 ? 70 : 60;
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

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
          height: tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
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

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const isDarkMode = useThem();

  useEffect(() => {
    async function prepare() {
      try {
        // Preload fonts
        // await Font.loadAsync({
        //   SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'), // Uncomment and adjust path if you have a font
        // });

        // Ensure native modules are initialized (e.g., expo-print, react-native-pdf)
        // Add a small delay to allow native modules to register
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Increased from 1000ms to 2000ms
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null; // Splash screen remains visible
  }

  return (
    <WalletProvider>
      <PaperProvider theme={isDarkMode ? DarkTheme : DefaultTheme}>
        <SafeAreaProvider>
          <NavigationContainer
            theme={isDarkMode ? DarkTheme : DefaultTheme}
            initialRouteName="Login"
          >
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
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
              <Stack.Screen
                name="InvoiceProcessing"
                component={InvoiceProcessingScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
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
