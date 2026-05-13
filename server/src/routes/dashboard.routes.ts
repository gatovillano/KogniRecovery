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
import { langGraphAgent } from '../services/langgraph.service.js';
import UserModel from '../models/user.model.js';

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
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' },
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
    const cravingStats = await cravingModel.getCravingStats(userId);

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
        unread_notifications_count: unreadNotificationsCount,
      },
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
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' },
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
        current_streak:
          streaks.find((s) => s.streak_type === 'checkin_completed')?.current_streak || 0,
        active_cravings_count: activeCravings.length,
      },
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
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' },
      });
      return;
    }

    const days = parseInt(req.query.days as string) || 30;
    const moodHistory = await checkinModel.getMoodHistory(userId, days);

    res.json({
      success: true,
      data: moodHistory,
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
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' },
      });
      return;
    }

    const checkinStats = await checkinModel.getCheckInStats(userId, 30);
    const cravingStats = await cravingModel.getCravingStats(userId);
    const streaks = await checkinModel.getUserStreaks(userId);

    res.json({
      success: true,
      data: {
        checkin_completion_rate: checkinStats.totalCheckIns / 30,
        cravings_resisted_rate:
          cravingStats.totalCravings > 0
            ? (cravingStats.resistedCravings + cravingStats.managedCravings) /
              cravingStats.totalCravings
            : 1,
        current_streak:
          streaks.find((s) => s.streak_type === 'checkin_completed')?.current_streak || 0,
        average_mood: checkinStats.averageMood,
        average_anxiety: checkinStats.averageAnxiety,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/greeting
 * Streaming de mensaje motivacional por LÚA (SSE)
 */
router.get('/greeting', async (req, res) => {
  const authReq = req as any;
  const userId = authReq.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'No autenticado' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const user = await UserModel.findById(userId);
    const profile = await profileModel.getProfileByUserId(userId);
    const streaks = await checkinModel.getUserStreaks(userId);
    const todayCheckIn = await checkinModel.getTodayCheckIn(userId);
    const last7DaysStats = await checkinModel.getCheckInStats(userId, 7);

    const streak = streaks.find((s) => s.streak_type === 'checkin_completed')?.current_streak || 0;
    const name = profile?.display_name || user?.name || 'amigo';
    const checkedInToday = !!todayCheckIn;
    const moodAvg = last7DaysStats.averageMood || 0;
    const substance = profile?.primary_substance || 'tu proceso';

    // Determinar momento del día
    const hour = new Date().getHours();
    let timeOfDay = 'día';
    if (hour >= 5 && hour < 12) timeOfDay = 'mañana';
    else if (hour >= 12 && hour < 19) timeOfDay = 'tarde';
    else timeOfDay = 'noche';

    const prompt = `Eres LÚA, una asistente de apoyo emocional empática y humana en la app KogniRecovery.
Tu objetivo es dar un saludo de bienvenida que se sienta ÚNICO, PERSONAL y NO GENÉRICO.

DATOS DEL USUARIO:
- Nombre: ${name}
- Racha: ${streak} días de libertad
- Sustancia principal: ${substance}
- Estado de ánimo promedio (últimos 7 días): ${moodAvg.toFixed(1)}/10
- Momento del día: ${timeOfDay}
- ¿Hizo check-in hoy?: ${checkedInToday ? 'Sí' : 'No'}

REGLAS PARA EL MENSAJE:
1. Variedad: No uses siempre la misma estructura. A veces sé más poética, otras más directa como un coach, otras más cálida como una amiga.
2. Personalización: Si el ánimo promedio es bajo (< 5), sé más compasiva. Si es alto (> 8), celebra su bienestar.
3. Menciona la racha de ${streak} días de forma natural, no como una estadística fría.
4. Si no hizo check-in hoy, invítalo a compartir cómo se siente por esta ${timeOfDay} de forma suave.
5. Usa máximo 40 palabras.
6. NO uses emojis. NO uses markdown.
7. Empieza con su nombre ${name}, sin decir "Hola".
8. Evita frases cliché como "Cada día es una oportunidad". Sé más específica sobre su fuerza y su proceso con ${substance}.`;

    const llm = await langGraphAgent.getUserLLM(userId);

    const stream = await llm.stream([
      { role: 'system', content: prompt },
      { role: 'user', content: `Es por la ${timeOfDay}. Dame un saludo que me sorprenda y me motive.` },
    ]);

    for await (const chunk of stream) {
      const text = chunk.content;
      if (text) {
        res.write(`data: ${JSON.stringify({ type: 'token', content: text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('❌ Error en greeting:', err);
    res.write(
      `data: ${JSON.stringify({ type: 'token', content: 'Tu camino es valioso y cada paso cuenta. Estoy aquí contigo.' })}\n\n`
    );
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

export default router;
