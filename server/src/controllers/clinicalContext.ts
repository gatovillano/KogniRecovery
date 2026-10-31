/**
 * Helpers compartidos por los controladores del panel.
 */

import type { Request } from 'express';
import { createError } from '../middleware/error.js';
import type { AuthRequest } from '../middleware/auth.js';
import * as OrganizationModel from '../models/organization.model.js';

export const getAuthenticatedActor = (
  req: Request
): { actorId: string; actorRole: string } => {
  const authReq = req as AuthRequest;
  const actorId = authReq.user?.userId;
  if (!actorId) {
    throw createError('Usuario no autenticado', 401, 'UNAUTHORIZED');
  }
  return { actorId, actorRole: authReq.user?.role ?? 'unknown' };
};

/**
 * Resuelve la organización activa:
 * 1. header X-Organization-Id
 * 2. query/body organization_id
 * 3. única organización activa del usuario
 */
export const resolveOrganizationId = async (
  req: Request,
  actorId: string
): Promise<string> => {
  const candidates = [
    req.header('x-organization-id'),
    typeof req.query.organization_id === 'string'
      ? req.query.organization_id
      : undefined,
    typeof (req.body as { organization_id?: unknown } | undefined)?.organization_id ===
    'string'
      ? ((req.body as { organization_id: string }).organization_id)
      : undefined,
  ];

  const explicit = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === 'string' && candidate.trim().length > 0
  );

  if (explicit) return explicit.trim();

  const organizations = await OrganizationModel.listForUser(actorId);
  const active = organizations.filter(
    (organization) => organization.membership_status === 'active'
  );

  if (active.length === 0) {
    throw createError(
      'No perteneces a ninguna organización activa',
      403,
      'NOT_A_MEMBER'
    );
  }

  if (active.length > 1) {
    throw createError(
      'Selecciona una organización con el header X-Organization-Id',
      400,
      'ORGANIZATION_REQUIRED'
    );
  }

  return active[0]!.id;
};

export const parseLimit = (
  value: unknown,
  fallback: number,
  max: number
): number => {
  const parsed =
    typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};
