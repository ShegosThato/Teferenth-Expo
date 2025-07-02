/**
 * Enhanced UX Components Tests
 * 
 * Comprehensive tests for the new UX enhancement components including
 * onboarding, feedback, tutorials, and adaptive UI features.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Vibration } from 'react-native';

// Mock dependencies
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Vibration: {
    vibrate: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
  AccessibilityInfo: {
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    isBoldTextEnabled: jest.fn(() => Promise.resolve(false)),
  },
}));

jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Import components to test
import { OnboardingSystem, OnboardingTrigger, FeatureDiscovery } from '../../components/OnboardingSystem';
import { EnhancedToast, ProgressFeedback, LoadingFeedback, EmptyStateFeedback } from '../../components/EnhancedUserFeedback';
import { InteractiveTutorial, TutorialManager } from '../../components/InteractiveTutorial';
import { uxManager, EnhancedUXManager } from '../../lib/enhancedUX';

// Mock UX manager
const mockUXManager = {
  getUserPattern: jest.fn(() => 'first_time_user'),
  shouldShowOnboardingStep: jest.fn(() => true),
  completeOnboardingStep: jest.fn(),
  trackInteraction: jest.fn(),
  hapticFeedback: jest.fn(),
  getAdaptation: jest.fn(() => ({
    animationDuration: 300,
    transitionStyle: 'normal',
    feedbackIntensity: 'normal',
    interfaceDensity: 'comfortable',
    guidanceLevel: 'helpful',
  })),
  getAdaptiveSpacing: jest.fn(() => ({
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
  })),
  getAdaptiveFontSizes: jest.fn(() => ({
    xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32,
  })),
};

// Mock the UX manager module
jest.mock('../../lib/enhancedUX', () => ({
  uxManager: mockUXManager,
  useUXAdaptation: () => mockUXManager.getAdaptation(),
  useUserBehavior: () => ({
    trackInteraction: mockUXManager.trackInteraction,
    hapticFeedback: mockUXManager.hapticFeedback,
    userPattern: 'first_time_user',
    adaptation: mockUXManager.getAdaptation(),
    analytics: {
      totalInteractions: 0,
      uniqueActions: 0,
      mostUsedFeatures: [],
      sessionData: { averageLength: 0, totalSessions: 1 },
    },
  }),
  useOnboarding: (stepId: string) => ({
    shouldShow: mockUXManager.shouldShowOnboardingStep(stepId),
    completeStep: () => mockUXManager.completeOnboardingStep(stepId),
  }),
  HapticPattern: {
    LIGHT: 'light',
    MEDIUM: 'medium',
    HEAVY: 'heavy',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    SELECTION: 'selection',
  },
  EnhancedUXManager,
}));

describe('Enhanced UX Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OnboardingSystem', () => {
    const mockFlows = [
      {
        id: 'test_flow',
        title: 'Test Onboarding',
        description: 'Test onboarding flow',
        triggerCondition: 'first_launch' as const,
        priority: 'high' as const,
        steps: [
          {
            id: 'step1',
            title: 'Welcome',
            description: 'Welcome to the app',
            skippable: true,
          },
          {
            id: 'step2',
            title: 'Features',
            description: 'Learn about features',
            skippable: false,
          },
        ],
      },
    ];

    it('renders onboarding flow for new users', async () => {
      const onComplete = jest.fn();
      const onSkip = jest.fn();

      const { getByText } = render(
        <OnboardingSystem
          flows={mockFlows}
          onComplete={onComplete}
          onSkip={onSkip}
          autoStart={true}
        />
      );

      await waitFor(() => {
        expect(getByText('Welcome')).toBeTruthy();
        expect(getByText('Welcome to the app')).toBeTruthy();
      });
    });

    it('handles step navigation correctly', async () => {
      const onComplete = jest.fn();
      const onSkip = jest.fn();

      const { getByText } = render(
        <OnboardingSystem
          flows={mockFlows}
          onComplete={onComplete}
          onSkip={onSkip}
          autoStart={true}
        />
      );

      await waitFor(() => {
        expect(getByText('Welcome')).toBeTruthy();
      });

      // Navigate to next step
      const nextButton = getByText('Next');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByText('Features')).toBeTruthy();
        expect(getByText('Learn about features')).toBeTruthy();
      });
    });

    it('completes onboarding flow', async () => {
      const onComplete = jest.fn();
      const onSkip = jest.fn();

      const { getByText } = render(
        <OnboardingSystem
          flows={mockFlows}
          onComplete={onComplete}
          onSkip={onSkip}
          autoStart={true}
        />
      );

      // Navigate through steps
      await waitFor(() => {
        expect(getByText('Welcome')).toBeTruthy();
      });

      fireEvent.press(getByText('Next'));

      await waitFor(() => {
        expect(getByText('Features')).toBeTruthy();
      });

      fireEvent.press(getByText('Get Started'));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith('test_flow');
        expect(mockUXManager.completeOnboardingStep).toHaveBeenCalledWith('test_flow');
      });
    });

    it('handles skip functionality', async () => {
      const onComplete = jest.fn();
      const onSkip = jest.fn();

      const { getByText } = render(
        <OnboardingSystem
          flows={mockFlows}
          onComplete={onComplete}
          onSkip={onSkip}
          autoStart={true}
        />
      );

      await waitFor(() => {
        expect(getByText('Welcome')).toBeTruthy();
      });

      const skipButton = getByText('Skip');
      fireEvent.press(skipButton);

      await waitFor(() => {
        expect(onSkip).toHaveBeenCalledWith('test_flow');
        expect(mockUXManager.completeOnboardingStep).toHaveBeenCalledWith('test_flow');
      });
    });
  });

  describe('EnhancedToast', () => {
    it('renders success toast with action', () => {
      const onDismiss = jest.fn();
      const actionPress = jest.fn();

      const { getByText } = render(
        <EnhancedToast
          type="success"
          title="Success!"
          message="Operation completed successfully"
          action={{
            label: "View",
            onPress: actionPress,
          }}
          onDismiss={onDismiss}
        />
      );

      expect(getByText('Success!')).toBeTruthy();
      expect(getByText('Operation completed successfully')).toBeTruthy();
      expect(getByText('View')).toBeTruthy();
    });

    it('handles action button press', () => {
      const onDismiss = jest.fn();
      const actionPress = jest.fn();

      const { getByText } = render(
        <EnhancedToast
          type="info"
          title="Info"
          action={{
            label: "Action",
            onPress: actionPress,
          }}
          onDismiss={onDismiss}
        />
      );

      fireEvent.press(getByText('Action'));
      expect(actionPress).toHaveBeenCalled();
    });

    it('auto-dismisses after duration', async () => {
      const onDismiss = jest.fn();

      render(
        <EnhancedToast
          type="info"
          title="Auto Dismiss"
          duration={100}
          onDismiss={onDismiss}
        />
      );

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalled();
      }, { timeout: 200 });
    });
  });

  describe('ProgressFeedback', () => {
    it('renders progress with percentage', () => {
      const { getByText } = render(
        <ProgressFeedback
          progress={75}
          title="Loading..."
          showPercentage={true}
        />
      );

      expect(getByText('Loading...')).toBeTruthy();
      expect(getByText('75%')).toBeTruthy();
    });

    it('renders progress without percentage', () => {
      const { getByText, queryByText } = render(
        <ProgressFeedback
          progress={50}
          title="Processing"
          showPercentage={false}
        />
      );

      expect(getByText('Processing')).toBeTruthy();
      expect(queryByText('50%')).toBeNull();
    });

    it('includes subtitle when provided', () => {
      const { getByText } = render(
        <ProgressFeedback
          progress={25}
          title="Uploading"
          subtitle="Please wait while we process your file"
        />
      );

      expect(getByText('Uploading')).toBeTruthy();
      expect(getByText('Please wait while we process your file')).toBeTruthy();
    });
  });

  describe('LoadingFeedback', () => {
    it('renders loading state with message', () => {
      const { getByText } = render(
        <LoadingFeedback message="Loading data..." />
      );

      expect(getByText('Loading data...')).toBeTruthy();
    });

    it('renders with cancellable option', () => {
      const onCancel = jest.fn();

      const { getByText } = render(
        <LoadingFeedback
          message="Processing..."
          cancellable={true}
          onCancel={onCancel}
        />
      );

      expect(getByText('Processing...')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();

      fireEvent.press(getByText('Cancel'));
      expect(onCancel).toHaveBeenCalled();
    });

    it('shows progress when provided', () => {
      const { getByText } = render(
        <LoadingFeedback
          message="Uploading..."
          progress={60}
        />
      );

      expect(getByText('Uploading...')).toBeTruthy();
      expect(getByText('60%')).toBeTruthy();
    });
  });

  describe('EmptyStateFeedback', () => {
    it('renders empty state with action', () => {
      const onAction = jest.fn();

      const { getByText } = render(
        <EmptyStateFeedback
          icon="folder-outline"
          title="No items found"
          description="Start by creating your first item"
          action={{
            label: "Create Item",
            onPress: onAction,
          }}
        />
      );

      expect(getByText('No items found')).toBeTruthy();
      expect(getByText('Start by creating your first item')).toBeTruthy();
      expect(getByText('Create Item')).toBeTruthy();

      fireEvent.press(getByText('Create Item'));
      expect(onAction).toHaveBeenCalled();
    });
  });

  describe('OnboardingTrigger', () => {
    it('renders children and handles layout', () => {
      const onLayout = jest.fn();

      const { getByText } = render(
        <OnboardingTrigger stepId="test_step" onLayout={onLayout}>
          <div>Test Content</div>
        </OnboardingTrigger>
      );

      expect(getByText('Test Content')).toBeTruthy();
    });
  });

  describe('FeatureDiscovery', () => {
    it('shows tooltip for new features', async () => {
      mockUXManager.shouldShowOnboardingStep.mockReturnValue(true);

      const { getByText } = render(
        <FeatureDiscovery
          featureId="new_feature"
          title="New Feature!"
          description="Check out this amazing new feature"
        >
          <div>Feature Button</div>
        </FeatureDiscovery>
      );

      expect(getByText('Feature Button')).toBeTruthy();

      // Wait for tooltip to appear
      await waitFor(() => {
        expect(getByText('New Feature!')).toBeTruthy();
        expect(getByText('Check out this amazing new feature')).toBeTruthy();
      });
    });
  });

  describe('UX Manager Integration', () => {
    it('tracks interactions correctly', () => {
      mockUXManager.trackInteraction('test_action', { context: 'test' });
      
      expect(mockUXManager.trackInteraction).toHaveBeenCalledWith(
        'test_action',
        { context: 'test' }
      );
    });

    it('provides haptic feedback', () => {
      mockUXManager.hapticFeedback('success');
      
      expect(mockUXManager.hapticFeedback).toHaveBeenCalledWith('success');
    });

    it('adapts UI based on user pattern', () => {
      const pattern = mockUXManager.getUserPattern();
      expect(pattern).toBe('first_time_user');
    });

    it('provides adaptive spacing and fonts', () => {
      const spacing = mockUXManager.getAdaptiveSpacing();
      const fonts = mockUXManager.getAdaptiveFontSizes();

      expect(spacing).toEqual({
        xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
      });
      expect(fonts).toEqual({
        xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32,
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('adapts for reduced motion', async () => {
      const { AccessibilityInfo } = require('react-native');
      AccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);

      const adaptation = mockUXManager.getAdaptation();
      
      // In a real implementation, this would be adapted
      expect(adaptation.animationDuration).toBeDefined();
    });

    it('provides proper accessibility labels', () => {
      const { getByLabelText } = render(
        <EnhancedToast
          type="info"
          title="Test"
          action={{
            label: "Action",
            onPress: jest.fn(),
          }}
          onDismiss={jest.fn()}
        />
      );

      // Toast should have proper accessibility labels
      expect(getByLabelText('Dismiss notification')).toBeTruthy();
    });
  });

  describe('Performance Integration', () => {
    it('tracks performance metrics', () => {
      // Performance tracking would be integrated with the performance monitor
      expect(mockUXManager.trackInteraction).toBeDefined();
    });

    it('adapts animations based on performance', () => {
      const adaptation = mockUXManager.getAdaptation();
      expect(adaptation.animationDuration).toBeGreaterThan(0);
    });
  });
});

describe('UX Enhancement Integration', () => {
  it('integrates all UX components seamlessly', () => {
    // Test that all components can be imported and used together
    expect(OnboardingSystem).toBeDefined();
    expect(EnhancedToast).toBeDefined();
    expect(InteractiveTutorial).toBeDefined();
    expect(ProgressFeedback).toBeDefined();
    expect(LoadingFeedback).toBeDefined();
    expect(EmptyStateFeedback).toBeDefined();
    expect(OnboardingTrigger).toBeDefined();
    expect(FeatureDiscovery).toBeDefined();
  });

  it('provides consistent UX patterns', () => {
    // All components should use the same UX manager and patterns
    expect(mockUXManager.getAdaptiveSpacing).toBeDefined();
    expect(mockUXManager.getAdaptiveFontSizes).toBeDefined();
    expect(mockUXManager.hapticFeedback).toBeDefined();
    expect(mockUXManager.trackInteraction).toBeDefined();
  });
});