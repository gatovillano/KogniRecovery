/**
 * Controlador de autenticación
 * Maneja las solicitudes HTTP relacionadas con autenticación
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import * as UserModel from '../models/user.model.js';
import { AuthRequest } from '../middleware/auth.js';
import * as MfaService from '../services/mfa.service.js';

// =====================================================
// REGISTRO
// =====================================================

/**
 * POST /api/v1/auth/register
 * Registra un nuevo usuario
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, firstName, lastName, role, phone } = req.body;

    // Construir name si no viene pero vienen firstName/lastName
    const fullName = name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '');

    const result = await authService.register({
      email,
      password,
      name: fullName,
      role,
      phone,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Usuario registrado exitosamente',
    });
  } catch (error) {
    const err = error as Error & { statusCode?: number };

    // Manejar errores específicos
    if (err.statusCode) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.statusCode === 409 ? 'EMAIL_ALREADY_EXISTS' : 'VALIDATION_ERROR',
          message: err.message,
        },
      });
      return;
    }

    next(error);
  }
};

// =====================================================
// LOGIN
// =====================================================

/**
 * POST /api/v1/auth/login
 * Inicia sesión con email y contraseña
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Inicio de sesión exitoso',
    });
  } catch (error) {
    const err = error as Error & { statusCode?: number };

    if (err.statusCode) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.statusCode === 401 ? 'INVALID_CREDENTIALS' : 'ACCOUNT_ERROR',
          message: err.message,
        },
      });
      return;
    }

    next(error);
  }
};

// =====================================================
// LOGIN CON MFA
// =====================================================

/**
 * POST /api/v1/auth/mfa/verify
 * Segundo paso de autenticación para usuarios con MFA activo.
 * Recibe el challenge emitido en login y el código TOTP.
 */
export const loginMfaVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { challenge, code } = req.body;

    if (!challenge || !code) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'challenge y code son obligatorios',
        },
      });
      return;
    }

    const result = await authService.verifyMfaAndLogin({ challenge, code });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Inicio de sesión exitoso',
    });
  } catch (error) {
    const err = error as Error & { statusCode?: number };

    if (err.statusCode) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.statusCode === 401 ? 'INVALID_MFA_CODE' : 'ACCOUNT_ERROR',
          message: err.message,
        },
      });
      return;
    }

    next(error);
  }
};

// =====================================================
// MFA: SETUP
// =====================================================

/**
 * POST /api/v1/mfa/setup
 * Genera un secreto TOTP para el usuario autenticado.
 * El secreto se devuelve una sola vez para escanear el QR.
 */
export const mfaSetup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No autenticado' },
      });
      return;
    }

    const { secret, otpauthUrl } = await MfaService.provisionMfa(userId);

    res.json({
      success: true,
      data: {
        secret,
        otpauth_url: otpauthUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/mfa/verify
 * Verifica el primer código y activa el MFA.
 */
export const mfaVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No autenticado' },
      });
      return;
    }

    const { token, secret } = req.body;
    if (!token || !secret) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'token y secret son obligatorios',
        },
      });
      return;
    }

    const result = await MfaService.enableMfa(userId, secret, token);

    res.json({
      success: true,
      data: result,
      message: 'MFA activado correctamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/mfa/disable
 * Desactiva el MFA verificando el código actual.
 */
export const mfaDisable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No autenticado' },
      });
      return;
    }

    const { token } = req.body;
    if (!token) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'token es obligatorio',
        },
      });
      return;
    }

    const result = await MfaService.disableMfa(userId, token);

    res.json({
      success: true,
      data: result,
      message: 'MFA desactivado',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// REFRESH TOKEN
// =====================================================

/**
 * POST /api/v1/auth/refresh
 * Refresca los tokens de acceso usando el refresh token
 */
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_REQUIRED',
          message: 'El refresh token es requerido',
        },
      });
      return;
    }

    const result = await authService.refreshTokens(refreshToken);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Tokens refrescados exitosamente',
    });
  } catch (error) {
    const err = error as Error & { statusCode?: number };

    if (err.statusCode) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: err.message,
        },
      });
      return;
    }

    next(error);
  }
};

// =====================================================
// LOGOUT
// =====================================================

/**
 * POST /api/v1/auth/logout
 * Cierra sesión revocando el refresh token
 */
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { refreshToken } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Debes iniciar sesión para cerrar sesión',
        },
      });
      return;
    }

    await authService.logout(userId, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// OBTENER SESIONES ACTIVAS
// =====================================================

/**
 * GET /api/v1/auth/sessions
 * Obtiene las sesiones activas del usuario
 */
export const getSessions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Debes iniciar sesión',
        },
      });
      return;
    }

    const sessions = await authService.getActiveSessions(userId);

    res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};

export const verify = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
       res.status(401).json({
        success: false,
        valid: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        valid: false,
        error: { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' }
      });
      return;
    }

    res.status(200).json({
      success: true,
      valid: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        llm_provider: user.llm_provider,
        llm_model: user.llm_model,
        onboarding_completed: user.onboarding_completed,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  refresh,
  logout,
  getSessions,
  verify,
};
