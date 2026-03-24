/**
 * Rutas de Bitácora (Journal) - KogniRecovery
 * /api/v1/journal/...
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as journalController from '../controllers/journal.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// --- Notas Diarias ---
router.post('/notes', journalController.createNote);
router.get('/notes', journalController.getNotes);
router.delete('/notes/:id', journalController.deleteNote);

// --- Hábitos ---
router.post('/habits', journalController.createHabit);
router.get('/habits', journalController.getHabits);
router.delete('/habits/:id', journalController.deleteHabit);

// --- Entorno Social ---
router.post('/social', journalController.createSocial);
router.get('/social', journalController.getSocial);
router.delete('/social/:id', journalController.deleteSocial);

// --- Análisis de Consumo ---
router.post('/analysis', journalController.createAnalysis);
router.get('/analysis', journalController.getAnalyses);
router.delete('/analysis/:id', journalController.deleteAnalysis);

// --- Actividades ---
router.post('/activities', journalController.createActivity);
router.get('/activities', journalController.getActivities);
router.delete('/activities/:id', journalController.deleteActivity);

// --- Feed Unificado ---
router.get('/feed', journalController.getFeed);

export default router;
