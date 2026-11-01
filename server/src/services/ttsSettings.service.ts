/**
 * Configuración de TTS por organización.
 *
 * Sigue el mismo patrón que la configuración LLM (llmSettings.service.ts):
 * se guarda en organizations.settings.tts y la API key de ElevenLabs se
 * cifra con AES-256-GCM reutilizando encryptApiKey/decryptApiKey.
 *
 * Prioridad de resolución (resolveTtsConfig):
 *   1. Configuración del centro activo del usuario.
 *   2. Variables de entorno del servidor (TTS_KOKORO_URL, ELEVENLABS_*).
 */

import { query } from '../config/database.js';
import { createError } from '../middleware/error.js';
import * as CareModel from '../models/care.model.js';
import { decryptApiKey, encryptApiKey } from './llmSettings.service.js';

export type TtsProvider = 'elevenlabs' | 'kokoro';

export const isTtsProvider = (value: string): value is TtsProvider =>
  value === 'elevenlabs' || value === 'kokoro';

// Voz por defecto de ElevenLabs: Charlotte (multilingüe, español natural).
export const DEFAULT_ELEVENLABS_VOICE_ID = 'XB0fDUnXU5powFXDhCwa';
export const DEFAULT_ELEVENLABS_MODEL = 'eleven_multilingual_v2';
export const DEFAULT_KOKORO_VOICE = 'ef_dora';

const envKokoroUrl = (): string =>
  process.env.TTS_KOKORO_URL || process.env.TTS_API_URL || 'http://localhost:8009';

export interface TtsSettings {
  provider: TtsProvider;
  elevenlabs_voice_id: string;
  elevenlabs_model: string;
  has_elevenlabs_key: boolean;
  elevenlabs_key_masked: string | null;
  kokoro_url: string;
  kokoro_voice: string;
  fallback_enabled: boolean;
}

export interface TtsSettingsStored {
  provider?: TtsProvider;
  elevenlabs_api_key_encrypted?: string;
  elevenlabs_voice_id?: string;
  elevenlabs_model?: string;
  kokoro_url?: string;
  kokoro_voice?: string;
  fallback_enabled?: boolean;
}

export interface TtsConfigResolved {
  provider: TtsProvider;
  elevenlabsApiKey: string | null;
  elevenlabsVoiceId: string;
  elevenlabsModel: string;
  kokoroUrl: string;
  kokoroVoice: string;
  fallbackEnabled: boolean;
}

// =====================================================
// LECTURA/ESCRITURA EN organizations.settings
// =====================================================

const readOrgSettings = async (organizationId: string): Promise<Record<string, unknown>> => {
  const result = await query<{ settings: Record<string, unknown> }>(
    `SELECT settings FROM organizations WHERE id = $1`,
    [organizationId]
  );
  return (result.rows[0]?.settings ?? {}) as Record<string, unknown>;
};

const writeOrgSettings = async (
  organizationId: string,
  settings: Record<string, unknown>
): Promise<void> => {
  await query(
    `UPDATE organizations SET settings = $2, updated_at = NOW() WHERE id = $1`,
    [organizationId, JSON.stringify(settings)]
  );
};

// =====================================================
// GET / SAVE
// =====================================================

export const getTtsSettings = async (organizationId: string): Promise<TtsSettings> => {
  const settings = await readOrgSettings(organizationId);
  const tts = (settings.tts ?? {}) as TtsSettingsStored;

  const provider = tts.provider && isTtsProvider(tts.provider) ? tts.provider : 'kokoro';
  const apiKeyEncrypted = tts.elevenlabs_api_key_encrypted ?? null;

  return {
    provider,
    elevenlabs_voice_id: tts.elevenlabs_voice_id || DEFAULT_ELEVENLABS_VOICE_ID,
    elevenlabs_model: tts.elevenlabs_model || DEFAULT_ELEVENLABS_MODEL,
    has_elevenlabs_key: Boolean(apiKeyEncrypted),
    elevenlabs_key_masked: apiKeyEncrypted ? '••••••••' : null,
    kokoro_url: tts.kokoro_url || envKokoroUrl(),
    kokoro_voice: tts.kokoro_voice || DEFAULT_KOKORO_VOICE,
    fallback_enabled: tts.fallback_enabled !== false,
  };
};

export const saveTtsSettings = async (
  organizationId: string,
  input: {
    provider: string;
    elevenlabs_api_key?: string | null;
    elevenlabs_voice_id?: string;
    elevenlabs_model?: string;
    kokoro_url?: string;
    kokoro_voice?: string;
    fallback_enabled?: boolean;
  }
): Promise<TtsSettings> => {
  if (!isTtsProvider(input.provider)) {
    throw createError(`Proveedor TTS no soportado: ${input.provider}`, 400, 'INVALID_TTS_PROVIDER');
  }

  const settings = await readOrgSettings(organizationId);
  const prev = (settings.tts ?? {}) as TtsSettingsStored;

  // null → elimina la API key guardada; string no vacío → guarda cifrada;
  // '' o undefined → conserva la actual.
  let nextKeyEncrypted = prev.elevenlabs_api_key_encrypted;
  if (input.elevenlabs_api_key === null) {
    nextKeyEncrypted = undefined;
  } else if (
    typeof input.elevenlabs_api_key === 'string' &&
    input.elevenlabs_api_key.trim()
  ) {
    nextKeyEncrypted = encryptApiKey(input.elevenlabs_api_key.trim());
  }

  const next: TtsSettingsStored = {
    provider: input.provider,
    elevenlabs_api_key_encrypted: nextKeyEncrypted,
    elevenlabs_voice_id:
      input.elevenlabs_voice_id?.trim() || prev.elevenlabs_voice_id || DEFAULT_ELEVENLABS_VOICE_ID,
    elevenlabs_model:
      input.elevenlabs_model?.trim() || prev.elevenlabs_model || DEFAULT_ELEVENLABS_MODEL,
    kokoro_url: input.kokoro_url?.trim() || prev.kokoro_url || envKokoroUrl(),
    kokoro_voice: input.kokoro_voice?.trim() || prev.kokoro_voice || DEFAULT_KOKORO_VOICE,
    fallback_enabled: input.fallback_enabled !== undefined ? input.fallback_enabled : prev.fallback_enabled !== false,
  };

  settings.tts = next;
  await writeOrgSettings(organizationId, settings);

  return {
    provider: next.provider ?? 'kokoro',
    elevenlabs_voice_id: next.elevenlabs_voice_id ?? DEFAULT_ELEVENLABS_VOICE_ID,
    elevenlabs_model: next.elevenlabs_model ?? DEFAULT_ELEVENLABS_MODEL,
    has_elevenlabs_key: Boolean(next.elevenlabs_api_key_encrypted),
    elevenlabs_key_masked: next.elevenlabs_api_key_encrypted ? '••••••••' : null,
    kokoro_url: next.kokoro_url ?? envKokoroUrl(),
    kokoro_voice: next.kokoro_voice ?? DEFAULT_KOKORO_VOICE,
    fallback_enabled: next.fallback_enabled !== false,
  };
};

// =====================================================
// RESOLUCIÓN DE CONFIGURACIÓN EFECTIVA
// =====================================================

/**
 * Resuelve la configuración TTS efectiva para un usuario.
 *
 * Prioridad:
 *  1. Configuración del centro activo (organización) del usuario.
 *  2. Variables de entorno del servidor.
 *
 * Si el usuario no pertenece a ninguna organización activa (o no hay
 * configuración guardada) se usan los valores de entorno.
 */
export const resolveTtsConfig = async (userId: string | null): Promise<TtsConfigResolved> => {
  const base = baseTtsConfigFromEnv();

  if (userId) {
    try {
      const orgs = await CareModel.listOrganizationsForPatient(userId);
      const activeOrg = orgs.find(
        (org) => org.status === 'active' && org.organization_status === 'active'
      );
      if (activeOrg) {
        return await applyOrgTtsSettings(base, activeOrg.organization_id);
      }
    } catch (error) {
      console.warn('⚠️ [TTS] No se pudo resolver configuración del centro:', (error as Error).message);
    }
  }

  return base;
};

/**
 * Versión para el panel de administración: resuelve la configuración de
 * una organización concreta (sin depender del usuario autenticado).
 */
export const resolveTtsConfigForOrg = async (organizationId: string): Promise<TtsConfigResolved> => {
  return applyOrgTtsSettings(baseTtsConfigFromEnv(), organizationId);
};

/**
 * Devuelve la API key de ElevenLabs descifrada de una organización (o null).
 * Útil para probar la configuración sin reescribir lo guardado.
 */
export const decryptSavedElevenKey = async (organizationId: string): Promise<string | null> => {
  const settings = await readOrgSettings(organizationId);
  const tts = (settings.tts ?? {}) as TtsSettingsStored;
  if (!tts.elevenlabs_api_key_encrypted) return null;
  try {
    return decryptApiKey(tts.elevenlabs_api_key_encrypted);
  } catch {
    return null;
  }
};

const baseTtsConfigFromEnv = (): TtsConfigResolved => ({
  provider: process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'kokoro',
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || null,
  elevenlabsVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
  elevenlabsModel: DEFAULT_ELEVENLABS_MODEL,
  kokoroUrl: envKokoroUrl(),
  kokoroVoice: DEFAULT_KOKORO_VOICE,
  fallbackEnabled: true,
});

const applyOrgTtsSettings = async (
  base: TtsConfigResolved,
  organizationId: string
): Promise<TtsConfigResolved> => {
  const stored = await readOrgSettings(organizationId);
  const tts = (stored.tts ?? {}) as TtsSettingsStored;

  const resolved: TtsConfigResolved = { ...base };
  if (tts.provider && isTtsProvider(tts.provider)) {
    resolved.provider = tts.provider;
  }
  if (tts.elevenlabs_voice_id) resolved.elevenlabsVoiceId = tts.elevenlabs_voice_id;
  if (tts.elevenlabs_model) resolved.elevenlabsModel = tts.elevenlabs_model;
  if (tts.kokoro_url) resolved.kokoroUrl = tts.kokoro_url;
  if (tts.kokoro_voice) resolved.kokoroVoice = tts.kokoro_voice;
  if (tts.fallback_enabled !== undefined) resolved.fallbackEnabled = tts.fallback_enabled;
  if (tts.elevenlabs_api_key_encrypted) {
    try {
      resolved.elevenlabsApiKey = decryptApiKey(tts.elevenlabs_api_key_encrypted);
    } catch {
      // conservar key de entorno si la del centro no se puede descifrar
    }
  }
  return resolved;
};

export default {
  isTtsProvider,
  getTtsSettings,
  saveTtsSettings,
  resolveTtsConfig,
  resolveTtsConfigForOrg,
  decryptSavedElevenKey,
  DEFAULT_ELEVENLABS_VOICE_ID,
  DEFAULT_ELEVENLABS_MODEL,
  DEFAULT_KOKORO_VOICE,
};
