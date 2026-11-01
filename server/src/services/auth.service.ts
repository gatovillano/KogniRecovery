/**
 * Servicio de autenticación
 * Lógica de negocio para autenticación de usuarios
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import * as UserModel from '../models/user.model.js';
import * as RefreshTokenModel from '../models/refreshToken.model.js';
import * as LoginAttemptModel from '../models/loginAttempt.model.js';
import * as PasswordResetTokenModel from '../models/passwordResetToken.model.js';
import * as ProfileModel from '../models/profile.model.js';
import * as MfaService from './mfa.service.js';
import { auth as authConfig, jwt as jwtConfig } from '../config/index.js';
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
  ipAddress?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string | number;
}

export interface LoginMfaResponse {
  mfa_required: true;
  challenge: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export type LoginResult = LoginResponse | LoginMfaResponse;

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    llm_provider?: string | undefined;
    llm_model?: string | undefined;
  };
  tokens: AuthTokens;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    llm_provider?: string;
    llm_model?: string;
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
    const error = new Error('El correo electrónico ya está registrado') as Error & {
      statusCode: number;
    };
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
    if (profile) {
      await ProfileModel.createProfileSettings(profile.id, {});
    } else {
      console.warn('⚠️ No se pudo crear perfil automáticamente: perfil nulo');
    }
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
      llm_provider: user.llm_provider,
      llm_model: user.llm_model,
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
export const login = async (input: LoginInput): Promise<LoginResult> => {
  const { email, password, ipAddress } = input;
  const identifier = email.toLowerCase();

  // SEC-PHASE2: lockout por cuenta (por identificador + IP). Se consulta
  // antes de validar credenciales para no regalar coste de bcrypt a un
  // atacante bloqueado.
  const attempt = await LoginAttemptModel.getAttempt(identifier, ipAddress);
  if (LoginAttemptModel.isLocked(attempt)) {
    const error = new Error(
      'Demasiados intentos fallidos. Inténtalo más tarde.'
    ) as Error & { statusCode: number };
    error.statusCode = 429;
    throw error;
  }

  // Buscar usuario por email
  const user = await UserModel.findByEmail(identifier);
  if (!user) {
    await LoginAttemptModel.recordFailure({
      identifier,
      ipAddress,
      maxAttempts: authConfig.maxLoginAttempts,
      lockoutMinutes: authConfig.loginLockoutDuration,
    });
    const error = new Error('Credenciales inválidas') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    await LoginAttemptModel.recordFailure({
      identifier,
      ipAddress,
      maxAttempts: authConfig.maxLoginAttempts,
      lockoutMinutes: authConfig.loginLockoutDuration,
    });
    const error = new Error('Credenciales inválidas') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  // Credenciales válidas: limpiar intentos fallidos.
  await LoginAttemptModel.clearAttempts(identifier, ipAddress);

  // Verificar estado de cuenta
  if (user.status === 'suspended') {
    const error = new Error('Tu cuenta ha sido suspendida. Contacta al soporte.') as Error & {
      statusCode: number;
    };
    error.statusCode = 403;
    throw error;
  }

  if (user.status === 'inactive') {
    const error = new Error('Tu cuenta está inactiva. Contacta al soporte.') as Error & {
      statusCode: number;
    };
    error.statusCode = 403;
    throw error;
  }

  if (user.status === 'deleted') {
    const error = new Error('Tu cuenta ya no está disponible.') as Error & { statusCode: number };
    error.statusCode = 403;
    throw error;
  }

  // Si el profesional tiene MFA activo, emitir un challenge de dos pasos.
  if (MfaService.isMfaRequiredForUser(user)) {
    const challenge = MfaService.signMfaChallenge(user.id);
    return {
      mfa_required: true,
      challenge,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
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
      llm_provider: user.llm_provider,
      llm_model: user.llm_model,
    },
    tokens,
  };
};

/**
 * Segundo paso de login para profesionales con MFA activo.
 * Verifica el challenge firmado y el código TOTP.
 */
export const verifyMfaAndLogin = async (input: {
  challenge: string;
  code: string;
}): Promise<LoginResponse> => {
  const userId = MfaService.verifyMfaChallenge(input.challenge);

  const user = await UserModel.findById(userId);
  if (!user) {
    const error = new Error('Credenciales inválidas') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== 'active') {
    const error = new Error('Tu cuenta no está activa.') as Error & { statusCode: number };
    error.statusCode = 403;
    throw error;
  }

  if (!MfaService.isMfaRequiredForUser(user)) {
    const error = new Error('Este usuario no requiere MFA') as Error & {
      statusCode: number;
    };
    error.statusCode = 409;
    throw error;
  }

  if (!MfaService.verifyUserTotp(user, input.code)) {
    const error = new Error('Código de verificación inválido') as Error & {
      statusCode: number;
    };
    error.statusCode = 401;
    throw error;
  }

  const tokens = generateTokens(user.id, user.email, user.role);
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
      llm_provider: user.llm_provider,
      llm_model: user.llm_model,
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

  // SEC-PHASE2: si el token ya fue usado, es una señal de reuso
  // (robo/duplicación). Se revoca TODA la familia de tokens del usuario
  // y se rechaza. No reutilizamos el token ni emitimos otros nuevos.
  if (storedToken.is_used) {
    await RefreshTokenModel.revokeAllByUserId(storedToken.user_id);
    const error = new Error(
      'Refresh token reutilizado: todas las sesiones del usuario fueron revocadas'
    ) as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  // Verificar que el token no esté revocado
  if (storedToken.is_revoked) {
    const error = new Error('Refresh token revocado') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  // Verificar que el token no haya expirado
  if (new Date() > new Date(storedToken.expires_at)) {
    const error = new Error('Refresh token expirado') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  // Verificar que el token pertenezca al mismo usuario del payload JWT
  if (storedToken.user_id !== decoded.userId) {
    await RefreshTokenModel.revokeAllByUserId(storedToken.user_id);
    const error = new Error('Refresh token no corresponde al usuario') as Error & {
      statusCode: number;
    };
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

  // Verificar estado actual de la cuenta (sin confiar en el JWT).
  if (user.status !== 'active') {
    // Revocar tokens para impedir renovaciones futuras.
    await RefreshTokenModel.revoke(refreshToken);
    await RefreshTokenModel.revokeAllByUserId(user.id);
    const error = new Error('Tu cuenta no está activa.') as Error & { statusCode: number };
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
// RECUPERACIÓN DE CONTRASEÑA
// =====================================================

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000; // 30 minutos

/**
 * Solicita un token de recuperación para un correo.
 * La respuesta NO revela si el correo existe (anti-enumeración).
 */
export const requestPasswordReset = async (email: string): Promise<{ devToken?: string }> => {
  const identifier = email.toLowerCase();
  const user = await UserModel.findByEmail(identifier);

  // Si el usuario no existe, no crear token (misma respuesta genérica).
  if (!user) {
    return {};
  }

  const token = crypto.randomBytes(32).toString('hex');
  await PasswordResetTokenModel.create({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  });

  // Sin SMTP configurado, el token se devuelve SOLO en entornos de
  // desarrollo/test. En producción debe enviarse por email (canal fuera
  // de banda); aquí solo se registra a nivel info, sin datos del usuario.
  if (process.env.NODE_ENV !== 'production') {
    return { devToken: token };
  }
  console.info('[AUTH] Password reset token creado (enviar por email en producción).');
  return {};
};

/**
 * Consume el token y actualiza la contraseña. Token de uso único.
 */
export const resetPassword = async (input: {
  token: string;
  newPassword: string;
}): Promise<void> => {
  const passwordErrors = validatePassword(input.newPassword);
  if (passwordErrors.length > 0) {
    const error = new Error(passwordErrors.join(', ')) as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  const stored = await PasswordResetTokenModel.findByToken(input.token);
  if (!stored || stored.used_at) {
    const error = new Error('Token de recuperación inválido o ya usado') as Error & {
      statusCode: number;
    };
    error.statusCode = 400;
    throw error;
  }
  if (new Date() > new Date(stored.expires_at)) {
    const error = new Error('Token de recuperación expirado') as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
  const hashedPassword = await bcrypt.hash(input.newPassword, saltRounds);
  await UserModel.updatePassword(stored.user_id, hashedPassword);

  await PasswordResetTokenModel.markAsUsed(stored.id);

  // Revocar todas las sesiones del usuario: cualquier cliente con un
  // refresh token anterior queda invalidado.
  await RefreshTokenModel.revokeAllByUserId(stored.user_id);
};

/**
 * Cambio de contraseña desde sesión iniciada.
 */
export const changePassword = async (input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  const passwordErrors = validatePassword(input.newPassword);
  if (passwordErrors.length > 0) {
    const error = new Error(passwordErrors.join(', ')) as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  const user = await UserModel.findById(input.userId);
  if (!user) {
    const error = new Error('Usuario no encontrado') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const isValidCurrent = await bcrypt.compare(input.currentPassword, user.password);
  if (!isValidCurrent) {
    const error = new Error('Contraseña actual incorrecta') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
  const hashedPassword = await bcrypt.hash(input.newPassword, saltRounds);
  await UserModel.updatePassword(user.id, hashedPassword);

  // Revocar sesiones previas (el cliente actual deberá re-autenticarse
  // o usar el refresh token nuevo que obtenga al volver a entrar).
  await RefreshTokenModel.revokeAllByUserId(user.id);
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
// SUSPENSIÓN / REACTIVACIÓN DE CUENTA
// =====================================================

/**
 * Suspende una cuenta y revoca todas sus sesiones activas.
 */
export const suspendAccount = async (userId: string): Promise<void> => {
  await UserModel.update(userId, { status: 'suspended' });
  await RefreshTokenModel.revokeAllByUserId(userId);
};

/**
 * Reactiva una cuenta suspendida/inactiva.
 */
export const reactivateAccount = async (userId: string): Promise<void> => {
  await UserModel.update(userId, { status: 'active' });
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
    expiresIn: jwtConfig.expiresIn,
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
  requestPasswordReset,
  resetPassword,
  changePassword,
  getActiveSessions,
  suspendAccount,
  reactivateAccount,
};
