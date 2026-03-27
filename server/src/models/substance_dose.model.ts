import { query } from '../config/database.js';

export interface SubstanceDose {
  id: string;
  user_id: string;
  substance_name: string;
  quantity: number;
  unit: string;
  dose_time: Date;
  craving_intensity?: number;
  feelings?: string;
  context_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export const createSubstanceDose = async (userId: string, data: Partial<SubstanceDose>): Promise<SubstanceDose> => {
  const sql = `
    INSERT INTO substance_doses (
      user_id, substance_name, quantity, unit, dose_time, craving_intensity, feelings, context_notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const values = [
    userId,
    data.substance_name,
    data.quantity || 1,
    data.unit || 'dosis',
    data.dose_time || new Date(),
    data.craving_intensity || null,
    data.feelings || null,
    data.context_notes || null
  ];
  const result = await query(sql, values);
  return result.rows[0] as SubstanceDose;
};

export const getSubstanceDoses = async (userId: string, limit = 50, offset = 0): Promise<SubstanceDose[]> => {
  const sql = `
    SELECT * FROM substance_doses
    WHERE user_id = $1
    ORDER BY dose_time DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await query(sql, [userId, limit, offset]);
  return result.rows as SubstanceDose[];
};

export const getSubstanceDoseById = async (id: string, userId: string): Promise<SubstanceDose | null> => {
  const sql = `SELECT * FROM substance_doses WHERE id = $1 AND user_id = $2`;
  const result = await query(sql, [id, userId]);
  return (result.rows[0] as SubstanceDose) || null;
};

export const deleteSubstanceDose = async (id: string, userId: string): Promise<boolean> => {
  const sql = `DELETE FROM substance_doses WHERE id = $1 AND user_id = $2`;
  const result = await query(sql, [id, userId]);
  return (result.rowCount ?? 0) > 0;
};
