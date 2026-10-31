/**
 * Rutas del paciente: vínculos, consentimiento y transparencia.
 */

import { Router } from 'express';
import * as controller from '../controllers/patient.controller.js';
import * as invitationsController from '../controllers/invitations.controller.js';
import * as rightsController from '../controllers/rights.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('patient'));

router.get('/care-links', controller.getCareLinks);
router.get('/invitations/pending', invitationsController.pendingInvites);
router.post('/invitations/accept', invitationsController.acceptInvite);
router.post('/invitations/:id/accept', invitationsController.acceptInviteById);
router.get('/sharing-consents', controller.listSharingConsents);
router.post('/sharing-consents', controller.grantSharingConsent);
router.put('/sharing-consents/:id', controller.updateSharingConsent);
router.delete('/sharing-consents/:id', controller.revokeSharingConsent);
router.get('/consent-history', controller.getConsentHistory);
router.get('/access-log', controller.getAccessLog);
router.get('/consent-catalog', controller.getConsentCatalog);
router.get('/data-export', rightsController.exportPatientData);
router.post('/data-deletion', rightsController.createDeletionRequest);
router.get('/data-deletion', rightsController.listMyDeletionRequests);
router.get('/notifications', rightsController.listNotifications);
router.post('/notifications/:id/read', rightsController.markNotificationRead);

export default router;
