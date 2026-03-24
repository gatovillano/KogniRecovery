/**
 * Middleware de manejo de errores
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { isDevelopment } from '../config/index.js';

// =====================================================
// INTERFACES
// =====================================================

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

// =====================================================
// CREAR ERROR
// =====================================================

/**
 * Crea un error de aplicación
 */
export const createError = (
  message: string,
  statusCode: number,
  code?: string
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code || `ERROR_${statusCode}`;
  error.isOperational = true;
  return error;
};

// =====================================================
// MIDDLEWARE DE ERROR
// =====================================================

/**
 * Manejador de errores centralizado
 */
export const errorHandler: ErrorRequestHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.isOperational 
    ? err.message 
    : 'Error interno del servidor';

  // Log del error
  if (isDevelopment()) {
    console.error('❌ Error:', {
      path: req.path,
      method: req.method,
      statusCode,
      code,
      message: err.message,
      stack: err.stack,
    });
  } else {
    console.error('❌ Error:', {
      path: req.path,
      method: req.method,
      statusCode,
      code,
      message: err.message,
    });
  }

  // Responder con el error
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(isDevelopment() && { stack: err.stack }),
    },
  });
};

// =====================================================
// MANEJO DE ERRORES 404
// =====================================================

/**
 * Middleware para rutas no encontradas
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    },
  });
};

// =====================================================
// MANEJO DE PROMESAS RECHAZADAS
// =====================================================

/**
 * Middleware para manejar promesas rechazadas (async errors)
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// =====================================================
// ERRORES PREDEFINIDOS
// =====================================================

export const BadRequestError = (message = 'Solicitud inválida') => 
  createError(message, 400, 'BAD_REQUEST');

export const UnauthorizedError = (message = 'No autorizado') => 
  createError(message, 401, 'UNAUTHORIZED');

export const ForbiddenError = (message = 'Acceso denegado') => 
  createError(message, 403, 'FORBIDDEN');

export const NotFoundError = (message = 'Recurso no encontrado') => 
  createError(message, 404, 'NOT_FOUND');

export const ConflictError = (message = 'Conflicto de datos') => 
  createError(message, 409, 'CONFLICT');

export const ValidationError = (message = 'Error de validación') => 
  createError(message, 422, 'VALIDATION_ERROR');

export const InternalServerError = (message = 'Error interno del servidor') => 
  createError(message, 500, 'INTERNAL_ERROR');

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
};
