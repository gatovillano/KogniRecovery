/**
 * Rutas principales de la API
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import checkinRoutes from './checkin.routes.js';
import cravingRoutes from './craving.routes.js';
import chatbotRoutes from './chatbot.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import familyRoutes from './family.routes.js';
import journalRoutes from './journal.routes.js';

// =====================================================
// API ROUTER
// =====================================================

const apiRouter = Router();

// =====================================================
// RUTAS V1
// =====================================================

/**
 * /api/v1/auth - Rutas de autenticación
 */
apiRouter.use('/auth', authRoutes);

/**
 * /api/v1/profiles - Rutas de perfiles de usuario
 */
apiRouter.use('/profiles', profileRoutes);

/**
 * /api/v1/checkins - Rutas de check-ins diarios
 */
apiRouter.use('/checkins', checkinRoutes);

/**
 * /api/v1/cravings - Rutas de cravings y estrategias
 */
apiRouter.use('/cravings', cravingRoutes);

/**
 * /api/v1/chatbot - Rutas del chatbot NADA
 */
apiRouter.use('/chatbot', chatbotRoutes);

/**
 * /api/v1/dashboard - Rutas del dashboard del paciente
 */
apiRouter.use('/dashboard', dashboardRoutes);

/**
 * /api/v1/family - Rutas del dashboard familiar
 */
apiRouter.use('/family', familyRoutes);

/**
 * /api/v1/journal - Bitácora modular
 */
apiRouter.use('/journal', journalRoutes);

export default apiRouter;
