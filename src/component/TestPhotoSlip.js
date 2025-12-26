// components/TestPhotoDisplay.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * Test Component to Display API Photo Response
 * This will show us what type of image the API returns
 */
export default function TestPhotoDisplay({ photoData, themeColors }) {
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState(null);

  // Handle image load to get dimensions
  const handleImageLoad = (event) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions({ width, height });
  };

  // Check if photo data is already in base64 format or needs prefix
  const getImageSource = () => {
    if (!photoData) return null;

    // Check if it already has data:image prefix
    if (photoData.startsWith('data:image/')) {
      return { uri: photoData };
    }

    // Add prefix if it's raw base64
    return { uri: `data:image/jpeg;base64,${photoData}` };
  };

  const imageSource = getImageSource();

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.card, { backgroundColor: themeColors.card }]}>
        <Text style={[styles.title, { color: themeColors.heading }]}>
          📸 Photo Analysis
        </Text>

        {/* Photo Display */}
        {!imageError && imageSource ? (
          <View style={styles.imageContainer}>
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="contain"
              onLoad={handleImageLoad}
              onError={() => {
                console.error('❌ Image failed to load');
                setImageError(true);
              }}
            />
          </View>
        ) : (
          <View style={[styles.errorContainer, { backgroundColor: `${themeColors.destructive}20` }]}>
            <Ionicons name="alert-circle" size={40} color={themeColors.destructive} />
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              Failed to load image
            </Text>
          </View>
        )}

        {/* Image Info */}
        {imageDimensions && (
          <View style={[styles.infoCard, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.infoTitle, { color: themeColors.heading }]}>
              Image Details:
            </Text>
            <Text style={[styles.infoText, { color: themeColors.subheading }]}>
              Width: {imageDimensions.width}px
            </Text>
            <Text style={[styles.infoText, { color: themeColors.subheading }]}>
              Height: {imageDimensions.height}px
            </Text>
            <Text style={[styles.infoText, { color: themeColors.subheading }]}>
              Aspect Ratio: {(imageDimensions.width / imageDimensions.height).toFixed(2)}
            </Text>
          </View>
        )}

        {/* Analysis */}
        <View style={[styles.analysisCard, { backgroundColor: `${themeColors.primary}15` }]}>
          <Text style={[styles.analysisTitle, { color: themeColors.heading }]}>
            🔍 What This Shows:
          </Text>

          {imageDimensions && (
            <>
              {/* Passport Photo Detection */}
              {imageDimensions.width < 500 && imageDimensions.height < 500 && (
                <View style={styles.analysisItem}>
                  <Ionicons name="person-circle" size={24} color="#4CAF50" />
                  <Text style={[styles.analysisText, { color: themeColors.subheading }]}>
                    ✅ This appears to be a PASSPORT PHOTO (person's face)
                  </Text>
                </View>
              )}

              {/* Slip/Document Detection */}
              {(imageDimensions.width > 800 || imageDimensions.height > 1000) && (
                <View style={styles.analysisItem}>
                  <Ionicons name="document-text" size={24} color="#2196F3" />
                  <Text style={[styles.analysisText, { color: themeColors.subheading }]}>
                    ✅ This appears to be a FULL SLIP/DOCUMENT
                  </Text>
                </View>
              )}

              {/* Square Image */}
              {Math.abs(imageDimensions.width - imageDimensions.height) < 50 && (
                <View style={styles.analysisItem}>
                  <Ionicons name="crop" size={24} color="#FF9800" />
                  <Text style={[styles.analysisText, { color: themeColors.subheading }]}>
                    Square image - likely passport photo
                  </Text>
                </View>
              )}

              {/* Portrait */}
              {imageDimensions.height > imageDimensions.width && (
                <View style={styles.analysisItem}>
                  <Ionicons name="phone-portrait" size={24} color="#9C27B0" />
                  <Text style={[styles.analysisText, { color: themeColors.subheading }]}>
                    Portrait orientation - likely document/slip
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Raw Data Preview */}
        <TouchableOpacity
          style={[styles.rawDataButton, { backgroundColor: themeColors.background }]}
          onPress={() => console.log('Photo Data:', photoData?.substring(0, 100) + '...')}
        >
          <Ionicons name="code-outline" size={20} color={themeColors.primary} />
          <Text style={[styles.rawDataText, { color: themeColors.primary }]}>
            View Raw Base64 (Console)
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },

  // Image Display
  imageContainer: {
    width: '100%',
    minHeight: 300,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: width - 72,
    height: 400,
    borderRadius: 8,
  },

  // Error
  errorContainer: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },

  // Info Card
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },

  // Analysis Card
  analysisCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  analysisText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  // Raw Data Button
  rawDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  rawDataText: {
    fontSize: 14,
    fontWeight: '600',
  },
});