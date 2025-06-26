/**
 * Scene List Component
 * 
 * Optimized list for displaying scenes with virtualization
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '../../lib/theme';
import { OptimizedFlatList } from '../OptimizedFlatList';
import { SceneCardSkeleton } from '../LoadingStates';
import { SceneCard } from './SceneCard';
import type { SceneListProps } from './types';

export const SceneList: React.FC<SceneListProps> = ({
  scenes,
  isLoading,
  onScenePress,
  onRegenerateImage,
}) => {
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <SceneCard
      scene={item}
      index={index}
      onPress={() => onScenePress?.(item)}
      onRegenerateImage={() => onRegenerateImage?.(item)}
      isLoading={isLoading}
    />
  ), [onScenePress, onRegenerateImage, isLoading]);

  const renderSkeleton = useCallback(() => (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 3 }).map((_, index) => (
        <SceneCardSkeleton key={index} />
      ))}
    </View>
  ), []);

  const EmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No scenes yet</Text>
      <Text style={styles.emptySubtitle}>
        Generate scenes from your story to get started
      </Text>
    </View>
  ), []);

  if (isLoading && scenes.length === 0) {
    return renderSkeleton();
  }

  return (
    <OptimizedFlatList
      data={scenes}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      itemHeight={280} // Approximate height of scene cards
      enableVirtualization={true}
      enableLazyLoading={true}
      enablePerformanceMonitoring={true}
      emptyComponent={EmptyState}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={3}
      initialNumToRender={5}
      windowSize={8}
      getItemLayout={(data, index) => ({
        length: 280,
        offset: 280 * index,
        index,
      })}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  skeletonContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});