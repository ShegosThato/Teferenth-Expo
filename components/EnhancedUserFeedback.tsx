/**
 * Enhanced User Feedback System
 * 
 * Comprehensive feedback system including haptic feedback, visual feedback,
 * progress indicators, and contextual guidance for improved user experience.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';
import { uxManager, useUXAdaptation, HapticPattern } from '../lib/enhancedUX';
import { enhancedPerformanceMonitor } from '../lib/enhancedPerformance';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Feedback types
export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// Enhanced toast notification
interface EnhancedToastProps {
  type: FeedbackType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  haptic?: HapticPattern;
  position?: 'top' | 'bottom' | 'center';
}

export const EnhancedToast: React.FC<EnhancedToastProps> = ({
  type,
  title,
  message,
  duration = 4000,
  action,
  onDismiss,
  haptic,
  position = 'top',
}) => {
  const [visible, setVisible] = React.useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const adaptation = useUXAdaptation();

  React.useEffect(() => {
    // Trigger haptic feedback
    if (haptic) {
      uxManager.hapticFeedback(haptic);
    }

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: adaptation.animationDuration,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: adaptation.animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: adaptation.animationDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  const getToastStyle = () => {
    const baseStyle = [styles.toast];
    
    switch (type) {
      case 'success':
        return [...baseStyle, styles.successToast];
      case 'error':
        return [...baseStyle, styles.errorToast];
      case 'warning':
        return [...baseStyle, styles.warningToast];
      case 'info':
        return [...baseStyle, styles.infoToast];
      case 'loading':
        return [...baseStyle, styles.loadingToast];
      default:
        return baseStyle;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      case 'loading':
        return 'hourglass';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.danger;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.primary;
      case 'loading':
        return colors.textMuted;
      default:
        return colors.primary;
    }
  };

  const spacing = uxManager.getAdaptiveSpacing();
  const fontSizes = uxManager.getAdaptiveFontSizes();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        getToastStyle(),
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          padding: spacing.md,
          marginHorizontal: spacing.md,
        },
        position === 'top' && styles.toastTop,
        position === 'bottom' && styles.toastBottom,
        position === 'center' && styles.toastCenter,
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons
          name={getIcon()}
          size={24}
          color={getIconColor()}
          style={{ marginRight: spacing.sm }}
        />
        
        <View style={styles.toastText}>
          <Text style={[styles.toastTitle, { fontSize: fontSizes.md }]}>
            {title}
          </Text>
          {message && (
            <Text style={[styles.toastMessage, { fontSize: fontSizes.sm }]}>
              {message}
            </Text>
          )}
        </View>

        {action && (
          <TouchableOpacity
            style={[styles.toastAction, { padding: spacing.xs }]}
            onPress={() => {
              uxManager.hapticFeedback(HapticPattern.SELECTION);
              action.onPress();
            }}
            accessibilityLabel={action.label}
            accessibilityRole="button"
          >
            <Text style={[styles.toastActionText, { fontSize: fontSizes.sm }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.toastDismiss, { padding: spacing.xs }]}
          onPress={dismissToast}
          accessibilityLabel="Dismiss notification"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Progress indicator with contextual feedback
interface ProgressFeedbackProps {
  progress: number; // 0-100
  title: string;
  subtitle?: string;
  showPercentage?: boolean;
  animated?: boolean;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const ProgressFeedback: React.FC<ProgressFeedbackProps> = ({
  progress,
  title,
  subtitle,
  showPercentage = true,
  animated = true,
  color = colors.primary,
  size = 'medium',
  style,
}) => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const adaptation = useUXAdaptation();

  React.useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: adaptation.animationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, animated, adaptation.animationDuration]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: 4, borderRadius: 2 };
      case 'large':
        return { height: 12, borderRadius: 6 };
      default:
        return { height: 8, borderRadius: 4 };
    }
  };

  const spacing = uxManager.getAdaptiveSpacing();
  const fontSizes = uxManager.getAdaptiveFontSizes();

  return (
    <View style={[styles.progressContainer, { padding: spacing.md }, style]}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressTitle, { fontSize: fontSizes.md }]}>
          {title}
        </Text>
        {showPercentage && (
          <Text style={[styles.progressPercentage, { fontSize: fontSizes.sm }]}>
            {Math.round(progress)}%
          </Text>
        )}
      </View>

      {subtitle && (
        <Text style={[styles.progressSubtitle, { fontSize: fontSizes.sm, marginBottom: spacing.sm }]}>
          {subtitle}
        </Text>
      )}

      <View style={[styles.progressTrack, getSizeStyles()]}>
        <Animated.View
          style={[
            styles.progressBar,
            getSizeStyles(),
            {
              backgroundColor: color,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

// Loading state with contextual information
interface LoadingFeedbackProps {
  message: string;
  submessage?: string;
  progress?: number;
  cancellable?: boolean;
  onCancel?: () => void;
  style?: any;
}

export const LoadingFeedback: React.FC<LoadingFeedbackProps> = ({
  message,
  submessage,
  progress,
  cancellable = false,
  onCancel,
  style,
}) => {
  const spinAnim = React.useRef(new Animated.Value(0)).current;
  const adaptation = useUXAdaptation();

  React.useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    
    spinAnimation.start();
    
    return () => spinAnimation.stop();
  }, []);

  const spacing = uxManager.getAdaptiveSpacing();
  const fontSizes = uxManager.getAdaptiveFontSizes();

  return (
    <View style={[styles.loadingContainer, { padding: spacing.lg }, style]}>
      <Animated.View
        style={[
          styles.loadingSpinner,
          {
            transform: [
              {
                rotate: spinAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="hourglass" size={32} color={colors.primary} />
      </Animated.View>

      <Text style={[styles.loadingMessage, { fontSize: fontSizes.md, marginTop: spacing.md }]}>
        {message}
      </Text>

      {submessage && (
        <Text style={[styles.loadingSubmessage, { fontSize: fontSizes.sm, marginTop: spacing.xs }]}>
          {submessage}
        </Text>
      )}

      {typeof progress === 'number' && (
        <ProgressFeedback
          progress={progress}
          title=""
          showPercentage={true}
          size="small"
          style={{ marginTop: spacing.md }}
        />
      )}

      {cancellable && onCancel && (
        <TouchableOpacity
          style={[styles.cancelButton, { marginTop: spacing.lg, padding: spacing.sm }]}
          onPress={() => {
            uxManager.hapticFeedback(HapticPattern.LIGHT);
            onCancel();
          }}
          accessibilityLabel="Cancel operation"
          accessibilityRole="button"
        >
          <Text style={[styles.cancelButtonText, { fontSize: fontSizes.sm }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Empty state with guidance
interface EmptyStateFeedbackProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  illustration?: React.ReactNode;
  style?: any;
}

export const EmptyStateFeedback: React.FC<EmptyStateFeedbackProps> = ({
  icon,
  title,
  description,
  action,
  illustration,
  style,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const adaptation = useUXAdaptation();

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: adaptation.animationDuration,
      useNativeDriver: true,
    }).start();
  }, [adaptation.animationDuration]);

  const spacing = uxManager.getAdaptiveSpacing();
  const fontSizes = uxManager.getAdaptiveFontSizes();

  return (
    <Animated.View
      style={[
        styles.emptyStateContainer,
        { opacity: fadeAnim, padding: spacing.xl },
        style,
      ]}
    >
      {illustration || (
        <View style={[styles.emptyStateIcon, { marginBottom: spacing.lg }]}>
          <Ionicons name={icon} size={64} color={colors.textMuted} />
        </View>
      )}

      <Text style={[styles.emptyStateTitle, { fontSize: fontSizes.lg, marginBottom: spacing.md }]}>
        {title}
      </Text>

      <Text style={[styles.emptyStateDescription, { fontSize: fontSizes.md, marginBottom: spacing.xl }]}>
        {description}
      </Text>

      {action && (
        <TouchableOpacity
          style={[styles.emptyStateAction, { padding: spacing.md }]}
          onPress={() => {
            uxManager.hapticFeedback(HapticPattern.SELECTION);
            uxManager.trackInteraction('empty_state_action', { action: action.label });
            action.onPress();
          }}
          accessibilityLabel={action.label}
          accessibilityRole="button"
        >
          <Text style={[styles.emptyStateActionText, { fontSize: fontSizes.md }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// Contextual help tooltip
interface ContextualHelpProps {
  visible: boolean;
  title: string;
  content: string;
  position: { x: number; y: number };
  onDismiss: () => void;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  visible,
  title,
  content,
  position,
  onDismiss,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const adaptation = useUXAdaptation();

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: adaptation.animationDuration,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: adaptation.animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: adaptation.animationDuration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, adaptation.animationDuration]);

  const spacing = uxManager.getAdaptiveSpacing();
  const fontSizes = uxManager.getAdaptiveFontSizes();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.contextualHelp,
        {
          left: position.x,
          top: position.y,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          padding: spacing.md,
        },
      ]}
    >
      <View style={styles.contextualHelpHeader}>
        <Text style={[styles.contextualHelpTitle, { fontSize: fontSizes.md }]}>
          {title}
        </Text>
        <TouchableOpacity
          onPress={onDismiss}
          style={{ padding: spacing.xs }}
          accessibilityLabel="Close help"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.contextualHelpContent, { fontSize: fontSizes.sm }]}>
        {content}
      </Text>
    </Animated.View>
  );
};

// Performance feedback indicator
export const PerformanceFeedback: React.FC = () => {
  const [metrics, setMetrics] = React.useState<any>(null);
  const adaptation = useUXAdaptation();

  React.useEffect(() => {
    const unsubscribe = enhancedPerformanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    return unsubscribe;
  }, []);

  if (!metrics || adaptation.guidanceLevel === 'minimal') return null;

  const getPerformanceColor = () => {
    if (metrics.fps && metrics.fps < 30) return colors.danger;
    if (metrics.memoryUsage?.percentage > 80) return colors.warning;
    return colors.success;
  };

  const getPerformanceIcon = () => {
    if (metrics.fps && metrics.fps < 30) return 'warning';
    if (metrics.memoryUsage?.percentage > 80) return 'alert-circle';
    return 'checkmark-circle';
  };

  return (
    <View style={[styles.performanceFeedback, { backgroundColor: getPerformanceColor() }]}>
      <Ionicons name={getPerformanceIcon()} size={16} color="#fff" />
    </View>
  );
};

const styles = StyleSheet.create({
  // Toast styles
  toast: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: SCREEN_WIDTH - 32,
  },
  toastTop: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
  },
  toastBottom: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
  },
  toastCenter: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -50 }],
  },
  successToast: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  errorToast: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  warningToast: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  infoToast: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  loadingToast: {
    borderLeftWidth: 4,
    borderLeftColor: colors.textMuted,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  toastText: {
    flex: 1,
  },
  toastTitle: {
    fontWeight: '600',
    color: colors.text,
  },
  toastMessage: {
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  toastAction: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    marginLeft: 8,
  },
  toastActionText: {
    color: '#fff',
    fontWeight: '500',
  },
  toastDismiss: {
    marginLeft: 8,
  },

  // Progress styles
  progressContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontWeight: '600',
    color: colors.text,
  },
  progressPercentage: {
    fontWeight: '500',
    color: colors.primary,
  },
  progressSubtitle: {
    color: colors.textMuted,
  },
  progressTrack: {
    backgroundColor: colors.border,
  },
  progressBar: {
    backgroundColor: colors.primary,
  },

  // Loading styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMessage: {
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  loadingSubmessage: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '500',
  },

  // Empty state styles
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyStateIcon: {
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  emptyStateDescription: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateAction: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  emptyStateActionText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Contextual help styles
  contextualHelp: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: 280,
    zIndex: 1000,
  },
  contextualHelpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contextualHelpTitle: {
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  contextualHelpContent: {
    color: colors.textMuted,
    lineHeight: 18,
  },

  // Performance feedback styles
  performanceFeedback: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});

export default {
  EnhancedToast,
  ProgressFeedback,
  LoadingFeedback,
  EmptyStateFeedback,
  ContextualHelp,
  PerformanceFeedback,
};