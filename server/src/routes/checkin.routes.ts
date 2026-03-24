/**
 * Rutas de Check-ins
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Router } from 'express';
import * as checkinController from '../controllers/checkin.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de check-ins
router.post('/', checkinController.createCheckIn);
router.get('/today', checkinController.getTodayCheckIn);
router.get('/', checkinController.getCheckIns);
router.get('/range', checkinController.getCheckInsByDateRange);
router.get('/stats', checkinController.getCheckInStats);
router.get('/streaks', checkinController.getStreaks);
router.get('/mood-history', checkinController.getMoodHistory);
router.get('/:id', checkinController.getCheckInById);
router.put('/:id', checkinController.updateCheckIn);
router.delete('/:id', checkinController.deleteCheckIn);

// Rutas de rachas
router.post('/streaks/reset', checkinController.resetStreak);

export default router;
