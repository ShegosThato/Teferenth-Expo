/**
 * Video Controls Component
 * 
 * Controls for video generation and playback
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
import { EnhancedButton } from '../EnhancedUI';
import type { VideoControlsProps } from './types';

export const VideoControls: React.FC<VideoControlsProps> = ({
  project,
  onGenerateVideo,
  onPlayVideo,
  isGenerating,
  hasVideo,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return colors.textMuted;
      case 'storyboard': return colors.info;
      case 'rendering': return colors.warning;
      case 'complete': return colors.success;
      default: return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return 'document-outline';
      case 'storyboard': return 'images-outline';
      case 'rendering': return 'videocam-outline';
      case 'complete': return 'checkmark-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  return (
    <View style={styles.container}>
      {/* Project Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Ionicons 
            name={getStatusIcon(project.status) as any} 
            size={20} 
            color={getStatusColor(project.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Text>
        </View>
        
        {project.status === 'rendering' && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { 
                    width: `${(project.progress || 0) * 100}%`,
                    backgroundColor: colors.warning,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((project.progress || 0) * 100)}%
            </Text>
          </View>
        )}
      </View>

      {/* Video Controls */}
      <View style={styles.controlsContainer}>
        {hasVideo && project.videoUrl ? (
          <View style={styles.videoActions}>
            <EnhancedButton
              title="Play Video"
              variant="primary"
              icon="play-outline"
              onPress={onPlayVideo}
              style={styles.playButton}
            />
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <EnhancedButton
            title={isGenerating ? "Generating Video..." : "Generate Video"}
            variant="primary"
            icon={isGenerating ? undefined : "videocam-outline"}
            onPress={onGenerateVideo}
            loading={isGenerating}
            disabled={project.scenes?.length === 0}
            fullWidth
            style={styles.generateButton}
          />
        )}
      </View>

      {/* Video Info */}
      {hasVideo && (
        <View style={styles.videoInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoText}>
              {project.scenes?.reduce((total, scene) => total + (scene.duration || 3), 0)}s
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="film-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoText}>
              {project.scenes?.length || 0} scenes
            </Text>
          </View>
        </View>
      )}
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
  statusContainer: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    minWidth: 35,
  },
  controlsContainer: {
    marginBottom: 12,
  },
  videoActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    flex: 1,
    marginRight: 12,
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButton: {
    // No additional styles needed
  },
  videoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 4,
    fontWeight: '500',
  },
});