/**
 * Middleware de CORS (Cross-Origin Resource Sharing)
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Request, Response, NextFunction } from 'express';
import { cors as corsConfig, getCorsOrigins } from '../config/index.js';

// =====================================================
// INTERFACES
// =====================================================

export interface CorsOptions {
  origin: string | string[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge?: number;
}

// =====================================================
// CONFIGURAR CORS
// =====================================================

/**
 * Obtiene las opciones de CORS configuradas
 */
export const getCorsOptions = (): CorsOptions => {
  const origins = getCorsOrigins();

  return {
    origin: origins.length > 0 ? origins : '*',
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.allowedHeaders,
    credentials: corsConfig.credentials,
    maxAge: 86400, // 24 horas
  };
};

// =====================================================
// MIDDLEWARE CORS
// =====================================================

/**
 * Middleware de CORS personalizado
 * Maneja preflight requests y headers de CORS
 */
export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const options = getCorsOptions();
  const origin = req.headers.origin;

  // Determinar origen permitido
  let allowedOrigin: string | boolean = false;

  if (Array.isArray(options.origin)) {
    // Si el arreglo contiene '*', permitimos el origen de la petición
    if (options.origin.includes('*')) {
      allowedOrigin = origin || '*';
    } else {
      allowedOrigin = origin && options.origin.includes(origin) ? origin : false;
    }
  } else if (options.origin === '*') {
    // Si es '*', permitimos cualquier origen devolviendo el origen de la petición
    // Esto es necesario cuando credentials es true
    allowedOrigin = origin || '*';
  } else {
    allowedOrigin = origin && options.origin.includes(origin) ? origin : false;
  }

  // Establecer headers de CORS
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin as string);
  }

  // No permitir '*' con credentials: true (los navegadores y fetch lo bloquean)
  if (options.credentials && allowedOrigin !== '*') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // Si el origen es '*', desactivamos credenciales para evitar el error de red
    res.setHeader('Access-Control-Allow-Credentials', 'false');
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    options.methods.join(', ')
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    options.allowedHeaders.join(', ')
  );

  if (options.maxAge) {
    res.setHeader('Access-Control-Max-Age', options.maxAge.toString());
  }

  // Manejar preflight request
  if (req.method === 'OPTIONS') {
    // Verificar que el método esté permitido
    const requestMethod = req.headers['access-control-request-method'];

    if (requestMethod && !options.methods.includes(requestMethod.toUpperCase())) {
      res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Método ${requestMethod} no permitido`,
        },
      });
      return;
    }

    res.status(204).end();
    return;
  }

  next();
};

// =====================================================
// EXPORTAR TODO
// =====================================================

export default {
  corsMiddleware,
  getCorsOptions,
};
