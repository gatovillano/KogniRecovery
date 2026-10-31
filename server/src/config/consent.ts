/**
 * Taxonomía canónica de consentimiento clínico.
 *
 * Cada categoría declara:
 * - qué datos incluye,
 * - qué nivel de detalle mínimo necesita,
 * - de qué otra categoría depende,
 * - y si es parte del protocolo de seguridad del centro.
 *
 * El backend y la app móvil deben usar esta misma taxonomía.
 */

export type ConsentCategory =
  | 'checkins_summary'
  | 'checkins_notes'
  | 'cravings_summary'
  | 'cravings_notes'
  | 'consumption'
  | 'medications'
  | 'journal'
  | 'agent_notes'
  | 'chatbot_summary'
  | 'chatbot_transcript'
  | 'clinical_profile'
  | 'risk_alerts';

export type DetailLevel = 'aggregate' | 'summary' | 'detailed' | 'full';

export type ConsentPurpose = 'treatment' | 'safety';

export interface ConsentCategoryDefinition {
  key: ConsentCategory;
  label: string;
  description: string;
  includes: string[];
  sourceTables: string[];
  requiredDetailLevel: DetailLevel;
  purpose: ConsentPurpose;
  dependsOn: ConsentCategory[];
  requiredForCare: boolean;
}

export const CONSENT_CATEGORIES: Record<ConsentCategory, ConsentCategoryDefinition> = {
  checkins_summary: {
    key: 'checkins_summary',
    label: 'Estado de ánimo y hábitos',
    description:
      'Puntuaciones de ánimo, ansiedad, energía, sueño, ejercicio y etiquetas emocionales de tus check-ins.',
    includes: [
      'mood_score',
      'anxiety_score',
      'energy_score',
      'emotional_tags',
      'sleep_hours',
      'sleep_quality',
      'exercised_today',
      'exercise_minutes',
      'exercise_type',
      'social_interaction',
      'checkin_date',
      'checkin_time',
    ],
    sourceTables: ['checkins'],
    requiredDetailLevel: 'summary',
    purpose: 'treatment',
    dependsOn: [],
    requiredForCare: false,
  },
  checkins_notes: {
    key: 'checkins_notes',
    label: 'Notas libres de los check-ins',
    description:
      'El texto que escribes en tus check-ins, incluida la descripción de una situación de riesgo y la estrategia de afrontamiento.',
    includes: ['notes', 'risk_situation', 'risk_description', 'coping_strategy_used'],
    sourceTables: ['checkins'],
    requiredDetailLevel: 'detailed',
    purpose: 'treatment',
    dependsOn: ['checkins_summary'],
    requiredForCare: false,
  },
  cravings_summary: {
    key: 'cravings_summary',
    label: 'Antojos y estrategias',
    description:
      'Sustancia, intensidad, duración, resultado y estrategias de afrontamiento de tus antojos.',
    includes: [
      'substance_name',
      'intensity',
      'status',
      'outcome',
      'duration_minutes',
      'craving_start_time',
      'craving_end_time',
    ],
    sourceTables: ['cravings'],
    requiredDetailLevel: 'summary',
    purpose: 'treatment',
    dependsOn: [],
    requiredForCare: false,
  },
  cravings_notes: {
    key: 'cravings_notes',
    label: 'Detalle de los antojos',
    description:
      'Desencadenantes, consecuencias y notas que escribes sobre un antojo.',
    includes: ['triggers', 'consequences', 'notes'],
    sourceTables: ['cravings'],
    requiredDetailLevel: 'detailed',
    purpose: 'treatment',
    dependsOn: ['cravings_summary'],
    requiredForCare: false,
  },
  consumption: {
    key: 'consumption',
    label: 'Consumo y dosis',
    description:
      'Registros de consumo de sustancias, dosis, frecuencia, intensidad del antojo y notas de contexto.',
    includes: [
      'substance_name',
      'quantity',
      'unit',
      'consumed_at',
      'dose_time',
      'craving_intensity',
      'feelings',
      'context_notes',
    ],
    sourceTables: ['consumption_events', 'substance_doses'],
    requiredDetailLevel: 'detailed',
    purpose: 'treatment',
    dependsOn: [],
    requiredForCare: false,
  },
  medications: {
    key: 'medications',
    label: 'Medicamentos y adherencia',
    description:
      'Medicamentos activos, dosis, horario y registros de toma.',
    includes: ['name', 'dosage', 'schedule_time', 'taken_at', 'taken_date', 'status'],
    sourceTables: ['medications', 'medication_logs'],
    requiredDetailLevel: 'detailed',
    purpose: 'treatment',
    dependsOn: [],
    requiredForCare: false,
  },
  journal: {
    key: 'journal',
    label: 'Bitácora personal',
    description:
      'Notas diarias, hábitos protectores y de riesgo, entorno social y análisis de situaciones de consumo.',
    includes: [
      'daily_notes.content',
      'habit_entries.protective_habits',
      'habit_entries.risk_habits',
      'social_entries.people_description',
      'social_entries.impact_assessment',
      'consumption_analysis.trigger_situation',
      'consumption_analysis.action_taken',
      'consumption_analysis.lesson_learned',
    ],
    sourceTables: [
      'daily_notes',
      'habit_entries',
      'social_entries',
      'consumption_analysis',
    ],
    requiredDetailLevel: 'detailed',
    purpose: 'treatment',
    dependsOn: [],
    requiredForCare: false,
  },
  agent_notes: {
    key: 'agent_notes',
    label: 'Notas y memoria del asistente',
    description:
      'Notas que el asistente guarda sobre tu proceso. Es información generada por IA, no un diagnóstico.',
    includes: ['title', 'content', 'category', 'source'],
    sourceTables: ['agent_notes'],
    requiredDetailLevel: 'detailed',
    purpose: 'treatment',
    dependsOn: [],
    requiredForCare: false,
  },
  chatbot_summary: {
    key: 'chatbot_summary',
    label: 'Resumen de conversaciones con el asistente',
    description:
      'Un resumen de temas y estrategias habladas con el asistente, sin la conversación completa.',
    includes: ['topics_discussed', 'strategies_shared', 'context_summary'],
    sourceTables: ['conversations', 'messages'],
    requiredDetailLevel: 'summary',
    purpose: 'treatment',
    dependsOn: [],
    requiredForCare: false,
  },
  chatbot_transcript: {
    key: 'chatbot_transcript',
    label: 'Conversaciones completas con el asistente',
    description:
      'El texto completo de tus conversaciones con el asistente. Es la categoría más sensible; no se comparte por defecto.',
    includes: ['messages.content', 'messages.role', 'messages.created_at'],
    sourceTables: ['conversations', 'messages'],
    requiredDetailLevel: 'full',
    purpose: 'treatment',
    dependsOn: [],
    requiredForCare: false,
  },
  clinical_profile: {
    key: 'clinical_profile',
    label: 'Perfil clínico',
    description:
      'Sustancia principal, años de uso, tratamientos previos, historial de recaídas y motivación.',
    includes: [
      'primary_substance',
      'substance_years_use',
      'previous_treatments',
      'has_relapse_history',
      'treatment_start_date',
      'motivation_level',
    ],
    sourceTables: ['profiles'],
    requiredDetailLevel: 'detailed',
    purpose: 'treatment',
    dependsOn: [],
    requiredForCare: false,
  },
  risk_alerts: {
    key: 'risk_alerts',
    label: 'Protocolo de seguridad',
    description:
      'Alertas de riesgo detectadas en check-ins o en el asistente, para que el equipo pueda activar su protocolo de seguridad.',
    includes: ['severity', 'status', 'source', 'summary', 'created_at'],
    sourceTables: ['clinical_alerts', 'checkins'],
    requiredDetailLevel: 'summary',
    purpose: 'safety',
    dependsOn: [],
    requiredForCare: true,
  },
};

export const CONSENT_CATEGORY_KEYS = Object.keys(CONSENT_CATEGORIES) as ConsentCategory[];

export const DETAIL_LEVELS: DetailLevel[] = ['aggregate', 'summary', 'detailed', 'full'];

const DETAIL_RANK: Record<DetailLevel, number> = {
  aggregate: 0,
  summary: 1,
  detailed: 2,
  full: 3,
};

export const isConsentCategory = (value: string): value is ConsentCategory =>
  Object.prototype.hasOwnProperty.call(CONSENT_CATEGORIES, value);

export const isDetailLevel = (value: string): value is DetailLevel =>
  (DETAIL_LEVELS as string[]).includes(value);

export const detailLevelSatisfies = (
  actual: DetailLevel,
  required: DetailLevel
): boolean => DETAIL_RANK[actual] >= DETAIL_RANK[required];

export interface ConsentCategoryInput {
  category: string;
  detail_level?: string;
  enabled: boolean;
}

export interface NormalizedConsentCategory {
  category: ConsentCategory;
  detail_level: DetailLevel;
  enabled: boolean;
}

export interface CategoryValidationResult {
  valid: boolean;
  categories: NormalizedConsentCategory[];
  errors: string[];
}

/**
 * Valida y normaliza una selección de categorías.
 * - Rechaza categorías desconocidas y duplicadas.
 * - Exige el nivel mínimo de detalle.
 * - Exige las dependencias cuando una categoría está activa.
 */
export const validateConsentCategories = (
  input: ConsentCategoryInput[]
): CategoryValidationResult => {
  const errors: string[] = [];
  const seen = new Set<string>();
  const normalized: NormalizedConsentCategory[] = [];

  for (const item of input) {
    if (!isConsentCategory(item.category)) {
      errors.push(`Categoría desconocida: ${item.category}`);
      continue;
    }

    if (seen.has(item.category)) {
      errors.push(`Categoría duplicada: ${item.category}`);
      continue;
    }
    seen.add(item.category);

    const definition = CONSENT_CATEGORIES[item.category];
    const detailLevel = item.detail_level ?? definition.requiredDetailLevel;

    if (!isDetailLevel(detailLevel)) {
      errors.push(`Nivel de detalle inválido para ${item.category}: ${detailLevel}`);
      continue;
    }

    if (!detailLevelSatisfies(detailLevel, definition.requiredDetailLevel)) {
      errors.push(
        `La categoría ${item.category} requiere al menos nivel ${definition.requiredDetailLevel}.`
      );
      continue;
    }

    if (item.enabled) {
      for (const dependency of definition.dependsOn) {
        const dependencyItem = input.find((candidate) => candidate.category === dependency);
        if (!dependencyItem?.enabled) {
          errors.push(
            `La categoría ${item.category} requiere habilitar ${dependency}.`
          );
        }
      }
    }

    normalized.push({
      category: item.category,
      detail_level: detailLevel,
      enabled: Boolean(item.enabled),
    });
  }

  return {
    valid: errors.length === 0,
    categories: normalized,
    errors,
  };
};

export const getCategoryDefinition = (
  category: ConsentCategory
): ConsentCategoryDefinition => CONSENT_CATEGORIES[category];
