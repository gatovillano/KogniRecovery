/**
 * Consentimiento clínico del paciente.
 *
 * El paciente es el único que puede otorgar, actualizar o revocar.
 * El servicio valida vínculo con el centro, destinatario, taxonomía
 * y vigencia, y deja un evento append-only por cada cambio.
 */

import crypto from 'node:crypto';
import {
  CONSENT_CATEGORIES,
  isConsentCategory,
  isDetailLevel,
  validateConsentCategories,
  type ConsentCategoryInput,
} from '../config/consent.js';
import { createError } from '../middleware/error.js';
import * as OrganizationModel from '../models/organization.model.js';
import * as CareModel from '../models/care.model.js';
import * as SharingConsentModel from '../models/sharingConsent.model.js';
import type {
  ConsentRequestMeta,
  GranteeType,
  SharingConsentWithCategories,
} from '../models/sharingConsent.model.js';
import * as AuditService from './audit.service.js';
import * as NotificationsService from './notifications.service.js';

const DEFAULT_POLICY_VERSION = '2026-10-v1';

const POLICY_TEXT = `
CONSENTIMIENTO INFORMADO PARA COMPARTIR INFORMACIÓN CLÍNICA

He decidido, de forma libre e informada, compartir con el centro de salud
mental y/o con el profesional que yo elija únicamente las categorías de
datos que marco como habilitadas en la aplicación.

Entiendo que:
1. Cada categoría puede compartirse con un nivel de detalle distinto.
2. El centro no puede activar categorías por mí.
3. Puedo revocar este consentimiento en cualquier momento y el acceso
   se cortará de inmediato.
4. Toda lectura de mis datos queda registrada y puedo consultarla.
5. La revocación no elimina el historial de accesos anteriores.
6. El protocolo de seguridad del centro es una finalidad separada.
7. Esta autorización tiene fecha de vencimiento y puedo renovarla.
`;

export const ensureConsentPolicyVersion = async (
  createdBy?: string | null
): Promise<SharingConsentModel.ConsentPolicyVersion> => {
  const version = process.env.CONSENT_POLICY_VERSION ?? DEFAULT_POLICY_VERSION;
  const existing = await SharingConsentModel.findPolicyVersionByVersion(version);
  if (existing) return existing;

  const documentHash = crypto.createHash('sha256').update(POLICY_TEXT.trim()).digest('hex');

  return SharingConsentModel.createPolicyVersion({
    version,
    locale: 'es-CL',
    documentHash,
    documentText: POLICY_TEXT.trim(),
    categories: CONSENT_CATEGORIES,
    createdBy: createdBy ?? null,
  });
};

export interface ConsentCategoryPayload {
  category: string;
  detail_level?: string;
  enabled: boolean;
}

export interface GrantConsentInput {
  organization_id: string;
  grantee_type: GranteeType;
  grantee_id: string;
  purpose?: 'treatment' | 'safety';
  history_days?: number | null;
  expires_at?: string | Date | null;
  categories: ConsentCategoryPayload[];
}

const normalizeCategories = (
  categories: ConsentCategoryPayload[]
): ReturnType<typeof validateConsentCategories> => {
  if (!Array.isArray(categories) || categories.length === 0) {
    return {
      valid: false,
      categories: [],
      errors: ['Debes indicar al menos una categoría.'],
    };
  }

  const normalizedInput: ConsentCategoryInput[] = categories.map((item) => ({
    category: item.category,
    detail_level: item.detail_level,
    enabled: Boolean(item.enabled),
  }));

  const result = validateConsentCategories(normalizedInput);
  if (result.valid && !result.categories.some((item) => item.enabled)) {
    return {
      valid: false,
      categories: result.categories,
      errors: ['Debes habilitar al menos una categoría para compartir.'],
    };
  }

  return result;
};

const resolveExpiry = (value: string | Date | null | undefined): Date | null => {
  if (value === null) return null;
  if (value === undefined) {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createError('Fecha de expiración inválida', 400, 'INVALID_EXPIRY');
  }
  if (date.getTime() <= Date.now()) {
    throw createError(
      'La fecha de expiración debe ser futura',
      400,
      'INVALID_EXPIRY'
    );
  }
  return date;
};

const assertPatientLink = async (
  patientId: string,
  organizationId: string
): Promise<void> => {
  const organization = await OrganizationModel.findById(organizationId);
  if (!organization || organization.status !== 'active') {
    throw createError('Organización no disponible', 404, 'ORGANIZATION_NOT_FOUND');
  }

  const link = await CareModel.findPatientLink(organizationId, patientId);
  if (!link || link.status !== 'active') {
    throw createError(
      'No tienes un vínculo activo con esta organización',
      403,
      'NOT_LINKED_TO_ORGANIZATION'
    );
  }
};

const assertGrantee = async (
  input: GrantConsentInput,
  patientId: string
): Promise<void> => {
  if (input.grantee_type === 'organization') {
    if (input.grantee_id !== input.organization_id) {
      throw createError(
        'El destinatario organización no coincide',
        400,
        'INVALID_GRANTEE'
      );
    }
    return;
  }

  if (input.grantee_type !== 'professional') {
    throw createError('Tipo de destinatario inválido', 400, 'INVALID_GRANTEE');
  }

  const membership = await OrganizationModel.findMembership(
    input.organization_id,
    input.grantee_id
  );

  if (
    !membership ||
    membership.status !== 'active' ||
    !['therapist', 'clinical_lead'].includes(membership.role)
  ) {
    throw createError(
      'El profesional no pertenece al centro',
      400,
      'INVALID_GRANTEE'
    );
  }

  const link = await CareModel.findPatientLink(input.organization_id, patientId);
  if (link) {
    const assignment = await CareModel.findActiveAssignment(link.id, input.grantee_id);
    if (!assignment) {
      throw createError(
        'El profesional no está asignado a tu cuidado',
        400,
        'PROFESSIONAL_NOT_ASSIGNED'
      );
    }
  }
};

export const listPatientConsents = async (
  patientId: string
): Promise<SharingConsentWithCategories[]> => {
  await SharingConsentModel.expireOverdueConsents(patientId);
  return SharingConsentModel.listAllConsentsForPatient(patientId);
};

export const listActivePatientConsents = async (
  patientId: string
): Promise<SharingConsentWithCategories[]> => {
  await SharingConsentModel.expireOverdueConsents(patientId);
  return SharingConsentModel.listActiveConsentsForPatient(patientId);
};

export const grantConsent = async (
  patientId: string,
  input: GrantConsentInput,
  meta: ConsentRequestMeta
): Promise<SharingConsentWithCategories> => {
  await assertPatientLink(patientId, input.organization_id);
  await assertGrantee(input, patientId);

  const validation = normalizeCategories(input.categories);
  if (!validation.valid) {
    throw createError(validation.errors.join(' '), 400, 'INVALID_CATEGORIES');
  }

  const purpose = input.purpose ?? 'treatment';

  // Solo el protocolo de seguridad puede usar la finalidad safety.
  for (const category of validation.categories) {
    if (
      category.enabled &&
      CONSENT_CATEGORIES[category.category].purpose !== purpose
    ) {
      throw createError(
        `La categoría ${category.category} no corresponde a la finalidad ${purpose}`,
        400,
        'INVALID_PURPOSE'
      );
    }
  }

  const policy = await ensureConsentPolicyVersion(meta.actorId);
  const historyDays =
    input.history_days === undefined || input.history_days === null
      ? null
      : Math.max(1, Math.floor(input.history_days));

  const consent = await SharingConsentModel.upsertConsent(
    {
      patientId,
      organizationId: input.organization_id,
      granteeType: input.grantee_type,
      granteeId: input.grantee_id,
      purpose,
      policyVersionId: policy.id,
      historyDays,
      expiresAt: resolveExpiry(input.expires_at),
      categories: validation.categories,
    },
    meta
  );

  return consent;
};

export const updateConsent = async (
  patientId: string,
  consentId: string,
  input: {
    history_days?: number | null;
    expires_at?: string | Date | null;
    categories: ConsentCategoryPayload[];
  },
  meta: ConsentRequestMeta
): Promise<SharingConsentWithCategories> => {
  const existing = await SharingConsentModel.findConsentByIdForPatient(
    consentId,
    patientId
  );

  if (!existing) {
    throw createError('Consentimiento no encontrado', 404, 'CONSENT_NOT_FOUND');
  }

  if (existing.status !== 'granted') {
    throw createError(
      'Este consentimiento ya no está activo. Crea uno nuevo para volver a compartir.',
      409,
      'CONSENT_NOT_ACTIVE'
    );
  }

  const validation = normalizeCategories(input.categories);
  if (!validation.valid) {
    throw createError(validation.errors.join(' '), 400, 'INVALID_CATEGORIES');
  }

  for (const category of validation.categories) {
    if (
      category.enabled &&
      CONSENT_CATEGORIES[category.category].purpose !== existing.purpose
    ) {
      throw createError(
        `La categoría ${category.category} no corresponde a la finalidad ${existing.purpose}`,
        400,
        'INVALID_PURPOSE'
      );
    }
  }

  const policy = await ensureConsentPolicyVersion(meta.actorId);
  const historyDays =
    input.history_days === undefined
      ? existing.history_days ?? null
      : input.history_days === null
        ? null
        : Math.max(1, Math.floor(input.history_days));

  return SharingConsentModel.upsertConsent(
    {
      patientId,
      organizationId: existing.organization_id,
      granteeType: existing.grantee_type,
      granteeId: existing.grantee_id,
      purpose: existing.purpose,
      policyVersionId: policy.id,
      historyDays,
      expiresAt:
        input.expires_at === undefined
          ? existing.expires_at ?? null
          : resolveExpiry(input.expires_at),
      categories: validation.categories,
    },
    meta
  );
};

export const revokeConsent = async (
  patientId: string,
  consentId: string,
  meta: ConsentRequestMeta,
  reason?: string | null
): Promise<SharingConsentWithCategories> => {
  const revoked = await SharingConsentModel.revokeConsent(
    consentId,
    patientId,
    meta,
    reason ?? null
  );

  if (!revoked) {
    throw createError(
      'Consentimiento no encontrado o ya revocado',
      404,
      'CONSENT_NOT_FOUND'
    );
  }

  // Aviso neutral al profesional si el consentimiento era hacia él.
  if (revoked.grantee_type === 'professional') {
    try {
      await NotificationsService.createNotification({
        userId: revoked.grantee_id,
        title: 'El paciente actualizó su consentimiento',
        body: 'Un paciente actualizó lo que comparte contigo. Revisa tu panel para ver el estado vigente.',
        type: 'info',
      });
    } catch (error) {
      console.warn('⚠️ No se pudo notificar la revocación:', error);
    }
  }

  return revoked;
};

export const listConsentHistory = async (
  patientId: string,
  limit?: number
): Promise<SharingConsentModel.ConsentEvent[]> => {
  return SharingConsentModel.listConsentEvents(patientId, limit);
};

export const listCareLinks = async (
  patientId: string
): Promise<
  Array<{
    organization: { id: string; name: string; status: string };
    care_status: string;
    enrolled_at?: Date | null;
    assigned_professional: { id: string; name: string } | null;
    active_consents: Array<{
      id: string;
      grantee_type: GranteeType;
      grantee_id: string;
      purpose: string;
      expires_at?: Date | null;
      categories: Array<{ category: string; detail_level: string; enabled: boolean }>;
    }>;
  }>
> => {
  const links = await CareModel.listOrganizationsForPatient(patientId);
  const consents = await listActivePatientConsents(patientId);

  return links.map((link) => {
    const orgConsents = consents.filter(
      (consent) => consent.organization_id === link.organization_id
    );

    return {
      organization: {
        id: link.organization_id,
        name: link.organization_name,
        status: link.organization_status,
      },
      care_status: link.status,
      enrolled_at: link.enrolled_at ?? null,
      assigned_professional: link.professional_id
        ? {
            id: link.professional_id,
            name: link.professional_name || 'Profesional',
          }
        : null,
      active_consents: orgConsents.map((consent) => ({
        id: consent.id,
        grantee_type: consent.grantee_type,
        grantee_id: consent.grantee_id,
        purpose: consent.purpose,
        expires_at: consent.expires_at ?? null,
        categories: consent.categories.map((category) => ({
          category: category.category,
          detail_level: category.detail_level,
          enabled: category.enabled,
        })),
      })),
    };
  });
};

export const listPatientAccessLog = async (
  patientId: string,
  limit?: number
): Promise<AuditService.AccessLogRow[]> => {
  return AuditService.listAccessForPatient(patientId, limit);
};

export const getConsentCatalog = (): Array<{
  key: string;
  label: string;
  description: string;
  includes: string[];
  required_detail_level: string;
  purpose: string;
  depends_on: string[];
  required_for_care: boolean;
}> =>
  Object.values(CONSENT_CATEGORIES).map((definition) => ({
    key: definition.key,
    label: definition.label,
    description: definition.description,
    includes: definition.includes,
    required_detail_level: definition.requiredDetailLevel,
    purpose: definition.purpose,
    depends_on: definition.dependsOn,
    required_for_care: definition.requiredForCare,
  }));

export const buildClientMeta = (input: {
  actorId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): ConsentRequestMeta => ({
  actorId: input.actorId,
  ipAddress: input.ipAddress ?? null,
  userAgent: input.userAgent ?? null,
});

export const isKnownCategory = isConsentCategory;
export const isKnownDetailLevel = isDetailLevel;

export default {
  ensureConsentPolicyVersion,
  listPatientConsents,
  listActivePatientConsents,
  grantConsent,
  updateConsent,
  revokeConsent,
  listConsentHistory,
  listCareLinks,
  listPatientAccessLog,
  getConsentCatalog,
};
