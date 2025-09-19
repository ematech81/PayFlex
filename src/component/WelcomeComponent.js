import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import AppImage from 'component/allImage';

const WelcomeComponent = () => {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  return (
    <View
      style={[styles.contentHeader, { backgroundColor: themeColors.primary }]}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AppImage />
      </View>
    </View>
  );
};

export default WelcomeComponent;

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  contentHeader: {
    padding: 20,
    width: '100%',
    height: '35%',
    alignItems: 'center',
    justifyCntent: 'center',
  },
});
