// db/actions.ts
import { Database } from '@nozbe/watermelondb';
import { Project, Scene, ActionQueue, ActionType, ActionPayload } from './models';

export const createProject = async (
  database: Database, 
  data: { title: string; sourceText: string; style: string }
): Promise<Project> => {
  return await database.write(async () => {
    // WatermelonDB automatically generates a unique ID
    return await database.get<Project>('projects').create(project => {
      project.title = data.title;
      project.sourceText = data.sourceText;
      project.style = data.style;
      project.status = 'draft';
      project.progress = 0;
      project.version = 1;
    });
  });
};

export const updateProject = async (
  database: Database,
  projectId: string,
  updates: Partial<{
    title: string;
    sourceText: string;
    style: string;
    status: string;
    progress: number;
    videoUrl: string;
  }>
): Promise<Project> => {
  return await database.write(async () => {
    const project = await database.get<Project>('projects').find(projectId);
    return await project.update(() => {
      if (updates.title !== undefined) project.title = updates.title;
      if (updates.sourceText !== undefined) project.sourceText = updates.sourceText;
      if (updates.style !== undefined) project.style = updates.style;
      if (updates.status !== undefined) project.status = updates.status;
      if (updates.progress !== undefined) project.progress = updates.progress;
      if (updates.videoUrl !== undefined) project.videoUrl = updates.videoUrl;
    });
  });
};

export const deleteProject = async (
  database: Database,
  projectId: string
): Promise<void> => {
  await database.write(async () => {
    const project = await database.get<Project>('projects').find(projectId);
    
    // Delete all associated scenes first
    const scenes = await project.scenes.fetch();
    await Promise.all(scenes.map(scene => scene.destroyPermanently()));
    
    // Delete the project
    await project.destroyPermanently();
  });
};

export const createScene = async (
  database: Database,
  projectId: string,
  data: { text: string; imagePrompt?: string; duration?: number }
): Promise<Scene> => {
  return await database.write(async () => {
    const project = await database.get<Project>('projects').find(projectId);
    return await database.get<Scene>('scenes').create(scene => {
      scene.project.set(project);
      scene.text = data.text;
      if (data.imagePrompt) scene.imagePrompt = data.imagePrompt;
      if (data.duration) scene.duration = data.duration;
    });
  });
};

export const createScenes = async (
  database: Database,
  projectId: string,
  scenesData: Array<{ text: string; imagePrompt?: string; duration?: number }>
): Promise<Scene[]> => {
  return await database.write(async () => {
    const project = await database.get<Project>('projects').find(projectId);
    
    // Create all scenes in a single transaction
    const sceneModels = scenesData.map(sceneData => 
      database.get<Scene>('scenes').prepareCreate(scene => {
        scene.project.set(project);
        scene.text = sceneData.text;
        if (sceneData.imagePrompt) scene.imagePrompt = sceneData.imagePrompt;
        if (sceneData.duration) scene.duration = sceneData.duration;
      })
    );
    
    await database.batch(...sceneModels);
    return sceneModels;
  });
};

export const updateScene = async (
  database: Database,
  sceneId: string,
  updates: Partial<{ text: string; image: string; imagePrompt: string; duration: number }>
): Promise<Scene> => {
  return await database.write(async () => {
    const scene = await database.get<Scene>('scenes').find(sceneId);
    return await scene.update(() => {
      if (updates.text !== undefined) scene.text = updates.text;
      if (updates.image !== undefined) scene.image = updates.image;
      if (updates.imagePrompt !== undefined) scene.imagePrompt = updates.imagePrompt;
      if (updates.duration !== undefined) scene.duration = updates.duration;
    });
  });
};

export const queueAction = async (
  database: Database,
  type: ActionType,
  payload: ActionPayload
): Promise<ActionQueue> => {
  return await database.write(async () => {
    return await database.get<ActionQueue>('action_queue').create(action => {
      action.type = type;
      action.payload = JSON.stringify(payload);
      action.status = 'pending';
      action.retryCount = 0;
    });
  });
};

export const updateActionStatus = async (
  database: Database,
  actionId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  error?: string
): Promise<ActionQueue> => {
  return await database.write(async () => {
    const action = await database.get<ActionQueue>('action_queue').find(actionId);
    return await action.update(() => {
      action.status = status;
      if (error) action.lastError = error;
    });
  });
};

export const deleteCompletedActions = async (database: Database): Promise<void> => {
  await database.write(async () => {
    const completedActions = await database
      .get<ActionQueue>('action_queue')
      .query()
      .where('status', 'completed')
      .fetch();
    
    await Promise.all(completedActions.map(action => action.destroyPermanently()));
  });
};