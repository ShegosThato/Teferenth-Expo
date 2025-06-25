import React, { useState } from 'react';
import {
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDatabase } from '../db/DatabaseContext';
import { createProject } from '../db/actions';
import { toast } from '../lib/toast';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../App';
import { colors } from '../lib/theme';
import { FILE_LIMITS } from '../config/env';
import { handleError, safeAsync } from '../lib/errorHandling';
import { InlineLoading } from '../components/LoadingStates';

type NewProjectScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NewProject'>;

const VISUAL_STYLES = [
  { name: 'Cinematic', icon: 'film-outline', color: colors.info },
  { name: 'Animated', icon: 'color-palette-outline', color: '#8b5cf6' },
  { name: 'Watercolor', icon: 'brush-outline', color: '#06b6d4' },
  { name: 'Photorealistic', icon: 'camera-outline', color: colors.success },
  { name: 'Sketch', icon: 'pencil-outline', color: colors.warning },
  { name: 'Comic Book', icon: 'library-outline', color: colors.danger },
];

export default function NewProjectScreen() {
  const navigation = useNavigation<NewProjectScreenNavigationProp>();
  const database = useDatabase();

  const [title, setTitle] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [style, setStyle] = useState('Cinematic');
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const pickDocument = async () => {
    if (isUploading) return;
    
    setIsUploading(true);
    
    const result = await safeAsync(async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/plain',
          'text/markdown',
          'application/pdf',
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        ],
        copyToCacheDirectory: true, // Required for reading file content
      });

      if (result.canceled) {
        return null;
      }

      const fileUri = result.assets?.[0]?.uri;
      const fileType = result.assets?.[0]?.mimeType;
      const fileName = result.assets?.[0]?.name;
      const fileSize = result.assets?.[0]?.size;

      if (!fileUri) {
        throw new Error('Could not get file URI');
      }

      // Validate file type
      const supportedTypes = ['text/plain', 'text/markdown'];
      const unsupportedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (unsupportedTypes.includes(fileType || '')) {
        toast.info(
          `Selected ${fileName}. Direct text extraction from ${fileType?.split('/')[1]?.toUpperCase()} is not supported.`,
          'Please copy and paste the text manually'
        );
        return null;
      }

      // Validate file size
      if (fileSize && fileSize > FILE_LIMITS.MAX_FILE_SIZE) {
        throw new Error(`File is too large. Please select a file smaller than ${FILE_LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      // Read content for text-based files
      let content: string;
      
      if (Platform.OS === 'web') {
        const file = result.assets?.[0]?.file;
        if (!file) {
          throw new Error('Could not access file content for web platform');
        }
        
        content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              reject(new Error('Failed to read file content'));
            }
          };
          reader.onerror = () => reject(new Error('FileReader error'));
          reader.readAsText(file);
        });
      } else {
        // For native (iOS, Android)
        const response = await fetch(fileUri);
        if (!response.ok) {
          throw new Error(`Failed to read file: ${response.status} ${response.statusText}`);
        }
        content = await response.text();
      }

      // Validate content length
      if (content.length > FILE_LIMITS.MAX_CONTENT_LENGTH) {
        throw new Error(`File content is too long. Please keep it under ${FILE_LIMITS.MAX_CONTENT_LENGTH.toLocaleString()} characters`);
      }

      return { content, fileName };
    }, undefined, {
      operation: 'pickDocument',
      fileType: result?.assets?.[0]?.mimeType,
      fileSize: result?.assets?.[0]?.size
    });

    if (result?.content) {
      setSourceText(result.content);
      toast.success(`Successfully loaded ${result.fileName}!`);
    }

    setIsUploading(false);
  };

  const handleCreateProject = async () => {
    if (isCreating) return;
    
    // Input validation
    const trimmedTitle = title.trim();
    const trimmedSourceText = sourceText.trim();
    
    const validationErrors: string[] = [];
    
    if (!trimmedTitle) {
      validationErrors.push('Please enter a project title');
    } else if (trimmedTitle.length < 3) {
      validationErrors.push('Project title must be at least 3 characters long');
    } else if (trimmedTitle.length > 100) {
      validationErrors.push('Project title must be less than 100 characters');
    }
    
    if (!trimmedSourceText) {
      validationErrors.push('Please enter story content');
    } else if (trimmedSourceText.length < 50) {
      validationErrors.push('Story content must be at least 50 characters long');
    } else if (trimmedSourceText.length > FILE_LIMITS.MAX_CONTENT_LENGTH) {
      validationErrors.push(`Story content is too long. Please keep it under ${FILE_LIMITS.MAX_CONTENT_LENGTH.toLocaleString()} characters`);
    }

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setIsCreating(true);

    const result = await safeAsync(async () => {
      // Use the database action to create the project
      const newProject = await createProject(database, {
        title: trimmedTitle,
        sourceText: trimmedSourceText,
        style: style.trim() || 'Cinematic',
      });
      return newProject;
    }, undefined, {
      operation: 'createProject',
      titleLength: trimmedTitle.length,
      contentLength: trimmedSourceText.length,
      style
    });

    if (result) {
      toast.success('Project created successfully!');
      navigation.navigate('Storyboard', { id: result.id });
    }

    setIsCreating(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.label}>
          <Ionicons name="create-outline" size={16} color="#64748b" /> Project Title
        </Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter your project title"
          placeholderTextColor="#94a3b8"
          // COMPLETED: Added accessibility labels (Phase 1 Task 4)
          accessible={true}
          accessibilityLabel="Project title"
          accessibilityHint="Enter a name for your video storyboard project"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          <Ionicons name="document-text-outline" size={16} color="#64748b" /> Story Content
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={sourceText}
          onChangeText={setSourceText}
          placeholder="Paste your script, blog post, or write your story here..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          // COMPLETED: Added accessibility labels (Phase 1 Task 4)
          accessible={true}
          accessibilityLabel="Story content"
          accessibilityHint="Enter or paste the text content that will be converted into a storyboard"
        />
        <Pressable
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={pickDocument}
          disabled={isUploading}
          // COMPLETED: Added accessibility labels (Phase 1 Task 4)
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Upload document"
          accessibilityHint="Select a text file, markdown, or document to import story content"
          accessibilityState={{ disabled: isUploading }}
        >
          <InlineLoading
            loading={isUploading}
            size="small"
            color={colors.primary}
          >
            <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
            <Text style={styles.uploadButtonText}>Upload Document</Text>
          </InlineLoading>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          <Ionicons name="color-palette-outline" size={16} color="#64748b" /> Visual Style
        </Text>
        <View style={styles.styleGrid}>
          {VISUAL_STYLES.map((styleOption) => (
            <TouchableOpacity
              key={styleOption.name}
              style={[
                styles.styleCard,
                style === styleOption.name && styles.styleCardSelected,
                { borderColor: styleOption.color },
              ]}
              onPress={() => setStyle(styleOption.name)}
              // COMPLETED: Added accessibility labels (Phase 1 Task 4)
              accessible={true}
              accessibilityRole="radio"
              accessibilityLabel={`${styleOption.name} visual style`}
              accessibilityHint={`Select ${styleOption.name} as the visual style for generated images`}
              accessibilityState={{ selected: style === styleOption.name }}
            >
              <Ionicons 
                name={styleOption.icon as any} 
                size={24} 
                color={style === styleOption.name ? styleOption.color : '#64748b'} 
              />
              <Text 
                style={[
                  styles.styleName,
                  style === styleOption.name && { color: styleOption.color, fontWeight: '600' }
                ]}
              >
                {styleOption.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Pressable 
        style={[
          styles.button, 
          (isCreating || !title.trim() || !sourceText.trim() || title.trim().length < 3 || sourceText.trim().length < 50) && styles.buttonDisabled
        ]} 
        onPress={handleCreateProject}
        disabled={isCreating || !title.trim() || !sourceText.trim() || title.trim().length < 3 || sourceText.trim().length < 50}
        // COMPLETED: Added accessibility labels (Phase 1 Task 4)
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Create project"
        accessibilityHint="Creates a new storyboard project with the entered title and content"
        accessibilityState={{ disabled: isCreating || !title.trim() || !sourceText.trim() || title.trim().length < 3 || sourceText.trim().length < 50 }}
      >
        <InlineLoading
          loading={isCreating}
          loadingText="Creating..."
          size="small"
          color="white"
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Create Project</Text>
        </InlineLoading>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
    color: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.card,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  styleCardSelected: {
    backgroundColor: colors.background,
    borderWidth: 2,
  },
  styleName: {
    marginTop: 8,
    fontSize: 12,
    color: colors.mutedText,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    gap: 8,
  },
  uploadButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
});