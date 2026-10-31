/**
 * Rutas de plataforma. Solo administradores de plataforma.
 */

import { Router } from 'express';
import * as controller from '../controllers/organization.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.post('/organizations', controller.createOrganization);
router.get('/organizations', controller.listOrganizations);
router.post('/organizations/:id/suspend', controller.suspendOrganization);

export default router;
