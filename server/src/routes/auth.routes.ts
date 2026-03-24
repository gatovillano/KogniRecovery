/**
 * Rutas de autenticación
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  logoutValidation,
  validate,
} from '../middleware/validation.js';

const router = Router();

// =====================================================
// RUTAS PÚBLICAS
// =====================================================

/**
 * POST /api/v1/auth/register
 * Registra un nuevo usuario
 * Público - No requiere autenticación
 */
router.post(
  '/register',
  registerValidation,
  validate,
  authController.register
);

/**
 * POST /api/v1/auth/login
 * Inicia sesión con email y contraseña
 * Público - No requiere autenticación
 */
router.post(
  '/login',
  loginValidation,
  validate,
  authController.login
);

/**
 * POST /api/v1/auth/refresh
 * Refresca los tokens de acceso
 * Público - No requiere autenticación
 */
router.post(
  '/refresh',
  refreshTokenValidation,
  validate,
  authController.refresh
);

// =====================================================
// RUTAS PROTEGIDAS
// =====================================================

/**
 * POST /api/v1/auth/logout
 * Cierra la sesión actual
 * Requiere autenticación
 */
router.post(
  '/logout',
  authenticate,
  logoutValidation,
  validate,
  authController.logout
);

/**
 * GET /api/v1/auth/sessions
 * Obtiene las sesiones activas del usuario
 * Requiere autenticación
 */
router.get(
  '/sessions',
  authenticate,
  authController.getSessions
);

/**
 * GET /api/v1/auth/verify
 * Verifica si el token de acceso actual es válido
 * Requiere autenticación
 */
router.get(
  '/verify',
  authenticate,
  authController.verify
);

export default router;
