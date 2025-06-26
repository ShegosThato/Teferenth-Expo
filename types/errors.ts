/**
 * Error Type Definitions
 * 
 * Comprehensive error types replacing any types with strict interfaces
 * for better error handling and debugging.
 */

// Base error interface
export interface BaseError {
  name: string;
  message: string;
  stack?: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

// Application-specific error types
export type AppErrorType = 
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'STORAGE_ERROR'
  | 'AI_ERROR'
  | 'DATABASE_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppError extends BaseError {
  type: AppErrorType;
  code?: string;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage?: string;
  technicalDetails?: Record<string, unknown>;
}

// Specific error types
export interface NetworkError extends AppError {
  type: 'NETWORK_ERROR';
  status?: number;
  statusText?: string;
  url?: string;
  method?: string;
  timeout?: boolean;
}

export interface ValidationError extends AppError {
  type: 'VALIDATION_ERROR';
  field: string;
  value?: unknown;
  constraints?: string[];
}

export interface StorageError extends AppError {
  type: 'STORAGE_ERROR';
  operation: 'read' | 'write' | 'delete' | 'clear';
  key?: string;
  storageType: 'async-storage' | 'secure-store' | 'file-system';
}

export interface AIError extends AppError {
  type: 'AI_ERROR';
  provider: string;
  model?: string;
  requestId?: string;
  tokensUsed?: number;
  rateLimited?: boolean;
}

export interface DatabaseError extends AppError {
  type: 'DATABASE_ERROR';
  operation: 'create' | 'read' | 'update' | 'delete' | 'query' | 'migration';
  table?: string;
  query?: string;
  constraint?: string;
}

export interface AuthenticationError extends AppError {
  type: 'AUTHENTICATION_ERROR';
  reason: 'invalid_credentials' | 'token_expired' | 'unauthorized' | 'forbidden';
  authMethod?: string;
}

export interface PermissionError extends AppError {
  type: 'PERMISSION_ERROR';
  permission: string;
  resource?: string;
  action?: string;
}

export interface RateLimitError extends AppError {
  type: 'RATE_LIMIT_ERROR';
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface TimeoutError extends AppError {
  type: 'TIMEOUT_ERROR';
  timeout: number;
  operation: string;
  elapsed?: number;
}

// Error context types
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  platform?: string;
  version?: string;
  screen?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

// Error reporting types
export interface ErrorReport {
  error: AppError;
  context: ErrorContext;
  timestamp: number;
  reportId: string;
  fingerprint: string;
  breadcrumbs?: Breadcrumb[];
  tags?: Record<string, string>;
}

export interface Breadcrumb {
  timestamp: number;
  message: string;
  category: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

// Error handler types
export type ErrorHandler = (error: AppError, context?: ErrorContext) => void;

export interface ErrorHandlerConfig {
  enableReporting: boolean;
  enableLogging: boolean;
  enableUserNotification: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxBreadcrumbs: number;
  reportingEndpoint?: string;
}

// Error recovery types
export interface ErrorRecoveryStrategy {
  canRecover: (error: AppError) => boolean;
  recover: (error: AppError, context?: ErrorContext) => Promise<boolean>;
  maxAttempts: number;
  backoffMs: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: AppErrorType[];
}

// Error boundary types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
  lastErrorTime?: number;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: AppError, errorInfo: React.ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
}

export interface ErrorFallbackProps {
  error: AppError;
  resetError: () => void;
  canRetry: boolean;
  retryCount: number;
}

// Error classification types
export interface ErrorClassifier {
  classify: (error: unknown) => AppError;
  isRetryable: (error: AppError) => boolean;
  getSeverity: (error: AppError) => AppError['severity'];
  getUserMessage: (error: AppError) => string;
}

// HTTP error types
export interface HTTPError extends NetworkError {
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data?: unknown;
  };
  request?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: unknown;
  };
}

// Async operation error types
export interface AsyncOperationError extends AppError {
  operation: string;
  phase: 'start' | 'progress' | 'complete' | 'timeout' | 'cancel';
  progress?: number;
  elapsed?: number;
}

// Type guards for error types
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    'retryable' in error &&
    'severity' in error
  );
}

export function isNetworkError(error: unknown): error is NetworkError {
  return isAppError(error) && error.type === 'NETWORK_ERROR';
}

export function isValidationError(error: unknown): error is ValidationError {
  return isAppError(error) && error.type === 'VALIDATION_ERROR';
}

export function isStorageError(error: unknown): error is StorageError {
  return isAppError(error) && error.type === 'STORAGE_ERROR';
}

export function isAIError(error: unknown): error is AIError {
  return isAppError(error) && error.type === 'AI_ERROR';
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return isAppError(error) && error.type === 'DATABASE_ERROR';
}

export function isHTTPError(error: unknown): error is HTTPError {
  return isNetworkError(error) && 'response' in error;
}

// Error factory functions
export interface ErrorFactory {
  createNetworkError: (message: string, options?: Partial<NetworkError>) => NetworkError;
  createValidationError: (field: string, message: string, value?: unknown) => ValidationError;
  createStorageError: (operation: StorageError['operation'], message: string, options?: Partial<StorageError>) => StorageError;
  createAIError: (provider: string, message: string, options?: Partial<AIError>) => AIError;
  createDatabaseError: (operation: DatabaseError['operation'], message: string, options?: Partial<DatabaseError>) => DatabaseError;
  createTimeoutError: (operation: string, timeout: number, elapsed?: number) => TimeoutError;
  createUnknownError: (message: string, originalError?: unknown) => AppError;
}

// Error aggregation types
export interface ErrorStats {
  total: number;
  byType: Record<AppErrorType, number>;
  bySeverity: Record<AppError['severity'], number>;
  recentErrors: AppError[];
  topErrors: Array<{
    error: AppError;
    count: number;
    lastOccurrence: number;
  }>;
}

export interface ErrorMetrics {
  errorRate: number;
  meanTimeBetweenErrors: number;
  errorTrends: Array<{
    timestamp: number;
    count: number;
    type?: AppErrorType;
  }>;
  recoveryRate: number;
  userImpact: 'low' | 'medium' | 'high';
}