/**
 * Enhanced Sync Engine
 * 
 * Type-safe sync engine that replaces any types with strict interfaces.
 * Provides robust offline synchronization with proper error handling.
 */

import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import {
  ActionQueueItem,
  ActionType,
  ActionPayload,
  SyncState,
  SyncError,
  SyncOptions,
  ProjectModel,
  SceneModel,
} from '../types/database';
import { NetworkInfo, AIResponse, AISceneData } from '../types/api';
import { AppError } from '../types/errors';
import { API_URLS, ENV } from './enhancedEnv';
import { enhancedFetch, withRetry, errorClassifier, errorReporter } from './enhancedErrorHandling';
import { toast } from './toast';

// Enhanced sync engine class
export class EnhancedSyncEngine {
  private database: Database;
  private syncState: SyncState = {
    isOnline: false,
    isSyncing: false,
    pendingOperations: 0,
    failedOperations: 0,
    syncErrors: [],
  };

  constructor(database: Database) {
    this.database = database;
  }

  // Get current sync state
  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  // Process action queue with proper typing
  async processActionQueue(
    networkInfo: NetworkInfo,
    options: SyncOptions = {}
  ): Promise<void> {
    if (!networkInfo.isInternetReachable) {
      throw errorClassifier.classify(new Error('No internet connection available'));
    }

    if (this.syncState.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.updateSyncState({ isSyncing: true, isOnline: true });

    try {
      const pendingActions = await this.getPendingActions();
      this.updateSyncState({ pendingOperations: pendingActions.length });

      for (const action of pendingActions) {
        try {
          await this.processAction(action, options);
          await this.markActionCompleted(action.id);
        } catch (error) {
          await this.markActionFailed(action.id, error);
          this.addSyncError(action, error);
        }
      }

      // Update final state
      const remainingActions = await this.getPendingActions();
      this.updateSyncState({
        pendingOperations: remainingActions.length,
        lastSyncTime: Date.now(),
      });

      console.log('✅ Sync completed successfully');
    } catch (error) {
      const appError = errorClassifier.classify(error);
      errorReporter.report(appError, { operation: 'sync_process' });
      throw appError;
    } finally {
      this.updateSyncState({ isSyncing: false });
    }
  }

  // Get pending actions with proper typing
  private async getPendingActions(): Promise<ActionQueueItem[]> {
    try {
      const actions = await this.database
        .get<ActionQueueItem>('action_queue')
        .query(Q.where('status', 'pending'))
        .fetch();

      return actions.map(action => ({
        id: action.id,
        type: action.type as ActionType,
        payload: this.parseActionPayload(action.payload),
        status: action.status as ActionQueueItem['status'],
        retryCount: action.retryCount,
        lastError: action.lastError,
        priority: action.priority as ActionQueueItem['priority'],
        createdAt: action.createdAt,
        updatedAt: action.updatedAt,
        scheduledAt: action.scheduledAt,
        processedAt: action.processedAt,
      }));
    } catch (error) {
      throw errorClassifier.classify(error);
    }
  }

  // Parse action payload with type safety
  private parseActionPayload(payload: string): ActionPayload {
    try {
      const parsed = JSON.parse(payload);
      
      // Validate payload structure
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid payload format');
      }

      return parsed as ActionPayload;
    } catch (error) {
      throw errorClassifier.classify(new Error(`Failed to parse action payload: ${error}`));
    }
  }

  // Process individual action with proper typing
  private async processAction(
    action: ActionQueueItem,
    options: SyncOptions
  ): Promise<void> {
    console.log(`Processing action: ${action.type} (${action.id})`);

    await this.markActionProcessing(action.id);

    try {
      switch (action.type) {
        case 'GENERATE_SCENES':
          await this.processGenerateScenes(action);
          break;
        case 'GENERATE_IMAGE':
          await this.processGenerateImage(action);
          break;
        case 'GENERATE_VIDEO':
          await this.processGenerateVideo(action);
          break;
        case 'SYNC_PROJECT':
          await this.processSyncProject(action);
          break;
        case 'BACKUP_DATA':
          await this.processBackupData(action);
          break;
        case 'EXPORT_DATA':
          await this.processExportData(action);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      // Enhance error with action context
      const appError = errorClassifier.classify(error);
      appError.context = {
        ...appError.context,
        actionId: action.id,
        actionType: action.type,
        retryCount: action.retryCount,
      };
      throw appError;
    }
  }

  // Process scene generation with proper typing
  private async processGenerateScenes(action: ActionQueueItem): Promise<void> {
    const { projectId, data } = action.payload;
    
    if (!projectId || !data?.text) {
      throw errorClassifier.classify(new Error('Invalid scene generation payload'));
    }

    const scenes = await withRetry(
      () => this.aiGenerateScenes(data.text as string),
      {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryableErrors: ['NETWORK_ERROR', 'AI_ERROR', 'TIMEOUT_ERROR'],
      }
    );

    // Save scenes to database
    await this.saveGeneratedScenes(projectId, scenes);
    
    // Update project progress
    await this.updateProjectProgress(projectId, 0.5); // 50% complete after scene generation
  }

  // AI scene generation with proper typing
  private async aiGenerateScenes(text: string): Promise<AISceneData[]> {
    try {
      const response = await enhancedFetch<AIResponse>(API_URLS.AI_LLM, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ENV.AI_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that breaks a story into a brief storyboard array. Return JSON array where each element has id, text, and imagePrompt (a visual description for image generation) strictly.',
            },
            { 
              role: 'user', 
              content: `Break this story into scenes: ${text}` 
            },
          ],
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 2000,
        }),
        timeout: ENV.AI_TIMEOUT,
      });

      // Validate response structure
      if (!response.scenes || !Array.isArray(response.scenes)) {
        throw new Error('Invalid AI response format: missing scenes array');
      }

      // Validate each scene
      const validatedScenes: AISceneData[] = response.scenes.map((scene, index) => {
        if (!scene.id || !scene.text || !scene.imagePrompt) {
          throw new Error(`Invalid scene data at index ${index}: missing required fields`);
        }

        return {
          id: String(scene.id),
          text: String(scene.text),
          imagePrompt: String(scene.imagePrompt),
          duration: typeof scene.duration === 'number' ? scene.duration : 5, // Default 5 seconds
        };
      });

      return validatedScenes;
    } catch (error) {
      throw errorClassifier.classify(error);
    }
  }

  // Save generated scenes with proper typing
  private async saveGeneratedScenes(
    projectId: string,
    scenes: AISceneData[]
  ): Promise<void> {
    try {
      await this.database.write(async () => {
        const project = await this.database.get<ProjectModel>('projects').find(projectId);
        
        // Create scene models
        const sceneModels = scenes.map((sceneData, index) =>
          this.database.get<SceneModel>('scenes').prepareCreate(scene => {
            scene.project.set(project);
            scene.text = sceneData.text;
            scene.imagePrompt = sceneData.imagePrompt;
            scene.duration = sceneData.duration;
            scene.order = index;
            scene.metadata = {
              wordCount: sceneData.text.split(/\s+/).length,
              estimatedReadTime: Math.ceil(sceneData.text.split(/\s+/).length / 200),
            };
          })
        );

        await this.database.batch(...sceneModels);
      });
    } catch (error) {
      throw errorClassifier.classify(error);
    }
  }

  // Process image generation (placeholder)
  private async processGenerateImage(action: ActionQueueItem): Promise<void> {
    // Implementation would depend on your image generation service
    console.log('Processing image generation:', action.payload);
  }

  // Process video generation (placeholder)
  private async processGenerateVideo(action: ActionQueueItem): Promise<void> {
    // Implementation would depend on your video generation service
    console.log('Processing video generation:', action.payload);
  }

  // Process project sync (placeholder)
  private async processSyncProject(action: ActionQueueItem): Promise<void> {
    console.log('Processing project sync:', action.payload);
  }

  // Process data backup (placeholder)
  private async processBackupData(action: ActionQueueItem): Promise<void> {
    console.log('Processing data backup:', action.payload);
  }

  // Process data export (placeholder)
  private async processExportData(action: ActionQueueItem): Promise<void> {
    console.log('Processing data export:', action.payload);
  }

  // Update project progress
  private async updateProjectProgress(projectId: string, progress: number): Promise<void> {
    try {
      await this.database.write(async () => {
        const project = await this.database.get<ProjectModel>('projects').find(projectId);
        await project.update(() => {
          project.progress = Math.max(0, Math.min(1, progress));
          project.updatedAt = Date.now();
        });
      });
    } catch (error) {
      throw errorClassifier.classify(error);
    }
  }

  // Action status management
  private async markActionProcessing(actionId: string): Promise<void> {
    await this.updateActionStatus(actionId, 'processing');
  }

  private async markActionCompleted(actionId: string): Promise<void> {
    await this.updateActionStatus(actionId, 'completed');
  }

  private async markActionFailed(actionId: string, error: unknown): Promise<void> {
    const appError = errorClassifier.classify(error);
    await this.updateActionStatus(actionId, 'failed', appError.message);
  }

  private async updateActionStatus(
    actionId: string,
    status: ActionQueueItem['status'],
    error?: string
  ): Promise<void> {
    try {
      await this.database.write(async () => {
        const action = await this.database.get<ActionQueueItem>('action_queue').find(actionId);
        await action.update(() => {
          action.status = status;
          action.updatedAt = Date.now();
          if (status === 'processing') {
            action.processedAt = Date.now();
          }
          if (error) {
            action.lastError = error;
            action.retryCount += 1;
          }
        });
      });
    } catch (dbError) {
      throw errorClassifier.classify(dbError);
    }
  }

  // Sync state management
  private updateSyncState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
  }

  private addSyncError(action: ActionQueueItem, error: unknown): void {
    const appError = errorClassifier.classify(error);
    const syncError: SyncError = {
      id: `sync_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation: {
        type: 'create', // This would be determined based on action type
        table: 'action_queue',
        data: action,
        timestamp: Date.now(),
      },
      error: appError.message,
      timestamp: Date.now(),
      retryCount: action.retryCount,
    };

    this.syncState.syncErrors.push(syncError);
    this.syncState.failedOperations += 1;

    // Keep only the most recent 50 errors
    if (this.syncState.syncErrors.length > 50) {
      this.syncState.syncErrors = this.syncState.syncErrors.slice(-50);
    }
  }

  // Cleanup completed actions
  async cleanupCompletedActions(): Promise<void> {
    try {
      await this.database.write(async () => {
        const completedActions = await this.database
          .get<ActionQueueItem>('action_queue')
          .query(Q.where('status', 'completed'))
          .fetch();

        await Promise.all(
          completedActions.map(action => action.destroyPermanently())
        );
      });

      console.log(`🧹 Cleaned up ${completedActions.length} completed actions`);
    } catch (error) {
      const appError = errorClassifier.classify(error);
      errorReporter.report(appError, { operation: 'cleanup_actions' });
      throw appError;
    }
  }
}

// Legacy function wrappers for backward compatibility
export async function processActionQueue(
  database: Database,
  netInfo: NetworkInfo
): Promise<void> {
  const syncEngine = new EnhancedSyncEngine(database);
  await syncEngine.processActionQueue(netInfo);
}

export async function cleanupCompletedActions(database: Database): Promise<void> {
  const syncEngine = new EnhancedSyncEngine(database);
  await syncEngine.cleanupCompletedActions();
}