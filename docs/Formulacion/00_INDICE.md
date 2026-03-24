# KogniRecovery - Índice del Proyecto

## 📋 Documentación Principal

### 📄 ESPECIFICACIONES.md
- Descripción general del producto
- Usuarios objetivo (paciente, familiar)
- Funcionalidades clave
- Consideraciones éticas, privacidad, accesibilidad
- Roadmap de producto (Fases 1-4)
- Preguntas abiertas

### 📄 ESPECIFICACIONES_TECNICAS.md
- Stack técnico completo (React Native, Node.js, PostgreSQL, Redis)
- APIs y endpoints detallados
- Modelo de datos relacional (SQL)
- Seguridad (cifrado, autenticación, autorización)
- Monitorización, CI/CD, DevOps
- Compliance (HIPAA/GDPR)

### 📄 ARQUITECTURA_INTELIGENCIA_AUMENTADA.md
**Fundacional**: Define la arquitectura transversal de KogniRecovery (RAG + Knowledge Graph + Orchestrator)
- Filosofía: IA como amplificación de la mente humana
- Stack técnico: Neo4j, Vector Store, LLM Orchestrator
- Cómo cada sección usa la arquitectura
- Principios: entendimiento profundo, reflexividad, memoria contextual
- Patrón: Context Enrichment + Reasoning

### 📄 SECCION_MEDICAMENTOS.md
**Especificación funcional** de la sección de gestión de medicamentos
- Objetivos: adherencia, educación, seguridad, historial
- Funcionalidades: registro, recordatorios, alertas, dashboard, educación
- Cómo usa la arquitectura de inteligencia aumentada
- Flujos de usuario y pantallas
- Integración con otras secciones (check-in, chatbot, dashboard)
- Métricas de éxito específicas
- Roadmap: se implementa cuando arquitectura ready (Fase 2+)

### 📁 ARQUITECTURA/GRAFOS/
**Documentación técnica del Knowledge Graph**

- `KG_SCHEMA.md` - Schema completo: nodos, relaciones, constraints, índices, migraciones
- `queries/` - Queries Cypher específicas por sección:
  - `QUERIES_INDEX.md` - Índice de todas las queries
  - `checkin_insights.cypher` - Insights post check-in (15 queries)
  - `dashboard_widgets.cypher` - Widgets del dashboard (15 queries)
  - `alert_interactions.cypher` - Sistema de alertas (12 queries)
  - `chatbot_context.cypher` - Contexto para LÚA (15 queries)
  - `medication_section.cypher` - Sección de medicamentos (16 queries)

---

## 🤖 Agente Codificador - Prompts Detallados por Fase

### 📄 AGENT_CODIFICADOR_PROMPTS.md
**Prompts específicos para sub-agente codificador** (one-shot por fase)
- Prompt 0: Setup y análisis
- Prompt 1: Infraestructura KG (Neo4j, migraciones)
- Prompt 2: Catálogo de medicamentos (ingestión)
- Prompt 3: Sincronización event-driven (PostgreSQL ↔ Neo4j)
- Prompt 4: Pipeline RAG (vector store, embeddings)
- Prompt 5: Herramientas core (query_kg, rag_search, enhanceWithKnowledge)
- Prompt 6: Integración Chatbot LÚA
- Prompt 7: Dashboard y widgets
- Prompt 8: Check-in y generación de insights
- Prompt 9: Sección Medicamentos completa
- Prompt 10: Testing, validación y deploy

Cada prompt incluye: contexto, objetivo, entregables, especificaciones, criterios de éxito, restricciones.
Diseñado para construir la aplicación fase por fase de manera autónoma.

---

## 🎯 Documentos de Diseño y UX

### 📄 PERSONAS.md
- Perfiles detallados de usuarios (3 personas principales)
- Contexto, necesidades, motivaciones, frustrations

### 📄 FLUJOS_ONBOARDING.md
- Procesos de registro por rol
- Screenshots conceptuales
- Validaciones y errores

### 📄 UI_DASHBOARD_PRINCIPAL.md
- Dashboard del paciente
- Widgets: estado emocional, check-in, pared compartida, chatbot

### 📄 UI_DASHBOARD_FAMILIAR.md
- Vista del familiar/cuidador
- Información agregada, señales de apoyo

### 📄 UI_CHATBOT.md
- Interfaz de chat (LÚA)
- Historial, botones rápidos, recursos

### 📄 UI_CHECKIN_DIARIO.md
- Formulario de registro diario
- Escalas, selecciones, free text

### 📄 UI_EMERGENCIA.md
- Pantalla de crisis
- Botones de llamada, recursos, protocolos

### 📄 UI_CONFIG_EMERGENCIA_PRIVACIDAD.md
- Configuración de contactos de emergencia
- Ajustes de privacidad y compartición

---

## 💬 IA y Contenido Conversacional

### 📄 PROMPT_SISTEMA_BASE.md
**LÚA**: Identidad, principios éticos, técnicas terapéuticas (CBT, MI, DBT)
Protocolos de detección de riesgo, manejo de crisis, tono por edad/género

### 📄 PROMPTS_POR_PERFIL.md
- Prompts específicos para cada perfil de usuario
- Adaptaciones por edad, género, sustancia principal

### 📄 ESCENARIOS_CONVERSACIONALES.md
- Diálogos de ejemplo para 10+ escenarios
- Respuestas a preguntas frecuentes
- Manejo de objeciones

---

## 🗂️ Estructura de Archivos

```
proyectos/KogniRecovery/
├── ARQUITECTURA_INTELIGENCIA_AUMENTADA.md  🆕
├── SECCION_MEDICAMENTOS.md                🆕
├── ESPECIFICACIONES.md
├── ESPECIFICACIONES_TECNICAS.md
├── PERSONAS.md
├── PROMPT_SISTEMA_BASE.md
├── PROMPTS_POR_PERFIL.md
├── ESCENARIOS_CONVERSACIONALES.md
├── FLUJOS_ONBOARDING.md
├── UI_DASHBOARD_PRINCIPAL.md
├── UI_DASHBOARD_FAMILIAR.md
├── UI_CHATBOT.md
├── UI_CHECKIN_DIARIO.md
├── UI_EMERGENCIA.md
└── UI_CONFIG_EMERGENCIA_PRIVACIDAD.md
```

---

## 🏗️ Estado del Proyecto (13 feb 2025)

✅ **Completado**:
- [x] Documentación de especificaciones completa
- [x] Especificaciones técnicas detalladas
- [x] Sistema conversacional LÚA (prompts, escenarios)
- [x] Diseño de UX (UI de todas las pantallas)
- [x] **Arquitectura de Inteligencia Aumentada** definida (RAG+Grafos transversal)
- [x] **Sección Medicamentos** especificada (usa arquitectura, no la define)
- [x] Agente OpenClaw `salud-mental` configurado
- [x] Branding: nombre `KogniRecovery` definido

⏳ **Pendiente**:
- [ ] Validación clínica con profesionales (farmacéutico, psiquiatra)
- [ ] Recopilar bases de datos de medicamentos (FDA, ANMAT, AEMPS) para catálogo inicial
- [ ] Diseño detallado de UI para pantallas de medicamentos
- [ ] Implementación de arquitectura de inteligencia (Sprint 1)
- [ ] Implementación de la sección de medicamentos (Depende de arquitectura)
- [ ] Script de importación de datos farmacológicos
- [ ] Implementación de backend (MVP)
- [ ] Testing con usuarios reales

---

## 🎯 Decisiones Clave Tomadas

1. **Nombre**: KogniRecovery (alineado con Kognito AI LABS)
2. **Arquitectura de inteligencia**: RAG + Knowledge Graph (Neo4j) como infraestructura transversal, no como módulos separados
3. **Sección de medicamentos**: Funcionalidad que consume la arquitectura, no define su propia arquitectura
4. **Base de datos medicamentos**: Offline-first, actualizable mensualmente desde fuentes públicas (FDA, AEMPS, ANMAT)
5. **Control de privacidad**: Paciente decide qué compartir; familiares ven solo agregados por defecto
6. **Interacciones**: Evaluadas en tiempo real usando Knowledge Graph + RAG
7. **Chatbot LÚA**: Integrado con arquitectura, usa herramientas para consultar Graph y RAG
8. **Explicabilidad**: Cada alerta incluye fuente y mechanismo; niveles de confianza
9. **MVP scope**: No incluye sección de medicamentos (se añade en Fase 2, después de arquitectura ready)

---

## 📚 Referencias Externas Relevantes

- FDA Open API: https://open.fda.gov/apis/drug/
- AEMPS (España): https://www.aemps.gob.es/
- ANMAT (Argentina): https://www.argentina.gob.ar/anmat
- WHO ATC/DDD: https://www.whocc.no/atc_ddd_index/
- NIDA: https://nida.nih.gov/
- SAMHSA: https://www.samhsa.gov/

---

*Documento vivo. Actualizado: 13 feb 2025*