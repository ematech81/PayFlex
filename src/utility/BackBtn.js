import { TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

const BackBtn = ({ onPress, style }) => {
  const isDarkMode = useThem();
  const color = isDarkMode ? colors.dark.heading : colors.light.heading;

  return (
    <TouchableOpacity onPress={onPress} style={style}>
      <Ionicons name="arrow-back" size={24} color={color} />
    </TouchableOpacity>
  );
};

export default BackBtn;

const styles = StyleSheet.create({});
