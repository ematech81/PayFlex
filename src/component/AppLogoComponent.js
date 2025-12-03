import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import { customImages } from 'constants/serviceImages'
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

const AppLogoComponent = () => {

    const isDarkMode = useThem();
      const themeColors = isDarkMode ? colors.dark : colors.light;
    
  return (
    <View style={[styles.firstContainerCircle ,{backgroundColor: '#5403f5ff'}]}>
               <View style={[styles.secondContainerCircle ,{backgroundColor: themeColors.card}]}>
                   <Image
                       source={customImages.AppLogo}
                       resizeMode='contain'
                       style={{width: 50, height: 50, borderRadius: 10}}
                   />
               </View>
            </View>
  )
}

export default AppLogoComponent

const styles = StyleSheet.create({
    firstContainerCircle:{
        borderRadius: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        width: 110,
        height: 110,
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
      width: 80, 
      height: 80,
      overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    },
})