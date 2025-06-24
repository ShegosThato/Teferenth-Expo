import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore, Scene } from '../lib/store';
import { toast } from '../lib/toast';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../App';
import { colors } from '../lib/theme';
import { API_URLS, ENV } from '../config/env';
import CachedImage from '../components/CachedImage';

interface RouteParams {
  id: string;
}

type StoryboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Storyboard'>;

async function aiGenerateScenes(text: string): Promise<Scene[]> {
  try {
    // COMPLETED: Moved API endpoint to environment variable (Phase 1 Task 2)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ENV.AI_TIMEOUT);
    
    const res = await fetch(API_URLS.AI_LLM, {
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
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const json = await res.json();
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
  } catch (e) {
    console.error(e);
    return text
      .split(/\n\n+/)
      .filter(Boolean)
      .map((p, idx) => ({ id: `${idx}`, text: p.trim() }));
  }
}

async function generateSceneImage(prompt: string, style: string): Promise<string> {
  try {
    // COMPLETED: Moved API endpoint to environment variable (Phase 1 Task 2)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ENV.IMAGE_TIMEOUT);
    
    const stylePrompt = `${prompt}, ${style} style, high quality, professional`;
    const response = await fetch(
      `${API_URLS.IMAGE_GENERATION}?text=${encodeURIComponent(stylePrompt)}&aspect=16:9`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    return response.url;
  } catch (error) {
    console.error('Image generation failed:', error);
    return '';
  }
}

export default function StoryboardScreen() {
  const route = useRoute();
  const navigation = useNavigation<StoryboardScreenNavigationProp>();
  const { id } = route.params as RouteParams;
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const updateProject = useStore((s) => s.updateProject);

  const [loading, setLoading] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);

  const handleGenerateStoryboard = async () => {
    if (!project) return;
    setLoading(true);
    toast.message('Analyzing story and generating storyboard...');
    
    try {
      const scenes = await aiGenerateScenes(project.sourceText);
      updateProject(project.id, { scenes, status: 'storyboard' });
      toast.success('Storyboard generated successfully!');
    } catch (error) {
      toast.error('Failed to generate storyboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!project || project.scenes.length === 0) return;
    
    setGeneratingImages(true);
    toast.message('Generating images for all scenes...');
    
    try {
      const updatedScenes = [...project.scenes];
      
      for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        if (!scene.image) {
          const imageUrl = await generateSceneImage(scene.text, project.style);
          if (imageUrl) {
            updatedScenes[i] = { ...scene, image: imageUrl };
            // Update project with current progress
            updateProject(project.id, { 
              scenes: [...updatedScenes],
              progress: (i + 1) / updatedScenes.length 
            });
          }
        }
      }
      
      updateProject(project.id, { 
        scenes: updatedScenes, 
        status: 'rendering',
        progress: 1 
      });
      toast.success('All scene images generated!');
    } catch (error) {
      toast.error('Failed to generate some images');
    } finally {
      setGeneratingImages(false);
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

  // COMPLETED: Added accessibility labels (Phase 1 Task 4)
  const renderScene = ({ item, index }: { item: Scene; index: number }) => (
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
        // COMPLETED: Implemented image caching (Phase 1 Task 3)
        <CachedImage 
          source={{ uri: item.image }} 
          style={styles.sceneImage}
          showLoadingIndicator={true}
          accessibilityLabel={`Image for scene ${index + 1}: ${item.text.substring(0, 50)}...`}
        />
      )}
      <Text style={styles.sceneText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.heading}>{project.title}</Text>
          <Text style={styles.subheading}>Style: {project.style}</Text>
        </View>

        {project.scenes.length === 0 ? (
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
                {project.scenes.length} scenes • {project.scenes.filter(s => s.image).length} with images
              </Text>
              
              <Pressable 
                style={[styles.button, styles.secondaryButton]} 
                onPress={handleGenerateImages}
                disabled={generatingImages || project.scenes.every(s => s.image)}
                // COMPLETED: Added accessibility labels (Phase 1 Task 4)
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={project.scenes.every(s => s.image) ? 'All images generated' : 'Generate images'}
                accessibilityHint="Creates visual images for each scene in the storyboard"
                accessibilityState={{ disabled: generatingImages || project.scenes.every(s => s.image) }}
              >
                {generatingImages ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={16} color={colors.primary} />
                    <Text style={styles.secondaryButtonText}>
                      {project.scenes.every(s => s.image) ? 'All Images Generated' : 'Generate Images'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            <FlatList
              data={project.scenes}
              keyExtractor={(s) => s.id}
              renderItem={renderScene}
              ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
              contentContainerStyle={{ paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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