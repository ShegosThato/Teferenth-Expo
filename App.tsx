import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Toaster } from './lib/toast';
import { ErrorBoundary } from './lib/ErrorBoundary';
import { 
  HomeScreenLazy as HomeScreen,
  NewProjectScreenLazy as NewProjectScreen,
  StoryboardScreenLazy as StoryboardScreen,
  SettingsScreenLazy as SettingsScreen,
  ScreenPreloader
} from "./components/LazyScreens";
import EnhancedHomeScreen from "./screens/EnhancedHomeScreen";
import { colors, ThemeProvider } from './lib/theme';
import { NotificationProvider } from './components/EnhancedNotifications';
import { LazyOnboardingSystem, LazyComponentWrapper } from './components/LazyComponents';
import { uxManager } from './lib/enhancedUX';
import { validateConfig } from './config/env';
import { PerformanceToggle } from './components/PerformanceDashboard';
import { enhancedPerformanceMonitor } from './lib/enhancedPerformance';
import { advancedPerformanceEnhancer } from './lib/advancedPerformanceEnhancements';
import AdvancedPerformanceDashboard from './components/AdvancedPerformanceDashboard';
import { DatabaseProvider } from './db/DatabaseContext';
import { SyncManager } from './components/SyncManager';
import { MigrationManager } from './components/MigrationManager';

export type RootStackParamList = {
  Library: undefined;
  NewProject: undefined;
  Storyboard: { id: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTitle: 'Tefereth Scripts', // Global title
      }}
    >
      <Stack.Screen name="Library" component={EnhancedHomeScreen} />
      <Stack.Screen name="NewProject" component={NewProjectScreen} />
      <Stack.Screen name="Storyboard" component={StoryboardScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  // Initialize all enhanced systems
  React.useEffect(() => {
    // Environment configuration validation
    validateConfig();
    
    // Initialize enhanced performance monitoring
    enhancedPerformanceMonitor.startMonitoring();
    enhancedPerformanceMonitor.trackScreenLoad('App');
    
    // Initialize advanced performance enhancements
    console.log('Initializing advanced performance enhancements...');
    
    // Track app launch for UX adaptation
    uxManager.trackInteraction('app_launch', {
      timestamp: Date.now(),
      platform: Platform.OS,
    });

    // Preload screens after initial render
    const preloadTimer = setTimeout(() => {
      ScreenPreloader.preloadAllScreens();
    }, 2000); // Preload after 2 seconds to avoid blocking initial load

    return () => clearTimeout(preloadTimer);
  }, []);

  return (
    <DatabaseProvider>
      <MigrationManager>
        <ThemeProvider>
          <NotificationProvider>
            <ErrorBoundary>
              <SafeAreaProvider style={styles.container}>
                <Toaster />
                <SyncManager />
                <NavigationContainer>
                  <RootStack />
                </NavigationContainer>
                
                {/* Enhanced UX Components */}
                <LazyComponentWrapper>
                  <LazyOnboardingSystem
                    flows={[]} // Will be loaded dynamically
                    onComplete={(flowId) => {
                      uxManager.trackInteraction('onboarding_completed', { flowId });
                    }}
                    onSkip={(flowId) => {
                      uxManager.trackInteraction('onboarding_skipped', { flowId });
                    }}
                  />
                </LazyComponentWrapper>
                
                {/* Advanced Performance Dashboard */}
                <AdvancedPerformanceDashboard />
                
                {/* Legacy Performance monitoring toggle for development */}
                <PerformanceToggle />
              </SafeAreaProvider>
            </ErrorBoundary>
          </NotificationProvider>
        </ThemeProvider>
      </MigrationManager>
    </DatabaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    userSelect: "none",
    backgroundColor: colors.background,
  }
});