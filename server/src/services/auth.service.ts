/**
 * Servicio de autenticación
 * Lógica de negocio para autenticación de usuarios
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as UserModel from '../models/user.model.js';
import * as RefreshTokenModel from '../models/refreshToken.model.js';
import * as ProfileModel from '../models/profile.model.js';
import { auth as authConfig } from '../config/index.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth.js';

// =====================================================
// INTERFACES
// =====================================================

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: 'patient' | 'family' | 'professional';
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: AuthTokens;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: AuthTokens;
}

export interface RefreshResponse {
  tokens: AuthTokens;
}

// =====================================================
// VALIDACIONES
// =====================================================

/**
 * Valida la contraseña según la configuración
 */
export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < authConfig.passwordMinLength) {
    errors.push(`La contraseña debe tener al menos ${authConfig.passwordMinLength} caracteres`);
  }

  if (authConfig.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (authConfig.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (authConfig.passwordRequireNumber && !/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (authConfig.passwordRequireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial');
  }

  return errors;
};

// =====================================================
// REGISTRO
// =====================================================

/**
 * Registra un nuevo usuario
 */
export const register = async (input: RegisterInput): Promise<RegisterResponse> => {
  const { email, password, name, role = 'patient', phone } = input;

  // Verificar si el email ya existe
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    const error = new Error('El correo electrónico ya está registrado') as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  // Validar contraseña
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    const error = new Error(passwordErrors.join(', ')) as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  // Encriptar contraseña
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Crear usuario
  const user = await UserModel.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    name,
    role,
    phone,
  });

  // Auto-crear perfil y configuración por defecto
  try {
    const profile = await ProfileModel.createProfile(user.id, {
      profile_type: role === 'patient' ? 'estandar' : role,
      display_name: name || email.split('@')[0],
      current_status: 'activo',
      preferred_language: 'es',
    });
    await ProfileModel.createProfileSettings(profile.id, {});
  } catch (profileError) {
    // No lanzar error si falla la creación de perfil, el usuario ya fue creado
    console.warn('⚠️ No se pudo crear perfil automáticamente:', profileError);
  }

  // Generar tokens
  const tokens = generateTokens(user.id, user.email, user.role);

  // Guardar refresh token en la base de datos
  await RefreshTokenModel.create({
    userId: user.id,
    token: tokens.refreshToken,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    tokens,
  };
};

// =====================================================
// LOGIN
// =====================================================

/**
 * Inicia sesión con email y contraseña
 */
export const login = async (input: LoginInput): Promise<LoginResponse> => {
  const { email, password } = input;

  // Buscar usuario por email
  const user = await UserModel.findByEmail(email.toLowerCase());
  if (!user) {
    const error = new Error('Credenciales inválidas') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Credenciales inválidas') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  // Verificar estado de cuenta
  if (user.status === 'suspended') {
    const error = new Error('Tu cuenta ha sido suspendida. Contacta al soporte.') as Error & { statusCode: number };
    error.statusCode = 403;
    throw error;
  }

  if (user.status === 'inactive') {
    const error = new Error('Tu cuenta está inactiva. Contacta al soporte.') as Error & { statusCode: number };
    error.statusCode = 403;
    throw error;
  }

  // Generar tokens
  const tokens = generateTokens(user.id, user.email, user.role);

  // Guardar refresh token en la base de datos
  await RefreshTokenModel.create({
    userId: user.id,
    token: tokens.refreshToken,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    tokens,
  };
};

// =====================================================
// REFRESH TOKEN
// =====================================================

/**
 * Refresca los tokens de acceso
 */
export const refreshTokens = async (refreshToken: string): Promise<RefreshResponse> => {
  // Verificar refresh token
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    const error = new Error('Refresh token inválido o expirado') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  // Verificar que el token existe en la base de datos
  const storedToken = await RefreshTokenModel.findByToken(refreshToken);
  if (!storedToken) {
    const error = new Error('Refresh token no encontrado') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  // Verificar que el token no esté revocado o usado
  if (storedToken.is_revoked || storedToken.is_used) {
    const error = new Error('Refresh token revocado o ya usado') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  // Verificar que el token no haya expirado
  if (new Date() > new Date(storedToken.expires_at)) {
    const error = new Error('Refresh token expirado') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  // Marcar el token anterior como usado
  await RefreshTokenModel.markAsUsed(refreshToken);

  // Buscar usuario
  const user = await UserModel.findById(decoded.userId);
  if (!user) {
    const error = new Error('Usuario no encontrado') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  // Generar nuevos tokens
  const tokens = generateTokens(user.id, user.email, user.role);

  // Guardar nuevo refresh token
  await RefreshTokenModel.create({
    userId: user.id,
    token: tokens.refreshToken,
    deviceId: storedToken.device_id ?? undefined,
    deviceName: storedToken.device_name ?? undefined,
    deviceType: storedToken.device_type ?? undefined,
    ipAddress: storedToken.ip_address ?? undefined,
    userAgent: storedToken.user_agent ?? undefined,
  });

  return { tokens };
};

// =====================================================
// LOGOUT
// =====================================================

/**
 * Cierra sesión revocando el refresh token
 */
export const logout = async (userId: string, refreshToken?: string): Promise<void> => {
  if (refreshToken) {
    // Revocar el token específico
    await RefreshTokenModel.revoke(refreshToken);
  } else {
    // Revocar todos los tokens del usuario
    await RefreshTokenModel.revokeAllByUserId(userId);
  }
};

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Genera los tokens de acceso y refresh
 */
const generateTokens = (userId: string, email: string, role: string): AuthTokens => {
  return {
    accessToken: generateAccessToken(userId, email, role),
    refreshToken: generateRefreshToken(userId, email, role),
  };
};

/**
 * Obtiene los tokens activos de un usuario
 */
export const getActiveSessions = async (userId: string) => {
  const tokens = await RefreshTokenModel.findActiveByUserId(userId);
  return tokens.map((token) => ({
    id: token.id,
    deviceId: token.device_id,
    deviceName: token.device_name,
    deviceType: token.device_type,
    ipAddress: token.ip_address,
    issuedFrom: token.issued_from,
    createdAt: token.created_at,
    expiresAt: token.expires_at,
  }));
};

export default {
  validatePassword,
  register,
  login,
  refreshTokens,
  logout,
  getActiveSessions,
};
