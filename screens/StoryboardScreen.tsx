import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { VideoPlayer } from '../components/VideoPlayer';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { withObservables } from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '../db/DatabaseContext';
import { Project, Scene, queueAction, updateProject } from '../db';
import { toast } from '../lib/toast';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../App';
import { colors } from '../lib/theme';
import { API_URLS, ENV } from '../config/env';
import CachedImage from '../components/CachedImage';
import { enhancedFetch, handleError, RetryManager } from '../lib/errorHandling';
import { LoadingSpinner, ErrorState, InlineLoading, SceneCardSkeleton } from '../components/LoadingStates';
import { OptimizedFlatList } from '../components/OptimizedFlatList';
import { performanceMonitor, PerformanceOptimizer } from '../lib/performance';
import { imageCache } from '../lib/imageCache';
import { useNetInfo } from '@react-native-community/netinfo';

interface RouteParams {
  id: string;
}

type StoryboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Storyboard'>;

async function aiGenerateScenes(text: string): Promise<Scene[]> {
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
    
    // fallback simple split
    return text
      .split(/\n\n+/)
      .filter(Boolean)
      .map((p, idx) => ({ id: `${idx}`, text: p.trim() }));
  } catch (error) {
    // Enhanced error handling
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
        onRetry: (attempt, error) => {
          toast.warning(`Retrying image generation (attempt ${attempt})...`);
        }
      }
    );
    
    return response.url;
  } catch (error) {
    // Enhanced error handling
    handleError(error, { 
      operation: 'generateSceneImage',
      prompt: prompt.substring(0, 100),
      style 
    });
    
    return ''; // Return empty string on failure
  }
}

interface StoryboardScreenProps {
  project: Project;
  scenes: Scene[];
}

function StoryboardScreen({ project, scenes }: StoryboardScreenProps) {
  const route = useRoute();
  const navigation = useNavigation<StoryboardScreenNavigationProp>();
  const { id } = route.params as RouteParams;
  const database = useDatabase();
  const netInfo = useNetInfo();

  const [loading, setLoading] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [isVideoPlayerVisible, setIsVideoPlayerVisible] = useState(false);

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.trackScreenLoad('StoryboardScreen');
    
    // Preload images for better performance
    if (scenes) {
      const imageUrls = scenes
        .map(scene => scene.image)
        .filter(Boolean) as string[];
      
      if (imageUrls.length > 0) {
        imageCache.preloadImages(imageUrls);
      }
    }
  }, [scenes]);

  const handleGenerateStoryboard = async () => {
    if (!project) return;

    if (netInfo.isInternetReachable) {
      // Online logic: Call the AI API directly
      setLoading(true);
      const loadingToastId = toast.loading('Analyzing story and generating storyboard...');
      
      try {
        const scenesData = await aiGenerateScenes(project.sourceText);
        
        // Update the project status and create scenes in the database
        await updateProject(database, project.id, { status: 'storyboard' });
        
        // Create scenes in the database
        for (const sceneData of scenesData) {
          await database.write(async () => {
            await database.get<Scene>('scenes').create(scene => {
              scene.project.set(project);
              scene.text = sceneData.text;
              scene.imagePrompt = sceneData.imagePrompt;
            });
          });
        }
        
        toast.dismiss(loadingToastId);
        toast.success('Storyboard generated successfully!', `Created ${scenesData.length} scenes`);
      } catch (error) {
        toast.dismiss(loadingToastId);
        
        const appError = handleError(error, { 
          operation: 'handleGenerateStoryboard',
          projectId: project.id,
          textLength: project.sourceText.length 
        });
        
        toast.error(appError.userMessage, 'Storyboard Generation Failed');
      } finally {
        setLoading(false);
      }
    } else {
      // Offline logic: Add the job to the queue
      try {
        await queueAction(database, 'GENERATE_SCENES', { projectId: project.id });
        
        // Immediately update the project's local status to give user feedback
        await updateProject(database, project.id, { status: 'queued' });
        
        toast.message('Storyboard generation has been queued and will start when you are back online.');
      } catch (error) {
        handleError(error, { 
          operation: 'queueGenerateStoryboard',
          projectId: project.id 
        });
        toast.error('Failed to queue storyboard generation');
      }
    }
  };

  const handleGenerateImages = async () => {
    if (!project || scenes.length === 0) return;
    
    if (netInfo.isInternetReachable) {
      // Online logic: Generate images directly
      setGeneratingImages(true);
      const loadingToastId = toast.loading('Generating images for all scenes...');
      
      try {
        let successCount = 0;
        let failureCount = 0;
        
        for (let i = 0; i < scenes.length; i++) {
          const scene = scenes[i];
          if (!scene.image) {
            try {
              const imageUrl = await generateSceneImage(scene.text, project.style);
              if (imageUrl) {
                // Update the scene in the database
                await database.write(async () => {
                  await scene.update(() => {
                    scene.image = imageUrl;
                  });
                });
                successCount++;
              } else {
                failureCount++;
              }
            } catch (error) {
              failureCount++;
              handleError(error, { 
                operation: 'generateSceneImage',
                sceneIndex: i,
                sceneText: scene.text.substring(0, 50)
              });
            }
            
            // Update project progress
            await updateProject(database, project.id, { 
              progress: (i + 1) / scenes.length 
            });
          }
        }
        
        await updateProject(database, project.id, { 
          status: 'rendering',
          progress: 1 
        });
        
        toast.dismiss(loadingToastId);
        
        if (failureCount === 0) {
          toast.success('All scene images generated!', `${successCount} images created`);
        } else if (successCount > 0) {
          toast.warning(`Generated ${successCount} images`, `${failureCount} failed to generate`);
        } else {
          toast.error('Failed to generate images', 'Please check your connection and try again');
        }
      } catch (error) {
        toast.dismiss(loadingToastId);
        
        const appError = handleError(error, { 
          operation: 'handleGenerateImages',
          projectId: project.id,
          sceneCount: scenes.length 
        });
        
        toast.error(appError.userMessage, 'Image Generation Failed');
      } finally {
        setGeneratingImages(false);
      }
    } else {
      // Offline logic: Queue image generation for each scene
      try {
        let queuedCount = 0;
        
        // Queue image generation for each scene without an image
        for (const scene of scenes) {
          if (!scene.image) {
            await queueAction(database, 'GENERATE_IMAGE', { 
              sceneId: scene.id, 
              style: project.style 
            });
            queuedCount++;
          }
        }
        
        // Update project status to indicate queued operations
        await updateProject(database, project.id, { status: 'queued' });
        
        if (queuedCount > 0) {
          toast.message(
            `Queued ${queuedCount} images for generation`, 
            'Images will be generated when you are back online'
          );
        } else {
          toast.info('All scenes already have images');
        }
      } catch (error) {
        const appError = handleError(error, { 
          operation: 'queueGenerateImages',
          projectId: project.id 
        });
        toast.error('Failed to queue image generation');
      }
    }
  };
  
  const handleGenerateVideo = async () => {
    if (!project || scenes.length === 0) return;
    
    // Check if all scenes have images
    const missingImages = scenes.filter(scene => !scene.image).length;
    if (missingImages > 0) {
      toast.warning(
        'Some scenes are missing images', 
        `Generate images for all ${missingImages} scenes first`
      );
      return;
    }
    
    if (netInfo.isInternetReachable) {
      // Online logic: Generate video directly
      setGeneratingVideo(true);
      const loadingToastId = toast.loading('Generating video from storyboard...');
      
      try {
        // This is a placeholder for actual video generation API call
        // In a real implementation, you would call your video generation API here
        
        // Simulate API call with a timeout
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Placeholder video URL
        const videoUrl = 'https://example.com/placeholder-video.mp4';
        
        // Update the project with the video URL
        await updateProject(database, project.id, {
          videoUrl,
          status: 'complete',
        });
        
        toast.dismiss(loadingToastId);
        toast.success('Video generated successfully!');
      } catch (error) {
        toast.dismiss(loadingToastId);
        
        const appError = handleError(error, {
          operation: 'handleGenerateVideo',
          projectId: project.id,
        });
        
        toast.error(appError.userMessage, 'Video Generation Failed');
      } finally {
        setGeneratingVideo(false);
      }
    } else {
      // Offline logic: Queue video generation
      try {
        await queueAction(database, 'GENERATE_VIDEO', { projectId: project.id });
        
        // Update project status to indicate queued operations
        await updateProject(database, project.id, { status: 'queued' });
        
        toast.message(
          'Video generation has been queued',
          'Video will be generated when you are back online'
        );
      } catch (error) {
        const appError = handleError(error, {
          operation: 'queueGenerateVideo',
          projectId: project.id,
        });
        toast.error('Failed to queue video generation');
      }
    }
  };

  if (!project) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  // Optimized scene rendering with memoization
  const renderScene = useCallback(({ item, index }: { item: Scene; index: number }) => (
    <View 
      style={styles.sceneCard}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Scene ${index + 1}${item.image ? ' with image' : ''}`}
      accessibilityValue={{ text: item.text }}
    >
      <View style={styles.sceneHeader}>
        <Text style={styles.sceneIndex}>Scene {index + 1}</Text>
        {item.image && (
          <Ionicons 
            name="image" 
            size={16} 
            color="#10b981"
            accessibilityLabel="Scene has image"
          />
        )}
      </View>
      {item.image && (
        // Enhanced image caching with performance monitoring
        <CachedImage 
          source={{ uri: item.image }} 
          style={styles.sceneImage}
          showLoadingIndicator={true}
          accessibilityLabel={`Image for scene ${index + 1}: ${item.text.substring(0, 50)}...`}
        />
      )}
      <Text style={styles.sceneText}>{item.text}</Text>
    </View>
  ), []);

  // Memoized scenes for better performance
  const memoizedScenes = useMemo(() => {
    return scenes || [];
  }, [scenes]);

  return (
    <View style={styles.container}>
      {/* Video Player Modal */}
      {isVideoPlayerVisible && project.videoUrl && (
        <VideoPlayer
          uri={project.videoUrl}
          onClose={() => setIsVideoPlayerVisible(false)}
        />
      )}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.heading}>{project.title}</Text>
          <Text style={styles.subheading}>Style: {project.style}</Text>
        </View>

        {scenes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="film-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No storyboard yet</Text>
            <Text style={styles.emptySubtitle}>
              Generate a storyboard from your story text to get started
            </Text>
            
            <Pressable 
              style={[styles.button, styles.primaryButton]} 
              onPress={handleGenerateStoryboard} 
              disabled={loading}
              // COMPLETED: Added accessibility labels (Phase 1 Task 4)
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Generate storyboard"
              accessibilityHint="Analyzes your story text and creates scene breakdown"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="create-outline" size={20} color="white" />
                  <Text style={styles.buttonText}>Generate Storyboard</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.actionBar}>
              <Text style={styles.sceneCount}>
                {scenes.length} scenes • {scenes.filter(s => s.image).length} with images
              </Text>
              
              <View style={styles.actionButtons}>
                {/* Image Generation Button */}
                <Pressable 
                  style={[
                    styles.button, 
                    styles.secondaryButton,
                    (generatingImages || scenes.every(s => s.image)) && styles.buttonDisabled
                  ]} 
                  onPress={handleGenerateImages}
                  disabled={generatingImages || scenes.every(s => s.image)}
                  // COMPLETED: Added accessibility labels (Phase 1 Task 4)
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={scenes.every(s => s.image) ? 'All images generated' : 'Generate images'}
                  accessibilityHint="Creates visual images for each scene in the storyboard"
                  accessibilityState={{ disabled: generatingImages || scenes.every(s => s.image) }}
                >
                  {generatingImages ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={16} color={colors.primary} />
                      <Text style={styles.secondaryButtonText}>
                        {scenes.every(s => s.image) ? 'All Images Generated' : 'Generate Images'}
                      </Text>
                    </>
                  )}
                </Pressable>
                
                {/* Video Generation Button - Only show when all scenes have images */}
                {scenes.length > 0 && scenes.every(s => s.image) && (
                  <Pressable 
                    style={[
                      styles.button, 
                      styles.primaryButton,
                      generatingVideo && styles.buttonDisabled
                    ]} 
                    onPress={handleGenerateVideo}
                    disabled={generatingVideo}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Generate video"
                    accessibilityHint="Creates a video from all scenes with images"
                    accessibilityState={{ disabled: generatingVideo }}
                  >
                    {generatingVideo ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons name="videocam-outline" size={16} color="white" />
                        <Text style={styles.buttonText}>Generate Video</Text>
                      </>
                    )}
                  </Pressable>
                )}
                
                {/* Video Player Button - Only show when video is generated */}
                {project.videoUrl && (
                  <Pressable 
                    style={[styles.button, styles.successButton]} 
                    onPress={() => setIsVideoPlayerVisible(true)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="View video"
                    accessibilityHint="Opens the generated video"
                  >
                    <Ionicons name="play-circle-outline" size={16} color="white" />
                    <Text style={styles.buttonText}>View Video</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <OptimizedFlatList
              data={memoizedScenes}
              keyExtractor={(s) => s.id}
              renderItem={renderScene}
              itemHeight={280} // Approximate height of scene cards
              enableVirtualization={true}
              enableLazyLoading={true}
              enablePerformanceMonitoring={true}
              ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
              contentContainerStyle={{ paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              // Performance optimizations for scene list
              removeClippedSubviews={true}
              maxToRenderPerBatch={3}
              initialNumToRender={5}
              windowSize={8}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  successButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  container: { 
    flex: 1, 
    backgroundColor: colors.background
  },
  contentContainer: { 
    padding: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  heading: { 
    fontSize: 24, 
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    color: colors.mutedText,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sceneCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  sceneCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sceneIndex: { 
    fontWeight: '600',
    color: colors.primary,
    fontSize: 14,
  },
  sceneImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f1f5f9',
  },
  sceneText: { 
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});

// The 'enhance' HOC subscribes to database changes
const enhance = withObservables(['route'], ({ route }) => {
  const database = useDatabase();
  const { id } = route.params as RouteParams;
  
  return {
    // This query is now an observable.
    // Any change in the project or its scenes will re-render the component.
    project: database.get<Project>('projects').findAndObserve(id),
    scenes: database.get<Scene>('scenes').query(
      Q.where('project_id', id),
      Q.sortBy('created_at', Q.asc)
    ).observe(),
  };
});

export default enhance(StoryboardScreen);