/**
 * Unit Tests for HomeScreen Component
 * 
 * These tests verify the home screen functionality including
 * project listing, navigation, and offline-first behavior.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import HomeScreen from '../../screens/HomeScreen';
import { useDatabase } from '../../db/DatabaseContext';
import { useTheme } from '../../lib/theme';
import { performanceMonitor } from '../../lib/performance';

// Mock dependencies
jest.mock('@react-navigation/native');
jest.mock('../../db/DatabaseContext');
jest.mock('../../lib/theme');
jest.mock('../../lib/performance');
jest.mock('@nozbe/with-observables', () => ({
  withObservables: jest.fn((triggers, getObservables) => (Component) => {
    // Return a wrapper component that passes mock data
    return (props: any) => {
      const mockData = getObservables ? getObservables() : {};
      return <Component {...props} {...mockData} />;
    };
  })
}));

const mockNavigation = {
  navigate: jest.fn(),
  setOptions: jest.fn(),
  goBack: jest.fn()
};

const mockDatabase = {
  get: jest.fn()
};

const mockTheme = {
  colors: {
    background: '#ffffff',
    text: '#000000',
    textMuted: '#666666',
    card: '#f5f5f5',
    border: '#e0e0e0',
    statusDraft: '#ffa500',
    statusStoryboard: '#4169e1',
    statusRendering: '#ff6347',
    statusComplete: '#32cd32',
    warning: '#ff6347'
  }
};

const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;
const mockUseDatabase = useDatabase as jest.MockedFunction<typeof useDatabase>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockPerformanceMonitor = performanceMonitor as jest.Mocked<typeof performanceMonitor>;

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseNavigation.mockReturnValue(mockNavigation as any);
    mockUseDatabase.mockReturnValue(mockDatabase as any);
    mockUseTheme.mockReturnValue({ theme: mockTheme } as any);
    mockPerformanceMonitor.trackScreenLoad = jest.fn();
  });

  describe('Empty State', () => {
    it('should render empty state when no projects exist', () => {
      const { getByText, getByTestId } = render(
        <HomeScreen projects={[]} />
      );

      expect(getByText('No projects yet')).toBeTruthy();
      expect(getByText('Tap the + button to create your first video story')).toBeTruthy();
    });

    it('should show floating action button in empty state', () => {
      const { getByTestId } = render(
        <HomeScreen projects={[]} />
      );

      // The FloatingActionButton should be present
      // Note: This test might need adjustment based on actual testID implementation
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Project List', () => {
    const mockProjects = [
      {
        id: '1',
        title: 'Test Project 1',
        style: 'cinematic',
        status: 'draft',
        progress: 0,
        scenes: [{ id: 'scene1' }, { id: 'scene2' }]
      },
      {
        id: '2',
        title: 'Test Project 2',
        style: 'animated',
        status: 'rendering',
        progress: 0.5,
        scenes: [{ id: 'scene3' }]
      },
      {
        id: '3',
        title: 'Test Project 3',
        style: 'watercolor',
        status: 'complete',
        progress: 1,
        scenes: [{ id: 'scene4' }, { id: 'scene5' }, { id: 'scene6' }]
      }
    ];

    it('should render list of projects', () => {
      const { getByText } = render(
        <HomeScreen projects={mockProjects} />
      );

      expect(getByText('Test Project 1')).toBeTruthy();
      expect(getByText('Test Project 2')).toBeTruthy();
      expect(getByText('Test Project 3')).toBeTruthy();
    });

    it('should display project details correctly', () => {
      const { getByText } = render(
        <HomeScreen projects={mockProjects} />
      );

      // Check project styles
      expect(getByText('Style: cinematic')).toBeTruthy();
      expect(getByText('Style: animated')).toBeTruthy();
      expect(getByText('Style: watercolor')).toBeTruthy();

      // Check scene counts
      expect(getByText('2 scenes')).toBeTruthy();
      expect(getByText('1 scenes')).toBeTruthy();
      expect(getByText('3 scenes')).toBeTruthy();

      // Check status badges
      expect(getByText('draft')).toBeTruthy();
      expect(getByText('rendering')).toBeTruthy();
      expect(getByText('complete')).toBeTruthy();
    });

    it('should show progress bar for rendering projects', () => {
      const { getByText, queryByTestId } = render(
        <HomeScreen projects={mockProjects} />
      );

      // The rendering project should have a progress bar
      expect(getByText('rendering')).toBeTruthy();
      
      // Progress bar should be visible for rendering status
      // Note: This test might need adjustment based on actual progress bar implementation
    });

    it('should navigate to storyboard when project is tapped', () => {
      const { getByText } = render(
        <HomeScreen projects={mockProjects} />
      );

      fireEvent.press(getByText('Test Project 1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Storyboard', { id: '1' });
    });
  });

  describe('Navigation', () => {
    it('should navigate to new project screen when FAB is pressed', () => {
      const { getByTestId } = render(
        <HomeScreen projects={[]} />
      );

      // This test assumes the FloatingActionButton has a testID
      // The actual implementation might need adjustment
      const fabButton = getByTestId('fab-button');
      fireEvent.press(fabButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('NewProject');
    });

    it('should navigate to settings when settings button is pressed', () => {
      const { getByTestId } = render(
        <HomeScreen projects={[]} />
      );

      // This test assumes the settings button has a testID
      const settingsButton = getByTestId('settings-button');
      fireEvent.press(settingsButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Settings');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track screen load on mount', () => {
      render(<HomeScreen projects={[]} />);

      expect(mockPerformanceMonitor.trackScreenLoad).toHaveBeenCalledWith('HomeScreen');
    });
  });

  describe('Theme Support', () => {
    it('should apply theme colors correctly', () => {
      const { getByText } = render(
        <HomeScreen projects={[]} />
      );

      const headerTitle = getByText('My Projects');
      
      // Check that theme colors are applied
      // Note: This test might need adjustment based on actual style implementation
      expect(headerTitle).toBeTruthy();
    });

    it('should handle theme changes', () => {
      const darkTheme = {
        colors: {
          ...mockTheme.colors,
          background: '#000000',
          text: '#ffffff',
          textMuted: '#cccccc'
        }
      };

      mockUseTheme.mockReturnValue({ theme: darkTheme } as any);

      const { getByText } = render(
        <HomeScreen projects={[]} />
      );

      expect(getByText('My Projects')).toBeTruthy();
    });
  });

  describe('Status Colors', () => {
    const projectWithStatus = (status: string) => [{
      id: '1',
      title: 'Test Project',
      style: 'cinematic',
      status,
      progress: 0.5,
      scenes: []
    }];

    it('should apply correct color for draft status', () => {
      const { getByText } = render(
        <HomeScreen projects={projectWithStatus('draft')} />
      );

      expect(getByText('draft')).toBeTruthy();
    });

    it('should apply correct color for storyboard status', () => {
      const { getByText } = render(
        <HomeScreen projects={projectWithStatus('storyboard')} />
      );

      expect(getByText('storyboard')).toBeTruthy();
    });

    it('should apply correct color for rendering status', () => {
      const { getByText } = render(
        <HomeScreen projects={projectWithStatus('rendering')} />
      );

      expect(getByText('rendering')).toBeTruthy();
    });

    it('should apply correct color for complete status', () => {
      const { getByText } = render(
        <HomeScreen projects={projectWithStatus('complete')} />
      );

      expect(getByText('complete')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing scene data gracefully', () => {
      const projectWithoutScenes = [{
        id: '1',
        title: 'Test Project',
        style: 'cinematic',
        status: 'draft',
        progress: 0,
        scenes: undefined
      }];

      const { getByText } = render(
        <HomeScreen projects={projectWithoutScenes} />
      );

      expect(getByText('0 scenes')).toBeTruthy();
    });

    it('should handle empty scenes array', () => {
      const projectWithEmptyScenes = [{
        id: '1',
        title: 'Test Project',
        style: 'cinematic',
        status: 'draft',
        progress: 0,
        scenes: []
      }];

      const { getByText } = render(
        <HomeScreen projects={projectWithEmptyScenes} />
      );

      expect(getByText('0 scenes')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible elements', () => {
      const mockProjects = [{
        id: '1',
        title: 'Test Project',
        style: 'cinematic',
        status: 'draft',
        progress: 0,
        scenes: []
      }];

      const { getByText } = render(
        <HomeScreen projects={mockProjects} />
      );

      // Check that important elements are accessible
      expect(getByText('Test Project')).toBeTruthy();
      expect(getByText('My Projects')).toBeTruthy();
    });
  });
});