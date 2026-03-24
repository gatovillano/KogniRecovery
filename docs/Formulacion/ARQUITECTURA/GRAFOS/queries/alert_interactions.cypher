# Queries para Alertas de Interacciones - KogniRecovery

## Propósito

Detectar interacciones peligrosas entre medicamentos y/o sustancias, y generar alertas con explicaciones detalladas.

---

## 1. Query: Alerta por Nuevo Medicamento (Al Añadir)

**Descripción**: Se ejecuta cuando el usuario añade un nuevo medicamento a su lista. Busca interacciones con TODOS los medicamentos activos actuales y con sustancias que haya consumido recientemente.

**Parámetros**:
- `user_uuid` (string)
- `new_medication_uuid` (string) - UUID del medicamento recién añadido
- `recent_substance_names` (list<string>, default: []) - sustancias consumidas en últimos 7 días

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// 1. Obtener TODOS los medicamentos activos del usuario (incluyendo el nuevo)
MATCH (u)-[:TAKES {status: 'active'}]->(active_med:Medication)
WITH u, collect(DISTINCT active_med) AS all_active_meds

// 2. Encontrar interacciones drug-drug entre cualquier par en all_active_meds
MATCH (m1:Medication) WHERE m1 IN all_active_meds
MATCH (m2:Medication) WHERE m2 IN all_active_meds AND m1.uuid < m2.uuid
MATCH (m1)-[i:INTERACTS_WITH]-(m2)
WHERE i.severity IN ['critical', 'major', 'moderate']

// 3. Encontrar interacciones drug-substance con sustancias recientes
MATCH (m:Medication) WHERE m IN all_active_meds
MATCH (s:Substance) WHERE s.name IN $recent_substance_names
MATCH (m)-[is:INTERACTS_WITH_SUBSTANCE]->(s)
WHERE is.severity IN ['critical', 'major', 'moderate']

// 4. También buscar interacciones CYP450 indirectas (si el nuevo medicamento inhibe/induce enzimas)
// que afecten metabolismo de otros activos
CALL {
  WITH u, all_active_meds, $new_medication_uuid AS new_med_id
  MATCH (new_med:Medication {uuid: new_med_id})
  // Buscar si new_med es inhibidor/inductor
  MATCH (new_med)-[enzyme_mod:INHIBITS|INDUCES]->(enz:Enzyme)
  MATCH (other_med:Medication) WHERE other_med IN all_active_meds AND other_med.uuid <> new_med_id
  MATCH (other_med)-[:METABOLIZED_BY {is_primary: true}]->(enz)
  RETURN {
    medication_a: new_med.generic_name,
    medication_b: other_med.generic_name,
    severity: CASE enzyme_mod WHEN 'INHIBITS' THEN 'major' ELSE 'moderate' END,
    mechanism: enzyme_mod + 's ' + enz.code + ', affecting ' + other_med.generic_name + ' metabolism',
    management: 'Monitor for increased side effects of ' + other_med.generic_name + ' if co-administered',
    interaction_type: 'cyp_enzyme'
  } AS cyp_interaction
}

// 5. Unificar resultados
RETURN
  collect(DISTINCT {
    id: 'dd_' + m1.uuid + '_' + m2.uuid,
    type: 'drug-drug',
    medication_a: m1.generic_name,
    medication_b: m2.generic_name,
    severity: i.severity,
    mechanism: i.mechanism,
    management: i.management,
    evidence_level: i.evidence_level,
    source: i.source
  }) +
  collect(DISTINCT {
    id: 'ds_' + m.uuid + '_' + s.code,
    type: 'drug-substance',
    medication: m.generic_name,
    substance: s.name,
    severity: is.severity,
    mechanism: is.mechanism,
    advice: is.advice
  }) +
  collect(DISTINCT cyp_interaction) AS all_interactions

ORDER BY
  CASE
    WHEN severity = 'critical' THEN 0
    WHEN severity = 'major' THEN 1
    WHEN severity = 'moderate' THEN 2
    ELSE 3
  END,
  medication_a
```

---

## 2. Query: Alerta por Consumo de Sustancia (Check-in)

**Descripción**: Cuando el usuario reporta consumo de sustancia en el check-in diario, verifica interacciones con medicamentos activos.

**Parámetros**:
- `user_uuid` (string)
- `consumed_substances` (list<string>) - lista de sustancias consumidas en el check-in

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// Obtener medicamentos activos
MATCH (u)-[:TAKES {status: 'active'}]->(m:Medication)

// Buscar interacciones con cada sustancia consumida
MATCH (s:Substance) WHERE s.name IN $consumed_substances
MATCH (m)-[is:INTERACTS_WITH_SUBSTANCE]->(s)
WHERE is.severity IN ['critical', 'major', 'moderate']

// Enriquecer con propiedades del medicamento y sustancia
RETURN collect(DISTINCT {
  medication: m.generic_name,
  substance: s.name,
  severity: is.severity,
  mechanism: is.mechanism,
  advice: is.advice,
  addiction_potential: m.addiction_potential,
  substance_class: s.class
}) AS risky_combinations
ORDER BY
  CASE is.severity
    WHEN 'critical' THEN 0
    WHEN 'major' THEN 1
    ELSE 2
  END,
  m.addiction_potential DESC
```

---

## 3. Query: Resumen de Interacciones del Paciente (Para Dashboard de Medicamentos)

**Descripción**: Muestra todas las interacciones activas (entre medicamentos actuales y con sustancias frecuentes).

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:TAKES {status: 'active'}]->(m1:Medication)

// Interacciones fármaco-fármaco
OPTIONAL MATCH (m1)-[i:INTERACTS_WITH]-(m2:Medication)
WHERE (u)-[:TAKES {status: 'active'}]->(m2) AND m1.uuid < m2.uuid

// Interacciones fármaco-sustancia (si ha consumido recientemente, últimas 2 semanas)
OPTIONAL MATCH (u)-[:CONSUMES]->(s:Substance)
WHERE EXISTS {
  MATCH (u)-[:HAS_SUBSTANCE_CONSUMPTION {
    consumed_at: date() - duration({days: range(0,13)})
  }]->(s)
}
MATCH (m1)-[is:INTERACTS_WITH_SUBSTANCE]->(s)

RETURN {
  drug_drug: collect(DISTINCT {
    med_a: m1.generic_name,
    med_b: m2.generic_name,
    severity: i.severity,
    mechanism: i.mechanism,
    management: i.management
  }),
  drug_substance: collect(DISTINCT {
    med: m1.generic_name,
    substance: s.name,
    severity: is.severity,
    advice: is.advice
  })
} AS all_current_interactions
```

---

## 4. Query: Explicación Detallada de Interacción Específica

**Descripción**: Para mostrar al usuario cuándo pulsa "Ver más información" en una alerta. Incluye detalles de mecanismo y fuentes.

**Parámetros**:
- `medication_a_name` (string)
- `medication_b_name` (string) - opcional (si es null, es drug-substance)
- `substance_name` (string) - opcional
- `interaction_type` (string: 'drug-drug' o 'drug-substance')

**Query**:

```cypher
// Caso 1: drug-drug
MATCH (m1:Medication {generic_name: $medication_a_name})
MATCH (m2:Medication {generic_name: $medication_b_name})
MATCH (m1)-[i:INTERACTS_WITH]-(m2)
RETURN {
  type: 'drug-drug',
  medication_a: m1.generic_name,
  medication_b: m2.generic_name,
  severity: i.severity,
  mechanism: i.mechanism,
  management: i.management,
  evidence_level: i.evidence_level,
  source: i.source,
  source_reference: i.source_reference,
  // Enriquecer con info de enzimas si aplica
  enzymes_m1: m1.metabolism_enzymes,
  enzymes_m2: m2.metabolism_enzymes
} AS interaction_details

UNION

// Caso 2: drug-substance
MATCH (m:Medication {generic_name: $medication_a_name})
MATCH (s:Substance {name: $substance_name})
MATCH (m)-[is:INTERACTS_WITH_SUBSTANCE]->(s)
RETURN {
  type: 'drug-substance',
  medication: m.generic_name,
  substance: s.name,
  severity: is.severity,
  mechanism: is.mechanism,
  advice: is.advice,
  substance_class: s.class,
  addiction_potential: m.addiction_potential
} AS interaction_details
```

---

## 5. Query: Alertas Pendientes No Reconocidas (Unread Alerts)

**Descripción**: Para mostrar badge count y lista de alertas no leídas.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:HAS_ALERT]->(a:Alert)
WHERE a.is_read = false

RETURN collect({
  id: a.uuid,
  type: a.type,
  severity: a.severity,
  title: a.title,
  message: a.message,
  created_at: a.created_at,
  related_medications: a.related_medications,
  related_substances: a.related_substances
}) AS unread_alerts
ORDER BY a.created_at DESC
```

---

## 6. Query: Marcar Alerta como Reconocida (Acknowledge)

**Descripción**: Actualiza una alerta a leída. No es una query de selección, sino de actualización.

**Parámetros**:
- `user_uuid` (string)
- `alert_uuid` (string)

**Cypher (UPDATE)**:

```cypher
MATCH (u:User {uuid: $user_uuid})-[:HAS_ALERT]->(a:Alert {uuid: $alert_uuid})
SET a.is_read = true,
    a.acknowledged_at = datetime()
RETURN a
```

---

## 7. Query: Limpiar Alertas Antiguas (Cleanup Job)

**Descripción**: Para eliminar alertas muy antiguas (>90 días) y mantener el grafo limpio.

**Parámetros**:
- `days_old` (int, default: 90)

**Cypher (DELETE)**:

```cypher
MATCH (u:User)-[:HAS_ALERT]->(a:Alert)
WHERE a.created_at < datetime() - duration({days: $days_old})
  AND a.is_read = true  // solo eliminar leídas
DETACH DELETE a
```

---

## 8. Query: Generar Resumen de Seguridad Semanal (Weekly Safety Summary)

**Descripción**: Para enviar un reporte semanal al paciente (email) con interacciones y adherencia.

**Parámetros**:
- `user_uuid` (string)
- `week_start_date` (date) - inicio de la semana (Lunes)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// 1. Interacciones críticas esta semana
CALL {
  WITH u, week_start_date
  MATCH (u)-[:HAS_ALERT]->(a:Alert)
  WHERE a.created_at >= datetime(week_start_date)
    AND a.severity IN ['critical', 'major']
  RETURN count(*) AS critical_alerts_week
}

// 2. Adherencia promedio semanal
CALL {
  WITH u, week_start_date
  MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
  OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
    date: week_start_date + duration({days: range(0,6)})
  }]->(ade)
  WHERE ade.medication_id = m.uuid
  RETURN avg(CASE WHEN ade.taken THEN 1.0 ELSE 0.0 END) AS avg_adherence_week
}

// 3. Medicamentos añadidos esta semana
CALL {
  WITH u, week_start_date
  MATCH (u)-[pres:TAKES]->(m:Medication)
  WHERE pres.start_date >= week_start_date
  RETURN count(DISTINCT m) AS new_medications_week
}

// 4. Síntomas severos reportados
CALL {
  WITH u, week_start_date
  MATCH (u)-[r:REPORTS_SYMPTOM {
    last_reported: week_start_date + duration({days: range(0,6)})
  }]->(sym:Symptom)
  WHERE r.intensity >= 8
  RETURN count(*) AS severe_symptoms_week
}

RETURN {
  week_start: week_start_date,
  critical_alerts: critical_alerts_week,
  avg_adherence: avg_adherence_week,
  new_medications: new_medications_week,
  severe_symptoms: severe_symptoms_week,
  summary_text: "Esta semana: " + critical_alerts_week + " alertas críticas, " +
                 "adherencia promedio " + round(avg_adherence_week*100) + "%, " +
                 new_medications_week + " nuevos medicamentos, " +
                 severe_symptoms_week + " síntomas severos reportados."
} AS weekly_safety_summary
```

---

## 9. Query: Buscar Alternativas Más Seguras (Suggest Alternatives)

**Descripción**: Cuando se detecta una interacción problemática, buscar medicamentos alternativos para la misma condición que no interactúen.

**Parámetros**:
- `condition_code` (string) - código de condición (ej: "F41.1" para ansiedad)
- `current_medication_uuids` (list<uuid>) - medicamentos que el paciente ya toma y con los que no debe interactuar
- `avoid_classes` (list<string>, optional) - clases farmacológicas a evitar (ej: benzodiacepinas)

**Query**:

```cypher
// 1. Obtener todos los medicamentos que tratan la condición
MATCH (c:Condition {code: $condition_code})<-[:TREATS]-(alt:Medication)

// 2. Filtrar: que NO estén en la lista de actuales del paciente
WHERE alt.uuid NOT IN $current_medication_uuids

// 3. Filtrar: que NO tengan interacción con ninguno de los actuales
OPTIONAL MATCH (alt)-[i:INTERACTS_WITH]-(other:Medication)
WHERE other.uuid IN $current_medication_uuids
  AND i.severity IN ['critical', 'major']

WITH alt, collect(DISTINCT i) AS bad_interactions

// 4. Filtrar por clase si se especifica
WHERE size(bad_interactions) = 0
  AND (size($avoid_classes) = 0 OR NOT alt.class IN $avoid_classes)

// 5. Ordenar por potencial de adicción bajo (priorizar no adictivos)
RETURN collect({
  uuid: alt.uuid,
  generic_name: alt.generic_name,
  class: alt.class,
  addiction_potential: alt.addiction_potential,
  typical_dose: alt.typical_adult_dose,
  half_life: alt.half_life_hours
}) AS safer_alternatives
ORDER BY alt.addiction_potential ASC, alt.generic_name
LIMIT 5
```

---

## 10. Query: Obtener Medicamentos con Alta Potencial de Abuso (High Abuse Potential)

**Descripción**: Para alertar que cierto medicamento puede ser riesgoso en pacientes con historia de abuso de sustancias.

**Parámetros**:
- `user_uuid` (string)
- `threshold` (float, default: 0.5) - mínimo addiction_potential para alertar

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:TAKES {status: 'active'}]->(m:Medication)
WHERE m.addiction_potential >= $threshold

// Enriquecer con info de consumo de sustancias del paciente
OPTIONAL MATCH (u)-[:CONSUMES]->(s:Substance)
WHERE EXISTS {
  MATCH (u)-[:HAS_SUBSTANCE_CONSUMPTION {
    consumed_at: date() - duration({days: range(0,13)})
  }]->(s)
}

RETURN collect({
  medication: m.generic_name,
  class: m.class,
  addiction_potential: m.addiction_potential,
  controlled_schedule: m.controlled_substance_schedule,
  concurrent_substance_use: collect(DISTINCT s.name)
}) AS high_abuse_potential_meds
```

**Uso**: Si `high_abuse_potential_meds` no está vacío, generar alerta:
```
"Estás tomando medicamentos con potencial de abuso (X, Y). Ten especial precaución si consumes alcohol u otras drogas. Si tienes historial de abuso, discute con tu médico si existen alternativas más seguras."
```

---

## 11. Query: Interacciones CYP450 Relevantes para un Paciente

**Descripción**: Detalla interacciones enzimáticas entre medicamentos del paciente.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:TAKES {status: 'active'}]->(m1:Medication)
MATCH (m1)-[rel:INHIBITS|INDUCES]->(enz:Enzyme)

// Buscar otros medicamentos metabolizados por esa enzima
MATCH (m2:Medication)<-[:METABOLIZED_BY {is_primary: true}]-(enz)
WHERE (u)-[:TAKES {status: 'active'}]->(m2) AND m1 <> m2

RETURN collect(DISTINCT {
  enzyme: enz.code,
  modifier_medication: m1.generic_name,
  modification_type: type(rel),  // 'INHIBITS' o 'INDUCES'
  potency: rel.potency,
  affected_medication: m2.generic_name,
  clinical_impact: CASE
    WHEN type(rel) = 'INHIBITS' THEN 'Increased levels of ' + m2.generic_name
    WHEN type(rel) = 'INDUCES' THEN 'Decreased levels of ' + m2.generic_name
    END
}) AS cyp_interactions
ORDER BY enz.code
```

---

## 12. Query: Historial de Alertas (Para Revisión por Profesional)

**Descripción**: Muestra todas las alertas generadas para un paciente en un período, para que el médico vea el historial.

**Parámetros**:
- `user_uuid` (string)
- `date_range_start` (date, optional)
- `date_range_end` (date, optional)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})-[:HAS_ALERT]->(a:Alert)
WHERE ($date_range_start IS NULL OR a.created_at >= datetime($date_range_start))
  AND ($date_range_end IS NULL OR a.created_at <= datetime($date_range_end))

RETURN {
  id: a.uuid,
  type: a.type,
  severity: a.severity,
  title: a.title,
  message: a.message,
  created_at: a.created_at,
  is_read: a.is_read,
  acknowledged_at: a.acknowledged_at,
  related_medications: a.related_medications,
  related_substances: a.related_substances,
  suggested_actions: a.suggested_actions
} AS alert_history
ORDER BY a.created_at DESC
```

---

## Notas de Implementación

1. **Índices necesarios**:
   - `CREATE INDEX alert_user_severity_idx FOR (a:Alert) ON (a.user_uuid, a.severity, a.is_read)`
   - `CREATE INDEX interaction_severity_idx FOR ()-[i:INTERACTS_WITH]-() ON (i.severity)`

2. **Cacheo**: Resultados de queries de alertas pueden cachearse por usuario por 1 minuto (Redis).

3. **Event-driven**: La query de nuevo medicamento debe ejecutarse síncronamente tras añadir medicamento, para mostrar alerta inmediata.

4. **Batch**: Queries como weekly summary pueden correr en batch los domingos y almacenar resultado en nodo `:WeeklyReport`.

5. **Privacidad**: Cuando se comparten datos con familiares, filtrar interacciones muy sensibles (ej: medicamento para VIH) a menos que paciente lo haya autorizado.

---

*Documento vivo. Se agregarán más queries conforme evolucione el sistema de alertas.*