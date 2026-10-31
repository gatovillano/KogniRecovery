/**
 * Modelo de vínculos paciente-centro y asignaciones de cuidado.
 */

import { query } from '../config/database.js';

export interface OrganizationPatient {
  id: string;
  organization_id: string;
  patient_id: string;
  status: 'invited' | 'active' | 'discharged' | 'left';
  enrolled_at?: Date | null;
  discharged_at?: Date | null;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CareAssignment {
  id: string;
  organization_patient_id: string;
  professional_id: string;
  role: 'primary' | 'team';
  status: 'active' | 'ended';
  assigned_by?: string | null;
  assigned_at: Date;
  ended_at?: Date | null;
  ended_reason?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PatientListRow {
  organization_patient_id: string;
  patient_id: string;
  name: string;
  email: string;
  care_status: OrganizationPatient['status'];
  enrolled_at?: Date | null;
  assignment_role?: 'primary' | 'team' | null;
}

export const findPatientLink = async (
  organizationId: string,
  patientId: string
): Promise<OrganizationPatient | null> => {
  const result = await query<OrganizationPatient>(
    `SELECT * FROM organization_patients
     WHERE organization_id = $1 AND patient_id = $2`,
    [organizationId, patientId]
  );
  return result.rows[0] ?? null;
};

export const linkPatient = async (input: {
  organizationId: string;
  patientId: string;
  status?: OrganizationPatient['status'];
  createdBy?: string;
}): Promise<OrganizationPatient> => {
  const status = input.status ?? 'active';
  const result = await query<OrganizationPatient>(
    `INSERT INTO organization_patients
       (organization_id, patient_id, status, enrolled_at, created_by)
     VALUES ($1, $2, $3::varchar,
             CASE WHEN $3::text = 'active' THEN NOW() ELSE NULL END, $4)
     ON CONFLICT (organization_id, patient_id)
     DO UPDATE SET status = EXCLUDED.status,
                   enrolled_at = CASE
                     WHEN EXCLUDED.status = 'active' THEN COALESCE(organization_patients.enrolled_at, NOW())
                     ELSE organization_patients.enrolled_at
                   END,
                   updated_at = NOW()
     RETURNING *`,
    [input.organizationId, input.patientId, status, input.createdBy ?? null]
  );
  return result.rows[0]!;
};

export const findActiveAssignment = async (
  organizationPatientId: string,
  professionalId: string
): Promise<CareAssignment | null> => {
  const result = await query<CareAssignment>(
    `SELECT * FROM care_assignments
     WHERE organization_patient_id = $1
       AND professional_id = $2
       AND status = 'active'
     ORDER BY assigned_at DESC
     LIMIT 1`,
    [organizationPatientId, professionalId]
  );
  return result.rows[0] ?? null;
};

export const assign = async (input: {
  organizationPatientId: string;
  professionalId: string;
  role?: 'primary' | 'team';
  assignedBy?: string;
}): Promise<CareAssignment> => {
  const role = input.role ?? 'primary';
  const existing = await query<CareAssignment>(
    `SELECT * FROM care_assignments
     WHERE organization_patient_id = $1 AND professional_id = $2 AND status = 'active'
     LIMIT 1`,
    [input.organizationPatientId, input.professionalId]
  );

  if (existing.rows[0]) {
    const updated = await query<CareAssignment>(
      `UPDATE care_assignments
       SET role = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [existing.rows[0].id, role]
    );
    return updated.rows[0]!;
  }

  const result = await query<CareAssignment>(
    `INSERT INTO care_assignments
       (organization_patient_id, professional_id, role, status, assigned_by)
     VALUES ($1, $2, $3, 'active', $4)
     RETURNING *`,
    [input.organizationPatientId, input.professionalId, role, input.assignedBy ?? null]
  );
  return result.rows[0]!;
};

export const endAssignment = async (
  assignmentId: string,
  reason?: string
): Promise<CareAssignment | null> => {
  const result = await query<CareAssignment>(
    `UPDATE care_assignments
     SET status = 'ended', ended_at = NOW(), ended_reason = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [assignmentId, reason ?? null]
  );
  return result.rows[0] ?? null;
};

export const findAssignmentInOrganization = async (
  assignmentId: string,
  organizationId: string
): Promise<CareAssignment | null> => {
  const result = await query<CareAssignment>(
    `SELECT ca.*
     FROM care_assignments ca
     JOIN organization_patients op ON op.id = ca.organization_patient_id
     WHERE ca.id = $1 AND op.organization_id = $2`,
    [assignmentId, organizationId]
  );
  return result.rows[0] ?? null;
};

export const listPatientsForProfessional = async (
  organizationId: string,
  professionalId: string
): Promise<PatientListRow[]> => {
  const result = await query<PatientListRow>(
    `SELECT op.id AS organization_patient_id,
            op.patient_id,
            COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) AS name,
            u.email,
            op.status AS care_status,
            op.enrolled_at,
            ca.role AS assignment_role
     FROM organization_patients op
     JOIN users u ON u.id = op.patient_id
     JOIN care_assignments ca
       ON ca.organization_patient_id = op.id
      AND ca.status = 'active'
     WHERE op.organization_id = $1
       AND op.status = 'active'
       AND ca.professional_id = $2
     ORDER BY name ASC`,
    [organizationId, professionalId]
  );
  return result.rows;
};

export const listPatientsForOrganization = async (
  organizationId: string
): Promise<PatientListRow[]> => {
  const result = await query<PatientListRow>(
    `SELECT op.id AS organization_patient_id,
            op.patient_id,
            COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) AS name,
            u.email,
            op.status AS care_status,
            op.enrolled_at,
            NULL::varchar AS assignment_role
     FROM organization_patients op
     JOIN users u ON u.id = op.patient_id
     WHERE op.organization_id = $1
       AND op.status = 'active'
     ORDER BY name ASC`,
    [organizationId]
  );
  return result.rows;
};

export const listOrganizationsForPatient = async (
  patientId: string
): Promise<
  Array<
    OrganizationPatient & {
      organization_name: string;
      organization_status: string;
      professional_id?: string | null;
      professional_name?: string | null;
    }
  >
> => {
  const result = await query<
    OrganizationPatient & {
      organization_name: string;
      organization_status: string;
      professional_id?: string | null;
      professional_name?: string | null;
    }
  >(
    `SELECT op.*, o.name AS organization_name, o.status AS organization_status,
            ca.professional_id,
            COALESCE(NULLIF(pu.name, ''), split_part(pu.email, '@', 1)) AS professional_name
     FROM organization_patients op
     JOIN organizations o ON o.id = op.organization_id
     LEFT JOIN LATERAL (
       SELECT ca.professional_id
       FROM care_assignments ca
       WHERE ca.organization_patient_id = op.id
         AND ca.status = 'active'
       ORDER BY CASE WHEN ca.role = 'primary' THEN 0 ELSE 1 END, ca.assigned_at ASC
       LIMIT 1
     ) ca ON TRUE
     LEFT JOIN users pu ON pu.id = ca.professional_id
     WHERE op.patient_id = $1
       AND op.status IN ('invited', 'active', 'discharged')
       AND o.status <> 'closed'
     ORDER BY o.name ASC`,
    [patientId]
  );
  return result.rows;
};

export const listAssignmentsForPatient = async (
  organizationPatientId: string
): Promise<CareAssignment[]> => {
  const result = await query<CareAssignment>(
    `SELECT * FROM care_assignments
     WHERE organization_patient_id = $1
     ORDER BY status ASC, assigned_at DESC`,
    [organizationPatientId]
  );
  return result.rows;
};

export default {
  findPatientLink,
  linkPatient,
  findActiveAssignment,
  assign,
  endAssignment,
  findAssignmentInOrganization,
  listPatientsForProfessional,
  listPatientsForOrganization,
  listOrganizationsForPatient,
  listAssignmentsForPatient,
};
