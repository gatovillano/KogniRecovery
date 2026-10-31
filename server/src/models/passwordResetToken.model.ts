/**
 * Modelo de tokens de recuperación de contraseña.
 *
 * SEC-PHASE2: el token se guarda hasheado (SHA-256), con expiración y
 * uso único. Un dump de BD no permite reutilizar tokens válidos.
 */

import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { hash } from '../utils/encryption.js';

const TABLE_NAME = 'password_reset_tokens';

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at?: Date | null;
  created_at: Date;
}

const hashToken = (token: string): string => hash(token);

export const create = async (input: {
  userId: string;
  token: string;
  expiresAt: Date;
}): Promise<PasswordResetToken> => {
  const result = await query<PasswordResetToken>(
    `INSERT INTO ${TABLE_NAME} (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [uuidv4(), input.userId, hashToken(input.token), input.expiresAt]
  );
  return result.rows[0]!;
};

export const findByToken = async (token: string): Promise<PasswordResetToken | null> => {
  const result = await query<PasswordResetToken>(
    `SELECT * FROM ${TABLE_NAME} WHERE token_hash = $1`,
    [hashToken(token)]
  );
  return result.rows[0] ?? null;
};

export const markAsUsed = async (id: string): Promise<void> => {
  await query(
    `UPDATE ${TABLE_NAME} SET used_at = NOW() WHERE id = $1`,
    [id]
  );
};

export const deleteExpired = async (): Promise<number> => {
  const result = await query(`DELETE FROM ${TABLE_NAME} WHERE expires_at < NOW() OR used_at IS NOT NULL`);
  return result.rowCount ?? 0;
};

export default {
  create,
  findByToken,
  markAsUsed,
  deleteExpired,
};
