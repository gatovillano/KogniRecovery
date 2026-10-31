/**
 * Rutas para manejo de consentimiento de datos clínicos del paciente
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as consentController from '../controllers/patientConsent.controller.js';

const router = Router();

// GET /api/v1/patient/consents -> lista los consentimientos del paciente
router.get('/consents', authenticate, consentController.listConsents);

// PUT /api/v1/patient/consents -> actualiza los consentimientos (lista de objetos)
router.put('/consents', authenticate, consentController.updateConsents);

export default router;
