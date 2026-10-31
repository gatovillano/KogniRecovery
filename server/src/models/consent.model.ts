/**
 * Modelo de Consentimiento de Paciente
 * Tabla: consent
 */

import { query } from '../config/database.js';

// =====================================================
// INTERFACES
// =====================================================

export interface Consent {
  patient_id: string;
  category: string; // e.g., 'mood', 'cravings', 'journal', 'medication'
  consent_given: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateConsentInput {
  patient_id: string;
  category: string;
  consent_given: boolean;
}

export const TABLE_NAME = 'consent';

/**
 * Busca el consentimiento de un paciente para una categoría específica.
 */
export const findByPatientAndCategory = async (patientId: string, category: string): Promise<Consent | null> => {
  const result = await query<Consent>(`SELECT * FROM ${TABLE_NAME} WHERE patient_id = $1 AND category = $2`, [patientId, category]);
  return result.rows[0] ?? null;
};

/**
 * Crea o actualiza el consentimiento de un paciente.
 */
export const upsert = async (input: CreateConsentInput): Promise<Consent> => {
  const { patient_id, category, consent_given } = input;
  // Upsert usando PostgreSQL ON CONFLICT (patient_id, category) DO UPDATE
  const result = await query<Consent>(
    `INSERT INTO ${TABLE_NAME} (patient_id, category, consent_given, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (patient_id, category) DO UPDATE SET consent_given = EXCLUDED.consent_given, updated_at = NOW()
     RETURNING *`,
    [patient_id, category, consent_given]
  );
  return result.rows[0]!;
};

/**
 * Lista todos los consentimientos de un paciente.
 */
export const listByPatient = async (patientId: string): Promise<Consent[]> => {
  const result = await query<Consent>(`SELECT * FROM ${TABLE_NAME} WHERE patient_id = $1`, [patientId]);
  return result.rows;
};

export default { findByPatientAndCategory, upsert, listByPatient };
