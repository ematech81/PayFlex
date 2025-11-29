import { StyleSheet, View, Image, Dimensions,ImageBackground } from 'react-native';
import React from 'react';
import { customImages } from 'constants/serviceImages';

const { width } = Dimensions.get('window');

const logoSize = width < 400 ? 250 : 500; // Smaller logo for smaller screens

const AppImage = ({ style, containerStyle, children }) => {
  return (
     <View style={styles.statusIconContainer}>
                <Image 
                  source={customImages.AppLogo} 
                  style={{ width: 40, height: 40, resizeMode: 'cover', borderRadius: 100 }}
                />
              </View>
  );
};

export default AppImage;

const styles = StyleSheet.create({
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: 'rgba(84, 3, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
});
