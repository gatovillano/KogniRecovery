# KogniRecovery - Data Flow Diagram

## Arquitectura General

```mermaid
graph TB
    subgraph CLIENT["📱 Cliente (React Native / Expo)"]
        direction TB
        UI["Interfaz de Usuario"]
        NAV["React Navigation\n(Native Stack + Bottom Tabs)"]

        subgraph SCREENS["Pantallas"]
            AUTH_S["Login / Register"]
            DASH_S["Dashboard"]
            CHECK_S["Check-In / Bitácora"]
            CHAT_S["Chatbot (LÚA)"]
            MED_S["Medicamentos"]
            PROF_S["Perfil / Config AI"]
            FAM_S["Dashboard Familiar"]
            NOTES_S["Notas"]
            EXP_S["Gastos Sustancias"]
        end

        subgraph STATE["Estado (Zustand)"]
            AUTH_STORE["authStore\n(SecureStore)"]
            CHECK_STORE["checkinStore"]
            UI_STORE["uiStore"]
        end

        API_CLIENT["API Client\n(fetch wrapper)\n- JWT injection\n- Token refresh\n- Retry logic"]
    end

    subgraph SERVER["🖥️ Backend (Node.js / Express)"]
        direction TB
        MW["Middleware\n- Auth (JWT)\n- CORS\n- Helmet\n- Validation"]

        subgraph ROUTES["Rutas API (/api/v1/)"]
            AUTH_R["/auth/*"]
            CHECK_R["/checkins/*"]
            CRAVE_R["/cravings/*"]
            CHAT_R["/chatbot/*"]
            MED_R["/medications/*"]
            PROF_R["/profiles/*"]
            FAM_R["/family/*"]
            JOURNAL_R["/journal/*"]
            NOTES_R["/notes/*"]
            DOSE_R["/substance-doses/*"]
            EXP_R["/substance-expenses/*"]
            PRIV_R["/privacy/*"]
            DASH_R["/dashboard/*"]
        end

        subgraph CONTROLLERS["Controladores"]
            AUTH_C["auth.controller"]
            CHECK_C["checkin.controller"]
            CRAVE_C["craving.controller"]
            CHAT_C["chatbot.controller"]
            MED_C["medication.controller"]
            PROF_C["profile.controller"]
            JOURNAL_C["journal.controller"]
            NOTE_C["note.controller"]
            DOSE_C["substance_dose.controller"]
        end

        subgraph SERVICES["Servicios"]
            AUTH_SVC["auth.service\n- bcrypt hash\n- JWT generation"]
            LANGGRAPH["langgraph.service\n(LangGraph StateGraph)"]
            RAG["rag.service\n(RAG Pipeline)"]
            EMBED["embedding.service\n(Xenova/all-MiniLM-L6-v2)"]
            NEO4J_SVC["neo4j.service"]
            ALERT["alert.service"]
            NOTIF["notification.service"]
            TTS["tts.service\n(Coqui XTTS)"]
            PRIVACY["privacy.service"]
            SEARCH["search.service"]
        end

        subgraph AGENT["🤖 Agente LÚA (LangGraph)"]
            direction LR
            MEMORY_IN["Memory Node\n(lectura contexto)"]
            AGENT_N["Agent Node\n(LLM + tools)"]
            TOOLS_N["Tools Node\n(ejecución)"]
            MEMORY_OUT["Memory Node\n(extract insights)"]

            MEMORY_IN --> AGENT_N
            AGENT_N -->|"decide usar tool"| TOOLS_N
            TOOLS_N -->|"resultado"| AGENT_N
            AGENT_N -->|"respuesta"| MEMORY_OUT
        end

        subgraph SKILLS["Herramientas del Agente"]
            KG_TOOL["knowledgeGraphSearchTool"]
            RAG_TOOL["ragSearchTool"]
            LIST_DOC["listDocumentsTool"]
            GET_DOC["getDocumentContentTool"]
            DOSE_TOOL["substanceDoseTool"]
            SAVE_NOTE["saveNoteTool"]
            LIST_NOTE["listNotesTool"]
            DEL_NOTE["deleteNoteTool"]
        end
    end

    subgraph DATA["💾 Capa de Datos"]
        direction TB

        subgraph POSTGRES["🐘 PostgreSQL"]
            PG_USERS["users"]
            PG_PROFILES["profiles"]
            PG_CHECKINS["checkins"]
            PG_STREAKS["checkin_streaks"]
            PG_CRAVINGS["cravings"]
            PG_MEDS["medications"]
            PG_CONVOS["conversations"]
            PG_MSGS["messages"]
            PG_CTX["context_history"]
            PG_TOKENS["refresh_tokens"]
            PG_WALL["wall_messages"]
            PG_NOTIFS["notifications"]
            PG_DOSES["substance_doses"]
            PG_EXPENSES["substance_expenses"]
            PG_HABITS["habits"]
            PG_CONTACTS["emergency_contacts"]
            PG_INVITES["sharing_invitations"]
            PG_NOTES["notes"]
        end

        subgraph NEO4J["🔗 Neo4j (Knowledge Graph)"]
            NEO_USER["Usuario"]
            NEO_CHECKIN["CheckIn + Etiquetas"]
            NEO_CRAVING["Craving + Triggers"]
            NEO_SUBSTANCE["Sustancia"]
            NEO_MED["Medicamento"]
            NEO_RESOURCE["Recurso"]
            NEO_ALERT["Alerta"]
            NEO_VINDEX["chunk_vector_index\n(Embeddings RAG)"]
        end

        subgraph REDIS["⚡ Redis"]
            REDIS_CACHE["Cache Layer"]
        end

        subgraph KNOWLEDGE["📚 Base de Conocimiento"]
            KB_MARCO["MARCO_TEÓRICO.md"]
            KB_PERSONAS["PERSONAS.md"]
            KB_PROMPT["PROMPT_SISTEMA_BASE.md"]
            KB_PERFIL["PROMPTS_POR_PERFIL.md"]
            KB_ESCEN["ESCENARIOS_CONVERSACIONALES.md"]
            KB_PSI["psicoeducacion/"]
            KB_TEC["tecnicas/"]
            KB_FAQS["faqs/CRAFFT"]
            KB_LOCALES["recursos_locales/cl/"]
        end
    end

    subgraph EXTERNAL["🌐 Servicios Externos"]
        OPENAI["OpenAI / OpenRouter\n(LLM Provider)"]
        XTTS["Coqui XTTS\n(Text-to-Speech)"]
        EXPO_NOTIF["Expo Notifications\n(Push)"]
    end

    %% Client → Server
    UI --> NAV
    NAV --> SCREENS
    SCREENS --> API_CLIENT
    API_CLIENT -->|"HTTPS / JWT"| MW

    %% Server routing
    MW --> ROUTES
    ROUTES --> CONTROLLERS
    CONTROLLERS --> SERVICES

    %% Services → Data
    AUTH_SVC -->|"SQL"| POSTGRES
    LANGGRAPH -->|"cypher queries"| NEO4J_SVC
    LANGGRAPH -->|"rag retrieval"| RAG
    RAG --> EMBED
    NEO4J_SVC -->|"bolt protocol"| NEO4J
    ALERT -->|"SQL"| POSTGRES
    NOTIF --> EXPO_NOTIF
    TTS --> XTTS
    LANGGRAPH --> OPENAI

    %% Agent tools
    AGENT_N --> TOOLS_N
    TOOLS_N --> KG_TOOL
    TOOLS_N --> RAG_TOOL
    TOOLS_N --> LIST_DOC
    TOOLS_N --> GET_DOC
    TOOLS_N --> DOSE_TOOL
    TOOLS_N --> SAVE_NOTE
    TOOLS_N --> LIST_NOTE
    TOOLS_N --> DEL_NOTE

    KG_TOOL --> NEO4J_SVC
    RAG_TOOL --> RAG
    LIST_DOC --> KNOWLEDGE
    GET_DOC --> KNOWLEDGE
    DOSE_TOOL --> PG_DOSES
    SAVE_NOTE --> PG_NOTES
    LIST_NOTE --> PG_NOTES
    DEL_NOTE --> PG_NOTES

    %% Embeddings pipeline
    EMBED -->|"vector storage"| NEO_VINDEX
    KNOWLEDGE -->|"ingest"| EMBED

    %% Redis
    SERVICES --> REDIS_CACHE

    %% Models → PostgreSQL
    CONTROLLERS -->|"via models (SQL)"| POSTGRES
    SERVICES -->|"SQL queries"| POSTGRES

    %% Auth flow
    AUTH_STORE -->|"credentials"| API_CLIENT

    %% Check-in dual write
    CHECK_C -->|"SQL insert"| PG_CHECKINS
    CHECK_C -->|"graph create"| NEO4J_SVC

    %% Context extraction
    MEMORY_OUT -->|"persist context"| PG_CTX
    MEMORY_OUT -->|"persist preferences"| NEO_USER
```

---

## Flujos Detallados

### 1. Flujo de Autenticación

```mermaid
sequenceDiagram
    participant C as 📱 Cliente
    participant AC as API Client
    participant S as 🖥️ Express API
    participant A as auth.service
    participant PG as 🐘 PostgreSQL
    participant SS as SecureStore

    C->>AC: POST /api/v1/auth/login {email, password}
    AC->>S: Request + Content-Type
    S->>S: Middleware (CORS, Helmet, Validation)
    S->>A: authenticate(email, password)
    A->>PG: SELECT * FROM users WHERE email = $1
    PG-->>A: user row
    A->>A: bcrypt.compare(password, hash)
    A->>A: generateJWT(userId) → access_token (15m)
    A->>A: generateRefreshToken() → refresh_token (30d)
    A->>PG: INSERT INTO refresh_tokens (token, user_id, expires_at)
    PG-->>A: OK
    A-->>S: { user, access_token, refresh_token }
    S-->>C: 200 { user, tokens }
    C->>AC: store tokens
    AC->>SS: setItem('auth_token', access_token)
    AC->>SS: setItem('refresh_token', refresh_token)
```

### 2. Flujo del Chatbot (LÚA)

```mermaid
sequenceDiagram
    participant C as 📱 Cliente
    participant CC as chatbot.controller
    participant LG as LangGraph Agent
    participant MEM_IN as Memory Node (lectura)
    participant AG as Agent Node
    participant TL as Tools Node
    participant KG as KG Search Tool
    participant RAG as RAG Search Tool
    participant NEO as 📊 Neo4j
    participant PG as 🐘 PostgreSQL
    participant OAI as OpenAI/Router
    participant MEM_OUT as Memory Node (escritura)

    C->>CC: POST /chatbot/conversations/:id/messages
    CC->>PG: load conversation + messages
    PG-->>CC: conversation history
    CC->>LG: invoke({ messages, userId })

    LG->>MEM_IN: read context_history + preferences
    MEM_IN->>PG: SELECT FROM context_history WHERE user_id
    MEM_IN->>NEO: MATCH (u:Usuario)-[:TIENE_PREFERENCIA]->(p)
    PG-->>MEM_IN: user context
    NEO-->>MEM_IN: preferences
    MEM_IN-->>AG: enriched state

    AG->>OAI: chat completion with tools bound
    OAI-->>AG: tool_calls (if needed)

    alt Tool: knowledgeGraphSearch
        AG->>TL: invoke tool
        TL->>KG: execute({ query })
        KG->>NEO: Cypher query
        NEO-->>KG: graph results
        KG-->>TL: formatted results
        TL-->>AG: tool response
    else Tool: ragSearch
        AG->>TL: invoke tool
        TL->>RAG: execute({ query })
        RAG->>NEO: vector search + KG + keyword
        NEO-->>RAG: ranked chunks
        RAG->>OAI: re-rank with LLM
        OAI-->>RAG: re-ranked results
        RAG-->>TL: context documents
        TL-->>AG: tool response
    else Tool: substanceDose / notes
        AG->>TL: invoke tool
        TL->>PG: INSERT/SELECT/DELETE
        PG-->>TL: result
        TL-->>AG: tool response
    end

    AG->>OAI: final completion with tool results
    OAI-->>AG: assistant response
    AG-->>MEM_OUT: conversation + insights

    MEM_OUT->>PG: INSERT INTO context_history (extracted insights)
    MEM_OUT->>NEO: MERGE (u:Usuario)-[:TIENE_PREFERENCIA]->(p)
    MEM_OUT-->>LG: final state

    LG-->>CC: response message
    CC->>PG: INSERT INTO messages (assistant response)
    CC-->>C: 200 { content, suggestions }
```

### 3. Flujo de Streaming del Chatbot

```mermaid
sequenceDiagram
    participant C as 📱 Cliente
    participant CC as chatbot.controller
    participant LG as LangGraph Agent
    participant OAI as OpenAI/Router

    C->>CC: POST /chatbot/conversations/:id/stream
    CC->>C: 200 OK (SSE headers: Content-Type: text/event-stream)

    CC->>LG: streamEvents({ messages })

    loop Stream de tokens
        LG->>OAI: streaming completion
        OAI-->>LG: token chunk
        LG-->>CC: event: token { content }
        CC-->>C: data: {"type":"token","content":"..."}
    end

    loop Tool execution events
        LG-->>CC: event: tool_start { tool, input }
        CC-->>C: data: {"type":"tool_start","tool":"..."}
        LG-->>CC: event: tool_end { tool, output }
        CC-->>C: data: {"type":"tool_end","tool":"..."}
    end

    LG-->>CC: stream end
    CC-->>C: data: {"type":"done"}
```

### 4. Flujo de Check-In

```mermaid
sequenceDiagram
    participant C as 📱 Cliente
    participant CC as checkin.controller
    participant PG as 🐘 PostgreSQL
    participant NEO as 📊 Neo4j
    participant AS as alert.service

    C->>CC: POST /api/v1/checkins { mood, sleep, ... }
    CC->>CC: validate input (express-validator)

    par Escritura dual
        CC->>PG: INSERT INTO checkins (user_id, mood, ...)
        PG-->>CC: checkin row
    and
        CC->>NEO: CREATE (c:CheckIn { ... })-[:TIENE_ETIQUETA]->(e:Etiqueta)
        NEO-->>CC: OK
    end

    CC->>PG: UPDATE checkin_streaks SET current_streak = ...
    PG-->>CC: streak updated

    CC->>AS: evaluateAlerts(userId, checkin)
    AS->>PG: check craving patterns
    AS->>NEO: check risk patterns
    AS-->>CC: alerts (if any)

    CC-->>C: 201 { checkin, streak, alerts }
```

### 5. Pipeline RAG (Ingesta y Recuperación)

```mermaid
graph LR
    subgraph INGEST["📥 Pipeline de Ingesta"]
        KB["Base de Conocimiento\n(knowledge_base/*.md)"]
        SCRIPT["ingest_knowledge.ts"]
        CHUNK["Chunking\n(RecursiveCharacterTextSplitter)"]
        EMB["Embedding\n(Xenova/all-MiniLM-L6-v2)\n384 dimensions"]
        STORE["Almacenamiento\nNeo4j + chunk_vector_index"]

        KB --> SCRIPT
        SCRIPT --> CHUNK
        CHUNK --> EMB
        EMB --> STORE
    end

    subgraph RETRIEVAL["🔍 Pipeline de Recuperación"]
        Q["User Query"]
        VEC["Vector Search\n(Neo4j vector index)\nweight: 0.4"]
        KG["Knowledge Graph Search\n(Neo4j Cypher)\nweight: 0.4"]
        KW["Keyword Search\n(full-text)\nweight: 0.2"]
        ENS["Ensemble\n(weighted combination)"]
        RERANK["Re-ranking\n(LLM-based)"]
        CTX["Context Documents"]

        Q --> VEC
        Q --> KG
        Q --> KW
        VEC --> ENS
        KG --> ENS
        KW --> ENS
        ENS --> RERANK
        RERANK --> CTX
    end

    STORE -.->|"vector_index"| VEC
```

### 6. Flujo del Dashboard Familiar

```mermaid
sequenceDiagram
    participant C as 📱 Cliente (Familiar)
    participant FC as family controller
    participant PG as 🐘 PostgreSQL

    C->>FC: GET /api/v1/family/dashboard
    FC->>FC: verify user role = 'family'
    FC->>PG: SELECT FROM sharing_invitations WHERE family_user_id = $1 AND status = 'accepted'
    PG-->>FC: linked patients

    loop Para cada paciente vinculado
        FC->>PG: SELECT last checkin WHERE user_id = patient_id
        FC->>PG: SELECT current_streak FROM checkin_streaks
        FC->>PG: SELECT active cravings WHERE intensity > 5
        FC->>PG: SELECT recent wall_messages
    end

    FC-->>C: 200 { patients: [{ profile, last_checkin, streak, active_cravings, wall_messages }] }
```

### 7. Flujo de Tracking de Dosis de Sustancias

```mermaid
sequenceDiagram
    participant C as 📱 Cliente
    participant DC as substance_dose.controller
    participant PG as 🐘 PostgreSQL
    participant NEO as 📊 Neo4j

    C->>DC: POST /api/v1/substance-doses { substance, amount, unit, context }
    DC->>DC: validate (express-validator)

    par Escritura dual
        DC->>PG: INSERT INTO substance_doses (user_id, substance, ...)
        PG-->>DC: dose record
    and
        DC->>NEO: MERGE (s:Sustancia {name}) CREATE (d:Dosis)-[:ES_DE]->(s)
        NEO-->>DC: OK
    end

    DC-->>C: 201 { dose }
```

### 8. Flujo de Perfil de Inteligencia (LÚA Memory)

```mermaid
sequenceDiagram
    participant C as 📱 Cliente
    participant PC as profile.controller
    participant PG as 🐘 PostgreSQL
    participant NEO as 📊 Neo4j

    C->>PC: GET /api/v1/profiles/intelligence
    PC->>PG: SELECT FROM context_history WHERE user_id = $1 ORDER BY created_at DESC
    PG-->>PC: extracted insights
    PC->>NEO: MATCH (u:Usuario)-[r:TIENE_PREFERENCIA]->(p) RETURN p
    NEO-->>PC: graph preferences
    PC-->>C: 200 { insights, preferences, patterns }
```

---

## Diagrama de Componentes - Agente LÚA

```mermaid
graph TB
    subgraph LANGGRAPH["LangGraph StateGraph"]
        START([START]) --> MEM_R["🧠 Memory Node\n(lectura)"]
        MEM_R -->|"estado enriquecido"| AGENT["🤖 Agent Node"]
        AGENT -->|"tool_calls"| TOOLS["🔧 Tools Node"]
        TOOLS -->|"resultado tool"| AGENT
        AGENT -->|"respuesta final"| MEM_W["🧠 Memory Node\n(escritura)"]
        MEM_W --> END([END])
    end

    subgraph TOOLS_DETAIL["Herramientas Disponibles"]
        T1["knowledgeGraphSearch\n🔍 Búsqueda grafo Neo4j"]
        T2["ragSearch\n📄 Búsqueda RAG documentos"]
        T3["listDocuments\n📋 Listar docs conocimiento"]
        T4["getDocumentContent\n📖 Leer doc específico"]
        T5["substanceDose\n💊 Registrar dosis"]
        T6["saveNote\n📝 Guardar nota"]
        T7["listNotes\n📋 Listar notas"]
        T8["deleteNote\n🗑️ Eliminar nota"]
    end

    TOOLS --> T1
    TOOLS --> T2
    TOOLS --> T3
    TOOLS --> T4
    TOOLS --> T5
    TOOLS --> T6
    TOOLS --> T7
    TOOLS --> T8

    T1 -->|"Cypher"| NEO4J_G[("🔗 Neo4j")]
    T2 -->|"vector + graph + keyword"| NEO4J_G
    T3 -->|"read files"| KB_FS["📁 knowledge_base/"]
    T4 -->|"read files"| KB_FS
    T5 -->|"SQL"| PG_D[("🐘 PostgreSQL")]
    T6 -->|"SQL"| PG_D
    T7 -->|"SQL"| PG_D
    T8 -->|"SQL"| PG_D

    AGENT -->|"LLM call"| OPENAI_LLM["🌐 OpenAI / OpenRouter"]
```

---

## Diagrama de Infraestructura

```mermaid
graph TB
    subgraph DOCKER["🐳 Docker Compose"]
        subgraph APP_CONTAINERS["Aplicación"]
            FE["Frontend\nExpo Web\n:19006 / :8084"]
            API["Backend API\nExpress\n:3003"]
        end

        subgraph DB_CONTAINERS["Bases de Datos"]
            PG_D["PostgreSQL\n:5437"]
            REDIS_D["Redis\n:6380"]
            NEO_D["Neo4j\n:7475 (HTTP)\n:7688 (Bolt)"]
        end

        subgraph ML_CONTAINERS["ML Services"]
            XTTS_D["Coqui XTTS\n:5002 (GPU)"]
        end

        subgraph TOOLS_C["Herramientas (opcional)"]
            PGA["pgAdmin\n:5050"]
        end
    end

    FE -->|"API calls"| API
    API -->|"SQL"| PG_D
    API -->|"Bolt"| NEO_D
    API -->|"Cache"| REDIS_D
    API -->|"TTS"| XTTS_D
```

---

## Tablas PostgreSQL y sus Relaciones con Funcionalidades

| Tabla                 | Funcionalidad Principal  | Escritura                    | Lectura                  |
| --------------------- | ------------------------ | ---------------------------- | ------------------------ |
| `users`               | Autenticación, config AI | auth.service                 | auth middleware          |
| `profiles`            | Perfil usuario           | auth.service                 | profile.controller       |
| `checkins`            | Check-in diario          | checkin.controller           | dashboard, family        |
| `checkin_streaks`     | Rachas de check-in       | checkin.controller           | dashboard, family        |
| `cravings`            | Registro antojos         | craving.controller           | dashboard, family, alert |
| `medications`         | Medicamentos             | medication.controller        | medication.controller    |
| `conversations`       | Chat historial           | chatbot.controller           | chatbot.controller       |
| `messages`            | Mensajes chat            | chatbot.controller           | chatbot.controller       |
| `context_history`     | Memoria LÚA              | langgraph (memory node)      | langgraph (memory node)  |
| `refresh_tokens`      | JWT refresh              | auth.service                 | auth.service             |
| `wall_messages`       | Muro familiar            | family controller            | family controller        |
| `notifications`       | Notificaciones push      | notification.service         | notification.service     |
| `substance_doses`     | Dosis sustancias         | substance_dose.controller    | dashboard, family        |
| `substance_expenses`  | Gastos sustancias        | substance_expense.controller | dashboard                |
| `habits`              | Hábitos                  | journal.controller           | journal.controller       |
| `notes`               | Notas (agente/usuario)   | note.controller              | note.controller, agent   |
| `sharing_invitations` | Vínculos familiares      | family controller            | family controller        |
| `emergency_contacts`  | Contactos emergencia     | profile controller           | profile controller       |
