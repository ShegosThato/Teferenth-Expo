/**
 * Standardized Loading States
 * 
 * Provides consistent loading indicators and skeleton screens
 * across the application for better user experience.
 * 
 * Phase 2 Task 1: Enhanced Error Handling & User Feedback
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Animated,
  ViewStyle,
  TextStyle 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';

// Loading spinner with customizable size and message
export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = colors.primary,
  message,
  style
}) => (
  <View style={[styles.loadingContainer, style]}>
    <ActivityIndicator size={size} color={color} />
    {message && (
      <Text style={styles.loadingMessage}>{message}</Text>
    )}
  </View>
);

// Skeleton loading for cards and content
export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e2e8f0', '#f1f5f9'],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

// Project card skeleton
export const ProjectCardSkeleton: React.FC = () => (
  <View style={styles.cardSkeleton}>
    <View style={styles.cardSkeletonHeader}>
      <View style={styles.cardSkeletonTitle}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="40%" height={14} style={{ marginTop: 4 }} />
      </View>
      <Skeleton width={60} height={24} borderRadius={12} />
    </View>
    <Skeleton width="30%" height={12} style={{ marginTop: 8 }} />
  </View>
);

// Scene card skeleton
export const SceneCardSkeleton: React.FC = () => (
  <View style={styles.sceneCardSkeleton}>
    <View style={styles.sceneSkeletonHeader}>
      <Skeleton width={80} height={14} />
      <Skeleton width={16} height={16} borderRadius={8} />
    </View>
    <Skeleton width="100%" height={180} borderRadius={8} style={{ marginVertical: 12 }} />
    <Skeleton width="100%" height={16} />
    <Skeleton width="80%" height={16} style={{ marginTop: 4 }} />
    <Skeleton width="60%" height={16} style={{ marginTop: 4 }} />
  </View>
);

// Full screen loading with message
export interface FullScreenLoadingProps {
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  progress?: number;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  message = 'Loading...',
  subMessage,
  showProgress = false,
  progress = 0
}) => (
  <View style={styles.fullScreenLoading}>
    <View style={styles.fullScreenLoadingContent}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.fullScreenLoadingMessage}>{message}</Text>
      {subMessage && (
        <Text style={styles.fullScreenLoadingSubMessage}>{subMessage}</Text>
      )}
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(100, Math.max(0, progress * 100))}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      )}
    </View>
  </View>
);

// Empty state with loading option
export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
    loading?: boolean;
  };
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-outline',
  title,
  subtitle,
  action,
  style
}) => (
  <View style={[styles.emptyState, style]}>
    <Ionicons name={icon} size={64} color={colors.mutedText} />
    <Text style={styles.emptyStateTitle}>{title}</Text>
    {subtitle && (
      <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
    )}
    {action && (
      <View style={styles.emptyStateAction}>
        {action.loading ? (
          <LoadingSpinner size="small" message={action.label} />
        ) : (
          <Text 
            style={styles.emptyStateActionText}
            onPress={action.onPress}
          >
            {action.label}
          </Text>
        )}
      </View>
    )}
  </View>
);

// Error state with retry option
export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  retrying = false,
  style
}) => (
  <View style={[styles.errorState, style]}>
    <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
    <Text style={styles.errorStateTitle}>{title}</Text>
    <Text style={styles.errorStateMessage}>{message}</Text>
    {onRetry && (
      <View style={styles.errorStateAction}>
        {retrying ? (
          <LoadingSpinner size="small" message="Retrying..." />
        ) : (
          <Text 
            style={styles.errorStateActionText}
            onPress={onRetry}
          >
            {retryLabel}
          </Text>
        )}
      </View>
    )}
  </View>
);

// Inline loading for buttons
export interface InlineLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  loading,
  children,
  loadingText,
  size = 'small',
  color = colors.primary
}) => {
  if (loading) {
    return (
      <View style={styles.inlineLoading}>
        <ActivityIndicator size={size} color={color} />
        {loadingText && (
          <Text style={[styles.inlineLoadingText, { color }]}>
            {loadingText}
          </Text>
        )}
      </View>
    );
  }
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingMessage: {
    marginTop: 12,
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
  },
  cardSkeleton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardSkeletonTitle: {
    flex: 1,
  },
  sceneCardSkeleton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sceneSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fullScreenLoading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenLoadingContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  fullScreenLoadingMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  fullScreenLoadingSubMessage: {
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateAction: {
    marginTop: 16,
  },
  emptyStateActionText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorStateMessage: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorStateAction: {
    marginTop: 16,
  },
  errorStateActionText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLoadingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
});