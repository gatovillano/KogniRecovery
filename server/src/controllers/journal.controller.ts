/**
 * Controlador de Bitácora (Journal) - KogniRecovery
 * Gestiona Notas, Hábitos, Entorno Social, Actividades y Análisis de Consumo
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as journal from '../models/journal.model.js';

const getUser = (req: Request) => (req as AuthRequest).user?.userId;

const unauthorized = (res: Response) => res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });

// =====================================================
// NOTAS DIARIAS
// =====================================================

export const createNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { content, note_date } = req.body;
    if (!content) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'El contenido es requerido' } }); return; }
    const note = await journal.createDailyNote(userId, { content, note_date });
    res.status(201).json({ success: true, data: note, message: 'Nota guardada' });
  } catch (error) { next(error); }
};

export const getNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const limit = parseInt(req.query.limit as string) || 20;
    const notes = await journal.getDailyNotes(userId, limit);
    res.json({ success: true, data: notes });
  } catch (error) { next(error); }
};

export const deleteNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { id } = req.params;
    if (!id) { res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requerido' } }); return; }
    const deleted = await journal.deleteDailyNote(id, userId);
    if (!deleted) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Nota no encontrada' } }); return; }
    res.json({ success: true, message: 'Nota eliminada' });
  } catch (error) { next(error); }
};

// =====================================================
// HÁBITOS
// =====================================================

export const createHabit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { protective_habits, risk_habits, entry_date } = req.body;
    const entry = await journal.createHabitEntry(userId, { protective_habits: protective_habits || '', risk_habits: risk_habits || '', entry_date });
    res.status(201).json({ success: true, data: entry, message: 'Registro de hábitos guardado' });
  } catch (error) { next(error); }
};

export const getHabits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const entries = await journal.getHabitEntries(userId, parseInt(req.query.limit as string) || 20);
    res.json({ success: true, data: entries });
  } catch (error) { next(error); }
};

export const deleteHabit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { id } = req.params;
    if (!id) { res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requerido' } }); return; }
    const deleted = await journal.deleteHabitEntry(id, userId);
    if (!deleted) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registro no encontrado' } }); return; }
    res.json({ success: true, message: 'Registro eliminado' });
  } catch (error) { next(error); }
};

// =====================================================
// ENTORNO SOCIAL
// =====================================================

export const createSocial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { people_description, impact_assessment, entry_date } = req.body;
    const entry = await journal.createSocialEntry(userId, { people_description: people_description || '', impact_assessment: impact_assessment || '', entry_date });
    res.status(201).json({ success: true, data: entry, message: 'Entorno social registrado' });
  } catch (error) { next(error); }
};

export const getSocial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const entries = await journal.getSocialEntries(userId, parseInt(req.query.limit as string) || 20);
    res.json({ success: true, data: entries });
  } catch (error) { next(error); }
};

export const deleteSocial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { id } = req.params;
    if (!id) { res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requerido' } }); return; }
    const deleted = await journal.deleteSocialEntry(id, userId);
    if (!deleted) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registro no encontrado' } }); return; }
    res.json({ success: true, message: 'Registro eliminado' });
  } catch (error) { next(error); }
};

// =====================================================
// ANÁLISIS DE CONSUMO
// =====================================================

export const createAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { trigger_situation, action_taken, entry_date } = req.body;
    const entry = await journal.createConsumptionAnalysis(userId, { trigger_situation: trigger_situation || '', action_taken: action_taken || '', entry_date });
    res.status(201).json({ success: true, data: entry, message: 'Análisis guardado' });
  } catch (error) { next(error); }
};

export const getAnalyses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const entries = await journal.getConsumptionAnalyses(userId, parseInt(req.query.limit as string) || 20);
    res.json({ success: true, data: entries });
  } catch (error) { next(error); }
};

export const deleteAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { id } = req.params;
    if (!id) { res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requerido' } }); return; }
    const deleted = await journal.deleteConsumptionAnalysis(id, userId);
    if (!deleted) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registro no encontrado' } }); return; }
    res.json({ success: true, message: 'Registro eliminado' });
  } catch (error) { next(error); }
};

// =====================================================
// ACTIVIDADES
// =====================================================

export const createActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { activity_name, feeling_before, feeling_during, feeling_after, entry_date } = req.body;
    const entry = await journal.createActivityEntry(userId, { activity_name: activity_name || '', feeling_before: feeling_before || '', feeling_during: feeling_during || '', feeling_after: feeling_after || '', entry_date });
    res.status(201).json({ success: true, data: entry, message: 'Actividad registrada' });
  } catch (error) { next(error); }
};

export const getActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const entries = await journal.getActivityEntries(userId, parseInt(req.query.limit as string) || 20);
    res.json({ success: true, data: entries });
  } catch (error) { next(error); }
};

export const deleteActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { id } = req.params;
    if (!id) { res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requerido' } }); return; }
    const deleted = await journal.deleteActivityEntry(id, userId);
    if (!deleted) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registro no encontrado' } }); return; }
    res.json({ success: true, message: 'Registro eliminado' });
  } catch (error) { next(error); }
};

// =====================================================
// FEED UNIFICADO
// =====================================================

export const getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const limit = parseInt(req.query.limit as string) || 30;
    const entries = await journal.getUnifiedFeed(userId, limit);
    res.json({ success: true, data: entries });
  } catch (error) { next(error); }
};
