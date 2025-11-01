import { View, Text, StatusBar } from 'react-native'
import React from 'react'
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

export const StatusBarComponent = () => {

    const isDarkMode = useThem();
      const themeColors = isDarkMode ? colors.dark : colors.light;

  return (
    <>
    <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor="transparent"
            translucent
          />
    </>
  )
}

