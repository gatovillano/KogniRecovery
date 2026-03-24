/**
 * Rutas de Familia
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/v1/family/dashboard
 * Obtener dashboard del familiar
 */
router.get('/dashboard', async (req, res, next) => {
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

    // Verificar que el usuario es familiar
    if (authReq.user?.role !== 'family') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Acceso denegado' }
      });
      return;
    }

    // Obtener pacientes relacionados
    const patientsSql = `
      SELECT DISTINCT u.id, u.name, u.email, u.status, 
             u.risk_level, u.profile_type, u.onboarding_completed
      FROM users u
      LEFT JOIN sharing_invitations si ON si.patient_id = u.id AND si.family_id = $1 AND si.status = 'accepted'
      LEFT JOIN emergency_contacts ec ON ec.user_id = u.id AND ec.contact_user_id = $1
      WHERE si.id IS NOT NULL OR ec.id IS NOT NULL
      ORDER BY u.name ASC
    `;

    const patientsResult = await query(patientsSql, [userId]);
    const patients = patientsResult.rows;

    // Para cada paciente, obtener datos resumidos
    const patientsWithData = await Promise.all(
      patients.map(async (patient: any) => {
        // Obtener último check-in
        const checkinSql = `
          SELECT mood_score, anxiety_score, energy_score, checkin_date, emotional_tags
          FROM checkins
          WHERE user_id = $1
          ORDER BY checkin_date DESC
          LIMIT 1
        `;
        const checkinResult = await query(checkinSql, [patient.id]);
        const lastCheckIn = checkinResult.rows[0];

        // Obtener rachas
        const streaksSql = `
          SELECT streak_type, current_streak, longest_streak
          FROM checkin_streaks
          WHERE user_id = $1
        `;
        const streaksResult = await query(streaksSql, [patient.id]);

        // Obtener cravings recientes
        const cravingsSql = `
          SELECT COUNT(*) as count
          FROM cravings
          WHERE user_id = $1 
            AND status = 'active'
            AND craving_start_time >= CURRENT_DATE - INTERVAL '7 days'
        `;
        const cravingsResult = await query(cravingsSql, [patient.id]);

        return {
          ...patient,
          last_checkin: lastCheckIn,
          streaks: streaksResult.rows,
          active_cravings: parseInt((cravingsResult.rows[0] as any).count) || 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        patients: patientsWithData,
        total_patients: patientsWithData.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/family/patients/:patientId/progress
 * Obtener progreso de un paciente específico
 */
router.get('/patients/:patientId/progress', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const authReq = req as any;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    // Verificar que el familiar tiene acceso al paciente
    const accessSql = `
      SELECT 1 FROM sharing_invitations
      WHERE patient_id = $1 AND family_id = $2 AND status = 'accepted'
      UNION
      SELECT 1 FROM emergency_contacts
      WHERE user_id = $1 AND contact_user_id = $2
    `;
    const accessResult = await query(accessSql, [patientId, userId]);

    if (accessResult.rows.length === 0) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No tienes acceso a este paciente' }
      });
      return;
    }

    // Obtener datos del paciente
    const patientSql = `SELECT id, name, email, profile_type, risk_level FROM users WHERE id = $1`;
    const patientResult = await query(patientSql, [patientId]);
    const patient = patientResult.rows[0];

    // Obtener estadísticas de 30 días
    const statsSql = `
      SELECT 
        COUNT(*) as total_checkins,
        AVG(mood_score) as avg_mood,
        AVG(anxiety_score) as avg_anxiety,
        SUM(CASE WHEN exercised_today = true THEN 1 ELSE 0 END) as exercise_days
      FROM checkins
      WHERE user_id = $1 AND checkin_date >= CURRENT_DATE - INTERVAL '30 days'
    `;
    const statsResult = await query(statsSql, [patientId]);

    // Obtener rachas
    const streaksSql = `SELECT * FROM checkin_streaks WHERE user_id = $1`;
    const streaksResult = await query(streaksSql, [patientId]);

    // Obtener cravings últimos 30 días
    const cravingsSql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'resisted' THEN 1 ELSE 0 END) as resisted,
        SUM(CASE WHEN status = 'surrendered' THEN 1 ELSE 0 END) as surrendered
      FROM cravings
      WHERE user_id = $1 AND craving_start_time >= CURRENT_DATE - INTERVAL '30 days'
    `;
    const cravingsResult = await query(cravingsSql, [patientId]);

    // Obtener último check-in
    const lastCheckinSql = `SELECT * FROM checkins WHERE user_id = $1 ORDER BY checkin_date DESC LIMIT 1`;
    const lastCheckinResult = await query(lastCheckinSql, [patientId]);

    res.json({
      success: true,
      data: {
        patient,
        stats: statsResult.rows[0],
        streaks: streaksResult.rows,
        cravings: cravingsResult.rows[0],
        last_checkin: lastCheckinResult.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/family/patients/:patientId/checkins
 * Obtener check-ins del paciente
 */
router.get('/patients/:patientId/checkins', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const authReq = req as any;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    // Verificar acceso
    const accessSql = `
      SELECT 1 FROM sharing_invitations
      WHERE patient_id = $1 AND family_id = $2 AND status = 'accepted'
      UNION
      SELECT 1 FROM emergency_contacts
      WHERE user_id = $1 AND contact_user_id = $2
    `;
    const accessResult = await query(accessSql, [patientId, userId]);

    if (accessResult.rows.length === 0) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No tienes acceso a este paciente' }
      });
      return;
    }

    // Obtener check-ins (últimos 30 días por defecto) - SOLO CAMPOS PÚBLICOS
    const limit = parseInt(req.query.limit as string) || 30;
    const checkinsSql = `
      SELECT id, user_id, checkin_date, mood_score, anxiety_score, energy_score, 
             emotional_tags, exercised_today, slept_well, meditated_today
      FROM checkins
      WHERE user_id = $1
      ORDER BY checkin_date DESC
      LIMIT $2
    `;
    const checkinsResult = await query(checkinsSql, [patientId, limit]);

    res.json({
      success: true,
      data: checkinsResult.rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/family/patients/:patientId/message
 * Enviar mensaje de apoyo al paciente
 */
router.post('/patients/:patientId/message', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const authReq = req as any;
    const userId = authReq.user?.userId;
    const { message } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    if (!message) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Mensaje requerido' }
      });
      return;
    }

    // Verificar acceso
    const accessSql = `
      SELECT 1 FROM sharing_invitations
      WHERE patient_id = $1 AND family_id = $2 AND status = 'accepted'
    `;
    const accessResult = await query(accessSql, [patientId, userId]);

    if (accessResult.rows.length === 0) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No tienes acceso a este paciente' }
      });
      return;
    }

    // Crear mensaje en la pared
    const wallSql = `
      INSERT INTO wall_messages (patient_id, family_id, sender_id, message, emoji)
      VALUES ($1, $1, $2, $3, $4)
    `;
    // Nota: El family_id en wall_messages es para identificar qué vínculo familiar lo envió. 
    // Por simplicidad, usamos patient_id si no hay una tabla de vínculos específica además de invitaciones. 
    // Pero mejor buscar la invitación aceptada para obtener el vínculo correcto si es necesario.
    // Usaremos el userId del remitente como sender_id y family_id por ahora.
    await query(wallSql, [patientId, userId, message, req.body.emoji || null]);

    // Crear notificación para el paciente
    const notificationSql = `
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES ($1, 'family_message', 'Mensaje de tu familiar', $2, $3)
    `;
    await query(notificationSql, [patientId, message, JSON.stringify({ from_family_id: userId })]);

    res.json({
      success: true,
      message: 'Mensaje enviado'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
