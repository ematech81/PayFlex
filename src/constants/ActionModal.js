import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { colors } from 'constants/colors';

const ActionModal = ({ isVisible, onClose, actions, isDarkMode }) => {
  const themeColors = isDarkMode ? colors.dark : colors.light;

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={[styles.menu, { backgroundColor: themeColors.card }]}>
        {Array.isArray(actions) && actions.length > 0 ? (
          actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                action.onPress();
                onClose();
              }}
            >
              <Text
                style={[
                  styles.menuText,
                  { color: themeColors.heading },
                  action.style || {},
                ]}
              >
                {action.label}
              </Text>
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

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  menu: {
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 16,
  },
});

export default ActionModal;
