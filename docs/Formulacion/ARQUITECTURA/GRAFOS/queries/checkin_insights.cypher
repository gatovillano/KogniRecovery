# Queries para Check-in Diario - KogniRecovery

## Propósito

Generar **insights automáticos** después de que el usuario complete su check-in diario. Estos insights se muestran en el dashboard o como notificaciones.

---

## 1. Query: Resumen del Día (Daily Summary)

**Descripción**: Obtiene un resumen consolidado del check-in de hoy (o fecha especificada) para generar un insight.

**Parámetros**:
- `user_uuid` (string)
- `checkin_date` (date, default: hoy)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
OPTIONAL MATCH (u)-[r:REPORTS_SYMPTOM {date: $checkin_date}]->(sym:Symptom)
OPTIONAL MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
WHERE EXISTS {
  MATCH (u)-[:HAS_ADHERENCE_EVENT {date: $checkin_date}]->(d:MedicationDose)
  WHERE d.taken = false OR d.skipped = true
}
OPTIONAL MATCH (u)-[:HAS_SUBSTANCE_CONSUMPTION {date: $checkin_date}]->(s:Substance)

RETURN
  u.uuid AS user_uuid,
  $checkin_date AS date,
  collect(DISTINCT {
    symptom: sym.name,
    intensity: r.intensity,
    category: sym.category
  }) AS symptoms,
  collect(DISTINCT {
    medication: m.generic_name,
    dose: pres.dose,
    adherence: CASE
      WHEN EXISTS { MATCH (u)-[:HAS_ADHERENCE_EVENT {date: $checkin_date, medication_id: m.uuid, taken: false}]->() THEN 'missed'
      WHEN EXISTS { MATCH (u)-[:HAS_ADHERENCE_EVENT {date: $checkin_date, medication_id: m.uuid, taken: true}]->() THEN 'taken'
      ELSE 'no_record'
    END
  }) AS medications_adherence,
  collect(DISTINCT s.name) AS substances_consumed
```

**Resultado esperado**:

```json
{
  "user_uuid": "user-123",
  "date": "2025-02-12",
  "symptoms": [
    {"symptom": "ansiedad", "intensity": 7, "category": "psychological"},
    {"symptom": "insomnio", "intensity": 5, "category": "physical"}
  ],
  "medications_adherence": [
    {"medication": "sertralina", "dose": "100mg", "adherence": "missed"},
    {"medication": "naltrexona", "dose": "50mg", "adherence": "taken"}
  ],
  "substances_consumed": ["alcohol"]
}
```

---

## 2. Query: Detectar Patrón de Adherencia vs Síntomas

**Descripción**: Busca correlación entre omisión de medicación y reporte de síntomas en los últimos 7-30 días.

**Parámetros**:
- `user_uuid` (string)
- `days_back` (integer, default: 14)
- `medication_uuid` (string, optional) - si se quiere analizar un medicamento específico

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
WHERE $medication_uuid IS NULL OR m.uuid = $medication_uuid

// Obtener días en el rango
WITH u, m, pres, range(0, $days_back - 1) AS day_offsets
UNWIND day_offsets AS offset
WITH u, m, pres, date() - duration({days: offset}) AS checkin_date

// Left join: adherencia de ese día (¿tomó el medicamento?)
OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: checkin_date,
  medication_id: m.uuid
}]->(ade:MedicationDose)
WHERE ade.taken = true OR ade.dose_skipped = true

// Left join: síntomas reportados ese día
OPTIONAL MATCH (u)-[r:REPORTS_SYMPTOM {date: checkin_date}]->(sym:Symptom)

// Agregar por día
WITH checkin_date,
     m.generic_name AS medication,
     CASE WHEN ade IS NOT NULL AND ade.taken = true THEN 1 ELSE 0 END AS taken,
     CASE WHEN ade IS NOT NULL AND ade.dose_skipped = true THEN 1 ELSE 0 END AS skipped,
     collect({
       symptom: sym.name,
       intensity: r.intensity
     }) AS symptoms_today

// Filtrar días con datos (al menos adheredencia recorded)
WHERE taken = 1 OR skipped = 1 OR size(symptoms_today) > 0

// Agregación
WITH medication,
     sum(taken) AS days_taken,
     sum(skipped) AS days_skipped,
     collect({
       date: checkin_date,
       taken: taken,
       skipped: skipped,
       symptoms: symptoms_today
     }) AS daily_data,
     count(*) AS total_days_with_data

// Calcular correlación simple (días con síntomas de ansiedad vs días omitidos)
WITH medication, days_taken, days_skipped, total_days_with_data, daily_data,
     [d IN daily_data WHERE ANY(s IN d.symptoms WHERE s.symptom IN ['ansiedad', 'depressed_mood', 'craving'])] AS days_with_target_symptom
     // days_with_target_symptom: días donde reportó ansiedad/depresión/craving

// Retornar
RETURN {
  medication: medication,
  analysis_period_days: total_days_with_data,
  adherence_rate: days_taken * 1.0 / (days_taken + days_skipped),
  days_taken: days_taken,
  days_skipped: days_skipped,
  days_with_target_symptom: size(days_with_target_symptom),
  correlation_estimate: CASE
    WHEN days_skipped > 0 AND size(days_with_target_symptom) > 0
    THEN size(days_with_target_symptom) * 1.0 / (days_taken + days_skipped)
    ELSE 0
  END,
  daily_breakdown: [d IN daily_data[0..10]]  // primeros 10 días para no saturar
} AS pattern_analysis
ORDER BY medication
```

**Nota**:Esta query es más pesada. Se ejecuta en batch (后台) y cachea resultado.

**Uso**:
```javascript
const result = await neo4j.query(query, {user_uuid, days_back: 14});
// result.pattern_analysis[0].correlation_estimate = 0.6 → 60% de días con ansiedad coinciden con omisión
```

---

## 3. Query: Tendencias de Síntomas (Symptom Trends)

**Descripción**: Identifica síntomas que están empeorando o mejorando en los últimos 7 días vs los 7 anteriores.

**Parámetros**:
- `user_uuid` (string)
- `symptom_category` (optional string) - filtrar por categoría

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[r:REPORTS_SYMPTOM]->(sym:Symptom)

// Filtrar por fecha: últimos 14 días
WHERE r.last_reported >= date() - duration({days: 14})

// Etiquetar período: últimos 7 días (period=1) vs anteriores (period=0)
WITH sym,
     r.intensity,
     r.last_reported,
     CASE
       WHEN r.last_reported >= date() - duration({days: 7}) THEN 'recent'
       ELSE 'previous'
     END AS period

// Agrupar por síntoma y período
WITH sym.name AS symptom_name,
     period,
     avg(r.intensity) AS avg_intensity,
     count(*) AS reports_count

// Pivot: una fila por síntoma con ambas medias
RETURN symptom_name,
       avg_intensity_recent: avg(CASE WHEN period = 'recent' THEN avg_intensity END),
       avg_intensity_previous: avg(CASE WHEN period = 'previous' THEN avg_intensity END),
       reports_recent: sum(CASE WHEN period = 'recent' THEN reports_count ELSE 0 END),
       reports_previous: sum(CASE WHEN period = 'previous' THEN reports_count ELSE 0 END)
ORDER BY abs(avg_intensity_recent - avg_intensity_previous) DESC
```

**Interpretación**:
- Si `avg_intensity_recent > avg_intensity_previous + 1.0` → empeorando significativamente
- Si `avg_intensity_recent < avg_intensity_previous - 1.0` → mejorando significativamente

---

## 4. Query: Alertas por Omisión de Medicación Crítica

**Descripción**: Detecta si el usuario ha omitido un medicamento considerado "crítico" (alta dependencia, riesgo de withdrawal) en los últimos 3 días.

**Parámetros**:
- `user_uuid` (string)
- `critical_medications` (list of strings) - nombres genéricos de medicamentos críticos (ej: ["alprazolam", "clonazepam"])

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
WHERE m.generic_name IN $critical_medications

// Buscar dosis omitidas en últimos 3 días
WITH u, m, pres,
     range(0, 2) AS last_3_days
UNWIND last_3_days AS day_offset
WITH u, m, pres, date() - duration({days: day_offset}) AS check_date

OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: check_date,
  medication_id: m.uuid
}]->(ade)
WHERE ade.dose_skipped = true OR (ade.taken IS NULL AND check_date < date())

// Contar omisiones por medicamento
WITH m.generic_name AS med_name,
     collect(check_date) AS dates_checked,
     count(ade) AS missed_count

WHERE missed_count > 0

RETURN {
  medication: med_name,
  missed_days: missed_count,
  dates: dates_checked,
  risk_level: CASE
    WHEN missed_count >= 3 THEN 'critical'
    WHEN missed_count = 2 THEN 'high'
    ELSE 'medium'
  END,
  recommendation: "Considera contactar a tu médico. La interrupción abrupta de " + med_name + " puede causar síntomas de abstinencia."
} AS critical_missed_medication
ORDER BY missed_count DESC
```

---

## 5. Query: Insight de "Primera Vez" (First-Time Insight)

**Descripción**: Si es la primera vez que el usuario reporta un síntoma o consume una sustancia en al menos 30 días, generar un insight especial.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
// Síntomas reportados hoy
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[r:REPORTS_SYMPTOM {date: date()}]->(sym:Symptom)

// Verificar si ese síntoma fue reportado en los 30 días anteriores
OPTIONAL MATCH (u)-[r_prev:REPORTS_SYMPTOM {
  date: date() - duration({days: range(1,30)})
}]->(sym)
WHERE r_prev IS NULL  // NULL significa NO hubo reporte en últimos 30 días

RETURN collect(DISTINCT {
  symptom: sym.name,
  is_first_in_30d: r_prev IS NULL
}) AS new_symptoms_today
```

**Lógica de aplicación**:
- Si `new_symptoms_today` contiene algún síntoma con `is_first_in_30d=true` → Insight:
  ```
  Es la primera vez que reportas [síntoma]. ¿Qué crees que lo desencadenó?
  Si persiste, considera consultar a tu médico.
  ```

---

## 6. Query: Cumpleaños de Recuperación (Recovery Anniversary)

**Descripción**: Detecta aniversarios de hitos de recuperación (ej: 30 días sin consumir, 1 año).

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:EXPERIENCED {type: 'achievement'}]->(e:Event)
WHERE e.metadata contains 'days_sober' OR e.metadata contains 'abstinence_days'

WITH e,
     e.metadata.days_sober AS milestone_days,
     e.occurred_at AS milestone_date

// Calcular días transcurridos desde el hito
WITH milestone_days,
     milestone_date,
     duration.inDays(date() - milestone_date).days AS days_since

// Redondear a múltiplos de 30 (30, 60, 90, 180, 365, etc.)
WITH milestone_days,
     milestone_date,
     days_since,
     days_since % 30 AS remainder,
     days_since - remainder AS rounded_days

WHERE rounded_days IN [30, 60, 90, 180, 365, 730]  // hitos a celebrar
  AND remainder < 2  // tolerancia de 2 días

RETURN {
  milestone_days_sober: milestone_days,
  achieved_on: milestone_date,
  days_since: days_since,
  is_milestone: true,
  celebration_message: "¡Felicitaciones! Han pasado " + rounded_days + " días desde que lograste " + milestone_days + " días de abstinencia."
} AS recovery_anniversary
ORDER BY rounded_days DESC
```

---

## 7. Query: Predicción Simple de Riesgo (Basado en Tendencia)

**Descripción**: Predicts increased risk of substance use or crisis in the next 7 days based on recent patterns.

**Parámetros**:
- `user_uuid` (string)
- `prediction_horizon_days` (int, default: 7)

**Query**:

```cypher
// 1. Calcular métricas de riesgo de los últimos 7 días
MATCH (u:User {uuid: $user_uuid})

// a) Adherencia promedio (mediciones de los últimos 7 días)
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: date() - duration({days: range(0,6)})
}]->(ade)
WHERE ade.medication_id = m.uuid
WITH u,
     avg(CASE WHEN ade.taken = true THEN 1.0 ELSE 0.0 END) AS avg_adherence_last_7d

// b) Intensidad promedio de síntomas (últimos 7 días)
OPTIONAL MATCH (u)-[r:REPORTS_SYMPTOM {
  last_reported: date() - duration({days: range(0,6)})
}]->(sym:Symptom)
WITH u, avg_adherence_last_7d, avg(r.intensity) AS avg_symptom_intensity_last_7d

// c) Consumo de sustancias (ocurrido en últimos 7 días)
OPTIONAL MATCH (u)-[:CONSUMES]->(s:Substance)
WHERE EXISTS {
  MATCH (u)-[:HAS_SUBSTANCE_CONSUMPTION {
    consumed_at: date() - duration({days: range(0,6)})
  }]->(s)
}
WITH u, avg_adherence_last_7d, avg_symptom_intensity_last_7d, count(DISTINCT s) AS substances_used_last_7d

// 2. Obtener métricas de referencia (baseline de 30 días anteriores)
MATCH (u)-[pres_base:TAKES {status: 'active'}]->(m_base:Medication)
OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: date() - duration({days: range(7,36)})
}]->(ade_base)
WHERE ade_base.medication_id = m_base.uuid
WITH u, avg_adherence_last_7d, avg_symptom_intensity_last_7d, substances_used_last_7d,
     avg(CASE WHEN ade_base.taken = true THEN 1.0 ELSE 0.0 END) AS avg_adherence_baseline_30d

OPTIONAL MATCH (u)-[r_base:REPORTS_SYMPTOM {
  last_reported: date() - duration({days: range(7,36)})
}]->(sym_base:Symptom)
WITH u, avg_adherence_last_7d, avg_symptom_intensity_last_7d, substances_used_last_7d,
     avg_adherence_baseline_30d,
     avg(r_base.intensity) AS avg_symptom_intensity_baseline

// 3. Calcular score de riesgo simple (0-100)
WITH u,
     // Factor 1: Deterioro de adherencia
     (1 - avg_adherence_last_7d) * 40 AS adherence_risk,
     // Factor 2: Alta intensidad de síntomas (umbral >6)
     CASE WHEN avg_symptom_intensity_last_7d > 6 THEN 30 ELSE 0 END AS symptom_risk,
     // Factor 3: Consumo de sustancias reciente
     CASE WHEN substances_used_last_7d > 0 THEN 30 ELSE 0 END AS substance_risk,
     // Factor 4: Tendencia de adherencia (comparar con baseline)
     CASE
       WHEN avg_adherence_baseline_30d - avg_adherence_last_7d > 0.3 THEN 20
       WHEN avg_adherence_last_7d - avg_adherence_baseline_30d > 0.3 THEN -10
       ELSE 0
     END AS trend_risk

RETURN {
  user_uuid: u.uuid,
  risk_score: adherence_risk + symptom_risk + substance_risk + trend_risk,
  factors: {
    adherence_risk: adherence_risk,
    symptom_risk: symptom_risk,
    substance_risk: substance_risk,
    trend_risk: trend_risk,
    metrics: {
      avg_adherence_last_7d: avg_adherence_last_7d,
      avg_symptom_intensity_last_7d: avg_symptom_intensity_last_7d,
      substances_used_last_7d: substances_used_last_7d,
      avg_adherence_baseline_30d: avg_adherence_baseline_30d
    }
  },
  risk_level: CASE
    WHEN adherence_risk + symptom_risk + substance_risk + trend_risk >= 70 THEN 'high'
    WHEN adherence_risk + symptom_risk + substance_risk + trend_risk >= 40 THEN 'medium'
    ELSE 'low'
  END,
  recommended_action: CASE
    WHEN adherence_risk + symptom_risk + substance_risk + trend_risk >= 70
    THEN 'Consider contacting your therapist or support person immediately'
    WHEN adherence_risk + symptom_risk + substance_risk + trend_risk >= 40
    THEN 'Increase self-care: schedule a check-in with your coach/therapist'
    ELSE 'Continue with daily practices'
  END
} AS risk_prediction
```

---

## 8. Query: Obtener Medicamentos con Interacciones con Sustancias Consumidas

**Descripción**: Para el check-in, si el usuario reporta consumo de sustancia(s), busca medicamentos activos que tengan interacciones peligrosas.

**Parámetros**:
- `user_uuid` (string)
- `substance_names` (list<string>) - sustancias consumidas hoy

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:TAKES {status: 'active'}]->(m:Medication)
MATCH (s:Substance) WHERE s.name IN $substance_names

// Buscar interacciones medicamento-sustancia
MATCH (m)-[i:INTERACTS_WITH_SUBSTANCE]-(s)
WHERE i.severity IN ['critical', 'major', 'moderate']

// Enriquecer con info de enzimas si es relevante (para explicar mechanism)
OPTIONAL MATCH (m)-[:METABOLIZED_BY]->(enz:Enzyme)
OPTIONAL MATCH (s)-[:METABOLIZED_BY]->(enz_s:Enzyme)

RETURN {
  medication: m.generic_name,
  substance: s.name,
  severity: i.severity,
  mechanism: i.mechanism,
  advice: i.advice,
  metabolism_info: [
    e IN collect(DISTINCT enz.code) WHERE e IS NOT NULL
  ] AS medication_enzymes
} AS risky_combinations
ORDER BY i.severity DESC
```

---

## 9. Query: Recomendación de Educación Basada en Check-in

**Descripción**: Después de un check-in, recomienda artículos educativos relevantes basados en síntomas reportados y estado de ánimo.

**Parámetros**:
- `user_uuid` (string)
- `reported_symptoms` (list<string>) - códigos de síntomas reportados hoy
- `mood_score` (int 1-10) - estado emocional

**Query**:

```cypher
// 1. Obtener perfil del usuario (etapa de cambio, condiciones)
MATCH (u:User {uuid: $user_uuid})
OPTIONAL MATCH (u)-[:HAS_CONDITION]->(c:Condition)

// 2. Buscar Knowledge chunks relevantes
CALL {
  WITH u, $reported_symptoms AS symptoms
  // Buscar conocimiento que coincida con síntomas o condiciones
  MATCH (k:Knowledge)
  WHERE k.metadata.topic IN symptoms + [c.code]  // mezclar síntomas y condiciones
    AND k.metadata.audience IN ['patient', 'all']
    AND k.metadata.language = 'es'
  RETURN k { .chunk_id, .content, .metadata } AS knowledge_chunk
  LIMIT 10
}

// 3. También incluir conocimiento general por estado de ánimo
CALL {
  WITH u, $mood_score AS mood
  MATCH (k:Knowledge)
  WHERE k.metadata.topic = 'mood_management'
    AND k.metadata.difficulty <= CASE
      WHEN mood <= 3 THEN 'beginner'
      WHEN mood <= 6 THEN 'intermediate'
      ELSE 'advanced'
    END
  RETURN k { .chunk_id, .content, .metadata } AS mood_knowledge
  LIMIT 3
}

RETURN {
  user_stage: u.stage_of_change,
  conditions: collect(DISTINCT c.name),
  recommended_articles: collect(DISTINCT knowledge_chunk) + collect(DISTINCT mood_knowledge)
} AS education_recommendations
```

---

## 10. Query: Estadísticas de Adherencia del Mes

**Descripción**: Para mostrar en el dashboard de medicamentos, obtiene adherencia diaria de los últimos 30 días.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)

// Obtener dosis de los últimos 30 días
WITH u, m, pres,
     range(0, 29) AS days
UNWIND days AS offset
WITH u, m, pres, date() - duration({days: offset}) AS target_date

// Verificar si tomó ese día (al menos una dosis programada confirmada)
OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: target_date,
  medication_id: m.uuid,
  taken: true
}]->(dose)

// Agrupar por fecha
WITH target_date AS date,
     m.generic_name AS medication,
     CASE WHEN dose IS NOT NULL THEN 1 ELSE 0 END AS dose_taken

// Pivot: una fila por fecha, todas las medicaciones
WITH date,
     collect({
       medication: medication,
       taken: dose_taken
     }) AS meds_status

// Calcular adherencia diaria general (todas las medicaciones)
WITH date,
     meds_status,
     size([m IN meds_status WHERE m.taken = 1]) * 1.0 / size(meds_status) AS daily_adherence

RETURN date, daily_adherence, meds_status
ORDER BY date ASC
```

**Resultado**:
Usar para crear gráfico de adherencia de los últimos 30 días.

---

## 11. Query: Obtener Estado de Salud Actual del Paciente (Snapshot)

**Descripción**: Retorna un snapshot consolidado del estado actual del paciente para mostrar en dashboard o para evaluar riesgo rápidamente.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// Medicamentos activos
OPTIONAL MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
WITH u, collect({
  medication: m.generic_name,
  dose: pres.dose,
  frequency: pres.frequency,
  indication: pres.indication,
  last_taken: pres.last_taken,
  adherence_streak: pres.adherence_streak
}) AS active_medications

// Síntomas más recientes (últimos 3 días)
OPTIONAL MATCH (u)-[r:REPORTS_SYMPTOM {
  last_reported: date() - duration({days: range(0,2)})
}]->(sym:Symptom)
WITH u, active_medications,
     collect(DISTINCT {
       symptom: sym.name,
       intensity: r.intensity,
       last_reported: r.last_reported
     }) AS recent_symptoms

// Consumo de sustancia reciente (últimos 7 días)
OPTIONAL MATCH (u)-[:CONSUMES]->(s:Substance)
WHERE EXISTS {
  MATCH (u)-[:HAS_SUBSTANCE_CONSUMPTION {
    consumed_at: date() - duration({days: range(0,6)})
  }]->(s)
}
WITH u, active_medications, recent_symptoms,
     collect(DISTINCT s.name) AS recent_substances

// Condiciones diagnosticadas
OPTIONAL MATCH (u)-[:HAS_CONDITION]->(c:Condition)
WITH u, active_medications, recent_symptoms, recent_substances,
     collect(DISTINCT {
       condition: c.name,
       severity: c.severity,
       diagnosed_at: c.diagnosed_at
     }) AS diagnosed_conditions

// Último evento de crisis (si existe)
OPTIONAL MATCH (u)-[:EXPERIENCED {
  type: 'crisis'
}]->(e:Event)
WITH u, active_medications, recent_symptoms, recent_substances, diagnosed_conditions,
     e ORDER BY e.occurred_at DESC LIMIT 1
RETURN {
  user_uuid: u.uuid,
  stage_of_change: u.stage_of_change,
  risk_level: u.risk_level,
  active_medications: active_medications,
  recent_symptoms: recent_symptoms,
  recent_substances: recent_substances,
  diagnosed_conditions: diagnosed_conditions,
  last_crisis: e IS NOT NULL ? {
    occurred_at: e.occurred_at,
    severity: e.severity,
    description: e.description
  } : null,
  snapshot_timestamp: datetime()
} AS patient_snapshot
```

---

## 12. Query: Insultos de Interacciones Activas (Para Alertas Inmediatas)

**Descripción**: Se ejecuta cada vez que se añade un medicamento o se registra consumo de sustancia. Busca interacciones críticas/mayores.

**Parámetros**:
- `user_uuid` (string)
- `new_medication_uuid` (optional string) - si se acaba de añadir
- `consumed_substance_names` (optional list<string>) - si se registró consumo

**Query** (combinada):

```cypher
MATCH (u:User {uuid: $user_uuid})

// 1. Interacciones entre medicamentos activos (si hay nuevo_med, inclúyelo en la búsqueda)
MATCH (u)-[:TAKES {status: 'active'}]->(m:Medication)
WHERE $new_medication_uuid IS NULL OR m.uuid = $new_medication_uuid OR
      EXISTS { MATCH (u)-[:TAKES {status: 'active'}]->(:Medication {uuid: $new_medication_uuid}) }

MATCH (m)-[i:INTERACTS_WITH]-(other:Medication)
WHERE (u)-[:TAKES {status: 'active'}]->(other)  // other también está activa
  AND i.severity IN ['critical', 'major']

// 2. Interacciones medicamento-sustancia (si se consumió sustancia)
OPTIONAL MATCH (u)-[:CONSUMES]->(s:Substance)
WHERE $consumed_substance_names IS NULL OR s.name IN $consumed_substance_names
WITH u, m, other, s, i
MATCH (m)-[is:INTERACTS_WITH_SUBSTANCE]->(s)
WHERE is.severity IN ['critical', 'major']

// 3. Combinar resultados
RETURN collect(DISTINCT {
  type: 'drug-drug',
  medication_a: m.generic_name,
  medication_b: other.generic_name,
  severity: i.severity,
  mechanism: i.mechanism,
  management: i.management
}) AS drug_drug_interactions,

collect(DISTINCT {
  type: 'drug-substance',
  medication: m.generic_name,
  substance: s.name,
  severity: is.severity,
  mechanism: is.mechanism,
  advice: is.advice
}) AS drug_substance_interactions

// 4. También verificar si el nuevo medicamento es un inhibidor/inductor fuerte de CYP
// que podría afectar otros medicamentos del paciente
WITH u, drug_drug_interactions, drug_substance_interactions
MATCH (u)-[:TAKES {status: 'active'}]->(other_med:Medication)
WHERE $new_medication_uuid IS NOT NULL
MATCH (new_med:Medication {uuid: $new_medication_uuid})
// Buscar si new_med inhibe/induce una enzima que metaboliza other_med
MATCH (new_med)-[:INHIBITS|INDUCES]->(enz:Enzyme)
MATCH (other_med)-[:METABOLIZED_BY {is_primary: true}]->(enz)
WITH drug_drug_interactions, drug_substance_interactions,
     collect(DISTINCT {
       type: 'cyp_interaction',
       medication: other_med.generic_name,
       enzyme: enz.code,
       interaction_type: type((new_med)-[:INHIBITS|INDUCES]->(enz)),
       severity: 'major',  // CYP interactions often major
       mechanism: 'New medication ' + new_med.generic_name + ' ' + type((new_med)-[:INHIBITS|INDUCES]->(enz)) + 's ' + enz.code + ', affecting metabolism of ' + other_med.generic_name
     }) AS cyp_interactions

RETURN {
  all_critical_alerts: drug_drug_interactions + drug_substance_interactions + cyp_interactions
} AS immediate_alerts
```

---

## 13. Query: Historial completo de Medicamentos (Para Exportar)

**Descripción**: Para generación de reporte PDF/CSV para médicos.

**Parámetros**:
- `user_uuid` (string)
- `date_range_start` (date, optional)
- `date_range_end` (date, optional)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES]->(m:Medication)
WHERE ($date_range_start IS NULL OR pres.start_date >= $date_range_start)
  AND ($date_range_end IS NULL OR (pres.end_date IS NULL OR pres.end_date <= $date_range_end))

// Dosis tomadas en el período
OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: range_date
}]->(dose:MedicationDose)
WHERE range_date >= $date_range_start AND range_date <= $date_range_end
  AND dose.medication_id = m.uuid

WITH u, m, pres,
     collect({
       date: dose.date,
       taken: dose.taken,
       notes: dose.notes
     }) AS dose_history

// Calcular estadísticas de adherencia en el período
WITH m.generic_name AS medication,
     pres.dose AS prescribed_dose,
     pres.frequency AS frequency,
     pres.start_date AS start_date,
     pres.end_date AS end_date,
     dose_history,
     size([d IN dose_history WHERE d.taken = true]) AS doses_taken,
     size(dose_history) AS total_doses_scheduled

RETURN {
  medication: medication,
  prescribed_dose: prescribed_dose,
  frequency: frequency,
  start_date: start_date,
  end_date: end_date,
  total_doses_scheduled: total_doses_scheduled,
  doses_taken: doses_taken,
  adherence_percentage: CASE
    WHEN total_doses_scheduled > 0 THEN doses_taken * 100.0 / total_doses_scheduled
    ELSE NULL
  END,
  recent_doses: dose_history[0..20]  // últimas 20 tomas
} AS medication_history
ORDER BY start_date DESC
```

---

## 14. Query: Búsqueda en Catálogo de Medicamentos

**Descripción**: Para el autocompletado/busqueda en la UI al añadir medicamento.

**Parámetros**:
- `query` (string) - texto de búsqueda (nombre genérico o comercial)
- `limit` (int, default: 10)
- `country` (optional string) - filtrar por aprobación en país

**Query**:

```cypher
// Búsqueda por similitud de texto (exacto o partial)
MATCH (m:Medication)
WHERE toLower(m.generic_name) CONTAINS toLower($query)
   OR ANY(brand IN m.brand_names WHERE toLower(brand) CONTAINS toLower($query))
   OR m.atc_code CONTAINS $query

// Filtrar por país si se especifica
WITH m
WHERE $country IS NULL OR m.country_approval[$country] = true

// puntuación simple (priorizar exact match en generic_name)
WITH m,
     CASE
       WHEN toLower(m.generic_name) = toLower($query) THEN 3
       WHEN toLower(m.generic_name) STARTS WITH toLower($query) THEN 2
       WHEN ANY(brand IN m.brand_names WHERE toLower(brand) = toLower($query)) THEN 2
       ELSE 1
     END AS score

RETURN {
  uuid: m.uuid,
  generic_name: m.generic_name,
  brand_names: m.brand_names[0..3],  // primeros 3
  atc_code: m.atc_code,
  typical_adult_dose: m.typical_adult_dose,
  addiction_potential: m.addiction_potential,
  score: score
} AS search_results
ORDER BY score DESC, m.generic_name
LIMIT $limit
```

---

## 15. Query: Obtener Enzyme Info para Explicación

**Descripción**: Dado un medicamento, obtener detalles de enzimas metabólicas para explicar interacciones.

**Parámetros**:
- `medication_generic_name` (string)

**Query**:

```cypher
MATCH (m:Medication {generic_name: $medication_generic_name})
OPTIONAL MATCH (m)-[r:METABOLIZED_BY]->(enz:Enzyme)
OPTIONAL MATCH (m)-[:INHIBITS]->(inh:Enzyme)
OPTIONAL MATCH (m)-[:INDUCES]->(ind:Enzyme)

RETURN {
  medication: m.generic_name,
  metabolism: collect(DISTINCT {
    enzyme: enz.code,
    contribution: r.contribution,
    is_primary: r.is_primary
  }),
  inhibits: collect(DISTINCT inh.code),
  induces: collect(DISTINCT ind.code),
  interactions_warning: CASE
    WHEN size(collect(DISTINCT inh.code)) > 0
    THEN 'Este medicamento inhibe enzimas, lo que puede aumentar niveles de otros fármacos metabolizados por ellas.'
    WHEN size(collect(DISTINCT ind.code)) > 0
    THEN 'Este medicamento induce enzimas, lo que puede disminuir niveles de otros fármacos metabolizados por ellas.'
    ELSE 'No es un inhibidor/inductor enzimático significativo.'
  END
} AS enzyme_profile
```

---

## Uso desde el Código

Estas queries se ejecutan desde servicios de backend. Ejemplo:

```javascript
class CheckinInsightsService {
  async generateDailyInsight(userId, checkinDate = new Date()) {
    const result = await neo4j.query(`
      MATCH (u:User {uuid: $user_uuid})
      // ... query 1
    `, {user_uuid: userId});

    if (result.some_condition) {
      return {
        type: 'adherence_pattern',
        message: 'Has omitido la dosis nocturna los últimos 3 días...',
        severity: 'medium'
      };
    }
    return null;
  }
}
```

---

*Documento vivo. Se agregarán más queries conforme se definan necesidades de nuevas secciones.*