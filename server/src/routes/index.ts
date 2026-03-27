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
import medicationRoutes from './medication.routes.js';
import privacyRoutes from './privacy.routes.js';
import substanceExpenseRoutes from './substance_expense.routes.js';
import consumptionRoutes from './consumption.routes.js';
import substanceDoseRoutes from './substance_dose.routes.js';
import noteRoutes from './note.routes.js';

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

/**
 * /api/v1/medications - Rutas de medicamentos
 */
apiRouter.use('/medications', medicationRoutes);

/**
 * /api/v1/privacy - Rutas de privacidad (GDPR/CCPA)
 */
apiRouter.use('/privacy', privacyRoutes);

/**
 * /api/v1/substance-expenses - Rutas de gastos económicos en sustancias
 */
apiRouter.use('/substance-expenses', substanceExpenseRoutes);

/**
 * /api/v1/consumption - Rutas de registro detallado de consumo
 */
apiRouter.use('/consumption', consumptionRoutes);

/**
 * /api/v1/substance-doses - Rutas de registro individual de dosis
 */
apiRouter.use('/substance-doses', substanceDoseRoutes);

/**
 * /api/v1/notes - Notas del usuario y del agente
 */
apiRouter.use('/notes', noteRoutes);

export default apiRouter;
