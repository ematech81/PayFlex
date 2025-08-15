import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function PromoCarousel({ data }) {
  const navigation = useNavigation();

  return (
    <View style={styles.carouselContainer}>
      <Carousel
        loop
        width={width}
        height={180}
        autoPlay
        autoPlayInterval={3000}
        data={data}
        scrollAnimationDuration={1000}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.slide}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Image
              source={item.image}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.textOverlay}>
              <Text style={styles.title}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    marginVertical: 10,
  },
  slide: {
    width: width - 40,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 12,
  },
});
