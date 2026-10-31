/**
 * Servicio para manejo de consentimientos de datos clínicos del paciente
 */

import { query } from '../config/database.js';
import { Consent } from '../models/consent.model.js';

/**
 * Obtiene todos los consentimientos del paciente
 */
export const getUserConsents = async (userId: string): Promise<Consent[]> => {
  const result = await query<Consent>(
    `SELECT * FROM consent WHERE patient_id = $1 ORDER BY category`,
    [userId]
  );
  return result.rows;
};

/**
 * Crea o actualiza un consentimiento para una categoría
 */
export const upsertConsent = async (userId: string, category: string, consent_given: boolean): Promise<Consent> => {
  const result = await query<Consent>(
    `INSERT INTO consent (patient_id, category, consent_given, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (patient_id, category) DO UPDATE SET consent_given = EXCLUDED.consent_given, updated_at = NOW()
     RETURNING *`,
    [userId, category, consent_given]
  );
  if (!result.rows[0]) throw new Error('Failed to upsert consent');
  return result.rows[0];
};
