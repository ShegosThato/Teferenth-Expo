/**
 * Settings Service
 * 
 * Handles application settings management, auto-save functionality,
 * and user preferences persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, SettingsService as ISettingsService } from '../types';
import { performanceMonitor } from '../lib/performance';

class SettingsService implements ISettingsService {
  private readonly SETTINGS_KEY = 'tefereth-settings';
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private currentSettings: AppSettings;

  constructor() {
    this.currentSettings = this.getDefaultSettings();
    this.loadSettings();
  }

  /**
   * Gets current settings
   */
  getSettings(): AppSettings {
    return { ...this.currentSettings };
  }

  /**
   * Updates settings with new values
   */
  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    const startTime = performance.now();
    
    try {
      const newSettings = { ...this.currentSettings, ...updates };
      
      // Validate settings
      this.validateSettings(newSettings);
      
      // Update current settings
      this.currentSettings = newSettings;
      
      // Persist to storage
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings));
      
      // Handle auto-save changes
      if (updates.autoSave !== undefined || updates.autoSaveInterval !== undefined) {
        if (newSettings.autoSave) {
          this.enableAutoSave();
        } else {
          this.disableAutoSave();
        }
      }

      performanceMonitor.trackOperation('settings_update', performance.now() - startTime);
    } catch (error) {
      performanceMonitor.trackError('settings_update_failed', error as Error);
      throw new Error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resets settings to default values
   */
  async resetSettings(): Promise<void> {
    try {
      const defaultSettings = this.getDefaultSettings();
      await this.updateSettings(defaultSettings);
    } catch (error) {
      throw new Error(`Failed to reset settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enables auto-save functionality
   */
  enableAutoSave(): void {
    this.disableAutoSave(); // Clear existing timer
    
    const intervalMs = this.currentSettings.autoSaveInterval * 60 * 1000;
    
    this.autoSaveTimer = setInterval(() => {
      this.performAutoSave();
    }, intervalMs);
    
    console.log(`Auto-save enabled with ${this.currentSettings.autoSaveInterval} minute interval`);
  }

  /**
   * Disables auto-save functionality
   */
  disableAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('Auto-save disabled');
    }
  }

  /**
   * Gets theme preference with system detection
   */
  getThemePreference(): 'light' | 'dark' | 'system' {
    return this.currentSettings.theme;
  }

  /**
   * Updates theme preference
   */
  async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.updateSettings({ theme });
  }

  /**
   * Gets notification preferences
   */
  getNotificationPreferences(): AppSettings['notifications'] {
    return { ...this.currentSettings.notifications };
  }

  /**
   * Updates notification preferences
   */
  async updateNotificationPreferences(notifications: Partial<AppSettings['notifications']>): Promise<void> {
    await this.updateSettings({
      notifications: {
        ...this.currentSettings.notifications,
        ...notifications,
      },
    });
  }

  /**
   * Gets backup preferences
   */
  getBackupPreferences(): {
    enabled: boolean;
    frequency: AppSettings['backupFrequency'];
    maxBackups: number;
  } {
    return {
      enabled: this.currentSettings.backupEnabled,
      frequency: this.currentSettings.backupFrequency,
      maxBackups: this.currentSettings.maxBackups,
    };
  }

  /**
   * Updates backup preferences
   */
  async updateBackupPreferences(preferences: {
    enabled?: boolean;
    frequency?: AppSettings['backupFrequency'];
    maxBackups?: number;
  }): Promise<void> {
    await this.updateSettings({
      backupEnabled: preferences.enabled,
      backupFrequency: preferences.frequency,
      maxBackups: preferences.maxBackups,
    });
  }

  /**
   * Gets export preferences
   */
  getExportPreferences(): {
    format: AppSettings['exportFormat'];
  } {
    return {
      format: this.currentSettings.exportFormat,
    };
  }

  /**
   * Updates export preferences
   */
  async updateExportPreferences(format: AppSettings['exportFormat']): Promise<void> {
    await this.updateSettings({ exportFormat: format });
  }

  /**
   * Checks if a feature is enabled
   */
  isFeatureEnabled(feature: keyof AppSettings): boolean {
    return Boolean(this.currentSettings[feature]);
  }

  /**
   * Gets auto-save configuration
   */
  getAutoSaveConfig(): {
    enabled: boolean;
    intervalMinutes: number;
  } {
    return {
      enabled: this.currentSettings.autoSave,
      intervalMinutes: this.currentSettings.autoSaveInterval,
    };
  }

  /**
   * Loads settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const storedSettings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        this.currentSettings = { ...this.getDefaultSettings(), ...parsed };
        
        // Initialize auto-save if enabled
        if (this.currentSettings.autoSave) {
          this.enableAutoSave();
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use default settings if loading fails
      this.currentSettings = this.getDefaultSettings();
    }
  }

  /**
   * Validates settings object
   */
  private validateSettings(settings: AppSettings): void {
    if (settings.autoSaveInterval < 1 || settings.autoSaveInterval > 60) {
      throw new Error('Auto-save interval must be between 1 and 60 minutes');
    }

    if (settings.maxBackups < 1 || settings.maxBackups > 50) {
      throw new Error('Max backups must be between 1 and 50');
    }

    if (!['light', 'dark', 'system'].includes(settings.theme)) {
      throw new Error('Invalid theme setting');
    }

    if (!['daily', 'weekly', 'monthly'].includes(settings.backupFrequency)) {
      throw new Error('Invalid backup frequency');
    }

    if (!['json', 'pdf', 'txt'].includes(settings.exportFormat)) {
      throw new Error('Invalid export format');
    }
  }

  /**
   * Performs auto-save operation
   */
  private async performAutoSave(): Promise<void> {
    try {
      // This would typically trigger a save operation in the store
      // For now, we'll just log the auto-save attempt
      if (this.currentSettings.notifications.autoSave) {
        console.log('Auto-save triggered');
      }
      
      // In a real implementation, this would call the store's saveNow method
      // or emit an event that the store listens to
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  /**
   * Returns default settings
   */
  private getDefaultSettings(): AppSettings {
    return {
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
  }

  /**
   * Cleanup method to be called when the service is destroyed
   */
  destroy(): void {
    this.disableAutoSave();
  }
}

export const settingsService = new SettingsService();