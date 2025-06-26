/**
 * Storyboard Actions Component
 * 
 * Action buttons for scene and video generation
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import { EnhancedButton } from '../EnhancedUI';
import type { StoryboardActionsProps } from './types';

export const StoryboardActions: React.FC<StoryboardActionsProps> = ({
  project,
  scenes,
  onGenerateScenes,
  onGenerateImages,
  onGenerateVideo,
  isLoading,
}) => {
  const hasScenes = scenes.length > 0;
  const hasImages = scenes.some(scene => scene.image);
  const canGenerateVideo = hasScenes && hasImages;

  const handleGenerateScenes = () => {
    if (hasScenes) {
      Alert.alert(
        'Regenerate Scenes',
        'This will replace all existing scenes. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Regenerate', style: 'destructive', onPress: onGenerateScenes },
        ]
      );
    } else {
      onGenerateScenes();
    }
  };

  const handleGenerateImages = () => {
    if (!hasScenes) {
      Alert.alert(
        'No Scenes',
        'Please generate scenes first before creating images.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (hasImages) {
      Alert.alert(
        'Regenerate Images',
        'This will replace all existing images. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Regenerate', style: 'destructive', onPress: onGenerateImages },
        ]
      );
    } else {
      onGenerateImages();
    }
  };

  const handleGenerateVideo = () => {
    if (!canGenerateVideo) {
      Alert.alert(
        'Cannot Generate Video',
        'Please ensure all scenes have images before generating video.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Generate Video',
      `This will create a video with ${scenes.length} scenes. This may take a few minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate', onPress: onGenerateVideo },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generation Tools</Text>
      
      <View style={styles.actionsGrid}>
        {/* Generate Scenes */}
        <View style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <Ionicons 
              name="document-text-outline" 
              size={24} 
              color={hasScenes ? colors.success : colors.primary} 
            />
            <Text style={styles.actionTitle}>Scenes</Text>
            {hasScenes && (
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            )}
          </View>
          <Text style={styles.actionDescription}>
            Break story into scenes using AI
          </Text>
          <EnhancedButton
            title={hasScenes ? "Regenerate" : "Generate Scenes"}
            variant={hasScenes ? "outline" : "primary"}
            size="sm"
            onPress={handleGenerateScenes}
            loading={isLoading}
            style={styles.actionButton}
          />
        </View>

        {/* Generate Images */}
        <View style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <Ionicons 
              name="images-outline" 
              size={24} 
              color={hasImages ? colors.success : hasScenes ? colors.primary : colors.textMuted} 
            />
            <Text style={[
              styles.actionTitle,
              !hasScenes && styles.disabledText
            ]}>
              Images
            </Text>
            {hasImages && (
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            )}
          </View>
          <Text style={[
            styles.actionDescription,
            !hasScenes && styles.disabledText
          ]}>
            Create visuals for each scene
          </Text>
          <EnhancedButton
            title={hasImages ? "Regenerate" : "Generate Images"}
            variant={hasImages ? "outline" : "primary"}
            size="sm"
            onPress={handleGenerateImages}
            loading={isLoading}
            disabled={!hasScenes}
            style={styles.actionButton}
          />
        </View>

        {/* Generate Video */}
        <View style={[styles.actionCard, styles.videoCard]}>
          <View style={styles.actionHeader}>
            <Ionicons 
              name="videocam-outline" 
              size={24} 
              color={canGenerateVideo ? colors.primary : colors.textMuted} 
            />
            <Text style={[
              styles.actionTitle,
              !canGenerateVideo && styles.disabledText
            ]}>
              Video
            </Text>
          </View>
          <Text style={[
            styles.actionDescription,
            !canGenerateVideo && styles.disabledText
          ]}>
            Combine scenes into final video
          </Text>
          <EnhancedButton
            title="Generate Video"
            variant="primary"
            size="sm"
            onPress={handleGenerateVideo}
            loading={isLoading}
            disabled={!canGenerateVideo}
            style={styles.actionButton}
          />
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressIndicator}>
        <View style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            hasScenes && styles.progressDotComplete
          ]} />
          <Text style={styles.progressLabel}>Scenes</Text>
        </View>
        
        <View style={[
          styles.progressLine,
          hasScenes && styles.progressLineComplete
        ]} />
        
        <View style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            hasImages && styles.progressDotComplete
          ]} />
          <Text style={styles.progressLabel}>Images</Text>
        </View>
        
        <View style={[
          styles.progressLine,
          hasImages && styles.progressLineComplete
        ]} />
        
        <View style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            project.videoUrl && styles.progressDotComplete
          ]} />
          <Text style={styles.progressLabel}>Video</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  actionsGrid: {
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  actionButton: {
    // No additional styles needed
  },
  disabledText: {
    color: colors.textMuted,
    opacity: 0.6,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  progressDotComplete: {
    backgroundColor: colors.success,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  progressLineComplete: {
    backgroundColor: colors.success,
  },
});