/**
 * Advanced Onboarding System
 * 
 * Intelligent onboarding that adapts to user behavior and provides
 * contextual guidance with interactive tutorials and feature discovery.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../lib/theme';
import { uxManager, useOnboarding, HapticPattern } from '../lib/enhancedUX';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Onboarding step types
export interface OnboardingStepData {
  id: string;
  title: string;
  description: string;
  type: 'tooltip' | 'modal' | 'overlay' | 'spotlight';
  target?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onPress: () => void;
  };
  skippable?: boolean;
  autoAdvance?: boolean;
  duration?: number;
}

// Onboarding flow configuration
export interface OnboardingFlow {
  id: string;
  title: string;
  description: string;
  steps: OnboardingStepData[];
  condition?: () => boolean;
  priority: number;
}

// Tooltip component
interface TooltipProps {
  step: OnboardingStepData;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
  currentStep: number;
  totalSteps: number;
}

const OnboardingTooltip: React.FC<TooltipProps> = ({
  step,
  onNext,
  onSkip,
  onClose,
  currentStep,
  totalSteps,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getTooltipPosition = (): {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  } => {
    if (!step.target) return { top: screenHeight / 2 - 100, left: 20 };

    const { x, y, width, height } = step.target;
    const tooltipHeight = 200;
    const tooltipWidth = screenWidth - 40;

    switch (step.position) {
      case 'top':
        return {
          top: Math.max(20, y - tooltipHeight - 20),
          left: Math.max(20, x + width / 2 - tooltipWidth / 2),
        };
      case 'bottom':
        return {
          top: Math.min(screenHeight - tooltipHeight - 20, y + height + 20),
          left: Math.max(20, x + width / 2 - tooltipWidth / 2),
        };
      case 'left':
        return {
          top: Math.max(20, y + height / 2 - tooltipHeight / 2),
          left: Math.max(20, x - tooltipWidth - 20),
        };
      case 'right':
        return {
          top: Math.max(20, y + height / 2 - tooltipHeight / 2),
          left: Math.min(screenWidth - tooltipWidth - 20, x + width + 20),
        };
      default:
        return {
          top: Math.max(20, y + height + 20),
          left: Math.max(20, x + width / 2 - tooltipWidth / 2),
        };
    }
  };

  const position = getTooltipPosition();

  return (
    <Animated.View
      style={[
        styles.tooltip,
        position,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.tooltipHeader}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentStep + 1} of {totalSteps}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / totalSteps) * 100}%` },
              ]}
            />
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <Text style={styles.tooltipTitle}>{step.title}</Text>
      <Text style={styles.tooltipDescription}>{step.description}</Text>

      <View style={styles.tooltipActions}>
        {step.skippable && (
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onNext} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>
            {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
          </Text>
          <Ionicons
            name={currentStep === totalSteps - 1 ? 'checkmark' : 'arrow-forward'}
            size={16}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Spotlight overlay component
interface SpotlightOverlayProps {
  target: OnboardingStepData['target'];
  children: React.ReactNode;
}

const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({ target, children }) => {
  const maskAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(maskAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  if (!target) {
    return (
      <View style={styles.fullOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        {children}
      </View>
    );
  }

  return (
    <View style={styles.fullOverlay}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <Animated.View
        style={[
          styles.spotlight,
          {
            left: target.x - 10,
            top: target.y - 10,
            width: target.width + 20,
            height: target.height + 20,
            opacity: maskAnim,
          },
        ]}
      />
      {children}
    </View>
  );
};

// Main onboarding component
interface OnboardingSystemProps {
  flows: OnboardingFlow[];
  onComplete?: (flowId: string) => void;
  onSkip?: (flowId: string) => void;
}

export const OnboardingSystem: React.FC<OnboardingSystemProps> = ({
  flows,
  onComplete,
  onSkip,
}) => {
  const [activeFlow, setActiveFlow] = useState<OnboardingFlow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Find the highest priority flow that should be shown
    const availableFlows = flows
      .filter(flow => !flow.condition || flow.condition())
      .sort((a, b) => b.priority - a.priority);

    if (availableFlows.length > 0) {
      const flow = availableFlows[0];
      if (uxManager.shouldShowOnboardingStep(flow.id)) {
        setActiveFlow(flow);
        setIsVisible(true);
        uxManager.hapticFeedback(HapticPattern.LIGHT);
      }
    }
  }, [flows]);

  const handleNext = () => {
    if (!activeFlow) return;

    uxManager.hapticFeedback(HapticPattern.SELECTION);

    if (currentStepIndex < activeFlow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    if (!activeFlow) return;

    uxManager.hapticFeedback(HapticPattern.LIGHT);
    uxManager.completeOnboardingStep(activeFlow.id);
    onSkip?.(activeFlow.id);
    setIsVisible(false);
    setActiveFlow(null);
    setCurrentStepIndex(0);
  };

  const handleComplete = () => {
    if (!activeFlow) return;

    uxManager.hapticFeedback(HapticPattern.SUCCESS);
    uxManager.completeOnboardingStep(activeFlow.id);
    uxManager.trackInteraction('onboarding_completed', { flowId: activeFlow.id });
    onComplete?.(activeFlow.id);
    setIsVisible(false);
    setActiveFlow(null);
    setCurrentStepIndex(0);
  };

  const handleClose = () => {
    handleSkip();
  };

  if (!isVisible || !activeFlow) {
    return null;
  }

  const currentStep = activeFlow.steps[currentStepIndex];

  const renderStepContent = () => {
    switch (currentStep.type) {
      case 'modal':
        return (
          <Modal visible={true} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{currentStep.title}</Text>
                <Text style={styles.modalDescription}>{currentStep.description}</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={handleSkip} style={styles.modalSkipButton}>
                    <Text style={styles.modalSkipText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleNext} style={styles.modalNextButton}>
                    <Text style={styles.modalNextText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        );

      case 'spotlight':
        return (
          <Modal visible={true} transparent animationType="fade">
            <SpotlightOverlay target={currentStep.target}>
              <OnboardingTooltip
                step={currentStep}
                onNext={handleNext}
                onSkip={handleSkip}
                onClose={handleClose}
                currentStep={currentStepIndex}
                totalSteps={activeFlow.steps.length}
              />
            </SpotlightOverlay>
          </Modal>
        );

      case 'overlay':
        return (
          <Modal visible={true} transparent animationType="fade">
            <View style={styles.overlayContainer}>
              <BlurView intensity={10} style={StyleSheet.absoluteFill} />
              <OnboardingTooltip
                step={currentStep}
                onNext={handleNext}
                onSkip={handleSkip}
                onClose={handleClose}
                currentStep={currentStepIndex}
                totalSteps={activeFlow.steps.length}
              />
            </View>
          </Modal>
        );

      default:
        return (
          <Modal visible={true} transparent animationType="fade">
            <View style={styles.tooltipContainer}>
              <OnboardingTooltip
                step={currentStep}
                onNext={handleNext}
                onSkip={handleSkip}
                onClose={handleClose}
                currentStep={currentStepIndex}
                totalSteps={activeFlow.steps.length}
              />
            </View>
          </Modal>
        );
    }
  };

  return renderStepContent();
};

// Onboarding trigger component
interface OnboardingTriggerProps {
  stepId: string;
  children: React.ReactNode;
  onLayout?: (event: any) => void;
}

export const OnboardingTrigger: React.FC<OnboardingTriggerProps> = ({
  stepId,
  children,
  onLayout,
}) => {
  const { shouldShow } = useOnboarding(stepId);
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    if (shouldShow) {
      setHighlighted(true);
      const timer = setTimeout(() => setHighlighted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  return (
    <View
      onLayout={onLayout}
      style={[
        highlighted && styles.highlightedElement,
      ]}
    >
      {children}
    </View>
  );
};

// Feature discovery component
interface FeatureDiscoveryProps {
  featureId: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export const FeatureDiscovery: React.FC<FeatureDiscoveryProps> = ({
  featureId,
  title,
  description,
  children,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { shouldShow, completeStep } = useOnboarding(featureId);

  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        uxManager.hapticFeedback(HapticPattern.LIGHT);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  const handleDismiss = () => {
    setShowTooltip(false);
    completeStep();
    uxManager.trackInteraction('feature_discovered', { featureId });
  };

  return (
    <View>
      {children}
      {showTooltip && (
        <View style={styles.featureTooltip}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
          <TouchableOpacity onPress={handleDismiss} style={styles.featureDismiss}>
            <Text style={styles.featureDismissText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Progress indicator component
interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  style?: any;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
  style,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps]);

  return (
    <View style={[styles.progressContainer, style]}>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressIndicator,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressLabel}>
        {currentStep} of {totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    maxWidth: screenWidth - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    flex: 1,
    marginRight: 12,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  closeButton: {
    padding: 4,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tooltipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  tooltipActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#666',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  fullOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  spotlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderRadius: 8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  tooltipContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlayContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    maxWidth: 320,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalSkipButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  modalSkipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  modalNextButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalNextText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  highlightedElement: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  featureTooltip: {
    position: 'absolute',
    top: -80,
    left: 0,
    right: 0,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    zIndex: 1000,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 8,
  },
  featureDismiss: {
    alignSelf: 'flex-end',
  },
  featureDismissText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});

// Default onboarding flows
export const defaultOnboardingFlows: OnboardingFlow[] = [
  {
    id: 'app_introduction',
    title: 'Welcome to Tefereth Scripts',
    description: 'Learn how to create amazing video storyboards',
    priority: 10,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome! 👋',
        description: 'Tefereth Scripts helps you create video storyboards from text using AI. Let\'s get you started!',
        type: 'modal',
        skippable: true,
      },
      {
        id: 'create_project',
        title: 'Create Your First Project',
        description: 'Tap the + button to create a new storyboard project',
        type: 'spotlight',
        position: 'top',
        skippable: false,
      },
      {
        id: 'project_library',
        title: 'Your Project Library',
        description: 'All your projects will appear here. You can edit, duplicate, or delete them.',
        type: 'tooltip',
        position: 'bottom',
        skippable: true,
      },
    ],
  },
  {
    id: 'advanced_features',
    title: 'Advanced Features',
    description: 'Discover powerful features for better storyboards',
    priority: 5,
    condition: () => uxManager.getUserPattern() !== 'first_time_user',
    steps: [
      {
        id: 'performance_dashboard',
        title: 'Performance Dashboard',
        description: 'Monitor app performance and optimize your experience',
        type: 'tooltip',
        position: 'top',
        skippable: true,
      },
      {
        id: 'settings',
        title: 'Customize Your Experience',
        description: 'Access settings to personalize the app to your preferences',
        type: 'tooltip',
        position: 'left',
        skippable: true,
      },
    ],
  },
];