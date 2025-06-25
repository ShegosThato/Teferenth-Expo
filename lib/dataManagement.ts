/**
 * Data Management Utilities
 * 
 * Provides file system operations, data synchronization,
 * and advanced data management features.
 * 
 * Phase 2 Task 4: Data Management & Persistence
 */

import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { ExportData, BackupData, Project } from './store';
import { toast } from './toast';

// File system paths
const DATA_DIRECTORY = `${FileSystem.documentDirectory}tefereth_data/`;
const BACKUP_DIRECTORY = `${DATA_DIRECTORY}backups/`;
const EXPORT_DIRECTORY = `${DATA_DIRECTORY}exports/`;

// Data management class
export class DataManager {
  private static initialized = false;

  // Initialize data directories
  static async initialize() {
    if (this.initialized) return;

    try {
      // Create directories if they don't exist
      await this.ensureDirectoryExists(DATA_DIRECTORY);
      await this.ensureDirectoryExists(BACKUP_DIRECTORY);
      await this.ensureDirectoryExists(EXPORT_DIRECTORY);
      
      this.initialized = true;
      console.log('Data manager initialized');
    } catch (error) {
      console.error('Failed to initialize data manager:', error);
    }
  }

  private static async ensureDirectoryExists(path: string) {
    const dirInfo = await FileSystem.getInfoAsync(path);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(path, { intermediates: true });
    }
  }

  // Export data to file
  static async exportToFile(
    data: ExportData,
    format: 'json' | 'txt' | 'pdf' = 'json',
    filename?: string
  ): Promise<string> {
    await this.initialize();

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultFilename = `tefereth_export_${timestamp}`;
      const finalFilename = filename || defaultFilename;
      
      let content: string;
      let extension: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          extension = 'json';
          mimeType = 'application/json';
          break;
        case 'txt':
          content = this.generateTextExport(data);
          extension = 'txt';
          mimeType = 'text/plain';
          break;
        case 'pdf':
          // For now, export as JSON. In a real app, you'd use a PDF library
          content = JSON.stringify(data, null, 2);
          extension = 'json';
          mimeType = 'application/json';
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      const filePath = `${EXPORT_DIRECTORY}${finalFilename}.${extension}`;
      await FileSystem.writeAsStringAsync(filePath, content);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType,
          dialogTitle: 'Export Tefereth Scripts Data',
        });
      }

      return filePath;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  // Import data from file
  static async importFromFile(): Promise<ExportData | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      const fileUri = result.assets?.[0]?.uri;
      if (!fileUri) {
        throw new Error('No file selected');
      }

      const content = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(content) as ExportData;

      // Validate import data
      if (!data.projects || !Array.isArray(data.projects)) {
        throw new Error('Invalid import file format');
      }

      return data;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  // Save backup to file system
  static async saveBackup(backup: BackupData): Promise<string> {
    await this.initialize();

    try {
      const filename = `backup_${backup.backupId}.json`;
      const filePath = `${BACKUP_DIRECTORY}${filename}`;
      
      const content = JSON.stringify(backup, null, 2);
      await FileSystem.writeAsStringAsync(filePath, content);

      return filePath;
    } catch (error) {
      console.error('Failed to save backup:', error);
      throw error;
    }
  }

  // Load backup from file system
  static async loadBackup(backupId: string): Promise<BackupData | null> {
    await this.initialize();

    try {
      const filename = `backup_${backupId}.json`;
      const filePath = `${BACKUP_DIRECTORY}${filename}`;
      
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        return null;
      }

      const content = await FileSystem.readAsStringAsync(filePath);
      return JSON.parse(content) as BackupData;
    } catch (error) {
      console.error('Failed to load backup:', error);
      return null;
    }
  }

  // List all backups
  static async listBackups(): Promise<BackupData[]> {
    await this.initialize();

    try {
      const files = await FileSystem.readDirectoryAsync(BACKUP_DIRECTORY);
      const backupFiles = files.filter(file => file.startsWith('backup_') && file.endsWith('.json'));
      
      const backups: BackupData[] = [];
      for (const file of backupFiles) {
        try {
          const content = await FileSystem.readAsStringAsync(`${BACKUP_DIRECTORY}${file}`);
          const backup = JSON.parse(content) as BackupData;
          backups.push(backup);
        } catch (error) {
          console.warn(`Failed to read backup file: ${file}`, error);
        }
      }

      return backups.sort((a, b) => b.exportedAt - a.exportedAt);
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  // Delete backup
  static async deleteBackup(backupId: string): Promise<void> {
    await this.initialize();

    try {
      const filename = `backup_${backupId}.json`;
      const filePath = `${BACKUP_DIRECTORY}${filename}`;
      
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }

  // Get data directory size
  static async getDataSize(): Promise<number> {
    await this.initialize();

    try {
      let totalSize = 0;
      
      const directories = [DATA_DIRECTORY, BACKUP_DIRECTORY, EXPORT_DIRECTORY];
      
      for (const dir of directories) {
        const files = await FileSystem.readDirectoryAsync(dir);
        for (const file of files) {
          const fileInfo = await FileSystem.getInfoAsync(`${dir}${file}`);
          if (fileInfo.exists && !fileInfo.isDirectory) {
            totalSize += fileInfo.size || 0;
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate data size:', error);
      return 0;
    }
  }

  // Clean up old files
  static async cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    await this.initialize();

    try {
      const now = Date.now();
      const directories = [BACKUP_DIRECTORY, EXPORT_DIRECTORY];

      for (const dir of directories) {
        const files = await FileSystem.readDirectoryAsync(dir);
        
        for (const file of files) {
          const filePath = `${dir}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (fileInfo.exists && fileInfo.modificationTime) {
            const fileAge = now - fileInfo.modificationTime * 1000;
            
            if (fileAge > maxAge) {
              await FileSystem.deleteAsync(filePath);
              console.log(`Cleaned up old file: ${file}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  // Generate text export
  private static generateTextExport(data: ExportData): string {
    let text = `Tefereth Scripts Export\n`;
    text += `Exported: ${new Date(data.exportedAt).toLocaleString()}\n`;
    text += `Total Projects: ${data.projects.length}\n\n`;

    data.projects.forEach((project, index) => {
      text += `Project ${index + 1}: ${project.title}\n`;
      text += `Style: ${project.style}\n`;
      text += `Status: ${project.status}\n`;
      text += `Created: ${new Date(project.createdAt).toLocaleString()}\n`;
      if (project.updatedAt) {
        text += `Updated: ${new Date(project.updatedAt).toLocaleString()}\n`;
      }
      text += `\nSource Text:\n${project.sourceText}\n\n`;
      
      if (project.scenes.length > 0) {
        text += `Scenes (${project.scenes.length}):\n`;
        project.scenes.forEach((scene, sceneIndex) => {
          text += `Scene ${sceneIndex + 1}: ${scene.text}\n`;
          if (scene.imagePrompt) {
            text += `Image Prompt: ${scene.imagePrompt}\n`;
          }
        });
      }
      text += '\n---\n\n';
    });

    return text;
  }
}

// Sync manager for data synchronization
export class SyncManager {
  private static syncInProgress = false;
  private static lastSyncTime = 0;

  // Sync data with cloud storage (placeholder)
  static async syncToCloud(data: ExportData): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    this.syncInProgress = true;

    try {
      // In a real implementation, you'd sync with cloud storage
      // like Firebase, AWS S3, or Google Drive
      
      console.log('Syncing data to cloud...');
      
      // Simulate cloud sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.lastSyncTime = Date.now();
      console.log('Data synced to cloud successfully');
      
    } catch (error) {
      console.error('Cloud sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync data from cloud storage (placeholder)
  static async syncFromCloud(): Promise<ExportData | null> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return null;
    }

    this.syncInProgress = true;

    try {
      // In a real implementation, you'd fetch from cloud storage
      console.log('Syncing data from cloud...');
      
      // Simulate cloud sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return null for now (no cloud data)
      return null;
      
    } catch (error) {
      console.error('Cloud sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Check if sync is needed
  static shouldSync(lastModified: number): boolean {
    const syncInterval = 5 * 60 * 1000; // 5 minutes
    return Date.now() - Math.max(lastModified, this.lastSyncTime) > syncInterval;
  }

  // Get sync status
  static getSyncStatus() {
    return {
      inProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      needsSync: this.shouldSync(this.lastSyncTime),
    };
  }
}

// Auto-save manager
export class AutoSaveManager {
  private static saveTimer: NodeJS.Timeout | null = null;
  private static pendingChanges = false;

  // Start auto-save
  static start(interval: number, saveCallback: () => Promise<void>) {
    this.stop(); // Stop existing timer

    this.saveTimer = setInterval(async () => {
      if (this.pendingChanges) {
        try {
          await saveCallback();
          this.pendingChanges = false;
          console.log('Auto-save completed');
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, interval);
  }

  // Stop auto-save
  static stop() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  // Mark changes as pending
  static markPendingChanges() {
    this.pendingChanges = true;
  }

  // Force save now
  static async saveNow(saveCallback: () => Promise<void>) {
    try {
      await saveCallback();
      this.pendingChanges = false;
      console.log('Manual save completed');
    } catch (error) {
      console.error('Manual save failed:', error);
      throw error;
    }
  }

  // Get auto-save status
  static getStatus() {
    return {
      active: this.saveTimer !== null,
      pendingChanges: this.pendingChanges,
    };
  }
}

// Data validation utilities
export class DataValidator {
  // Validate project data
  static validateProject(project: any): project is Project {
    return (
      typeof project === 'object' &&
      typeof project.id === 'string' &&
      typeof project.title === 'string' &&
      typeof project.sourceText === 'string' &&
      typeof project.style === 'string' &&
      Array.isArray(project.scenes) &&
      typeof project.status === 'string' &&
      typeof project.progress === 'number' &&
      typeof project.createdAt === 'number'
    );
  }

  // Validate export data
  static validateExportData(data: any): data is ExportData {
    return (
      typeof data === 'object' &&
      typeof data.version === 'string' &&
      typeof data.exportedAt === 'number' &&
      Array.isArray(data.projects) &&
      data.projects.every((project: any) => this.validateProject(project))
    );
  }

  // Sanitize project data
  static sanitizeProject(project: any): Project {
    return {
      id: String(project.id || ''),
      title: String(project.title || 'Untitled'),
      sourceText: String(project.sourceText || ''),
      style: String(project.style || 'Cinematic'),
      scenes: Array.isArray(project.scenes) ? project.scenes : [],
      status: ['draft', 'storyboard', 'rendering', 'completed'].includes(project.status) 
        ? project.status : 'draft',
      progress: Math.max(0, Math.min(1, Number(project.progress) || 0)),
      videoUrl: project.videoUrl ? String(project.videoUrl) : undefined,
      createdAt: Number(project.createdAt) || Date.now(),
      updatedAt: Number(project.updatedAt) || Date.now(),
      version: Number(project.version) || 1,
      metadata: project.metadata || {},
      settings: project.settings || {
        autoSave: true,
        backupEnabled: true,
        exportFormat: 'json',
      },
    };
  }
}

// Add required dependencies to package.json
export const REQUIRED_DEPENDENCIES = [
  'expo-file-system',
  'expo-sharing',
  'expo-document-picker',
];