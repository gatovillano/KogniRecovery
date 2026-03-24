# Arquitectura de Inteligencia Aumentada - KogniRecovery

## 1. Filosofía: IA como Amplificación Humana

**Kognito AI LABS** no construye apps con "features de IA". Construye apps donde la IA es **infraestructura cognitiva** que aumenta la capacidad de los usuarios para:

1. **Pensar** (reflexividad sobre su propio estado y decisiones)
2. **Recordar** (memoria externa confiable y contextual)
3. **Conectar** (ver patrones y relaciones que el cerebro humano pasaría por alto)
4. **Decidir** (con información más completa y understanding profundo)

> "No reemplazamos la mente humana. La extendemos."

---

## 2. Principios Transversales

### 2.1 Entendimiento Profundo (Deep Understanding)
- La IA no solo procesa texto, sino que **comprende relaciones semánticas y causales**
- Usa grafos de conocimiento para modelar el mundo (farmacológico, psicológico, social)
- Cada respuesta se basa en múltiples fuentes de conocimiento integradas

### 2.2 Reflexividad (Reflexivity)
- El sistema puede **razonar sobre su propio razonamiento**
- Proporciona **explicabilidad**: no solo "qué", sino "por qué" y "cómo lo sé"
- Muestra **niveles de confianza** y **fuentes** de cada afirmación
- Aprende del **feedback** del usuario para ajustar su razonamiento

### 2.3 Memoria Contextual (Contextual Memory)
- RAG (Retrieval-Augmented Generation) accede a conocimiento actualizado **en contexto**
- Grafos mantienen **memoria estructural** de relaciones entre entidades
- El historial del usuario se integra como **nodos y edges** en el grafo personal
- La IA recuerda conversaciones pasadas y las usa para personalizar respuestas

### 2.4 Presencia Inteligente (Intelligent Presence)
- La IA está **discreta pero disponible** en cada pantalla
- No es solo un "chatbot", sino un **co-piloto cognitivo** que:
  - Sugiere insights en dashboards
  - Advierte riesgos en check-ins
  - Recomienda acciones en emergencias
  - Enriquece educación con contexto personal

---

## 3. Arquitectura Técnica: El "Cerebro" de KogniRecovery

### 3.1 Componentes Centrales (Transversales)

```
┌─────────────────────────────────────────────────────────────┐
│                    KOGNIRECOVERY                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Knowledge Graph Layer (Neo4j)              │   │
│  │  • Pacientes, Medicamentos, Condiciones            │   │
│  │  • Sustancias, Síntomas, Enzimas, Receptores       │   │
│  │  • Relaciones dinámicas (historico del paciente)   │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │ Cypher queries                    │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │         RAG Layer (Vector Store)                   │   │
│  │  • Fichas técnicas, guías clínicas                │   │
│  │  • Literatura médica, estudios                    │   │
│  │  • Contenido educativo (psicoeducación)            │   │
│  │  • Respuestas a preguntas frecuentes              │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │ Retrieved context                │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │        Orchestrator (LLM Agent)                    │   │
│  │  • Planificación de reasoning                     │   │
│  │  • Tool calling (query_kg, rag_search, analyze)   │   │
│  │  • Generación de explicaciones                    │   │
│  │  • Evaluación de confianza                        │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │ Context + Reasoning              │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │         Application Layer (Todas las pantallas)    │   │
│  │  • Chatbot (LÚA)                                 │   │
│  │  • Dashboard (paciente, familiar)                 │   │
│  │  • Check-in Diario                                │   │
│  │  • Alertas de Crisis                              │   │
│  │  • Registro de Medicamentos                       │   │
│  │  • Educación                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Leyenda**: Toda la aplicación converge en el **Orchestrator + Knowledge Infrastructure** (RAG + Graph).

### 3.2 Flujo de Información

Cada interacción del usuario pasa por:

1. **Captura** (pantalla específica)
2. **Interpretación** (qué tipo de evento es: check-in, pregunta, registro)
3. **Enriquecimiento** (query a RAG y/o Graph según contexto)
4. **Razonamiento** (LLM integra datos personales + conocimiento general)
5. **Generación** (respuesta, alerta, insight, sugerencia)
6. **Persistencia** (actualizar Graph con nueva información)

---

## 4. Aplicación Transversal por Módulo

### 4.1 Chatbot (LÚA) - Already RAG+Graph Enhanced

**Sin arquitectura**:
- Respuestas genéricas basadas en prompt estático
- No recuerda historia más allá de ventana de contexto
- No conoce medicamentos específicos del usuario

**Con arquitectura**:
- Cada pregunta dispara `rag_search()` para info actualizada
- Consulta `query_kg()` para datos personales (medicamentos actuales, condiciones)
- Genera respuesta **contextualizada**: "Basándome en que tomas [medicamento X] para [condición Y], y considerando que también reportaste [síntoma Z], sugiero..."
- Recuerda conversaciones anteriores (nodos en grafo: `HAS_EXPERIENCE_WITH`)

### 4.2 Check-in Diario - Beyond Simple Form

**Sin arquitectura**:
- Formulario con escalas y preguntas
- Datos guardados en tablas SQL
- Estadísticas básicas (promedios)

**Con arquitectura**:
- Cada check-in actualiza el grafo personal (`HAS_SYMPTOM`, `REPORTS_CRAVING`, `ADHERENCE_TO_MEDICATION`)
- Después de completar, **insight generado automáticamente**:
  ```
  Análisis de tu check-in:
  • Hoy reportaste ansiedad alta (8/10)
  • Omitiste la dosis matutina de sertralina
  • Consumiste alcohol (2 cervezas)

  Patrón detectado: Los días que bebes alcohol, la adherencia a sertralina baja 60%.
  Posible relación: el alcohol afecta tu rutina matutina.

  Sugerencia: Considera tomar la sertralina la noche anterior si sabes que beberás al día siguiente.
  ```
- **Correlaciones automáticas** (graph queries):
  - "¿Hay relación entre tus cravings y la omisión de medicación?"
  - "¿Qué emociones preceden a los días que consumes?"

### 4.3 Dashboard - From Statistics to Insights

**Sin arquitectura**:
- Widgets con porcentajes y gráficos
- Datos frios

**Con arquitectura**:
- Cada widget powered by **graph queries**:
  - **Widget "Riesgo actual"**: resultados de `MATCH (p)-[:TAKES]->(med)-[i:INTERACTS_WITH]-(subst:Substance) WHERE p.id = ... RETURN i.severity`
  - **Widget "Patrón de la semana"**: `"Has consumido alcohol 3 veces. En esas ocasiones, la adherencia a tu medicamento nocturno fue 40% menor."`
  - **Widget "Próximos riesgos"**: Predicción basada en tendencias ("Tu adherencia está decayendo. Riesgo de recaída en 7-10 días si continúa la tendencia.")
- **Mini-grafo visual**: muestra al paciente, sus medicamentos, interacciones, sustancias consumidas, síntomas frecuentes (nodos y aristas coloreados por severidad)
- **Insight del día** (generado por LLM): Frase reflexiva basada en el estado actual del grafo

### 4.4 Alertas de Crisis - Context-Aware Emergency Detection

**Sin arquitectura**:
- Detección por palabras clave ("suicidio", "matarme")
- Alertas genéricas

**Con arquitectura**:
- **Multi-signal fusion**:
  1. Texto del chat (NLP + palabras clave)
  2. Check-in reciente (estado emocional, consumo)
  3. Patrones del grafo (historial de crisis, intentos previos)
  4. Medicamentos actuales (efectos secundarios, withdrawal risks)
- **Evaluación de riesgo contextual**:
  ```
  Paciente A: say "no quiero vivir" + check-in hoy: ánimo 2/10 + omitió medicamento antidepresivo 3 días + historial: intento 6 meses
  → Riesgo: ALTO (combinación de factores)

  Paciente B: say "no quiero vivir" + check-in: ánimo 6/10 + tomar medicación al día + sin historial
  → Riesgo: MODERADO (grito de ayuda, pero estable)
  ```
- **Respuesta diferenciada**:
  - Alta: botón grande "Llamar línea 988", notificar contacto emergencia
  - Moderada: ofrecer terapia urgente, preguntar si tiene plan
- **Explicabilidad**: "Estoy preocupado porque mencionaste [X], y veo que has estado omitiendo tu medicamento. La combinación aumenta el riesgo. ¿Quieres hablar con alguien ahora?"

### 4.5 Educación Psicoeducativa - Personalized Learning

**Sin arquitectura**:
- Biblioteca de artículos estáticos
- Todos ven lo mismo

**Con arquitectura**:
- **RAG personalizado**: Al buscar "ansiedad", el sistema:
  1. Recupera artículos generales sobre ansiedad
  2. Filtra/funde con medicamentos del paciente (si toma ansiolíticos, incluye info sobre ellos)
  3. Considera etapa de cambio (si está en "precontemplación", tono no confrontacional)
  4. Considera historial de consumo (si usa cannabis, incluye riesgos específicos)
- **Recomendaciones automáticas**:
  - "Has reportado insomnio 4 días seguidos. Artículo recomendado: 'Cómo la medicación y el sueño se afectan mutuamente'"
  - "Noté que estás en la etapa de 'preparación'. Te puede interesar: 'Planificación de metas SMART para la recuperación'"
- **Seguimiento de comprensión**: Después de leer, preguntar "¿Te quedó claro? ¿Preguntas?" y actualizar grafo con feedback

### 4.6 Pared Compartida - Safe Communication with AI Augmentation

**Sin arquitectura**:
- Mensajes de texto planos
- Solo lo que el paciente decide compartir

**Con arquitectura**:
- **Sugerencias de apoyo inteligentes**:
  - Familiar: "¿Qué puedo escribirle hoy?"
  - IA sugiere basado en:
    - Último check-in del paciente (estado emocional)
    - Patrones de apoyo que funcionaron antes
    - Etapa de cambio del paciente
  - Ejemplo: "Ayer reportó alta ansiedad. Podrías enviar: '¿Cómo estás hoy? Pienso en ti.' O un emoji de apoyo ❤️"
- **Moderación asistida**:
  - IA detecta mensajes potencialmente dañinos (ej: "Si no dejas eso, te vas a quedar solo")
  - Advierte al familiar: "Este mensaje podría sonar amenazante. ¿Quieres reformular?"
- **Traducción de emociones**:
  - Paciente escribe: "estoy bien" (pero grafo muestra: omitió medicamento + consumió alcohol)
  - IA sugiere al familiar: "Parece que dice 'bien', pero su actividad sugiere lo contrario. Podrías preguntar específicamente cómo se siente."

### 4.7 Integración con Profesionales - Clinical Decision Support

**Sin arquitectura**:
- Paciente puede compartir reportes manuales
-profesional ve datos estáticos

**Con arquitectura**:
- **Reporte generado automáticamente para terapeuta**:
  - No solo datos crudos, sino **insights**:
    ```
    Observaciones del período [fecha]:
    • Adherencia a medicación: 65% (objetivo >80%)
    • Patrón: omisiones concentradas en fines de semana
    • Correlación: días con craving intenso (>7/10) tienen 80% probabilidad de omitir dosis nocturna
    • Consumo de sustancia: alcohol 2x/semana, asociado con días de estrés laboral
    • Síntomas más reportados: ansiedad, insomnio
    • Tendencia: empeoramiento de sueño en últimos 10 días
    ```
- **Alertas para el profesional**:
  - "Tu paciente ha tenido 3 días seguidos con craving >8/10. Considera ajustar plan de coping."
- **Recomendaciones basadas en evidencia** (RAG sobre guías clínicas): "Para pacientes con depresión + SUD y baja adherencia, NICE guidelines sugieren intervención breve cada 2 semanas."

---

## 5. Modelo de Datos Unificado (Graph-Centric)

### 5.1 PostgreSQL (Transaccional)
Mantiene tablas relacionales para:
- Autenticación, permisos
- Datos estructurados (dosis, horarios, check-ins)
- Logs de eventos

### 5.2 Neo4j (Knowledge Graph + Personal Memory)
**Toda la "inteligencia" reside aquí**.

Nodos principales:
```cypher
(:User {id, age, stage_of_change, primary_substance, ...})
(:Medication {id, generic_name, atc_code, metabolism_enzymes, ...})
(:Substance {id, name, class, receptor_affinity, ...})
(:Condition {id, name, category})
(:Symptom {id, name})
(:Knowledge {id, type, content, embedding_id})  // Nodos de conocimiento RAG
(:Interaction {id, severity, mechanism, evidence})  // Relaciones precalculadas
(:Event {timestamp, type, details})  // Eventos importantes (crisis, cambios)
```

Relaciones dinámicas (personal):
```cypher
(u:User)-[:TAKES]->(m:Medication)
(u)-[:HAS_CONDITION]->(c:Condition)
(u)-[:REPORTS_SYMPTOM]->(s:Symptom)
(u)-[:CONSUMES]->(sub:Substance)
(u)-[:HAS_EXPERIENCE]->(e:Event)
```

Relaciones estáticas (conocimiento general):
```cypher
(m)-[:METABOLIZED_BY]->(enz:Enzyme)
(m)-[:TREATS]->(c:Condition)
(m)-[:INTERACTS_WITH]-(other:Medication)
(m)-[:INTERACTS_WITH_SUBSTANCE]->(sub:Substance)
(m)-[:CAUSES]->(s:Symptom)
```

### 5.3 Vector Store (RAG)
Colección de "Knowledge Chunks":
- Cada chunk tiene: `content`, `embedding`, `metadata` (tipo, fuente, fecha)
- Tipos: `drug_label`, `clinical_guideline`, `patient_education`, `research_paper`, `faq`
- Metadata permite filtering: `language=es`, `audience=patient`, `topic=interacciones`

---

## 6. API de Razonamiento: Cómo Cada Módulo Usa la Arquitectura

### 6.1 Patrón General: Context Enrichment + Reasoning

```javascript
async function enhanceWithKnowledge(userId, context, queryType) {
  // 1. Obtener contexto personal del grafo
  const personalGraph = await neo4j.query(`
    MATCH (u:User {id: $userId})
    OPTIONAL MATCH (u)-[r:TAKES]->(m:Medication)
    OPTIONAL MATCH (u)-[:HAS_CONDITION]->(c:Condition)
    OPTIONAL MATCH (u)-[:CONSUMES]->(s:Substance)
    RETURN m, c, s, r
  `, {userId});

  // 2. Obtener conocimiento relevante (RAG)
  const knowledgeChunks = await vectorSearch(queryType, context.text);

  // 3. Construir prompt para LLM con:
  //    - Contexto de la app (qué pantalla, qué está haciendo el usuario)
  //    - Datos personales del grafo
  //    - Knowledge chunks (con citations)
  //    - Instrucciones específicas por módulo
  const prompt = buildPrompt({
    module: queryType,  // 'chat', 'checkin', 'dashboard', 'alert'
    userContext: context,
    personalGraph,
    knowledgeChunks,
    instructions: getInstructionsForModule(queryType)
  });

  // 4. LLM reasoning con tool calling si es necesario
  const response = await llm.generate(prompt, {
    tools: availableToolsFor(queryType)  // query_kg, rag_search, analyze_pattern, etc.
  });

  // 5. Devolver respuesta enriquecida
  return {
    text: response.text,
    sources: response.citations,
    confidence: response.confidence,
    suggestedActions: response.actions,
    graphUpdates: response.graphUpdates  // Si hay que modificar el grafo
  };
}
```

### 6.2 Ejemplo: Check-in Diario

**Evento**: Usuario completa check-in: estado emocional 3/10, reporta ansiedad, omite medicamento.

**Procesamiento**:
1. Guardar datos en PostgreSQL (`checkins` table)
2. Actualizar grafo:
   ```cypher
   MERGE (u:User {id: ...})-[:REPORTS_SYMPTOM {intensity:3, date: date()}]->(:Symptom {name: 'ansiedad'})
   MERGE (u)-[:HAS_ADHERENCE_EVENT {medication_id: X, date: date(), taken: false}]->(m:Medication)
   ```
3. `enhanceWithKnowledge(userId, {type: 'checkin_analysis'}, 'checkin_insight')`
4. LLM recibe:
   ```
   Contexto: Paciente en etapa de 'contemplación', diagnóstico: trastorno ansiedad, medicamento: sertralina 100mg.
   Evento: hoy reporta ansiedad alta (3/10) y omitió dosis matutina de sertralina.
   Historial: 3 de los últimos 5 días omitió dosis matutina; en esos días, ansiedad promedio 5/10 vs 2/10 cuando toma.
   Knowledge: La sertralina tarda 4-6 semanas en efecto completo; omisiones frecuentes pueden causar síntomas de abstinencia (ansiedad rebound).
   ```
5. LLM genera insight:
   ```
   📊 Insight de tu check-in:

   Has omitido tu sertralina esta mañana, y reportas ansiedad alta (3/10).

   Patrón observado: Los días que omites la dosis matutina, tu ansiedad aumenta. Esto puede deberse a que la sertralina necesita niveles estables en sangre para funcionar. Omitir dosis causa fluctuaciones que pueden empeorar la ansiedad temporalmente.

   Sugerencia: Considera tomar la sertralina con el desayuno para crear un hábito. Si las omisiones continúan, hablemos de ajustes con tu médico.

   ¿Quieres que te muestre datos de esta correlación?
   ```

### 6.3 Ejemplo: Pregunta en Chatbot

**Evento**: "¿Por qué me siento tan ansioso cuando dejo el alcohol?"

**Procesamiento**:
1. `enhanceWithKnowledge(userId, {text: pregunta}, 'chat_response')`
2. LLM recibe:
   ```
   Contexto chat: usuario pregunta sobre ansiedad al dejar alcohol.
   Datos personales: Paciente consume alcohol 3-4 veces/semana, diagnosticado con GAD, toma lorazepam PRN.
   Knowledge chunks (RAG):
     - Artículo: "Alcohol withdrawal anxiety: mechanisms and management"
     - Guía clínica: "Management of comorbid anxiety and alcohol use disorder"
     - FAQ: "Can alcohol cause anxiety the next day?"
   Grafo: lorazepam (benzodiacepina) se metaboliza por CYP3A4; alcohol es depresor del SNC; interacción = sedación excesiva, pero abstinencia causa hiperexcitabilidad.
   ```
3. LLM genera respuesta personalizada:
   ```
   La ansiedad que sientes al reducir o dejar el alcohol es muy común y tiene varias causas:

   1. **Neuroadaptación**: El alcohol es un depresor del sistema nervioso. Tu cerebro se adapta aumentando la actividad de los sistemas excitatorios para compensar. Cuando dejas el alcohol, esa hiperactividad se manifiesta como ansiedad.

   2. **Hipoglucemia**: El alcohol afecta el metabolismo de la glucosa. Al dejarlo, pueden haber fluctuaciones de azúcar que causan nerviosismo.

   3. **Interacción con tu medicación**: Noté que tomas lorazepam ocasional. Si lo estás usando para manejar la ansiedad del withdrawal, ten cuidado: combinarlo con alcohol (aunque ahora bebas menos) puede ser peligroso por efecto sinérgico depresor.

   **Recomendaciones**:
   - La ansiedad del withdrawal suele mejorar en 1-2 semanas a medida que tu sistema nervioso se re-equilibra.
   - Técnicas de respiración diafragmática pueden ayudar a calmar la respuesta de ansiedad aguda.
   - Considera hablar con tu psiquiatra sobre ajustar tu medicación durante el periodo de desintoxicación.

   ¿Te gustaría que te muestre técnicas de respiración específicas para la ansiedad?
   ```

---

## 7. Tooling: Extension Points para Todo el Sistema

Cada módulo puede usar un set de **herramientas** (tools) que abstraen el acceso a RAG y Graph:

### Herramientas Comunes

```json
{
  "tools": {
    // RAG
    "rag_search": {
      "description": "Buscar conocimiento en base de datos médica/educativa",
      "params": {
        "query": "string",
        "filters": { "type": ["drug_label", "guideline"], "language": "es" },
        "max_results": 5
      }
    },
    "rag_get_document": {
      "description": "Obtener documento completo por ID",
      "params": { "doc_id": "string" }
    },

    // Graph
    "query_kg": {
      "description": "Consultar el grafo de conocimiento personal y general",
      "params": {
        "cypher": "string",
        "params": "object"
      }
    },
    "update_kg": {
      "description": "Añadir nodos/relaciones al grafo personal",
      "params": {
        "operations": [{
          "type": "create_relation",
          "from_id": "uuid",
          "to_id": "uuid",
          "relation_type": "string",
          "properties": {}
        }]
      }
    },

    // Análisis
    "analyze_pattern": {
      "description": "Detectar patrones en datos del paciente (adherencia, síntomas, consumo)",
      "params": {
        "pattern_type": "adherence_correlation|symptom_trend|risk_factor",
        "time_range": "7d|30d|90d"
      }
    },
    "predict_risk": {
      "description": "Predecir riesgo de recaída/emergencia basado en tendencias",
      "params": {
        "risk_type": "relapse|overdose|suicide",
        "horizon_days": 7
      }
    },

    // Generación
    "generate_explanation": {
      "description": "Generar explicación comprensible de un hallazgo técnico",
      "params": {
        "finding": "object",
        "audience": "patient|family|professional",
        "detail_level": "simple|detailed"
      }
    }
  }
}
```

Cada módulo usa un subset de estas herramientas.

---

## 8. Roadmap de Implementación de la Arquitectura

### Fase 0: Fundación (Sprint 1-2)
- [ ] Infraestructura:
  - Docker compose con PostgreSQL + Neo4j + pgvector/Qdrant
  - Pipeline de ingestión de datos (FDA, AEMPS, etc.) → Graph + Vector Store
  - Sincronización event-driven (PostgreSQL triggers → Neo4j)
- [ ] Graph schema completo (nodos y relaciones)
- [ ] RAG corpus inicial (10k+ documentos en español)

### Fase 1: Capacidades Básicas (Sprint 3-4)
- [ ] Implementar `enhanceWithKnowledge()` core
- [ ] Integrar en Chatbot (LÚA) - tool calling básico
- [ ] Integrar en Check-in - generación de insights post-submit
- [ ] Dashboard básico con 2-3 insights generados
- [ ] Sistema de alertas simple (grafo queries)

### Fase 2: Inteligencia Avanzada (Sprint 5-6)
- [ ] Patrón de adherencia detección automática
- [ ] Correlación síntomas-medicamento-consumo
- [ ] Predicción de riesgo (algoritmos estadísticos simples)
- [ ] RAG específico por perfil (paciente vs familiar vs profesional)
- [ ] Multi-turn reasoning (conversaciones largas con memoria)

### Fase 3: Reflexividad y Explicabilidad (Sprint 7-8)
- [ ] Niveles de confianza en cada output
- [ ] Traceabilidad completa (sources, graph paths)
- [ ] Feedback loop: usuario puede marcar "útil/no útil" cada insight
- [ ] Ajuste automático de thresholds basado en feedback
- [ ] "Show your work" - usuario puede ver cómo se generó una alerta

### Fase 4: Optimización y Escala (Sprint 9+)
- [ ] Caching inteligente (Redis)
- [ ] Batch graph updates para no saturar Neo4j
- [ ] Query optimization (índices, APOC procedures)
- [ ] Monitoring: latencia RAG, Graph query times, token usage
- [ ] A/B testing de prompts y thresholds

---

## 9. Ventajas Competitivas de Este Enfoque

### 9.1 Diferencia vs. "Chatbot + Database"

| Dimensión | Enfoque Tradicional | KogniRecovery (RAG+Graph) |
|-----------|---------------------|---------------------------|
| **Contexto** | Solo últimos mensajes | Historial completo como grafo |
| **Conocimiento** | Prompt estático o búsqueda simple | RAG con fuentes actualizadas |
| **Razonamiento** | Pattern matching | Inferencia causal (graph traversal) |
| **Personalización** | Basada en perfil estático | Basada en historial dinámico y patrones |
| **Explicabilidad** | Black box | Traceable: "Porque X, según Y, considerando Z" |
| **Aprendizaje** | No aprende de la sesión | Grafo se enriquece con cada interacción |
| **Transversalidad** | Feature aislado | Infraestructura compartida por todos los módulos |

### 9.2 Por qué es "Inteligencia Aumentada"

- **Amplifica la memoria**: El grafo recuerda todo lo que el usuario ha hecho/dicho/reportado, y extrae patrones que el usuario no vería.
- **Amplifica el razonamiento**: LLM + Graph pueden inferir conexiones no obvias (ej: "Cuando omites X, sientes Y porque Z").
- **Amplifica la reflexión**: Insights generados empujan al usuario a pensaren sus propios patrones.
- **Amplifica la toma de decisiones**: Recomendaciones basadas en evidencia personalizada, no genérica.

---

## 10. Consideraciones de Implementación

### 10.1 Costos
- LLM calls: cachear respuestas idénticas (Redis), usar modelos más baratos (Step, Claude Haiku) para tareas simples
- Neo4j: Aura free tier o self-hosted; índices bien diseñados para queries rápidas
- Vector store: pgvector si ya usas PostgreSQL; limitar embeddings a texto relevante

### 10.2 Privacidad
- Graph data personal: cifrado en reposo
- RAG corpus: solo fuentes públicas (no datos de otros usuarios)
- On-device processing posible para grafos pequeños (SQLite + graph lib)

### 10.3 Validación Clínica
- Cada regla de inferencia debe ser revisada por experto clínico
- "Insights" son sugerencias, no diagnósticos
- Disclaimers claros: "Basado en tus datos, he observado X. Consulta a tu médico."

### 10.4 Performance
- Graph queries: <200ms críticos (alertas), <1s aceptable (insights)
- RAG retrieval: <500ms
- LLM generación: <2s para respuestas, <5s para análisis profundos
- Caching de resultados frecuentes (mismos pacientes, mismas preguntas)

---

## 11. Ejemplo End-to-End: Un Día con KogniRecovery

**Mañana**:
- Usuario abre app → Dashboard muestra "Insight del día": "Ayer omitiste tu dosis de naltrexona después de beber. Considera tomarla antes de beber next time." (generado por pattern analysis del grafo)

**Check-in**:
- Reporta: ánimo 4/10, ansiedad, omitió medicamento, consumió alcohol.
- Sistema actualiza grafo, detecta correlación, genera:
  ```
  🔍 Observación:
  Has omitido la sertralina los 3 días que has bebido alcohol esta semana.
  La sertralina necesita estabilidad para ser efectiva. El alcohol puede afectar su absorción y metabolismo.
  ¿Quieres ajustar tu horario de toma para que sea más consistente?
  ```

**Chat**:
- Pregunta: "¿Puedo tomar CBD con mi medicamento?"
- Sistema:
  1. `query_kg`:obtiene medicamentos actuales (sertralina, naltrexona)
  2. `rag_search`:busca "cannabidiol drug interactions SSRI opioid"
  3. LLM sintetiza: "El CBD puede aumentar los niveles de sertralina (ambos metabolizados por CYP3A4). Con naltrexona no hay interacción conocida. Empieza con dosis baja y monitorea somnolencia."
  4. Respuesta con citations: "Según un estudio en Journal of Clinical Psychopharmacology (2022)..."

**Tarde**:
- Familiar ve dashboard: "Tu familiar ha reportado ansiedad alta 3 días seguidos. Podrías preguntarle cómo puedes apoyar."
- Familiar envía mensaje de apoyo sugerido por IA.

**Noche**:
- Sistema detecta que el usuario no ha confirmado dosis nocturna (recordatorio enviado, sin respuesta).
- Alerta en dashboard: "Has olvidado tu sertralina de las 9pm. ¿Todo bien?"

**Crisis** (si ocurre):
- Usuario escribe en chat: "no puedo más"
- Sistema evalúa: historial de intentos + omitió medicamento 2 días + estado emocional bajo reciente → ALERTA ALTA
- Muestra: "Línea de危机 988" grande, botón "Llamar ahora", y notifica contacto de emergencia autorizado.

---

## 12. Conclusión

Esta **Arquitectura de Inteligencia Aumentada** no es un "módulo", es la **columna vertebral** de KogniRecovery. Cada pantalla, cada interacción, cada notificación está enriquecida por:

1. **Conocimiento estructurado** (grafos)
2. **Conocimiento actualizado** (RAG)
3. **Razonamiento contextual** (LLM)
4. **Memoria personal** (grafo del paciente)
5. **Explicabilidad** (traceability)

Resultado: Una app que no solo recolecta datos, sino que **piensa con el usuario**.

---

## Apéndice: Comparación con Módulo Aislado

**Antes (módulo separado)**:
```
[App] -----> [Módulo Medicamentos] (RAG+Graph solo aquí)
   |
   +----> [Chatbot] (IA básica)
   +----> [Dashboard] (estadísticas)
```

**Ahora (arquitectura transversal)**:
```
                    [RAG + Graph + Orchestrator]
                           ↑        ↑
[App todas pantallas] ──────┼────────┼───── (comparten inteligencia)
                           ↓        ↓
                    [Contexto personal + conocimiento]
```

**Ventaja**: Economía de escala de conocimiento. Inviertes una vez en RAG+Graph, y **toda la app** se beneficia.

---

## Próximos Pasos Técnicos

1. Aprobar esta arquitectura con el equipo
2. Elegir tech stack específico (Neo4j vs. alternative, pgvector vs Qdrant)
3. Diseñar schema Cypher completo (apéndice B)
4. Crear pipeline de ingestión de datos inicial (FDA, etc.)
5. Implementar core `enhanceWithKnowledge()` function
6. Integrar progresivamente en cada módulo (empezar por Chatbot y Dashboard)

---

*Este documento define la visión técnica de Kognito AI LABS para KogniRecovery. Todos los módulos deben alinearse con esta arquitectura.*