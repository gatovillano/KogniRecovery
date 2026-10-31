/**
 * ClinicalAccessService
 *
 * Único punto que decide si un profesional puede leer una categoría
 * clínica de un paciente. Ninguna ruta debe consultar tablas clínicas
 * sin pasar por aquí.
 *
 * Orden de verificación:
 *   1. membresía activa en la organización
 *   2. organización activa
 *   3. paciente vinculado y activo en la organización
 *   4. asignación activa (terapeuta) o rol clínico habilitado
 *   5. consentimiento activo, vigente y con nivel suficiente
 *
 * Toda denegación se audita y devuelve 404 cuando revelar la
 * existencia del paciente filtraría información.
 */

import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import {
  CONSENT_CATEGORIES,
  detailLevelSatisfies,
  type ConsentCategory,
  type ConsentPurpose,
  type DetailLevel,
} from '../config/consent.js';
import * as OrganizationModel from '../models/organization.model.js';
import type { OrganizationMembership, OrganizationRole } from '../models/organization.model.js';
import * as CareModel from '../models/care.model.js';
import type { CareAssignment, OrganizationPatient } from '../models/care.model.js';
import * as SharingConsentModel from '../models/sharingConsent.model.js';
import type { SharingConsentWithCategories } from '../models/sharingConsent.model.js';
import * as CredentialsService from './credentials.service.js';
import * as AuditService from './audit.service.js';

export class ClinicalAccessError extends Error {
  statusCode: number;
  code: string;
  denialReason: string;
  isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    denialReason: string
  ) {
    super(message);
    this.name = 'ClinicalAccessError';
    this.statusCode = statusCode;
    this.code = code;
    this.denialReason = denialReason;
    this.isOperational = true;
  }
}

export interface AuditContext {
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export const buildAuditContext = (req: Request): AuditContext => {
  const headerRequestId = req.header('x-request-id');
  const requestId =
    headerRequestId && /^[0-9a-f-]{36}$/i.test(headerRequestId)
      ? headerRequestId
      : randomUUID();

  return {
    requestId,
    ipAddress: req.ip ?? null,
    userAgent: req.header('user-agent') ?? null,
  };
};

export interface ClinicalReadRequest {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  category: ConsentCategory;
  purpose?: ConsentPurpose;
}

export interface ClinicalAccessDecision {
  actorId: string;
  actorRole: OrganizationRole;
  organizationId: string;
  patientId: string;
  category: ConsentCategory;
  purpose: ConsentPurpose;
  detailLevel: DetailLevel;
  membership: OrganizationMembership;
  patientLink: OrganizationPatient;
  assignment: CareAssignment | null;
  consent: SharingConsentWithCategories;
}

const CLINICAL_ROLES: OrganizationRole[] = ['therapist', 'clinical_lead'];

const isClinicalRole = (role: OrganizationRole): boolean =>
  CLINICAL_ROLES.includes(role);

/**
 * Exige una credencial profesional verificada y vigente para roles
 * clínicos. El org_admin y auditor no la requieren (no tienen acceso
 * a contenido clínico). La denegación queda auditada.
 */
export const assertClinicalCredential = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  role: OrganizationRole;
  context: AuditContext;
}): Promise<void> => {
  if (!isClinicalRole(input.role)) return;

  const hasCredential = await CredentialsService.hasVerifiedCredential(
    input.actorId,
    input.organizationId
  );

  if (!hasCredential) {
    await AuditService.logAccess({
      actorId: input.actorId,
      actorRole: input.actorRole,
      organizationId: input.organizationId,
      action: 'denied',
      resourceType: 'clinical_access',
      purpose: 'treatment',
      success: false,
      denialReason: 'no_verified_credential',
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
      requestId: input.context.requestId,
    });

    throw new ClinicalAccessError(
      403,
      'CREDENTIAL_REQUIRED',
      'Se requiere una credencial profesional verificada para acceder a datos clínicos',
      'no_verified_credential'
    );
  }
};

const auditDenial = async (
  input: ClinicalReadRequest,
  context: AuditContext,
  denialReason: string,
  deniedRole = input.actorRole
): Promise<void> => {
  await AuditService.logAccess({
    actorId: input.actorId,
    actorRole: deniedRole,
    organizationId: input.organizationId,
    patientId: input.patientId,
    action: 'denied',
    resourceType: input.category,
    purpose: input.purpose ?? CONSENT_CATEGORIES[input.category].purpose,
    success: false,
    denialReason,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    requestId: context.requestId,
  });
};

/**
 * Resuelve la membresía activa de un usuario en una organización.
 * Lanza ClinicalAccessError si no pertenece o la org está suspendida.
 */
export const resolveMembership = async (
  actorId: string,
  actorRole: string,
  organizationId: string,
  context: AuditContext
): Promise<{ membership: OrganizationMembership; organizationName: string }> => {
  const organization = await OrganizationModel.findById(organizationId);
  if (!organization || organization.status === 'closed') {
    throw new ClinicalAccessError(
      404,
      'ORGANIZATION_NOT_FOUND',
      'Organización no encontrada',
      'organization_not_found'
    );
  }

  if (organization.status !== 'active') {
    throw new ClinicalAccessError(
      403,
      'ORG_SUSPENDED',
      'La organización está suspendida',
      'organization_suspended'
    );
  }

  const membership = await OrganizationModel.findMembership(organizationId, actorId);
  if (!membership || membership.status !== 'active') {
    await AuditService.logAccess({
      actorId,
      actorRole,
      organizationId,
      action: 'denied',
      resourceType: 'organization',
      purpose: 'treatment',
      success: false,
      denialReason: 'not_a_member',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
    });

    throw new ClinicalAccessError(
      403,
      'NOT_A_MEMBER',
      'No perteneces a esta organización',
      'not_a_member'
    );
  }

  return { membership, organizationName: organization.name };
};

export const authorizeClinicalRead = async (
  input: ClinicalReadRequest,
  context: AuditContext
): Promise<ClinicalAccessDecision> => {
  const purpose = input.purpose ?? CONSENT_CATEGORIES[input.category].purpose;

  try {
    const { membership } = await resolveMembership(
      input.actorId,
      input.actorRole,
      input.organizationId,
      context
    );

    if (!isClinicalRole(membership.role)) {
      throw new ClinicalAccessError(
        403,
        'FORBIDDEN',
        'Tu rol no permite acceder a contenido clínico',
        `role_${membership.role}_has_no_clinical_access`
      );
    }

    await assertClinicalCredential({
      actorId: input.actorId,
      actorRole: input.actorRole,
      organizationId: input.organizationId,
      role: membership.role,
      context,
    });

    const patientLink = await CareModel.findPatientLink(
      input.organizationId,
      input.patientId
    );

    if (!patientLink || patientLink.status !== 'active') {
      throw new ClinicalAccessError(
        404,
        'PATIENT_NOT_ASSIGNED',
        'Paciente no encontrado',
        'patient_not_linked_or_inactive'
      );
    }

    let assignment: CareAssignment | null = null;
    if (membership.role === 'therapist') {
      assignment = await CareModel.findActiveAssignment(patientLink.id, input.actorId);
      if (!assignment) {
        throw new ClinicalAccessError(
          404,
          'PATIENT_NOT_ASSIGNED',
          'Paciente no encontrado',
          'no_active_assignment'
        );
      }
    }

    const consent = await SharingConsentModel.findActiveConsentForCategory({
      patientId: input.patientId,
      organizationId: input.organizationId,
      professionalId: input.actorId,
      category: input.category,
      purpose,
    });

    if (!consent) {
      throw new ClinicalAccessError(
        403,
        'CONSENT_REQUIRED',
        'El paciente no ha compartido esta categoría',
        'no_active_consent_for_category'
      );
    }

    const requiredLevel = CONSENT_CATEGORIES[input.category].requiredDetailLevel;
    if (!detailLevelSatisfies(consent.detail_level, requiredLevel)) {
      throw new ClinicalAccessError(
        403,
        'INVALID_DETAIL_LEVEL',
        'El nivel de detalle consentido no es suficiente',
        'insufficient_detail_level'
      );
    }

    return {
      actorId: input.actorId,
      actorRole: membership.role,
      organizationId: input.organizationId,
      patientId: input.patientId,
      category: input.category,
      purpose,
      detailLevel: consent.detail_level,
      membership,
      patientLink,
      assignment,
      consent,
    };
  } catch (error) {
    if (error instanceof ClinicalAccessError) {
      await auditDenial(input, context, error.denialReason);
    }
    throw error;
  }
};

/**
 * Verifica que un profesional pueda ver la ficha administrativa del
 * paciente (sin contenido clínico). Se usa para metadatos y auditoría.
 */
export const authorizePatientScope = async (
  input: {
    actorId: string;
    actorRole: string;
    organizationId: string;
    patientId: string;
  },
  context: AuditContext
): Promise<{
  membership: OrganizationMembership;
  patientLink: OrganizationPatient;
  assignment: CareAssignment | null;
}> => {
  const { membership } = await resolveMembership(
    input.actorId,
    input.actorRole,
    input.organizationId,
    context
  );

  if (!isClinicalRole(membership.role)) {
    throw new ClinicalAccessError(
      403,
      'FORBIDDEN',
      'Tu rol no permite acceder a información de pacientes',
      `role_${membership.role}_has_no_patient_access`
    );
  }

  await assertClinicalCredential({
    actorId: input.actorId,
    actorRole: input.actorRole,
    organizationId: input.organizationId,
    role: membership.role,
    context,
  });

  const patientLink = await CareModel.findPatientLink(
    input.organizationId,
    input.patientId
  );

  if (!patientLink || patientLink.status !== 'active') {
    throw new ClinicalAccessError(
      404,
      'PATIENT_NOT_ASSIGNED',
      'Paciente no encontrado',
      'patient_not_linked_or_inactive'
    );
  }

  let assignment: CareAssignment | null = null;
  if (membership.role === 'therapist') {
    assignment = await CareModel.findActiveAssignment(patientLink.id, input.actorId);
    if (!assignment) {
      throw new ClinicalAccessError(
        404,
        'PATIENT_NOT_ASSIGNED',
        'Paciente no encontrado',
        'no_active_assignment'
      );
    }
  }

  return { membership, patientLink, assignment };
};

/**
 * Consentimiento opcional para una categoría adicional (por ejemplo
 * notas dentro de un recurso ya autorizado). No registra denegación:
 * la ausencia es un estado normal y no un intento de acceso indebido.
 */
export const findOptionalCategoryConsent = async (input: {
  patientId: string;
  organizationId: string;
  professionalId: string;
  category: ConsentCategory;
  purpose?: ConsentPurpose;
}): Promise<(SharingConsentWithCategories & { detail_level: DetailLevel }) | null> => {
  const purpose = input.purpose ?? CONSENT_CATEGORIES[input.category].purpose;
  const consent = await SharingConsentModel.findActiveConsentForCategory({
    patientId: input.patientId,
    organizationId: input.organizationId,
    professionalId: input.professionalId,
    category: input.category,
    purpose,
  });

  if (!consent) return null;
  if (
    !detailLevelSatisfies(
      consent.detail_level,
      CONSENT_CATEGORIES[input.category].requiredDetailLevel
    )
  ) {
    return null;
  }
  return consent;
};

export const recordReadSuccess = async (  decision: ClinicalAccessDecision,
  input: {
    resourceType: string;
    resourceIds?: string[];
    action?: 'view' | 'list';
    context: AuditContext;
  }
): Promise<void> => {
  await AuditService.logAccess({
    actorId: decision.actorId,
    actorRole: decision.actorRole,
    organizationId: decision.organizationId,
    patientId: decision.patientId,
    consentId: decision.consent.id,
    action: input.action ?? 'view',
    resourceType: input.resourceType,
    resourceIds: input.resourceIds ?? [],
    purpose: decision.purpose,
    success: true,
    ipAddress: input.context.ipAddress,
    userAgent: input.context.userAgent,
    requestId: input.context.requestId,
  });
};

/**
 * Resumen de consentimiento para el terapeuta: solo metadatos,
 * nunca contenido clínico. Incluye categorías no compartidas de forma
 * genérica.
 */
export const getConsentSummaryForTherapist = async (
  patientId: string
): Promise<{
  consents: SharingConsentWithCategories[];
  sharedCategories: Record<string, DetailLevel>;
  unavailableCategories: ConsentCategory[];
}> => {
  const consents = await SharingConsentModel.listActiveConsentsForPatient(patientId);

  const sharedCategories: Record<string, DetailLevel> = {};
  for (const consent of consents) {
    for (const category of consent.categories) {
      if (!category.enabled) continue;
      const current = sharedCategories[category.category];
      if (
        !current ||
        detailLevelSatisfies(category.detail_level, current)
      ) {
        sharedCategories[category.category] = category.detail_level;
      }
    }
  }

  const unavailableCategories = (
    Object.keys(CONSENT_CATEGORIES) as ConsentCategory[]
  ).filter((category) => !(category in sharedCategories));

  return { consents, sharedCategories, unavailableCategories };
};

export default {
  ClinicalAccessError,
  buildAuditContext,
  resolveMembership,
  assertClinicalCredential,
  authorizeClinicalRead,
  authorizePatientScope,
  findOptionalCategoryConsent,
  recordReadSuccess,
  getConsentSummaryForTherapist,
};
