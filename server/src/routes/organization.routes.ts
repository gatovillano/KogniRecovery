/**
 * Rutas administrativas del centro de salud mental.
 * Nunca exponen contenido clínico.
 */

import { Router } from 'express';
import * as controller from '../controllers/organization.controller.js';
import * as alertsController from '../controllers/alerts.controller.js';
import * as invitationsController from '../controllers/invitations.controller.js';
import * as credentialsController from '../controllers/credentials.controller.js';
import * as rightsController from '../controllers/rights.controller.js';
import * as llmController from '../controllers/llm.controller.js';
import * as ttsController from '../controllers/tts.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('professional', 'admin'));

router.get('/members', controller.listMembers);
router.post('/members', controller.addMember);
router.patch('/members/:id', controller.suspendMember);

router.get('/patients', controller.listPatients);
router.post('/patients/link', controller.linkPatient);
router.post('/patients/invite', invitationsController.createPatientInvite);
router.get('/patients/invites', invitationsController.listInvites);
router.delete('/patients/invites/:id', invitationsController.revokeInvite);
router.post('/therapists/invite', invitationsController.createTherapistInvite);
router.get('/therapists/invites', invitationsController.listTherapistInvites);
router.delete('/therapists/invites/:id', invitationsController.revokeTherapistInvite);

router.post('/assignments', controller.createAssignment);
router.delete('/assignments/:id', controller.endAssignment);

router.get('/audit', controller.getAudit);
router.post('/alerts/evaluate', alertsController.evaluateOrgAlerts);
router.post('/credentials', credentialsController.upsertCredential);
router.get('/credentials', credentialsController.listCredentials);
router.post('/credentials/:id/verify', credentialsController.decideCredential);
router.get('/data-deletion', rightsController.listOrgDeletionRequests);
router.post('/data-deletion/:id/review', rightsController.reviewDeletionRequest);
router.get('/llm-settings', llmController.getLlmSettings);
router.put('/llm-settings', llmController.saveLlmSettings);
router.post('/llm/models', llmController.listModels);
router.get('/tts-settings', ttsController.getTtsSettings);
router.put('/tts-settings', ttsController.saveTtsSettings);
router.post('/tts/test', ttsController.testTts);

export default router;
