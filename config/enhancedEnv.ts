/**
 * Enhanced Environment Configuration
 * 
 * Type-safe environment configuration that replaces any types with strict interfaces.
 * Provides validation, transformation, and runtime configuration management.
 */

import Constants from 'expo-constants';
import {
  EnvironmentConfig,
  DevelopmentConfig,
  RuntimeConfig,
  ConfigValidationResult,
  ConfigValidationError,
  LogLevel,
  EnvVarValue,
  ConfigSchema,
  ConfigTransformers,
  ExpoConstants,
  ProcessEnv,
  isString,
  isNumber,
  isBoolean,
  isValidURL,
  isValidLogLevel,
  ConfigurationError,
  ValidationError,
} from '../types/environment';

// Development/fallback configuration with strict typing
const DEV_CONFIG: DevelopmentConfig = {
  AI_API_BASE_URL: 'https://api.a0.dev',
  AI_LLM_ENDPOINT: '/ai/llm',
  IMAGE_GENERATION_ENDPOINT: '/assets/image',
  MAX_FILE_SIZE_MB: 1,
  MAX_CONTENT_LENGTH: 50000,
  AI_TIMEOUT: 30000,
  IMAGE_TIMEOUT: 45000,
  DEBUG_MODE: __DEV__,
};

// Configuration schema with validation rules
const CONFIG_SCHEMA: ConfigSchema = {
  AI_API_BASE_URL: {
    type: 'url',
    required: true,
    description: 'Base URL for AI API services',
  },
  AI_LLM_ENDPOINT: {
    type: 'string',
    required: true,
    description: 'Endpoint path for LLM services',
  },
  IMAGE_GENERATION_ENDPOINT: {
    type: 'string',
    required: true,
    description: 'Endpoint path for image generation',
  },
  MAX_FILE_SIZE_MB: {
    type: 'number',
    required: true,
    validator: (value) => isNumber(value) && value > 0 && value <= 100,
    description: 'Maximum file size in megabytes (1-100)',
  },
  MAX_CONTENT_LENGTH: {
    type: 'number',
    required: true,
    validator: (value) => isNumber(value) && value > 0,
    description: 'Maximum content length in characters',
  },
  AI_TIMEOUT: {
    type: 'number',
    required: true,
    validator: (value) => isNumber(value) && value > 0,
    description: 'AI request timeout in milliseconds',
  },
  IMAGE_TIMEOUT: {
    type: 'number',
    required: true,
    validator: (value) => isNumber(value) && value > 0,
    description: 'Image generation timeout in milliseconds',
  },
  DEBUG_MODE: {
    type: 'boolean',
    default: __DEV__,
    description: 'Enable debug mode',
  },
  LOG_LEVEL: {
    type: 'string',
    default: 'info',
    validator: isValidLogLevel,
    description: 'Logging level (debug, info, warn, error)',
  },
  ENABLE_OFFLINE_MODE: {
    type: 'boolean',
    default: false,
    description: 'Enable offline mode functionality',
  },
  ENABLE_ANALYTICS: {
    type: 'boolean',
    default: false,
    description: 'Enable analytics tracking',
  },
  ENABLE_CRASH_REPORTING: {
    type: 'boolean',
    default: false,
    description: 'Enable crash reporting',
  },
  MOCK_API_RESPONSES: {
    type: 'boolean',
    default: false,
    description: 'Use mock API responses for development',
  },
};

// Type-safe transformers
const transformers: ConfigTransformers = {
  string: (value: EnvVarValue): string => {
    if (isString(value)) return value;
    return String(value);
  },

  number: (value: EnvVarValue): number => {
    if (isNumber(value)) return value;
    const parsed = Number(value);
    if (isNaN(parsed)) {
      throw new ValidationError('number', `Cannot convert "${value}" to number`);
    }
    return parsed;
  },

  boolean: (value: EnvVarValue): boolean => {
    if (isBoolean(value)) return value;
    if (isString(value)) {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }
    throw new ValidationError('boolean', `Cannot convert "${value}" to boolean`);
  },

  url: (value: EnvVarValue): string => {
    const stringValue = transformers.string(value);
    if (!isValidURL(stringValue)) {
      throw new ValidationError('url', `"${stringValue}" is not a valid URL`);
    }
    return stringValue;
  },

  json: (value: EnvVarValue): Record<string, unknown> => {
    const stringValue = transformers.string(value);
    try {
      const parsed = JSON.parse(stringValue);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Not an object');
      }
      return parsed as Record<string, unknown>;
    } catch {
      throw new ValidationError('json', `Cannot parse "${stringValue}" as JSON object`);
    }
  },
};

// Enhanced environment variable getter with strict typing
function getEnvVar<T extends EnvVarValue>(key: string, fallback: T): T {
  // Try to get from Expo constants (app.json extra field)
  const expoConstants = Constants as ExpoConstants;
  const expoValue = expoConstants.expoConfig?.extra?.[key];
  if (expoValue !== undefined) {
    return expoValue as T;
  }

  // Try to get from process.env (for web/development)
  if (typeof process !== 'undefined' && process.env) {
    const processEnv = process.env as ProcessEnv;
    const envValue = processEnv[key];
    if (envValue !== undefined) {
      // Try to convert to the same type as fallback
      if (typeof fallback === 'boolean') {
        return transformers.boolean(envValue) as T;
      }
      if (typeof fallback === 'number') {
        return transformers.number(envValue) as T;
      }
      return envValue as T;
    }
  }

  // Return fallback
  return fallback;
}

// Configuration validator
function validateConfig(config: EnvironmentConfig): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  // Validate each field according to schema
  for (const [key, schema] of Object.entries(CONFIG_SCHEMA)) {
    const value = config[key as keyof EnvironmentConfig];

    // Check required fields
    if (schema.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: key,
        message: `${key} is required`,
        value,
      });
      continue;
    }

    // Skip validation if value is undefined and not required
    if (value === undefined && !schema.required) {
      continue;
    }

    // Type validation
    try {
      const transformer = transformers[schema.type];
      const transformedValue = transformer(value);

      // Custom validation
      if (schema.validator && !schema.validator(transformedValue)) {
        errors.push({
          field: key,
          message: `${key} failed validation: ${schema.description || 'Invalid value'}`,
          value,
        });
      }
    } catch (error) {
      errors.push({
        field: key,
        message: error instanceof Error ? error.message : 'Validation failed',
        value,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Build runtime configuration
function buildRuntimeConfig(): RuntimeConfig {
  // Get environment variables with proper typing
  const env: EnvironmentConfig = {
    // API Configuration
    AI_API_BASE_URL: getEnvVar('AI_API_BASE_URL', DEV_CONFIG.AI_API_BASE_URL),
    AI_LLM_ENDPOINT: getEnvVar('AI_LLM_ENDPOINT', DEV_CONFIG.AI_LLM_ENDPOINT),
    IMAGE_GENERATION_ENDPOINT: getEnvVar('IMAGE_GENERATION_ENDPOINT', DEV_CONFIG.IMAGE_GENERATION_ENDPOINT),

    // API Keys (runtime populated from secure storage)
    AI_API_KEY: '',
    IMAGE_API_KEY: '',

    // File Limits
    MAX_FILE_SIZE_MB: getEnvVar('MAX_FILE_SIZE_MB', DEV_CONFIG.MAX_FILE_SIZE_MB),
    MAX_CONTENT_LENGTH: getEnvVar('MAX_CONTENT_LENGTH', DEV_CONFIG.MAX_CONTENT_LENGTH),

    // Timeouts
    AI_TIMEOUT: getEnvVar('AI_TIMEOUT', DEV_CONFIG.AI_TIMEOUT),
    IMAGE_TIMEOUT: getEnvVar('IMAGE_TIMEOUT', DEV_CONFIG.IMAGE_TIMEOUT),

    // Feature Flags
    ENABLE_OFFLINE_MODE: getEnvVar('ENABLE_OFFLINE_MODE', false),
    ENABLE_ANALYTICS: getEnvVar('ENABLE_ANALYTICS', false),
    ENABLE_CRASH_REPORTING: getEnvVar('ENABLE_CRASH_REPORTING', false),

    // Development
    DEBUG_MODE: getEnvVar('DEBUG_MODE', DEV_CONFIG.DEBUG_MODE),
    LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info' as LogLevel),
    MOCK_API_RESPONSES: getEnvVar('MOCK_API_RESPONSES', false),
  };

  // Validate configuration
  const validation = validateConfig(env);
  if (!validation.isValid) {
    const errorMessages = validation.errors.map(e => `${e.field}: ${e.message}`);
    console.error('❌ Configuration validation failed:', errorMessages);
    
    if (!__DEV__) {
      throw new ConfigurationError(`Configuration errors: ${errorMessages.join(', ')}`);
    }
  }

  // Build computed values
  const apiUrls = {
    AI_LLM: `${env.AI_API_BASE_URL}${env.AI_LLM_ENDPOINT}`,
    IMAGE_GENERATION: `${env.AI_API_BASE_URL}${env.IMAGE_GENERATION_ENDPOINT}`,
  };

  const fileLimits = {
    MAX_FILE_SIZE: env.MAX_FILE_SIZE_MB * 1024 * 1024, // Convert MB to bytes
    MAX_CONTENT_LENGTH: env.MAX_CONTENT_LENGTH,
  };

  const featureFlags = {
    OFFLINE_MODE: env.ENABLE_OFFLINE_MODE,
    ANALYTICS: env.ENABLE_ANALYTICS,
    CRASH_REPORTING: env.ENABLE_CRASH_REPORTING,
    MOCK_API_RESPONSES: env.MOCK_API_RESPONSES,
  };

  // Determine platform
  const platform = (() => {
    if (typeof window !== 'undefined') return 'web';
    // This would be enhanced with proper platform detection
    return 'ios'; // Default fallback
  })() as 'ios' | 'android' | 'web';

  const runtimeConfig: RuntimeConfig = {
    env,
    apiUrls,
    fileLimits,
    featureFlags,
    isProduction: !__DEV__,
    isDevelopment: __DEV__,
    platform,
  };

  return runtimeConfig;
}

// Initialize and export configuration
export const CONFIG = buildRuntimeConfig();

// Export individual parts for convenience
export const ENV = CONFIG.env;
export const API_URLS = CONFIG.apiUrls;
export const FILE_LIMITS = CONFIG.fileLimits;
export const FEATURE_FLAGS = CONFIG.featureFlags;

// Configuration utilities
export const configUtils = {
  validateConfig,
  getEnvVar,
  isProduction: () => CONFIG.isProduction,
  isDevelopment: () => CONFIG.isDevelopment,
  getPlatform: () => CONFIG.platform,
  
  // Update API keys at runtime (from secure storage)
  updateApiKeys: (apiKey: string, imageApiKey: string) => {
    CONFIG.env.AI_API_KEY = apiKey;
    CONFIG.env.IMAGE_API_KEY = imageApiKey;
  },

  // Get configuration summary for debugging
  getConfigSummary: () => ({
    platform: CONFIG.platform,
    environment: CONFIG.isDevelopment ? 'development' : 'production',
    apiBaseUrl: CONFIG.env.AI_API_BASE_URL,
    featureFlags: CONFIG.featureFlags,
    fileLimits: CONFIG.fileLimits,
  }),
};

// Debug logging in development
if (CONFIG.env.DEBUG_MODE) {
  console.log('🔧 Enhanced Environment Configuration:', configUtils.getConfigSummary());
  
  if (CONFIG.featureFlags.MOCK_API_RESPONSES) {
    console.warn('⚠️ Mock API responses are enabled');
  }
}

// Validate configuration on module load
const validation = validateConfig(CONFIG.env);
if (validation.isValid) {
  console.log('✅ Configuration validated successfully');
} else {
  console.error('❌ Configuration validation failed:', validation.errors);
}