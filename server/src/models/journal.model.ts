/**
 * Modelo de Bitácora (Journal) - KogniRecovery
 * Entidades independientes: Notas, Hábitos, Entorno Social, Análisis de Consumo
 */

import { query } from '../config/database.js';

// =====================================================
// INTERFACES
// =====================================================

export interface DailyNote {
  id: string;
  user_id: string;
  content: string;
  note_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface HabitEntry {
  id: string;
  user_id: string;
  protective_habits: string;
  risk_habits: string;
  entry_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SocialEntry {
  id: string;
  user_id: string;
  people_description: string;
  impact_assessment: string;
  entry_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ConsumptionAnalysis {
  id: string;
  user_id: string;
  trigger_situation: string;
  action_taken: string;
  entry_date: Date;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// NOTAS DIARIAS
// =====================================================

export const createDailyNote = async (userId: string, data: { content: string; note_date?: string }): Promise<DailyNote> => {
  const sql = `
    INSERT INTO daily_notes (user_id, content, note_date)
    VALUES ($1, $2, $3)
    RETURNING *`;
  const result = await query(sql, [userId, data.content, data.note_date || new Date().toISOString().split('T')[0]]);
  return result.rows[0] as DailyNote;
};

export const getDailyNotes = async (userId: string, limit = 20): Promise<DailyNote[]> => {
  const sql = `SELECT * FROM daily_notes WHERE user_id = $1 ORDER BY note_date DESC, created_at DESC LIMIT $2`;
  const result = await query(sql, [userId, limit]);
  return result.rows as DailyNote[];
};

export const deleteDailyNote = async (id: string, userId: string): Promise<boolean> => {
  const result = await query(`DELETE FROM daily_notes WHERE id = $1 AND user_id = $2`, [id, userId]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// HÁBITOS
// =====================================================

export const createHabitEntry = async (userId: string, data: { protective_habits: string; risk_habits: string; entry_date?: string }): Promise<HabitEntry> => {
  const sql = `
    INSERT INTO habit_entries (user_id, protective_habits, risk_habits, entry_date)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
  const result = await query(sql, [userId, data.protective_habits, data.risk_habits, data.entry_date || new Date().toISOString().split('T')[0]]);
  return result.rows[0] as HabitEntry;
};

export const getHabitEntries = async (userId: string, limit = 20): Promise<HabitEntry[]> => {
  const sql = `SELECT * FROM habit_entries WHERE user_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT $2`;
  const result = await query(sql, [userId, limit]);
  return result.rows as HabitEntry[];
};

export const deleteHabitEntry = async (id: string, userId: string): Promise<boolean> => {
  const result = await query(`DELETE FROM habit_entries WHERE id = $1 AND user_id = $2`, [id, userId]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// ENTORNO SOCIAL
// =====================================================

export const createSocialEntry = async (userId: string, data: { people_description: string; impact_assessment: string; entry_date?: string }): Promise<SocialEntry> => {
  const sql = `
    INSERT INTO social_entries (user_id, people_description, impact_assessment, entry_date)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
  const result = await query(sql, [userId, data.people_description, data.impact_assessment, data.entry_date || new Date().toISOString().split('T')[0]]);
  return result.rows[0] as SocialEntry;
};

export const getSocialEntries = async (userId: string, limit = 20): Promise<SocialEntry[]> => {
  const sql = `SELECT * FROM social_entries WHERE user_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT $2`;
  const result = await query(sql, [userId, limit]);
  return result.rows as SocialEntry[];
};

export const deleteSocialEntry = async (id: string, userId: string): Promise<boolean> => {
  const result = await query(`DELETE FROM social_entries WHERE id = $1 AND user_id = $2`, [id, userId]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// ANÁLISIS DE CONSUMO / IMPULSO
// =====================================================

export const createConsumptionAnalysis = async (userId: string, data: { trigger_situation: string; action_taken: string; entry_date?: string }): Promise<ConsumptionAnalysis> => {
  const sql = `
    INSERT INTO consumption_analysis (user_id, trigger_situation, action_taken, entry_date)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
  const result = await query(sql, [userId, data.trigger_situation, data.action_taken, data.entry_date || new Date().toISOString().split('T')[0]]);
  return result.rows[0] as ConsumptionAnalysis;
};

export const getConsumptionAnalyses = async (userId: string, limit = 20): Promise<ConsumptionAnalysis[]> => {
  const sql = `SELECT * FROM consumption_analysis WHERE user_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT $2`;
  const result = await query(sql, [userId, limit]);
  return result.rows as ConsumptionAnalysis[];
};

export const deleteConsumptionAnalysis = async (id: string, userId: string): Promise<boolean> => {
  const result = await query(`DELETE FROM consumption_analysis WHERE id = $1 AND user_id = $2`, [id, userId]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// ACTIVIDADES (Antes / Durante / Después)
// =====================================================

export interface ActivityEntry {
  id: string;
  user_id: string;
  activity_name: string;
  feeling_before: string;
  feeling_during: string;
  feeling_after: string;
  entry_date: Date;
  created_at: Date;
  updated_at: Date;
}

export const createActivityEntry = async (userId: string, data: { activity_name: string; feeling_before: string; feeling_during: string; feeling_after: string; entry_date?: string }): Promise<ActivityEntry> => {
  const sql = `
    INSERT INTO activity_entries (user_id, activity_name, feeling_before, feeling_during, feeling_after, entry_date)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`;
  const result = await query(sql, [userId, data.activity_name, data.feeling_before, data.feeling_during, data.feeling_after, data.entry_date || new Date().toISOString().split('T')[0]]);
  return result.rows[0] as ActivityEntry;
};

export const getActivityEntries = async (userId: string, limit = 20): Promise<ActivityEntry[]> => {
  const sql = `SELECT * FROM activity_entries WHERE user_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT $2`;
  const result = await query(sql, [userId, limit]);
  return result.rows as ActivityEntry[];
};

export const deleteActivityEntry = async (id: string, userId: string): Promise<boolean> => {
  const result = await query(`DELETE FROM activity_entries WHERE id = $1 AND user_id = $2`, [id, userId]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// FEED UNIFICADO (muro de registros)
// =====================================================

export interface FeedEntry {
  id: string;
  type: 'checkin' | 'note' | 'habit' | 'social' | 'activity' | 'analysis';
  entry_date: string;
  created_at: string;
  data: Record<string, any>;
}

export const getUnifiedFeed = async (userId: string, limit = 30): Promise<FeedEntry[]> => {
  const sql = `
    SELECT id, 'checkin' AS type, checkin_date::text AS entry_date, created_at::text,
      json_build_object(
        'mood_score', mood_score, 'anxiety_score', anxiety_score, 'energy_score', energy_score,
        'consumed', (consumed_substances::jsonb != '[]'::jsonb), 'notes', notes,
        'exercised', exercised_today, 'sleep_hours', sleep_hours, 'emotional_tags', emotional_tags
      ) AS data
    FROM checkins WHERE user_id = $1

    UNION ALL

    SELECT id, 'note' AS type, note_date::text AS entry_date, created_at::text,
      json_build_object('content', content) AS data
    FROM daily_notes WHERE user_id = $1

    UNION ALL

    SELECT id, 'habit' AS type, entry_date::text, created_at::text,
      json_build_object('protective_habits', protective_habits, 'risk_habits', risk_habits) AS data
    FROM habit_entries WHERE user_id = $1

    UNION ALL

    SELECT id, 'social' AS type, entry_date::text, created_at::text,
      json_build_object('people_description', people_description, 'impact_assessment', impact_assessment) AS data
    FROM social_entries WHERE user_id = $1

    UNION ALL

    SELECT id, 'activity' AS type, entry_date::text, created_at::text,
      json_build_object('activity_name', activity_name, 'feeling_before', feeling_before,
        'feeling_during', feeling_during, 'feeling_after', feeling_after) AS data
    FROM activity_entries WHERE user_id = $1

    UNION ALL

    SELECT id, 'analysis' AS type, entry_date::text, created_at::text,
      json_build_object('trigger_situation', trigger_situation, 'action_taken', action_taken) AS data
    FROM consumption_analysis WHERE user_id = $1

    ORDER BY entry_date DESC, created_at DESC
    LIMIT $2
  `;
  const result = await query(sql, [userId, limit]);
  return result.rows as FeedEntry[];
};
