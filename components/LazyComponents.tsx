/**
 * Lazy Components
 * 
 * Lazy-loaded versions of large components for better performance
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../lib/theme';
import { CodeSplittingManager, SuspenseWrapper } from '../lib/codeSplitting';

// Loading fallback component
const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// Error fallback component
const ErrorFallback: React.FC<{ error?: string }> = ({ error = 'Failed to load component' }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{error}</Text>
  </View>
);

// Lazy Performance Dashboard
export const LazyPerformanceDashboard = CodeSplittingManager.createLazyComponent(
  () => import('./PerformanceDashboard').then(module => ({ default: module.PerformanceDashboard })),
  {
    chunkName: 'PerformanceDashboard',
    fallback: LoadingFallback,
    preload: false, // Only load when needed
    timeout: 10000,
  }
);

// Lazy Enhanced Notifications
export const LazyEnhancedNotifications = CodeSplittingManager.createLazyComponent(
  () => import('./EnhancedNotifications'),
  {
    chunkName: 'EnhancedNotifications',
    fallback: LoadingFallback,
    preload: false,
  }
);

// Lazy Enhanced Loading States
export const LazyEnhancedLoadingStates = CodeSplittingManager.createLazyComponent(
  () => import('./EnhancedLoadingStates'),
  {
    chunkName: 'EnhancedLoadingStates',
    fallback: LoadingFallback,
    preload: true, // Preload since it's commonly used
  }
);

// Lazy Onboarding System
export const LazyOnboardingSystem = CodeSplittingManager.createLazyComponent(
  () => import('./OnboardingSystem').then(module => ({ default: module.OnboardingSystem })),
  {
    chunkName: 'OnboardingSystem',
    fallback: LoadingFallback,
    preload: false, // Only load for new users
  }
);

// Lazy Video Player
export const LazyVideoPlayer = CodeSplittingManager.createLazyComponent(
  () => import('./VideoPlayer').then(module => ({ default: module.VideoPlayer })),
  {
    chunkName: 'VideoPlayer',
    fallback: () => <LoadingFallback message="Loading video player..." />,
    preload: false, // Only load when video is ready
  }
);

// Lazy Storyboard Screen (refactored version)
export const LazyStoryboardScreen = CodeSplittingManager.createLazyComponent(
  () => import('../screens/StoryboardScreenRefactored'),
  {
    chunkName: 'StoryboardScreen',
    fallback: () => <LoadingFallback message="Loading storyboard..." />,
    preload: false,
  }
);

// Wrapper component with Suspense and error handling
export const LazyComponentWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error?: string }>;
  onError?: (error: Error) => void;
}> = ({ 
  children, 
  fallback = LoadingFallback, 
  errorFallback = ErrorFallback,
  onError 
}) => {
  return (
    <SuspenseWrapper
      fallback={fallback}
      onError={(error) => {
        console.error('Lazy component error:', error);
        onError?.(error);
      }}
    >
      {children}
    </SuspenseWrapper>
  );
};

// Hook for conditional lazy loading
export function useConditionalLazyLoad<T extends React.ComponentType<any>>(
  condition: boolean,
  importFn: () => Promise<{ default: T }>,
  options?: { preload?: boolean; timeout?: number }
) {
  const [Component, setComponent] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (condition && !Component && !loading) {
      setLoading(true);
      setError(null);

      const timeoutId = setTimeout(() => {
        setError(new Error('Component load timeout'));
        setLoading(false);
      }, options?.timeout || 10000);

      importFn()
        .then(module => {
          clearTimeout(timeoutId);
          setComponent(() => module.default);
          setLoading(false);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          setError(err instanceof Error ? err : new Error('Failed to load component'));
          setLoading(false);
        });
    }
  }, [condition, Component, loading, importFn, options?.timeout]);

  // Preload if specified
  React.useEffect(() => {
    if (options?.preload && !Component && !loading) {
      importFn().then(module => {
        setComponent(() => module.default);
      }).catch(() => {
        // Ignore preload errors
      });
    }
  }, [options?.preload, Component, loading, importFn]);

  return { Component, loading, error };
}

// Performance monitoring for lazy components
export function useLazyComponentMetrics() {
  const [metrics, setMetrics] = React.useState({
    loadedComponents: 0,
    failedComponents: 0,
    averageLoadTime: 0,
  });

  React.useEffect(() => {
    // This would integrate with the actual performance monitoring
    // For now, it's a placeholder
    const cacheStats = CodeSplittingManager.getCacheStats();
    setMetrics({
      loadedComponents: cacheStats.cachedComponents,
      failedComponents: 0, // Would track from error boundaries
      averageLoadTime: 0, // Would calculate from load times
    });
  }, []);

  return metrics;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
  },
});