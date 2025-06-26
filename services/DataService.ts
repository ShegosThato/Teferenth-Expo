/**
 * Data Service
 * 
 * Handles data export, import, backup, and restoration operations.
 * This service manages data persistence and provides data management utilities.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExportData, BackupData, DataService as IDataService, AppSettings, Project } from '../types';
import { performanceMonitor } from '../lib/performance';

class DataService implements IDataService {
  private readonly BACKUP_PREFIX = 'backup_';
  private readonly STORAGE_KEY = 'tefereth-projects-storage';

  /**
   * Exports application data in the specified format
   */
  async exportData(format: 'json' | 'pdf' | 'txt' = 'json'): Promise<string> {
    const startTime = performance.now();
    
    try {
      const data = await this.getAllAppData();
      
      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: Date.now(),
        projects: data.projects,
        settings: data.settings,
        metadata: {
          appVersion: '1.0.0', // This should come from app config
          totalProjects: data.projects.length,
          totalScenes: data.projects.reduce((sum, p) => sum + p.scenes.length, 0),
        },
      };

      let result: string;
      
      switch (format) {
        case 'json':
          result = JSON.stringify(exportData, null, 2);
          break;
        case 'txt':
          result = this.formatAsText(exportData);
          break;
        case 'pdf':
          result = this.formatAsPDF(exportData);
          break;
        default:
          result = JSON.stringify(exportData, null, 2);
      }

      performanceMonitor.trackOperation('data_export', performance.now() - startTime);
      return result;
    } catch (error) {
      performanceMonitor.trackError('data_export_failed', error as Error);
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Imports application data from a string or ExportData object
   */
  async importData(data: string | ExportData): Promise<void> {
    const startTime = performance.now();
    
    try {
      let importData: ExportData;
      
      if (typeof data === 'string') {
        importData = JSON.parse(data);
      } else {
        importData = data;
      }

      // Validate import data
      this.validateImportData(importData);

      // Store the imported data
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          state: {
            projects: importData.projects,
            settings: importData.settings,
          },
          version: 0,
        })
      );

      performanceMonitor.trackOperation('data_import', performance.now() - startTime);
    } catch (error) {
      performanceMonitor.trackError('data_import_failed', error as Error);
      throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a backup of the current application data
   */
  async createBackup(type: 'manual' | 'auto' = 'manual'): Promise<string> {
    const startTime = performance.now();
    
    try {
      const data = await this.getAllAppData();
      const backupId = this.generateBackupId();
      
      const backup: BackupData = {
        backupId,
        backupType: type,
        compressed: false,
        version: '1.0.0',
        exportedAt: Date.now(),
        projects: data.projects,
        settings: data.settings,
        metadata: {
          appVersion: '1.0.0',
          totalProjects: data.projects.length,
          totalScenes: data.projects.reduce((sum, p) => sum + p.scenes.length, 0),
        },
      };

      await AsyncStorage.setItem(
        `${this.BACKUP_PREFIX}${backupId}`,
        JSON.stringify(backup)
      );

      // Clean up old backups if necessary
      await this.cleanupOldBackups();

      performanceMonitor.trackOperation('backup_create', performance.now() - startTime);
      return backupId;
    } catch (error) {
      performanceMonitor.trackError('backup_create_failed', error as Error);
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restores application data from a backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      const backupData = await AsyncStorage.getItem(`${this.BACKUP_PREFIX}${backupId}`);
      
      if (!backupData) {
        throw new Error('Backup not found');
      }

      const backup: BackupData = JSON.parse(backupData);
      await this.importData(backup);

      performanceMonitor.trackOperation('backup_restore', performance.now() - startTime);
    } catch (error) {
      performanceMonitor.trackError('backup_restore_failed', error as Error);
      throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lists all available backups
   */
  async listBackups(): Promise<BackupData[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter(key => key.startsWith(this.BACKUP_PREFIX));
      
      const backups: BackupData[] = [];
      for (const key of backupKeys) {
        const backupData = await AsyncStorage.getItem(key);
        if (backupData) {
          backups.push(JSON.parse(backupData));
        }
      }

      return backups.sort((a, b) => b.exportedAt - a.exportedAt);
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Deletes a specific backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.BACKUP_PREFIX}${backupId}`);
    } catch (error) {
      throw new Error(`Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculates the total size of stored data
   */
  async getDataSize(): Promise<number> {
    try {
      const data = await this.getAllAppData();
      const dataString = JSON.stringify({
        projects: data.projects,
        settings: data.settings,
      });
      
      // Calculate size in bytes (approximate)
      return new Blob([dataString]).size;
    } catch (error) {
      console.error('Failed to calculate data size:', error);
      return 0;
    }
  }

  /**
   * Optimizes stored data by removing unnecessary information
   */
  async optimizeData(): Promise<void> {
    try {
      const data = await this.getAllAppData();
      
      const optimizedProjects = data.projects.map(project => ({
        ...project,
        scenes: project.scenes.map(scene => ({
          ...scene,
          metadata: scene.metadata ? {
            wordCount: scene.metadata.wordCount,
            estimatedReadTime: scene.metadata.estimatedReadTime,
          } : undefined,
        })),
      }));

      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          state: {
            projects: optimizedProjects,
            settings: data.settings,
          },
          version: 0,
        })
      );
    } catch (error) {
      throw new Error(`Failed to optimize data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves all application data from storage
   */
  private async getAllAppData(): Promise<{ projects: Project[]; settings: AppSettings }> {
    const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
    
    if (!storedData) {
      return {
        projects: [],
        settings: this.getDefaultSettings(),
      };
    }

    const parsed = JSON.parse(storedData);
    return {
      projects: parsed.state?.projects || [],
      settings: parsed.state?.settings || this.getDefaultSettings(),
    };
  }

  /**
   * Validates import data structure
   */
  private validateImportData(data: ExportData): void {
    if (!data.version) {
      throw new Error('Import data is missing version information');
    }

    if (!Array.isArray(data.projects)) {
      throw new Error('Import data projects must be an array');
    }

    if (!data.settings) {
      throw new Error('Import data is missing settings');
    }

    // Validate each project
    data.projects.forEach((project, index) => {
      if (!project.id || !project.title || !project.sourceText) {
        throw new Error(`Project ${index + 1} is missing required fields`);
      }
    });
  }

  /**
   * Formats export data as plain text
   */
  private formatAsText(data: ExportData): string {
    let text = `Tefereth Scripts Export\n`;
    text += `Exported: ${new Date(data.exportedAt).toLocaleString()}\n`;
    text += `Total Projects: ${data.metadata.totalProjects}\n`;
    text += `Total Scenes: ${data.metadata.totalScenes}\n\n`;

    data.projects.forEach((project, index) => {
      text += `Project ${index + 1}: ${project.title}\n`;
      text += `Status: ${project.status}\n`;
      text += `Style: ${project.style}\n`;
      text += `Created: ${new Date(project.createdAt).toLocaleString()}\n\n`;
      text += `Source Text:\n${project.sourceText}\n\n`;
      
      if (project.scenes.length > 0) {
        text += `Scenes (${project.scenes.length}):\n`;
        project.scenes.forEach((scene, sceneIndex) => {
          text += `  Scene ${sceneIndex + 1}: ${scene.text}\n`;
        });
        text += '\n';
      }
      
      text += '---\n\n';
    });

    return text;
  }

  /**
   * Formats export data for PDF (returns structured data for PDF generation)
   */
  private formatAsPDF(data: ExportData): string {
    // This would typically return structured data for PDF generation
    // For now, we'll return JSON that can be processed by a PDF library
    return JSON.stringify({
      title: 'Tefereth Scripts Export',
      exportDate: new Date(data.exportedAt).toLocaleString(),
      summary: data.metadata,
      projects: data.projects.map(project => ({
        title: project.title,
        status: project.status,
        style: project.style,
        createdDate: new Date(project.createdAt).toLocaleString(),
        sourceText: project.sourceText,
        scenes: project.scenes,
      })),
    }, null, 2);
  }

  /**
   * Generates a unique backup ID
   */
  private generateBackupId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleans up old backups based on settings
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const maxBackups = 5; // This should come from settings
      
      if (backups.length > maxBackups) {
        const backupsToDelete = backups.slice(maxBackups);
        
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.backupId);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Returns default application settings
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
}

export const dataService = new DataService();