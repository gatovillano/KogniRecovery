/**
 * Modelo de Refresh Tokens
 * Consultas SQL para la tabla refresh_tokens
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// INTERFACES
// =====================================================

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  device_id?: string;
  device_name?: string;
  device_type?: string;
  ip_address?: string;
  user_agent?: string;
  is_revoked: boolean;
  is_used: boolean;
  expires_at: Date;
  used_at?: Date;
  revoked_at?: Date;
  issued_from: 'mobile_app' | 'web_app' | 'api';
  created_at: Date;
}

export interface CreateRefreshTokenInput {
  userId: string;
  token: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresInDays?: number;
  issuedFrom?: 'mobile_app' | 'web_app' | 'api';
}

// =====================================================
// CONSULTAS
// =====================================================

const TABLE_NAME = 'refresh_tokens';

/**
 * Crea un nuevo refresh token
 */
export const create = async (input: CreateRefreshTokenInput): Promise<RefreshToken> => {
  const {
    userId,
    token,
    deviceId,
    deviceName,
    deviceType,
    ipAddress,
    userAgent,
    expiresInDays = 7,
    issuedFrom = 'api',
  } = input;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const result = await query<RefreshToken>(
    `INSERT INTO ${TABLE_NAME} 
     (id, user_id, token, device_id, device_name, device_type, ip_address, user_agent, expires_at, issued_from)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      uuidv4(),
      userId,
      token,
      deviceId ?? null,
      deviceName ?? null,
      deviceType ?? null,
      ipAddress ?? null,
      userAgent ?? null,
      expiresAt,
      issuedFrom,
    ]
  );

  return result.rows[0]!;
};

/**
 * Busca un refresh token por su valor
 */
export const findByToken = async (token: string): Promise<RefreshToken | null> => {
  const result = await query<RefreshToken>(
    `SELECT * FROM ${TABLE_NAME} WHERE token = $1`,
    [token]
  );

  return result.rows[0] ?? null;
};

/**
 * Busca refresh tokens activos de un usuario
 */
export const findActiveByUserId = async (userId: string): Promise<RefreshToken[]> => {
  const result = await query<RefreshToken>(
    `SELECT * FROM ${TABLE_NAME} 
     WHERE user_id = $1 AND is_revoked = FALSE AND is_used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};

/**
 * Busca un refresh token por usuario y dispositivo
 */
export const findByUserAndDevice = async (
  userId: string,
  deviceId: string
): Promise<RefreshToken | null> => {
  const result = await query<RefreshToken>(
    `SELECT * FROM ${TABLE_NAME} 
     WHERE user_id = $1 AND device_id = $2 AND is_revoked = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, deviceId]
  );

  return result.rows[0] ?? null;
};

/**
 * Marca un token como usado
 */
export const markAsUsed = async (token: string): Promise<boolean> => {
  const result = await query(
    `UPDATE ${TABLE_NAME} 
     SET is_used = TRUE, used_at = NOW() 
     WHERE token = $1`,
    [token]
  );

  return (result.rowCount ?? 0) > 0;
};

/**
 * Revoca un token específico
 */
export const revoke = async (token: string): Promise<boolean> => {
  const result = await query(
    `UPDATE ${TABLE_NAME} 
     SET is_revoked = TRUE, revoked_at = NOW() 
     WHERE token = $1`,
    [token]
  );

  return (result.rowCount ?? 0) > 0;
};

/**
 * Revoca todos los tokens de un usuario
 */
export const revokeAllByUserId = async (userId: string): Promise<number> => {
  const result = await query(
    `UPDATE ${TABLE_NAME} 
     SET is_revoked = TRUE, revoked_at = NOW() 
     WHERE user_id = $1 AND is_revoked = FALSE`,
    [userId]
  );

  return result.rowCount ?? 0;
};

/**
 * Revoca todos los tokens de un usuario por dispositivo
 */
export const revokeByUserAndDevice = async (
  userId: string,
  deviceId: string
): Promise<number> => {
  const result = await query(
    `UPDATE ${TABLE_NAME} 
     SET is_revoked = TRUE, revoked_at = NOW() 
     WHERE user_id = $1 AND device_id = $2 AND is_revoked = FALSE`,
    [userId, deviceId]
  );

  return result.rowCount ?? 0;
};

/**
 * Elimina tokens expirados
 */
export const cleanupExpired = async (): Promise<number> => {
  const result = await query(
    `DELETE FROM ${TABLE_NAME} 
     WHERE expires_at < NOW() OR (is_used = TRUE AND used_at < NOW() - INTERVAL '7 days')`
  );

  return result.rowCount ?? 0;
};

/**
 * Verifica si un token es válido
 */
export const isValid = async (token: string): Promise<boolean> => {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM ${TABLE_NAME} 
     WHERE token = $1 AND is_revoked = FALSE AND is_used = FALSE AND expires_at > NOW()`,
    [token]
  );

  return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
};

/**
 * Cuenta los tokens activos de un usuario
 */
export const countActiveByUserId = async (userId: string): Promise<number> => {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM ${TABLE_NAME} 
     WHERE user_id = $1 AND is_revoked = FALSE AND is_used = FALSE AND expires_at > NOW()`,
    [userId]
  );

  return parseInt(result.rows[0]?.count ?? '0', 10);
};

export default {
  create,
  findByToken,
  findActiveByUserId,
  findByUserAndDevice,
  markAsUsed,
  revoke,
  revokeAllByUserId,
  revokeByUserAndDevice,
  cleanupExpired,
  isValid,
  countActiveByUserId,
};
