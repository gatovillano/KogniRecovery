# Knowledge Graph Schema - KogniRecovery

## 1. Visión General

El Knowledge Graph (KG) de KogniRecovery es el **núcleo de la memoria contextual y el razonamiento**. Contiene:

- **Conocimiento general** (farmacológico, médico, psicológico) - estático o semi-estático
- **Datos personales del paciente** (historial, medicamentos, síntomas) - dinámico

Toda la aplicación consulta y actualiza este grafo para proveer **inteligencia aumentada**.

---

## 2. Stack Tecnológico

- **Database**: Neo4j (5.x+)
- **Query language**: Cypher
- **Hosting**: Docker local (dev) / Neo4j Aura (prod) o self-hosted
- **Sync**: Event-driven desde PostgreSQL (triggers → Kafka/RabbitMQ → Neo4j) o directo desde app

---

## 3. Diseño del Schema: Nodos (Vertices)

### 3.1 Nodos Principales

#### `:User` (Paciente/Familiar/Profesional)
```cypher
:User {
  uuid: UUID (PK, unique),
  email: string,
  role: enum('patient', 'family', 'professional'),
  age: integer,
  gender: string,
  country: string (ISO 3166-1 alpha-2),
  primary_substance: string,  // sustancia principal de abuso
  other_substances: list<string>,
  stage_of_change: enum('precontemplation', 'contemplation', 'preparation', 'action', 'maintenance'),
  has_mental_health_diagnosis: boolean,
  mental_health_details: list<string>,  // ["depression", "GAD", "PTSD"]
  has_trauma_history: boolean,
  has_therapeutic_support: boolean,
  therapist_contact: map,  // {name, phone, email}
  genetic_markers: map,  // {"CYP2D6": "poor_metabolizer", "CYP2C19": "normal"}
  risk_level: enum('low', 'medium', 'high', 'critical'),
  onboarding_completed: boolean,
  created_at: datetime,
  updated_at: datetime
}
```

**Constraints**:
```cypher
CREATE CONSTRAINT user_uuid_unique IF NOT EXISTS
FOR (u:User) REQUIRE uuid.uuid IS UNIQUE;
```

#### `:Medication` (Catálogo + Prescripciones)
```cypher
:Medication {
  uuid: UUID (PK, unique),
  generic_name: string (lowercase, normalized),
  brand_names: list<string>,
  atc_code: string,  // Anatomical Therapeutic Chemical Classification
  substance_name: string,  // principio activo
  dosage_forms: list<string>,  // ["tableta", "cápsula", "jarabe", "parche"]
  strength_units: list<string>,  // ["mg", "mcg", "ml", "IU"]
  typical_adult_dose: string,  // descripción textual: "10-20mg once daily"
  route_of_admin: list<string>,  // ["oral", "sublingual", "topical", "inhalation"]
  metabolism_enzymes: list<string>,  // ["CYP3A4", "CYP2D6", "UGT1A1"]
  receptor_affinity: map,  // {"mu-opioid": 0.8, " GABA-A": 0.3}
  addiction_potential: float (0-1),  // 0=none, 1=high (ej: morfina=0.9, lorazepam=0.3)
  controlled_substance_schedule: string,  // "Schedule II", "Lista I", "No controlado"
  half_life_hours: float,
  time_to_peak_hours: float,
  bioavailability_percent: float,  // NULL si desconocido
  pregnancy_category: enum('A','B','C','D','X','N'),
  breastfeeding_risk: enum('low','moderate','high','contraindicated'),
  source: string,  // "FDA", "ANMAT", "AEMPS", "WHO", "custom"
  source_updated_at: datetime,
  created_at: datetime,
  updated_at: datetime
}
```

**Constraints**:
```cypher
CREATE CONSTRAINT medication_uuid_unique IF NOT EXISTS
FOR (m:Medication) REQUIRE m.uuid IS UNIQUE;

CREATE INDEX medication_generic_name_idx IF NOT EXISTS
FOR (m:Medication) ON (m.generic_name);

CREATE INDEX medication_atc_code_idx IF NOT EXISTS
FOR (m:Medication) ON (m.atc_code);
```

#### `:Substance` (Sustancias de abuso)
```cypher
:Substance {
  code: string (PK, unique),  // "alcohol", "cannabis", "cocaine", "methamphetamine"
  name: string,
  class: enum('depressant', 'stimulant', 'hallucinogen', 'cannabis', 'opioid', 'sedative', 'other'),
  receptor_affinity: map,  // {"mu-opioid": 0.9, "dopamine_transporter": 0.8}
  withdrawal_symptoms: list<string>,  // ["anxiety", "insomnia", "nausea", "seizures"]
  half_life_hours: float,
  metabolism_enzymes: list<string>,  // enzimas que metabolizan la sustancia
  common_interactions: list<string>,  // ej: ["alcohol+benzos=respiratory depression"]
  addiction_potential: float (0-1),
  legal_status: map,  // {"CL": "illegal", "AR": "illegal", "US": "Schedule I"}
  created_at: datetime,
  updated_at: datetime
}
```

**Constraints**:
```cypher
CREATE CONSTRAINT substance_code_unique IF NOT EXISTS
FOR (s:Substance) REQUIRE s.code IS UNIQUE;
```

#### `:Condition` (Condiciones médicas/psiquiátricas)
```cypher
:Condition {
  code: string (PK, unique),  // ICD-10 o código interno: "F10.2" (alcohol dependence)
  name: string,
  category: enum('psychiatric', 'medical', 'withdrawal', 'comorbidity'),
  description: string,
  icd10_code: string,
  snomed_code: string,
  created_at: datetime,
  updated_at: datetime
}
```

**Constraints**:
```cypher
CREATE CONSTRAINT condition_code_unique IF NOT EXISTS
FOR (c:Condition) REQUIRE c.code IS UNIQUE;
```

#### `:Symptom` (Síntomas/efectos)
```cypher
:Symptom {
  code: string (PK, unique),  // "anxiety", "insomnia", "nausea", "sweating"
  name: string,
  category: enum('psychological', 'physical', 'withdrawal', 'side_effect'),
  description: string,
  severity_scale: boolean,  // si puede ser escalado (1-10)
  created_at: datetime,
  updated_at: datetime
}
```

#### `:Enzyme` (Enzimas metabólicas, principalmente CYP450)
```cypher
:Enzyme {
  code: string (PK, unique),  // "CYP3A4", "CYP2D6", "CYP2C19", "UGT1A1"
  name: string,
  full_name: string,
  substrates: list<string>,  // medicamentos que metaboliza (generic_names)
  inhibitors: list<string>,  // sustancias que inhiben esta enzima
  inducers: list<string>,  // sustancias que inducen esta enzima
  genetic_variants: list<map>,  // [{"variant": "*4", "function": "none", "frequency": 0.2}]
  created_at: datetime,
  updated_at: datetime
}
```

#### `:Receptor` (Receptores farmacológicos)
```cypher
:Receptor {
  name: string (PK, unique),  // "mu-opioid", "GABA-A", "5-HT2A", "dopamine D2"
  type: enum('ion_channel', 'GPCR', 'nuclear', 'enzyme'),
  endogenous_ligands: list<string>,  // ["endorphins", "GABA", "serotonin"]
  agonists: list<string>,  // medicamentos/sustancias que activan
  antagonists: list<string>,  // que bloquean
  partial_agonists: list<string>,
  description: string,
  created_at: datetime,
  updated_at: datetime
}
```

#### `:Event` (Eventos importantes en la vida del paciente)
```cypher
:Event {
  uuid: UUID (PK, unique),
  type: enum('crisis', 'hospitalization', 'therapy_session', 'medication_change', 'substance_use', 'withdrawal', 'achievement'),
  occurred_at: datetime,
  description: text,
  severity: enum('low', 'medium', 'high', 'critical'),
  location: point,  // opcional, para emergency
  metadata: map,  // datos adicionales variables
  created_at: datetime
}
```

#### `:Interaction` (Interacciones predefinidas entre entidades)
```cypher
:Interaction {
  uuid: UUID (PK, unique),
  type: enum('drug-drug', 'drug-substance', 'drug-symptom', 'substance-symptom', 'condition-drug'),
  severity: enum('critical', 'major', 'moderate', 'minor', 'benign'),
  mechanism: string,
  management: string,
  evidence_level: enum('A', 'B', 'C'),  // A=strong, C=weak
  source: string,  // "FDA", "Stockley", "DrugBank", "clinical_guideline"
  source_reference: string,  // URL o citation
  created_at: datetime,
  updated_at: datetime
}
```

#### `:Knowledge` (Chunks de conocimiento RAG indexados)
```cypher
:Knowledge {
  chunk_id: UUID (PK, unique),
  document_id: string,  // ID del documento fuente
  chunk_index: integer,  // qué parte del documento
  content: text,  // texto del chunk
  embedding: list<float>,  // vector embedding (si se guarda en Neo4j, si no en vector DB externo)
  metadata: map,  // {type: "drug_label", language: "es", audience: "patient", topic: "side_effects"}
  source_url: string,
  retrieved_count: integer,  // cuántas veces se ha usado (para caching/ranking)
  created_at: datetime,
  updated_at: datetime
}
```

**Nota**: Los embeddings pueden estar en Neo4j (con pgvector-like) o en Vector DB externo (Qdrant). Si es externo, `:Knowledge` guarda solo metadata y referencia.

---

## 4. Diseño del Schema: Relaciones (Edges)

### 4.1 Relaciones de Pertenece/Referencia

```cypher
// Paciente - Medicamento (prescripción)
(u:User)-[:TAKES {
  dose: string,
  frequency: string,
  schedule_time: time,  // hora fija si aplica
  start_date: date,
  end_date: date,
  prescriber_name: string,
  prescriber_contact: map,
  indication: string,  // para qué se prescribe
  special_instructions: string,
  status: enum('active', 'discontinued', 'suspended'),
  last_taken: datetime,
  adherence_streak: integer,
  created_at: datetime,
  updated_at: datetime
}]->(m:Medication)

// Paciente - Sustancia (consumo)
(u:User)-[:CONSUMES {
  amount: string,
  method: string,  // "oral", "inhalation", "intranasal", "injection"
  frequency: enum('rare', 'occasional', 'regular', 'daily', 'binge'),
  pattern: string,  // descripción libre: "fines de semana", "estrés"
  last_occurrence: datetime,
  created_at: datetime
}]->(s:Substance)

// Paciente - Condición (diagnóstico)
(u:User)-[:HAS_CONDITION {
  diagnosed_at: date,
  severity: enum('mild', 'moderate', 'severe'),
  treatment_status: enum('untreated', 'managed', 'refractory'),
  notes: string,
  created_at: datetime,
  updated_at: datetime
}]->(c:Condition)

// Paciente - Síntoma (reportado)
(u:User)-[:REPORTS_SYMPTOM {
  intensity: integer (1-10),
  first_reported: datetime,
  last_reported: datetime,
  frequency: string,  // "daily", "weekly", "monthly"
  notes: string,
  created_at: datetime
}]->(sym:Symptom)

// Paciente - Evento
(u:User)-[:EXPERIENCED {
  involvement_level: enum('direct', 'witnessed', 'informed'),
  notes: string,
  created_at: datetime
}]->(e:Event)

// Paciente - Conocimiento (acceso a artículos)
(u:User)-[:ACCESSED {
  accessed_at: datetime,
  engagement_level: enum('viewed', 'read_fully', 'saved', 'shared'),
  time_spent_seconds: integer,
  feedback: enum('helpful', 'neutral', 'confusing'),
  created_at: datetime
}]->(k:Knowledge)
```

### 4.2 Relaciones de Conocimiento General (Medicamentos)

```cypher
// Medicamento - Condición (indica para qué sirve)
(m:Medication)-[:TREATS {
  strength: enum('primary', 'secondary', 'off-label'),
  evidence_level: enum('A', 'B', 'C'),
  notes: string,
  created_at: datetime,
  updated_at: datetime
}]->(c:Condition)

// Medicamento - Síntoma (efecto secundario)
(m:Medication)-[:CAUSES {
  frequency: enum('common', 'uncommon', 'rare'),
  severity: enum('mild', 'moderate', 'severe'),
  onset: enum('immediate', 'days', 'weeks', 'months'),
  mechanism: string,
  created_at: datetime,
  updated_at: datetime
}]->(sym:Symptom)

// Medicamento - Enzima (metabolismo)
(m:Medication)-[:METABOLIZED_BY {
  contribution: float (0-1),  // porcentaje del metabolismo total
  is_primary: boolean,
  created_at: datetime,
  updated_at: datetime
}]->(enz:Enzyme)

// Medicamento - Enzima (inhibición)
(m:Medication)-[:INHIBITS {
  potency: enum('strong', 'moderate', 'weak'),
  mechanism: string,  // "competitive", "non-competitive", "mechanism-based"
  clinical_significance: string,
  created_at: datetime,
  updated_at: datetime
}]->(enz:Enzyme)

// Medicamento - Enzima (inducción)
(m:Medication)-[:INDUCES {
  potency: enum('strong', 'moderate', 'weak'),
  onset_days: integer,  // días para efecto completo
  offset_days: integer,  // días para revertir
  created_at: datetime,
  updated_at: datetime
}]->(enz:Enzyme)

// Medicamento - Receptor (afinidad)
(m:Medication)-[:BINDS_TO {
  affinity: float,  // constante de disociación (Kd) o % de ocupación
  efficacy: enum('agonist', 'partial_agonist', 'antagonist', 'inverse_agonist'),
  selectivity: float,  // qué tan específico es para ese receptor
  created_at: datetime,
  updated_at: datetime
}]->(rec:Receptor)

// Medicamento - Medicamento (interacción documentada)
(m1:Medication)-[i:INTERACTS_WITH {
  severity: enum('critical', 'major', 'moderate', 'minor'),
  mechanism: string,
  management: string,
  evidence_level: enum('A', 'B', 'C'),
  source: string,
  source_reference: string,
  created_at: datetime,
  updated_at: datetime
}]->(m2:Medication)

// Medicamento - Sustancia (interacción)
(m:Medication)-[is:INTERACTS_WITH_SUBSTANCE {
  risk_level: float (0-1),  // riesgo cuantificado
  mechanism: string,
  advice: string,
  severity: enum('critical', 'major', 'moderate', 'minor'),
  created_at: datetime,
  updated_at: datetime
}]->(s:Substance)

// Medicamento - Síntoma (causa withdrawal o efecto)
(m:Medication)-[:CAN_CAUSE {
  context: enum('therapeutic', 'side_effect', 'withdrawal', 'overdose'),
  probability: float (0-1),
  created_at: datetime,
  updated_at: datetime
}]->(sym:Symptom)

// Medicamento - Conocimiento (documentación)
(m:Medication)-[:HAS_DOCUMENTATION]->(k:Knowledge)
```

### 4.3 Relaciones de Síntoma y Condición

```cypher
// Condición - Síntoma (criterio diagnóstico)
(c:Condition)-[:HAS_SYMPTOM {
  diagnostic_weight: float (0-1),  // qué tan específico es el síntoma para esta condición
  required: boolean,  // si es necesario para diagnóstico
  created_at: datetime
}]->(sym:Symptom)

// Síntoma - Síntoma (jerarquía/grupo)
(parent:Symptom)-[:INCLUDES]->(child:Symptom)

// Condición - Condición (relaciones clínicas)
(c1:Condition)-[:COMORBID_WITH {
  strength: float (0-1),  // frecuencia de comorbilidad
  directionality: enum('bidirectional', 'causal_a_to_b', 'causal_b_to_a'),
  evidence: string,
  created_at: datetime,
  updated_at: datetime
}]->(c2:Condition)
```

### 4.4 Relaciones de Evento

```cypher
// Evento - Condición/Síntoma/Medicamento (contexto)
(e:Event)-[:RELATED_TO {
  relevance: enum('primary', 'secondary', 'contextual'),
  created_at: datetime
}]->(entity)  // puede ser :Condition, :Symptom, :Medication, etc.

// Evento - Sustancia (consumo asociado)
(e:Event)-[:INVOLVED_SUBSTANCE {
  amount: string,
  route: string,
  created_at: datetime
}]->(s:Substance)

// Evento - Medicamento (toma asociada)
(e:Event)-[:INVOLVED_MEDICATION {
  dose: string,
  adherence: enum('taken', 'missed', 'extra'),
  created_at: datetime
}]->(m:Medication)
```

---

## 5. Queries de Ejemplo (Patrones Reutilizables)

### 5.1 Obtener Medicamentos Activos del Paciente

```cypher
MATCH (u:User {uuid: $user_uuid})-[:TAKES {status: 'active'}]->(m:Medication)
RETURN m {
  .uuid,
  .generic_name,
  .brand_names,
  .dosage: r.dose,
  .frequency: r.frequency,
  .schedule_time: r.schedule_time,
  .indication: r.indication,
  .special_instructions: r.special_instructions,
  .start_date: r.start_date,
  .last_taken: r.last_taken,
  .adherence_streak: r.adherence_streak
} AS medication,
r { .last_taken, .adherence_streak } AS prescription
ORDER BY r.schedule_time
```

### 5.2 Detectar Interacciones entre Medicamentos Activos

```cypher
MATCH (u:User {uuid: $user_uuid})-[:TAKES {status: 'active'}]->(m1:Medication)
MATCH (m1)-[i:INTERACTS_WITH]-(m2:Medication)
WHERE (u)-[:TAKES {status: 'active'}]->(m2)  // m2 también está activa
RETURN {
  medication_a: m1.generic_name,
  medication_b: m2.generic_name,
  severity: i.severity,
  mechanism: i.mechanism,
  management: i.management,
  evidence: i.evidence_level
} AS interaction
ORDER BY i.severity DESC, m1.generic_name
```

**Resultado**:
```json
[
  {
    "interaction": {
      "medication_a": "sertralina",
      "medication_b": "fluconazol",
      "severity": "major",
      "mechanism": "CYP3A4 inhibition → increased sertraline levels",
      "management": "Monitor for increased side effects; consider dose adjustment",
      "evidence": "A"
    }
  }
]
```

### 5.3 Alertas de Interacción Medicamento-Sustancia

```cypher
MATCH (u:User {uuid: $user_uuid})-[:TAKES {status:'active'}]->(m:Medication)
MATCH (m)-[is:INTERACTS_WITH_SUBSTANCE]->(s:Substance)
WHERE (u)-[:CONSUMES]->(s)  // paciente consume esa sustancia
RETURN {
  medication: m.generic_name,
  substance: s.name,
  risk_level: is.risk_level,
  mechanism: is.mechanism,
  advice: is.advice,
  severity: is.severity
} AS risk
ORDER BY is.risk_level DESC
```

### 5.4 Obtener Síntomas Reportados Recientemente

```cypher
MATCH (u:User {uuid: $user_uuid})-[:REPORTS_SYMPTOM]->(sym:Symptom)
WHERE sym.last_reported > datetime() - duration({days: 30})
RETURN sym {
  .code,
  .name,
  .category,
  intensity: r.intensity,
  first_reported: r.first_reported,
  last_reported: r.last_reported,
  frequency: r.frequency
} AS symptom
ORDER BY r.last_reported DESC
```

### 5.5 Correlación Adherencia-Síntomas (Patrones)

```cypher
// Para cada día en los últimos 30 días, ver adherencia y síntomas
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[pres:TAKES]->(m:Medication)
WHERE pres.status = 'active'
WITH u, m, pres
MATCH (d:Date {value: date() - duration({days: range(0,30)})})  // asumimos nodos Date o generamos rango
OPTIONAL MATCH (u)-[:HAS_DAY {date: d.value}]->(day:Day)  // nodo Day con aggregated data
WHERE day IS NULL OR day.adherence_percentage < 80
OPTIONAL MATCH (u)-[:REPORTS_SYMPTOM {date: d.value}]->(sym:Symptom)
RETURN d.value AS date,
       day.adherence_percentage AS adherence,
       collect(sym.name) AS symptoms_reported
ORDER BY d.value DESC
```

**Nota**: Esta query requiere que el sistema agregue datos diarios en nodos `:Day` o que calcule en tiempo real (menos eficiente).

### 5.6 Predicción de Riesgo (Basado en Patrones Históricos)

```cypher
// Pacientes con patrón similar (cohorte匹配) han tenido crisis después de X días
MATCH (u:User {uuid: $user_uuid})
MATCH (u)-[:HAS_CONDITION]->(c:Condition)  // condiciones del paciente
MATCH (similar:User)-[:HAS_CONDITION]->(c)  // otros pacientes con misma condición
WHERE similar <> u
  AND similar.risk_level IN ['high', 'critical']
MATCH (similar)-[:EXPERIENCED {type: 'crisis'}]->(e:Event)
WHERE e.occurred_at > datetime() - duration({days: 90})
WITH u, similar, e
MATCH (similar)-[pres:TAKES]->(m:Medication)  // medicamentos del paciente similar
WHERE pres.status = 'active'
  AND NOT EXISTS {
    MATCH (u)-[:TAKES]->(m)  // pero el paciente actual NO lo toma
  }
RETURN m.generic_name AS suggested_medication,
       count(*) AS crisis_prevention_count,
       collect(DISTINCT similar.uuid)[0..5] AS similar_patients_example
ORDER BY crisis_prevention_count DESC
LIMIT 5
```

### 5.7 Obtener Conocimiento Relevante (RAG Query)

```cypher
// Buscar chunks relacionados con un tema, filtrados por audiencia
MATCH (k:Knowledge)
WHERE k.metadata.topic CONTAINS $topic
  AND k.metadata.language = $lang
  AND (k.metadata.audience = $audience OR k.metadata.audience = 'all')
RETURN k {
  .chunk_id,
  .content,
  .metadata,
  .source_url
} AS knowledge
ORDER BY k.retrieved_count DESC, rand()  // podríamos usar embedding similarity aquí
LIMIT $limit
```

**Integración con Vector Search**: En vez de este query de texto, debería hacer:

```javascript
// Pseudocódigo
embedding = await llm.embed(query);
results = await vectorDB.search(embedding, { filter: {topic, language, audience} });
```

---

## 6. Sincronización desde PostgreSQL

### 6.1 Eventos que Actualizan el Grafo

Cada tabla transaccional dispara eventos:

| Tabla PostgreSQL | Evento | Acción en Neo4j |
|------------------|--------|-----------------|
| `users` | user.created, user.updated | UPSERT nodo `:User` |
| `user_medications` | med.added, med.updated, med.discontinued | Crear/actualizar relación `(u)-[:TAKES]->(m)` |
| `medication_doses` | dose.taken, dose.skipped | Actualizar propiedades `last_taken`, `adherence_streak` en relación `TAKES` |
| `substance_consumption` | substance.consumed | Crear nodo `:Substance` si no existe + relación `(u)-[:CONSUMES]->(s)` |
| `checkins` | checkin.submitted | Extraer síntomas → crear/actualizar relaciones `REPORTS_SYMPTOM` |
| `chat_messages` | message.sent | Actualizar nodo `:Event` si es crisis, o `:Knowledge` si guarda info |

### 6.2 Patrón de Sincronización

```javascript
// Ejemplo: nuevo medicamento añadido
async function onMedicationAdded(userId, medicationData) {
  // 1. Asegurar que el nodo Medication existe en el grafo (catálogo)
  const medNode = await neo4j.query(`
    MERGE (m:Medication {uuid: $med_uuid})
    ON CREATE SET
      m.generic_name = $generic_name,
      m.brand_names = $brand_names,
      m.atc_code = $atc_code,
      m.metabolism_enzymes = $enzymes,
      ...
    RETURN m
  `, {med_uuid: medicationData.id, ...});

  // 2. Crear relación TAKES
  await neo4j.query(`
    MATCH (u:User {uuid: $user_uuid})
    MATCH (m:Medication {uuid: $med_uuid})
    MERGE (u)-[r:TAKES]->(m)
    ON CREATE SET
      r.dose = $dose,
      r.frequency = $frequency,
      r.schedule_time = $schedule_time,
      r.start_date = date(),
      r.status = 'active',
      r.created_at = datetime()
    ON MATCH SET
      r.dose = $dose,
      r.frequency = $frequency,
      r.updated_at = datetime()
  `, {user_uuid: userId, med_uuid: medicationData.id, ...});

  // 3. Disparar evaluación de interacciones (asíncrono)
  await interactionEngine.evaluateForUser(userId);
}
```

---

## 7. Migraciones Iniciales

### 7.1 Migración 001: Crear Constraints e Índices

`migrations/001_schema_constraints.cypher`

```cypher
// Users
CREATE CONSTRAINT user_uuid_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.uuid IS UNIQUE;
CREATE INDEX user_email_idx IF NOT EXISTS
FOR (u:User) ON (u.email);

// Medications
CREATE CONSTRAINT medication_uuid_unique IF NOT EXISTS
FOR (m:Medication) REQUIRE m.uuid IS UNIQUE;
CREATE INDEX medication_generic_name_idx IF NOT EXISTS
FOR (m:Medication) ON (m.generic_name);
CREATE INDEX medication_atc_code_idx IF NOT EXISTS
FOR (m:Medication) ON (m.atc_code);

// Substances
CREATE CONSTRAINT substance_code_unique IF NOT EXISTS
FOR (s:Substance) REQUIRE s.code IS UNIQUE;

// Conditions
CREATE CONSTRAINT condition_code_unique IF NOT EXISTS
FOR (c:Condition) REQUIRE c.code IS UNIQUE;

// Symptoms
CREATE CONSTRAINT symptom_code_unique IF NOT EXISTS
FOR (sym:Symptom) REQUIRE sym.code IS UNIQUE;

// Enzymes
CREATE CONSTRAINT enzyme_code_unique IF NOT EXISTS
FOR (enz:Enzyme) REQUIRE enz.code IS UNIQUE;

// Events
CREATE CONSTRAINT event_uuid_unique IF NOT EXISTS
FOR (e:Event) REQUIRE e.uuid IS UNIQUE;
CREATE INDEX event_occurred_at_idx IF NOT EXISTS
FOR (e:Event) ON (e.occurred_at);

// Knowledge
CREATE CONSTRAINT knowledge_chunk_id_unique IF NOT EXISTS
FOR (k:Knowledge) REQUIRE k.chunk_id IS UNIQUE;
CREATE INDEX knowledge_metadata_idx IF NOT EXISTS
FOR (k:Knowledge) ON (k.metadata);
```

### 7.2 Migración 002: Cargar Datos Maestros

`migrations/002_load_conditions.cypher`

```cypher
// Condiciones psiquiátricas comunes (ICD-10)
UNWIND [
  {code: "F32", name: "Depresión mayor", category: "psychiatric", icd10: "F32"},
  {code: "F41", name: "Trastorno de ansiedad generalizada", category: "psychiatric", icd10: "F41.1"},
  {code: "F10.2", name: "Síndrome de dependencia del alcohol", category: "withdrawal", icd10: "F10.2"},
  {code: "F11.2", name: "Síndrome de dependencia de opioides", category: "withdrawal", icd10: "F11.2"},
  {code: "F17.2", name: "Síndrome de dependencia del tabaco", category: "withdrawal", icd10: "F17.2"},
  {code: "F43.1", name: "Trastorno de estrés post-traumático", category: "psychiatric", icd10: "F43.1"}
] AS row
MERGE (c:Condition {code: row.code})
ON CREATE SET
  c.name = row.name,
  c.category = row.category,
  c.icd10_code = row.icd10,
  c.created_at = datetime();
```

`migrations/002_load_symptoms.cypher`

```cypher
UNWIND [
  {code: "anxiety", name: "Ansiedad", category: "psychological"},
  {code: "depressed_mood", name: "Estado de ánimo deprimido", category: "psychological"},
  {code: "insomnia", name: "Insomnio", category: "physical"},
  {code: "nausea", name: "Náuseas", category: "physical"},
  {code: "headache", name: "Cefalea", category: "physical"},
  {code: "craving", name: "Craving", category: "psychological"},
  {code: "tremor", name: "Temblor", category: "physical"},
  {code: "sweating", name: "Sudoración", category: "physical"},
  {code: "seizure", name: "Convulsión", category: "physical"},
  {code: "fatigue", name: "Fatiga", category: "physical"}
] AS row
MERGE (sym:Symptom {code: row.code})
ON CREATE SET
  sym.name = row.name,
  sym.category = row.category,
  sym.created_at = datetime();
```

### 7.3 Migración 003: Cargar Enzimas CYP450

`migrations/003_load_enzymes.cypher`

```cypher
UNWIND [
  {
    code: "CYP3A4",
    name: "CYP3A4",
    full_name: "Cytochrome P450 3A4",
    substrates: ["sertralina", "alprazolam", "midazolam", "carbamazepina", "ketoconazol"],
    inhibitors: ["ketoconazol", "itraconazol", "claritromicina", "itraconazole"],
    inducers: ["rifampina", "carbamazepina", "hierba de San Juan"],
    genetic_variants: [
      {variant: "*1", function: "normal", frequency: 0.5},
      {variant: "*22", function: "poor", frequency: 0.05}
    ]
  },
  {
    code: "CYP2D6",
    name: "CYP2D6",
    full_name: "Cytochrome P450 2D6",
    substrates: ["fluoxetina", "venlafaxina", "tramadol", "codeína"],
    inhibitors: ["paroxetina", "fluoxetina", "quinidina"],
    inducers: [],
    genetic_variants: [
      {variant: "*1", function: "normal", frequency: 0.4},
      {variant: "*4", function: "none", frequency: 0.2},
      {variant: "*10", function: "decreased", frequency: 0.3}
    ]
  }
  // ... más enzimas
] AS enz
MERGE (e:Enzyme {code: enz.code})
ON CREATE SET
  e.name = enz.name,
  e.full_name = enz.full_name,
  e.substrates = enz.substrates,
  e.inhibitors = enz.inhibitors,
  e.inducers = enz.inducers,
  e.genetic_variants = enz.genetic_variants,
  e.created_at = datetime()
ON MATCH SET
  e.substrates = enz.substrates,
  e.inhibitors = enz.inhibitors,
  e.inducers = enz.inducers,
  e.genetic_variants = enz.genetic_variants,
  e.updated_at = datetime();
```

### 7.4 Migración 004: Cargar Medicamentos (Catálogo Base)

`migrations/004_load_medications_from_fda.cypher`

**Nota**: Esto se carga automáticamente desde un script de ingestión que transforma datos de FDA/ANMAT a Cypher, no manualmente.

Estructura del script (Python/Node):

```python
# pseudo
for drug in fda_drugs:
    cypher = """
    MERGE (m:Medication {generic_name: $generic_name})
    ON CREATE SET
      m.uuid = randomUUID(),
      m.brand_names = $brand_names,
      m.atc_code = $atc_code,
      m.metabolism_enzymes = $enzymes,
      m.addiction_potential = $addiction_potential,
      ...
    """
    neo4j.run(cypher, params)
```

### 7.5 Migración 005: Crear Relaciones entre Medicamentos (Interacciones)

`migrations/005_load_drug_interactions.cypher`

```cypher
// Cargar interacciones desde un archivo CSV (exportado de Stockley, FDA, DrugBank)
USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM 'file:///interactions.csv' AS row
MATCH (m1:Medication {generic_name: row.drug_a})
MATCH (m2:Medication {generic_name: row.drug_b})
MERGE (m1)-[i:INTERACTS_WITH]-(m2)
ON CREATE SET
  i.severity = row.severity,
  i.mechanism = row.mechanism,
  i.management = row.management,
  i.evidence_level = row.evidence_level,
  i.source = row.source,
  i.source_reference = row.reference,
  i.created_at = datetime()
ON MATCH SET
  i.severity = row.severity,  // update si cambia
  i.updated_at = datetime();
```

### 7.6 Migración 006: Crear Relaciones Medicamento-Sustancia

`migrations/006_load_drug_substance_interactions.cypher`

```cypher
USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM 'file:///drug_substance_interactions.csv' AS row
MATCH (m:Medication {generic_name: row.drug})
MATCH (s:Substance {code: row.substance_code})
MERGE (m)-[i:INTERACTS_WITH_SUBSTANCE]-(s)
ON CREATE SET
  i.risk_level = toFloat(row.risk_level),
  i.mechanism = row.mechanism,
  i.advice = row.advice,
  i.severity = row.severity,
  i.created_at = datetime();
```

### 7.7 Migración 007: Crear Relaciones Metabolismo (Enzimas)

`migrations/007_load_drug_enzyme_relations.cypher`

```cypher
// Para cada medicamento, crear METABOLIZED_BY e INHIBITS/INDUCES
UNWIND [
  // Ejemplo: sertralina
  {
    drug: "sertralina",
    metabolized_by: ["CYP2D6", "CYP3A4", "CYP2C19"],
    inhibits: [],
    induces: []
  },
  {
    drug: "fluconazol",
    metabolized_by: ["CYP3A4", "CYP2C9"],
    inhibits: ["CYP3A4"],
    induces: []
  }
  // ... más
] AS rel
MATCH (m:Medication {generic_name: rel.drug})
UNWIND rel.metabolized_by AS enzyme_code
MATCH (enz:Enzyme {code: enzyme_code})
MERGE (m)-[r:METABOLIZED_BY]->(enz)
ON CREATE SET
  r.contribution = CASE enzyme_code
    WHEN 'CYP3A4' THEN 0.6  // principal
    WHEN 'CYP2D6' THEN 0.3
    ELSE 0.1
  END,
  r.is_primary = (enzyme_code = 'CYP3A4'),  // lógica simplificada
  r.created_at = datetime();

UNWIND rel.inhibits AS inhibitor_enzyme_code
MATCH (enz:Enzyme {code: inhibitor_enzyme_code})
MERGE (m)-[i:INHIBITS]->(enz)
ON CREATE SET
  i.potency = 'strong',  // debe venir de datos
  i.mechanism = 'competitive',
  i.created_at = datetime();
```

---

## 8. Consideraciones de Performance

### 8.1 Índices Críticos

```cypher
// Para queries de interacciones
CREATE INDEX medication_metabolism_enzymes_idx IF NOT EXISTS
FOR (m:Medication) ON (m.metabolism_enzymes);

// Para queries de pacientes por riesgo
CREATE INDEX user_risk_level_idx IF NOT EXISTS
FOR (u:User) ON (u.risk_level);

// Para queries temporales
CREATE INDEX event_occurred_at_idx IF NOT EXISTS
FOR (e:Event) ON (e.occurred_at);
```

### 8.2 Particionado (si escala)

- **Por usuario**: No particionar, pero considerar `:User` como root y todos los datos debajo (grafo personal)
- **Por tiempo**: Para nodos `:Event`, usar timestamp + possibly archive a Neo4j Fabric shards

### 8.3 Cache

- Queries frecuentes (medicamentos de un paciente) → Redis cache (key: `user:{id}:medications`, TTL 5 min)
- Resultados de RAG también cachear

---

## 9. Ejemplo: Grafo Completo de un Paciente

```cypher
// Paciente: Juan Pérez, 35 años, alcohol + ansiedad
(u:User {
  uuid: "user-123",
  email: "juan@email.com",
  role: "patient",
  age: 35,
  stage_of_change: "action",
  primary_substance: "alcohol",
  mental_health_details: ["GAD"],
  risk_level: "medium"
})

// Medicamentos que toma
(u)-[:TAKES {
  dose: "50mg",
  frequency: "once daily",
  schedule_time: "08:00",
  start_date: date("2025-01-15"),
  status: "active"
}]->(m1:Medication {
  generic_name: "naltrexona",
  atc_code: "N07BB04",
  metabolism_enzymes: [],
  addiction_potential: 0.0
})

(u)-[:TAKES {
  dose: "100mg",
  frequency: "once daily",
  schedule_time: "07:00",
  start_date: date("2025-01-20"),
  status: "active"
}]->(m2:Medication {
  generic_name: "sertralina",
  atc_code: "N06AB03",
  metabolism_enzymes: ["CYP2D6", "CYP3A4"]
})

// Condición diagnosticada
(u)-[:HAS_CONDITION {
  diagnosed_at: date("2024-11-01"),
  severity: "moderate"
}]->(c:Condition {
  code: "F41.1",
  name: "Trastorno de ansiedad generalizada"
})

// Síntomas reportados recientemente
(u)-[:REPORTS_SYMPTOM {
  intensity: 7,
  last_reported: datetime("2025-02-12T09:00:00")
}]->(sym1:Symptom {code: "anxiety"})

// Consumo de sustancia
(u)-[:CONSUMES {
  frequency: "regular",
  last_occurrence: datetime("2025-02-11T22:00:00")
}]->(s:Substance {code: "alcohol"})

// Conocimiento accedido
(u)-[:ACCESSED {
  accessed_at: datetime("2025-02-10T14:30:00"),
  engagement_level: "read_fully"
}]->(k:Knowledge {
  chunk_id: "chunk-abc123",
  metadata: {type: "patient_education", topic: "naltrexone"}
})

// Relaciones generales (pre-cargadas en el grafo)
// naltrexona - alcohol (interacción)
(m1)-[:INTERACTS_WITH_SUBSTANCE {
  risk_level: 0.9,
  mechanism: "naltrexone blocks opioid receptors, reducing alcohol craving but also blocking euphoric effects of opioids",
  advice: "Do not combine with opioids; naltrexone is used to support abstinence from alcohol"
}]->(s)

// sertralina metabolizada por CYP2D6
(m2)-[:METABOLIZED_BY {contribution: 0.5, is_primary: true}]->(:Enzyme {code: "CYP2D6"})

// Evento de crisis (si existiera)
(e:Event {
  uuid: "event-xyz789",
  type: "crisis",
  occurred_at: datetime("2025-02-05T03:00:00"),
  severity: "high"
})<-[:EXPERIENCED]-(u)
```

---

## 10. Próximos Pasos Técnicos

1. **Implementar migraciones 001-003** (constraints, condiciones, síntomas, enzimas)
2. **Preparar datos de catálogo**:
   - Extraer condiciones/síntomas de ICD-10
   - Extraer enzimas de base de datos PharmGKB
   - Crear script de carga de medicamentos desde FDA/ANMAT
3. **Diseñar pipeline de ingestión** para interacciones (Stockley, DrugBank, etc.)
4. **Implementar sync event-driven** desde PostgreSQL (o directo desde app)
5. **Escribir queries de ejemplo** para cada sección (check-in, dashboard, alertas, chatbot)
6. **Testear con datos sintéticos** de pacientes

---

## 11. Apéndices

### Apéndice A: Lista Completa de Códigos ATC (Top 1000)

*(Se llenará con datos reales de WHO)*

### Apéndice B: Lista de Enzimas CYP450 y Variantes

```yaml
CYP2D6:
  - *1: normal
  - *2: normal
  - *3: none
  - *4: none
  - *5: none
  - *10: decreased
  - *17: decreased
  - *41: decreased
CYP2C19:
  - *1: normal
  - *2: none
  - *3: none
  - *17: increased
CYP2C9:
  - *1: normal
  - *2: decreased
  - *3: decreased
```

### Apéndice C: Matriz de Interacciones Críticas (Top 50)

Lista manual curada de interacciones que deben estar en grafo desde el inicio:

| Medicamento A | Medicamento B | Severidad | Mecanismo |
|---------------|---------------|-----------|-----------|
| sertralina | fluoxetina | critical | serotonin syndrome |
| clonazepam | alcohol | critical | respiratory depression |
|威波 待定...

---

*Documento técnico detallado. Revisar con farmacéutico antes de implementación.*