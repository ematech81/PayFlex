import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

const ActionModal = ({ isVisible, onClose, actions, isDarkMode }) => {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View
        style={[styles.menu, isDarkMode ? styles.darkMenu : styles.lightMenu]}
      >
        {actions.map((action, index) => (
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
                isDarkMode ? styles.darkText : styles.lightText,
                action.style || {},
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
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
  lightMenu: {
    backgroundColor: '#fff',
  },
  darkMenu: {
    backgroundColor: '#2c3e50',
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  lightText: {
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
});

export default ActionModal;
