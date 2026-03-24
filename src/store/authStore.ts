/**
 * Auth Store - Maneja el estado de autenticación de usuario conectado a API real
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { User, LoginRequest, RegisterRequest } from '../types/api';
import apiClient from '@services/api';

interface AuthState {
  // Estado de autenticación
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  clearError: () => void;
}

// SecureStore adapter para persistencia segura
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
      console.warn('Error storing auth data:', error);
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

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.login(credentials);

          set({
            user: response.user,
            token: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error?.message || 'Error al iniciar sesión',
          });
          return false;
        }
      },

      register: async (data: RegisterRequest) => {
        console.log('📦 Store: Iniciando registro para', data.email);
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.register(data);

          set({
            user: response.user,
            token: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error?.message || 'Error al registrar usuario',
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await apiClient.logout();
        } catch (error) {
          console.warn('Logout API error:', error);
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'kognirecovery-auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);