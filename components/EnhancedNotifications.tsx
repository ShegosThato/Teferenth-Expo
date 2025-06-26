/**
 * Enhanced Notification and Feedback System
 * 
 * Advanced notification system with contextual feedback, smart positioning,
 * and adaptive behavior based on user preferences and device capabilities.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../lib/theme';
import { uxManager, HapticPattern, useUXAdaptation } from '../lib/enhancedUX';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Notification types and configurations
export interface NotificationConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'progress';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  position?: 'top' | 'bottom' | 'center';
  action?: {
    label: string;
    onPress: () => void;
  };
  progress?: number;
  haptic?: HapticPattern;
  icon?: keyof typeof Ionicons.glyphMap;
  customComponent?: React.ComponentType<any>;
}

// Notification context for managing global notifications
interface NotificationContextType {
  notifications: NotificationConfig[];
  showNotification: (config: Omit<NotificationConfig, 'id'>) => string;
  hideNotification: (id: string) => void;
  updateNotification: (id: string, updates: Partial<NotificationConfig>) => void;
  clearAll: () => void;
}

const NotificationContext = React.createContext<NotificationContextType | null>(null);

// Individual notification component
interface NotificationItemProps {
  notification: NotificationConfig;
  onDismiss: (id: string) => void;
  onAction?: () => void;
  index: number;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  onAction,
  index,
}) => {
  const adaptation = useUXAdaptation();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (notification.position === 'top') {
          translateY.setValue(Math.min(0, gestureState.dy - 100));
        } else {
          translateY.setValue(Math.max(0, gestureState.dy + 100));
        }
        opacity.setValue(Math.max(0.3, 1 - Math.abs(gestureState.dy) / 200));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dy) > 100) {
          // Dismiss notification
          handleDismiss();
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: notification.position === 'top' ? -100 : 100,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    // Entrance animation
    const targetY = notification.position === 'bottom' ? 100 : -100;
    
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: targetY,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: adaptation.animationDuration,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress animation for progress notifications
    if (notification.type === 'progress' && notification.progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: notification.progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

    // Auto dismiss
    if (!notification.persistent && notification.duration) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);
      return () => clearTimeout(timer);
    }

    // Haptic feedback
    if (notification.haptic) {
      uxManager.hapticFeedback(notification.haptic);
    }
  }, [notification]);

  const handleDismiss = () => {
    const exitY = notification.position === 'bottom' ? 200 : -200;
    
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: exitY,
        duration: adaptation.animationDuration * 0.7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: adaptation.animationDuration * 0.7,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: adaptation.animationDuration * 0.7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(notification.id);
    });
  };

  const getNotificationStyle = () => {
    const baseStyle = {
      backgroundColor: 'white',
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    };

    switch (notification.type) {
      case 'success':
        return { ...baseStyle, borderLeftColor: '#4CAF50' };
      case 'error':
        return { ...baseStyle, borderLeftColor: '#F44336' };
      case 'warning':
        return { ...baseStyle, borderLeftColor: '#FF9800' };
      case 'info':
        return { ...baseStyle, borderLeftColor: '#2196F3' };
      case 'progress':
        return { ...baseStyle, borderLeftColor: '#9C27B0' };
      default:
        return baseStyle;
    }
  };

  const getIcon = () => {
    if (notification.icon) return notification.icon;
    
    switch (notification.type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      case 'progress': return 'time';
      default: return 'notifications';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      case 'progress': return '#9C27B0';
      default: return colors.primary;
    }
  };

  const getPosition = () => {
    const basePosition = {
      position: 'absolute' as const,
      left: 16,
      right: 16,
      zIndex: 1000 + index,
    };

    switch (notification.position) {
      case 'bottom':
        return { ...basePosition, bottom: 16 + (index * 80) };
      case 'center':
        return { ...basePosition, top: screenHeight / 2 - 40 + (index * 80) };
      default: // top
        return { ...basePosition, top: 60 + (index * 80) };
    }
  };

  // Custom component override
  if (notification.customComponent) {
    const CustomComponent = notification.customComponent;
    return (
      <Animated.View
        style={[
          getPosition(),
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <CustomComponent
          notification={notification}
          onDismiss={() => handleDismiss()}
          onAction={onAction}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.notification,
        getPosition(),
        getNotificationStyle(),
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {Platform.OS === 'ios' && (
        <BlurView intensity={80} style={StyleSheet.absoluteFill} />
      )}
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Ionicons
            name={getIcon()}
            size={24}
            color={getIconColor()}
            style={styles.notificationIcon}
          />
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            {notification.message && (
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => handleDismiss()}
            style={styles.dismissButton}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {notification.type === 'progress' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((notification.progress || 0) * 100)}%
            </Text>
          </View>
        )}

        {notification.action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              notification.action?.onPress();
              onAction?.();
            }}
          >
            <Text style={styles.actionButtonText}>{notification.action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// Notification provider component
interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
}) => {
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);

  const showNotification = (config: Omit<NotificationConfig, 'id'>): string => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notification: NotificationConfig = {
      ...config,
      id,
      duration: config.duration ?? (config.persistent ? undefined : 4000),
      position: config.position ?? 'top',
    };

    setNotifications(prev => {
      const newNotifications = [notification, ...prev];
      // Limit number of notifications
      return newNotifications.slice(0, maxNotifications);
    });

    // Track notification
    uxManager.trackInteraction('notification_shown', {
      type: config.type,
      title: config.title,
    });

    return id;
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateNotification = (id: string, updates: Partial<NotificationConfig>) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, ...updates } : n))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const contextValue: NotificationContextType = {
    notifications,
    showNotification,
    hideNotification,
    updateNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {notifications.map((notification, index) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={hideNotification}
          index={index}
        />
      ))}
    </NotificationContext.Provider>
  );
};

// Hook for using notifications
export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Convenience hooks for different notification types
export const useToast = () => {
  const { showNotification } = useNotifications();

  return {
    success: (title: string, message?: string, options?: Partial<NotificationConfig>) =>
      showNotification({
        type: 'success',
        title,
        message,
        haptic: HapticPattern.SUCCESS,
        ...options,
      }),

    error: (title: string, message?: string, options?: Partial<NotificationConfig>) =>
      showNotification({
        type: 'error',
        title,
        message,
        haptic: HapticPattern.ERROR,
        persistent: true,
        ...options,
      }),

    warning: (title: string, message?: string, options?: Partial<NotificationConfig>) =>
      showNotification({
        type: 'warning',
        title,
        message,
        haptic: HapticPattern.WARNING,
        ...options,
      }),

    info: (title: string, message?: string, options?: Partial<NotificationConfig>) =>
      showNotification({
        type: 'info',
        title,
        message,
        haptic: HapticPattern.LIGHT,
        ...options,
      }),

    progress: (title: string, progress: number, options?: Partial<NotificationConfig>) =>
      showNotification({
        type: 'progress',
        title,
        progress,
        persistent: true,
        ...options,
      }),
  };
};

// Smart notification component that adapts to context
interface SmartNotificationProps {
  trigger: 'error' | 'success' | 'action_complete' | 'feature_discovered';
  context?: Record<string, unknown>;
  children?: React.ReactNode;
}

export const SmartNotification: React.FC<SmartNotificationProps> = ({
  trigger,
  context,
  children,
}) => {
  const toast = useToast();
  const adaptation = useUXAdaptation();

  useEffect(() => {
    const showContextualNotification = () => {
      switch (trigger) {
        case 'error':
          toast.error(
            'Something went wrong',
            'Please try again or contact support if the problem persists',
            {
              action: {
                label: 'Retry',
                onPress: () => {
                  uxManager.trackInteraction('error_retry', context);
                },
              },
            }
          );
          break;

        case 'success':
          if (adaptation.feedbackIntensity !== 'minimal') {
            toast.success(
              'Success!',
              'Your action was completed successfully',
              {
                duration: adaptation.feedbackIntensity === 'enhanced' ? 3000 : 2000,
              }
            );
          }
          break;

        case 'action_complete':
          if (adaptation.guidanceLevel !== 'minimal') {
            toast.info(
              'Action completed',
              'You can find the results in your project library',
              {
                action: {
                  label: 'View',
                  onPress: () => {
                    uxManager.trackInteraction('action_complete_view', context);
                  },
                },
              }
            );
          }
          break;

        case 'feature_discovered':
          if (adaptation.guidanceLevel === 'detailed') {
            toast.info(
              'New feature discovered!',
              'Tap to learn more about this feature',
              {
                action: {
                  label: 'Learn More',
                  onPress: () => {
                    uxManager.trackInteraction('feature_learn_more', context);
                  },
                },
              }
            );
          }
          break;
      }
    };

    showContextualNotification();
  }, [trigger, context, adaptation]);

  return <>{children}</>;
};

const styles = StyleSheet.create({
  notification: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9C27B0',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

// Export default notification configurations
export const defaultNotificationConfigs = {
  projectCreated: {
    type: 'success' as const,
    title: 'Project Created',
    message: 'Your new storyboard project is ready to edit',
    haptic: HapticPattern.SUCCESS,
  },
  
  scenesGenerated: {
    type: 'success' as const,
    title: 'Scenes Generated',
    message: 'AI has created scenes from your text',
    haptic: HapticPattern.SUCCESS,
    action: {
      label: 'View Scenes',
      onPress: () => uxManager.trackInteraction('view_generated_scenes'),
    },
  },
  
  videoExported: {
    type: 'success' as const,
    title: 'Video Exported',
    message: 'Your storyboard video has been saved to your device',
    haptic: HapticPattern.SUCCESS,
    action: {
      label: 'Share',
      onPress: () => uxManager.trackInteraction('share_exported_video'),
    },
  },
  
  networkError: {
    type: 'error' as const,
    title: 'Network Error',
    message: 'Please check your internet connection and try again',
    haptic: HapticPattern.ERROR,
    persistent: true,
    action: {
      label: 'Retry',
      onPress: () => uxManager.trackInteraction('network_error_retry'),
    },
  },
  
  aiProcessing: {
    type: 'progress' as const,
    title: 'Processing with AI',
    message: 'Generating scenes from your text...',
    persistent: true,
    progress: 0,
  },
};