/**
 * Refactored Storyboard Screen
 * 
 * Modular, maintainable storyboard screen using focused components
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { withObservables } from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '../db/DatabaseContext';
import { Project, Scene, queueAction, updateProject } from '../db';
import { toast } from '../lib/toast';
import type { RootStackParamList } from '../App';
import { colors } from '../lib/theme';
import { API_URLS, ENV } from '../config/env';
import { enhancedFetch, handleError } from '../lib/errorHandling';
import { performanceMonitor } from '../lib/performance';
import { useNetInfo } from '@react-native-community/netinfo';

// Modular components
import { 
  StoryboardHeader,
  SceneList,
  VideoControls,
  StoryboardActions,
} from '../components/Storyboard';
import { VideoPlayer } from '../components/VideoPlayer';
import { LoadingSpinner, ErrorState } from '../components/LoadingStates';

interface RouteParams {
  id: string;
}

type StoryboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Storyboard'>;

interface StoryboardScreenProps {
  project: Project;
  scenes: Scene[];
}

// Extracted AI functions for better organization
const aiService = {
  async generateScenes(text: string): Promise<Scene[]> {
    try {
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
        timeout: ENV.AI_TIMEOUT,
        retries: 2,
        onRetry: (attempt, error) => {
          toast.warning(`Retrying scene generation (attempt ${attempt})...`);
        }
      });
      
      const json = await response.json();
      const completion: string = json.completion;
      const possibleJson = completion.match(/\[.*\]/s);
      
      if (possibleJson) {
        const arr = JSON.parse(possibleJson[0]);
        return arr.map((s: any, idx: number) => ({
          id: s.id || `${idx}`,
          text: s.text || (typeof s === 'string' ? s : ''),
          imagePrompt: s.imagePrompt || s.text || '',
        }));
      }
      
      // Fallback simple split
      return text
        .split(/\n\n+/)
        .filter(Boolean)
        .map((p, idx) => ({ id: `${idx}`, text: p.trim() }));
    } catch (error) {
      const appError = handleError(error, { 
        operation: 'aiGenerateScenes',
        textLength: text.length 
      });
      
      // Return fallback result instead of throwing
      return text
        .split(/\n\n+/)
        .filter(Boolean)
        .map((p, idx) => ({ id: `${idx}`, text: p.trim() }));
    }
  },

  async generateSceneImage(prompt: string, style: string): Promise<string> {
    try {
      const stylePrompt = `${prompt}, ${style} style, high quality, professional`;
      
      const response = await enhancedFetch(
        `${API_URLS.IMAGE_GENERATION}?text=${encodeURIComponent(stylePrompt)}&aspect=16:9`,
        {
          timeout: ENV.IMAGE_TIMEOUT,
          retries: 1,
          onRetry: (attempt, error) => {
            toast.warning(`Retrying image generation (attempt ${attempt})...`);
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      handleError(error, { 
        operation: 'generateSceneImage',
        prompt: prompt.substring(0, 100) 
      });
      throw error;
    }
  }
};

function StoryboardScreen({ project, scenes }: StoryboardScreenProps) {
  const navigation = useNavigation<StoryboardScreenNavigationProp>();
  const database = useDatabase();
  const netInfo = useNetInfo();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.trackScreenLoad('StoryboardScreen');
  }, []);

  // Handlers
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleGenerateScenes = useCallback(async () => {
    if (!netInfo.isConnected) {
      toast.error('No internet connection');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const generatedScenes = await aiService.generateScenes(project.sourceText);
      
      // Queue action for offline support
      await queueAction(database, 'create_scenes', {
        projectId: project.id,
        scenes: generatedScenes,
      });

      await updateProject(database, project.id, { status: 'storyboard' });
      toast.success(`Generated ${generatedScenes.length} scenes`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate scenes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [database, project, netInfo.isConnected]);

  const handleGenerateImages = useCallback(async () => {
    if (!netInfo.isConnected) {
      toast.error('No internet connection');
      return;
    }

    if (scenes.length === 0) {
      toast.error('No scenes to generate images for');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const imagePromises = scenes.map(async (scene) => {
        try {
          const imageUrl = await aiService.generateSceneImage(
            scene.imagePrompt || scene.text,
            project.style
          );
          
          // Queue action for offline support
          await queueAction(database, 'update_scene', {
            sceneId: scene.id,
            updates: { image: imageUrl },
          });

          return { sceneId: scene.id, imageUrl };
        } catch (error) {
          console.warn(`Failed to generate image for scene ${scene.id}:`, error);
          return { sceneId: scene.id, imageUrl: null };
        }
      });

      const results = await Promise.all(imagePromises);
      const successCount = results.filter(r => r.imageUrl).length;
      
      toast.success(`Generated ${successCount}/${scenes.length} images`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate images';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [database, project, scenes, netInfo.isConnected]);

  const handleGenerateVideo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Queue video generation action
      await queueAction(database, 'generate_video', {
        projectId: project.id,
        scenes: scenes.map(s => ({
          id: s.id,
          text: s.text,
          image: s.image,
          duration: s.duration || 3,
        })),
      });

      await updateProject(database, project.id, { 
        status: 'rendering',
        progress: 0,
      });

      toast.success('Video generation started');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start video generation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [database, project, scenes]);

  const handlePlayVideo = useCallback(() => {
    if (project.videoUrl) {
      setVideoPlayerVisible(true);
    }
  }, [project.videoUrl]);

  const handleScenePress = useCallback((scene: Scene) => {
    // Handle scene selection/editing
    console.log('Scene pressed:', scene.id);
  }, []);

  const handleRegenerateImage = useCallback(async (scene: Scene) => {
    if (!netInfo.isConnected) {
      toast.error('No internet connection');
      return;
    }

    try {
      const imageUrl = await aiService.generateSceneImage(
        scene.imagePrompt || scene.text,
        project.style
      );
      
      await queueAction(database, 'update_scene', {
        sceneId: scene.id,
        updates: { image: imageUrl },
      });

      toast.success('Image regenerated');
    } catch (error) {
      toast.error('Failed to regenerate image');
    }
  }, [database, project.style, netInfo.isConnected]);

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Storyboard Error"
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  // Loading state
  if (isLoading && scenes.length === 0) {
    return (
      <LoadingSpinner
        message="Loading storyboard..."
      />
    );
  }

  const hasVideo = !!project.videoUrl;
  const hasScenes = scenes.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <StoryboardHeader
        project={project}
        onBack={handleBack}
      />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Video Controls */}
        {(hasVideo || hasScenes) && (
          <VideoControls
            project={project}
            onGenerateVideo={handleGenerateVideo}
            onPlayVideo={handlePlayVideo}
            isGenerating={isLoading && project.status === 'rendering'}
            hasVideo={hasVideo}
          />
        )}

        {/* Generation Actions */}
        <StoryboardActions
          project={project}
          scenes={scenes}
          onGenerateScenes={handleGenerateScenes}
          onGenerateImages={handleGenerateImages}
          onGenerateVideo={handleGenerateVideo}
          isLoading={isLoading}
        />

        {/* Scene List */}
        <View style={styles.sceneListContainer}>
          <SceneList
            scenes={scenes}
            isLoading={isLoading}
            onScenePress={handleScenePress}
            onRegenerateImage={handleRegenerateImage}
          />
        </View>
      </View>

      {/* Video Player Modal */}
      {videoPlayerVisible && project.videoUrl && (
        <VideoPlayer
          source={{ uri: project.videoUrl }}
          visible={videoPlayerVisible}
          onClose={() => setVideoPlayerVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  sceneListContainer: {
    flex: 1,
  },
});

// Enhanced HOC with better observables
const enhance = withObservables(['route'], ({ route }: { route: any }) => {
  const database = useDatabase();
  const projectId = route.params.id;
  
  return {
    project: database.get<Project>('projects').findAndObserve(projectId),
    scenes: database.get<Scene>('scenes')
      .query(Q.where('project_id', projectId), Q.sortBy('created_at', Q.asc))
      .observe(),
  };
});

export default enhance(StoryboardScreen);