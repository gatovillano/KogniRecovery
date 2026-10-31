/**
 * Servicio de MFA (TOTP) para profesionales.
 *
 * El secreto se guarda cifrado con AES-256-GCM. La clave se deriva
 * del JWT_SECRET del entorno (evita añadir una variable obligatoria
 * nueva en desarrollo; en producción se puede dedicar una clave).
 */

import crypto from 'node:crypto';
import { generateSecret as generateTotpSecret, generateURI, verifySync } from 'otplib';
import jwt from 'jsonwebtoken';
import { jwt as jwtConfig } from '../config/index.js';
import * as UserModel from '../models/user.model.js';
import { createError } from '../middleware/error.js';

const ISSUER = 'KogniRecovery';
const CHALLENGE_EXPIRES_IN = 300; // 5 minutos

const deriveEncryptionKey = (): Buffer => {
  const base = process.env.MFA_SECRET_KEY ?? jwtConfig.secret;
  return crypto.createHash('sha256').update(`${base}:mfa`).digest();
};

export const encryptSecret = (secret: string): string => {
  const key = deriveEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${tag.toString('hex')}.${encrypted.toString('hex')}`;
};

export const decryptSecret = (stored: string): string => {
  const [ivHex, tagHex, dataHex] = stored.split('.');
  if (!ivHex || !tagHex || !dataHex) {
    throw createError('Secreto MFA inválido', 500, 'INVALID_MFA_SECRET');
  }
  const key = deriveEncryptionKey();
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
};

export const generateSecret = (email: string): { secret: string; otpauthUrl: string } => {
  const secret = generateTotpSecret();
  const otpauthUrl = generateURI({
    issuer: ISSUER,
    label: email,
    secret,
  });
  return { secret, otpauthUrl };
};

export const verifyTotp = (secret: string, token: string): boolean => {
  try {
    const result = verifySync({ secret, token });
    return typeof result === 'boolean' ? result : result.valid === true;
  } catch {
    return false;
  }
};

/**
 * Emite el challenge de dos pasos tras validar la contraseña.
 * El token es corto, de un solo uso conceptual, y solo permite
 * completar el segundo paso.
 */
export const signMfaChallenge = (userId: string): string => {
  return jwt.sign({ sub: userId, purpose: 'mfa_challenge' }, jwtConfig.secret, {
    expiresIn: CHALLENGE_EXPIRES_IN,
    jwtid: crypto.randomUUID(),
  });
};

export const verifyMfaChallenge = (token: string): string => {
  try {
    const payload = jwt.verify(token, jwtConfig.secret) as {
      sub?: string;
      purpose?: string;
    };
    if (payload.purpose !== 'mfa_challenge' || !payload.sub) {
      throw createError('Challenge inválido', 401, 'INVALID_MFA_CHALLENGE');
    }
    return payload.sub;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createError(
        'El challenge expiró. Vuelve a iniciar sesión.',
        401,
        'MFA_CHALLENGE_EXPIRED'
      );
    }
    throw createError('Challenge inválido', 401, 'INVALID_MFA_CHALLENGE');
  }
};

export const isMfaRequiredForUser = (user: UserModel.User): boolean =>
  user.role === 'professional' && Boolean(user.two_factor_enabled);

export const provisionMfa = async (
  userId: string
): Promise<{ secret: string; otpauthUrl: string }> => {
  const user = await UserModel.findById(userId);
  if (!user) throw createError('Usuario no encontrado', 404, 'USER_NOT_FOUND');

  if (user.role !== 'professional') {
    throw createError(
      'Solo los profesionales pueden activar MFA',
      403,
      'FORBIDDEN'
    );
  }

  if (user.two_factor_enabled) {
    throw createError(
      'El MFA ya está activo. Para reconfigurarlo desactívalo primero.',
      409,
      'MFA_ALREADY_ENABLED'
    );
  }

  const { secret, otpauthUrl } = generateSecret(user.email);
  // Se guarda pendiente de verificación; la verificación lo persiste.
  return { secret, otpauthUrl };
};

export const enableMfa = async (
  userId: string,
  secret: string,
  token: string
): Promise<{ enabled: boolean }> => {
  const user = await UserModel.findById(userId);
  if (!user) throw createError('Usuario no encontrado', 404, 'USER_NOT_FOUND');

  if (!verifyTotp(secret, token)) {
    throw createError('Código inválido', 400, 'INVALID_TOKEN');
  }

  const encrypted = encryptSecret(secret);
  await UserModel.update(userId, {
    two_factor_secret: encrypted,
    two_factor_enabled: true,
  });

  return { enabled: true };
};

export const disableMfa = async (
  userId: string,
  token: string
): Promise<{ enabled: boolean }> => {
  const user = await UserModel.findById(userId);
  if (!user) throw createError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  if (!user.two_factor_enabled || !user.two_factor_secret) {
    throw createError('El MFA no está activo', 409, 'MFA_NOT_ENABLED');
  }

  const secret = decryptSecret(user.two_factor_secret);
  if (!verifyTotp(secret, token)) {
    throw createError('Código inválido', 400, 'INVALID_TOKEN');
  }

  await UserModel.update(userId, {
    two_factor_secret: null,
    two_factor_enabled: false,
  });

  return { enabled: false };
};

export const verifyUserTotp = (user: UserModel.User, token: string): boolean => {
  if (!user.two_factor_secret) return false;
  const secret = decryptSecret(user.two_factor_secret);
  return verifyTotp(secret, token);
};

export default {
  generateSecret,
  verifyTotp,
  encryptSecret,
  decryptSecret,
  signMfaChallenge,
  verifyMfaChallenge,
  isMfaRequiredForUser,
  provisionMfa,
  enableMfa,
  disableMfa,
  verifyUserTotp,
};
