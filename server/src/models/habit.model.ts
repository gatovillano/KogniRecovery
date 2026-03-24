/**
 * Modelo de Hábitos - KogniRecovery
 */

import { query } from '../config/database.js';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string;
  icon: string | null;
  frequency: 'daily' | 'weekly';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string; // YYYY-MM-DD
  created_at: Date;
}

// =====================================================
// DEFINICIÓN DE HÁBITOS
// =====================================================

export const createHabit = async (userId: string, data: { name: string; description?: string; icon?: string; frequency?: 'daily' | 'weekly' }): Promise<Habit> => {
  const sql = `
    INSERT INTO habits (user_id, name, description, icon, frequency)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`;
  const result = await query(sql, [userId, data.name, data.description || null, data.icon || null, data.frequency || 'daily']);
  return result.rows[0] as Habit;
};

export const getUserHabits = async (userId: string): Promise<Habit[]> => {
  const sql = `SELECT * FROM habits WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at ASC`;
  const result = await query(sql, [userId]);
  return result.rows as Habit[];
};

export const updateHabit = async (id: string, userId: string, data: Partial<Habit>): Promise<Habit | null> => {
  const fields = Object.keys(data).filter(key => ['name', 'description', 'icon', 'frequency', 'is_active'].includes(key));
  if (fields.length === 0) return null;

  const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');
  const values = fields.map(field => (data as any)[field]);

  const sql = `
    UPDATE habits 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *`;
    
  const result = await query(sql, [id, userId, ...values]);
  return result.rows[0] as Habit || null;
};

export const deleteHabit = async (id: string, userId: string): Promise<boolean> => {
  // Soft delete by setting is_active = FALSE
  const sql = `UPDATE habits SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2`;
  const result = await query(sql, [id, userId]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// COMPLETITUD DE HÁBITOS
// =====================================================

export const toggleHabitCompletion = async (habitId: string, userId: string, date: string): Promise<{ completed: boolean }> => {
  // Check if already completed
  const checkSql = `SELECT id FROM habit_completions WHERE habit_id = $1 AND user_id = $2 AND completed_at = $3`;
  const checkResult: any = await query(checkSql, [habitId, userId, date]);

  if (checkResult.rows.length > 0) {
    // Delete if exists
    await query(`DELETE FROM habit_completions WHERE id = $1`, [checkResult.rows[0].id]);
    return { completed: false };
  } else {
    // Insert if not exists
    await query(`INSERT INTO habit_completions (habit_id, user_id, completed_at) VALUES ($1, $2, $3)`, [habitId, userId, date]);
    return { completed: true };
  }
};

export const getHabitCompletions = async (userId: string, startDate: string, endDate: string): Promise<HabitCompletion[]> => {
  const sql = `
    SELECT * FROM habit_completions 
    WHERE user_id = $1 AND completed_at >= $2 AND completed_at <= $3
    ORDER BY completed_at DESC`;
  const result = await query(sql, [userId, startDate, endDate]);
  return result.rows as HabitCompletion[];
};

export const getDailyHabitStatus = async (userId: string, date: string): Promise<any[]> => {
  const sql = `
    SELECT h.*, 
      (SELECT COUNT(*) > 0 FROM habit_completions hc WHERE hc.habit_id = h.id AND hc.completed_at = $2) as is_completed
    FROM habits h
    WHERE h.user_id = $1 AND h.is_active = TRUE
    ORDER BY h.created_at ASC`;
  const result = await query(sql, [userId, date]);
  return result.rows;
};
