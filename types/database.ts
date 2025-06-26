/**
 * Database Type Definitions
 * 
 * Strict type definitions for database operations, models, and queries.
 * Replaces any types with proper interfaces for better type safety.
 */

import { Database, Model, Query, Collection } from '@nozbe/watermelondb';

// Base model types
export interface BaseModel {
  id: string;
  createdAt: number;
  updatedAt: number;
}

// Database operation types
export interface DatabaseOperation<T = unknown> {
  type: 'create' | 'update' | 'delete';
  table: string;
  data: T;
  timestamp: number;
}

export interface DatabaseTransaction {
  operations: DatabaseOperation[];
  id: string;
  timestamp: number;
}

// Query types
export interface QueryOptions {
  where?: Array<{
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
    value: unknown;
  }>;
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

// Migration types
export interface MigrationStep {
  version: number;
  description: string;
  up: (database: Database) => Promise<void>;
  down: (database: Database) => Promise<void>;
}

export interface MigrationState {
  currentVersion: number;
  pendingMigrations: MigrationStep[];
  appliedMigrations: number[];
}

// Action queue types (replacing any types)
export type ActionType = 
  | 'GENERATE_SCENES'
  | 'GENERATE_IMAGE'
  | 'GENERATE_VIDEO'
  | 'SYNC_PROJECT'
  | 'BACKUP_DATA'
  | 'EXPORT_DATA';

export interface ActionPayload {
  projectId?: string;
  sceneId?: string;
  data?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

export interface ActionQueueItem extends BaseModel {
  type: ActionType;
  payload: ActionPayload;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  lastError?: string;
  priority: 'low' | 'normal' | 'high';
  scheduledAt?: number;
  processedAt?: number;
}

// Project model types
export interface ProjectModel extends BaseModel {
  title: string;
  sourceText: string;
  style: string;
  status: 'draft' | 'storyboard' | 'rendering' | 'completed';
  progress: number;
  videoUrl?: string;
  version: number;
  metadata?: ProjectMetadata;
  settings?: ProjectSettings;
}

export interface ProjectMetadata {
  totalDuration?: number;
  wordCount?: number;
  estimatedReadTime?: number;
  tags?: string[];
  category?: string;
  description?: string;
  lastModifiedBy?: string;
}

export interface ProjectSettings {
  autoSave?: boolean;
  backupEnabled?: boolean;
  exportFormat?: 'json' | 'pdf' | 'txt';
  quality?: 'low' | 'medium' | 'high';
  resolution?: '720p' | '1080p' | '4k';
}

// Scene model types
export interface SceneModel extends BaseModel {
  text: string;
  image?: string;
  imagePrompt?: string;
  projectId: string;
  duration?: number;
  order: number;
  transitions?: SceneTransitions;
  metadata?: SceneMetadata;
}

export interface SceneTransitions {
  in?: string;
  out?: string;
  duration?: number;
}

export interface SceneMetadata {
  wordCount?: number;
  estimatedReadTime?: number;
  tags?: string[];
  notes?: string;
  imageGenerationAttempts?: number;
  lastImageGeneration?: number;
}

// Database context types
export interface DatabaseContextValue {
  database: Database;
  isReady: boolean;
  error?: Error;
}

// Collection types with proper typing
export type ProjectCollection = Collection<ProjectModel>;
export type SceneCollection = Collection<SceneModel>;
export type ActionQueueCollection = Collection<ActionQueueItem>;

// Database provider types
export interface DatabaseProviderProps {
  children: React.ReactNode;
  databaseName?: string;
  migrations?: MigrationStep[];
  onReady?: (database: Database) => void;
  onError?: (error: Error) => void;
}

// Sync types
export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime?: number;
  pendingOperations: number;
  failedOperations: number;
  syncErrors: SyncError[];
}

export interface SyncError {
  id: string;
  operation: DatabaseOperation;
  error: string;
  timestamp: number;
  retryCount: number;
}

export interface SyncOptions {
  forceSync?: boolean;
  syncTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// Backup types
export interface BackupMetadata {
  id: string;
  timestamp: number;
  version: string;
  size: number;
  checksum: string;
  type: 'manual' | 'auto';
  description?: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  projects: ProjectModel[];
  scenes: SceneModel[];
  actionQueue: ActionQueueItem[];
  settings: Record<string, unknown>;
}

// Type guards for database models
export function isProjectModel(model: unknown): model is ProjectModel {
  return (
    typeof model === 'object' &&
    model !== null &&
    'title' in model &&
    'sourceText' in model &&
    'style' in model &&
    'status' in model
  );
}

export function isSceneModel(model: unknown): model is SceneModel {
  return (
    typeof model === 'object' &&
    model !== null &&
    'text' in model &&
    'projectId' in model &&
    'order' in model
  );
}

export function isActionQueueItem(model: unknown): model is ActionQueueItem {
  return (
    typeof model === 'object' &&
    model !== null &&
    'type' in model &&
    'payload' in model &&
    'status' in model
  );
}

// Utility types for database operations
export type CreateProjectData = Omit<ProjectModel, keyof BaseModel | 'version'>;
export type UpdateProjectData = Partial<Omit<ProjectModel, keyof BaseModel>>;
export type CreateSceneData = Omit<SceneModel, keyof BaseModel>;
export type UpdateSceneData = Partial<Omit<SceneModel, keyof BaseModel>>;

// Database operation result types
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  timestamp: number;
}

export interface BulkOperationResult<T = unknown> {
  success: boolean;
  results: OperationResult<T>[];
  successCount: number;
  errorCount: number;
  errors: Error[];
}