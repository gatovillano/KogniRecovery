/**
 * Middleware de autenticación JWT
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { jwt as jwtConfig } from '../config/index.js';
import * as UserModel from '../models/user.model.js';

// =====================================================
// TIPOS
// =====================================================

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// =====================================================
// VERIFICAR TOKEN JWT
// =====================================================

/**
 * Middleware para verificar el token JWT de acceso
 * Expects: Authorization: Bearer <token>
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No se proporcionó token de autenticación',
        },
      });
      return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Formato de token inválido. Usa: Bearer <token>',
        },
      });
      return;
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, jwtConfig.secret!) as unknown as JwtPayload;
      
      // Verificar que el token tenga los campos requeridos
      if (!decoded.userId || !decoded.email || !decoded.role) {
        console.warn('⚠️ [Auth] Token inválido: campos requeridos faltantes:', decoded);
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Token inválido: campos requeridos faltantes',
          },
        });
        return;
      }

      // IMPORTANTE: Verificar que el usuario aún exista en la base de datos
      // Esto previene errores 500 por llaves foráneas inexistentes (ej: después de limpiar la DB)
      const userExists = await UserModel.findById(decoded.userId);
      if (!userExists) {
        console.warn(`⚠️ [Auth] Usuario ${decoded.userId} no encontrado en DB. Sesión inválida.`);
        res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Tu cuenta ya no está disponible. Por favor regístrate nuevamente.',
          },
        });
        return;
      }

      req.user = decoded;
      next();
    } catch (error) {
      console.error('❌ [Auth] JWT Verification Error:', error instanceof Error ? error.message : error);
      
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'El token de acceso ha expirado',
          },
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        console.error('❌ [Auth] Invalid Token Details:', error.message);
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Token de acceso inválido',
          },
        });
        return;
      }

      throw error;
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Error al verificar autenticación',
      },
    });
  }
};

// =====================================================
// VERIFICAR ROLES
// =====================================================

type UserRole = 'patient' | 'family' | 'professional' | 'admin';

/**
 * Middleware para verificar roles específicos
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Debes iniciar sesión para acceder a este recurso',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'No tienes permisos para acceder a este recurso',
        },
      });
      return;
    }

    next();
  };
};

// =====================================================
// VERIFICAR ESTADO DE CUENTA
// =====================================================

/**
 * Middleware para verificar que la cuenta esté activa
 */
export const requireActiveAccount = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Este middleware se puede extender para verificar
  // el estado de la cuenta en la base de datos
  // Por ahora, solo verifica que el usuario esté autenticado
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'NOT_AUTHENTICATED',
        message: 'Debes iniciar sesión para acceder a este recurso',
      },
    });
    return;
  }

  next();
};

// =====================================================
// GENERAR TOKEN DE ACCESO
// =====================================================

/**
 * Genera un token JWT de acceso
 */
export const generateAccessToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    jwtConfig.secret as string,
    { expiresIn: jwtConfig.expiresIn as any }
  );
};

/**
 * Genera un token JWT de refresh
 */
export const generateRefreshToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { 
      userId, 
      email, 
      role, 
      type: 'refresh',
      jti: uuidv4() // Asegurar unicidad incluso en el mismo segundo
    },
    jwtConfig.refreshSecret as string,
    { expiresIn: jwtConfig.refreshExpiresIn as any }
  );
};

/**
 * Verifica un refresh token
 */
export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, jwtConfig.refreshSecret) as JwtPayload;
  } catch {
    return null;
  }
};

export default {
  authenticate,
  authorize,
  requireActiveAccount,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};
