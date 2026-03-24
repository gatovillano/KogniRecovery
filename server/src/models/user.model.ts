/**
 * Modelo de Usuario
 * Consultas SQL para la tabla users
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { query, queryWithTransaction } from '../config/database.js';

// =====================================================
// INTERFACES
// =====================================================

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'patient' | 'family' | 'professional' | 'admin';
  created_at: Date;
  updated_at: Date;
  phone?: string;
  status?: 'active' | 'inactive' | 'suspended';
  onboarding_completed?: boolean;
  profile_type?: string;
  risk_level?: 'bajo' | 'medio' | 'alto' | 'critico';
  two_factor_enabled?: boolean;
  two_factor_secret?: string;
  llm_provider?: 'openai' | 'anthropic' | 'azure' | 'local' | 'openrouter';
  llm_model?: string;
  llm_api_key?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: 'patient' | 'family' | 'professional';
  phone?: string;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'suspended';
  onboarding_completed?: boolean;
  profile_type?: string;
  risk_level?: 'bajo' | 'medio' | 'alto' | 'critico';
  llm_provider?: 'openai' | 'anthropic' | 'azure' | 'local' | 'openrouter';
  llm_model?: string;
  llm_api_key?: string;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: Date;
  phone?: string;
  status?: string;
  onboarding_completed?: boolean;
  profile_type?: string;
  risk_level?: string;
}

// =====================================================
// CONSULTAS
// =====================================================

const TABLE_NAME = 'users';

/**
 * Busca un usuario por email
 */
export const findByEmail = async (email: string): Promise<User | null> => {
  const result = await query<User>(
    `SELECT * FROM ${TABLE_NAME} WHERE email = $1`,
    [email]
  );

  return result.rows[0] ?? null;
};

/**
 * Busca un usuario por ID
 */
export const findById = async (id: string): Promise<User | null> => {
  const result = await query<User>(
    `SELECT * FROM ${TABLE_NAME} WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
};

/**
 * Busca un usuario por ID sin incluir datos sensibles
 */
export const findPublicById = async (id: string): Promise<UserPublic | null> => {
  const result = await query<UserPublic>(
    `SELECT id, email, name, role, created_at, phone, status, onboarding_completed, profile_type, risk_level 
     FROM ${TABLE_NAME} WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
};

/**
 * Crea un nuevo usuario
 */
export const create = async (userData: CreateUserInput): Promise<User> => {
  const { email, password, name, role = 'patient', phone } = userData;

  const result = await query<User>(
    `INSERT INTO ${TABLE_NAME} (email, password, name, role, phone, status)
     VALUES ($1, $2, $3, $4, $5, 'active')
     RETURNING *`,
    [email, password, name, role, phone ?? null]
  );

  return result.rows[0]!;
};

/**
 * Actualiza un usuario
 */
export const update = async (id: string, userData: UpdateUserInput): Promise<User | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  // Construir query dinámico
  if (userData.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(userData.name);
  }
  if (userData.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(userData.phone);
  }
  if (userData.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(userData.status);
  }
  if (userData.onboarding_completed !== undefined) {
    fields.push(`onboarding_completed = $${paramIndex++}`);
    values.push(userData.onboarding_completed);
  }
  if (userData.profile_type !== undefined) {
    fields.push(`profile_type = $${paramIndex++}`);
    values.push(userData.profile_type);
  }
  if (userData.risk_level !== undefined) {
    fields.push(`risk_level = $${paramIndex++}`);
    values.push(userData.risk_level);
  }
  if (userData.llm_provider !== undefined) {
    fields.push(`llm_provider = $${paramIndex++}`);
    values.push(userData.llm_provider);
  }
  if (userData.llm_model !== undefined) {
    fields.push(`llm_model = $${paramIndex++}`);
    values.push(userData.llm_model);
  }
  if (userData.llm_api_key !== undefined) {
    fields.push(`llm_api_key = $${paramIndex++}`);
    values.push(userData.llm_api_key);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<User>(
    `UPDATE ${TABLE_NAME} SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0] ?? null;
};

/**
 * Actualiza la contraseña de un usuario
 */
export const updatePassword = async (id: string, newPassword: string): Promise<boolean> => {
  const result = await query(
    `UPDATE ${TABLE_NAME} SET password = $1, updated_at = NOW() WHERE id = $2`,
    [newPassword, id]
  );

  return (result.rowCount ?? 0) > 0;
};

/**
 * Verifica si un email ya existe
 */
export const existsByEmail = async (email: string): Promise<boolean> => {
  const result = await query(
    `SELECT 1 FROM ${TABLE_NAME} WHERE email = $1`,
    [email]
  );

  return result.rowCount !== null && result.rowCount > 0;
};

/**
 * Lista usuarios con paginación
 */
export const findAll = async (page = 1, limit = 10): Promise<{ users: UserPublic[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [usersResult, countResult] = await Promise.all([
    query<UserPublic>(
      `SELECT id, email, name, role, created_at, phone, status, onboarding_completed, profile_type, risk_level 
       FROM ${TABLE_NAME} 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM ${TABLE_NAME}`),
  ]);

  return {
    users: usersResult.rows,
    total: parseInt(countResult.rows[0]?.count ?? '0', 10),
  };
};

/**
 * Busca usuarios por rol
 */
export const findByRole = async (
  role: 'patient' | 'family' | 'professional' | 'admin',
  page = 1,
  limit = 10
): Promise<{ users: UserPublic[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [usersResult, countResult] = await Promise.all([
    query<UserPublic>(
      `SELECT id, email, name, role, created_at, phone, status, onboarding_completed, profile_type, risk_level 
       FROM ${TABLE_NAME} 
       WHERE role = $1
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [role, limit, offset]
    ),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM ${TABLE_NAME} WHERE role = $1`, [role]),
  ]);

  return {
    users: usersResult.rows,
    total: parseInt(countResult.rows[0]?.count ?? '0', 10),
  };
};

/**
 * Actualiza el estado de onboarding
 */
export const completeOnboarding = async (id: string): Promise<boolean> => {
  const result = await query(
    `UPDATE ${TABLE_NAME} SET onboarding_completed = TRUE, updated_at = NOW() WHERE id = $1`,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
};

/**
 * Busca usuarios por tipo de perfil
 */
export const findByProfileType = async (
  profileType: string,
  page = 1,
  limit = 10
): Promise<{ users: UserPublic[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [usersResult, countResult] = await Promise.all([
    query<UserPublic>(
      `SELECT id, email, name, role, created_at, phone, status, onboarding_completed, profile_type, risk_level 
       FROM ${TABLE_NAME} 
       WHERE profile_type = $1
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [profileType, limit, offset]
    ),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM ${TABLE_NAME} WHERE profile_type = $1`, [profileType]),
  ]);

  return {
    users: usersResult.rows,
    total: parseInt(countResult.rows[0]?.count ?? '0', 10),
  };
};

export default {
  findByEmail,
  findById,
  findPublicById,
  create,
  update,
  updatePassword,
  existsByEmail,
  findAll,
  findByRole,
  completeOnboarding,
  findByProfileType,
};
