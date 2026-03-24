/**
 * ThemeContext - Proporciona el tema actual a toda la aplicación
 *
 * Soporta:
 * - Modo claro/oscuro automático basado en preferencias del sistema
 * - Cambio manual de tema
 * - Persistencia de preferencia de tema usando expo-secure-store
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Theme, ThemeMode, lightTheme, darkTheme, mergeThemes } from './theme';
import { uiStore } from '../store/uiStore';

const THEME_STORAGE_KEY = 'kognirecovery_theme_mode';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider que inyecta el tema en toda la aplicación
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar tema guardado al iniciar
  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Sincronizar con uiStore
  useEffect(() => {
    if (isLoaded) {
      uiStore.getState().setThemeMode(themeMode);
    }
  }, [themeMode, isLoaded]);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY) as ThemeMode;
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemeModeState(savedTheme);
      } else {
        // Usar tema del sistema por defecto
        const systemMode = systemColorScheme === 'dark' ? 'dark' : 'light';
        setThemeModeState(systemMode);
      }
    } catch (error) {
      console.warn('Error loading theme from storage:', error);
      const systemMode = systemColorScheme === 'dark' ? 'dark' : 'light';
      setThemeModeState(systemMode);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  // Determinar tema efectivo
  const effectiveMode = themeMode === 'auto' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : themeMode;
  const theme = effectiveMode === 'dark' ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
    isDark: effectiveMode === 'dark',
  };

  // No renderizar children hasta que el tema esté cargado
  if (!isLoaded) {
    return null; // O un splash screen si se desea
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Hook personalizado para acceder al tema
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
};

/**
 * Hook para acceder directamente al objeto de tema
 */
export const useThemeValues = (): Theme => {
  const { theme } = useTheme();
  return theme;
};