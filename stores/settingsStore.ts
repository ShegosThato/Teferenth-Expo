/**
 * Settings Store
 * 
 * Manages application settings state using Zustand.
 * This store handles settings persistence and integrates with the SettingsService.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AppSettings, SettingsActions } from '../types';
import { settingsService } from '../services/SettingsService';
import { performanceMonitor } from '../lib/performance';

interface SettingsState extends AppSettings {
  // Loading states
  isLoading: boolean;
  error?: string;

  // Actions
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  
  // Theme actions
  updateTheme: (theme: AppSettings['theme']) => Promise<void>;
  
  // Notification actions
  updateNotificationPreferences: (notifications: Partial<AppSettings['notifications']>) => Promise<void>;
  
  // Backup actions
  updateBackupPreferences: (preferences: {
    enabled?: boolean;
    frequency?: AppSettings['backupFrequency'];
    maxBackups?: number;
  }) => Promise<void>;
  
  // Export actions
  updateExportFormat: (format: AppSettings['exportFormat']) => Promise<void>;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  clearError: () => void;
  
  // Getters
  getAutoSaveConfig: () => { enabled: boolean; intervalMinutes: number };
  getThemePreference: () => AppSettings['theme'];
  getNotificationPreferences: () => AppSettings['notifications'];
  getBackupPreferences: () => {
    enabled: boolean;
    frequency: AppSettings['backupFrequency'];
    maxBackups: number;
  };
  isFeatureEnabled: (feature: keyof AppSettings) => boolean;
}

// Default settings
const defaultSettings: AppSettings = {
  autoSave: true,
  autoSaveInterval: 5,
  backupEnabled: true,
  backupFrequency: 'weekly',
  maxBackups: 5,
  exportFormat: 'json',
  theme: 'system',
  notifications: {
    autoSave: true,
    backup: true,
    export: true,
  },
};

export const useSettingsStore = create<SettingsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state (will be loaded from service)
    ...defaultSettings,
    isLoading: false,
    error: undefined,

    // Actions
    updateSettings: async (updates) => {
      const startTime = performance.now();
      set({ isLoading: true, error: undefined });
      
      try {
        await settingsService.updateSettings(updates);
        const newSettings = settingsService.getSettings();
        
        set({
          ...newSettings,
          isLoading: false,
        });

        performanceMonitor.trackOperation('store_update_settings', performance.now() - startTime);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
        set({ error: errorMessage, isLoading: false });
        performanceMonitor.trackError('store_update_settings_failed', error as Error);
        throw error;
      }
    },

    resetSettings: async () => {
      const startTime = performance.now();
      set({ isLoading: true, error: undefined });
      
      try {
        await settingsService.resetSettings();
        const newSettings = settingsService.getSettings();
        
        set({
          ...newSettings,
          isLoading: false,
        });

        performanceMonitor.trackOperation('store_reset_settings', performance.now() - startTime);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to reset settings';
        set({ error: errorMessage, isLoading: false });
        performanceMonitor.trackError('store_reset_settings_failed', error as Error);
        throw error;
      }
    },

    enableAutoSave: () => {
      settingsService.enableAutoSave();
      set({ autoSave: true });
    },

    disableAutoSave: () => {
      settingsService.disableAutoSave();
      set({ autoSave: false });
    },

    updateTheme: async (theme) => {
      try {
        await settingsService.updateTheme(theme);
        set({ theme });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update theme';
        set({ error: errorMessage });
        throw error;
      }
    },

    updateNotificationPreferences: async (notifications) => {
      try {
        await settingsService.updateNotificationPreferences(notifications);
        const currentState = get();
        set({
          notifications: {
            ...currentState.notifications,
            ...notifications,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update notification preferences';
        set({ error: errorMessage });
        throw error;
      }
    },

    updateBackupPreferences: async (preferences) => {
      try {
        await settingsService.updateBackupPreferences(preferences);
        set({
          backupEnabled: preferences.enabled ?? get().backupEnabled,
          backupFrequency: preferences.frequency ?? get().backupFrequency,
          maxBackups: preferences.maxBackups ?? get().maxBackups,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update backup preferences';
        set({ error: errorMessage });
        throw error;
      }
    },

    updateExportFormat: async (format) => {
      try {
        await settingsService.updateExportPreferences(format);
        set({ exportFormat: format });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update export format';
        set({ error: errorMessage });
        throw error;
      }
    },

    // Utility actions
    setLoading: (loading) => {
      set({ isLoading: loading });
    },

    setError: (error) => {
      set({ error });
    },

    clearError: () => {
      set({ error: undefined });
    },

    // Getters
    getAutoSaveConfig: () => {
      const state = get();
      return {
        enabled: state.autoSave,
        intervalMinutes: state.autoSaveInterval,
      };
    },

    getThemePreference: () => {
      return get().theme;
    },

    getNotificationPreferences: () => {
      return { ...get().notifications };
    },

    getBackupPreferences: () => {
      const state = get();
      return {
        enabled: state.backupEnabled,
        frequency: state.backupFrequency,
        maxBackups: state.maxBackups,
      };
    },

    isFeatureEnabled: (feature) => {
      return Boolean(get()[feature]);
    },
  }))
);

// Initialize settings from service
useSettingsStore.getState().updateSettings(settingsService.getSettings());

// Selectors for better performance
export const settingsSelectors = {
  // Theme selectors
  theme: (state: SettingsState) => state.theme,
  isDarkMode: (state: SettingsState) => state.theme === 'dark',
  isSystemTheme: (state: SettingsState) => state.theme === 'system',
  
  // Auto-save selectors
  autoSaveEnabled: (state: SettingsState) => state.autoSave,
  autoSaveInterval: (state: SettingsState) => state.autoSaveInterval,
  
  // Backup selectors
  backupEnabled: (state: SettingsState) => state.backupEnabled,
  backupFrequency: (state: SettingsState) => state.backupFrequency,
  maxBackups: (state: SettingsState) => state.maxBackups,
  
  // Notification selectors
  notifications: (state: SettingsState) => state.notifications,
  autoSaveNotifications: (state: SettingsState) => state.notifications.autoSave,
  backupNotifications: (state: SettingsState) => state.notifications.backup,
  exportNotifications: (state: SettingsState) => state.notifications.export,
  
  // Export selectors
  exportFormat: (state: SettingsState) => state.exportFormat,
  
  // Loading state selectors
  isLoading: (state: SettingsState) => state.isLoading,
  error: (state: SettingsState) => state.error,
};

// Hooks for specific settings
export const useThemePreference = () => {
  return useSettingsStore(settingsSelectors.theme);
};

export const useAutoSaveConfig = () => {
  return useSettingsStore((state) => state.getAutoSaveConfig());
};

export const useNotificationPreferences = () => {
  return useSettingsStore(settingsSelectors.notifications);
};

export const useBackupPreferences = () => {
  return useSettingsStore((state) => state.getBackupPreferences());
};