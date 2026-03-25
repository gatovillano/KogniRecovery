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
router.patch('/notes/:id', journalController.updateNote);
router.get('/notes', journalController.getNotes);
router.delete('/notes/:id', journalController.deleteNote);

// --- Hábitos ---
router.post('/habits', journalController.createHabit);
router.patch('/habits/:id', journalController.updateHabit);
router.get('/habits', journalController.getHabits);
router.delete('/habits/:id', journalController.deleteHabit);

// --- Definición y Completitud de Hábitos (Nuevos) ---
router.get('/habits/list', journalController.getHabitDefinitions);
router.post('/habits/definition', journalController.createHabitDefinition);
router.patch('/habits/definition/:id', journalController.updateHabitDefinition);
router.delete('/habits/definition/:id', journalController.deleteHabitDefinition);
router.get('/habits/status', journalController.getDailyHabitsStatus);
router.post('/habits/toggle', journalController.toggleHabit);
router.get('/habits/stats', journalController.getHabitStats);

// --- Entorno Social ---
router.post('/social', journalController.createSocial);
router.patch('/social/:id', journalController.updateSocial);
router.get('/social', journalController.getSocial);
router.delete('/social/:id', journalController.deleteSocial);

// --- Análisis de Consumo ---
router.post('/analysis', journalController.createAnalysis);
router.patch('/analysis/:id', journalController.updateAnalysis);
router.get('/analysis', journalController.getAnalyses);
router.delete('/analysis/:id', journalController.deleteAnalysis);

// --- Actividades ---
router.post('/activities', journalController.createActivity);
router.patch('/activities/:id', journalController.updateActivity);
router.get('/activities', journalController.getActivities);
router.delete('/activities/:id', journalController.deleteActivity);

// --- Feed Unificado ---
router.get('/feed', journalController.getFeed);

export default router;
