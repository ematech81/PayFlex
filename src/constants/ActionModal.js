import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import { colors } from 'constants/colors';

const { width } = Dimensions.get('window');

const ActionModal = ({ isVisible, onClose, actions, isDarkMode, style }) => {
  const themeColors = isDarkMode ? colors.dark : colors.light;

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={[styles.modal, style]} // Allow custom style for smaller PIN modal
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
    >
      <View style={[styles.menu, { backgroundColor: themeColors.card }]}>
        {Array.isArray(actions) && actions.length > 0 ? (
          actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={action.onPress} // Don't auto-close; let action.onPress decide
            >
              {typeof action.label === 'string' ? (
                <Text
                  style={[
                    styles.menuText,
                    { color: themeColors.heading },
                    action.style || {},
                  ]}
                >
                  {action.label}
                </Text>
              ) : (
                action.label // Support JSX labels (e.g., for AirtimeScreen modals)
              )}
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: themeColors.subheading }]}>
            No actions available
          </Text>
        )}
      </View>
    </Modal>
  );
};

const { height } = Dimensions.get('window');
const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    // alignItems: 'flex-end',
    margin: 0,
    width: '100%', // Ensure full width
  },
  menu: {
    width: '100%', // Full width of the screen
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    // alignSelf: 'stretch', // Ensure it stretches horizontally
    minHight: 500,
  },
  menuItem: {
    paddingVertical: 12,
    // alignItems: 'center', // Center content for better UX
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 16,
  },
});

export default ActionModal;
