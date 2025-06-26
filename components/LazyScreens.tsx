/**
 * Lazy Screen Components
 * 
 * Implements code splitting for main application screens using React.lazy()
 * to improve initial bundle size and loading performance.
 * 
 * Phase 2: Performance Optimization - Code Splitting
 */

import React, { Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../lib/theme';
import { performanceMonitor } from '../lib/performance';

// Loading fallback component
const ScreenLoadingFallback: React.FC<{ screenName: string }> = ({ screenName }) => {
  React.useEffect(() => {
    performanceMonitor.startTimer(`lazy_load_${screenName}`);
    return () => {
      performanceMonitor.endTimer(`lazy_load_${screenName}`);
    };
  }, [screenName]);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

// Lazy-loaded screen components
export const LazyHomeScreen = React.lazy(() => 
  import('../screens/HomeScreen').then(module => {
    performanceMonitor.trackEvent('screen_loaded', { screen: 'HomeScreen' });
    return module;
  })
);

export const LazyNewProjectScreen = React.lazy(() => 
  import('../screens/NewProjectScreen').then(module => {
    performanceMonitor.trackEvent('screen_loaded', { screen: 'NewProjectScreen' });
    return module;
  })
);

export const LazyStoryboardScreen = React.lazy(() => 
  import('../screens/StoryboardScreen').then(module => {
    performanceMonitor.trackEvent('screen_loaded', { screen: 'StoryboardScreen' });
    return module;
  })
);

export const LazySettingsScreen = React.lazy(() => 
  import('../screens/SettingsScreen').then(module => {
    performanceMonitor.trackEvent('screen_loaded', { screen: 'SettingsScreen' });
    return module;
  })
);

// Higher-order component for wrapping lazy screens with Suspense
export const withLazyLoading = <P extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>,
  screenName: string
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <Suspense fallback={<ScreenLoadingFallback screenName={screenName} />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
};

// Pre-configured lazy screen components with Suspense
export const HomeScreenLazy = withLazyLoading(LazyHomeScreen, 'HomeScreen');
export const NewProjectScreenLazy = withLazyLoading(LazyNewProjectScreen, 'NewProjectScreen');
export const StoryboardScreenLazy = withLazyLoading(LazyStoryboardScreen, 'StoryboardScreen');
export const SettingsScreenLazy = withLazyLoading(LazySettingsScreen, 'SettingsScreen');

// Preloading utilities for better UX
export class ScreenPreloader {
  private static preloadedScreens = new Set<string>();

  static preloadScreen(screenName: keyof typeof screenPreloaders) {
    if (this.preloadedScreens.has(screenName)) {
      return;
    }

    this.preloadedScreens.add(screenName);
    const preloader = screenPreloaders[screenName];
    
    if (preloader) {
      // Preload in the background
      setTimeout(() => {
        preloader().catch(error => {
          console.warn(`Failed to preload ${screenName}:`, error);
          this.preloadedScreens.delete(screenName);
        });
      }, 100);
    }
  }

  static preloadAllScreens() {
    Object.keys(screenPreloaders).forEach(screenName => {
      this.preloadScreen(screenName as keyof typeof screenPreloaders);
    });
  }

  static isPreloaded(screenName: string): boolean {
    return this.preloadedScreens.has(screenName);
  }
}

// Screen preloader functions
const screenPreloaders = {
  HomeScreen: () => import('../screens/HomeScreen'),
  NewProjectScreen: () => import('../screens/NewProjectScreen'),
  StoryboardScreen: () => import('../screens/StoryboardScreen'),
  SettingsScreen: () => import('../screens/SettingsScreen'),
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});