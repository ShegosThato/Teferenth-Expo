import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Toaster } from './lib/toast';
import { ErrorBoundary } from './lib/ErrorBoundary';
import HomeScreen from "./screens/HomeScreen";
import NewProjectScreen from "./screens/NewProjectScreen";
import StoryboardScreen from "./screens/StoryboardScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { colors, ThemeProvider } from './lib/theme';
import { validateConfig } from './config/env';
import { PerformanceMonitorToggle } from './components/PerformanceDashboard';
import { performanceMonitor } from './lib/performance';
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
      <Stack.Screen name="Library" component={HomeScreen} />
      <Stack.Screen name="NewProject" component={NewProjectScreen} />
      <Stack.Screen name="Storyboard" component={StoryboardScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  // COMPLETED: Initialize environment configuration validation (Phase 1 Task 2)
  React.useEffect(() => {
    validateConfig();
    
    // Initialize performance monitoring (Phase 2 Task 2)
    performanceMonitor.trackScreenLoad('App');
  }, []);

  return (
    <DatabaseProvider>
      <MigrationManager>
        <ThemeProvider>
          <ErrorBoundary>
            <SafeAreaProvider style={styles.container}>
              <Toaster />
              <SyncManager />
              <NavigationContainer>
                <RootStack />
              </NavigationContainer>
              {/* Performance monitoring toggle for development */}
              <PerformanceMonitorToggle />
            </SafeAreaProvider>
          </ErrorBoundary>
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