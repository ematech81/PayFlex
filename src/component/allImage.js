import { StyleSheet, View, Image, Dimensions,ImageBackground } from 'react-native';
import React from 'react';

const { width } = Dimensions.get('window');

const logoSize = width < 400 ? 250 : 500; // Smaller logo for smaller screens

const AppImage = ({ style, containerStyle, children }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <ImageBackground
        source={require('../asset/appIcon.jpg')}
        style={[styles.image, { width: logoSize, height: logoSize }, style]}
        resizeMode="cover"
      />
      {children}
    </View>
  );
};

export default AppImage;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Ensures the container spans the parent width
    backgroundColor: '#4a00e0', // Ensures no background colo
    // maxHeight: 200,
  },
  image: {
    // Default size is handled via the size prop
    // Add a subtle shadow for visual enhancement (optional)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
});
