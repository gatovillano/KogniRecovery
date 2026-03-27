import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as consumptionController from '../controllers/consumption.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Registro básico y listado
router.post('/', consumptionController.addConsumption);
router.get('/', consumptionController.getConsumptions);

// Estadísticas de variación
router.get('/stats/weekly', consumptionController.getWeeklyVariation);
router.get('/stats/daily', consumptionController.getDailyVariation);

export default router;
