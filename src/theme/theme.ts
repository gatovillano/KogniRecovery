/**
 * Tema: NUMA Orgánico
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
// PALETA CLARA - NUMA
// ─────────────────────────────────────────────
const lightColors: ThemeColors = {
  primary: '#104C50', // Azul petróleo NUMA
  primaryDark: '#0B383B',
  secondary: '#8EAD91', // Verde salvia
  accent: '#E9DDC8', // Arena suave
  background: '#F8F7F2', // Blanco cálido
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#263C38', // Verde carbón
  textSecondary: '#65756B', // Verde grisáceo
  textInverse: '#FFFFFF',
  border: '#E8E4DA',
  success: '#739B7A',
  warning: '#C4A882',
  error: '#C07878',
  info: '#104C50',
  overlay: 'rgba(15, 23, 42, 0.4)',
};

// ─────────────────────────────────────────────
// PALETA OSCURA - NUMA
// ─────────────────────────────────────────────
const darkColors: ThemeColors = {
  primary: '#A6C7A9', // Verde salvia luminoso
  primaryDark: '#104C50',
  secondary: '#739B7A',
  accent: '#49483D',
  background: '#142522', // Verde petróleo profundo
  surface: '#203530', // Verde pizarra
  card: '#203530',
  text: '#EAF0E8', // Blanco salvia
  textSecondary: '#B7C8BC', // Salvia gris
  textInverse: '#142522',
  border: '#385149',
  success: '#A6C7A9',
  warning: '#D5BC91',
  error: '#F87171',
  info: '#A6C7A9',
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
  primary: ['#104C50', '#2A8176'],
  secondary: ['#8EAD91', '#5E907D'],
  hero: ['#104C50', '#739B7A'],
  surface: ['rgba(16,76,80,0.06)', 'rgba(142,173,145,0.04)'],
};

const darkGradients: ThemeGradients = {
  primary: ['#A6C7A9', '#28605A'],
  secondary: ['#547D69', '#294D45'],
  hero: ['#28605A', '#142522'],
  surface: ['rgba(166,199,169,0.08)', 'rgba(142,173,145,0.04)'],
};

const lightGlass = {
  background: 'rgba(255, 255, 255, 0.76)',
  border: 'rgba(232, 228, 218, 0.7)',
  blur: 20,
};

const darkGlass = {
  background: 'rgba(32, 53, 48, 0.82)',
  border: 'rgba(56, 81, 73, 0.65)',
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
