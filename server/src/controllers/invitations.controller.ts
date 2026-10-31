/**
 * Controlador de invitaciones (centro y paciente).
 */

import type { NextFunction, Request, Response } from 'express';
import * as InvitationsService from '../services/invitations.service.js';
import * as TherapistInvitationsService from '../services/therapistInvitations.service.js';
import * as ClinicalAccess from '../services/clinicalAccess.service.js';
import { query } from '../config/database.js';
import { createError } from '../middleware/error.js';
import { getAuthenticatedActor, parseLimit, resolveOrganizationId } from './clinicalContext.js';

const contextFor = (req: Request): ClinicalAccess.AuditContext =>
  ClinicalAccess.buildAuditContext(req);

// =====================================================
// LADO CENTRO
// =====================================================

const requireOrgAdminOrLead = async (
  req: Request
): Promise<{ actorId: string; organizationId: string; role: string }> => {
  const { actorId } = getAuthenticatedActor(req);
  const organizationId = await resolveOrganizationId(req, actorId);

  const member = await query<{ role: string }>(
    `SELECT role FROM organization_members
     WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
    [organizationId, actorId]
  );

  const role = member.rows[0]?.role;
  if (!role || !['org_admin', 'clinical_lead'].includes(role)) {
    throw createError(
      'Tu rol no permite crear invitaciones',
      403,
      'FORBIDDEN'
    );
  }

  return { actorId, organizationId, role };
};

export const createPatientInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, organizationId } = await requireOrgAdminOrLead(req);
    const body = req.body as {
      patient_email?: string;
      professional_id?: string;
      expires_days?: number;
    };

    if (!body.patient_email) {
      throw createError('patient_email es obligatorio', 400, 'INVALID_PAYLOAD');
    }

    const invite = await InvitationsService.createPatientInvite({
      organizationId,
      patientEmail: body.patient_email,
      professionalId: body.professional_id ?? null,
      createdBy: actorId,
      expiresDays: body.expires_days,
    });

    res.status(201).json({
      success: true,
      data: invite,
      message: 'Invitación creada. Comparte el token con el paciente.',
      meta: { request_id: contextFor(req).requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const listInvites = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgAdminOrLead(req);

    const status =
      typeof req.query.status === 'string'
        ? (req.query.status as InvitationsService.InviteStatus)
        : null;

    const invites = await InvitationsService.listOrgInvites(organizationId, {
      status,
      limit: parseLimit(req.query.limit, 50, 200),
    });

    res.json({
      success: true,
      data: { invites },
      meta: { request_id: contextFor(req).requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const revokeInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgAdminOrLead(req);
    const inviteId = req.params.id;
    if (!inviteId) {
      throw createError('Invitación no indicada', 400, 'INVITE_ID_REQUIRED');
    }

    const invite = await InvitationsService.revokeInvite(inviteId, organizationId);

    res.json({
      success: true,
      data: invite,
      message: 'Invitación revocada',
      meta: { request_id: contextFor(req).requestId },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// LADO PACIENTE
// =====================================================

export const pendingInvites = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);

    const user = await query<{ email: string }>(
      `SELECT email FROM users WHERE id = $1`,
      [actorId]
    );

    const invites = await InvitationsService.listPendingInvitesForEmail(
      user.rows[0]?.email ?? ''
    );

    res.json({
      success: true,
      data: { invites },
      meta: { request_id: contextFor(req).requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const token = req.body?.token;

    if (!token || typeof token !== 'string') {
      throw createError('token es obligatorio', 400, 'INVALID_PAYLOAD');
    }

    const result = await InvitationsService.acceptInvite(token.trim(), actorId);

    res.json({
      success: true,
      data: result,
      message: result.assigned
        ? 'Vínculo creado y terapeuta asignado'
        : 'Vínculo creado',
      meta: { request_id: contextFor(req).requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const acceptInviteById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const inviteId = req.params.id;
    if (!inviteId) {
      throw createError('Invitación no indicada', 400, 'INVITE_ID_REQUIRED');
    }

    const result = await InvitationsService.acceptInviteById(inviteId, actorId);

    res.json({
      success: true,
      data: result,
      message: result.assigned
        ? 'Vínculo creado y terapeuta asignado'
        : 'Vínculo creado',
      meta: { request_id: contextFor(req).requestId },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// INVITACIONES A TERAPEUTAS (roles de centro)
// =====================================================

const requireOrgAdmin = async (
  req: Request
): Promise<{ actorId: string; organizationId: string }> => {
  const { actorId } = getAuthenticatedActor(req);
  const organizationId = await resolveOrganizationId(req, actorId);

  const member = await query<{ role: string }>(
    `SELECT role FROM organization_members
     WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
    [organizationId, actorId]
  );

  if (member.rows[0]?.role !== 'org_admin') {
    throw createError(
      'Solo el administrador del centro puede gestionar invitaciones de personal',
      403,
      'FORBIDDEN'
    );
  }

  return { actorId, organizationId };
};

export const createTherapistInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, organizationId } = await requireOrgAdmin(req);
    const body = req.body as {
      email?: string;
      role?: 'org_admin' | 'clinical_lead' | 'therapist' | 'auditor';
      expires_days?: number;
    };

    if (!body.email || !body.role) {
      throw createError('email y role son obligatorios', 400, 'INVALID_PAYLOAD');
    }

    const invite = await TherapistInvitationsService.createTherapistInvite({
      organizationId,
      email: body.email,
      role: body.role,
      createdBy: actorId,
      expiresDays: body.expires_days,
    });

    res.status(201).json({
      success: true,
      data: invite,
      message: 'Invitación creada. Comparte el token con el profesional.',
      meta: { request_id: contextFor(req).requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const listTherapistInvites = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgAdmin(req);

    const status =
      typeof req.query.status === 'string'
        ? (req.query.status as TherapistInvitationsService.TherapistInviteStatus)
        : null;

    const invites = await TherapistInvitationsService.listOrgTherapistInvites(
      organizationId,
      { status, limit: parseLimit(req.query.limit, 50, 200) }
    );

    res.json({
      success: true,
      data: { invites },
      meta: { request_id: contextFor(req).requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const revokeTherapistInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgAdmin(req);
    const inviteId = req.params.id;
    if (!inviteId) {
      throw createError('Invitación no indicada', 400, 'INVITE_ID_REQUIRED');
    }

    const invite = await TherapistInvitationsService.revokeTherapistInvite(
      inviteId,
      organizationId
    );

    res.json({
      success: true,
      data: invite,
      message: 'Invitación revocada',
      meta: { request_id: contextFor(req).requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const acceptTherapistInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const token = req.body?.token;

    if (!token || typeof token !== 'string') {
      throw createError('token es obligatorio', 400, 'INVALID_PAYLOAD');
    }

    const result = await TherapistInvitationsService.acceptTherapistInvite(
      token.trim(),
      actorId
    );

    res.json({
      success: true,
      data: result,
      message: `Membresía activada como ${result.role}`,
      meta: { request_id: contextFor(req).requestId },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createPatientInvite,
  listInvites,
  revokeInvite,
  pendingInvites,
  acceptInvite,
  acceptInviteById,
  createTherapistInvite,
  listTherapistInvites,
  revokeTherapistInvite,
  acceptTherapistInvite,
};
