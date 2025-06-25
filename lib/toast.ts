import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';

/**
 * Enhanced Toast System
 * 
 * Provides better user feedback with:
 * - Visual toast notifications instead of alerts
 * - Different toast types (success, error, info, warning)
 * - Auto-dismiss functionality
 * - Queue management for multiple toasts
 * - Better accessibility
 * 
 * Phase 2 Task 1: Enhanced Error Handling & User Feedback
 */

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning',
  LOADING = 'loading'
}

export interface ToastConfig {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  persistent?: boolean;
}

// Toast manager for handling multiple toasts
class ToastManager {
  private toasts: ToastConfig[] = [];
  private listeners: Array<(toasts: ToastConfig[]) => void> = [];

  show(config: Omit<ToastConfig, 'id'>): string {
    const id = Date.now().toString();
    const toast: ToastConfig = {
      id,
      duration: 4000,
      ...config
    };

    this.toasts.push(toast);
    this.notifyListeners();

    // Auto-dismiss if not persistent
    if (!toast.persistent && toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, toast.duration);
    }

    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  dismissAll() {
    this.toasts = [];
    this.notifyListeners();
  }

  subscribe(listener: (toasts: ToastConfig[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  getToasts(): ToastConfig[] {
    return [...this.toasts];
  }
}

const toastManager = new ToastManager();

// Enhanced toast API
export const toast = {
  success: (message: string, title?: string) => 
    toastManager.show({ type: ToastType.SUCCESS, message, title }),
  
  error: (message: string, title?: string) => 
    toastManager.show({ type: ToastType.ERROR, message, title }),
  
  info: (message: string, title?: string) => 
    toastManager.show({ type: ToastType.INFO, message, title }),
  
  warning: (message: string, title?: string) => 
    toastManager.show({ type: ToastType.WARNING, message, title }),
  
  loading: (message: string, title?: string) => 
    toastManager.show({ type: ToastType.LOADING, message, title, persistent: true }),
  
  message: (message: string) => 
    toastManager.show({ type: ToastType.INFO, message }),
  
  custom: (config: Omit<ToastConfig, 'id'>) => 
    toastManager.show(config),
  
  dismiss: (id: string) => toastManager.dismiss(id),
  dismissAll: () => toastManager.dismissAll()
};

// Individual toast component
const ToastItem: React.FC<{ 
  toast: ToastConfig; 
  onDismiss: (id: string) => void;
}> = ({ toast: toastConfig, onDismiss }) => {
  const [slideAnim] = useState(new Animated.Value(-100));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toastConfig.id);
    });
  };

  const getToastStyle = () => {
    switch (toastConfig.type) {
      case ToastType.SUCCESS:
        return { backgroundColor: colors.success, iconName: 'checkmark-circle' as const };
      case ToastType.ERROR:
        return { backgroundColor: colors.danger, iconName: 'alert-circle' as const };
      case ToastType.WARNING:
        return { backgroundColor: colors.warning, iconName: 'warning' as const };
      case ToastType.LOADING:
        return { backgroundColor: colors.info, iconName: 'hourglass' as const };
      default:
        return { backgroundColor: colors.info, iconName: 'information-circle' as const };
    }
  };

  const style = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { backgroundColor: style.backgroundColor },
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`${toastConfig.type} notification: ${toastConfig.message}`}
    >
      <View style={styles.toastContent}>
        <Ionicons 
          name={style.iconName} 
          size={20} 
          color="white" 
          style={styles.toastIcon}
        />
        <View style={styles.toastText}>
          {toastConfig.title && (
            <Text style={styles.toastTitle}>{toastConfig.title}</Text>
          )}
          <Text style={styles.toastMessage}>{toastConfig.message}</Text>
        </View>
        {toastConfig.action && (
          <TouchableOpacity
            style={styles.toastAction}
            onPress={toastConfig.action.onPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={toastConfig.action.label}
          >
            <Text style={styles.toastActionText}>{toastConfig.action.label}</Text>
          </TouchableOpacity>
        )}
        {!toastConfig.persistent && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// Main Toaster component
export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View style={styles.toasterContainer} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={toastManager.dismiss.bind(toastManager)}
        />
      ))}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  toasterContainer: {
    position: 'absolute',
    top: 60, // Below status bar
    left: 16,
    right: 16,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toastContainer: {
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  toastIcon: {
    marginRight: 12,
  },
  toastText: {
    flex: 1,
  },
  toastTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  toastMessage: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  toastAction: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  toastActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4,
  },
});