/**
 * Modelo de Gastos en Sustancias
 * Consultas SQL para la tabla substance_expenses
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { query } from '../config/database.js';

// =====================================================
// INTERFACES
// =====================================================

export interface SubstanceExpense {
  id: string;
  user_id: string;
  substance_id?: string | null;
  amount: number;
  currency: string;
  expense_date: Date;
  description?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSubstanceExpenseInput {
  user_id: string;
  substance_id?: string | null;
  amount: number;
  currency?: string;
  expense_date?: Date;
  description?: string | null;
}

export interface UpdateSubstanceExpenseInput {
  amount?: number;
  substance_id?: string | null;
  expense_date?: Date;
  description?: string | null;
}

// =====================================================
// CONSULTAS
// =====================================================

const TABLE_NAME = 'substance_expenses';

/**
 * Registra un nuevo gasto
 */
export const create = async (data: CreateSubstanceExpenseInput): Promise<SubstanceExpense> => {
  const { 
    user_id, 
    substance_id = null, 
    amount, 
    currency = 'CLP', 
    expense_date = new Date(), 
    description = null 
  } = data;

  const result = await query<SubstanceExpense>(
    `INSERT INTO ${TABLE_NAME} (user_id, substance_id, amount, currency, expense_date, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, substance_id, amount, currency, expense_date, description]
  );

  return result.rows[0]!;
};

/**
 * Obtiene un gasto por ID
 */
export const findById = async (id: string): Promise<SubstanceExpense | null> => {
  const result = await query<SubstanceExpense>(
    `SELECT * FROM ${TABLE_NAME} WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
};

/**
 * Obtiene todos los gastos de un usuario
 */
export const findByUserId = async (userId: string, limit = 50, offset = 0): Promise<SubstanceExpense[]> => {
  const result = await query<SubstanceExpense>(
    `SELECT * FROM ${TABLE_NAME} 
     WHERE user_id = $1 
     ORDER BY expense_date DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows;
};

/**
 * Obtiene el total gastado por un usuario (opcionalmente en un rango de fechas)
 */
export const getTotalSpent = async (userId: string, startDate?: Date, endDate?: Date): Promise<number> => {
  let sql = `SELECT SUM(amount) as total FROM ${TABLE_NAME} WHERE user_id = $1`;
  const params: any[] = [userId];

  if (startDate) {
    sql += ` AND expense_date >= $${params.length + 1}`;
    params.push(startDate);
  }

  if (endDate) {
    sql += ` AND expense_date <= $${params.length + 1}`;
    params.push(endDate);
  }

  const result = await query<{ total: string }>(sql, params);
  return parseFloat(result.rows[0]?.total ?? '0');
};

/**
 * Actualiza un gasto
 */
export const update = async (id: string, data: UpdateSubstanceExpenseInput): Promise<SubstanceExpense | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.amount !== undefined) {
    fields.push(`amount = $${paramIndex++}`);
    values.push(data.amount);
  }
  if (data.substance_id !== undefined) {
    fields.push(`substance_id = $${paramIndex++}`);
    values.push(data.substance_id);
  }
  if (data.expense_date !== undefined) {
    fields.push(`expense_date = $${paramIndex++}`);
    values.push(data.expense_date);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<SubstanceExpense>(
    `UPDATE ${TABLE_NAME} SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0] ?? null;
};

/**
 * Elimina un gasto
 */
export const remove = async (id: string): Promise<boolean> => {
  const result = await query(
    `DELETE FROM ${TABLE_NAME} WHERE id = $1`,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
};

export default {
  create,
  findById,
  findByUserId,
  getTotalSpent,
  update,
  remove,
};
