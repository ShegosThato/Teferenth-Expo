/**
 * Project Store
 * 
 * Manages project-related state using Zustand.
 * This store handles project CRUD operations and integrates with the ProjectService.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Project, ProjectActions, ProjectStats } from '../types';
import { projectService } from '../services/ProjectService';
import { performanceMonitor } from '../lib/performance';

interface ProjectState {
  // State
  projects: Project[];
  selectedProjectId?: string;
  isLoading: boolean;
  error?: string;

  // Actions
  addProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  setSelectedProject: (id: string | undefined) => void;
  
  // Computed getters
  getProject: (id: string) => Project | undefined;
  getProjectsByStatus: (status: Project['status']) => Project[];
  getProjectStats: () => ProjectStats;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    projects: [],
    selectedProjectId: undefined,
    isLoading: false,
    error: undefined,

    // Actions
    addProject: async (projectData) => {
      const startTime = performance.now();
      set({ isLoading: true, error: undefined });
      
      try {
        const newProject = await projectService.createProject(projectData);
        
        set((state) => ({
          projects: [newProject, ...state.projects],
          isLoading: false,
        }));

        performanceMonitor.trackOperation('store_add_project', performance.now() - startTime);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
        set({ error: errorMessage, isLoading: false });
        performanceMonitor.trackError('store_add_project_failed', error as Error);
        throw error;
      }
    },

    updateProject: async (id, updates) => {
      const startTime = performance.now();
      set({ isLoading: true, error: undefined });
      
      try {
        const currentProject = get().projects.find(p => p.id === id);
        if (!currentProject) {
          throw new Error(`Project with id ${id} not found`);
        }

        const updatedProject = await projectService.updateProject(id, updates);
        
        set((state) => ({
          projects: state.projects.map(p => p.id === id ? updatedProject : p),
          isLoading: false,
        }));

        performanceMonitor.trackOperation('store_update_project', performance.now() - startTime);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
        set({ error: errorMessage, isLoading: false });
        performanceMonitor.trackError('store_update_project_failed', error as Error);
        throw error;
      }
    },

    removeProject: async (id) => {
      const startTime = performance.now();
      set({ isLoading: true, error: undefined });
      
      try {
        await projectService.deleteProject(id);
        
        set((state) => ({
          projects: state.projects.filter(p => p.id !== id),
          selectedProjectId: state.selectedProjectId === id ? undefined : state.selectedProjectId,
          isLoading: false,
        }));

        performanceMonitor.trackOperation('store_remove_project', performance.now() - startTime);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
        set({ error: errorMessage, isLoading: false });
        performanceMonitor.trackError('store_remove_project_failed', error as Error);
        throw error;
      }
    },

    duplicateProject: async (id) => {
      const startTime = performance.now();
      set({ isLoading: true, error: undefined });
      
      try {
        const currentProject = get().projects.find(p => p.id === id);
        if (!currentProject) {
          throw new Error(`Project with id ${id} not found`);
        }

        const duplicatedProject = await projectService.duplicateProject(id);
        
        set((state) => ({
          projects: [duplicatedProject, ...state.projects],
          isLoading: false,
        }));

        performanceMonitor.trackOperation('store_duplicate_project', performance.now() - startTime);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate project';
        set({ error: errorMessage, isLoading: false });
        performanceMonitor.trackError('store_duplicate_project_failed', error as Error);
        throw error;
      }
    },

    setSelectedProject: (id) => {
      set({ selectedProjectId: id });
    },

    // Computed getters
    getProject: (id) => {
      return get().projects.find(p => p.id === id);
    },

    getProjectsByStatus: (status) => {
      return get().projects.filter(p => p.status === status);
    },

    getProjectStats: () => {
      const projects = get().projects;
      const totalScenes = projects.reduce((sum, p) => sum + p.scenes.length, 0);
      const totalWords = projects.reduce((sum, p) => {
        return sum + p.sourceText.split(/\s+/).filter(word => word.length > 0).length;
      }, 0);
      
      const projectsByStatus = projects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const averageProjectSize = projects.length > 0 ? totalWords / projects.length : 0;

      return {
        totalProjects: projects.length,
        totalScenes,
        totalWords,
        averageProjectSize: Math.round(averageProjectSize),
        projectsByStatus,
      };
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
  }))
);

// Selectors for better performance
export const projectSelectors = {
  // Get all projects
  projects: (state: ProjectState) => state.projects,
  
  // Get selected project
  selectedProject: (state: ProjectState) => 
    state.selectedProjectId ? state.projects.find(p => p.id === state.selectedProjectId) : undefined,
  
  // Get projects by status
  draftProjects: (state: ProjectState) => state.projects.filter(p => p.status === 'draft'),
  completedProjects: (state: ProjectState) => state.projects.filter(p => p.status === 'completed'),
  
  // Get loading state
  isLoading: (state: ProjectState) => state.isLoading,
  
  // Get error state
  error: (state: ProjectState) => state.error,
  
  // Get project count
  projectCount: (state: ProjectState) => state.projects.length,
  
  // Get recent projects (last 5)
  recentProjects: (state: ProjectState) => 
    [...state.projects]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5),
};

// Hook for subscribing to specific project changes
export const useProjectSubscription = (projectId: string) => {
  return useProjectStore((state) => state.projects.find(p => p.id === projectId));
};

// Hook for project statistics
export const useProjectStats = () => {
  return useProjectStore((state) => state.getProjectStats());
};