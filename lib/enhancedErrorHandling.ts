/**
 * Enhanced Error Handling
 * 
 * Type-safe error handling system that replaces any types with strict interfaces.
 * Provides comprehensive error classification, reporting, and recovery mechanisms.
 */

import {
  AppError,
  AppErrorType,
  NetworkError,
  ValidationError,
  StorageError,
  AIError,
  DatabaseError,
  TimeoutError,
  ErrorContext,
  ErrorReport,
  Breadcrumb,
  ErrorFactory,
  ErrorClassifier,
  RetryConfig,
  HTTPError,
  isAppError,
  isNetworkError,
} from '../types/errors';
import { RequestConfig, APIError } from '../types/api';

// Enhanced error factory implementation
class EnhancedErrorFactory implements ErrorFactory {
  createNetworkError(message: string, options: Partial<NetworkError> = {}): NetworkError {
    return {
      name: 'NetworkError',
      type: 'NETWORK_ERROR',
      message,
      timestamp: Date.now(),
      retryable: true,
      severity: 'medium',
      userMessage: 'Network connection issue. Please check your internet connection.',
      ...options,
    };
  }

  createValidationError(field: string, message: string, value?: unknown): ValidationError {
    return {
      name: 'ValidationError',
      type: 'VALIDATION_ERROR',
      field,
      message,
      value,
      timestamp: Date.now(),
      retryable: false,
      severity: 'low',
      userMessage: `Invalid ${field}: ${message}`,
    };
  }

  createStorageError(
    operation: StorageError['operation'],
    message: string,
    options: Partial<StorageError> = {}
  ): StorageError {
    return {
      name: 'StorageError',
      type: 'STORAGE_ERROR',
      operation,
      message,
      timestamp: Date.now(),
      retryable: operation !== 'delete',
      severity: 'medium',
      storageType: 'async-storage',
      userMessage: 'Failed to save data. Please try again.',
      ...options,
    };
  }

  createAIError(provider: string, message: string, options: Partial<AIError> = {}): AIError {
    return {
      name: 'AIError',
      type: 'AI_ERROR',
      provider,
      message,
      timestamp: Date.now(),
      retryable: !options.rateLimited,
      severity: options.rateLimited ? 'high' : 'medium',
      userMessage: options.rateLimited 
        ? 'AI service rate limit reached. Please try again later.'
        : 'AI service temporarily unavailable. Please try again.',
      ...options,
    };
  }

  createDatabaseError(
    operation: DatabaseError['operation'],
    message: string,
    options: Partial<DatabaseError> = {}
  ): DatabaseError {
    return {
      name: 'DatabaseError',
      type: 'DATABASE_ERROR',
      operation,
      message,
      timestamp: Date.now(),
      retryable: operation !== 'migration',
      severity: operation === 'migration' ? 'critical' : 'medium',
      userMessage: 'Database operation failed. Please try again.',
      ...options,
    };
  }

  createTimeoutError(operation: string, timeout: number, elapsed?: number): TimeoutError {
    return {
      name: 'TimeoutError',
      type: 'TIMEOUT_ERROR',
      operation,
      timeout,
      elapsed,
      message: `Operation '${operation}' timed out after ${timeout}ms`,
      timestamp: Date.now(),
      retryable: true,
      severity: 'medium',
      userMessage: 'Operation timed out. Please try again.',
    };
  }

  createUnknownError(message: string, originalError?: unknown): AppError {
    return {
      name: 'UnknownError',
      type: 'UNKNOWN_ERROR',
      message,
      timestamp: Date.now(),
      retryable: false,
      severity: 'high',
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalDetails: originalError ? { originalError } : undefined,
    };
  }
}

// Enhanced error classifier
class EnhancedErrorClassifier implements ErrorClassifier {
  private errorFactory = new EnhancedErrorFactory();

  classify(error: unknown): AppError {
    // Already an AppError
    if (isAppError(error)) {
      return error;
    }

    // Standard Error object
    if (error instanceof Error) {
      return this.classifyStandardError(error);
    }

    // HTTP/Network errors
    if (this.isHTTPError(error)) {
      return this.classifyHTTPError(error);
    }

    // String error
    if (typeof error === 'string') {
      return this.errorFactory.createUnknownError(error);
    }

    // Object with error properties
    if (typeof error === 'object' && error !== null) {
      return this.classifyObjectError(error);
    }

    // Fallback for unknown error types
    return this.errorFactory.createUnknownError(
      'Unknown error occurred',
      error
    );
  }

  private classifyStandardError(error: Error): AppError {
    const message = error.message.toLowerCase();

    // Network-related errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return this.errorFactory.createNetworkError(error.message, {
        stack: error.stack,
      });
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return this.errorFactory.createTimeoutError('operation', 30000);
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return this.errorFactory.createValidationError('unknown', error.message);
    }

    // Storage errors
    if (message.includes('storage') || message.includes('save') || message.includes('load')) {
      return this.errorFactory.createStorageError('read', error.message);
    }

    // Database errors
    if (message.includes('database') || message.includes('sql') || message.includes('query')) {
      return this.errorFactory.createDatabaseError('query', error.message);
    }

    // Default to unknown error
    return this.errorFactory.createUnknownError(error.message, error);
  }

  private isHTTPError(error: unknown): error is { status: number; statusText?: string; response?: unknown } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as { status: unknown }).status === 'number'
    );
  }

  private classifyHTTPError(error: { status: number; statusText?: string; response?: unknown }): NetworkError {
    const { status, statusText, response } = error;
    
    let severity: AppError['severity'] = 'medium';
    let retryable = true;
    let userMessage = 'Network request failed. Please try again.';

    if (status >= 400 && status < 500) {
      // Client errors - usually not retryable
      retryable = false;
      severity = 'low';
      
      if (status === 401) {
        userMessage = 'Authentication required. Please log in again.';
      } else if (status === 403) {
        userMessage = 'Access denied. You don\'t have permission for this action.';
      } else if (status === 404) {
        userMessage = 'Resource not found.';
      } else if (status === 429) {
        userMessage = 'Too many requests. Please wait and try again.';
        retryable = true;
        severity = 'high';
      } else {
        userMessage = 'Invalid request. Please check your input.';
      }
    } else if (status >= 500) {
      // Server errors - usually retryable
      severity = 'high';
      userMessage = 'Server error. Please try again later.';
    }

    return this.errorFactory.createNetworkError(
      `HTTP ${status}: ${statusText || 'Request failed'}`,
      {
        status,
        statusText,
        retryable,
        severity,
        userMessage,
        technicalDetails: { response },
      }
    );
  }

  private classifyObjectError(error: Record<string, unknown>): AppError {
    // Check for common error object patterns
    if ('code' in error && 'message' in error) {
      const code = String(error.code);
      const message = String(error.message);

      // AI service errors
      if (code.startsWith('AI_') || message.includes('AI') || message.includes('model')) {
        return this.errorFactory.createAIError('unknown', message, {
          code,
          technicalDetails: error,
        });
      }

      // Database errors
      if (code.startsWith('DB_') || message.includes('database')) {
        return this.errorFactory.createDatabaseError('query', message, {
          code,
          technicalDetails: error,
        });
      }
    }

    return this.errorFactory.createUnknownError(
      'Object error occurred',
      error
    );
  }

  isRetryable(error: AppError): boolean {
    return error.retryable;
  }

  getSeverity(error: AppError): AppError['severity'] {
    return error.severity;
  }

  getUserMessage(error: AppError): string {
    return error.userMessage || error.message;
  }
}

// Enhanced error reporter
class EnhancedErrorReporter {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: Date.now(),
    });

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  report(error: AppError, context?: ErrorContext): ErrorReport {
    const report: ErrorReport = {
      error,
      context: {
        timestamp: Date.now(),
        platform: this.getPlatform(),
        version: this.getAppVersion(),
        ...context,
      },
      timestamp: Date.now(),
      reportId: this.generateReportId(),
      fingerprint: this.generateFingerprint(error),
      breadcrumbs: [...this.breadcrumbs],
    };

    // Log the error
    this.logError(report);

    // Send to external service if configured
    this.sendToExternalService(report);

    return report;
  }

  private generateReportId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: AppError): string {
    const key = `${error.type}_${error.message}_${error.stack?.split('\n')[0] || ''}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substr(0, 32);
  }

  private getPlatform(): string {
    // This would be implemented based on your platform detection logic
    return 'unknown';
  }

  private getAppVersion(): string {
    // This would be implemented based on your app version detection logic
    return '1.0.0';
  }

  private logError(report: ErrorReport): void {
    const { error, context } = report;
    
    console.group(`🚨 ${error.type}: ${error.message}`);
    console.error('Error:', error);
    console.log('Context:', context);
    console.log('Report ID:', report.reportId);
    console.log('Fingerprint:', report.fingerprint);
    
    if (report.breadcrumbs.length > 0) {
      console.log('Breadcrumbs:', report.breadcrumbs.slice(-5)); // Show last 5
    }
    
    console.groupEnd();
  }

  private sendToExternalService(report: ErrorReport): void {
    // Implementation would depend on your error reporting service
    // (e.g., Sentry, Bugsnag, custom endpoint)
    if (__DEV__) {
      console.log('Would send error report to external service:', report.reportId);
    }
  }
}

// Enhanced fetch function with proper typing
export async function enhancedFetch<T = unknown>(
  url: string,
  config: RequestConfig = {}
): Promise<T> {
  const classifier = new EnhancedErrorClassifier();
  const reporter = new EnhancedErrorReporter();

  try {
    const response = await fetch(url, {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body,
    });

    if (!response.ok) {
      const error = classifier.classify({
        status: response.status,
        statusText: response.statusText,
        response: await response.text().catch(() => null),
      });
      
      reporter.report(error, { url, method: config.method });
      throw error;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    const classifiedError = classifier.classify(error);
    reporter.report(classifiedError, { url, method: config.method });
    throw classifiedError;
  }
}

// Retry mechanism with proper typing
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableErrors: ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'AI_ERROR'],
  }
): Promise<T> {
  const classifier = new EnhancedErrorClassifier();
  let lastError: AppError;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const classifiedError = classifier.classify(error);
      lastError = classifiedError;

      // Don't retry if not retryable or max attempts reached
      if (!config.retryableErrors.includes(classifiedError.type) || attempt === config.maxRetries) {
        throw classifiedError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt),
        config.maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Safe async operation wrapper
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  context?: ErrorContext
): Promise<T | undefined> {
  const classifier = new EnhancedErrorClassifier();
  const reporter = new EnhancedErrorReporter();

  try {
    return await operation();
  } catch (error) {
    const classifiedError = classifier.classify(error);
    reporter.report(classifiedError, context);
    return fallback;
  }
}

// Export instances
export const errorFactory = new EnhancedErrorFactory();
export const errorClassifier = new EnhancedErrorClassifier();
export const errorReporter = new EnhancedErrorReporter();

// Main error handler function
export function handleError(error: unknown, context?: ErrorContext): AppError {
  const classifiedError = errorClassifier.classify(error);
  errorReporter.report(classifiedError, context);
  return classifiedError;
}