/**
 * Modelo de Bitácora (Journal) - KogniRecovery
 * Entidades independientes: Notas, Hábitos, Entorno Social, Análisis de Consumo
 */

import { query } from '../config/database.js';
import { encrypt, tryDecrypt } from '../utils/encryption.js';

// =====================================================
// INTERFACES
// =====================================================

export interface DailyNote {
  id: string;
  user_id: string;
  content: string;
  note_date: Date;
  entry_time: string;
  created_at: Date;
  updated_at: Date;
}

export interface HabitEntry {
  id: string;
  user_id: string;
  protective_habits: string;
  risk_habits: string;
  entry_date: Date;
  entry_time: string;
  created_at: Date;
  updated_at: Date;
}

export interface SocialEntry {
  id: string;
  user_id: string;
  people_description: string;
  impact_assessment: string;
  entry_date: Date;
  entry_time: string;
  created_at: Date;
  updated_at: Date;
}

export interface ConsumptionAnalysis {
  id: string;
  user_id: string;
  trigger_situation: string;
  action_taken: string;
  lesson_learned: string;
  entry_date: Date;
  entry_time: string;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// NOTAS DIARIAS
// =====================================================

export const createDailyNote = async (
  userId: string,
  data: { content: string; note_date?: string; entry_time?: string }
): Promise<DailyNote> => {
  const now = new Date();
  const sql = `
    INSERT INTO daily_notes (user_id, content, note_date, entry_time)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
  const result = await query(sql, [
    userId,
    // SEC-PHASE1: cifrar contenido de nota diaria.
    encrypt(data.content),
    data.note_date || now.toISOString().split('T')[0],
    data.entry_time || now.toTimeString().split(' ')[0],
  ]);
  const row = result.rows[0] as DailyNote | undefined;
  return row ? { ...row, content: tryDecrypt(row.content) } : (row as unknown as DailyNote);
};

export const getDailyNotes = async (userId: string, limit = 20): Promise<DailyNote[]> => {
  const sql = `SELECT * FROM daily_notes WHERE user_id = $1 ORDER BY note_date DESC, created_at DESC LIMIT $2`;
  const result = await query(sql, [userId, limit]);
  return (result.rows as DailyNote[]).map((row) => ({ ...row, content: tryDecrypt(row.content) }));
};

export const deleteDailyNote = async (id: string, userId: string): Promise<boolean> => {
  const result = await query(`DELETE FROM daily_notes WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
  return (result.rowCount ?? 0) > 0;
};

export const updateDailyNote = async (
  id: string,
  userId: string,
  data: { content: string; note_date?: string }
): Promise<DailyNote | null> => {
  const sql = `
    UPDATE daily_notes 
    SET content = $1, note_date = COALESCE($2, note_date), updated_at = CURRENT_TIMESTAMP
    WHERE id = $3 AND user_id = $4
    RETURNING *`;
  const result = await query(sql, [encrypt(data.content), data.note_date || null, id, userId]);
  const row = result.rows[0] as DailyNote | undefined;
  return row ? { ...row, content: tryDecrypt(row.content) } : null;
};

// =====================================================
// HÁBITOS
// =====================================================

export const createHabitEntry = async (
  userId: string,
  data: { protective_habits: string; risk_habits: string; entry_date?: string; entry_time?: string }
): Promise<HabitEntry> => {
  const now = new Date();
  const sql = `
    INSERT INTO habit_entries (user_id, protective_habits, risk_habits, entry_date, entry_time)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`;
  const result = await query(sql, [
    userId,
    // SEC-PHASE1: cifrar hábitos protectores/de riesgo.
    encrypt(data.protective_habits),
    encrypt(data.risk_habits),
    data.entry_date || now.toISOString().split('T')[0],
    data.entry_time || now.toTimeString().split(' ')[0],
  ]);
  const row = result.rows[0] as HabitEntry | undefined;
  return row
    ? { ...row, protective_habits: tryDecrypt(row.protective_habits), risk_habits: tryDecrypt(row.risk_habits) }
    : (row as unknown as HabitEntry);
};

export const getHabitEntries = async (userId: string, limit = 20): Promise<HabitEntry[]> => {
  const sql = `SELECT * FROM habit_entries WHERE user_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT $2`;
  const result = await query(sql, [userId, limit]);
  return (result.rows as HabitEntry[]).map((row) => ({
    ...row,
    protective_habits: tryDecrypt(row.protective_habits),
    risk_habits: tryDecrypt(row.risk_habits),
  }));
};

export const deleteHabitEntry = async (id: string, userId: string): Promise<boolean> => {
  const result = await query(`DELETE FROM habit_entries WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
  return (result.rowCount ?? 0) > 0;
};

export const updateHabitEntry = async (
  id: string,
  userId: string,
  data: { protective_habits: string; risk_habits: string; entry_date?: string }
): Promise<HabitEntry | null> => {
  const sql = `
    UPDATE habit_entries 
    SET protective_habits = $1, risk_habits = $2, entry_date = COALESCE($3, entry_date), updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 AND user_id = $5
    RETURNING *`;
  const result = await query(sql, [
    encrypt(data.protective_habits),
    encrypt(data.risk_habits),
    data.entry_date || null,
    id,
    userId,
  ]);
  const row = result.rows[0] as HabitEntry | undefined;
  return row
    ? { ...row, protective_habits: tryDecrypt(row.protective_habits), risk_habits: tryDecrypt(row.risk_habits) }
    : null;
};

// =====================================================
// ENTORNO SOCIAL
// =====================================================

export const createSocialEntry = async (
  userId: string,
  data: {
    people_description: string;
    impact_assessment: string;
    entry_date?: string;
    entry_time?: string;
  }
): Promise<SocialEntry> => {
  const now = new Date();
  const sql = `
    INSERT INTO social_entries (user_id, people_description, impact_assessment, entry_date, entry_time)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`;
  const result = await query(sql, [
    userId,
    // SEC-PHASE1: cifrar descripción e impacto social.
    encrypt(data.people_description),
    encrypt(data.impact_assessment),
    data.entry_date || now.toISOString().split('T')[0],
    data.entry_time || now.toTimeString().split(' ')[0],
  ]);
  const row = result.rows[0] as SocialEntry | undefined;
  return row
    ? { ...row, people_description: tryDecrypt(row.people_description), impact_assessment: tryDecrypt(row.impact_assessment) }
    : (row as unknown as SocialEntry);
};

export const getSocialEntries = async (userId: string, limit = 20): Promise<SocialEntry[]> => {
  const sql = `SELECT * FROM social_entries WHERE user_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT $2`;
  const result = await query(sql, [userId, limit]);
  return (result.rows as SocialEntry[]).map((row) => ({
    ...row,
    people_description: tryDecrypt(row.people_description),
    impact_assessment: tryDecrypt(row.impact_assessment),
  }));
};

export const deleteSocialEntry = async (id: string, userId: string): Promise<boolean> => {
  const result = await query(`DELETE FROM social_entries WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
  return (result.rowCount ?? 0) > 0;
};

export const updateSocialEntry = async (
  id: string,
  userId: string,
  data: { people_description: string; impact_assessment: string; entry_date?: string }
): Promise<SocialEntry | null> => {
  const sql = `
    UPDATE social_entries 
    SET people_description = $1, impact_assessment = $2, entry_date = COALESCE($3, entry_date), updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 AND user_id = $5
    RETURNING *`;
  const result = await query(sql, [
    encrypt(data.people_description),
    encrypt(data.impact_assessment),
    data.entry_date || null,
    id,
    userId,
  ]);
  const row = result.rows[0] as SocialEntry | undefined;
  return row
    ? { ...row, people_description: tryDecrypt(row.people_description), impact_assessment: tryDecrypt(row.impact_assessment) }
    : null;
};

// =====================================================
// ANÁLISIS DE CONSUMO / IMPULSO
// =====================================================

export const createConsumptionAnalysis = async (
  userId: string,
  data: {
    trigger_situation: string;
    action_taken: string;
    lesson_learned?: string;
    entry_date?: string;
    entry_time?: string;
  }
): Promise<ConsumptionAnalysis> => {
  const now = new Date();
  const sql = `
    INSERT INTO consumption_analysis (user_id, trigger_situation, action_taken, lesson_learned, entry_date, entry_time)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`;
  const result = await query(sql, [
    userId,
    // SEC-PHASE1: cifrar análisis de consumo.
    encrypt(data.trigger_situation),
    encrypt(data.action_taken),
    encrypt(data.lesson_learned || ''),
    data.entry_date || now.toISOString().split('T')[0],
    data.entry_time || now.toTimeString().split(' ')[0],
  ]);
  const row = result.rows[0] as ConsumptionAnalysis | undefined;
  return row
    ? {
        ...row,
        trigger_situation: tryDecrypt(row.trigger_situation),
        action_taken: tryDecrypt(row.action_taken),
        lesson_learned: tryDecrypt(row.lesson_learned),
      }
    : (row as unknown as ConsumptionAnalysis);
};

export const getConsumptionAnalyses = async (
  userId: string,
  limit = 20
): Promise<ConsumptionAnalysis[]> => {
  const sql = `SELECT * FROM consumption_analysis WHERE user_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT $2`;
  const result = await query(sql, [userId, limit]);
  return (result.rows as ConsumptionAnalysis[]).map((row) => ({
    ...row,
    trigger_situation: tryDecrypt(row.trigger_situation),
    action_taken: tryDecrypt(row.action_taken),
    lesson_learned: tryDecrypt(row.lesson_learned),
  }));
};

export const deleteConsumptionAnalysis = async (id: string, userId: string): Promise<boolean> => {
  const result = await query(`DELETE FROM consumption_analysis WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
  return (result.rowCount ?? 0) > 0;
};

export const updateConsumptionAnalysis = async (
  id: string,
  userId: string,
  data: {
    trigger_situation: string;
    action_taken: string;
    lesson_learned?: string;
    entry_date?: string;
  }
): Promise<ConsumptionAnalysis | null> => {
  const sql = `
    UPDATE consumption_analysis 
    SET trigger_situation = $1, action_taken = $2, lesson_learned = $3, entry_date = COALESCE($4, entry_date), updated_at = CURRENT_TIMESTAMP
    WHERE id = $5 AND user_id = $6
    RETURNING *`;
  const result = await query(sql, [
    encrypt(data.trigger_situation),
    encrypt(data.action_taken),
    encrypt(data.lesson_learned || ''),
    data.entry_date || null,
    id,
    userId,
  ]);
  const row = result.rows[0] as ConsumptionAnalysis | undefined;
  return row
    ? {
        ...row,
        trigger_situation: tryDecrypt(row.trigger_situation),
        action_taken: tryDecrypt(row.action_taken),
        lesson_learned: tryDecrypt(row.lesson_learned),
      }
    : null;
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
  entry_time: string;
  created_at: Date;
  updated_at: Date;
}

export const createActivityEntry = async (
  userId: string,
  data: {
    activity_name: string;
    feeling_before: string;
    feeling_during: string;
    feeling_after: string;
    entry_date?: string;
    entry_time?: string;
  }
): Promise<ActivityEntry> => {
  const now = new Date();
  const sql = `
    INSERT INTO activity_entries (user_id, activity_name, feeling_before, feeling_during, feeling_after, entry_date, entry_time)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`;
  const result = await query(sql, [
    userId,
    // SEC-PHASE1: cifrar nombre y sensaciones de la actividad.
    encrypt(data.activity_name),
    encrypt(data.feeling_before),
    encrypt(data.feeling_during),
    encrypt(data.feeling_after),
    data.entry_date || now.toISOString().split('T')[0],
    data.entry_time || now.toTimeString().split(' ')[0],
  ]);
  const row = result.rows[0] as ActivityEntry | undefined;
  return row
    ? {
        ...row,
        activity_name: tryDecrypt(row.activity_name),
        feeling_before: tryDecrypt(row.feeling_before),
        feeling_during: tryDecrypt(row.feeling_during),
        feeling_after: tryDecrypt(row.feeling_after),
      }
    : (row as unknown as ActivityEntry);
};

export const getActivityEntries = async (userId: string, limit = 20): Promise<ActivityEntry[]> => {
  const sql = `SELECT * FROM activity_entries WHERE user_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT $2`;
  const result = await query(sql, [userId, limit]);
  return (result.rows as ActivityEntry[]).map((row) => ({
    ...row,
    activity_name: tryDecrypt(row.activity_name),
    feeling_before: tryDecrypt(row.feeling_before),
    feeling_during: tryDecrypt(row.feeling_during),
    feeling_after: tryDecrypt(row.feeling_after),
  }));
};

export const deleteActivityEntry = async (id: string, userId: string): Promise<boolean> => {
  const result = await query(`DELETE FROM activity_entries WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
  return (result.rowCount ?? 0) > 0;
};

export const updateActivityEntry = async (
  id: string,
  userId: string,
  data: {
    activity_name: string;
    feeling_before: string;
    feeling_during: string;
    feeling_after: string;
    entry_date?: string;
  }
): Promise<ActivityEntry | null> => {
  const sql = `
    UPDATE activity_entries 
    SET activity_name = $1, feeling_before = $2, feeling_during = $3, feeling_after = $4, entry_date = COALESCE($5, entry_date), updated_at = CURRENT_TIMESTAMP
    WHERE id = $6 AND user_id = $7
    RETURNING *`;
  const result = await query(sql, [
    encrypt(data.activity_name),
    encrypt(data.feeling_before),
    encrypt(data.feeling_during),
    encrypt(data.feeling_after),
    data.entry_date || null,
    id,
    userId,
  ]);
  const row = result.rows[0] as ActivityEntry | undefined;
  return row
    ? {
        ...row,
        activity_name: tryDecrypt(row.activity_name),
        feeling_before: tryDecrypt(row.feeling_before),
        feeling_during: tryDecrypt(row.feeling_during),
        feeling_after: tryDecrypt(row.feeling_after),
      }
    : null;
};

// =====================================================
// FEED UNIFICADO (muro de registros)
// =====================================================

export interface FeedEntry {
  id: string;
  type:
    | 'checkin'
    | 'note'
    | 'habit'
    | 'social'
    | 'activity'
    | 'analysis'
    | 'habit_completion'
    | 'substance_dose'
    | 'craving';
  entry_date: string;
  entry_time: string | null;
  created_at: string;
  data: Record<string, any>;
}

/**
 * SEC-PHASE1: descifra los campos clínicos de un registro del feed
 * (bitácora) que se construye con json_build_object sobre columnas
 * cifradas.
 */
const decryptFeedEntry = (entry: FeedEntry): FeedEntry => {
  const data = { ...entry.data };
  switch (entry.type) {
    case 'checkin':
      if (typeof data.notes === 'string') data.notes = tryDecrypt(data.notes);
      break;
    case 'note':
    case 'analysis':
      if (typeof data.content === 'string') data.content = tryDecrypt(data.content);
      if (typeof data.trigger_situation === 'string') data.trigger_situation = tryDecrypt(data.trigger_situation);
      if (typeof data.action_taken === 'string') data.action_taken = tryDecrypt(data.action_taken);
      if (typeof data.lesson_learned === 'string') data.lesson_learned = tryDecrypt(data.lesson_learned);
      break;
    case 'habit':
      if (typeof data.protective_habits === 'string') data.protective_habits = tryDecrypt(data.protective_habits);
      if (typeof data.risk_habits === 'string') data.risk_habits = tryDecrypt(data.risk_habits);
      break;
    case 'social':
      if (typeof data.people_description === 'string') data.people_description = tryDecrypt(data.people_description);
      if (typeof data.impact_assessment === 'string') data.impact_assessment = tryDecrypt(data.impact_assessment);
      break;
    case 'activity':
      if (typeof data.activity_name === 'string') data.activity_name = tryDecrypt(data.activity_name);
      if (typeof data.feeling_before === 'string') data.feeling_before = tryDecrypt(data.feeling_before);
      if (typeof data.feeling_during === 'string') data.feeling_during = tryDecrypt(data.feeling_during);
      if (typeof data.feeling_after === 'string') data.feeling_after = tryDecrypt(data.feeling_after);
      break;
    case 'substance_dose':
      if (typeof data.feelings === 'string') data.feelings = tryDecrypt(data.feelings);
      if (typeof data.context_notes === 'string') data.context_notes = tryDecrypt(data.context_notes);
      break;
    case 'craving':
      if (typeof data.notes === 'string') data.notes = tryDecrypt(data.notes);
      break;
    default:
      break;
  }
  return { ...entry, data };
};

export const getUnifiedFeed = async (userId: string, limit = 30): Promise<FeedEntry[]> => {
  const sql = `
    SELECT id, 'checkin' AS type, checkin_date::text AS entry_date, checkin_time::text AS entry_time, created_at::text,
      json_build_object(
        'mood_score', mood_score, 'anxiety_score', anxiety_score, 'energy_score', energy_score,
        'consumed', (consumed_substances::jsonb != '[]'::jsonb), 'notes', notes,
        'exercised', exercised_today, 'sleep_hours', sleep_hours, 'emotional_tags', emotional_tags
      ) AS data
    FROM checkins WHERE user_id = $1

    UNION ALL

    SELECT id, 'note' AS type, note_date::text AS entry_date, created_at::time::text AS entry_time, created_at::text,
      json_build_object('content', content) AS data
    FROM daily_notes WHERE user_id = $1

    UNION ALL

    SELECT id, 'habit' AS type, entry_date::text, created_at::time::text AS entry_time, created_at::text,
      json_build_object('protective_habits', protective_habits, 'risk_habits', risk_habits) AS data
    FROM habit_entries WHERE user_id = $1

    UNION ALL

    SELECT hc.id, 'habit_completion' AS type, hc.completed_at::text AS entry_date, hc.created_at::time::text AS entry_time, hc.created_at::text,
      json_build_object('habit_name', h.name, 'habit_type', h.habit_type) AS data
    FROM habit_completions hc
    JOIN habits h ON hc.habit_id = h.id
    WHERE hc.user_id = $1

    UNION ALL

    SELECT id, 'social' AS type, entry_date::text, created_at::time::text AS entry_time, created_at::text,
      json_build_object('people_description', people_description, 'impact_assessment', impact_assessment) AS data
    FROM social_entries WHERE user_id = $1

    UNION ALL

    SELECT id, 'activity' AS type, entry_date::text, created_at::time::text AS entry_time, created_at::text,
      json_build_object('activity_name', activity_name, 'feeling_before', feeling_before,
        'feeling_during', feeling_during, 'feeling_after', feeling_after) AS data
    FROM activity_entries WHERE user_id = $1

    UNION ALL

    SELECT id, 'analysis' AS type, entry_date::text, created_at::time::text AS entry_time, created_at::text,
      json_build_object('trigger_situation', trigger_situation, 'action_taken', action_taken, 'lesson_learned', lesson_learned) AS data
    FROM consumption_analysis WHERE user_id = $1

    UNION ALL

    SELECT id, 'substance_dose' AS type, dose_time::date::text AS entry_date, dose_time::time::text AS entry_time, created_at::text,
      json_build_object('substance_name', substance_name, 'quantity', quantity, 'unit', unit,
        'dose_time', dose_time::text, 'craving_intensity', craving_intensity,
        'feelings', feelings, 'context_notes', context_notes) AS data
    FROM substance_doses WHERE user_id = $1

    UNION ALL

    SELECT id, 'craving' AS type, craving_start_time::date::text AS entry_date, craving_start_time::time::text AS entry_time, created_at::text,
      json_build_object('substance_name', substance_name, 'intensity', intensity,
        'status', status, 'triggers', triggers, 'coping_strategies', coping_strategies,
        'outcome', outcome, 'notes', notes, 'duration_minutes', duration_minutes) AS data
    FROM cravings WHERE user_id = $1

    ORDER BY entry_date DESC, entry_time DESC
    LIMIT $2
  `;
  const result = await query(sql, [userId, limit]);
  return (result.rows as FeedEntry[]).map(decryptFeedEntry);
};

// =====================================================
// BÚSQUEDA POR RANGO DE FECHAS (Bitácora)
// =====================================================

export interface JournalDateRangeParams {
  startDate: string;
  endDate: string;
  types?: string[];
}

export const getJournalByDateRange = async (
  userId: string,
  params: JournalDateRangeParams
): Promise<FeedEntry[]> => {
  const { startDate, endDate, types } = params;
  const typeFilter =
    types && types.length > 0
      ? types
      : [
          'checkin',
          'note',
          'habit',
          'social',
          'activity',
          'analysis',
          'habit_completion',
          'substance_dose',
          'craving',
        ];

  const subqueries: string[] = [];
  const baseParams: any[] = [userId, startDate, endDate];

  if (typeFilter.includes('checkin')) {
    subqueries.push(`
      SELECT id, 'checkin' AS type, checkin_date::text AS entry_date, checkin_time::text AS entry_time, created_at::text,
        json_build_object(
          'mood_score', mood_score, 'anxiety_score', anxiety_score, 'energy_score', energy_score,
          'consumed', (consumed_substances::jsonb != '[]'::jsonb), 'notes', notes,
          'exercised', exercised_today, 'sleep_hours', sleep_hours, 'emotional_tags', emotional_tags
        ) AS data
      FROM checkins WHERE user_id = $1 AND checkin_date BETWEEN $2 AND $3
    `);
  }

  if (typeFilter.includes('note')) {
    subqueries.push(`
      SELECT id, 'note' AS type, note_date::text AS entry_date, created_at::time::text AS entry_time, created_at::text,
        json_build_object('content', content) AS data
      FROM daily_notes WHERE user_id = $1 AND note_date BETWEEN $2 AND $3
    `);
  }

  if (typeFilter.includes('habit')) {
    subqueries.push(`
      SELECT id, 'habit' AS type, entry_date::text, created_at::time::text AS entry_time, created_at::text,
        json_build_object('protective_habits', protective_habits, 'risk_habits', risk_habits) AS data
      FROM habit_entries WHERE user_id = $1 AND entry_date BETWEEN $2 AND $3
    `);
  }

  if (typeFilter.includes('habit_completion')) {
    subqueries.push(`
      SELECT hc.id, 'habit_completion' AS type, hc.completed_at::text AS entry_date, hc.created_at::time::text AS entry_time, hc.created_at::text,
        json_build_object('habit_name', h.name, 'habit_type', h.habit_type) AS data
      FROM habit_completions hc
      JOIN habits h ON hc.habit_id = h.id
      WHERE hc.user_id = $1 AND hc.completed_at BETWEEN $2 AND $3
    `);
  }

  if (typeFilter.includes('social')) {
    subqueries.push(`
      SELECT id, 'social' AS type, entry_date::text, created_at::time::text AS entry_time, created_at::text,
        json_build_object('people_description', people_description, 'impact_assessment', impact_assessment) AS data
      FROM social_entries WHERE user_id = $1 AND entry_date BETWEEN $2 AND $3
    `);
  }

  if (typeFilter.includes('activity')) {
    subqueries.push(`
      SELECT id, 'activity' AS type, entry_date::text, created_at::time::text AS entry_time, created_at::text,
        json_build_object('activity_name', activity_name, 'feeling_before', feeling_before,
          'feeling_during', feeling_during, 'feeling_after', feeling_after) AS data
      FROM activity_entries WHERE user_id = $1 AND entry_date BETWEEN $2 AND $3
    `);
  }

  if (typeFilter.includes('analysis')) {
    subqueries.push(`
      SELECT id, 'analysis' AS type, entry_date::text, created_at::time::text AS entry_time, created_at::text,
      json_build_object('trigger_situation', trigger_situation, 'action_taken', action_taken, 'lesson_learned', lesson_learned) AS data
    FROM consumption_analysis WHERE user_id = $1 AND entry_date BETWEEN $2 AND $3
    `);
  }

  if (typeFilter.includes('substance_dose')) {
    subqueries.push(`
      SELECT id, 'substance_dose' AS type, dose_time::date::text AS entry_date, dose_time::time::text AS entry_time, created_at::text,
        json_build_object('substance_name', substance_name, 'quantity', quantity, 'unit', unit,
          'dose_time', dose_time::text, 'craving_intensity', craving_intensity,
          'feelings', feelings, 'context_notes', context_notes) AS data
      FROM substance_doses WHERE user_id = $1 AND dose_time::date BETWEEN $2 AND $3
    `);
  }

  if (typeFilter.includes('craving')) {
    subqueries.push(`
      SELECT id, 'craving' AS type, craving_start_time::date::text AS entry_date, craving_start_time::time::text AS entry_time, created_at::text,
        json_build_object('substance_name', substance_name, 'intensity', intensity,
          'status', status, 'triggers', triggers, 'coping_strategies', coping_strategies,
          'outcome', outcome, 'notes', notes, 'duration_minutes', duration_minutes) AS data
      FROM cravings WHERE user_id = $1 AND craving_start_time::date BETWEEN $2 AND $3
    `);
  }

  if (subqueries.length === 0) return [];

  const sql = `
    ${subqueries.join(' UNION ALL ')}
    ORDER BY entry_date ASC, entry_time ASC
    LIMIT 100
  `;

  const result = await query(sql, baseParams);
  return (result.rows as FeedEntry[]).map(decryptFeedEntry);
};

export const getJournalForWeek = async (
  userId: string,
  dateInWeek: string
): Promise<FeedEntry[]> => {
  const sql = `
    SELECT * FROM (
      SELECT id, 'checkin' AS type, checkin_date::text AS entry_date, checkin_time::text AS entry_time, created_at::text,
        json_build_object('mood_score', mood_score, 'anxiety_score', anxiety_score, 'energy_score', energy_score,
          'consumed', (consumed_substances::jsonb != '[]'::jsonb), 'notes', notes) AS data
      FROM checkins WHERE user_id = $1 AND checkin_date BETWEEN date_trunc('week', $2::date)::date AND (date_trunc('week', $2::date) + interval '6 days')::date

      UNION ALL

      SELECT id, 'note' AS type, note_date::text AS entry_date, created_at::time::text AS entry_time, created_at::text,
        json_build_object('content', content) AS data
      FROM daily_notes WHERE user_id = $1 AND note_date BETWEEN date_trunc('week', $2::date)::date AND (date_trunc('week', $2::date) + interval '6 days')::date

      UNION ALL

      SELECT id, 'habit' AS type, entry_date::text, created_at::time::text AS entry_time, created_at::text,
        json_build_object('protective_habits', protective_habits, 'risk_habits', risk_habits) AS data
      FROM habit_entries WHERE user_id = $1 AND entry_date BETWEEN date_trunc('week', $2::date)::date AND (date_trunc('week', $2::date) + interval '6 days')::date

      UNION ALL

      SELECT hc.id, 'habit_completion' AS type, hc.completed_at::text AS entry_date, hc.created_at::time::text AS entry_time, hc.created_at::text,
        json_build_object('habit_name', h.name, 'habit_type', h.habit_type) AS data
      FROM habit_completions hc JOIN habits h ON hc.habit_id = h.id
      WHERE hc.user_id = $1 AND hc.completed_at BETWEEN date_trunc('week', $2::date)::date AND (date_trunc('week', $2::date) + interval '6 days')::date

      UNION ALL

      SELECT id, 'social' AS type, entry_date::text, created_at::time::text AS entry_time, created_at::text,
        json_build_object('people_description', people_description, 'impact_assessment', impact_assessment) AS data
      FROM social_entries WHERE user_id = $1 AND entry_date BETWEEN date_trunc('week', $2::date)::date AND (date_trunc('week', $2::date) + interval '6 days')::date

      UNION ALL

      SELECT id, 'activity' AS type, entry_date::text, created_at::time::text AS entry_time, created_at::text,
        json_build_object('activity_name', activity_name, 'feeling_before', feeling_before, 'feeling_during', feeling_during, 'feeling_after', feeling_after) AS data
      FROM activity_entries WHERE user_id = $1 AND entry_date BETWEEN date_trunc('week', $2::date)::date AND (date_trunc('week', $2::date) + interval '6 days')::date

      UNION ALL

      SELECT id, 'analysis' AS type, entry_date::text, created_at::time::text AS entry_time, created_at::text,
        json_build_object('trigger_situation', trigger_situation, 'action_taken', action_taken, 'lesson_learned', lesson_learned) AS data
      FROM consumption_analysis WHERE user_id = $1 AND entry_date BETWEEN date_trunc('week', $2::date)::date AND (date_trunc('week', $2::date) + interval '6 days')::date

      UNION ALL

      SELECT id, 'substance_dose' AS type, dose_time::date::text AS entry_date, dose_time::time::text AS entry_time, created_at::text,
        json_build_object('substance_name', substance_name, 'quantity', quantity, 'unit', unit, 'dose_time', dose_time::text, 'craving_intensity', craving_intensity) AS data
      FROM substance_doses WHERE user_id = $1 AND dose_time::date BETWEEN date_trunc('week', $2::date)::date AND (date_trunc('week', $2::date) + interval '6 days')::date

      UNION ALL

      SELECT id, 'craving' AS type, craving_start_time::date::text AS entry_date, craving_start_time::time::text AS entry_time, created_at::text,
        json_build_object('substance_name', substance_name, 'intensity', intensity,
          'status', status, 'triggers', triggers, 'coping_strategies', coping_strategies,
          'outcome', outcome, 'notes', notes, 'duration_minutes', duration_minutes) AS data
      FROM cravings WHERE user_id = $1 AND craving_start_time::date BETWEEN date_trunc('week', $2::date)::date AND (date_trunc('week', $2::date) + interval '6 days')::date
    ) AS week_entries
    ORDER BY entry_date ASC, entry_time ASC
  `;
  const result = await query(sql, [userId, dateInWeek]);
  return (result.rows as FeedEntry[]).map(decryptFeedEntry);
};
