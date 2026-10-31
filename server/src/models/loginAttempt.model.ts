/**
 * Modelo de intentos de login fallidos (lockout por cuenta).
 * SEC-PHASE2: el bloqueo se aplica por identificador (email normalizado)
 * y opcionalmente por IP, complementando el rate limit por IP existente.
 */

import { query } from '../config/database.js';

const TABLE_NAME = 'auth_login_attempts';

export interface LoginAttempt {
  id: string;
  identifier: string;
  ip_address?: string | null;
  failed_count: number;
  locked_until?: Date | null;
  last_failed_at: Date;
  updated_at: Date;
}

export const getAttempt = async (
  identifier: string,
  ipAddress?: string | null
): Promise<LoginAttempt | null> => {
  const result = await query<LoginAttempt>(
    `SELECT * FROM ${TABLE_NAME}
     WHERE identifier = $1 AND ip_address IS NOT DISTINCT FROM $2`,
    [identifier, ipAddress ?? null]
  );
  return result.rows[0] ?? null;
};

/**
 * Registra un intento fallido. Si tras incrementar se supera
 * maxAttempts, se fija locked_until = ahora + lockoutMinutes.
 */
export const recordFailure = async (input: {
  identifier: string;
  ipAddress?: string | null;
  maxAttempts: number;
  lockoutMinutes: number;
}): Promise<LoginAttempt> => {
  const { identifier, ipAddress, maxAttempts, lockoutMinutes } = input;

  const result = await query<LoginAttempt>(
    `INSERT INTO ${TABLE_NAME} (identifier, ip_address, failed_count, locked_until, last_failed_at)
     VALUES ($1, $2, 1, NULL, NOW())
     ON CONFLICT (identifier, ip_address) DO UPDATE SET
       failed_count = auth_login_attempts.failed_count + 1,
       last_failed_at = NOW(),
       locked_until = CASE
         WHEN auth_login_attempts.failed_count + 1 >= $3
           THEN NOW() + ($4 * INTERVAL '1 minute')
         ELSE auth_login_attempts.locked_until
       END,
       updated_at = NOW()
     RETURNING *`,
    [identifier, ipAddress ?? null, maxAttempts, lockoutMinutes]
  );
  return result.rows[0]!;
};

export const clearAttempts = async (
  identifier: string,
  ipAddress?: string | null
): Promise<void> => {
  await query(
    `DELETE FROM ${TABLE_NAME} WHERE identifier = $1 AND ip_address IS NOT DISTINCT FROM $2`,
    [identifier, ipAddress ?? null]
  );
};

export const isLocked = (attempt: LoginAttempt | null, now = new Date()): boolean => {
  return Boolean(attempt?.locked_until && new Date(attempt.locked_until) > now);
};

export default {
  getAttempt,
  recordFailure,
  clearAttempts,
  isLocked,
};
