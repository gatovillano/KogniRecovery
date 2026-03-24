/**
 * Rutas de Perfiles
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Router } from 'express';
import * as profileController from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de perfil
router.post('/', profileController.createProfile);
router.get('/me', profileController.getMyProfile);
router.put('/me', profileController.updateMyProfile);

// Rutas de configuración
router.get('/me/settings', profileController.getProfileSettings);
router.put('/me/settings', profileController.updateProfileSettings);
router.put('/me/ai-settings', profileController.updateAISettings);
router.get('/ai-models', profileController.getAIModels);

// Rutas de preferencias de sustancias
router.post('/me/substances', profileController.addSubstancePreference);
router.get('/me/substances', profileController.getSubstancePreferences);
router.put('/me/substances/:id', profileController.updateSubstancePreference);
router.delete('/me/substances/:id', profileController.deleteSubstancePreference);

// Ruta pública para determinar tipo de perfil
router.post('/determine-type', profileController.determineProfileType);

export default router;
