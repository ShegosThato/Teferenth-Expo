/**
 * Settings Screen
 * 
 * Provides comprehensive settings management including:
 * - Data management preferences
 * - Auto-save configuration
 * - Backup and restore options
 * - Export/import functionality
 * - App preferences
 * 
 * Phase 2 Task 4: Data Management & Persistence
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { useStore, AppSettings, BackupData } from '../lib/store';
import { DataManager, SyncManager, AutoSaveManager } from '../lib/dataManagement';
import { EnhancedButton, EnhancedCard, ThemeToggle } from '../components/EnhancedUI';
import { toast } from '../lib/toast';
import { performanceMonitor } from '../lib/performance';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { settings, updateSettings, createBackup, listBackups, restoreBackup, exportData, getProjectStats, getDataSize } = useStore();
  
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [dataSize, setDataSize] = useState(0);
  const [syncStatus, setSyncStatus] = useState(SyncManager.getSyncStatus());
  const [autoSaveStatus, setAutoSaveStatus] = useState(AutoSaveManager.getStatus());

  useEffect(() => {
    loadData();
    performanceMonitor.trackScreenLoad('SettingsScreen');
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load backups
      const backupList = await listBackups();
      setBackups(backupList);
      
      // Get data size
      const size = await getDataSize();
      setDataSize(size);
      
      // Update status
      setSyncStatus(SyncManager.getSyncStatus());
      setAutoSaveStatus(AutoSaveManager.getStatus());
      
    } catch (error) {
      console.error('Failed to load settings data:', error);
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSaveToggle = (enabled: boolean) => {
    updateSettings({ autoSave: enabled });
    
    if (enabled) {
      AutoSaveManager.start(
        settings.autoSaveInterval * 60 * 1000,
        async () => {
          await useStore.getState().saveNow();
        }
      );
    } else {
      AutoSaveManager.stop();
    }
    
    setAutoSaveStatus(AutoSaveManager.getStatus());
  };

  const handleAutoSaveIntervalChange = (interval: number) => {
    updateSettings({ autoSaveInterval: interval });
    
    if (settings.autoSave) {
      // Restart auto-save with new interval
      handleAutoSaveToggle(false);
      setTimeout(() => handleAutoSaveToggle(true), 100);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const backupId = await createBackup('manual');
      toast.success('Backup created successfully', `Backup ID: ${backupId.slice(-8)}`);
      await loadData();
    } catch (error) {
      console.error('Backup creation failed:', error);
      toast.error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = (backup: BackupData) => {
    Alert.alert(
      'Restore Backup',
      `This will replace all current data with the backup from ${new Date(backup.exportedAt).toLocaleString()}. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await restoreBackup(backup.backupId);
              toast.success('Backup restored successfully');
              await loadData();
            } catch (error) {
              console.error('Backup restore failed:', error);
              toast.error('Failed to restore backup');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = async (format: 'json' | 'txt' | 'pdf' = 'json') => {
    try {
      setLoading(true);
      const exportedData = await exportData(format);
      
      // Save to file and share
      await DataManager.exportToFile(
        JSON.parse(exportedData),
        format,
        `tefereth_export_${new Date().toISOString().split('T')[0]}`
      );
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    try {
      setLoading(true);
      const importData = await DataManager.importFromFile();
      
      if (importData) {
        Alert.alert(
          'Import Data',
          `This will replace all current data with ${importData.projects.length} projects from the import file. This action cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Import',
              style: 'destructive',
              onPress: async () => {
                try {
                  await useStore.getState().importData(importData);
                  toast.success('Data imported successfully');
                  await loadData();
                } catch (error) {
                  console.error('Import failed:', error);
                  toast.error('Failed to import data');
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToCloud = async () => {
    try {
      setLoading(true);
      const data = await exportData();
      await SyncManager.syncToCloud(JSON.parse(data));
      setSyncStatus(SyncManager.getSyncStatus());
      toast.success('Data synced to cloud');
    } catch (error) {
      console.error('Cloud sync failed:', error);
      toast.error('Failed to sync to cloud');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = getProjectStats();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
        <ThemeToggle />
      </View>

      {/* Data Overview */}
      <EnhancedCard style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Data Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.totalProjects}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Projects</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.totalScenes}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Scenes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{formatBytes(dataSize)}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Data Size</Text>
          </View>
        </View>
      </EnhancedCard>

      {/* Auto-Save Settings */}
      <EnhancedCard style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Auto-Save</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Enable Auto-Save</Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textMuted }]}>
              Automatically save changes every {settings.autoSaveInterval} minutes
            </Text>
          </View>
          <Switch
            value={settings.autoSave}
            onValueChange={handleAutoSaveToggle}
            trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
            thumbColor={settings.autoSave ? theme.colors.primary : theme.colors.textMuted}
          />
        </View>

        {settings.autoSave && (
          <View style={styles.intervalButtons}>
            <Text style={[styles.settingLabel, { color: theme.colors.text, marginBottom: 8 }]}>
              Auto-Save Interval
            </Text>
            <View style={styles.buttonRow}>
              {[1, 5, 10, 15].map((interval) => (
                <EnhancedButton
                  key={interval}
                  title={`${interval}m`}
                  variant={settings.autoSaveInterval === interval ? 'primary' : 'outline'}
                  size="sm"
                  onPress={() => handleAutoSaveIntervalChange(interval)}
                  style={styles.intervalButton}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.statusRow}>
          <Ionicons 
            name={autoSaveStatus.active ? 'checkmark-circle' : 'pause-circle'} 
            size={16} 
            color={autoSaveStatus.active ? theme.colors.success : theme.colors.textMuted} 
          />
          <Text style={[styles.statusText, { color: theme.colors.textMuted }]}>
            {autoSaveStatus.active ? 'Auto-save active' : 'Auto-save disabled'}
            {autoSaveStatus.pendingChanges && ' • Changes pending'}
          </Text>
        </View>
      </EnhancedCard>

      {/* Backup & Restore */}
      <EnhancedCard style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Backup & Restore</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Enable Backups</Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textMuted }]}>
              Automatically create backups {settings.backupFrequency}
            </Text>
          </View>
          <Switch
            value={settings.backupEnabled}
            onValueChange={(enabled) => updateSettings({ backupEnabled: enabled })}
            trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
            thumbColor={settings.backupEnabled ? theme.colors.primary : theme.colors.textMuted}
          />
        </View>

        <EnhancedButton
          title="Create Backup Now"
          variant="outline"
          icon="archive-outline"
          onPress={handleCreateBackup}
          loading={loading}
          style={styles.actionButton}
        />

        {backups.length > 0 && (
          <View style={styles.backupList}>
            <Text style={[styles.settingLabel, { color: theme.colors.text, marginBottom: 8 }]}>
              Recent Backups ({backups.length})
            </Text>
            {backups.slice(0, 3).map((backup) => (
              <View key={backup.backupId} style={[styles.backupItem, { borderColor: theme.colors.border }]}>
                <View style={styles.backupInfo}>
                  <Text style={[styles.backupDate, { color: theme.colors.text }]}>
                    {new Date(backup.exportedAt).toLocaleString()}
                  </Text>
                  <Text style={[styles.backupDetails, { color: theme.colors.textMuted }]}>
                    {backup.metadata.totalProjects} projects • {backup.backupType}
                  </Text>
                </View>
                <EnhancedButton
                  title="Restore"
                  variant="ghost"
                  size="sm"
                  onPress={() => handleRestoreBackup(backup)}
                />
              </View>
            ))}
          </View>
        )}
      </EnhancedCard>

      {/* Export & Import */}
      <EnhancedCard style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Export & Import</Text>
        
        <View style={styles.buttonRow}>
          <EnhancedButton
            title="Export JSON"
            variant="outline"
            icon="download-outline"
            onPress={() => handleExportData('json')}
            loading={loading}
            style={styles.exportButton}
          />
          <EnhancedButton
            title="Export TXT"
            variant="outline"
            icon="document-text-outline"
            onPress={() => handleExportData('txt')}
            loading={loading}
            style={styles.exportButton}
          />
        </View>

        <EnhancedButton
          title="Import Data"
          variant="secondary"
          icon="cloud-upload-outline"
          onPress={handleImportData}
          loading={loading}
          style={styles.actionButton}
        />
      </EnhancedCard>

      {/* Cloud Sync */}
      <EnhancedCard style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cloud Sync</Text>
        
        <View style={styles.statusRow}>
          <Ionicons 
            name={syncStatus.inProgress ? 'sync' : syncStatus.needsSync ? 'cloud-upload-outline' : 'cloud-done-outline'} 
            size={16} 
            color={syncStatus.inProgress ? theme.colors.warning : syncStatus.needsSync ? theme.colors.textMuted : theme.colors.success} 
          />
          <Text style={[styles.statusText, { color: theme.colors.textMuted }]}>
            {syncStatus.inProgress ? 'Syncing...' : 
             syncStatus.needsSync ? 'Sync needed' : 
             syncStatus.lastSyncTime ? `Last sync: ${new Date(syncStatus.lastSyncTime).toLocaleString()}` : 'Never synced'}
          </Text>
        </View>

        <EnhancedButton
          title="Sync to Cloud"
          variant="primary"
          icon="cloud-upload-outline"
          onPress={handleSyncToCloud}
          loading={loading || syncStatus.inProgress}
          style={styles.actionButton}
        />
      </EnhancedCard>

      {/* App Preferences */}
      <EnhancedCard style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notifications</Text>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Auto-save notifications</Text>
          <Switch
            value={settings.notifications.autoSave}
            onValueChange={(enabled) => updateSettings({ 
              notifications: { ...settings.notifications, autoSave: enabled }
            })}
            trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
            thumbColor={settings.notifications.autoSave ? theme.colors.primary : theme.colors.textMuted}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Backup notifications</Text>
          <Switch
            value={settings.notifications.backup}
            onValueChange={(enabled) => updateSettings({ 
              notifications: { ...settings.notifications, backup: enabled }
            })}
            trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
            thumbColor={settings.notifications.backup ? theme.colors.primary : theme.colors.textMuted}
          />
        </View>
      </EnhancedCard>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  intervalButtons: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalButton: {
    flex: 1,
  },
  exportButton: {
    flex: 1,
  },
  actionButton: {
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 8,
  },
  backupList: {
    marginTop: 16,
  },
  backupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backupInfo: {
    flex: 1,
  },
  backupDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  backupDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});