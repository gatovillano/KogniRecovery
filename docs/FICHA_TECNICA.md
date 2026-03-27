# FICHA TÉCNICA — KogniRecovery

## 1. Información General

| Campo                    | Valor                                                      |
| ------------------------ | ---------------------------------------------------------- |
| **Nombre**               | KogniRecovery                                              |
| **Descripción**          | App de acompañamiento en recuperación de adicciones con IA |
| **Versión**              | 1.0.0                                                      |
| **Licencia Frontend**    | ISC                                                        |
| **Licencia Backend**     | MIT                                                        |
| **Idioma principal**     | Español (foco LATAM/Chile)                                 |
| **Plataformas objetivo** | iOS, Android, Web                                          |

---

## 2. Stack Tecnológico

### Frontend (Móvil)

| Tecnología                    | Versión                                 | Uso                             |
| ----------------------------- | --------------------------------------- | ------------------------------- |
| React Native                  | 0.81.5                                  | Framework móvil                 |
| Expo                          | ^54.0.0                                 | Build system & managed workflow |
| TypeScript                    | ~5.9.2                                  | Tipado estático (strict mode)   |
| React Navigation              | v7 (stack + bottom-tabs + native-stack) | Navegación                      |
| Zustand                       | ^4.4.7                                  | Gestión de estado               |
| expo-secure-store             | ~15.0.8                                 | Persistencia segura de tokens   |
| expo-notifications            | ~0.32.16                                | Push notifications              |
| react-native-chart-kit        | ^6.12.0                                 | Gráficos y visualizaciones      |
| react-native-reanimated       | ~4.1.1                                  | Animaciones                     |
| react-native-markdown-display | ^7.0.2                                  | Renderizado Markdown            |
| expo-image-picker             | ~17.0.10                                | Subida de imágenes              |
| expo-haptics                  | ~15.0.8                                 | Feedback háptico                |
| expo-network                  | ~8.0.8                                  | Verificación de conectividad    |
| expo-av                       | ~16.0.8                                 | Reproducción de audio           |
| EAS Build                     | ^18.4.0                                 | Cloud build                     |

### Backend (Servidor)

| Tecnología           | Versión | Uso                                        |
| -------------------- | ------- | ------------------------------------------ |
| Express.js           | ^4.21.0 | Framework HTTP                             |
| PostgreSQL (pg)      | ^8.13.0 | Base de datos relacional principal         |
| Neo4j                | 5.16.0  | Grafo de conocimiento + búsqueda vectorial |
| Redis                | 7       | Caché y sesiones                           |
| LangChain            | ^1.2.36 | Orquestación LLM                           |
| LangGraph            | ^1.2.5  | Workflow de agentes IA (grafos de estado)  |
| @langchain/openai    | ^1.3.0  | Integración OpenAI                         |
| OpenAI SDK           | ^6.25.0 | API directa OpenAI                         |
| @xenova/transformers | ^2.17.2 | Embeddings locales (all-MiniLM-L6-v2)      |
| bcryptjs             | ^2.4.3  | Hash de contraseñas                        |
| jsonwebtoken         | ^9.0.2  | Autenticación JWT                          |
| express-validator    | ^7.2.0  | Validación de requests                     |
| helmet               | ^7.1.0  | Headers de seguridad                       |
| cors                 | ^2.8.5  | Middleware CORS                            |
| zod                  | ^3.23.8 | Validación de esquemas                     |
| pdf-parse            | ^1.1.1  | Ingesta de conocimiento desde PDF          |
| cheerio              | ^1.2.0  | Web scraping                               |
| axios                | ^1.13.6 | Cliente HTTP                               |

### Bases de Datos

| Base       | Versión          | Uso                                       | Puerto                    |
| ---------- | ---------------- | ----------------------------------------- | ------------------------- |
| PostgreSQL | 15-alpine        | BD relacional principal                   | 5437                      |
| Redis      | 7-alpine         | Caché, sesiones                           | 6380                      |
| Neo4j      | 5.16.0-community | Grafo de conocimiento, búsqueda vectorial | 7688 (Bolt) / 7475 (HTTP) |

### Servicios Adicionales

| Servicio         | Uso                      | Puerto |
| ---------------- | ------------------------ | ------ |
| XTTS (Coqui TTS) | Texto a voz para chatbot | 5002   |
| pgAdmin          | Administración de BD     | 5050   |

---

## 3. Arquitectura del Proyecto

### Estructura de Directorios

```
KogniRecovery/
├── App.tsx                          # Componente raíz
├── src/                             # Frontend React Native
│   ├── assets/                      # Imágenes, fuentes, iconos
│   ├── components/                  # 14 componentes UI reutilizables
│   ├── screens/                     # Pantallas por feature
│   ├── navigation/                  # Configuración de navegación
│   ├── store/                       # Stores Zustand (auth, ui, checkin)
│   ├── services/                    # API client, endpoints
│   ├── hooks/                       # Custom hooks
│   ├── theme/                       # Sistema de diseño
│   ├── types/                       # Definiciones TypeScript
│   ├── api/                         # Helpers de API (privacidad)
│   └── utils/                       # Funciones utilitarias
├── server/                          # Backend Express.js
│   └── src/
│       ├── config/                  # Configuración, pools DB, prompts IA
│       ├── controllers/             # 13 controladores HTTP
│       ├── middleware/               # Auth, CORS, errores, validación
│       ├── models/                  # 17 modelos PostgreSQL (queries SQL)
│       ├── routes/                  # 15 archivos de rutas
│       ├── services/                # Lógica de negocio, IA, RAG, Neo4j
│       ├── skills/                  # 4 herramientas del agente IA
│       ├── scripts/                 # Migraciones, ingesta de conocimiento
│       └── utils/                   # Utilidades de encriptación
├── docker/                          # Configuración Docker
├── scripts/                         # Scripts SQL, utilidades
├── docs/                            # Documentación
└── docker-compose.yml               # Orquestación de 7 servicios
```

### Patrones de Arquitectura

| Patrón                           | Aplicación                                                        |
| -------------------------------- | ----------------------------------------------------------------- |
| **Controller → Service → Model** | Backend: capas limpias de separación                              |
| **Repository Pattern**           | Modelos encapsulan queries SQL raw contra PostgreSQL              |
| **Provider Pattern**             | ThemeContext envuelve toda la app                                 |
| **Store Pattern**                | Zustand con persistencia vía expo-secure-store                    |
| **Conditional Navigation**       | RootNavigator alterna AuthStack/MainTabs según autenticación      |
| **Component Composition**        | Kit UI reutilizable con props tipados                             |
| **Middleware Pipeline**          | Auth → Validación → Handler → Error Handler                       |
| **Singleton**                    | Pool de DB, driver Neo4j                                          |
| **Agent Architecture**           | LangGraph: nodos `agent` → `tools` → `memory`                     |
| **RAG Pipeline**                 | Vector search + KG search + keyword search con ensemble ponderado |

---

## 4. Base de Datos PostgreSQL — Esquema

30+ tablas creadas vía sistema de migraciones versionadas (`server/src/scripts/migrate.ts`):

| Tabla                   | Descripción                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `users`                 | Autenticación, roles (patient/family/professional/admin), config LLM  |
| `refresh_tokens`        | Gestión JWT refresh tokens con tracking de dispositivo                |
| `profiles`              | Historial de sustancias, motivación, demografía                       |
| `profile_settings`      | Frecuencia check-in, privacidad, personalidad IA                      |
| `substance_preferences` | Sustancias de interés del usuario                                     |
| `checkins`              | Tracking emocional diario (mood, ansiedad, energía, sueño, ejercicio) |
| `mood_history`          | Tendencias de ánimo con promedios semanales                           |
| `checkin_streaks`       | Rachas (actual, más larga, total completados)                         |
| `cravings`              | Eventos de craving con intensidad, triggers, resultados               |
| `craving_patterns`      | Patrones identificados de craving                                     |
| `coping_strategies`     | Toolkit de afrontamiento con tracking de efectividad                  |
| `strategy_usage`        | Log de uso de estrategias                                             |
| `craving_triggers`      | Triggers identificados con probabilidad                               |
| `scenario_configs`      | Configuraciones de escenarios del chatbot                             |
| `conversations`         | Conversaciones con contexto                                           |
| `conversation_sessions` | Sesiones individuales dentro de conversaciones                        |
| `messages`              | Mensajes de chat con metadata y detección de intención                |
| `message_attachments`   | Adjuntos (recursos, ejercicios)                                       |
| `message_intents`       | Detección NLU por mensaje                                             |
| `quick_responses`       | Respuestas rápidas preconfiguradas                                    |
| `context_history`       | Memoria/preferencias IA persistidas por usuario                       |
| `llm_logs`              | Log de uso API LLM (tokens, costo, latencia)                          |
| `sharing_invitations`   | Vínculos paciente-familiar                                            |
| `emergency_contacts`    | Gestión de contactos de emergencia                                    |
| `notifications`         | Notificaciones in-app                                                 |
| `wall_messages`         | Muro de apoyo familiar                                                |
| `daily_notes`           | Notas diarias del diario                                              |
| `habit_entries`         | Entradas de tracking de hábitos                                       |
| `social_entries`        | Entradas de entorno social                                            |
| `activity_entries`      | Sentimientos de actividad (antes/durante/después)                     |
| `consumption_analysis`  | Análisis de consumo/impulsos                                          |
| `consumption_events`    | Log detallado de consumo de sustancias                                |
| `habits`                | Definiciones de hábitos (positivos/negativos)                         |
| `habit_completions`     | Tracking diario de hábitos completados                                |
| `medications`           | Horarios de medicación                                                |
| `medication_logs`       | Log de medicación tomada                                              |
| `substance_expenses`    | Tracking financiero de gasto en sustancias                            |
| `substance_doses`       | Log detallado de dosis                                                |

**Vistas:** `users_with_profiles`, `checkin_stats`
**Triggers:** Auto-update de columnas `updated_at`

---

## 5. Grafo de Conocimiento (Neo4j)

| Elemento         | Detalle                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Nodos**        | Usuario, CheckIn, Craving, Sustancia, Medicamento, Recurso, Alerta, Conversacion, Mensaje, Etiqueta, Perfil, Atributo       |
| **Relaciones**   | Preferencias usuario, asociaciones de sustancias, interacciones farmacológicas, técnicas terapéuticas                       |
| **Vector Index** | `chunk_vector_index` para búsqueda semántica sobre chunks de la base de conocimiento (384 dimensiones, cosine similarity)   |
| **Propósito**    | Permite al chatbot IA consultar datos estructurados del paciente, interacciones farmacológicas y relaciones de conocimiento |

---

## 6. Sistema de IA — Chatbot LÚA

### Arquitectura del Agente (LangGraph)

```
[Usuario] → Agent Node → Decision:
                          ├→ Responder directamente
                          └→ Tools Node:
                              ├→ rag_search
                              ├→ knowledge_graph_search
                              ├→ list_documents
                              ├→ get_document_content
                              ├→ record_substance_dose
                              ├→ save_note
                              ├→ list_notes
                              └→ delete_note
                          → Memory Node (extrae y persiste preferencias)
```

### Pipeline RAG

1. Query del usuario → generación de embedding contextual (Xenova/all-MiniLM-L6-v2, 384 dimensiones)
2. Búsqueda vectorial en Neo4j (`chunk_vector_index`) + KG search + keyword search
3. Ensemble ponderado (vector: 0.4, KG: 0.4, keyword: 0.2)
4. Re-ranking vía LLM (scoring 0-1 por chunk)
5. Inyección de contexto en system prompt

### Proveedores LLM Soportados

- OpenAI (default)
- OpenRouter
- Azure OpenAI
- Cualquier API compatible OpenAI (via base URL)
- Configuración de API key por usuario con almacenamiento encriptado

### Capacidades Clínicas del System Prompt (LÚA v2.0)

- Modelo biopsicosocial
- Entrevista Motivacional (OARS)
- Técnicas CBT (urge surfing, análisis ABC)
- DBT (STOP, grounding)
- Atención informada por trauma (TIC)
- Protocolo de crisis (lógica C-SSRS)
- Personalización por arquetipo (7 variantes)
- Adaptación por etapa de cambio (5 etapas del Modelo Transteórico)
- Citación obligatoria de fuentes

### Arquetipos de Personalización (7)

| Arquetipo            | Tono                 | Enfoque                     |
| -------------------- | -------------------- | --------------------------- |
| `adolescente`        | "Hermano mayor"      | Neuroplasticidad, identidad |
| `joven_adulto`       | Empático-profesional | Presión social, carrera     |
| `profesional_adulto` | Formal, respetuoso   | Estrés laboral, balance     |
| `senior_alcohol`     | Paciente, validante  | Aislamiento, salud física   |
| `trauma_care`        | TIC language         | Evitar triggers, seguridad  |
| `senior_opioides`    | Cuidadoso            | Dolor crónico, dependencia  |
| `rural`              | Accesible            | Recursos limitados, estigma |

### Skills del Agente (8 herramientas)

| Skill         | Herramienta              | Descripción                                        |
| ------------- | ------------------------ | -------------------------------------------------- |
| **RAG**       | `rag_search`             | Búsqueda semántica en base de conocimiento clínico |
| **Document**  | `list_documents`         | Listar documentos disponibles en KB                |
| **Document**  | `get_document_content`   | Leer contenido completo de un archivo KB           |
| **Graph**     | `knowledge_graph_search` | Consultar grafo Neo4j del usuario                  |
| **Substance** | `record_substance_dose`  | Registrar dosis (persiste en MySQL + Neo4j)        |
| **Note**      | `save_note`              | Guardar nota personal                              |
| **Note**      | `list_notes`             | Listar notas guardadas (max 10)                    |
| **Note**      | `delete_note`            | Eliminar nota específica                           |

### TTS

Servicio XTTS (Coqui) para respuestas de voz del chatbot.

---

## 7. API REST — Endpoints

Todos los endpoints bajo prefijo `/api/v1`:

| Grupo de Rutas        | Endpoints                                                                 | Auth  |
| --------------------- | ------------------------------------------------------------------------- | ----- |
| `/auth`               | POST register, login, refresh, logout; GET sessions, verify               | Mixto |
| `/profiles`           | CRUD de perfil de usuario, settings, sustancias, AI settings              | Sí    |
| `/checkins`           | CRUD check-in diario, today, range, streaks, stats, mood history          | Sí    |
| `/cravings`           | CRUD cravings, resolve, stats, patterns, strategies, triggers             | Sí    |
| `/chatbot`            | Conversaciones, mensajes, streaming SSE, TTS, escenarios, context history | Sí    |
| `/dashboard`          | Dashboard completo, overview, emotions, progress                          | Sí    |
| `/family`             | Dashboard familiar, patient progress, checkins, send message              | Sí    |
| `/journal`            | Notes, habits, social, analysis, activities, unified feed                 | Sí    |
| `/medications`        | CRUD medicación, toggle taken, daily status                               | Sí    |
| `/privacy`            | Consent, settings, export (GDPR Art. 15), deletion (Art. 17), audit       | Mixto |
| `/substance-expenses` | CRUD expenses, summary                                                    | Sí    |
| `/consumption`        | Log consumption, list, weekly/daily stats                                 | Sí    |
| `/substance-doses`    | CRUD doses (sync Neo4j)                                                   | Sí    |
| `/notes`              | CRUD notes, toggle pin                                                    | Sí    |
| `/health`             | Health check                                                              | No    |

**Total:** 80+ endpoints en 14 módulos de rutas

---

## 8. Seguridad

| Capa              | Implementación                                                                |
| ----------------- | ----------------------------------------------------------------------------- |
| **Autenticación** | JWT access token (15min) + refresh token (7 días) con rotación                |
| **Contraseñas**   | bcrypt (12 rounds), política: 8+ chars, mayúscula, minúscula, número, símbolo |
| **Headers**       | Helmet (CSP, HSTS, X-Frame-Options, Permissions-Policy)                       |
| **HTTPS**         | Forzado en producción (redirect 301)                                          |
| **CORS**          | Configurable por entorno (mobile: 8081, web: 19006)                           |
| **Rate Limiting** | 100 req/15min general, 5 req/min para auth                                    |
| **API Keys**      | Almacenamiento encriptado por usuario                                         |
| **Tokens**        | Revocación en logout, tracking de dispositivos                                |
| **Cuentas**       | Verificación de estado (active/inactive/suspended)                            |
| **Login**         | Tracking de intentos con bloqueo (5 intentos, 15min lockout)                  |

### Middleware

| Middleware            | Función                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authenticate`        | Extrae Bearer token, verifica JWT, comprueba usuario en BD. Códigos: `NO_TOKEN`, `INVALID_TOKEN_FORMAT`, `TOKEN_EXPIRED`, `INVALID_TOKEN`, `USER_NOT_FOUND` |
| `authorize(...roles)` | RBAC: patient, family, professional, admin                                                                                                                  |
| `securityHeaders`     | Helmet: CSP, HSTS, referrer-policy, noSniff, xssFilter                                                                                                      |
| `enforceHttps`        | Redirect 301 HTTP → HTTPS en producción                                                                                                                     |
| `corsMiddleware`      | Orígenes configurables, preflight 204, 24h max-age                                                                                                          |
| `validate`            | Express-validator → 422 con errores formateados                                                                                                             |
| `errorHandler`        | Handler centralizado: logging + JSON `{ success, error: { code, message } }`                                                                                |
| `asyncHandler`        | Wrapper para handlers async                                                                                                                                 |

### Factories de Error

`BadRequestError(400)`, `UnauthorizedError(401)`, `ForbiddenError(403)`, `NotFoundError(404)`, `ConflictError(409)`, `ValidationError(422)`, `InternalServerError(500)`

---

## 9. Frontend — Pantallas y Navegación

### Estructura de Navegación

```
RootNavigator
├── Auth (si NO autenticado)
│   ├── Login
│   ├── Register
│   └── ForgotPassword
└── Main (si autenticado)
    └── BottomTabNavigator (5 tabs)
        ├── Dashboard (Home)
        ├── CheckIn (Bitácora)
        │   ├── CheckInHome
        │   ├── Progress
        │   ├── SubstanceExpense
        │   └── SubstanceDose
        ├── Medications
        ├── Chatbot
        └── Profile (Stack)
            ├── ProfileHome
            ├── AISettings
            └── IntelligenceProfile (Memoria LÚA)
```

### Pantallas por Categoría

| Categoría       | Pantallas                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| **Auth**        | LoginScreen, RegisterScreen, ForgotPasswordScreen                                                              |
| **Dashboard**   | DashboardScreen (welcome, action cards, summary grid, habits, bitácora feed, cravings, charts, family wall)    |
| **Check-in**    | CheckInScreen (calendar, unified feed, 6 entry types, CRUD), ProgressScreen (3 tabs: recovery/emotions/habits) |
| **Chatbot**     | ChatbotScreen (streaming, markdown, TTS, quick responses), IntelligenceProfileScreen (memoria LÚA)             |
| **Profile**     | ProfileScreen (avatar, menu items, logout)                                                                     |
| **Family**      | FamilyDashboardScreen (patient cards, risk levels, wall messages)                                              |
| **Settings**    | EmergencySettingsScreen, PrivacySettingsScreen, AISettingsScreen                                               |
| **Medications** | MedicationScreen (progress, cards, local notifications), SubstanceDoseScreen                                   |
| **Expenses**    | SubstanceExpenseScreen (summary, add, list, CLP formatting)                                                    |

### Stores Zustand

| Store          | Estado                                                       | Persistencia      |
| -------------- | ------------------------------------------------------------ | ----------------- |
| `authStore`    | user, token, refreshToken, isAuthenticated, isLoading, error | expo-secure-store |
| `uiStore`      | Modo tema, preferencias UI                                   | No persistido     |
| `checkinStore` | Rachas de check-in, estado local                             | No persistido     |

---

## 10. Custom Hooks

| Hook                | Descripción                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `useAuth`           | Ciclo completo de autenticación: login, register, logout, restauración de sesión desde AsyncStorage, verificación de tokens, refresh de sesión |
| `useChatbot`        | Gestión de conversaciones con LÚA: streaming SSE vía XHR, optimistic UI updates, TTS por mensaje, detección de herramientas activas            |
| `useCheckIn`        | Check-in diario: mood/anxiety/energy, rachas, estadísticas, historial de ánimo, CRUD completo                                                  |
| `useProfile`        | Perfil de usuario y configuración: profile settings, preferencias de sustancias, configuración IA                                              |
| `useFormValidation` | Validación genérica de formularios: schema-based, validación en tiempo real, helpers para componentes controlados                              |

---

## 11. Componentes UI (14 componentes)

| Componente         | Props Clave                                                   | Variantes                                   |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------- |
| **Button**         | title, onPress, variant, size, disabled, loading, icon        | primary/secondary/outline/ghost × sm/md/lg  |
| **Input**          | label, value, onChangeText, error, secureTextEntry, multiline | forwardRef, focus state tracking            |
| **PasswordInput**  | label, value, onChangeText, error                             | Toggle de visibilidad (eye icon)            |
| **Card**           | children, variant, padding, onPress                           | elevated/outlined/filled                    |
| **Modal**          | visible, onClose, title, showCloseButton                      | Bottom sheet (iOS), centrado (Android)      |
| **LoadingSpinner** | size, color, fullScreen, text                                 | Inline / overlay fullscreen                 |
| **Checkbox**       | label, checked, onChange, disabled                            | Custom con checkmark text                   |
| **Select**         | value, onChange, options, placeholder                         | Modal dropdown animado                      |
| **PhoneInput**     | value, onChange, selectedCountry                              | Selector de país con flags (8 países LATAM) |
| **DatePicker**     | value, onChange, min/maxDate                                  | 3-columnas (Día/Mes/Año), meses en español  |
| **Slider**         | value, onChange, min/max, emojis                              | Discrete buttons, emojis por valor          |
| **Stepper**        | currentStep, totalSteps, steps                                | Progress bar animado, checkmarks            |
| **Avatar**         | uri, name, size                                               | Imagen / iniciales con color determinístico |

---

## 12. Sistema de Diseño (UI Kit)

### Tema "Slate & Indigo"

| Token             | Modo Claro            | Modo Oscuro           |
| ----------------- | --------------------- | --------------------- |
| **primary**       | #4F46E5 (Indigo 600)  | #6366F1 (Indigo 500)  |
| **primaryDark**   | #4338CA (Indigo 700)  | #4F46E5 (Indigo 600)  |
| **secondary**     | #10B981 (Emerald 500) | #34D399 (Emerald 400) |
| **accent**        | #F59E0B (Amber 500)   | #FBBF24 (Amber 400)   |
| **background**    | #F8FAFC (Slate 50)    | #0F172A (Slate 900)   |
| **surface**       | #FFFFFF               | #1E293B (Slate 800)   |
| **text**          | #0F172A (Slate 900)   | #F8FAFC (Slate 50)    |
| **textSecondary** | #64748B (Slate 500)   | #94A3B8 (Slate 400)   |
| **border**        | #E2E8F0 (Slate 200)   | #334155 (Slate 700)   |
| **success**       | #10B981               | #34D399               |
| **warning**       | #F59E0B               | #FBBF24               |
| **error**         | #EF4444               | #F87171               |
| **info**          | #3B82F6               | #60A5FA               |

### Tipografía

| Token      | Valor                                           |
| ---------- | ----------------------------------------------- |
| fontFamily | System (regular, medium, bold)                  |
| fontSize   | xs(12), sm(14), md(16), lg(18), xl(20), xxl(28) |
| lineHeight | tight(1.2), normal(1.5), relaxed(1.75)          |

### Espaciado

| Token | Valor |
| ----- | ----- |
| xs    | 4     |
| sm    | 8     |
| md    | 16    |
| lg    | 24    |
| xl    | 32    |
| xxl   | 48    |

### Border Radius

| Token | Valor |
| ----- | ----- |
| sm    | 8     |
| md    | 16    |
| lg    | 24    |
| xl    | 32    |

### Sombras

| Nivel | iOS                                   | Android      |
| ----- | ------------------------------------- | ------------ |
| sm    | offset(0,1), opacity 0.05, radius 2   | elevation: 2 |
| md    | offset(0,4), opacity 0.1, radius 6    | elevation: 4 |
| lg    | offset(0,10), opacity 0.15, radius 12 | elevation: 8 |

### ThemeContext

- Modos: `light | dark | auto`
- Persistencia: `expo-secure-store` (key: `kognirecovery_theme_mode`)
- Auto mode: `useColorScheme()` de React Native
- Hooks: `useTheme()` → `{ theme, themeMode, setThemeMode, toggleTheme, isDark }`

---

## 13. Servicios Backend — Detalle

### 13.1 `langgraph.service.ts` — Orquestador IA

| Aspecto          | Detalle                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------- |
| **Framework**    | LangGraph (LangChain) StateGraph                                                             |
| **Nodos**        | `agent` → (conditional: `tools`?) → `memory`                                                 |
| **Agent Node**   | Carga config LLM por usuario, vincula 8 herramientas, construye system prompt LÚA v2.0       |
| **Memory Node**  | Extracción de insights clínicos vía LLM secundario. Persiste en PostgreSQL + Neo4j           |
| **Streaming**    | `executeAgentStream()` — async generator: eventos `token`, `tool_start`, `tool_end` para SSE |
| **Vector Store** | Inicialización desde `knowledge_base/`, embeddings locales, caché en memoria                 |
| **Config LLM**   | Prioridad: API key del usuario → env vars → defaults                                         |

### 13.2 `neo4j.service.ts` — Grafo de Conocimiento

| Método                                      | Uso                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| `getChatbotContext(userId)`                 | Perfil + check-ins 7 días + etiquetas + sustancias + medicamentos + interacciones |
| `checkDrugInteractions()`                   | Interacciones sustancia-medicamento (severidad ≥ 7)                               |
| `checkSubstanceInteractions()`              | Interacciones sustancia-sustancia                                                 |
| `getCheckInInsights()`                      | Patrones emocionales (30 días)                                                    |
| `getDashboardData()`                        | Check-ins semanales, cravings, sustancias, recursos                               |
| `getRecommendedResources()`                 | Filtrado por país y tags                                                          |
| `recordCheckIn()` / `recordCraving()`       | Crea nodos y aristas en el grafo                                                  |
| `saveAlert()` / `getUnacknowledgedAlerts()` | Sistema de alertas                                                                |

### 13.3 `rag.service.ts` — Pipeline RAG

```
Query → vectorSearch() + knowledgeGraphSearch() + keywordSearch()
    → retrieve() → Ensemble ponderado (0.4 / 0.4 / 0.2)
    → rerank() → Re-ranking vía LLM (scoring 0-1)
    → generate() → Prompt final con contexto inyectado
```

**Detección de crisis (`analyzeRisk()`):**

- **Crítico:** "suicidio", "overdose", "quitarme la vida"
- **Alto:** "no aguanto", "autolesión", "cortarme"

**Respuestas de crisis:** Templates localizados por país (AR, MX, CL, ES, US, CO, PE)

### 13.4 `embedding.service.ts`

| Aspecto         | Detalle                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- |
| **Modelo**      | Xenova/all-MiniLM-L6-v2                                                                     |
| **Dimensiones** | 384                                                                                         |
| **Chunking**    | 512 tokens, 50 token overlap, sentence-aware                                                |
| **Métodos**     | `generateEmbedding`, `generateContextualEmbedding`, `cosineSimilarity`, `euclideanDistance` |

### 13.5 `auth.service.ts`

- **Register:** Uniqueness check → validación de contraseña → bcrypt hash (12 rounds) → creación usuario + perfil auto → JWT + refresh token
- **Login:** Email lookup → bcrypt comparison → verificación estado cuenta → generación tokens
- **Refresh:** Verificación JWT + DB lookup + revocation/usage checks + expiración → rotación tokens
- **Logout:** Revocación de refresh token específico o todos

### 13.6 `privacy.service.ts` — Cumplimiento GDPR/CCPA

| Funcionalidad             | Métodos                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| **Consentimientos**       | `recordConsent()`, `getUserConsents()`, `hasConsent()`, `hasRequiredConsents()`           |
| **Configuración**         | `getUserPrivacySettings()`, `updateUserPrivacySettings()`                                 |
| **Auditoría**             | `logPrivacyAction()`, `getUserAuditLog()`                                                 |
| **Exportación (Art. 15)** | `exportUserData()` — perfil, consentimientos, check-ins, diario, conversaciones, cravings |
| **Eliminación (Art. 17)** | `requestDataDeletion()` (deadline 30 días), `executeDataDeletion()`                       |

### 13.7 `alert.service.ts` — Alertas de Interacciones

**Base de conocimiento:** 8 interacciones droga-droga + 8 interacciones sustancia-droga

| Severidad | Protocolo                                        |
| --------- | ------------------------------------------------ |
| ≥ 9       | Emergencia: Push + SMS a contactos de emergencia |
| ≥ 7       | Alto: Notificación push                          |
| ≥ 5       | Medio: Alerta in-app                             |
| ≥ 3       | Bajo: Informativa                                |

### 13.8 Otras

| Servicio                  | Función                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `search.service.ts`       | Web search vía Tavily API, scoring por dominios científicos confiables, scraping con cheerio             |
| `notification.service.ts` | Push (Expo/Firebase placeholder), SMS (Twilio/SNS placeholder), notificaciones a contactos de emergencia |
| `tts.service.ts`          | Text-to-speech vía Coqui XTTS externo (`localhost:5002`)                                                 |

---

## 14. Controladores — 80+ Endpoints

| Controlador           | Endpoints | Funcionalidad                                                                                          |
| --------------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| **auth**              | 6         | Register, login, refresh, logout, sessions, verify                                                     |
| **chatbot**           | 13        | Conversaciones CRUD, mensajes, streaming SSE, TTS, escenarios, quick responses, stats, context history |
| **checkin**           | 11        | CRUD check-in, today, range, streaks, reset, stats, mood history                                       |
| **craving**           | 16        | CRUD cravings, resolve, stats, patterns, strategies CRUD, strategy usage, triggers                     |
| **note**              | 6         | CRUD notes, toggle pin                                                                                 |
| **profile**           | 12        | CRUD profile, settings, substance preferences, determine-type, AI settings, AI models                  |
| **privacy**           | 9         | Consent, settings, export, deletion request, audit log, retention policies                             |
| **consumption**       | 4         | Log consumption, list, weekly/daily stats                                                              |
| **journal**           | 27        | Notes, habits (definitions + entries + toggle + stats), social, analysis, activities, feed             |
| **medication**        | 6         | CRUD medications, toggle taken, daily status                                                           |
| **substance_dose**    | 3         | CRUD doses (sync Neo4j)                                                                                |
| **substance_expense** | 5         | CRUD expenses, summary                                                                                 |
| **dashboard**         | 4         | Full dashboard, overview, emotions, progress                                                           |
| **family**            | 4         | Dashboard, patient progress, checkins, send message                                                    |

---

## 15. Infraestructura Docker

| Servicio | Imagen                 | Puertos                | Uso                       |
| -------- | ---------------------- | ---------------------- | ------------------------- |
| postgres | postgres:15-alpine     | 5437:5432              | BD principal              |
| redis    | redis:7-alpine         | 6380:6379              | Caché                     |
| neo4j    | neo4j:5.16.0-community | 7475:7474, 7688:7687   | Grafo de conocimiento     |
| api      | Dockerfile custom      | 3003:3003              | Backend API               |
| frontend | Dockerfile.frontend    | 19006:19006, 8084:8081 | Expo web                  |
| pgadmin  | dpage/pgadmin4         | 5050:80                | Admin BD (profile: tools) |

**Volúmenes:** postgres_data, redis_data, pgadmin_data, neo4j_data, neo4j_logs
**Red:** kognirecovery-network (bridge)

---

## 16. Scripts y Herramientas

### Frontend

| Script              | Descripción                    |
| ------------------- | ------------------------------ |
| `npm start`         | Inicia Expo development server |
| `npm run android`   | Ejecuta en emulador Android    |
| `npm run ios`       | Ejecuta en simulador iOS       |
| `npm run web`       | Ejecuta en navegador web       |
| `npm run lint`      | Ejecuta ESLint                 |
| `npm run lint:fix`  | Ejecuta ESLint con auto-fix    |
| `npm run format`    | Formatea código con Prettier   |
| `npm run typecheck` | Verifica tipos TypeScript      |
| `npm run build:apk` | Build APK vía EAS              |

### Backend

| Script               | Descripción                               |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Inicia backend con hot-reload (tsx watch) |
| `npm run build`      | Compila TypeScript                        |
| `npm run start`      | Inicia backend compilado                  |
| `npm run db:migrate` | Ejecuta migraciones SQL (30+ tablas)      |
| `npm run db:seed`    | Ejecuta seed de datos                     |

---

## 17. Tipos TypeScript Principales

### Navigation

```
RootStackParamList: Auth | Main
AuthStackParamList: Login | Register | ForgotPassword
MainTabParamList: Dashboard | CheckIn | Medications | Notes | Chatbot | Profile
CheckInStackParamList: CheckInHome | CheckInHistory | Progress | SubstanceExpense | SubstanceDose
ChatbotStackParamList: ChatbotHome | ChatbotDetail
ProfileStackParamList: ProfileHome | ProfileSettings | ProfileEdit | EmergencyContacts | AISettings | IntelligenceProfile
```

### Esquemas de Validación

| Schema                   | Campos                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `loginSchema`            | email (required + email), password (required + minLength 6)                                              |
| `registerSchema`         | email, password (strong), confirmPassword (equals), firstName (2-50), lastName (2-50)                    |
| `profileSchema`          | firstName, lastName, email, phone, dateOfBirth, country, city, address, emergencyPhone, medicalNotes     |
| `emergencyContactSchema` | firstName, lastName, relationship, phone, alternatePhone, email, country, city, address, priority, notes |

### Validadores Disponibles (15+)

`required`, `email`, `password`, `minLength`, `maxLength`, `phone`, `date`, `country` (25 países LATAM), `equals`, `url`, `number`, `positiveNumber`, `integer`, `range`, `pattern`

---

## 18. Utilidades Frontend

| Constante          | Contenido                                                                     |
| ------------------ | ----------------------------------------------------------------------------- |
| `CHECKIN_CONFIG`   | Tipos (daily/weekly/monthly), escala mood (1-5), cravings (0-10), 11 triggers |
| `VALIDATION_RULES` | Email regex, password rules (8-128, upper, lower, number), phone regex        |
| `DATE_FORMATS`     | DD/MM/YYYY (display), ISO (API), DD/MM (short), full Spanish (long)           |
| `ERROR_MESSAGES`   | Mensajes en español para generic, network, validation, auth                   |

---

## 19. Flujo de Datos End-to-End

### Autenticación

```
Frontend → api.ts → POST /api/v1/auth/login
  → auth.controller → auth.service → user.model (PostgreSQL)
  → JWT access (15m) + refresh (7d) → Zustand authStore
  → AsyncStorage (si rememberMe)
```

### Check-in Diario

```
Frontend → useCheckIn → POST /api/v1/checkins
  → checkin.controller → checkin.model (PostgreSQL)
  → Neo4j.recordCheckIn() → actualización de rachas
  → Dashboard actualiza stats
```

### Chatbot LÚA

```
Frontend → ChatbotScreen → POST /api/v1/chatbot/conversations/:id/stream
  → chatbot.controller → langgraph.service
  → Agent Node (LLM + 8 tools bound)
  → [conditional] Tools Node (rag_search, kg_search, etc.)
  → Memory Node (extrae insights → PostgreSQL + Neo4j)
  → SSE stream → Frontend (token por token)
```

### Pipeline RAG

```
Query → contextual embedding (Xenova/all-MiniLM-L6-v2)
  → Neo4j vector search + KG search + keyword search
  → Weighted ensemble (0.4 / 0.4 / 0.2)
  → LLM re-ranking
  → Context injection → LLM generation
```

### Alerta de Interacción

```
Check-in con consumo → alert.service.checkOnCheckIn()
  → InteractionsService.checkInteraction()
  → Si severidad ≥ 8: saveAlert() en Neo4j
  → Si severidad ≥ 9: Push + SMS a contactos de emergencia
```

---

## 20. Estado del Proyecto

| Sprint        | Estado      | Entregables                                                                                 |
| ------------- | ----------- | ------------------------------------------------------------------------------------------- |
| **Sprint 0**  | Completado  | Setup Expo+TS, UI kit, Zustand, navegación, Docker, migraciones iniciales                   |
| **Sprint 1**  | Completado  | Backend Express API, sistema auth, API service, scripts migración, validación forms         |
| **Sprint 2**  | Completado  | Perfiles usuario, check-in, chatbot LÚA, dashboards paciente/familia, emergencia/privacidad |
| **Sprint 3**  | Completado  | Neo4j KG, pipeline RAG, agente LangGraph, IA con personalización por arquetipo, alertas     |
| **Sprint 4+** | En progreso | Tracking medicación, gastos/dosis sustancias, TTS, hábitos, sistema de diario               |

---

## 21. Requisitos de Infraestructura

| Requisito   | Mínimo                                   |
| ----------- | ---------------------------------------- |
| **Node.js** | ≥ 18.0.0                                 |
| **npm**     | ≥ 9.0.0                                  |
| **Docker**  | Con Docker Compose                       |
| **GPU**     | Opcional (requerida para XTTS)           |
| **RAM**     | Recomendado 8GB+ (embeddings en memoria) |
| **Disco**   | 2GB+ (node_modules, knowledge base, BD)  |

---

## 22. Resumen Ejecutivo

| Métrica                   | Valor            |
| ------------------------- | ---------------- |
| **Tablas PostgreSQL**     | 30+              |
| **Nodos Neo4j**           | 12 tipos         |
| **Endpoints REST**        | 80+ (14 módulos) |
| **Componentes UI**        | 14 reutilizables |
| **Pantallas**             | 17+              |
| **Custom Hooks**          | 5                |
| **Stores Zustand**        | 3                |
| **Skills IA**             | 8 herramientas   |
| **Arquetipos IA**         | 7                |
| **Validadores**           | 15+              |
| **Servicios Backend**     | 10               |
| **Controladores**         | 13               |
| **Middleware**            | 10               |
| **Servicios Docker**      | 7                |
| **Dependencias Frontend** | 48               |
| **Dependencias Backend**  | 18               |

---

_Documento generado el 27 de marzo de 2026_
