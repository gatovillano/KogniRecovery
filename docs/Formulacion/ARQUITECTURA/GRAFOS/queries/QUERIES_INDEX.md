# Índice de Queries del Knowledge Graph - KogniRecovery

## Ubicación

```
proyectos/KogniRecovery/ARQUITECTURA/GRAFOS/queries/
```

## Tabla de Contenidos

### 1. Check-in Diario
- `checkin_insights.cypher` - Generación de insights automáticos después de un check-in

### 2. Dashboard General
- `dashboard_widgets.cypher` - Queries para todos los widgets del dashboard

### 3. Alertas de Interacciones
- `alert_interactions.cypher` - Detección y gestión de alertas de interacciones

### 4. Chatbot LÚA
- `chatbot_context.cypher` - Obtener contexto personalizado para el chatbot

### 5. Sección de Medicamentos
- `medication_section.cypher` - Queries específicas para la sección de gestión de medicamentos

---

## Resumen por Categoría

### 📊 **Check-in Insights** (`checkin_insights.cypher`)

| Query # | Propósito | Parámetros clave |
|---------|-----------|------------------|
| 1 | Resumen del día (daily summary) | `user_uuid`, `checkin_date` |
| 2 | Patrón de adherencia vs síntomas | `user_uuid`, `days_back`, `medication_uuid` |
| 3 | Tendencias de síntomas | `user_uuid`, `symptom_category` |
| 4 | Alertas por omisión de medicación crítica | `user_uuid`, `critical_medications` |
| 5 | Primera vez (first-time insight) | `user_uuid` |
| 6 | Cumpleaños de recuperación | `user_uuid` |
| 7 | Predicción simple de riesgo | `user_uuid`, `prediction_horizon_days` |
| 8 | Interacciones con sustancias consumidas | `user_uuid`, `substance_names` |
| 9 | Recomendación de educación | `user_uuid`, `reported_symptoms`, `mood_score` |
| 10 | Estadísticas de adherencia mensual | `user_uuid` |
| 11 | Snapshot de estado de salud | `user_uuid` |
| 12 | Interacciones activas (alertas inmediatas) | `user_uuid`, `new_medication_uuid`, `consumed_substance_names` |
| 13 | Historial completo para exportar | `user_uuid`, `date_range_start`, `date_range_end` |
| 14 | Búsqueda en catálogo | `query`, `limit`, `country` |
| 15 | Información de enzimas | `medication_generic_name` |

---

### 📈 **Dashboard Widgets** (`dashboard_widgets.cypher`)

| Query # | Widget | Parámetros |
|---------|--------|------------|
| 1 | Medicamentos de hoy | `user_uuid` |
| 2 | Calendario de adherencia mensual | `user_uuid`, `days_back` |
| 3 | Síntomas recientes | `user_uuid`, `days_back` |
| 4 | Sustancias consumidas recientemente | `user_uuid`, `days_back` |
| 5 | Riesgo actual (semáforo) | `user_uuid` |
| 6 | Insight del día (datos para LLM) | `user_uuid` |
| 7 | Contactos de emergencia | `user_uuid`, `role` |
| 8 | Actividad reciente (timeline) | `user_uuid`, `limit` |
| 9 | Próximas citas | `user_uuid` |
| 10 | Meta de la semana | `user_uuid` |
| 11 | Notificaciones pendientes | `user_uuid` |
| 12 | Progreso de etapa de cambio | `user_uuid` |
| 13 | Dashboard data agregada (single query) | `user_uuid` |
| 14 | Alerta de interacción crítica (inmediata) | `user_uuid`, `context_medication_uuids`, `context_substance_names` |
| 15 | Vista familiar (agregada) | `family_user_uuid`, `patient_user_uuid` |

---

### ⚠️ **Alertas de Interacciones** (`alert_interactions.cypher`)

| Query # | Propósito | Parámetros |
|---------|-----------|------------|
| 1 | Alerta por nuevo medicamento | `user_uuid`, `new_medication_uuid`, `recent_substance_names` |
| 2 | Alerta por consumo de sustancia | `user_uuid`, `consumed_substances` |
| 3 | Resumen de interacciones del paciente | `user_uuid` |
| 4 | Explicación detallada de interacción | `medication_a_name`, `medication_b_name`, `substance_name`, `interaction_type` |
| 5 | Alertas pendientes no leídas | `user_uuid` |
| 6 | Marcar alerta como reconocida (UPDATE) | `user_uuid`, `alert_uuid` |
| 7 | Limpiar alertas antiguas (DELETE) | `days_old` |
| 8 | Resumen de seguridad semanal | `user_uuid`, `week_start_date` |
| 9 | Sugerir alternativas más seguras | `condition_code`, `current_medication_uuids`, `avoid_classes` |
| 10 | Medicamentos con alto potencial de abuso | `user_uuid`, `threshold` |
| 11 | Interacciones CYP450 relevantes | `user_uuid` |
| 12 | Historial de alertas (para profesional) | `user_uuid`, `date_range_start`, `date_range_end` |

---

### 💬 **Chatbot LÚA** (`chatbot_context.cypher`)

| Query # | Propósito | Parámetros |
|---------|-----------|------------|
| 1 | Contexto completo del paciente | `user_uuid`, `conversation_turn`, `max_history_messages` |
| 2 | Información de un medicamento específico | `medication_name` |
| 3 | Verificar si paciente toma un medicamento | `user_uuid`, `medication_name` |
| 4 | Condiciones diagnosticadas | `user_uuid` |
| 5 | Síntomas actuales (hoy) | `user_uuid` |
| 6 | Resumen de adherencia (7 días) | `user_uuid` |
| 7 | Recordatorio de efectos secundarios | `user_uuid` |
| 8 | Estado emocional reciente (check-ins) | `user_uuid`, `days_back` |
| 9 | Buscar educación relevante | `user_uuid`, `topic_hint` |
| 10 | Contactos de emergencia | `user_uuid` |
| 11 | Líneas de crisis locales | `country_code` |
| 12 | Historial conversación relevante | `user_uuid`, `current_message_text`, `max_messages` |
| 13 | Datos de sueño (wearables) | `user_uuid`, `days_back` |
| 14 | Verificar alerta crítica pendiente | `user_uuid` |
| 15 | Sugerir técnica DBT basada en síntomas | `user_uuid` |

---

### 💊 **Sección Medicamentos** (`medication_section.cypher`)

| Query # | Propósito | Parámetros |
|---------|-----------|------------|
| 1 | Lista de medicamentos (página principal) | `user_uuid` |
| 2 | Detalle de un medicamento | `user_uuid`, `medication_uuid` |
| 3 | Calendario de adherencia mensual | `user_uuid`, `medication_uuid`, `months_back` |
| 4 | Alertas de interacción pendientes (badge) | `user_uuid` |
| 5 | Alertas de interacción detalladas (lista) | `user_uuid` |
| 6 | Búsqueda/buscar medicamento (autocompletado) | `query`, `limit`, `country` |
| 7 | Agregar nuevo medicamento (CREATE) | `user_uuid`, `medication_uuid`, `prescription_data` |
| 8 | Actualizar confirmación de toma (UPDATE) | `user_uuid`, `medication_uuid`, `taken`, `dose_time`, `notes` |
| 9 | Eliminar/descontinuar medicamento (UPDATE) | `user_uuid`, `medication_uuid`, `discontinuation_reason` |
| 10 | Exportar historial completo (PDF/CSV) | `user_uuid`, `start_date`, `end_date` |
| 11 | Estadísticas de adherencia (dashboard sección) | `user_uuid` |
| 12 | Buscar alternativas más seguras | `condition_code`, `avoid_medication_uuids`, `avoid_classes` |
| 13 | Obtener conocimiento educativo (RAG) | `user_uuid`, `search_topic`, `max_results` |
| 14 | Efectos secundarios reportados | `user_uuid`, `days_back` |
| 15 | Dashboard agregado de la sección (single query) | `user_uuid` |
| 16 | Recomendaciones personalizadas | `user_uuid` |

---

## Convenciones de Naming

### Parámetros
- `user_uuid`: UUID del usuario/paciente (string)
- `medication_uuid`: UUID del medicamento en el grafo (string)
- `date`: tipo date de Cypher (ISO date)
- `datetime`: tipo datetime de Cypher (ISO datetime)
- `days_back`: número de días hacia atrás (integer)
- `days_range`: rango de días (list<integer>)
- `severity`: 'critical', 'major', 'moderate', 'minor'
- `limit`: máximo de resultados (integer)

### Tipos de Retorno
- **Objetos anidados**: Usar llaves `{}` para estructuras compuestas
- **Arrays**: `collect()` para listas
- **Valores scalar**: `count()`, `avg()`, `sum()`
- **Condicionales**: `CASE WHEN ... THEN ... END`

### Ordenamiento
Prioridad de severidad (mayor a menor):
```
critical > major > moderate > minor > benign
```

---

## Performance Guidelines

### Queries Críticas (deben ser <200ms)
1. Medicamentos de hoy (widget principal)
2. Alertas pendientes (badge count)
3. Búsqueda de medicamentos (autocompletado)
4. Confirmación de toma (log dose)
5. Contexto chatbot (al inicio de conversación)

### Queries de Reportes (pueden ser más lentas, <2s)
1. Calendario de adherencia 90 días
2. Historial completo para exportar
3. Predicción de riesgo (patrones complejos)
4. Dashboard data agregada

### Caching Strategy
- **Redis** con TTL:
  - Búsqueda de medicamentos: 5 min
  - Widget datos: 1-2 min
  - Contexto chatbot: 1 min
  - Alertas count: 30 segundos

### Indexes Requeridos

```cypher
// Para queries de adherencia
CREATE INDEX adherence_event_user_date_idx IF NOT EXISTS
FOR (u:User)-[r:HAS_ADHERENCE_EVENT]->() ON (r.user_uuid, r.date);

// Para queries de alertas
CREATE INDEX alert_user_unread_idx IF NOT EXISTS
FOR (u:User)-[:HAS_ALERT]->(a:Alert) ON (u.uuid, a.is_read, a.severity);

// Para búsqueda de medicamentos
CREATE INDEX medication_name_fulltext_idx IF NOT EXISTS
FOR (m:Medication) ON (m.generic_name, m.brand_names) STOPT WORD NONE;

// Para queries temporales de eventos
CREATE INDEX event_occurred_at_idx IF NOT EXISTS
FOR (e:Event) ON (e.occurred_at);
```

---

## Testing de Queries

### Datos Sintéticos
Crear script `scripts/generate_test_data.js` que genere:
- 1 paciente con 3-5 medicamentos
- 30 días de eventos de adherencia (con patrones realistic)
- 10-20 síntomas reportados
- 2-3 sustancias consumidas
- Algunas interacciones predefinidas

### Benchmarks
```bash
# Medir latencia de cada query crítica
time neo4j -u neo4j -p password -file queries/checkin_insights.cypher params.json
```

### Validación de Resultados
Comparar resultados con datos esperados en fixtures:
- `fixtures/expected_checkin_insight.json`
- `fixtures/expected_dashboard_widgets.json`

---

## Versionado

Las queries son parte de la especificación técnica. Cambios importantes deben reflejarse en:

1. `ARQUITECTURA/GRAFOS/KG_SCHEMA.md` (si cambia el schema)
2. `ARQUITECTURA/GRAFOS/queries/` (este directorio)
3. `ESPECIFICACIONES_TECNICAS.md` (si afecta APIs)

---

## Roles y Permisos

### Queries que Modifican Datos (UPDATE/DELETE/CREATE)
- `alert_interactions.cypher` - query #6 (acknowledge alert)
- `medication_section.cypher` - queries #7 (add medication), #8 (log dose), #9 (discontinue)

Estas requieren autenticación y autorización en la capa de servicio (verificar que el usuario solo accede a sus propios datos).

### Queries Solo Lectura
Todas las demás son read-only.

---

## Relación con RAG

Algunas queries complementan RAG:

- `chatbot_context.cypher` query #9: `buscar_educacion_relevante` obtiene datos estructurados del grafo, pero el contenido completo de artículos viene de RAG (Vector Store).
- `medication_section.cypher` query #13: similar.

El patrón:
1. Query al grafo para obtener IDs de `:Knowledge` relevantes
2. Servicio recupera chunks del Vector Store usando esos IDs (o embeddings)
3. LLM combina datos estructurados del grafo con contenido RAG

---

## Roadmap de Queries

| Fase | Queries a Implementar | Prioridad |
|------|-----------------------|-----------|
| Fase 1 (MVP Chatbot + Dashboard) | chatbot_context: 1-8, dashboard_widgets: 1-6, checkin: 1-2 | Alta |
| Fase 2 (Sección Medicamentos) | medication_section: 1-11, alert_interactions: 1-5, 8 | Alta |
| Fase 3 (Avanzado) | checkin: 7-15, dashboard: 7-15, alert_interactions: 6,7,9-12 | Media |
| Fase 4 (Optimización) | Todas las queries restantes | Baja |

---

## Mantenimiento

- Revisar queries cada 3 meses
- Optimizar queries lentas (identificar con `EXPLAIN ANALYZE`)
- Actualizar índices conforme crece el dataset
- Documentar cambios en commit messages

---

*Índice vivo. Actualizar conforme se agreguen nuevas queries.*