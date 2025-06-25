// lib/syncEngine.ts
import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { ActionQueue, Project, Scene, createScenes } from '../db';
import { toast } from './toast';
import { handleError } from './errorHandling';

// Import the AI functions from StoryboardScreen
import { API_URLS, ENV } from '../config/env';
import { enhancedFetch } from './errorHandling';
import { generateVideo as generateVideoLocally } from './videoGenerator';

async function aiGenerateScenes(text: string): Promise<any[]> {
  try {
    // Enhanced error handling with retries
    const response = await enhancedFetch(API_URLS.AI_LLM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that breaks a story into a brief storyboard array. Return JSON array where each element has id, text, and imagePrompt (a visual description for image generation) strictly.',
          },
          { role: 'user', content: `Break this story into scenes: ${text}` },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected array');
    }

    return data.map((scene: any) => ({
      text: scene.text || '',
      imagePrompt: scene.imagePrompt || scene.image_prompt || '',
    }));
  } catch (error) {
    console.error('AI scene generation error:', error);
    throw error;
  }
}

async function generateSceneImage(prompt: string, style: string): Promise<string> {
  try {
    const stylePrompt = `${prompt}, ${style} style, high quality, professional`;
    
    // Enhanced error handling with retries
    const response = await enhancedFetch(
      `${API_URLS.IMAGE_GENERATION}?text=${encodeURIComponent(stylePrompt)}&aspect=16:9`,
      {
        timeout: ENV.IMAGE_TIMEOUT,
        retries: 1, // Fewer retries for image generation
      }
    );
    
    return response.url;
  } catch (error) {
    console.error('Image generation error:', error);
    return ''; // Return empty string on failure
  }
}

async function generateVideo(scenes: Scene[], style: string): Promise<string> {
  try {
    // Use the local video generator instead of an API
    const videoUri = await generateVideoLocally(database, scenes[0].project.id, {
      duration: 5, // 5 seconds per scene
      transition: 'fade',
      resolution: '720p',
      textPosition: 'bottom',
      textColor: 'white',
      backgroundColor: 'black',
      onProgress: (progress) => {
        // Could update a progress indicator in the UI
        console.log(`Video generation progress: ${Math.round(progress * 100)}%`);
      }
    });
    
    return videoUri;
  } catch (error) {
    console.error('Video generation error:', error);
    throw error;
  }
}

export async function processActionQueue(database: Database, netInfo: any): Promise<void> {
  if (!netInfo.isInternetReachable) {
    console.log("Sync engine paused: No internet connection.");
    return;
  }

  const actionsToProcess = await database.get<ActionQueue>('action_queue').query(
    Q.where('status', 'pending')
  ).fetch();
  
  if (actionsToProcess.length === 0) {
    console.log("Sync engine: No actions to process.");
    return;
  }

  console.log(`Sync engine: Processing ${actionsToProcess.length} actions.`);
  
  for (const action of actionsToProcess) {
    try {
      // Mark action as processing
      await database.write(async () => {
        await action.update(() => {
          action.status = 'processing';
        });
      });

      if (action.type === 'GENERATE_SCENES') {
        const { projectId } = action.getPayload();
        const project = await database.get<Project>('projects').find(projectId);
        
        // 1. Perform the actual API call
        const scenesData = await aiGenerateScenes(project.sourceText);

        // 2. Update the local database with the successful result
        await database.write(async () => {
          // Create all new scenes within a single transaction
          const sceneModels = scenesData.map(sceneData => 
            database.get<Scene>('scenes').prepareCreate(scene => {
              scene.project.set(project);
              scene.text = sceneData.text;
              scene.imagePrompt = sceneData.imagePrompt;
            })
          );
          await database.batch(...sceneModels);
          
          await project.update(p => { p.status = 'storyboard' });
          // 3. The action was successful, so delete it from the queue
          await action.update(() => {
            action.status = 'completed';
          });
        });

        toast.success('Storyboard generated successfully!', `Created ${scenesData.length} scenes`);
      } else if (action.type === 'GENERATE_IMAGE') {
        const { sceneId, style } = action.getPayload();
        const scene = await database.get<Scene>('scenes').find(sceneId);
        
        // Generate the image
        const imageUrl = await generateSceneImage(scene.text, style);
        
        if (imageUrl) {
          // Update the scene with the generated image
          await database.write(async () => {
            await scene.update(() => {
              scene.image = imageUrl;
            });
            
            await action.update(() => {
              action.status = 'completed';
            });
          });
          
          toast.success('Scene image generated!');
        } else {
          throw new Error('Failed to generate image');
        }
      } else if (action.type === 'GENERATE_VIDEO') {
        const { projectId } = action.getPayload();
        const project = await database.get<Project>('projects').find(projectId);
        
        // Get all scenes for this project
        const scenes = await project.scenes.fetch();
        
        // Check if all scenes have images
        const allScenesHaveImages = scenes.every(scene => scene.image);
        
        if (!allScenesHaveImages) {
          throw new Error('Cannot generate video: some scenes are missing images');
        }
        
        try {
          // This is a placeholder for actual video generation API call
          // In a real implementation, you would call your video generation API here
          const videoUrl = await generateVideo(scenes, project.style);
          
          if (videoUrl) {
            // Update the project with the video URL
            await database.write(async () => {
              await project.update(() => {
                project.videoUrl = videoUrl;
                project.status = 'complete';
              });
              
              await action.update(() => {
                action.status = 'completed';
              });
            });
            
            toast.success('Video generated successfully!');
          } else {
            throw new Error('Failed to generate video');
          }
        } catch (error) {
          console.error('Video generation error:', error);
          throw new Error(`Video generation failed: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("Sync engine error processing action:", action.id, error);
      
      // Implement retry logic with exponential backoff
      const maxRetries = 3;
      const newRetryCount = action.retryCount + 1;
      
      await database.write(async () => {
        if (newRetryCount >= maxRetries) {
          await action.update(() => {
            action.status = 'failed';
            action.lastError = error.message;
            action.retryCount = newRetryCount;
          });
          
          toast.error(`Action failed after ${maxRetries} attempts: ${error.message}`);
        } else {
          await action.update(() => {
            action.status = 'pending';
            action.lastError = error.message;
            action.retryCount = newRetryCount;
          });
          
          console.log(`Action ${action.id} will be retried (attempt ${newRetryCount}/${maxRetries})`);
        }
      });
    }
  }
}

// Clean up completed actions periodically
export async function cleanupCompletedActions(database: Database): Promise<void> {
  try {
    const completedActions = await database.get<ActionQueue>('action_queue').query(
      Q.where('status', 'completed'),
      Q.where('created_at', Q.lt(Date.now() - 24 * 60 * 60 * 1000)) // Older than 24 hours
    ).fetch();
    
    if (completedActions.length > 0) {
      await database.write(async () => {
        await Promise.all(completedActions.map(action => action.destroyPermanently()));
      });
      
      console.log(`Cleaned up ${completedActions.length} completed actions`);
    }
  } catch (error) {
    console.error('Error cleaning up completed actions:', error);
  }
}