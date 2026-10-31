/**
 * Controlador de credenciales profesionales.
 */

import type { NextFunction, Request, Response } from 'express';
import * as CredentialsService from '../services/credentials.service.js';
import { query } from '../config/database.js';
import { createError } from '../middleware/error.js';
import { getAuthenticatedActor, parseLimit, resolveOrganizationId } from './clinicalContext.js';

const requireOrgRole = async (
  req: Request,
  allowed: Array<'org_admin' | 'clinical_lead' | 'auditor'>
): Promise<{ actorId: string; organizationId: string; role: string }> => {
  const { actorId } = getAuthenticatedActor(req);
  const organizationId = await resolveOrganizationId(req, actorId);

  const member = await query<{ role: string }>(
    `SELECT role FROM organization_members
     WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
    [organizationId, actorId]
  );

  const role = member.rows[0]?.role;
  if (!role || !allowed.includes(role as never)) {
    throw createError('Tu rol no permite esta acción', 403, 'FORBIDDEN');
  }

  return { actorId, organizationId, role };
};

export const upsertCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, organizationId } = await requireOrgRole(req, [
      'org_admin',
      'clinical_lead',
    ]);

    const body = req.body as {
      user_id?: string;
      license_number?: string;
      license_country?: string;
      specialty?: string;
      expires_at?: string | null;
    };

    if (!body.user_id || !body.license_number) {
      throw createError('user_id y license_number son obligatorios', 400, 'INVALID_PAYLOAD');
    }

    const credential = await CredentialsService.upsertCredential({
      organizationId,
      userId: body.user_id,
      licenseNumber: body.license_number,
      licenseCountry: body.license_country,
      specialty: body.specialty,
      expiresAt: body.expires_at ? new Date(body.expires_at) : null,
      actorId,
    });

    res.status(201).json({
      success: true,
      data: credential,
      message: 'Credencial registrada. Pendiente de verificación.',
    });
  } catch (error) {
    next(error);
  }
};

export const listCredentials = async (
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

    const status =
      typeof req.query.status === 'string'
        ? (req.query.status as CredentialsService.CredentialStatus)
        : null;

    const credentials = await CredentialsService.listOrgCredentials(organizationId, {
      status,
      limit: parseLimit(req.query.limit, 100, 300),
    });

    res.json({ success: true, data: { credentials } });
  } catch (error) {
    next(error);
  }
};

export const decideCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, organizationId } = await requireOrgRole(req, [
      'org_admin',
      'clinical_lead',
    ]);

    const credentialId = req.params.id;
    const decision = req.body?.decision;

    if (!credentialId || !['verified', 'rejected'].includes(decision)) {
      throw createError('id y decision (verified/rejected) son obligatorios', 400, 'INVALID_PAYLOAD');
    }

    const credential = await CredentialsService.decideCredential({
      credentialId,
      organizationId,
      decision,
      actorId,
    });

    res.json({
      success: true,
      data: credential,
      message: decision === 'verified' ? 'Credencial verificada' : 'Credencial rechazada',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  upsertCredential,
  listCredentials,
  decideCredential,
};
