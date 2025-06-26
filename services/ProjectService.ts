/**
 * Project Service
 * 
 * Handles all project-related business logic and data operations.
 * This service abstracts the data layer and provides a clean API for project management.
 */

import { Project, ProjectService as IProjectService } from '../types';
import { performanceMonitor } from '../lib/performance';

class ProjectService implements IProjectService {
  /**
   * Creates a new project with generated ID and timestamps
   */
  async createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Project> {
    const startTime = performance.now();
    
    try {
      const project: Project = {
        ...data,
        id: this.generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        scenes: data.scenes || [],
        progress: 0,
        status: 'draft',
      };

      // Validate project data
      this.validateProject(project);

      performanceMonitor.trackOperation('project_create', performance.now() - startTime);
      return project;
    } catch (error) {
      performanceMonitor.trackError('project_create_failed', error as Error);
      throw error;
    }
  }

  /**
   * Updates an existing project with new data
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const startTime = performance.now();
    
    try {
      // Get existing project (this would typically come from the store)
      const existingProject = await this.getProject(id);
      if (!existingProject) {
        throw new Error(`Project with id ${id} not found`);
      }

      const updatedProject: Project = {
        ...existingProject,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: Date.now(),
        version: existingProject.version + 1,
      };

      // Validate updated project
      this.validateProject(updatedProject);

      performanceMonitor.trackOperation('project_update', performance.now() - startTime);
      return updatedProject;
    } catch (error) {
      performanceMonitor.trackError('project_update_failed', error as Error);
      throw error;
    }
  }

  /**
   * Deletes a project
   */
  async deleteProject(id: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      const project = await this.getProject(id);
      if (!project) {
        throw new Error(`Project with id ${id} not found`);
      }

      // Additional cleanup logic could go here
      // (e.g., delete associated files, clear cache, etc.)

      performanceMonitor.trackOperation('project_delete', performance.now() - startTime);
    } catch (error) {
      performanceMonitor.trackError('project_delete_failed', error as Error);
      throw error;
    }
  }

  /**
   * Duplicates an existing project
   */
  async duplicateProject(id: string): Promise<Project> {
    const startTime = performance.now();
    
    try {
      const originalProject = await this.getProject(id);
      if (!originalProject) {
        throw new Error(`Project with id ${id} not found`);
      }

      const duplicatedProject = await this.createProject({
        ...originalProject,
        title: `${originalProject.title} (Copy)`,
        status: 'draft',
        progress: 0,
        videoUrl: undefined, // Don't copy the video URL
        scenes: originalProject.scenes.map(scene => ({
          ...scene,
          id: this.generateId(), // Generate new IDs for scenes
          image: undefined, // Don't copy generated images
        })),
      });

      performanceMonitor.trackOperation('project_duplicate', performance.now() - startTime);
      return duplicatedProject;
    } catch (error) {
      performanceMonitor.trackError('project_duplicate_failed', error as Error);
      throw error;
    }
  }

  /**
   * Retrieves a project by ID
   * Note: This would typically interact with the store or database
   */
  async getProject(id: string): Promise<Project | null> {
    // This is a placeholder - in a real implementation, this would
    // interact with the store or database to retrieve the project
    throw new Error('getProject method needs to be implemented with store integration');
  }

  /**
   * Retrieves all projects
   */
  async getAllProjects(): Promise<Project[]> {
    // This is a placeholder - in a real implementation, this would
    // interact with the store or database to retrieve all projects
    throw new Error('getAllProjects method needs to be implemented with store integration');
  }

  /**
   * Calculates project statistics
   */
  calculateProjectStats(project: Project): {
    wordCount: number;
    sceneCount: number;
    estimatedDuration: number;
    estimatedReadTime: number;
  } {
    const wordCount = project.sourceText.split(/\s+/).filter(word => word.length > 0).length;
    const sceneCount = project.scenes.length;
    const estimatedDuration = project.scenes.reduce((total, scene) => {
      return total + (scene.duration || 5); // Default 5 seconds per scene
    }, 0);
    const estimatedReadTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute

    return {
      wordCount,
      sceneCount,
      estimatedDuration,
      estimatedReadTime,
    };
  }

  /**
   * Validates project data
   */
  private validateProject(project: Project): void {
    if (!project.title || project.title.trim().length === 0) {
      throw new Error('Project title is required');
    }

    if (!project.sourceText || project.sourceText.trim().length === 0) {
      throw new Error('Project source text is required');
    }

    if (!project.style || project.style.trim().length === 0) {
      throw new Error('Project style is required');
    }

    if (project.progress < 0 || project.progress > 1) {
      throw new Error('Project progress must be between 0 and 1');
    }

    if (!['draft', 'storyboard', 'rendering', 'completed'].includes(project.status)) {
      throw new Error('Invalid project status');
    }

    // Validate scenes
    project.scenes.forEach((scene, index) => {
      if (!scene.id || scene.id.trim().length === 0) {
        throw new Error(`Scene ${index + 1} is missing an ID`);
      }
      if (!scene.text || scene.text.trim().length === 0) {
        throw new Error(`Scene ${index + 1} is missing text content`);
      }
    });
  }

  /**
   * Generates a unique ID for projects and scenes
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Optimizes project data by removing unnecessary metadata
   */
  optimizeProject(project: Project): Project {
    return {
      ...project,
      scenes: project.scenes.map(scene => ({
        ...scene,
        metadata: scene.metadata ? {
          wordCount: scene.metadata.wordCount,
          estimatedReadTime: scene.metadata.estimatedReadTime,
          // Remove other metadata that might not be essential
        } : undefined,
      })),
    };
  }

  /**
   * Prepares project for export
   */
  prepareForExport(project: Project, format: 'json' | 'pdf' | 'txt'): any {
    const optimizedProject = this.optimizeProject(project);
    
    switch (format) {
      case 'json':
        return optimizedProject;
      case 'txt':
        return {
          title: optimizedProject.title,
          sourceText: optimizedProject.sourceText,
          scenes: optimizedProject.scenes.map(scene => scene.text).join('\n\n'),
        };
      case 'pdf':
        return {
          title: optimizedProject.title,
          content: optimizedProject.sourceText,
          scenes: optimizedProject.scenes,
          metadata: optimizedProject.metadata,
        };
      default:
        return optimizedProject;
    }
  }
}

export const projectService = new ProjectService();