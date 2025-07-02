/**
 * Interactive Tutorial System
 * 
 * Provides step-by-step interactive tutorials that guide users through
 * specific features and workflows with contextual highlighting and guidance.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../lib/theme';
import { uxManager, useUXAdaptation, HapticPattern } from '../lib/enhancedUX';
import { enhancedPerformanceMonitor } from '../lib/enhancedPerformance';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Tutorial step configuration
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: {
    selector: string;
    position: { x: number; y: number; width: number; height: number };
  };
  action?: {
    type: 'tap' | 'swipe' | 'input' | 'wait';
    direction?: 'up' | 'down' | 'left' | 'right';
    duration?: number;
    required?: boolean;
  };
  highlight?: {
    type: 'spotlight' | 'outline' | 'glow';
    padding?: number;
  };
  content?: {
    type: 'text' | 'image' | 'video' | 'interactive';
    data?: any;
  };
  validation?: () => boolean;
  onComplete?: () => void;
  skippable?: boolean;
}

// Tutorial flow configuration
export interface TutorialFlow {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  prerequisites?: string[];
  steps: TutorialStep[];
  onStart?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
}

// Tutorial step component
interface TutorialStepComponentProps {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

const TutorialStepComponent: React.FC<TutorialStepComponentProps> = ({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
}) => {
  const [actionCompleted, setActionCompleted] = React.useState(!step.action?.required);
  const [showHint, setShowHint] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const adaptation = useUXAdaptation();

  React.useEffect(() => {
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: adaptation.animationDuration,
      useNativeDriver: true,
    }).start();

    // Start pulse animation for highlights
    if (step.highlight) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }

    // Show hint after delay if action is required
    if (step.action?.required) {
      const hintTimer = setTimeout(() => {
        setShowHint(true);
        uxManager.hapticFeedback(HapticPattern.LIGHT);
      }, 3000);

      return () => clearTimeout(hintTimer);
    }
  }, [step.id]);

  // Validate action completion
  React.useEffect(() => {
    if (step.validation && step.action?.required) {
      const checkValidation = () => {
        if (step.validation!()) {
          setActionCompleted(true);
          uxManager.hapticFeedback(HapticPattern.SUCCESS);
          step.onComplete?.();
        }
      };

      const interval = setInterval(checkValidation, 500);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleNext = () => {
    if (step.action?.required && !actionCompleted) {
      uxManager.hapticFeedback(HapticPattern.WARNING);
      setShowHint(true);
      return;
    }

    uxManager.hapticFeedback(HapticPattern.SELECTION);
    uxManager.trackInteraction('tutorial_step_completed', {
      stepId: step.id,
      stepIndex,
    });

    if (stepIndex === totalSteps - 1) {
      onComplete();
    } else {
      onNext();
    }
  };

  const handlePrevious = () => {
    uxManager.hapticFeedback(HapticPattern.SELECTION);
    onPrevious();
  };

  const handleSkip = () => {
    uxManager.hapticFeedback(HapticPattern.LIGHT);
    uxManager.trackInteraction('tutorial_step_skipped', {
      stepId: step.id,
      stepIndex,
    });
    onSkip();
  };

  const spacing = uxManager.getAdaptiveSpacing();
  const fontSizes = uxManager.getAdaptiveFontSizes();

  const renderHighlight = () => {
    if (!step.target || !step.highlight) return null;

    const { x, y, width, height } = step.target.position;
    const padding = step.highlight.padding || 8;

    switch (step.highlight.type) {
      case 'spotlight':
        return (
          <Animated.View
            style={[
              styles.spotlight,
              {
                left: x - padding,
                top: y - padding,
                width: width + padding * 2,
                height: height + padding * 2,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        );

      case 'outline':
        return (
          <Animated.View
            style={[
              styles.outline,
              {
                left: x - padding,
                top: y - padding,
                width: width + padding * 2,
                height: height + padding * 2,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        );

      case 'glow':
        return (
          <Animated.View
            style={[
              styles.glow,
              {
                left: x - padding * 2,
                top: y - padding * 2,
                width: width + padding * 4,
                height: height + padding * 4,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        );

      default:
        return null;
    }
  };

  const renderActionHint = () => {
    if (!showHint || !step.action) return null;

    const getHintText = () => {
      switch (step.action!.type) {
        case 'tap':
          return 'Tap the highlighted area';
        case 'swipe':
          return `Swipe ${step.action!.direction || 'up'} on the highlighted area`;
        case 'input':
          return 'Enter text in the highlighted field';
        case 'wait':
          return 'Wait for the action to complete';
        default:
          return 'Perform the required action';
      }
    };

    return (
      <Animated.View
        style={[
          styles.actionHint,
          {
            opacity: fadeAnim,
            padding: spacing.sm,
          },
        ]}
      >
        <Ionicons name="hand-left" size={20} color={colors.primary} />
        <Text style={[styles.actionHintText, { fontSize: fontSizes.sm, marginLeft: spacing.xs }]}>
          {getHintText()}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={styles.stepContainer}>
      {/* Highlight overlay */}
      {renderHighlight()}

      {/* Action hint */}
      {renderActionHint()}

      {/* Step content */}
      <Animated.View
        style={[
          styles.stepContent,
          {
            opacity: fadeAnim,
            padding: spacing.lg,
          },
        ]}
      >
        {/* Progress indicator */}
        <View style={[styles.progressContainer, { marginBottom: spacing.md }]}>
          <Text style={[styles.progressText, { fontSize: fontSizes.sm }]}>
            Step {stepIndex + 1} of {totalSteps}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((stepIndex + 1) / totalSteps) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Step title and description */}
        <Text style={[styles.stepTitle, { fontSize: fontSizes.lg, marginBottom: spacing.sm }]}>
          {step.title}
        </Text>
        <Text style={[styles.stepDescription, { fontSize: fontSizes.md, marginBottom: spacing.lg }]}>
          {step.description}
        </Text>

        {/* Interactive content */}
        {step.content && (
          <View style={[styles.stepContentArea, { marginBottom: spacing.lg }]}>
            {renderStepContent(step.content)}
          </View>
        )}

        {/* Action status */}
        {step.action?.required && (
          <View style={[styles.actionStatus, { marginBottom: spacing.lg }]}>
            <Ionicons
              name={actionCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={actionCompleted ? colors.success : colors.textMuted}
            />
            <Text
              style={[
                styles.actionStatusText,
                {
                  fontSize: fontSizes.sm,
                  marginLeft: spacing.xs,
                  color: actionCompleted ? colors.success : colors.textMuted,
                },
              ]}
            >
              {actionCompleted ? 'Action completed!' : 'Complete the required action to continue'}
            </Text>
          </View>
        )}

        {/* Navigation buttons */}
        <View style={styles.navigationContainer}>
          <View style={styles.leftButtons}>
            {stepIndex > 0 && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, { padding: spacing.sm }]}
                onPress={handlePrevious}
                accessibilityLabel="Previous step"
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={16} color={colors.text} />
                <Text style={[styles.secondaryButtonText, { fontSize: fontSizes.sm, marginLeft: spacing.xs }]}>
                  Previous
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rightButtons}>
            {step.skippable && (
              <TouchableOpacity
                style={[styles.button, styles.skipButton, { padding: spacing.sm, marginRight: spacing.sm }]}
                onPress={handleSkip}
                accessibilityLabel="Skip tutorial"
                accessibilityRole="button"
              >
                <Text style={[styles.skipButtonText, { fontSize: fontSizes.sm }]}>
                  Skip
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                { padding: spacing.sm },
                (!actionCompleted && step.action?.required) && styles.disabledButton,
              ]}
              onPress={handleNext}
              disabled={!actionCompleted && step.action?.required}
              accessibilityLabel={stepIndex === totalSteps - 1 ? 'Complete tutorial' : 'Next step'}
              accessibilityRole="button"
            >
              <Text style={[styles.primaryButtonText, { fontSize: fontSizes.sm }]}>
                {stepIndex === totalSteps - 1 ? 'Complete' : 'Next'}
              </Text>
              <Ionicons
                name={stepIndex === totalSteps - 1 ? 'checkmark' : 'arrow-forward'}
                size={16}
                color="#fff"
                style={{ marginLeft: spacing.xs }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// Main interactive tutorial component
interface InteractiveTutorialProps {
  flow: TutorialFlow;
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  flow,
  visible,
  onComplete,
  onSkip,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [startTime] = React.useState(Date.now());
  const adaptation = useUXAdaptation();

  React.useEffect(() => {
    if (visible) {
      uxManager.trackInteraction('tutorial_started', {
        flowId: flow.id,
        category: flow.category,
        estimatedTime: flow.estimatedTime,
      });
      flow.onStart?.();
    }
  }, [visible, flow]);

  const handleNext = () => {
    if (currentStepIndex < flow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    const timeSpent = Date.now() - startTime;
    uxManager.trackInteraction('tutorial_skipped', {
      flowId: flow.id,
      stepsCompleted: currentStepIndex + 1,
      totalSteps: flow.steps.length,
      timeSpent,
    });
    flow.onSkip?.();
    onSkip();
  };

  const handleComplete = () => {
    const timeSpent = Date.now() - startTime;
    uxManager.trackInteraction('tutorial_completed', {
      flowId: flow.id,
      totalSteps: flow.steps.length,
      timeSpent,
    });
    uxManager.completeOnboardingStep(`tutorial_${flow.id}`);
    flow.onComplete?.();
    onComplete();
  };

  if (!visible) return null;

  const currentStep = flow.steps[currentStepIndex];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.tutorialOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        
        <TutorialStepComponent
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={flow.steps.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
          onComplete={handleComplete}
        />

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityLabel="Close tutorial"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// Tutorial manager component
interface TutorialManagerProps {
  flows: TutorialFlow[];
  autoStart?: boolean;
}

export const TutorialManager: React.FC<TutorialManagerProps> = ({
  flows,
  autoStart = false,
}) => {
  const [activeTutorial, setActiveTutorial] = React.useState<TutorialFlow | null>(null);
  const [availableTutorials, setAvailableTutorials] = React.useState<TutorialFlow[]>([]);

  React.useEffect(() => {
    // Filter available tutorials based on prerequisites
    const available = flows.filter(flow => {
      if (!flow.prerequisites) return true;
      
      return flow.prerequisites.every(prerequisite =>
        uxManager.shouldShowOnboardingStep(`tutorial_${prerequisite}`) === false
      );
    });

    setAvailableTutorials(available);

    // Auto-start first available tutorial if enabled
    if (autoStart && available.length > 0 && !activeTutorial) {
      const firstTutorial = available[0];
      if (uxManager.shouldShowOnboardingStep(`tutorial_${firstTutorial.id}`)) {
        setActiveTutorial(firstTutorial);
      }
    }
  }, [flows, autoStart, activeTutorial]);

  const startTutorial = (flowId: string) => {
    const flow = flows.find(f => f.id === flowId);
    if (flow) {
      setActiveTutorial(flow);
    }
  };

  const handleTutorialComplete = () => {
    setActiveTutorial(null);
  };

  const handleTutorialSkip = () => {
    setActiveTutorial(null);
  };

  const handleTutorialClose = () => {
    setActiveTutorial(null);
  };

  return (
    <>
      {activeTutorial && (
        <InteractiveTutorial
          flow={activeTutorial}
          visible={!!activeTutorial}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
          onClose={handleTutorialClose}
        />
      )}
    </>
  );
};

// Helper function to render step content
const renderStepContent = (content: TutorialStep['content']) => {
  if (!content) return null;

  switch (content.type) {
    case 'text':
      return (
        <Text style={styles.contentText}>
          {content.data}
        </Text>
      );
    
    case 'image':
      return (
        <View style={styles.contentImage}>
          <Text style={styles.contentPlaceholder}>
            📷 Image: {content.data}
          </Text>
        </View>
      );
    
    case 'video':
      return (
        <View style={styles.contentVideo}>
          <Text style={styles.contentPlaceholder}>
            🎥 Video: {content.data}
          </Text>
        </View>
      );
    
    case 'interactive':
      return (
        <View style={styles.contentInteractive}>
          <Text style={styles.contentPlaceholder}>
            🎮 Interactive: {content.data}
          </Text>
        </View>
      );
    
    default:
      return null;
  }
};

// Default tutorial flows
export const defaultTutorialFlows: TutorialFlow[] = [
  {
    id: 'create_first_project',
    title: 'Create Your First Project',
    description: 'Learn how to create a new storyboard project from text',
    category: 'basic',
    estimatedTime: 3,
    steps: [
      {
        id: 'welcome_tutorial',
        title: 'Welcome to the Tutorial!',
        description: 'This interactive tutorial will guide you through creating your first storyboard project.',
        skippable: true,
      },
      {
        id: 'tap_new_project',
        title: 'Tap the New Project Button',
        description: 'Look for the + button and tap it to start creating a new project.',
        target: {
          selector: 'new_project_button',
          position: { x: 0, y: 0, width: 0, height: 0 }, // Would be set dynamically
        },
        action: {
          type: 'tap',
          required: true,
        },
        highlight: {
          type: 'spotlight',
          padding: 12,
        },
        validation: () => {
          // Would check if new project screen is visible
          return false;
        },
        skippable: false,
      },
      {
        id: 'enter_project_details',
        title: 'Enter Project Details',
        description: 'Give your project a name and add your story text.',
        action: {
          type: 'input',
          required: true,
        },
        skippable: true,
      },
    ],
    onComplete: () => {
      uxManager.hapticFeedback(HapticPattern.SUCCESS);
    },
  },
  {
    id: 'customize_scenes',
    title: 'Customize Your Scenes',
    description: 'Learn how to edit and customize generated scenes',
    category: 'intermediate',
    estimatedTime: 5,
    prerequisites: ['create_first_project'],
    steps: [
      {
        id: 'scene_overview',
        title: 'Understanding Scenes',
        description: 'Each scene represents a part of your story with text and visual elements.',
        skippable: true,
      },
      {
        id: 'edit_scene_text',
        title: 'Edit Scene Text',
        description: 'Tap on any scene to edit its text and description.',
        action: {
          type: 'tap',
          required: true,
        },
        highlight: {
          type: 'outline',
        },
        skippable: true,
      },
    ],
  },
];

const styles = StyleSheet.create({
  tutorialOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  stepContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: SCREEN_HEIGHT * 0.4,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepTitle: {
    fontWeight: 'bold',
    color: colors.text,
  },
  stepDescription: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  stepContentArea: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
  },
  actionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  actionStatusText: {
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftButtons: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 80,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '500',
  },
  skipButton: {
    backgroundColor: 'transparent',
  },
  skipButtonText: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Highlight styles
  spotlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  outline: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  
  // Action hint styles
  actionHint: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  actionHintText: {
    color: colors.text,
    fontWeight: '500',
  },
  
  // Content styles
  contentText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  contentImage: {
    height: 120,
    backgroundColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentVideo: {
    height: 160,
    backgroundColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInteractive: {
    height: 100,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentPlaceholder: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
});

export default InteractiveTutorial;