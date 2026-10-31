/**
 * Lecturas clínicas del panel de terapeutas.
 *
 * Regla: las columnas se eligen en SQL según el consentimiento.
 * Nunca se consulta la fila completa para filtrarla después en JS.
 */

import { query } from '../config/database.js';
import { tryDecrypt } from '../utils/encryption.js';
import type { ConsentCategory, DetailLevel } from '../config/consent.js';
import * as UserModel from '../models/user.model.js';
import * as CareModel from '../models/care.model.js';
import * as ClinicalAccess from './clinicalAccess.service.js';
import type {
  AuditContext,
  ClinicalAccessDecision,
} from './clinicalAccess.service.js';

const SUMMARY_COLUMNS = `
  c.id,
  c.checkin_date,
  c.checkin_time,
  c.checkin_type,
  COALESCE(c.mood_score, c.mood * 2) AS mood_score,
  COALESCE(c.anxiety_score, c.cravings) AS anxiety_score,
  c.energy_score,
  c.emotional_tags,
  c.sleep_hours,
  c.sleep_quality,
  c.exercised_today,
  c.exercise_minutes,
  c.exercise_type,
  c.social_interaction,
  c.consumed_substances
`;

const NOTES_COLUMNS = `
  c.notes,
  c.risk_situation,
  c.risk_description,
  c.coping_strategy_used
`;

export interface ClinicalCheckIn {
  id: string;
  checkin_date: string | Date;
  checkin_time?: string | null;
  checkin_type?: string | null;
  mood_score?: number | null;
  anxiety_score?: number | null;
  energy_score?: number | null;
  emotional_tags?: string[] | null;
  sleep_hours?: number | string | null;
  sleep_quality?: number | null;
  exercised_today?: boolean | null;
  exercise_minutes?: number | null;
  exercise_type?: string | null;
  social_interaction?: string | null;
  consumed_substances?: Array<{ name?: string | null; quantity?: string | null }> | null;
  notes?: string | null;
  risk_situation?: boolean | null;
  risk_description?: string | null;
  coping_strategy_used?: string | null;
}

export interface CheckInReadResult {
  items: ClinicalCheckIn[];
  consent: {
    summary: { detail_level: DetailLevel; expires_at?: Date | null } | null;
    notes: { detail_level: DetailLevel; expires_at?: Date | null } | null;
    history_days: number | null;
  };
  unavailable_categories: ConsentCategory[];
}

const buildNotesDecision = (
  summary: ClinicalAccessDecision,
  consent: NonNullable<
    Awaited<ReturnType<typeof ClinicalAccess.findOptionalCategoryConsent>>
  >
): ClinicalAccessDecision => ({
  ...summary,
  category: 'checkins_notes',
  detailLevel: consent.detail_level,
  consent,
});

export const getCheckInsForTherapist = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  limit?: number;
  context: AuditContext;
}): Promise<CheckInReadResult> => {
  const summaryDecision = await ClinicalAccess.authorizeClinicalRead(
    {
      actorId: input.actorId,
      actorRole: input.actorRole,
      organizationId: input.organizationId,
      patientId: input.patientId,
      category: 'checkins_summary',
    },
    input.context
  );

  const notesConsent = await ClinicalAccess.findOptionalCategoryConsent({
    patientId: input.patientId,
    organizationId: input.organizationId,
    professionalId: input.actorId,
    category: 'checkins_notes',
  });

  const includeNotes = Boolean(notesConsent);
  const historyDays = summaryDecision.consent.history_days ?? null;
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 200);

  const params: unknown[] = [input.patientId];
  const where: string[] = ['c.user_id = $1'];

  if (historyDays && historyDays > 0) {
    params.push(historyDays);
    where.push(`c.checkin_date >= CURRENT_DATE - ($${params.length}::int * INTERVAL '1 day')`);
  }

  params.push(limit);
  const limitParam = `$${params.length}`;

  const result = await query<ClinicalCheckIn>(
    `SELECT ${includeNotes ? `${SUMMARY_COLUMNS}, ${NOTES_COLUMNS}` : SUMMARY_COLUMNS}
     FROM checkins c
     WHERE ${where.join(' AND ')}
     ORDER BY c.checkin_date DESC, c.checkin_time DESC
     LIMIT ${limitParam}`,
    params
  );

  await ClinicalAccess.recordReadSuccess(summaryDecision, {
    resourceType: 'checkins',
    resourceIds: result.rows.map((row) => row.id),
    action: 'list',
    context: input.context,
  });

  if (includeNotes && notesConsent) {
    await ClinicalAccess.recordReadSuccess(
      buildNotesDecision(summaryDecision, notesConsent),
      {
        resourceType: 'checkins_notes',
        resourceIds: result.rows.map((row) => row.id),
        action: 'list',
        context: input.context,
      }
    );
  }

  // SEC-PHASE1: descifrar columnas de texto clínico (notes/risk_description).
  const items = includeNotes
    ? result.rows.map((row) => ({
        ...row,
        notes: row.notes ? tryDecrypt(row.notes) : null,
        risk_description: row.risk_description ? tryDecrypt(row.risk_description) : null,
      }))
    : result.rows;

  return {
    items,
    consent: {
      summary: {
        detail_level: summaryDecision.detailLevel,
        expires_at: summaryDecision.consent.expires_at ?? null,
      },
      notes: notesConsent
        ? {
            detail_level: notesConsent.detail_level,
            expires_at: notesConsent.expires_at ?? null,
          }
        : null,
      history_days: historyDays,
    },
    unavailable_categories: includeNotes ? [] : ['checkins_notes'],
  };
};

export interface PatientOverview {
  patient: {
    id: string;
    display_name: string;
    care_status: string;
    enrolled_at?: Date | null;
    assigned_professional: string | null;
  };
  consent: Awaited<
    ReturnType<typeof ClinicalAccess.getConsentSummaryForTherapist>
  >;
  checkins: ClinicalCheckIn[];
  checkins_error: string | null;
}

export const getPatientOverview = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  context: AuditContext;
}): Promise<PatientOverview> => {
  const scope = await ClinicalAccess.authorizePatientScope(
    {
      actorId: input.actorId,
      actorRole: input.actorRole,
      organizationId: input.organizationId,
      patientId: input.patientId,
    },
    input.context
  );

  const patient = await UserModel.findPublicById(input.patientId);
  if (!patient) {
    throw new ClinicalAccess.ClinicalAccessError(
      404,
      'PATIENT_NOT_ASSIGNED',
      'Paciente no encontrado',
      'patient_not_found'
    );
  }

  let assignedProfessional: string | null = null;
  if (scope.assignment) {
    const professional = await UserModel.findPublicById(scope.assignment.professional_id);
    assignedProfessional = professional?.name ?? null;
  }

  const consent = await ClinicalAccess.getConsentSummaryForTherapist(input.patientId);

  let checkins: ClinicalCheckIn[] = [];
  let checkinsError: string | null = null;

  if (consent.sharedCategories.checkins_summary) {
    try {
      const result = await getCheckInsForTherapist({
        actorId: input.actorId,
        actorRole: input.actorRole,
        organizationId: input.organizationId,
        patientId: input.patientId,
        limit: 7,
        context: input.context,
      });
      checkins = result.items;
    } catch (error) {
      if (error instanceof ClinicalAccess.ClinicalAccessError) {
        checkinsError = error.code;
      } else {
        throw error;
      }
    }
  } else {
    checkinsError = 'CONSENT_REQUIRED';
  }

  return {
    patient: {
      id: patient.id,
      display_name: patient.name || patient.email.split('@')[0] || 'Paciente',
      care_status: scope.patientLink.status,
      enrolled_at: scope.patientLink.enrolled_at ?? null,
      assigned_professional: assignedProfessional,
    },
    consent,
    checkins,
    checkins_error: checkinsError,
  };
};

export const getConsentMetadata = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  context: AuditContext;
}): Promise<{
  consent: Awaited<ReturnType<typeof ClinicalAccess.getConsentSummaryForTherapist>>;
}> => {
  await ClinicalAccess.authorizePatientScope(
    {
      actorId: input.actorId,
      actorRole: input.actorRole,
      organizationId: input.organizationId,
      patientId: input.patientId,
    },
    input.context
  );

  const consent = await ClinicalAccess.getConsentSummaryForTherapist(input.patientId);
  return { consent };
};

export const listTherapistPatients = async (
  organizationId: string,
  professionalId: string
): Promise<CareModel.PatientListRow[]> => {
  return CareModel.listPatientsForProfessional(organizationId, professionalId);
};

export default {
  getCheckInsForTherapist,
  getPatientOverview,
  getConsentMetadata,
  listTherapistPatients,
};
