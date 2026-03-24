# Queries para Chatbot NADA - KogniRecovery

## Propósito

Proporcionar al LLM (NADA) contexto personalizado del paciente para generar respuestas más precisas y seguras.

---

## 1. Query: Obtener Contexto Completo del Paciente

**Descripción**: Antes de cada conversación, obtener snapshot completo del paciente (medicamentos, síntomas recientes, estado mental).

**Parámetros**:
- `user_uuid` (string)
- `conversation_turn` (int) - número de turno en la conversación (para limitar historial)
- `max_history_messages` (int, default: 10) - máximo mensajes anteriores a incluir

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// 1. Perfil demográfico y clínico
RETURN u {
  .uuid,
  .age,
  .gender,
  .country,
  .primary_substance,
  .other_substances,
  .stage_of_change,
  .mental_health_details,
  .has_therapeutic_support,
  .therapist_contact
} AS user_profile

// 2. Medicamentos activos
CALL {
  WITH u
  MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
  RETURN collect({
    medication: m.generic_name,
    dose: pres.dose,
    frequency: pres.frequency,
    indication: pres.indication,
    special_instructions: pres.special_instructions,
    last_taken: pres.last_taken
  }) AS active_medications
}

// 3. Síntomas reportados recientemente (últimos 7 días)
CALL {
  WITH u
  MATCH (u)-[r:REPORTS_SYMPTOM {
    last_reported: date() - duration({days: range(0,6)})
  }]->(sym:Symptom)
  WITH sym.name AS symptom, avg(r.intensity) AS avg_intensity, max(r.last_reported) AS last
  RETURN collect({
    symptom: symptom,
    avg_intensity: avg_intensity,
    last_reported: last
  }) AS recent_symptoms
}

// 4. Consumo de sustancias reciente (últimos 7 días)
CALL {
  WITH u
  MATCH (u)-[:CONSUMES]->(s:Substance)
  WHERE EXISTS {
    MATCH (u)-[:HAS_SUBSTANCE_CONSUMPTION {
      consumed_at: date() - duration({days: range(0,6)})
    }]->(s)
  }
  RETURN collect(DISTINCT s.name) AS recent_substances
}

// 5. Últimos mensajes del chat (historial conversación)
CALL {
  WITH u
  MATCH (u)-[:SENT_MESSAGE]->(msg:ChatMessage)
  WHERE msg.created_at >= datetime() - duration({hours: 24})
  RETURN collect({
    role: msg.role,  // 'user' o 'assistant'
    content: left(msg.content, 500),  // truncar para no saturar
    timestamp: msg.created_at
  }) AS recent_chat_history
  ORDER BY msg.created_at DESC
  LIMIT $max_history_messages
}

// 6. Eventos importantes recientes (crisis, logros)
CALL {
  WITH u
  MATCH (u)-[:EXPERIENCED]->(e:Event)
  WHERE e.occurred_at >= date() - duration({days: 30})
  RETURN collect({
    type: e.type,
    occurred_at: e.occurred_at,
    description: left(e.description, 200),
    severity: e.severity
  }) AS recent_events
}

// 7. Alertas no resueltas
CALL {
  WITH u
  MATCH (u)-[:HAS_ALERT]->(a:Alert)
  WHERE a.is_read = false
  RETURN collect({
    type: a.type,
    severity: a.severity,
    title: a.title,
    message: a.message
  }) AS pending_alerts
}

RETURN {
  profile: user_profile,
  active_medications: active_medications,
  recent_symptoms: recent_symptoms,
  recent_substances: recent_substances,
  recent_chat_history: recent_chat_history,
  recent_events: recent_events,
  pending_alerts: pending_alerts
} AS full_context
```

**Uso**: Esta query se ejecuta al inicio de cada conversación (o cada N turnos) para dar contexto al LLM.

---

## 2. Query: Obtener Información de un Medicamento Específico

**Descripción**: Para cuando el usuario pregunta por un medicamento concreto.

**Parámetros**:
- `medication_name` (string) - nombre genérico o comercial

**Query**:

```cypher
MATCH (m:Medication)
WHERE toLower(m.generic_name) = toLower($medication_name)
   OR ANY(brand IN m.brand_names WHERE toLower(brand) = toLower($medication_name))

// Props principales
RETURN m {
  .generic_name,
  .brand_names,
  .atc_code,
  .substance_name,
  .dosage_forms,
  .typical_adult_dose,
  .route_of_admin,
  .metabolism_enzymes,
  .receptor_affinity,
  .addiction_potential,
  .controlled_substance_schedule,
  .half_life_hours,
  .pregnancy_category,
  .breastfeeding_risk
} AS medication_info
```

**Nota**: Para detalles más extensos (ficha completa), usar RAG en lugar de esta query.

---

## 3. Query: Verificar Si Paciente Toma un Medicamento

**Descripción**: Para confirmar si el usuario tiene un medicamento específico en su lista activa.

**Parámetros**:
- `user_uuid` (string)
- `medication_name` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
WHERE toLower(m.generic_name) = toLower($medication_name)
   OR m.uuid = $medication_uuid  // también por UUID si se conoce

RETURN {
  medication: m.generic_name,
  dose: pres.dose,
  frequency: pres.frequency,
  indication: pres.indication,
  start_date: pres.start_date,
  last_taken: pres.last_taken,
  adherence_streak: pres.adherence_streak
} AS current_prescription
```

---

## 4. Query: Obtener Condiciones Diagnosticadas

**Descripción**: Para entender el contexto clínico del paciente.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:HAS_CONDITION]->(c:Condition)

RETURN collect({
  code: c.code,
  name: c.name,
  category: c.category,
  icd10: c.icd10_code,
  diagnosed_at: r.diagnosed_at,
  severity: r.severity,
  treatment_status: r.treatment_status
}) AS diagnosed_conditions
```

---

## 5. Query: Obtener Síntomas Actuales (Hoy)

**Descripción**: Para saber qué síntomas reportó el paciente hoy (último check-in).

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[r:REPORTS_SYMPTOM {date: date()}]->(sym:Symptom)

RETURN collect({
  symptom: sym.name,
  intensity: r.intensity,
  category: sym.category
}) AS today_symptoms
ORDER BY r.intensity DESC
```

---

## 6. Query: Obtener Resumen de Adherencia (Últimos 7 días)

**Descripción**: Para que el chatbot pueda comentar sobre patrones de adherencia.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)

// Días únicos en los últimos 7
WITH u, m, pres, range(0,6) AS days
UNWIND days AS offset
WITH u, m, pres, date() - duration({days: offset}) AS day

OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: day,
  medication_id: m.uuid
}]->(ade)

WITH m.generic_name AS med,
     count(*) AS total_scheduled_days,
     sum(CASE WHEN ade.taken = true THEN 1 ELSE 0 END) AS days_taken

RETURN collect({
  medication: med,
  adherence_rate: days_taken * 1.0 / total_scheduled_days,
  days_taken: days_taken,
  total_scheduled: total_scheduled_days
}) AS adherence_summary_7d
```

---

## 7. Query: Obtener Recordatorio de Efectos Secundarios

**Descripción**: Para recordar al paciente efectos secundarios comunes de sus medicamentos.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:TAKES {status: 'active'}]->(m:Medication)
MATCH (m)-[c:CAUSES]->(sym:Symptom)
WHERE c.frequency = 'common' AND c.severity IN ['mild', 'moderate']

WITH m.generic_name AS medication,
     collect({
       symptom: sym.name,
       frequency: c.frequency,
       severity: c.severity
     }) AS common_side_effects

RETURN collect({
  medication: medication,
  side_effects: common_side_effects[0..3]  // top 3 por medicamento
}) AS side_effects_to_remember
```

---

## 8. Query: Obtener Estado Emocional Reciente (Check-ins)

**Descripción**: Para que el chatbot sepa cómo se ha sentido el paciente esta semana.

**Parámetros**:
- `user_uuid` (string)
- `days_back` (int, default: 7)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:HAS_CHECKIN]->(c:Checkin)
WHERE c.checkin_date >= date() - duration({days: $days_back})

RETURN collect({
  date: c.checkin_date,
  mood_score: c.mood_score,
  mood_tags: c.mood_tags,
  consumed: c.consumed,
  substances_if_any: c.substances_used,
  cravings_intensity: c.craving_intensity
}) AS recent_checkins
ORDER BY c.checkin_date DESC
```

---

## 9. Query: Buscar Educacion Relevante Basada en Perfil

**Descripción**: Para recomendar artículos educativos basados en condiciones y medicamentos.

**Parámetros**:
- `user_uuid` (string)
- `topic_hint` (optional string) - si el usuario preguntó algo específico

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// Obtener condiciones y medicamentos del usuario
OPTIONAL MATCH (u)-[:HAS_CONDITION]->(c:Condition)
OPTIONAL MATCH (u)-[:TAKES {status: 'active'}]->(m:Medication)

// Buscar Knowledge chunks relevantes
CALL {
  WITH u, c, m, $topic_hint AS topic
  MATCH (k:Knowledge)
  WHERE k.metadata.language = 'es'
    AND k.metadata.audience IN ['patient', 'all']
    AND (
      topic IS NOT NULL AND k.metadata.topic CONTAINS topic
      OR
      k.metadata.topic IN [c.code] + collect(m.class)
      OR
      k.metadata.topic = 'general_addiction'
    )
  RETURN k {
    .chunk_id,
    .content,
    .metadata
  } AS relevant_knowledge
  ORDER BY k.retrieved_count DESC
  LIMIT 10
}

RETURN {
  conditions: collect(DISTINCT c.name),
  medications: collect(DISTINCT m.generic_name),
  recommended_articles: collect(DISTinct relevant_knowledge)
} AS education_context
```

---

## 10. Query: Obtener Contactos de Emergencia

**Descripción**: Para mostrar en caso de crisis o para que el chatbot sugiera contactar.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:HAS_EMERGENCY_CONTACT]->( ec:EmergencyContact)

RETURN collect({
  name: ec.name,
  relationship: ec.relationship,
  phone: ec.phone,
  email: ec.email,
  notify_on_risk: ec.notify_on_risk,
  can_share_location: ec.can_share_location
}) AS emergency_contacts
```

---

## 11. Query: Obtener Líneas de Crisis Locales

**Descripción**: Para mostrar al usuario cuando está en crisis.

**Parámetros**:
- `country_code` (string) - ISO 3166-1 alpha-2 (ej: "CL", "AR", "MX")

**Query**:

```cypher
MATCH (cr:CrisisResource)
WHERE cr.countries CONTAINS $country_code OR cr.countries = ['all']

RETURN collect({
  name: cr.name,
  phone: cr.phone,
  website: cr.website,
  description: cr.description,
  hours: cr.hours,
  languages: cr.languages
}) AS local_crisis_resources
ORDER BY cr.priority ASC
```

---

## 12. Query: Obtener Historial de Conversación relevante

**Descripción**: Para recuperar temas previos que puedan ser relevantes ahora.

**Parámetros**:
- `user_uuid` (string)
- `current_message_text` (string) - mensaje actual del usuario
- `max_messages` (int, default: 5)

**Query** (con búsqueda semántica simulada - en practice usar vector DB):

```cypher
// Esta query es más simple: obtener últimos mensajes del usuario que mencionen keywords similares
MATCH (u:User {uuid: $user_uuid})-[:SENT_MESSAGE]->(msg:ChatMessage)
WHERE msg.role = 'user'
  AND (msg.content CONTAINS $keyword1 OR msg.content CONTAINS $keyword2 OR ...)
  AND msg.created_at < datetime() - duration({hours: 1})  // no incluir el actual

RETURN msg {
  .content,
  .created_at
} AS past_relevant_messages
ORDER BY msg.created_at DESC
LIMIT $max_messages
```

**En realidad**: Se usar�a RAG sobre embeddings de mensajes pasados.

---

## 13. Query: Obtener Patrones de Sueño (si hay integración con wearables)

**Descripción**: Futuro: integrar datos de Apple Watch/Google Fit.

**Parámetros**:
- `user_uuid` (string)
- `days_back` (int, default: 7)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:HAS_SLEEP_DATA]->(s:SleepData)
WHERE s.date >= date() - duration({days: $days_back})

RETURN collect({
  date: s.date,
  total_hours: s.total_sleep_hours,
  deep_sleep_hours: s.deep_sleep_hours,
  rem_sleep_hours: s.rem_sleep_hours,
  sleep_score: s.sleep_score,
  bedtime: s.bedtime,
  waketime: s.waketime
}) AS sleep_data
ORDER BY s.date DESC
```

---

## 14. Query: Verificar si hay Alerta Crítica Pendiente

**Descripción**: Para que el chatbot sepa si debe priorizar temas de crisis.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})-[:HAS_ALERT]->(a:Alert)
WHERE a.is_read = false
  AND a.severity = 'critical'
  AND a.created_at >= datetime() - duration({hours: 24})

RETURN count(a) AS critical_alerts_pending
```

---

## 15. Query: Obtener Sugerencia de Técnica de Regulación Emocional

**Descripción**: Basada en síntomas reportados recientemente, sugerir técnica de DBT.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// Síntomas recientes
MATCH (u)-[r:REPORTS_SYMPTOM {
  last_reported: date() - duration({days: range(0,2)})
}]->(sym:Symptom)

// Mapear síntomas a técnicas (esta información podría estar en Knowledge)
// Por ahora, reglas simples:

WITH collect(DISTINCT sym.name) AS symptoms

// Lógica en aplicación:
// - si symptoms contiene "ansiedad" → recomendar "5-4-3-2-1 grounding" o "respiración diafragmática"
// - si symptoms contiene "ira" → recomendar "TIP skill" (temperature, intense exercise, paced breathing, paired muscle relaxation)
// - si symptoms contiene "craving" → recomendar "urge surfing" o "delay, distract, decide"

RETURN {
  symptoms: symptoms,
  suggested_dbt_skill: CASE
    WHEN "ansiedad" IN symptoms THEN "5-4-3-2-1 grounding"
    WHEN "ira" IN symptoms THEN "TIP skill"
    WHEN "craving" IN symptoms THEN "urge surfing"
    ELSE "mindfulness breathing"
  END,
  skill_description: "Breve descripción de la técnica..."
} AS dbt_suggestion
```

---

## Uso desde el Backend (Node.js/Python)

```javascript
// Ejemplo: obtener contexto para NADA
async function getChatbotContext(userId, conversationTurn) {
  const result = await neo4j.query(`
    MATCH (u:User {uuid: $user_uuid})
    // ... query completa 1
  `, {user_uuid: userId, max_history_messages: 10});

  return {
    profile: result.user_profile,
    medications: result.active_medications,
    symptoms: result.recent_symptoms,
    // ...
  };
}

// Luego, construir prompt para LLM:
const systemPrompt = `
Eres NADA, asistente terapéutico...

Contexto del paciente:
- Etapa de cambio: ${context.profile.stage_of_change}
- Medicamentos activos: ${context.active_medications.map(m => m.medication).join(', ')}
- Síntomas recientes: ${context.recent_symptoms.map(s => s.symptom).join(', ')}
- Sustancias recientes: ${context.recent_substances.join(', ')}

...
`;
```

---

## Consideraciones

- **Performance**: Queries deben ser <200ms. Usar índices apropiados.
- **Caching**: Resultados de contexto pueden cachearse por 1-2 minuto (pero cuidado con datos muy recientes).
- **Privacidad**: Solo devolver datos que el usuario haya consentido compartir (para chat, todo; para familia, filtrado).
- **Versionado**: Si el schema de grafo cambia, estas queries también. Mantener documentación actualizada.

---

*Documento vivo. Agregar queries conforme se necesiten nuevas capacidades en el chatbot.*