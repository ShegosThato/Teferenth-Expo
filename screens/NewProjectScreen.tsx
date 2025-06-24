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
import { useStore, Project } from '../lib/store';
import { toast } from '../lib/toast';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../App';
import { colors } from '../lib/theme';
import { FILE_LIMITS } from '../config/env';

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
  const addProject = useStore((s) => s.addProject);

  const [title, setTitle] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [style, setStyle] = useState('Cinematic');

  const pickDocument = async () => {
    try {
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
        console.log('Document picking cancelled.');
        return;
      }

      const fileUri = result.assets?.[0]?.uri;
      const fileType = result.assets?.[0]?.mimeType;
      const fileName = result.assets?.[0]?.name;

      if (!fileUri) {
        toast.error('Could not get file URI.');
        return;
      }

      // Special handling for PDF/DOCX (cannot directly read content easily client-side)
      if (fileType === 'application/pdf' || fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        toast.message(`Selected ${fileName}. Direct text extraction from ${fileType.split('/')[1]?.toUpperCase()} is not supported. Please copy and paste the text manually.`);
        return; // Do not attempt to read content
      }

      // COMPLETED: Moved file size limits to environment config (Phase 1 Task 2)
      // Check file size using configurable limit
      const fileSize = result.assets?.[0]?.size;
      if (fileSize && fileSize > FILE_LIMITS.MAX_FILE_SIZE) {
        toast.error('File is too large. Please select a file smaller than 1MB.');
        return;
      }

      // Read content for text-based files
      if (Platform.OS === 'web') {
        const file = result.assets?.[0]?.file;
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              const content = e.target.result as string;
              // COMPLETED: Moved content length limits to environment config (Phase 1 Task 2)
              if (content.length > FILE_LIMITS.MAX_CONTENT_LENGTH) {
                toast.error('File content is too long. Please select a smaller file or copy/paste the relevant text.');
                return;
              }
              setSourceText(content);
              toast.success(`Successfully loaded ${fileName}!`);
            }
          };
          reader.onerror = (e) => {
            console.error('FileReader error', e);
            toast.error('Failed to read file content. Please try again or copy/paste the text manually.');
          };
          reader.readAsText(file);
        } else {
          toast.error('Could not access file content for web platform.');
        }
      } else {
        // For native (iOS, Android)
        try {
          const response = await fetch(fileUri);
          if (!response.ok) {
            throw new Error(`Failed to read file: ${response.status} ${response.statusText}`);
          }
          const text = await response.text();
          if (text.length > FILE_LIMITS.MAX_CONTENT_LENGTH) {
            toast.error('File content is too long. Please select a smaller file or copy/paste the relevant text.');
            return;
          }
          setSourceText(text);
          toast.success(`Successfully loaded ${fileName}!`);
        } catch (fetchError) {
          console.error('Failed to fetch file content:', fetchError);
          toast.error('Failed to read file content. Please try again or copy/paste the text manually.');
        }
      }
    } catch (err) {
      console.error('Document picking failed', err);
      toast.error('Failed to pick document.');
    }
  };

  const createProject = () => {
    // Input validation
    const trimmedTitle = title.trim();
    const trimmedSourceText = sourceText.trim();
    
    if (!trimmedTitle) {
      toast.error('Please enter a project title');
      return;
    }
    
    if (trimmedTitle.length < 3) {
      toast.error('Project title must be at least 3 characters long');
      return;
    }
    
    if (trimmedTitle.length > 100) {
      toast.error('Project title must be less than 100 characters');
      return;
    }
    
    if (!trimmedSourceText) {
      toast.error('Please enter story content');
      return;
    }
    
    if (trimmedSourceText.length < 50) {
      toast.error('Story content must be at least 50 characters long');
      return;
    }
    
    if (trimmedSourceText.length > FILE_LIMITS.MAX_CONTENT_LENGTH) {
      toast.error(`Story content is too long. Please keep it under ${FILE_LIMITS.MAX_CONTENT_LENGTH.toLocaleString()} characters`);
      return;
    }

    try {
      const newProject: Project = {
        // TODO: Use proper UUID library for better ID generation
        // NOTE: Current ID generation could have collisions in high-frequency usage
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
        title: trimmedTitle,
        sourceText: trimmedSourceText,
        style: style.trim() || 'Cinematic',
        scenes: [],
        status: 'draft',
        progress: 0,
        createdAt: Date.now(),
      };

      addProject(newProject);
      toast.success('Project created successfully!');
      navigation.navigate('Storyboard', { id: newProject.id });
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project. Please try again.');
    }
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
          style={styles.uploadButton}
          onPress={pickDocument}
          // COMPLETED: Added accessibility labels (Phase 1 Task 4)
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Upload document"
          accessibilityHint="Select a text file, markdown, or document to import story content"
        >
          <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
          <Text style={styles.uploadButtonText}>Upload Document</Text>
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
        style={[styles.button, (!title.trim() || !sourceText.trim() || title.trim().length < 3 || sourceText.trim().length < 50) && styles.buttonDisabled]} 
        onPress={createProject}
        disabled={!title.trim() || !sourceText.trim() || title.trim().length < 3 || sourceText.trim().length < 50}
        // COMPLETED: Added accessibility labels (Phase 1 Task 4)
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Create project"
        accessibilityHint="Creates a new storyboard project with the entered title and content"
        accessibilityState={{ disabled: !title.trim() || !sourceText.trim() || title.trim().length < 3 || sourceText.trim().length < 50 }}
      >
        <Ionicons name="add-circle-outline" size={20} color="white" />
        <Text style={styles.buttonText}>Create Project</Text>
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
});