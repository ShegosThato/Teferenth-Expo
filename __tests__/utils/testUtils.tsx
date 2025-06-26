/**
 * Test Utilities
 * 
 * Common utilities and helpers for testing React Native components
 * and application logic.
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Mock theme provider
const MockThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Mock database provider
const MockDatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withNavigation?: boolean;
  withTheme?: boolean;
  withDatabase?: boolean;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    withNavigation = false,
    withTheme = false,
    withDatabase = false,
    ...renderOptions
  } = options;

  let Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

  if (withNavigation || withTheme || withDatabase) {
    Wrapper = ({ children }) => {
      let content = children;

      if (withDatabase) {
        content = <MockDatabaseProvider>{content}</MockDatabaseProvider>;
      }

      if (withTheme) {
        content = <MockThemeProvider>{content}</MockThemeProvider>;
      }

      if (withNavigation) {
        content = (
          <NavigationContainer>
            <SafeAreaProvider>{content}</SafeAreaProvider>
          </NavigationContainer>
        );
      }

      return <>{content}</>;
    };
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock data generators
export const mockProject = (overrides = {}) => ({
  id: 'project-1',
  title: 'Test Project',
  sourceText: 'Test story content',
  style: 'cinematic',
  status: 'draft',
  progress: 0,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  scenes: [],
  ...overrides
});

export const mockScene = (overrides = {}) => ({
  id: 'scene-1',
  text: 'Test scene description',
  imagePrompt: 'Test image prompt',
  image: null,
  duration: 5,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const mockActionQueue = (overrides = {}) => ({
  id: 'action-1',
  type: 'generate_scenes',
  payload: JSON.stringify({ projectId: 'project-1' }),
  status: 'pending',
  retryCount: 0,
  lastError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Test data sets
export const testProjects = [
  mockProject({ id: '1', title: 'Project 1', status: 'draft' }),
  mockProject({ id: '2', title: 'Project 2', status: 'storyboard' }),
  mockProject({ id: '3', title: 'Project 3', status: 'rendering', progress: 0.5 }),
  mockProject({ id: '4', title: 'Project 4', status: 'complete', progress: 1 })
];

export const testScenes = [
  mockScene({ id: '1', text: 'Opening scene', order: 0 }),
  mockScene({ id: '2', text: 'Middle scene', order: 1 }),
  mockScene({ id: '3', text: 'Closing scene', order: 2 })
];

// Mock network responses
export const mockApiResponses = {
  generateScenes: {
    success: {
      scenes: [
        { text: 'Generated scene 1', imagePrompt: 'Prompt 1' },
        { text: 'Generated scene 2', imagePrompt: 'Prompt 2' }
      ]
    },
    error: {
      error: 'Failed to generate scenes',
      code: 'GENERATION_ERROR'
    }
  },
  generateImage: {
    success: {
      imageUrl: 'https://example.com/generated-image.jpg'
    },
    error: {
      error: 'Failed to generate image',
      code: 'IMAGE_ERROR'
    }
  }
};

// Test helpers
export const waitForAsync = (ms = 0) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

export const mockNetInfo = {
  isConnected: true,
  isInternetReachable: true,
  type: 'wifi',
  details: {}
};

// Performance test helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Accessibility test helpers
export const checkAccessibility = (component: any) => {
  // Basic accessibility checks
  const accessibleElements = component.queryAllByRole('button');
  const textElements = component.queryAllByRole('text');
  
  return {
    hasAccessibleButtons: accessibleElements.length > 0,
    hasAccessibleText: textElements.length > 0,
    buttonCount: accessibleElements.length,
    textCount: textElements.length
  };
};

// Database test helpers
export const createMockDatabase = () => ({
  get: jest.fn(),
  write: jest.fn(),
  batch: jest.fn()
});

export const createMockCollection = () => ({
  create: jest.fn(),
  find: jest.fn(),
  query: jest.fn(),
  observe: jest.fn(),
  prepareCreate: jest.fn()
});

export const createMockQuery = () => ({
  where: jest.fn().mockReturnThis(),
  sortBy: jest.fn().mockReturnThis(),
  fetch: jest.fn(),
  observe: jest.fn()
});

// Navigation test helpers
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true)
});

// Theme test helpers
export const createMockTheme = (isDark = false) => ({
  colors: {
    background: isDark ? '#000000' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    textMuted: isDark ? '#cccccc' : '#666666',
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    card: isDark ? '#1c1c1e' : '#f2f2f7',
    border: isDark ? '#38383a' : '#c6c6c8',
    statusDraft: '#FF9500',
    statusStoryboard: '#007AFF',
    statusRendering: '#FF6347',
    statusComplete: '#34C759'
  },
  isDark
});

// Error boundary test helper
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Test Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong in test.</div>;
    }

    return this.props.children;
  }
}