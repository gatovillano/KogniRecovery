/**
 * Utility de encriptación para datos sensibles
 * Implements AES-256-GCM encryption for sensitive fields
 * KogniRecovery - Privacidad de datos estándar
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Obtiene la clave de encriptación desde las variables de entorno
 */
const getEncryptionKey = (): Buffer => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    // Derivar clave de la variable de entorno usando PBKDF2
    return crypto.pbkdf2Sync(key, 'kognirecovery-salt', ITERATIONS, KEY_LENGTH, 'sha512');
};

/**
 * Encripta un texto plano
 * @param text - Texto a encriptar
 * @returns Texto encriptado en formato base64 (iv:authTag:encrypted)
 */
export const encrypt = (text: string): string => {
    if (!text) {
        return text;
    }

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Formato: iv:authTag:encryptedData
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
};

/**
 * Desencripta un texto encriptado
 * @param encryptedText - Texto encriptado en formato base64
 * @returns Texto plano original
 */
export const decrypt = (encryptedText: string): string => {
    if (!encryptedText || !encryptedText.includes(':')) {
        return encryptedText;
    }

    try {
        const key = getEncryptionKey();
        const parts = encryptedText.split(':');

        if (parts.length !== 3) {
            return encryptedText;
        }

        const iv = Buffer.from(parts[0] || '', 'base64');
        const authTag = Buffer.from(parts[1] || '', 'base64');
        const encrypted = parts[2] || '';

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8') as string;

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
};

/**
 * Encripta un objeto con campos sensibles
 * @param obj - Objeto a encriptar
 * @param sensitiveFields - Array de nombres de campos sensibles
 * @returns Objeto con campos encriptados
 */
export const encryptFields = <T extends Record<string, unknown>>(
    obj: T,
    sensitiveFields: string[]
): T => {
    const result = { ...obj };

    for (const field of sensitiveFields) {
        if (result[field] && typeof result[field] === 'string') {
            (result as Record<string, unknown>)[field] = encrypt(result[field] as string);
        }
    }

    return result;
};

/**
 * Desencripta un objeto con campos encriptados
 * @param obj - Objeto con campos encriptados
 * @param sensitiveFields - Array de nombres de campos encriptados
 * @returns Objeto con campos desencriptados
 */
export const decryptFields = <T extends Record<string, unknown>>(
    obj: T,
    sensitiveFields: string[]
): T => {
    const result = { ...obj };

    for (const field of sensitiveFields) {
        if (result[field] && typeof result[field] === 'string') {
            try {
                (result as Record<string, unknown>)[field] = decrypt(result[field] as string);
            } catch {
                // Si no se puede desencriptar, dejar el valor original
            }
        }
    }

    return result;
};

/**
 * Genera un hash seguro de un valor
 * @param value - Valor a hashear
 * @returns Hash en formato hex
 */
export const hash = (value: string): string => {
    return crypto.createHash('sha256').update(value).digest('hex');
};

/**
 * Genera una clave aleatoria segura
 * @param length - Longitud de la clave
 * @returns Clave aleatoria en formato base64
 */
export const generateSecureKey = (length = 32): string => {
    return crypto.randomBytes(length).toString('base64');
};

/**
 * Encripta datos sensibles del usuario para almacenamiento
 */
export const encryptUserSensitiveData = (user: {
    phone?: string;
    llm_api_key?: string;
    two_factor_secret?: string;
}): {
    phone?: string;
    llm_api_key?: string;
    two_factor_secret?: string;
} => {
    const sensitiveFields = ['phone', 'llm_api_key', 'two_factor_secret'];
    const result: Record<string, string> = {};

    for (const field of sensitiveFields) {
        if (user[field as keyof typeof user]) {
            result[field] = encrypt(user[field as keyof typeof user]!);
        }
    }

    return result as { phone?: string; llm_api_key?: string; two_factor_secret?: string };
};

/**
 * Desencripta datos sensibles del usuario
 */
export const decryptUserSensitiveData = (user: {
    phone?: string;
    llm_api_key?: string;
    two_factor_secret?: string;
}): {
    phone?: string;
    llm_api_key?: string;
    two_factor_secret?: string;
} => {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(user)) {
        if (value) {
            try {
                result[key] = decrypt(value);
            } catch {
                result[key] = value; // Mantener valor original si no se puede desencriptar
            }
        }
    }

    return result as { phone?: string; llm_api_key?: string; two_factor_secret?: string };
};

export default {
    encrypt,
    decrypt,
    encryptFields,
    decryptFields,
    hash,
    generateSecureKey,
    encryptUserSensitiveData,
    decryptUserSensitiveData,
};
