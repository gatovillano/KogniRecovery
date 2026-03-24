# Queries para Sección de Gestión de Medicamentos - KogniRecovery

## Propósito

Queries específicas para la sección de medicamentos, que consumen la arquitectura de Knowledge Graph + RAG.

---

## 1. Query: Lista de Medicamentos del Paciente (Página Principal)

**Descripción**: Retorna todos los medicamentos activos y su estado de adherencia para mostrar en la lista principal.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)

// Próxima toma programada de hoy
OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: date(),
  medication_id: m.uuid,
  taken: true
}]->(taken_today)

OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: date(),
  medication_id: m.uuid,
  taken: false
}]->(missed_today)

// Adherencia últimos 7 días
CALL {
  WITH u, m
  MATCH (u)-[:HAS_ADHERENCE_EVENT {
    date: date() - duration({days: range(0,6)})
  }]->(ade)
  WHERE ade.medication_id = m.uuid
  RETURN avg(CASE WHEN ade.taken THEN 1.0 ELSE 0.0 END) AS adherence_7d
}

// Última toma
OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  medication_id: m.uuid,
  taken: true
}]->(last_taken_event)
WITH u, m, pres, taken_today, missed_today, adherence_7d,
     max(last_taken_event.taken_time) AS last_taken_time

RETURN {
  uuid: m.uuid,
  generic_name: m.generic_name,
  brand_names: m.brand_names[0..2],
  dose: pres.dose,
  frequency: pres.frequency,
  schedule_time: pres.schedule_time,
  indication: pres.indication,
  start_date: pres.start_date,
  last_taken: last_taken_time,
  adherence_7d: adherence_7d,
  status_today: CASE
    WHEN taken_today IS NOT NULL THEN 'taken'
    WHEN missed_today IS NOT NULL THEN 'missed'
    WHEN pres.schedule_time IS NOT NULL AND pres.schedule_time > time() THEN 'pending'
    ELSE 'no_schedule'
  END
} AS medications_list
ORDER BY pres.schedule_time ASC NULLS LAST
```

---

## 2. Query: Detalle de un Medicamento (Pantalla de Detalle)

**Descripción**: Información completa de un medicamento específico, incluyendo educación, interacciones, historial de adherencia.

**Parámetros**:
- `user_uuid` (string)
- `medication_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication {uuid: $medication_uuid})

// 1. Info del medicamento (catálogo)
RETURN m {
  .generic_name,
  .brand_names,
  .atc_code,
  .substance_name,
  .dosage_forms,
  .typical_adult_dose,
  .route_of_admin,
  .metabolism_enzymes,
  .addiction_potential,
  .controlled_substance_schedule,
  .half_life_hours,
  .pregnancy_category
} AS medication_info

// 2. Adherencia detallada (últimos 30 días)
CALL {
  WITH u, m
  MATCH (u)-[:HAS_ADHERENCE_EVENT {
    date: date() - duration({days: range(0,29)})
  }]->(ade)
  WHERE ade.medication_id = m.uuid
  WITH date() - duration({days: range(0,29)}) AS day,
       CASE WHEN ade.taken THEN 1 ELSE 0 END AS taken
  RETURN collect({
    date: day,
    taken: taken = 1
  }) AS daily_adherence
}

// 3. Interacciones con otros medicamentos activos
CALL {
  WITH u, m
  MATCH (m)-[i:INTERACTS_WITH]-(other:Medication)
  WHERE (u)-[:TAKES {status: 'active'}]->(other)
  RETURN collect({
    other_medication: other.generic_name,
    severity: i.severity,
    mechanism: i.mechanism,
    management: i.management
  }) AS drug_interactions
}

// 4. Interacciones con sustancias consumidas recientemente
CALL {
  WITH u, m
  MATCH (u)-[:CONSUMES]->(s:Substance)
  WHERE EXISTS {
    MATCH (u)-[:HAS_SUBSTANCE_CONSUMPTION {
      consumed_at: date() - duration({days: range(0,13)})
    }]->(s)
  }
  MATCH (m)-[is:INTERACTS_WITH_SUBSTANCE]->(s)
  RETURN collect({
    substance: s.name,
    severity: is.severity,
    mechanism: is.mechanism,
    advice: is.advice
  }) AS substance_interactions
}

// 5. Efectos secundarios comunes (from graph)
CALL {
  WITH m
  MATCH (m)-[:CAUSES]->(sym:Symptom)
  WHERE sym.category = 'side_effect' OR sym.category = 'physical'
  RETURN collect({
    symptom: sym.name,
    frequency: 'common',  // debería venir de la relación
    severity: 'mild'
  }) AS common_side_effects
}

// 6. Conocimiento educativo relevante (RAG)
CALL {
  WITH m
  MATCH (k:Knowledge)
  WHERE k.metadata.topic CONTAINS m.generic_name
    OR k.metadata.topic = 'medication_education'
    AND k.metadata.audience = 'patient'
  RETURN collect(k.content)[0..3] AS educational_articles
}

RETURN {
  medication: medication_info,
  prescription: {
    dose: pres.dose,
    frequency: pres.frequency,
    schedule_time: pres.schedule_time,
    start_date: pres.start_date,
    prescriber: pres.prescriber_name
  },
  daily_adherence_30d: daily_adherence,
  drug_interactions: drug_interactions,
  substance_interactions: substance_interactions,
  common_side_effects: common_side_effects,
  educational_articles: educational_articles
} AS medication_detail
```

---

## 3. Query: Calendario de Adherencia (Vista Mensual)

**Descripción**: Para el calendario visual de los últimos 90 días.

**Parámetros**:
- `user_uuid` (string)
- `medication_uuid` (string, optional) - si se filtra por medicamento específico
- `months_back` (int, default: 3)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
WHERE $medication_uuid IS NULL OR m.uuid = $medication_uuid

// Generar rango de días
WITH u, m, pres, range(0, $months_back * 30) AS offsets
UNWIND offsets AS offset
WITH u, m, pres, date() - duration({days: offset}) AS day

// Left join a eventos de adherencia
OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: day,
  medication_id: m.uuid
}]->(ade)

WITH day,
     m.generic_name AS medication,
     CASE
       WHEN ade.taken = true THEN 'taken'
       WHEN ade.dose_skipped = true THEN 'missed'
       WHEN ade IS NULL AND day <= date() AND day >= pres.start_date THEN 'no_record'
       ELSE 'not_scheduled'
     END AS status

// Pivot por fecha
WITH day,
     collect({
       med: medication,
       status: status
     }) AS day_status

RETURN day,
       day_status,
       // Resumen del día: si todos tomados, parcial, etc.
       CASE
         WHEN size([x IN day_status WHERE x.status = 'taken']) = size(day_status) THEN 'all_taken'
         WHEN size([x IN day_status WHERE x.status = 'missed']) > 0 THEN 'some_missed'
         WHEN size([x IN day_status WHERE x.status = 'taken']) > 0 THEN 'partially_taken'
         ELSE 'no_data'
       END AS day_summary
ORDER BY day DESC
```

---

## 4. Query: Alertas de Interacción Pendientes (Para Badge Count)

**Descripción**: Cuenta alertas de interacción no reconocidas.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})-[:HAS_ALERT]->(a:Alert)
WHERE a.is_read = false
  AND a.type = 'interaction'

RETURN count(a) AS pending_interaction_alerts
```

---

## 5. Query: Obtener Alertas de Interacción Detalladas (Para Lista)

**Descripción**: Para mostrar todas las alertas activas en la sección de medicamentos.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})-[:HAS_ALERT]->(a:Alert)
WHERE a.type = 'interaction'

RETURN {
  id: a.uuid,
  severity: a.severity,
  title: a.title,
  message: a.message,
  related_medications: a.related_medications,
  related_substances: a.related_substances,
  created_at: a.created_at,
  is_read: a.is_read,
  suggested_actions: a.suggested_actions
} AS interaction_alerts
ORDER BY
  CASE a.severity
    WHEN 'critical' THEN 0
    WHEN 'major' THEN 1
    WHEN 'moderate' THEN 2
    ELSE 3
  END,
  a.created_at DESC
```

---

## 6. Query: Obtener Medicamento por Búsqueda (Autocompletado)

**Descripción**: Para el campo de búsqueda/barcode scanner.

**Parámetros**:
- `query` (string) - texto de búsqueda
- `limit` (int, default: 10)
- `country` (optional string) - filtrar por aprobación en país

**Query** (ya definida antes, pero la incluyo aquí para completitud):

```cypher
MATCH (m:Medication)
WHERE toLower(m.generic_name) CONTAINS toLower($query)
   OR ANY(brand IN m.brand_names WHERE toLower(brand) CONTAINS toLower($query))
   OR m.atc_code CONTAINS $query

WITH m,
     CASE
       WHEN toLower(m.generic_name) = toLower($query) THEN 3
       WHEN toLower(m.generic_name) STARTS WITH toLower($query) THEN 2
       WHEN ANY(brand IN m.brand_names WHERE toLower(brand) = toLower($query)) THEN 2
       ELSE 1
     END AS score

WHERE $country IS NULL OR m.country_approval[$country] = true

RETURN {
  uuid: m.uuid,
  generic_name: m.generic_name,
  brand_names: m.brand_names[0..3],
  atc_code: m.atc_code,
  typical_dose: m.typical_adult_dose,
  addiction_potential: m.addiction_potential,
  score: score
} AS search_results
ORDER BY score DESC, m.generic_name
LIMIT $limit
```

---

## 7. Query: Agregar Nuevo Medicamento (Create Prescription)

**Descripción**: Crea la relación TAKES entre usuario y medicamento, y dispara evaluación de interacciones.

**Parámetros**:
- `user_uuid` (string)
- `medication_uuid` (string)
- `prescription_data` (map) - {dose, frequency, schedule_time, indication, ...}

**Query** (transacción):

```cypher
// 1. Asegurar que el medicamento existe en el grafo
MERGE (m:Medication {uuid: $medication_uuid})
ON CREATE SET
  m.generic_name = $generic_name,  // si viene de ingestión
  ...

// 2. Crear relación TAKES
MATCH (u:User {uuid: $user_uuid})
MERGE (u)-[pres:TAKES]->(m)
ON CREATE SET
  pres.dose = $dose,
  pres.frequency = $frequency,
  pres.schedule_time = $schedule_time,
  pres.start_date = date(),
  pres.status = 'active',
  pres.indication = $indication,
  pres.created_at = datetime()
ON MATCH SET
  pres.dose = $dose,
  pres.frequency = $frequency,
  pres.updated_at = datetime()

// 3. Disparar evaluación de interacciones (esto se hace en app, no en Cypher)
// RETURN pres
```

**Nota**: La evaluación de interacciones se ejecuta desde la aplicación, no en esta query.

---

## 8. Query: Actualizar Confirmación de Toma (Log Dose)

**Descripción**: Registra que el usuario tomó (o omitió) una dosis.

**Parámetros**:
- `user_uuid` (string)
- `medication_uuid` (string)
- `taken` (boolean) - true si tomó, false si omitió
- `dose_time` (datetime) - hora de confirmación
- `notes` (optional string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})-[pres:TAKES]->(m:Medication {uuid: $medication_uuid})

// Crear evento de adherencia
CREATE (u)-[:HAS_ADHERENCE_EVENT {
  date: date($dose_time),
  taken_time: $dose_time,
  medication_id: m.uuid,
  taken: $taken,
  dose_skipped: NOT $taken,
  notes: $notes,
  created_at: datetime()
}]->(ade)

// Actualizar last_taken en prescripción si tomó
FOREACH (ign IN CASE WHEN $taken THEN [1] ELSE [] END |
  SET pres.last_taken = $dose_time,
      pres.adherence_streak = coalesce(pres.adherence_streak, 0) + 1
)

// Si omitió, resetear streak?
FOREACH (ign IN CASE WHEN NOT $taken THEN [1] ELSE [] END |
  SET pres.adherence_streak = 0
)

RETURN ade
```

---

## 9. Query: Eliminar Medicamento (Discontinue)

**Descripción**: Marca un medicamento como discontinuado (no lo borra, por historial).

**Parámetros**:
- `user_uuid` (string)
- `medication_uuid` (string)
- `discontinuation_reason` (optional string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})-[pres:TAKES]->(m:Medication {uuid: $medication_uuid})
SET pres.status = 'discontinued',
    pres.end_date = date(),
    pres.discontinuation_reason = $discontinuation_reason,
    pres.updated_at = datetime()
RETURN pres
```

---

## 10. Query: Exportar Historial Completo (Para Médico)

**Descripción**: Genera un reporte completo de todos los medicamentos históricos y adherencia.

**Parámetros**:
- `user_uuid` (string)
- `start_date` (date, optional)
- `end_date` (date, optional)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES]->(m:Medication)
WHERE ($start_date IS NULL OR pres.start_date >= $start_date)
  AND ($end_date IS NULL OR (pres.end_date IS NULL OR pres.end_date <= $end_date))

// Dosis tomadas en el período
OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: range_date
}]->(ade)
WHERE range_date >= $start_date AND range_date <= $end_date
  AND ade.medication_id = m.uuid

WITH u, m, pres,
     collect({
       date: ade.date,
       taken: ade.taken,
       notes: ade.notes
     }) AS dose_history

// Calcular estadísticas
WITH m.generic_name AS medication,
     pres.dose AS prescribed_dose,
     pres.frequency,
     pres.start_date,
     pres.end_date,
     dose_history,
     size([d IN dose_history WHERE d.taken = true]) AS doses_taken,
     size(dose_history) AS total_scheduled

RETURN {
  medication: medication,
  prescribed_dose: prescribed_dose,
  frequency: frequency,
  start_date: start_date,
  end_date: end_date,
  total_doses_scheduled: total_scheduled,
  doses_taken: doses_taken,
  adherence_percentage: CASE WHEN total_scheduled > 0 THEN doses_taken * 100.0 / total_scheduled ELSE NULL END,
  recent_doses: dose_history[0..50]
} AS full_medication_history
ORDER BY start_date DESC
```

---

## 11. Query: Obtener Estadísticas de Adherencia (Dashboard de la Sección)

**Descripción**: Para el widget de resumen en la sección de medicamentos.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)

// Adherencia global (últimos 7 días)
CALL {
  WITH u, m
  MATCH (u)-[:HAS_ADHERENCE_EVENT {
    date: date() - duration({days: range(0,6)})
  }]->(ade)
  WHERE ade.medication_id = m.uuid
  RETURN avg(CASE WHEN ade.taken THEN 1.0 ELSE 0.0 END) AS med_adherence
}

// Conteo de omisiones hoy
CALL {
  WITH u
  MATCH (u)-[:HAS_ADHERENCE_EVENT {
    date: date(),
    taken: false
  }]->(ade)
  RETURN count(*) AS missed_today
}

WITH u, collect(med_adherence) AS per_med_adherences, missed_today

// Calcular promedio ponderado
WITH u,
     CASE
       WHEN size(per_med_adherences) > 0
       THEN reduce(s = 0.0, x IN per_med_adherences | s + x) / size(per_med_adherences)
       ELSE 0.0
     END AS avg_adherence_7d,
     missed_today

// Streak máximo actual
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
WITH u, avg_adherence_7d, missed_today,
     max(pres.adherence_streak) AS max_current_streak

RETURN {
  average_adherence_7d: avg_adherence_7d,
  missed_doses_today: missed_today,
  longest_current_streak: max_current_streak,
  active_medications_count: size([pres IN u.prescriptions WHERE pres.status = 'active'])
} AS medication_stats
```

---

## 12. Query: Buscar Alternativas seguras (para interacciones problemáticas)

**Descripción**: Cuando se detecta una interacción, busca medicamentos alternativos para la misma condición que no interactúen.

**Parámetros**:
- `condition_code` (string) - código de condición que se está tratando
- `avoid_medication_uuids` (list<uuid>) - medicamentos que el paciente ya toma y con los que no debe interactuar
- `avoid_classes` (list<string>) - clases farmacológicas a evitar

**Query**:

```cypher
MATCH (c:Condition {code: $condition_code})<-[:TREATS]-(alt:Medication)

WHERE alt.uuid NOT IN $avoid_medication_uuids
  AND NOT alt.class IN $avoid_classes

// Asegurarse de que no tenga interacciones críticas/mayores con los medicamentos a evitar
OPTIONAL MATCH (alt)-[i:INTERACTS_WITH]-(bad:Medication)
WHERE bad.uuid IN $avoid_medication_uuids
  AND i.severity IN ['critical', 'major']

WITH alt, collect(DISTINCT i) AS bad_interactions
WHERE size(bad_interactions) = 0

// Enriquecer con propiedades
RETURN alt {
  .uuid,
  .generic_name,
  .brand_names,
  .class,
  .addiction_potential,
  .typical_adult_dose,
  .half_life_hours,
  .pregnancy_category
} AS alternative_medication
ORDER BY alt.addiction_potential ASC, alt.generic_name
LIMIT 10
```

---

## 13. Query: Obtener Conocimiento Educativo (RAG integration point)

**Descripción**: Para la sección de educación, buscar artículos relevantes basados en contexto.

**Parámetros**:
- `user_uuid` (string)
- `search_topic` (optional string)
- `max_results` (int, default: 5)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// Obtener perfil para filtrado
CALL {
  WITH u
  RETURN collect(u.mental_health_details) AS conditions,
         u.stage_of_change AS stage,
         u.age AS age
}

// Buscar Knowledge chunks
MATCH (k:Knowledge)
WHERE k.metadata.language = 'es'
  AND k.metadata.audience IN ['patient', 'all']
  AND (
    $search_topic IS NOT NULL AND k.metadata.topic CONTAINS $search_topic
    OR
    ANY(cond IN conditions WHERE k.metadata.topic CONTAINS cond)
    OR
    k.metadata.topic = 'medication_education'
  )
  // Filtrar por etapa de cambio si es relevante
  AND (k.metadata.stage_recommended IS NULL OR k.metadata.stage_recommended = stage)

RETURN k {
  .chunk_id,
  .content,
  .metadata: {
    topic: k.metadata.topic,
    type: k.metadata.type,
    difficulty: k.metadata.difficulty,
    source_url: k.metadata.source_url,
    source_name: k.metadata.source_name
  }
} AS educational_articles
ORDER BY
  CASE k.metadata.priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    ELSE 3
  END,
  k.retrieved_count DESC
LIMIT $max_results
```

---

## 14. Query: Registro de Efectos Secundarios Reportados por el Paciente

**Descripción**: Para llevar un seguimiento de efectos secundarios subjetivos que reporte el usuario (no solo del medicamento, sino también propios).

**Parámetros**:
- `user_uuid` (string)
- `days_back` (int, default: 30)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[r:REPORTS_SYMPTOM {
  last_reported: date() - duration({days: range(0, $days_back - 1)})
}]->(sym:Symptom)

// Ver si algún síntoma coincide con efectos secundarios conocidos de sus medicamentos
OPTIONAL MATCH (u)-[:TAKES {status: 'active'}]->(m:Medication)
MATCH (m)-[:CAUSES]->(sym)

RETURN collect({
  symptom: sym.name,
  intensity: r.intensity,
  last_reported: r.last_reported,
  frequency_last_30d: count(*),
  possibly_medication_related: m IS NOT NULL,
  medication_if_related: m.generic_name
}) AS reported_side_effects
ORDER BY frequency_last_30d DESC
```

---

## 15. Query: Dashboard Agregado de la Sección

**Descripción**: Query principal que trae todo lo que necesita la página principal de la sección de medicamentos.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// 1. Lista de medicamentos activos (query 1 ya definida)
CALL {
  WITH u
  MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
  OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {date: date(), medication_id: m.uuid, taken: true}]->(taken_today)
  OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {date: date(), medication_id: m.uuid, taken: false}]->(missed_today)
  CALL {
    WITH u, m
    MATCH (u)-[:HAS_ADHERENCE_EVENT {
      date: date() - duration({days: range(0,6)})
    }]->(ade)
    WHERE ade.medication_id = m.uuid
    RETURN avg(CASE WHEN ade.taken THEN 1.0 ELSE 0.0 END) AS adherence_7d
  }
  RETURN collect({
    uuid: m.uuid,
    name: m.generic_name,
    dose: pres.dose,
    frequency: pres.frequency,
    next_scheduled: pres.schedule_time,
    status_today: CASE
      WHEN taken_today IS NOT NULL THEN 'taken'
      WHEN missed_today IS NOT NULL THEN 'missed'
      ELSE 'pending'
    END,
    adherence_7d: adherence_7d
  }) AS meds_list
}

// 2. Alertas pendientes
CALL {
  WITH u
  MATCH (u)-[:HAS_ALERT]->(a:Alert)
  WHERE a.is_read = false AND a.type = 'interaction'
  RETURN collect({
    id: a.uuid,
    severity: a.severity,
    title: a.title,
    message: a.message
  }) AS pending_alerts
}

// 3. Estadísticas agregadas
CALL {
  WITH u
  MATCH (u)-[:TAKES {status: 'active'}]->(m:Medication)
  WITH count(m) AS active_meds_count
  MATCH (u)-[:HAS_ADHERENCE_EVENT {
    date: date() - duration({days: range(0,6)})
  }]->(ade)
  RETURN active_meds_count, avg(CASE WHEN ade.taken THEN 1.0 ELSE 0.0 END) AS global_adherence_7d
}

RETURN {
  medications: meds_list,
  pending_alerts: pending_alerts,
  stats: {
    active_count: active_meds_count,
    adherence_7d: global_adherence_7d
  }
} AS medication_dashboard
```

---

## 16. Query: Obtener Recomendaciones Personalizadas

**Descripción**: Para mostrar sugerencias basadas en patrones de adherencia y síntomas.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// 1. Detectar omisiones repetidas de una hora específica
CALL {
  WITH u
  MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
  WHERE pres.schedule_time IS NOT NULL
  MATCH (u)-[:HAS_ADHERENCE_EVENT {
    date: date() - duration({days: range(0,13)}),
    medication_id: m.uuid,
    taken: false
  }]->(missed)
  WITH pres.schedule_time AS hour, count(*) AS missed_count
  WHERE missed_count >= 3
  RETURN collect({
    hour: hour,
    missed_count: missed_count,
    suggestion: 'Consider taking ' + m.generic_name + ' at a different time or set a more prominent reminder.'
  }) AS timing_suggestions
}

// 2. Detectar correlación omisión-síntoma
CALL {
  WITH u
  MATCH (u)-[:REPORTS_SYMPTOM]->(sym:Symptom)
  WHERE sym.last_reported >= date() - duration({days: 7})
  MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
  OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
    date: range(0,6),
    medication_id: m.uuid,
    taken: false
  }]->(missed)
  WITH sym.name AS symptom, m.generic_name AS med, count(missed) AS missed_on_symptom_days
  WHERE missed_on_symptom_days > 0
  RETURN collect({
    symptom: symptom,
    medication: med,
    pattern: 'On days with ' + symptom + ', adherence to ' + med + ' dropped'
  }) AS correlation_suggestions
}

RETURN {
  timing_issues: timing_suggestions,
  correlations: correlation_suggestions
} AS personalized_recommendations
```

---

## Consideraciones de Implementación

1. **Índices críticos**:
   - `CREATE INDEX adherence_event_user_date_idx FOR ()-[r:HAS_ADHERENCE_EVENT]->() ON (r.user_uuid, r.date)`
   - `CREATE INDEX alert_user_unread_idx FOR (u)-[:HAS_ALERT]->() ON (u.uuid, a.is_read)`

2. **Particionado por tiempo**: Si hay muchos eventos de adherencia, particionar por mes.

3. **Actualizaciones en tiempo real**: Al registrar una dosis, también actualizar `pres.last_taken` y `pres.adherence_streak` en la misma transacción.

4. **Cache**: Results de queries de dashboard pueden cachearse por 1-2 minutos.

5. **Batch**: Queries como `personalized_recommendations` pueden correr nightly (batch) y guardar resultado en nodo `:Recommendation` para mostrarse al día siguiente.

---

*Documento vivo. Queries específicas para la sección de gestión de medicamentos de KogniRecovery.*