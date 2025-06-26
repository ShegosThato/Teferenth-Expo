/**
 * Secure Storage Utilities
 * 
 * Provides secure storage functionality for sensitive data like API keys
 * using expo-secure-store.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for storage keys
export const SECURE_STORAGE_KEYS = {
  API_KEY: 'api_key',
  USER_TOKEN: 'user_token',
  REFRESH_TOKEN: 'refresh_token',
};

/**
 * Securely saves a value to storage
 * Falls back to AsyncStorage on web platforms
 */
export async function saveSecurely(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Web doesn't support SecureStore, use AsyncStorage with key prefix
      await AsyncStorage.setItem(`secure_${key}`, value);
    } else {
      // Use SecureStore on native platforms
      await SecureStore.setItemAsync(key, value, {
        // Options for iOS keychain
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    }
  } catch (error) {
    console.error('Error saving to secure storage:', error);
    throw new Error(`Failed to save ${key} securely`);
  }
}

/**
 * Securely retrieves a value from storage
 * Falls back to AsyncStorage on web platforms
 */
export async function getSecurely(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // Web doesn't support SecureStore, use AsyncStorage with key prefix
      return await AsyncStorage.getItem(`secure_${key}`);
    } else {
      // Use SecureStore on native platforms
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error('Error retrieving from secure storage:', error);
    return null;
  }
}

/**
 * Securely deletes a value from storage
 */
export async function deleteSecurely(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(`secure_${key}`);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error('Error deleting from secure storage:', error);
  }
}

/**
 * Checks if a secure value exists
 */
export async function hasSecureValue(key: string): Promise<boolean> {
  const value = await getSecurely(key);
  return value !== null;
}

/**
 * Helper to securely store API keys
 */
export async function storeApiKey(apiKey: string): Promise<void> {
  await saveSecurely(SECURE_STORAGE_KEYS.API_KEY, apiKey);
}

/**
 * Helper to retrieve API key
 */
export async function getApiKey(): Promise<string | null> {
  return getSecurely(SECURE_STORAGE_KEYS.API_KEY);
}

/**
 * Helper to securely store user authentication tokens
 */
export async function storeUserTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    saveSecurely(SECURE_STORAGE_KEYS.USER_TOKEN, accessToken),
    saveSecurely(SECURE_STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

/**
 * Helper to retrieve user authentication tokens
 */
export async function getUserTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const [accessToken, refreshToken] = await Promise.all([
    getSecurely(SECURE_STORAGE_KEYS.USER_TOKEN),
    getSecurely(SECURE_STORAGE_KEYS.REFRESH_TOKEN),
  ]);
  
  return { accessToken, refreshToken };
}

/**
 * Helper to clear all secure storage
 */
export async function clearSecureStorage(): Promise<void> {
  const keys = Object.values(SECURE_STORAGE_KEYS);
  
  if (Platform.OS === 'web') {
    await Promise.all(keys.map(key => AsyncStorage.removeItem(`secure_${key}`)));
  } else {
    await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
  }
}