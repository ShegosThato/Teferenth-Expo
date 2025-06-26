/**
 * Code Splitting Utilities
 * 
 * Advanced code splitting and lazy loading implementation
 */

import React from 'react';
import { InteractionManager } from 'react-native';
import { PerformanceOptimizer } from './performanceOptimizer';
import { BundleAnalyzer } from './bundleAnalyzer';

export interface LazyComponentOptions {
  fallback?: React.ComponentType;
  preload?: boolean;
  timeout?: number;
  retries?: number;
  chunkName?: string;
}

export interface CodeSplitConfig {
  enablePreloading: boolean;
  preloadDelay: number;
  maxConcurrentLoads: number;
  cacheComponents: boolean;
}

class CodeSplittingManager {
  private static config: CodeSplitConfig = {
    enablePreloading: true,
    preloadDelay: 2000,
    maxConcurrentLoads: 3,
    cacheComponents: true,
  };

  private static componentCache = new Map<string, React.ComponentType<any>>();
  private static loadingComponents = new Set<string>();
  private static preloadQueue: string[] = [];
  private static currentLoads = 0;

  // Configure code splitting behavior
  static configure(config: Partial<CodeSplitConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Create a lazy component with advanced options
  static createLazyComponent<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options: LazyComponentOptions = {}
  ): React.LazyExoticComponent<T> {
    const {
      fallback,
      preload = false,
      timeout = 10000,
      retries = 2,
      chunkName,
    } = options;

    const componentKey = chunkName || importFn.toString();

    // Check cache first
    if (this.config.cacheComponents && this.componentCache.has(componentKey)) {
      const CachedComponent = this.componentCache.get(componentKey)!;
      return React.lazy(() => Promise.resolve({ default: CachedComponent as T }));
    }

    const lazyComponent = React.lazy(async () => {
      const startTime = performance.now();
      
      try {
        // Track loading
        this.loadingComponents.add(componentKey);
        this.currentLoads++;

        // Implement timeout and retries
        const loadWithRetry = async (attempt = 0): Promise<{ default: T }> => {
          try {
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Component load timeout')), timeout);
            });

            const loadPromise = importFn();
            const module = await Promise.race([loadPromise, timeoutPromise]);

            // Cache the component
            if (this.config.cacheComponents) {
              this.componentCache.set(componentKey, module.default);
            }

            return module;
          } catch (error) {
            if (attempt < retries) {
              console.warn(`Component load failed, retrying... (${attempt + 1}/${retries})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
              return loadWithRetry(attempt + 1);
            }
            throw error;
          }
        };

        const module = await loadWithRetry();
        const loadTime = performance.now() - startTime;

        // Track performance
        BundleAnalyzer.trackModuleLoad(componentKey, loadTime);

        if (chunkName) {
          BundleAnalyzer.registerModule(chunkName, {
            size: this.estimateComponentSize(module.default),
            isLazy: true,
          });
        }

        return module;
      } catch (error) {
        console.error(`Failed to load component ${chunkName || 'unknown'}:`, error);
        throw error;
      } finally {
        this.loadingComponents.delete(componentKey);
        this.currentLoads--;
        this.processPreloadQueue();
      }
    });

    // Handle preloading
    if (preload) {
      this.preloadComponent(componentKey, importFn);
    }

    return lazyComponent;
  }

  // Preload a component
  static preloadComponent<T>(
    key: string,
    importFn: () => Promise<{ default: T }>
  ) {
    if (this.loadingComponents.has(key) || this.componentCache.has(key)) {
      return;
    }

    if (this.currentLoads >= this.config.maxConcurrentLoads) {
      this.preloadQueue.push(key);
      return;
    }

    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        if (!this.loadingComponents.has(key) && !this.componentCache.has(key)) {
          importFn().then(module => {
            if (this.config.cacheComponents) {
              this.componentCache.set(key, module.default);
            }
          }).catch(error => {
            console.warn(`Preload failed for ${key}:`, error);
          });
        }
      }, this.config.preloadDelay);
    });
  }

  // Process preload queue
  private static processPreloadQueue() {
    while (
      this.preloadQueue.length > 0 && 
      this.currentLoads < this.config.maxConcurrentLoads
    ) {
      const key = this.preloadQueue.shift()!;
      // Note: We'd need to store the import function to actually preload
      // This is a simplified implementation
    }
  }

  // Estimate component size (rough estimation)
  private static estimateComponentSize(component: React.ComponentType<any>): number {
    const componentString = component.toString();
    return componentString.length * 2; // Rough estimate
  }

  // Get cache statistics
  static getCacheStats() {
    return {
      cachedComponents: this.componentCache.size,
      currentLoads: this.currentLoads,
      queuedPreloads: this.preloadQueue.length,
    };
  }

  // Clear cache
  static clearCache() {
    this.componentCache.clear();
    this.preloadQueue.length = 0;
  }

  // Prefetch components based on navigation patterns
  static prefetchForRoute(routeName: string, components: string[]) {
    InteractionManager.runAfterInteractions(() => {
      components.forEach(componentKey => {
        // This would need to be implemented with actual component mappings
        console.log(`Prefetching ${componentKey} for route ${routeName}`);
      });
    });
  }
}

// React Suspense wrapper with error boundary
export const SuspenseWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType;
  onError?: (error: Error) => void;
}> = ({ children, fallback: Fallback, onError }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (hasError) {
      setHasError(false);
    }
  }, [children]);

  if (hasError) {
    return Fallback ? <Fallback /> : null;
  }

  return (
    <React.Suspense
      fallback={Fallback ? <Fallback /> : null}
    >
      <ErrorBoundary onError={(error) => {
        setHasError(true);
        onError?.(error);
      }}>
        {children}
      </ErrorBoundary>
    </React.Suspense>
  );
};

// Error boundary for lazy components
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

// Hook for lazy loading with preloading
export function useLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
) {
  const [Component, setComponent] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadComponent = React.useCallback(async () => {
    if (Component || loading) return;

    setLoading(true);
    setError(null);

    try {
      const module = await importFn();
      setComponent(() => module.default);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load component'));
    } finally {
      setLoading(false);
    }
  }, [importFn, Component, loading]);

  React.useEffect(() => {
    if (options.preload) {
      loadComponent();
    }
  }, [loadComponent, options.preload]);

  return {
    Component,
    loading,
    error,
    loadComponent,
  };
}

// Route-based code splitting helper
export function createRouteComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  routeName: string,
  preloadRoutes: string[] = []
) {
  const LazyComponent = CodeSplittingManager.createLazyComponent(importFn, {
    chunkName: routeName,
    preload: false,
  });

  // Preload related routes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      CodeSplittingManager.prefetchForRoute(routeName, preloadRoutes);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return LazyComponent;
}

// Performance monitoring for code splitting
export function useCodeSplittingMetrics() {
  const [metrics, setMetrics] = React.useState(CodeSplittingManager.getCacheStats());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(CodeSplittingManager.getCacheStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

export { CodeSplittingManager };
export default CodeSplittingManager;