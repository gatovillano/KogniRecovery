/**
 * Derechos del paciente: exportación de datos y solicitud de borrado.
 *
 * La exportación reúne todos los datos del paciente (los que él genera
 * y los registros de consentimiento/accesos) en un JSON legible. Cada
 * exportación queda auditada.
 *
 * La solicitud de borrado se registra (append-only); el procesamiento
 * físico debe respetar retención legal y se revisa desde el centro.
 */

import { query } from '../config/database.js';
import { createError } from '../middleware/error.js';
import { tryDecrypt } from '../utils/encryption.js';
import * as AuditService from './audit.service.js';
import type { AuditContext } from './clinicalAccess.service.js';

/**
 * SEC-PHASE1: el paciente tiene derecho a recibir sus datos en claro.
 * Estas funciones descifran los campos clínicos antes de incluirlos
 * en la exportación.
 */
const decryptRow = (row: any, fields: string[]): any => {
  const out = { ...row };
  for (const f of fields) {
    if (typeof out[f] === 'string' && out[f] !== '') {
      out[f] = tryDecrypt(out[f]);
    }
  }
  return out;
};

const DECRYPTORS: Record<string, (row: any) => any> = {
  checkins: (r) => decryptRow(r, ['notes', 'risk_description']),
  cravings: (r) => decryptRow(r, ['consequences', 'notes']),
  consumption_events: (r) => decryptRow(r, ['context_notes']),
  substance_doses: (r) => decryptRow(r, ['feelings', 'context_notes']),
  daily_notes: (r) => decryptRow(r, ['content']),
  habit_entries: (r) => decryptRow(r, ['protective_habits', 'risk_habits']),
  social_entries: (r) => decryptRow(r, ['people_description', 'impact_assessment']),
  consumption_analysis: (r) => decryptRow(r, ['trigger_situation', 'action_taken', 'lesson_learned']),
  agent_notes: (r) => decryptRow(r, ['title', 'content']),
  activity_entries: (r) => decryptRow(r, ['activity_name', 'feeling_before', 'feeling_during', 'feeling_after']),
  clinical_alerts: (r) => decryptRow(r, ['summary']),
};

// =====================================================
// EXPORTACIÓN
// =====================================================

const tableRows = async (table: string, userId: string): Promise<unknown[]> => {
  const result = await query(
    `SELECT * FROM ${table} WHERE user_id = $1 ORDER BY created_at DESC LIMIT 2000`,
    [userId]
  );
  const decrypt = DECRYPTORS[table];
  return decrypt ? result.rows.map(decrypt) : result.rows;
};

export const exportPatientData = async (input: {
  patientId: string;
  context: AuditContext;
}): Promise<unknown> => {
  const { patientId } = input;

  const patient = await query(
    `SELECT id, email, name, role, status, created_at FROM users WHERE id = $1`,
    [patientId]
  );
  if (!patient.rows[0]) {
    throw createError('Paciente no encontrado', 404, 'PATIENT_NOT_FOUND');
  }

  const [checkins, cravings, consumptionEvents, doses, medications, medicationLogs,
    dailyNotes, habitEntries, socialEntries, consumptionAnalysis,
    conversations, messages, agentNotes, consents, consentEvents, accessLog, careLinks,
    alerts] = await Promise.all([
    tableRows('checkins', patientId),
    tableRows('cravings', patientId),
    tableRows('consumption_events', patientId),
    tableRows('substance_doses', patientId),
    tableRows('medications', patientId),
    tableRows('medication_logs', patientId),
    tableRows('daily_notes', patientId),
    tableRows('habit_entries', patientId),
    tableRows('social_entries', patientId),
    tableRows('consumption_analysis', patientId),
    query(`SELECT id, title, scenario_type, status, started_at, last_message_at, message_count FROM conversations WHERE user_id = $1 ORDER BY started_at DESC`, [patientId]),
    query(`SELECT id, conversation_id, role, content, created_at FROM messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 2000`, [patientId]),
    tableRows('agent_notes', patientId),
    query(`SELECT * FROM sharing_consents WHERE patient_id = $1 ORDER BY created_at DESC`, [patientId]),
    query(`SELECT * FROM sharing_consent_events WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 2000`, [patientId]),
    AuditService.listAccessForPatient(patientId, 500),
    query(
      `SELECT op.organization_id, o.name AS organization_name, op.status, op.enrolled_at,
              ca.professional_id
       FROM organization_patients op
       JOIN organizations o ON o.id = op.organization_id
       LEFT JOIN care_assignments ca ON ca.organization_patient_id = op.id AND ca.status = 'active'
       WHERE op.patient_id = $1 ORDER BY o.name`,
      [patientId]
    ),
    query(`SELECT id, source, severity, status, summary, created_at FROM clinical_alerts WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 500`, [patientId]),
  ]);

  const consentCategories = await query(
    `SELECT scc.consent_id, scc.category, scc.detail_level, scc.enabled
     FROM sharing_consent_categories scc
     JOIN sharing_consents sc ON sc.id = scc.consent_id
     WHERE sc.patient_id = $1 ORDER BY scc.consent_id, scc.category`,
    [patientId]
  );

  const profile = await query(`SELECT * FROM profiles WHERE user_id = $1 LIMIT 1`, [patientId]);

  return {
    exported_at: new Date().toISOString(),
    patient: patient.rows[0],
    profile: profile.rows[0] ?? null,
    care_links: careLinks.rows,
    clinical: {
      checkins: checkins,
      cravings,
      consumption_events: consumptionEvents,
      substance_doses: doses,
      medications,
      medication_logs: medicationLogs,
      daily_notes: dailyNotes,
      habit_entries: habitEntries,
      social_entries: socialEntries,
      consumption_analysis: consumptionAnalysis,
      conversations: conversations.rows,
      messages: messages.rows.map((m: any) => ({
        ...m,
        content: typeof m.content === 'string' && m.content !== '' ? tryDecrypt(m.content) : m.content,
      })),
      agent_notes: agentNotes,
      alerts: alerts.rows.map((a: any) => ({
        ...a,
        summary: typeof a.summary === 'string' && a.summary !== '' ? tryDecrypt(a.summary) : a.summary,
      })),
    },
    consent: {
      consents: consents.rows,
      categories: consentCategories.rows,
      events: consentEvents.rows,
    },
    access_log: accessLog,
  };
};

// =====================================================
// SOLICITUD DE BORRADO
// =====================================================

export type DeletionStatus = 'requested' | 'in_progress' | 'completed' | 'rejected';

export interface DeletionRequest {
  id: string;
  patient_id: string;
  organization_id?: string | null;
  status: DeletionStatus;
  reason?: string | null;
  requested_by?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: Date | null;
  completed_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const createDeletionRequest = async (input: {
  patientId: string;
  organizationId?: string | null;
  requestedBy: string;
  reason?: string;
}): Promise<DeletionRequest> => {
  const existing = await query<DeletionRequest>(
    `SELECT * FROM data_deletion_requests
     WHERE patient_id = $1 AND status IN ('requested', 'in_progress')
     LIMIT 1`,
    [input.patientId]
  );

  if (existing.rows[0]) {
    throw createError('Ya existe una solicitud de borrado en curso', 409, 'DELETION_ALREADY_REQUESTED');
  }

  const result = await query<DeletionRequest>(
    `INSERT INTO data_deletion_requests
       (patient_id, organization_id, status, requested_by, reason)
     VALUES ($1, $2, 'requested', $3, $4)
     RETURNING *`,
    [input.patientId, input.organizationId ?? null, input.requestedBy, input.reason ?? null]
  );

  return result.rows[0]!;
};

export const listDeletionRequests = async (
  organizationId: string,
  options: { status?: DeletionStatus | null; limit?: number } = {}
): Promise<DeletionRequest[]> => {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const params: unknown[] = [organizationId];
  const where: string[] = ['organization_id = $1'];

  if (options.status) {
    params.push(options.status);
    where.push(`status = $${params.length}`);
  }
  params.push(limit);
  const limitParam = `$${params.length}`;

  const result = await query<DeletionRequest>(
    `SELECT * FROM data_deletion_requests
     WHERE ${where.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT ${limitParam}`,
    params
  );

  return result.rows;
};

export const reviewDeletionRequest = async (input: {
  requestId: string;
  organizationId: string;
  decision: 'in_progress' | 'completed' | 'rejected';
  reviewedBy: string;
}): Promise<DeletionRequest> => {
  const completedAt = input.decision === 'completed' ? new Date() : null;

  const result = await query<DeletionRequest>(
    `UPDATE data_deletion_requests
     SET status = $2, reviewed_by = $3, reviewed_at = NOW(),
         completed_at = $4,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $5
     RETURNING *`,
    [input.requestId, input.decision, input.reviewedBy, completedAt, input.organizationId]
  );

  const row = result.rows[0];
  if (!row) {
    throw createError('Solicitud no encontrada', 404, 'DELETION_REQUEST_NOT_FOUND');
  }
  return row;
};

export const listPatientDeletionRequests = async (
  patientId: string
): Promise<DeletionRequest[]> => {
  const result = await query<DeletionRequest>(
    `SELECT * FROM data_deletion_requests
     WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [patientId]
  );
  return result.rows;
};

export default {
  exportPatientData,
  createDeletionRequest,
  listDeletionRequests,
  reviewDeletionRequest,
  listPatientDeletionRequests,
};
