/**
 * Controlador del panel del terapeuta.
 */

import type { NextFunction, Request, Response } from 'express';
import * as ClinicalAccess from '../services/clinicalAccess.service.js';
import * as ClinicalRead from '../services/clinicalRead.service.js';
import * as ClinicalFacts from '../services/clinicalFacts.service.js';
import * as AuditService from '../services/audit.service.js';
import * as CareModel from '../models/care.model.js';
import { createError } from '../middleware/error.js';
import {
  getAuthenticatedActor,
  parseLimit,
  resolveOrganizationId,
} from './clinicalContext.js';

const contextFor = (req: Request): ClinicalAccess.AuditContext =>
  ClinicalAccess.buildAuditContext(req);

/**
 * SEC-PHASE2: registro auditado de un evento "break glass".
 *
 * No altera la autorización: el acceso sin consentimiento sigue
 * bloqueado por authorizeClinicalRead. Este endpoint deja constancia de
 * la intención (con motivo) para que el centro la revise y, si procede,
 * otorgue un consentimiento temporal o tome la acción manual.
 */
export const requestBreakGlass = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole } = getAuthenticatedActor(req);
    const organizationId = await resolveOrganizationId(req, actorId);
    const patientId = req.params.id;
    const reason = (req.body as { reason?: unknown })?.reason;

    if (!patientId || typeof reason !== 'string' || !reason.trim()) {
      throw createError('id y reason son obligatorios', 400, 'INVALID_PAYLOAD');
    }

    const auditContext = contextFor(req);
    const { membership } = await ClinicalAccess.resolveMembership(
      actorId,
      actorRole,
      organizationId,
      auditContext
    );
    if (membership.status !== 'active') {
      throw createError('Membresía inactiva', 403, 'NOT_A_MEMBER');
    }
    await ClinicalAccess.assertClinicalCredential({
      actorId,
      actorRole,
      organizationId,
      role: membership.role,
      context: auditContext,
    });

    await AuditService.logAccess({
      actorId,
      actorRole,
      organizationId,
      patientId,
      consentId: null,
      action: 'break_glass',
      resourceType: 'clinical_data',
      resourceIds: [],
      purpose: 'safety',
      success: true,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      requestId: auditContext.requestId,
    });

    res.json({
      success: true,
      data: { status: 'recorded' },
      message:
        'Evento break-glass registrado en auditoría. Revisa la política del centro antes de acceder sin consentimiento.',
    });
  } catch (error) {
    next(error);
  }
};

export const listPatients = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole } = getAuthenticatedActor(req);
    const organizationId = await resolveOrganizationId(req, actorId);
    const auditContext = contextFor(req);

    const { membership } = await ClinicalAccess.resolveMembership(
      actorId,
      actorRole,
      organizationId,
      auditContext
    );

    if (membership.status !== 'active') {
      throw createError('Membresía inactiva', 403, 'NOT_A_MEMBER');
    }

    await ClinicalAccess.assertClinicalCredential({
      actorId,
      actorRole,
      organizationId,
      role: membership.role,
      context: auditContext,
    });

    let patients: CareModel.PatientListRow[] = [];
    if (membership.role === 'therapist') {
      patients = await CareModel.listPatientsForProfessional(organizationId, actorId);
    } else if (
      membership.role === 'clinical_lead' ||
      membership.role === 'org_admin'
    ) {
      patients = await CareModel.listPatientsForOrganization(organizationId);
    } else {
      throw createError(
        'Tu rol no permite listar pacientes',
        403,
        'FORBIDDEN'
      );
    }

    res.json({
      success: true,
      data: {
        organization_id: organizationId,
        patients: patients.map((patient) => ({
          id: patient.patient_id,
          organization_patient_id: patient.organization_patient_id,
          display_name: patient.name,
          care_status: patient.care_status,
          enrolled_at: patient.enrolled_at ?? null,
          assignment_role: patient.assignment_role ?? null,
        })),
      },
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole } = getAuthenticatedActor(req);
    const organizationId = await resolveOrganizationId(req, actorId);
    const patientId = req.params.id;
    if (!patientId) {
      throw createError('Paciente no indicado', 400, 'PATIENT_ID_REQUIRED');
    }

    const auditContext = contextFor(req);
    const overview = await ClinicalRead.getPatientOverview({
      actorId,
      actorRole,
      organizationId,
      patientId,
      context: auditContext,
    });

    res.json({
      success: true,
      data: overview,
      meta: {
        request_id: auditContext.requestId,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientConsent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole } = getAuthenticatedActor(req);
    const organizationId = await resolveOrganizationId(req, actorId);
    const patientId = req.params.id;
    if (!patientId) {
      throw createError('Paciente no indicado', 400, 'PATIENT_ID_REQUIRED');
    }

    const auditContext = contextFor(req);
    const result = await ClinicalRead.getConsentMetadata({
      actorId,
      actorRole,
      organizationId,
      patientId,
      context: auditContext,
    });

    res.json({
      success: true,
      data: result,
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientCheckIns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole } = getAuthenticatedActor(req);
    const organizationId = await resolveOrganizationId(req, actorId);
    const patientId = req.params.id;
    if (!patientId) {
      throw createError('Paciente no indicado', 400, 'PATIENT_ID_REQUIRED');
    }

    const auditContext = contextFor(req);
    const result = await ClinicalRead.getCheckInsForTherapist({
      actorId,
      actorRole,
      organizationId,
      patientId,
      limit: parseLimit(req.query.limit, 30, 200),
      context: auditContext,
    });

    res.json({
      success: true,
      data: result,
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientAccessLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole } = getAuthenticatedActor(req);
    const organizationId = await resolveOrganizationId(req, actorId);
    const patientId = req.params.id;
    if (!patientId) {
      throw createError('Paciente no indicado', 400, 'PATIENT_ID_REQUIRED');
    }

    const auditContext = contextFor(req);
    await ClinicalAccess.authorizePatientScope(
      { actorId, actorRole, organizationId, patientId },
      auditContext
    );

    const entries = await AuditService.listAccessForOrganization(organizationId, {
      patientId,
      limit: parseLimit(req.query.limit, 100, 500),
    });

    res.json({
      success: true,
      data: {
        entries: entries.map((entry) => ({
          id: entry.id,
          actor_id: entry.actor_id,
          actor_name: entry.actor_name ?? 'Profesional',
          actor_role: entry.actor_role,
          action: entry.action,
          resource_type: entry.resource_type,
          purpose: entry.purpose,
          success: entry.success,
          denial_reason: entry.denial_reason ?? null,
          created_at: entry.created_at,
        })),
      },
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// LECTURAS CLÍNICAS ADICIONALES
// =====================================================

const resolvePatientResource = async (
  req: Request
): Promise<{
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  auditContext: ClinicalAccess.AuditContext;
}> => {
  const { actorId, actorRole } = getAuthenticatedActor(req);
  const organizationId = await resolveOrganizationId(req, actorId);
  const patientId = req.params.id;
  if (!patientId) {
    throw createError('Paciente no indicado', 400, 'PATIENT_ID_REQUIRED');
  }
  return { actorId, actorRole, organizationId, patientId, auditContext: contextFor(req) };
};

export const getPatientCravings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole, organizationId, patientId, auditContext } =
      await resolvePatientResource(req);

    const result = await ClinicalFacts.getCravingsForTherapist({
      actorId,
      actorRole,
      organizationId,
      patientId,
      limit: parseLimit(req.query.limit, 30, 200),
      context: auditContext,
    });

    res.json({
      success: true,
      data: result,
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientConsumption = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole, organizationId, patientId, auditContext } =
      await resolvePatientResource(req);

    const result = await ClinicalFacts.getConsumptionForTherapist({
      actorId,
      actorRole,
      organizationId,
      patientId,
      limit: parseLimit(req.query.limit, 30, 200),
      context: auditContext,
    });

    res.json({
      success: true,
      data: result,
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientMedications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole, organizationId, patientId, auditContext } =
      await resolvePatientResource(req);

    const result = await ClinicalFacts.getMedicationsForTherapist({
      actorId,
      actorRole,
      organizationId,
      patientId,
      context: auditContext,
    });

    res.json({
      success: true,
      data: result,
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientJournal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole, organizationId, patientId, auditContext } =
      await resolvePatientResource(req);

    const result = await ClinicalFacts.getJournalForTherapist({
      actorId,
      actorRole,
      organizationId,
      patientId,
      limit: parseLimit(req.query.limit, 50, 300),
      context: auditContext,
    });

    res.json({
      success: true,
      data: result,
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientChatbotSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole, organizationId, patientId, auditContext } =
      await resolvePatientResource(req);

    const result = await ClinicalFacts.getChatbotSummaryForTherapist({
      actorId,
      actorRole,
      organizationId,
      patientId,
      limit: parseLimit(req.query.limit, 20, 100),
      context: auditContext,
    });

    res.json({
      success: true,
      data: result,
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listPatients,
  getPatientOverview,
  getPatientConsent,
  getPatientCheckIns,
  getPatientAccessLog,
  getPatientCravings,
  getPatientConsumption,
  getPatientMedications,
  getPatientJournal,
  getPatientChatbotSummary,
};
