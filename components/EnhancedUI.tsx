/**
 * Enhanced UI Components
 * 
 * Provides advanced UI components with:
 * - Theme-aware styling
 * - Smooth animations and micro-interactions
 * - Gesture support
 * - Accessibility enhancements
 * 
 * Phase 2 Task 3: Advanced UI/UX Enhancements
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
  Switch,
  Modal,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { AnimationComponents, GestureAnimations, MicroInteractions } from '../lib/animations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced Button Component
interface EnhancedButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  animated?: boolean;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  animated = true,
  disabled,
  onPress,
  ...props
}) => {
  const { theme } = useTheme();
  const pressAnimation = animated ? MicroInteractions.buttonPress() : null;
  const loadingPulse = loading ? MicroInteractions.loadingPulse() : null;

  useEffect(() => {
    if (loading && loadingPulse) {
      loadingPulse.start();
    } else if (loadingPulse) {
      loadingPulse.stop();
    }
  }, [loading, loadingPulse]);

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: size === 'sm' ? theme.spacing.sm : size === 'lg' ? theme.spacing.lg : theme.spacing.md,
      width: fullWidth ? '100%' : undefined,
      opacity: disabled ? 0.6 : 1,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary,
          ...theme.shadows.sm,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.secondary,
          ...theme.shadows.sm,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.danger,
          ...theme.shadows.sm,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: theme.typography.sizes[size],
      fontWeight: theme.typography.weights.semibold,
    };

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return {
          ...baseStyle,
          color: theme.colors.textInverse,
        };
      case 'outline':
      case 'ghost':
        return {
          ...baseStyle,
          color: theme.colors.primary,
        };
      default:
        return baseStyle;
    }
  };

  const handlePress = () => {
    if (animated && pressAnimation) {
      pressAnimation.onPress();
    }
    onPress?.();
  };

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const iconColor = variant === 'outline' || variant === 'ghost' 
    ? theme.colors.primary 
    : theme.colors.textInverse;

  return (
    <Animated.View style={[
      pressAnimation?.style,
      loadingPulse?.style,
    ]}>
      <Pressable
        style={[getButtonStyle(), style]}
        onPress={handlePress}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Animated.View style={loadingPulse?.style}>
            <Ionicons name="hourglass" size={iconSize} color={iconColor} />
          </Animated.View>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons 
                name={icon} 
                size={iconSize} 
                color={iconColor} 
                style={{ marginRight: theme.spacing.sm }} 
              />
            )}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
            {icon && iconPosition === 'right' && (
              <Ionicons 
                name={icon} 
                size={iconSize} 
                color={iconColor} 
                style={{ marginLeft: theme.spacing.sm }} 
              />
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

// Enhanced Card Component
interface EnhancedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  pressable?: boolean;
  onPress?: () => void;
  animated?: boolean;
  elevation?: 'sm' | 'md' | 'lg';
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  style,
  pressable = false,
  onPress,
  animated = true,
  elevation = 'sm',
}) => {
  const { theme } = useTheme();
  const pressAnimation = animated && pressable ? GestureAnimations.createPressAnimation() : null;

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows[elevation],
  };

  if (pressable) {
    return (
      <Animated.View style={pressAnimation?.style}>
        <Pressable
          style={[cardStyle, style]}
          onPress={onPress}
          onPressIn={pressAnimation?.onPressIn}
          onPressOut={pressAnimation?.onPressOut}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

// Theme Toggle Component
export const ThemeToggle: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handleToggle = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Rotate animation
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      toggleTheme();
      rotateAnim.setValue(0);
      setIsAnimating(false);
    });
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Pressable
      style={[styles.themeToggle, { backgroundColor: theme.colors.card }]}
      onPress={handleToggle}
      disabled={isAnimating}
    >
      <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
        <Ionicons
          name={isDark ? 'sunny' : 'moon'}
          size={24}
          color={theme.colors.primary}
        />
      </Animated.View>
    </Pressable>
  );
};

// Enhanced Modal Component
interface EnhancedModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'slide' | 'fade' | 'scale';
  position?: 'center' | 'bottom' | 'top';
  style?: ViewStyle;
}

export const EnhancedModal: React.FC<EnhancedModalProps> = ({
  visible,
  onClose,
  children,
  animationType = 'slide',
  position = 'center',
  style,
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      const animations = [
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ];

      if (animationType === 'slide') {
        animations.push(
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        );
      } else if (animationType === 'scale') {
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        );
      }

      Animated.parallel(animations).start();
    } else {
      const animations = [
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ];

      if (animationType === 'slide') {
        animations.push(
          Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          })
        );
      } else if (animationType === 'scale') {
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          })
        );
      }

      Animated.parallel(animations).start();
    }
  }, [visible, animationType]);

  const getContentStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      margin: theme.spacing.lg,
      maxHeight: screenHeight * 0.8,
    };

    switch (position) {
      case 'bottom':
        return {
          ...baseStyle,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          margin: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        };
      case 'top':
        return {
          ...baseStyle,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        };
      default:
        return baseStyle;
    }
  };

  const getTransform = () => {
    const transforms: any[] = [];

    if (animationType === 'slide') {
      transforms.push({ translateY: slideAnim });
    } else if (animationType === 'scale') {
      transforms.push({ scale: scaleAnim });
    }

    return transforms;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          { backgroundColor: theme.colors.overlay, opacity: fadeAnim },
        ]}
      >
        <Pressable style={styles.modalOverlay} onPress={onClose} />
        <Animated.View
          style={[
            getContentStyle(),
            { transform: getTransform() },
            style,
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Swipeable Card Component
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  style?: ViewStyle;
  swipeThreshold?: number;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  style,
  swipeThreshold = screenWidth * 0.3,
}) => {
  const { theme } = useTheme();
  const swipeAnimation = GestureAnimations.createSwipeAnimation();

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: swipeAnimation.translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;

      if (Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > 500) {
        if (translationX > 0) {
          // Swipe right
          swipeAnimation.swipeRight().start(() => {
            onSwipeRight?.();
            swipeAnimation.reset().start();
          });
        } else {
          // Swipe left
          swipeAnimation.swipeLeft().start(() => {
            onSwipeLeft?.();
            swipeAnimation.reset().start();
          });
        }
      } else {
        // Reset position
        swipeAnimation.reset().start();
      }
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={[
          {
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.md,
            ...theme.shadows.sm,
          },
          swipeAnimation.style,
          style,
        ]}
      >
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

// Floating Action Button
interface FloatingActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  position = 'bottom-right',
  size = 'md',
  style,
}) => {
  const { theme } = useTheme();
  const pressAnimation = MicroInteractions.buttonPress();
  const entranceAnimation = AnimationComponents.createEntranceAnimation('up');

  useEffect(() => {
    entranceAnimation.enter(300, 500).start();
  }, []);

  const getPositionStyle = (): ViewStyle => {
    const offset = theme.spacing.lg;
    
    switch (position) {
      case 'bottom-right':
        return { position: 'absolute', bottom: offset, right: offset };
      case 'bottom-left':
        return { position: 'absolute', bottom: offset, left: offset };
      case 'top-right':
        return { position: 'absolute', top: offset, right: offset };
      case 'top-left':
        return { position: 'absolute', top: offset, left: offset };
      default:
        return { position: 'absolute', bottom: offset, right: offset };
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm': return 40;
      case 'lg': return 64;
      default: return 56;
    }
  };

  const buttonSize = getSize();
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 32 : 24;

  return (
    <Animated.View
      style={[
        getPositionStyle(),
        entranceAnimation.style,
        pressAnimation.style,
      ]}
    >
      <Pressable
        style={[
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            ...theme.shadows.lg,
          },
          style,
        ]}
        onPress={pressAnimation.onPress}
        onPressIn={pressAnimation.onPressIn}
        onPressOut={pressAnimation.onPressOut}
      >
        <Ionicons name={icon} size={iconSize} color={theme.colors.textInverse} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  themeToggle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});