/**
 * Controlador de Check-ins
 * Maneja las solicitudes HTTP relacionadas con check-ins diarios
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Request, Response, NextFunction } from 'express';
import * as checkinModel from '../models/checkin.model.js';
import { AuthRequest } from '../middleware/auth.js';

// =====================================================
// CREAR CHECK-IN
// =====================================================

/**
 * POST /api/v1/checkins
 * Crear un nuevo check-in
 */
export const createCheckIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    // Verificar si ya hay un check-in para la fecha proporcionada
    const checkinDate = req.body.checkin_date || new Date().toISOString().split('T')[0];
    const existingCheckIn = await checkinModel.getCheckInByDate(userId, checkinDate);
    
    if (existingCheckIn) {
      // Actualizar check-in existente
      const updated = await checkinModel.updateCheckIn(existingCheckIn.id, req.body);
      res.json({
        success: true,
        data: updated,
        message: 'Check-in actualizado'
      });
      return;
    }

    const checkIn = await checkinModel.createCheckIn(userId, req.body);

    // Registrar en historial de mood si hay datos emocionales
    if (req.body.mood_score || req.body.anxiety_score || req.body.energy_score) {
      await checkinModel.createMoodHistory(userId, {
        mood_score: req.body.mood_score,
        anxiety_score: req.body.anxiety_score,
        energy_score: req.body.energy_score,
        emotional_tags: req.body.emotional_tags
      });
    }

    res.status(201).json({
      success: true,
      data: checkIn,
      message: 'Check-in creado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// OBTENER CHECK-INS
// =====================================================

/**
 * GET /api/v1/checkins/today
 * Obtener check-in del día actual
 */
export const getTodayCheckIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const checkIn = await checkinModel.getCheckInByDate(userId, date);

    res.json({
      success: true,
      data: checkIn
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/checkins
 * Obtener check-ins del usuario
 */
export const getCheckIns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;

    const { checkIns, total } = await checkinModel.getUserCheckIns(userId, page, limit);

    res.json({
      success: true,
      data: {
        checkIns,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/checkins/range
 * Obtener check-ins por rango de fechas
 */
export const getCheckInsByDateRange = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Fechas de inicio y fin requeridas' }
      });
      return;
    }

    const startDate = new Date(start_date as string);
    const endDate = new Date(end_date as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Fechas inválidas' }
      });
      return;
    }

    const checkIns = await checkinModel.getCheckInsByDateRange(userId, startDate, endDate);

    res.json({
      success: true,
      data: checkIns
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/checkins/:id
 * Obtener un check-in específico
 */
export const getCheckInById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const checkIn = await checkinModel.getCheckInById(id);

    if (!checkIn) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Check-in no encontrado' }
      });
      return;
    }

    res.json({
      success: true,
      data: checkIn
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ACTUALIZAR CHECK-IN
// =====================================================

/**
 * PUT /api/v1/checkins/:id
 * Actualizar un check-in
 */
export const updateCheckIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const checkIn = await checkinModel.updateCheckIn(id, req.body);

    if (!checkIn) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Check-in no encontrado' }
      });
      return;
    }

    res.json({
      success: true,
      data: checkIn,
      message: 'Check-in actualizado'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ELIMINAR CHECK-IN
// =====================================================

/**
 * DELETE /api/v1/checkins/:id
 * Eliminar un check-in
 */
export const deleteCheckIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const deleted = await checkinModel.deleteCheckIn(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Check-in no encontrado' }
      });
      return;
    }

    res.json({
      success: true,
      message: 'Check-in eliminado'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// RACHAS (STREAKS)
// =====================================================

/**
 * GET /api/v1/checkins/streaks
 * Obtener rachas del usuario
 */
export const getStreaks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId || ''; // Fallback for userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const streaks = await checkinModel.getUserStreaks(userId);

    res.json({
      success: true,
      data: streaks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/checkins/streaks/reset
 * Reiniciar una racha
 */
export const resetStreak = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId || ''; // Fallback for userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const { streak_type } = req.body;
    
    if (!streak_type) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Tipo de racha requerido' }
      });
      return;
    }

    await checkinModel.resetStreak(userId, streak_type);

    res.json({
      success: true,
      message: 'Racha reiniciada'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ESTADÍSTICAS
// =====================================================

/**
 * GET /api/v1/checkins/stats
 * Obtener estadísticas de check-ins
 */
export const getCheckInStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId || ''; // Fallback for userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const days = parseInt(req.query.days as string) || 30;
    const stats = await checkinModel.getCheckInStats(userId, days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// HISTORIAL DE MOOD
// =====================================================

/**
 * GET /api/v1/checkins/mood-history
 * Obtener historial de mood
 */
export const getMoodHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId || ''; // Fallback for userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const days = parseInt(req.query.days as string) || 30;
    const history = await checkinModel.getMoodHistory(userId, days);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};
