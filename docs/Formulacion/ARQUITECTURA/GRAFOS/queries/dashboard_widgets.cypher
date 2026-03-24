# Queries para Dashboard - KogniRecovery

## Propósito

Proporcionar datos para los widgets del dashboard del paciente y del familiar. Cada widget tiene una query específica que debe ser rápida (<200ms).

---

## 1. Widget: Resumen de Medicamentos Hoy (Today's Medications)

**Descripción**: Muestra próximas tomas de hoy y estado de adherencia.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)

// Obtener scheduled times de hoy (si schedule_time está definido)
WITH u, m, pres,
     CASE
       WHEN pres.schedule_time IS NOT NULL THEN
         datetime({date: date(), time: pres.schedule_time})
       ELSE
         // Si no hay hora fija, estimar basado en frecuencia
         NULL
     END AS next_scheduled

// Verificar si ya tomó hoy
OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: date(),
  medication_id: m.uuid,
  taken: true
}]->(taken_event)

// Contar omisiones hoy
OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: date(),
  medication_id: m.uuid,
  taken: false
}]->(skipped_event)

RETURN {
  medication: m.generic_name,
  dose: pres.dose,
  frequency: pres.frequency,
  next_scheduled: next_scheduled,
  taken_today: taken_event IS NOT NULL,
  skipped_today: skipped_event IS NOT NULL,
  last_taken: pres.last_taken,
  adherence_streak: pres.adherence_streak,
  status: CASE
    WHEN taken_event IS NOT NULL THEN 'taken'
    WHEN skipped_event IS NOT NULL THEN 'missed'
    WHEN next_scheduled IS NOT NULL AND next_scheduled > datetime() THEN 'pending'
    ELSE 'no_schedule'
  END
} AS today_medications
ORDER BY next_scheduled ASC NULLS LAST
```

---

## 2. Widget: Adherencia Mensual (Monthly Adherence Calendar)

**Descripción**: Para el calendario visual de adherence de los últimos 30 días.

**Parámetros**:
- `user_uuid` (string)
- `days_back` (int, default: 30)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)

// Generar días del rango
WITH u, pres, m, range(0, $days_back - 1) AS offsets
UNWIND offsets AS offset
WITH u, pres, m, date() - duration({days: offset}) AS target_date

// Left join: ¿tomó esa dosis programada?
OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: target_date,
  medication_id: m.uuid,
  taken: true
}]->(taken)

OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
  date: target_date,
  medication_id: m.uuid,
  taken: false
}]->(skipped)

// Resumir por fecha y medicamento
WITH target_date AS date,
     m.generic_name AS medication,
     CASE
       WHEN taken IS NOT NULL THEN 1
       WHEN skipped IS NOT NULL THEN 0
       ELSE NULL  // no data (no era día programado?)
     END AS dose_status

// Agregar por fecha (totales)
WITH date,
     collect({
       med: medication,
       status: dose_status
     }) AS med_statuses

// Calcular adherencia general del día (si hay múltiples medicamentos)
WITH date,
     med_statuses,
     size([x IN med_statuses WHERE x.status = 1]) * 1.0 /
     size([x IN med_statuses WHERE x.status IN [0,1]]) AS daily_adherence

RETURN date, daily_adherence, med_statuses
ORDER BY date ASC
```

---

## 3. Widget: Síntomas Recientes (Recent Symptoms)

**Descripción**: Muestra los síntomas reportados en los últimos 7 días con intensidad.

**Parámetros**:
- `user_uuid` (string)
- `days_back` (int, default: 7)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[r:REPORTS_SYMPTOM {
  last_reported: date() - duration({days: range(0, $days_back - 1)})
}]->(sym:Symptom)

RETURN {
  symptom: sym.name,
  category: sym.category,
  intensity: r.intensity,
  last_reported: r.last_reported,
  frequency_last_7d: count(*)  // cuántas veces lo reportó en el período
} AS recent_symptoms
ORDER BY r.last_reported DESC, r.intensity DESC
```

---

## 4. Widget: Sustancias Consumidas Recientemente (Recent Substance Use)

**Descripción**: Muestra consumo de sustancias en los últimos 7 días (importante para interacciones).

**Parámetros**:
- `user_uuid` (string)
- `days_back` (int, default: 7)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:CONSUMES]->(s:Substance)
WHERE EXISTS {
  MATCH (u)-[:HAS_SUBSTANCE_CONSUMPTION {
    consumed_at: date() - duration({days: range(0, $days_back - 1)})
  }]->(s)
}

// Obtener último consumo
OPTIONAL MATCH (u)-[cons:HAS_SUBSTANCE_CONSUMPTION]->(s)
WHERE cons.consumed_at IS NOT NULL
WITH u, s, max(cons.consumed_at) AS last_consumed

RETURN {
  substance: s.name,
  class: s.class,
  last_consumed: last_consumed,
  days_since_last: duration.inDays(date() - last_consumed).days,
  frequency: "reciente"  // simplificado
} AS recent_substance_use
ORDER BY last_consumed DESC
```

---

## 5. Widget: Riesgo Actual (Current Risk Level)

**Descripción**: Muestra un semáforo de riesgo basado en múltiples factores (interacciones, omisiones, síntomas).

**Parámetros**:
- `user_uuid` (string)

**Query** (combinada):

```cypher
MATCH (u:User {uuid: $user_uuid})

// 1. Interacciones críticas pendientes (no resueltas)
OPTIONAL MATCH (u)-[:TAKES {status: 'active'}]->(m:Medication)
OPTIONAL MATCH (m)-[i:INTERACTS_WITH]-(other:Medication)
WHERE (u)-[:TAKES {status: 'active'}]->(other)
  AND i.severity = 'critical'
  AND NOT EXISTS {
    MATCH (u)-[:ALERT_ACKNOWLEDGED]->(:InteractionAlert {related_interaction: i})
  }
WITH u, count(DISTINCT i) AS critical_interactions

// 2. Omisión de medicamento crítico en últimos 3 días
OPTIONAL MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
WHERE m.addiction_potential > 0.3  // ej: benzos, opioides
WITH u, critical_interactions,
     exists {
       MATCH (u)-[:HAS_ADHERENCE_EVENT {
         date: date() - duration({days: range(0,2)}),
         medication_id: m.uuid,
         taken: false
       }]
     } AS missed_critical_med_recently

// 3. Síntomas severos reportados hoy
OPTIONAL MATCH (u)-[r:REPORTS_SYMPTOM {date: date()}]->(sym:Symptom)
WHERE r.intensity >= 8
WITH u, critical_interactions, missed_critical_med_recently,
     count(r) AS severe_symptoms_today

// 4. Consumo de sustancia hoy
OPTIONAL MATCH (u)-[:HAS_SUBSTANCE_CONSUMPTION {
  consumed_at: date()
}]->(s:Substance)

// Calcular score
RETURN {
  risk_score: (
    (CASE WHEN critical_interactions > 0 THEN 40 ELSE 0 END) +
    (CASE WHEN missed_critical_med_recently THEN 30 ELSE 0 END) +
    (CASE WHEN severe_symptoms_today > 0 THEN 20 ELSE 0 END) +
    (CASE WHEN s IS NOT NULL THEN 10 ELSE 0 END)
  ),
  factors: {
    critical_interactions: critical_interactions,
    missed_critical_med_recently: missed_critical_med_recently,
    severe_symptoms_today: severe_symptoms_today,
    substance_today: s IS NOT NULL
  },
  risk_level: CASE
    WHEN (CASE WHEN critical_interactions > 0 THEN 40 ELSE 0 END +
          CASE WHEN missed_critical_med_recently THEN 30 ELSE 0 END +
          CASE WHEN severe_symptoms_today > 0 THEN 20 ELSE 0 END +
          CASE WHEN s IS NOT NULL THEN 10 ELSE 0 END) >= 50 THEN 'high'
    WHEN (... >= 20) THEN 'medium'
    ELSE 'low'
  END,
  recommended_actions: [
    ...array de acciones según factores
  ]
} AS current_risk
```

---

## 6. Widget: Insight del Día (Daily Insight)

**Descripción**: Muestra un insight generado automáticamente basado en el análisis de patrones.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
// Esta query no trae datos directamente, sino que invoca una función de aplicación
// que usa múltiples queries. Pero aquí podemos obtener datos para el insight:

MATCH (u:User {uuid: $user_uuid})

// Obtener datos recientes para análisis
WITH u, date() AS today

// 1. Adherencia de la última semana (comparar con anterior)
CALL {
  WITH u, today
  MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
  OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
    date: today - duration({days: range(0,6)})
  }]->(ade)
  WHERE ade.medication_id = m.uuid
  RETURN avg(CASE WHEN ade.taken = true THEN 1.0 ELSE 0.0 END) AS adherence_last_7d
}

// 2. Síntomas más comunes esta semana
CALL {
  WITH u, today
  MATCH (u)-[r:REPORTS_SYMPTOM {
    last_reported: today - duration({days: range(0,6)})
  }]->(sym:Symptom)
  RETURN collect({
    symptom: sym.name,
    count: count(*),
    avg_intensity: avg(r.intensity)
  }) AS weekly_symptoms
  ORDER BY count DESC
  LIMIT 3
}

// 3. Consumo de sustancia semanal
CALL {
  WITH u, today
  MATCH (u)-[:HAS_SUBSTANCE_CONSUMPTION {
    consumed_at: today - duration({days: range(0,6)})
  }]->(s:Substance)
  RETURN count(*) AS substances_this_week, collect(DISTINCT s.name) AS substances_list
}

// 4. Días consecutivos de abstinencia (si aplica)
CALL {
  WITH u
  MATCH (u)-[:EXPERIENCED {type: 'achievement'}]->(e:Event)
  WHERE e.metadata.days_sober IS NOT NULL
  RETURN max(e.metadata.days_sober) AS max_days_sober
}

RETURN {
  adherence_last_7d: adherence_last_7d,
  top_symptoms: weekly_symptoms[0..2],
  substances_this_week: substances_this_week,
  substances_list: substances_list,
  max_days_sober: max_days_sober,
  // Espacio para que la app genere insight basado en estos datos
} AS insight_input_data
```

**Nota**: El insight lo genera la aplicación (orchestrator LLM) basada en estos datos. La query solo provee contexto.

---

## 7. Widget: Contactos de Emergencia (Emergency Contacts)

**Descripción**: Muestra contacts de emergencia configurados (para usuario y, si es familiar, para su paciente vinculado).

**Parámetros**:
- `user_uuid` (string)
- `role` (string: 'patient' o 'family')

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// Si es paciente, sus propios contactos
MATCH (u)-[:HAS_EMERGENCY_CONTACT]->(ec:EmergencyContact)
RETURN collect({
  name: ec.name,
  relationship: ec.relationship,
  phone: ec.phone,
  email: ec.email,
  notify_on_risk: ec.notify_on_risk
}) AS emergency_contacts
```

Si es `family`, puede buscar contactos del paciente vinculado (ver sección familiar).

---

## 8. Widget: Actividad Reciente (Recent Activity)

**Descripción**: Timeline de eventos recientes (check-ins, tomas de medicación, crisis, mensajes del chatbot).

**Parámetros**:
- `user_uuid` (string)
- `limit` (int, default: 10)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// Eventos de check-in
CALL {
  WITH u
  MATCH (u)-[:HAS_CHECKIN]->(c:Checkin)
  RETURN {
    type: 'checkin',
    timestamp: c.created_at,
    description: 'Check-in diario completado',
    mood: c.mood_score
  } AS event
  UNION
  // Eventos de toma de medicación
  WITH u
  MATCH (u)-[:HAS_ADHERENCE_EVENT]->(dose:MedicationDose)
  RETURN {
    type: 'medication',
    timestamp: dose.taken_time,
    description: 'Tomó ' + dose.medication_name + ' (' + dose.dose + ')',
    medication: dose.medication_name
  } AS event
  UNION
  // Eventos de crisis
  WITH u
  MATCH (u)-[:EXPERIENCED]->(e:Event)
  WHERE e.type = 'crisis'
  RETURN {
    type: 'crisis',
    timestamp: e.occurred_at,
    description: e.description,
    severity: e.severity
  } AS event
  UNION
  // Mensajes del chatbot (últimos)
  WITH u
  MATCH (u)-[:SENT_MESSAGE]->(msg:ChatMessage)
  RETURN {
    type: 'chat',
    timestamp: msg.created_at,
    description: left(msg.content, 100),
    direction: msg.direction
  } AS event
}
RETURN event
ORDER BY event.timestamp DESC
LIMIT $limit
```

---

## 9. Widget: Próximas Citas (Upcoming Appointments)

**Descripción**: Muestra recordatorios de citas terapéuticas (si se integra con calendario).

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:HAS_APPOINTMENT]->(a:Appointment)
WHERE a.start_time >= datetime() AND a.status = 'scheduled'

RETURN {
  id: a.uuid,
  type: a.type,  // 'therapy', 'psychiatry', 'support_group'
  provider: a.provider_name,
  start_time: a.start_time,
  duration_minutes: a.duration_minutes,
  location: a.location,
  notes: a.notes
} AS upcoming_appointments
ORDER BY a.start_time ASC
```

---

## 10. Widget: Meta de la Semana (Weekly Goal)

**Descripción**: Muestra la meta de recuperación actual (debería venir de una entidad `:Goal`).

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:HAS_ACTIVE_GOAL]->(g:Goal)
WHERE g.period = 'weekly' AND g.status = 'active'

RETURN {
  id: g.uuid,
  description: g.description,
  target_value: g.target_value,
  current_value: g.current_value,
  unit: g.unit,
  progress_percentage: g.current_value * 100.0 / g.target_value,
  deadline: g.deadline
} AS weekly_goal
```

---

## 11. Widget: Notificaciones Pendientes (Pending Notifications)

**Descripción**: Para mostrar alertas no leídas en el dashboard.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:HAS_ALERT]->(a:Alert)
WHERE a.is_read = false

RETURN {
  id: a.uuid,
  type: a.type,  // 'interaction', 'adherence', 'crisis', 'education'
  severity: a.severity,
  title: a.title,
  message: a.message,
  created_at: a.created_at,
  actions: a.suggested_actions
} AS pending_alerts
ORDER BY a.created_at DESC
```

---

## 12. Widget: Progreso de Etapa de Cambio (Stage of Change Progress)

**Descripción**: Muestra en qué etapa de cambio está el paciente y su progreso.

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// Contar tiempo en cada etapa (historial de stage changes)
CALL {
  WITH u
  MATCH (u)-[:HAD_STAGE {stage: s}]->(e:Event)
  WHERE e.type = 'stage_change'
  RETURN s AS stage, count(*) AS days_in_stage
  ORDER BY e.occurred_at DESC
  LIMIT 5
}

RETURN {
  current_stage: u.stage_of_change,
  time_in_current_stage_days: duration.inDays(date() - u.stage_changed_at).days,
  stage_history: collect({stage: stage, days: days_in_stage})
} AS stage_progress
```

---

## 13. Query: Dashboard Widget Data (Agrupada)

**Descripción**: Query principal que trae todos los datos del dashboard en una sola llamada (para evitar múltiples queries).

**Parámetros**:
- `user_uuid` (string)

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// 1. Medicamentos de hoy
CALL {
  WITH u
  MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
  OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {date: date(), medication_id: m.uuid, taken: true}]->(taken)
  RETURN collect({
    medication: m.generic_name,
    dose: pres.dose,
    next_scheduled: pres.schedule_time,
    taken_today: taken IS NOT NULL
  }) AS today_meds
}

// 2. Adherencia últimos 7 días
CALL {
  WITH u
  MATCH (u)-[pres:TAKES {status: 'active'}]->(m:Medication)
  OPTIONAL MATCH (u)-[:HAS_ADHERENCE_EVENT {
    date: date() - duration({days: range(0,6)})
  }]->(ade)
  WHERE ade.medication_id = m.uuid
  RETURN avg(CASE WHEN ade.taken THEN 1.0 ELSE 0.0 END) AS adherence_7d
}

// 3. Síntomas últimos 7 días
CALL {
  WITH u
  MATCH (u)-[r:REPORTS_SYMPTOM {
    last_reported: date() - duration({days: range(0,6)})
  }]->(sym:Symptom)
  RETURN collect(DISTINCT sym.name) AS recent_symptoms
}

// 4. Interacciones críticas no resueltas
CALL {
  WITH u
  MATCH (u)-[:TAKES {status: 'active'}]->(m:Medication)
  MATCH (m)-[i:INTERACTS_WITH {severity: 'critical'}]-(other:Medication)
  WHERE (u)-[:TAKES {status: 'active'}]->(other)
  AND NOT EXISTS { MATCH (u)-[:ALERT_ACKNOWLEDGED]->(:InteractionAlert {severity: 'critical'}) }
  RETURN count(DISTINCT i) AS critical_interactions
}

// 5. Etapa de cambio
RETURN {
  user: {
    uuid: u.uuid,
    stage_of_change: u.stage_of_change,
    risk_level: u.risk_level
  },
  today_medications: today_meds,
  adherence_7d: adherence_7d,
  recent_symptoms: recent_symptoms,
  critical_interactions: critical_interactions,
  dashboard_timestamp: datetime()
} AS dashboard_data
```

---

## 14. Query: Alerta de Interacción Crítica (Para Notificación Inmediata)

**Descripción**: Se ejecuta cuando se añade un medicamento o se registra consumo. Retorna interacciones críticas que requieren atención inmediata.

**Parámetros**:
- `user_uuid` (string)
- `context_medication_uuids` (list<uuid>) - medicamentos implicados en la acción actual
- `context_substance_names` (list<string>) - sustancias consumidas

**Query**:

```cypher
MATCH (u:User {uuid: $user_uuid})

// Obtener todos los medicamentos activos del usuario + los del contexto
MATCH (u)-[:TAKES {status: 'active'}]->(m:Medication)
WITH u, m + [x IN $context_medication_uuids WHERE x IS NOT NULL] AS all_meds

// Encontrar pares con interacción crítica entre cualquier par en all_meds
MATCH (m1:Medication) WHERE m1 IN all_meds
MATCH (m2:Medication) WHERE m2 IN all_meds AND m1 < m2  // evitar duplicados y auto
MATCH (m1)-[i:INTERACTS_WITH]->(m2)
WHERE i.severity = 'critical'

// También interacciones medicamento-sustancia críticas
OPTIONAL MATCH (m:Medication) WHERE m IN all_meds
MATCH (s:Substance) WHERE s.name IN $context_substance_names
MATCH (m)-[is:INTERACTS_WITH_SUBSTANCE]->(s)
WHERE is.severity = 'critical'

// Enriquecer con nombres y mecanismos
RETURN collect(DISTINCT {
  type: 'drug-drug',
  medication_a: m1.generic_name,
  medication_b: m2.generic_name,
  severity: i.severity,
  mechanism: i.mechanism,
  management: i.management
}) + collect(DISTINCT {
  type: 'drug-substance',
  medication: m.generic_name,
  substance: s.name,
  severity: is.severity,
  mechanism: is.mechanism,
  advice: is.advice
}) AS critical_alerts
```

---

## 15. Query: Familiar - Vista Agregada del Paciente

**Descripción**: Para el dashboard del familiar, muestra información agregada (no íntima) del paciente vinculado.

**Parámetros**:
- `family_user_uuid` (string) - UUID del familiar
- `patient_user_uuid` (string) - UUID del paciente vinculado

**Query**:

```cypher
// Verificar que el familiar tiene permiso
MATCH (family:User {uuid: $family_user_uuid})-[:VIEWS_PATIENT]->(patient:User {uuid: $patient_user_uuid})

// Datos agregados (no detalle íntimo)
MATCH (patient)-[pres:TAKES {status: 'active'}]->(m:Medication)

// Adherencia agregada (últimos 7 días)
CALL {
  WITH patient
  MATCH (patient)-[:HAS_ADHERENCE_EVENT {
    date: date() - duration({days: range(0,6)})
  }]->(ade)
  RETURN avg(CASE WHEN ade.taken THEN 1.0 ELSE 0.0 END) AS adherence_7d
}

// Conteo de síntomas por categoría (últimos 7 días)
CALL {
  WITH patient
  MATCH (patient)-[r:REPORTS_SYMPTOM {
    last_reported: date() - duration({days: range(0,6)})
  }]->(sym:Symptom)
  RETURN collect({
    category: sym.category,
    avg_intensity: avg(r.intensity),
    count: count(*)
  }) AS symptom_summary
}

// Consumo de sustancias (conteo, no detalle)
CALL {
  WITH patient
  MATCH (patient)-[:HAS_SUBSTANCE_CONSUMPTION {
    consumed_at: date() - duration({days: range(0,6)})
  }]->(s:Substance)
  RETURN count(*) AS substance_use_events, collect(DISTINCT s.name) AS substances_used
}

// Crisis recientes (solo conteo, no detalles)
CALL {
  WITH patient
  MATCH (patient)-[:EXPERIENCED {type: 'crisis'}]->(e:Event)
  WHERE e.occurred_at >= date() - duration({days: 30})
  RETURN count(*) AS crisis_count_last_30d
}

RETURN {
  patient_name: patient.name,  // si existe propiedad name
  stage_of_change: patient.stage_of_change,
  adherence_7d: adherence_7d,
  symptom_summary: symptom_summary,
  substance_use_events: substance_use_events,
  substances_used: substances_used,
  crisis_count_last_30d: crisis_count_last_30d,
  // Mensajes de apoyo sugeridos basados en datos
  suggested_support_actions: CASE
    WHEN adherence_7d < 0.5 THEN ['Preguntar cómo está su rutina de medicación', 'Ofrecer ayuda para recordar']
    WHEN substance_use_events > 0 THEN ['Hablar sobre el consumo sin juzgar', 'Recordarle que estás ahí']
    ELSE ['Revisar cómo se siente hoy', 'Compartir algo positivo']
  END
} AS family_dashboard_view
```

---

## Notas Generales

- **Performance**: Todas las queries deben usar índices. Revisar `EXPLAIN` en producción.
- **Cache**: Resultados de widgets pueden cachearse en Redis (TTL 1-5 min) para dashboards.
- **Seguridad**: Cada query debe filtrar por `user_uuid` (ningún dato de otros usuarios).
- **Paginación**: Para listados largos (historial), usar `SKIP`/`LIMIT`.
- **Time zones**: Usar `datetime()` de Neo4j que respeta timezone del servidor; considerar convertir a UTC.

---

*Documento vivo. Agregar queries conforme se diseñan nuevas secciones.*