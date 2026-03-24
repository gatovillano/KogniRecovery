/**
 * Rutas de Dashboard
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as checkinModel from '../models/checkin.model.js';
import * as cravingModel from '../models/craving.model.js';
import * as profileModel from '../models/profile.model.js';
import * as notificationModel from '../models/notification.model.js';
import * as wallModel from '../models/wall.model.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/v1/dashboard
 * Obtener datos del dashboard del paciente
 */
router.get('/', async (req, res, next) => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    // Obtener perfil
    const profile = await profileModel.getProfileByUserId(userId);

    // Obtener último check-in
    const todayCheckIn = await checkinModel.getTodayCheckIn(userId);

    // Obtener rachas
    const streaks = await checkinModel.getUserStreaks(userId);

    // Obtener estadísticas de check-ins
    const checkinStats = await checkinModel.getCheckInStats(userId, 30);

    // Obtener cravings activos
    const activeCravings = await cravingModel.getActiveCravings(userId);

    // Obtener estadísticas de cravings
    const cravingStats = await cravingModel.getCravingStats(userId, 30);

    // Obtener mensajes de la pared
    const wallMessages = await wallModel.getLatestWallMessages(userId, 3);

    // Contar notificaciones no leídas
    const unreadNotificationsCount = await notificationModel.countUnreadNotifications(userId);

    res.json({
      success: true,
      data: {
        profile,
        today_checkin: todayCheckIn,
        streaks,
        checkin_stats: checkinStats,
        active_cravings: activeCravings,
        craving_stats: cravingStats,
        wall_messages: wallMessages,
        unread_notifications_count: unreadNotificationsCount
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/overview
 * Obtener resumen del dashboard
 */
router.get('/overview', async (req, res, next) => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const todayCheckIn = await checkinModel.getTodayCheckIn(userId);
    const streaks = await checkinModel.getUserStreaks(userId);
    const activeCravings = await cravingModel.getActiveCravings(userId);

    res.json({
      success: true,
      data: {
        has_checked_in_today: !!todayCheckIn,
        current_streak: streaks.find(s => s.streak_type === 'checkin_completed')?.current_streak || 0,
        active_cravings_count: activeCravings.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/emotions
 * Obtener datos emocionales para gráfico
 */
router.get('/emotions', async (req, res, next) => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const days = parseInt(req.query.days as string) || 30;
    const moodHistory = await checkinModel.getMoodHistory(userId, days);

    res.json({
      success: true,
      data: moodHistory
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/progress
 * Obtener progreso del paciente
 */
router.get('/progress', async (req, res, next) => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const checkinStats = await checkinModel.getCheckInStats(userId, 30);
    const cravingStats = await cravingModel.getCravingStats(userId, 30);
    const streaks = await checkinModel.getUserStreaks(userId);

    res.json({
      success: true,
      data: {
        checkin_completion_rate: checkinStats.totalCheckIns / 30,
        cravings_resisted_rate: cravingStats.totalCravings > 0 
          ? (cravingStats.resistedCravings + cravingStats.managedCravings) / cravingStats.totalCravings 
          : 1,
        current_streak: streaks.find(s => s.streak_type === 'checkin_completed')?.current_streak || 0,
        average_mood: checkinStats.averageMood,
        average_anxiety: checkinStats.averageAnxiety
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
