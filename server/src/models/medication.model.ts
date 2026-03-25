import { query } from '../config/database.js';

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  schedule_time: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  user_id: string;
  taken_at: Date;
  taken_date: string;
  status: string;
  created_at: Date;
}

export const createMedication = async (userId: string, data: { name: string; dosage: string; schedule_time: string }): Promise<Medication> => {
  const sql = `
    INSERT INTO medications (user_id, name, dosage, schedule_time)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
  const result = await query(sql, [userId, data.name, data.dosage, data.schedule_time]);
  return result.rows[0] as Medication;
};

export const getUserMedications = async (userId: string): Promise<Medication[]> => {
  const sql = `SELECT * FROM medications WHERE user_id = $1 AND is_active = TRUE ORDER BY schedule_time ASC`;
  const result = await query(sql, [userId]);
  return result.rows as Medication[];
};

export const updateMedication = async (id: string, userId: string, data: Partial<Medication>): Promise<Medication | null> => {
  const fields = Object.keys(data).filter(key => ['name', 'dosage', 'schedule_time', 'is_active'].includes(key));
  if (fields.length === 0) return null;

  const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');
  const values = fields.map(field => (data as any)[field]);

  const sql = `
    UPDATE medications 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *`;
    
  const result = await query(sql, [id, userId, ...values]);
  return result.rows[0] as Medication || null;
};

export const deleteMedication = async (id: string, userId: string): Promise<boolean> => {
  const sql = `UPDATE medications SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2`;
  const result = await query(sql, [id, userId]);
  return (result.rowCount ?? 0) > 0;
};

export const toggleMedicationLog = async (medicationId: string, userId: string, date: string): Promise<{ taken: boolean }> => {
  const checkSql = `SELECT id FROM medication_logs WHERE medication_id = $1 AND user_id = $2 AND taken_date = $3`;
  const checkResult: any = await query(checkSql, [medicationId, userId, date]);

  if (checkResult.rows.length > 0) {
    await query(`DELETE FROM medication_logs WHERE id = $1`, [checkResult.rows[0].id]);
    return { taken: false };
  } else {
    await query(`INSERT INTO medication_logs (medication_id, user_id, taken_date) VALUES ($1, $2, $3)`, [medicationId, userId, date]);
    return { taken: true };
  }
};

export const getDailyMedicationStatus = async (userId: string, date: string): Promise<any[]> => {
  const sql = `
    SELECT m.*, 
      (SELECT COUNT(*) > 0 FROM medication_logs ml WHERE ml.medication_id = m.id AND ml.taken_date = $2) as is_taken
    FROM medications m
    WHERE m.user_id = $1 AND m.is_active = TRUE
    ORDER BY m.schedule_time ASC`;
  const result = await query(sql, [userId, date]);
  return result.rows;
};
