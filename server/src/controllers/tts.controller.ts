/**
 * Controlador de configuración TTS por organización.
 * Permite configurar el proveedor de voz (ElevenLabs / Kokoro) y
 * probar la configuración antes de guardarla.
 */

import type { NextFunction, Request, Response } from 'express';
import * as TtsSettingsService from '../services/ttsSettings.service.js';
import { ttsService } from '../services/tts.service.js';
import { createError } from '../middleware/error.js';
import { requireOrgRole } from './llm.controller.js';

const TEST_TEXT = 'Hola, soy LÚA, tu acompañante de recuperación. Esta es una prueba de voz.';

export const getTtsSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgRole(req, ['org_admin', 'clinical_lead']);
    const settings = await TtsSettingsService.getTtsSettings(organizationId);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const saveTtsSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgRole(req, ['org_admin', 'clinical_lead']);
    const body = req.body as {
      provider?: string;
      elevenlabs_api_key?: string;
      elevenlabs_voice_id?: string;
      elevenlabs_model?: string;
      kokoro_url?: string;
      kokoro_voice?: string;
      fallback_enabled?: boolean;
    };

    if (!body.provider) {
      throw createError('provider es obligatorio', 400, 'INVALID_PAYLOAD');
    }

    const settings = await TtsSettingsService.saveTtsSettings(organizationId, {
      provider: body.provider,
      elevenlabs_api_key: body.elevenlabs_api_key,
      elevenlabs_voice_id: body.elevenlabs_voice_id,
      elevenlabs_model: body.elevenlabs_model,
      kokoro_url: body.kokoro_url,
      kokoro_voice: body.kokoro_voice,
      fallback_enabled: body.fallback_enabled,
    });

    res.json({ success: true, data: settings, message: 'Configuración de voz guardada' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/org/tts/test
 * Sintetiza una frase corta con la configuración actual (o la enviada en
 * el body) SIN guardarla y SIN fallback, para validar que el proveedor
 * principal funciona.
 */
export const testTts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgRole(req, ['org_admin', 'clinical_lead']);

    const body = req.body as {
      provider?: string;
      elevenlabs_api_key?: string;
      elevenlabs_voice_id?: string;
      elevenlabs_model?: string;
      kokoro_url?: string;
      kokoro_voice?: string;
      fallback_enabled?: boolean;
    };

    const saved = await TtsSettingsService.getTtsSettings(organizationId);

    const provider = body.provider && TtsSettingsService.isTtsProvider(body.provider)
      ? body.provider
      : saved.provider;

    // API key: si llega una nueva en el body se usa; si no, la guardada.
    let apiKey = body.elevenlabs_api_key?.trim() || null;
    if (!apiKey && saved.has_elevenlabs_key) {
      apiKey = await TtsSettingsService.decryptSavedElevenKey(organizationId);
    }

    const resolved = {
      provider,
      elevenlabsApiKey: apiKey,
      elevenlabsVoiceId: body.elevenlabs_voice_id?.trim() || saved.elevenlabs_voice_id,
      elevenlabsModel: body.elevenlabs_model?.trim() || saved.elevenlabs_model,
      kokoroUrl: body.kokoro_url?.trim() || saved.kokoro_url,
      kokoroVoice: body.kokoro_voice?.trim() || saved.kokoro_voice,
      fallbackEnabled:
        body.fallback_enabled !== undefined ? body.fallback_enabled : saved.fallback_enabled,
    };

    const started = Date.now();

    try {
      // allowFallback: false → si el proveedor principal falla, se reporta
      // el error real (p. ej. cuota agotada) en lugar de silenciarlo.
      const audio = await ttsService.generateSpeech(TEST_TEXT, 'es', 'default', {
        config: resolved,
        allowFallback: false,
      });
      const durationMs = Date.now() - started;
      res.json({
        success: true,
        data: {
          provider,
          ok: true,
          duration_ms: durationMs,
          bytes: audio.data.length,
          contentType: audio.contentType,
          message:
            provider === 'elevenlabs'
              ? 'ElevenLabs respondió correctamente'
              : 'Kokoro respondió correctamente',
        },
      });
    } catch (error: any) {
      const durationMs = Date.now() - started;
      const fallbackAvailable = resolved.fallbackEnabled && provider === 'elevenlabs';
      res.json({
        success: false,
        data: {
          provider,
          ok: false,
          duration_ms: durationMs,
          message: `El proveedor principal falló: ${error?.message || String(error)}`,
          fallback_available: fallbackAvailable,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export default {
  getTtsSettings,
  saveTtsSettings,
  testTts,
};
