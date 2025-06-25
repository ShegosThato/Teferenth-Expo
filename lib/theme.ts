/**
 * Advanced Theme System with Dark Mode Support
 * 
 * Provides comprehensive theming with:
 * - Light and dark mode support
 * - Dynamic theme switching
 * - Consistent color system
 * - Accessibility considerations
 * 
 * Phase 2 Task 3: Advanced UI/UX Enhancements
 */

import { useColorScheme } from 'react-native';
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  
  background: string;
  backgroundSecondary: string;
  surface: string;
  card: string;
  border: string;
  borderLight: string;
  
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  shadow: string;
  overlay: string;
  
  // Status colors
  statusDraft: string;
  statusStoryboard: string;
  statusRendering: string;
  statusComplete: string;
}

// Light theme colors
export const lightColors: ThemeColors = {
  primary: '#7c3aed',
  primaryLight: '#a78bfa',
  primaryDark: '#5b21b6',
  secondary: '#06b6d4',
  secondaryLight: '#67e8f9',
  secondaryDark: '#0891b2',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  
  background: '#f9fafb',
  backgroundSecondary: '#f3f4f6',
  surface: '#ffffff',
  card: '#ffffff',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  
  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textInverse: '#ffffff',
  
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  statusDraft: '#6b7280',
  statusStoryboard: '#3b82f6',
  statusRendering: '#f59e0b',
  statusComplete: '#10b981',
};

// Dark theme colors
export const darkColors: ThemeColors = {
  primary: '#a78bfa',
  primaryLight: '#c4b5fd',
  primaryDark: '#8b5cf6',
  secondary: '#22d3ee',
  secondaryLight: '#67e8f9',
  secondaryDark: '#06b6d4',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  info: '#60a5fa',
  
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  surface: '#1e293b',
  card: '#334155',
  border: '#475569',
  borderLight: '#64748b',
  
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  textInverse: '#0f172a',
  
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  statusDraft: '#94a3b8',
  statusStoryboard: '#60a5fa',
  statusRendering: '#fbbf24',
  statusComplete: '#34d399',
};

// Theme interface
export interface Theme {
  colors: ThemeColors;
  mode: 'light' | 'dark';
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    weights: {
      normal: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
  shadows: {
    sm: object;
    md: object;
    lg: object;
  };
}

// Create themes
const createTheme = (colors: ThemeColors, mode: 'light' | 'dark'): Theme => ({
  colors,
  mode,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  shadows: {
    sm: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 8,
    },
  },
});

export const lightTheme = createTheme(lightColors, 'light');
export const darkTheme = createTheme(darkColors, 'dark');

// Theme context
interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  
  // Determine current theme
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    saveThemePreference(themeMode);
  }, [themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('theme_preference', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      themeMode,
      setThemeMode,
      isDark,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme hook
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Backward compatibility exports
export const colors = lightColors;
export const statusColors = {
  draft: lightColors.statusDraft,
  storyboard: lightColors.statusStoryboard,
  rendering: lightColors.statusRendering,
  complete: lightColors.statusComplete,
};