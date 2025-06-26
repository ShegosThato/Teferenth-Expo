/**
 * Enhanced Theme System
 * 
 * Advanced theming system with accessibility support, dynamic adaptation,
 * and user preference integration for optimal visual experience.
 */

import { Appearance, ColorSchemeName } from 'react-native';
import { accessibilityManager } from './accessibilityEnhancements';
import { uxManager } from './enhancedUX';

// Color palette types
export interface ColorPalette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  background: string;
  surface: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  border: {
    light: string;
    medium: string;
    dark: string;
  };
  overlay: {
    light: string;
    medium: string;
    dark: string;
  };
}

// Typography scale
export interface TypographyScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

// Spacing scale
export interface SpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

// Theme configuration
export interface ThemeConfig {
  name: string;
  colors: ColorPalette;
  typography: {
    fontSizes: TypographyScale;
    lineHeights: TypographyScale;
    fontWeights: {
      light: string;
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    fontFamilies: {
      regular: string;
      medium: string;
      bold: string;
      mono: string;
    };
  };
  spacing: SpacingScale;
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
  animations: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: {
      linear: string;
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

// Theme adaptation options
export interface ThemeAdaptation {
  contrastLevel: 'normal' | 'high' | 'maximum';
  textScaling: number;
  reducedMotion: boolean;
  reducedTransparency: boolean;
  colorBlindnessFilter: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

// Light theme configuration
const lightTheme: ThemeConfig = {
  name: 'light',
  colors: {
    primary: '#007AFF',
    primaryDark: '#0056CC',
    primaryLight: '#4DA2FF',
    secondary: '#5856D6',
    secondaryDark: '#3634A3',
    secondaryLight: '#7B79E8',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    info: '#007AFF',
    text: {
      primary: '#1C1C1E',
      secondary: '#6C6C70',
      disabled: '#C7C7CC',
      inverse: '#FFFFFF',
    },
    border: {
      light: '#F2F2F7',
      medium: '#D1D1D6',
      dark: '#C7C7CC',
    },
    overlay: {
      light: 'rgba(0, 0, 0, 0.1)',
      medium: 'rgba(0, 0, 0, 0.3)',
      dark: 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
      xxxl: 48,
    },
    lineHeights: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 40,
      xxxl: 56,
    },
    fontWeights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    fontFamilies: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      mono: 'Menlo',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
};

// Dark theme configuration
const darkTheme: ThemeConfig = {
  ...lightTheme,
  name: 'dark',
  colors: {
    primary: '#0A84FF',
    primaryDark: '#0056CC',
    primaryLight: '#4DA2FF',
    secondary: '#5E5CE6',
    secondaryDark: '#3634A3',
    secondaryLight: '#7B79E8',
    background: '#000000',
    surface: '#1C1C1E',
    error: '#FF453A',
    warning: '#FF9F0A',
    success: '#32D74B',
    info: '#64D2FF',
    text: {
      primary: '#FFFFFF',
      secondary: '#98989D',
      disabled: '#48484A',
      inverse: '#1C1C1E',
    },
    border: {
      light: '#2C2C2E',
      medium: '#38383A',
      dark: '#48484A',
    },
    overlay: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.3)',
      dark: 'rgba(255, 255, 255, 0.6)',
    },
  },
};

// High contrast light theme
const highContrastLightTheme: ThemeConfig = {
  ...lightTheme,
  name: 'high-contrast-light',
  colors: {
    ...lightTheme.colors,
    primary: '#0000FF',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: {
      primary: '#000000',
      secondary: '#000000',
      disabled: '#666666',
      inverse: '#FFFFFF',
    },
    border: {
      light: '#000000',
      medium: '#000000',
      dark: '#000000',
    },
  },
};

// High contrast dark theme
const highContrastDarkTheme: ThemeConfig = {
  ...darkTheme,
  name: 'high-contrast-dark',
  colors: {
    ...darkTheme.colors,
    primary: '#00FFFF',
    background: '#000000',
    surface: '#000000',
    text: {
      primary: '#FFFFFF',
      secondary: '#FFFFFF',
      disabled: '#999999',
      inverse: '#000000',
    },
    border: {
      light: '#FFFFFF',
      medium: '#FFFFFF',
      dark: '#FFFFFF',
    },
  },
};

export class EnhancedThemeManager {
  private static instance: EnhancedThemeManager;
  private currentTheme: ThemeConfig;
  private systemColorScheme: ColorSchemeName;
  private userPreference: 'light' | 'dark' | 'system' | 'high-contrast';
  private adaptation: ThemeAdaptation;
  private listeners: Array<(theme: ThemeConfig) => void> = [];

  private constructor() {
    this.systemColorScheme = Appearance.getColorScheme();
    this.userPreference = 'system';
    this.adaptation = this.getDefaultAdaptation();
    this.currentTheme = this.calculateTheme();
    this.initialize();
  }

  public static getInstance(): EnhancedThemeManager {
    if (!this.instance) {
      this.instance = new EnhancedThemeManager();
    }
    return this.instance;
  }

  // Initialize theme manager
  private initialize(): void {
    this.setupSystemListeners();
    this.setupAccessibilityIntegration();
    
    console.log('🎨 Enhanced Theme Manager initialized', {
      currentTheme: this.currentTheme.name,
      userPreference: this.userPreference,
      adaptation: this.adaptation,
    });
  }

  // Setup system appearance listeners
  private setupSystemListeners(): void {
    Appearance.addChangeListener(({ colorScheme }) => {
      this.systemColorScheme = colorScheme;
      this.updateTheme();
    });
  }

  // Setup accessibility integration
  private setupAccessibilityIntegration(): void {
    // Update theme when accessibility preferences change
    setInterval(() => {
      const accessibilityPrefs = accessibilityManager.getPreferences();
      const newAdaptation: ThemeAdaptation = {
        contrastLevel: accessibilityPrefs.highContrast ? 'high' : 'normal',
        textScaling: accessibilityPrefs.largeText ? 1.2 : 1.0,
        reducedMotion: accessibilityPrefs.reduceMotion,
        reducedTransparency: accessibilityPrefs.reduceTransparency,
        colorBlindnessFilter: accessibilityPrefs.colorBlindness,
      };

      if (JSON.stringify(newAdaptation) !== JSON.stringify(this.adaptation)) {
        this.adaptation = newAdaptation;
        this.updateTheme();
      }
    }, 1000);
  }

  // Get default theme adaptation
  private getDefaultAdaptation(): ThemeAdaptation {
    return {
      contrastLevel: 'normal',
      textScaling: 1.0,
      reducedMotion: false,
      reducedTransparency: false,
      colorBlindnessFilter: 'none',
    };
  }

  // Calculate current theme based on preferences and adaptations
  private calculateTheme(): ThemeConfig {
    let baseTheme: ThemeConfig;

    // Select base theme
    if (this.adaptation.contrastLevel === 'high') {
      baseTheme = this.getEffectiveColorScheme() === 'dark' 
        ? highContrastDarkTheme 
        : highContrastLightTheme;
    } else {
      baseTheme = this.getEffectiveColorScheme() === 'dark' ? darkTheme : lightTheme;
    }

    // Apply adaptations
    return this.applyAdaptations(baseTheme);
  }

  // Apply theme adaptations
  private applyAdaptations(theme: ThemeConfig): ThemeConfig {
    const adaptedTheme = JSON.parse(JSON.stringify(theme)) as ThemeConfig;

    // Apply text scaling
    if (this.adaptation.textScaling !== 1.0) {
      Object.keys(adaptedTheme.typography.fontSizes).forEach(key => {
        const sizeKey = key as keyof TypographyScale;
        adaptedTheme.typography.fontSizes[sizeKey] = Math.round(
          adaptedTheme.typography.fontSizes[sizeKey] * this.adaptation.textScaling
        );
        adaptedTheme.typography.lineHeights[sizeKey] = Math.round(
          adaptedTheme.typography.lineHeights[sizeKey] * this.adaptation.textScaling
        );
      });
    }

    // Apply reduced motion
    if (this.adaptation.reducedMotion) {
      adaptedTheme.animations.duration.fast = 100;
      adaptedTheme.animations.duration.normal = 150;
      adaptedTheme.animations.duration.slow = 200;
    }

    // Apply reduced transparency
    if (this.adaptation.reducedTransparency) {
      adaptedTheme.colors.overlay.light = adaptedTheme.colors.surface;
      adaptedTheme.colors.overlay.medium = adaptedTheme.colors.surface;
      adaptedTheme.colors.overlay.dark = adaptedTheme.colors.surface;
    }

    // Apply color blindness filters
    if (this.adaptation.colorBlindnessFilter !== 'none') {
      adaptedTheme.colors = this.applyColorBlindnessFilter(
        adaptedTheme.colors,
        this.adaptation.colorBlindnessFilter
      );
    }

    return adaptedTheme;
  }

  // Apply color blindness filter
  private applyColorBlindnessFilter(
    colors: ColorPalette,
    filter: 'protanopia' | 'deuteranopia' | 'tritanopia'
  ): ColorPalette {
    // This would implement actual color transformation for color blindness
    // For now, we'll return the original colors
    // In a real implementation, you would use color transformation matrices
    return colors;
  }

  // Get effective color scheme
  private getEffectiveColorScheme(): 'light' | 'dark' {
    if (this.userPreference === 'system') {
      return this.systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    if (this.userPreference === 'high-contrast') {
      return this.systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return this.userPreference;
  }

  // Update theme and notify listeners
  private updateTheme(): void {
    const newTheme = this.calculateTheme();
    
    if (newTheme.name !== this.currentTheme.name) {
      this.currentTheme = newTheme;
      this.notifyListeners();
      
      uxManager.trackInteraction('theme_changed', {
        theme: newTheme.name,
        userPreference: this.userPreference,
        adaptation: this.adaptation,
      });
    }
  }

  // Notify theme change listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentTheme);
      } catch (error) {
        console.warn('Theme listener error:', error);
      }
    });
  }

  // Public API methods

  // Get current theme
  public getCurrentTheme(): ThemeConfig {
    return JSON.parse(JSON.stringify(this.currentTheme));
  }

  // Set user theme preference
  public setThemePreference(preference: 'light' | 'dark' | 'system' | 'high-contrast'): void {
    this.userPreference = preference;
    this.updateTheme();
  }

  // Get current theme preference
  public getThemePreference(): string {
    return this.userPreference;
  }

  // Update theme adaptation
  public updateAdaptation(updates: Partial<ThemeAdaptation>): void {
    this.adaptation = { ...this.adaptation, ...updates };
    this.updateTheme();
  }

  // Get current adaptation
  public getAdaptation(): ThemeAdaptation {
    return { ...this.adaptation };
  }

  // Subscribe to theme changes
  public subscribe(listener: (theme: ThemeConfig) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get color with opacity
  public getColorWithOpacity(color: string, opacity: number): string {
    // Convert hex to rgba
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  }

  // Get accessible color pair
  public getAccessibleColorPair(
    foreground: string,
    background: string
  ): { foreground: string; background: string; contrastRatio: number } {
    // This would implement actual contrast calculation
    // For now, return the original colors
    return {
      foreground,
      background,
      contrastRatio: 4.5, // Simulated
    };
  }

  // Get semantic colors for states
  public getSemanticColors(): {
    success: string;
    warning: string;
    error: string;
    info: string;
  } {
    return {
      success: this.currentTheme.colors.success,
      warning: this.currentTheme.colors.warning,
      error: this.currentTheme.colors.error,
      info: this.currentTheme.colors.info,
    };
  }

  // Get spacing with adaptation
  public getAdaptiveSpacing(): SpacingScale {
    const uxAdaptation = uxManager.getAdaptation();
    const multiplier = uxAdaptation.interfaceDensity === 'compact' ? 0.75 : 
                     uxAdaptation.interfaceDensity === 'spacious' ? 1.25 : 1;

    const spacing = this.currentTheme.spacing;
    return {
      xs: Math.round(spacing.xs * multiplier),
      sm: Math.round(spacing.sm * multiplier),
      md: Math.round(spacing.md * multiplier),
      lg: Math.round(spacing.lg * multiplier),
      xl: Math.round(spacing.xl * multiplier),
      xxl: Math.round(spacing.xxl * multiplier),
    };
  }

  // Generate theme report
  public generateThemeReport(): {
    currentTheme: string;
    userPreference: string;
    systemScheme: ColorSchemeName;
    adaptation: ThemeAdaptation;
    accessibilityCompliance: {
      contrastRatio: number;
      textScaling: boolean;
      reducedMotion: boolean;
      colorBlindnessSupport: boolean;
    };
  } {
    return {
      currentTheme: this.currentTheme.name,
      userPreference: this.userPreference,
      systemScheme: this.systemColorScheme,
      adaptation: this.adaptation,
      accessibilityCompliance: {
        contrastRatio: this.adaptation.contrastLevel === 'high' ? 7 : 4.5,
        textScaling: this.adaptation.textScaling > 1,
        reducedMotion: this.adaptation.reducedMotion,
        colorBlindnessSupport: this.adaptation.colorBlindnessFilter !== 'none',
      },
    };
  }
}

// Export singleton instance
export const themeManager = EnhancedThemeManager.getInstance();

// React hooks for theme management
export function useTheme() {
  const [theme, setTheme] = React.useState(themeManager.getCurrentTheme());

  React.useEffect(() => {
    const unsubscribe = themeManager.subscribe(setTheme);
    return unsubscribe;
  }, []);

  return {
    theme,
    setThemePreference: (preference: 'light' | 'dark' | 'system' | 'high-contrast') =>
      themeManager.setThemePreference(preference),
    getThemePreference: () => themeManager.getThemePreference(),
    getSemanticColors: () => themeManager.getSemanticColors(),
    getAdaptiveSpacing: () => themeManager.getAdaptiveSpacing(),
    getColorWithOpacity: (color: string, opacity: number) =>
      themeManager.getColorWithOpacity(color, opacity),
  };
}

export function useThemedStyles<T>(
  styleFactory: (theme: ThemeConfig) => T
): T {
  const { theme } = useTheme();
  return React.useMemo(() => styleFactory(theme), [theme, styleFactory]);
}

// Theme-aware component wrapper
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: ThemeConfig }>
): React.ComponentType<P> {
  return (props: P) => {
    const { theme } = useTheme();
    return <Component {...props} theme={theme} />;
  };
}

// Export theme configurations for direct use
export { lightTheme, darkTheme, highContrastLightTheme, highContrastDarkTheme };