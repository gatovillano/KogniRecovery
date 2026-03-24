# 📘 Guía Completa de Implementación - Sprint 2: Módulos de Usuario, Check-in, Chatbot NADA y Dashboards

**KogniRecovery** - App de acompañamiento en adicciones  
**Sprint**: 2 (Módulos de Usuario, Check-in, Chatbot NADA y Dashboards)  
**Duración estimada**: 4 semanas (20 días hábiles)  
**Estado**: Pendiente de implementación  
**Fecha de creación**: 21-02-2026

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Sprint](#arquitectura-del-sprint)
3. [Preparación del Entorno](#preparación-del-entorno)
4. [Plan de Migración](#plan-de-migración)
5. [Implementación del Backend](#implementación-del-backend)
   - [Schema SQL](#schema-sql)
   - [Modelos y Controladores](#modelos-y-controladores)
   - [Rutas API](#rutas-api)
   - [Servicios](#servicios)
   - [RAG y Neo4j](#rag-y-neo4j)
6. [Implementación del Frontend](#implementación-del-frontend)
   - [Onboarding (10 pantallas)](#onboarding-10-pantallas)
   - [Check-in Diario](#check-in-diario)
   - [Chatbot NADA](#chatbot-nada)
   - [Dashboard Paciente](#dashboard-paciente)
   - [Dashboard Familiar](#dashboard-familiar)
   - [Configuración de Emergencia y Privacidad](#configuración-de-emergencia-y-privacidad)
7. [Integración y Testing](#integración-y-testing)
8. [Checklist de Verificación](#checklist-de-verificación)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

### Objetivos del Sprint 2

El Sprint 2 tiene como objetivo implementar el sistema completo de funcionalidades centrales de KogniRecovery:

- ✅ Sistema de perfiles de usuario con asignación automática basada en características del paciente
- ✅ Onboarding completo con 10 pantallas de configuración inicial
- ✅ Check-in diario con registro emocional, de consumo, cravings y actividades
- ✅ Chatbot NADA con integración LLM + RAG + Knowledge Graph
- ✅ 10 escenarios conversacionales implementados
- ✅ Detección de riesgo y protocolos de crisis
- ✅ Dashboard del paciente con widgets de estado
- ✅ Dashboard del familiar con información agregada
- ✅ Configuración de emergencia y privacidad
- ✅ Sistema RAG y Neo4j para inteligencia aumentada

### Alcance Funcional

**Nuevas funcionalidades:**
- CRUD de perfiles de usuario con tipos específicos
- Onboarding flow completo según FLUJOS_ONBOARDING.md
- Asignación automática de perfiles basada en características
- Check-in diario completo: mood (1-10), tags emocionales, registro de sustancias, cravings, actividades
- Chatbot NADA con prompts adaptativos por perfil de usuario
- Sistema de 10 escenarios conversacionales (ESCENARIOS_CONVERSACIONALES.md)
- Dashboard del paciente con widgets de estado emocional, consumo, cravings
- Dashboard del familiar con vista agregada y botones de apoyo
- Configuración de emergencia: contactos, línea de crisis, permisos
- Configuración de privacidad: compartición con familiares
- Integración con Neo4j y sistema RAG para inteligencia aumentada

**Archivos nuevos a crear:** 80+ archivos  
**Archivos a modificar:** 15 archivos existentes  
**Líneas de código totales:** ~8,500 líneas

---

## 🏗️ Arquitectura del Sprint

### Diagrama de Arquitectura General

```mermaid
graph TB
    subgraph "Frontend (React Native/Expo)"
        A[App.tsx]
        B[RootNavigator]
        C[AuthNavigator]
        D[Onboarding Screens 10]
        E[MainTabNavigator]
        F[Dashboard Paciente]
        G[Dashboard Familiar]
        H[Chatbot NADA]
        I[Check-in Diario]
        J[Configuración]
    end

    subgraph "Backend (Express)"
        K[Express Server]
        L[Auth Routes]
        M[User Routes]
        N[Profile Routes]
        O[CheckIn Routes]
        P[Chatbot Routes]
        Q[Dashboard Routes]
        R[Settings Routes]
        S[Emergency Routes]
    end

    subgraph "Base de Datos"
        T[PostgreSQL]
        U[Neo4j - Knowledge Graph]
    end

    subgraph "Servicios AI"
        V[LLM Service]
        W[RAG Engine]
        X[Vector Store]
    end

    A --> B
    B --> C
    B --> D
    B --> E
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
    
    K --> L
    K --> M
    K --> N
    K --> O
    K --> P
    K --> Q
    K --> R
    K --> S
    
    L --> T
    M --> T
    N --> T
    O --> T
    P --> T
    Q --> T
    R --> T
    S --> T
    
    P --> V
    V --> W
    W --> X
    W --> U
    K --> U

    style A fill:#e1f5fe
    style K fill:#f3e5f5
    style T fill:#e8f5e8
    style U fill:#fff3e0
    style V fill:#ffebee
```

### Flujo de Datos del Sprint 2

```mermaid
flowchart TD
    subgraph "Usuario Flow"
        A[Usuario registra] --> B[Onboarding 10 pasos]
        B --> C[Asignar Perfil Automático]
        C --> D{Usuario Completó Onboarding?}
        D -->|Sí| E[Dashboard Paciente]
        D -->|No| B
        
        E --> F[Check-in Diario]
        E --> G[Chatbot NADA]
        E --> H[Configuración]
        
        I[Usuario Familiar] --> J[Dashboard Familiar]
        J --> K[Ver Info Agregada]
        J --> L[Enviar Apoyo]
    end
    
    subgraph "Backend Processing"
        F --> M[API Check-in]
        G --> N[API Chatbot]
        N --> O[LLM + RAG]
        O --> P[Neo4j Query]
        O --> Q[Vector Search]
        M --> R[PostgreSQL]
    end
    
    subgraph "AI Services"
        O --> S[Generar Respuesta]
        S --> T[Detectar Riesgo]
        T -->|Alto| U[Protocolo Crisis]
        T -->|Normal| G
    end

    style E fill:#ce93d8
    style G fill:#90caf9
    style O fill:#ffcc80
    style U fill:#ef5350
```

---

## 🛠️ Preparación del Entorno

### Requisitos Previos

**Software necesario:**
- Node.js 18+ ([descargar](https://nodejs.org/))
- PostgreSQL 15+ ([descargar](https://www.postgresql.org/download/))
- Neo4j 5.x+ ([descargar](https://neo4j.com/download/))
- Docker y Docker Compose
- Expo CLI: `npm install -g expo-cli`
- Git

**Servicios Cloud (opcionales para producción):**
- Neo4j Aura (managed Neo4j)
- OpenAI API key (para LLM)
- Pinecone/Chroma (vector store alternative)

### Variables de entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
# Backend
BACKEND_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=tu-secreto-jwt-super-seguro-cambiar-en-prod
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kognirecovery_dev
DB_USER=postgres
DB_PASSWORD=postgres

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=tu_password_neo4j

# LLM
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# Vector Store
VECTOR_STORE_TYPE=neo4j  # o pinecone, chroma

# CORS
CORS_ORIGIN=http://localhost:19006
```

### Instalación de Dependencias

```bash
# 1. Ir al directorio del proyecto
cd /home/gato/KogniRecovery

# 2. Instalar dependencias del frontend
npm install

# 3. Instalar dependencias del backend
cd server
npm install

# 4. Dependencias adicionales para Neo4j y RAG
npm install neo4j-driver @neo4j/cypher-editor-support4
npm install openai
npm install @pinecone-database/pinecone chromadb

# 5. Instalar dependencias de vectores (Python para embeddings)
pip install sentence-transformers numpy

# 6. Iniciar servicios con Docker
docker-compose up -d

# 7. Verificar servicios
docker ps  # debe mostrar postgres y neo4j
```

---

## 📦 Plan de Migración

### Estrategia de Aplicación Considerando Bloqueos

**ADVERTENCIA**: El sistema `.kilocodeignore` puede bloquear la edición de archivos existentes en `src/`. Seguir esta estrategia:

#### Fase 1: Backup de Archivos Existentes

```bash
# Crear carpeta de backup
mkdir -p backups/sprint2-backup-$(date +%Y%m%d-%H%M%S)

# Backup de archivos a modificar
cp src/screens/dashboard/DashboardScreen.tsx backups/
cp src/screens/chatbot/ChatbotScreen.tsx backups/
cp src/screens/checkin/CheckInScreen.tsx backups/
cp src/navigation/MainTabNavigator.tsx backups/
cp src/store/authStore.ts backups/
cp src/services/api.ts backups/
```

#### Fase 2: Crear Archivos NUEVOS (no bloqueados)

Los archivos nuevos se crearán en ubicaciones temporales o con nombres nuevos:

**Nuevos archivos de frontend:**
- `src/screens/onboarding/` (10 pantallas)
- `src/screens/dashboard/PatientDashboardScreen.tsx`
- `src/screens/dashboard/FamilyDashboardScreen.tsx`
- `src/screens/settings/EmergencySettingsScreen.tsx`
- `src/screens/settings/PrivacySettingsScreen.tsx`
- `src/components/Dashboard/`
- `src/components/Chatbot/`
- `src/components/CheckIn/`
- `src/hooks/useProfiles.ts`
- `src/hooks/useCheckIn.ts`
- `src/hooks/useChatbot.ts`
- `src/services/llm.service.ts`
- `src/services/rag.service.ts`
- `src/services/neo4j.service.ts`

**Nuevos archivos de backend:**
- `server/src/models/profile.model.ts`
- `server/src/models/checkin.model.ts`
- `server/src/models/craving.model.ts`
- `server/src/models/emergency.model.ts`
- `server/src/models/sharing.model.ts`
- `server/src/models/chat.model.ts`
- `server/src/controllers/profile.controller.ts`
- `server/src/controllers/checkin.controller.ts`
- `server/src/controllers/chatbot.controller.ts`
- `server/src/controllers/dashboard.controller.ts`
- `server/src/controllers/emergency.controller.ts`
- `server/src/routes/profile.routes.ts`
- `server/src/routes/checkin.routes.ts`
- `server/src/routes/chatbot.routes.ts`
- `server/src/routes/dashboard.routes.ts`
- `server/src/routes/emergency.routes.ts`
- `server/src/services/profile.service.ts`
- `server/src/services/checkin.service.ts`
- `server/src/services/chatbot.service.ts`
- `server/src/services/dashboard.service.ts`
- `server/src/services/rag.service.ts`
- `server/src/services/neo4j.service.ts`
- `server/src/services/llm.service.ts`

#### Fase 3: Actualizar Imports y Referencias

```bash
# Actualizar referencias en archivos que importan los modificados
# Ejemplo: si PatientDashboardScreen se importa en MainTabNavigator
# Cambiar import existente por el nuevo
```

#### Fase 4: Limpiar Cache y Reinstalar

```bash
# Frontend
rm -rf node_modules package-lock.json
npm install
npx expo start -c

# Backend
cd server
rm -rf node_modules package-lock.json
npm install
```

---

## 🗃️ Tabla de Archivos del Sprint 2

### Archivos Nuevos a Crear - Backend

| # | Archivo | Tipo | Descripción |
|---|---------|------|-------------|
| 1 | `server/src/models/profile.model.ts` | Modelo | Modelo de perfil de usuario |
| 2 | `server/src/models/checkin.model.ts` | Modelo | Modelo de check-in diario |
| 3 | `server/src/models/craving.model.ts` | Modelo | Modelo de cravings |
| 4 | `server/src/models/emergency.model.ts` | Modelo | Modelo de contactos de emergencia |
| 5 | `server/src/models/sharing.model.ts` | Modelo | Modelo de compartición familiar |
| 6 | `server/src/models/chat.model.ts` | Modelo | Modelo de mensajes del chatbot |
| 7 | `server/src/models/resource.model.ts` | Modelo | Modelo de recursos educativos |
| 8 | `server/src/controllers/profile.controller.ts` | Controlador | Controlador de perfiles |
| 9 | `server/src/controllers/checkin.controller.ts` | Controlador | Controlador de check-in |
| 10 | `server/src/controllers/chatbot.controller.ts` | Controlador | Controlador del chatbot |
| 11 | `server/src/controllers/dashboard.controller.ts` | Controlador | Controlador de dashboards |
| 12 | `server/src/controllers/emergency.controller.ts` | Controlador | Controlador de emergencia |
| 13 | `server/src/routes/profile.routes.ts` | Ruta | Rutas de perfiles |
| 14 | `server/src/routes/checkin.routes.ts` | Ruta | Rutas de check-in |
| 15 | `server/src/routes/chatbot.routes.ts` | Ruta | Rutas del chatbot |
| 16 | `server/src/routes/dashboard.routes.ts` | Ruta | Rutas de dashboards |
| 17 | `server/src/routes/emergency.routes.ts` | Ruta | Rutas de emergencia |
| 18 | `server/src/services/profile.service.ts` | Servicio | Lógica de perfiles |
| 19 | `server/src/services/checkin.service.ts` | Servicio | Lógica de check-in |
| 20 | `server/src/services/chatbot.service.ts` | Servicio | Lógica del chatbot |
| 21 | `server/src/services/dashboard.service.ts` | Servicio | Lógica de dashboards |
| 22 | `server/src/services/rag.service.ts` | Servicio | Servicio RAG |
| 23 | `server/src/services/neo4j.service.ts` | Servicio | Servicio Neo4j |
| 24 | `server/src/services/llm.service.ts` | Servicio | Servicio LLM |
| 25 | `server/src/config/neo4j.ts` | Config | Configuración Neo4j |
| 26 | `server/src/config/llm.ts` | Config | Configuración LLM |
| 27 | `server/migrations/013_profiles.sql` | Migración | Tablas de perfiles |
| 28 | `server/migrations/014_checkins.sql` | Migración | Tablas de check-in |
| 29 | `server/migrations/015_cravings.sql` | Migración | Tablas de cravings |
| 30 | `server/migrations/016_emergency_contacts.sql` | Migración | Tablas de emergencia |
| 31 | `server/migrations/017_sharing.sql` | Migración | Tablas de compartición |

### Archivos Nuevos a Crear - Frontend

| # | Archivo | Tipo | Descripción |
|---|---------|------|-------------|
| 1 | `src/screens/onboarding/WelcomeScreen.tsx` | Pantalla | Pantalla 1: Bienvenida |
| 2 | `src/screens/onboarding/RoleSelectionScreen.tsx` | Pantalla | Pantalla 2: Selección rol |
| 3 | `src/screens/onboarding/BasicDataScreen.tsx` | Pantalla | Pantalla 3: Datos básicos |
| 4 | `src/screens/onboarding/ChangeStageScreen.tsx` | Pantalla | Pantalla 4: Etapa cambio |
| 5 | `src/screens/onboarding/LifeContextScreen.tsx` | Pantalla | Pantalla 5: Contexto vida |
| 6 | `src/screens/onboarding/ProfileAssignmentScreen.tsx` | Pantalla | Pantalla 6: Asignación perfil |
| 7 | `src/screens/onboarding/EmergencyConfigScreen.tsx` | Pantalla | Pantalla 7: Emergencia |
| 8 | `src/screens/onboarding/PrivacyConfigScreen.tsx` | Pantalla | Pantalla 8: Privacidad |
| 9 | `src/screens/onboarding/SpecificOnboardingScreen.tsx` | Pantalla | Pantalla 9: Específico |
| 10 | `src/screens/onboarding/CompletionScreen.tsx` | Pantalla | Pantalla 10: Finalización |
| 11 | `src/screens/onboarding/FamilyOnboardingScreen.tsx` | Pantalla | Onboarding familiar |
| 12 | `src/screens/dashboard/PatientDashboardScreen.tsx` | Pantalla | Dashboard paciente |
| 13 | `src/screens/dashboard/FamilyDashboardScreen.tsx` | Pantalla | Dashboard familiar |
| 14 | `src/screens/settings/EmergencySettingsScreen.tsx` | Pantalla | Config. emergencia |
| 15 | `src/screens/settings/PrivacySettingsScreen.tsx` | Pantalla | Config. privacidad |
| 16 | `src/components/Dashboard/MoodWidget.tsx` | Componente | Widget de estado emocional |
| 17 | `src/components/Dashboard/ConsumptionWidget.tsx` | Componente | Widget de consumo |
| 18 | `src/components/Dashboard/CravingWidget.tsx` | Componente | Widget de cravings |
| 19 | `src/components/Dashboard/QuickActions.tsx` | Componente | Acciones rápidas |
| 20 | `src/components/Dashboard/ProgressCard.tsx` | Componente | Tarjeta de progreso |
| 21 | `src/components/Chatbot/ChatMessage.tsx` | Componente | Mensaje de chat |
| 22 | `src/components/Chatbot/ChatInput.tsx` | Componente | Input de chat |
| 23 | `src/components/Chatbot/TechniqueCard.tsx` | Componente | Tarjeta de técnica |
| 24 | `src/components/Chatbot/EmergencyModal.tsx` | Componente | Modal de emergencia |
| 25 | `src/components/CheckIn/MoodSlider.tsx` | Componente | Slider de mood |
| 26 | `src/components/CheckIn/SubstanceSelector.tsx` | Componente | Selector de sustancias |
| 27 | `src/components/CheckIn/CravingForm.tsx` | Componente | Formulario de craving |
| 28 | `src/components/CheckIn/ActivitySelector.tsx` | Componente | Selector de actividades |
| 29 | `src/hooks/useProfiles.ts` | Hook | Hook de perfiles |
| 30 | `src/hooks/useCheckIn.ts` | Hook | Hook de check-in |
| 31 | `src/hooks/useChatbot.ts` | Hook | Hook del chatbot |
| 32 | `src/hooks/useDashboard.ts` | Hook | Hook de dashboard |
| 33 | `src/store/profileStore.ts` | Store | Store de perfiles |
| 34 | `src/store/chatStore.ts` | Store | Store de chat |
| 35 | `src/services/llm.service.ts` | Servicio | Servicio LLM |
| 36 | `src/services/rag.service.ts` | Servicio | Servicio RAG |
| 37 | `src/utils/profile-utils.ts` | Util | Utilidades de perfiles |
| 38 | `src/utils/risk-detector.ts` | Util | Detector de riesgo |

### Archivos a Modificar (Existentes)

| Archivo | Modificación | Descripción |
|---------|-------------|-------------|
| `src/screens/index.ts` | +20 líneas | Exportar nuevas pantallas |
| `src/navigation/types.ts` | +30 líneas | Tipos de navegación |
| `src/navigation/MainTabNavigator.tsx` | +50 líneas | Agregar tabs |
| `src/navigation/RootNavigator.tsx` | +20 líneas | Navegación |
| `src/services/api.ts` | +100 líneas | Nuevos endpoints |
| `src/services/endpoints.ts` | +50 líneas | URLs de API |
| `src/store/index.ts` | +10 líneas | Exportar stores |
| `src/types/index.ts` | +50 líneas | Nuevos tipos |
| `server/src/app.ts` | +30 líneas | Registrar rutas |
| `server/src/routes/index.ts` | +40 líneas | Agregar rutas |
| `server/src/controllers/index.ts` | +20 líneas | Exportar controladores |
| `server/src/services/index.ts` | +30 líneas | Exportar servicios |
| `server/src/models/index.ts` | +30 líneas | Exportar modelos |
| `docker-compose.yml` | +20 líneas | Agregar Neo4j |

---

## 💾 Implementación del Backend

### Schema SQL

#### Paso 1: Tablas de Perfiles

**Ruta:** `server/migrations/013_profiles.sql`

```sql
-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_type VARCHAR(50) NOT NULL DEFAULT 'base',
    profile_name VARCHAR(100),
    stage_of_change VARCHAR(20) DEFAULT 'precontemplation',
    risk_level VARCHAR(20) DEFAULT 'low',
    
    -- Datos del onboarding
    age INTEGER,
    gender VARCHAR(20),
    country VARCHAR(2),
    primary_substance VARCHAR(50),
    other_substances TEXT[],
    consumption_frequency VARCHAR(20),
    consumption_amount VARCHAR(50),
    consumption_duration VARCHAR(20),
    
    -- Contexto de vida
    family_situation VARCHAR(50),
    has_mental_health_diagnosis BOOLEAN,
    mental_health_details TEXT[],
    has_trauma_history BOOLEAN,
    has_therapeutic_support BOOLEAN,
    
    -- Preferencias
    language VARCHAR(10) DEFAULT 'es',
    notifications_enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_type ON profiles(profile_type);
CREATE INDEX idx_profiles_stage ON profiles(stage_of_change);

-- Tabla de etapas de cambio (histórico)
CREATE TABLE IF NOT EXISTS stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_stage VARCHAR(20),
    new_stage VARCHAR(20),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stage_history_user ON stage_history(user_id);
```

#### Paso 2: Tablas de Check-in

**Ruta:** `server/migrations/014_checkins.sql`

```sql
-- Tabla de check-ins diarios
CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Estado emocional
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    mood_tags TEXT[],
    mood_notes TEXT,
    
    -- Consumo de sustancias
    substances JSONB DEFAULT '[]',
    -- Formato: [{"substance": "alcohol", "amount": "2 copas", "time": "20:00"}]
    
    -- Cravings
    has_craving BOOLEAN DEFAULT false,
    craving_intensity INTEGER CHECK (craving_intensity >= 1 AND craving_intensity <= 10),
    craving_substance VARCHAR(50),
    craving_trigger TEXT,
    craving_time TIME,
    
    -- Actividades de recuperación
    activities JSONB DEFAULT '[]',
    -- Formato: [{"activity": "terapia", "duration": 60, "notes": "..."}]
    
    -- metadata
    checkin_date DATE DEFAULT CURRENT_DATE,
    checkin_time TIME DEFAULT CURRENT_TIME,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_checkins_user_date ON checkins(user_id, checkin_date DESC);
CREATE INDEX idx_checkins_user ON checkins(user_id);

-- Tabla de historial de cravings
CREATE TABLE IF NOT EXISTS cravings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
    substance VARCHAR(50),
    trigger_text TEXT,
    context TEXT,
    
    -- Resultado
    used_technique BOOLEAN DEFAULT false,
    technique_name VARCHAR(100),
    resisted BOOLEAN DEFAULT false,
    
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cravings_user ON cravings(user_id);
CREATE INDEX idx_cravings_date ON cravings(occurred_at DESC);

-- Tabla de actividades de recuperación
CREATE TABLE IF NOT EXISTS recovery_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    activity_type VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    duration_minutes INTEGER,
    notes TEXT,
    completed BOOLEAN DEFAULT true,
    
    scheduled_date DATE,
    completed_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_user ON recovery_activities(user_id);
```

#### Paso 3: Tablas de Emergencia

**Ruta:** `server/migrations/016_emergency_contacts.sql`

```sql
-- Tabla de contactos de emergencia
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    
    -- Permisos
    can_notify BOOLEAN DEFAULT true,
    notify_level VARCHAR(20) DEFAULT 'critical',
    -- 'critical', 'high', 'any'
    
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_emergency_user ON emergency_contacts(user_id);

-- Tabla de líneas de crisis por país
CREATE TABLE IF NOT EXISTS crisis_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country VARCHAR(2) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preferencias de emergencia del usuario
CREATE TABLE IF NOT EXISTS emergency_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    preferred_crisis_line UUID REFERENCES crisis_lines(id),
    custom_crisis_line VARCHAR(50),
    auto_notify_contacts BOOLEAN DEFAULT true,
    share_location_emergency BOOLEAN DEFAULT false,
    
    notify_on_critical BOOLEAN DEFAULT true,
    notify_on_high BOOLEAN DEFAULT false,
    notify_on_any BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Paso 4: Tablas de Compartición Familiar

**Ruta:** `server/migrations/017_sharing.sql`

```sql
-- Tabla de invitaciones de compartición
CREATE TABLE IF NOT EXISTS sharing_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    familiar_email VARCHAR(100) NOT NULL,
    familiar_name VARCHAR(100),
    relationship VARCHAR(50),
    
    status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'accepted', 'rejected', 'revoked'
    
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sharing_patient ON sharing_invitations(patient_id);
CREATE INDEX idx_sharing_token ON sharing_invitations(token);

-- Tabla de permisos de compartición
CREATE TABLE IF NOT EXISTS sharing_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    familiar_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Permisos específicos
    share_achievements BOOLEAN DEFAULT true,
    share_mood BOOLEAN DEFAULT true,
    share_therapy_attendance BOOLEAN DEFAULT false,
    share_cravings BOOLEAN DEFAULT false,
    share_location_emergency BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(patient_id, familiar_id)
);

CREATE INDEX idx_permissions_patient ON sharing_permissions(patient_id);
CREATE INDEX idx_permissions_familiar ON sharing_permissions(familiar_id);

-- Tabla de mensajes de apoyo del familiar
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    
    message_type VARCHAR(20) DEFAULT 'predefined',
    -- 'predefined', 'custom'
    
    predefined_key VARCHAR(50),
    custom_text TEXT,
    
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_support_to_user ON support_messages(to_user_id);
```

#### Paso 5: Tablas de Chat

```sql
-- Tabla de conversaciones del chatbot
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    profile_type VARCHAR(50),
    risk_level VARCHAR(20) DEFAULT 'low',
    
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_conversations_user ON conversations(user_id);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    role VARCHAR(20) NOT NULL,
    -- 'user', 'assistant', 'system'
    
    content TEXT NOT NULL,
    
    -- Metadata del asistente
    model_used VARCHAR(50),
    tokens_used INTEGER,
    
    -- Análisis de riesgo
    detected_risk_level VARCHAR(20),
    risk_indicators JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

---

### Modelos y Controladores

#### Modelo de Perfil

**Ruta:** `server/src/models/profile.model.ts`

```typescript
import db from '../config/database';

export interface Profile {
  id: string;
  user_id: string;
  profile_type: string;
  profile_name: string;
  stage_of_change: string;
  risk_level: string;
  age?: number;
  gender?: string;
  country?: string;
  primary_substance?: string;
  other_substances?: string[];
  consumption_frequency?: string;
  consumption_amount?: string;
  consumption_duration?: string;
  family_situation?: string;
  has_mental_health_diagnosis?: boolean;
  mental_health_details?: string[];
  has_trauma_history?: boolean;
  has_therapeutic_support?: boolean;
  language?: string;
  notifications_enabled?: boolean;
  created_at: Date;
  updated_at: Date;
}

export const ProfileModel = {
  async findByUserId(userId: string): Promise<Profile | null> {
    const result = await db('profiles')
      .where('user_id', userId)
      .first();
    return result || null;
  },

  async create(profile: Partial<Profile>): Promise<Profile> {
    const [created] = await db('profiles')
      .insert(profile)
      .returning('*');
    return created;
  },

  async update(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const [updated] = await db('profiles')
      .where('user_id', userId)
      .update({ ...updates, updated_at: new Date() })
      .returning('*');
    return updated || null;
  },

  async assignProfile(userId: string, profileData: {
    age: number;
    gender: string;
    substance: string;
    consumptionAmount: string;
    stage: string;
    hasChildren: boolean;
    livesAlone: boolean;
    hasMentalHealthDiagnosis: boolean;
    hasTrauma: boolean;
  }): Promise<Profile> {
    // Algoritmo de asignación de perfil basado en características
    let profileType = 'base';
    let riskLevel = 'low';

    // Lógica de asignación de perfil
    if (profileData.age >= 13 && profileData.age <= 17) {
      profileType = 'adolescente';
    } else if (profileData.age >= 21 && profileData.age <= 25) {
      profileType = 'universitario';
    } else if (profileData.age >= 35 && profileData.age <= 50) {
      profileType = 'profesional';
    } else if (profileData.age >= 65) {
      profileType = 'adulto_mayor';
    }

    // Ajustar según sustancia y etapa
    if (profileData.substance === 'opioides') {
      riskLevel = profileData.consumptionAmount === 'high' ? 'high' : 'medium';
    } else if (profileData.substance === 'alcohol') {
      riskLevel = 'medium';
    }

    // Crear o actualizar perfil
    const existing = await this.findByUserId(userId);
    if (existing) {
      return await this.update(userId, {
        profile_type: profileType,
        risk_level: riskLevel,
        stage_of_change: profileData.stage,
        age: profileData.age,
        gender: profileData.gender,
        primary_substance: profileData.substance,
      });
    }

    return await this.create({
      user_id: userId,
      profile_type: profileType,
      risk_level: riskLevel,
      stage_of_change: profileData.stage,
      age: profileData.age,
      gender: profileData.gender,
      country: 'CL',
      primary_substance: profileData.substance,
    });
  },
};
```

#### Modelo de Check-in

**Ruta:** `server/src/models/checkin.model.ts`

```typescript
import db from '../config/database';

export interface CheckIn {
  id: string;
  user_id: string;
  mood_score?: number;
  mood_tags?: string[];
  mood_notes?: string;
  substances?: any[];
  has_craving?: boolean;
  craving_intensity?: number;
  craving_substance?: string;
  craving_trigger?: string;
  craving_time?: string;
  activities?: any[];
  checkin_date: Date;
  checkin_time: string;
  created_at: Date;
}

export const CheckInModel = {
  async findByUserAndDate(userId: string, date: Date): Promise<CheckIn | null> {
    const result = await db('checkins')
      .where('user_id', userId)
      .where('checkin_date', date)
      .first();
    return result || null;
  },

  async findByUserId(userId: string, limit = 30): Promise<CheckIn[]> {
    return db('checkins')
      .where('user_id', userId)
      .orderBy('checkin_date', 'desc')
      .limit(limit);
  },

  async create(checkin: Partial<CheckIn>): Promise<CheckIn> {
    const [created] = await db('checkins')
      .insert(checkin)
      .returning('*');
    return created;
  },

  async update(id: string, updates: Partial<CheckIn>): Promise<CheckIn | null> {
    const [updated] = await db('checkins')
      .where('id', id)
      .update(updates)
      .returning('*');
    return updated || null;
  },

  async getWeeklyStats(userId: string): Promise<any> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const checkins = await db('checkins')
      .where('user_id', userId)
      .where('checkin_date', '>=', weekAgo)
      .orderBy('checkin_date', 'asc');

    const avgMood = checkins.reduce((sum, c) => sum + (c.mood_score || 0), 0) / (checkins.length || 1);
    const totalCravings = checkins.filter(c => c.has_craving).length;
    
    return {
      checkins,
      avgMood: Math.round(avgMood * 10) / 10,
      totalDays: checkins.length,
      totalCravings,
      streak: this.calculateStreak(checkins),
    };
  },

  calculateStreak(checkins: CheckIn[]): number {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < checkins.length; i++) {
      const checkDate = new Date(checkins[i].checkin_date);
      checkDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (checkDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },
};
```

#### Controlador de Check-in

**Ruta:** `server/src/controllers/checkin.controller.ts`

```typescript
import { Request, Response } from 'express';
import { CheckInModel } from '../models/checkin.model';
import { neo4jService } from '../services/neo4j.service';

export const CheckInController = {
  async createCheckIn(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const checkinData = req.body;

      // Validar que no existe check-in para hoy
      const existingToday = await CheckInModel.findByUserAndDate(
        userId,
        new Date()
      );

      if (existingToday) {
        // Actualizar existente
        const updated = await CheckInModel.update(
          existingToday.id,
          checkinData
        );
        return res.json(updated);
      }

      // Crear nuevo check-in
      const checkin = await CheckInModel.create({
        ...checkinData,
        user_id: userId,
        checkin_date: new Date(),
      });

      // Actualizar Neo4j con nuevos datos
      await neo4jService.updateUserCheckIn(userId, checkin);

      res.status(201).json(checkin);
    } catch (error) {
      console.error('Error creating check-in:', error);
      res.status(500).json({ error: 'Error al crear check-in' });
    }
  },

  async getCheckIns(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { limit = 30 } = req.query;

      const checkins = await CheckInModel.findByUserId(
        userId,
        parseInt(limit as string)
      );

      res.json(checkins);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      res.status(500).json({ error: 'Error al obtener check-ins' });
    }
  },

  async getWeeklyStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const stats = await CheckInModel.getWeeklyStats(userId);

      res.json(stats);
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  },

  async getTodayCheckIn(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const checkin = await CheckInModel.findByUserAndDate(
        userId,
        new Date()
      );

      res.json(checkin || null);
    } catch (error) {
      console.error('Error fetching today check-in:', error);
      res.status(500).json({ error: 'Error al obtener check-in' });
    }
  },
};
```

---

### Rutas API

#### Rutas de Perfiles

**Ruta:** `server/src/routes/profile.routes.ts`

```typescript
import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Rutas de perfil
router.get('/me', ProfileController.getMyProfile);
router.put('/me', ProfileController.updateProfile);
router.post('/assign', ProfileController.assignProfile);
router.get('/me/risk-level', ProfileController.getRiskLevel);

export default router;
```

#### Rutas de Check-in

**Ruta:** `server/src/routes/checkin.routes.ts`

```typescript
import { Router } from 'express';
import { CheckInController } from '../controllers/checkin.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', CheckInController.createCheckIn);
router.get('/', CheckInController.getCheckIns);
router.get('/today', CheckInController.getTodayCheckIn);
router.get('/weekly-stats', CheckInController.getWeeklyStats);
router.post('/craving', CheckInController.registerCraving);
router.get('/craving/history', CheckInController.getCravingHistory);

export default router;
```

#### Rutas del Chatbot

**Ruta:** `server/src/routes/chatbot.routes.ts`

```typescript
import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Chat
router.post('/message', ChatbotController.sendMessage);
router.get('/conversations', ChatbotController.getConversations);
router.get('/conversations/:id/messages', ChatbotController.getMessages);
router.post('/conversations', ChatbotController.startConversation);
router.delete('/conversations/:id', ChatbotController.endConversation);

// Emergency
router.post('/emergency/trigger', ChatbotController.triggerEmergency);
router.get('/emergency/protocol', ChatbotController.getEmergencyProtocol);

export default router;
```

#### Rutas de Dashboard

**Ruta:** `server/src/routes/dashboard.routes.ts`

```typescript
import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Dashboard del paciente
router.get('/patient', DashboardController.getPatientDashboard);

// Dashboard del familiar
router.get('/family', DashboardController.getFamilyDashboard);
router.get('/family/patient/:patientId', DashboardController.getPatientInfoForFamily);

// Apoyos
router.post('/support-message', DashboardController.sendSupportMessage);
router.get('/support-messages', DashboardController.getSupportMessages);

export default router;
```

#### Rutas de Emergencia

**Ruta:** `server/src/routes/emergency.routes.ts`

```typescript
import { Router } from 'express';
import { EmergencyController } from '../controllers/emergency.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Contactos de emergencia
router.get('/contacts', EmergencyController.getContacts);
router.post('/contacts', EmergencyController.createContact);
router.put('/contacts/:id', EmergencyController.updateContact);
router.delete('/contacts/:id', EmergencyController.deleteContact);

// Configuración
router.get('/preferences', EmergencyController.getPreferences);
router.put('/preferences', EmergencyController.updatePreferences);

// Líneas de crisis
router.get('/crisis-lines', EmergencyController.getCrisisLines);

// Activación de emergencia
router.post('/trigger', EmergencyController.triggerEmergency);

export default router;
```

#### Rutas de Configuración de Privacidad

**Ruta:** `server/src/routes/privacy.routes.ts`

```typescript
import { Router } from 'express';
import { SharingController } from '../controllers/sharing.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Invitaciones
router.get('/invitations', SharingController.getInvitations);
router.post('/invitations', SharingController.sendInvitation);
router.put('/invitations/:id/accept', SharingController.acceptInvitation);
router.put('/invitations/:id/reject', SharingController.rejectInvitation);
router.delete('/invitations/:id', SharingController.revokeInvitation);

// Permisos
router.get('/permissions', SharingController.getPermissions);
router.put('/permissions', SharingController.updatePermissions);

// Vista previa
router.get('/preview/:familiarId', SharingController.getPreviewForFamiliar);

export default router;
```

---

### Servicios

#### Servicio de LLM

**Ruta:** `server/src/services/llm.service.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskIndicators: string[];
  suggestedActions: string[];
  model: string;
  tokens: number;
}

export const LLMService = {
  async generateChatResponse(
    messages: ChatMessage[],
    systemPrompt: string,
    userContext: {
      profileType: string;
      riskLevel: string;
      recentCheckIn?: any;
      cravings?: any[];
    }
  ): Promise<ChatResponse> {
    // Construir prompt con contexto
    const contextPrompt = this.buildContextPrompt(userContext);
    
    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt + '\n\n' + contextPrompt },
      ...messages,
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Analizar riesgo
    const riskAnalysis = this.analyzeRisk(response, messages);

    return {
      content: response,
      riskLevel: riskAnalysis.level,
      riskIndicators: riskAnalysis.indicators,
      suggestedActions: riskAnalysis.suggestedActions,
      model: completion.model,
      tokens: completion.usage?.total_tokens || 0,
    };
  },

  buildContextPrompt(context: {
    profileType: string;
    riskLevel: string;
    recentCheckIn?: any;
    cravings?: any[];
  }): string {
    let prompt = `\n\n## Contexto del usuario\n`;
    prompt += `- Tipo de perfil: ${context.profileType}\n`;
    prompt += `- Nivel de riesgo: ${context.riskLevel}\n`;

    if (context.recentCheckIn) {
      prompt += `\n## Check-in reciente\n`;
      prompt += `- Estado de ánimo: ${context.recentCheckIn.mood_score}/10\n`;
      if (context.recentCheckIn.mood_tags) {
        prompt += `- Tags: ${context.recentCheckIn.mood_tags.join(', ')}\n`;
      }
      if (context.recentCheckIn.has_craving) {
        prompt += `- Craving: ${context.recentCheckIn.craving_intensity}/10\n`;
      }
    }

    if (context.cravings && context.cravings.length > 0) {
      prompt += `\n## Cravings recientes\n`;
      context.cravings.slice(0, 3).forEach((c, i) => {
        prompt += `${i + 1}. ${c.substance}: ${c.intensity}/10 (${c.trigger_text})\n`;
      });
    }

    return prompt;
  },

  analyzeRisk(response: string, messages: ChatMessage[]): {
    level: 'low' | 'medium' | 'high' | 'critical';
    indicators: string[];
    suggestedActions: string[];
  } {
    const lowerResponse = response.toLowerCase();
    const indicators: string[] = [];
    let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const suggestedActions: string[] = [];

    // Palabras clave de riesgo
    const criticalKeywords = ['suicidio', 'matarme', 'morir', 'overdose', 'sobredosis'];
    const highKeywords = ['autolesión', 'hacerme daño', 'no aguanto más'];
    const mediumKeywords = ['ansiedad', 'depresión', ' craving', 'ganas de usar'];

    // Verificar último mensaje del usuario
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop()?.content.toLowerCase() || '';

    if (criticalKeywords.some(k => lastUserMessage.includes(k))) {
      level = 'critical';
      indicators.push('Mención de suicidio o muerte');
      suggestedActions.push('Activar protocolo de crisis');
      suggestedActions.push('Mostrar números de emergencia');
    } else if (highKeywords.some(k => lastUserMessage.includes(k))) {
      level = 'high';
      indicators.push('Indicadores de autolesión');
      suggestedActions.push('Ofrecer técnicas de regulación');
      suggestedActions.push('Preguntar sobre ideación');
    } else if (mediumKeywords.some(k => lastUserMessage.includes(k))) {
      level = 'medium';
      indicators.push('Síntomas de riesgo detectado');
      suggestedActions.push('Monitorear conversación');
    }

    return { level, indicators, suggestedActions };
  },
};
```

#### Servicio RAG

**Ruta:** `server/src/services/rag.service.ts`

```typescript
import { neo4jService } from './neo4j.service';

export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  topic: string;
  relevance: number;
}

export const RAGService = {
  async searchRelevantKnowledge(
    query: string,
    userContext: {
      profileType: string;
      substance?: string;
      medications?: string[];
    },
    limit = 5
  ): Promise<KnowledgeChunk[]> {
    // Buscar en Neo4j
    const knowledgeNodes = await neo4jService.searchKnowledge(query, limit);

    // Filtrar por relevancia y contexto del usuario
    const relevant = knowledgeNodes
      .filter(k => this.isRelevantForUser(k, userContext))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    return relevant;
  },

  isRelevantForUser(
    chunk: KnowledgeChunk,
    context: { profileType: string; substance?: string; medications?: string[] }
  ): boolean {
    // Filtrar según sustancia del usuario
    if (context.substance && !chunk.topic.includes(context.substance)) {
      // Buscar contenido general también
      if (!chunk.topic.includes('general') && !chunk.topic.includes('adicción')) {
        return false;
      }
    }

    return true;
  },

  buildRAGPrompt(query: string, knowledge: KnowledgeChunk[]): string {
    if (knowledge.length === 0) {
      return '';
    }

    let prompt = '\n\n## Información relevante:\n';
    
    knowledge.forEach((k, i) => {
      prompt += `\n${i + 1}. [${k.source}] ${k.content}\n`;
    });

    prompt += '\n\nUsa esta información para responder de manera precisa y personalizada.\n';

    return prompt;
  },

  async getEducationalContent(
    topic: string,
    userContext: { substance?: string; stageOfChange?: string }
  ): Promise<KnowledgeChunk[]> {
    // Obtener contenido educativo filtrado
    return neo4jService.getEducationalContent(topic, userContext);
  },

  async checkInteractions(
    substances: string[],
    medications: string[]
  ): Promise<any[]> {
    // Verificar interacciones en Neo4j
    return neo4jService.checkDrugInteractions(substances, medications);
  },
};
```

#### Servicio Neo4j

**Ruta:** `server/src/services/neo4j.service.ts`

```typescript
import { Neo4jDriver } from '../config/neo4j';

export const neo4jService = {
  async searchKnowledge(query: string, limit = 5) {
    const session = Neo4jDriver.session();
    
    try {
      // Búsqueda simple en Neo4j (en producción usar embeddings)
      const result = await session.run(`
        MATCH (k:Knowledge)
        WHERE k.content CONTAINS $query OR k.topic CONTAINS $query
        RETURN k {
          .chunk_id,
          .content,
          .source,
          .topic,
          relevance: 1.0
        }
        LIMIT $limit
      `, { query, limit });

      return result.records.map(r => r.get('k'));
    } finally {
      await session.close();
    }
  },

  async updateUserCheckIn(userId: string, checkIn: any) {
    const session = Neo4jDriver.session();
    
    try {
      await session.run(`
        MATCH (u:User {uuid: $userId})
        SET u.last_checkin = datetime(),
            u.mood_score = $mood,
            u.last_craving = $craving
      `, {
        userId,
        mood: checkIn.mood_score,
        craving: checkIn.has_craving ? checkIn.craving_intensity : null,
      });
    } finally {
      await session.close();
    }
  },

  async getEducationalContent(
    topic: string,
    context: { substance?: string; stageOfChange?: string }
  ) {
    const session = Neo4jDriver.session();
    
    try {
      let query = `
        MATCH (k:Knowledge {type: 'educational'})
        WHERE k.topic CONTAINS $topic
      `;

      if (context.substance) {
        query += ` OR k.topic CONTAINS $substance`;
      }

      query += `
        RETURN k {
          .chunk_id,
          .content,
          .source,
          .topic,
          relevance: 0.5
        }
        LIMIT 5
      `;

      const result = await session.run(query, {
        topic,
        substance: context.substance,
      });

      return result.records.map(r => r.get('k'));
    } finally {
      await session.close();
    }
  },

  async checkDrugInteractions(substances: string[], medications: string[]) {
    const session = Neo4jDriver.session();
    
    try {
      const result = await session.run(`
        MATCH (s:Substance)-[i:INTERACTS_WITH]-(m:Medication)
        WHERE s.name IN $substances AND m.generic_name IN $medications
        RETURN s.name as substance, m.generic_name as medication,
               i.severity as severity, i.mechanism as mechanism
      `, { substances, medications });

      return result.records.map(r => ({
        substance: r.get('substance'),
        medication: r.get('medication'),
        severity: r.get('severity'),
        mechanism: r.get('mechanism'),
      }));
    } finally {
      await session.close();
    }
  },

  async getUserPersonalizedContext(userId: string) {
    const session = Neo4jDriver.session();
    
    try {
      const result = await session.run(`
        MATCH (u:User {uuid: $userId})
        OPTIONAL MATCH (u)-[:TAKES]->(m:Medication)
        OPTIONAL MATCH (u)-[:CONSUMES]->(s:Substance)
        OPTIONAL MATCH (u)-[:HAS_CONDITION]->(c:Condition)
        RETURN u {
          .profile_type,
          .stage_of_change,
          .risk_level,
          medications: collect(m { .generic_name, .brand_names }),
          substances: collect(s { .name, .class }),
          conditions: collect(c { .name })
        } as userData
      `, { userId });

      return result.records[0]?.get('userData') || null;
    } finally {
      await session.close();
    }
  },
};
```

#### Configuración de Neo4j

**Ruta:** `server/src/config/neo4j.ts`

```typescript
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
);

export const Neo4jDriver = driver;

export async function testNeo4jConnection() {
  const session = driver.session();
  try {
    const result = await session.run('RETURN 1 as test');
    console.log('✅ Neo4j connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error);
    return false;
  } finally {
    await session.close();
  }
}

// Inicializar schema de Neo4j
export async function initializeNeo4jSchema() {
  const session = driver.session();
  
  try {
    // Crear constraints
    await session.run('CREATE CONSTRAINT user_uuid_unique IF NOT EXISTS FOR (u:User) REQUIRE u.uuid IS UNIQUE');
    await session.run('CREATE CONSTRAINT medication_uuid_unique IF NOT EXISTS FOR (m:Medication) REQUIRE m.uuid IS UNIQUE');
    await session.run('CREATE CONSTRAINT substance_code_unique IF NOT EXISTS FOR (s:Substance) REQUIRE s.code IS UNIQUE');
    await session.run('CREATE CONSTRAINT knowledge_chunk_unique IF NOT EXISTS FOR (k:Knowledge) REQUIRE k.chunk_id IS UNIQUE');

    console.log('✅ Neo4j schema initialized');
  } catch (error) {
    console.error('Error initializing Neo4j schema:', error);
  } finally {
    await session.close();
  }
}
```

---

## 📱 Implementación del Frontend

### Onboarding (10 Pantallas)

El flujo de onboarding sigue exactamente lo especificado en `docs/Formulacion/FLUJOS_ONBOARDING.md`.

#### Navigation del Onboarding

**Ruta:** `src/navigation/OnboardingNavigator.tsx`

```typescript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import RoleSelectionScreen from '../screens/onboarding/RoleSelectionScreen';
import BasicDataScreen from '../screens/onboarding/BasicDataScreen';
import ChangeStageScreen from '../screens/onboarding/ChangeStageScreen';
import LifeContextScreen from '../screens/onboarding/LifeContextScreen';
import ProfileAssignmentScreen from '../screens/onboarding/ProfileAssignmentScreen';
import EmergencyConfigScreen from '../screens/onboarding/EmergencyConfigScreen';
import PrivacyConfigScreen from '../screens/onboarding/PrivacyConfigScreen';
import SpecificOnboardingScreen from '../screens/onboarding/SpecificOnboardingScreen';
import CompletionScreen from '../screens/onboarding/CompletionScreen';
import FamilyOnboardingScreen from '../screens/onboarding/FamilyOnboardingScreen';

export type OnboardingStackParamList = {
  Welcome: undefined;
  RoleSelection: undefined;
  BasicData: undefined;
  ChangeStage: undefined;
  LifeContext: undefined;
  ProfileAssignment: undefined;
  EmergencyConfig: undefined;
  PrivacyConfig: undefined;
  SpecificOnboarding: undefined;
  Completion: undefined;
  FamilyOnboarding: { patientToken?: string };
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  const { onboardingStep, completeOnboarding } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="BasicData" component={BasicDataScreen} />
      <Stack.Screen name="ChangeStage" component={ChangeStageScreen} />
      <Stack.Screen name="LifeContext" component={LifeContextScreen} />
      <Stack.Screen name="ProfileAssignment" component={ProfileAssignmentScreen} />
      <Stack.Screen name="EmergencyConfig" component={EmergencyConfigScreen} />
      <Stack.Screen name="PrivacyConfig" component={PrivacyConfigScreen} />
      <Stack.Screen name="SpecificOnboarding" component={SpecificOnboardingScreen} />
      <Stack.Screen name="Completion" component={CompletionScreen} />
      <Stack.Screen name="FamilyOnboarding" component={FamilyOnboardingScreen} />
    </Stack.Navigator>
  );
}
```

#### Pantalla 1: Bienvenida y Consentimiento

**Ruta:** `src/screens/onboarding/WelcomeScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { useAuth } from '../../hooks/useAuth';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function WelcomeScreen({ navigation }: Props) {
  const [accepted, setAccepted] = useState(false);
  const { signIn } = useAuth();

  const handleStart = () => {
    if (accepted) {
      navigation.navigate('RoleSelection');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>🌿</Text>
        <Text style={styles.title}>Bienvenido a KogniRecovery</Text>
      </View>

      <View style={styles.description}>
        <Text style={styles.text}>
          Te acompañamos en tu proceso, con respeto y sin juicios.
        </Text>
        <Text style={styles.text}>
          Importante: no sustituimos terapia profesional. 
          En emergencia, contacta a tu médico o línea de crisis.
        </Text>
      </View>

      <View style={styles.consent}>
        <Checkbox
          label="Acepto términos de servicio y política de privacidad"
          checked={accepted}
          onChange={setAccepted}
        />
      </View>

      <Button
        title="Comenzar"
        onPress={handleStart}
        disabled={!accepted}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    marginBottom: 32,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 12,
  },
  consent: {
    marginBottom: 32,
  },
  button: {
    marginTop: 16,
  },
});
```

#### Pantalla 2: Selección de Rol

**Ruta:** `src/screens/onboarding/RoleSelectionScreen.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function RoleSelectionScreen({ navigation }: Props) {
  const { updateOnboardingData } = useAuth();

  const handleRoleSelect = (role: 'patient' | 'family') => {
    updateOnboardingData({ role });
    
    if (role === 'family') {
      navigation.navigate('FamilyOnboarding');
    } else {
      navigation.navigate('BasicData');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Quién eres?</Text>

      <TouchableOpacity
        style={styles.option}
        onPress={() => handleRoleSelect('patient')}
      >
        <Text style={styles.optionEmoji}>🧑</Text>
        <Text style={styles.optionTitle}>Estoy evaluando mi consumo</Text>
        <Text style={styles.optionDescription}>
          Quiero entender mejor mi relación con las sustancias
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={() => handleRoleSelect('family')}
      >
        <Text style={styles.optionEmoji}>👨‍👩‍👧</Text>
        <Text style={styles.optionTitle}>Soy familiar/cuidador</Text>
        <Text style={styles.optionDescription}>
          Quiero acompañar a alguien en su proceso
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  option: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  optionEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
});
```

(Las pantallas 3-10 siguen el mismo patrón según FLUJOS_ONBOARDING.md)

---

### Check-in Diario

#### Hook de Check-in

**Ruta:** `src/hooks/useCheckIn.ts`

```typescript
import { useState, useCallback } from 'react';
import { api } from '../services/api';

export interface CheckInData {
  mood_score: number;
  mood_tags: string[];
  mood_notes?: string;
  substances?: SubstanceConsumption[];
  has_craving?: boolean;
  craving_intensity?: number;
  craving_substance?: string;
  craving_trigger?: string;
  activities?: Activity[];
}

export interface SubstanceConsumption {
  substance: string;
  amount: string;
  unit: string;
  time?: string;
}

export interface Activity {
  activity: string;
  duration: number;
  notes?: string;
}

export function useCheckIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayCheckIn, setTodayCheckIn] = useState<CheckInData | null>(null);

  const submitCheckIn = useCallback(async (data: CheckInData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/checkin', data);
      setTodayCheckIn(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error al enviar check-in');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTodayCheckIn = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/checkin/today');
      setTodayCheckIn(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching today check-in:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getWeeklyStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/checkin/weekly-stats');
      return response.data;
    } catch (err) {
      console.error('Error fetching weekly stats:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    todayCheckIn,
    submitCheckIn,
    getTodayCheckIn,
    getWeeklyStats,
  };
}
```

#### Pantalla de Check-in

**Ruta:** `src/screens/checkin/CheckInScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Button } from '../../components/Button';
import { MoodSlider } from '../../components/CheckIn/MoodSlider';
import { SubstanceSelector } from '../../components/CheckIn/SubstanceSelector';
import { CravingForm } from '../../components/CheckIn/CravingForm';
import { ActivitySelector } from '../../components/CheckIn/ActivitySelector';
import { useCheckIn } from '../../hooks/useCheckIn';

const MOOD_TAGS = [
  'Feliz', 'Triste', 'Ansioso', 'Estresado', 'Calmado',
  'Enojado', 'Solo', 'Esperanzado', 'Cansado', 'Con energía',
];

export default function CheckInScreen() {
  const [step, setStep] = useState(1);
  const [moodScore, setMoodScore] = useState(5);
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [hasCraving, setHasCraving] = useState(false);
  const [cravingData, setCravingData] = useState<any>(null);
  const [substances, setSubstances] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  const { submitCheckIn, loading, todayCheckIn } = useCheckIn();

  useEffect(() => {
    // Cargar check-in de hoy si existe
  }, []);

  const handleSubmit = async () => {
    try {
      const data = {
        mood_score: moodScore,
        mood_tags: moodTags,
        has_craving: hasCraving,
        ...(hasCraving && cravingData),
        substances,
        activities,
      };

      await submitCheckIn(data);
      
      Alert.alert(
        '✅ Check-in completado',
        '¡Bien hecho! Tu información ha sido guardada.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el check-in. Intenta de nuevo.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.progress}>
        <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 4 && styles.progressStepActive]} />
      </View>

      {step === 1 && (
        <View style={styles.section}>
          <Text style={styles.title}>¿Cómo te sientes hoy?</Text>
          <MoodSlider value={moodScore} onChange={setMoodScore} />
          
          <Text style={styles.subtitle}>¿Qué tags describen tu estado?</Text>
          <View style={styles.tags}>
            {MOOD_TAGS.map(tag => (
              <Button
                key={tag}
                title={tag}
                variant={moodTags.includes(tag) ? 'primary' : 'outline'}
                onPress={() => {
                  setMoodTags(prev =>
                    prev.includes(tag)
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  );
                }}
                style={styles.tagButton}
              />
            ))}
          </View>
          
          <Button
            title="Siguiente"
            onPress={() => setStep(2)}
            style={styles.nextButton}
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.section}>
          <Text style={styles.title}>¿Consumiste algo hoy?</Text>
          <SubstanceSelector
            substances={substances}
            onChange={setSubstances}
          />
          
          <Button
            title="Siguiente"
            onPress={() => setStep(3)}
            style={styles.nextButton}
          />
        </View>
      )}

      {step === 3 && (
        <View style={styles.section}>
          <Text style={styles.title}>¿Tuviste ganas de consumir?</Text>
          <CravingForm
            hasCraving={hasCraving}
            onChange={setHasCraving}
            cravingData={cravingData}
            onCravingDataChange={setCravingData}
          />
          
          <Button
            title="Siguiente"
            onPress={() => setStep(4)}
            style={styles.nextButton}
          />
        </View>
      )}

      {step === 4 && (
        <View style={styles.section}>
          <Text style={styles.title}>¿Qué actividades realizaste?</Text>
          <ActivitySelector
            activities={activities}
            onChange={setActivities}
          />
          
          <Button
            title="Finalizar Check-in"
            onPress={handleSubmit}
            loading={loading}
            style={styles.nextButton}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progress: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#4CAF50',
  },
  section: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 24,
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    marginBottom: 8,
  },
  nextButton: {
    marginTop: 32,
  },
});
```

---

### Chatbot NADA

#### Hook del Chatbot

**Ruta:** `src/hooks/useChatbot.ts`

```typescript
import { useState, useCallback } from 'react';
import { api } from '../services/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  started_at: string;
  last_message_at: string;
}

export function useChatbot() {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('low');

  const startConversation = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.post('/chatbot/conversations');
      setConversation(response.data);
      setMessages([]);
      return response.data;
    } catch (err) {
      console.error('Error starting conversation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    setSending(true);
    
    // Agregar mensaje del usuario inmediatamente
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await api.post('/chatbot/message', {
        conversation_id: conversation?.id,
        message: content,
      });

      const assistantMessage: Message = {
        id: response.data.message_id,
        role: 'assistant',
        content: response.data.content,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Actualizar nivel de riesgo
      if (response.data.risk_level) {
        setRiskLevel(response.data.risk_level);
      }

      return response.data;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [conversation]);

  const triggerEmergency = useCallback(async () => {
    try {
      const response = await api.post('/chatbot/emergency/trigger');
      return response.data;
    } catch (err) {
      console.error('Error triggering emergency:', err);
      throw err;
    }
  }, []);

  const getEmergencyProtocol = useCallback(async () => {
    try {
      const response = await api.get('/chatbot/emergency/protocol');
      return response.data;
    } catch (err) {
      console.error('Error getting emergency protocol:', err);
      throw err;
    }
  }, []);

  return {
    loading,
    sending,
    messages,
    conversation,
    riskLevel,
    startConversation,
    sendMessage,
    triggerEmergency,
    getEmergencyProtocol,
  };
}
```

#### Pantalla del Chatbot

**Ruta:** `src/screens/chatbot/ChatbotScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useChatbot } from '../../hooks/useChatbot';
import { ChatMessage } from '../../components/Chatbot/ChatMessage';
import { EmergencyModal } from '../../components/Chatbot/EmergencyModal';

export default function ChatbotScreen() {
  const [inputText, setInputText] = useState('');
  const [showEmergency, setShowEmergency] = useState(false);
  
  const {
    messages,
    loading,
    sending,
    riskLevel,
    startConversation,
    sendMessage,
    triggerEmergency,
  } = useChatbot();

  useEffect(() => {
    startConversation();
  }, []);

  useEffect(() => {
    // Mostrar modal de emergencia si el riesgo es crítico
    if (riskLevel === 'critical') {
      setShowEmergency(true);
    }
  }, [riskLevel]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    
    const text = inputText;
    setInputText('');
    
    try {
      await sendMessage(text);
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <ChatMessage
      role={item.role}
      content={item.content}
      timestamp={item.created_at}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Coach NADA</Text>
        <TouchableOpacity
          onPress={() => setShowEmergency(true)}
          style={styles.emergencyButton}
        >
          <Text style={styles.emergencyButtonText}>🆘</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => {}}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu mensaje..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>

      {showEmergency && (
        <EmergencyModal
          visible={showEmergency}
          onClose={() => setShowEmergency(false)}
          onTriggerEmergency={triggerEmergency}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyButton: {
    padding: 8,
  },
  emergencyButtonText: {
    fontSize: 24,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    backgroundColor: '#4CAF50',
    borderRadius: 22,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#fff',
  },
});
```

---

### Dashboard Paciente

**Ruta:** `src/screens/dashboard/PatientDashboardScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useDashboard } from '../../hooks/useDashboard';
import { MoodWidget } from '../../components/Dashboard/MoodWidget';
import { ConsumptionWidget } from '../../components/Dashboard/ConsumptionWidget';
import { CravingWidget } from '../../components/Dashboard/CravingWidget';
import { QuickActions } from '../../components/Dashboard/QuickActions';
import { ProgressCard } from '../../components/Dashboard/ProgressCard';

export default function PatientDashboardScreen() {
  const { user } = useAuth();
  const { dashboardData, loading, refresh } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hola, {user?.name || 'Usuario'} 👋
        </Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('es-CL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>

      {/* Widget de Estado Emocional */}
      <MoodWidget
        moodScore={dashboardData?.todayMood?.score}
        moodTags={dashboardData?.todayMood?.tags}
        onPress={() => {}}
      />

      {/* Widget de Consumo */}
      <ConsumptionWidget
        todayConsumption={dashboardData?.todayConsumption}
        weeklyProgress={dashboardData?.weeklyProgress}
        onPress={() => {}}
      />

      {/* Widget de Cravings */}
      <CravingWidget
        hasCraving={dashboardData?.todayCraving?.hasCraving}
        intensity={dashboardData?.todayCraving?.intensity}
        lastCraving={dashboardData?.lastCraving}
        onPress={() => {}}
      />

      {/* Progreso Semanal */}
      {dashboardData?.weeklyStats && (
        <ProgressCard
          streak={dashboardData.weeklyStats.streak}
          avgMood={dashboardData.weeklyStats.avgMood}
          daysCompleted={dashboardData.weeklyStats.daysCompleted}
        />
      )}

      {/* Acciones Rápidas */}
      <QuickActions
        onChatPress={() => {}}
        onCheckInPress={() => {}}
        onEmergencyPress={() => {}}
        onSettingsPress={() => {}}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
});
```

---

### Dashboard Familiar

**Ruta:** `src/screens/dashboard/FamilyDashboardScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFamilyDashboard } from '../../hooks/useFamilyDashboard';

const SUPPORT_MESSAGES = [
  { key: 'te_quiero', text: 'Te quiero', emoji: '🤗' },
  { key: 'fuerza', text: 'Fuerza', emoji: '💪' },
  { key: 'cafe', text: '¿Tomamos un café?', emoji: '☕' },
  { key: 'todo_bien', text: '¿Todo bien?', emoji: '📞' },
];

export default function FamilyDashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const {
    loading,
    patientData,
    messages,
    sendSupportMessage,
    refresh,
  } = useFamilyDashboard();

  useEffect(() => {
    refresh();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleSendSupport = async (messageKey: string) => {
    try {
      await sendSupportMessage(messageKey);
    } catch (error) {
      console.error('Error sending support message:', error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          ¿Cómo está {patientData?.name || 'tu familiar'}?
        </Text>
        <Text style={styles.subtitle}>
          Solo ve la información que autorizó compartir
        </Text>
      </View>

      {/* Estado Emocional */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estado emocional</Text>
        <View style={styles.moodDisplay}>
          <Text style={styles.moodEmoji}>
            {patientData?.mood?.score >= 7 ? '😊' : patientData?.mood?.score >= 4 ? '😐' : '😟'}
          </Text>
          <Text style={styles.moodScore}>
            {patientData?.mood?.score || '?'}/10
          </Text>
        </View>
      </View>

      {/* Progreso */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Progreso reciente</Text>
        {patientData?.achievements?.map((achievement: any, index: number) => (
          <View key={index} style={styles.achievement}>
            <Text style={styles.achievementEmoji}>✅</Text>
            <Text style={styles.achievementText}>{achievement}</Text>
          </View>
        ))}
        {(!patientData?.achievements || patientData.achievements.length === 0) && (
          <Text style={styles.noData}>No hay logros compartidos aún</Text>
        )}
      </View>

      {/* Enviar Apoyo */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Enviar apoyo</Text>
        <View style={styles.supportButtons}>
          {SUPPORT_MESSAGES.map(msg => (
            <TouchableOpacity
              key={msg.key}
              style={styles.supportButton}
              onPress={() => handleSendSupport(msg.key)}
            >
              <Text style={styles.supportEmoji}>{msg.emoji}</Text>
              <Text style={styles.supportText}>{msg.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Educación */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aprende a apoyar</Text>
        <TouchableOpacity style={styles.educationItem}>
          <Text style={styles.educationTitle}>
            Comunicación no violenta
          </Text>
          <Text style={styles.educationArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.educationItem}>
          <Text style={styles.educationTitle}>
            Límites saludables
          </Text>
          <Text style={styles.educationArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Emergencia */}
      <TouchableOpacity style={styles.emergencyButton}>
        <Text style={styles.emergencyButtonText}>
          🆘 En caso de emergencia
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  moodScore: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  achievementText: {
    fontSize: 14,
  },
  noData: {
    color: '#999',
    fontStyle: 'italic',
  },
  supportButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  supportButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
  },
  supportEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  supportText: {
    fontSize: 12,
    textAlign: 'center',
  },
  educationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  educationTitle: {
    fontSize: 14,
  },
  educationArrow: {
    fontSize: 24,
    color: '#999',
  },
  emergencyButton: {
    backgroundColor: '#ffebee',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#c62828',
    fontWeight: '600',
    fontSize: 16,
  },
});
```

---

### Configuración de Emergencia y Privacidad

**Ruta:** `src/screens/settings/EmergencySettingsScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { useEmergencySettings } from '../../hooks/useEmergencySettings';

export default function EmergencySettingsScreen() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>({});
  const [crisisLines, setCrisisLines] = useState<any[]>([]);
  
  const {
    loading,
    loadSettings,
    saveContact,
    deleteContact,
    savePreferences,
  } = useEmergencySettings();

  useEffect(() => {
    loadSettings().then(data => {
      setContacts(data.contacts || []);
      setPreferences(data.preferences || {});
      setCrisisLines(data.crisisLines || []);
    });
  }, []);

  const handleAddContact = async () => {
    // Mostrar formulario para agregar contacto
    Alert.prompt(
      'Nuevo contacto de emergencia',
      'Ingresa el nombre del contacto',
      async (name) => {
        if (name) {
          await saveContact({
            name,
            phone: '',
            relationship: 'other',
            is_primary: contacts.length === 0,
          });
          loadSettings().then(data => setContacts(data.contacts || []));
        }
      }
    );
  };

  const handleSavePreferences = async () => {
    try {
      await savePreferences(preferences);
      Alert.alert('✅ Guardado', 'Configuración de emergencia guardada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contactos de emergencia</Text>
        <Text style={styles.sectionDescription}>
          ¿A quién debemos contactar si detectamos que estás en riesgo?
        </Text>

        {contacts.map((contact, index) => (
          <View key={contact.id || index} style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactRelation}>{contact.relationship}</Text>
              {contact.phone && <Text style={styles.contactPhone}>{contact.phone}</Text>}
            </View>
            <TouchableOpacity
              onPress={() => deleteContact(contact.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Button
          title="+ Agregar contacto"
          variant="outline"
          onPress={handleAddContact}
          style={styles.addButton}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Línea de crisis preferida</Text>
        
        <Select
          label="Selecciona tu línea de emergencia"
          value={preferences.crisis_line}
          options={crisisLines.map(line => ({
            label: `${line.name} (${line.phone})`,
            value: line.id,
          }))}
          onChange={(value) => setPreferences({ ...preferences, crisis_line: value })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        
        <View style={styles.checkboxItem}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setPreferences({
              ...preferences,
              notify_on_critical: !preferences.notify_on_critical,
            })}
          >
            <Text style={preferences.notify_on_critical ? '☑️' : '⬜'} />
            <Text style={styles.checkboxLabel}>
              Notificar en riesgo crítico (suicidio, sobredosis)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.checkboxItem}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setPreferences({
              ...preferences,
              notify_on_high: !preferences.notify_on_high,
            })}
          >
            <Text style={preferences.notify_on_high ? '☑️' : '⬜'} />
            <Text style={styles.checkboxLabel}>
              Notificar en riesgo alto (ideación suicida)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.checkboxItem}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setPreferences({
              ...preferences,
              share_location_emergency: !preferences.share_location_emergency,
            })}
          >
            <Text style={preferences.share_location_emergency ? '☑️' : '⬜'} />
            <Text style={styles.checkboxLabel}>
              Compartir ubicación aproximada en emergencia
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Button
        title="Guardar configuración"
        onPress={handleSavePreferences}
        loading={loading}
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactRelation: {
    fontSize: 14,
    color: '#666',
  },
  contactPhone: {
    fontSize: 14,
    color: '#4CAF50',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  addButton: {
    marginTop: 8,
  },
  checkboxItem: {
    marginBottom: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 14,
    flex: 1,
  },
  saveButton: {
    margin: 16,
  },
});
```

---

## ✅ Checklist de Verificación

### Backend
- [ ] Schema SQL de perfiles creado y migrado
- [ ] Schema SQL de check-ins creado y migrado
- [ ] Schema SQL de emergency contacts creado y migrado
- [ ] Schema SQL de sharing creado y migrado
- [ ] Neo4j configurado y funcionando
- [ ] Conexión a Neo4j verificada
- [ ] Modelos de perfil implementados
- [ ] Modelos de check-in implementados
- [ ] Controladores de API funcionando
- [ ] Rutas de API registradas
- [ ] Servicio LLM configurado
- [ ] Servicio RAG configurado
- [ ] Servicio Neo4j configurado

### Frontend
- [ ] Navegación de onboarding implementada
- [ ] 10 pantallas de onboarding creadas
- [ ] Pantalla de check-in completa
- [ ] Formularios de mood, sustancias, cravings, actividades
- [ ] Hook de check-in funcionando
- [ ] Pantalla de chatbot NADA
- [ ] Sistema de mensajes del chatbot
- [ ] Modal de emergencia
- [ ] Hook del chatbot funcionando
- [ ] Dashboard del paciente con widgets
- [ ] Dashboard del familiar completo
- [ ] Pantalla de configuración de emergencia
- [ ] Pantalla de configuración de privacidad

### Integración
- [ ] Frontend conectado al backend
- [ ] Check-in guardando en base de datos
- [ ] Chatbot respondiendo correctamente
- [ ] Neo4j consultando datos
- [ ] RAG retornando conocimiento relevante

### Testing
- [ ] Pruebas unitarias de modelos
- [ ] Pruebas de integración de API
- [ ] Pruebas de UI de onboarding
- [ ] Pruebas de UI de check-in
- [ ] Pruebas de UI de chatbot
- [ ] Pruebas de dashboards
- [ ] Verificación de flujos completos

---

## 🔧 Troubleshooting

### Problemas Comunes

**1. Error de conexión a Neo4j**
```bash
# Verificar que Neo4j esté corriendo
docker ps | grep neo4j

# Ver logs
docker logs neo4j

# Reiniciar Neo4j
docker-compose restart neo4j
```

**2. Error de API al crear check-in**
```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Verificar tablas
psql -h localhost -U postgres -d kognirecovery_dev -c "\dt"
```

**3. Error de LLM**
```bash
# Verificar API key de OpenAI
echo $OPENAI_API_KEY

# Probar conexión
curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"
```

**4. Frontend no conecta al backend**
```bash
# Verificar que backend esté corriendo
curl http://localhost:3000/health

# Verificar CORS en backend
```

**5. Errores de tipos en TypeScript**
```bash
# Reiniciar servidor de types
npx tsc --noEmit

# Limpiar cache
rm -rf node_modules/.cache
```

---

## 📋 Especificaciones Técnicas Adicionales

### Variables de entorno necesarias

```env
# Backend (.env.local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kognirecovery_dev
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
JWT_SECRET=your-secret-key

# Frontend (.env.local)
API_URL=http://localhost:3000
```

### Puertos utilizados

| Servicio | Puerto |
|----------|--------|
| Frontend Expo | 19006 |
| Backend API | 3000 |
| PostgreSQL | 5432 |
| Neo4j | 7687 (bolt), 7474 (http) |

### Comandos útiles

```bash
# Iniciar todo el entorno
docker-compose up -d

# Ver logs del backend
docker-compose logs -f server

# Migrar base de datos
cd server && npm run migrate

# Ver datos en Neo4j
docker exec -it neo4j cypher-shell -u neo4j -p password "MATCH (n) RETURN n LIMIT 10"
```

---

*Documento creado para el Sprint 2 de KogniRecovery. Basado en documentación de formulación existente y guía del Sprint 1.*
