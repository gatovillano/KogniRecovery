/**
 * Modelo de consentimiento clínico granular.
 *
 * Un consentimiento relaciona a un paciente con un destinatario
 * (organización o profesional), una finalidad y una versión de política.
 * Las categorías habilitadas viven en `sharing_consent_categories`.
 *
 * Toda escritura genera un evento append-only en
 * `sharing_consent_events`.
 */

import type { PoolClient } from 'pg';
import { getPool, query } from '../config/database.js';
import type { ConsentCategory, ConsentPurpose, DetailLevel } from '../config/consent.js';

export type GranteeType = 'organization' | 'professional';
export type ConsentStatus = 'granted' | 'revoked' | 'expired';
export type ConsentEventType = 'granted' | 'updated' | 'revoked' | 'expired' | 'renewed';

export interface ConsentPolicyVersion {
  id: string;
  version: string;
  locale: string;
  document_hash: string;
  document_text: string;
  categories: Record<string, unknown>;
  effective_from: Date;
  created_by?: string | null;
  created_at: Date;
}

export interface SharingConsent {
  id: string;
  patient_id: string;
  organization_id: string;
  grantee_type: GranteeType;
  grantee_id: string;
  purpose: ConsentPurpose;
  policy_version_id: string;
  status: ConsentStatus;
  history_days?: number | null;
  granted_at: Date;
  expires_at?: Date | null;
  revoked_at?: Date | null;
  revoked_by?: string | null;
  revocation_reason?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ConsentCategoryRow {
  category: ConsentCategory;
  detail_level: DetailLevel;
  enabled: boolean;
}

export interface SharingConsentWithCategories extends SharingConsent {
  categories: ConsentCategoryRow[];
  organization_name?: string;
  grantee_name?: string | null;
}

export interface ConsentEvent {
  id: string;
  consent_id: string;
  patient_id: string;
  organization_id: string;
  event_type: ConsentEventType;
  snapshot: Record<string, unknown>;
  actor_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: Date;
}

export interface ConsentRequestMeta {
  actorId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface UpsertConsentInput {
  patientId: string;
  organizationId: string;
  granteeType: GranteeType;
  granteeId: string;
  purpose: ConsentPurpose;
  policyVersionId: string;
  historyDays?: number | null;
  expiresAt?: Date | null;
  categories: Array<{
    category: ConsentCategory;
    detail_level: DetailLevel;
    enabled: boolean;
  }>;
}

const CONSENT_TABLE = 'sharing_consents';
const CATEGORY_TABLE = 'sharing_consent_categories';
const EVENT_TABLE = 'sharing_consent_events';

const runInTransaction = async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const loadCategories = async (
  consentIds: string[],
  client?: PoolClient
): Promise<Map<string, ConsentCategoryRow[]>> => {
  const map = new Map<string, ConsentCategoryRow[]>();
  if (consentIds.length === 0) return map;

  const executor = client ?? getPool();
  const result = await executor.query<ConsentCategoryRow & { consent_id: string }>(
    `SELECT consent_id, category, detail_level, enabled
     FROM ${CATEGORY_TABLE}
     WHERE consent_id = ANY($1::uuid[])
     ORDER BY category ASC`,
    [consentIds]
  );

  for (const row of result.rows) {
    const list = map.get(row.consent_id) ?? [];
    list.push({
      category: row.category,
      detail_level: row.detail_level,
      enabled: row.enabled,
    });
    map.set(row.consent_id, list);
  }

  return map;
};

const attachCategories = async (
  consents: SharingConsent[],
  client?: PoolClient
): Promise<SharingConsentWithCategories[]> => {
  const categoriesByConsent = await loadCategories(
    consents.map((consent) => consent.id),
    client
  );

  return consents.map((consent) => ({
    ...consent,
    categories: categoriesByConsent.get(consent.id) ?? [],
  }));
};

const writeEvent = async (
  client: PoolClient,
  input: {
    consent: SharingConsent;
    eventType: ConsentEventType;
    snapshot: Record<string, unknown>;
    meta: ConsentRequestMeta;
  }
): Promise<void> => {
  await client.query(
    `INSERT INTO ${EVENT_TABLE}
       (consent_id, patient_id, organization_id, event_type, snapshot,
        actor_id, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      input.consent.id,
      input.consent.patient_id,
      input.consent.organization_id,
      input.eventType,
      JSON.stringify(input.snapshot),
      input.meta.actorId,
      input.meta.ipAddress ?? null,
      input.meta.userAgent ?? null,
    ]
  );
};

// =====================================================
// POLÍTICA
// =====================================================

export const findLatestPolicyVersion = async (): Promise<ConsentPolicyVersion | null> => {
  const result = await query<ConsentPolicyVersion>(
    `SELECT * FROM consent_policy_versions
     ORDER BY effective_from DESC, created_at DESC
     LIMIT 1`
  );
  return result.rows[0] ?? null;
};

export const findPolicyVersionByVersion = async (
  version: string
): Promise<ConsentPolicyVersion | null> => {
  const result = await query<ConsentPolicyVersion>(
    `SELECT * FROM consent_policy_versions WHERE version = $1`,
    [version]
  );
  return result.rows[0] ?? null;
};

export const createPolicyVersion = async (input: {
  version: string;
  locale?: string;
  documentHash: string;
  documentText: string;
  categories: Record<string, unknown>;
  createdBy?: string | null;
}): Promise<ConsentPolicyVersion> => {
  const result = await query<ConsentPolicyVersion>(
    `INSERT INTO consent_policy_versions
       (version, locale, document_hash, document_text, categories, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.version,
      input.locale ?? 'es-CL',
      input.documentHash,
      input.documentText,
      JSON.stringify(input.categories),
      input.createdBy ?? null,
    ]
  );
  return result.rows[0]!;
};

// =====================================================
// LECTURA
// =====================================================

export const findActiveConsent = async (input: {
  patientId: string;
  organizationId: string;
  granteeType: GranteeType;
  granteeId: string;
  purpose: ConsentPurpose;
}): Promise<SharingConsentWithCategories | null> => {
  const result = await query<SharingConsent>(
    `SELECT * FROM ${CONSENT_TABLE}
     WHERE patient_id = $1
       AND organization_id = $2
       AND grantee_type = $3
       AND grantee_id = $4
       AND purpose = $5
       AND status = 'granted'
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [
      input.patientId,
      input.organizationId,
      input.granteeType,
      input.granteeId,
      input.purpose,
    ]
  );

  const consent = result.rows[0];
  if (!consent) return null;
  const [withCategories] = await attachCategories([consent]);
  return withCategories ?? null;
};

/**
 * Devuelve el consentimiento activo que cubre una categoría concreta.
 *
 * Prioriza un consentimiento profesional sobre uno de organización
 * y, dentro de cada uno, el mayor nivel de detalle.
 */
export const findActiveConsentForCategory = async (input: {
  patientId: string;
  organizationId: string;
  professionalId: string;
  category: ConsentCategory;
  purpose: ConsentPurpose;
}): Promise<(SharingConsentWithCategories & { detail_level: DetailLevel }) | null> => {
  const result = await query<SharingConsent & { detail_level: DetailLevel }>(
    `SELECT sc.*, scc.detail_level
     FROM ${CONSENT_TABLE} sc
     JOIN ${CATEGORY_TABLE} scc ON scc.consent_id = sc.id
     WHERE sc.patient_id = $1
       AND sc.organization_id = $2
       AND sc.purpose = $4
       AND sc.status = 'granted'
       AND (sc.expires_at IS NULL OR sc.expires_at > NOW())
       AND scc.category = $5
       AND scc.enabled = TRUE
       AND (
         (sc.grantee_type = 'professional' AND sc.grantee_id = $3)
         OR (sc.grantee_type = 'organization' AND sc.grantee_id = $2)
       )
     ORDER BY
       CASE WHEN sc.grantee_type = 'professional' THEN 0 ELSE 1 END,
       CASE scc.detail_level
         WHEN 'full' THEN 0
         WHEN 'detailed' THEN 1
         WHEN 'summary' THEN 2
         ELSE 3
       END,
       sc.granted_at DESC
     LIMIT 1`,
    [
      input.patientId,
      input.organizationId,
      input.professionalId,
      input.purpose,
      input.category,
    ]
  );

  const consent = result.rows[0];
  if (!consent) return null;
  const [withCategories] = await attachCategories([consent]);
  return withCategories
    ? { ...withCategories, detail_level: consent.detail_level }
    : null;
};

export const listActiveConsentsForPatient = async (
  patientId: string
): Promise<SharingConsentWithCategories[]> => {
  const result = await query<SharingConsent>(
    `SELECT sc.*, o.name AS organization_name,
            COALESCE(NULLIF(pu.name, ''), split_part(pu.email, '@', 1)) AS grantee_name
     FROM ${CONSENT_TABLE} sc
     JOIN organizations o ON o.id = sc.organization_id
     LEFT JOIN users pu
       ON sc.grantee_type = 'professional' AND pu.id = sc.grantee_id
     WHERE sc.patient_id = $1
       AND sc.status = 'granted'
       AND (sc.expires_at IS NULL OR sc.expires_at > NOW())
     ORDER BY sc.granted_at DESC`,
    [patientId]
  );

  return attachCategories(result.rows);
};

export const listAllConsentsForPatient = async (
  patientId: string
): Promise<SharingConsentWithCategories[]> => {
  const result = await query<SharingConsent>(
    `SELECT sc.*, o.name AS organization_name,
            COALESCE(NULLIF(pu.name, ''), split_part(pu.email, '@', 1)) AS grantee_name
     FROM ${CONSENT_TABLE} sc
     JOIN organizations o ON o.id = sc.organization_id
     LEFT JOIN users pu
       ON sc.grantee_type = 'professional' AND pu.id = sc.grantee_id
     WHERE sc.patient_id = $1
     ORDER BY sc.created_at DESC`,
    [patientId]
  );

  return attachCategories(result.rows);
};

export const findConsentByIdForPatient = async (
  consentId: string,
  patientId: string
): Promise<SharingConsentWithCategories | null> => {
  const result = await query<SharingConsent>(
    `SELECT * FROM ${CONSENT_TABLE} WHERE id = $1 AND patient_id = $2`,
    [consentId, patientId]
  );
  const consent = result.rows[0];
  if (!consent) return null;
  const [withCategories] = await attachCategories([consent]);
  return withCategories ?? null;
};

export const listConsentEvents = async (
  patientId: string,
  limit = 100
): Promise<ConsentEvent[]> => {
  const result = await query<ConsentEvent>(
    `SELECT * FROM ${EVENT_TABLE}
     WHERE patient_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [patientId, Math.min(Math.max(limit, 1), 500)]
  );
  return result.rows;
};

// =====================================================
// ESCRITURA
// =====================================================

export const upsertConsent = async (
  input: UpsertConsentInput,
  meta: ConsentRequestMeta
): Promise<SharingConsentWithCategories> => {
  return runInTransaction(async (client) => {
    const existingResult = await client.query<SharingConsent>(
      `SELECT * FROM ${CONSENT_TABLE}
       WHERE patient_id = $1
         AND organization_id = $2
         AND grantee_type = $3
         AND grantee_id = $4
         AND purpose = $5
         AND status = 'granted'
       FOR UPDATE`,
      [
        input.patientId,
        input.organizationId,
        input.granteeType,
        input.granteeId,
        input.purpose,
      ]
    );

    const existing = existingResult.rows[0];
    let consent: SharingConsent;
    let eventType: ConsentEventType;

    if (existing) {
      const updated = await client.query<SharingConsent>(
        `UPDATE ${CONSENT_TABLE}
         SET policy_version_id = $2,
             history_days = $3,
             expires_at = $4,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          existing.id,
          input.policyVersionId,
          input.historyDays ?? null,
          input.expiresAt ?? null,
        ]
      );
      consent = updated.rows[0]!;
      eventType = 'updated';

      await client.query(`DELETE FROM ${CATEGORY_TABLE} WHERE consent_id = $1`, [
        existing.id,
      ]);
    } else {
      const inserted = await client.query<SharingConsent>(
        `INSERT INTO ${CONSENT_TABLE}
           (patient_id, organization_id, grantee_type, grantee_id, purpose,
            policy_version_id, status, history_days, granted_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'granted', $7, NOW(), $8)
         RETURNING *`,
        [
          input.patientId,
          input.organizationId,
          input.granteeType,
          input.granteeId,
          input.purpose,
          input.policyVersionId,
          input.historyDays ?? null,
          input.expiresAt ?? null,
        ]
      );
      consent = inserted.rows[0]!;
      eventType = 'granted';
    }

    for (const category of input.categories) {
      await client.query(
        `INSERT INTO ${CATEGORY_TABLE}
           (consent_id, category, detail_level, enabled)
         VALUES ($1, $2, $3, $4)`,
        [consent.id, category.category, category.detail_level, category.enabled]
      );
    }

    await writeEvent(client, {
      consent,
      eventType,
      snapshot: {
        grantee_type: input.granteeType,
        grantee_id: input.granteeId,
        purpose: input.purpose,
        policy_version_id: input.policyVersionId,
        history_days: input.historyDays ?? null,
        expires_at: input.expiresAt ?? null,
        categories: input.categories,
      },
      meta,
    });

    const [withCategories] = await attachCategories([consent], client);
    return withCategories!;
  });
};

export const revokeConsent = async (
  consentId: string,
  patientId: string,
  meta: ConsentRequestMeta,
  reason?: string | null
): Promise<SharingConsentWithCategories | null> => {
  return runInTransaction(async (client) => {
    const result = await client.query<SharingConsent>(
      `UPDATE ${CONSENT_TABLE}
       SET status = 'revoked',
           revoked_at = NOW(),
           revoked_by = $3,
           revocation_reason = $4,
           updated_at = NOW()
       WHERE id = $1
         AND patient_id = $2
         AND status = 'granted'
       RETURNING *`,
      [consentId, patientId, meta.actorId, reason ?? null]
    );

    const consent = result.rows[0];
    if (!consent) return null;

    const [withCategories] = await attachCategories([consent], client);

    await writeEvent(client, {
      consent,
      eventType: 'revoked',
      snapshot: {
        revoked_at: consent.revoked_at,
        revocation_reason: reason ?? null,
        categories: withCategories?.categories ?? [],
      },
      meta,
    });

    return withCategories ?? null;
  });
};

/**
 * Marca como expirados los consentimientos vencidos. Devuelve cuántos
 * cambió. Se puede ejecutar de forma perezosa antes de una lectura.
 */
export const expireOverdueConsents = async (patientId?: string): Promise<number> => {
  const result = await query(
    `UPDATE ${CONSENT_TABLE}
     SET status = 'expired', updated_at = NOW()
     WHERE status = 'granted'
       AND expires_at IS NOT NULL
       AND expires_at <= NOW()
       AND ($1::uuid IS NULL OR patient_id = $1)`,
    [patientId ?? null]
  );
  return result.rowCount ?? 0;
};

export default {
  findLatestPolicyVersion,
  findPolicyVersionByVersion,
  createPolicyVersion,
  findActiveConsent,
  findActiveConsentForCategory,
  listActiveConsentsForPatient,
  listAllConsentsForPatient,
  findConsentByIdForPatient,
  listConsentEvents,
  upsertConsent,
  revokeConsent,
  expireOverdueConsents,
};
