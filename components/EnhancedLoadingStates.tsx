/**
 * Enhanced Loading States and Skeleton System
 * 
 * Advanced loading system with intelligent skeletons, progressive loading,
 * and adaptive animations based on user preferences and device capabilities.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/enhancedTheme';
import { useAccessibility } from '../lib/accessibilityEnhancements';
import { useUXAdaptation } from '../lib/enhancedUX';

const { width: screenWidth } = Dimensions.get('window');

// Loading state types
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
  EMPTY = 'empty',
}

// Skeleton component types
export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  animated?: boolean;
}

// Enhanced skeleton component
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  animated = true,
}) => {
  const { theme } = useTheme();
  const { adaptation } = useAccessibility();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated || adaptation.preferences.reduceMotion) return;

    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: adaptation.getAccessibleAnimationDuration(1500),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: adaptation.getAccessibleAnimationDuration(1500),
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [animated, adaptation]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  const skeletonStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: theme.colors.border.light,
    overflow: 'hidden' as const,
  };

  if (!animated || adaptation.preferences.reduceMotion) {
    return <View style={[skeletonStyle, style]} />;
  }

  return (
    <View style={[skeletonStyle, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            theme.colors.overlay.light,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

// Card skeleton component
export const CardSkeleton: React.FC<{ style?: any }> = ({ style }) => {
  const { theme } = useTheme();
  const spacing = theme.spacing;

  return (
    <View style={[styles.cardSkeleton, { padding: spacing.md }, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={12} style={{ marginTop: spacing.xs }} />
        </View>
      </View>
      <Skeleton width="100%" height={12} style={{ marginTop: spacing.md }} />
      <Skeleton width="80%" height={12} style={{ marginTop: spacing.xs }} />
      <Skeleton width="60%" height={12} style={{ marginTop: spacing.xs }} />
    </View>
  );
};

// List skeleton component
interface ListSkeletonProps {
  itemCount?: number;
  itemHeight?: number;
  showHeader?: boolean;
  style?: any;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  itemCount = 5,
  itemHeight = 80,
  showHeader = false,
  style,
}) => {
  const { theme } = useTheme();
  const spacing = theme.spacing;

  return (
    <View style={[styles.listSkeleton, style]}>
      {showHeader && (
        <View style={[styles.listHeader, { marginBottom: spacing.md }]}>
          <Skeleton width="40%" height={24} />
          <Skeleton width={80} height={32} borderRadius={16} />
        </View>
      )}
      {Array.from({ length: itemCount }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.listItem,
            { height: itemHeight, marginBottom: spacing.sm },
          ]}
        >
          <Skeleton width={60} height={60} borderRadius={8} />
          <View style={styles.listItemContent}>
            <Skeleton width="80%" height={16} />
            <Skeleton width="60%" height={12} style={{ marginTop: spacing.xs }} />
            <Skeleton width="40%" height={12} style={{ marginTop: spacing.xs }} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Project card skeleton
export const ProjectCardSkeleton: React.FC<{ count?: number; style?: any }> = ({
  count = 3,
  style,
}) => {
  const { theme } = useTheme();
  const spacing = theme.spacing;

  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.projectCard,
            {
              marginBottom: spacing.md,
              padding: spacing.md,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <View style={styles.projectHeader}>
            <Skeleton width="70%" height={20} />
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
          <Skeleton
            width="100%"
            height={12}
            style={{ marginTop: spacing.sm }}
          />
          <Skeleton
            width="80%"
            height={12}
            style={{ marginTop: spacing.xs }}
          />
          <View style={[styles.projectFooter, { marginTop: spacing.md }]}>
            <Skeleton width="30%" height={12} />
            <Skeleton width="40%" height={12} />
          </View>
          <View style={[styles.progressBar, { marginTop: spacing.sm }]}>
            <Skeleton width="100%" height={4} borderRadius={2} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Loading spinner with message
interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: any;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
  color,
  style,
}) => {
  const { theme } = useTheme();
  const { adaptation } = useAccessibility();
  const uxAdaptation = useUXAdaptation();

  // Use reduced motion if needed
  const animating = !adaptation.preferences.reduceMotion;

  return (
    <View style={[styles.loadingSpinner, style]}>
      <ActivityIndicator
        size={size}
        color={color || theme.colors.primary}
        animating={animating}
      />
      {message && (
        <Text
          style={[
            styles.loadingMessage,
            {
              color: theme.colors.text.secondary,
              fontSize: adaptation.getAccessibleFontSize(theme.typography.fontSizes.sm),
              marginTop: theme.spacing.sm,
            },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

// Progressive loading component
interface ProgressiveLoadingProps {
  stages: Array<{
    message: string;
    duration?: number;
  }>;
  currentStage: number;
  progress?: number;
  style?: any;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  stages,
  currentStage,
  progress,
  style,
}) => {
  const { theme } = useTheme();
  const { adaptation } = useAccessibility();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: adaptation.getAccessibleAnimationDuration(300),
        useNativeDriver: false,
      }).start();
    }
  }, [progress, adaptation]);

  const currentStageData = stages[currentStage] || stages[0];

  return (
    <View style={[styles.progressiveLoading, style]}>
      <LoadingSpinner
        message={currentStageData.message}
        color={theme.colors.primary}
      />
      
      {progress !== undefined && (
        <View style={[styles.progressContainer, { marginTop: theme.spacing.lg }]}>
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: theme.colors.border.light,
                borderRadius: theme.borderRadius.xs,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.xs,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.progressText,
              {
                color: theme.colors.text.secondary,
                fontSize: adaptation.getAccessibleFontSize(theme.typography.fontSizes.sm),
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {Math.round((progress || 0) * 100)}%
          </Text>
        </View>
      )}

      <View style={[styles.stageIndicators, { marginTop: theme.spacing.lg }]}>
        {stages.map((stage, index) => (
          <View
            key={index}
            style={[
              styles.stageIndicator,
              {
                backgroundColor:
                  index <= currentStage
                    ? theme.colors.primary
                    : theme.colors.border.light,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// Empty state component
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-open-outline',
  title,
  description,
  action,
  style,
}) => {
  const { theme } = useTheme();
  const { adaptation } = useAccessibility();

  return (
    <View style={[styles.emptyState, style]}>
      <Text
        style={[
          styles.emptyIcon,
          {
            fontSize: adaptation.getAccessibleFontSize(64),
            color: theme.colors.text.disabled,
          },
        ]}
      >
        📁
      </Text>
      <Text
        style={[
          styles.emptyTitle,
          {
            color: theme.colors.text.primary,
            fontSize: adaptation.getAccessibleFontSize(theme.typography.fontSizes.lg),
            marginTop: theme.spacing.md,
          },
        ]}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={[
            styles.emptyDescription,
            {
              color: theme.colors.text.secondary,
              fontSize: adaptation.getAccessibleFontSize(theme.typography.fontSizes.md),
              marginTop: theme.spacing.sm,
            },
          ]}
        >
          {description}
        </Text>
      )}
      {action && (
        <TouchableOpacity
          style={[
            styles.emptyAction,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.md,
              marginTop: theme.spacing.lg,
              ...adaptation.getAccessibleTouchTarget(44),
            },
          ]}
          onPress={action.onPress}
        >
          <Text
            style={[
              styles.emptyActionText,
              {
                color: theme.colors.text.inverse,
                fontSize: adaptation.getAccessibleFontSize(theme.typography.fontSizes.md),
              },
            ]}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Error state component
interface ErrorStateProps {
  title: string;
  description?: string;
  retry?: {
    label: string;
    onPress: () => void;
  };
  style?: any;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  retry,
  style,
}) => {
  const { theme } = useTheme();
  const { adaptation } = useAccessibility();

  return (
    <View style={[styles.errorState, style]}>
      <Text
        style={[
          styles.errorIcon,
          {
            fontSize: adaptation.getAccessibleFontSize(64),
            color: theme.colors.error,
          },
        ]}
      >
        ⚠️
      </Text>
      <Text
        style={[
          styles.errorTitle,
          {
            color: theme.colors.error,
            fontSize: adaptation.getAccessibleFontSize(theme.typography.fontSizes.lg),
            marginTop: theme.spacing.md,
          },
        ]}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={[
            styles.errorDescription,
            {
              color: theme.colors.text.secondary,
              fontSize: adaptation.getAccessibleFontSize(theme.typography.fontSizes.md),
              marginTop: theme.spacing.sm,
            },
          ]}
        >
          {description}
        </Text>
      )}
      {retry && (
        <TouchableOpacity
          style={[
            styles.errorRetry,
            {
              borderColor: theme.colors.error,
              borderRadius: theme.borderRadius.md,
              marginTop: theme.spacing.lg,
              ...adaptation.getAccessibleTouchTarget(44),
            },
          ]}
          onPress={retry.onPress}
        >
          <Text
            style={[
              styles.errorRetryText,
              {
                color: theme.colors.error,
                fontSize: adaptation.getAccessibleFontSize(theme.typography.fontSizes.md),
              },
            ]}
          >
            {retry.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Smart loading wrapper that adapts to content
interface SmartLoadingWrapperProps {
  loading: boolean;
  error?: Error | null;
  empty?: boolean;
  children: React.ReactNode;
  skeletonType?: 'card' | 'list' | 'project';
  skeletonCount?: number;
  loadingMessage?: string;
  emptyState?: {
    title: string;
    description?: string;
    action?: { label: string; onPress: () => void };
  };
  errorState?: {
    title: string;
    description?: string;
    retry?: { label: string; onPress: () => void };
  };
}

export const SmartLoadingWrapper: React.FC<SmartLoadingWrapperProps> = ({
  loading,
  error,
  empty,
  children,
  skeletonType = 'card',
  skeletonCount = 3,
  loadingMessage,
  emptyState,
  errorState,
}) => {
  if (error) {
    return (
      <ErrorState
        title={errorState?.title || 'Something went wrong'}
        description={errorState?.description || error.message}
        retry={errorState?.retry}
      />
    );
  }

  if (loading) {
    switch (skeletonType) {
      case 'list':
        return <ListSkeleton itemCount={skeletonCount} />;
      case 'project':
        return <ProjectCardSkeleton count={skeletonCount} />;
      default:
        return (
          <View>
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <CardSkeleton key={index} style={{ marginBottom: 16 }} />
            ))}
          </View>
        );
    }
  }

  if (empty && emptyState) {
    return (
      <EmptyState
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  listSkeleton: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  projectCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    height: 4,
  },
  loadingSpinner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingMessage: {
    textAlign: 'center',
    fontWeight: '500',
  },
  progressiveLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  stageIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  stageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    textAlign: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyAction: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyActionText: {
    fontWeight: '600',
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    textAlign: 'center',
  },
  errorTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorDescription: {
    textAlign: 'center',
    lineHeight: 22,
  },
  errorRetry: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
  },
  errorRetryText: {
    fontWeight: '600',
  },
});

// Export loading state hook
export function useLoadingState(initialState: LoadingState = LoadingState.IDLE) {
  const [state, setState] = React.useState(initialState);
  const [progress, setProgress] = React.useState(0);
  const [message, setMessage] = React.useState<string>();

  const setLoading = React.useCallback((message?: string) => {
    setState(LoadingState.LOADING);
    setMessage(message);
    setProgress(0);
  }, []);

  const setSuccess = React.useCallback(() => {
    setState(LoadingState.SUCCESS);
    setProgress(1);
  }, []);

  const setError = React.useCallback((error?: Error) => {
    setState(LoadingState.ERROR);
    setMessage(error?.message);
  }, []);

  const setEmpty = React.useCallback(() => {
    setState(LoadingState.EMPTY);
  }, []);

  const setIdle = React.useCallback(() => {
    setState(LoadingState.IDLE);
    setProgress(0);
    setMessage(undefined);
  }, []);

  const updateProgress = React.useCallback((newProgress: number) => {
    setProgress(Math.max(0, Math.min(1, newProgress)));
  }, []);

  return {
    state,
    progress,
    message,
    isLoading: state === LoadingState.LOADING,
    isSuccess: state === LoadingState.SUCCESS,
    isError: state === LoadingState.ERROR,
    isEmpty: state === LoadingState.EMPTY,
    isIdle: state === LoadingState.IDLE,
    setLoading,
    setSuccess,
    setError,
    setEmpty,
    setIdle,
    updateProgress,
  };
}