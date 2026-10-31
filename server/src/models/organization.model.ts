/**
 * Modelo de organizaciones (centros de salud mental).
 */

import { query } from '../config/database.js';

export type OrganizationRole = 'org_admin' | 'clinical_lead' | 'therapist' | 'auditor';
export type OrganizationMemberStatus = 'invited' | 'active' | 'suspended' | 'removed';

export interface Organization {
  id: string;
  name: string;
  legal_name?: string | null;
  tax_id?: string | null;
  country: string;
  timezone: string;
  status: 'active' | 'suspended' | 'closed';
  settings: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  status: OrganizationMemberStatus;
  invited_by?: string | null;
  joined_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationWithMembership extends Organization {
  membership_role: OrganizationRole;
  membership_status: OrganizationMemberStatus;
}

export interface OrganizationMemberView extends OrganizationMembership {
  name: string;
  email: string;
  license_number?: string | null;
  verification_status?: string | null;
}

const TABLE = 'organizations';

export const create = async (input: {
  name: string;
  legal_name?: string;
  tax_id?: string;
  country?: string;
  timezone?: string;
  settings?: Record<string, unknown>;
  created_by?: string;
}): Promise<Organization> => {
  const result = await query<Organization>(
    `INSERT INTO ${TABLE} (name, legal_name, tax_id, country, timezone, settings)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.name,
      input.legal_name ?? null,
      input.tax_id ?? null,
      input.country ?? 'CL',
      input.timezone ?? 'America/Santiago',
      JSON.stringify(input.settings ?? {}),
    ]
  );

  return result.rows[0]!;
};

export const findById = async (id: string): Promise<Organization | null> => {
  const result = await query<Organization>(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
};

export const listAll = async (): Promise<Organization[]> => {
  const result = await query<Organization>(`SELECT * FROM ${TABLE} ORDER BY name ASC`);
  return result.rows;
};

export const listForUser = async (userId: string): Promise<OrganizationWithMembership[]> => {
  const result = await query<OrganizationWithMembership>(
    `SELECT o.*, om.role AS membership_role, om.status AS membership_status
     FROM ${TABLE} o
     JOIN organization_members om ON om.organization_id = o.id
     WHERE om.user_id = $1
       AND om.status IN ('active', 'invited')
       AND o.status <> 'closed'
     ORDER BY o.name ASC`,
    [userId]
  );
  return result.rows;
};

export const findMembership = async (
  organizationId: string,
  userId: string
): Promise<OrganizationMembership | null> => {
  const result = await query<OrganizationMembership>(
    `SELECT * FROM organization_members
     WHERE organization_id = $1 AND user_id = $2`,
    [organizationId, userId]
  );
  return result.rows[0] ?? null;
};

export const addMember = async (input: {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  invitedBy?: string;
  status?: OrganizationMemberStatus;
}): Promise<OrganizationMembership> => {
  const status = input.status ?? 'active';
  const result = await query<OrganizationMembership>(
    `INSERT INTO organization_members
       (organization_id, user_id, role, status, invited_by, joined_at)
     VALUES ($1, $2, $3, $4::varchar, $5,
             CASE WHEN $4::text = 'active' THEN NOW() ELSE NULL END)
     ON CONFLICT (organization_id, user_id)
     DO UPDATE SET role = EXCLUDED.role,
                   status = EXCLUDED.status,
                   invited_by = COALESCE(EXCLUDED.invited_by, organization_members.invited_by),
                   joined_at = CASE
                     WHEN EXCLUDED.status = 'active' THEN COALESCE(organization_members.joined_at, NOW())
                     ELSE organization_members.joined_at
                   END,
                   updated_at = NOW()
     RETURNING *`,
    [input.organizationId, input.userId, input.role, status, input.invitedBy ?? null]
  );
  return result.rows[0]!;
};

export const updateMemberStatus = async (
  organizationId: string,
  userId: string,
  status: OrganizationMemberStatus
): Promise<OrganizationMembership | null> => {
  const result = await query<OrganizationMembership>(
    `UPDATE organization_members
     SET status = $3, updated_at = NOW()
     WHERE organization_id = $1 AND user_id = $2
     RETURNING *`,
    [organizationId, userId, status]
  );
  return result.rows[0] ?? null;
};

export const listMembers = async (
  organizationId: string
): Promise<OrganizationMemberView[]> => {
  const result = await query<OrganizationMemberView>(
    `SELECT om.*, u.name, u.email,
            pc.license_number, pc.verification_status
     FROM organization_members om
     JOIN users u ON u.id = om.user_id
     LEFT JOIN LATERAL (
       SELECT license_number, verification_status
       FROM professional_credentials
       WHERE organization_id = om.organization_id
         AND user_id = om.user_id
       ORDER BY created_at DESC
       LIMIT 1
     ) pc ON TRUE
     WHERE om.organization_id = $1
     ORDER BY u.name ASC`,
    [organizationId]
  );
  return result.rows;
};

export default {
  create,
  findById,
  listAll,
  listForUser,
  findMembership,
  addMember,
  updateMemberStatus,
  listMembers,
};
