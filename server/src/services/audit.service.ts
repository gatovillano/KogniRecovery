/**
 * Auditoría de accesos a datos clínicos.
 *
 * La tabla `clinical_access_log` es append-only y nunca contiene
 * valores clínicos: solo actor, paciente, recurso, propósito y resultado.
 */

import { query } from '../config/database.js';

export type AccessAction = 'view' | 'list' | 'export' | 'break_glass' | 'denied';
export type AccessPurpose = 'treatment' | 'safety' | 'break_glass';

export interface AccessLogInput {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId?: string | null;
  consentId?: string | null;
  action: AccessAction;
  resourceType: string;
  resourceIds?: string[];
  purpose: AccessPurpose;
  success: boolean;
  denialReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId: string;
}

export interface AccessLogRow {
  id: string;
  actor_id: string;
  actor_role: string;
  actor_name?: string | null;
  organization_id: string;
  organization_name?: string | null;
  patient_id?: string | null;
  consent_id?: string | null;
  action: AccessAction;
  resource_type: string;
  resource_ids: string[];
  purpose: AccessPurpose;
  success: boolean;
  denial_reason?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  request_id: string;
  created_at: Date;
}

export const logAccess = async (input: AccessLogInput): Promise<void> => {
  await query(
    `INSERT INTO clinical_access_log
       (actor_id, actor_role, organization_id, patient_id, consent_id,
        action, resource_type, resource_ids, purpose, success,
        denial_reason, ip_address, user_agent, request_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      input.actorId,
      input.actorRole,
      input.organizationId,
      input.patientId ?? null,
      input.consentId ?? null,
      input.action,
      input.resourceType,
      input.resourceIds ?? [],
      input.purpose,
      input.success,
      input.denialReason ?? null,
      input.ipAddress ?? null,
      input.userAgent ?? null,
      input.requestId,
    ]
  );
};

export const logAccessSafely = async (input: AccessLogInput): Promise<void> => {
  try {
    await logAccess(input);
  } catch (error) {
    // Una lectura clínica nunca debe completarse si no se puede auditar.
    // El llamador decide si aborta; aquí solo dejamos rastro.
    console.error('❌ No se pudo registrar auditoría clínica:', error);
    throw error;
  }
};

export const listAccessForPatient = async (
  patientId: string,
  limit = 100
): Promise<AccessLogRow[]> => {
  const result = await query<AccessLogRow>(
    `SELECT cal.*,
            COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) AS actor_name,
            o.name AS organization_name
     FROM clinical_access_log cal
     LEFT JOIN users u ON u.id = cal.actor_id
     LEFT JOIN organizations o ON o.id = cal.organization_id
     WHERE cal.patient_id = $1
     ORDER BY cal.created_at DESC
     LIMIT $2`,
    [patientId, Math.min(Math.max(limit, 1), 500)]
  );
  return result.rows;
};

export const listAccessForOrganization = async (
  organizationId: string,
  options: {
    limit?: number;
    patientId?: string | null;
    actorId?: string | null;
    onlyDenied?: boolean;
  } = {}
): Promise<AccessLogRow[]> => {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);

  const result = await query<AccessLogRow>(
    `SELECT cal.*,
            COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) AS actor_name,
            o.name AS organization_name
     FROM clinical_access_log cal
     LEFT JOIN users u ON u.id = cal.actor_id
     LEFT JOIN organizations o ON o.id = cal.organization_id
     WHERE cal.organization_id = $1
       AND ($2::uuid IS NULL OR cal.patient_id = $2)
       AND ($3::uuid IS NULL OR cal.actor_id = $3)
       AND ($4::boolean IS FALSE OR cal.success = FALSE)
     ORDER BY cal.created_at DESC
     LIMIT $5`,
    [
      organizationId,
      options.patientId ?? null,
      options.actorId ?? null,
      options.onlyDenied ?? false,
      limit,
    ]
  );
  return result.rows;
};

export default {
  logAccess,
  logAccessSafely,
  listAccessForPatient,
  listAccessForOrganization,
};
