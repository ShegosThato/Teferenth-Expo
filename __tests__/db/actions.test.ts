/**
 * Unit Tests for Database Actions
 * 
 * These tests verify the core database operations for the offline-first
 * architecture, including CRUD operations and action queue functionality.
 */

import { Database } from '@nozbe/watermelondb';
import {
  createProject,
  updateProject,
  deleteProject,
  createScene,
  createScenes,
  updateScene,
  queueAction,
  updateActionStatus,
  deleteCompletedActions
} from '../../db/actions';
import { Project, Scene, ActionQueue } from '../../db/models';

// Mock WatermelonDB
const mockDatabase = {
  write: jest.fn(),
  get: jest.fn(),
  batch: jest.fn()
} as unknown as Database;

const mockCollection = {
  create: jest.fn(),
  find: jest.fn(),
  prepareCreate: jest.fn(),
  query: jest.fn()
};

const mockQuery = {
  where: jest.fn().mockReturnThis(),
  fetch: jest.fn()
};

const mockProject = {
  id: 'project-1',
  title: 'Test Project',
  sourceText: 'Test content',
  style: 'cinematic',
  status: 'draft',
  progress: 0,
  version: 1,
  update: jest.fn(),
  destroyPermanently: jest.fn(),
  scenes: {
    fetch: jest.fn()
  }
} as unknown as Project;

const mockScene = {
  id: 'scene-1',
  text: 'Test scene',
  imagePrompt: 'Test prompt',
  duration: 5,
  project: {
    set: jest.fn()
  },
  update: jest.fn(),
  destroyPermanently: jest.fn()
} as unknown as Scene;

const mockAction = {
  id: 'action-1',
  type: 'generate_scenes',
  payload: '{}',
  status: 'pending',
  retryCount: 0,
  update: jest.fn(),
  destroyPermanently: jest.fn()
} as unknown as ActionQueue;

describe('Database Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (mockDatabase.get as jest.Mock).mockReturnValue(mockCollection);
    (mockDatabase.write as jest.Mock).mockImplementation((fn) => fn());
    (mockCollection.query as jest.Mock).mockReturnValue(mockQuery);
  });

  describe('Project Operations', () => {
    describe('createProject', () => {
      it('should create a new project with correct data', async () => {
        const projectData = {
          title: 'Test Project',
          sourceText: 'Test content',
          style: 'cinematic'
        };

        (mockCollection.create as jest.Mock).mockImplementation((fn) => {
          const project = { ...mockProject };
          fn(project);
          return project;
        });

        const result = await createProject(mockDatabase, projectData);

        expect(mockDatabase.write).toHaveBeenCalled();
        expect(mockDatabase.get).toHaveBeenCalledWith('projects');
        expect(mockCollection.create).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should set default values for new project', async () => {
        const projectData = {
          title: 'Test Project',
          sourceText: 'Test content',
          style: 'cinematic'
        };

        let createdProject: any;
        (mockCollection.create as jest.Mock).mockImplementation((fn) => {
          createdProject = { ...mockProject };
          fn(createdProject);
          return createdProject;
        });

        await createProject(mockDatabase, projectData);

        expect(createdProject.title).toBe(projectData.title);
        expect(createdProject.sourceText).toBe(projectData.sourceText);
        expect(createdProject.style).toBe(projectData.style);
        expect(createdProject.status).toBe('draft');
        expect(createdProject.progress).toBe(0);
        expect(createdProject.version).toBe(1);
      });
    });

    describe('updateProject', () => {
      it('should update project with provided data', async () => {
        const updates = {
          title: 'Updated Title',
          status: 'processing',
          progress: 50
        };

        (mockCollection.find as jest.Mock).mockResolvedValue(mockProject);
        (mockProject.update as jest.Mock).mockImplementation((fn) => {
          fn();
          return mockProject;
        });

        const result = await updateProject(mockDatabase, 'project-1', updates);

        expect(mockDatabase.write).toHaveBeenCalled();
        expect(mockCollection.find).toHaveBeenCalledWith('project-1');
        expect(mockProject.update).toHaveBeenCalled();
        expect(result).toBe(mockProject);
      });

      it('should only update provided fields', async () => {
        const updates = { title: 'New Title' };

        (mockCollection.find as jest.Mock).mockResolvedValue(mockProject);
        
        let updateFn: any;
        (mockProject.update as jest.Mock).mockImplementation((fn) => {
          updateFn = fn;
          return mockProject;
        });

        await updateProject(mockDatabase, 'project-1', updates);

        // Simulate the update function call
        const projectToUpdate = { ...mockProject };
        updateFn.call(projectToUpdate);

        expect(mockProject.update).toHaveBeenCalled();
      });
    });

    describe('deleteProject', () => {
      it('should delete project and associated scenes', async () => {
        const mockScenes = [mockScene, { ...mockScene, id: 'scene-2' }];
        
        (mockCollection.find as jest.Mock).mockResolvedValue(mockProject);
        (mockProject.scenes.fetch as jest.Mock).mockResolvedValue(mockScenes);

        await deleteProject(mockDatabase, 'project-1');

        expect(mockDatabase.write).toHaveBeenCalled();
        expect(mockCollection.find).toHaveBeenCalledWith('project-1');
        expect(mockProject.scenes.fetch).toHaveBeenCalled();
        expect(mockProject.destroyPermanently).toHaveBeenCalled();
        
        // Verify all scenes are deleted
        mockScenes.forEach(scene => {
          expect(scene.destroyPermanently).toHaveBeenCalled();
        });
      });
    });
  });

  describe('Scene Operations', () => {
    describe('createScene', () => {
      it('should create a scene with project association', async () => {
        const sceneData = {
          text: 'Test scene',
          imagePrompt: 'Test prompt',
          duration: 5
        };

        (mockCollection.find as jest.Mock).mockResolvedValue(mockProject);
        (mockDatabase.get as jest.Mock)
          .mockReturnValueOnce(mockCollection) // for projects
          .mockReturnValueOnce(mockCollection); // for scenes

        (mockCollection.create as jest.Mock).mockImplementation((fn) => {
          const scene = { ...mockScene };
          fn(scene);
          return scene;
        });

        const result = await createScene(mockDatabase, 'project-1', sceneData);

        expect(mockDatabase.write).toHaveBeenCalled();
        expect(mockCollection.find).toHaveBeenCalledWith('project-1');
        expect(mockCollection.create).toHaveBeenCalled();
        expect(result).toBeDefined();
      });
    });

    describe('createScenes', () => {
      it('should create multiple scenes in batch', async () => {
        const scenesData = [
          { text: 'Scene 1', imagePrompt: 'Prompt 1', duration: 5 },
          { text: 'Scene 2', imagePrompt: 'Prompt 2', duration: 3 }
        ];

        (mockCollection.find as jest.Mock).mockResolvedValue(mockProject);
        (mockCollection.prepareCreate as jest.Mock).mockImplementation((fn) => {
          const scene = { ...mockScene };
          fn(scene);
          return scene;
        });

        const result = await createScenes(mockDatabase, 'project-1', scenesData);

        expect(mockDatabase.write).toHaveBeenCalled();
        expect(mockCollection.find).toHaveBeenCalledWith('project-1');
        expect(mockCollection.prepareCreate).toHaveBeenCalledTimes(2);
        expect(mockDatabase.batch).toHaveBeenCalled();
        expect(result).toHaveLength(2);
      });
    });

    describe('updateScene', () => {
      it('should update scene with provided data', async () => {
        const updates = {
          text: 'Updated scene text',
          image: 'updated-image.jpg'
        };

        (mockCollection.find as jest.Mock).mockResolvedValue(mockScene);
        (mockScene.update as jest.Mock).mockImplementation((fn) => {
          fn();
          return mockScene;
        });

        const result = await updateScene(mockDatabase, 'scene-1', updates);

        expect(mockDatabase.write).toHaveBeenCalled();
        expect(mockCollection.find).toHaveBeenCalledWith('scene-1');
        expect(mockScene.update).toHaveBeenCalled();
        expect(result).toBe(mockScene);
      });
    });
  });

  describe('Action Queue Operations', () => {
    describe('queueAction', () => {
      it('should create action with correct data', async () => {
        const actionType = 'generate_scenes';
        const payload = { projectId: 'project-1', text: 'Test' };

        (mockCollection.create as jest.Mock).mockImplementation((fn) => {
          const action = { ...mockAction };
          fn(action);
          return action;
        });

        const result = await queueAction(mockDatabase, actionType, payload);

        expect(mockDatabase.write).toHaveBeenCalled();
        expect(mockDatabase.get).toHaveBeenCalledWith('action_queue');
        expect(mockCollection.create).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should set default action status and retry count', async () => {
        let createdAction: any;
        (mockCollection.create as jest.Mock).mockImplementation((fn) => {
          createdAction = { ...mockAction };
          fn(createdAction);
          return createdAction;
        });

        await queueAction(mockDatabase, 'generate_scenes', {});

        expect(createdAction.status).toBe('pending');
        expect(createdAction.retryCount).toBe(0);
      });
    });

    describe('updateActionStatus', () => {
      it('should update action status', async () => {
        (mockCollection.find as jest.Mock).mockResolvedValue(mockAction);
        (mockAction.update as jest.Mock).mockImplementation((fn) => {
          fn();
          return mockAction;
        });

        const result = await updateActionStatus(mockDatabase, 'action-1', 'completed');

        expect(mockDatabase.write).toHaveBeenCalled();
        expect(mockCollection.find).toHaveBeenCalledWith('action-1');
        expect(mockAction.update).toHaveBeenCalled();
        expect(result).toBe(mockAction);
      });

      it('should set error message when provided', async () => {
        (mockCollection.find as jest.Mock).mockResolvedValue(mockAction);
        
        let updateFn: any;
        (mockAction.update as jest.Mock).mockImplementation((fn) => {
          updateFn = fn;
          return mockAction;
        });

        await updateActionStatus(mockDatabase, 'action-1', 'failed', 'Test error');

        // Simulate the update function call
        const actionToUpdate = { ...mockAction };
        updateFn.call(actionToUpdate);

        expect(mockAction.update).toHaveBeenCalled();
      });
    });

    describe('deleteCompletedActions', () => {
      it('should delete all completed actions', async () => {
        const completedActions = [
          { ...mockAction, status: 'completed' },
          { ...mockAction, id: 'action-2', status: 'completed' }
        ];

        (mockQuery.fetch as jest.Mock).mockResolvedValue(completedActions);

        await deleteCompletedActions(mockDatabase);

        expect(mockDatabase.write).toHaveBeenCalled();
        expect(mockCollection.query).toHaveBeenCalled();
        expect(mockQuery.where).toHaveBeenCalledWith('status', 'completed');
        expect(mockQuery.fetch).toHaveBeenCalled();
        
        // Verify all completed actions are deleted
        completedActions.forEach(action => {
          expect(action.destroyPermanently).toHaveBeenCalled();
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database write errors', async () => {
      const error = new Error('Database write failed');
      (mockDatabase.write as jest.Mock).mockRejectedValue(error);

      await expect(createProject(mockDatabase, {
        title: 'Test',
        sourceText: 'Test',
        style: 'cinematic'
      })).rejects.toThrow('Database write failed');
    });

    it('should handle record not found errors', async () => {
      const error = new Error('Record not found');
      (mockCollection.find as jest.Mock).mockRejectedValue(error);

      await expect(updateProject(mockDatabase, 'non-existent', {}))
        .rejects.toThrow('Record not found');
    });
  });
});