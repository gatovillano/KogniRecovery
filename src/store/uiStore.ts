/**
 * UI Store - Maneja el estado de la interfaz de usuario
 *
 * Responsabilidades:
 * - Tema (claro/oscuro/auto)
 * - Configuración de accesibilidad
 * - Estado de modales y overlays
 * - Preferencias de notificaciones
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { ThemeMode } from '@types';

interface UIState {
  // Tema
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  // Accesibilidad
  fontSizeScale: number; // 1 = normal, 1.2 = grande, etc.
  setFontSizeScale: (scale: number) => void;
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;

  // UI State
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  activeModal: string | null;
  setActiveModal: (modalId: string | null) => void;

  // Notificaciones
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  vibrationEnabled: boolean;
  setVibrationEnabled: (enabled: boolean) => void;
}

// SecureStore adapter para zustand persist
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.warn('Error storing data:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      // Ignorar errores
    }
  },
};

export const uiStore = create<UIState>()(
  persist(
    (set) => ({
      // Tema
      themeMode: 'light',
      setThemeMode: (mode) => set({ themeMode: mode }),

      // Accesibilidad
      fontSizeScale: 1,
      setFontSizeScale: (scale) => set({ fontSizeScale: scale }),
      reduceMotion: false,
      setReduceMotion: (value) => set({ reduceMotion: value }),
      highContrast: false,
      setHighContrast: (value) => set({ highContrast: value }),

      // UI State
      isModalVisible: false,
      setModalVisible: (visible) => set({ isModalVisible: visible }),
      activeModal: null,
      setActiveModal: (modalId) => set({ activeModal: modalId }),

      // Notificaciones
      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      soundEnabled: true,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      vibrationEnabled: true,
      setVibrationEnabled: (enabled) => set({ vibrationEnabled: enabled }),
    }),
    {
      name: 'kognirecovery-ui-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        // Solo persistir estas configuraciones
        themeMode: state.themeMode,
        fontSizeScale: state.fontSizeScale,
        reduceMotion: state.reduceMotion,
        highContrast: state.highContrast,
        notificationsEnabled: state.notificationsEnabled,
        soundEnabled: state.soundEnabled,
        vibrationEnabled: state.vibrationEnabled,
      }),
    }
  )
);