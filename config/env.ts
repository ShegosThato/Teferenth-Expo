/**
 * Environment Configuration
 * 
 * Centralized configuration management for the app.
 * This replaces hardcoded values throughout the codebase.
 * 
 * Phase 1 Task 2: Environment Variables Implementation
 */

// TODO: Install expo-constants for better environment variable handling
// npm install expo-constants

import Constants from 'expo-constants';

// Development/fallback values
const DEV_CONFIG = {
  AI_API_BASE_URL: 'https://api.a0.dev',
  AI_LLM_ENDPOINT: '/ai/llm',
  IMAGE_GENERATION_ENDPOINT: '/assets/image',
  MAX_FILE_SIZE_MB: 1,
  MAX_CONTENT_LENGTH: 50000,
  AI_TIMEOUT: 30000,
  IMAGE_TIMEOUT: 45000,
  DEBUG_MODE: __DEV__,
};

// Get environment variables with fallbacks
function getEnvVar(key: string, fallback: any) {
  // Try to get from Expo constants (app.json extra field)
  const expoValue = Constants.expoConfig?.extra?.[key];
  if (expoValue !== undefined) {
    return expoValue;
  }
  
  // Try to get from process.env (for web/development)
  if (typeof process !== 'undefined' && process.env) {
    const envValue = process.env[key];
    if (envValue !== undefined) {
      return envValue;
    }
  }
  
  // Return fallback
  return fallback;
}

export const ENV = {
  // API Configuration
  AI_API_BASE_URL: getEnvVar('AI_API_BASE_URL', DEV_CONFIG.AI_API_BASE_URL),
  AI_LLM_ENDPOINT: getEnvVar('AI_LLM_ENDPOINT', DEV_CONFIG.AI_LLM_ENDPOINT),
  IMAGE_GENERATION_ENDPOINT: getEnvVar('IMAGE_GENERATION_ENDPOINT', DEV_CONFIG.IMAGE_GENERATION_ENDPOINT),
  
  // API Keys (handled by secureStorage.ts)
  // These will be empty and populated at runtime from secure storage
  AI_API_KEY: '',
  IMAGE_API_KEY: '',
  
  // File Limits
  MAX_FILE_SIZE_MB: parseInt(getEnvVar('MAX_FILE_SIZE_MB', DEV_CONFIG.MAX_FILE_SIZE_MB)),
  MAX_CONTENT_LENGTH: parseInt(getEnvVar('MAX_CONTENT_LENGTH', DEV_CONFIG.MAX_CONTENT_LENGTH)),
  
  // Timeouts
  AI_TIMEOUT: parseInt(getEnvVar('AI_TIMEOUT', DEV_CONFIG.AI_TIMEOUT)),
  IMAGE_TIMEOUT: parseInt(getEnvVar('IMAGE_TIMEOUT', DEV_CONFIG.IMAGE_TIMEOUT)),
  
  // Feature Flags
  ENABLE_OFFLINE_MODE: getEnvVar('ENABLE_OFFLINE_MODE', 'false') === 'true',
  ENABLE_ANALYTICS: getEnvVar('ENABLE_ANALYTICS', 'false') === 'true',
  ENABLE_CRASH_REPORTING: getEnvVar('ENABLE_CRASH_REPORTING', 'false') === 'true',
  
  // Development
  DEBUG_MODE: getEnvVar('DEBUG_MODE', DEV_CONFIG.DEBUG_MODE),
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
  MOCK_API_RESPONSES: getEnvVar('MOCK_API_RESPONSES', 'false') === 'true',
};

// Computed values
export const API_URLS = {
  AI_LLM: `${ENV.AI_API_BASE_URL}${ENV.AI_LLM_ENDPOINT}`,
  IMAGE_GENERATION: `${ENV.AI_API_BASE_URL}${ENV.IMAGE_GENERATION_ENDPOINT}`,
};

export const FILE_LIMITS = {
  MAX_FILE_SIZE: ENV.MAX_FILE_SIZE_MB * 1024 * 1024, // Convert MB to bytes
  MAX_CONTENT_LENGTH: ENV.MAX_CONTENT_LENGTH,
};

// Validation
export function validateConfig() {
  const errors: string[] = [];
  
  if (!ENV.AI_API_BASE_URL) {
    errors.push('AI_API_BASE_URL is required');
  }
  
  if (ENV.MAX_FILE_SIZE_MB <= 0) {
    errors.push('MAX_FILE_SIZE_MB must be greater than 0');
  }
  
  if (ENV.MAX_CONTENT_LENGTH <= 0) {
    errors.push('MAX_CONTENT_LENGTH must be greater than 0');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:', errors);
    if (!__DEV__) {
      throw new Error(`Configuration errors: ${errors.join(', ')}`);
    }
  } else {
    console.log('✅ Configuration validated successfully');
  }
  
  return errors.length === 0;
}

// Debug logging
if (ENV.DEBUG_MODE) {
  console.log('🔧 Environment Configuration:', {
    AI_API_BASE_URL: ENV.AI_API_BASE_URL,
    MAX_FILE_SIZE_MB: ENV.MAX_FILE_SIZE_MB,
    MAX_CONTENT_LENGTH: ENV.MAX_CONTENT_LENGTH,
    FEATURE_FLAGS: {
      OFFLINE_MODE: ENV.ENABLE_OFFLINE_MODE,
      ANALYTICS: ENV.ENABLE_ANALYTICS,
      CRASH_REPORTING: ENV.ENABLE_CRASH_REPORTING,
    }
  });
}