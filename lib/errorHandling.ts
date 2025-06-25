/**
 * Enhanced Error Handling System
 * 
 * Provides comprehensive error handling utilities including:
 * - Network error detection and retry mechanisms
 * - User-friendly error messages
 * - Offline state detection
 * - Error categorization and reporting
 * 
 * Phase 2 Task 1: Enhanced Error Handling & User Feedback
 */

import { toast } from './toast';
import NetInfo from '@react-native-community/netinfo';

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  API = 'api',
  VALIDATION = 'validation',
  STORAGE = 'storage',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Enhanced error interface
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: number;
  retryable: boolean;
}

// Network state management
class NetworkManager {
  private isConnected = true;
  private listeners: Array<(connected: boolean) => void> = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Check initial connection state
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected ?? false;

    // Listen for connection changes
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected ?? false;
      
      if (wasConnected !== this.isConnected) {
        this.notifyListeners();
        
        if (this.isConnected) {
          toast.success('Connection restored');
        } else {
          toast.error('Connection lost - working offline');
        }
      }
    });
  }

  public isOnline(): boolean {
    return this.isConnected;
  }

  public onConnectionChange(callback: (connected: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isConnected));
  }
}

export const networkManager = new NetworkManager();

// Error classification utility
export function classifyError(error: any): AppError {
  const timestamp = Date.now();
  
  // Network errors
  if (error.name === 'AbortError' || error.message?.includes('aborted')) {
    return {
      type: ErrorType.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      message: 'Request timed out',
      userMessage: 'The request took too long to complete. Please try again.',
      originalError: error,
      timestamp,
      retryable: true
    };
  }

  if (error.message?.includes('fetch') || error.message?.includes('network') || !networkManager.isOnline()) {
    return {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.HIGH,
      message: 'Network connection failed',
      userMessage: 'Unable to connect to the server. Please check your internet connection.',
      originalError: error,
      timestamp,
      retryable: true
    };
  }

  // API errors
  if (error.status >= 400 && error.status < 500) {
    return {
      type: ErrorType.API,
      severity: ErrorSeverity.MEDIUM,
      message: `API error: ${error.status}`,
      userMessage: error.status === 429 
        ? 'Too many requests. Please wait a moment and try again.'
        : 'There was a problem with your request. Please try again.',
      originalError: error,
      timestamp,
      retryable: error.status === 429 || error.status >= 500
    };
  }

  if (error.status >= 500) {
    return {
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      message: `Server error: ${error.status}`,
      userMessage: 'The server is experiencing issues. Please try again later.',
      originalError: error,
      timestamp,
      retryable: true
    };
  }

  // Storage errors
  if (error.message?.includes('storage') || error.message?.includes('AsyncStorage')) {
    return {
      type: ErrorType.STORAGE,
      severity: ErrorSeverity.MEDIUM,
      message: 'Storage operation failed',
      userMessage: 'Unable to save data. Please check your device storage.',
      originalError: error,
      timestamp,
      retryable: true
    };
  }

  // Validation errors
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      message: 'Validation failed',
      userMessage: 'Please check your input and try again.',
      originalError: error,
      timestamp,
      retryable: false
    };
  }

  // Unknown errors
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    message: error.message || 'Unknown error occurred',
    userMessage: 'Something unexpected happened. Please try again.',
    originalError: error,
    timestamp,
    retryable: true
  };
}

// Retry mechanism with exponential backoff
export class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      onRetry?: (attempt: number, error: AppError) => void;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      onRetry
    } = options;

    let lastError: AppError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = classifyError(error);
        
        // Don't retry if error is not retryable or we've exhausted attempts
        if (!lastError.retryable || attempt === maxRetries) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Enhanced fetch with error handling and retries
export async function enhancedFetch(
  url: string,
  options: RequestInit & {
    timeout?: number;
    retries?: number;
    onRetry?: (attempt: number, error: AppError) => void;
  } = {}
): Promise<Response> {
  const {
    timeout = 30000,
    retries = 2,
    onRetry,
    ...fetchOptions
  } = options;

  return RetryManager.withRetry(
    async () => {
      // Check network connectivity
      if (!networkManager.isOnline()) {
        throw new Error('No network connection');
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Check for HTTP errors
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          (error as any).status = response.status;
          throw error;
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    {
      maxRetries: retries,
      onRetry
    }
  );
}

// Error reporting and logging
export class ErrorReporter {
  private static errors: AppError[] = [];
  private static maxErrors = 100;

  static report(error: AppError) {
    // Add to local error log
    this.errors.unshift(error);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('AppError:', {
        type: error.type,
        severity: error.severity,
        message: error.message,
        userMessage: error.userMessage,
        context: error.context,
        originalError: error.originalError
      });
    }

    // Show user-friendly message
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      toast.error(error.userMessage);
    }

    // TODO: Send to crash reporting service in production
    // if (ENV.ENABLE_CRASH_REPORTING && !__DEV__) {
    //   crashlytics().recordError(error.originalError || new Error(error.message));
    // }
  }

  static getRecentErrors(count = 10): AppError[] {
    return this.errors.slice(0, count);
  }

  static clearErrors() {
    this.errors = [];
  }
}

// Global error handler
export function handleError(error: any, context?: Record<string, any>): AppError {
  const appError = classifyError(error);
  
  if (context) {
    appError.context = context;
  }

  ErrorReporter.report(appError);
  return appError;
}

// Utility for handling async operations with error handling
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  context?: Record<string, any>
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}