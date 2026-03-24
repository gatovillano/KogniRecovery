/**
 * Configuración principal de Express
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import express, { Application, Request, Response } from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import apiRouter from './routes/index.js';
import { server as serverConfig, isDevelopment } from './config/index.js';

// =====================================================
// CREAR APP
// =====================================================

export const createApp = (): Application => {
  const app = express();

  // =====================================================
  // MIDDLEWARES BÁSICOS
  // =====================================================

  // Body parser - JSON
  app.use(express.json({ limit: '10mb' }));

  // Body parser - URL encoded
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logger simple
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
