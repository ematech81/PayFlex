import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Image } from 'react-native';

const AppImage = ({ style }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../asset/mainAppIconNoBG.png')}
        style={style}
        resizeMode="cover"
      />
    </View>
  );
};

export default AppImage;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
