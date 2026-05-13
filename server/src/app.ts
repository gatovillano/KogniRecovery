/**
 * Configuración principal de Express
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import express, { Application, Request, Response } from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import apiRouter from './routes/index.js';
import { server as serverConfig, rateLimit as rateLimitConfig, isDevelopment } from './config/index.js';
import { securityMiddleware } from './middleware/security.js';
import rateLimit from 'express-rate-limit';

// =====================================================
// CREAR APP
// =====================================================

export const createApp = (): Application => {
  const app = express();

  // =====================================================
  // MIDDLEWARES DE SEGURIDAD (SEC-010 FIX: aplicar antes que rutas)
  // =====================================================

  // Helmet + HSTS + CSP + headers de seguridad HTTP
  app.use(securityMiddleware);

  // =====================================================
  // RATE LIMITING (SEC-011 FIX: montar en Express)
  // =====================================================

  // Rate limiter global
  const globalLimiter = rateLimit({
    windowMs: rateLimitConfig.windowMs,       // 15 min por defecto
    max: rateLimitConfig.maxRequests,          // 100 req/ventana por defecto
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
    },
  });

  // Rate limiter estricto para auth endpoints
  const authLimiter = rateLimit({
    windowMs: rateLimitConfig.authWindowMs,   // 1 min por defecto
    max: rateLimitConfig.authMax,              // 5 intentos por defecto
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Demasiados intentos de autenticación. Intenta en 1 minuto.',
    },
  });

  app.use(globalLimiter);
  app.use('/api/v1/auth', authLimiter);

  // =====================================================
  // MIDDLEWARES BÁSICOS
  // =====================================================

  // Body parser - JSON
  app.use(express.json({ limit: '10mb' }));

  // Body parser - URL encoded
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logger simple (nunca loguear body en producción)
  app.use((req, res, next) => {
    res.on('finish', () => {
      if (isDevelopment()) {
        console.log(`📡 ${req.method} ${req.originalUrl} - ${res.statusCode}`);
      }
    });
    next();
  });

  // CORS
  app.use(corsMiddleware);

  // =====================================================
  // RUTAS
  // =====================================================

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: serverConfig.nodeEnv,
        version: serverConfig.apiVersion,
      },
    });
  });

  // API Routes - /api/v1
  app.use('/api/v1', apiRouter);

  // =====================================================
  // MANEJO DE ERRORES
  // =====================================================

  // 404 - Rutas no encontradas
  app.use(notFoundHandler);

  // 500 - Error del servidor
  app.use(errorHandler);

  return app;
};

export default createApp();
