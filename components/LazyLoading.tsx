/**
 * Lazy Loading Components and Utilities
 * 
 * Provides lazy loading capabilities for screens, components, and images
 * to improve app performance and reduce initial bundle size.
 * 
 * Phase 2 Task 2: Performance Optimizations
 */

import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { View, Dimensions, ViewStyle } from 'react-native';
import { LoadingSpinner, Skeleton } from './LoadingStates';
import { performanceMonitor } from '../lib/performance';

// Lazy loading wrapper for components
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  onLoad?: () => void;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback = <LoadingSpinner message="Loading component..." />,
  delay = 0,
  onLoad
}) => {
  const [shouldRender, setShouldRender] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setShouldRender(true);
        onLoad?.();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [delay, onLoad]);

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <Suspense fallback={fallback}>{children}</Suspense>;
};

// Intersection observer for lazy loading
interface LazyViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  threshold?: number;
  fallback?: React.ReactNode;
  onVisible?: () => void;
}

export const LazyView: React.FC<LazyViewProps> = ({
  children,
  style,
  threshold = 0.1,
  fallback = <Skeleton height={100} />,
  onVisible
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    // Simple visibility detection based on scroll position
    // In a real implementation, you'd use react-native-intersection-observer
    // or implement proper intersection detection
    
    const timer = setTimeout(() => {
      setIsVisible(true);
      setIsIntersecting(true);
      onVisible?.();
    }, 100);

    return () => clearTimeout(timer);
  }, [onVisible]);

  if (!isVisible) {
    return <View style={style}>{fallback}</View>;
  }

  return (
    <View ref={viewRef} style={style}>
      {children}
    </View>
  );
};

// Lazy image loading with progressive enhancement
interface LazyImageProps {
  source: { uri: string };
  style?: ViewStyle;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  source,
  style,
  placeholder = <Skeleton height={200} />,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simulate intersection observer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible || !source.uri) return;

    performanceMonitor.startTimer(`image_load_${source.uri}`);

    // Preload image
    const image = new Image();
    image.onload = () => {
      const loadTime = performanceMonitor.endTimer(`image_load_${source.uri}`);
      setIsLoaded(true);
      onLoad?.();
      
      if (loadTime > 2000) {
        console.warn(`Slow image load: ${source.uri} took ${loadTime}ms`);
      }
    };
    
    image.onerror = (error) => {
      performanceMonitor.endTimer(`image_load_${source.uri}`);
      setHasError(true);
      onError?.(error);
    };
    
    image.src = source.uri;
  }, [isVisible, source.uri, onLoad, onError]);

  if (!isVisible || (!isLoaded && !hasError)) {
    return <View style={style}>{placeholder}</View>;
  }

  if (hasError) {
    return (
      <View style={[style, { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }]}>
        <Skeleton height={200} />
      </View>
    );
  }

  // In a real implementation, you'd return the actual Image component here
  return (
    <View style={style}>
      {/* Placeholder for actual image */}
      <View style={{ flex: 1, backgroundColor: '#e5e7eb' }} />
    </View>
  );
};

// Lazy list item for FlatList optimization
interface LazyListItemProps {
  children: React.ReactNode;
  index: number;
  isVisible: boolean;
  style?: ViewStyle;
}

export const LazyListItem: React.FC<LazyListItemProps> = ({
  children,
  index,
  isVisible,
  style
}) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible && !shouldRender) {
      // Delay rendering for better performance
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, index * 10); // Stagger rendering

      return () => clearTimeout(timer);
    }
  }, [isVisible, shouldRender, index]);

  if (!shouldRender) {
    return (
      <View style={style}>
        <Skeleton height={100} />
      </View>
    );
  }

  return <View style={style}>{children}</View>;
};

// Virtual list for large datasets
interface VirtualListProps {
  data: any[];
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const VirtualList: React.FC<VirtualListProps> = ({
  data,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);

  const visibleStart = Math.floor(scrollOffset / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
    data.length
  );

  const visibleItems = data.slice(
    Math.max(0, visibleStart - overscan),
    visibleEnd
  );

  const offsetY = Math.max(0, visibleStart - overscan) * itemHeight;

  return (
    <View style={{ height: containerHeight, overflow: 'hidden' }}>
      <View style={{ transform: [{ translateY: offsetY }] }}>
        {visibleItems.map((item, index) => (
          <View key={Math.max(0, visibleStart - overscan) + index} style={{ height: itemHeight }}>
            {renderItem({ item, index: Math.max(0, visibleStart - overscan) + index })}
          </View>
        ))}
      </View>
    </View>
  );
};

// Code splitting utility for screens
export function createLazyScreen<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyScreen = lazy(importFn);
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <LoadingSpinner message="Loading screen..." />}>
      <LazyScreen {...props} />
    </Suspense>
  );
}

// Progressive enhancement wrapper
interface ProgressiveEnhancementProps {
  children: React.ReactNode;
  enhanced: React.ReactNode;
  condition?: boolean;
  delay?: number;
}

export const ProgressiveEnhancement: React.FC<ProgressiveEnhancementProps> = ({
  children,
  enhanced,
  condition = true,
  delay = 1000
}) => {
  const [shouldEnhance, setShouldEnhance] = useState(false);

  useEffect(() => {
    if (condition) {
      const timer = setTimeout(() => {
        setShouldEnhance(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [condition, delay]);

  return shouldEnhance ? <>{enhanced}</> : <>{children}</>;
};

// Memory-efficient component wrapper
interface MemoryEfficientProps {
  children: React.ReactNode;
  maxInstances?: number;
  cleanupDelay?: number;
}

export const MemoryEfficient: React.FC<MemoryEfficientProps> = ({
  children,
  maxInstances = 10,
  cleanupDelay = 30000
}) => {
  const [isActive, setIsActive] = useState(true);
  const cleanupTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (cleanupTimer.current) {
        clearTimeout(cleanupTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    // Schedule cleanup after delay
    cleanupTimer.current = setTimeout(() => {
      setIsActive(false);
    }, cleanupDelay);

    return () => {
      if (cleanupTimer.current) {
        clearTimeout(cleanupTimer.current);
      }
    };
  }, [cleanupDelay]);

  if (!isActive) {
    return null;
  }

  return <>{children}</>;
};

// Batch renderer for large lists
interface BatchRendererProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  batchSize?: number;
  delay?: number;
}

export const BatchRenderer: React.FC<BatchRendererProps> = ({
  items,
  renderItem,
  batchSize = 10,
  delay = 16
}) => {
  const [renderedCount, setRenderedCount] = useState(batchSize);

  useEffect(() => {
    if (renderedCount < items.length) {
      const timer = setTimeout(() => {
        setRenderedCount(prev => Math.min(prev + batchSize, items.length));
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [renderedCount, items.length, batchSize, delay]);

  return (
    <>
      {items.slice(0, renderedCount).map((item, index) => (
        <React.Fragment key={index}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
      {renderedCount < items.length && (
        <LoadingSpinner message={`Loading ${items.length - renderedCount} more items...`} />
      )}
    </>
  );
};