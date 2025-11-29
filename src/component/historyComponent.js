
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

const HistoryComponent = ({onPress}) => {

const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
    
  return (
    <TouchableOpacity
                       style={styles.historyBtn}
                       onPress={onPress}
                       accessibilityLabel="View transaction history"
                       accessibilityRole="button"
                     >
                       <Text style={[styles.historyText, {color: themeColors.primary}]}>History</Text>
                     </TouchableOpacity>
  )
}

export default HistoryComponent

const styles = StyleSheet.create({

    historyBtn: {
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
      },
      
      historyText: {
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '700',
        fontSize: 13,
      },
})