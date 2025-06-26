/**
 * Accessibility Enhancement System
 * 
 * Comprehensive accessibility system that provides enhanced support for
 * users with disabilities, including screen readers, motor impairments,
 * and visual impairments.
 */

import { Platform, AccessibilityInfo, Dimensions } from 'react-native';
import { uxManager } from './enhancedUX';

// Accessibility configuration
export interface AccessibilityConfig {
  screenReader: {
    enabled: boolean;
    announcements: boolean;
    detailedDescriptions: boolean;
  };
  motor: {
    largerTouchTargets: boolean;
    reducedMotion: boolean;
    stickyFocus: boolean;
    voiceControl: boolean;
  };
  visual: {
    highContrast: boolean;
    largeText: boolean;
    boldText: boolean;
    reduceTransparency: boolean;
    colorBlindnessSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  };
  cognitive: {
    simplifiedInterface: boolean;
    reducedAnimations: boolean;
    clearNavigation: boolean;
    consistentLayout: boolean;
  };
}

// Accessibility roles and traits
export enum AccessibilityRole {
  BUTTON = 'button',
  LINK = 'link',
  TEXT = 'text',
  IMAGE = 'image',
  HEADER = 'header',
  NAVIGATION = 'navigation',
  SEARCH = 'search',
  TAB = 'tab',
  TABLIST = 'tablist',
  LIST = 'list',
  LISTITEM = 'listitem',
  GRID = 'grid',
  CELL = 'cell',
  ALERT = 'alert',
  DIALOG = 'dialog',
  MENU = 'menu',
  MENUITEM = 'menuitem',
  PROGRESSBAR = 'progressbar',
  SLIDER = 'slider',
  SWITCH = 'switch',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
}

export enum AccessibilityTrait {
  DISABLED = 'disabled',
  SELECTED = 'selected',
  CHECKED = 'checked',
  BUSY = 'busy',
  EXPANDED = 'expanded',
  COLLAPSED = 'collapsed',
}

// Accessibility announcement types
export enum AnnouncementType {
  POLITE = 'polite',
  ASSERTIVE = 'assertive',
  OFF = 'off',
}

// Color contrast utilities
export interface ColorContrastResult {
  ratio: number;
  level: 'AAA' | 'AA' | 'A' | 'FAIL';
  passes: boolean;
}

export class AccessibilityEnhancer {
  private static instance: AccessibilityEnhancer;
  private config: AccessibilityConfig;
  private announcements: Array<{ message: string; timestamp: number }> = [];

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  public static getInstance(): AccessibilityEnhancer {
    if (!this.instance) {
      this.instance = new AccessibilityEnhancer();
    }
    return this.instance;
  }

  // Initialize accessibility system
  private async initialize(): Promise<void> {
    await this.detectAccessibilityFeatures();
    this.setupAccessibilityListeners();
    
    console.log('♿ Accessibility enhancer initialized', this.config);
  }

  // Detect system accessibility features
  private async detectAccessibilityFeatures(): Promise<void> {
    try {
      const [
        screenReaderEnabled,
        reduceMotionEnabled,
        boldTextEnabled,
        grayscaleEnabled,
        invertColorsEnabled,
        reduceTransparencyEnabled,
      ] = await Promise.all([
        AccessibilityInfo.isScreenReaderEnabled(),
        AccessibilityInfo.isReduceMotionEnabled(),
        Platform.OS === 'ios' ? AccessibilityInfo.isBoldTextEnabled() : Promise.resolve(false),
        Platform.OS === 'ios' ? AccessibilityInfo.isGrayscaleEnabled() : Promise.resolve(false),
        Platform.OS === 'ios' ? AccessibilityInfo.isInvertColorsEnabled() : Promise.resolve(false),
        Platform.OS === 'ios' ? AccessibilityInfo.isReduceTransparencyEnabled() : Promise.resolve(false),
      ]);

      this.config = {
        ...this.config,
        screenReader: {
          ...this.config.screenReader,
          enabled: screenReaderEnabled,
        },
        motor: {
          ...this.config.motor,
          reducedMotion: reduceMotionEnabled,
        },
        visual: {
          ...this.config.visual,
          boldText: boldTextEnabled,
          highContrast: grayscaleEnabled || invertColorsEnabled,
          reduceTransparency: reduceTransparencyEnabled,
        },
      };

      // Update UX manager with accessibility needs
      uxManager.trackInteraction('accessibility_detected', {
        screenReader: screenReaderEnabled,
        reduceMotion: reduceMotionEnabled,
        boldText: boldTextEnabled,
      });
    } catch (error) {
      console.warn('Failed to detect accessibility features:', error);
    }
  }

  // Setup accessibility event listeners
  private setupAccessibilityListeners(): void {
    // Screen reader state changes
    AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
      this.config.screenReader.enabled = enabled;
      this.announceToScreenReader(
        enabled ? 'Screen reader enabled' : 'Screen reader disabled',
        AnnouncementType.POLITE
      );
    });

    // Reduce motion changes
    AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      this.config.motor.reducedMotion = enabled;
      uxManager.adaptInteractionSpeed(enabled ? 'slow' : 'normal');
    });

    // Bold text changes (iOS only)
    if (Platform.OS === 'ios') {
      AccessibilityInfo.addEventListener('boldTextChanged', (enabled) => {
        this.config.visual.boldText = enabled;
      });
    }
  }

  // Get default accessibility configuration
  private getDefaultConfig(): AccessibilityConfig {
    return {
      screenReader: {
        enabled: false,
        announcements: true,
        detailedDescriptions: true,
      },
      motor: {
        largerTouchTargets: false,
        reducedMotion: false,
        stickyFocus: false,
        voiceControl: false,
      },
      visual: {
        highContrast: false,
        largeText: false,
        boldText: false,
        reduceTransparency: false,
        colorBlindnessSupport: 'none',
      },
      cognitive: {
        simplifiedInterface: false,
        reducedAnimations: false,
        clearNavigation: true,
        consistentLayout: true,
      },
    };
  }

  // Public API methods

  // Get current accessibility configuration
  public getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  // Update accessibility configuration
  public updateConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Apply configuration changes
    this.applyConfigChanges();
  }

  // Apply configuration changes to the system
  private applyConfigChanges(): void {
    // Update UX manager based on accessibility needs
    if (this.config.motor.reducedMotion || this.config.cognitive.reducedAnimations) {
      uxManager.adaptInteractionSpeed('slow');
    }

    if (this.config.cognitive.simplifiedInterface) {
      uxManager.adaptInterfaceDensity('spacious');
    }
  }

  // Screen reader announcements
  public announceToScreenReader(
    message: string,
    priority: AnnouncementType = AnnouncementType.POLITE
  ): void {
    if (!this.config.screenReader.enabled || !this.config.screenReader.announcements) {
      return;
    }

    try {
      AccessibilityInfo.announceForAccessibility(message);
      
      // Track announcement
      this.announcements.push({
        message,
        timestamp: Date.now(),
      });

      // Keep only recent announcements
      if (this.announcements.length > 50) {
        this.announcements = this.announcements.slice(-50);
      }
    } catch (error) {
      console.warn('Failed to announce to screen reader:', error);
    }
  }

  // Generate accessibility props for components
  public generateAccessibilityProps(config: {
    role?: AccessibilityRole;
    label?: string;
    hint?: string;
    value?: string;
    traits?: AccessibilityTrait[];
    actions?: Array<{ name: string; label: string }>;
  }): Record<string, any> {
    const props: Record<string, any> = {};

    // Basic accessibility props
    if (config.role) {
      props.accessibilityRole = config.role;
    }

    if (config.label) {
      props.accessibilityLabel = config.label;
    }

    if (config.hint && this.config.screenReader.detailedDescriptions) {
      props.accessibilityHint = config.hint;
    }

    if (config.value) {
      props.accessibilityValue = { text: config.value };
    }

    // Accessibility traits
    if (config.traits && config.traits.length > 0) {
      props.accessibilityState = {};
      
      config.traits.forEach(trait => {
        switch (trait) {
          case AccessibilityTrait.DISABLED:
            props.accessibilityState.disabled = true;
            break;
          case AccessibilityTrait.SELECTED:
            props.accessibilityState.selected = true;
            break;
          case AccessibilityTrait.CHECKED:
            props.accessibilityState.checked = true;
            break;
          case AccessibilityTrait.BUSY:
            props.accessibilityState.busy = true;
            break;
          case AccessibilityTrait.EXPANDED:
            props.accessibilityState.expanded = true;
            break;
          case AccessibilityTrait.COLLAPSED:
            props.accessibilityState.expanded = false;
            break;
        }
      });
    }

    // Custom actions
    if (config.actions && config.actions.length > 0) {
      props.accessibilityActions = config.actions.map(action => ({
        name: action.name,
        label: action.label,
      }));
    }

    return props;
  }

  // Calculate color contrast ratio
  public calculateColorContrast(
    foreground: string,
    background: string
  ): ColorContrastResult {
    const getLuminance = (color: string): number => {
      // Convert hex to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      // Calculate relative luminance
      const sRGB = [r, g, b].map(c => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    let level: ColorContrastResult['level'] = 'FAIL';
    let passes = false;

    if (ratio >= 7) {
      level = 'AAA';
      passes = true;
    } else if (ratio >= 4.5) {
      level = 'AA';
      passes = true;
    } else if (ratio >= 3) {
      level = 'A';
      passes = false; // A level doesn't meet WCAG standards
    }

    return { ratio, level, passes };
  }

  // Get accessible color palette
  public getAccessibleColors(): Record<string, string> {
    const baseColors = {
      primary: '#007AFF',
      secondary: '#5856D6',
      success: '#34C759',
      warning: '#FF9500',
      danger: '#FF3B30',
      info: '#5AC8FA',
      light: '#F2F2F7',
      dark: '#1C1C1E',
    };

    if (this.config.visual.highContrast) {
      return {
        primary: '#0051D5',
        secondary: '#4A4A9F',
        success: '#248A3D',
        warning: '#D1770F',
        danger: '#D70015',
        info: '#0071A4',
        light: '#FFFFFF',
        dark: '#000000',
      };
    }

    if (this.config.visual.colorBlindnessSupport !== 'none') {
      // Adjust colors for color blindness
      switch (this.config.visual.colorBlindnessSupport) {
        case 'protanopia':
          return {
            ...baseColors,
            danger: '#FF6B00', // Orange instead of red
            success: '#0080FF', // Blue instead of green
          };
        case 'deuteranopia':
          return {
            ...baseColors,
            danger: '#FF6B00',
            success: '#0080FF',
          };
        case 'tritanopia':
          return {
            ...baseColors,
            info: '#FF6B00', // Orange instead of blue
            primary: '#FF6B00',
          };
      }
    }

    return baseColors;
  }

  // Get accessible font sizes
  public getAccessibleFontSizes(): Record<string, number> {
    const baseSizes = {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    };

    let multiplier = 1;

    if (this.config.visual.largeText) {
      multiplier = 1.3;
    }

    if (this.config.visual.boldText) {
      multiplier *= 1.1;
    }

    return Object.entries(baseSizes).reduce((acc, [key, size]) => {
      acc[key] = Math.round(size * multiplier);
      return acc;
    }, {} as Record<string, number>);
  }

  // Get accessible spacing
  public getAccessibleSpacing(): Record<string, number> {
    const baseSpacing = {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    };

    let multiplier = 1;

    if (this.config.motor.largerTouchTargets) {
      multiplier = 1.5;
    }

    if (this.config.cognitive.simplifiedInterface) {
      multiplier *= 1.2;
    }

    return Object.entries(baseSpacing).reduce((acc, [key, spacing]) => {
      acc[key] = Math.round(spacing * multiplier);
      return acc;
    }, {} as Record<string, number>);
  }

  // Get minimum touch target size
  public getMinimumTouchTargetSize(): { width: number; height: number } {
    const baseSize = { width: 44, height: 44 }; // iOS HIG minimum

    if (this.config.motor.largerTouchTargets) {
      return { width: 60, height: 60 };
    }

    return baseSize;
  }

  // Check if element meets accessibility guidelines
  public validateAccessibility(element: {
    role?: string;
    label?: string;
    size?: { width: number; height: number };
    colors?: { foreground: string; background: string };
  }): {
    passes: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check touch target size
    if (element.size) {
      const minSize = this.getMinimumTouchTargetSize();
      if (element.size.width < minSize.width || element.size.height < minSize.height) {
        issues.push(`Touch target too small: ${element.size.width}x${element.size.height}`);
        suggestions.push(`Increase size to at least ${minSize.width}x${minSize.height}`);
      }
    }

    // Check color contrast
    if (element.colors) {
      const contrast = this.calculateColorContrast(
        element.colors.foreground,
        element.colors.background
      );
      if (!contrast.passes) {
        issues.push(`Poor color contrast: ${contrast.ratio.toFixed(2)}:1`);
        suggestions.push('Increase color contrast to at least 4.5:1 for AA compliance');
      }
    }

    // Check accessibility label
    if (element.role === 'button' || element.role === 'link') {
      if (!element.label || element.label.trim().length === 0) {
        issues.push('Missing accessibility label for interactive element');
        suggestions.push('Add descriptive accessibility label');
      }
    }

    return {
      passes: issues.length === 0,
      issues,
      suggestions,
    };
  }

  // Get accessibility report
  public getAccessibilityReport(): {
    config: AccessibilityConfig;
    recentAnnouncements: Array<{ message: string; timestamp: number }>;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    if (!this.config.screenReader.enabled && this.config.screenReader.announcements) {
      recommendations.push('Consider enabling screen reader support for better accessibility');
    }

    if (!this.config.motor.largerTouchTargets) {
      recommendations.push('Enable larger touch targets for users with motor impairments');
    }

    if (!this.config.visual.highContrast) {
      recommendations.push('Consider high contrast mode for users with visual impairments');
    }

    return {
      config: this.config,
      recentAnnouncements: this.announcements.slice(-10),
      recommendations,
    };
  }
}

// Export singleton instance
export const accessibilityEnhancer = AccessibilityEnhancer.getInstance();

// React hooks for accessibility
export function useAccessibility() {
  const [config, setConfig] = React.useState(accessibilityEnhancer.getConfig());

  React.useEffect(() => {
    // Update config when accessibility settings change
    const interval = setInterval(() => {
      setConfig(accessibilityEnhancer.getConfig());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const announceToScreenReader = React.useCallback(
    (message: string, priority?: AnnouncementType) => {
      accessibilityEnhancer.announceToScreenReader(message, priority);
    },
    []
  );

  const generateProps = React.useCallback(
    (propsConfig: Parameters<typeof accessibilityEnhancer.generateAccessibilityProps>[0]) => {
      return accessibilityEnhancer.generateAccessibilityProps(propsConfig);
    },
    []
  );

  return {
    config,
    announceToScreenReader,
    generateProps,
    accessibleColors: accessibilityEnhancer.getAccessibleColors(),
    accessibleFontSizes: accessibilityEnhancer.getAccessibleFontSizes(),
    accessibleSpacing: accessibilityEnhancer.getAccessibleSpacing(),
    minimumTouchTargetSize: accessibilityEnhancer.getMinimumTouchTargetSize(),
  };
}

export function useAccessibilityProps(config: {
  role?: AccessibilityRole;
  label?: string;
  hint?: string;
  value?: string;
  traits?: AccessibilityTrait[];
  actions?: Array<{ name: string; label: string }>;
}) {
  return React.useMemo(() => {
    return accessibilityEnhancer.generateAccessibilityProps(config);
  }, [config]);
}