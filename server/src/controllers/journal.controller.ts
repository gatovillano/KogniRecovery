/**
 * Controlador de Bitácora (Journal) - KogniRecovery
 * Gestiona Notas, Hábitos, Entorno Social, Actividades y Análisis de Consumo
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as journal from '../models/journal.model.js';
import * as habitsModel from '../models/habit.model.js';

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

export const updateNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { id } = req.params;
    const { content, note_date } = req.body;
    if (!id || !content) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'ID y contenido requeridos' } }); return; }
    const note = await journal.updateDailyNote(id, userId, { content, note_date });
    if (!note) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Nota no encontrada' } }); return; }
    res.json({ success: true, data: note, message: 'Nota actualizada' });
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

export const updateHabit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { id } = req.params;
    const { protective_habits, risk_habits, entry_date } = req.body;
    if (!id) { res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requerido' } }); return; }
    const entry = await journal.updateHabitEntry(id, userId, { protective_habits: protective_habits || '', risk_habits: risk_habits || '', entry_date });
    if (!entry) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registro no encontrado' } }); return; }
    res.json({ success: true, data: entry, message: 'Registro de hábitos actualizado' });
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
// DEFINICIÓN DE HÁBITOS (NUEVO)
// =====================================================

export const getHabitDefinitions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const habits = await habitsModel.getUserHabits(userId);
    res.json({ success: true, data: habits });
  } catch (error) { next(error); }
};

export const createHabitDefinition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { name, description, icon, frequency, habit_type } = req.body;
    if (!name) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Nombre requerido' } }); return; }
    const habit = await habitsModel.createHabit(userId, { name, description, icon, frequency, habit_type });
    res.status(201).json({ success: true, data: habit });
  } catch (error) { next(error); }
};

export const updateHabitDefinition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { id } = req.params;
    if (typeof id !== 'string') { res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requerido' } }); return; }
    const habit = await habitsModel.updateHabit(id, userId, req.body);
    if (!habit) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Hábito no encontrado' } }); return; }
    res.json({ success: true, data: habit });
  } catch (error) { next(error); }
};

export const deleteHabitDefinition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { id } = req.params;
    if (typeof id !== 'string') { res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requerido' } }); return; }
    const deleted = await habitsModel.deleteHabit(id, userId);
    if (!deleted) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Hábito no encontrado' } }); return; }
    res.json({ success: true, message: 'Hábito eliminado' });
  } catch (error) { next(error); }
};

// =====================================================
// REGISTRO DE COMPLETITUD DE HÁBITOS
// =====================================================

export const getDailyHabitsStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { date } = req.query;
    const targetDate = String(date || new Date().toISOString().split('T')[0]);
    const habits = await habitsModel.getDailyHabitStatus(userId, targetDate);
    res.json({ success: true, data: habits });
  } catch (error) { next(error); }
};

export const toggleHabit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { habit_id, date } = req.body;
    if (!habit_id) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Habit ID requerido' } }); return; }
    const targetDate = String(date || new Date().toISOString().split('T')[0]);
    const result = await habitsModel.toggleHabitCompletion(String(habit_id), userId, targetDate);
    res.json({ success: true, data: result });
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

export const updateSocial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { id } = req.params;
    const { people_description, impact_assessment, entry_date } = req.body;
    if (!id) { res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requerido' } }); return; }
    const entry = await journal.updateSocialEntry(id, userId, { people_description: people_description || '', impact_assessment: impact_assessment || '', entry_date });
    if (!entry) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registro no encontrado' } }); return; }
    res.json({ success: true, data: entry, message: 'Entorno social actualizado' });
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

export const updateAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { id } = req.params;
    const { trigger_situation, action_taken, entry_date } = req.body;
    if (!id) { res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requerido' } }); return; }
    const entry = await journal.updateConsumptionAnalysis(id, userId, { trigger_situation: trigger_situation || '', action_taken: action_taken || '', entry_date });
    if (!entry) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registro no encontrado' } }); return; }
    res.json({ success: true, data: entry, message: 'Análisis actualizado' });
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

export const updateActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const { id } = req.params;
    const { activity_name, feeling_before, feeling_during, feeling_after, entry_date } = req.body;
    if (!id) { res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'ID requerido' } }); return; }
    const entry = await journal.updateActivityEntry(id, userId, { activity_name: activity_name || '', feeling_before: feeling_before || '', feeling_during: feeling_during || '', feeling_after: feeling_after || '', entry_date });
    if (!entry) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registro no encontrado' } }); return; }
    res.json({ success: true, data: entry, message: 'Actividad actualizada' });
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

export const getHabitStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) { unauthorized(res); return; }
    const days = parseInt(req.query.days as string) || 30;
    const stats = await habitsModel.getHabitStats(userId, days);
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
};
