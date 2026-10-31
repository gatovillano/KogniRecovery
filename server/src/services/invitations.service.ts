/**
 * Invitaciones de pacientes a un centro.
 *
 * El centro (org_admin/clinical_lead) crea una invitación por email con
 * un token y, opcionalmente, el terapeuta asignado. El token se guarda
 * hasheado (SHA-256); el paciente lo acepta desde su app autenticada,
 * creando el vínculo organización–paciente (y la asignación si aplica).
 */

import crypto from 'node:crypto';
import { query, getPool } from '../config/database.js';
import { createError } from '../middleware/error.js';
import * as CareModel from '../models/care.model.js';
import * as UserModel from '../models/user.model.js';
import * as NotificationsService from './notifications.service.js';

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface PatientInvite {
  id: string;
  organization_id: string;
  patient_email: string;
  token_hash: string;
  status: InviteStatus;
  expires_at: Date;
  created_by?: string | null;
  professional_id?: string | null;
  accepted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PatientInviteView {
  id: string;
  organization_id: string;
  organization_name: string;
  patient_email: string;
  status: InviteStatus;
  expires_at: Date;
  created_at: Date;
  created_by_name?: string | null;
  professional_id?: string | null;
  professional_name?: string | null;
  token?: string;
}

const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const DEFAULT_EXPIRY_DAYS = 7;

const notifyProfessionalOfPatient = async (
  professionalId: string,
  patientName: string
): Promise<void> => {
  try {
    await NotificationsService.createNotification({
      userId: professionalId,
      title: 'Nuevo paciente vinculado',
      body: `${patientName} aceptó la invitación y quedó bajo tu cuidado.`,
      type: 'info',
    });
  } catch (error) {
    // La notificación no debe romper la aceptación.
    console.warn('⚠️ No se pudo notificar al profesional:', error);
  }
};

const INVITE_SELECT = `
  SELECT i.id, i.organization_id, o.name AS organization_name,
         i.patient_email, i.status, i.expires_at, i.created_at,
         COALESCE(NULLIF(creator.name, ''), split_part(creator.email, '@', 1)) AS created_by_name,
         i.professional_id,
         COALESCE(NULLIF(prof.name, ''), split_part(prof.email, '@', 1)) AS professional_name
  FROM patient_enrollment_invites i
  JOIN organizations o ON o.id = i.organization_id
  LEFT JOIN users creator ON creator.id = i.created_by
  LEFT JOIN users prof ON prof.id = i.professional_id
`;

const normalizeView = (row: PatientInviteView): PatientInviteView => ({
  id: row.id,
  organization_id: row.organization_id,
  organization_name: row.organization_name,
  patient_email: row.patient_email,
  status: row.status,
  expires_at: row.expires_at,
  created_at: row.created_at,
  created_by_name: row.created_by_name ?? null,
  professional_id: row.professional_id ?? null,
  professional_name: row.professional_name ?? null,
});

const assertOrg = async (organizationId: string): Promise<void> => {
  const org = await query<{ status: string }>(
    `SELECT status FROM organizations WHERE id = $1`,
    [organizationId]
  );
  if (!org.rows[0] || org.rows[0].status !== 'active') {
    throw createError('Organización no disponible', 404, 'ORGANIZATION_NOT_FOUND');
  }
};

const assertProfessionalInOrg = async (
  organizationId: string,
  professionalId: string
): Promise<void> => {
  const member = await query<{ role: string }>(
    `SELECT role FROM organization_members
     WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
    [organizationId, professionalId]
  );
  const role = member.rows[0]?.role;
  if (!role || !['therapist', 'clinical_lead'].includes(role)) {
    throw createError(
      'El profesional indicado no pertenece al centro',
      400,
      'INVALID_PROFESSIONAL'
    );
  }
};

// =====================================================
// CREACIÓN / LISTADO (lado centro)
// =====================================================

export const createPatientInvite = async (input: {
  organizationId: string;
  patientEmail: string;
  professionalId?: string | null;
  createdBy: string;
  expiresDays?: number;
}): Promise<PatientInviteView> => {
  await assertOrg(input.organizationId);

  const email = input.patientEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError('Email del paciente inválido', 400, 'INVALID_EMAIL');
  }

  if (input.professionalId) {
    await assertProfessionalInOrg(input.organizationId, input.professionalId);
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresDays = Math.max(1, Math.min(input.expiresDays ?? DEFAULT_EXPIRY_DAYS, 30));

  const result = await query<PatientInvite>(
    `INSERT INTO patient_enrollment_invites
       (organization_id, patient_email, token_hash, status, expires_at, created_by, professional_id)
     VALUES ($1, $2, $3, 'pending', NOW() + ($4::int * INTERVAL '1 day'), $5, $6)
     RETURNING *`,
    [
      input.organizationId,
      email,
      tokenHash,
      expiresDays,
      input.createdBy,
      input.professionalId ?? null,
    ]
  );

  const invite = result.rows[0]!;

  // El token en claro solo se devuelve una vez al creador.
  return {
    id: invite.id,
    organization_id: invite.organization_id,
    organization_name: '',
    patient_email: invite.patient_email,
    status: invite.status,
    expires_at: invite.expires_at,
    created_at: invite.created_at,
    professional_id: invite.professional_id ?? null,
    token,
  };
};

export const listOrgInvites = async (
  organizationId: string,
  options: { status?: InviteStatus | null; limit?: number } = {}
): Promise<PatientInviteView[]> => {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const params: unknown[] = [organizationId];
  const where: string[] = ['i.organization_id = $1'];

  if (options.status) {
    params.push(options.status);
    where.push(`i.status = $${params.length}`);
  }
  params.push(limit);
  const limitParam = `$${params.length}`;

  const result = await query<PatientInviteView>(
    `${INVITE_SELECT}
     WHERE ${where.join(' AND ')}
     ORDER BY i.created_at DESC
     LIMIT ${limitParam}`,
    params
  );

  return result.rows.map(normalizeView);
};

export const revokeInvite = async (
  inviteId: string,
  organizationId: string
): Promise<PatientInviteView> => {
  const result = await query<PatientInvite>(
    `UPDATE patient_enrollment_invites
     SET status = 'revoked', updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 AND status = 'pending'
     RETURNING id, organization_id, patient_email, status, expires_at, created_at, professional_id`,
    [inviteId, organizationId]
  );

  const invite = result.rows[0];
  if (!invite) {
    throw createError('Invitación no encontrada o ya procesada', 404, 'INVITE_NOT_FOUND');
  }

  return {
    id: invite.id,
    organization_id: invite.organization_id,
    organization_name: '',
    patient_email: invite.patient_email,
    status: invite.status,
    expires_at: invite.expires_at,
    created_at: invite.created_at,
    professional_id: invite.professional_id ?? null,
  };
};

// =====================================================
// ACEPTACIÓN (lado paciente)
// =====================================================

export const getPendingInviteByToken = async (
  token: string
): Promise<PatientInviteView | null> => {
  const result = await query<PatientInviteView>(
    `${INVITE_SELECT}
     WHERE i.token_hash = $1 AND i.status = 'pending' AND i.expires_at > NOW()
     LIMIT 1`,
    [hashToken(token)]
  );
  return result.rows[0] ? normalizeView(result.rows[0]) : null;
};

export const listPendingInvitesForEmail = async (
  email: string,
  limit = 20
): Promise<PatientInviteView[]> => {
  const result = await query<PatientInviteView>(
    `${INVITE_SELECT}
     WHERE lower(i.patient_email) = $1
       AND i.status = 'pending'
       AND i.expires_at > NOW()
     ORDER BY i.created_at DESC
     LIMIT $2`,
    [email.toLowerCase(), Math.min(Math.max(limit, 1), 100)]
  );

  return result.rows.map(normalizeView);
};

export const acceptInvite = async (
  token: string,
  patientId: string
): Promise<{ invite: PatientInviteView; linked: boolean; assigned: boolean }> => {
  const inviteView = await getPendingInviteByToken(token);
  if (!inviteView) {
    throw createError('Invitación no encontrada o expirada', 404, 'INVITE_NOT_FOUND');
  }

  const patient = await UserModel.findById(patientId);
  if (!patient) {
    throw createError('Paciente no encontrado', 404, 'PATIENT_NOT_FOUND');
  }
  if (patient.email.toLowerCase() !== inviteView.patient_email.toLowerCase()) {
    throw createError(
      'Esta invitación corresponde a otro correo',
      403,
      'INVITE_EMAIL_MISMATCH'
    );
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const inviteResult = await client.query<PatientInvite>(
      `UPDATE patient_enrollment_invites
       SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'pending' AND expires_at > NOW()
       RETURNING *`,
      [inviteView.id]
    );

    const invite = inviteResult.rows[0];
    if (!invite) {
      throw createError('La invitación ya no está disponible', 409, 'INVITE_NOT_PENDING');
    }

    const link = await CareModel.linkPatient({
      organizationId: invite.organization_id,
      patientId,
      status: 'active',
      createdBy: invite.created_by ?? patientId,
    });

    let assigned = false;
    if (invite.professional_id) {
      await CareModel.assign({
        organizationPatientId: link.id,
        professionalId: invite.professional_id,
        role: 'primary',
        assignedBy: invite.created_by ?? patientId,
      });
      assigned = true;
    }

    await client.query('COMMIT');

    if (assigned && invite.professional_id && patient) {
      await notifyProfessionalOfPatient(
        invite.professional_id,
        patient.name || patient.email
      );
    }

    return {
      invite: { ...inviteView, status: 'accepted' },
      linked: true,
      assigned,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const acceptInviteById = async (
  inviteId: string,
  patientId: string
): Promise<{ invite: PatientInviteView; linked: boolean; assigned: boolean }> => {
  const patient = await UserModel.findById(patientId);
  if (!patient) {
    throw createError('Paciente no encontrado', 404, 'PATIENT_NOT_FOUND');
  }

  const invites = await listPendingInvitesForEmail(patient.email, 50);
  const inviteView = invites.find((invite) => invite.id === inviteId);
  if (!inviteView) {
    throw createError('Invitación no encontrada', 404, 'INVITE_NOT_FOUND');
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const inviteResult = await client.query<PatientInvite>(
      `UPDATE patient_enrollment_invites
       SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'pending' AND expires_at > NOW()
       RETURNING *`,
      [inviteId]
    );

    const invite = inviteResult.rows[0];
    if (!invite) {
      throw createError('La invitación ya no está disponible', 409, 'INVITE_NOT_PENDING');
    }

    const link = await CareModel.linkPatient({
      organizationId: invite.organization_id,
      patientId,
      status: 'active',
      createdBy: invite.created_by ?? patientId,
    });

    let assigned = false;
    if (invite.professional_id) {
      await CareModel.assign({
        organizationPatientId: link.id,
        professionalId: invite.professional_id,
        role: 'primary',
        assignedBy: invite.created_by ?? patientId,
      });
      assigned = true;
    }

    await client.query('COMMIT');

    if (assigned && invite.professional_id && patient) {
      await notifyProfessionalOfPatient(
        invite.professional_id,
        patient.name || patient.email
      );
    }

    return {
      invite: { ...inviteView, status: 'accepted' },
      linked: true,
      assigned,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default {
  createPatientInvite,
  listOrgInvites,
  revokeInvite,
  getPendingInviteByToken,
  listPendingInvitesForEmail,
  acceptInvite,
  acceptInviteById,
};
