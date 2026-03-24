/**
 * Tipos para el hook useAuth - KogniRecovery
 * Define las interfaces y tipos utilizados por el hook de autenticación
 */

import { User, UserRole, LoginCredentials, RegisterData } from '@types';

// ============================================
// Tipos de estado de autenticación
// ============================================

/**
 * Estado completo de autenticación
 */
export interface AuthStatus {
  /** Indica si el usuario está autenticado */
  isAuthenticated: boolean;
  /** Indica si hay una operación de autenticación en progreso */
  isLoading: boolean;
  /** Indica si se está verificando el token al iniciar la app */
  isVerifying: boolean;
  /** Datos del usuario logueado */
  user: User | null;
  /** Token de acceso actual */
  token: string | null;
  /** Token de refresh actual */
  refreshToken: string | null;
  /** Mensaje de error de la última operación */
  error: string | null;
}

// ============================================
// Tipos de opciones de autenticación
// ============================================

/**
 * Opciones para el proceso de login
 */
export interface LoginOptions {
  /** Indica si el usuario seleccionó "recordarme" */
  rememberMe?: boolean;
}

/**
 * Opciones para el proceso de registro
 */
export interface RegisterOptions {
  /** Indica si el usuario seleccionó "recordarme" */
  rememberMe?: boolean;
}

/**
 * Opciones de autenticación general
 */
export interface AuthOptions {
  /** Indica si el usuario seleccionó "recordarme" */
  rememberMe?: boolean;
  /** Callback opcional al iniciar sesión exitosamente */
  onSuccess?: () => void;
  /** Callback opcional al fallar el inicio de sesión */
  onError?: (error: string) => void;
}

// ============================================
// Tipos de validación
// ============================================

/**
 * Resultado de validación de campo
 */
export interface ValidationResult {
  /** Indica si el campo es válido */
  isValid: boolean;
  /** Mensaje de error si el campo no es válido */
  error?: string;
}

/**
 * Valida un email
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: 'El email es requerido',
    };
  }

  // Regex para validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Ingresa un email válido',
    };
  }

  return { isValid: true };
};

/**
 * Valida una contraseña
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password === '') {
    return {
      isValid: false,
      error: 'La contraseña es requerida',
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      error: 'La contraseña debe tener al menos 6 caracteres',
    };
  }

  return { isValid: true };
};

/**
 * Valida los datos de registro
 */
export const validateRegisterData = (data: RegisterData): Record<string, ValidationResult> => {
  const emailValidation = validateEmail(data.email);
  const passwordValidation = validatePassword(data.password);

  const firstNameValidation: ValidationResult = !data.firstName || data.firstName.trim() === ''
    ? { isValid: false, error: 'El nombre es requerido' }
    : { isValid: true };

  const lastNameValidation: ValidationResult = !data.lastName || data.lastName.trim() === ''
    ? { isValid: false, error: 'El apellido es requerido' }
    : { isValid: true };

  const roleValidation: ValidationResult = !data.role
    ? { isValid: false, error: 'El rol es requerido' }
    : { isValid: true };

  return {
    email: emailValidation,
    password: passwordValidation,
    firstName: firstNameValidation,
    lastName: lastNameValidation,
    role: roleValidation,
  };
};

/**
 * Valida las credenciales de login
 */
export const validateLoginCredentials = (credentials: LoginCredentials): Record<string, ValidationResult> => {
  return {
    email: validateEmail(credentials.email),
    password: validatePassword(credentials.password),
  };
};

// ============================================
// Tipos de configuración de persistencia
// ============================================

/**
 * Claves de almacenamiento en AsyncStorage
 */
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'kognirecovery_access_token',
  REFRESH_TOKEN: 'kognirecovery_refresh_token',
  TOKEN_EXPIRY: 'kognirecovery_token_expiry',
  USER_DATA: 'kognirecovery_user_data',
  REMEMBER_ME: 'kognirecovery_remember_me',
} as const;

// ============================================
// Tipos de resultado de operaciones
// ============================================

/**
 * Resultado de una operación de autenticación
 */
export interface AuthOperationResult {
  /** Indica si la operación fue exitosa */
  success: boolean;
  /** Mensaje de error si falló */
  error?: string;
  /** Datos del usuario si fue exitoso */
  user?: User;
}

/**
 * Resultado de verificación de token
 */
export interface TokenVerificationResult {
  /** Indica si el token es válido */
  isValid: boolean;
  /** Usuario asociado al token si es válido */
  user?: User;
  /** Tiempo restante hasta expiración (en ms) */
  expiresIn?: number;
}
