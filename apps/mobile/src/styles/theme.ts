/**
 * Theme system for IssueDesk Mobile
 * Supports light and dark mode with GitHub-inspired design
 */

export const colors = {
  // Primary colors
  primary: '#0969da',
  primaryHover: '#0860cf',

  // State colors
  success: '#1a7f37',
  warning: '#9a6700',
  danger: '#cf222e',

  // Issue states
  openGreen: '#1a7f37',
  closedPurple: '#8250df',

  // Light theme
  light: {
    background: '#ffffff',
    backgroundSecondary: '#f6f8fa',
    backgroundTertiary: '#eaeef2',
    text: '#1f2328',
    textSecondary: '#656d76',
    textTertiary: '#8b949e',
    border: '#d0d7de',
    borderSecondary: '#e1e4e8',
  },

  // Dark theme
  dark: {
    background: '#0d1117',
    backgroundSecondary: '#161b22',
    backgroundTertiary: '#21262d',
    text: '#e6edf3',
    textSecondary: '#8b949e',
    textTertiary: '#6e7681',
    border: '#30363d',
    borderSecondary: '#21262d',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const borderRadius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
} as const;

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    primary: string;
    primaryHover: string;
    success: string;
    warning: string;
    danger: string;
    error: string;
    openGreen: string;
    closedPurple: string;
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    surface: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    borderSecondary: string;
  };
  spacing: typeof spacing;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  borderRadius: typeof borderRadius;
}

export const createTheme = (mode: ThemeMode): Theme => {
  const themeColors = mode === 'light' ? colors.light : colors.dark;

  return {
    mode,
    colors: {
      primary: colors.primary,
      primaryHover: colors.primaryHover,
      success: colors.success,
      warning: colors.warning,
      danger: colors.danger,
      error: colors.danger,
      openGreen: colors.openGreen,
      closedPurple: colors.closedPurple,
      surface: themeColors.backgroundSecondary,
      ...themeColors,
    },
    spacing,
    fontSize,
    fontWeight,
    borderRadius,
  };
};

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');
