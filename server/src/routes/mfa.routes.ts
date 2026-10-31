/**
 * Rutas de MFA (TOTP) para profesionales.
 * Requieren autenticación (JWT) porque operan sobre el propio usuario.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.use(authenticate);

router.post('/setup', authController.mfaSetup);
router.post('/verify', authController.mfaVerify);
router.post('/disable', authController.mfaDisable);

export default router;
