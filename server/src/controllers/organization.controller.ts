/**
 * Controlador de organización (centro) y plataforma.
 *
 * El centro administra vínculos, miembros y asignaciones, pero nunca
 * puede habilitar categorías de consentimiento.
 */

import type { NextFunction, Request, Response } from 'express';
import * as OrganizationModel from '../models/organization.model.js';
import type { OrganizationRole } from '../models/organization.model.js';
import * as CareModel from '../models/care.model.js';
import * as UserModel from '../models/user.model.js';
import { query } from '../config/database.js';
import * as ClinicalAccess from '../services/clinicalAccess.service.js';
import * as AuditService from '../services/audit.service.js';
import { createError } from '../middleware/error.js';
import {
  getAuthenticatedActor,
  parseLimit,
  resolveOrganizationId,
} from './clinicalContext.js';

const ORG_ADMIN_ROLES: OrganizationRole[] = ['org_admin', 'clinical_lead'];

const requireOrgRole = async (
  req: Request,
  allowed: OrganizationRole[]
): Promise<{ actorId: string; organizationId: string; role: OrganizationRole }> => {
  const { actorId, actorRole } = getAuthenticatedActor(req);
  const organizationId = await resolveOrganizationId(req, actorId);
  const auditContext = ClinicalAccess.buildAuditContext(req);

  const { membership } = await ClinicalAccess.resolveMembership(
    actorId,
    actorRole,
    organizationId,
    auditContext
  );

  if (!allowed.includes(membership.role)) {
    throw createError(
      'Tu rol no permite realizar esta acción',
      403,
      'FORBIDDEN'
    );
  }

  return { actorId, organizationId, role: membership.role };
};

// =====================================================
// ORGANIZACIÓN
// =====================================================

export const listMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgRole(req, ORG_ADMIN_ROLES);
    const members = await OrganizationModel.listMembers(organizationId);
    res.json({ success: true, data: { members } });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, organizationId } = await requireOrgRole(req, ['org_admin']);
    const body = req.body as {
      user_id?: string;
      role?: OrganizationRole;
      license_number?: string;
      license_country?: string;
      specialty?: string;
    };

    if (!body.user_id || !body.role) {
      throw createError('Faltan user_id o role', 400, 'INVALID_PAYLOAD');
    }

    if (!['org_admin', 'clinical_lead', 'therapist', 'auditor'].includes(body.role)) {
      throw createError('Rol de organización inválido', 400, 'INVALID_ROLE');
    }

    const user = await UserModel.findById(body.user_id);
    if (!user) {
      throw createError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    const membership = await OrganizationModel.addMember({
      organizationId,
      userId: body.user_id,
      role: body.role,
      invitedBy: actorId,
      status: 'active',
    });

    res.status(201).json({ success: true, data: membership });
  } catch (error) {
    next(error);
  }
};

export const suspendMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgRole(req, ['org_admin']);
    const userId = req.params.id;
    const body = req.body as { status?: OrganizationModel.OrganizationMemberStatus };

    if (!userId || !body.status) {
      throw createError('Faltan id o status', 400, 'INVALID_PAYLOAD');
    }

    const membership = await OrganizationModel.updateMemberStatus(
      organizationId,
      userId,
      body.status
    );

    if (!membership) {
      throw createError('Miembro no encontrado', 404, 'MEMBER_NOT_FOUND');
    }

    res.json({ success: true, data: membership });
  } catch (error) {
    next(error);
  }
};

export const listPatients = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgRole(req, ORG_ADMIN_ROLES);
    const patients = await CareModel.listPatientsForOrganization(organizationId);

    // Metadatos administrativos: nunca contenido clínico.
    res.json({
      success: true,
      data: {
        patients: patients.map((patient) => ({
          id: patient.patient_id,
          organization_patient_id: patient.organization_patient_id,
          display_name: patient.name,
          care_status: patient.care_status,
          enrolled_at: patient.enrolled_at ?? null,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const linkPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, organizationId } = await requireOrgRole(req, ORG_ADMIN_ROLES);
    const body = req.body as {
      patient_id?: string;
      patient_email?: string;
      professional_id?: string;
      assignment_role?: 'primary' | 'team';
    };

    let patientId = body.patient_id;
    if (!patientId && body.patient_email) {
      const user = await UserModel.findByEmail(body.patient_email.toLowerCase());
      patientId = user?.id;
    }

    if (!patientId) {
      throw createError(
        'Debes indicar patient_id o patient_email de un usuario existente',
        404,
        'PATIENT_NOT_FOUND'
      );
    }

    const patient = await UserModel.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      throw createError('El usuario no es un paciente', 400, 'NOT_A_PATIENT');
    }

    const link = await CareModel.linkPatient({
      organizationId,
      patientId,
      status: 'active',
      createdBy: actorId,
    });

    let assignment = null;
    if (body.professional_id) {
      const professional = await OrganizationModel.findMembership(
        organizationId,
        body.professional_id
      );
      if (
        !professional ||
        professional.status !== 'active' ||
        !['therapist', 'clinical_lead'].includes(professional.role)
      ) {
        throw createError(
          'El profesional no pertenece al centro',
          400,
          'INVALID_PROFESSIONAL'
        );
      }

      assignment = await CareModel.assign({
        organizationPatientId: link.id,
        professionalId: body.professional_id,
        role: body.assignment_role ?? 'primary',
        assignedBy: actorId,
      });
    }

    res.status(201).json({ success: true, data: { link, assignment } });
  } catch (error) {
    next(error);
  }
};

export const createAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, organizationId } = await requireOrgRole(req, ORG_ADMIN_ROLES);
    const body = req.body as {
      patient_id?: string;
      professional_id?: string;
      role?: 'primary' | 'team';
    };

    if (!body.patient_id || !body.professional_id) {
      throw createError(
        'Faltan patient_id o professional_id',
        400,
        'INVALID_PAYLOAD'
      );
    }

    const link = await CareModel.findPatientLink(organizationId, body.patient_id);
    if (!link || link.status !== 'active') {
      throw createError('Paciente no vinculado al centro', 404, 'PATIENT_NOT_FOUND');
    }

    const professional = await OrganizationModel.findMembership(
      organizationId,
      body.professional_id
    );
    if (
      !professional ||
      professional.status !== 'active' ||
      !['therapist', 'clinical_lead'].includes(professional.role)
    ) {
      throw createError(
        'El profesional no pertenece al centro',
        400,
        'INVALID_PROFESSIONAL'
      );
    }

    const assignment = await CareModel.assign({
      organizationPatientId: link.id,
      professionalId: body.professional_id,
      role: body.role ?? 'primary',
      assignedBy: actorId,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

export const endAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgRole(req, ORG_ADMIN_ROLES);
    const assignmentId = req.params.id;
    if (!assignmentId) {
      throw createError('Asignación no indicada', 400, 'ASSIGNMENT_ID_REQUIRED');
    }

    const existing = await CareModel.findAssignmentInOrganization(
      assignmentId,
      organizationId
    );

    if (!existing) {
      throw createError('Asignación no encontrada', 404, 'ASSIGNMENT_NOT_FOUND');
    }

    const body = req.body as { reason?: string };
    const assignment = await CareModel.endAssignment(assignmentId, body.reason);
    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

export const getAudit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgRole(req, [
      'org_admin',
      'clinical_lead',
      'auditor',
    ]);

    const entries = await AuditService.listAccessForOrganization(organizationId, {
      limit: parseLimit(req.query.limit, 100, 500),
      patientId:
        typeof req.query.patient_id === 'string' ? req.query.patient_id : null,
      actorId:
        typeof req.query.actor_id === 'string' ? req.query.actor_id : null,
      onlyDenied: req.query.only_denied === 'true',
    });

    res.json({
      success: true,
      data: {
        entries: entries.map((entry) => ({
          id: entry.id,
          actor_name: entry.actor_name ?? null,
          actor_role: entry.actor_role,
          patient_id: entry.patient_id ?? null,
          action: entry.action,
          resource_type: entry.resource_type,
          purpose: entry.purpose,
          success: entry.success,
          denial_reason: entry.denial_reason ?? null,
          created_at: entry.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// PLATAFORMA
// =====================================================

export const createOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const body = req.body as {
      name?: string;
      legal_name?: string;
      tax_id?: string;
      country?: string;
      timezone?: string;
      admin_user_id?: string;
    };

    if (!body.name) {
      throw createError('El nombre es obligatorio', 400, 'INVALID_PAYLOAD');
    }

    const organization = await OrganizationModel.create({
      name: body.name,
      legal_name: body.legal_name,
      tax_id: body.tax_id,
      country: body.country,
      timezone: body.timezone,
    });

    await OrganizationModel.addMember({
      organizationId: organization.id,
      userId: body.admin_user_id ?? actorId,
      role: 'org_admin',
      invitedBy: actorId,
      status: 'active',
    });

    res.status(201).json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
};

export const listOrganizations = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizations = await OrganizationModel.listAll();
    res.json({ success: true, data: { organizations } });
  } catch (error) {
    next(error);
  }
};

export const suspendOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.params.id;
    if (!organizationId) {
      throw createError('Organización no indicada', 400, 'ORG_ID_REQUIRED');
    }

    const result = await query<OrganizationModel.Organization>(
      `UPDATE organizations
       SET status = 'suspended', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [organizationId]
    );

    if (!result.rows[0]) {
      throw createError('Organización no encontrada', 404, 'ORG_NOT_FOUND');
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export default {
  listMembers,
  addMember,
  suspendMember,
  listPatients,
  linkPatient,
  createAssignment,
  endAssignment,
  getAudit,
  createOrganization,
  listOrganizations,
  suspendOrganization,
};
