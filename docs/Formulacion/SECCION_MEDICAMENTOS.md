# Especificación Funcional: Gestión de Medicamentos - KogniRecovery

## 1. Descripción General

La **Gestión de Medicamentos** es una **sección de la aplicación** que permite a los pacientes (y profesionales, si se autoriza) registrar, monitorear y recibir apoyo para su medicación en el contexto de tratamiento de adicciones y salud mental.

Esta sección **se beneficia** de la **Arquitectura de Inteligencia Aumentada** de KogniRecovery (RAG + Knowledge Graph), pero no define una arquitectura separada.

---

## 2. Objetivos de la Sección

1. **Adherencia**: Facilitar la toma consistente de medicación mediante recordatorios y registro fácil
2. **Educación**: Proporcionar información clara sobre cada medicamento (qué es, cómo tomarlo, efectos secundarios)
3. **Seguridad**: Detectar interacciones peligrosas (fármaco-fármaco, fármaco-alcohol/sustancias)
4. **Historial**: Mantener un registro completo para consulta del paciente y, con permiso, de profesionales
5. **Autonomía**: Dar al paciente control total sobre su información de medicación

---

## 3. Funcionalidades de la Sección

### 3.1 Registro de Medicamentos

**Cómo**:
- Manual: usuario escribe nombre (con autocompletado desde catálogo)
- Búsqueda: explora base de datos de medicamentos (catálogo local)
- Escaneo: cámara del móvil escanea código de barras → busca en catálogo
- Importación: desde receta digital (si el país lo soporta)

**Qué datos**:
- Nombre (genérico y comercial)
- Dosis y frecuencia
- Horario programado
- Fecha de inicio (y fin si aplica)
- Prescriptor (opcional)
- Motivo/indicación
- Instrucciones especiales
- Notas personales

**Validación**:
- El sistema **sugiere** información del catálogo (dosis típica, indicaciones)
- El usuario **confirma** o modifica
- Advertencia: "Esta información es solo para referencia. Consulta a tu médico para dosis exactas."

### 3.2 Recordatorios y Confirmación de Toma

- Notificaciones push en horarios programados
- Confirmación con un tap: "Tomé mi dosis"
- Opción de posponer ("En 15 min", "En 1 hora")
- Si no se confirma → recordatorio adicional a los 30 min
- Calendario visual mensual (colores: tomado/omitido/no programado)
- Estadísticas de adherencia (% en últimos 7/30 días)
- Streaks: "¡X días consecutivos tomando todos tus medicamentos!"

### 3.3 Interacciones y Alertas de Seguridad

**Cuando se añade un nuevo medicamento**:
- El sistema **automatizado** evalúa interacciones con medicamentos activos del paciente
- Consulta el **Knowledge Graph** (Neo4j) para relaciones `INTERACTS_WITH`
- Si hay interacción severa → alerta inmediata con explicación
- Si interacción moderada → advertencia con sugerencia de consultar médico
- **Explicabilidad**: muestra mechanismo ("Tu nuevo medicamento se metaboliza por CYP3A4 y tu otro medicamento inhibe esa enzima")

**Cuando el usuario registra consumo de sustancias** (en check-in o manual):
- Si tiene medicamentos activos, se buscan interacciones conocidas
- Alertas contextuales según riesgo

**Basado en RAG**:
- Para interacciones no en grafo, busca en fichas técnicas actualizadas
- Prioriza alertas por severidad y relevancia clínica

**Niveles de alerta**:
- 🔴 Crítica: "No mezcles. Riesgo de sobredosis."
- 🟡 Moderada: "Consultar médico. Monitorear efectos."
- 🔵 Informativa: "Posible interacción. Lee más."

### 3.4 Dashboard de Medicamentos

Vista principal de la sección:

**Resumen actual**:
- Lista de medicamentos activos (nombre, dosis, próxima toma)
- % adherencia semanal
- Alertas pendientes (interacciones, omisiones)

**Calendario**:
- Mes actual con marcadores de colores por día (verde=todos tomados, rojo=omisiones, gris=sin datos)
- Tap en día → ver detalles

**Historial**:
- Medicamentos pasados (con fechas de inicio/fin)
- Motivos de suspensión
- Evolución de prescripciones

**Exportar**:
- PDF con listado completo (para llevar al médico)
- CSV para análisis personal
- Enlace temporal seguro para compartir con profesional

### 3.5 Educación Integrada

Para cada medicamento en la lista:

**Ficha informativa** (extraída de RAG - fichas técnicas):
- Uso indicado (para qué sirve)
- Dosis típica y máxima
- Efectos secundarios comunes (con prevalencia)
- Advertencias importantes (no mezclar con alcohol, conducir con precaución, etc.)
- Tiempo de acción (cuándo hace efecto, cuánto dura)
- Síntomas de sobredosis

**Artículos breves** (RAG - psicoeducación):
- "¿Qué es la tolerancia?"
- "Mitos sobre los medicamentos para la ansiedad"
- "Cómo gestionar los efectos secundarios"
- "Adherencia: por qué es importante"

**Glosario**:
- Términos médicos (half-life, metabolismo, CYP450, etc.)

### 3.6 Integración con Otras Secciones

**Con Check-in Diario**:
- Pregunta adicional: "¿Tomaste todos tus medicamentos hoy?" (Sí/No/Parciamente)
- Si "No" o "Parciariamente": ¿Por qué? (olvido, efectos secundarios, costo, decisión)
- Correlaciones automáticas: ¿Los días que omite medicación hay mayor consumo de sustancias? ¿Qué emociones preceden a las omisiones?

**Con el Chatbot (LÚA)**:
- LÚA puede responder preguntas sobre medicamentos usando RAG
- Puede explicar interacciones específicas (consultando grafo)
- Detecta menciones de medicamentos en conversación y ofrece ayuda
- Recuerda experiencias previas del usuario con medicamentos (guardadas en grafo)

**Con Dashboard General**:
- Widget de "Medicamentos de hoy" (próximas tomas, % adherencia)
- Insights que combinan medicamentos con otros datos (ej: "Cuando omites X, reportas más ansiedad")

**Con Alertas de Crisis**:
- Si se detecta interacción crítica (ej: alcohol + benzo) → alerta inmediata
- Considera medicación actual en evaluación de riesgo (ej: antidepresivo + intend-to-self)

**Con Pared Compartida (familiar)**:
- Familiar puede ver (solo si paciente autoriza):
  - Lista de medicamentos (nombres, dosis, horarios)
  - Adherencia general (%)
  - Alertas graves (interacciones)
- Familiar NO ve detalles íntimos (por qué faltó, notas personales)
- Sugerencias de apoyo basadas en estado de medicación

---

## 4. Modelo de Datos (Compartido con Arquitectura General)

### 4.1 PostgreSQL (Transaccional)

**Tablas existentes que se usan**:
- `users` (datos del paciente)
- `user_medications` (prescripciones)
- `medication_doses` (registro de tomas)
- `substance_consumption` (para interacciones)
- `interaction_alerts` (alertas generadas)

**Nuevas tablas (si son necesarias)**:
- `medications_catalog` (catálogo local de medicamentos, sincronizado con RAG/Graph)

### 4.2 Neo4j (Knowledge Graph)

**Nodos relevantes**:
- `:Medication` (catálogo + medicamentos del paciente)
- `:User` (paciente)
- `:Substance` (sustancias de abuso)
- `:Condition` (condiciones médicas/psiquiátricas)
- `:Symptom` (efectos secundarios, síntomas de withdrawal)
- `:Enzyme` (enzimas metabólicas CYP450)

**Relaciones que usa esta sección**:
- `(u)-[:TAKES]->(m)`
- `(m)-[:METABOLIZED_BY]->(e)`
- `(m)-[:INTERACTS_WITH]-(other)`
- `(m)-[:INTERACTS_WITH_SUBSTANCE]->(s)`
- `(m)-[:CAUSES]->(sympt)`
- `(u)-[:CONSUMES]->(s)`

### 4.3 Vector Store (RAG)

**Colecciones utilizadas**:
- `drug_labels` (fichas técnicas oficiales)
- `clinical_guidelines` (guías de práctica)
- `patient_education` (material educativo para pacientes)
- `research_papers` (literatura sobre interacciones)
- `faq_medications` (preguntas frecuentes)

Cada documento chunk tiene metadata para filtrado:
```json
{
  "type": "drug_label|guideline|education",
  "language": "es|en",
  "audience": "patient|professional",
  "topic": "interactions|side_effects|dosage|withdrawal"
}
```

---

## 5. Flujos de Usuario (User Journeys)

### 5.1 Añadir un Nuevo Medicamento

1. Usuario pulsa "Añadir medicamento"
2. Escribe nombre o escanea código de barras
3. Sistema **consulta grafo y RAG**:
   - Si encuentra en catálogo → sugiere datos (dosis típica, indicación)
   - Si no, usa RAG para extraer información del texto escrito
4. Usuario confirma o ajusta datos
5. Al guardar:
   - Crear relación `(u)-[:TAKES]->(m)` en grafo
   - Disparar evaluación de interacciones (graph query)
   - Mostrar alertas si las hay (con explicaciones)
6. Programar recordatorios según horario

### 5.2 Tomar Medicamento (Confirmación)

1. Notificación push: "Es hora de [medicamento]"
2. Usuario abre app y pulsa "Tomé"
3. Registrar `medication_dose` (taken=true, timestamp)
4. Actualizar grafo: `SET r.last_taken = now(), r.adherence_streak = ...`
5. Si es un patrón nuevo (ej: primera vez que omite), generar insight potencial (pero no molestar inmediatamente)

### 5.3 Revisar Adherencia

1. Usuario va a "Medicamentos" → pestaña "Historial"
2. Ve calendario con colores
3. Al pulsar un día, ve detalles (qué tomó, qué omitió)
4. Gráfico de adherencia últimos 30 días
5. Insights:
   - "Has omitido la dosis nocturna los viernes. ¿Por qué?"
   - "Tu adherencia mejoró desde que empezaste a tomar X con el desayuno."

### 5.4 Consultar Información

1. Usuario busca "¿Qué es la sertralina?"
2. Sistema usa `rag_search` con filtros: type=drug_label, audience=patient, language=es
3. Recupera fichas técnicas y educación para pacientes
4.Genera respuesta clara: "La sertralina es un antidepresivo ISRS que..."
5. Incluye sección "Efectos secundarios comunes" y "Advertencias"
6. Relaciona con medicamentos del usuario si aplica: "Como tomas X, ten en cuenta que..."

### 5.5 Responder a una Alerta

1. Usuario añade "Fluconazol" → sistema detecta interacción con "Sertralina"
2. Muestra alerta modal con:
   - Severidad (moderada)
   - Explicación: "El fluconazol puede aumentar los niveles de sertralina..."
   - mecanismo (CYP3A4 inhibition)
   - Acción recomendada: "Monitoriza efectos secundarios. Consulta a tu médico."
   - Botones: "Entendido", "Ver más información"
3. Alerta se guarda en `interaction_alerts` como no leída
4. Aparece badge en sección Medicamentos

---

## 6. Pantallas de la Sección

### 6.1 Lista de Medicamentos (Principal)
```
┌─────────────────────────────────────────┐
│  Medicamentos  (+)  🔔3                  │
├─────────────────────────────────────────┤
│ Hoy: 09:00 - Sertralina 50mg           │
│     21:00 - Naltrexona 50mg            │
│                                          │
│ Mañana: 08:00 - Fluconazol 150mg ⚠️     │
│                                          │
│ 📊 Adherencia: 78% (últimos 7 días)     │
│                                          │
│ 🎯 Insight: Has omitido la dosis...     │
└─────────────────────────────────────────┘
```

### 6.2 Detalle de Medicamento
```
┌─────────────────────────────────────────┐
│ Sertralina 50mg                         │
│ ⏰ Lunes, Miércoles, Viernes 08:00      │
│ 📅 Inicio: 15 ene 2025                 │
│ 💊 Dosis: 1 tableta                    │
│                                          │
│ 📋 Información                         │
│ • Para: depresión, ansiedad            │
│ • Familia: ISRS                        │
│ • Efectos secundarios comunes: náuseas │
│   (20%), insomnio (15%), diarrea (10%) │
│ • Advertencia: No mezclar con alcohol  │
│                                          │
│ 📈 Tu historial                        │
│ • Adherencia: 85%                      │
│ • Tomaste: 20/24 dosis                 │
│ • Última: ayer 08:15                  │
│                                          │
│ 📚 Artículos relacionados              │
│ • Cómo funciona un ISRS                │
│ • Manejar náuseas iniciales            │
└─────────────────────────────────────────┘
```

### 6.3 Calendario
```
   Febrero 2025
 Lu Ma Mi Ju Vi Sá Do
          1  2  3  4
  5  6  7  8  9 10 11
 12 13 14 15 16 17 18
 19 20 21 22 23 24 25
 26 27 28

Leyenda:
🟢 Todos los medicamentos tomados
🟡 Algunos omitidos
🔴 Todos omitidos
⚪ Sin medicamentos programados

Tap en un día → detalle
```

### 6.4 Alertas
```
⚠️ Interacción Detectada

Fluconazol + Sertralina

 Riesgo: Moderado

El fluconazol (antifúngico) puede aumentar los niveles
de sertralina en tu sangre hasta un 30-40%.

Esto podría causar:
• Náuseas más intensas
• Insomnio
• Riesgo (bajo) de síndrome serotoninérgico

 Recomendación:
• Monitoriza si tienes más efectos secundarios
• Considera consultar a tu médico para ajustar dosis
• Si es tratamiento corto (1-2 semanas), riesgo bajo

[Entendido] [Ver más información]
```

---

## 7. Cómo Usa la Arquitectura de Inteligencia Aumentada

La sección de medicamentos **consume** los servicios de la arquitectura, no los implementa.

### 7.1 Para Registro
- **RAG**: Autocompletado de nombres, sugerencia de dosis típica
- **Graph**: Verificar si el medicamento ya está registrado, obtener indicaciones

### 7.2 Para Alertas
- **Graph**: Consulta CYP450 interactions, contraindications
- **RAG**: Si interacción no en grafo, buscar en fichas técnicas
- **Orchestrator**: Combina ambas fuentes, genera explicación contextual

### 7.3 Para Educación
- **RAG**: Recuperar documentos educativos relevantes
- **Graph**: Filtrar por condiciones del paciente (ej: si tiene depresión, priorizar artículos sobre ISRS)
- **Orchestrator**: Adaptar lenguaje al nivel de comprensión (edad, etapa de cambio)

### 7.4 Para Insights
- **Graph**: Detectar patrones (adherencia vs síntomas, adherencia vs consumo)
- **RAG**: Obtener evidencia que respalde observaciones ("según estudios, la adherencia a ISRS mejora síntomas en 4-6 semanas")
- **Orchestrator**: Formular insight en lenguaje natural, no técnico

### 7.5 Para Dashboard
- **Graph**: Queries para estadísticas y proyecciones
- **RAG**: Añadir contexto educativo a gráficos ("¿Por qué importa la adherencia?")
- **Orchestrator**: Generar frases de resumen

---

## 8. Consideraciones de Seguridad y Privacidad

- **Disclaimers**: En cada pantalla: "Esta información es educativa. Consulta a tu médico."
- **Cifrado**: Datos de medicación igual que el resto de datos de salud (E2E, cifrado en reposo)
- **Control del paciente**:
  - Puede eliminar/modificar cualquier registro
  - Puede revocar acceso a familiares/profesionales en cualquier momento
  - Puede marcar ciertos medicamentos como "privados" (no visibles para familiares)
- **Validación clínica**: Todo contenido médico debe ser revisado por profesionales antes de implementación
- **Actualización de datos**: Catálogo de medicamentos se actualiza mensualmente desde fuentes oficiales

---

## 9. Roadmap de Implementación de la Sección

La sección de medicamentos **no tiene su propio roadmap**. Se implementa como parte de los sprints generales de KogniRecovery, usando las capacidades de la arquitectura de inteligencia aumentada.

**Dependencia**: La arquitectura de inteligencia (RAG+Graph) debe estar disponible antes de implementar esta sección de manera sofisticada.

**Plan**:
- **Sprint X (cuando arquitectura lista)**: Implementar registro básico + recordatorios + listado
- **Sprint X+1**: Integrar alertas (graph queries)
- **Sprint X+2**: Añadir educación (RAG)
- **Sprint X+3**: Insights automáticos (pattern analysis)
- **Sprint X+4**: Compartición con profesionales

---

## 10. Métricas de Éxito Específicas

- **% de usuarios que añaden al menos 1 medicamento**: objetivo >60%
- **Adherencia promedio** (usuarios activos): objetivo >75%
- **Alertas vistas vs. dismissadas**: ratio de engagement con alertas
- **Uso de educación**: clicks en artículos por usuario/semana
- **Exportaciones**: nº de PDFs generados (indicador de uso para consulta médica)
- **Satisfacción NPS** para la sección

---

## 11. Preguntas Abiertas

1. **¿Debe la sección de medicamentos estar disponible desde el MVP?**
   - **Recomendación**: No. El MVP prioriza chatbot, check-in, pared compartida, emergencias.
   - Esta sección añadirse en **Fase 2** (post-MVP), cuando la arquitectura de inteligencia esté madura.

2. **Quién puede añadir medicamentos?**
   - Inicialmente: solo el paciente (autoregistro)
   - Futuro: profesionales verificados (médicos/psiquiatras) pueden añadir/modificar con consentimiento

3. **Manejar medicamentos OTC (venta libre)?**
   - Sí, pero con un apartado separado y sin alertas de interacción tan estrictas (a menos que sean NSAIDs + anticoagulantes, etc.)

4. **Alertas de interacción con hierbas/suplementos?**
   - Sí, si están en la base de datos. Añadir campo "suplementos" en perfiles.

5. **Integración con farmacias?**
   - Fase avanzada: recordatorios de renovación, enlace con farmacia local para reposición

---

## 12. Relación con Otros Documentos

Este documento es **funcional** (qué hace la sección). Para detalles técnicos de **cómo** se implementa usando R+G, ver:

- `ARQUITECTURA_INTELIGENCIA_AUMENTADA.md` - Arquitectura general transversal
- `ESPECIFICACIONES_TECNICAS.md` - Stack general, bases de datos
- `MODULO_MEDICAMENTOS_KOGNITO_STYLE.md` (versión anterior) - Ya reemplazado por este enfoque

---

*Esta sección de KogniRecovery se alinea con la filosofía de Kognito AI LABS: usar IA para amplificar la capacidad humana de entender y gestionar su propia salud mental y tratamiento.*