/**
 * Alertas clínicas de riesgo (protocolo de seguridad).
 *
 * Las alertas se generan a partir de marcadores en los datos del paciente
 * (check-ins con situación de riesgo o ansiedad alta) y se leen solo si
 * el paciente mantiene el consentimiento `risk_alerts` (finalidad safety).
 *
 * Toda acción (acknowledge/escalate/cierre) queda auditada.
 */

import { query } from '../config/database.js';
import { encrypt, tryDecrypt } from '../utils/encryption.js';
import * as ClinicalAccess from './clinicalAccess.service.js';
import type { AuditContext } from './clinicalAccess.service.js';
import * as AuditService from './audit.service.js';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'escalated' | 'closed' | 'false_positive';
export type AlertSource = 'checkin' | 'chatbot' | 'self_report' | 'clinician';

export interface ClinicalAlert {
  id: string;
  organization_id: string;
  patient_id: string;
  source: AlertSource;
  severity: AlertSeverity;
  status: AlertStatus;
  summary: string;
  source_ref?: string | null;
  created_at: Date;
  acknowledged_by?: string | null;
  acknowledged_at?: Date | null;
  escalated_at?: Date | null;
  closed_at?: Date | null;
  updated_at: Date;
}

export interface AlertListOptions {
  patientId?: string | null;
  status?: AlertStatus | null;
  severity?: AlertSeverity | null;
  limit?: number;
}

// =====================================================
// GENERACIÓN
// =====================================================

interface RiskCheckinRow {
  id: string;
  user_id: string;
  risk_situation: boolean | null;
  anxiety_score: number | null;
  mood_score: number | null;
  checkin_date: string | Date;
}

const assessRisk = (row: RiskCheckinRow): { severity?: AlertSeverity; summary: string; risk: boolean } => {
  const anxiety = Number(row.anxiety_score) || 0;

  if (row.risk_situation) {
    if (anxiety >= 8) {
      return {
        severity: 'critical',
        summary: `Situación de riesgo declarada con ansiedad alta (${anxiety}/10) el ${String(row.checkin_date)}.`,
        risk: true,
      };
    }
    return {
      severity: 'high',
      summary: `Situación de riesgo declarada en check-in del ${String(row.checkin_date)}.`,
      risk: true,
    };
  }

  if (anxiety >= 8) {
    return {
      severity: 'critical',
      summary: `Ansiedad muy alta (${anxiety}/10) registrada el ${String(row.checkin_date)}.`,
      risk: true,
    };
  }

  if (anxiety >= 7) {
    return {
      severity: 'high',
      summary: `Ansiedad elevada (${anxiety}/10) registrada el ${String(row.checkin_date)}.`,
      risk: true,
    };
  }

  return { summary: '', risk: false };
};

/**
 * Evalúa los check-ins recientes de un paciente y crea alertas para
 * los riesgos nuevos. Evita duplicados usando source_ref (id del check-in).
 */
export const evaluatePatientCheckins = async (
  organizationId: string,
  patientId: string,
  days = 3
): Promise<number> => {
  const result = await query<RiskCheckinRow>(
    `SELECT id, user_id, risk_situation, anxiety_score, mood_score, checkin_date
     FROM checkins
     WHERE user_id = $1
       AND checkin_date >= CURRENT_DATE - ($2::int * INTERVAL '1 day')
     ORDER BY checkin_date DESC, checkin_time DESC`,
    [patientId, days]
  );

  let created = 0;

  for (const row of result.rows) {
    const { severity, summary, risk } = assessRisk(row);
    if (!risk || !severity) continue;

    const existing = await query(
      `SELECT 1 FROM clinical_alerts
       WHERE organization_id = $1 AND patient_id = $2
         AND source = 'checkin' AND source_ref = $3`,
      [organizationId, patientId, row.id]
    );

    if (existing.rowCount && existing.rowCount > 0) continue;

    await query(
      `INSERT INTO clinical_alerts
         (organization_id, patient_id, source, severity, status, summary, source_ref)
       VALUES ($1, $2, 'checkin', $3, 'open', $4, $5)`,
      // SEC-PHASE1: el resumen de la alerta es texto clínico; se cifra.
      [organizationId, patientId, severity, encrypt(summary), row.id]
    );
    created += 1;
  }

  return created;
};

/**
 * Evalúa todos los pacientes activos de una organización (worker a demanda).
 */
export const evaluateOrgCheckins = async (
  organizationId: string,
  days = 3
): Promise<{ evaluated: number; created: number }> => {
  const patients = await query<{ patient_id: string }>(
    `SELECT patient_id FROM organization_patients
     WHERE organization_id = $1 AND status = 'active'`,
    [organizationId]
  );

  let created = 0;
  for (const { patient_id } of patients.rows) {
    created += await evaluatePatientCheckins(organizationId, patient_id, days);
  }

  return { evaluated: patients.rows.length, created };
};

// =====================================================
// LECTURA
// =====================================================

/**
 * Lista las alertas de un paciente.
 * Requiere consentimiento `risk_alerts` (finalidad safety).
 */
export const listAlertsForTherapist = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  options?: AlertListOptions;
  context: AuditContext;
}): Promise<{ items: ClinicalAlert[]; consent: { detail_level: string; expires_at?: Date | null } }> => {
  const decision = await ClinicalAccess.authorizeClinicalRead(
    {
      actorId: input.actorId,
      actorRole: input.actorRole,
      organizationId: input.organizationId,
      patientId: input.patientId,
      category: 'risk_alerts',
    },
    input.context
  );

  const opts = input.options ?? {};
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);

  const params: unknown[] = [input.organizationId, input.patientId];
  const where: string[] = ['organization_id = $1', 'patient_id = $2'];

  if (opts.status) {
    params.push(opts.status);
    where.push(`status = $${params.length}`);
  }
  if (opts.severity) {
    params.push(opts.severity);
    where.push(`severity = $${params.length}`);
  }
  params.push(limit);
  const limitParam = `$${params.length}`;

  const result = await query<ClinicalAlert>(
    `SELECT * FROM clinical_alerts
     WHERE ${where.join(' AND ')}
     ORDER BY
       CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
       created_at DESC
     LIMIT ${limitParam}`,
    params
  );

  await ClinicalAccess.recordReadSuccess(decision, {
    resourceType: 'clinical_alerts',
    resourceIds: result.rows.map((row) => row.id),
    action: 'list',
    context: input.context,
  });

  return {
    items: result.rows.map((row) => ({ ...row, summary: tryDecrypt(row.summary) })),
    consent: {
      detail_level: decision.detailLevel,
      expires_at: decision.consent.expires_at ?? null,
    },
  };
};

// =====================================================
// ACCIONES
// =====================================================

const authorizeAlertAction = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  context: AuditContext;
}): Promise<void> => {
  await ClinicalAccess.authorizePatientScope(
    {
      actorId: input.actorId,
      actorRole: input.actorRole,
      organizationId: input.organizationId,
      patientId: input.patientId,
    },
    input.context
  );
};

const findAlertInOrg = async (
  alertId: string,
  organizationId: string,
  patientId: string
): Promise<ClinicalAlert | null> => {
  const result = await query<ClinicalAlert>(
    `SELECT * FROM clinical_alerts
     WHERE id = $1 AND organization_id = $2 AND patient_id = $3`,
    [alertId, organizationId, patientId]
  );
  const row = result.rows[0];
  return row ? { ...row, summary: tryDecrypt(row.summary) } : null;
};

const recordAlertAction = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  alert: ClinicalAlert;
  action: 'view' | 'export';
  context: AuditContext;
}): Promise<void> => {
  await AuditService.logAccess({
    actorId: input.actorId,
    actorRole: input.actorRole,
    organizationId: input.organizationId,
    patientId: input.patientId,
    consentId: null,
    action: input.action,
    resourceType: `clinical_alert:${input.alert.severity}`,
    resourceIds: [input.alert.id],
    purpose: 'safety',
    success: true,
    ipAddress: input.context.ipAddress,
    userAgent: input.context.userAgent,
    requestId: input.context.requestId,
  });
};

export const acknowledgeAlert = async (input: {
  alertId: string;
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  context: AuditContext;
}): Promise<ClinicalAlert> => {
  await authorizeAlertAction(input);

  const alert = await findAlertInOrg(input.alertId, input.organizationId, input.patientId);
  if (!alert) {
    throw new ClinicalAccess.ClinicalAccessError(
      404,
      'ALERT_NOT_FOUND',
      'Alerta no encontrada',
      'alert_not_found'
    );
  }

  if (alert.status === 'closed' || alert.status === 'false_positive') {
    throw new ClinicalAccess.ClinicalAccessError(
      409,
      'ALERT_CLOSED',
      'La alerta está cerrada',
      'alert_closed'
    );
  }

  const result = await query<ClinicalAlert>(
    `UPDATE clinical_alerts
     SET status = 'acknowledged', acknowledged_by = $2, acknowledged_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [input.alertId, input.actorId]
  );

  const updated = { ...result.rows[0]!, summary: tryDecrypt(result.rows[0]!.summary) };
  await recordAlertAction({ ...input, alert: updated, action: 'view' });
  return updated;
};

export const escalateAlert = async (input: {
  alertId: string;
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  context: AuditContext;
}): Promise<ClinicalAlert> => {
  await authorizeAlertAction(input);

  const alert = await findAlertInOrg(input.alertId, input.organizationId, input.patientId);
  if (!alert) {
    throw new ClinicalAccess.ClinicalAccessError(
      404,
      'ALERT_NOT_FOUND',
      'Alerta no encontrada',
      'alert_not_found'
    );
  }

  if (alert.status === 'closed' || alert.status === 'false_positive') {
    throw new ClinicalAccess.ClinicalAccessError(
      409,
      'ALERT_CLOSED',
      'La alerta está cerrada',
      'alert_closed'
    );
  }

  const result = await query<ClinicalAlert>(
    `UPDATE clinical_alerts
     SET status = 'escalated', acknowledged_by = COALESCE(acknowledged_by, $2),
         acknowledged_at = COALESCE(acknowledged_at, NOW()),
         escalated_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [input.alertId, input.actorId]
  );

  const updated = { ...result.rows[0]!, summary: tryDecrypt(result.rows[0]!.summary) };
  await recordAlertAction({ ...input, alert: updated, action: 'export' });
  return updated;
};

export const closeAlert = async (input: {
  alertId: string;
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  outcome: 'closed' | 'false_positive';
  context: AuditContext;
}): Promise<ClinicalAlert> => {
  await authorizeAlertAction(input);

  const alert = await findAlertInOrg(input.alertId, input.organizationId, input.patientId);
  if (!alert) {
    throw new ClinicalAccess.ClinicalAccessError(
      404,
      'ALERT_NOT_FOUND',
      'Alerta no encontrada',
      'alert_not_found'
    );
  }

  const result = await query<ClinicalAlert>(
    `UPDATE clinical_alerts
     SET status = $2, closed_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [input.alertId, input.outcome]
  );

  const updated = { ...result.rows[0]!, summary: tryDecrypt(result.rows[0]!.summary) };
  await recordAlertAction({ ...input, alert: updated, action: 'view' });
  return updated;
};

export default {
  evaluatePatientCheckins,
  evaluateOrgCheckins,
  listAlertsForTherapist,
  acknowledgeAlert,
  escalateAlert,
  closeAlert,
};
