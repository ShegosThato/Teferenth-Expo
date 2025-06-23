import React from 'react';
import { Alert } from 'react-native';

/**
 * Extremely lightweight toast shim.
 * Re-implements the subset of the sonner-native API used in the app
 * so we don’t need an external dependency.
 */
export const toast = {
  success: (message: string) => Alert.alert('Success', message),
  error: (message: string) => Alert.alert('Error', message),
  message: (message: string) => Alert.alert('', message),
};

// Placeholder Toaster component – kept for interface parity.
export const Toaster: React.FC = () => null;