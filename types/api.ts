/**
 * API Type Definitions
 * 
 * Strict type definitions for all API interactions, replacing any types
 * with proper interfaces and ensuring type safety across the application.
 */

// Network and connectivity types
export interface NetworkInfo {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
  details: Record<string, unknown>;
}

// AI API types
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AISceneData {
  id: string;
  text: string;
  imagePrompt: string;
  duration?: number;
}

export interface AIResponse {
  scenes: AISceneData[];
  metadata: {
    processingTime: number;
    model: string;
    tokensUsed: number;
    requestId: string;
  };
}

export interface AIErrorResponse {
  error: {
    code: string;
    message: string;
    type: 'validation_error' | 'rate_limit_error' | 'api_error' | 'server_error';
    details?: Record<string, unknown>;
  };
}

// Image generation API types
export interface ImageGenerationRequest {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface ImageGenerationResponse {
  imageUrl: string;
  metadata: {
    processingTime: number;
    model: string;
    prompt: string;
    style: string;
    dimensions: {
      width: number;
      height: number;
    };
    requestId: string;
  };
}

// HTTP response types
export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface APIError {
  status: number;
  statusText: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Request configuration types
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData | URLSearchParams;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface EnhancedFetchOptions extends RequestConfig {
  baseURL?: string;
  validateStatus?: (status: number) => boolean;
  transformRequest?: (data: unknown) => string;
  transformResponse?: (data: string) => unknown;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

// File upload types
export interface FileUploadRequest {
  file: File | Blob;
  filename: string;
  contentType: string;
  metadata?: Record<string, unknown>;
}

export interface FileUploadResponse {
  fileId: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

// Webhook types
export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  signature: string;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// API client configuration
export interface APIClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
  validateStatus: (status: number) => boolean;
}

// Type guards for API responses
export function isAIResponse(response: unknown): response is AIResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'scenes' in response &&
    'metadata' in response &&
    Array.isArray((response as AIResponse).scenes)
  );
}

export function isAIErrorResponse(response: unknown): response is AIErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as AIErrorResponse).error === 'object'
  );
}

export function isImageGenerationResponse(response: unknown): response is ImageGenerationResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'imageUrl' in response &&
    'metadata' in response &&
    typeof (response as ImageGenerationResponse).imageUrl === 'string'
  );
}

export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error &&
    typeof (error as APIError).status === 'number'
  );
}

// Utility types for API operations
export type APIOperation<TRequest = unknown, TResponse = unknown> = (
  request: TRequest,
  config?: Partial<RequestConfig>
) => Promise<TResponse>;

export type APIEndpoint = {
  url: string;
  method: RequestConfig['method'];
  timeout?: number;
  retries?: number;
};

export type APIEndpoints = {
  [key: string]: APIEndpoint;
};