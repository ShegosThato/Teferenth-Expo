/**
 * Environment Configuration Types
 * 
 * Strict type definitions for environment variables and configuration,
 * replacing any types with proper interfaces.
 */

// Environment variable types
export interface EnvironmentConfig {
  // API Configuration
  AI_API_BASE_URL: string;
  AI_LLM_ENDPOINT: string;
  IMAGE_GENERATION_ENDPOINT: string;
  
  // API Keys (runtime populated)
  AI_API_KEY: string;
  IMAGE_API_KEY: string;
  
  // File Limits
  MAX_FILE_SIZE_MB: number;
  MAX_CONTENT_LENGTH: number;
  
  // Timeouts
  AI_TIMEOUT: number;
  IMAGE_TIMEOUT: number;
  
  // Feature Flags
  ENABLE_OFFLINE_MODE: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_CRASH_REPORTING: boolean;
  
  // Development
  DEBUG_MODE: boolean;
  LOG_LEVEL: LogLevel;
  MOCK_API_RESPONSES: boolean;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Development configuration
export interface DevelopmentConfig {
  AI_API_BASE_URL: string;
  AI_LLM_ENDPOINT: string;
  IMAGE_GENERATION_ENDPOINT: string;
  MAX_FILE_SIZE_MB: number;
  MAX_CONTENT_LENGTH: number;
  AI_TIMEOUT: number;
  IMAGE_TIMEOUT: number;
  DEBUG_MODE: boolean;
}

// Environment variable value types
export type EnvVarValue = string | number | boolean;

// Environment variable getter function type
export type EnvVarGetter = <T extends EnvVarValue>(
  key: string,
  fallback: T
) => T;

// Configuration validation types
export interface ConfigValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigValidationError[];
}

// API URL configuration
export interface APIURLConfig {
  AI_LLM: string;
  IMAGE_GENERATION: string;
}

// File limits configuration
export interface FileLimitsConfig {
  MAX_FILE_SIZE: number; // in bytes
  MAX_CONTENT_LENGTH: number;
}

// Feature flags configuration
export interface FeatureFlags {
  OFFLINE_MODE: boolean;
  ANALYTICS: boolean;
  CRASH_REPORTING: boolean;
  MOCK_API_RESPONSES: boolean;
}

// Runtime configuration (after processing)
export interface RuntimeConfig {
  env: EnvironmentConfig;
  apiUrls: APIURLConfig;
  fileLimits: FileLimitsConfig;
  featureFlags: FeatureFlags;
  isProduction: boolean;
  isDevelopment: boolean;
  platform: 'ios' | 'android' | 'web';
}

// Expo constants types (replacing any)
export interface ExpoConfig {
  extra?: Record<string, EnvVarValue>;
  version?: string;
  name?: string;
  slug?: string;
}

export interface ExpoConstants {
  expoConfig?: ExpoConfig;
  platform?: {
    ios?: Record<string, unknown>;
    android?: Record<string, unknown>;
    web?: Record<string, unknown>;
  };
  deviceName?: string;
  isDevice?: boolean;
}

// Process environment types (for web/development)
export interface ProcessEnv {
  NODE_ENV?: 'development' | 'production' | 'test';
  [key: string]: string | undefined;
}

// Configuration provider types
export interface ConfigProviderProps {
  children: React.ReactNode;
  config?: Partial<EnvironmentConfig>;
  onConfigLoaded?: (config: RuntimeConfig) => void;
  onConfigError?: (error: Error) => void;
}

export interface ConfigContextValue {
  config: RuntimeConfig;
  isLoaded: boolean;
  error?: Error;
  reload: () => Promise<void>;
}

// Configuration validation functions
export type ConfigValidator = (config: EnvironmentConfig) => ConfigValidationResult;

// Configuration transformer types
export type ConfigTransformer<T = unknown> = (
  value: EnvVarValue,
  key: string
) => T;

// Built-in transformers
export interface ConfigTransformers {
  string: ConfigTransformer<string>;
  number: ConfigTransformer<number>;
  boolean: ConfigTransformer<boolean>;
  url: ConfigTransformer<string>;
  json: ConfigTransformer<Record<string, unknown>>;
}

// Configuration schema types
export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'url' | 'json';
    required?: boolean;
    default?: EnvVarValue;
    validator?: (value: EnvVarValue) => boolean;
    transformer?: ConfigTransformer;
    description?: string;
  };
}

// Type guards for environment values
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isValidURL(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isValidLogLevel(value: unknown): value is LogLevel {
  return isString(value) && ['debug', 'info', 'warn', 'error'].includes(value);
}

// Configuration utilities
export interface ConfigUtils {
  validateConfig: ConfigValidator;
  transformValue: <T>(value: EnvVarValue, transformer: ConfigTransformer<T>) => T;
  getEnvVar: EnvVarGetter;
  isProduction: () => boolean;
  isDevelopment: () => boolean;
  getPlatform: () => 'ios' | 'android' | 'web';
}

// Error types for configuration
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends ConfigurationError {
  constructor(field: string, message: string, value?: unknown) {
    super(`Validation failed for ${field}: ${message}`, field, value);
    this.name = 'ValidationError';
  }
}