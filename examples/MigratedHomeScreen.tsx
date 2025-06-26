/**
 * Example: Migrated HomeScreen Component
 * 
 * This shows how the HomeScreen would look using the new architecture
 * with domain-specific stores and improved separation of concerns.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// New architecture imports
import {
  useProjectStore,
  useUIStore,
  useSettingsStore,
  projectSelectors,
  uiSelectors,
} from '../stores';
import { useNotificationActions, useModalActions } from '../stores';
import type { RootStackParamList } from '../App';

// Component imports
import { OptimizedFlatList } from '../components/OptimizedFlatList';
import { ProjectCardSkeleton } from '../components/LoadingStates';
import { EnhancedCard, FloatingActionButton, ThemeToggle } from '../components/EnhancedUI';
import { SyncManager } from '../components/SyncManager';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Library'>;

const MigratedHomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  // Store hooks - focused subscriptions
  const projects = useProjectStore(projectSelectors.projects);
  const isLoading = useProjectStore(projectSelectors.isLoading);
  const error = useProjectStore(projectSelectors.error);
  const projectStats = useProjectStore((state) => state.getProjectStats());
  
  // UI store
  const uiLoading = useUIStore(uiSelectors.isLoading);
  const selectedProjectId = useUIStore(uiSelectors.selectedProjectId);
  
  // Settings store
  const theme = useSettingsStore((state) => state.theme);
  
  // Actions
  const { removeProject, duplicateProject, setSelectedProject } = useProjectStore();
  const { setLoading } = useUIStore();
  const { showSuccess, showError } = useNotificationActions();
  const { openSettings } = useModalActions();

  // Effects
  useEffect(() => {
    // Track screen load
    setLoading(false);
  }, [setLoading]);

  // Handlers
  const handleProjectPress = (projectId: string) => {
    setSelectedProject(projectId);
    navigation.navigate('Storyboard', { id: projectId });
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await removeProject(projectId);
      showSuccess('Project deleted', 'Project has been successfully deleted');
    } catch (error) {
      showError('Delete failed', 'Failed to delete project');
    }
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      await duplicateProject(projectId);
      showSuccess('Project duplicated', 'Project has been successfully duplicated');
    } catch (error) {
      showError('Duplicate failed', 'Failed to duplicate project');
    }
  };

  const handleNewProject = () => {
    navigation.navigate('NewProject');
  };

  // Render methods
  const renderProject = ({ item: project }) => (
    <EnhancedCard
      key={project.id}
      style={[
        styles.projectCard,
        selectedProjectId === project.id && styles.selectedCard
      ]}
      onPress={() => handleProjectPress(project.id)}
    >
      <View style={styles.projectHeader}>
        <Text style={styles.projectTitle}>{project.title}</Text>
        <View style={styles.projectActions}>
          <TouchableOpacity
            onPress={() => handleDuplicateProject(project.id)}
            style={styles.actionButton}
          >
            <Ionicons name="copy-outline" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteProject(project.id)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.projectStatus}>
        Status: {project.status} • {project.scenes.length} scenes
      </Text>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${project.progress * 100}%` }]} />
      </View>
    </EnhancedCard>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="film-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Projects Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first storyboard project to get started
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleNewProject}>
        <Text style={styles.createButtonText}>Create Project</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>My Projects</Text>
        <View style={styles.headerActions}>
          <ThemeToggle />
          <TouchableOpacity onPress={openSettings} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      
      {projectStats.totalProjects > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {projectStats.totalProjects} projects • {projectStats.totalScenes} scenes • {projectStats.totalWords} words
          </Text>
        </View>
      )}
    </View>
  );

  // Loading state
  if (isLoading || uiLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ProjectCardSkeleton count={3} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff4444" />
          <Text style={styles.errorTitle}>Error Loading Projects</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <OptimizedFlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <FloatingActionButton
        onPress={handleNewProject}
        icon="add"
        position="bottom-right"
      />

      <SyncManager />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    marginTop: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  projectCard: {
    marginBottom: 12,
    padding: 16,
  },
  selectedCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  projectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  projectStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MigratedHomeScreen;