# Prompts para Agente Codificador - KogniRecovery

## Estructura

Cada prompt está diseñado para una **fase de desarrollo** específica. El agente recibirá un prompt a la vez y completará esa fase antes de pasar a la siguiente.

**Formato**:
- **Contexto**: Qué ha pasado antes
- **Objetivo**: Qué debe lograr en esta fase
- **Entregables**: Archivos/código específico a crear
- **Especificaciones**: Referencias a documentos de diseño
- **Criterios de éxito**: Cómo validar que está bien hecho
- **Restricciones**: Límites, tecnologías obligatorias, things to avoid

---

## 📋 Prompt 0: Setup y Análisis

**Fase**: Preparación del entorno y comprensión del diseño

### Contexto
Has sido contratado por Kognito AI LABS para implementar KogniRecovery, una aplicación de acompañamiento en adicciones y salud mental. La arquitectura se basa en **Inteligencia Aumentada** (RAG + Knowledge Graph) que impregna todas las secciones.

### Objetivo
1. Leer y comprender toda la documentación de diseño en `/proyectos/KogniRecovery/`
2. Configurar el entorno de desarrollo local
3. Crear el plan de implementación detallado por sprint

### Entregables

1. **`IMPLEMENTATION_PLAN.md`** - Plan detallado con:
   - Sprint 0: Setup (este sprint)
   - Sprint 1: Infraestructura KG
   - Sprint 2: Catálogo base
   - Sprint 3: Herramientas core
   - Sprint 4: Chatbot integración
   - Sprint 5: Dashboard integración
   - Sprint 6: Check-in y alertas
   - Sprint 7: Sección medicamentos
   - Sprint 8: Testing y validación
   - Estimaciones de tiempo por sprint

2. **`ENVIRONMENT_SETUP.md`** - Instrucciones para:
   - Docker compose (PostgreSQL + Neo4j + Redis + Qdrant/pgvector)
   - Variables de entorno
   - Dependencias npm/pip
   - Comandos de migración

3. **`tech-stack.confirmed`** - Archivo que confirma:
   - Base de datos: Neo4j (versión)
   - Vector DB: [pgvector o Qdrant]
   - Backend: Node.js+TypeScript o Python FastAPI
   - Frontend: React Native o Flutter
   - LLM: [OpenAI GPT-4o / Claude / StepFun]

### Especificaciones a Revisar

Leer (pero no implementar yet):
- `ARQUITECTURA_INTELIGENCIA_AUMENTADA.md`
- `ARQUITECTURA/GRAFOS/KG_SCHEMA.md`
- `ARQUITECTURA/GRAFOS/queries/QUERIES_INDEX.md`
- `SECCION_MEDICAMENTOS.md`
- `ESPECIFICACIONES_TECNICAS.md`

### Criterios de Éxito

- [ ] Plan de sprints detallado con tareas específicas
- [ ] Docker compose funcional (todos los servicios up)
- [ ] Conexión a Neo4j y PostgreSQL verificada
- [ ] Archivo `tech-stack.confirmed` creado
- [ ] Cronograma realist (8-12 sprints de 2 semanas)

### Restricciones

- **NO** empezar a escribir código de aplicación todavía
- **NO** implementar queries (eso es en Sprint 2-3)
- **SÍ** preparar todo para que los sprints siguientes sean smooth
- Usar Docker para todos los servicios (facilita replicabilidad)
- Priorizar offline-first: la app debe funcionar sin internet para datos básicos

### Comandos Útiles

```bash
# Verificar que leíste la documentación
echo "He leído KG_SCHEMA.md y entiendo los 10 tipos de nodos" > READY.md

# Test de conectividad (una vez que Docker esté up)
curl http://localhost:7474 (Neo4j)
curl http://localhost:5432 (PostgreSQL)
```

---

## 📋 Prompt 1: Infraestructura del Knowledge Graph

**Fase**: Sprint 1 - Configurar Neo4j y crear migraciones iniciales

### Contexto
Ya tenemos el plan de implementación y Docker compose funcionando. Ahora necesitamos crear la base de datos Neo4j con el schema completo del Knowledge Graph.

### Objetivo
1. Ejecutar migraciones 001-003 en Neo4j
2. Crear índices adicionales para performance
3. Escribir scripts de verificación de integridad

### Entregables

1. **`dbsetup/01_schema_migrations.cypher`** - Archivo Cypher único con:
   - Migración 001: Todos los constraints e índices ( copied from `KG_SCHEMA.md`)
   - Migración 002: Inserciones de condiciones (ICD-10) - al menos 20 condiciones comunes
   - Migración 003: Inserciones de enzimas CYP450 (al menos 5 enzimas: CYP3A4, CYP2D6, CYP2C19, CYP2C9, UGT1A1)
   - Comentarios claros por sección

2. **`scripts/verify_graph_integrity.py`** - Script Python que:
   - Se conecta a Neo4j
   - Cuenta nodos por tipo (:User, :Medication, etc.)
   - Verifica que todos los constraints existen
   - Verifica que índices están online
   - Output: JSON con estadísticas o error si algo falta
   - Ejemplo: `python verify_graph_integrity.py --neo4j-uri bolt://localhost:7687`

3. **`dbsetup/02_initial_data_sources.md`** - Documento que lista:
   - Fuentes de datos planificadas (FDA, ANMAT, AEMPS, NIDA, etc.)
   - URLs de descarga de datasets
   - Formato esperado (CSV, JSON, XML)
   - Scripts de transformación a Cypher (placeholder, implementar en Sprint 2)
   - Frecuencia de actualización (mensual, trimestral)

4. **`docker/neo4j/conf/neo4j.conf`** - Configuración optimizada:
   - Memoria heap
   - Configuración de índices full-text (si se necesita)
   - Logging levels

### Especificaciones

- Seguir exactamente el schema de `ARQUITECTURA/GRAFOS/KG_SCHEMA.md`
- Usar los códigos ATC e ICD-10 proporcionados en ese documento
- Para medicamentos: solo catálogo base (50-100 medicamentos de ejemplo) por ahora
- NO cargar interacciones todavía (eso es Sprint 2)

### Criterios de Éxito

- [ ] Neo4j arranca sin errores
- [ ] Todos los constraints se crean exitosamente
- [ ] Índices están en estado `ONLINE`
- [ ] Script `verify_graph_integrity.py` pasa sin errores
- [ ] Hay al menos 20 condiciones, 5 enzimas, 50 medicamentos en la base
- [ ] Archivos generados están en las rutas correctas

### Testing

```bash
# 1. Ejecutar migraciones
cat dbsetup/01_schema_migrations.cypher | cypher-shell -u neo4j -p password

# 2. Verificar
python scripts/verify_graph_integrity.py

# Expected output:
# {
#   "nodes": {"User": 0, "Medication": 50, "Substance": 0, "Condition": 20, ...},
#   "constraints": {"user_uuid_unique": "present", ...},
#   "indexes": {"medication_generic_name_idx": "online", ...}
# }
```

### Restricciones

- **NO** usar UI de Neo4j Browser para crear constraints (todo debe ser reproducible vía Cypher)
- **NO** cargar datos masivos aún (solo datos de prueba)
- **SÍ** documentar cada migración con comentarios en Cypher
- **SÍ** hacer que el script de verificación sea reutilizable

---

## 📋 Prompt 2: Catálogo de Medicamentos (Ingestión Inicial)

**Fase**: Sprint 2 - Cargar catálogo de medicamentos desde fuentes públicas

### Contexto
Tenemos Neo4j funcionando con schema y datos base. Ahora necesitamos llenar el grafo con medicamentos reales (catálogo) para que la sección de búsqueda funcione.

### Objetivo
1. Descargar/obtener datos de medicamentos desde FDA (OpenFDA) o ANMAT
2. Transformar a formato Cypher
3. Cargar 10,000-20,000 medicamentos en Neo4j
4. Crear relaciones TREATS básicas (medicamento → condición)

### Entregables

1. **`scripts/ingest_medications.py`** - Script Python que:
   - Descarga datos de FDA Open API (drug/event o drug/label)
   - Filtra por: solo medicamentos humanos (no veterinarios)
   - Extrae: generic_name, brand_names, atc_code, dosage_forms, etc.
   - Genera archivo `data/medications_YYYYMMDD.cypher` con MERGE statements
   - Opcional: puede aceptar archivo CSV local si no hay API access
   - Comando: `python ingest_medications.py --output data/meds.cypher --limit 20000`

2. **`scripts/ingest_conditions.py`** - Script para cargar condiciones ICD-10 completas:
   - Descargar ICD-10 oficial (OMS) o usar lista predefinida
   - Crear nodos `:Condition` con código, nombre, categoría
   - Generar `data/conditions.cypher`
   - Comando: `python ingest_conditions.py`

3. **`scripts/ingest_drug_interactions.py`** - Script para interacciones fármaco-fármaco:
   - Fuente: Stockley's Drug Interactions (si disponible) o DrugBank free
   - Formato: CSV con columnas drug_a, drug_b, severity, mechanism, management
   - Generar `data/interactions.cypher` con relaciones `INTERACTS_WITH`
   - Comando: `python ingest_drug_interactions.py --input stockley.csv`

4. **`scripts/load_all.py`** - Script maestro que ejecuta todos los anteriores en orden:
   ```bash
   python load_all.py --neo4j bolt://localhost:7687
   ```

5. **`data/README.md`** - Documentación de fuentes de datos:
   - URLs de descarga
   - Licencias de cada dataset
   - Frecuencia de actualización recomendada
   - Tamaño esperado de cada archivo

### Especificaciones

**FDA OpenFDA**:
- Endpoint: `https://open.fda.gov/api/drug/label/`
- Fields a extraer: `openfda.generic_name`, `openfda.brand_name`, `openfda.route`, `openfda.dosage_form`, `openfda.product_type`
- Limitar a producto_type = "HUMAN OTC DRUG" o "HUMAN PRESCRIPTION DRUG"

**Condiciones ICD-10**:
- Usar lista oficial de OMS (descargar XML/CSV)
- Solo categorías relevantes para salud mental y adicciones:
  - F00-F09: Trastornos mentales y del comportamiento debido al consumo de sustancias
  - F10-F19: Trastornos debidos al consumo de sustancias psicoactivas
  - F20-F29: Esquizofrenia y trastornos psicóticos
  - F30-F39: Trastornos del humor
  - F40-F48: Trastornos neuróticos, relacionados con el estrés y somatomorfos
  - F90-F98: Trastornos del comportamiento y de la emoción de comienzo en la infancia y adolescencia

**Interacciones**:
- Priorizar interacciones "contraindicadas" y "mayores"
- Mínimo: 5,000 interacciones únicas

### Criterios de Éxito

- [ ] Script `ingest_medications.py` descarga >= 10,000 medicamentos
- [ ] Todos los medicamentos tienen al menos `generic_name` y `atc_code`
- [ ] Script `ingest_conditions.py` carga todas las condiciones ICD-10 relevantes (100-200)
- [ ] Interacciones cargadas: >= 5,000 pares únicos
- [ ] Neo4j no se cuelga durante carga (monitorizar memoria)
- [ ] `verify_graph_integrity.py` pasa después de carga

### Performance

- Carga de 20,000 medicamentos debe tomar < 10 minutos
- Usar `USING PERIODIC COMMIT 1000` en Cypher para carga masiva
- Hacer batches de 5,000 medicamentos si es necesario

### Testing

```bash
# Verificar que los datos se cargaron
# Contar medicamentos
echo "MATCH (m:Medication) RETURN count(m)" | cypher-shell

# Ver interacciones
echo "MATCH ()-[i:INTERACTS_WITH]->() RETURN count(i)" | cypher-shell

# Revisar que haya medicamentos importantes
echo "MATCH (m:Medication) WHERE m.generic_name IN ['sertralina','fluoxetina','alprazolam'] RETURN m.generic_name" | cypher-shell
```

### Restricciones

- **NO** cargar medicamentos duplicados (MERGE previene)
- **NO** cargar datos de Marketing si no son necesarios
- **SÍ** priorizar medicamentos comunes en LATAM (además de USA)
- **SÍ** agregar `source: 'FDA'` o `'ANMAT'` en cada nodo Medication

---

## 📋 Prompt 3: Sincronización Event-Driven (PostgreSQL → Neo4j)

**Fase**: Sprint 3 - Conectar la base de datos transaccional con el grafo

### Contexto
Tenemos el grafo poblado. Ahora necesitamos que cada evento de la app (nueva prescripción, toma confirmada, check-in) se refleje automáticamente en Neo4j.

### Objetivo
1. Implementar mecanismo de sincronización event-driven
2. Escribir handlers para cada tipo de evento
3. Garantizar consistencia eventual entre PostgreSQL y Neo4j

### Entregables

1. **`services/graph_sync_service.js`** (o `.py` si usas Python) - Servicio que:
   - Escucha eventos de PostgreSQL (via LISTEN/NOTIFY o polling)
   - Para cada evento, ejecuta la Cypher correspondiente
   - Maneja errores y reintentos
   - Logging estructurado

2. **`services/event_handlers.js`** - Módulo con handlers específicos:
   ```javascript
   const handlers = {
     'medication.prescribed': async (payload) => { /* crearTAKES */ },
     'medication.dose.taken': async (payload) => { /* actualizarHAS_ADHERENCE_EVENT */ },
     'checkin.submitted': async (payload) => { /* crearREPORTS_SYMPTOM */ },
     'substance.consumed': async (payload) => { /* crearCONSUMES */ },
     'user.created': async (payload) => { /* crear :User nodo */ }
   };
   ```

3. **`migrations/postgresql_TRIGGERS.sql`** - Triggers en PostgreSQL que:
   - Disparan NOTIFY en tablas: `user_medications`, `medication_doses`, `checkins`, `substance_consumption`
   - Incluyen payload JSON con los datos relevantes

4. **`docs/SYNC_ARCHITECTURE.md`** - Documento que explica:
   - Flujo de evento completo: PostgreSQL trigger → NOTIFY → graph_sync_service → Neo4j
   - Tabla de eventos y handlers
   - Estrategia de reintentos (dead letter queue?)
   - Monitoreo (métricas de lag)

### Especificaciones

**Eventos a sincronizar**:
- `user.created` → crear/modificar nodo `:User`
- `medication.prescribed` → crear relación `TAKES`
- `medication.prescription.updated` → actualizar relación `TAKES`
- `medication.dose.taken` → crear nodo `HAS_ADHERENCE_EVENT` + actualizar `TAKES.last_taken`
- `checkin.submitted` → extraer síntomas → crear `REPORTS_SYMPTOM`
- `substance.consumed` → crear/actualizar `CONSUMES` y `HAS_SUBSTANCE_CONSUMPTION`

**Payload ejemplo**:
```json
{
  "event": "medication.dose.taken",
  "timestamp": "2025-02-13T12:34:56Z",
  "data": {
    "user_id": "uuid",
    "medication_id": "uuid",
    "taken": true,
    "taken_time": "2025-02-13T12:34:56Z",
    "notes": "me sentí bien"
  }
}
```

**Cypher para `medication.dose.taken`**:
```cypher
MATCH (u:User {uuid: $user_id})-[pres:TAKES]->(m:Medication {uuid: $medication_id})
CREATE (u)-[:HAS_ADHERENCE_EVENT {
  date: date($taken_time),
  taken_time: datetime($taken_time),
  medication_id: $medication_id,
  taken: $taken,
  notes: $notes,
  created_at: datetime()
}]->(ade)

FOREACH (ignore IN CASE WHEN $taken THEN [1] ELSE [] END |
  SET pres.last_taken = datetime($taken_time),
      pres.adherence_streak = coalesce(pres.adherence_streak, 0) + 1
)

FOREACH (ignore IN CASE WHEN NOT $taken THEN [1] ELSE [] END |
  SET pres.adherence_streak = 0
)
```

### Criterios de Éxito

- [ ] graph_sync_service se conecta a PostgreSQL (LISTEN) y Neo4j
- [ ] Todos los eventos base son capturados y procesados
- [ ] Latencia de sync < 2 segundos (evento → Neo4j actualizado)
- [ ] Manejo de errores: eventos fallidos van a dead letter queue o log
- [ ] Idempotency: si un evento se procesa dos veces, no duplica datos
- [ ] Logs estructuradosJSON) con event_id para tracing

### Testing

1. **Unit tests** por handler:
   ```javascript
   test('medication.dose.taken creates correct Cypher', async () => {
     const payload = { user_id: 'u1', medication_id: 'm1', taken: true, ... };
     const cypher = await handlers['medication.dose.taken'](payload);
     expect(cypher).toContain('CREATE (u)-[:HAS_ADHERENCE_EVENT');
   });
   ```

2. **Integration test**:
   - Insertar registro en PostgreSQL
   - Verificar que Neo4j se actualiza en <5s
   - `MATCH (u:User {uuid: '...'})-[:HAS_ADHERENCE_EVENT]->(e) RETURN e`

3. **Load test**:
   - Disparar 100 eventos en 1 segundo
   - Verificar que todos se procesan sin pérdida

### Restricciones

- **NO** usar polling constant (es ineficiente). Usar NOTIFY/LISTEN de PostgreSQL.
- **SÍ** implementar exponential backoff para reintentos
- **SÍ** agregar métricas (Prometheus) de eventos procesados/fallidos
- **NO** bloquear la app si Neo4j está down (el evento se encola)

---

## 📋 Prompt 4: Pipeline RAG - Ingestión de Conocimiento

**Fase**: Sprint 4 - Configurar vector store e ingesta de documentos educativos

### Contexto
El Knowledge Graph está sincronizado. Ahora necesitamos el **RAG (Retrieval-Augmented Generation)** para que el chatbot y la sección de educación puedan acceder a conocimiento farmacológico actualizado.

### Objetivo
1. Configurar vector store (pgvector o Qdrant)
2. Crear pipeline de ingestión de documentos
3. Poblar con contenido inicial (fichas técnicas, guías clínicas)

### Entregables

1. **`services/vector_store_service.js`** (o `.py`) - Clase que:
   - Conecta a vector DB (PostgreSQL+pgvector o Qdrant)
   - Métodos: `addDocument(chunk, embedding, metadata)`, `search(query_embedding, filters, limit)`
   - Manejo de collections/índices
   - Configurable via env vars

2. **`pipeline/ingest_documents.py`** - Script principal que:
   - Recorre directorio `data/documents/` (PDFs, Markdown, HTML)
   - Extrae texto (usar PyPDF2, BeautifulSoup, etc.)
   - Divide en chunks (con overlap de 100-200 caracteres)
   - Genera embeddings (usar OpenAI `text-embedding-3-small` o modelo local `sentence-transformers`)
   - Inserta en vector store con metadata

3. **`data/documents/`** - Directorio con contenido inicial:
   - `fda_labels/` - 50-100 fichas técnicas de FDA (PDFs descargados)
   - `clinical_guidelines/` - Guías de APA, NICE, SAMHSA en Markdown
   - `patient_education/` - Artículos educativos para pacientes (español)
   - `drug_interactions/` - Contenido explicativo sobre interacciones

4. **`pipeline/metadata_schema.json`** - Schema de metadata para cada chunk:
   ```json
   {
     "type": "drug_label|clinical_guideline|patient_education|research_paper",
     "language": "es|en",
     "audience": "patient|professional|all",
     "topic": "sertraline|interactions|anxiety|...",
     "source_url": "string",
     "source_name": "FDA|ANMAT|NIDA",
     "created_at": "ISO date"
   }
   ```

5. **`docs/RAG_ARCHITECTURE.md`** - Documento que explica:
   - Cómo se generan embeddings (modelo, dimensions)
   - Estrategia de chunking (tamaño, overlap)
   - Filtrado de búsqueda (metadata filters)
   - Caching strategy (Redis)

### Especificaciones

**Embeddings**:
- Modelo sugerido: `text-embedding-3-small` de OpenAI (1536 dims) o `intfloat/multilingual-e5-large` (local)
- Tamaño de chunk: 500-1000 caracteres para fichas técnicas
- Overlap: 200 caracteres para mantener contexto

**Metadata filtering**:
- En búsqueda, filtrar por `language='es'` por defecto (app en español)
- Filtrar por `audience` según usuario (patient vs professional)
- Filtrar por `topic` si aplicación específica

**Carga inicial**:
- Mínimo: 1,000 documentos (chunks)
- Deben cubrir: 50 medicamentos comunes + 10 condiciones + guías generales

### Criterios de Éxito

- [ ] Vector store funcionando (pgvector table o Qdrant collection creada)
- [ ] Script `ingest_documents.py` procesa 100 documentos sin errores
- [ ] Cada documento se chunkifica correctamente (log de chunks created)
- [ ] Embeddings generados y almacenados (dimension check)
- [ ] Búsqueda de prueba: "¿Qué es la sertralina?" returns relevant chunks
- [ ] Tiempo de búsqueda < 500ms para 1,000 chunks

### Testing

```bash
# 1. Ingesta de documentos de prueba
python pipeline/ingest_documents.py --documents data/documents/test/ --limit 10

# 2. Verificar count
psql -c "SELECT COUNT(*) FROM document_chunks;"  # o curl a Qdrant

# 3. Búsqueda de prueba
python -c "
from services.vector_store import search
results = search('¿Qué es la sertralina?', {'language': 'es'}, limit=5)
print(results)
"
```

### Restricciones

- **NO** usar embeddings de OpenAI si no hay presupuesto (usar modelo local)
- **SÍ** implementar cache de embeddings frecuentes (Redis) en producción
- **NO** cargar documentos duplicados (detectar por hash de contenido)
- **SÍ** permitir actualización incremental (nuevos documentos sin reindexar todo)

---

## 📋 Prompt 5: Implementación de Herramientas Core (query_kg, rag_search)

**Fase**: Sprint 5 - Crear la capa de abstracción que usará LÚA y otras secciones

### Contexto
Tenemos Neo4j poblado y vector store funcionando. Ahora necesitamos una **API simple** que el backend (y LÚA) pueda llamar para obtener contexto enriquecido.

### Objetivo
1. Crear módulo `services/intelligence_orchestrator.js` (o `.py`)
2. Implementar herramientas:
   - `query_kg(cypher, params)` - consulta a Neo4j
   - `rag_search(query, filters, limit)` - búsqueda semántica
   - `enhanceWithKnowledge(userId, context, queryType)` - orchestrator principal
3. Escribir tests unitarios

### Entregables

1. **`services/intelligence_orchestrator.js`** - Archivo principal:
   ```javascript
   class IntelligenceOrchestrator {
     constructor(neo4jDriver, vectorDB, cache) { ... }

     async queryKG(cypher, params) { ... }  // wrapper Neo4j
     async ragSearch(query, filters, limit) { ... }  // wrapper vectorDB + filters
     async enhanceWithKnowledge(userId, context, queryType) { ... }  // combina ambos
   }
   ```

2. **`services/neo4j_client.js`** - Cliente Neo4j:
   - Conexión pooling
   - Método `query(cypher, params)` con timeout y retry
   - Logging de queries lentas (>500ms)

3. **`services/vector_client.js`** - Cliente vector DB:
   - Método `search(query, filters, limit)`
   - Método `addDocument(chunk, embedding, metadata)`
   - Cache de búsquedas frecuentes (Redis)

4. **`tests/unit/orchestrator.test.js`** - Tests:
   - `queryKG` devuelve resultados correctos
   - `ragSearch` filtra por metadata
   - `enhanceWithKnowledge` combina ambos correctamente
   - Mock de Neo4j y vector DB

5. **`docs/TOOLS_API.md`** - Documentación de la API:
   - Parámetros de cada función
   - Ejemplos de uso
   - Error codes

### Especificaciones

**`queryKG(cypher, params)`**:
- Input: Cypher string, objeto de parámetros
- Output: Array de resultados (filas)
- Error: throw `GraphQueryError` con Cypher y params para debugging
- Timeout: 5 segundos

**`ragSearch(query, filters, limit)`**:
- Input: query en lenguaje natural, filters object, limit (default 10)
- Process:
  1. Generar embedding del query (usar mismo modelo que ingestión)
  2. Buscar en vector store con filters
  3. Devolver top-k resultados con metadata
- Output: Array `[{content, metadata, score}]`

**`enhanceWithKnowledge(userId, context, queryType)`**:
- Input:
  - `userId`: string
  - `context`: { module: 'chatbot'|'checkin'|'dashboard', text: string, extra: {} }
  - `queryType`: string que indica qué queries ejecutar (ej: 'chatbot_context', 'checkin_insight')
- Process:
  1. Obtener datos personales del grafo (llamar a `queryKG` con query específica de `queryType`)
  2. Buscar conocimiento relevante en RAG (llamar a `ragSearch` con query de contexto)
  3. Combinar ambos en prompt estructurado para LLM
- Output: `{ personalData: {...}, knowledgeChunks: [...], prompt: string }`

### Criterios de Éxito

- [ ] Cliente Neo4j se conecta y ejecuta query simple
- [ ] Cliente vector DB busca y devuelve resultados
- [ ] `enhanceWithKnowledge` combina ambas fuentes correctamente
- [ ] Tests unitarios pasan (coverage >80%)
- [ ] Documentación `TOOLS_API.md` completa
- [ ] Ejemplo de uso en `examples/` directorio

### Ejemplo de Uso

```javascript
const orch = new IntelligenceOrchestrator(neo4jDriver, qdrantClient, redisClient);

// Caso: LÚA quiere responder sobre medicamento
const context = {
  userId: 'user-123',
  module: 'chatbot',
  text: '¿Qué es la sertralina?',
  extra: {}
};

const enriched = await orch.enhanceWithKnowledge(
  context.userId,
  context,
  'chatbot_context'
);

// enriched = {
//   personalData: { active_medications: [...], recent_symptoms: [...] },
//   knowledgeChunks: [{content: 'Sertralina es un ISRS...', metadata: {...}}],
//   prompt: 'Eres LÚA... Contexto personal: {...} Conocimiento: {...} Pregunta: ...'
// }
```

### Restricciones

- **NO** implementar lógica de negocio aquí (solo orquestación)
- **NO** hardcodear queries Cypher (deben venir de archivos `queries/`)
- **SÍ** que sea async/await limpio
- **SÍ** agregar logging con correlation ID para debugging

---

## 📋 Prompt 6: Integración en Chatbot LÚA

**Fase**: Sprint 6 - Conectar LÚA con la arquitectura de inteligencia

### Contexto
Tenemos las herramientas de inteligencia funcionando. Ahora vamos a integrarlas en el **Chatbot (LÚA)** existente para que use contexto personal y conocimiento actualizado.

### Objetivo
1. Modificar el servicio de chatbot para usar `enhanceWithKnowledge()`
2. Implementar function calling para que LÚA pueda consultar KG/RAG
3. Añadir prompts específicos por tipo de consulta
4. Testear con preguntas sobre medicamentos

### Entregables

1. **`services/chatbot_service.js`** - Modificado:
   - En `processMessage(userId, message)`, antes de llamar a LLM:
     ```javascript
     const enriched = await intelligence.enhanceWithKnowledge(
       userId,
       { module: 'chatbot', text: message },
       'chatbot_context'
     );
     const response = await llm.generate(enriched.prompt, {
       tools: availableTools  // function calling
     });
     ```
   - Después de respuesta, guardar en `chat_messages` (PostgreSQL)

2. **`services/llm_tools.js`** - Definir herramientas (tools) para function calling:
   ```javascript
   const tools = [
     {
       name: 'query_medication_info',
       description: 'Obtiene información detallada sobre un medicamento',
       parameters: { medication_name: 'string', focus: 'side_effects|interactions|dosage' }
     },
     {
       name: 'check_patient_interactions',
       description: 'Evalúa interacciones de un medicamento con los activos del paciente',
       parameters: { medication_name: 'string' }
     },
     {
       name: 'explain_interaction_mechanism',
       description: 'Explica mechanism de interacción en lenguaje claro',
       parameters: { med_a: 'string', med_b: 'string' }
     }
   ];
   ```

3. **`prompts/chatbot_with_tools.system.txt`** - Prompt system actualizado:
   - Incluye instrucciones sobre cuándo usar herramientas
   - Ejemplo: "Si el usuario pregunta sobre un medicamento, usa query_medication_info"
   - Instrucciones sobre cómo citar fuentes

4. **`tests/integration/chatbot_integration.test.js`** - Test:
   - Simular conversación: "¿Puedo tomar ibuprofeno con mi sertralina?"
   - Verificar que LÚA llama a `check_patient_interactions`
   - Verificar que respuesta incluye citations

### Especificaciones

**Function calling flow**:
1. Usuario: "¿Qué es la clonazepam?"
2. Chatbot recibe mensaje
3. LLM decide: "Necesito info del medicamento" → devuelve tool_call request
4. Servidor ejecuta `query_medication_info('clonazepam')`
5. Resultado se pasa de vuelta a LLM
6. LLM genera respuesta final con citations

**Herramientas disponibles**:
- `query_medication_info(name)`: RAG + graph info
- `check_patient_interactions(name)`: evalúa interacciones con medicamentos del paciente
- `get_patient_current_medications()`: lista medicamentos activos
- `get_recent_symptoms()`: síntomas últimos 7 días

**Prompt system**:
```
Eres LÚA, asistente terapéutico de KogniRecovery.

Tienes acceso a herramientas para obtener información precisa sobre medicamentos
y el historial del paciente. Úsalas cuando:
- El usuario pregunte sobre un medicamento (propiedades, efectos secundarios)
- El usuario mencione un medicamento y quiera saber sobre interacciones
- Necesites datos objetivos del paciente (qué medicamentos toma, síntomas recientes)

Siempre cita tus fuentes: "Según la ficha técnica de la FDA..." o "Basado en tu historial..."

No des consejo médico directo. Deriva a profesional cuando sea necesario.
```

### Criterios de Éxito

- [ ] Chatbot responde preguntas sobre medicamentos con información correcta (no alucinaciones)
- [ ] Cada respuesta cita fuente (FDA, grafo, etc.)
- [ ] Function calling funciona: LLM pide tool calls y servidor ejecuta
- [ ] Si el paciente no tiene el medicamento, LÚA lo aclara aclara
- [ ] Latencia: <3 segundos para respuestas que usan herramientas
- [ ] Tests de integración pasan

### Testing

```bash
# Test manual
curl -X POST http://localhost:3000/chat/message \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-patient","message":"¿Qué es la sertralina?"}'

# Expected: respuesta con citations, no hallucinations

# Test automatizado
npm test chatbot_integration
```

### Restricciones

- **NO** permitir que LLM invente información (si no hay datos, decir "No tengo esa información")
- **SÍ** cachear resultados de herramientas por 5 min (Redis)
- **NO** exponer datos de otros pacientes (userId isolation)
- **SÍ** loggear cada tool call para auditoría

---

## 📋 Prompt 7: Dashboard y Widgets

**Fase**: Sprint 7 - Implementar dashboard principal con widgets

### Contexto
Chatbot está funcionando con inteligencia. Ahora implementamos el **dashboard principal** que muestra widgets con insights y datos del paciente.

### Objetivo
1. Crear endpoints de API para cada widget
2. Usar queries del Knowledge Graph (`dashboard_widgets.cypher`)
3. Implementar cacheo de resultados (Redis)
4. Conectar al frontend (React Native/Flutter)

### Entregables

1. **`src/controllers/dashboard_controller.js`**:
   - Endpoint `GET /api/v1/dashboard?user_id=...`
   - Llama a todos los widgets necesarios en paralelo
   - Retorna JSON agregado para el frontend

2. **`src/services/dashboard_service.js`**:
   - Métodos por widget: `getTodayMedications(userId)`, `getAdherenceCalendar(userId)`, `getRiskLevel(userId)`, etc.
   - Cada método ejecuta la query Cypher correspondiente de `dashboard_widgets.cypher`
   - Cache con Redis (TTL 1-2 minutos)

3. **`src/models/DashboardWidget.js`** - Clases/types:
   - `MedicationWidget`, `SymptomWidget`, `RiskWidget`, etc.
   - Serialización a JSON para frontend

4. **`tests/unit/dashboard_service.test.js`** - Tests unitarios:
   - Mock de Neo4j client
   - Verificar que cada widget llama a la query correcta
   - Verificar cache behavior

5. **`docs/DASHBOARD_API.md`** - Documentación de API:
   - Endpoint: `GET /api/v1/dashboard`
   - Response schema
   - Ejemplo de response

### Especificaciones

**Widgets a implementar** (de `dashboard_widgets.cypher`):
1. `today_medications` - Query #1
2. `adherence_calendar` - Query #2
3. `recent_symptoms` - Query #3
4. `recent_substances` - Query #4
5. `current_risk` - Query #5 (semáforo)
6. `insight_input_data` - Query #6 (para LLM generate insight)
7. `emergency_contacts` - Query #7
8. `recent_activity` - Query #8
9. `upcoming_appointments` - Query #9
10. `weekly_goal` - Query #10
11. `pending_notifications` - Query #11
12. `stage_progress` - Query #12
13. `dashboard_data` - Query #13 (single query opcional)

**Cache strategy**:
- Widgets individuales: TTL 60 segundos
- Dashboard completo (todos widgets): TTL 120 segundos
- Clave Redis: `dashboard:{userId}:{widget_name}`

**Performance**:
- Dashboard completo debe responder <500ms (con cache)
- Sin cache: <2 segundos

### Criterios de Éxito

- [ ] Todos los widgets retornan datos correctos (test con usuario de prueba)
- [ ] Cache Redis funcionando, reduce carga en Neo4j
- [ ] API documentada con ejemplos
- [ ] Frontend puede consumir (conectarse con Pantallas UI)
- [ ] Queries de Neo4j tienen índices apropiados (ver `KG_SCHEMA.md`)
- [ ] Manejo de errores: si un widget falla, los otros funcionan (fail gracefully)

### Testing

```bash
# 1. Unit tests
npm test dashboard_service

# 2. Integration test
curl http://localhost:3000/api/v1/dashboard?user_id=test-user-123

# Expected: JSON con todos los widgets, sin NULLs críticos

# 3. Load test (locust o k6)
# Simular 100 usuarios solicitando dashboard simultáneamente
# P95 latency < 1s
```

### Restricciones

- **NO** hacer queries pesadas en el hilo principal (usar async/await en paralelo)
- **SÍ** usar `Promise.allSettled()` para que un widget fallido no rompa todo
- **NO** devolver datos de otros usuarios (userId isolation check)
- **SÍ** agregar métricas de latencia por widget (para identificar cuellos)

---

## 📋 Prompt 8: Check-in y Generación de Insights

**Fase**: Sprint 8 - Implementar check-in diario con insights automáticos

### Contexto
Dashboard y chat están funcionando con inteligencia. Ahora implementamos el **check-in diario**, que es fundamental para la recolección de datos y generación de insights.

### Objetivo
1. Crear API endpoints para check-in (GET, POST)
2. Implementar `generateInsights()` usando `checkin_insights.cypher`
3. Trigger automático: después de cada check-in, generar insights y guardar
4. UI: formulario con validaciones

### Entregables

1. **`src/controllers/checkin_controller.js`**:
   - `POST /api/v1/checkin` - Crear check-in diario
   - `GET /api/v1/checkin?user_id=...&date=...` - Obtener check-in específico
   - `GET /api/v1/checkin/latest?user_id=...` - Obtener último check-in

2. **`src/services/checkin_service.js`**:
   - `createCheckin(userId, data)` - guarda en PostgreSQL
   - `getCheckin(userId, date)`
   - `generateInsights(userId, checkinDate)` - **KEY**: ejecuta queries de `checkin_insights.cypher`
   - Devuelve array de `{type, message, severity, data}`

3. **`src/models/Checkin.js`** - Modelo de datos:
   - `checkin_date`, `mood_score` (1-10), `mood_tags` (array), `consumed` (bool), `substances_used`, `craving_intensity` (1-10), `recovery_activities`, `notes`

4. **`mobile/app/screens/CheckinScreen.tsx`** (o .dart si Flutter):
   - Formulario con:
     - Slider para estado emocional (1-10)
     - Multi-select de etiquetas (ansiedad, soledad, motivación, etc.)
     - ¿Consumiste? (Sí/No) + selector de sustancias
     - Craving intensity (si aplica)
     - Actividades de recuperación (checkboxes)
     - Notas libres
   - Botón "Guardar"
   - Después de guardar, mostrar insights generados (si hay)

5. **`tests/integration/checkin_flow.test.js`**:
   - Simular POST checkin con datos válidos
   - Verificar que se genera insights correctamente
   - Verificar que frontend muestra insights

### Especificaciones

**Payload POST checkin**:
```json
{
  "user_id": "uuid",
  "checkin_date": "2025-02-13",  // default: today
  "mood_score": 7,
  "mood_tags": ["	ansiedad", "motivado"],
  "consumed": false,
  "substances_used": [],
  "craving_intensity": 3,
  "recovery_activities": ["terapia", "ejercicio"],
  "notes": "Me siento bien hoy"
}
```

**Flujo**:
1. Usuario completa formulario → POST `/api/v1/checkin`
2. Servidor guarda en tabla `checkins` (PostgreSQL)
3. Servidor llama a `generateInsights(userId, date)`
   - Ejecuta varias queries de `checkin_insights.cypher`
   - Combina resultados en array de insights
   - Guarda insights en tabla `insights` (o retorna directamente)
4. Servidor retorna `{ success: true, insights: [...] }`
5. Frontend muestra insights en pantalla (tarjetas)

**Insights posibles** (de queries):
- "Has omitido la dosis nocturna los últimos 3 días" (adherencia pattern)
- "Primera vez que reportas ansiedad en 30 días"
- "Detección de interacción: consumiste alcohol y tomas sertralina → riesgo moderado"
- "Tu adherencia mejoró esta semana (de 60% a 80%)"
- "Cumpleaños de recuperación: 30 días sin consumo"

**Almacenamiento de insights**:
- Opción A: No guardar, calcular on-demand cada vez (más simple)
- Opción B: Guardar en tabla `daily_insights` para no recalcular
- Recomendación: B (mejor performance)

### Criterios de Éxito

- [ ] POST checkin guarda datos correctamente en PostgreSQL
- [ ] `generateInsights()` ejecuta al menos 5 queries diferentes y combina resultados
- [ ] Insights generados son relevantes y no vacíos
- [ ] Frontend muestra formulario validado (mood_score 1-10, etc.)
- [ ] Latencia: check-in completo (guardar + insights) < 3 segundos
- [ ] Manejo de errores: si una query falla, otras insights igual se generan

### Testing

```bash
# 1. Unit test de checkin_service
npm test checkin_service

# 2. Integration test: POST checkin
curl -X POST http://localhost:3000/api/v1/checkin \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test123","mood_score":5,"consumed":false}'

# Expected: 200 OK con insights array

# 3. Verificar en DB
psql -c "SELECT * FROM checkins WHERE user_id='test123' ORDER BY created_at DESC LIMIT 1;"
```

### Restricciones

- **NO** permitir check-in duplicado en el mismo día (unique constraint en checkins: user_id + checkin_date)
- **SÍ** permitir editar check-in hasta 24h después
- **NO** generar insights si checkin es incompleto (mood_score null)
- **SÍ** priorizar insights críticos (interacciones, omisiones) sobre educativos

---

## 📋 Prompt 9: Sección de Medicamentos - Implementación Completa

**Fase**: Sprint 9 - Implementar todas las pantallas y lógica de la sección de medicamentos

### Contexto
Tenemos la arquitectura de inteligencia funcionando. Ahora implementamos la **sección de gestión de medicamentos** que usa esas herramientas.

### Objetivo
Implementar todas las pantallas de la sección de medicamentos (lista, detalle, calendario, alertas) usando las queries diseñadas en `medication_section.cypher`.

### Entregables

**Backend**:
1. **`src/controllers/medication_controller.js`** - Endpoints:
   - `GET /api/v1/medications?user_id=...` - Lista de medicamentos (query #1)
   - `GET /api/v1/medications/:id?user_id=...` - Detalle completo (query #2)
   - `GET /api/v1/medications/calendar?user_id=...&months=3` - Calendario (query #3)
   - `GET /api/v1/medications/alerts?user_id=...` - Alertas pendientes (query #4-5)
   - `POST /api/v1/medications/search?q=...&limit=10` - Búsqueda (query #6)
   - `POST /api/v1/medications` - Añadir medicamento (ejecutar query #7 + evaluación interacciones)
   - `POST /api/v1/medications/:id/log-dose` - Confirmar toma (query #8)
   - `DELETE /api/v1/medications/:id` - Descontinuar (query #9)
   - `GET /api/v1/medications/:id/export?format=pdf` - Exportar (query #10)

2. **`src/services/medication_service.js`** - Lógica de neg:
   - Cada método llama a la query Cypher correspondiente
   - `addMedication(userId, medicationId, prescriptionData)` → crear TAKES + disparar `evaluateInteractions()`
   - `logDose(userId, medicationId, taken, notes, time)` →调用 query #8
   - `getInteractions(userId)` → alertas activas

**Frontend** (si haces RN/Flutter):
3. **`mobile/app/screens/MedicationsScreen.tsx`** - Pantalla principal:
   - Lista de medicamentos (FlatList)
   - Cada item: nombre, dosis, próxima toma, estado hoy (taken/missed/pending)
   - Badge con número de alertas
   - Botón "+" para añadir

4. **`mobile/app/screens/MedicationDetailScreen.tsx`**:
   - Info completa del medicamento (de query #2)
   - Calendario de adherencia (usar librería de calendario)
   - Sección de interacciones (drug-drug y drug-substance)
   - Botones: "Tomar ahora", "Reportar efecto secundario"
   - Enlace a artículos educativos

5. **`mobile/app/screens/AddMedicationScreen.tsx`**:
   - Campo de búsqueda/autocompletado (consulta `/api/v1/medications/search`)
   - Formulario: dosis, frecuencia, horario, indicación
   - Al guardar, mostrar alertas si hay interacciones

6. **`mobile/app/components/AdherenceCalendar.tsx`** - Calendario visual:
   - Mes actual con colores (verde=tomado, rojo=omitido, gris=sin dato)
   - Tap en día → modal con detalles

### Especificaciones

**Query a usar por endpoint**:
- `GET /medications` → `medication_section.cypher` query #1
- `GET /medications/:id` → query #2
- `GET /medications/calendar` → query #3
- `GET /medications/alerts` → queries #4-5 de `alert_interactions.cypher`
- `POST /medications/search` → query #14 de `checkin_insights.cypher` (catálogo)
- `POST /medications` → ejecutar query #7 `Agregar Nuevo Medicamento`, luego llamar a `evaluateInteractions()` (query de `alert_interactions.cypher` #1)
- `POST /medications/:id/log-dose` → query #8
- `DELETE /medications/:id` → query #9

**Evaluación de interacciones post-añadir**:
```javascript
// Después de crear TAKES
const interactions = await intelligence.queryKG(`
  MATCH (u:User {uuid: $userId})-[:TAKES]->(m1)
  MATCH (m1)-[i:INTERACTS_WITH]-(m2)
  WHERE (u)-[:TAKES]->(m2) AND i.severity IN ['critical','major']
  RETURN ...
`, {userId});

if (interactions.length > 0) {
  await createAlerts(userId, interactions);  // crear nodos :Alert
}
```

### Criterios de Éxito

- [ ] Todos los endpoints responden correctamente (test con usuario de prueba)
- [ ] Lista de medicamentos muestra datos exactos de query #1
- [ ] Detalle muestra toda la información (medication_info + drug_interactions + substance_interactions + side_effects)
- [ ] Calendario de adherencia refleja datos reales (colores correctos)
- [ ] Alertas de interacción aparecen después de añadir medicamento conflictivo
- [ ] Log de dosis funciona y actualiza last_taken y adherence_streak
- [ ] Frontend (mobile) navega entre pantallas sin errores
- [ ] Autocompletado de búsqueda devuelve resultados relevantes

### Testing

```bash
# 1. API tests
# Listar medicamentos de test-user
curl http://localhost:3000/api/v1/medications?user_id=test-user

# 2. Añadir medicamento (sertralina)
curl -X POST http://localhost:3000/api/v1/medications \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user","medication_id":"sertralina-uuid","dose":"50mg","frequency":"once daily"}'

# 3. Verificar alerta generada (si hay interacción)
curl http://localhost:3000/api/v1/medications/alerts?user_id=test-user

# 4. Log de dosis
curl -X POST http://localhost:3000/api/v1/medications/sertralina-uuid/log-dose \
  -d '{"taken":true,"notes":"me siento bien"}'

# 5. En móvil (simulador):
# - Navegar a MedicationsScreen → ver lista
# - Tap en medicamento → MedicationDetailScreen
# - Calendario debe mostrar días tomados/omitidos
```

### Restricciones

- **NO** permitir duplicados: si usuario ya tiene medicamento, no añadir de nuevo (check antes de CREATE)
- **SÍ** validar que medication_id existe en catálogo antes de crear TAKES
- **NO** permitir borrar medicamento si tiene historial de tomas (solo marcar discontinued)
- **SÍ** calcular automáticamente `adherence_streak` al loggear dosis (query #8 ya lo hace)
- **NO** mostrar interacciones de bajo riesgo (minor) en alertas principales (solo en detalle)

---

## 📋 Prompt 10: Testing, Validación y Documentación Final

**Fase**: Sprint 10 - Testing integral y preparación para deploy

### Contexto
Todas las funcionalidades están implementadas. Necesitamos testing exhaustivo, documentación completa y preparación para despliegue.

### Objetivo
1. Testing unitario, integración y end-to-end
2. Validación clínica (si es posible)
3. Documentación de API (OpenAPI/Swagger)
4. Docker production config
5. Guía de deployment

### Entregables

1. **`tests/`** - Suite completa:
   - Unit tests ( >80% coverage )
   - Integration tests (todos los servicios)
   - End-to-end tests (Cypress o Playwright para móvil)
   - Load tests (k6 script)

2. **`docs/API_REFERENCE.md`** - Documentación completa de API:
   - Todos los endpoints
   - Request/response ejemplos
   - Error codes
   - Autenticación

3. **`openapi.yaml`** - Especificación OpenAPI 3.0:
   - Importar en Swagger UI
   - Generar clientes SDK

4. **`docker-compose.prod.yml`** - Configuración producción:
   - Volúmenes persistentes para datos
   - Backup automation
   - Monitoreo (Prometheus exporters)
   - SSL/TLS

5. **`docs/DEPLOYMENT_GUIDE.md`** - Guía paso a paso:
   - Prerequisitos
   - Instalación en servidor
   - Configuración de dominios y SSL
   - Backup/restore
   - Troubleshooting

6. **`docs/CLINICAL_VALIDATION_PLAN.md`** - Plan de validación:
   - Checklist para farmacéutico
   - Escenarios de prueba con pacientes (beta)
   - Métricas de seguridad
   - Proceso de reporte de incidentes

7. **`scripts/load_test_data.py`** - Script para generar datos sintéticos:
   - 100 pacientes con perfiles diversos
   - 30 días de historial
   - Usar para pruebas de carga y demos

### Especificaciones

**Testing coverage**:
- Unit: 80%+
- Integration: todos los flujos principales (checkin, medications, chatbot)
- E2E: 5 escenarios críticos (registro → checkin → chatbot → medicamentos)

**API docs**:
- Usar Swagger UI: `http://localhost:3000/api-docs`
- Incluir ejemplos de request/response
- Documentar autenticación (JWT)

**Docker prod**:
- Multi-stage builds para slim images
- Non-root users en contenedores
- Healthchecks para todos los servicios
- Logging astdout/stderr (no archivos)

**Clinical validation**:
- Reclutar 5-10 pacientes en recuperación (con supervisión de clínico)
- 2 semanas de uso, recoger feedback
- Preguntar específicamente sobre:
  - Utilidad de alertas de interacción
  - Claridad de explicaciones
  - Engagement con check-in
  - Sugerencias de mejora

### Criterios de Éxito

- [ ] Tests unitarios >80% coverage, pasando
- [ ] Integration tests: todos los flujos principales funcionan
- [ ] Load test: 100 usuarios concurrentes, P95 latency < 2s
- [ ] API docs completas y accesibles
- [ ] Docker compose prod levanta en <5 min
- [ ] Guía de deployment clara (siguiente desarrollador puede deploy sin ayuda)
- [ ] Clinical validation: >= 70%满意度 de pacientes beta

### Entregables Finales

```
dist/
├── docker-compose.prod.yml
├── kognirecovery-app:latest (docker image)
├── kognirecovery-backend:latest
├── kognirecovery-db-init.sql (o .cypher)
└── backups/ (script de backup)

docs/
├── API_REFERENCE.md
├── DEPLOYMENT_GUIDE.md
├── CLINICAL_VALIDATION_PLAN.md
├── USER_MANUAL.pdf (para pacientes)
└── ADMIN_MANUAL.pdf (para administradores)

scripts/
├── load_test_data.py
├── backup.sh
└── restore.sh
```

### Restricciones

- **NO** deployar sin haber passing load test
- **NO** tener secrets en repositorio (usar env vars o vault)
- **SÍ** hacer backups automáticos diarios (cron)
- **NO** leave debug código en producción
- **SÍ** monitorear: latency, errores 5xx, uso de DB connections

---

## 🎯 Cómo Usar Estos Prompts

1. **Secuenciales**: Cada prompt construye sobre el anterior
2. **Auto-containted**: Cada prompt incluye todo el contexto necesario
3. **Verificable**: Criterios de éxito claros
4. **Testable**: Cada entrega puede ser testeada independientemente

**Workflow**:
```bash
# Darle al agente el Prompt 0
# Esperar entregables
# Revisar contra criterios de éxito
# Si OK, siguiente prompt
```

**Si el agente se atasca**:
- Revisar logs de error
- Verificar que entendió el diseño (pidele que resuma `KG_SCHEMA.md`)
- Ajustar prompt con más detalles

---

*Fin de prompts. Que el agente construya con cuidado.*