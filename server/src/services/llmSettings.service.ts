/**
 * Configuración de LLM por organización.
 *
 * Usa los mismos proveedores que KogniTerm y permite cargar la lista de
 * modelos directamente desde la API de cada proveedor. La API key se
 * guarda cifrada (AES-256-GCM con clave derivada de
 * ENCRYPTION_KEY/ENCRYPTION_SALT). Se mantiene un fallback de LECTURA
 * con la clave antigua (JWT_SECRET) para datos previos.
 */

import crypto from 'node:crypto';
import { query } from '../config/database.js';
import { jwt as jwtConfig } from '../config/index.js';
import { createError } from '../middleware/error.js';
import * as UserModel from '../models/user.model.js';
import * as CareModel from '../models/care.model.js';
import { decrypt } from '../utils/encryption.js';

export type LlmProvider =
  | 'openai'
  | 'openrouter'
  | 'google'
  | 'anthropic'
  | 'ollama'
  | 'ollama_cloud'
  | 'kilocode'
  | 'inception'
  | 'opencode';

export interface ProviderMeta {
  key: LlmProvider;
  label: string;
  defaultBaseUrl: string;
  listPath: string;
  authType: 'bearer' | 'key_query' | 'x-api-key' | 'none';
  modelField: string;
  stripPrefix?: string;
  headers?: Record<string, string>;
}

export const LLM_PROVIDERS: Record<LlmProvider, ProviderMeta> = {
  openai: { key: 'openai', label: 'OpenAI', defaultBaseUrl: 'https://api.openai.com/v1', listPath: '/models', authType: 'bearer', modelField: 'id' },
  openrouter: { key: 'openrouter', label: 'Groq / OpenRouter', defaultBaseUrl: 'https://openrouter.ai/api/v1', listPath: '/models', authType: 'bearer', modelField: 'id' },
  google: { key: 'google', label: 'Google Gemini', defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta', listPath: '/models', authType: 'key_query', modelField: 'name', stripPrefix: 'models/' },
  anthropic: { key: 'anthropic', label: 'Anthropic (Claude)', defaultBaseUrl: 'https://api.anthropic.com/v1', listPath: '/models', authType: 'x-api-key', modelField: 'id', headers: { 'anthropic-version': '2023-06-01' } },
  ollama: { key: 'ollama', label: 'Ollama Local', defaultBaseUrl: 'http://localhost:11434', listPath: '/api/tags', authType: 'none', modelField: 'name' },
  ollama_cloud: { key: 'ollama_cloud', label: 'Ollama Cloud', defaultBaseUrl: 'https://api.ollama.com', listPath: '/api/tags', authType: 'bearer', modelField: 'name' },
  kilocode: { key: 'kilocode', label: 'KiloCode Gateway', defaultBaseUrl: 'https://api.kilo.ai/api/gateway', listPath: '/models', authType: 'none', modelField: 'id' },
  inception: { key: 'inception', label: 'Inception Labs', defaultBaseUrl: 'https://api.inceptionlabs.ai/v1', listPath: '/models', authType: 'bearer', modelField: 'id' },
  opencode: { key: 'opencode', label: 'OpenCode Zen', defaultBaseUrl: 'https://opencode.ai/api/v1', listPath: '/models', authType: 'bearer', modelField: 'id' },
};

export const isLlmProvider = (value: string): value is LlmProvider =>
  Object.prototype.hasOwnProperty.call(LLM_PROVIDERS, value);

// =====================================================
// CIFRADO DE API KEY
// =====================================================

/** Clave nueva y unificada: derivada de ENCRYPTION_KEY/SALT. */
const apiKeyCipher = (): crypto.CipherKey => {
  const envKey = process.env.ENCRYPTION_KEY;
  const envSalt = process.env.ENCRYPTION_SALT;
  if (!envKey || !envSalt) {
    throw new Error(
      'ENCRYPTION_KEY y ENCRYPTION_SALT son obligatorias para cifrar API keys LLM'
    );
  }
  return crypto.pbkdf2Sync(envKey, envSalt, 100000, 32, 'sha512');
};

/** Clave legacy (solo lectura) para datos cifrados con JWT_SECRET. */
const apiKeyLegacyCipher = (): crypto.CipherKey => {
  const base = process.env.LLM_SECRET_KEY ?? jwtConfig.secret;
  return crypto.createHash('sha256').update(`${base}:org_llm`).digest();
};

export const encryptApiKey = (plain: string): string => {
  const key = apiKeyCipher();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${tag.toString('hex')}.${encrypted.toString('hex')}`;
};

const decryptApiKeyWithKey = (stored: string, key: crypto.CipherKey): string => {
  const [ivHex, tagHex, dataHex] = stored.split('.');
  if (!ivHex || !tagHex || !dataHex) {
    throw createError('API key cifrada inválida', 500, 'INVALID_LLM_SECRET');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
};

export const decryptApiKey = (stored: string): string => {
  try {
    // Intento 1: clave actual (unificada).
    return decryptApiKeyWithKey(stored, apiKeyCipher());
  } catch {
    // Intento 2: clave legacy (JWT_SECRET/LLM_SECRET_KEY).
    return decryptApiKeyWithKey(stored, apiKeyLegacyCipher());
  }
};

// =====================================================
// SETTINGS
// =====================================================

export interface LlmSettings {
  provider: LlmProvider | null;
  model: string | null;
  base_url: string | null;
  api_version: string | null;
  has_api_key: boolean;
  api_key_masked: string | null;
}

export interface LlmSettingsStored {
  provider?: LlmProvider | null;
  model?: string | null;
  base_url?: string | null;
  api_version?: string | null;
  api_key_encrypted?: string;
}

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

export const getLlmSettings = async (
  organizationId: string
): Promise<LlmSettings> => {
  const settings = await readOrgSettings(organizationId);
  const llm = (settings.llm ?? {}) as LlmSettingsStored;

  const provider = llm.provider && isLlmProvider(llm.provider) ? llm.provider : null;
  const apiKeyEncrypted = llm.api_key_encrypted ?? null;

  return {
    provider,
    model: llm.model ?? null,
    base_url: llm.base_url ?? null,
    api_version: llm.api_version ?? null,
    has_api_key: Boolean(apiKeyEncrypted),
    api_key_masked: apiKeyEncrypted ? '••••••••' : null,
  };
};

export const saveLlmSettings = async (
  organizationId: string,
  input: {
    provider: string;
    model?: string;
    base_url?: string;
    api_version?: string;
    api_key?: string;
  }
): Promise<LlmSettings> => {
  if (!isLlmProvider(input.provider)) {
    throw createError(`Proveedor no soportado: ${input.provider}`, 400, 'INVALID_LLM_PROVIDER');
  }

  const settings = await readOrgSettings(organizationId);
  const prev = (settings.llm ?? {}) as LlmSettingsStored;

  const next: LlmSettingsStored = {
    provider: input.provider,
    model: input.model?.trim() || prev.model || null,
    base_url: input.base_url?.trim() || prev.base_url || null,
    api_version: input.api_version?.trim() || prev.api_version || null,
    api_key_encrypted:
      input.api_key === ''
        ? undefined
        : typeof input.api_key === 'string' && input.api_key.trim()
          ? encryptApiKey(input.api_key.trim())
          : prev.api_key_encrypted,
  };

  settings.llm = next;
  await writeOrgSettings(organizationId, settings);

  return {
    provider: next.provider ?? null,
    model: next.model ?? null,
    base_url: next.base_url ?? null,
    api_version: next.api_version ?? null,
    has_api_key: Boolean(next.api_key_encrypted),
    api_key_masked: next.api_key_encrypted ? '••••••••' : null,
  };
};

// =====================================================
// LISTADO DE MODELOS DESDE LA API
// =====================================================

export interface LlmModelOption {
  id: string;
  name: string;
}

const normalizeList = (raw: unknown, meta: ProviderMeta): LlmModelOption[] => {
  const arr = Array.isArray(raw) ? raw : [];
  const options: LlmModelOption[] = [];

  for (const item of arr) {
    const value = (item as Record<string, unknown>)?.[meta.modelField];
    if (typeof value !== 'string' || !value) continue;

    let id = value;
    if (meta.stripPrefix && id.startsWith(meta.stripPrefix)) {
      id = id.slice(meta.stripPrefix.length);
    }
    if (!options.some((o) => o.id === id)) {
      options.push({ id, name: id });
    }
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
};

export const listProviderModels = async (input: {
  provider: string;
  apiKey?: string;
  baseUrl?: string;
}): Promise<LlmModelOption[]> => {
  if (!isLlmProvider(input.provider)) {
    throw createError(`Proveedor no soportado: ${input.provider}`, 400, 'INVALID_LLM_PROVIDER');
  }

  const meta = LLM_PROVIDERS[input.provider];
  const baseUrl = (input.baseUrl?.trim() || meta.defaultBaseUrl).replace(/\/+$/, '');
  const url = `${baseUrl}${meta.listPath}`;
  const headers: Record<string, string> = { Accept: 'application/json', ...meta.headers };

  if (meta.authType === 'bearer' && input.apiKey) {
    headers.Authorization = `Bearer ${input.apiKey}`;
  } else if (meta.authType === 'x-api-key' && input.apiKey) {
    headers['x-api-key'] = input.apiKey;
  }

  const finalUrl = meta.authType === 'key_query' && input.apiKey
    ? `${url}?key=${encodeURIComponent(input.apiKey)}`
    : url;

  let response: Response;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    try {
      response = await fetch(finalUrl, { headers, signal: controller.signal });
    } finally {
      clearTimeout(t);
    }
  } catch (error) {
    throw createError(
      `No se pudo conectar con ${meta.label}: ${error instanceof Error ? error.message : 'red'}`,
      502,
      'LLM_PROVIDER_UNREACHABLE'
    );
  }

  if (!response.ok) {
    throw createError(
      `${meta.label} respondió ${response.status}`,
      response.status >= 500 ? 502 : 400,
      'LLM_PROVIDER_ERROR'
    );
  }

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const raw = meta.authType === 'none' && Array.isArray(body.models)
    ? body.models
    : body.data ?? body.models;
  return normalizeList(raw, meta);
};

/**
 * Resuelve la configuración LLM efectiva para un usuario.
 *
 * Prioridad:
 *  1. Configuración explícita del usuario (llm_api_key / llm_provider / llm_model).
 *  2. Configuración por defecto del centro (organización activa) si el usuario
 *     no definió una API key propia (p. ej. eligió "default").
 *  3. Variables de entorno del servidor.
 */
export const resolveEffectiveLlmConfig = async (userId: string): Promise<{
  provider: string;
  model: string;
  apiKey: string | null;
  baseUrl: string | null;
}> => {
  const user = await UserModel.findById(userId);

  let provider = process.env.LLM_PROVIDER || 'openai';
  let model = process.env.LLM_MODEL || 'gpt-4o-mini';
  let apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || '';
  let baseUrl: string | null = process.env.LLM_BASE_URL || null;

  if (user?.llm_api_key) {
    // Configuración explícita del usuario: tiene prioridad absoluta.
    try {
      apiKey = decrypt(user.llm_api_key);
    } catch {
      apiKey = user.llm_api_key;
    }
    model = user.llm_model || model;
    provider = user.llm_provider || provider;
  } else {
    // Sin API key propia → usar el default configurado por el admin del centro.
    const orgs = await CareModel.listOrganizationsForPatient(userId);
    const activeOrg = orgs.find(
      (org) =>
        org.status === 'active' && org.organization_status === 'active'
    );
    if (activeOrg) {
      const stored = await readOrgSettings(activeOrg.organization_id);
      const llm = (stored.llm ?? {}) as LlmSettingsStored;
      if (llm.provider && isLlmProvider(llm.provider)) {
        provider = llm.provider;
        model = llm.model ?? model;
        baseUrl = llm.base_url ?? baseUrl;
        if (llm.api_key_encrypted) {
          try {
            apiKey = decryptApiKey(llm.api_key_encrypted);
          } catch {
            // conservar key de entorno si la del centro no se puede descifrar
          }
        }
      }
    }
  }

  // Si no hay base URL explícita (entorno/centro), usar la por defecto del proveedor
  // (p. ej. KiloCode → https://api.kilo.ai/api/gateway), para no caer en OpenAI.
  if (!baseUrl && isLlmProvider(provider)) {
    baseUrl = LLM_PROVIDERS[provider].defaultBaseUrl;
  }

  return { provider, model, apiKey: apiKey || null, baseUrl };
};

export default {
  LLM_PROVIDERS,
  isLlmProvider,
  getLlmSettings,
  saveLlmSettings,
  listProviderModels,
  resolveEffectiveLlmConfig,
};
