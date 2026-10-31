/**
 * Rutas de invitaciones para vincular pacientes/terapeutas
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as OrganizationController from '../controllers/organization.controller.js';

const router = Router();

router.use(authenticate);

// Estas rutas usan el controlador de organización (requiere permisos)
router.post('/patients', OrganizationController.linkPatient);
router.post('/therapists', OrganizationController.addMember);

export default router;
