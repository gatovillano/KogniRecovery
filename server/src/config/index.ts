/**
 * Configuración centralizada del servidor
 * Carga variables de entorno y las expone de forma tipada
 */

import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
const envPath = path.resolve(process.cwd(), '.env');
console.log(`🔍 Intentando cargar .env desde: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Error al cargar .env:', result.error);
} else {
  console.log('✅ Archivo .env cargado exitosamente');
}

// =====================================================
// INTERFACES DE CONFIGURACIÓN
// =====================================================

export interface ServerConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  apiUrl: string;
  apiVersion: string;
}

export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
  poolIdleTimeout: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface AuthConfig {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecial: boolean;
  maxLoginAttempts: number;
  loginLockoutDuration: number;
  tokenRotationEnabled: boolean;
}

export interface CorsConfig {
  origin: string;
  originWeb: string;
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  authMax: number;
  authWindowMs: number;
}

export interface LoggingConfig {
  level: string;
  filePath: string;
}

export interface AppConfig {
  name: string;
  url: string;
  supportEmail: string;
  emergencyPhone: string;
}

// =====================================================
// CONFIGURACIÓN PRINCIPAL
// =====================================================

const getRequired = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getOptional = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

const getOptionalNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

const getOptionalBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  return value ? value === 'true' : defaultValue;
};

// =====================================================
// EXPORTAR CONFIGURACIÓN
// =====================================================

export const server: ServerConfig = {
  nodeEnv: getOptional('NODE_ENV', 'development') as ServerConfig['nodeEnv'],
  port: getOptionalNumber('PORT', 3003),
  apiUrl: getOptional('API_URL', 'http://localhost:3003'),
  apiVersion: getOptional('API_VERSION', 'v1'),
};

export const database: DatabaseConfig = {
  url: getRequired('DATABASE_URL'),
  poolMin: getOptionalNumber('DB_POOL_MIN', 2),
  poolMax: getOptionalNumber('DB_POOL_MAX', 10),
  poolIdleTimeout: getOptionalNumber('DB_POOL_IDLE_TIMEOUT', 30000),
};

export const jwt: JwtConfig = {
  secret: getRequired('JWT_SECRET'),
  expiresIn: getOptional('JWT_EXPIRES_IN', '15m'),
  refreshSecret: getRequired('JWT_REFRESH_SECRET'),
  refreshExpiresIn: getOptional('JWT_REFRESH_EXPIRES_IN', '30d'),
};

export const auth: AuthConfig = {
  passwordMinLength: getOptionalNumber('PASSWORD_MIN_LENGTH', 8),
  passwordRequireUppercase: getOptionalBoolean('PASSWORD_REQUIRE_UPPERCASE', true),
  passwordRequireLowercase: getOptionalBoolean('PASSWORD_REQUIRE_LOWERCASE', true),
  passwordRequireNumber: getOptionalBoolean('PASSWORD_REQUIRE_NUMBER', true),
  passwordRequireSpecial: getOptionalBoolean('PASSWORD_REQUIRE_SPECIAL', true),
  maxLoginAttempts: getOptionalNumber('MAX_LOGIN_ATTEMPTS', 5),
  loginLockoutDuration: getOptionalNumber('LOGIN_LOCKOUT_DURATION', 15),
  tokenRotationEnabled: getOptionalBoolean('TOKEN_ROTATION_ENABLED', true),
};

export const cors: CorsConfig = {
  origin: getOptional('CORS_ORIGIN', 'http://localhost:8081'),
  originWeb: getOptional('CORS_ORIGIN_WEB', 'http://localhost:19006'),
  methods: getOptional('CORS_METHODS', 'GET,POST,PUT,DELETE,OPTIONS,PATCH').split(','),
  allowedHeaders: getOptional('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization,X-Requested-With').split(','),
  credentials: getOptionalBoolean('CORS_CREDENTIALS', true),
};

export const rateLimit: RateLimitConfig = {
  windowMs: getOptionalNumber('RATE_LIMIT_WINDOW_MS', 900000),
  maxRequests: getOptionalNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  authMax: getOptionalNumber('AUTH_RATE_LIMIT_MAX', 5),
  authWindowMs: getOptionalNumber('AUTH_RATE_LIMIT_WINDOW_MS', 60000),
};

export const logging: LoggingConfig = {
  level: getOptional('LOG_LEVEL', 'debug'),
  filePath: getOptional('LOG_FILE_PATH', './logs/app.log'),
};

export const app: AppConfig = {
  name: getOptional('APP_NAME', 'KogniRecovery'),
  url: getOptional('APP_URL', 'http://localhost:19006'),
  supportEmail: getOptional('SUPPORT_EMAIL', 'soporte@kognirecovery.com'),
  emergencyPhone: getOptional('EMERGENCY_PHONE', '911'),
};

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Obtiene los orígenes de CORS permitidos
 */
export const getCorsOrigins = (): string[] => {
  return [cors.origin, cors.originWeb].filter(Boolean);
};

/**
 * Verifica si estamos en modo desarrollo
 */
export const isDevelopment = (): boolean => {
  return server.nodeEnv === 'development';
};

/**
 * Verifica si estamos en modo producción
 */
export const isProduction = (): boolean => {
  return server.nodeEnv === 'production';
};

export default {
  server,
  database,
  jwt,
  auth,
  cors,
  rateLimit,
  logging,
  app,
  getCorsOrigins,
  isDevelopment,
  isProduction,
};
