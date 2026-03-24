/**
 * Modelo de Check-ins Diarios
 * Consultas SQL para la tabla checkins
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { query } from '../config/database.js';

// =====================================================
// INTERFACES
// =====================================================

export interface CheckIn {
  id: string;
  user_id: string;
  checkin_type: string;
  mood_score?: number;
  anxiety_score?: number;
  energy_score?: number;
  emotional_tags?: string[];
  consumed_substances?: any[];
  risk_situation?: boolean;
  risk_description?: string;
  coping_strategy_used?: string;
  sleep_hours?: number;
  sleep_quality?: number;
  exercised_today?: boolean;
  exercise_minutes?: number;
  exercise_type?: string;
  activities?: any[];
  social_interaction?: string;
  notes?: string;
  location?: any;
  checkin_date: Date;
  checkin_time: Date;
  completed_at: Date;
  is_completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MoodHistory {
  id: string;
  user_id: string;
  mood_date: Date;
  mood_score?: number;
  anxiety_score?: number;
  energy_score?: number;
  emotional_tags?: string[];
  weekly_average_mood?: number;
  weekly_average_anxiety?: number;
  weekly_average_energy?: number;
  mood_trend?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CheckInGoal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  frequency: string;
  status: string;
  start_date: Date;
  end_date?: Date;
  completed_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CheckInStreak {
  id: string;
  user_id: string;
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  last_completion_date?: Date;
  streak_start_date?: Date;
  longest_streak_start_date?: Date;
  longest_streak_end_date?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// CHECK-INS
// =====================================================

/**
 * Crear un nuevo check-in
 */
export const createCheckIn = async (userId: string, data: Partial<CheckIn>): Promise<CheckIn> => {
  const sql = `
    INSERT INTO checkins (user_id, checkin_type, mood_score, anxiety_score, energy_score,
      emotional_tags, consumed_substances, risk_situation, risk_description, coping_strategy_used,
      sleep_hours, sleep_quality, exercised_today, exercise_minutes, exercise_type,
      activities, social_interaction, notes, location, checkin_date, checkin_time)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    RETURNING *`;
  
  const values = [
    userId,
    data.checkin_type || 'diario',
    data.mood_score || null,
    data.anxiety_score || null,
    data.energy_score || null,
    data.emotional_tags || [],
    JSON.stringify(data.consumed_substances || []),
    data.risk_situation || false,
    data.risk_description || null,
    data.coping_strategy_used || null,
    data.sleep_hours || null,
    data.sleep_quality || null,
    data.exercised_today || false,
    data.exercise_minutes || null,
    data.exercise_type || null,
    JSON.stringify(data.activities || []),
    data.social_interaction || 'ninguna',
    data.notes || null,
    data.location ? JSON.stringify(data.location) : null,
    data.checkin_date || new Date().toISOString().split('T')[0],
    data.checkin_time || new Date().toTimeString().split(' ')[0]
  ];

  const result = await query(sql, values);
  
  // Actualizar streak después de crear check-in
  await updateStreak(userId, 'checkin_completed');
  
  return result.rows[0] as CheckIn;
};

/**
 * Obtener check-in por ID
 */
export const getCheckInById = async (id: string): Promise<CheckIn | null> => {
  const sql = `SELECT * FROM checkins WHERE id = $1`;
  const result = await query(sql, [id]);
  return (result.rows[0] as CheckIn) || null;
};

/**
 * Obtener check-in por fecha específica
 */
export const getCheckInByDate = async (userId: string, date: string): Promise<CheckIn | null> => {
  const sql = `SELECT * FROM checkins WHERE user_id = $1 AND checkin_date = $2`;
  const result = await query(sql, [userId, date]);
  return (result.rows[0] as CheckIn) || null;
};

/**
 * Obtener check-in del día actual
 */
export const getTodayCheckIn = async (userId: string): Promise<CheckIn | null> => {
  const today = new Date().toISOString().split('T')[0];
  return getCheckInByDate(userId, today as string);
};

/**
 * Obtener check-ins por rango de fechas
 */
export const getCheckInsByDateRange = async (
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<CheckIn[]> => {
  const sql = `
    SELECT * FROM checkins 
    WHERE user_id = $1 AND checkin_date >= $2 AND checkin_date <= $3
    ORDER BY checkin_date DESC`;
  const result = await query(sql, [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);
  return result.rows as CheckIn[];
};

/**
 * Obtener check-ins del usuario
 */
export const getUserCheckIns = async (
  userId: string, 
  page = 1, 
  limit = 30
): Promise<{ checkIns: CheckIn[], total: number }> => {
  const offset = (page - 1) * limit;
  
  const countSql = `SELECT COUNT(*) as total FROM checkins WHERE user_id = $1`;
  const countResult = await query(countSql, [userId]);
  const total = parseInt((countResult.rows[0] as any).total);

  const sql = `
    SELECT * FROM checkins 
    WHERE user_id = $1 
    ORDER BY checkin_date DESC, checkin_time DESC 
    LIMIT $2 OFFSET $3`;
  const result = await query(sql, [userId, limit, offset]);

  return { checkIns: result.rows as CheckIn[], total };
};

/**
 * Actualizar check-in
 */
export const updateCheckIn = async (id: string, data: Partial<CheckIn>): Promise<CheckIn | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'mood_score', 'anxiety_score', 'energy_score', 'emotional_tags',
    'consumed_substances', 'risk_situation', 'risk_description', 'coping_strategy_used',
    'sleep_hours', 'sleep_quality', 'exercised_today', 'exercise_minutes', 'exercise_type',
    'activities', 'social_interaction', 'notes', 'location', 'is_completed'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      if (key === 'consumed_substances' || key === 'activities' || key === 'location') {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE checkins SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  const result = await query(sql, values);
  return (result.rows[0] as CheckIn) || null;
};

/**
 * Eliminar check-in
 */
export const deleteCheckIn = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM checkins WHERE id = $1`;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// HISTORIAL DE MOOD
// =====================================================

/**
 * Crear entrada de historial de mood
 */
export const createMoodHistory = async (userId: string, data: Partial<MoodHistory>): Promise<MoodHistory> => {
  const sql = `
    INSERT INTO mood_history (user_id, mood_score, anxiety_score, energy_score, emotional_tags)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, mood_date) 
    DO UPDATE SET 
      mood_score = COALESCE(EXCLUDED.mood_score, mood_history.mood_score),
      anxiety_score = COALESCE(EXCLUDED.anxiety_score, mood_history.anxiety_score),
      energy_score = COALESCE(EXCLUDED.energy_score, mood_history.energy_score),
      emotional_tags = COALESCE(EXCLUDED.emotional_tags, mood_history.emotional_tags),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`;
  
  const values = [
    userId,
    data.mood_score || null,
    data.anxiety_score || null,
    data.energy_score || null,
    data.emotional_tags || []
  ];

  const result = await query(sql, values);
  
  // Calcular promedios semanales
  await calculateWeeklyAverages(userId);
  
  return result.rows[0] as unknown as MoodHistory;
};

/**
 * Obtener historial de mood
 */
export const getMoodHistory = async (
  userId: string, 
  days = 30
): Promise<MoodHistory[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const sql = `
    SELECT * FROM mood_history 
    WHERE user_id = $1 AND mood_date >= $2
    ORDER BY mood_date DESC`;
  const result = await query(sql, [userId, startDate.toISOString().split('T')[0]]);
  return result.rows as MoodHistory[];
};

/**
 * Calcular promedios semanales
 */
const calculateWeeklyAverages = async (userId: string): Promise<void> => {
  const sql = `
    WITH weekly_data AS (
      SELECT 
        AVG(mood_score) as avg_mood,
        AVG(anxiety_score) as avg_anxiety,
        AVG(energy_score) as avg_energy
      FROM mood_history
      WHERE user_id = $1 
        AND mood_date >= CURRENT_DATE - INTERVAL '7 days'
    )
    UPDATE mood_history
    SET 
      weekly_average_mood = (SELECT avg_mood FROM weekly_data),
      weekly_average_anxiety = (SELECT avg_anxiety FROM weekly_data),
      weekly_average_energy = (SELECT avg_energy FROM weekly_data)
    WHERE user_id = $1 AND mood_date = CURRENT_DATE`;
  
  await query(sql, [userId]);
};

// =====================================================
// STREAKS (RACHAS)
// =====================================================

/**
 * Obtener streak del usuario
 */
export const getUserStreak = async (userId: string, streakType: string): Promise<CheckInStreak | null> => {
  const sql = `SELECT * FROM checkin_streaks WHERE user_id = $1 AND streak_type = $2`;
  const result = await query(sql, [userId, streakType]);
  return (result.rows[0] as CheckInStreak) || null;
};

/**
 * Obtener todos los streaks del usuario
 */
export const getUserStreaks = async (userId: string): Promise<CheckInStreak[]> => {
  const sql = `SELECT * FROM checkin_streaks WHERE user_id = $1 AND is_active = true`;
  const result = await query(sql, [userId]);
  return result.rows as CheckInStreak[];
};

/**
 * Actualizar streak
 */
const updateStreak = async (userId: string, streakType: string): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  
  // Verificar si ya se completó hoy
  const existing = await getUserStreak(userId, streakType);
  
  if (existing && existing.last_completion_date === today) {
    return; // Ya se contó hoy
  }

  if (existing) {
    // Verificar si es continuación de racha
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (existing.last_completion_date === yesterdayStr) {
      // Continuar racha
      const newStreak = existing.current_streak + 1;
      const sql = `
        UPDATE checkin_streaks 
        SET current_streak = $1, 
            last_completion_date = $2,
            streak_start_date = CASE WHEN current_streak = 0 THEN $2 ELSE streak_start_date END,
            total_completions = total_completions + 1,
            longest_streak = CASE WHEN $1 > longest_streak THEN $1 ELSE longest_streak END
        WHERE id = $3`;
      await query(sql, [newStreak, today, existing.id]);
    } else {
      // Reiniciar racha
      const sql = `
        UPDATE checkin_streaks 
        SET current_streak = 1, 
            last_completion_date = $1,
            streak_start_date = $1,
            total_completions = total_completions + 1
        WHERE id = $2`;
      await query(sql, [today, existing.id]);
    }
  } else {
    // Crear nuevo streak
    const sql = `
      INSERT INTO checkin_streaks (user_id, streak_type, current_streak, longest_streak, 
        total_completions, last_completion_date, streak_start_date, longest_streak_start_date)
      VALUES ($1, $2, 1, 1, 1, $3, $3, $3)`;
    await query(sql, [userId, streakType, today]);
  }
};

/**
 * Reiniciar streak
 */
export const resetStreak = async (userId: string, streakType: string): Promise<boolean> => {
  const sql = `
    UPDATE checkin_streaks 
    SET current_streak = 0, last_completion_date = NULL, streak_start_date = NULL
    WHERE user_id = $1 AND streak_type = $2`;
  const result = await query(sql, [userId, streakType]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// ESTADÍSTICAS
// =====================================================

/**
 * Obtener estadísticas de check-ins
 */
export const getCheckInStats = async (userId: string, days = 30): Promise<{
  totalCheckIns: number;
  averageMood: number;
  averageAnxiety: number;
  averageEnergy: number;
  averageSleep: number;
  exerciseDays: number;
  riskSituations: number;
}> => {
  const sql = `
    SELECT 
      COUNT(*) as total_checkins,
      AVG(mood_score) as avg_mood,
      AVG(anxiety_score) as avg_anxiety,
      AVG(energy_score) as avg_energy,
      AVG(sleep_hours) as avg_sleep,
      SUM(CASE WHEN exercised_today = true THEN 1 ELSE 0 END) as exercise_days,
      SUM(CASE WHEN risk_situation = true OR (consumed_substances IS NOT NULL AND jsonb_array_length(consumed_substances) > 0) THEN 1 ELSE 0 END) as risk_situations
    FROM checkins
    WHERE user_id = $1 AND checkin_date >= CURRENT_DATE - ($2 * INTERVAL '1 day')`;
  
  const result = await query(sql, [userId, days]);
  const row = result.rows[0] as any;
  
  return {
    totalCheckIns: parseInt(row.total_checkins) || 0,
    averageMood: parseFloat(row.avg_mood) || 0,
    averageAnxiety: parseFloat(row.avg_anxiety) || 0,
    averageEnergy: parseFloat(row.avg_energy) || 0,
    averageSleep: parseFloat(row.avg_sleep) || 0,
    exerciseDays: parseInt(row.exercise_days) || 0,
    riskSituations: parseInt(row.risk_situations) || 0
  };
};
