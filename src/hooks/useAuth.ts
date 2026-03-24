/**
 * Hook useAuth - KogniRecovery
 * Hook personalizado para gestión de autenticación
 * 
 * Funcionalidades:
 * - Login, logout, registro de usuarios
 * - Verificación y refresh de token
 * - Persistencia con AsyncStorage/SecureStore
 * - Validaciones de campos
 * - Manejo de estados de carga y error
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { User, LoginCredentials, RegisterData } from '@types';
import { authStore } from '../store/authStore';
import * as api from '../services/api';
import {
  AuthStatus,
  AuthOptions,
  LoginOptions,
  RegisterOptions,
  AuthOperationResult,
  TokenVerificationResult,
  validateLoginCredentials,
  validateRegisterData,
  AUTH_STORAGE_KEYS,
} from './types';

// ============================================
// Valores por defecto del estado
// ============================================

const DEFAULT_AUTH_STATUS: AuthStatus = {
  isAuthenticated: false,
  isLoading: false,
  isVerifying: true,
  user: null,
  token: null,
  refreshToken: null,
  error: null,
};

// ============================================
// Hook principal useAuth
// ============================================

/**
 * Hook personalizado para gestión de autenticación
 * @returns Objeto con estado y métodos de autenticación
 */
export const useAuth = () => {
  // Estado local para verificación inicial
  const [isVerifying, setIsVerifying] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  // Obtener estado del store de Zustand
  const store = authStore();

  // ============================================
  // Funciones de persistencia
  // ============================================

  /**
   * Guarda los datos de sesión en AsyncStorage
   */
  const saveSession = async (
    user: User,
    token: string,
    refreshToken: string,
    rememberMe: boolean
  ): Promise<void> => {
    try {
      if (rememberMe) {
        // Guardar datos importantes en storage persistente
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, token);
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER_ME, 'true');
      } else {
        // Limpiar datos si no hay "recordarme"
        await clearSession();
      }
    } catch (error) {
      console.warn('Error guardando sesión:', error);
    }
  };

  /**
   * Limpia los datos de sesión en AsyncStorage
   */
  const clearSession = async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        AUTH_STORAGE_KEYS.ACCESS_TOKEN,
        AUTH_STORAGE_KEYS.REFRESH_TOKEN,
        AUTH_STORAGE_KEYS.TOKEN_EXPIRY,
        AUTH_STORAGE_KEYS.USER_DATA,
        AUTH_STORAGE_KEYS.REMEMBER_ME,
      ]);
    } catch (error) {
      console.warn('Error limpiando sesión:', error);
    }
  };

  /**
   * Restaura la sesión desde AsyncStorage
   */
  const restoreSession = async (): Promise<boolean> => {
    try {
      const [token, refreshToken, userData, rememberMe] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(AUTH_STORAGE_KEYS.USER_DATA),
        AsyncStorage.getItem(AUTH_STORAGE_KEYS.REMEMBER_ME),
      ]);

      // Verificar si hay sesión guardada y "recordarme" está activo
      if (token && refreshToken && userData && rememberMe === 'true') {
        const user = JSON.parse(userData) as User;
        
        // Actualizar el store de Zustand
        store.setUser(user);
        store.setToken(token);
        
        // *** CRÍTICO: también actualizar el cliente API ***
        // Sin esto, todas las peticiones autenticadas fallan aunque el store tenga el token
        api.setAuthTokens({
          accessToken: token,
          refreshToken: refreshToken,
          expiresAt: Date.now() + 3600 * 1000, // Asumir 1h, se verifica luego
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Error restaurando sesión:', error);
      return false;
    }
  };

  // ============================================
  // Efectos
  // ============================================

  // Verificar token al iniciar la app
  useEffect(() => {
    const verifyOnStart = async () => {
      setIsVerifying(true);
      setInitialError(null);

      try {
        // Intentar restaurar sesión desde storage
        const hasStoredSession = await restoreSession();

        if (hasStoredSession) {
          // Verificar si el token es válido con el backend
          const isValid = await api.verifyToken();
          
          if (!isValid) {
            // Token no válido, cerrar sesión
            await store.logout();
            await clearSession();
          }
        }
      } catch (error) {
        console.warn('Error verificando token:', error);
        setInitialError('Error al verificar sesión');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyOnStart();
  }, []);

  // ============================================
  // Métodos de autenticación
  // ============================================

  /**
   * Inicia sesión con email y contraseña
   */
  const login = useCallback(
    async (credentials: LoginCredentials, options?: LoginOptions): Promise<AuthOperationResult> => {
      const rememberMe = options?.rememberMe ?? false;

      // Validar credenciales
      const validations = validateLoginCredentials(credentials);
      const hasErrors = Object.values(validations).some((v) => !v.isValid);

      if (hasErrors) {
        const firstError = Object.values(validations).find((v) => !v.isValid)?.error;
        store.clearError();
        return {
          success: false,
          error: firstError || 'Error de validación',
        };
      }

      store.clearError();

      try {
        // Intentar login con el API
        const response = await api.login(credentials);

        // Guardar en store
        store.setUser(response.user);
        store.setToken(response.accessToken);

        // Persistir si "recordarme" está activo
        await saveSession(
          response.user,
          response.accessToken,
          response.refreshToken,
          rememberMe
        );

        return {
          success: true,
          user: response.user,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [store]
  );

  /**
   * Registra un nuevo usuario
   */
  const register = useCallback(
    async (userData: RegisterData, options?: RegisterOptions): Promise<AuthOperationResult> => {
      const rememberMe = options?.rememberMe ?? true; // Por defecto guardar sesión

      // Validar datos de registro
      const validations = validateRegisterData(userData);
      const hasErrors = Object.values(validations).some((v) => !v.isValid);

      if (hasErrors) {
        const firstError = Object.values(validations).find((v) => !v.isValid)?.error;
        store.clearError();
        return {
          success: false,
          error: firstError || 'Error de validación',
        };
      }

      store.clearError();

      try {
        // Intentar registro con el API
        const response = await api.register(userData);

        // Guardar en store
        store.setUser(response.user);
        store.setToken(response.accessToken);

        // Persistir sesión
        await saveSession(
          response.user,
          response.accessToken,
          response.refreshToken,
          rememberMe
        );

        return {
          success: true,
          user: response.user,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al registrar usuario';
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [store]
  );

  /**
   * Cierra la sesión del usuario
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      // Llamar al API para cerrar sesión (opcional)
      await api.logout();
    } catch {
      // Ignorar errores del API al cerrar sesión
    } finally {
      // Limpiar store
      await store.logout();
      
      // Limpiar storage
      await clearSession();

      // Redirigir a login
      router.replace('/auth/login');
    }
  }, [store]);

  /**
   * Verifica si el token actual es válido
   */
  const verifyToken = useCallback(async (): Promise<TokenVerificationResult> => {
    const token = store.token;

    if (!token) {
      return { isValid: false };
    }

    try {
      const isValid = await api.verifyToken();
      
      if (isValid && store.user) {
        return {
          isValid: true,
          user: store.user,
        };
      }

      return { isValid: false };
    } catch {
      return { isValid: false };
    }
  }, [store.token, store.user]);

  /**
   * Renueva la sesión del usuario
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      // El API service ya maneja el refresh token automáticamente
      // a través del interceptor en api.ts
      const isValid = await api.verifyToken();
      return isValid;
    } catch {
      // Si falla el refresh, cerrar sesión
      await logout();
      return false;
    }
  }, [logout]);

  /**
   * Actualiza los datos del usuario en el estado
   */
  const updateUser = useCallback(
    (user: User): void => {
      store.setUser(user);
    },
    [store]
  );

  /**
   * Limpia el error actual
   */
  const clearError = useCallback((): void => {
    store.clearError();
  }, [store]);

  // ============================================
  // Estado combinado
  // ============================================

  const authStatus = useMemo<AuthStatus>(
    () => ({
      isAuthenticated: store.isAuthenticated,
      isLoading: store.isLoading,
      isVerifying: isVerifying,
      user: store.user,
      token: store.token,
      refreshToken: null, // No almacenamos refresh token en el store por seguridad
      error: store.error || initialError,
    }),
    [
      store.isAuthenticated,
      store.isLoading,
      isVerifying,
      store.user,
      store.token,
      store.error,
      initialError,
    ]
  );

  // ============================================
  // Retorno del hook
  // ============================================

  return {
    // Estado de autenticación
    ...authStatus,

    // Métodos de autenticación
    login,
    register,
    logout,
    verifyToken,
    refreshSession,

    // Utilidades
    updateUser,
    clearError,

    // Validadores
    validateEmail: validateLoginCredentials,
    validateRegisterData,
  };
};

// ============================================
// Exportaciones por defecto
// ============================================

export default useAuth;
