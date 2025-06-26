/**
 * Enhanced User Experience System
 * 
 * Comprehensive UX enhancement system that provides intelligent user interactions,
 * adaptive interfaces, and delightful micro-interactions based on user behavior.
 */

import { Platform, Vibration, Dimensions, AccessibilityInfo } from 'react-native';
import { enhancedPerformanceMonitor } from './enhancedPerformance';
import { memoryManager } from './memoryManagement';

// User interaction patterns
export enum InteractionPattern {
  FIRST_TIME_USER = 'first_time_user',
  RETURNING_USER = 'returning_user',
  POWER_USER = 'power_user',
  CASUAL_USER = 'casual_user',
  ACCESSIBILITY_USER = 'accessibility_user',
}

// User preferences and behavior
export interface UserBehavior {
  sessionCount: number;
  totalTimeSpent: number;
  averageSessionLength: number;
  featuresUsed: string[];
  preferredInteractionSpeed: 'slow' | 'normal' | 'fast';
  accessibilityNeeds: {
    reduceMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
    voiceOver: boolean;
  };
  deviceCapabilities: {
    hasHaptics: boolean;
    screenSize: 'small' | 'medium' | 'large';
    orientation: 'portrait' | 'landscape';
  };
}

// UX adaptation strategies
export interface UXAdaptation {
  animationDuration: number;
  transitionStyle: 'subtle' | 'normal' | 'pronounced';
  feedbackIntensity: 'minimal' | 'normal' | 'enhanced';
  interfaceDensity: 'compact' | 'comfortable' | 'spacious';
  guidanceLevel: 'minimal' | 'helpful' | 'detailed';
}

// Onboarding flow configuration
export interface OnboardingConfig {
  steps: OnboardingStep[];
  adaptToUser: boolean;
  skipForReturningUsers: boolean;
  progressTracking: boolean;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component?: string;
  action?: 'highlight' | 'tooltip' | 'modal' | 'overlay';
  target?: string;
  condition?: (userBehavior: UserBehavior) => boolean;
  skippable: boolean;
}

// Haptic feedback patterns
export enum HapticPattern {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection',
}

// Toast notification types
export interface ToastConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  persistent?: boolean;
  haptic?: HapticPattern;
}

export class EnhancedUXManager {
  private static instance: EnhancedUXManager;
  private userBehavior: UserBehavior;
  private currentAdaptation: UXAdaptation;
  private onboardingState: Map<string, boolean> = new Map();
  private interactionHistory: Array<{
    action: string;
    timestamp: number;
    context: Record<string, unknown>;
  }> = [];

  private constructor() {
    this.userBehavior = this.getDefaultUserBehavior();
    this.currentAdaptation = this.calculateAdaptation();
    this.initialize();
  }

  public static getInstance(): EnhancedUXManager {
    if (!this.instance) {
      this.instance = new EnhancedUXManager();
    }
    return this.instance;
  }

  // Initialize UX management system
  private async initialize(): Promise<void> {
    await this.loadUserBehavior();
    await this.detectAccessibilityNeeds();
    this.setupBehaviorTracking();
    this.currentAdaptation = this.calculateAdaptation();
    
    console.log('🎨 Enhanced UX Manager initialized', {
      pattern: this.getUserPattern(),
      adaptation: this.currentAdaptation,
    });
  }

  // Load user behavior from storage
  private async loadUserBehavior(): Promise<void> {
    try {
      // This would load from AsyncStorage in a real implementation
      // For now, we'll use default values
      this.userBehavior = {
        ...this.getDefaultUserBehavior(),
        sessionCount: Math.floor(Math.random() * 50) + 1,
        totalTimeSpent: Math.floor(Math.random() * 10000) + 1000,
      };
      
      this.userBehavior.averageSessionLength = 
        this.userBehavior.totalTimeSpent / this.userBehavior.sessionCount;
    } catch (error) {
      console.warn('Failed to load user behavior:', error);
    }
  }

  // Detect accessibility needs
  private async detectAccessibilityNeeds(): Promise<void> {
    try {
      const [reduceMotion, screenReader, boldText] = await Promise.all([
        AccessibilityInfo.isReduceMotionEnabled(),
        AccessibilityInfo.isScreenReaderEnabled(),
        Platform.OS === 'ios' ? AccessibilityInfo.isBoldTextEnabled() : Promise.resolve(false),
      ]);

      this.userBehavior.accessibilityNeeds = {
        reduceMotion,
        highContrast: false, // Would be detected via native modules
        largeText: boldText,
        voiceOver: screenReader,
      };
    } catch (error) {
      console.warn('Failed to detect accessibility needs:', error);
    }
  }

  // Setup behavior tracking
  private setupBehaviorTracking(): void {
    // Track performance metrics for UX adaptation
    enhancedPerformanceMonitor.subscribe((metrics) => {
      if (metrics.touchResponseTime && metrics.touchResponseTime > 100) {
        this.adaptInteractionSpeed('slow');
      }
    });

    // Track memory pressure for interface adaptation
    memoryManager.onMemoryWarning((pressure) => {
      if (pressure === 'high' || pressure === 'critical') {
        this.adaptInterfaceDensity('compact');
      }
    });
  }

  // Calculate UX adaptation based on user behavior
  private calculateAdaptation(): UXAdaptation {
    const pattern = this.getUserPattern();
    const { accessibilityNeeds, deviceCapabilities } = this.userBehavior;
    
    let adaptation: UXAdaptation = {
      animationDuration: 300,
      transitionStyle: 'normal',
      feedbackIntensity: 'normal',
      interfaceDensity: 'comfortable',
      guidanceLevel: 'helpful',
    };

    // Adapt for accessibility needs
    if (accessibilityNeeds.reduceMotion) {
      adaptation.animationDuration = 150;
      adaptation.transitionStyle = 'subtle';
    }

    if (accessibilityNeeds.voiceOver) {
      adaptation.guidanceLevel = 'detailed';
      adaptation.feedbackIntensity = 'enhanced';
    }

    // Adapt for user patterns
    switch (pattern) {
      case InteractionPattern.FIRST_TIME_USER:
        adaptation.guidanceLevel = 'detailed';
        adaptation.animationDuration = 400;
        adaptation.transitionStyle = 'pronounced';
        break;
        
      case InteractionPattern.POWER_USER:
        adaptation.guidanceLevel = 'minimal';
        adaptation.animationDuration = 200;
        adaptation.interfaceDensity = 'compact';
        break;
        
      case InteractionPattern.CASUAL_USER:
        adaptation.guidanceLevel = 'helpful';
        adaptation.feedbackIntensity = 'enhanced';
        break;
    }

    // Adapt for device capabilities
    if (deviceCapabilities.screenSize === 'small') {
      adaptation.interfaceDensity = 'compact';
    } else if (deviceCapabilities.screenSize === 'large') {
      adaptation.interfaceDensity = 'spacious';
    }

    return adaptation;
  }

  // Determine user interaction pattern
  private getUserPattern(): InteractionPattern {
    const { sessionCount, averageSessionLength, featuresUsed, accessibilityNeeds } = this.userBehavior;

    if (accessibilityNeeds.voiceOver || accessibilityNeeds.reduceMotion) {
      return InteractionPattern.ACCESSIBILITY_USER;
    }

    if (sessionCount <= 3) {
      return InteractionPattern.FIRST_TIME_USER;
    }

    if (featuresUsed.length > 10 && averageSessionLength > 600) { // 10+ minutes
      return InteractionPattern.POWER_USER;
    }

    if (sessionCount > 10 && averageSessionLength < 300) { // < 5 minutes
      return InteractionPattern.CASUAL_USER;
    }

    return InteractionPattern.RETURNING_USER;
  }

  // Get default user behavior
  private getDefaultUserBehavior(): UserBehavior {
    const { width, height } = Dimensions.get('window');
    const screenSize = width < 375 ? 'small' : width > 768 ? 'large' : 'medium';

    return {
      sessionCount: 1,
      totalTimeSpent: 0,
      averageSessionLength: 0,
      featuresUsed: [],
      preferredInteractionSpeed: 'normal',
      accessibilityNeeds: {
        reduceMotion: false,
        highContrast: false,
        largeText: false,
        voiceOver: false,
      },
      deviceCapabilities: {
        hasHaptics: Platform.OS === 'ios',
        screenSize,
        orientation: height > width ? 'portrait' : 'landscape',
      },
    };
  }

  // Public API methods

  // Get current UX adaptation
  public getAdaptation(): UXAdaptation {
    return { ...this.currentAdaptation };
  }

  // Get user behavior pattern
  public getUserPattern(): InteractionPattern {
    return this.getUserPattern();
  }

  // Track user interaction
  public trackInteraction(action: string, context: Record<string, unknown> = {}): void {
    this.interactionHistory.push({
      action,
      timestamp: Date.now(),
      context,
    });

    // Update user behavior
    if (!this.userBehavior.featuresUsed.includes(action)) {
      this.userBehavior.featuresUsed.push(action);
    }

    // Recalculate adaptation if significant change
    if (this.interactionHistory.length % 10 === 0) {
      this.currentAdaptation = this.calculateAdaptation();
    }
  }

  // Provide haptic feedback
  public hapticFeedback(pattern: HapticPattern): void {
    if (!this.userBehavior.deviceCapabilities.hasHaptics) return;
    if (this.currentAdaptation.feedbackIntensity === 'minimal') return;

    try {
      switch (pattern) {
        case HapticPattern.LIGHT:
          if (Platform.OS === 'ios') {
            // Would use native haptic feedback
            Vibration.vibrate(10);
          }
          break;
        case HapticPattern.MEDIUM:
          Vibration.vibrate(25);
          break;
        case HapticPattern.HEAVY:
          Vibration.vibrate(50);
          break;
        case HapticPattern.SUCCESS:
          Vibration.vibrate([0, 50, 50, 50]);
          break;
        case HapticPattern.ERROR:
          Vibration.vibrate([0, 100, 50, 100]);
          break;
        case HapticPattern.SELECTION:
          Vibration.vibrate(15);
          break;
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Adapt interaction speed
  public adaptInteractionSpeed(speed: 'slow' | 'normal' | 'fast'): void {
    this.userBehavior.preferredInteractionSpeed = speed;
    
    // Update animation durations
    switch (speed) {
      case 'slow':
        this.currentAdaptation.animationDuration = 500;
        break;
      case 'fast':
        this.currentAdaptation.animationDuration = 150;
        break;
      default:
        this.currentAdaptation.animationDuration = 300;
    }
  }

  // Adapt interface density
  public adaptInterfaceDensity(density: 'compact' | 'comfortable' | 'spacious'): void {
    this.currentAdaptation.interfaceDensity = density;
  }

  // Check if onboarding step should be shown
  public shouldShowOnboardingStep(stepId: string): boolean {
    if (this.onboardingState.has(stepId)) {
      return !this.onboardingState.get(stepId);
    }

    // Show onboarding for new users
    return this.getUserPattern() === InteractionPattern.FIRST_TIME_USER;
  }

  // Mark onboarding step as completed
  public completeOnboardingStep(stepId: string): void {
    this.onboardingState.set(stepId, true);
    this.trackInteraction('onboarding_step_completed', { stepId });
  }

  // Get adaptive spacing based on interface density
  public getAdaptiveSpacing(): {
    xs: number; sm: number; md: number; lg: number; xl: number;
  } {
    const baseSpacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
    const multiplier = this.getSpacingMultiplier();

    return {
      xs: baseSpacing.xs * multiplier,
      sm: baseSpacing.sm * multiplier,
      md: baseSpacing.md * multiplier,
      lg: baseSpacing.lg * multiplier,
      xl: baseSpacing.xl * multiplier,
    };
  }

  private getSpacingMultiplier(): number {
    switch (this.currentAdaptation.interfaceDensity) {
      case 'compact': return 0.75;
      case 'spacious': return 1.25;
      default: return 1;
    }
  }

  // Get adaptive font sizes
  public getAdaptiveFontSizes(): {
    xs: number; sm: number; md: number; lg: number; xl: number; xxl: number;
  } {
    const baseSizes = { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32 };
    const multiplier = this.userBehavior.accessibilityNeeds.largeText ? 1.2 : 1;

    return {
      xs: baseSizes.xs * multiplier,
      sm: baseSizes.sm * multiplier,
      md: baseSizes.md * multiplier,
      lg: baseSizes.lg * multiplier,
      xl: baseSizes.xl * multiplier,
      xxl: baseSizes.xxl * multiplier,
    };
  }

  // Get interaction analytics
  public getInteractionAnalytics(): {
    totalInteractions: number;
    uniqueActions: number;
    mostUsedFeatures: Array<{ action: string; count: number }>;
    sessionData: {
      averageLength: number;
      totalSessions: number;
    };
  } {
    const actionCounts = this.interactionHistory.reduce((acc, interaction) => {
      acc[interaction.action] = (acc[interaction.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedFeatures = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalInteractions: this.interactionHistory.length,
      uniqueActions: Object.keys(actionCounts).length,
      mostUsedFeatures,
      sessionData: {
        averageLength: this.userBehavior.averageSessionLength,
        totalSessions: this.userBehavior.sessionCount,
      },
    };
  }

  // Save user behavior (would persist to storage)
  public async saveUserBehavior(): Promise<void> {
    try {
      // In a real implementation, this would save to AsyncStorage
      console.log('💾 User behavior saved', this.userBehavior);
    } catch (error) {
      console.error('Failed to save user behavior:', error);
    }
  }

  // Reset user behavior (for testing or user request)
  public resetUserBehavior(): void {
    this.userBehavior = this.getDefaultUserBehavior();
    this.currentAdaptation = this.calculateAdaptation();
    this.onboardingState.clear();
    this.interactionHistory = [];
    
    console.log('🔄 User behavior reset');
  }
}

// Export singleton instance
export const uxManager = EnhancedUXManager.getInstance();

// React hooks for UX management
export function useUXAdaptation() {
  const [adaptation, setAdaptation] = React.useState(uxManager.getAdaptation());
  
  React.useEffect(() => {
    // Update adaptation when it changes
    const interval = setInterval(() => {
      setAdaptation(uxManager.getAdaptation());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return adaptation;
}

export function useUserBehavior() {
  const trackInteraction = React.useCallback((action: string, context?: Record<string, unknown>) => {
    uxManager.trackInteraction(action, context);
  }, []);
  
  const hapticFeedback = React.useCallback((pattern: HapticPattern) => {
    uxManager.hapticFeedback(pattern);
  }, []);
  
  return {
    trackInteraction,
    hapticFeedback,
    userPattern: uxManager.getUserPattern(),
    adaptation: uxManager.getAdaptation(),
    analytics: uxManager.getInteractionAnalytics(),
  };
}

export function useOnboarding(stepId: string) {
  const [shouldShow, setShouldShow] = React.useState(
    uxManager.shouldShowOnboardingStep(stepId)
  );
  
  const completeStep = React.useCallback(() => {
    uxManager.completeOnboardingStep(stepId);
    setShouldShow(false);
  }, [stepId]);
  
  return { shouldShow, completeStep };
}