/**
 * Advanced Animation System
 * 
 * Provides comprehensive animation utilities including:
 * - Smooth transitions and micro-interactions
 * - Gesture-based animations
 * - Performance-optimized animations
 * - Reusable animation presets
 * 
 * Phase 2 Task 3: Advanced UI/UX Enhancements
 */

import { Animated, Easing, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Animation presets
export const AnimationPresets = {
  // Timing configurations
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },
  
  // Easing functions
  easing: {
    easeInOut: Easing.bezier(0.4, 0, 0.2, 1),
    easeOut: Easing.bezier(0, 0, 0.2, 1),
    easeIn: Easing.bezier(0.4, 0, 1, 1),
    spring: Easing.elastic(1.3),
    bounce: Easing.bounce,
    linear: Easing.linear,
  },
  
  // Common animation values
  scale: {
    press: 0.95,
    hover: 1.05,
    pop: 1.1,
  },
  
  // Opacity values
  opacity: {
    hidden: 0,
    visible: 1,
    dimmed: 0.6,
  },
};

// Animation utility class
export class AnimationUtils {
  // Create fade in animation
  static fadeIn(
    animatedValue: Animated.Value,
    duration: number = AnimationPresets.timing.normal,
    delay: number = 0
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      delay,
      easing: AnimationPresets.easing.easeOut,
      useNativeDriver: true,
    });
  }

  // Create fade out animation
  static fadeOut(
    animatedValue: Animated.Value,
    duration: number = AnimationPresets.timing.normal,
    delay: number = 0
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      delay,
      easing: AnimationPresets.easing.easeIn,
      useNativeDriver: true,
    });
  }

  // Create slide in animation
  static slideIn(
    animatedValue: Animated.Value,
    direction: 'up' | 'down' | 'left' | 'right' = 'up',
    duration: number = AnimationPresets.timing.normal,
    delay: number = 0
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      delay,
      easing: AnimationPresets.easing.easeOut,
      useNativeDriver: true,
    });
  }

  // Create scale animation
  static scale(
    animatedValue: Animated.Value,
    toValue: number = 1,
    duration: number = AnimationPresets.timing.fast,
    delay: number = 0
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      delay,
      easing: AnimationPresets.easing.easeOut,
      useNativeDriver: true,
    });
  }

  // Create spring animation
  static spring(
    animatedValue: Animated.Value,
    toValue: number,
    tension: number = 100,
    friction: number = 8
  ): Animated.CompositeAnimation {
    return Animated.spring(animatedValue, {
      toValue,
      tension,
      friction,
      useNativeDriver: true,
    });
  }

  // Create staggered animation
  static stagger(
    animations: Animated.CompositeAnimation[],
    staggerTime: number = 100
  ): Animated.CompositeAnimation {
    return Animated.stagger(staggerTime, animations);
  }

  // Create sequence animation
  static sequence(
    animations: Animated.CompositeAnimation[]
  ): Animated.CompositeAnimation {
    return Animated.sequence(animations);
  }

  // Create parallel animation
  static parallel(
    animations: Animated.CompositeAnimation[]
  ): Animated.CompositeAnimation {
    return Animated.parallel(animations);
  }

  // Create loop animation
  static loop(
    animation: Animated.CompositeAnimation,
    iterations: number = -1
  ): Animated.CompositeAnimation {
    return Animated.loop(animation, { iterations });
  }

  // Get slide distance based on direction
  static getSlideDistance(direction: 'up' | 'down' | 'left' | 'right'): number {
    switch (direction) {
      case 'up':
        return screenHeight;
      case 'down':
        return -screenHeight;
      case 'left':
        return screenWidth;
      case 'right':
        return -screenWidth;
      default:
        return screenHeight;
    }
  }
}

// Pre-built animation components
export class AnimationComponents {
  // Fade in/out animation
  static createFadeAnimation(initialValue: number = 0) {
    const fadeAnim = new Animated.Value(initialValue);
    
    return {
      animatedValue: fadeAnim,
      fadeIn: (duration?: number, delay?: number) => 
        AnimationUtils.fadeIn(fadeAnim, duration, delay),
      fadeOut: (duration?: number, delay?: number) => 
        AnimationUtils.fadeOut(fadeAnim, duration, delay),
      style: { opacity: fadeAnim },
    };
  }

  // Scale animation
  static createScaleAnimation(initialValue: number = 1) {
    const scaleAnim = new Animated.Value(initialValue);
    
    return {
      animatedValue: scaleAnim,
      scaleIn: (duration?: number, delay?: number) => 
        AnimationUtils.scale(scaleAnim, 1, duration, delay),
      scaleOut: (duration?: number, delay?: number) => 
        AnimationUtils.scale(scaleAnim, 0, duration, delay),
      scaleTo: (value: number, duration?: number, delay?: number) => 
        AnimationUtils.scale(scaleAnim, value, duration, delay),
      style: { transform: [{ scale: scaleAnim }] },
    };
  }

  // Slide animation
  static createSlideAnimation(
    direction: 'up' | 'down' | 'left' | 'right' = 'up',
    initialValue?: number
  ) {
    const slideDistance = AnimationUtils.getSlideDistance(direction);
    const slideAnim = new Animated.Value(initialValue ?? slideDistance);
    
    const transformProperty = direction === 'left' || direction === 'right' 
      ? 'translateX' 
      : 'translateY';
    
    return {
      animatedValue: slideAnim,
      slideIn: (duration?: number, delay?: number) => 
        AnimationUtils.slideIn(slideAnim, direction, duration, delay),
      slideOut: (duration?: number, delay?: number) => 
        AnimationUtils.slideIn(slideAnim, direction, duration, delay),
      style: { transform: [{ [transformProperty]: slideAnim }] },
    };
  }

  // Rotation animation
  static createRotationAnimation(initialValue: string = '0deg') {
    const rotateAnim = new Animated.Value(0);
    
    return {
      animatedValue: rotateAnim,
      rotate: (degrees: number, duration?: number) => 
        Animated.timing(rotateAnim, {
          toValue: degrees,
          duration: duration || AnimationPresets.timing.normal,
          easing: AnimationPresets.easing.easeInOut,
          useNativeDriver: true,
        }),
      style: {
        transform: [{
          rotate: rotateAnim.interpolate({
            inputRange: [0, 360],
            outputRange: ['0deg', '360deg'],
          }),
        }],
      },
    };
  }

  // Combined entrance animation
  static createEntranceAnimation(
    direction: 'up' | 'down' | 'left' | 'right' = 'up'
  ) {
    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(AnimationUtils.getSlideDistance(direction));
    const scaleAnim = new Animated.Value(0.8);
    
    const transformProperty = direction === 'left' || direction === 'right' 
      ? 'translateX' 
      : 'translateY';
    
    return {
      fadeValue: fadeAnim,
      slideValue: slideAnim,
      scaleValue: scaleAnim,
      enter: (duration: number = AnimationPresets.timing.normal, delay: number = 0) => 
        AnimationUtils.parallel([
          AnimationUtils.fadeIn(fadeAnim, duration, delay),
          AnimationUtils.slideIn(slideAnim, direction, duration, delay),
          AnimationUtils.scale(scaleAnim, 1, duration, delay),
        ]),
      exit: (duration: number = AnimationPresets.timing.fast) => 
        AnimationUtils.parallel([
          AnimationUtils.fadeOut(fadeAnim, duration),
          AnimationUtils.scale(scaleAnim, 0.8, duration),
        ]),
      style: {
        opacity: fadeAnim,
        transform: [
          { [transformProperty]: slideAnim },
          { scale: scaleAnim },
        ],
      },
    };
  }
}

// Gesture animation utilities
export class GestureAnimations {
  // Press animation
  static createPressAnimation(scaleValue: number = AnimationPresets.scale.press) {
    const scaleAnim = new Animated.Value(1);
    
    return {
      animatedValue: scaleAnim,
      onPressIn: () => {
        AnimationUtils.scale(scaleAnim, scaleValue, AnimationPresets.timing.fast).start();
      },
      onPressOut: () => {
        AnimationUtils.scale(scaleAnim, 1, AnimationPresets.timing.fast).start();
      },
      style: { transform: [{ scale: scaleAnim }] },
    };
  }

  // Swipe animation
  static createSwipeAnimation() {
    const translateX = new Animated.Value(0);
    const opacity = new Animated.Value(1);
    
    return {
      translateX,
      opacity,
      swipeLeft: (distance: number = screenWidth) => 
        AnimationUtils.parallel([
          Animated.timing(translateX, {
            toValue: -distance,
            duration: AnimationPresets.timing.normal,
            easing: AnimationPresets.easing.easeInOut,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeOut(opacity, AnimationPresets.timing.normal),
        ]),
      swipeRight: (distance: number = screenWidth) => 
        AnimationUtils.parallel([
          Animated.timing(translateX, {
            toValue: distance,
            duration: AnimationPresets.timing.normal,
            easing: AnimationPresets.easing.easeInOut,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeOut(opacity, AnimationPresets.timing.normal),
        ]),
      reset: () => 
        AnimationUtils.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: AnimationPresets.timing.fast,
            easing: AnimationPresets.easing.easeOut,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeIn(opacity, AnimationPresets.timing.fast),
        ]),
      style: {
        transform: [{ translateX }],
        opacity,
      },
    };
  }

  // Pull to refresh animation
  static createPullToRefreshAnimation() {
    const pullDistance = new Animated.Value(0);
    const rotateAnim = new Animated.Value(0);
    
    return {
      pullDistance,
      rotateAnim,
      onPull: (distance: number) => {
        pullDistance.setValue(distance);
        rotateAnim.setValue(distance / 100 * 360);
      },
      onRefresh: () => 
        AnimationUtils.loop(
          Animated.timing(rotateAnim, {
            toValue: 360,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      onComplete: () => 
        AnimationUtils.parallel([
          Animated.timing(pullDistance, {
            toValue: 0,
            duration: AnimationPresets.timing.normal,
            easing: AnimationPresets.easing.easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: AnimationPresets.timing.fast,
            easing: AnimationPresets.easing.easeOut,
            useNativeDriver: true,
          }),
        ]),
      style: {
        transform: [
          { translateY: pullDistance },
          {
            rotate: rotateAnim.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            }),
          },
        ],
      },
    };
  }
}

// Micro-interaction animations
export class MicroInteractions {
  // Button press feedback
  static buttonPress(callback?: () => void) {
    const animation = GestureAnimations.createPressAnimation();
    
    return {
      ...animation,
      onPress: () => {
        animation.onPressIn();
        setTimeout(() => {
          animation.onPressOut();
          callback?.();
        }, 100);
      },
    };
  }

  // Loading pulse animation
  static loadingPulse() {
    const pulseAnim = new Animated.Value(1);
    
    const pulse = AnimationUtils.loop(
      AnimationUtils.sequence([
        AnimationUtils.scale(pulseAnim, 1.1, AnimationPresets.timing.slow),
        AnimationUtils.scale(pulseAnim, 1, AnimationPresets.timing.slow),
      ])
    );
    
    return {
      animatedValue: pulseAnim,
      start: () => pulse.start(),
      stop: () => pulse.stop(),
      style: { transform: [{ scale: pulseAnim }] },
    };
  }

  // Shake animation for errors
  static shake() {
    const shakeAnim = new Animated.Value(0);
    
    const shakeAnimation = AnimationUtils.sequence([
      AnimationUtils.spring(shakeAnim, 10),
      AnimationUtils.spring(shakeAnim, -10),
      AnimationUtils.spring(shakeAnim, 10),
      AnimationUtils.spring(shakeAnim, 0),
    ]);
    
    return {
      animatedValue: shakeAnim,
      shake: () => shakeAnimation.start(),
      style: { transform: [{ translateX: shakeAnim }] },
    };
  }

  // Success checkmark animation
  static successCheckmark() {
    const scaleAnim = new Animated.Value(0);
    const rotateAnim = new Animated.Value(0);
    
    const successAnimation = AnimationUtils.sequence([
      AnimationUtils.spring(scaleAnim, 1.2),
      AnimationUtils.parallel([
        AnimationUtils.spring(scaleAnim, 1),
        Animated.timing(rotateAnim, {
          toValue: 360,
          duration: AnimationPresets.timing.normal,
          easing: AnimationPresets.easing.easeInOut,
          useNativeDriver: true,
        }),
      ]),
    ]);
    
    return {
      scaleValue: scaleAnim,
      rotateValue: rotateAnim,
      animate: () => successAnimation.start(),
      style: {
        transform: [
          { scale: scaleAnim },
          {
            rotate: rotateAnim.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            }),
          },
        ],
      },
    };
  }
}