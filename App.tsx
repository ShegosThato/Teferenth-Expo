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
import { colors } from './lib/theme';
import { validateConfig } from './config/env';

export type RootStackParamList = {
  Library: undefined;
  NewProject: undefined;
  Storyboard: { id: string };
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
    </Stack.Navigator>
  );
}

export default function App() {
  // COMPLETED: Initialize environment configuration validation (Phase 1 Task 2)
  React.useEffect(() => {
    validateConfig();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider style={styles.container}>
        <Toaster />
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    userSelect: "none",
    backgroundColor: colors.background,
    // TODO: Add support for system theme detection
    // NOTE: Consider adding theme context provider
  }
});