/**
 * Performance Optimizer
 * 
 * Centralized performance optimization utilities and strategies
 */

import React from 'react';
import { InteractionManager, Platform } from 'react-native';
import { performanceMonitor } from './performance';

// Performance optimization strategies
export enum OptimizationLevel {
  BASIC = 'basic',
  AGGRESSIVE = 'aggressive',
  MAXIMUM = 'maximum',
}

export interface PerformanceConfig {
  level: OptimizationLevel;
  enableCodeSplitting: boolean;
  enableLazyLoading: boolean;
  enableVirtualization: boolean;
  enableImageOptimization: boolean;
  enableMemoryManagement: boolean;
}

export class PerformanceOptimizer {
  private static config: PerformanceConfig = {
    level: OptimizationLevel.BASIC,
    enableCodeSplitting: true,
    enableLazyLoading: true,
    enableVirtualization: true,
    enableImageOptimization: true,
    enableMemoryManagement: true,
  };

  // Configure optimization level
  static configure(config: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Lazy component loading with performance monitoring
  static createLazyComponent<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ): React.LazyExoticComponent<T> {
    return React.lazy(async () => {
      const startTime = performance.now();
      
      try {
        const module = await importFn();
        const loadTime = performance.now() - startTime;
        
        performanceMonitor.addMetrics({
          timestamp: Date.now(),
          renderTime: loadTime,
        });

        if (loadTime > 1000) {
          console.warn(`Slow component load: ${loadTime.toFixed(2)}ms`);
        }

        return module;
      } catch (error) {
        console.error('Failed to load component:', error);
        throw error;
      }
    });
  }

  // Optimized debounce with cleanup
  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number,
    options: { leading?: boolean; trailing?: boolean } = {}
  ): T & { cancel: () => void } {
    let timeout: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastThis: unknown = null;
    let result: ReturnType<T>;

    const { leading = false, trailing = true } = options;

    const debounced = function (this: unknown, ...args: Parameters<T>) {
      lastArgs = args;
      lastThis = this;

      const callNow = leading && !timeout;

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        timeout = null;
        if (trailing && lastArgs) {
          result = func.apply(lastThis, lastArgs) as ReturnType<T>;
        }
      }, wait);

      if (callNow) {
        result = func.apply(this, args) as ReturnType<T>;
      }

      return result;
    } as T & { cancel: () => void };

    debounced.cancel = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };

    return debounced;
  }

  // Optimized throttle with performance tracking
  static throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): T & { cancel: () => void } {
    let inThrottle = false;
    let lastResult: ReturnType<T>;
    let timeout: NodeJS.Timeout | null = null;

    const throttled = function (this: unknown, ...args: Parameters<T>) {
      if (!inThrottle) {
        const startTime = performance.now();
        lastResult = func.apply(this, args) as ReturnType<T>;
        const duration = performance.now() - startTime;

        if (duration > 16) { // More than one frame
          console.warn(`Slow throttled function: ${duration.toFixed(2)}ms`);
        }

        inThrottle = true;
        timeout = setTimeout(() => {
          inThrottle = false;
          timeout = null;
        }, limit);
      }
      return lastResult;
    } as T & { cancel: () => void };

    throttled.cancel = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      inThrottle = false;
    };

    return throttled;
  }

  // Memoization with size limits and TTL
  static memoize<T extends (...args: unknown[]) => unknown>(
    fn: T,
    options: {
      maxSize?: number;
      ttl?: number; // Time to live in ms
      keyGenerator?: (...args: Parameters<T>) => string;
    } = {}
  ): T & { cache: Map<string, unknown>; clear: () => void } {
    const { maxSize = 100, ttl, keyGenerator } = options;
    const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

    const memoized = function (...args: Parameters<T>): ReturnType<T> {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const now = Date.now();

      // Check if cached value exists and is still valid
      const cached = cache.get(key);
      if (cached) {
        if (!ttl || (now - cached.timestamp) < ttl) {
          return cached.value;
        } else {
          cache.delete(key);
        }
      }

      // Compute new value
      const value = fn(...args) as ReturnType<T>;

      // Manage cache size
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      cache.set(key, { value, timestamp: now });
      return value;
    } as T & { cache: Map<string, unknown>; clear: () => void };

    memoized.cache = cache as Map<string, unknown>;
    memoized.clear = () => cache.clear();

    return memoized;
  }

  // Batch operations with InteractionManager
  static async batchOperations<T>(
    operations: Array<() => T | Promise<T>>,
    options: {
      batchSize?: number;
      delay?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<T[]> {
    const { batchSize = 5, delay = 0, onProgress } = options;
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      // Wait for interactions to complete before processing batch
      await new Promise(resolve => {
        InteractionManager.runAfterInteractions(resolve);
      });

      const batchResults = await Promise.all(
        batch.map(op => Promise.resolve(op()))
      );
      
      results.push(...batchResults);
      
      onProgress?.(results.length, operations.length);

      // Add delay between batches if specified
      if (delay > 0 && i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  // Memory pressure management
  static handleMemoryPressure() {
    // Clear caches
    if (this.config.enableMemoryManagement) {
      // Clear image cache
      if (global.gc && Platform.OS === 'android') {
        global.gc();
      }
      
      console.log('Memory pressure handled');
    }
  }

  // Bundle size analysis
  static analyzeBundleSize() {
    if (__DEV__) {
      const bundleSize = this.estimateBundleSize();
      console.log(`Estimated bundle size: ${(bundleSize / 1024).toFixed(2)} KB`);
      
      if (bundleSize > 1024 * 1024) { // 1MB
        console.warn('Bundle size is large, consider code splitting');
      }
    }
  }

  private static estimateBundleSize(): number {
    // Rough estimation based on loaded modules
    // In a real implementation, you'd use webpack-bundle-analyzer or similar
    return Object.keys(require.cache || {}).length * 1024; // Rough estimate
  }

  // Performance monitoring hook
  static usePerformanceMonitoring(componentName: string) {
    React.useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const mountTime = performance.now() - startTime;
        performanceMonitor.addMetrics({
          timestamp: Date.now(),
          renderTime: mountTime,
        });

        if (mountTime > 100) {
          console.warn(`Slow component mount: ${componentName} - ${mountTime.toFixed(2)}ms`);
        }
      };
    }, [componentName]);
  }

  // Render optimization hook
  static useRenderOptimization<T extends Record<string, unknown>>(
    props: T,
    dependencies: Array<keyof T> = []
  ) {
    const memoizedProps = React.useMemo(() => {
      if (dependencies.length === 0) {
        return props;
      }
      
      const relevantProps = {} as Partial<T>;
      dependencies.forEach(key => {
        relevantProps[key] = props[key];
      });
      
      return relevantProps;
    }, dependencies.map(key => props[key]));

    return memoizedProps;
  }

  // List optimization utilities
  static getOptimizedListProps(itemCount: number) {
    const isLargeList = itemCount > 100;
    
    return {
      removeClippedSubviews: isLargeList,
      maxToRenderPerBatch: isLargeList ? 5 : 10,
      initialNumToRender: isLargeList ? 10 : 20,
      windowSize: isLargeList ? 5 : 10,
      getItemLayout: this.config.enableVirtualization ? undefined : (data: unknown, index: number) => ({
        length: 80, // Estimated item height
        offset: 80 * index,
        index,
      }),
    };
  }
}

// Performance monitoring React hook
export function usePerformanceOptimization(componentName: string) {
  PerformanceOptimizer.usePerformanceMonitoring(componentName);
  
  const optimizedCallback = React.useCallback(
    PerformanceOptimizer.debounce((callback: () => void) => {
      InteractionManager.runAfterInteractions(callback);
    }, 16), // One frame
    []
  );

  const optimizedMemo = React.useCallback(
    <T>(factory: () => T, deps: React.DependencyList) => 
      React.useMemo(factory, deps),
    []
  );

  return {
    optimizedCallback,
    optimizedMemo,
    debounce: PerformanceOptimizer.debounce,
    throttle: PerformanceOptimizer.throttle,
    memoize: PerformanceOptimizer.memoize,
  };
}

// HOC for performance optimization
export function withPerformanceOptimization<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  options: {
    displayName?: string;
    memoize?: boolean;
    trackPerformance?: boolean;
  } = {}
) {
  const { displayName, memoize = true, trackPerformance = true } = options;
  
  const OptimizedComponent = React.forwardRef<unknown, P>((props, ref) => {
    if (trackPerformance) {
      PerformanceOptimizer.usePerformanceMonitoring(displayName || Component.displayName || 'Component');
    }

    return React.createElement(Component, { ...props, ref });
  });

  OptimizedComponent.displayName = displayName || `Optimized(${Component.displayName || Component.name})`;

  return memoize ? React.memo(OptimizedComponent) : OptimizedComponent;
}

export default PerformanceOptimizer;