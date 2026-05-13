# Registro de Cambios - KogniRecovery

Este documento mantiene un historial de todos los cambios significativos realizados en el proyecto KogniRecovery. Cada entrada incluye una descripción general y puntos detallados de la implementación.

---

## Instrucciones

- Los nuevos cambios se agregan al FINAL del documento
- Cada entrada tiene formato: `## DD-MM-YY Título del cambio`
- Se usa lista de viñetas para detalles específicos
- **REGLA DE ORO**: Nunca eliminar o reemplazar contenido previo, solo añadir

---

## Historial de Cambios

## 21-02-26 Cambio de nombre del agente: "NADA" → "LÚA"

Descripción general: El usuario decidió cambiar el nombre del agente conversacional de "NADA" a "LÚA" (significa "luz" en mapuche, conexión con Chile/LATAM). Se actualizaron todos los archivos en docs/Formulacion/ donde aparecía "NADA" para cambiarlo a "LÚA".

- **PROMPT_SISTEMA_BASE.md**: Línea 5: "Eres **NADA**" → "Eres **LÚA**"
- **UI_CHATBOT.md**: Múltiples menciones actualizadas (líneas 21, 63, 137, 144, 456)
- **PROMPTS_POR_PERFIL.md**: 8 menciones actualizadas (una por cada perfil: Lucas, Camila, Diego, Eliana, Sofía, Rodrigo, Rosario, Roberto)
- **SECCION_MEDICAMENTOS.md**: 2 menciones actualizadas
- **UI_CONFIG_EMERGENCIA_PRIVACIDAD.md**: 2 menciones actualizadas
- **ARQUITECTURA_INTELIGENCIA_AUMENTADA.md**: 3 menciones actualizadas
- **00_INDICE.md**: 6 menciones actualizadas
- **AGENT_CODIFICADOR_PROMPTS.md**: 11 menciones actualizadas
- **FLUJOS_ONBOARDING.md**: 2 menciones actualizadas
- **VALIDACION_CON_FUENTES.md**: 7 menciones actualizadas
- **QUERIES_INDEX.md**: 2 menciones actualizadas

---

## 17-02-26 Sprint 0: Setup y preparación inicial

Descripción general: Creación de la estructura base del proyecto React Native con Expo, configuración de TypeScript, sistema de temas, componentes UI base, Zustand stores, navegación, variables de entorno y Docker compose para desarrollo backend.

- **Estructura de proyecto**: Inicializado con Expo 51 y TypeScript strict mode, carpetas organizadas en `/src/{components,screens,services,navigation,store,utils,types,assets,theme}`
- **Gestión de estado**: Zustand v4 con persistencia via `expo-secure-store`, stores implementados: `authStore`, `uiStore`, `checkinStore`
- **Navegación**: React Navigation v6 con stack (AuthNavigator) y bottom tabs (MainTabNavigator), protected routes implementadas en RootNavigator
- **UI Kit base**: Componentes reutilizables con TypeScript: `Button` (4 variantes, 3 tamaños), `Input` (con validación), `Card`, `Modal` (con swipe en iOS), `LoadingSpinner`
- **Sistema de temas**: ThemeContext con modo claro/oscuro/automático, paleta de colores psicológica (azul calmante, verde esperanza), accesibilidad WCAG 2.1, persistencia de preferencias
- **Configuración**: ESLint + Prettier configurados, `.env.example` con variables de API y LLM, `babel.config.js` con module-resolver para alias `@/*`, `app.json` con permisos y splash screen
- **Backend Docker**: `docker-compose.yml` con PostgreSQL 15 + Redis 7, migraciones SQL iniciales en `docker/postgres/init.sql` (tablas: users, profiles, checkins, notifications, emergency_alerts), pgAdmin opcional
- **Documentación**: README.md completo con instrucciones de setup, scripts de desarrollo, y arquitectura; script `generate-assets.sh` para placeholders de iconos
- **Calidad**: TypeScript strict mode, compilación sin errores, interfaces tipadas para todos los componentes y stores

---

## 21-02-26 Sprint 2 Prompt: Módulos de Usuario, Check-in, Chatbot NADA y Dashboards

Descripción general: Creación del documento completo `docs/Sprint2_Prompt.md` con todas las especificaciones detalladas para implementar las funcionalidades del Sprint 2, incluyendo: sistema de perfiles con asignación automática, onboarding de 10 pantallas, check-in diario completo, chatbot NADA con integración LLM+RAG+Neo4j, dashboards de paciente y familiar, y configuración de emergencia y privacidad.

- **Documento de prompt**: Creado archivo `docs/Sprint2_Prompt.md` con más de 1,500 líneas de especificaciones técnicas detalladas
- **Arquitectura del Sprint**: Diagramas Mermaid mostrando flujos de datos entre frontend, backend, PostgreSQL, Neo4j y servicios AI
- **Backend SQL**: Esquemas completos para tablas de perfiles (`profiles`), check-ins (`checkins`, `cravings`, `recovery_activities`), emergencia (`emergency_contacts`, `crisis_lines`, `emergency_preferences`), compartición familiar (`sharing_invitations`, `sharing_permissions`, `support_messages`) y chat (`conversations`, `messages`)
- **Modelos y controladores**: Implementación completa de `ProfileModel`, `CheckInModel`, controladores de API para check-in, chatbot, dashboard, emergencia y privacidad
- **Rutas API**: Definidas rutas para `/api/v1/profiles`, `/api/v1/checkin`, `/api/v1/chatbot`, `/api/v1/dashboard`, `/api/v1/emergency`, `/api/v1/privacy`
- **Servicios AI**: Implementación de `LLMService` (OpenAI), `RAGService` (búsqueda de conocimiento) y `neo4jService` (gestión del Knowledge Graph)
- **Frontend Onboarding**: Navegador `OnboardingNavigator` con 10+ pantallas incluyendo Welcome, RoleSelection, BasicData, ChangeStage, LifeContext, ProfileAssignment, EmergencyConfig, PrivacyConfig, SpecificOnboarding y Completion
- **Frontend Check-in**: Hook `useCheckIn` con formularios completos para mood (1-10 + tags), registro de sustancias, cravings y actividades de recuperación
- **Frontend Chatbot**: Hook `useChatbot` con integración completa de LLM, sistema de mensajes, detección de riesgo y modal de emergencia
- **Frontend Dashboards**: `PatientDashboardScreen` con widgets de mood, consumo, cravings y acciones rápidas; `FamilyDashboardScreen` con vista agregada y botones de apoyo predefinidos
- **Frontend Configuración**: `EmergencySettingsScreen` para gestionar contactos de emergencia, líneas de crisis y preferencias de notificación
- **Preparación del entorno**: Variables de entorno necesarias para Neo4j, OpenAI, PostgreSQL y comandos de instalación
- **Plan de migración**: Estrategia considerando `.kilocodeignore` con fases de backup, creación de archivos nuevos y actualización de referencias
- **Checklist de verificación**: Lista completa de tareas para verificar implementación correcta de backend, frontend e integración
- **Troubleshooting**: Soluciones para problemas comunes de conexión a Neo4j, API de check-in, LLM y frontend

---

## 21-02-26 Sprint 3 Prompt: Neo4j, RAG, Integración AI y Sistema de Alertas

Descripción general: Creación del documento completo `docs/Sprint3_Prompt.md` con todas las especificaciones detalladas para implementar la capa de inteligencia artificial avanzada del Sprint 3, incluyendo: Neo4j Knowledge Graph, Pipeline RAG completo, integración de servicios AI con fallback y moderación, y sistema de alertas de interacción de medicamentos.

- **Documento de prompt**: Creado archivo `docs/Sprint3_Prompt.md` con más de 800 líneas de especificaciones técnicas detalladas
- **Arquitectura del Sprint**: Diagramas Mermaid mostrando la arquitectura completa de la capa de AI incluyendo frontend, backend, servicios LLM, RAG, Neo4j y sistema de alertas
- **Neo4j Knowledge Graph**: Schema completo de nodos (`Usuario`, `Perfil`, `Sustancia`, `Medicamento`, `Interaccion`, `CheckIn`, `Craving`, `Emergencia`, `Recurso`, `Technique`, `Etiqueta`) y relaciones, queries CYPHER para contexto de chatbot, alertas de interacción, insights de check-in y widgets de dashboard
- **Pipeline RAG**: Arquitectura completa con retrieval (vector search + BM25 + KG), ranking con Cross-Encoder, generación con contexto, fuentes de conocimiento (documentación, FAQs, técnicas terapéuticas, recursos locales, Knowledge Graph)
- **Servicios de embedding y chunking**: Implementación de `ChunkingService` con estrategia híbrida de oraciones con overlap, `EmbeddingsService` usando text-embedding-3-small, `RetrieverService` con búsqueda vectorial y ensamble de resultados, `RankerService` con reranking
- **Integración de servicios AI**: `LLMService` con análisis de riesgo en tiempo real, detección de crisis y suicidios, protocolos de emergencia según país del usuario
- **Sistema de fallback**: `FallbackService` con múltiples niveles de fallback (OpenAI → Azure OpenAI → respuesta predefinida), `moderateContent` para filtrado de contenido dañino
- **Contexto y memoria**: `ContextService` con cacheo de contexto de usuario, historial de conversaciones persistido en Neo4j, gestión de sesiones
- **Sistema de alertas**: `InteractionsService` con base de conocimientos de interacciones droga-droga y sustancia-medicamento, `AlertDetectorService` para detección en tiempo real durante check-ins, `AlertProtocolService` con protocolos diferenciados por severidad (emergency, high, medium, low, info)
- **Decisiones de diseño**: Documentación completa de trade-offs entre coste/calidad, latencia/precisión, privacidad/personalización, cobertura de interacciones conocida
- **Plan de implementación**: Cronograma de 4 semanas con infraestructura base (semana 1), Pipeline RAG (semana 2), Integración AI (semana 3), Sistema de alertas (semana 4)
- **Testing y validación**: Test cases para Neo4j, RAG y sistema de alertas con Jest
- **Checklist de verificación**: Lista completa de tareas para verificar implementación correcta de cada componente

## 20-02-26 Sprint 1: Backend Express básico

Descripción general: Creación de la estructura básica del backend Express con TypeScript, incluyendo configuración, middlewares, modelos, servicios, controladores y rutas de autenticación con JWT.

- **Setup y configuración**: `server/package.json` con dependencias (express, pg, jsonwebtoken, bcryptjs, express-validator), `server/tsconfig.json` con strict mode, `server/.env.example` con variables de entorno
- **Configuración centralizada**: `server/src/config/index.ts` carga variables de entorno con validación, `server/src/config/database.ts` pool de conexiones PostgreSQL
- **Middlewares implementados**: `auth.ts` (JWT verify, generate tokens, authorize roles), `error.ts` (error handler centralizado, asyncHandler), `cors.ts` (CORS personalizado con orígenes configurables), `validation.ts` (express-validator con validaciones para register, login, refresh)
- **Modelos de datos**: `user.model.ts` (CRUD usuarios, búsqueda por email/ID, actualización de contraseña), `refreshToken.model.ts` (gestión de refresh tokens, validación, revocación)
- **Servicios**: `auth.service.ts` (register, login, refresh tokens, logout con validación de contraseña y bcrypt)
- **Controladores**: `auth.controller.ts` maneja solicitudes HTTP para auth endpoints
- **Rutas API**: `server/src/routes/auth.routes.ts` con endpoints: POST /register, POST /login, POST /refresh, POST /logout, GET /sessions
- **Punto de entrada**: `server/src/app.ts` configuración Express, `server/src/index.ts` servidor con graceful shutdown
- **Documentación**: `server/README.md` con instrucciones de instalación, configuración y ejemplos de API
- **Puerto**: El servidor corre en puerto 3001 por defecto (configurable via .env)
- **Endpoints auth**: /api/v1/auth/register, /api/v1/auth/login, /api/v1/auth/refresh, /api/v1/auth/logout, /api/v1/auth/sessions
- **Para ejecutar**: cd server && npm install && cp .env.example .env && npm run dev

---

## 20-02-26 Sprint 1: Servicio de API para comunicación con backend

Descripción general: Creación del servicio de API para comunicación con el backend en el proyecto React Native + Expo, incluyendo configuración base, cliente HTTP con métodos completos, manejo de errores con interceptors, autenticación JWT con refresh token automático, y endpoints predefinidos.

- **Archivo src/types/api.ts**: Tipos de respuesta del API incluyendo ApiResponse, PaginatedResponse, ApiError, tipos de autenticación (LoginRequest, RegisterRequest, AuthResponse, User, AuthTokens), tipos de check-in, medicamentos, recursos, chatbot, contactos de emergencia y configuración
- **Archivo src/services/endpoints.ts**: Constantes de URLs del backend con endpoints para autenticación (/auth/login, /auth/register, /auth/refresh, /auth/logout), usuarios, check-ins, medicamentos, recursos, chatbot, contactos de emergencia, familiar, notificaciones y dashboard. Usa variables de entorno para URL base y versión del API
- **Archivo src/services/api.ts**: Cliente HTTP completo usando fetch API nativa con métodos get, post, put, patch, delete. Incluye configuración de timeout (30s), retry automático con exponential backoff (3 intentos), interceptors de request/response, manejo de errores 401 (redirige a login) y 500, verificación de conexión a internet via expo-network, gestión de tokens JWT con refresh automático, y función logout() que limpia tokens y redirige a login
- **Endpoints de autenticación**: Implementados login(), register(), logout(), verifyToken() que consumen los endpoints /api/v1/auth/* y manejan automáticamente el almacenamiento de tokens
- **Manejo offline**: Verificación de red antes de cada request usando expo-network, retry automático para errores de red, mensajes de error apropiados
- **Compatibilidad Expo**: Usa fetch API nativa de React Native, expo-network para verificación de conectividad, expo-router para navegación (redirecciones), completamente compatible con TypeScript strict

---

## 20-02-26 Sprint 1: Scripts de migración de base de datos PostgreSQL

- **Scripts de extensión de tablas**: 001_extend_users.sql (campos: phone, status, onboarding_completed, profile_type, risk_level, two_factor), 002_extend_profiles.sql (campos: age, gender, country, main_substance, other_substances, consumption_amount, consumption_duration, stage_of_change, mental_health_details, therapist_contact)
- **Tabla emergency_contacts**: Creada en 003_create_emergency_contacts.sql con campos: notify_on_risk, notify_on_crisis, can_share_location, is_primary
- **Tabla sharing_invitations**: Creada en 004_create_sharing_invitations.sql para gestionar vinculaciones familiar-paciente con permisos granulares (mood, checkins, achievements, progress, alerts)
- **Extensión de notificaciones**: 005_extend_notifications.sql agrega preferencias por usuario (notification_preferences table) con configuración de canales y horarios de silencio
- **Tablas de recursos**: 006_create_resources.sql crea tablas resources (artículos, videos, ejercicios psicoeducativos) y crisis_lines (líneas de emergencia por país)

---

## 20-02-26 Sprint 1: Sistema completo de validación de formularios

Descripción general: Creación de un sistema completo de validación de formularios en React Native con TypeScript, incluyendo validadores reutilizables, hook personalizado useFormValidation, y esquemas de validación para login, registro, perfil y contacto de emergencia. Todo el sistema está en español y es compatible con Expo.

- **Archivo src/utils/validation.ts**: Validadores reutilizables incluyendo email, password (8+ caracteres, mayúscula, número), required, minLength, maxLength, phone, date, country, equals (comparación de campos), url, number, positiveNumber, integer, range, pattern. Todos los mensajes de error están en español y son personalizables.
- **Hook useFormValidation**: Hook personalizado que maneja estado de errores por campo, validación en tiempo real (onChange), validación al perder foco (onBlur), validación al submit, reset de errores, valores iniciales, callbacks onSuccess/onError, y método getFieldProps para componentes controlados.
- **Schemas de validación**: Implementados esquemas para Login (email, password), Registro (email, password, confirmPassword, firstName, lastName), Perfil (datos personales, teléfono, fecha de nacimiento, país, ciudad, dirección, notas médicas), y Contacto de Emergencia (nombre, relación, teléfono, país, prioridad).
- **Integración con useAuth existente**: El sistema complementa las validaciones básicas existentes en src/hooks/types.ts sin duplicar código, expandiendo funcionalidades con validaciones más completas.
- **Exportaciones centralizadas**: Actualizados src/utils/index.ts y src/hooks/index.ts para exportar el nuevo módulo de validación y el hook.
- **Compatibilidad**: Totalmente compatible con TypeScript strict, Expo, React Native, y sin dependencias adicionales (usa APIs nativas de React).
- **Tabla refresh_tokens**: 007_create_refresh_tokens.sql para gestión de sesiones JWT con información de dispositivo, IP y auditoría
- **Datos iniciales (seeds)**: 010_seed_substances.sql (32 sustancias categorizadas), 011_seed_countries_crisis_lines.sql (24 países + líneas de crisis LATAM/España/EEUU), 012_seed_resources.sql (6 recursos educativos iniciales)
- **Script de ejecución**: run_migrations.sh con soporte para múltiples entornos (development, staging, production), validación de conexión, y ejecución en orden numérico
- **Documentación**: README.md en scripts/sql/ con instrucciones de uso, ejemplos de ejecución, y consideraciones de privacidad para datos de salud mental
- **Compatibilidad**: PostgreSQL 14+ compatible, comentarios de documentación en todas las tablas y columnas, funciones utilitarias (cleanup_expired_tokens, revoke_all_user_tokens)

---

## 01-03-26 Implementación Integral de LÚA (Chatbot, RAG y Alertas)

Descripción general: Se ha completado la transición del chatbot de un estado de "placeholder" a un sistema de producción 100% operativo. Se integró el motor de IA real con el Knowledge Graph, se implementaron arquetipos dinámicos de personalidad y se conectó el sistema de alertas con notificaciones reales.

- **Identidad LÚA**: Cambio oficial de nombre de "NADA" a **LÚA** en todos los controladores, servicios y mensajes de bienvenida.
- **Integración RAG real**: El controlador `chatbot.controller.ts` ahora consume el `ragService.generate` real, eliminando las respuestas estáticas.
- **Personalización por Arquetipos**: Implementación en `rag.service.ts` de un sistema de prompts modulares basados en arquetipos (Adolescente, Joven Adulto, Profesional, Senior, Trauma-informed, Rural) y la etapa de cambio del usuario.
- **Búsqueda Vectorial en Neo4j**: Activación de la búsqueda por similitud semántica en el Knowledge Graph de Neo4j, permitiendo a LÚA consultar la base de conocimiento técnica y terapéutica de forma precisa.
- **Privacidad Familiar**: Refuerzo de la seguridad en `family.routes.ts`, limitando el acceso de los familiares únicamente a datos agregados y puntuaciones numéricas, protegiendo las notas íntimas del paciente.
- **Sistema de Alertas Críticas**: Conexión del `alert.service.ts` con un nuevo `NotificationService`. El sistema ahora envía Notificaciones Push reales al usuario y mensajes SMS automáticos a los contactos de emergencia en caso de riesgo inminente (sobredosis o interacciones letales).
- **Contexto de Usuario Profundo**: El chatbot ahora precarga automáticamente el perfil completo (sustancias, país, etapa de cambio) antes de cada mensaje para garantizar una respuesta coherente y segura.
Descripción general: Creación de un hook personalizado `useAuth` en la nueva carpeta `src/hooks/` que integra el authStore de Zustand con AsyncStorage para persistencia, proporciona métodos completos de autenticación (login, register, logout, verifyToken, refreshSession), maneja todos los estados de autenticación, y incluye validaciones robustas de campos.

- **Archivo src/hooks/types.ts**: Tipos para el hook incluyendo AuthStatus, LoginOptions, RegisterOptions, AuthOptions, ValidationResult, AuthOperationResult, TokenVerificationResult. Incluye funciones de validación: validateEmail, validatePassword, validateLoginCredentials, validateRegisterData. Constantes AUTH_STORAGE_KEYS para claves de AsyncStorage
- **Archivo src/hooks/useAuth.ts**: Hook completo que usa Zustand store existente (authStore), integra con API service (login, register, logout, verifyToken), sincroniza con AsyncStorage para persistencia de sesión, verificación automática de token al iniciar app, manejo de "recordarme" para guardar tokens solo si está activo, estados: isAuthenticated, isLoading, isVerifying, user, token, error
- **Archivo src/hooks/index.ts**: Exports centralizados del hook y tipos, permite imports limpios: `import { useAuth } from '@/hooks'`
- **Integración con authStore**: El hook usa el store existente de Zustand (authStore.ts) para mantener estado global sincronizado, metodos login/register/logout actualizan el store automáticamente
- **Persistencia AsyncStorage**: Guardado de tokens y datos de usuario con clave recordarme, restauración automática de sesión al iniciar la app, limpieza de storage al hacer logout
- **Validaciones**: Validación de email con regex, validación de contraseña (mínimo 6 caracteres), validación completa de datos de registro (email, password, firstName, lastName, role), retorna errores específicos por campo
- **Manejo de errores**: Captura errores del API, muestra mensajes apropiados, callbacks opcionales onSuccess/onError en opciones
- **Compatibilidad Expo**: Usa @react-native-async-storage/async-storage, expo-router para navegación (router.replace), TypeScript strict, completamente compatible con la base de código existente

---

## 20-02-26 Sprint 1: Componentes UI adicionales para autenticación y onboarding

Descripción general: Creación de 8 componentes UI adicionales específicos para el flujo de autenticación y onboarding en el proyecto React Native + Expo. Cada componente sigue el patrón de los componentes existentes (Button, Input, Card, Modal), con integración completa al theme existente, TypeScript strict, y accesibilidad para TalkBack.

- **PasswordInput**: Input de contraseña con toggle mostrar/ocultar contraseña, icono de ojo, compatible con el Input existente, completamente accesible
- **Checkbox**: Checkbox personalizado para términos y condiciones con estados checked/unchecked/disabled, label integrado, estilos basados en tema
- **Select**: Selector dropdown para país, rol, etc., compatible con el theme existente, animación de apertura con Modal, opciones configurables
- **PhoneInput**: Input de teléfono con selector de país, formato automático, prefijo internacional, lista de países latinoamericanos comunes
- **DatePicker**: Selector de fecha para fecha de nacimiento, compatible con Expo (sin dependencias nativas), validación de mínimo/máximo, picker wheel para día/mes/año
- **Slider**: Slider para escalas (1-10) para check-in de estado emocional, con labels y emojis, configurable (min/max/step), visualmente atractivo
- **Stepper**: Indicador de pasos para onboarding, N pasos configurables, animación de transición, labels opcionales, estado visual para pasos completados
- **Avatar**: Avatar de usuario con placeholder de iniciales, tamaño configurable (xs/sm/md/lg/xl), color de fondo generado automáticamente, compatible con imagen URI
- **Integración theme**: Todos los componentes usan el ThemeContext existente, siguen el patrón de los componentes base (Button, Input)
- **TypeScript strict**: Todos los componentes tienen tipos completos exportados, interfaces tipadas para props
- **Accesibilidad**: Soporte completo para TalkBack (accessibilityRole, accessibilityState, accessibilityLabel, accessibilityHint)
- **Export centralizado**: Todos los componentes exportados desde src/components/index.ts

## 14-04-26 Mejora sustancial del sistema de memoria y perfil del agente LÚA

Descripción general: El agente LÚA tenía un sistema de memoria de 8 tipos (triggers, objetivos, patrones emocionales, estrategias de afrontamiento, factores de riesgo, relaciones, patrones de consumo, preferencias) pero no lo estaba utilizando correctamente. El grafo Neo4j almacenaba nodos `Atributo` con relaciones tipificadas pero nunca se consultaban. El perfil del usuario estaba hardcodeado a `etapaCambio: 'contemplacion'` y no evolucionaba con la conversación.

### Problemas identificados:
- **`agentNode`** (langgraph.service.ts) solo cargaba memorias de tipo `preference`, ignorando los otros 7 tipos (triggers, goals, risk_factors, etc.)
- **`memoryNode`** (langgraph.service.ts) duplicaba la extracción de memoria con un prompt simplificado que guardaba todo como `preference` con importancia 5, ignorando el sistema tipificado del `MemoryService`
- **`knowledge_graph_search` tool** (graph_tool.ts) solo llamaba `getChatbotContext()` que no consultaba los nodos `Atributo` donde se almacenan las memorias del grafo
- **`userContext` en el controller** tenía `etapaCambio` hardcodeado a `'contemplacion'` y no incluía datos del grafo Neo4j
- **`processTurn()` return value descartado** en `sendMessage` — el contexto de memoria completo nunca llegaba al agente
- **`streamMessage`** no procesaba memoria en absoluto
- **No había evolución dinámica del perfil** — etapa de cambio y nivel de riesgo nunca se actualizaban

### Cambios implementados:

#### 1. `server/src/services/skills/graph_skill/scripts/graph_tool.ts` — Herramienta de grafo enriquecida
- Ahora consulta 5 fuentes de información en lugar de 1:
  - Perfil base + sustancias + medicamentos (`getChatbotContext`)
  - Todos los atributos de memoria del grafo (`getUserMemoryAttributes`) — triggers, objetivos, patrones, estrategias
  - Cravings recientes con triggers (`getRecentCravingsWithTriggers`)
  - Interacciones peligrosas (`checkDrugInteractions`)
  - Evolución del usuario: etapa, riesgo, métricas (`getUserEvolution`)
- Nuevo parámetro `queryType` para filtrar: 'full', 'memory', 'cravings', 'interactions', 'profile'
- Descripción mejorada para que el LLM entienda cuándo usarla

#### 2. `server/src/services/neo4j.service.ts` — Nuevas queries de perfil y memoria
- `getUserMemoryAttributes(userId)`: Consulta TODOS los nodos `Atributo` conectados al usuario, con tipo, importancia, relación y timestamp
- `getUserMemoryByType(userId, rel)`: Consulta atributos filtrados por tipo de relación (ej: `TIENE_TRIGGER`)
- `getRecentCravingsWithTriggers(userId, days)`: Cravings de los últimos N días con sus etiquetas de trigger
- `getUserEvolution(userId)`: Métricas de evolución (etapa, riesgo, checkins 30d, cravings 30d, promedio intensidad)
- `buildEnrichedUserProfile(userId)`: Construye un perfil completo combinando todas las fuentes de datos
- `updateUserStage(userId, etapa, riesgo?)`: Actualiza la etapa de cambio/riesgo del usuario en el grafo
- `upsertUserSubstance(userId, substanceName)`: Registra nuevas sustancias descubiertas en la conversación

#### 3. `server/src/services/langgraph.service.ts` — agentNode + memoryNode reescritos
- **agentNode**: Ahora usa `memoryService.retrieveMemoryContext()` para inyectar TODA la memoria (8 tipos) en el system prompt. También enriquece el `userContext` con `buildEnrichedUserProfile()` del grafo Neo4j
- **memoryNode reescrito**: Usa `memoryService.extractMemories()` y `memoryService.persistMemories()` del sistema tipificado. Ya no tiene su propia lógica de extracción simplificada
- **Nuevo `analyzeAndUpdateProfile()`**: Después de cada turno, un LLM analiza si el mensaje indica cambio de etapa de cambio (Prochaska & DiClemente), cambio de nivel de riesgo, o mención de nuevas sustancias, y actualiza el grafo Neo4j dinámicamente
- Import de `memoryService` agregado

#### 4. `server/src/controllers/chatbot.controller.ts` — Contexto enriquecido
- **sendMessage**: `userContext` ahora incluye `etapaCambio`, `nivelRiesgo`, `sustancias`, `medicamentos`, `memoriasGrafo`, `actividadReciente`, `alertasRiesgo` — todos obtenidos dinámicamente del grafo Neo4j via `buildEnrichedUserProfile()`
- **streamMessage**: Mismo enriquecimiento de contexto. Además, ahora procesa memoria del turno (`memoryService.processTurn()`) que antes no se hacía en absoluto
- Eliminado el hardcodeo de `etapaCambio: 'contemplacion'`

### Resultado esperado:
- LÚA ahora "recuerda" triggers, objetivos, estrategias de afrontamiento, factores de riesgo, patrones de consumo y relaciones importantes del usuario a través de conversaciones
- El perfil evoluciona: si un usuario pasa de contemplar el cambio a prepararse activamente, la etapa se actualiza en el grafo y las respuestas se adaptan
- El grafo Neo4j se usa activamente como fuente de verdad del perfil del usuario, no solo como almacén pasivo
- Nuevas sustancias mencionadas en conversación se registran automáticamente en el grafo

## 26-04-25 Auditoría y expansión de la base de conocimientos de LÚA

Descripción general: Se realizó una auditoría completa de la base de conocimientos (`server/knowledge_base/`), se identificaron brechas críticas de contenido, se buscó documentación científica relevante en PubMed y fuentes institucionales, se crearon 3 nuevas carpetas temáticas, se repararon 3 archivos corruptos y se generó un documento de análisis de brechas.

### Proceso

#### 1. Auditoría de la base de conocimientos existente
- Se examinaron las 7 carpetas originales (01-07) + carpetas auxiliares (faqs, psicoeducacion, recursos_locales, tecnicas)
- Se leyeron todos los archivos `_RESUMEN_CARPETA.md` y archivos de contenido
- Se detectaron **3 archivos _RESUMEN corruptos**: `05/` (Cloudflare HTML), `06/` (plantilla vacía), `07/` (HTML dump de UNODC)
- Se detectó **1 archivo de contenido corrupto**: `05/mobile_apps_SUD_umbrella_review_2024.md` (Cloudflare HTML)
- Se identificó que la carpeta `06/` tiene 3 archivos generados sin extracción de texto exitosa

#### 2. Búsqueda de documentación científica
Se realizaron búsquedas en PubMed y fuentes institucionales en 8 áreas temáticas:
- Reducción de daños + SUD (209 resultados)
- Trauma-informed care + SUD (7 resultados)
- AI chatbot + salud mental + adicción (2 resultados)
- Modelo transteórico + SUD (14 resultados)
- Tratamiento asistido con medicación + TUO (10 resultados)
- Riesgo suicida + SUD (44 resultados)
- Involucramiento familiar + SUD (172 resultados)
- Fuentes institucionales: NIDA (exitoso), SAMHSA (403 bloqueado)

**Desafío**: Los intentos de descargar artículos completos de PMC fallaron porque los PMC IDs no corresponden directamente a los PubMed IDs. Los PMCID deben buscarse por separado.

#### 3. Documento de análisis de brechas
- **Archivo creado**: `server/knowledge_base/ANALISIS_BRECHAS_BASE_CONOCIMIENTOS.md`
- Mapeo completo de brechas entre lo que el system prompt de LÚA necesita vs. lo que la KB contiene
- 9 áreas de brecha identificadas con prioridad, impacto y PMIDs de artículos recomendados

#### 4. Nuevas carpetas creadas

**`08_reduccion_danos/`** (2 archivos):
- `_RESUMEN_CARPETA.md`: Índice del contenido de la carpeta
- `reduccion_danos_marco_conceptual.md`: Marco conceptual completo sobre reducción de daños aplicado a SUD. Incluye: principios fundamentales, evidencia por sustancia (alcohol, opioides, estimulantes, cannabis), estrategias prácticas para LÚA, temas polémicos, contexto LATAM, y técnicas que el chatbot puede enseñar

**`09_modelo_transteorico/`** (2 archivos):
- `_RESUMEN_CARPETA.md`: Índice del contenido
- `modelo_transteorico_aplicacion_SUD.md`: Modelo Transteórico de Cambio (Prochaska & DiClemente) aplicado a SUD. Incluye: las 6 etapas detalladas, procesos de cambio asociados, balance decisional, autoeficacia, cómo LÚA debe adaptar su comunicación por etapa, señales para detectar etapa y transiciones, y trampas comunes

**`10_trauma_informed_care/`** (2 archivos):
- `_RESUMEN_CARPETA.md`: Índice del contenido
- `trauma_informed_care_SUD.md`: Cuidado informado por trauma aplicado a SUD. Incluye: conexión trauma-adicción, los 6 principios SAMHSA del TIC, las 4 Rs, señales de trauma que LÚA debe detectar, protocolos de respuesta para revelaciones de trauma, comorbilidad TEPT+SUD, datos de ACEs y riesgo, técnicas de regulación que LÚA puede enseñar (grounding, respiración, contenedor mental, lugar seguro)

#### 5. Reparación de archivos corruptos
- **`05_salud_digital_apps/_RESUMEN_CARPETA.md`**: Reemplazado HTML de Cloudflare con resumen real de los 4 archivos de la carpeta
- **`06_apoyo_recuperacion/_RESUMEN_CARPETA.md`**: Reemplazada plantilla vacía con resumen que documenta el estado incompleto de los contenidos
- **`07_contexto_global_latinoamerica/_RESUMEN_CARPETA.md`**: Reemplazado HTML de UNODC con resumen de los 2 archivos (1 corrupto, 1 válido)

### Archivos creados/modificados
- `server/knowledge_base/ANALISIS_BRECHAS_BASE_CONOCIMIENTOS.md` (nuevo)
- `server/knowledge_base/08_reduccion_danos/_RESUMEN_CARPETA.md` (nuevo)
- `server/knowledge_base/08_reduccion_danos/reduccion_danos_marco_conceptual.md` (nuevo)
- `server/knowledge_base/09_modelo_transteorico/_RESUMEN_CARPETA.md` (nuevo)
- `server/knowledge_base/09_modelo_transteorico/modelo_transteorico_aplicacion_SUD.md` (nuevo)
- `server/knowledge_base/10_trauma_informed_care/_RESUMEN_CARPETA.md` (nuevo)
- `server/knowledge_base/10_trauma_informed_care/trauma_informed_care_SUD.md` (nuevo)
- `server/knowledge_base/05_salud_digital_apps/_RESUMEN_CARPETA.md` (reparado)
- `server/knowledge_base/06_apoyo_recuperacion/_RESUMEN_CARPETA.md` (reparado)
- `server/knowledge_base/07_contexto_global_latinoamerica/_RESUMEN_CARPETA.md` (reparado)

### Resultado
- La base de conocimientos pasó de 7 a 10 carpetas temáticas
- 3 áreas críticas cubiertas: reducción de daños, modelo transteórico, trauma-informed care
- 3 resúmenes de carpeta corruptos reparados
- Documento de análisis de brechas disponible como guía para futuras expansiones
- Las nuevas carpetas están diseñadas específicamente para que LÚA las use en conversaciones: incluyen frases sugeridas, protocolos de respuesta y adaptaciones para el contexto LATAM
