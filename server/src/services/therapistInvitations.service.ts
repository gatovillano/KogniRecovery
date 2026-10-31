/**
 * Invitaciones a terapeutas / roles del centro.
 *
 * El org_admin envía una invitación por email con un token (hasheado).
 * El profesional invitado inicia sesión en el panel y la acepta, lo que
 * activa su membresía en `organization_members` con el rol indicado.
 *
 * El flujo de "crear cuenta desde cero por enlace" puede añadirse
 * después; aquí se asume que el profesional ya tiene cuenta.
 */

import crypto from 'node:crypto';
import { query, getPool } from '../config/database.js';
import { createError } from '../middleware/error.js';
import * as OrganizationModel from '../models/organization.model.js';
import type { OrganizationRole } from '../models/organization.model.js';
import * as UserModel from '../models/user.model.js';

export type TherapistInviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface TherapistInvite {
  id: string;
  organization_id: string;
  email: string;
  token_hash: string;
  role: OrganizationRole;
  status: TherapistInviteStatus;
  expires_at: Date;
  created_by?: string | null;
  accepted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TherapistInviteView {
  id: string;
  organization_id: string;
  organization_name: string;
  email: string;
  role: OrganizationRole;
  status: TherapistInviteStatus;
  expires_at: Date;
  created_at: Date;
  created_by_name?: string | null;
  token?: string;
}

const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const VALID_ROLES: OrganizationRole[] = ['org_admin', 'clinical_lead', 'therapist', 'auditor'];

const INVITE_SELECT = `
  SELECT i.id, i.organization_id, o.name AS organization_name,
         i.email, i.role, i.status, i.expires_at, i.created_at,
         COALESCE(NULLIF(creator.name, ''), split_part(creator.email, '@', 1)) AS created_by_name
  FROM therapist_invites i
  JOIN organizations o ON o.id = i.organization_id
  LEFT JOIN users creator ON creator.id = i.created_by
`;

const normalizeView = (row: TherapistInviteView): TherapistInviteView => ({
  id: row.id,
  organization_id: row.organization_id,
  organization_name: row.organization_name,
  email: row.email,
  role: row.role,
  status: row.status,
  expires_at: row.expires_at,
  created_at: row.created_at,
  created_by_name: row.created_by_name ?? null,
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

// =====================================================
// CREACIÓN / LISTADO / REVOCACIÓN
// =====================================================

export const createTherapistInvite = async (input: {
  organizationId: string;
  email: string;
  role: OrganizationRole;
  createdBy: string;
  expiresDays?: number;
}): Promise<TherapistInviteView> => {
  await assertOrg(input.organizationId);

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError('Email inválido', 400, 'INVALID_EMAIL');
  }
  if (!VALID_ROLES.includes(input.role)) {
    throw createError('Rol inválido', 400, 'INVALID_ROLE');
  }

  // No invitar a alguien que ya es miembro activo.
  const existing = await query<{ id: string }>(
    `SELECT om.id FROM organization_members om
     JOIN users u ON u.id = om.user_id
     WHERE om.organization_id = $1 AND lower(u.email) = $2 AND om.status = 'active'`,
    [input.organizationId, email]
  );
  if (existing.rows[0]) {
    throw createError('El usuario ya es miembro activo del centro', 409, 'ALREADY_MEMBER');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresDays = Math.max(1, Math.min(input.expiresDays ?? 7, 30));

  const result = await query<TherapistInvite>(
    `INSERT INTO therapist_invites
       (organization_id, email, token_hash, role, status, expires_at, created_by)
     VALUES ($1, $2, $3, $4, 'pending', NOW() + ($5::int * INTERVAL '1 day'), $6)
     RETURNING *`,
    [input.organizationId, email, hashToken(token), input.role, expiresDays, input.createdBy]
  );

  const invite = result.rows[0]!;

  return {
    id: invite.id,
    organization_id: invite.organization_id,
    organization_name: '',
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expires_at: invite.expires_at,
    created_at: invite.created_at,
    token,
  };
};

export const listOrgTherapistInvites = async (
  organizationId: string,
  options: { status?: TherapistInviteStatus | null; limit?: number } = {}
): Promise<TherapistInviteView[]> => {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const params: unknown[] = [organizationId];
  const where: string[] = ['i.organization_id = $1'];

  if (options.status) {
    params.push(options.status);
    where.push(`i.status = $${params.length}`);
  }
  params.push(limit);
  const limitParam = `$${params.length}`;

  const result = await query<TherapistInviteView>(
    `${INVITE_SELECT}
     WHERE ${where.join(' AND ')}
     ORDER BY i.created_at DESC
     LIMIT ${limitParam}`,
    params
  );

  return result.rows.map(normalizeView);
};

export const revokeTherapistInvite = async (
  inviteId: string,
  organizationId: string
): Promise<TherapistInviteView> => {
  const result = await query<TherapistInvite>(
    `UPDATE therapist_invites
     SET status = 'revoked', updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 AND status = 'pending'
     RETURNING id, organization_id, email, role, status, expires_at, created_at`,
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
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expires_at: invite.expires_at,
    created_at: invite.created_at,
  };
};

// =====================================================
// ACEPTACIÓN
// =====================================================

export const acceptTherapistInvite = async (
  token: string,
  userId: string
): Promise<{ invite: TherapistInviteView; role: OrganizationRole; activated: boolean }> => {
  const result = await query<TherapistInvite>(
    `${INVITE_SELECT.replace('SELECT i.id', 'SELECT i.id, i.token_hash')} 
     WHERE i.token_hash = $1 AND i.status = 'pending' AND i.expires_at > NOW()
     LIMIT 1`,
    [hashToken(token)]
  );

  const invite = result.rows[0];
  if (!invite) {
    throw createError('Invitación no encontrada o expirada', 404, 'INVITE_NOT_FOUND');
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw createError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }
  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw createError('Esta invitación corresponde a otro correo', 403, 'INVITE_EMAIL_MISMATCH');
  }
  if (user.role !== 'professional' && user.role !== 'admin') {
    throw createError('Solo cuentas profesionales pueden aceptar esta invitación', 403, 'NOT_A_PROFESSIONAL');
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const updated = await client.query<TherapistInvite>(
      `UPDATE therapist_invites
       SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'pending' AND expires_at > NOW()
       RETURNING *`,
      [invite.id]
    );

    const accepted = updated.rows[0];
    if (!accepted) {
      throw createError('La invitación ya no está disponible', 409, 'INVITE_NOT_PENDING');
    }

    await OrganizationModel.addMember({
      organizationId: accepted.organization_id,
      userId,
      role: accepted.role,
      invitedBy: accepted.created_by ?? undefined,
      status: 'active',
    });

    await client.query('COMMIT');

    return {
      invite: {
        ...(normalizeView(invite as unknown as TherapistInviteView)),
        status: 'accepted',
        role: accepted.role,
      },
      role: accepted.role,
      activated: true,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default {
  createTherapistInvite,
  listOrgTherapistInvites,
  revokeTherapistInvite,
  acceptTherapistInvite,
};
