/**
 * Middleware de validación de solicitudes
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from './error.js';

// =====================================================
// INTERFACES
// =====================================================

export interface ValidationErrorItem {
  field: string;
  message: string;
  value?: unknown;
}

// =====================================================
// VALIDAR SOLICITUD
// =====================================================

/**
 * Middleware para validar una lista de validaciones
 * Debe ejecutarse después de definir las validaciones con express-validator
 */
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: ValidationErrorItem[] = errors.array().map((error) => {
      // express-validator puede devolver diferentes tipos de errores
      const err = error as { path?: string; msg?: string; value?: unknown };
      return {
        field: err.path || 'unknown',
        message: err.msg || 'Error de validación',
        value: err.value,
      };
    });

    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Error de validación en los datos enviados',
        details: formattedErrors,
      },
    });
    return;
  }

  next();
};

// =====================================================
// VALIDADORES COMUNES
// =====================================================

import { body, param, query } from 'express-validator';

/**
 * Validaciones para registro de usuario
 */
export const registerValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido')
    .bail()
    .isLength({ max: 255 })
    .withMessage('El email no puede exceder 255 caracteres'),

  body('password')
    .isString()
    .withMessage('La contraseña debe ser una cadena de texto')
    .bail()
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .bail()
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe contener al menos una letra mayúscula')
    .bail()
    .matches(/[a-z]/)
    .withMessage('La contraseña debe contener al menos una letra minúscula')
    .bail()
    .matches(/[0-9]/)
    .withMessage('La contraseña debe contener al menos un número')
    .bail()
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('La contraseña debe contener al menos un carácter especial'),

  body('name')
    .optional()
    .isString()
    .withMessage('El nombre debe ser una cadena de texto')
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .bail()
    .trim()
    .escape(),

  body('firstName')
    .if(body('name').not().exists())
    .notEmpty()
    .withMessage('El nombre es requerido si no se proporciona el nombre completo')
    .isString()
    .withMessage('El nombre debe ser texto'),

  body('lastName')
    .if(body('name').not().exists())
    .notEmpty()
    .withMessage('El apellido es requerido si no se proporciona el nombre completo')
    .isString()
    .withMessage('El apellido debe ser texto'),

  body('role')
    .optional()
    .isIn(['patient', 'family', 'professional'])
    .withMessage('El rol debe ser: patient, family o professional'),
];

/**
 * Validaciones para inicio de sesión
 */
export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido')
    .bail()
    .isLength({ max: 255 })
    .withMessage('El email no puede exceder 255 caracteres'),

  body('password')
    .isString()
    .withMessage('La contraseña es requerida')
    .bail()
    .notEmpty()
    .withMessage('La contraseña no puede estar vacía'),
];

/**
 * Validaciones para refresh token
 */
export const refreshTokenValidation: ValidationChain[] = [
  body('refreshToken')
    .isString()
    .withMessage('El refresh token es requerido')
    .bail()
    .notEmpty()
    .withMessage('El refresh token no puede estar vacío'),
];

/**
 * Validaciones para logout
 */
export const logoutValidation: ValidationChain[] = [
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('El refresh token debe ser una cadena de texto'),
];

/**
 * Validaciones para ID de parámetro
 */
export const idParamValidation: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('El ID debe ser un UUID válido'),
];

/**
 * Validaciones para paginación
 */
export const paginationValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
];

// =====================================================
// EXPORTAR
// =====================================================

export default {
  validate,
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  logoutValidation,
  idParamValidation,
  paginationValidation,
};
