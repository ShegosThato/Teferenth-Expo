/**
 * Type Safety Migration Example
 * 
 * This file demonstrates how to migrate from the old any-typed code
 * to the new type-safe architecture.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';

// NEW: Import from centralized types
import {
  Project,
  Scene,
  AppError,
  NetworkInfo,
  AIResponse,
  ProjectModel,
  ActionQueueItem,
} from '../types';

// NEW: Import enhanced services
import { enhancedFetch, withRetry, handleError } from '../lib/enhancedErrorHandling';
import { CONFIG, ENV } from '../config/enhancedEnv';
import { useProjectStore } from '../stores';

// OLD vs NEW: Component with type safety improvements
const TypeSafeMigrationExample: React.FC = () => {
  // NEW: Properly typed state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);

  // NEW: Type-safe store usage
  const { addProject, updateProject } = useProjectStore();

  // OLD: Function with any types
  const oldFetchProjects = async (): Promise<any> => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      return data; // any type
    } catch (error: any) {
      console.error(error); // any type
      throw error;
    }
  };

  // NEW: Type-safe function with proper error handling
  const newFetchProjects = async (): Promise<Project[]> => {
    try {
      const response = await enhancedFetch<{ projects: Project[] }>('/api/projects', {
        method: 'GET',
        timeout: ENV.AI_TIMEOUT,
      });
      
      // Type-safe access to response data
      return response.projects;
    } catch (error) {
      // Type-safe error handling
      const appError = handleError(error, { 
        operation: 'fetch_projects',
        screen: 'TypeSafeMigration' 
      });
      throw appError;
    }
  };

  // OLD: AI scene generation with any types
  const oldGenerateScenes = async (text: string): Promise<any[]> => {
    try {
      const response = await fetch('/api/ai/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      return data.map((scene: any) => ({
        id: scene.id,
        text: scene.text,
        imagePrompt: scene.imagePrompt,
      }));
    } catch (error: any) {
      console.error('AI generation failed:', error);
      throw error;
    }
  };

  // NEW: Type-safe AI scene generation with validation
  const newGenerateScenes = async (text: string): Promise<Scene[]> => {
    try {
      const response = await withRetry(
        () => enhancedFetch<AIResponse>(CONFIG.apiUrls.AI_LLM, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ENV.AI_API_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'Generate storyboard scenes from text.',
              },
              { role: 'user', content: text },
            ],
          }),
          timeout: ENV.AI_TIMEOUT,
        }),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffFactor: 2,
          retryableErrors: ['NETWORK_ERROR', 'AI_ERROR', 'TIMEOUT_ERROR'],
        }
      );

      // Type-safe validation and transformation
      return response.scenes.map((sceneData, index) => ({
        id: `scene_${Date.now()}_${index}`,
        text: sceneData.text,
        imagePrompt: sceneData.imagePrompt,
        duration: sceneData.duration || 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
    } catch (error) {
      const appError = handleError(error, { 
        operation: 'generate_scenes',
        textLength: text.length,
      });
      throw appError;
    }
  };

  // OLD: Project creation with loose typing
  const oldCreateProject = async (data: any): Promise<void> => {
    try {
      const project = {
        id: Date.now().toString(),
        title: data.title,
        sourceText: data.text,
        style: data.style,
        status: 'draft',
        progress: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      // No type validation
      setProjects(prev => [...prev, project]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // NEW: Type-safe project creation with validation
  const newCreateProject = async (data: {
    title: string;
    sourceText: string;
    style: string;
  }): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Validate input data
      if (!data.title.trim()) {
        throw new Error('Project title is required');
      }
      
      if (!data.sourceText.trim()) {
        throw new Error('Source text is required');
      }

      // Generate scenes using type-safe function
      const scenes = await newGenerateScenes(data.sourceText);

      // Create project with proper typing
      const project: Project = {
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title,
        sourceText: data.sourceText,
        style: data.style,
        scenes,
        status: 'storyboard',
        progress: 0.5, // 50% complete after scene generation
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        metadata: {
          wordCount: data.sourceText.split(/\s+/).length,
          estimatedReadTime: Math.ceil(data.sourceText.split(/\s+/).length / 200),
          tags: [],
        },
      };

      // Use type-safe store action
      await addProject(project);
      
      // Update local state
      setProjects(prev => [...prev, project]);
    } catch (error) {
      const appError = handleError(error, { 
        operation: 'create_project',
        projectTitle: data.title,
      });
      
      setError(appError);
      Alert.alert('Error', appError.userMessage || appError.message);
    } finally {
      setLoading(false);
    }
  };

  // OLD: Network state handling with any type
  const oldHandleNetworkChange = (netInfo: any): void => {
    if (netInfo.isConnected) {
      console.log('Connected to:', netInfo.type);
    }
  };

  // NEW: Type-safe network state handling
  const newHandleNetworkChange = (netInfo: NetworkInfo): void => {
    if (netInfo.isInternetReachable) {
      console.log('Connected to:', netInfo.type);
      
      // Process any pending offline actions
      if (netInfo.isConnected) {
        // Type-safe network operations
        processPendingActions();
      }
    } else {
      console.log('Working offline');
    }
  };

  // NEW: Type-safe pending actions processing
  const processPendingActions = async (): Promise<void> => {
    try {
      // This would integrate with the enhanced sync engine
      console.log('Processing pending actions...');
    } catch (error) {
      const appError = handleError(error, { operation: 'process_pending_actions' });
      console.error('Failed to process pending actions:', appError);
    }
  };

  // OLD: Error handling with any type
  const oldHandleError = (error: any): void => {
    console.error('Something went wrong:', error);
    Alert.alert('Error', error.message || 'Unknown error');
  };

  // NEW: Type-safe error handling with classification
  const newHandleError = (error: unknown): void => {
    const appError = handleError(error, { 
      screen: 'TypeSafeMigration',
      timestamp: Date.now(),
    });

    // Type-safe error handling based on error type
    switch (appError.type) {
      case 'NETWORK_ERROR':
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
        break;
      case 'VALIDATION_ERROR':
        Alert.alert('Invalid Input', appError.userMessage || appError.message);
        break;
      case 'AI_ERROR':
        Alert.alert('AI Service Error', 'The AI service is temporarily unavailable. Please try again later.');
        break;
      default:
        Alert.alert('Error', appError.userMessage || 'An unexpected error occurred.');
    }

    // Log error for debugging
    console.error(`${appError.type}: ${appError.message}`, appError);
  };

  // Component lifecycle with type safety
  useEffect(() => {
    const loadProjects = async (): Promise<void> => {
      try {
        setLoading(true);
        const fetchedProjects = await newFetchProjects();
        setProjects(fetchedProjects);
      } catch (error) {
        newHandleError(error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Render with type-safe data
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Type Safety Migration Example
      </Text>

      {loading && (
        <Text style={{ fontSize: 16, color: '#666' }}>Loading...</Text>
      )}

      {error && (
        <View style={{ 
          backgroundColor: '#ffebee', 
          padding: 12, 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          <Text style={{ color: '#c62828', fontWeight: 'bold' }}>
            {error.type}: {error.message}
          </Text>
          {error.userMessage && (
            <Text style={{ color: '#c62828', marginTop: 4 }}>
              {error.userMessage}
            </Text>
          )}
        </View>
      )}

      <Text style={{ fontSize: 18, marginBottom: 8 }}>
        Projects ({projects.length})
      </Text>

      {projects.map((project) => (
        <View 
          key={project.id} 
          style={{ 
            backgroundColor: '#f5f5f5', 
            padding: 12, 
            borderRadius: 8, 
            marginBottom: 8 
          }}
        >
          <Text style={{ fontWeight: 'bold' }}>{project.title}</Text>
          <Text style={{ color: '#666' }}>
            Status: {project.status} • Scenes: {project.scenes.length}
          </Text>
          <Text style={{ color: '#666', fontSize: 12 }}>
            Created: {new Date(project.createdAt).toLocaleDateString()}
          </Text>
        </View>
      ))}

      {projects.length === 0 && !loading && (
        <Text style={{ color: '#666', fontStyle: 'italic' }}>
          No projects found. Create your first project to get started.
        </Text>
      )}
    </View>
  );
};

export default TypeSafeMigrationExample;

/**
 * MIGRATION SUMMARY
 * 
 * Key improvements demonstrated:
 * 
 * 1. **Eliminated any types** - All functions now have proper typing
 * 2. **Enhanced error handling** - Type-safe error classification and handling
 * 3. **API type safety** - Proper typing for all API interactions
 * 4. **Input validation** - Runtime validation with type safety
 * 5. **Better state management** - Type-safe state with proper interfaces
 * 6. **Enhanced debugging** - Better error reporting and context
 * 
 * Benefits achieved:
 * - Compile-time error detection
 * - Better IDE support and IntelliSense
 * - Reduced runtime errors
 * - Improved code maintainability
 * - Enhanced developer experience
 */