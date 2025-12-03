import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { customImages } from 'constants/serviceImages';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from 'utility/storageKeys';

const OnboardingScreen = ({navigation}) => {

 const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;


  // In OnboardingScreen.js



const handleGetStarted = async () => {
  try {
    // ✅ Mark onboarding as seen
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, 'true');
    console.log('✅ Onboarding marked as seen');
    
    // Navigate to Login
    navigation.navigate('Login');
  } catch (error) {
    console.error('❌ Error saving onboarding status:', error);
    // Still navigate even if save fails
    navigation.navigate('Login');
  }
};


  return (
    <View style={[styles.container, {backgroundColor: themeColors.primary}]}>
<StatusBar barStyle='light-content' translucent backgroundColor={themeColors.primary}/>
      <View style={[styles.firstContainerWrapper]}>
         <View style={[styles.firstContainerCircle ,{backgroundColor: '#5403f5ff'}]}>
            <View style={[styles.secondContainerCircle ,{backgroundColor: themeColors.card}]}>
                <Image
                    source={customImages.AppLogo}
                    resizeMode='contain'
                    style={{width: 60, height: 60, borderRadius: 10}}
                />
            </View>
         </View>
         <View style={[styles.secondContainerContent]}>
             <Text style={[styles.appTitle, {color: themeColors.card}]}>PAYFLEX</Text>
         </View>
      </View>

      <View style={[styles.secondContainerWrapper]}>
        <Text style={[styles.wellcomeText, {color: themeColors.card}]}>Welcome!</Text>
        <Text style={[styles.normalText, {color:themeColors.background}]}>Pay bills, buy airtime, and manage your wallet—all in one place.</Text>
        <TouchableOpacity style={[styles.getStartedButton, {backgroundColor:themeColors.card}]}
        onPress={handleGetStarted}
        >
            <Text style={[styles.getStartedText, {color: themeColors.primary}]}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default OnboardingScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-evenly',
        flexDirection: 'column',

    },
    firstContainerWrapper:{
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'column',
        padding: 10,
        // backgroundColor: 'red',
        width: '100%',
        marginTop: 60,
        
    },
    firstContainerCircle:{
        borderRadius: '100%',
        alignItems: 'center',
        justifyContent: 'center',
width: 150,
height: 150,
overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    },
    secondContainerCircle: {
        borderRadius: '100%',
        alignItems: 'center',
        justifyContent: 'center',
width: 100,
height: 100,
overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    },
    secondContainerContent: {
        marginTop: 20,
    },
    appTitle: {
        fontSize: 30,
        fontWeight: 'bold',
    },
    secondContainerWrapper: {
        alignItems: 'flex-start',
       
        paddingHorizontal: 25,
        // backgroundColor: 'red',
        width: '100%',
        height: 250,

    },
    wellcomeText: {
        fontSize: 25,
        fontWeight: '700',
        marginVertical: 12,

    },
    normalText: {
        fontSize: 16,
        fontWeight: 500,
    },
    getStartedButton: {
        width: '100%',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16 ,
        marginTop: 40, 
        height: 50,
    },
    getStartedText: {
      fontSize: 16,
      fontWeight: 'bold',
    }
})