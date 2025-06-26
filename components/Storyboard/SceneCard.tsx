/**
 * Scene Card Component
 * 
 * Individual scene card with image, text, and actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import CachedImage from '../CachedImage';
import type { SceneCardProps } from './types';

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  index,
  onPress,
  onRegenerateImage,
  isLoading = false,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.sceneNumber}>Scene {index + 1}</Text>
        {onRegenerateImage && (
          <TouchableOpacity
            onPress={onRegenerateImage}
            style={styles.regenerateButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="refresh-outline" size={16} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Scene Image */}
      <View style={styles.imageContainer}>
        {scene.image ? (
          <CachedImage
            source={{ uri: scene.image }}
            style={styles.image}
            placeholder={
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={32} color={colors.textMuted} />
              </View>
            }
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color={colors.textMuted} />
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
      </View>

      {/* Scene Text */}
      <View style={styles.textContainer}>
        <Text style={styles.sceneText} numberOfLines={3}>
          {scene.text}
        </Text>
        {scene.imagePrompt && (
          <Text style={styles.imagePrompt} numberOfLines={2}>
            Prompt: {scene.imagePrompt}
          </Text>
        )}
      </View>

      {/* Duration indicator */}
      {scene.duration && (
        <View style={styles.durationContainer}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.durationText}>{scene.duration}s</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sceneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  regenerateButton: {
    padding: 4,
  },
  imageContainer: {
    height: 200,
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  textContainer: {
    padding: 16,
  },
  sceneText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    marginBottom: 8,
  },
  imagePrompt: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  durationText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
  },
});