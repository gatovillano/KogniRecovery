# 🔒 Informe de Auditoría de Seguridad y Privacidad — KogniRecovery

> **Fecha:** 15 de julio de 2025
> **Alcance:** Full-stack (Backend Express/TypeScript, Frontend React Native/Expo, Docker, PostgreSQL, Neo4j)
> **Clasificación:** App de salud mental / recuperación de adicciones (datos sensibles protegidos por GDPR/HIPAA)
> **Auditores:** KogniTerm (Deep Coder + Deep Researcher en paralelo)

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Matriz de Riesgos Unificada](#2-matriz-de-riesgos-unificada)
3. [Análisis Técnico de Seguridad](#3-análisis-técnico-de-seguridad)
4. [Análisis de Privacidad y Cumplimiento Normativo](#4-análisis-de-privacidad-y-cumplimiento-normativo)
5. [Fortalezas Actuales del Proyecto](#5-fortalezas-actuales-del-proyecto)
6. [Hoja de Ruta por Fases](#6-hoja-de-ruta-por-fases)
7. [Apéndice: Regulaciones Aplicables](#7-apéndice-regulaciones-aplicables)

---

## 1. Resumen Ejecutivo

KogniRecovery es una aplicación de salud mental y recuperación de adicciones que maneja **datos altamente sensibles**: estado emocional diario, registros de consumo de sustancias, historial de recaídas, desencadenantes de craving, conversaciones con IA terapéutica, notas personales íntimas, contactos de emergencia y datos de compartición familiar.

### Hallazgos Principales

| Métrica | Valor |
|---------|-------|
| **Total de vulnerabilidades** | 38 |
| **🔴 Críticas** | 8 |
| **🟠 Altas** | 16 |
| **🟡 Medias** | 14 |
| **Categorías afectadas** | 12 |

### Conclusión General

El proyecto tiene una **base sólida de seguridad** (JWT con refresh tokens, bcrypt(12), encriptación AES-256-GCM, rate limiting configurado, RBAC, gestión de consentimiento). Sin embargo, presenta **deficiencias críticas** que impiden un despliegue seguro en producción:

1. **Secretos de producción en código** (docker-compose.yml)
2. **Datos de salud en texto plano** en PostgreSQL y Neo4j
3. **Envío de datos de salud a LLMs externos** sin acuerdos de confidencialidad
4. **Eliminación de datos incompleta** (viola GDPR Art. 17)
5. **Middlewares de seguridad configurados pero no aplicados**

> ⚠️ **RECOMENDACIÓN:** No desplegar en producción hasta completar la **Fase 1** de la hoja de ruta.

---

## 2. Matriz de Riesgos Unificada

| # | ID | Categoría | Severidad | Descripción Breve | Componente |
|---|---|---|---|---|---|
| 1 | SEC-001 | Secretos | 🔴 CRÍTICO | Credenciales hardcodeadas en docker-compose.yml (DB, JWT, encriptación, pgAdmin) | Infraestructura |
| 2 | SEC-002 | Encriptación | 🔴 CRÍTICO | Salt estático (`kognirecovery-salt`) en derivación de clave PBKDF2 | Backend |
| 3 | SEC-003 | Datos sensibles | 🔴 CRÍTICO | Datos de salud (checkins, cravings, journal, notas) almacenados en texto plano | Backend |
| 4 | PRIV-001 | LLM | 🔴 CRÍTICO | Mensajes del chatbot enviados a OpenAI/OpenRouter sin BAA ni anonimización | Backend/Servicios |
| 5 | PRIV-002 | Eliminación | 🔴 CRÍTICO | `executeDataDeletion()` no elimina conversaciones, Neo4j, embeddings, notas | Backend |
| 6 | PRIV-003 | Compartición | 🔴 CRÍTICO | Dashboard familiar expone datos de salud sin verificar permisos granulares | Backend/Frontend |
| 7 | PRIV-004 | Terceros | 🔴 CRÍTICO | TTS, Tavily Search, Neo4j reciben datos de salud sin DPA | Servicios |
| 8 | SEC-004 | XSS | 🔴 CRÍTICO | Mensajes de chat y campos de texto libre sin sanitización XSS | Backend/Frontend |
| 9 | SEC-005 | Auth | 🟠 ALTO | Refresh tokens almacenados en texto plano en PostgreSQL | Backend |
| 10 | SEC-006 | Auth | 🟠 ALTO | Sin detección de reutilización de refresh tokens (posible token theft) | Backend |
| 11 | SEC-007 | CORS | 🟠 ALTO | `CORS_ORIGIN=*` en docker-compose permite cualquier origen | Infraestructura |
| 12 | SEC-008 | DB | 🟠 ALTO | SSL con `rejectUnauthorized: false` permite MitM | Backend |
| 13 | SEC-009 | DB | 🟠 ALTO | Bases de datos expuestas al host (5437, 7475, 7688, 6380, 5050) | Infraestructura |
| 14 | SEC-010 | HTTP | 🟠 ALTO | `securityMiddleware` definido pero NUNCA aplicado en app.ts | Backend |
| 15 | SEC-011 | HTTP | 🟠 ALTO | Rate limiting configurado pero NUNCA aplicado | Backend |
| 16 | SEC-012 | Validación | 🟠 ALTO | Campos de texto libre sin validación (checkins, cravings, journal, notas) | Backend |
| 17 | SEC-013 | API | 🟠 ALTO | IDOR potencial: algunos endpoints no verifican ownership del recurso | Backend |
| 18 | SEC-014 | Frontend | 🟠 ALTO | Logging de credenciales (email + password) en consola del dispositivo | Frontend |
| 19 | SEC-015 | Encriptación | 🟠 ALTO | Función `encryptUserSensitiveData` definida pero nunca utilizada | Backend |
| 20 | PRIV-005 | Neo4j | 🟠 ALTO | Datos de salud en grafo persisten indefinidamente sin borrado | Backend |
| 21 | PRIV-006 | Brechas | 🟠 ALTO | Sin procedimiento de notificación de brechas en 72h (GDPR) | Organizacional |
| 22 | PRIV-007 | Notificaciones | 🟠 ALTO | Tabla `user_push_tokens` referenciada pero no existe en migraciones | Backend |
| 23 | SEC-016 | Auth | 🟡 MEDIO | JWT_EXPIRES_IN con fallback de 7 días si no se configura | Backend |
| 24 | SEC-017 | Auth | 🟡 MEDIO | Campo `two_factor_enabled` existe pero sin implementación TOTP | Backend/Frontend |
| 25 | SEC-018 | DB | 🟡 MEDIO | Inconsistencia de schema: `password` vs `password_hash` | Backend |
| 26 | PRIV-008 | Retención | 🟡 MEDIO | Políticas de retención definidas pero sin jobs automatizados | Backend |
| 27 | PRIV-009 | Logging | 🟡 MEDIO | `console.error` puede loguear datos sensibles en producción | Backend/Frontend |
| 28 | PRIV-010 | DPIA | 🟡 MEDIO | Sin Data Protection Impact Assessment (requerido GDPR datos salud) | Organizacional |
| 29 | PRIV-011 | Sesiones | 🟡 MEDIO | Sin auto-logout por inactividad | Frontend |
| 30 | SEC-019 | API | 🟡 MEDIO | Endpoint de políticas de retención accesible sin autenticación | Backend |
| 31 | SEC-020 | Frontend | 🟡 MEDIO | Tokens en memoria con AsyncStorage comentado (inconsistencia) | Frontend |
| 32 | PRIV-012 | Legal | 🟡 MEDIO | Sin política de privacidad formal (documento legal) | Organizacional |
| 33 | SEC-021 | API | 🟡 MEDIO | `llm_api_key` del usuario almacenada sin encriptar ni validar | Backend |
| 34 | SEC-022 | Schema | 🟡 MEDIO | Migraciones SQL sin verificación de integridad referencial | Backend |
| 35 | PRIV-013 | Certificación | 🟡 MEDIO | Sin certificaciones de seguridad (ISO 27001, SOC 2, HITRUST) | Organizacional |
| 36 | SEC-023 | Docker | 🟡 MEDIO | pgAdmin con credenciales admin/admin expuesto en puerto 5050 | Infraestructura |
| 37 | PRIV-014 | Consentimiento | 🟡 MEDIO | Consentimiento versionado pero sin mecanismo de re-consentimiento | Backend |
| 38 | SEC-024 | Frontend | 🟡 MEDIO | Sin certificate pinning para comunicaciones API | Frontend |

---

## 3. Análisis Técnico de Seguridad

### 3.1 Manejo de Credenciales y Secretos

#### SEC-001: Secretos Hardcodeados 🔴 CRÍTICO

**Archivos afectados:** `docker-compose.yml` (líneas 12, 54, 93-95, 148)

```yaml
# PROBLEMA: Todas las credenciales son visibles en el repositorio
POSTGRES_PASSWORD: postgres                    # Línea 12
NEO4J_AUTH: neo4j/password                     # Línea 54
JWT_SECRET: dev_jwt_secret_key_min_32_chars... # Línea 93
ENCRYPTION_KEY: dev_encryption_key_32_chars... # Línea 95
PGADMIN_DEFAULT_PASSWORD: admin                # Línea 148
```

**Impacto:** Acceso total a bases de datos, forge de tokens JWT, desencriptación de datos.

**Remediación:**
```yaml
services:
  api:
    env_file:
      - path: ./server/.env
        required: true
    # Generar secretos con: openssl rand -hex 32
  postgres:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
secrets:
  db_password:
    file: ./secrets/db_password.txt
```

#### SEC-002: Salt Estático en PBKDF2 🔴 CRÍTICO

**Archivo:** `server/src/utils/encryption.ts` línea 18

```typescript
// VULNERABLE: Mismo salt para TODAS las instalaciones
return crypto.pbkdf2Sync(key, 'kognirecovery-salt', 100000, 32, 'sha516');
```

**Remediación:** Salt aleatorio por instalación, almacenado como variable de entorno separada.

#### SEC-007: CORS Wildcard 🟠 ALTO

```yaml
# docker-compose.yml línea 99
- CORS_ORIGIN=*
```

Permite cualquier dominio realizar peticiones con credenciales → CSRF y robo de tokens.

---

### 3.2 Autenticación y Autorización

#### SEC-005: Refresh Tokens en Texto Plano 🟠 ALTO

**Archivo:** `server/src/models/refreshToken.model.ts`

Los refresh tokens se almacenan sin hash. Si la BD es comprometida, son inmediatamente utilizables.

**Remediación:**
```typescript
import bcrypt from 'bcryptjs';
const hashedToken = await bcrypt.hash(input.token, 10);
// Al verificar: await bcrypt.compare(presentedToken, storedHashedToken);
```

#### SEC-006: Sin Detección de Reutilización 🟠 ALTO

Si un refresh token es robado, no hay mecanismo para detectar que tanto el atacante como el usuario legítimo lo están usando. Implementar rotación con detección de reuse.

#### SEC-016: JWT Expiración Excesiva por Defecto 🟡 MEDIO

```typescript
// server/src/config/index.ts línea 91
expiresIn: getOptionalNumber('JWT_EXPIRES_IN', 604800), // 7 días como default
```

Si `JWT_EXPIRES_IN` no se define, el access token dura 7 días en lugar de 15 minutos.

#### SEC-017: 2FA Sin Implementar 🟡 MEDIO

El campo `two_factor_enabled` existe en el modelo `user` pero no hay implementación TOTP. Prioridad para roles `professional` y `admin`.

---

### 3.3 Encriptación de Datos Sensibles

#### SEC-003: Datos de Salud en Texto Plano 🔴 CRÍTICO

**Modelos afectados:**
| Modelo | Campos Sensibles Expuestos |
|--------|--------------------------|
| `checkins` | mood, anxiety, energy, notes, risk_description, emotional_tags |
| `cravings` | triggers, coping_strategies, consequences, notes |
| `journal` | content, trigger_situation, people_description, lesson_learned |
| `agent_notes` | title, content |
| `messages` | content (conversaciones con IA) |
| `profiles` | primary_substance, substance_years_use, has_relapse_history, bio |
| `conversations` | context_data |

**Marco legal:** GDPR Art. 9 y HIPAA requieren encriptación de datos de salud en reposo.

**Remediación prioritaria:**
```typescript
// Campos que DEBEN encriptarse (orden de prioridad):
// 1. messages.content (conversaciones con IA)
// 2. journal.content (notas personales íntimas)
// 3. checkins.notes, risk_description
// 4. cravings.notes, consequences
// 5. agent_notes.content
// 6. profiles.bio, primary_substance
```

#### SEC-015: encryptUserSensitiveData No Utilizada 🟠 ALTO

Función definida en `server/src/utils/encryption.ts` pero nunca importada ni llamada.

---

### 3.4 Validación y Sanitización

#### SEC-012: Campos de Texto Libre sin Validación 🟠 ALTO

Endpoints sin validación de entrada:
- `POST /api/v1/checkins` — notes, risk_description sin límites
- `POST /api/v1/cravings` — notes, consequences sin límites
- `POST /api/v1/journal/*` — contenido libre sin sanitización
- `POST /api/v1/notes` — content sin límites
- `POST /api/v1/family/patients/:patientId/message` — solo valida existencia

#### SEC-004: XSS en Mensajes de Chat 🔴 CRÍTICO

Los mensajes del chatbot se almacenan y renderizan sin sanitización. Un payload inyectado podría ejecutarse en el dispositivo del usuario o del profesional.

---

### 3.5 Configuración de Seguridad HTTP

#### SEC-010: Security Middleware No Aplicado 🟠 ALTO

```typescript
// server/src/app.ts — securityMiddleware NUNCA se importa
// server/src/middleware/security.ts — definido pero huérfano
```

Sin Helmet, sin HSTS, sin X-Content-Type-Options, sin CSP efectiva.

#### SEC-011: Rate Limiting No Aplicado 🟠 ALTO

Configuración existente en `server/src/config/index.ts` pero nunca se monta en Express.

#### SEC-008: SSL Mal Configurado 🟠 ALTO

```typescript
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
```

`rejectUnauthorized: false` permite ataques Man-in-the-Middle.

---

### 3.6 Base de Datos

#### SEC-009: Bases de Datos Expuestas 🟠 ALTO

| Servicio | Puerto Host | Puerto Contenedor | Riesgo |
|----------|-------------|-------------------|--------|
| PostgreSQL | 5437 | 5432 | Acceso directo a datos |
| Neo4j | 7475, 7688 | 7474, 7687 | Acceso al grafo |
| Redis | 6380 | 6379 | Acceso a caché/sesiones |
| pgAdmin | 5050 | 80 | Panel admin con admin/admin |

#### SEC-018: Inconsistencia de Schema 🟡 MEDIO

`init.sql` define `password_hash` pero los modelos usan `password`.

---

### 3.7 Frontend (React Native)

#### SEC-014: Logging de Credenciales 🟠 ALTO

```typescript
// src/services/api.ts líneas 437-441
console.log('✉️ Body:', JSON.stringify(userData)); // ← Loguea email + password
```

Accesible mediante `adb logcat` en Android.

#### SEC-020: Tokens en Memoria 🟡 MEDIO

Inconsistencia entre `api.ts` (variable global) y `authStore.ts` (SecureStore).

---

## 4. Análisis de Privacidad y Cumplimiento Normativo

### 4.1 Tipos de Datos Sensibles Identificados

KogniRecovery procesa las siguientes categorías de datos sensibles:

| Categoría | Ejemplos | Base Legal Requerida |
|-----------|----------|---------------------|
| **Datos de salud mental** | Mood, ansiedad, energía, emotional_tags | Consentimiento explícito |
| **Consumo de sustancias** | Sustancia, cantidad, frecuencia, gasto | Consentimiento explícito |
| **Historial de craving** | Triggers, consecuencias, estrategias | Consentimiento explícito |
| **Conversaciones terapéuticas** | Chat con IA, notas del agente | Secreto profesional |
| **Notas personales** | Journal entries, daily notes | Secreto profesional |
| **Datos de recaídas** | Historial, circunstancias | Consentimiento explícito |
| **Contactos de emergencia** | Nombre, teléfono, relación | Consentimiento |
| **Datos familiares** | Compartición con cuidadores | Consentimiento granular |
| **Datos de perfil** | Sustancia principal, años de uso | Consentimiento |
| **Datos técnicos** | Push tokens, device ID | Legítimo interés |

### 4.2 Flujo de Datos con Terceros

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuario   │────▶│  KogniRecovery│────▶│  OpenAI/     │
│   (App)     │     │  (Backend)    │     │  OpenRouter  │
└─────────────┘     └──────────────┘     └──────────────┘
                           │
                    ┌──────┼──────┐
                    ▼      ▼      ▼
               ┌────────┐┌─────┐┌──────┐
               │  TTS   ││Tavily││ Neo4j│
               │(Kokoro)││Search││Cloud │
               └────────┘└─────┘└──────┘
```

**Problema:** Ninguno de estos terceros tiene un Data Processing Agreement (DPA) firmado. Los datos de salud mental fluyen sin protección contractual.

### 4.3 Derecho al Olvido (GDPR Art. 17)

#### PRIV-002: Eliminación Incompleta 🔴 CRÍTICO

La función `executeDataDeletion()` en `server/src/services/privacy.service.ts` solo elimina:
- ✅ checkins, cravings, journal_entries
- ✅ phone number (nullificado)

**NO elimina:**
- ❌ conversations y messages (chatbot)
- ❌ agent_notes
- ❌ consumption_events y substance_doses
- ❌ mood_history
- ❌ wall_messages
- ❌ notifications
- ❌ refresh_tokens
- ❌ profile_settings y profiles
- ❌ privacy_consents y audit_log
- ❌ **Datos en Neo4j** (nodo Usuario completo)
- ❌ **Embeddings** en memoria vectorial
- ❌ **Logs de auditoría** del propio usuario

### 4.4 Compartición Familiar

#### PRIV-003: Sin Control Granular 🔴 CRÍTICO

Los permisos se almacenan en `sharing_invitations.permissions` (JSONB) pero **nunca se verifican** en las queries. Un familiar aceptado ve TODOS los datos del paciente.

**Escenario de riesgo:** Un paciente quiere compartir solo su estado de ánimo general pero no sus triggers de craving o notas del agente. Actualmente esto es imposible.

### 4.5 Chatbot e IA

#### PRIV-001: LLM Data Leakage 🔴 CRÍTICO

**Flujo actual:**
```
Mensaje usuario → PostgreSQL (texto plano) → LangGraph → OpenAI/OpenRouter (texto plano) → Respuesta → Neo4j (texto plano)
```

**Problemas:**
1. OpenAI/OpenRouter no son HIPAA-compliant por defecto
2. Los mensajes contienen diagnósticos implícitos, triggers, emociones
3. `HTTP-Referer: https://kognirecovery.com` revela patrones de uso
4. Sin anonimización previa al envío

### 4.6 Marco Regulatorio

#### Regulaciones Aplicables por Jurisdicción

| País | Ley | Estado | Nivel de Protección | Aplica |
|------|-----|--------|-------------------|--------|
| 🇨🇱 Chile | Ley 19.628 | Obsoleta (1999) | Bajo | ✅ Principal |
| 🇨🇱 Chile | Nueva Ley (en trámite) | En proceso | Alto | ⏳ Futuro |
| 🇦🇷 Argentina | Ley 25.326 | Vigente | Medio-Alto | ⚠️ Si hay usuarios |
| 🇧🇷 Brasil | LGPD (Lei 13.709) | Vigente (2020) | Alto | ⚠️ Si hay usuarios |
| 🇲🇽 México | LFPDPPP | Vigente | Medio | ⚠️ Si hay usuarios |
| 🇨🇴 Colombia | Ley 1581 | Vigente | Medio-Alto | ⚠️ Si hay usuarios |
| 🇺🇸 EE.UU. | HIPAA | Vigente | Muy Alto | ⚠️ Si hay usuarios |
| 🇪🇺 UE | GDPR | Vigente | Muy Alto | ⚠️ Si hay usuarios |

**Dato clave:** Los datos de salud mental son **categoría especial/protegida** en TODAS estas jurisdicciones.

---

## 5. Fortalezas Actuales del Proyecto

A pesar de las vulnerabilidades encontradas, el proyecto muestra buenas prácticas en varias áreas:

| Fortaleza | Detalle |
|-----------|---------|
| ✅ **Autenticación robusta** | JWT con refresh tokens, bcrypt(12), lockout por intentos fallidos |
| ✅ **Encriptación disponible** | AES-256-GCM implementada en `encryption.ts` (aunque no se usa) |
| ✅ **Rate limiting configurado** | General y específico para endpoints de auth |
| ✅ **Security headers definidos** | Helmet con CSP, HSTS, X-Frame-Options en middleware |
| ✅ **Consent management** | Tablas de consentimiento con versionado y audit log |
| ✅ **RBAC** | Roles diferenciados: patient, family, professional, admin |
| ✅ **Detección de crisis** | Keywords para suicidio/autolesión con respuestas localizadas por país |
| ✅ **Queries parametrizadas** | Prevención de SQL injection en PostgreSQL |
| ✅ **Dockerización** | Infraestructura containerizada y reproducible |
| ✅ **Migraciones SQL** | Schema versionado con scripts organizados |

---

## 6. Hoja de Ruta por Fases

### 📅 FASE 1: Crítico — ANTES de cualquier despliegue en producción
**Duración estimada:** 2-3 semanas | **Esfuerzo:** Alto

| # | Acción | Prioridad | Responsable | Estimación |
|---|--------|-----------|-------------|------------|
| 1.1 | **Eliminar secretos de docker-compose.yml** y migrar a `.env` no versionado + Docker Secrets | 🔴 | DevOps | 2 días |
| 1.2 | **Encriptar datos de salud** en reposo: implementar encriptación selectiva en modelos de checkins, cravings, journal, messages, agent_notes | 🔴 | Backend | 5 días |
| 1.3 | **Aplicar securityMiddleware** en `app.ts` y configurar rate limiting | 🔴 | Backend | 1 día |
| 1.4 | **Implementar borrado completo de datos** (PostgreSQL + Neo4j + embeddings) | 🔴 | Backend | 3 días |
| 1.5 | **Enforzar permisos granulares** en dashboard familiar | 🔴 | Backend + Frontend | 3 días |
| 1.6 | **Anonimizar datos antes de enviar a LLMs** externos | 🔴 | Backend | 3 días |
| 1.7 | **Eliminar salt estático** y generar salt aleatorio por instalación | 🔴 | Backend | 1 día |
| 1.8 | **Eliminar logging de credenciales** en frontend | 🔴 | Frontend | 0.5 días |
| 1.9 | **Restringir puertos de BD** a `127.0.0.1` o remover en producción | 🔴 | DevOps | 0.5 días |
| 1.10 | **Corregir SSL** con `rejectUnauthorized: true` y certificado CA | 🔴 | DevOps | 1 día |

**Criterio de salida Fase 1:** 0 vulnerabilidades CRÍTICAS pendientes. Pentest básico aprobado.

---

### 📅 FASE 2: Alto — Primer sprint post-lanzamiento
**Duración estimada:** 3-4 semanas | **Esfuerzo:** Alto

| # | Acción | Prioridad | Responsable | Estimación |
|---|--------|-----------|-------------|------------|
| 2.1 | **Hashear refresh tokens** antes de almacenar en BD | 🟠 | Backend | 1 día |
| 2.2 | **Implementar detección de reutilización** de refresh tokens | 🟠 | Backend | 2 días |
| 2.3 | **Agregar validación de inputs** con express-validator a todos los endpoints | 🟠 | Backend | 3 días |
| 2.4 | **Sanitización XSS** en mensajes de chat y campos de texto libre | 🟠 | Backend + Frontend | 2 días |
| 2.5 | **Verificar ownership** en todos los endpoints (prevención IDOR) | 🟠 | Backend | 2 días |
| 2.6 | **Crear tabla `user_push_tokens`** faltante | 🟠 | Backend | 1 día |
| 2.7 | **Crear política de privacidad formal** (documento legal completo) | 🟠 | Legal | 5 días |
| 2.8 | **Firmar DPAs con proveedores externos** (OpenAI, Tavily, TTS, Twilio) | 🟠 | Legal | 5 días |
| 2.9 | **Implementar procedimiento de breach notification** (72h GDPR) | 🟠 | Organizacional | 3 días |
| 2.10 | **Configurar CORS restrictivo** con dominios específicos | 🟠 | DevOps | 0.5 días |

**Criterio de salida Fase 2:** 0 vulnerabilidades ALTAS pendientes. Documento de privacidad publicado. DPAs firmados.

---

### 📅 FASE 3: Medio — Roadmap de madurez
**Duración estimada:** 4-6 semanas | **Esfuerzo:** Medio

| # | Acción | Prioridad | Responsable | Estimación |
|---|--------|-----------|-------------|------------|
| 3.1 | **Implementar 2FA TOTP** para roles professional y admin | 🟡 | Backend + Frontend | 4 días |
| 3.2 | **Automatizar políticas de retención** con cron jobs | 🟡 | Backend | 3 días |
| 3.3 | **Sanitizar logs de errores** (eliminar datos sensibles de console.error) | 🟡 | Backend + Frontend | 2 días |
| 3.4 | **Implementar session timeout** por inactividad | 🟡 | Frontend | 2 días |
| 3.5 | **Realizar DPIA** (Data Protection Impact Assessment) | 🟡 | Legal + Técnico | 5 días |
| 3.6 | **Resolver inconsistencia de schema** (password vs password_hash) | 🟡 | Backend | 1 día |
| 3.7 | **Encriptar llm_api_key** del usuario | 🟡 | Backend | 1 día |
| 3.8 | **Implementar certificate pinning** en frontend | 🟡 | Frontend | 3 días |
| 3.9 | **Mecanismo de re-consentimiento** cuando cambien políticas | 🟡 | Backend + Frontend | 3 días |
| 3.10 | **Auditoría de integridad referencial** en migraciones SQL | 🟡 | Backend | 2 días |

**Criterio de salida Fase 3:** DPIA completado. 2FA activo. Retención automatizada.

---

### 📅 FASE 4: Certificación y Mejora Continua
**Duración estimada:** 3-6 meses | **Esfuerzo:** Continuo

| # | Acción | Prioridad | Responsable | Estimación |
|---|--------|-----------|-------------|------------|
| 4.1 | **Pentest profesional** externo | 🟡 | Externo | 2 semanas |
| 4.2 | **Certificación ISO 27001** | 🟡 | Organizacional | 3-6 meses |
| 4.3 | **Auditoría HIPAA** (si aplica a mercado US) | 🟡 | Externo | 1-2 meses |
| 4.4 | **Bug bounty program** | 🟡 | Organizacional | Continuo |
| 4.5 | **Monitoreo continuo** de seguridad (SAST, DAST) | 🟡 | DevOps | Configuración inicial: 1 semana |
| 4.6 | **Revisión trimestral** de seguridad | 🟡 | Equipo | Recurrente |

---

## 7. Apéndice: Regulaciones Aplicables

### 7.1 GDPR (Reglamento General de Protección de Datos — UE)

**Aplica si:** Usuarios en la Unión Europea.

| Artículo | Requisito | Estado en KogniRecovery |
|----------|-----------|------------------------|
| Art. 6 | Base legal para procesamiento | ⚠️ Consentimiento existe pero no documentado formalmente |
| Art. 9 | Datos de salud = categoría especial | ❌ Sin encriptación en reposo |
| Art. 15 | Derecho de acceso | ⚠️ Parcial (endpoints existen pero no exponen todo) |
| Art. 16 | Derecho de rectificación | ✅ Endpoints de actualización existen |
| Art. 17 | Derecho al olvido | ❌ Eliminación incompleta |
| Art. 25 | Privacy by design | ⚠️ Parcial (encriptación disponible pero no usada) |
| Art. 32 | Seguridad del procesamiento | ⚠️ Múltiples controles sin aplicar |
| Art. 33 | Notificación de brechas (72h) | ❌ Sin procedimiento |
| Art. 35 | DPIA para datos sensibles | ❌ No realizado |

### 7.2 HIPAA (Health Insurance Portability and Accountability Act — EE.UU.)

**Aplica si:** Usuarios en Estados Unidos o relación con entidades cubiertas.

| Regla | Requisito | Estado en KogniRecovery |
|-------|-----------|------------------------|
| Privacy Rule | Protección de PHI | ❌ Datos en texto plano, sin BAA con LLMs |
| Security Rule | Safeguards técnicos | ⚠️ Parcial (encriptación disponible) |
| Breach Notification | Notificación en 60 días | ❌ Sin procedimiento |
| Business Associate | BAA con proveedores | ❌ Sin DPAs/BAAs firmados |

### 7.3 Ley 19.628 (Chile)

**Aplica si:** Usuarios en Chile (mercado principal identificado).

| Aspecto | Requisito | Estado |
|---------|-----------|--------|
| Consentimiento | Necesario para datos sensibles | ⚠️ Existe en BD pero no documentado |
| Derechos ARCO | Acceso, Rectificación, Cancelación, Oposición | ⚠️ Parcial |
| Seguridad | Medidas técnicas adecuadas | ⚠️ Múltiples brechas |

**Nota:** Chile está actualizando su legislación para alinearse con GDPR. Prepararse anticipadamente es estratégico.

### 7.4 LGPD (Brasil)

**Aplica si:** Usuarios en Brasil.

Datos de salud son **datos sensibles** con protección reforzada. Requiere:
- Consentimiento específico y destacado
- Encargado de protección de datos (DPO)
- Reporte de incidentes a ANPD

---

## 8. Conclusión Final

KogniRecovery es un proyecto con **potencial significativo** y una arquitectura bien pensada. Las vulnerabilidades identificadas no son defectos de diseño fundamental, sino **deudas de seguridad** acumuladas durante el desarrollo acelerado.

La **prioridad absoluta** debe ser:
1. 🔒 Proteger los datos de salud con encriptación
2. 🔐 Eliminar secretos del código
3. 🗑️ Implementar borrado completo de datos
4. 🤖 Anonimizar datos antes de enviar a LLMs
5. 👨‍👩‍👧 Controlar granularmente la compartición familiar

Con la ejecución disciplinada de la **Fase 1**, el proyecto alcanzará un nivel de seguridad adecuado para un despliegue controlado en producción. Las fases posteriores consolidarán la madurez de seguridad y el cumplimiento normativo.

---

*Informe generado por KogniTerm — Deep Coder + Deep Researcher en paralelo*
*Para preguntas o seguimiento de remediación, consultar este documento.*
