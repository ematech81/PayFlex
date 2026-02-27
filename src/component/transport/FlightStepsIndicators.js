// components/transport/FlightStepIndicator.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,

} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FlightStepIndicator({ currentStep, themeColors }) {
  const steps = [
    { id: 1, label: 'Search', icon: 'search' },
    { id: 2, label: 'Select', icon: 'airplane' },
    { id: 3, label: 'Details', icon: 'person' },
    { id: 4, label: 'Seats', icon: 'grid' },
    { id: 5, label: 'Payment', icon: 'card' },
  ];

  return (
    <View style={styles.stepContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor:
                    step.id <= currentStep
                      ? themeColors.primary
                      : themeColors.border,
                },
              ]}
            >
              {step.id < currentStep ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Ionicons 
                  name={step.icon} 
                  size={14} 
                  color={step.id === currentStep ? '#FFFFFF' : themeColors.subtext} 
                />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                {
                  color:
                    step.id <= currentStep
                      ? themeColors.heading
                      : themeColors.subtext,
                  fontWeight: step.id === currentStep ? '700' : '500',
                },
              ]}
            >
              {step.label}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View
              style={[
                styles.stepConnector,
                {
                  backgroundColor:
                    step.id < currentStep
                      ? themeColors.primary
                      : themeColors.border,
                },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};


const styles = StyleSheet.create({

  // Step Indicator
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepConnector: {
    height: 2,
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 26,
  },
})