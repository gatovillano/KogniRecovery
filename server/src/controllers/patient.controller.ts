/**
 * Controlador del paciente para vínculos, consentimiento y transparencia.
 *
 * Todas las acciones operan sobre el propio paciente autenticado.
 */

import type { NextFunction, Request, Response } from 'express';
import * as SharingConsentService from '../services/sharingConsent.service.js';
import type {
  ConsentCategoryPayload,
  GrantConsentInput,
} from '../services/sharingConsent.service.js';
import { createError } from '../middleware/error.js';
import { getAuthenticatedActor, parseLimit } from './clinicalContext.js';

const consentMeta = (req: Request, actorId: string) => ({
  actorId,
  ipAddress: req.ip ?? null,
  userAgent: req.header('user-agent') ?? null,
});

export const getCareLinks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const links = await SharingConsentService.listCareLinks(actorId);
    res.json({ success: true, data: { care_links: links } });
  } catch (error) {
    next(error);
  }
};

export const listSharingConsents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const consents = await SharingConsentService.listPatientConsents(actorId);
    res.json({
      success: true,
      data: {
        consents,
        catalog: SharingConsentService.getConsentCatalog(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const grantSharingConsent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const body = req.body as Partial<GrantConsentInput>;

    if (
      !body.organization_id ||
      !body.grantee_type ||
      !body.grantee_id ||
      !Array.isArray(body.categories)
    ) {
      throw createError(
        'Faltan organization_id, grantee_type, grantee_id o categories',
        400,
        'INVALID_PAYLOAD'
      );
    }

    const consent = await SharingConsentService.grantConsent(
      actorId,
      {
        organization_id: body.organization_id,
        grantee_type: body.grantee_type,
        grantee_id: body.grantee_id,
        purpose: body.purpose,
        history_days: body.history_days,
        expires_at: body.expires_at,
        categories: body.categories,
      },
      consentMeta(req, actorId)
    );

    res.status(201).json({
      success: true,
      data: consent,
      message: 'Consentimiento otorgado',
    });
  } catch (error) {
    next(error);
  }
};

export const updateSharingConsent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const consentId = req.params.id;
    if (!consentId) {
      throw createError('Consentimiento no indicado', 400, 'CONSENT_ID_REQUIRED');
    }

    const body = req.body as {
      categories?: ConsentCategoryPayload[];
      history_days?: number | null;
      expires_at?: string | null;
    };

    if (!Array.isArray(body.categories)) {
      throw createError(
        'El cuerpo debe incluir categories',
        400,
        'INVALID_PAYLOAD'
      );
    }

    const consent = await SharingConsentService.updateConsent(
      actorId,
      consentId,
      {
        categories: body.categories,
        history_days: body.history_days,
        expires_at: body.expires_at,
      },
      consentMeta(req, actorId)
    );

    res.json({
      success: true,
      data: consent,
      message: 'Consentimiento actualizado',
    });
  } catch (error) {
    next(error);
  }
};

export const revokeSharingConsent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const consentId = req.params.id;
    if (!consentId) {
      throw createError('Consentimiento no indicado', 400, 'CONSENT_ID_REQUIRED');
    }

    const reason =
      typeof (req.body as { reason?: unknown } | undefined)?.reason === 'string'
        ? (req.body as { reason: string }).reason
        : null;

    const consent = await SharingConsentService.revokeConsent(
      actorId,
      consentId,
      consentMeta(req, actorId),
      reason
    );

    res.json({
      success: true,
      data: consent,
      message: 'Consentimiento revocado. El acceso se cortó de inmediato.',
    });
  } catch (error) {
    next(error);
  }
};

export const getConsentHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const events = await SharingConsentService.listConsentHistory(
      actorId,
      parseLimit(req.query.limit, 100, 500)
    );
    res.json({ success: true, data: { events } });
  } catch (error) {
    next(error);
  }
};

export const getAccessLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const entries = await SharingConsentService.listPatientAccessLog(
      actorId,
      parseLimit(req.query.limit, 100, 500)
    );

    // El paciente ve metadatos de acceso, nunca contenido clínico ajeno.
    res.json({
      success: true,
      data: {
        entries: entries.map((entry) => ({
          id: entry.id,
          actor_name: entry.actor_name ?? 'Profesional',
          actor_role: entry.actor_role,
          organization_name: entry.organization_name ?? null,
          action: entry.action,
          resource_type: entry.resource_type,
          purpose: entry.purpose,
          success: entry.success,
          created_at: entry.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getConsentCatalog = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const policy = await SharingConsentService.ensureConsentPolicyVersion();
    res.json({
      success: true,
      data: {
        policy: {
          version: policy.version,
          locale: policy.locale,
          document_hash: policy.document_hash,
          document_text: policy.document_text,
          effective_from: policy.effective_from,
        },
        categories: SharingConsentService.getConsentCatalog(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCareLinks,
  listSharingConsents,
  grantSharingConsent,
  updateSharingConsent,
  revokeSharingConsent,
  getConsentHistory,
  getAccessLog,
  getConsentCatalog,
};
