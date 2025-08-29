import {
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const BackBtn = ({ onPress, style }) => {
  return (
    <TouchableOpacity onPress={onPress} style={style}>
      <Ionicons name="arrow-back" size={24} />
    </TouchableOpacity>
  );
};

export default BackBtn;

const styles = StyleSheet.create({});
