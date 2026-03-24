/**
 * Sistema de temas para KogniRecovery
 *
 * Diseño moderno y profesional "Slate & Indigo"
 */

import { Theme, ThemeColors, ThemeTypography, ThemeSpacing, ThemeShadows, ThemeMode } from '@types';

// ==================== COLORES ====================

const lightColors: ThemeColors = {
  primary: '#4F46E5', // Indigo 600
  primaryDark: '#4338CA', // Indigo 700
  secondary: '#10B981', // Emerald 500
  accent: '#F59E0B', // Amber 500
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#0F172A', // Slate 900
  textSecondary: '#64748B', // Slate 500
  textInverse: '#FFFFFF',
  border: '#E2E8F0', // Slate 200
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  overlay: 'rgba(15, 23, 42, 0.4)',
};

const darkColors: ThemeColors = {
  primary: '#6366F1', // Indigo 500
  primaryDark: '#4F46E5',
  secondary: '#34D399', // Emerald 400
  accent: '#FBBF24', // Amber 400
  background: '#0F172A', // Slate 900
  surface: '#1E293B', // Slate 800
  card: '#1E293B',
  text: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  textInverse: '#0F172A',
  border: '#334155', // Slate 700
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

// ==================== TIPOGRAFÍA ====================

const typography: ThemeTypography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 28, // Un poco más grande para títulos
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ==================== ESPACIADO ====================

const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ==================== SOMBRAS ====================

const shadows: ThemeShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

// ==================== RADIUS ====================

const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24, // Más redondeado para un look moderno
  xl: 32,
};

// ==================== TEMAS COMPLETOS ====================

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  typography,
  spacing,
  shadows,
  borderRadius,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  typography,
  spacing,
  shadows,
  borderRadius,
};

// ==================== FUNCIONES DE AYUDA ====================

/**
 * Obtiene el tema basado en el modo
 */
export const getThemeByMode = (mode: ThemeMode): Theme => {
  if (mode === 'dark') return darkTheme;
  return lightTheme;
};

/**
 * Combina dos temas (útil para overrides)
 */
export const mergeThemes = (base: Theme, override: Partial<Theme>): Theme => {
  return {
    ...base,
    ...override,
    colors: { ...base.colors, ...override.colors },
    typography: { ...base.typography, ...override.typography },
    spacing: { ...base.spacing, ...override.spacing },
    shadows: { ...base.shadows, ...override.shadows },
    borderRadius: { ...base.borderRadius, ...override.borderRadius },
  };
};

export type { Theme, ThemeColors, ThemeTypography, ThemeSpacing, ThemeShadows, ThemeMode };