import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from './src/screen/HomeScreen';
import OrdersScreen from './src/screen/OrdersScreen';
import WalletsScreen from './src/screen/WalletsScreen';
import ProfileScreen from './src/screen/ProfileScreen';
import LoginScreen from './src/screen/LoginScreen';
import SignUpScreen from 'screen/SignUpScreen';
import VerifyCodeScreen from 'screen/VerfyCodeScreen';

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
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* stack screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="VerfyCode" component={VerifyCodeScreen} />

        {/* Tabs after login */}
        <Stack.Screen name="MainTabs" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// import 'react-native-gesture-handler';
// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Ionicons } from '@expo/vector-icons';
// import HomeScreen from './src/screen/HomeScreen';
// import OrdersScreen from './src/screen/OrdersScreen';
// import WalletsScreen from './src/screen/WalletsScreen';
// import ProfileScreen from './src/screen/ProfileScreen';

// const Tab = createBottomTabNavigator();

// export default function App() {
//   return (
//     <NavigationContainer>
//       <Tab.Navigator
//         screenOptions={({ route }) => ({
//           tabBarIcon: ({ focused, color, size }) => {
//             let iconName;

//             if (route.name === 'Home') {
//               iconName = focused ? 'home' : 'home-outline';
//             } else if (route.name === 'Orders') {
//               iconName = focused ? 'receipt' : 'receipt-outline';
//             } else if (route.name === 'Wallet') {
//               iconName = focused ? 'wallet' : 'wallet-outline';
//             } else if (route.name === 'Profile') {
//               iconName = focused ? 'person' : 'person-outline';
//             }

//             // Return the component
//             return <Ionicons name={iconName} size={size} color={color} />;
//           },
//           tabBarActiveTintColor: '#4A00E0',
//           tabBarInactiveTintColor: '#9AA0B4',
//           tabBarStyle: {
//             height: 60,
//             paddingBottom: 5,
//             paddingTop: 5,
//             backgroundColor: '#FFFFFF',
//             borderTopWidth: 1,
//             borderTopColor: '#E0E0E0',
//           },
//           headerShown: false, // Hide the header for all screens
//         })}
//       >
//         <Tab.Screen name="Home" component={HomeScreen} />
//         <Tab.Screen name="Orders" component={OrdersScreen} />
//         <Tab.Screen name="Wallet" component={WalletsScreen} />
//         <Tab.Screen name="Profile" component={ProfileScreen} />
//       </Tab.Navigator>
//     </NavigationContainer>
//   );
// }
