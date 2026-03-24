/**
 * Modelo de Cravings (antojos)
 * Consultas SQL para la tabla cravings
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { query, queryWithTransaction } from '../config/database.js';

// =====================================================
// INTERFACES
// =====================================================

export interface Craving {
  id: string;
  user_id: string;
  substance_id?: string;
  substance_name: string;
  intensity: number;
  status: string;
  triggers?: any[];
  coping_strategies?: any[];
  outcome?: string;
  consumed_quantity?: number;
  consumed_unit?: string;
  consequences?: string;
  location?: any;
  craving_start_time: Date;
  craving_end_time?: Date;
  duration_minutes?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CravingPattern {
  id: string;
  user_id: string;
  substance_id?: string;
  pattern_type: string;
  description: string;
  frequency_per_week?: number;
  avg_intensity?: number;
  common_triggers?: string[];
  effective_strategies?: string[];
  status: string;
  first_observed?: Date;
  last_observed?: Date;
  occurrence_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CopingStrategy {
  id: string;
  user_id: string;
  name: string;
  category: string;
  description?: string;
  effectiveness_rating?: number;
  times_used?: number;
  times_successful?: number;
  success_rate?: number;
  instructions?: string;
  when_to_use?: string;
  resources?: any[];
  is_active?: boolean;
  is_favorite?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CravingTrigger {
  id: string;
  user_id: string;
  trigger_type: string;
  trigger_description: string;
  frequency?: string;
  avg_intensity_when_triggered?: number;
  consumption_probability?: number;
  status: string;
  context_notes?: string;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// CRAVINGS
// =====================================================

/**
 * Crear un nuevo craving
 */
export const createCraving = async (userId: string, data: Partial<Craving>): Promise<Craving> => {
  const sql = `
    INSERT INTO cravings (user_id, substance_id, substance_name, intensity, status,
      triggers, coping_strategies, outcome, consumed_quantity, consumed_unit,
      consequences, location, craving_start_time, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`;
  
  const values = [
    userId,
    data.substance_id || null,
    data.substance_name,
    data.intensity,
    data.status || 'active',
    JSON.stringify(data.triggers || []),
    JSON.stringify(data.coping_strategies || []),
    data.outcome || null,
    data.consumed_quantity || null,
    data.consumed_unit || null,
    data.consequences || null,
    data.location ? JSON.stringify(data.location) : null,
    data.craving_start_time || new Date(),
    data.notes || null
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Obtener craving por ID
 */
export const getCravingById = async (id: string): Promise<Craving | null> => {
  const sql = `SELECT * FROM cravings WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

/**
 * Obtener cravings activos del usuario
 */
export const getActiveCravings = async (userId: string): Promise<Craving[]> => {
  const sql = `
    SELECT * FROM cravings 
    WHERE user_id = $1 AND status = 'active'
    ORDER BY craving_start_time DESC`;
  const result = await query(sql, [userId]);
  return result.rows;
};

/**
 * Obtener cravings recientes del usuario
 */
export const getRecentCravings = async (
  userId: string, 
  days = 30
): Promise<Craving[]> => {
  const sql = `
    SELECT * FROM cravings 
    WHERE user_id = $1 AND craving_start_time >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY craving_start_time DESC`;
  const result = await query(sql, [userId, days]);
  return result.rows;
};

/**
 * Obtener todos los cravings del usuario
 */
export const getUserCravings = async (
  userId: string, 
  page = 1, 
  limit = 20
): Promise<{ cravings: Craving[], total: number }> => {
  const offset = (page - 1) * limit;
  
  const countSql = `SELECT COUNT(*) as total FROM cravings WHERE user_id = $1`;
  const countResult = await query(countSql, [userId]);
  const total = parseInt(countResult.rows[0].total);

  const sql = `
    SELECT * FROM cravings 
    WHERE user_id = $1 
    ORDER BY craving_start_time DESC 
    LIMIT $2 OFFSET $3`;
  const result = await query(sql, [userId, limit, offset]);

  return { cravings: result.rows, total };
};

/**
 * Actualizar craving
 */
export const updateCraving = async (id: string, data: Partial<Craving>): Promise<Craving | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'status', 'coping_strategies', 'outcome', 'consumed_quantity', 
    'consumed_unit', 'consequences', 'location', 'craving_end_time', 
    'duration_minutes', 'notes'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      if (key === 'coping_strategies' || key === 'location') {
        values.push(value ? JSON.stringify(value) : null);
      } else {
        values.push(value);
      }
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE cravings SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  const result = await query(sql, values);
  return result.rows[0] || null;
};

/**
 * Eliminar craving
 */
export const deleteCraving = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM cravings WHERE id = $1`;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
};

/**
 * Resolver craving (marcar como manejado o resistido)
 */
export const resolveCraving = async (
  id: string, 
  status: 'managed' | 'resisted' | 'surrendered',
  strategies?: any[],
  outcome?: string
): Promise<Craving | null> => {
  const craving = await getCravingById(id);
  if (!craving) return null;

  const endTime = new Date();
  const startTime = new Date(craving.craving_start_time);
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  const sql = `
    UPDATE cravings 
    SET status = $1, 
        coping_strategies = COALESCE($2, coping_strategies),
        outcome = $3,
        craving_end_time = $4,
        duration_minutes = $5
    WHERE id = $6
    RETURNING *`;
  
  const result = await query(sql, [
    status, 
    strategies ? JSON.stringify(strategies) : null,
    outcome,
    endTime,
    durationMinutes,
    id
  ]);
  
  return result.rows[0] || null;
};

// =====================================================
// PATRONES DE CRAVINGS
// =====================================================

/**
 * Crear patrón de craving
 */
export const createCravingPattern = async (userId: string, data: Partial<CravingPattern>): Promise<CravingPattern> => {
  const sql = `
    INSERT INTO craving_patterns (user_id, substance_id, pattern_type, description,
      frequency_per_week, avg_intensity, common_triggers, effective_strategies, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`;
  
  const values = [
    userId,
    data.substance_id || null,
    data.pattern_type,
    data.description,
    data.frequency_per_week || null,
    data.avg_intensity || null,
    data.common_triggers || [],
    data.effective_strategies || [],
    data.status || 'identified'
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Obtener patrones del usuario
 */
export const getUserCravingPatterns = async (userId: string): Promise<CravingPattern[]> => {
  const sql = `
    SELECT * FROM craving_patterns 
    WHERE user_id = $1 AND status != 'archived'
    ORDER BY occurrence_count DESC, created_at DESC`;
  const result = await query(sql, [userId]);
  return result.rows;
};

/**
 * Actualizar patrón
 */
export const updateCravingPattern = async (id: string, data: Partial<CravingPattern>): Promise<CravingPattern | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'frequency_per_week', 'avg_intensity', 'common_triggers', 
    'effective_strategies', 'status', 'last_observed', 'occurrence_count'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      if (key === 'common_triggers' || key === 'effective_strategies') {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE craving_patterns SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  const result = await query(sql, values);
  return result.rows[0] || null;
};

/**
 * Eliminar patrón
 */
export const deleteCravingPattern = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM craving_patterns WHERE id = $1`;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// ESTRATEGIAS DE AFRONTAMIENTO
// =====================================================

/**
 * Crear estrategia de afrontamiento
 */
export const createCopingStrategy = async (userId: string, data: Partial<CopingStrategy>): Promise<CopingStrategy> => {
  const sql = `
    INSERT INTO coping_strategies (user_id, name, category, description,
      effectiveness_rating, instructions, when_to_use, resources, is_favorite)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`;
  
  const values = [
    userId,
    data.name,
    data.category,
    data.description || null,
    data.effectiveness_rating || null,
    data.instructions || null,
    data.when_to_use || null,
    JSON.stringify(data.resources || []),
    data.is_favorite || false
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Obtener estrategias del usuario
 */
export const getUserCopingStrategies = async (userId: string): Promise<CopingStrategy[]> => {
  const sql = `
    SELECT * FROM coping_strategies 
    WHERE user_id = $1 AND is_active = true
    ORDER BY is_favorite DESC, effectiveness_rating DESC NULLS LAST`;
  const result = await query(sql, [userId]);
  return result.rows;
};

/**
 * Obtener estrategias por categoría
 */
export const getStrategiesByCategory = async (userId: string, category: string): Promise<CopingStrategy[]> => {
  const sql = `
    SELECT * FROM coping_strategies 
    WHERE user_id = $1 AND category = $2 AND is_active = true
    ORDER BY effectiveness_rating DESC NULLS LAST`;
  const result = await query(sql, [userId, category]);
  return result.rows;
};

/**
 * Actualizar estrategia
 */
export const updateCopingStrategy = async (id: string, data: Partial<CopingStrategy>): Promise<CopingStrategy | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'name', 'category', 'description', 'effectiveness_rating', 
    'times_used', 'times_successful', 'success_rate', 'instructions', 
    'when_to_use', 'resources', 'is_active', 'is_favorite'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      if (key === 'resources') {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE coping_strategies SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  const result = await query(sql, values);
  return result.rows[0] || null;
};

/**
 * Registrar uso de estrategia
 */
export const recordStrategyUsage = async (
  userId: string,
  strategyId: string,
  cravingId: string | null,
  wasEffective: boolean
): Promise<void> => {
  const sql = `
    INSERT INTO strategy_usage (user_id, strategy_id, craving_id, was_effective)
    VALUES ($1, $2, $3, $4)`;
  
  await query(sql, [userId, strategyId, cravingId, wasEffective]);

  // Actualizar contador de la estrategia
  const updateSql = `
    UPDATE coping_strategies 
    SET times_used = times_used + 1,
        times_successful = times_successful + CASE WHEN $1 THEN 1 ELSE 0 END,
        success_rate = CASE 
          WHEN times_used + 1 > 0 THEN (times_successful + CASE WHEN $1 THEN 1 ELSE 0 END)::float / (times_used + 1)
          ELSE 0
        END
    WHERE id = $2`;
  
  await query(updateSql, [wasEffective, strategyId]);
};

/**
 * Eliminar estrategia
 */
export const deleteCopingStrategy = async (id: string): Promise<boolean> => {
  const sql = `UPDATE coping_strategies SET is_active = false WHERE id = $1`;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// DESENCADENANTES
// =====================================================

/**
 * Crear desencadenante
 */
export const createCravingTrigger = async (userId: string, data: Partial<CravingTrigger>): Promise<CravingTrigger> => {
  const sql = `
    INSERT INTO craving_triggers (user_id, trigger_type, trigger_description,
      frequency, avg_intensity_when_triggered, consumption_probability, status, context_notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`;
  
  const values = [
    userId,
    data.trigger_type,
    data.trigger_description,
    data.frequency || null,
    data.avg_intensity_when_triggered || null,
    data.consumption_probability || null,
    data.status || 'active',
    data.context_notes || null
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Obtener desencadenantes del usuario
 */
export const getUserCravingTriggers = async (userId: string): Promise<CravingTrigger[]> => {
  const sql = `
    SELECT * FROM craving_triggers 
    WHERE user_id = $1 AND status = 'active'
    ORDER BY consumption_probability DESC NULLS LAST`;
  const result = await query(sql, [userId]);
  return result.rows;
};

/**
 * Actualizar desencadenante
 */
export const updateCravingTrigger = async (id: string, data: Partial<CravingTrigger>): Promise<CravingTrigger | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'frequency', 'avg_intensity_when_triggered', 
    'consumption_probability', 'status', 'context_notes'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE craving_triggers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  const result = await query(sql, values);
  return result.rows[0] || null;
};

/**
 * Eliminar desencadenante
 */
export const deleteCravingTrigger = async (id: string): Promise<boolean> => {
  const sql = `UPDATE craving_triggers SET status = 'archived' WHERE id = $1`;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// ESTADÍSTICAS
// =====================================================

/**
 * Obtener estadísticas de cravings
 */
export const getCravingStats = async (userId: string, days = 30): Promise<{
  totalCravings: number;
  resistedCravings: number;
  managedCravings: number;
  surrenderedCravings: number;
  averageIntensity: number;
  topTriggers: string[];
  topStrategies: string[];
}> => {
  const sql = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'resisted' THEN 1 ELSE 0 END) as resisted,
      SUM(CASE WHEN status = 'managed' THEN 1 ELSE 0 END) as managed,
      SUM(CASE WHEN status = 'surrendered' THEN 1 ELSE 0 END) as surrendered,
      AVG(intensity) as avg_intensity
    FROM cravings
    WHERE user_id = $1 AND craving_start_time >= CURRENT_DATE - INTERVAL '30 days'`;
  
  const result = await query(sql, [userId]);
  const row = result.rows[0];

  // Obtener principales desencadenantes
  const triggersSql = `
    SELECT trigger_element as trigger_name, COUNT(*) as count
    FROM cravings, jsonb_array_elements_text(cravings.triggers) as trigger_element
    WHERE user_id = $1 AND craving_start_time >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY trigger_element
    ORDER BY count DESC
    LIMIT 5`;
  const triggersResult = await query(triggersSql, [userId]);

  return {
    totalCravings: parseInt(row.total) || 0,
    resistedCravings: parseInt(row.resisted) || 0,
    managedCravings: parseInt(row.managed) || 0,
    surrenderedCravings: parseInt(row.surrendered) || 0,
    averageIntensity: parseFloat(row.avg_intensity) || 0,
    topTriggers: triggersResult.rows.map(r => r.trigger_name),
    topStrategies: []
  };
};
