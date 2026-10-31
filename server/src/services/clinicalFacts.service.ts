/**
 * Lecturas clínicas del panel (segunda tanda).
 *
 * Mismo patrón que `clinicalRead.service.ts`: autorización central vía
 * `ClinicalAccessService`, máscara de columnas en SQL según consentimiento
 * y auditoría de cada lectura.
 *
 * Categorías: cravings, consumption, medications, journal, chatbot_summary.
 * `agent_notes` (migración 011) existe y se expone al paciente vía
 * /notes; el acceso del terapeuta a esas notas queda pendiente de
 * autorización por categoría en una iteración futura.
 */

import { query } from '../config/database.js';
import { tryDecrypt } from '../utils/encryption.js';
import type { ConsentCategory, DetailLevel } from '../config/consent.js';
import * as ClinicalAccess from './clinicalAccess.service.js';
import type {
  AuditContext,
  ClinicalAccessDecision,
} from './clinicalAccess.service.js';

const buildNotesDecision = (
  summary: ClinicalAccessDecision,
  consent: NonNullable<
    Awaited<ReturnType<typeof ClinicalAccess.findOptionalCategoryConsent>>
  >,
  category: ConsentCategory
): ClinicalAccessDecision => ({
  ...summary,
  category,
  detailLevel: consent.detail_level,
  consent,
});

interface ConsentSummary {
  detail_level: DetailLevel;
  expires_at?: Date | null;
}

interface CategoryConsentState {
  summary: ConsentSummary | null;
  notes: ConsentSummary | null;
  unavailable_categories: ConsentCategory[];
}

const toConsentState = (input: {
  summaryDecision: ClinicalAccessDecision;
  notesConsent: Awaited<
    ReturnType<typeof ClinicalAccess.findOptionalCategoryConsent>
  > | null;
  notesCategory: ConsentCategory;
}): CategoryConsentState => ({
  summary: {
    detail_level: input.summaryDecision.detailLevel,
    expires_at: input.summaryDecision.consent.expires_at ?? null,
  },
  notes: input.notesConsent
    ? {
        detail_level: input.notesConsent.detail_level,
        expires_at: input.notesConsent.expires_at ?? null,
      }
    : null,
  unavailable_categories: input.notesConsent ? [] : [input.notesCategory],
});

const historyWindowWhere = (
  alias: string,
  column: string,
  historyDays: number | null,
  paramIndex: number
): { sql: string; params: unknown[] } => {
  if (historyDays && historyDays > 0) {
    return {
      sql: `${alias}.${column} >= NOW() - ($${paramIndex}::int * INTERVAL '1 day')`,
      params: [historyDays],
    };
  }
  return { sql: 'TRUE', params: [] };
};

// =====================================================
// CRAVINGS
// =====================================================

const CRAVINGS_SUMMARY_COLUMNS = `
  cr.id,
  cr.substance_name,
  cr.intensity,
  cr.status,
  cr.outcome,
  cr.duration_minutes,
  cr.craving_start_time,
  cr.craving_end_time
`;

const CRAVINGS_NOTES_COLUMNS = `
  cr.triggers,
  cr.coping_strategies,
  cr.consequences,
  cr.notes
`;

export interface ClinicalCraving {
  id: string;
  substance_name: string;
  intensity: number;
  status?: string | null;
  outcome?: string | null;
  duration_minutes?: number | null;
  craving_start_time: Date;
  craving_end_time?: Date | null;
  triggers?: unknown | null;
  coping_strategies?: unknown | null;
  consequences?: string | null;
  notes?: string | null;
}

export interface CravingsReadResult {
  items: ClinicalCraving[];
  consent: CategoryConsentState;
}

export const getCravingsForTherapist = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  limit?: number;
  context: AuditContext;
}): Promise<CravingsReadResult> => {
  const summaryDecision = await ClinicalAccess.authorizeClinicalRead(
    {
      actorId: input.actorId,
      actorRole: input.actorRole,
      organizationId: input.organizationId,
      patientId: input.patientId,
      category: 'cravings_summary',
    },
    input.context
  );

  const notesConsent = await ClinicalAccess.findOptionalCategoryConsent({
    patientId: input.patientId,
    organizationId: input.organizationId,
    professionalId: input.actorId,
    category: 'cravings_notes',
  });

  const includeNotes = Boolean(notesConsent);
  const history = historyWindowWhere(
    'cr',
    'craving_start_time',
    summaryDecision.consent.history_days ?? null,
    2
  );
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 200);

  const params: unknown[] = [input.patientId, ...history.params, limit];
  const limitParam = `$${params.length}`;

  const result = await query<ClinicalCraving>(
    `SELECT ${includeNotes ? `${CRAVINGS_SUMMARY_COLUMNS}, ${CRAVINGS_NOTES_COLUMNS}` : CRAVINGS_SUMMARY_COLUMNS}
     FROM cravings cr
     WHERE cr.user_id = $1 AND ${history.sql}
     ORDER BY cr.craving_start_time DESC
     LIMIT ${limitParam}`,
    params
  );

  await ClinicalAccess.recordReadSuccess(summaryDecision, {
    resourceType: 'cravings',
    resourceIds: result.rows.map((row) => row.id),
    action: 'list',
    context: input.context,
  });

  if (includeNotes && notesConsent) {
    await ClinicalAccess.recordReadSuccess(
      buildNotesDecision(summaryDecision, notesConsent, 'cravings_notes'),
      {
        resourceType: 'cravings_notes',
        resourceIds: result.rows.map((row) => row.id),
        action: 'list',
        context: input.context,
      }
    );
  }

  // SEC-PHASE1: descifrar notas/consecuencias de cravings.
  const items = includeNotes
    ? result.rows.map((row) => ({
        ...row,
        consequences: row.consequences ? tryDecrypt(row.consequences) : null,
        notes: row.notes ? tryDecrypt(row.notes) : null,
      }))
    : result.rows;

  return {
    items,
    consent: toConsentState({
      summaryDecision,
      notesConsent,
      notesCategory: 'cravings_notes',
    }),
  };
};

// =====================================================
// CONSUMO (eventos + dosis)
// =====================================================

export interface ClinicalConsumption {
  kind: 'event' | 'dose' | 'checkin';
  id: string;
  substance_name: string;
  quantity: string | number;
  unit?: string | null;
  occurred_at: Date;
  craving_intensity?: number | null;
  feelings?: string | null;
  context_notes?: string | null;
}

export interface ConsumptionReadResult {
  items: ClinicalConsumption[];
  consent: ConsentSummary | null;
  unavailable_categories: ConsentCategory[];
}

export const getConsumptionForTherapist = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  limit?: number;
  context: AuditContext;
}): Promise<ConsumptionReadResult> => {
  const decision = await ClinicalAccess.authorizeClinicalRead(
    {
      actorId: input.actorId,
      actorRole: input.actorRole,
      organizationId: input.organizationId,
      patientId: input.patientId,
      category: 'consumption',
    },
    input.context
  );

  const days = decision.consent.history_days ?? null;
  const eventWhere =
    days && days > 0
      ? 'ev.consumed_at >= NOW() - ($2::int * INTERVAL \'1 day\')'
      : 'TRUE';
  const doseWhere =
    days && days > 0
      ? 'sd.dose_time >= NOW() - ($2::int * INTERVAL \'1 day\')'
      : 'TRUE';
  const checkinWhere =
    days && days > 0
      ? 'c.checkin_date >= CURRENT_DATE - ($2::int * INTERVAL \'1 day\')'
      : 'TRUE';
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 200);

  const params: unknown[] = [input.patientId, days, limit];
  const limitParam = `$${params.length}`;

  const result = await query<ClinicalConsumption>(
    `SELECT 'event' AS kind, ev.id, ev.substance_name, ev.quantity::text AS quantity, ev.unit,
            ev.consumed_at AS occurred_at, ev.craving_intensity,
            NULL::text AS feelings, ev.context_notes
     FROM consumption_events ev
     WHERE ev.user_id = $1 AND ${eventWhere}
     UNION ALL
     SELECT 'dose' AS kind, sd.id, sd.substance_name, sd.quantity::text AS quantity, sd.unit,
            sd.dose_time AS occurred_at, sd.craving_intensity,
            sd.feelings, sd.context_notes
     FROM substance_doses sd
     WHERE sd.user_id = $1 AND ${doseWhere}
     UNION ALL
     SELECT 'checkin' AS kind, c.id,
            COALESCE(NULLIF(e->>'name', ''), NULL) AS substance_name,
            COALESCE(e->>'quantity', '') AS quantity,
            NULL::text AS unit,
            c.checkin_date::timestamp AS occurred_at, NULL::int AS craving_intensity,
            NULL::text AS feelings,
            COALESCE(NULLIF(c.risk_description, ''), c.notes) AS context_notes
     FROM checkins c
     CROSS JOIN LATERAL jsonb_array_elements(c.consumed_substances) AS e
     WHERE c.user_id = $1
       AND jsonb_array_length(c.consumed_substances) > 0
       AND ${checkinWhere}
     ORDER BY occurred_at DESC
     LIMIT ${limitParam}`,
    params
  );

  await ClinicalAccess.recordReadSuccess(decision, {
    resourceType: 'consumption',
    resourceIds: result.rows.map((row) => row.id),
    action: 'list',
    context: input.context,
  });

  // SEC-PHASE1: descifrar sensaciones/notas de contexto de consumo.
  const items = result.rows.map((row) => ({
    ...row,
    feelings: row.feelings ? tryDecrypt(row.feelings) : null,
    context_notes: row.context_notes ? tryDecrypt(row.context_notes) : null,
  }));

  return {
    items,
    consent: {
      detail_level: decision.detailLevel,
      expires_at: decision.consent.expires_at ?? null,
    },
    unavailable_categories: [],
  };
};

// =====================================================
// MEDICAMENTOS
// =====================================================

export interface ClinicalMedication {
  id: string;
  name: string;
  dosage: string;
  schedule_time: string;
  is_active: boolean;
  last_taken_at?: Date | null;
  last_taken_date?: string | null;
  last_status?: string | null;
}

export interface MedicationsReadResult {
  items: ClinicalMedication[];
  consent: ConsentSummary | null;
  unavailable_categories: ConsentCategory[];
}

export const getMedicationsForTherapist = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  context: AuditContext;
}): Promise<MedicationsReadResult> => {
  const decision = await ClinicalAccess.authorizeClinicalRead(
    {
      actorId: input.actorId,
      actorRole: input.actorRole,
      organizationId: input.organizationId,
      patientId: input.patientId,
      category: 'medications',
    },
    input.context
  );

  const result = await query<ClinicalMedication>(
    `SELECT m.id, m.name, m.dosage, m.schedule_time, m.is_active,
            ml.taken_at AS last_taken_at,
            ml.taken_date AS last_taken_date,
            ml.status AS last_status
     FROM medications m
     LEFT JOIN LATERAL (
       SELECT ml.taken_at, ml.taken_date, ml.status
       FROM medication_logs ml
       WHERE ml.medication_id = m.id
       ORDER BY ml.taken_date DESC, ml.taken_at DESC
       LIMIT 1
     ) ml ON TRUE
     WHERE m.user_id = $1
       AND m.is_active = TRUE
     ORDER BY m.name ASC`,
    [input.patientId]
  );

  await ClinicalAccess.recordReadSuccess(decision, {
    resourceType: 'medications',
    resourceIds: result.rows.map((row) => row.id),
    action: 'list',
    context: input.context,
  });

  return {
    items: result.rows,
    consent: {
      detail_level: decision.detailLevel,
      expires_at: decision.consent.expires_at ?? null,
    },
    unavailable_categories: [],
  };
};

// =====================================================
// BITÁCORA (journal)
// =====================================================

export interface ClinicalJournalEntry {
  kind: 'daily_note' | 'habit' | 'social' | 'consumption_analysis';
  id: string;
  entry_date: string | Date;
  text: string;
}

export interface JournalReadResult {
  items: ClinicalJournalEntry[];
  consent: ConsentSummary | null;
  unavailable_categories: ConsentCategory[];
}

export const getJournalForTherapist = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  limit?: number;
  context: AuditContext;
}): Promise<JournalReadResult> => {
  const decision = await ClinicalAccess.authorizeClinicalRead(
    {
      actorId: input.actorId,
      actorRole: input.actorRole,
      organizationId: input.organizationId,
      patientId: input.patientId,
      category: 'journal',
    },
    input.context
  );

  const days = decision.consent.history_days ?? null;
  const windowGuard =
    days && days > 0
      ? ' >= NOW() - ($2::int * INTERVAL \'1 day\')'
      : ' IS NOT NULL';
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 300);

  const params: unknown[] = [input.patientId, days, limit];
  const limitParam = `$${params.length}`;

  // SEC-PHASE1: los campos de texto van en un objeto JSON (parts); el
  // texto legible se ensambla en JS tras descifrar cada parte.
  const result = await query<ClinicalJournalEntry & { parts?: Record<string, string> }>(
    `SELECT 'daily_note' AS kind, dn.id, dn.note_date AS entry_date, dn.content AS text,
            NULL::jsonb AS parts
     FROM daily_notes dn
     WHERE dn.user_id = $1 AND dn.note_date${windowGuard}
     UNION ALL
     SELECT 'habit' AS kind, he.id, he.entry_date, NULL::text AS text,
            json_build_object('protective', he.protective_habits, 'risk', he.risk_habits) AS parts
     FROM habit_entries he
     WHERE he.user_id = $1 AND he.entry_date${windowGuard}
     UNION ALL
     SELECT 'social' AS kind, se.id, se.entry_date, NULL::text AS text,
            json_build_object('people', se.people_description, 'impact', se.impact_assessment) AS parts
     FROM social_entries se
     WHERE se.user_id = $1 AND se.entry_date${windowGuard}
     UNION ALL
     SELECT 'consumption_analysis' AS kind, ca.id, ca.entry_date, NULL::text AS text,
            json_build_object('trigger', ca.trigger_situation, 'action', ca.action_taken, 'lesson', ca.lesson_learned) AS parts
     FROM consumption_analysis ca
     WHERE ca.user_id = $1 AND ca.entry_date${windowGuard}
     ORDER BY entry_date DESC
     LIMIT ${limitParam}`,
    params
  );

  const items = result.rows.map((row) => {
    if (row.parts) {
      const p = row.parts as Record<string, string>;
      if (row.kind === 'habit') {
        return {
          ...row,
          text: `Protectores: ${tryDecrypt(p.protective ?? '')} | Riesgo: ${tryDecrypt(p.risk ?? '')}`,
        };
      }
      if (row.kind === 'social') {
        return {
          ...row,
          text: `${tryDecrypt(p.people ?? '')} — ${tryDecrypt(p.impact ?? '')}`,
        };
      }
      if (row.kind === 'consumption_analysis') {
        return {
          ...row,
          text: `${tryDecrypt(p.trigger ?? '')} | Acción: ${tryDecrypt(p.action ?? '')} | Aprendizaje: ${tryDecrypt(p.lesson ?? '')}`,
        };
      }
    }
    // daily_note: texto único.
    return { ...row, text: tryDecrypt(row.text ?? '') };
  });

  await ClinicalAccess.recordReadSuccess(decision, {
    resourceType: 'journal',
    resourceIds: result.rows.map((row) => row.id),
    action: 'list',
    context: input.context,
  });

  return {
    items,
    consent: {
      detail_level: decision.detailLevel,
      expires_at: decision.consent.expires_at ?? null,
    },
    unavailable_categories: [],
  };
};

// =====================================================
// CHATBOT: RESUMEN
// =====================================================

export interface ClinicalChatbotSummary {
  id: string;
  title?: string | null;
  scenario_type?: string | null;
  status?: string | null;
  message_count?: number | null;
  duration_minutes?: number | null;
  started_at?: Date | null;
  last_message_at?: Date | null;
  contains_crisk?: boolean | null;
  escalated_to_emergency?: boolean | null;
  user_satisfaction?: number | null;
}

export interface ChatbotSummaryReadResult {
  items: ClinicalChatbotSummary[];
  consent: ConsentSummary | null;
  unavailable_categories: ConsentCategory[];
}

export const getChatbotSummaryForTherapist = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  limit?: number;
  context: AuditContext;
}): Promise<ChatbotSummaryReadResult> => {
  const decision = await ClinicalAccess.authorizeClinicalRead(
    {
      actorId: input.actorId,
      actorRole: input.actorRole,
      organizationId: input.organizationId,
      patientId: input.patientId,
      category: 'chatbot_summary',
    },
    input.context
  );

  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const result = await query<ClinicalChatbotSummary>(
    `SELECT id, title, scenario_type, status, message_count, duration_minutes,
            started_at, last_message_at, contains_crisk,
            escalated_to_emergency, user_satisfaction
     FROM conversations
     WHERE user_id = $1
     ORDER BY COALESCE(last_message_at, started_at) DESC
     LIMIT $2`,
    [input.patientId, limit]
  );

  await ClinicalAccess.recordReadSuccess(decision, {
    resourceType: 'chatbot_summary',
    resourceIds: result.rows.map((row) => row.id),
    action: 'list',
    context: input.context,
  });

  return {
    items: result.rows,
    consent: {
      detail_level: decision.detailLevel,
      expires_at: decision.consent.expires_at ?? null,
    },
    unavailable_categories: [],
  };
};

export default {
  getCravingsForTherapist,
  getConsumptionForTherapist,
  getMedicationsForTherapist,
  getJournalForTherapist,
  getChatbotSummaryForTherapist,
};
