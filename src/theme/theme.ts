/**
 * Tema: Zen Bluish
 * Una evolución calmada enfocada en tonos azulados uniformes.
 * Soporta modos Claro y Oscuro con coherencia visual.
 */

import {
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeShadows,
  ThemeMode,
  ThemeGradients,
} from '../types';

// ─────────────────────────────────────────────
// PALETA CLARA - Zen Bluish
// ─────────────────────────────────────────────
const lightColors: ThemeColors = {
  primary: '#5D89BA', // Azul Sereno
  primaryDark: '#4A6D95',
  secondary: '#A5C0D3', // Azul Pálido
  accent: '#E2E8F0', // Gris Azulado muy suave
  background: '#F8FAFC', // Fondo casi blanco azulado
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1E293B', // Slate 800
  textSecondary: '#64748B', // Slate 500
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  success: '#6B8BB2',
  warning: '#94A3B8',
  error: '#C07878',
  info: '#5D89BA',
  overlay: 'rgba(15, 23, 42, 0.4)',
};

// ─────────────────────────────────────────────
// PALETA OSCURA - Zen Bluish
// ─────────────────────────────────────────────
const darkColors: ThemeColors = {
  primary: '#8BAFD4', // Azul Cielo luminoso sobre oscuro
  primaryDark: '#5D89BA',
  secondary: '#4A6D95',
  accent: '#334155',
  background: '#0F172A', // Slate 900 (Azul profundo)
  surface: '#1E293B', // Slate 800
  card: '#1E293B',
  text: '#F1F5F9', // Slate 100
  textSecondary: '#94A3B8', // Slate 400
  textInverse: '#0F172A',
  border: '#334155',
  success: '#8BAFD4',
  warning: '#64748B',
  error: '#F87171',
  info: '#8BAFD4',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

const typography: ThemeTypography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 22,
    xxl: 30,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.6,
    relaxed: 1.85,
  },
};

const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

const lightShadows: ThemeShadows = {
  sm: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
};

const darkShadows: ThemeShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 36,
    elevation: 10,
  },
};

const lightGradients: ThemeGradients = {
  primary: ['#5D89BA', '#4A6D95'],
  secondary: ['#8BAFD4', '#6B8BB2'],
  hero: ['#5D89BA', '#8BAFD4'],
  surface: ['rgba(93,137,186,0.06)', 'rgba(139,175,212,0.03)'],
};

const darkGradients: ThemeGradients = {
  primary: ['#8BAFD4', '#5D89BA'],
  secondary: ['#546E8E', '#4A6D95'],
  hero: ['#1E293B', '#0F172A'],
  surface: ['rgba(139,175,212,0.08)', 'rgba(93,137,186,0.04)'],
};

const lightGlass = {
  background: 'rgba(255, 255, 255, 0.7)',
  border: 'rgba(226, 232, 240, 0.5)',
  blur: 20,
};

const darkGlass = {
  background: 'rgba(30, 41, 59, 0.7)',
  border: 'rgba(51, 65, 85, 0.5)',
  blur: 20,
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  typography,
  spacing,
  shadows: lightShadows,
  borderRadius,
  gradients: lightGradients,
  glass: lightGlass,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  typography,
  spacing,
  shadows: darkShadows,
  borderRadius,
  gradients: darkGradients,
  glass: darkGlass,
};

// Objeto por defecto requerido por el sistema actual
export const theme: Theme = lightTheme;

export const getThemeByMode = (mode: ThemeMode): Theme => {
  if (mode === 'dark' || mode === 'auto') return darkTheme;
  return lightTheme;
};

export const mergeThemes = (base: Theme, override: Partial<Theme>): Theme => {
  return {
    ...base,
    ...override,
    colors: { ...base.colors, ...override.colors },
    typography: { ...base.typography, ...override.typography },
    spacing: { ...base.spacing, ...override.spacing },
    shadows: { ...base.shadows, ...override.shadows },
    borderRadius: { ...base.borderRadius, ...override.borderRadius },
    gradients: { ...base.gradients, ...override.gradients },
    glass: { ...base.glass, ...override.glass },
  };
};

export type {
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeShadows,
  ThemeMode,
  ThemeGradients,
};
