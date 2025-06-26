/**
 * Centralized Type Definitions
 * 
 * This file contains all the shared type definitions used across the application.
 * Centralizing types improves maintainability and prevents circular dependencies.
 * 
 * Enhanced with strict type safety - no more any types!
 */

// Re-export all domain-specific types
export * from './api';
export * from './database';
export * from './environment';
export * from './errors';

// Core domain types
export interface Scene {
  id: string;
  text: string;
  image?: string; // URL to generated image
  imagePrompt?: string; // prompt for image generation (optional)
  duration?: number; // Scene duration in seconds
  transitions?: {
    in?: string; // Transition in effect
    out?: string; // Transition out effect
  };
  metadata?: {
    wordCount?: number;
    estimatedReadTime?: number;
    tags?: string[];
  };
}

export interface Project {
  id: string;
  title: string;
  sourceText: string;
  style: string;
  scenes: Scene[];
  status: 'draft' | 'storyboard' | 'rendering' | 'completed';
  progress: number; // 0..1
  videoUrl?: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  version: number; // Data version for migration
  metadata?: {
    totalDuration?: number;
    wordCount?: number;
    estimatedReadTime?: number;
    tags?: string[];
    category?: string;
    description?: string;
  };
  settings?: {
    autoSave?: boolean;
    backupEnabled?: boolean;
    exportFormat?: 'json' | 'pdf' | 'txt';
  };
}

// App settings types
export interface AppSettings {
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  backupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  maxBackups: number;
  exportFormat: 'json' | 'pdf' | 'txt';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    autoSave: boolean;
    backup: boolean;
    export: boolean;
  };
}

// Data export/import types
export interface ExportData {
  version: string;
  exportedAt: number;
  projects: Project[];
  settings: AppSettings;
  metadata: {
    appVersion: string;
    totalProjects: number;
    totalScenes: number;
  };
}

export interface BackupData extends ExportData {
  backupId: string;
  backupType: 'manual' | 'auto';
  compressed: boolean;
}

// UI State types
export interface UIState {
  isLoading: boolean;
  selectedProjectId?: string;
  activeScreen: string;
  modals: {
    settings: boolean;
    export: boolean;
    backup: boolean;
  };
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
  }>;
}

// Analytics types
export interface ProjectStats {
  totalProjects: number;
  totalScenes: number;
  totalWords: number;
  averageProjectSize: number;
  projectsByStatus: Record<string, number>;
}

// Service interfaces
export interface ProjectService {
  createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  duplicateProject(id: string): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  getAllProjects(): Promise<Project[]>;
}

export interface DataService {
  exportData(format?: 'json' | 'pdf' | 'txt'): Promise<string>;
  importData(data: string | ExportData): Promise<void>;
  createBackup(type?: 'manual' | 'auto'): Promise<string>;
  restoreBackup(backupId: string): Promise<void>;
  listBackups(): Promise<BackupData[]>;
  deleteBackup(backupId: string): Promise<void>;
  getDataSize(): Promise<number>;
  optimizeData(): Promise<void>;
}

export interface SettingsService {
  getSettings(): AppSettings;
  updateSettings(updates: Partial<AppSettings>): Promise<void>;
  resetSettings(): Promise<void>;
  enableAutoSave(): void;
  disableAutoSave(): void;
}

// Error types
export type AppError = 
  | { type: 'NETWORK_ERROR'; message: string; retryable: boolean; context?: Record<string, unknown> }
  | { type: 'VALIDATION_ERROR'; field: string; message: string; context?: Record<string, unknown> }
  | { type: 'STORAGE_ERROR'; message: string; retryable: boolean; context?: Record<string, unknown> }
  | { type: 'AI_ERROR'; code: string; message: string; context?: Record<string, unknown> }
  | { type: 'UNKNOWN_ERROR'; message: string; context?: Record<string, unknown> };

// Network and API types
export interface NetworkInfo {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
  details?: Record<string, unknown>;
}

// Environment configuration types
export interface EnvironmentConfig {
  AI_API_BASE_URL: string;
  AI_LLM_ENDPOINT: string;
  IMAGE_GENERATION_ENDPOINT: string;
  AI_API_KEY: string;
  IMAGE_API_KEY: string;
  MAX_FILE_SIZE_MB: number;
  MAX_CONTENT_LENGTH: number;
  AI_TIMEOUT: number;
  IMAGE_TIMEOUT: number;
  ENABLE_OFFLINE_MODE: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_CRASH_REPORTING: boolean;
  DEBUG_MODE: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  MOCK_API_RESPONSES: boolean;
}

// Validation types
export interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: string[];
  data?: T;
}

export interface ValidationRule<T> {
  field: keyof T;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

// Database operation types
export interface DatabaseOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: AppError;
  timestamp: number;
}

// Performance monitoring types
export interface PerformanceMetrics {
  operationName: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Utility types for better type safety
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Type guards
export type TypeGuard<T> = (value: unknown) => value is T;

// Async operation types
export type AsyncOperation<T> = () => Promise<T>;
export type AsyncOperationWithFallback<T> = {
  operation: AsyncOperation<T>;
  fallback?: () => Promise<T> | T;
  retries?: number;
  timeout?: number;
};

// API types
export interface AIResponse {
  scenes: Scene[];
  metadata: {
    processingTime: number;
    model: string;
    tokensUsed: number;
  };
}

export interface ImageGenerationResponse {
  imageUrl: string;
  metadata: {
    processingTime: number;
    model: string;
    prompt: string;
  };
}

// Store action types
export interface ProjectActions {
  addProject: (project: Project) => void;
  updateProject: (id: string, partial: Partial<Project>) => void;
  removeProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  setSelectedProject: (id: string | undefined) => void;
}

export interface SettingsActions {
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
}

export interface UIActions {
  setLoading: (loading: boolean) => void;
  setActiveScreen: (screen: string) => void;
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}