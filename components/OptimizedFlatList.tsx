/**
 * Optimized FlatList Component
 * 
 * Enhanced FlatList with performance optimizations for large datasets:
 * - Intelligent item rendering and recycling
 * - Memory management and cleanup
 * - Progressive loading and virtualization
 * - Performance monitoring integration
 * 
 * Phase 2 Task 2: Performance Optimizations
 */

import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { 
  FlatList, 
  FlatListProps, 
  ViewToken, 
  ListRenderItem,
  RefreshControl,
  View,
  Text,
  StyleSheet
} from 'react-native';
import { performanceMonitor, PerformanceOptimizer } from '../lib/performance';
import { LoadingSpinner, Skeleton } from './LoadingStates';
import { LazyListItem } from './LazyLoading';
import { colors } from '../lib/theme';

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  itemHeight?: number;
  enableVirtualization?: boolean;
  enableLazyLoading?: boolean;
  enablePerformanceMonitoring?: boolean;
  preloadThreshold?: number;
  onEndReachedThreshold?: number;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  emptyComponent?: React.ComponentType;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ onRetry: () => void }>;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
}

export function OptimizedFlatList<T>({
  data,
  renderItem,
  itemHeight = 100,
  enableVirtualization = true,
  enableLazyLoading = true,
  enablePerformanceMonitoring = true,
  preloadThreshold = 0.8,
  onEndReachedThreshold = 0.1,
  onEndReached,
  onRefresh,
  refreshing = false,
  emptyComponent: EmptyComponent,
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  isLoading = false,
  hasError = false,
  onRetry,
  ...props
}: OptimizedFlatListProps<T>) {
  const flatListRef = useRef<FlatList<T>>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const [renderCount, setRenderCount] = useState(0);
  const renderStartTime = useRef<number>(0);

  // Performance monitoring
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      performanceMonitor.trackScreenLoad('OptimizedFlatList');
    }
  }, [enablePerformanceMonitoring]);

  // Memoized render item with performance tracking
  const optimizedRenderItem = useCallback<ListRenderItem<T>>(
    ({ item, index }) => {
      if (enablePerformanceMonitoring) {
        renderStartTime.current = Date.now();
      }

      const isVisible = visibleItems.has(index);
      
      if (enableLazyLoading && !isVisible && index > 10) {
        return (
          <LazyListItem
            index={index}
            isVisible={isVisible}
            style={{ height: itemHeight }}
          >
            {renderItem({ item, index, separators: {} as any })}
          </LazyListItem>
        );
      }

      const renderedItem = renderItem({ item, index, separators: {} as any });

      if (enablePerformanceMonitoring) {
        const renderTime = Date.now() - renderStartTime.current;
        if (renderTime > 16) { // More than one frame
          console.warn(`Slow render for item ${index}: ${renderTime}ms`);
        }
      }

      return renderedItem;
    },
    [renderItem, visibleItems, enableLazyLoading, enablePerformanceMonitoring, itemHeight]
  );

  // Optimized viewability config
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }), []);

  // Track visible items for lazy loading
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const newVisibleItems = new Set(
        viewableItems.map(item => item.index).filter(index => index !== null) as number[]
      );
      setVisibleItems(newVisibleItems);

      // Preload upcoming items
      if (enableLazyLoading && viewableItems.length > 0) {
        const lastVisibleIndex = Math.max(...Array.from(newVisibleItems));
        const preloadCount = Math.ceil(data.length * preloadThreshold);
        
        for (let i = lastVisibleIndex + 1; i < Math.min(lastVisibleIndex + preloadCount, data.length); i++) {
          newVisibleItems.add(i);
        }
        
        setVisibleItems(newVisibleItems);
      }
    },
    [data.length, enableLazyLoading, preloadThreshold]
  );

  // Memoized viewability callback
  const viewabilityConfigCallbackPairs = useMemo(
    () => [{ viewabilityConfig, onViewableItemsChanged }],
    [viewabilityConfig, onViewableItemsChanged]
  );

  // Optimized key extractor
  const keyExtractor = useCallback(
    (item: T, index: number) => {
      // Try to use item's id property, fallback to index
      const itemWithId = item as any;
      return itemWithId?.id?.toString() || itemWithId?.key?.toString() || index.toString();
    },
    []
  );

  // Optimized get item layout for better performance
  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;
    
    return (data: T[] | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [itemHeight]);

  // Throttled scroll handler
  const onScroll = useMemo(
    () => PerformanceOptimizer.throttle((event: any) => {
      if (enablePerformanceMonitoring) {
        const scrollY = event.nativeEvent.contentOffset.y;
        performanceMonitor.startTimer('scroll_performance');
      }
    }, 16), // 60fps
    [enablePerformanceMonitoring]
  );

  // Optimized refresh control
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    
    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.primary}
        colors={[colors.primary]}
      />
    );
  }, [onRefresh, refreshing]);

  // Error state
  if (hasError && ErrorComponent) {
    return (
      <View style={styles.centerContainer}>
        <ErrorComponent onRetry={onRetry || (() => {})} />
      </View>
    );
  }

  // Loading state
  if (isLoading && LoadingComponent) {
    return (
      <View style={styles.centerContainer}>
        <LoadingComponent />
      </View>
    );
  }

  // Empty state
  if (!isLoading && data.length === 0 && EmptyComponent) {
    return (
      <View style={styles.centerContainer}>
        <EmptyComponent />
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={optimizedRenderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={refreshControl}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      // Performance optimizations
      removeClippedSubviews={enableVirtualization}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      // Memory optimizations
      disableVirtualization={!enableVirtualization}
      legacyImplementation={false}
      {...props}
    />
  );
}

// Optimized section list component
interface OptimizedSectionListProps<T> {
  sections: Array<{
    title: string;
    data: T[];
  }>;
  renderItem: ListRenderItem<T>;
  renderSectionHeader?: ({ section }: { section: { title: string; data: T[] } }) => React.ReactElement;
  itemHeight?: number;
  sectionHeaderHeight?: number;
  enableVirtualization?: boolean;
}

export function OptimizedSectionList<T>({
  sections,
  renderItem,
  renderSectionHeader,
  itemHeight = 100,
  sectionHeaderHeight = 40,
  enableVirtualization = true,
}: OptimizedSectionListProps<T>) {
  // Flatten sections into a single array with section markers
  const flatData = useMemo(() => {
    const result: Array<{ type: 'header' | 'item'; data: any; sectionIndex: number; itemIndex?: number }> = [];
    
    sections.forEach((section, sectionIndex) => {
      result.push({ type: 'header', data: section, sectionIndex });
      section.data.forEach((item, itemIndex) => {
        result.push({ type: 'item', data: item, sectionIndex, itemIndex });
      });
    });
    
    return result;
  }, [sections]);

  const renderFlatItem = useCallback<ListRenderItem<any>>(
    ({ item }) => {
      if (item.type === 'header') {
        return renderSectionHeader ? renderSectionHeader({ section: item.data }) : (
          <View style={styles.defaultSectionHeader}>
            <Text style={styles.defaultSectionHeaderText}>{item.data.title}</Text>
          </View>
        );
      }
      
      return renderItem({ 
        item: item.data, 
        index: item.itemIndex!, 
        separators: {} as any 
      });
    },
    [renderItem, renderSectionHeader]
  );

  const getItemLayout = useCallback(
    (data: any[] | null | undefined, index: number) => {
      const item = flatData[index];
      const height = item?.type === 'header' ? sectionHeaderHeight : itemHeight;
      
      let offset = 0;
      for (let i = 0; i < index; i++) {
        const prevItem = flatData[i];
        offset += prevItem?.type === 'header' ? sectionHeaderHeight : itemHeight;
      }
      
      return { length: height, offset, index };
    },
    [flatData, itemHeight, sectionHeaderHeight]
  );

  return (
    <OptimizedFlatList
      data={flatData}
      renderItem={renderFlatItem}
      getItemLayout={getItemLayout}
      enableVirtualization={enableVirtualization}
      keyExtractor={(item, index) => `${item.type}-${item.sectionIndex}-${item.itemIndex || 0}`}
    />
  );
}

// Performance monitoring hook for FlatList
export function useFlatListPerformance() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    scrollPerformance: 0,
    memoryUsage: 0,
  });

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics({
        renderTime: newMetrics.renderTime || 0,
        scrollPerformance: 0, // Would be calculated from scroll events
        memoryUsage: newMetrics.memoryUsage?.percentage || 0,
      });
    });

    return unsubscribe;
  }, []);

  return metrics;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  defaultSectionHeader: {
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  defaultSectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});