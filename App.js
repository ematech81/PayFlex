import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  useNavigation,
} from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { STORAGE_KEYS } from 'utility/authService';
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
import { useWallet, WalletProvider } from 'context/WalletContext';

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
import TransactionDetailsScreen from 'screen/TransactionDetailsScreen';
import SetTransactionPinScreen from 'screen/SetTransactionPinScreen';
import ResetPinScreen from 'screen/ResetPinScreen';
import SetLoginPINScreen from 'screen/SetLoginPinScreen';
import { STORAGE_KEYS } from 'utility/storageKeys';
import ShareReceiptScreen from 'screen/ShareReceiptScreen';
import OnboardingScreen from 'screen/OnboardingScreen';
import EducationPurchaseScreen from 'screen/EducationPurchaseScreen';
import AllServicesScreen from 'screen/AllServicesScreen';
import AirtimeToCashScreen from 'screen/Airtime-CashScreen';
import BettingScreen from 'screen/BettingScreen';
import EditProfileScreen from 'screen/UserProfile/EditProfileScreen';
import VerifyNINScreen from 'screen/UserProfile/VerifyNINScreen';
import FundWalletBalance from 'screen/UserProfile/FundWalletBalance';
import ExpensesScreen from 'screen/UserProfile/ExpensesScreen';
import ReferralScreen from 'screen/UserProfile/ReferralScreen';
import Analytics from 'screen/UserProfile/Analytics';
import Settings from 'screen/UserProfile/Settings';
import NotificationSettings from 'screen/UserProfile/NotificationSettings';
import HelpSupport from 'screen/UserProfile/HelpSupport';
import About from 'screen/UserProfile/About';
import { AuthProvider } from 'context/AuthContext';
import PaymentSettings from 'screen/Settings/PaymentSettings';
import LoginSettingsScreen from 'screen/Settings/LoginSettingsScreen';
import ChangeLoginScreen from 'screen/Settings/ChangeLoginScreen';
// import MyProfile from 'screen/UserProfile/MyProfile';

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

  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState(null);
  const [appIsReady, setAppIsReady] = useState(false);
  const isDarkMode = useThem(); // your custom hook
  // const { refreshWallet } = useWallet();

 
  const navigationRef = useRef(); 
  const [routeName, setRouteName] = useState(null); // ← Track target route


  
  // ✅ Check auth ONCE on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);


  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const requirePinStr = await AsyncStorage.getItem(STORAGE_KEYS.REQUIRE_PIN);
      const hasSeenOnboarding = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING); // ✅ New
  
      console.log('🔍 Auth Check:', {
        hasToken: !!token,
        hasUser: !!userStr,
        hasSeenOnboarding: hasSeenOnboarding === 'true',
      });
  
      // ✅ CASE 1: First-time user (never seen onboarding)
      if (!hasSeenOnboarding) {
        console.log('👋 First time user → Show Onboarding');
        setInitialRoute('Onboarding');
        return;
      }
  
      // ✅ CASE 2: User is logged in
      if (token && userStr) {
        const requirePin = requirePinStr !== 'false';
        
        console.log('📊 RequirePin Status:', {
          raw: requirePinStr,
          parsed: requirePin,
        });
  
        if (requirePin) {
          console.log('🔐 RequirePin ON → Starting at Login');
          setInitialRoute('Login');
        } else {
          console.log('🏠 RequirePin OFF → Starting at MainTabs');
          setInitialRoute('MainTabs');
        }
      } 
      // ✅ CASE 3: Returning user but not logged in
      else {
        console.log('🔓 Has seen onboarding but not logged in → Starting at Login');
        setInitialRoute('Login');
      }
  
    } catch (error) {
      console.error('❌ Error checking auth:', error);
      setInitialRoute('Onboarding'); // ✅ Safe fallback
    } finally {
      setIsLoading(false);
    }
  };


  //  useEffect(() => {
  //     const clearAllStorage = async () => {
  //       try {
  //         await AsyncStorage.clear();
  //         console.log('🧹 All AsyncStorage cleared');
  //       } catch (error) {
  //         console.error('❌ Error clearing storage:', error);
  //       }
  //     };
    
  //     clearAllStorage();
  //   }, []); // Empty dependency array = runs once on mount

  
  // === 2. Prepare app (fonts, splash, etc.) ===
  useEffect(() => {
    async function prepare() {
      try {
        // Preload fonts, native modules, etc.
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);




  // Show splash screen until app is ready
  if (!appIsReady) {
    return null;
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <WalletProvider>
    <AuthProvider>
      <PaperProvider theme={isDarkMode ? DarkTheme : DefaultTheme}>
        <SafeAreaProvider>
          <NavigationContainer
            theme={isDarkMode ? DarkTheme : DefaultTheme}
            ref={navigationRef}
          >
            <Stack.Navigator
             screenOptions={{ headerShown: false }}
             initialRouteName={initialRoute} 
            >
               <Stack.Screen name="Onboarding" component={OnboardingScreen} />
     

               {/* =====authentication screens======= */}
               <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
              <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
              <Stack.Screen name="LoginPinScreen" component={SetLoginPINScreen} /> 
              <Stack.Screen
                name="SetTransactionPin"
                component={SetTransactionPinScreen}
              />
              <Stack.Screen name="ResetPin" component={ResetPinScreen} />

               {/* =====home and service screens======= */}

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
                name="EducationPurchase"
                component={EducationPurchaseScreen}
              />
              <Stack.Screen
                name="AllServices"
                component={AllServicesScreen}
              />
              <Stack.Screen
                name="Airtime-Cash"
                component={AirtimeToCashScreen}
              />
              <Stack.Screen
                name="Betting"
                component={BettingScreen}
              />


{/* =====user profile and related screens======= */}

              <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
              />
              <Stack.Screen
                name="VerifyNIN"
                component={VerifyNINScreen}
              />
              <Stack.Screen
                name="FundWallet"
                component={FundWalletBalance}
              />
              <Stack.Screen
                name="Expenses"
                component={ExpensesScreen}
              />

              <Stack.Screen
                name="Referral"
                component={ReferralScreen}
              />

              {/* <Stack.Screen
                name="MyProfile"
                component={MyProfile}
              /> */}
              <Stack.Screen
                name="Analytics"
                component={Analytics}
              />
              <Stack.Screen
                name="Settings"
                component={Settings}
              />
              <Stack.Screen
                name="Notification"
                component={NotificationSettings}
              />
              <Stack.Screen
                name="HelpSupport"
                component={HelpSupport}
              />
              <Stack.Screen
                name="About"
                component={About}
              />


{/* =====settings and related screens======= */}
               
              <Stack.Screen
                name="LoginSettings"
                component={LoginSettingsScreen}
              />
              <Stack.Screen
                name="PaymentSettings"
                component={PaymentSettings}
              />
             
              <Stack.Screen
                name="ChangeLogin"
                component={ChangeLoginScreen}
              />

{/* =====invoice and related screens======= */}
              
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

{/* =====other screens======= */}
               <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
              <Stack.Screen name="ShareReceipt" component={ShareReceiptScreen} />
              <Stack.Screen
                name="TranactionDetails"
                component={TransactionDetailsScreen}
              />
             
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider>
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
