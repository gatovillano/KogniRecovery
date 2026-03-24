/**
 * Modelo de Perfiles de Usuario
 * Consultas SQL para la tabla profiles
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { query, queryWithTransaction } from '../config/database.js';

// =====================================================
// INTERFACES
// =====================================================

export interface Profile {
  id: string;
  user_id: string;
  profile_type: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  age_range?: string;
  gender?: string;
  education_level?: string;
  employment_status?: string;
  primary_substance?: string;
  substance_years_use?: number;
  previous_treatments?: boolean;
  has_relapse_history?: boolean;
  current_status?: string;
  treatment_start_date?: Date;
  motivation_level?: number;
  preferred_language?: string;
  notification_preferences?: Record<string, boolean>;
  created_at: Date;
  updated_at: Date;
}

export interface ProfileSettings {
  id: string;
  profile_id: string;
  checkin_frequency?: string;
  checkin_reminder_time?: string;
  checkin_reminder_enabled?: boolean;
  data_sharing_enabled?: boolean;
  share_with_family?: boolean;
  share_progress_weekly?: boolean;
  anonymous_analytics?: boolean;
  auto_detect_crisis?: boolean;
  emergency_contacts_notified?: boolean;
  location_sharing_emergency?: boolean;
  chatbot_personality?: string;
  response_detail_level?: string;
  memory_enabled?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SubstancePreference {
  id: string;
  profile_id: string;
  substance_id?: string;
  substance_name: string;
  current_status?: string;
  use_frequency?: string;
  last_use_date?: Date;
  target_cease_date?: Date;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// PERFILES
// =====================================================

/**
 * Crear un nuevo perfil
 */
export const createProfile = async (userId: string, data: Partial<Profile>): Promise<Profile> => {
  const sql = `
    INSERT INTO profiles (user_id, profile_type, display_name, avatar_url, bio, 
      age_range, gender, education_level, employment_status, primary_substance,
      substance_years_use, previous_treatments, has_relapse_history, current_status,
      treatment_start_date, motivation_level, preferred_language, notification_preferences)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`;
  
  const values = [
    userId,
    data.profile_type || 'estandar',
    data.display_name || null,
    data.avatar_url || null,
    data.bio || null,
    data.age_range || null,
    data.gender || null,
    data.education_level || null,
    data.employment_status || null,
    data.primary_substance || null,
    data.substance_years_use || null,
    data.previous_treatments || false,
    data.has_relapse_history || false,
    data.current_status || 'activo',
    data.treatment_start_date || null,
    data.motivation_level || null,
    data.preferred_language || 'es',
    JSON.stringify(data.notification_preferences || { checkin: true, chatbot: true, emergency: true })
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Obtener perfil por ID de usuario
 */
export const getProfileByUserId = async (userId: string): Promise<Profile | null> => {
  const sql = `SELECT * FROM profiles WHERE user_id = $1`;
  const result = await query(sql, [userId]);
  return result.rows[0] || null;
};

/**
 * Obtener perfil por ID
 */
export const getProfileById = async (id: string): Promise<Profile | null> => {
  const sql = `SELECT * FROM profiles WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

/**
 * Actualizar perfil
 */
export const updateProfile = async (id: string, data: Partial<Profile>): Promise<Profile | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'profile_type', 'display_name', 'avatar_url', 'bio', 'age_range', 
    'gender', 'education_level', 'employment_status', 'primary_substance',
    'substance_years_use', 'previous_treatments', 'has_relapse_history', 
    'current_status', 'treatment_start_date', 'motivation_level', 
    'preferred_language', 'notification_preferences'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(key === 'notification_preferences' ? JSON.stringify(value) : value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE profiles SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  const result = await query(sql, values);
  return result.rows[0] || null;
};

/**
 * Eliminar perfil
 */
export const deleteProfile = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM profiles WHERE id = $1`;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
};

/**
 * Listar todos los perfiles (para admin)
 */
export const getAllProfiles = async (page = 1, limit = 20): Promise<{ profiles: Profile[], total: number }> => {
  const offset = (page - 1) * limit;
  
  const countSql = `SELECT COUNT(*) as total FROM profiles`;
  const countResult = await query(countSql, []);
  const total = parseInt(countResult.rows[0].total);

  const sql = `SELECT * FROM profiles ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
  const result = await query(sql, [limit, offset]);

  return { profiles: result.rows, total };
};

// =====================================================
// CONFIGURACIÓN DE PERFIL
// =====================================================

/**
 * Crear configuración de perfil
 */
export const createProfileSettings = async (profileId: string, data: Partial<ProfileSettings>): Promise<ProfileSettings> => {
  const sql = `
    INSERT INTO profile_settings (profile_id, checkin_frequency, checkin_reminder_time,
      checkin_reminder_enabled, data_sharing_enabled, share_with_family, share_progress_weekly,
      anonymous_analytics, auto_detect_crisis, emergency_contacts_notified, 
      location_sharing_emergency, chatbot_personality, response_detail_level, memory_enabled)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`;
  
  const values = [
    profileId,
    data.checkin_frequency || 'diaria',
    data.checkin_reminder_time || '09:00',
    data.checkin_reminder_enabled ?? true,
    data.data_sharing_enabled ?? false,
    data.share_with_family ?? false,
    data.share_progress_weekly ?? true,
    data.anonymous_analytics ?? true,
    data.auto_detect_crisis ?? true,
    data.emergency_contacts_notified ?? true,
    data.location_sharing_emergency ?? false,
    data.chatbot_personality || 'apoyo',
    data.response_detail_level || 'balanceado',
    data.memory_enabled ?? true
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Obtener configuración de perfil
 */
export const getProfileSettings = async (profileId: string): Promise<ProfileSettings | null> => {
  const sql = `SELECT * FROM profile_settings WHERE profile_id = $1`;
  const result = await query(sql, [profileId]);
  return result.rows[0] || null;
};

/**
 * Actualizar configuración de perfil
 */
export const updateProfileSettings = async (profileId: string, data: Partial<ProfileSettings>): Promise<ProfileSettings | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'checkin_frequency', 'checkin_reminder_time', 'checkin_reminder_enabled',
    'data_sharing_enabled', 'share_with_family', 'share_progress_weekly',
    'anonymous_analytics', 'auto_detect_crisis', 'emergency_contacts_notified',
    'location_sharing_emergency', 'chatbot_personality', 'response_detail_level', 'memory_enabled'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(profileId);
  const sql = `UPDATE profile_settings SET ${fields.join(', ')} WHERE profile_id = $${paramIndex} RETURNING *`;
  
  const result = await query(sql, values);
  return result.rows[0] || null;
};

// =====================================================
// PREFERENCIAS DE SUSTANCIAS
// =====================================================

/**
 * Crear preferencia de sustancia
 */
export const createSubstancePreference = async (profileId: string, data: Partial<SubstancePreference>): Promise<SubstancePreference> => {
  const sql = `
    INSERT INTO substance_preferences (profile_id, substance_id, substance_name, 
      current_status, use_frequency, last_use_date, target_cease_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`;
  
  const values = [
    profileId,
    data.substance_id || null,
    data.substance_name,
    data.current_status || 'activo',
    data.use_frequency || null,
    data.last_use_date || null,
    data.target_cease_date || null
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Obtener preferencias de sustancias de un perfil
 */
export const getSubstancePreferences = async (profileId: string): Promise<SubstancePreference[]> => {
  const sql = `SELECT * FROM substance_preferences WHERE profile_id = $1 ORDER BY created_at DESC`;
  const result = await query(sql, [profileId]);
  return result.rows;
};

/**
 * Actualizar preferencia de sustancia
 */
export const updateSubstancePreference = async (id: string, data: Partial<SubstancePreference>): Promise<SubstancePreference | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = ['current_status', 'use_frequency', 'last_use_date', 'target_cease_date'];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE substance_preferences SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  const result = await query(sql, values);
  return result.rows[0] || null;
};

/**
 * Eliminar preferencia de sustancia
 */
export const deleteSubstancePreference = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM substance_preferences WHERE id = $1`;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Determinar tipo de perfil basado en características del usuario
 */
export const determineProfileType = (data: {
  age_range?: string;
  substance_years_use?: number;
  previous_treatments?: boolean;
  has_relapse_history?: boolean;
  motivation_level?: number;
}): string => {
  const { substance_years_use = 0, previous_treatments, has_relapse_history, motivation_level = 5 } = data;

  // Perfil intensivo para casos complejos
  if (substance_years_use > 10 || has_relapse_history || (previous_treatments && substance_years_use > 5)) {
    return 'intensivo';
  }

  // Perfil adaptado para usuarios con historial de tratamiento
  if (previous_treatments || substance_years_use > 3) {
    return 'adaptado';
  }

  // Perfil de mantención para usuarios avanzados
  if (motivation_level >= 8 && substance_years_use > 1) {
    return 'mantencion';
  }

  // Perfil estándar por defecto
  return 'estandar';
};
