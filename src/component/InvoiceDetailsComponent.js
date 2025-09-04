import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

const InvoiceDetailsComponent = ({
  title,
  setTitle,
  dueDate,
  setDueDate,
  currency,
  setCurrency,
}) => {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  // Set default due date to today (September 04, 2025, 01:52 PM WAT)
  const today = new Date('2025-09-04T13:52:00Z'); // 01:52 PM WAT
  useEffect(() => {
    if (!dueDate) setDueDate(today);
  }, [dueDate]);

  return (
    <View style={[styles.section, { backgroundColor: themeColors.card }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
        Invoice Details
      </Text>
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Invoice Title
      </Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: themeColors.border, color: themeColors.border },
        ]}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter invoice title"
        placeholderTextColor={themeColors.subtext}
      />
      <Text style={[styles.label, { color: themeColors.heading }]}>
        Due Date
      </Text>
      <TouchableOpacity
        style={[styles.input, { borderColor: themeColors.border }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.customerText, { color: themeColors.heading }]}>
          {dueDate ? dueDate.toLocaleDateString() : 'Select due date'}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={dueDate || today}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      <Text style={[styles.label, { color: themeColors.border }]}>
        Currency
      </Text>
      <View
        style={[styles.pickerContainer, { borderColor: themeColors.border }]}
      >
        <Picker
          selectedValue={currency}
          onValueChange={(itemValue) => setCurrency(itemValue)}
          style={{ color: themeColors.border }}
        >
          <Picker.Item label="NGN (₦)" value="NGN" />
          <Picker.Item label="USD ($)" value="USD" />
          <Picker.Item label="EUR (€)" value="EUR" />
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  customerText: {
    fontSize: 16,
  },
});

export default InvoiceDetailsComponent;
