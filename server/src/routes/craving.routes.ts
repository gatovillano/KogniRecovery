/**
 * Rutas de Cravings
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Router } from 'express';
import * as cravingController from '../controllers/craving.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de cravings
router.post('/', cravingController.createCraving);
router.get('/', cravingController.getCravings);
router.get('/active', cravingController.getActiveCravings);
router.get('/recent', cravingController.getRecentCravings);
router.get('/stats', cravingController.getCravingStats);
router.get('/patterns', cravingController.getCravingPatterns);
router.get('/:id', cravingController.getCravingById);
router.put('/:id/resolve', cravingController.resolveCraving);

// Rutas de estrategias
router.post('/strategies', cravingController.createStrategy);
router.get('/strategies', cravingController.getStrategies);
router.get('/strategies/category/:category', cravingController.getStrategiesByCategory);
router.put('/strategies/:id', cravingController.updateStrategy);
router.delete('/strategies/:id', cravingController.deleteStrategy);
router.post('/strategies/:id/use', cravingController.recordStrategyUsage);

// Rutas de desencadenantes
router.get('/triggers', cravingController.getTriggers);
router.post('/triggers', cravingController.createTrigger);

export default router;
