/**
 * Credenciales profesionales verificadas.
 *
 * Regla del plan: sin verificación de licencia no hay acceso clínico.
 * El centro (org_admin/clinical_lead) registra y verifica las
 * credenciales de sus profesionales; el ClinicalAccessService exige
 * una credencial verificada y vigente para roles clínicos.
 */

import { query } from '../config/database.js';
import { createError } from '../middleware/error.js';

export type CredentialStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface ProfessionalCredential {
  id: string;
  user_id: string;
  organization_id: string;
  license_number: string;
  license_country: string;
  specialty?: string | null;
  verification_status: CredentialStatus;
  verified_by?: string | null;
  verified_at?: Date | null;
  expires_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CredentialView extends ProfessionalCredential {
  professional_name?: string | null;
  professional_email?: string | null;
}

export const upsertCredential = async (input: {
  organizationId: string;
  userId: string;
  licenseNumber: string;
  licenseCountry?: string;
  specialty?: string;
  expiresAt?: Date | null;
  actorId: string;
}): Promise<ProfessionalCredential> => {
  const licenseNumber = input.licenseNumber.trim();
  if (!licenseNumber) {
    throw createError('Número de licencia obligatorio', 400, 'INVALID_PAYLOAD');
  }

  // El profesional debe ser miembro activo del centro.
  const member = await query<{ id: string }>(
    `SELECT id FROM organization_members
     WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
    [input.organizationId, input.userId]
  );
  if (!member.rows[0]) {
    throw createError('El usuario no es miembro activo del centro', 400, 'NOT_A_MEMBER');
  }

  const result = await query<ProfessionalCredential>(
    `INSERT INTO professional_credentials
       (organization_id, user_id, license_number, license_country, specialty,
        verification_status, expires_at, verified_by, verified_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6, NULL, NULL)
     ON CONFLICT (organization_id, user_id, license_number)
     DO UPDATE SET
       license_country = EXCLUDED.license_country,
       specialty = EXCLUDED.specialty,
       expires_at = EXCLUDED.expires_at,
       verification_status = 'pending',
       verified_by = NULL,
       verified_at = NULL,
       updated_at = NOW()
     RETURNING *`,
    [
      input.organizationId,
      input.userId,
      licenseNumber,
      input.licenseCountry ?? 'CL',
      input.specialty ?? null,
      input.expiresAt ?? null,
    ]
  );

  return result.rows[0]!;
};

export const decideCredential = async (input: {
  credentialId: string;
  organizationId: string;
  decision: 'verified' | 'rejected';
  actorId: string;
}): Promise<ProfessionalCredential> => {
  const status = input.decision === 'verified' ? 'verified' : 'rejected';
  const verifiedAt = input.decision === 'verified' ? new Date() : null;

  const result = await query<ProfessionalCredential>(
    `UPDATE professional_credentials
     SET verification_status = $2,
         verified_by = $3,
         verified_at = $4,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $5
     RETURNING *`,
    [input.credentialId, status, input.actorId, verifiedAt, input.organizationId]
  );

  const credential = result.rows[0];
  if (!credential) {
    throw createError('Credencial no encontrada', 404, 'CREDENTIAL_NOT_FOUND');
  }
  return credential;
};

export const listOrgCredentials = async (
  organizationId: string,
  options: { status?: CredentialStatus | null; limit?: number } = {}
): Promise<CredentialView[]> => {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 300);
  const params: unknown[] = [organizationId];
  const where: string[] = ['pc.organization_id = $1'];

  if (options.status) {
    params.push(options.status);
    where.push(`pc.verification_status = $${params.length}`);
  }
  params.push(limit);
  const limitParam = `$${params.length}`;

  const result = await query<CredentialView>(
    `SELECT pc.*,
            COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) AS professional_name,
            u.email AS professional_email
     FROM professional_credentials pc
     JOIN users u ON u.id = pc.user_id
     WHERE ${where.join(' AND ')}
     ORDER BY pc.updated_at DESC
     LIMIT ${limitParam}`,
    params
  );

  return result.rows;
};

/**
 * ¿El usuario tiene una credencial verificada y vigente?
 */
export const hasVerifiedCredential = async (
  userId: string,
  organizationId: string
): Promise<boolean> => {
  const result = await query<{ id: string }>(
    `SELECT id FROM professional_credentials
     WHERE user_id = $1 AND organization_id = $2
       AND verification_status = 'verified'
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [userId, organizationId]
  );
  return Boolean(result.rows[0]);
};

export default {
  upsertCredential,
  decideCredential,
  listOrgCredentials,
  hasVerifiedCredential,
};
