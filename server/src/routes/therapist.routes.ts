/**
 * Rutas del panel del terapeuta.
 * Todas requieren JWT y rol professional.
 */

import { Router } from 'express';
import * as controller from '../controllers/therapist.controller.js';
import * as alertsController from '../controllers/alerts.controller.js';
import * as notesController from '../controllers/notes.controller.js';
import * as invitationsController from '../controllers/invitations.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('professional'));

router.get('/patients', controller.listPatients);
router.get('/patients/:id/overview', controller.getPatientOverview);
router.get('/patients/:id/consent', controller.getPatientConsent);
router.get('/patients/:id/checkins', controller.getPatientCheckIns);
router.get('/patients/:id/cravings', controller.getPatientCravings);
router.get('/patients/:id/consumption', controller.getPatientConsumption);
router.get('/patients/:id/medications', controller.getPatientMedications);
router.get('/patients/:id/journal', controller.getPatientJournal);
router.get('/patients/:id/chatbot-summary', controller.getPatientChatbotSummary);
router.get('/patients/:id/alerts', alertsController.getPatientAlerts);
router.post('/alerts/:alertId/acknowledge', alertsController.acknowledgeAlertAction);
router.post('/alerts/:alertId/escalate', alertsController.escalateAlertAction);
router.post('/alerts/:alertId/close', alertsController.closeAlertAction);
router.get('/patients/:id/notes', notesController.getPatientNotes);
router.post('/patients/:id/notes', notesController.createNoteAction);
router.patch('/patients/:id/notes/:noteId', notesController.updateNoteAction);
router.delete('/patients/:id/notes/:noteId', notesController.deleteNoteAction);
router.post('/invitations/accept', invitationsController.acceptTherapistInvite);
router.get('/patients/:id/access-log', controller.getPatientAccessLog);

export default router;
