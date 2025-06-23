import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Toaster } from './lib/toast';
import HomeScreen from "./screens/HomeScreen";
import NewProjectScreen from "./screens/NewProjectScreen";
import StoryboardScreen from "./screens/StoryboardScreen";
import { colors } from './lib/theme';

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
  return (
    <SafeAreaProvider style={styles.container}>
      <Toaster />
      <NavigationContainer>
        <RootStack />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    userSelect: "none",
    backgroundColor: colors.background,
  }
});