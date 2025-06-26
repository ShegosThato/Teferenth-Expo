/**
 * Store Index
 * 
 * Centralized export of all stores and their utilities.
 * This provides a single import point for all store-related functionality.
 */

// Store exports
export { useProjectStore, projectSelectors, useProjectSubscription, useProjectStats } from './projectStore';
export { useSettingsStore, settingsSelectors, useThemePreference, useAutoSaveConfig, useNotificationPreferences, useBackupPreferences } from './settingsStore';
export { useUIStore, uiSelectors, useLoadingState, useModalState, useNotifications, useActiveScreen, useNotificationActions, useModalActions } from './uiStore';

// Service exports
export { projectService } from '../services/ProjectService';
export { dataService } from '../services/DataService';
export { settingsService } from '../services/SettingsService';

// Type exports
export type {
  Project,
  Scene,
  AppSettings,
  ExportData,
  BackupData,
  UIState,
  ProjectStats,
  AppError,
  AIResponse,
  ImageGenerationResponse,
} from '../types';

// Combined store hooks for complex operations
export const useStores = () => {
  const projectStore = useProjectStore();
  const settingsStore = useSettingsStore();
  const uiStore = useUIStore();

  return {
    project: projectStore,
    settings: settingsStore,
    ui: uiStore,
  };
};

// Combined selectors for complex queries
export const combinedSelectors = {
  // Get selected project with UI state
  selectedProjectWithUI: (projectState: any, uiState: any) => {
    const selectedId = uiState.selectedProjectId;
    return selectedId ? projectState.projects.find((p: any) => p.id === selectedId) : undefined;
  },

  // Get projects with loading state
  projectsWithLoadingState: (projectState: any, uiState: any) => ({
    projects: projectState.projects,
    isLoading: projectState.isLoading || uiState.isLoading,
    error: projectState.error,
  }),

  // Get theme-aware settings
  themeAwareSettings: (settingsState: any) => ({
    theme: settingsState.theme,
    isDarkMode: settingsState.theme === 'dark',
    isSystemTheme: settingsState.theme === 'system',
  }),
};

// Store initialization and cleanup utilities
export const storeUtils = {
  // Initialize all stores
  initializeStores: async () => {
    try {
      // Settings store initializes automatically
      // Project store might need to load from database
      // UI store starts with default state
      console.log('Stores initialized successfully');
    } catch (error) {
      console.error('Failed to initialize stores:', error);
      throw error;
    }
  },

  // Clear all store data (useful for logout or reset)
  clearAllStores: () => {
    // Reset to initial states
    useProjectStore.setState({
      projects: [],
      selectedProjectId: undefined,
      isLoading: false,
      error: undefined,
    });

    useUIStore.setState({
      isLoading: false,
      selectedProjectId: undefined,
      activeScreen: 'Library',
      modals: {
        settings: false,
        export: false,
        backup: false,
      },
      notifications: [],
    });

    // Settings store should reset to defaults
    useSettingsStore.getState().resetSettings();
  },

  // Get combined state snapshot (useful for debugging)
  getStateSnapshot: () => ({
    project: useProjectStore.getState(),
    settings: useSettingsStore.getState(),
    ui: useUIStore.getState(),
    timestamp: Date.now(),
  }),
};

// Error handling utilities for stores
export const storeErrorHandlers = {
  // Handle project store errors
  handleProjectError: (error: Error, operation: string) => {
    console.error(`Project operation failed: ${operation}`, error);
    useUIStore.getState().addNotification({
      type: 'error',
      title: 'Project Error',
      message: `Failed to ${operation}: ${error.message}`,
    });
  },

  // Handle settings store errors
  handleSettingsError: (error: Error, operation: string) => {
    console.error(`Settings operation failed: ${operation}`, error);
    useUIStore.getState().addNotification({
      type: 'error',
      title: 'Settings Error',
      message: `Failed to ${operation}: ${error.message}`,
    });
  },

  // Handle general store errors
  handleGenericError: (error: Error, context: string) => {
    console.error(`Store error in ${context}:`, error);
    useUIStore.getState().addNotification({
      type: 'error',
      title: 'Application Error',
      message: error.message,
    });
  },
};

// Performance monitoring for stores
export const storePerformance = {
  // Monitor store operation performance
  monitorStoreOperation: <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    return operation()
      .then((result) => {
        const duration = performance.now() - startTime;
        console.log(`Store operation ${operationName} completed in ${duration.toFixed(2)}ms`);
        return result;
      })
      .catch((error) => {
        const duration = performance.now() - startTime;
        console.error(`Store operation ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
        throw error;
      });
  },

  // Get store performance metrics
  getPerformanceMetrics: () => {
    const projectState = useProjectStore.getState();
    const settingsState = useSettingsStore.getState();
    const uiState = useUIStore.getState();

    return {
      projectCount: projectState.projects.length,
      notificationCount: uiState.notifications.length,
      hasErrors: !!(projectState.error || settingsState.error),
      isLoading: projectState.isLoading || settingsState.isLoading || uiState.isLoading,
    };
  },
};