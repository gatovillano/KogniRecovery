/**
 * Controlador de configuración LLM por organización.
 */

import type { NextFunction, Request, Response } from 'express';
import * as LlmSettingsService from '../services/llmSettings.service.js';
import { query } from '../config/database.js';
import { createError } from '../middleware/error.js';
import { getAuthenticatedActor, resolveOrganizationId } from './clinicalContext.js';

const requireOrgRole = async (
  req: Request,
  allowed: Array<'org_admin' | 'clinical_lead'>
): Promise<{ organizationId: string; actorId: string }> => {
  const { actorId } = getAuthenticatedActor(req);
  const organizationId = await resolveOrganizationId(req, actorId);

  const member = await query<{ role: string }>(
    `SELECT role FROM organization_members
     WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
    [organizationId, actorId]
  );
  const role = member.rows[0]?.role;
  if (!role || !allowed.includes(role as never)) {
    throw createError('Tu rol no permite configurar la IA del centro', 403, 'FORBIDDEN');
  }
  return { organizationId, actorId };
};

export const getLlmSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgRole(req, ['org_admin', 'clinical_lead']);
    const settings = await LlmSettingsService.getLlmSettings(organizationId);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const saveLlmSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgRole(req, ['org_admin', 'clinical_lead']);
    const body = req.body as {
      provider?: string;
      model?: string;
      base_url?: string;
      api_version?: string;
      api_key?: string;
    };

    if (!body.provider) {
      throw createError('provider es obligatorio', 400, 'INVALID_PAYLOAD');
    }

    const settings = await LlmSettingsService.saveLlmSettings(organizationId, {
      provider: body.provider,
      model: body.model,
      base_url: body.base_url,
      api_version: body.api_version,
      api_key: body.api_key,
    });

    res.json({ success: true, data: settings, message: 'Configuración LLM guardada' });
  } catch (error) {
    next(error);
  }
};

export const listModels = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgRole(req, ['org_admin', 'clinical_lead']);
    const body = req.body as {
      provider?: string;
      api_key?: string;
      base_url?: string;
    };

    if (!body.provider) {
      throw createError('provider es obligatorio', 400, 'INVALID_PAYLOAD');
    }

    // Si no viene api_key en el body, usar la guardada del centro.
    let apiKey = body.api_key;
    if (!apiKey) {
      const current = await LlmSettingsService.getLlmSettings(organizationId);
      if (current.provider === body.provider && current.has_api_key) {
        const row = await query<{ settings: Record<string, unknown> }>(
          `SELECT settings FROM organizations WHERE id = $1`,
          [organizationId]
        );
        const llm = ((row.rows[0]?.settings as Record<string, unknown>)?.llm ?? {}) as {
          api_key_encrypted?: string;
        };
        if (llm.api_key_encrypted) {
          apiKey = LlmSettingsService.decryptApiKey(llm.api_key_encrypted);
        }
      }
    }

    const models = await LlmSettingsService.listProviderModels({
      provider: body.provider,
      apiKey,
      baseUrl: body.base_url,
    });

    res.json({ success: true, data: { provider: body.provider, models } });
  } catch (error) {
    next(error);
  }
};

export default {
  getLlmSettings,
  saveLlmSettings,
  listModels,
};
