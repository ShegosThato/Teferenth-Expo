/**
 * Enhanced Data Store with Advanced Persistence
 * 
 * Provides comprehensive data management with:
 * - Enhanced state management with persistence
 * - Auto-save functionality
 * - Data versioning and migration
 * - Backup and restore capabilities
 * - Export/import functionality
 * 
 * Phase 2 Task 4: Data Management & Persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { performanceMonitor } from './performance';

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

// App settings interface
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

// Data export/import interfaces
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

interface StoreState {
  // Core data
  projects: Project[];
  settings: AppSettings;
  
  // Data operations
  addProject: (project: Project) => void;
  updateProject: (id: string, partial: Partial<Project>) => void;
  removeProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  
  // Settings management
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  // Auto-save functionality
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  saveNow: () => Promise<void>;
  
  // Export/Import functionality
  exportData: (format?: 'json' | 'pdf' | 'txt') => Promise<string>;
  importData: (data: string | ExportData) => Promise<void>;
  
  // Backup/Restore functionality
  createBackup: (type?: 'manual' | 'auto') => Promise<string>;
  restoreBackup: (backupId: string) => Promise<void>;
  listBackups: () => Promise<BackupData[]>;
  deleteBackup: (backupId: string) => Promise<void>;
  
  // Data management
  clearAllData: () => void;
  getDataSize: () => Promise<number>;
  optimizeData: () => Promise<void>;
  
  // Analytics and insights
  getProjectStats: () => {
    totalProjects: number;
    totalScenes: number;
    totalWords: number;
    averageProjectSize: number;
    projectsByStatus: Record<string, number>;
  };
}

// Default settings
const defaultSettings: AppSettings = {
  autoSave: true,
  autoSaveInterval: 5, // 5 minutes
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

// Data version for migration
const CURRENT_DATA_VERSION = 1;

// Auto-save timer
let autoSaveTimer: NodeJS.Timeout | null = null;

// Enhanced store with advanced data management
export const useStore = create<StoreState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Core data
        projects: [],
        settings: defaultSettings,

        // Data operations
        addProject: (project) => {
          const enhancedProject: Project = {
            ...project,
            updatedAt: Date.now(),
            version: CURRENT_DATA_VERSION,
            settings: {
              autoSave: true,
              backupEnabled: true,
              exportFormat: 'json',
            },
          };
          
          set((state) => ({ 
            projects: [enhancedProject, ...state.projects] 
          }));
          
          // Track performance
          performanceMonitor.startTimer('project_add');
          performanceMonitor.endTimer('project_add');
        },

        updateProject: (id, partial) => {
          const updatedPartial = {
            ...partial,
            updatedAt: Date.now(),
          };
          
          set((state) => ({
            projects: state.projects.map((p) => 
              p.id === id ? { ...p, ...updatedPartial } : p
            ),
          }));
        },

        removeProject: (id) => {
          set((state) => ({ 
            projects: state.projects.filter((p) => p.id !== id) 
          }));
        },

        duplicateProject: (id) => {
          const state = get();
          const project = state.projects.find(p => p.id === id);
          if (project) {
            const duplicatedProject: Project = {
              ...project,
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: `${project.title} (Copy)`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              status: 'draft',
              progress: 0,
              videoUrl: undefined,
            };
            
            set((state) => ({ 
              projects: [duplicatedProject, ...state.projects] 
            }));
          }
        },

        // Settings management
        updateSettings: (partial) => {
          set((state) => ({
            settings: { ...state.settings, ...partial }
          }));
          
          // Update auto-save if interval changed
          if (partial.autoSaveInterval || partial.autoSave !== undefined) {
            const newSettings = { ...get().settings, ...partial };
            if (newSettings.autoSave) {
              get().enableAutoSave();
            } else {
              get().disableAutoSave();
            }
          }
        },

        resetSettings: () => {
          set({ settings: defaultSettings });
        },

        // Auto-save functionality
        enableAutoSave: () => {
          const settings = get().settings;
          if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
          }
          
          autoSaveTimer = setInterval(() => {
            get().saveNow();
          }, settings.autoSaveInterval * 60 * 1000);
        },

        disableAutoSave: () => {
          if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
            autoSaveTimer = null;
          }
        },

        saveNow: async () => {
          try {
            const state = get();
            await AsyncStorage.setItem(
              'tefereth-projects-storage',
              JSON.stringify({
                state: {
                  projects: state.projects,
                  settings: state.settings,
                },
                version: 0,
              })
            );
            
            if (state.settings.notifications.autoSave) {
              console.log('Auto-save completed');
            }
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        },

        // Export/Import functionality
        exportData: async (format = 'json') => {
          const state = get();
          const exportData: ExportData = {
            version: '1.0.0',
            exportedAt: Date.now(),
            projects: state.projects,
            settings: state.settings,
            metadata: {
              appVersion: '1.0.0',
              totalProjects: state.projects.length,
              totalScenes: state.projects.reduce((sum, p) => sum + p.scenes.length, 0),
            },
          };

          switch (format) {
            case 'json':
              return JSON.stringify(exportData, null, 2);
            case 'txt':
              return generateTextExport(exportData);
            case 'pdf':
              // In a real implementation, you'd use a PDF library
              return JSON.stringify(exportData, null, 2);
            default:
              return JSON.stringify(exportData, null, 2);
          }
        },

        importData: async (data) => {
          try {
            let importData: ExportData;
            
            if (typeof data === 'string') {
              importData = JSON.parse(data);
            } else {
              importData = data;
            }

            // Validate import data
            if (!importData.projects || !Array.isArray(importData.projects)) {
              throw new Error('Invalid import data format');
            }

            // Migrate data if necessary
            const migratedProjects = await migrateProjects(importData.projects);

            set({
              projects: migratedProjects,
              settings: importData.settings || defaultSettings,
            });

            if (get().settings.notifications.export) {
              console.log(`Imported ${migratedProjects.length} projects`);
            }
          } catch (error) {
            console.error('Import failed:', error);
            throw error;
          }
        },

        // Backup/Restore functionality
        createBackup: async (type = 'manual') => {
          try {
            const state = get();
            const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const backupData: BackupData = {
              backupId,
              backupType: type,
              compressed: false,
              version: '1.0.0',
              exportedAt: Date.now(),
              projects: state.projects,
              settings: state.settings,
              metadata: {
                appVersion: '1.0.0',
                totalProjects: state.projects.length,
                totalScenes: state.projects.reduce((sum, p) => sum + p.scenes.length, 0),
              },
            };

            await AsyncStorage.setItem(
              `backup_${backupId}`,
              JSON.stringify(backupData)
            );

            // Cleanup old backups
            await cleanupOldBackups(state.settings.maxBackups);

            if (state.settings.notifications.backup) {
              console.log(`Backup created: ${backupId}`);
            }

            return backupId;
          } catch (error) {
            console.error('Backup creation failed:', error);
            throw error;
          }
        },

        restoreBackup: async (backupId) => {
          try {
            const backupData = await AsyncStorage.getItem(`backup_${backupId}`);
            if (!backupData) {
              throw new Error('Backup not found');
            }

            const backup: BackupData = JSON.parse(backupData);
            await get().importData(backup);

            console.log(`Backup restored: ${backupId}`);
          } catch (error) {
            console.error('Backup restore failed:', error);
            throw error;
          }
        },

        listBackups: async () => {
          try {
            const keys = await AsyncStorage.getAllKeys();
            const backupKeys = keys.filter(key => key.startsWith('backup_'));
            
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
        },

        deleteBackup: async (backupId) => {
          try {
            await AsyncStorage.removeItem(`backup_${backupId}`);
            console.log(`Backup deleted: ${backupId}`);
          } catch (error) {
            console.error('Failed to delete backup:', error);
            throw error;
          }
        },

        // Data management
        clearAllData: () => {
          set({
            projects: [],
            settings: defaultSettings,
          });
        },

        getDataSize: async () => {
          try {
            const state = get();
            const dataString = JSON.stringify({
              projects: state.projects,
              settings: state.settings,
            });
            return new Blob([dataString]).size;
          } catch (error) {
            console.error('Failed to calculate data size:', error);
            return 0;
          }
        },

        optimizeData: async () => {
          const state = get();
          const optimizedProjects = state.projects.map(project => ({
            ...project,
            scenes: project.scenes.map(scene => ({
              ...scene,
              // Remove unused metadata
              metadata: scene.metadata ? {
                wordCount: scene.metadata.wordCount,
                estimatedReadTime: scene.metadata.estimatedReadTime,
              } : undefined,
            })),
          }));

          set({ projects: optimizedProjects });
        },

        // Analytics and insights
        getProjectStats: () => {
          const state = get();
          const projects = state.projects;
          
          const totalScenes = projects.reduce((sum, p) => sum + p.scenes.length, 0);
          const totalWords = projects.reduce((sum, p) => {
            return sum + p.sourceText.split(/\s+/).length;
          }, 0);
          
          const projectsByStatus = projects.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return {
            totalProjects: projects.length,
            totalScenes,
            totalWords,
            averageProjectSize: projects.length > 0 ? totalScenes / projects.length : 0,
            projectsByStatus,
          };
        },
      }),
      {
        name: 'tefereth-projects-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ 
          projects: state.projects,
          settings: state.settings,
        }),
        version: CURRENT_DATA_VERSION,
        migrate: (persistedState: any, version: number) => {
          // Handle data migration between versions
          if (version < CURRENT_DATA_VERSION) {
            return migrateStoreData(persistedState, version);
          }
          return persistedState;
        },
      }
    )
  )
);

// Helper functions
async function migrateProjects(projects: Project[]): Promise<Project[]> {
  return projects.map(project => ({
    ...project,
    updatedAt: project.updatedAt || project.createdAt,
    version: CURRENT_DATA_VERSION,
    settings: project.settings || {
      autoSave: true,
      backupEnabled: true,
      exportFormat: 'json',
    },
  }));
}

function generateTextExport(data: ExportData): string {
  let text = `Tefereth Scripts Export\n`;
  text += `Exported: ${new Date(data.exportedAt).toLocaleString()}\n`;
  text += `Total Projects: ${data.projects.length}\n\n`;

  data.projects.forEach((project, index) => {
    text += `Project ${index + 1}: ${project.title}\n`;
    text += `Style: ${project.style}\n`;
    text += `Status: ${project.status}\n`;
    text += `Created: ${new Date(project.createdAt).toLocaleString()}\n\n`;
    text += `Source Text:\n${project.sourceText}\n\n`;
    
    if (project.scenes.length > 0) {
      text += `Scenes (${project.scenes.length}):\n`;
      project.scenes.forEach((scene, sceneIndex) => {
        text += `Scene ${sceneIndex + 1}: ${scene.text}\n`;
      });
    }
    text += '\n---\n\n';
  });

  return text;
}

async function cleanupOldBackups(maxBackups: number) {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const backupKeys = keys.filter(key => key.startsWith('backup_'));
    
    if (backupKeys.length > maxBackups) {
      // Get backup timestamps and sort
      const backupsWithTime = await Promise.all(
        backupKeys.map(async (key) => {
          const data = await AsyncStorage.getItem(key);
          const backup = data ? JSON.parse(data) : null;
          return { key, timestamp: backup?.exportedAt || 0 };
        })
      );

      // Sort by timestamp (newest first) and remove oldest
      backupsWithTime.sort((a, b) => b.timestamp - a.timestamp);
      const toDelete = backupsWithTime.slice(maxBackups);

      for (const { key } of toDelete) {
        await AsyncStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup old backups:', error);
  }
}

function migrateStoreData(persistedState: any, version: number): any {
  // Handle migration from older versions
  if (version === 0) {
    return {
      ...persistedState,
      settings: defaultSettings,
    };
  }
  return persistedState;
}

// Initialize auto-save when store is created
useStore.subscribe(
  (state) => state.settings,
  (settings) => {
    if (settings.autoSave && !autoSaveTimer) {
      useStore.getState().enableAutoSave();
    } else if (!settings.autoSave && autoSaveTimer) {
      useStore.getState().disableAutoSave();
    }
  }
);