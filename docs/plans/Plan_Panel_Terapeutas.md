# Plan de diseño e implementación — Panel de Terapeutas

> **Estado:** borrador para validación
> **Fecha:** 31 de octubre de 2026
> **Alcance:** backend, app Android/Expo, nuevo frontend web para terapeutas y centro de salud mental
> **Audiencia:** producto, desarrollo, diseño UX, dirección clínica, legal/DPO y operaciones

> **Aviso:** este documento es un plan técnico y de producto. No constituye asesoría legal. Las referencias normativas deben validarse con el DPO y un abogado especializado antes del piloto.

---

## 0. Resumen ejecutivo

### Qué se quiere construir

Un **panel web para terapeutas** de un centro de salud mental que centralice la información clínica que cada paciente decide compartir desde la app Android. El paciente debe poder elegir, categoría por categoría, qué datos comparte, con quién y durante cuánto tiempo, y revocarlo en cualquier momento. El centro debe poder operar con múltiples terapeutas, pacientes y equipos, con aislamiento de datos entre centros.

### Decisión principal

No se debe construir primero el panel y añadir privacidad después. La unidad mínima del producto es:

> **Un terapeuta solo puede ver un dato clínico si existe una relación de cuidado activa y un consentimiento activo, vigente y suficiente para esa categoría y nivel de detalle, y toda lectura queda auditada.**

Ese principio debe implementarse en una **capa única de autorización clínica** en el backend, no en cada pantalla.

### Recomendación de arquitectura

| Pieza | Recomendación |
|---|---|
| App del paciente | Mantener React Native/Expo actual |
| API | Extender el backend Express/TypeScript actual |
| Base de datos | PostgreSQL actual + nuevas tablas de organización, cuidado y consentimiento |
| Panel web | Aplicación separada `web/` con Next.js + TypeScript + Tailwind/shadcn |
| Autenticación web | BFF con cookies `httpOnly`, MFA obligatorio para terapeutas |
| Autorización clínica | Servicio central `ClinicalAccessService` + guard + auditoría |
| Multi-tenant | `organizations` + `organization_members` + políticas por organización |
| Tipos compartidos | OpenAPI 3.1 generado desde el backend; cliente tipado en web |

### Alcance del MVP

Incluye:

- Alta de centro, terapeutas y pacientes.
- Roles: paciente, terapeuta, responsable clínico, administrador del centro, auditor, administrador de plataforma.
- Vinculación paciente–centro y asignación paciente–terapeuta.
- Motor de consentimiento granular, versionado, revocable y auditado.
- Panel del terapeuta con: lista de pacientes, resumen, check-ins, cravings, medicamentos, consumo y alertas.
- Estado explícito de “no compartido” para cada categoría.
- Auditoría de accesos visible para el paciente.
- Alertas de riesgo con protocolo de seguridad.
- Exportación de informe clínico con marca de agua y auditoría.
- MFA, sesiones seguras, aislamiento entre centros y pruebas de autorización.

No incluye en el MVP:

- Transcripción completa del chatbot.
- Diagnóstico o recomendaciones automáticas de tratamiento.
- Acceso del administrador del centro al contenido clínico.
- Mensajería paciente–terapeuta.
- Integración con historia clínica electrónica (FHIR/HL7).
- Analítica agregada entre centros.
- Pacientes menores de edad sin revisión legal específica.
- Investigación o entrenamiento de modelos con datos clínicos.

### Estimación preliminar

Con **2 desarrolladores full-stack, 0,5 diseñador UX, 0,25 legal/DPO y 0,25 liderazgo clínico**:

| Hito | Duración aproximada |
|---|---|
| Descubrimiento, legal y prototipos | 3 semanas |
| Backend: tenants, cuidado, consentimiento y auditoría | 5 semanas |
| Panel web MVP | 6 semanas |
| App móvil: centro de consentimiento y transparencia | 3 semanas |
| Seguridad, DPIA y preparación de piloto | 4 semanas |
| **Piloto con un centro** | **8 semanas** |
| **Total hasta cierre de piloto** | **~7 meses** |

Con un solo desarrollador, el plazo se duplica aproximadamente. La estimación no incluye certificaciones formales ni validación clínica extensa.

---

## 1. Punto de partida: qué existe y qué falta

### 1.1 Activos aprovechables

| Activo | Estado | Implicación |
|---|---|---|
| App móvil Expo/React Native | Funcional, con check-ins, cravings, bitácora, medicamentos, consumo y chatbot | Base para el paciente |
| Backend Express/TypeScript | Rutas, modelos, JWT, refresh tokens, RBAC básico | Base para extender |
| Roles `patient`, `family`, `professional`, `admin` | Existen en `users` y middleware | Reutilizar `professional` como rol de terapeuta |
| Consentimiento incipiente | `consent.model.ts`, `patientConsent.service.ts`, `ClinicalDataConsentScreen.tsx` | Punto de partida, pero incompleto y con errores |
| Auditoría de privacidad | `privacy_audit_log` | Reutilizar concepto; crear auditoría de acceso clínico específica |
| Dashboard familiar | `family.routes.ts` con verificación de acceso | Precedente útil, pero con permisos granulares no aplicados |
| Documento de auditoría de seguridad | `docs/AUDITORIA_SEGURIDAD_PRIVACIDAD.md` | Hoja de ruta de controles previos al piloto |

### 1.2 Brechas críticas detectadas

| # | Brecha | Evidencia | Riesgo |
|---|---|---|---|
| 1 | No existe modelo de organización/centro | No hay tabla `organizations` ni membresías | No se puede aislar un centro de otro |
| 2 | No existe vínculo paciente–terapeuta | Solo hay `sharing_invitations` para familiares | No hay forma segura de asignar pacientes |
| 3 | El consentimiento actual no tiene tabla migrada | `consent.model.ts` consulta `consent`, pero no hay migración que la cree | La pantalla falla o queda inservible |
| 4 | Ruta frontend incorrecta | `ClinicalDataConsentScreen` llama `/api/patients/:id/consents`; el backend expone `/api/v1/patient/consents` | 404 y consentimiento no persiste |
| 5 | Categorías de consentimiento incompletas | `mood`, `cravings`, `journal`, `medication`, `checkin` no cubren notas libres, chatbot, riesgo, consumo ni perfil clínico | Consentimiento demasiado grueso |
| 6 | No hay auditoría de lectura clínica | `privacy_audit_log` registra acciones de privacidad, no cada acceso a datos de пациента | No se puede responder “quién vio qué” |
| 7 | Permisos familiares no aplicados | `sharing_invitations.permissions` se guarda pero no se verifica en las consultas | Precedente de fuga de datos; no repetirlo |
| 8 | No hay frontend web | El repo solo contiene app móvil y backend | Hay que crear una aplicación nueva |
| 9 | Esquema de base de datos disperso | `docker/postgres/init.sql`, `scripts/sql/*.sql` y `server/src/scripts/migrate.ts` se solapan | Deriva de esquema y migraciones no reproducibles |
| 10 | Roles inconsistentes | `professional` vs `therapist` en distintos archivos | Errores de autorización |
| 11 | Borrado y exportación incompletos | `privacy.service.ts` no cubre todas las tablas ni Neo4j/embeddings | Incumplimiento de derechos del paciente |
| 12 | Sin MFA para profesionales | `two_factor_enabled` existe, pero no hay TOTP | Riesgo de robo de credenciales |

### 1.3 Errores inmediatos que hay que corregir antes de construir encima

1. `server/src/routes/index.ts` contiene secuencias literales `\n` dentro del código (import y `apiRouter.use`), lo que puede romper la compilación.
2. `src/navigation/MainDrawerNavigator.tsx` también contiene `\n` literales en el bloque de `ClinicalConsent`.
3. La pantalla móvil usa una ruta que no coincide con la del backend.
4. No existe migración para la tabla `consent`.
5. El modelo `consent` y el servicio `patientConsent.service.ts` duplican la misma lógica de upsert.
6. La taxonomía actual no distingue datos agregados de texto libre, que es la distinción de privacidad más importante.

**Recomendación:** congelar la implementación actual de consentimiento, corregir los errores anteriores y reemplazarla por el diseño de este plan. No construir el panel sobre la tabla `consent` actual.

---

## 2. Principios rectores

1. **Consentimiento explícito, granular y revocable.** Nada se comparte por defecto salvo el protocolo de seguridad, que se explica y se acepta al ingresar al centro.
2. **Minimización.** El panel muestra solo lo necesario para el tratamiento. No se muestran datos “porque están disponibles”.
3. **El centro no puede ampliar permisos.** Solo el paciente concede; el terapeuta solicita, el centro administra vínculos, pero no habilita categorías.
4. **Aislamiento por organización.** Un terapeuta del Centro A no puede ver pacientes del Centro B, aunque conozca el ID.
5. **Auditoría de toda lectura.** Cada acceso a datos clínicos queda registrado con actor, paciente, categoría, propósito, IP, fecha y resultado.
6. **Seguridad por defecto.** Denegar es el comportamiento inicial. Los errores no deben filtrar datos.
7. **Transparencia bidireccional.** El paciente puede ver quién accedió a su información; el terapeuta ve con claridad qué está compartido y qué no.
8. **La seguridad clínica no es vigilancia.** El panel no debe convertirse en un sistema de monitoreo permanente ni prometer cobertura 24/7 si el centro no la tiene.
9. **Los datos faltantes son un estado de primera clase.** “No compartido” no es un error; es una decisión del paciente y debe mostrarse con respeto.
10. **La IA es apoyo, no diagnóstico.** Cualquier resumen generado por IA debe estar etiquetado, citar fuentes y ser revisado por un profesional.

---

## 3. Alcance, roles y supuestos

### 3.1 Roles

| Rol | Dónde opera | Puede ver | No puede ver |
|---|---|---|---|
| **Paciente** | App móvil | Sus datos, sus consentimientos, quién accedió, su historial de consentimiento | Datos de otros pacientes |
| **Terapeuta** (`professional`) | Panel web | Pacientes asignados y categorías consentidas | Pacientes no asignados, datos no consentidos, otro centro |
| **Responsable clínico** (`clinical_lead`) | Panel web | Pacientes del equipo, alertas, asignaciones | Contenido clínico no consentido, datos de otro centro |
| **Administrador del centro** (`org_admin`) | Panel web | Terapeutas, pacientes, asignaciones, estado de consentimiento (sin contenido), auditoría agregada | Notas clínicas, check-ins, cravings, diario, chatbot |
| **Auditor** (`auditor`) | Panel web | Metadatos de auditoría y cumplimiento | Contenido clínico |
| **Administrador de plataforma** (`platform_admin`) | Backoffice | Organizaciones, estado del servicio, métricas agregadas | Contenido clínico, salvo break-glass auditado y aprobado |

**Decisión recomendada:** usar `professional` en base de datos y “terapeuta” en la interfaz. No introducir `therapist` como rol paralelo.

### 3.2 Supuestos de trabajo

- El centro de salud mental es el **responsable del tratamiento** de los datos; KogniRecovery actúa como **encargado** o corresponsable según el contrato. Esto debe definirse legalmente antes del piloto.
- El piloto será en **Chile**, con pacientes adultos capaces de consentir.
- El centro dispone de un protocolo de crisis y personal de guardia, o acepta explícitamente que el panel no es un servicio de emergencia 24/7.
- El paciente usa la app Android; el terapeuta usa un navegador de escritorio o tablet.
- La app móvil seguirá siendo el canal principal del paciente; el panel web no tendrá app móvil para terapeutas en el MVP.
- Los datos existentes de la app podrán migrarse, pero el consentimiento se pedirá de nuevo con la nueva taxonomía.

### 3.3 Fuera de alcance explícito

- Sustituir la historia clínica electrónica del centro.
- Facturación, agenda de citas o gestión de camas.
- Diagnóstico asistido por IA.
- Recomendaciones farmacológicas automáticas.
- Compartir datos con familiares desde el panel del terapeuta.
- Investigación, publicación o entrenamiento de modelos.
- Pacientes menores de edad, personas con incapacidad legal o situaciones de tutela, hasta revisión legal específica.

---

## 4. Arquitectura propuesta

### 4.1 Vista general

```text
┌──────────────────────┐          ┌──────────────────────────┐
│  App Android/Expo    │          │  Panel web (Next.js)     │
│  Paciente            │          │  Terapeuta / centro      │
│  - check-ins         │          │  - lista de pacientes    │
│  - consentimiento    │          │  - detalle clínico       │
│  - acceso visible    │          │  - alertas / auditoría   │
└──────────┬───────────┘          └────────────┬─────────────┘
           │ HTTPS Bearer JWT                   │ HTTPS + cookie httpOnly
           │                                    │ (BFF same-origin)
           ▼                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Express / TypeScript                  │
│                                                             │
│  auth │ organizations │ care │ consent │ clinical reads     │
│  alerts │ notes │ audit │ export │ privacy                   │
│                                                             │
│         ┌─────────────────────────────────────────┐         │
│         │ ClinicalAccessService (guard único)      │         │
│         │ - valida membresía y asignación          │         │
│         │ - valida consentimiento y vigencia       │         │
│         │ - aplica máscara de campos               │         │
│         │ - registra acceso o denegación           │         │
│         └─────────────────────────────────────────┘         │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
      ┌─────────────────┐            ┌─────────────────┐
      │ PostgreSQL      │            │ Neo4j / RAG     │
      │ datos clínicos  │            │ memoria IA      │
      │ consentimiento  │            │ (sin acceso     │
      │ auditoría       │            │  directo panel) │
      └─────────────────┘            └─────────────────┘
```

### 4.2 Componentes

| Componente | Responsabilidad |
|---|---|
| `web/` | Aplicación Next.js del terapeuta. No accede directamente a PostgreSQL. |
| BFF de Next.js | Mantiene tokens en cookies `httpOnly`; valida CSRF; proxy a la API interna. |
| API `/api/v1` | Fuente única de verdad de autorización y datos. |
| `ClinicalAccessService` | Único punto que decide si un actor puede leer una categoría de un paciente. |
| `ClinicalReadRepository` | Consultas SQL que solo seleccionan columnas permitidas por el guard. |
| `AuditService` | Registro append-only de accesos, denegaciones, exportaciones y break-glass. |
| `ConsentService` | Alta, actualización, revocación, expiración y versionado de consentimientos. |
| Worker de alertas | Evalúa riesgo, crea alertas y gestiona escalamiento. |
| Worker de retención | Borra o anonimiza datos según política y ley. |
| Object storage | Informes exportados con expiración y enlaces firmados. |

### 4.3 Flujo de una lectura clínica

```text
1. El navegador llama a /api/therapist/patients/:id/checkins
2. El BFF adjunta la sesión y el header X-Organization-Id
3. La API valida JWT, sesión, membresía activa y organización
4. ClinicalAccessService recibe (actor, org, patient, category, purpose)
5. Verifica:
   a. paciente activo en la organización
   b. asignación activa del terapeuta al paciente
   c. consentimiento activo para esa categoría y nivel
   d. consentimiento no revocado ni expirado
   e. propósito permitido
6. Si falla: registra denegación y responde 403/404 sin datos
7. Si pasa: ClinicalReadRepository construye la consulta con las columnas permitidas
8. AuditService registra la lectura exitosa
9. La API responde solo con campos consentidos + metadatos de consentimiento
```

**Regla de implementación:** nunca se consulta la tabla clínica completa y luego se filtra en JavaScript. El filtrado debe ocurrir en la consulta SQL o en una vista segura. Esto evita fugas por serialización, logs, errores o cambios futuros.

### 4.4 Multi-tenancy

- `organization_id` en todas las tablas de vínculo, consentimiento, auditoría y alertas.
- El JWT no debe ser la única fuente de organización: el header `X-Organization-Id` se valida contra `organization_members` en cada request.
- Un usuario puede pertenecer a varias organizaciones; el panel muestra un selector y la sesión guarda la organización activa.
- Todas las consultas clínicas incluyen `organization_id` y `patient_id`; nunca solo `patient_id`.
- Evaluar Row-Level Security (RLS) de PostgreSQL para las tablas nuevas. Para las tablas clínicas existentes, usar vistas/funciones seguras y el guard de aplicación; migrar a RLS en una fase posterior si el volumen lo justifica.

### 4.5 Separación de la app móvil y el panel web

No reutilizar componentes React Native en la web. Crear `web/` como paquete independiente:

```text
KogniRecovery/
├── src/                  # app móvil actual
├── server/               # API actual
├── web/                  # NUEVO panel Next.js
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── styles/
│   └── package.json
├── packages/
│   └── shared-types/     # opcional, tipos generados de OpenAPI
└── docs/plans/
```

Motivos: ciclos de despliegue distintos, dependencias web vs. móviles, seguridad de cookies, SEO innecesario pero SSR útil para guards, y menor riesgo de romper la app del paciente.

---

## 5. Modelo de datos

### 5.1 Diagrama entidad-relación simplificado

```text
users ──< organization_members >── organizations
  │                                     │
  │                                     ├──< organization_patients >── users (patient)
  │                                     │            │
  │                                     │            └──< care_assignments >── users (professional)
  │                                     │
  │                                     ├──< professional_credentials
  │                                     ├──< consent_policy_versions
  │                                     └──< clinical_alerts
  │
  ├──< sharing_consents >── organizations
  │        │
  │        └──< sharing_consent_categories
  │        └──< sharing_consent_events
  │
  ├──< clinical_access_log
  └──< clinical_notes
```

### 5.2 Tablas nuevas

#### `organizations`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `name` | VARCHAR(200) | Nombre comercial |
| `legal_name` | VARCHAR(255) | Razón social |
| `tax_id` | VARCHAR(50) | RUT/ID fiscal |
| `country` | CHAR(2) | `CL` por defecto |
| `timezone` | VARCHAR(50) | `America/Santiago` |
| `status` | VARCHAR(20) | `active`, `suspended`, `closed` |
| `settings` | JSONB | Branding, retención, flags |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

#### `organization_members`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `user_id` | UUID FK | |
| `role` | VARCHAR(30) | `org_admin`, `clinical_lead`, `therapist`, `auditor` |
| `status` | VARCHAR(20) | `invited`, `active`, `suspended`, `removed` |
| `invited_by` | UUID FK | |
| `joined_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |

Restricción: `UNIQUE (organization_id, user_id)`.

#### `professional_credentials`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `organization_id` | UUID FK | |
| `license_number` | VARCHAR(100) | Número de registro |
| `license_country` | CHAR(2) | |
| `specialty` | VARCHAR(100) | |
| `verification_status` | VARCHAR(20) | `pending`, `verified`, `rejected`, `expired` |
| `verified_by` | UUID FK | |
| `verified_at` | TIMESTAMPTZ | |
| `expires_at` | DATE | |

#### `organization_patients`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `patient_id` | UUID FK | |
| `status` | VARCHAR(20) | `invited`, `active`, `discharged`, `left` |
| `enrolled_at` | TIMESTAMPTZ | |
| `discharged_at` | TIMESTAMPTZ | |
| `created_by` | UUID FK | |

Restricción: `UNIQUE (organization_id, patient_id)`.

#### `care_assignments`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `organization_patient_id` | UUID FK | |
| `professional_id` | UUID FK | |
| `role` | VARCHAR(20) | `primary`, `team` |
| `status` | VARCHAR(20) | `active`, `ended` |
| `assigned_by` | UUID FK | |
| `assigned_at` | TIMESTAMPTZ | |
| `ended_at` | TIMESTAMPTZ | |
| `ended_reason` | TEXT | |

Regla: un paciente puede tener un `primary` activo y varios `team` activos. El terapeuta solo accede si tiene una asignación activa o si el consentimiento es a nivel de organización y pertenece al equipo activo.

#### `patient_enrollment_invites`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `patient_email` | VARCHAR(320) | |
| `token_hash` | VARCHAR(64) | Nunca guardar el token en claro |
| `status` | VARCHAR(20) | `pending`, `accepted`, `expired`, `revoked` |
| `expires_at` | TIMESTAMPTZ | |
| `created_by` | UUID FK | |
| `accepted_at` | TIMESTAMPTZ | |

#### `consent_policy_versions`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `version` | VARCHAR(20) | Ej. `2026-11-v1` |
| `locale` | VARCHAR(10) | `es-CL` |
| `document_hash` | VARCHAR(64) | SHA-256 del texto mostrado |
| `document_text` | TEXT | Texto íntegro para recibo de consentimiento |
| `categories` | JSONB | Definición de categorías y niveles |
| `effective_from` | TIMESTAMPTZ | |
| `created_by` | UUID FK | |

#### `sharing_consents`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `patient_id` | UUID FK | |
| `organization_id` | UUID FK | |
| `grantee_type` | VARCHAR(20) | `organization` o `professional` |
| `grantee_id` | UUID | ID de la org o del profesional |
| `purpose` | VARCHAR(20) | `treatment` o `safety` |
| `policy_version_id` | UUID FK | |
| `status` | VARCHAR(20) | `granted`, `revoked`, `expired` |
| `history_days` | INTEGER | Ventana de historia compartida |
| `granted_at` | TIMESTAMPTZ | |
| `expires_at` | TIMESTAMPTZ | |
| `revoked_at` | TIMESTAMPTZ | |
| `revoked_by` | UUID FK | |
| `revocation_reason` | TEXT | Opcional, no obligatorio para el paciente |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

Regla: un paciente puede tener un consentimiento activo para la organización y otro para un profesional concreto. Si existe uno a nivel de organización, cubre al equipo activo; si el paciente quiere limitarlo a una persona, se usa `grantee_type = professional`.

#### `sharing_consent_categories`

| Campo | Tipo | Notas |
|---|---|---|
| `consent_id` | UUID FK | |
| `category` | VARCHAR(50) | Ver taxonomía |
| `detail_level` | VARCHAR(20) | `aggregate`, `summary`, `detailed`, `full` |
| `enabled` | BOOLEAN | |

PK compuesta: `(consent_id, category)`.

#### `sharing_consent_events`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | BIGSERIAL PK | |
| `consent_id` | UUID | |
| `patient_id` | UUID | |
| `event_type` | VARCHAR(30) | `granted`, `updated`, `revoked`, `expired`, `renewed` |
| `snapshot` | JSONB | Estado completo en ese momento |
| `actor_id` | UUID | Paciente o sistema |
| `ip_address` | INET | |
| `user_agent` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

Esta tabla es **append-only**. No se actualiza ni se borra, salvo retención legal.

#### `clinical_access_log`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | BIGSERIAL PK | Particionar por mes |
| `actor_id` | UUID | |
| `actor_role` | VARCHAR(30) | |
| `organization_id` | UUID | |
| `patient_id` | UUID | Nulo en listados agregados |
| `consent_id` | UUID | Consentimiento usado |
| `action` | VARCHAR(30) | `view`, `list`, `export`, `break_glass`, `denied` |
| `resource_type` | VARCHAR(50) | `checkin`, `craving`, `medication`, `journal`, `chatbot`, `alert`, `note` |
| `resource_ids` | UUID[] | IDs concretos, no contenido |
| `purpose` | VARCHAR(20) | `treatment`, `safety`, `break_glass` |
| `success` | BOOLEAN | |
| `denial_reason` | VARCHAR(100) | |
| `ip_address` | INET | |
| `user_agent` | TEXT | |
| `request_id` | UUID | |
| `created_at` | TIMESTAMPTZ | |

Nunca registrar valores clínicos, solo metadatos.

#### `clinical_alerts`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `patient_id` | UUID FK | |
| `source` | VARCHAR(30) | `checkin`, `chatbot`, `self_report`, `clinician` |
| `severity` | VARCHAR(20) | `low`, `medium`, `high`, `critical` |
| `status` | VARCHAR(20) | `open`, `acknowledged`, `escalated`, `closed`, `false_positive` |
| `summary` | TEXT | Sin detalles innecesarios |
| `source_ref` | UUID | ID del check-in o mensaje |
| `created_at` | TIMESTAMPTZ | |
| `acknowledged_by` | UUID | |
| `acknowledged_at` | TIMESTAMPTZ | |
| `closed_at` | TIMESTAMPTZ | |

#### `clinical_notes` (notas del terapeuta)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `organization_id` | UUID FK | |
| `patient_id` | UUID FK | |
| `author_id` | UUID FK | |
| `content_encrypted` | BYTEA | Cifrado a nivel de campo |
| `visibility` | VARCHAR(20) | `private` o `care_team` |
| `created_at`, `updated_at` | TIMESTAMPTZ | |
| `deleted_at` | TIMESTAMPTZ | |

Estas notas **no** son datos del paciente compartidos desde la app; son del terapeuta. Deben tener su propia política de acceso y auditoría. Su visibilidad al paciente se decide con legal/ético antes del piloto.

### 5.3 Tablas existentes que se reutilizan

| Tabla | Uso en el panel | Categoría de consentimiento |
|---|---|---|
| `checkins` | Estado emocional, sueño, ejercicio, notas | `checkins_summary`, `checkins_notes` |
| `cravings` | Intensidad, sustancia, estrategias, notas | `cravings_summary`, `cravings_notes` |
| `consumption_events` | Eventos de consumo | `consumption` |
| `substance_doses` | Dosis registradas | `consumption` |
| `medications`, `medication_logs` | Medicamentos y adherencia | `medications` |
| `daily_notes`, `habit_entries`, `social_entries`, `consumption_analysis` | Bitácora | `journal` |
| `agent_notes` | Memoria del agente | `agent_notes` |
| `conversations`, `messages` | Chatbot | `chatbot_summary`, `chatbot_transcript` |
| `profiles` | Perfil clínico | `clinical_profile` |
| `emergency_alerts` | Alertas de emergencia del paciente | `risk_alerts` (solo metadatos) |
| `substance_expenses` | Gastos | No compartir en MVP |

### 5.4 Estrategia de migraciones

El repositorio tiene tres fuentes de esquema que se solapan. Antes de añadir tablas:

1. **Congelar** `docker/postgres/init.sql` y `server/src/scripts/migrate.ts` como legado.
2. Crear `server/migrations/` con migraciones SQL numeradas y una tabla `schema_migrations`.
3. Hacer una **línea base** del esquema actual en una migración `000_baseline.sql`.
4. Añadir las nuevas tablas en `016_organizations.sql`, `017_care_and_consent.sql`, `018_clinical_access_audit.sql`, `019_alerts_and_notes.sql`.
5. Ejecutar migraciones en CI sobre PostgreSQL efímero.
6. Nunca editar una migración ya aplicada.
7. Documentar el procedimiento en `server/migrations/README.md`.

Herramienta sugerida: `node-pg-migrate` o `Umzug`; lo importante es que sea reproducible y testeable, no la herramienta.

### 5.5 Índices y constraints mínimos

- `organization_members (organization_id, user_id)` único.
- `organization_patients (organization_id, patient_id)` único.
- `care_assignments (organization_patient_id, professional_id, status)`.
- `sharing_consents (patient_id, organization_id, status)`.
- `sharing_consent_categories (consent_id, category)` PK.
- `clinical_access_log (organization_id, patient_id, created_at DESC)`.
- `clinical_access_log (actor_id, created_at DESC)`.
- `clinical_alerts (organization_id, status, severity, created_at DESC)`.
- `clinical_notes (organization_id, patient_id, created_at DESC)`.
- Checks de enums para evitar valores libres.
- `ON DELETE CASCADE` solo donde la semántica lo permita; los logs de auditoría no deben borrarse en cascada con el paciente (usar `SET NULL` o retención controlada).

---

## 6. Taxonomía de datos y matriz de consentimiento

### 6.1 Categorías

| Categoría | Qué incluye | Fuente | Sensibilidad | Default MVP | Nivel máximo |
|---|---|---|---|---|---|
| `checkins_summary` | Ánimo, ansiedad, energía, sueño, ejercicio, etiquetas emocionales | `checkins` | Alta | No | `summary` |
| `checkins_notes` | Notas libres, descripción de riesgo, estrategia de afrontamiento | `checkins.notes`, `risk_description`, `coping_strategy_used` | Muy alta | No | `detailed` |
| `cravings_summary` | Sustancia, intensidad, duración, resultado, estrategias | `cravings` | Alta | No | `summary` |
| `cravings_notes` | Triggers, consecuencias, notas | `cravings.triggers`, `consequences`, `notes` | Muy alta | No | `detailed` |
| `consumption` | Eventos de consumo, dosis, frecuencia, contexto | `consumption_events`, `substance_doses` | Muy alta | No | `detailed` |
| `medications` | Medicamentos, dosis, adherencia | `medications`, `medication_logs` | Alta | No | `detailed` |
| `journal` | Notas diarias, hábitos, entorno social, análisis de consumo | `daily_notes`, `habit_entries`, `social_entries`, `consumption_analysis` | Muy alta | No | `detailed` |
| `agent_notes` | Notas y memoria generadas por el agente | `agent_notes` | Muy alta | No | `detailed` |
| `chatbot_summary` | Resumen temático del chatbot, sin transcripción | `conversations`, `messages` procesados | Muy alta | No | `summary` |
| `chatbot_transcript` | Transcripción completa | `messages` | Extremadamente alta | No (fase 2) | `full` |
| `clinical_profile` | Sustancia principal, años de uso, tratamientos previos, historial de recaídas, motivación | `profiles` | Alta | No | `detailed` |
| `risk_alerts` | Eventos de riesgo, alertas de crisis y su estado | `clinical_alerts`, `checkins.risk_situation` | Crítica | Sí, protocolo de seguridad | `summary` |
| `emergency_contacts` | Contactos de emergencia | `emergency_contacts` | Alta | No se comparte con terapeuta | — |
| `family_messages` | Mensajes con familiares | `wall_messages` | Alta | No se comparte | — |
| `usage_metadata` | Sesiones, dispositivo, frecuencia de uso | logs | Media | No se comparte | — |
| `research` | Datos para investigación | cualquiera | Variable | No | — |

### 6.2 Niveles de detalle

| Nivel | Qué permite | Ejemplo |
|---|---|---|
| `aggregate` | Conteos, promedios y tendencias; sin registros individuales ni fechas exactas | “Ánimo promedio 3,2/5 en 30 días” |
| `summary` | Registros individuales con fecha y campos estructurados; sin texto libre | “12 de octubre: ánimo 3, ansiedad 4” |
| `detailed` | Registros individuales + texto libre | “12 de octubre: … nota del paciente” |
| `full` | Transcripción completa o contenido íntegro | Conversación completa del chatbot |

**Regla:** el texto libre nunca se incluye en `summary`. Para ver notas hace falta un consentimiento explícito de la subcategoría `*_notes`, `journal`, `agent_notes` o `chatbot_transcript`.

### 6.3 Reglas de consentimiento

1. **Todo apagado por defecto**, excepto `risk_alerts` si el centro opera un protocolo de seguridad y el paciente lo acepta al ingresar.
2. **El paciente elige categoría y nivel.** La interfaz no permite que el terapeuta ni el centro activen categorías.
3. **El consentimiento es por finalidad.** `treatment` y `safety` son finalidades separadas.
4. **El consentimiento es por destinatario.** Organización (equipo) o profesional concreto.
5. **El consentimiento tiene vigencia.** Fecha de expiración y revisión anual; no indefinido por defecto.
6. **La revocación es inmediata.** El acceso se corta en la siguiente request; no se espera a un job nocturno.
7. **La revocación no requiere motivo.** El terapeuta ve que la categoría dejó de estar disponible, no el motivo.
8. **El consentimiento se versiona.** Se guarda la versión del texto, su hash y el snapshot de categorías.
9. **La retirada no borra el historial de accesos.** El paciente puede ver qué se accedió antes de revocar.
10. **No se puede inferir una categoría no consentida.** No mostrar “tiene notas” o “tiene chatbot” si no está compartido. Mostrar “no compartido” de forma genérica.

### 6.4 Estados de consentimiento

```text
no_solicitado → otorgado → actualizado → revocado
                    │            │
                    └────────────┴──→ expirado
```

En la UI del terapeuta, cada categoría debe tener uno de estos estados:

- **Compartido** (con nivel y fecha).
- **No compartido** (sin más detalle).
- **Expirado** (el paciente debe renovar).
- **Revocado** (desde fecha).
- **No aplica** (categoría sin datos).

### 6.5 Recibo de consentimiento

Cada otorgamiento debe guardar:

- ID del paciente y de la organización.
- Categorías y niveles exactos.
- Versión y hash del texto mostrado.
- Fecha, hora, IP y user agent del dispositivo.
- Método: app móvil, deep link o web.
- Snapshot JSON completo.
- Evento append-only en `sharing_consent_events`.

Este recibo es la evidencia de consentimiento informado. Sin él, no se debe habilitar el acceso.

### 6.6 Protocolo de seguridad (`risk_alerts`)

Es la categoría más delicada. Recomendación:

- Se explica al paciente **al ingresar al centro**, no escondido en ajustes.
- Se presenta como “protocolo de seguridad del centro”, no como “compartir datos”.
- El paciente acepta o rechaza; si rechaza, el centro puede decidir no admitirlo o limitar el servicio, pero debe decírselo claramente y por escrito.
- No se puede desactivar silenciosamente desde el panel del terapeuta.
- Si el paciente lo revoca, el panel deja de mostrar alertas y el centro no puede prometer seguimiento de crisis.
- La app sigue mostrando recursos de emergencia y líneas de crisis aunque no haya consentimiento.
- Toda alerta enviada, acknowledged o escalada queda auditada y visible para el paciente.

**Decisión pendiente:** si el centro tiene obligación legal de actuar ante riesgo inminente, el break-glass debe estar definido con legal. No improvisarlo en el MVP.

---

## 7. Flujos de producto

### 7.1 Alta del centro

1. `platform_admin` crea la organización.
2. Configura nombre, país, zona horaria, política de retención y branding básico.
3. Se designa un `org_admin` responsable.
4. Se firma el contrato/DPA entre centro y plataforma.
5. Se configura el protocolo de crisis y el horario de cobertura.
6. Se activa el flag `THERAPIST_PANEL_ENABLED` para esa organización.

**Criterio de salida:** organización activa, admin verificado, DPA firmado, protocolo de crisis documentado.

### 7.2 Invitación y verificación de terapeutas

1. `org_admin` invita por email.
2. El terapeuta crea contraseña, verifica email y configura MFA TOTP.
3. Sube número de licencia y especialidad.
4. `clinical_lead` o `org_admin` verifica credenciales.
5. Se activa la membresía.
6. Se le asignan pacientes.

**Reglas:** sin verificación de licencia no hay acceso clínico. Sin MFA no hay acceso. La sesión se revoca al suspender o eliminar la membresía.

### 7.3 Vinculación del paciente

1. `org_admin` o `clinical_lead` crea una invitación con email o código/QR.
2. El paciente recibe un deep link o introduce el código en la app.
3. La app muestra:
   - Nombre del centro.
   - Nombre y licencia del terapeuta asignado (si existe).
   - Para qué se usarán los datos.
   - Qué categorías puede compartir y cuáles no.
   - Que puede revocar en cualquier momento.
4. El paciente acepta el vínculo.
5. Se crea `organization_patients` y, si corresponde, `care_assignments`.
6. El paciente configura el consentimiento inicial (puede dejar todo apagado).
7. El terapeuta recibe una notificación neutral: “Nuevo paciente vinculado; consentimiento pendiente/configurado”.

**Regla:** aceptar el vínculo **no** equivale a aceptar compartir datos. Son dos acciones separadas.

### 7.4 Consentimiento inicial

1. Pantalla “Mi equipo de tratamiento”.
2. Explicación en lenguaje claro, con ejemplos.
3. Lista de categorías con interruptor y sub-opciones de texto libre.
4. Selector de ventana de historia (7/30/90/365 días).
5. Vista previa: “Esto es lo que verá tu terapeuta”.
6. Confirmación con resumen.
7. Guardado online; si falla, no se muestra como guardado.
8. Recibo descargable o consultable en “Historial de consentimiento”.

**Anti-patrones prohibidos:** casillas premarcadas, botón “Aceptar todo” como opción principal, letra pequeña, dark patterns, presión del terapeuta.

### 7.5 Acceso del terapeuta

1. Login con email, contraseña y MFA.
2. Selección de organización si pertenece a varias.
3. Lista de pacientes asignados.
4. Cada paciente muestra:
   - Nombre.
   - Estado de cuidado.
   - Última actividad compartida (solo si hay categorías).
   - Número de categorías compartidas.
   - Alertas abiertas.
5. Al abrir el detalle, se cargan solo categorías consentidas.
6. Cada pestaña no consentida muestra un estado vacío neutral.
7. Cada lectura queda auditada.

### 7.6 Revocación

1. El paciente entra a “Mi equipo de tratamiento”.
2. Desactiva una categoría o todo el consentimiento.
3. Confirma.
4. El backend marca `revoked_at`, crea evento y limpia caché.
5. La siguiente request del terapeuta devuelve “no compartido”.
6. El terapeuta no recibe el motivo; solo el estado.
7. El paciente ve el cambio en su historial.
8. Si se revoca `risk_alerts`, se muestra una advertencia clara sobre el protocolo de seguridad.

**Regla:** la revocación no debe requerir aprobación del terapeuta ni del centro.

### 7.7 Cambio de terapeuta

Escenarios:

- **Consentimiento a nivel de organización:** el nuevo terapeuta del equipo accede si tiene asignación activa. El paciente recibe una notificación del cambio.
- **Consentimiento a nivel de profesional:** el nuevo terapeuta no accede hasta que el paciente lo autorice. La UI debe explicar la diferencia.
- **Terapeuta saliente:** se termina la asignación, se revocan sesiones y se audita. El paciente es notificado.

**Recomendación:** default a nivel de organización para continuidad clínica, con opción de restringir a un profesional concreto. La UI debe decir claramente “tu equipo” vs “solo [nombre]”.

### 7.8 Crisis

1. Fuente: check-in con `risk_situation`, chatbot con señal de crisis, o autoreporte.
2. Se crea `clinical_alert` con severidad y `source_ref`.
3. Se notifica al terapeuta asignado y, si aplica, al `clinical_lead` de guardia.
4. El terapeuta acknowledge o escala.
5. Si no hay acknowledgment en el SLA definido, se escala.
6. El paciente ve “Tu equipo fue alertado” y los recursos de emergencia.
7. Se registra todo en auditoría.
8. Se cierra con resultado: atendido, derivado, falso positivo.

**No hacer:** contactar a familiares, policía o terceros automáticamente sin protocolo legal y consentimiento específico.

### 7.9 Egreso del paciente

1. `org_admin` o `clinical_lead` marca `discharged`.
2. Se terminan asignaciones.
3. El acceso del terapeuta se corta de inmediato.
4. El consentimiento se marca `expired` o se mantiene solo para obligaciones legales, según política.
5. El paciente conserva su app y sus datos.
6. Si vuelve, se requiere nuevo vínculo y nuevo consentimiento.

### 7.10 Exportación y borrado

- **Exportación del terapeuta:** PDF/JSON con marca de agua, fecha, paciente, rango y “acceso auditado”. Enlace firmado con expiración de 24 h. Requiere re-autenticación.
- **Exportación del paciente:** todos sus datos + consentimientos + historial de accesos, en formato legible y JSON.
- **Borrado:** debe cubrir PostgreSQL, Neo4j, embeddings, exports temporales y backups según política. El servicio actual de `privacy.service.ts` está incompleto; debe auditarse y completarse antes del piloto.

---

## 8. API propuesta

### 8.1 Convenciones

- Base: `/api/v1`.
- Formato: JSON; fechas ISO 8601 en UTC; visualización en zona horaria de la organización.
- Autenticación móvil: `Authorization: Bearer <access_token>`.
- Autenticación web: cookie `__Host-kr_session` `httpOnly`, `Secure`, `SameSite=Lax`, más token CSRF.
- Organización activa: header `X-Organization-Id`, validado contra membresía.
- Paginación: cursor (`cursor`, `limit`), no offset para listas grandes.
- Idempotencia: `Idempotency-Key` en POST de invitaciones y consentimientos.
- Errores: envoltura existente `{ success: false, error: { code, message } }`.
- Correlación: `X-Request-Id` en todas las respuestas; se guarda en auditoría.
- Rate limiting por actor y por IP, especialmente en exportaciones y break-glass.

### 8.2 Códigos de error relevantes

| Código | HTTP | Cuándo |
|---|---|---|
| `UNAUTHORIZED` | 401 | Sin sesión o token inválido |
| `MFA_REQUIRED` | 403 | Terapeuta sin MFA |
| `FORBIDDEN` | 403 | Rol sin permiso |
| `NOT_A_MEMBER` | 403 | No pertenece a la organización |
| `PATIENT_NOT_ASSIGNED` | 404 | Paciente fuera del alcance del terapeuta (no revelar existencia) |
| `CONSENT_REQUIRED` | 403 | Categoría no consentida |
| `CONSENT_EXPIRED` | 403 | Consentimiento vencido |
| `CONSENT_REVOKED` | 403 | Consentimiento revocado |
| `INVALID_DETAIL_LEVEL` | 403 | Nivel insuficiente |
| `ORG_SUSPENDED` | 403 | Organización suspendida |
| `RATE_LIMITED` | 429 | Exceso de solicitudes |
| `EXPORT_TOO_LARGE` | 413 | Exportación fuera de límite |

Para pacientes no asignados o de otra organización, usar **404** en lugar de 403 para no filtrar existencia.

### 8.3 Endpoints del terapeuta

| Método | Ruta | Descripción | Consentimiento |
|---|---|---|---|
| `GET` | `/therapist/patients` | Lista pacientes asignados | Ninguno para el listado; solo metadatos |
| `GET` | `/therapist/patients/:id/overview` | Resumen del paciente | Categorías consentidas |
| `GET` | `/therapist/patients/:id/consent` | Estado de consentimiento | Metadatos de consentimiento |
| `GET` | `/therapist/patients/:id/checkins` | Check-ins | `checkins_summary` / `checkins_notes` |
| `GET` | `/therapist/patients/:id/cravings` | Cravings | `cravings_summary` / `cravings_notes` |
| `GET` | `/therapist/patients/:id/medications` | Medicamentos y adherencia | `medications` |
| `GET` | `/therapist/patients/:id/consumption` | Consumo y dosis | `consumption` |
| `GET` | `/therapist/patients/:id/journal` | Bitácora | `journal` |
| `GET` | `/therapist/patients/:id/chatbot-summary` | Resumen del chatbot | `chatbot_summary` |
| `GET` | `/therapist/patients/:id/chatbot-transcript` | Transcripción | `chatbot_transcript` (fase 2) |
| `GET` | `/therapist/patients/:id/alerts` | Alertas | `risk_alerts` |
| `POST` | `/therapist/alerts/:id/acknowledge` | Reconocer alerta | `risk_alerts` |
| `POST` | `/therapist/alerts/:id/escalate` | Escalar alerta | `risk_alerts` |
| `GET` | `/therapist/patients/:id/notes` | Notas del terapeuta | Membresía + asignación |
| `POST` | `/therapist/patients/:id/notes` | Crear nota | Membresía + asignación |
| `PATCH` | `/therapist/notes/:id` | Editar nota | Autor o `clinical_lead` |
| `GET` | `/therapist/patients/:id/access-log` | Auditoría del paciente | Metadatos auditables |
| `POST` | `/therapist/patients/:id/export` | Solicitar exportación | Re-auth + auditoría |
| `POST` | `/therapist/patients/:id/break-glass` | Acceso de emergencia | Justificación + re-auth + auditoría |

### 8.4 Endpoints del paciente (app móvil)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/patient/care-links` | Centros y terapeutas vinculados |
| `POST` | `/patient/care-links/accept` | Aceptar invitación |
| `DELETE` | `/patient/care-links/:id` | Salir de un centro |
| `GET` | `/patient/sharing-consents` | Consentimientos activos |
| `POST` | `/patient/sharing-consents` | Crear consentimiento |
| `PUT` | `/patient/sharing-consents/:id` | Actualizar categorías/niveles |
| `DELETE` | `/patient/sharing-consents/:id` | Revocar |
| `GET` | `/patient/consent-history` | Historial append-only |
| `GET` | `/patient/access-log` | Quién vio qué y cuándo |
| `GET` | `/patient/data-export` | Exportar datos |
| `POST` | `/patient/data-deletion` | Solicitar borrado |

### 8.5 Endpoints del centro

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/org/therapists` | Listar terapeutas |
| `POST` | `/org/therapists/invite` | Invitar terapeuta |
| `PATCH` | `/org/therapists/:id` | Suspender/activar/verificar |
| `GET` | `/org/patients` | Listar pacientes (sin contenido clínico) |
| `POST` | `/org/patients/invite` | Invitar paciente |
| `POST` | `/org/assignments` | Asignar paciente a terapeuta |
| `DELETE` | `/org/assignments/:id` | Terminar asignación |
| `GET` | `/org/audit` | Auditoría agregada |
| `GET` | `/org/consent-policy` | Política vigente |
| `PUT` | `/org/consent-policy` | Configurar texto/plantilla |
| `GET` | `/org/usage` | Métricas de uso |

### 8.6 Endpoints de plataforma

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/platform/organizations` | Crear centro |
| `GET` | `/platform/organizations` | Listar centros |
| `POST` | `/platform/organizations/:id/suspend` | Suspender |
| `GET` | `/platform/health` | Salud del servicio |

### 8.7 Ejemplo de respuesta de detalle

```json
{
  "success": true,
  "data": {
    "patient": {
      "id": "uuid",
      "display_name": "María P.",
      "care_status": "active",
      "assigned_professional": "Dra. Ana Soto",
      "last_shared_activity": "2026-10-29T14:20:00Z"
    },
    "consent": {
      "status": "granted",
      "expires_at": "2027-10-29T00:00:00Z",
      "categories": {
        "checkins_summary": { "enabled": true, "detail_level": "summary" },
        "cravings_summary": { "enabled": true, "detail_level": "summary" },
        "journal": { "enabled": false },
        "chatbot_summary": { "enabled": false }
      }
    },
    "checkins": [
      {
        "date": "2026-10-29",
        "mood": 3,
        "anxiety": 4,
        "energy": 2,
        "sleep_hours": 6,
        "exercise": false
      }
    ],
    "unavailable_categories": ["journal", "chatbot_summary", "medications"]
  },
  "meta": {
    "request_id": "uuid",
    "generated_at": "2026-10-31T12:00:00Z"
  }
}
```

**Regla:** `unavailable_categories` solo indica que no está compartido, sin explicar por qué ni sugerir que el paciente “debería” compartirlo.

---

## 9. Frontend web del terapeuta

### 9.1 Stack recomendado

| Capa | Elección |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript estricto |
| Estilos | Tailwind CSS + shadcn/ui |
| Datos | TanStack Query + cliente OpenAPI tipado |
| Formularios | React Hook Form + Zod |
| Gráficos | Recharts |
| Tablas | TanStack Table |
| Testing | Vitest + Testing Library + Playwright |
| Errores | Sentry con scrubbing de PHI |
| Autenticación | BFF Next.js + cookies `httpOnly` + CSRF + MFA |
| Despliegue | Docker separado o Vercel; API en red privada |

**Alternativa aceptable:** Vite + SPA + BFF delgado en Express. No exponer tokens en `localStorage`. Si el equipo prefiere menos complejidad, el BFF sigue siendo obligatorio.

### 9.2 Estructura de rutas

```text
/login
/mfa
/select-org
/dashboard
/patients
/patients/[id]/overview
/patients/[id]/checkins
/patients/[id]/cravings
/patients/[id]/medications
/patients/[id]/consumption
/patients/[id]/journal
/patients/[id]/alerts
/patients/[id]/notes
/patients/[id]/consent
/patients/[id]/access
/alerts
/settings/profile
/settings/security
/admin/therapists
/admin/patients
/admin/assignments
/admin/audit
/admin/consent-policy
```

Guards:

- `requireAuth` en todas las rutas.
- `requireMfa` para rutas clínicas.
- `requireOrgMember` con rol permitido.
- `requireAssignment` para detalle de paciente.
- `requireCapability('clinical:read')` o `('org:admin')`.

### 9.3 Pantallas del MVP

#### Dashboard

- Tarjetas: pacientes asignados, alertas abiertas, cambios de consentimiento recientes, pacientes sin actividad compartida.
- Lista de alertas prioritarias.
- No mostrar rankings ni comparaciones entre pacientes.

#### Lista de pacientes

- Búsqueda por nombre dentro de los asignados.
- Filtros: alertas, consentimiento, estado de cuidado, última actividad.
- Columnas: paciente, terapeuta, estado, categorías compartidas, última actividad compartida, alertas.
- No mostrar diagnósticos ni sustancias si no están consentidos.

#### Detalle del paciente

- Cabecera: nombre, edad/rango si está compartido, terapeuta, estado, consentimiento, última actualización.
- Banner de riesgo si hay alerta abierta.
- Pestañas con icono de candado para categorías no compartidas.
- Gráficos: ánimo/ansiedad/energía, cravings, adherencia, sueño/ejercicio.
- Timeline de registros.
- Panel lateral: “Qué comparte este paciente”, con fecha y nivel.
- Notas del terapeuta separadas visualmente: “Solo equipo clínico”.
- Botón “Exportar informe” con confirmación y re-auth.

#### Estado “no compartido”

- Mensaje neutral: “Este paciente no comparte esta información”.
- Sin botón de “solicitar acceso” en el MVP.
- Sin mostrar cuántos registros existen.
- Sin sugerir que la ausencia de datos es un problema de adherencia.

#### Alertas

- Bandeja con severidad, paciente, hora, fuente y estado.
- Acciones: reconocer, escalar, cerrar, marcar falso positivo.
- Temporizador de SLA visible.
- Historial de acciones.

#### Notas clínicas

- Editor con autosave y confirmación.
- Etiqueta “No visible para el paciente” o “Visible para el equipo”, según política.
- Cifrado en reposo y auditoría.
- No mezclar con notas del paciente.

#### Administración del centro

- Terapeutas: invitar, verificar licencia, suspender, reasignar.
- Pacientes: invitar, ver estado de vinculación, descargar consentimientos (metadatos).
- Asignaciones: arrastrar o seleccionar terapeuta.
- Auditoría: filtros por actor, paciente, acción, fecha; exportación CSV.
- Política de consentimiento: texto vigente, versiones, fecha de efecto.

### 9.4 UX y contenido

- Tono clínico, neutro, no alarmista.
- Nunca usar lenguaje que presione al paciente.
- Distinguir “no compartido” de “sin datos”.
- Mostrar siempre la fecha de última actualización.
- Evitar gráficos con ejes engañosos.
- No usar rojo para datos normales; reservar rojo/naranja para riesgo.
- Accesibilidad WCAG 2.1 AA: contraste, teclado, foco visible, etiquetas ARIA, zoom 200%, lectores de pantalla.
- Internacionalización: español de Chile por defecto; estructura para otros idiomas.
- Modo impresión para informes.

### 9.5 Rendimiento

- Lista de pacientes: p95 < 500 ms para 500 pacientes.
- Detalle: p95 < 1 s para 365 días de datos.
- Gráficos: agregados en servidor, no enviar miles de filas al navegador.
- Paginación por cursor.
- Cache HTTP corto solo para catálogos; nunca cachear datos clínicos en CDN.
- `Cache-Control: no-store` en respuestas clínicas.

### 9.6 Seguridad del frontend

- Cookies `httpOnly`, `Secure`, `SameSite=Lax`; `__Host-` prefix.
- CSRF token de doble submit.
- CSP estricta; sin scripts de terceros en páginas clínicas.
- Sin analytics de terceros en rutas con datos clínicos.
- Sin datos clínicos en URL, `localStorage`, `sessionStorage` ni logs del navegador.
- Timeout por inactividad: 15 min; absoluto: 8 h.
- Re-autenticación para exportar, break-glass y cambiar MFA.
- Bloqueo tras intentos fallidos.
- Watermark con email/fecha en informes exportados.
- Botón de “cerrar todas las sesiones”.

---

## 10. Cambios en la app móvil

### 10.1 Nueva sección “Mi equipo de tratamiento”

Ubicación: Perfil o drawer, junto a privacidad. Debe ser fácil de encontrar.

Contenido:

- Centros vinculados.
- Terapeuta(s) asignado(s), con nombre y licencia.
- Estado del vínculo.
- Botón “Configurar qué comparto”.
- Botón “Quién ha visto mis datos”.
- Botón “Salir de este centro”.
- Enlace a “Protocolo de seguridad”.

### 10.2 Pantalla de consentimiento

- Explicación breve y clara.
- Categorías con ejemplos concretos:
  - “Estado de ánimo y sueño: tu terapeuta verá tus puntuaciones diarias”.
  - “Notas libres: el texto que escribes en tus check-ins”.
  - “Chatbot: solo un resumen de temas, no la conversación completa”.
- Sub-interruptor “Incluir notas libres” dentro de las categorías que las tienen.
- Selector de ventana: 7, 30, 90, 365 días.
- Vista previa “Esto verá tu terapeuta”.
- Resumen antes de guardar.
- Confirmación con recibo.
- Historial de cambios.
- Botón de revocación visible, sin letra pequeña.

### 10.3 Transparencia

- “Quién ha visto mis datos”: lista con fecha, terapeuta, categoría y acción.
- Notificación opcional (semanal) de accesos.
- Notificación inmediata si hay break-glass.
- Explicación de qué NO se comparte.
- Enlace a la política de privacidad vigente.

### 10.4 Deep links

- Invitación de centro: `kognirecovery://care/accept?token=...`.
- Fallback web si la app no está instalada.
- Validar token, expiración y estado.
- No incluir datos clínicos en el deep link.

### 10.5 Offline

- La app puede seguir registrando datos offline.
- El consentimiento requiere conexión; mostrar “pendiente de guardar” y no asumir éxito.
- Al recuperar conexión, sincronizar y confirmar.
- Nunca mostrar un consentimiento como guardado si el servidor no lo confirmó.

### 10.6 Correcciones a la implementación actual

- Reemplazar `ClinicalDataConsentScreen` por la nueva pantalla.
- Eliminar la llamada a `/api/patients/:id/consents`.
- Usar `/api/v1/patient/sharing-consents`.
- Eliminar la tabla `consent` si se reemplaza por `sharing_consents`.
- Unificar la lógica duplicada de `consent.model.ts` y `patientConsent.service.ts`.
- Corregir los `\n` literales en navegación y rutas.
- Añadir tests de la pantalla y del guard.

---

## 11. Seguridad y privacidad

### 11.1 Controles

| Control | Implementación | Verificación |
|---|---|---|
| MFA para terapeutas | TOTP obligatorio | Test E2E; no se puede saltar |
| Sesiones seguras | Cookie httpOnly + CSRF; timeout 15 min | Test de sesión expirada |
| RBAC | Roles de organización + capacidades | Matriz de permisos testeada |
| Aislamiento multi-tenant | `organization_id` + validación de membresía | Tests cross-org |
| Consent guard | Servicio único + máscara de campos | Tests de matriz |
| Auditoría | `clinical_access_log` append-only | Test de cada endpoint |
| Cifrado en tránsito | TLS 1.2+; HSTS | Escaneo |
| Cifrado en reposo | PostgreSQL cifrado; campos sensibles con AES-256-GCM | Revisión + test |
| Cifrado de notas | Campo `content_encrypted` | Test de lectura no autorizada |
| Rate limiting | Por actor/IP; exportaciones más estrictas | Test de 429 |
| Logs sin PHI | Scrubbing y allowlist de campos | Revisión de logs |
| Exportaciones | Enlace firmado 24 h + watermark + auditoría | Test de expiración |
| Backups | Cifrados, PITR, restauración probada | Simulacro trimestral |
| Incidentes | Runbook + notificación legal | Tabletop exercise |
| Dependencias | SCA en CI; sin críticas | Pipeline |
| Pentest | Antes del piloto | Informe |

### 11.2 Modelo de amenazas

| Amenaza | Vector | Mitigación |
|---|---|---|
| Terapeuta curioso | Busca pacientes no asignados por ID | 404 + assignment check + audit |
| Robo de credenciales | Phishing, reutilización | MFA + lockout + sesión corta |
| Insider con acceso a BD | DBA o backup | Cifrado, mínimo privilegio, auditoría, separación de funciones |
| Fuga entre centros | Header manipulado | Validar membresía en cada request; tests cross-org |
| Bypass de consentimiento | Endpoint nuevo sin guard | Guard central + tests de contrato + revisión |
| Fuga por exportación | PDF/JSON | Watermark, rate limit, expiración, auditoría |
| Fuga por logs | `console.log` con datos | Logger estructurado con allowlist |
| Fuga por IA | Enviar datos no consentidos al LLM | Filtro previo + proveedor con DPA + no training |
| Captura de pantalla | Terapeuta fotografía | Watermark disuasorio; no es control técnico |
| Acceso de admin del centro | Curiosidad | Rol sin contenido clínico; auditoría |
| Break-glass abusivo | “Emergencia” falsa | Justificación, límite temporal, notificación al paciente, revisión |
| Enumeración de pacientes | IDs secuenciales/errores | UUID + 404 + rate limit |
| CSRF | Cookies | SameSite + token CSRF |
| XSS | Contenido libre | Sanitización + CSP + escape |
| Inyección SQL | Búsqueda | Consultas parametrizadas |
| Denegación de servicio | Exportaciones costosas | Colas + límites + timeout |

### 11.3 Break-glass

- Solo para riesgo inminente.
- Requiere re-autenticación y justificación escrita.
- Concede acceso temporal (30 min) a `risk_alerts` y datos mínimos de identificación.
- No concede acceso a diario, chatbot ni notas.
- Notifica inmediatamente al paciente.
- Se revisa por `clinical_lead` y DPO en 24 h.
- Se reporta mensualmente.
- Si el paciente no está en protocolo de seguridad, el break-glass debe estar prohibido; se deriva a emergencias.

### 11.4 Transparencia de accesos

- El paciente puede ver cada acceso: quién, cuándo, qué categoría, desde qué IP aproximada.
- Notificación inmediata para break-glass.
- Resumen semanal opcional.
- Esto disuade el acceso indebido y cumple el principio de transparencia.

### 11.5 Retención y borrado

Propuesta sujeta a legal:

| Dato | Retención propuesta |
|---|---|
| Datos clínicos | 5 años tras el egreso, o según normativa del centro |
| Consentimientos | 5 años tras revocación/egreso |
| Auditoría de accesos | 5 años |
| Notas clínicas | Según política del centro; mínimo legal |
| Exportaciones | 24 h |
| Sesiones | 8 h máximo |
| Backups | 30 días |
| Datos eliminados | Purga en 30 días; crypto-shredding si aplica |

El borrado debe cubrir PostgreSQL, Neo4j, embeddings, exports y backups según corresponda. El servicio actual debe auditarse y completarse.

---

## 12. Cumplimiento normativo y legal

### 12.1 Roles

- **Centro de salud mental:** responsable del tratamiento (quién decide fines y medios).
- **KogniRecovery:** encargado del tratamiento (procesa por cuenta del centro), salvo que el contrato diga otra cosa.
- **Proveedores:** subencargados (hosting, email, SMS, LLM, TTS). Requieren DPA y, si aplica, BAA.

Esto debe reflejarse en:

- Contrato de servicios.
- DPA (Data Processing Agreement).
- Lista de subencargados.
- Política de privacidad del centro y de la app.
- Aviso de privacidad dentro de la app.

### 12.2 Marco chileno relevante

| Norma | Relevancia |
|---|---|
| **Ley 19.628** | Protección de la vida privada y datos personales; datos sensibles |
| **Ley 21.719** | Nueva ley de protección de datos personales, publicada en diciembre de 2024; entra en vigor el 1 de diciembre de 2026. Refuerza derechos, consentimiento, DPIA, DPO y notificación de brechas |
| **Ley 20.584** | Derechos y deberes del paciente; confidencialidad de la ficha clínica |
| **Ley 21.331** | Derechos de las personas en atención de salud mental; consentimiento informado y confidencialidad |

**Implicación:** el piloto debe diseñarse ya bajo el estándar de Ley 21.719, aunque entre en vigor después de la fecha de este documento. No esperar a diciembre de 2026 para adaptarse.

### 12.3 Otras jurisdicciones

- **GDPR** si hay pacientes en la UE: base legal, DPIA, DPO, derechos, transferencias internacionales.
- **HIPAA** solo si hay relación con entidades cubiertas en EE.UU.; requiere BAA y salvaguardas específicas.
- **LGPD** si hay pacientes en Brasil.
- **LFPDPPP** si hay pacientes en México.
- **Ley 1581** si hay pacientes en Colombia.

No afirmar cumplimiento de una norma sin auditoría legal específica.

### 12.4 DPIA

Obligatoria o altamente recomendable por tratar datos de salud a escala. Debe cubrir:

- Categorías de datos y finalidades.
- Flujos y terceros.
- Necesidad y proporcionalidad.
- Riesgos para derechos y libertades.
- Medidas de mitigación.
- Riesgo residual.
- Consulta a pacientes/usuarios.
- Aprobación del DPO.

### 12.5 Consentimiento válido

- Informado: lenguaje claro, ejemplos, consecuencias.
- Específico: por categoría y finalidad.
- Libre: sin presión del terapeuta ni del centro.
- Inequívoco: acción afirmativa, sin casillas premarcadas.
- Revocable: tan fácil como otorgarlo.
- Documentado: recibo con versión, hash, fecha, IP y dispositivo.
- Separado: vínculo al centro ≠ consentimiento de datos; tratamiento ≠ investigación.

### 12.6 Menores y personas vulnerables

- Fuera del MVP hasta revisión legal.
- Requiere consentimiento de tutor y assent del menor, según edad y normativa.
- Evaluar capacidad, tutela y representación.
- No usar el panel para menores sin salvaguardas adicionales.

### 12.7 Derechos del paciente

- Acceso: exportación completa.
- Rectificación: edición de datos.
- Cancelación: borrado.
- Oposición: revocación de consentimiento.
- Portabilidad: JSON estructurado.
- Transparencia: historial de accesos y consentimientos.
- No discriminación por negarse a compartir.

### 12.8 Documentación necesaria antes del piloto

- Política de privacidad.
- Términos de uso.
- DPA con el centro.
- Lista de subencargados.
- DPIA.
- Registro de actividades de tratamiento.
- Procedimiento de brechas.
- Política de retención.
- Protocolo de crisis.
- Consentimiento informado versionado.
- Runbook de incidentes.
- Plan de respuesta a solicitudes de derechos.

---

## 13. Ética y seguridad clínica

### 13.1 Alertas de crisis

- No prometer monitoreo 24/7 si el centro no lo tiene.
- Mostrar horario de cobertura en el panel y en la app.
- Definir SLA de acknowledgment y escalamiento.
- Registrar todas las acciones.
- Evitar alarmismo y falsos positivos.
- Revisar el protocolo con el director clínico y legal.
- Si no hay cobertura, el panel debe decir “si hay riesgo inmediato, llama a emergencias”.

### 13.2 Coerción

- El paciente debe poder revocar sin confrontación.
- El terapeuta no debe ver el motivo de la revocación.
- No bloquear la app ni negar atención por no compartir, salvo el protocolo de seguridad explicado.
- Diseñar la revocación en pocos pasos y sin advertencias disuasorias.
- Medir si los pacientes entienden que pueden revocar.

### 13.3 Resúmenes de IA

- Solo sobre datos consentidos.
- Etiquetados como “resumen generado por IA”.
- Con citas a los registros fuente.
- Revisables y editables por el clínico.
- Sin diagnósticos, sin recomendaciones farmacológicas.
- Sin entrenamiento con datos del paciente.
- Proveedor con DPA; preferir modelo privado o anonimización.
- Guardar modelo, versión, prompt y fecha.
- Si no se puede garantizar, no incluirlo en el MVP.

### 13.4 Notas del terapeuta

- Son del profesional, no del paciente.
- Deben estar cifradas y auditadas.
- Definir si el paciente puede solicitar acceso.
- No mezclarlas con datos compartidos.
- Política de retención propia.

### 13.5 Datos faltantes

- Un paciente puede compartir solo el ánimo y nada más.
- El panel debe seguir siendo útil con datos parciales.
- No tratar la falta de datos como falta de adherencia.
- No inferir consumo, recaída o riesgo a partir de categorías no compartidas.

---

## 14. Hoja de ruta

### 14.1 Fases

| Fase | Duración | Entregables | Criterio de salida |
|---|---|---|---|
| **F0. Descubrimiento y fundamentos** | 3 semanas | Entrevistas, mapa de datos, taxonomía v1, DPIA scope, threat model, prototipos, baseline de migraciones | Taxonomía aprobada; prototipos validados; riesgos legales identificados |
| **F1. Backend de confianza** | 5 semanas | Organizaciones, membresías, credenciales, vinculación, asignaciones, consentimiento, auditoría, lectura de 3 categorías | Vertical slice end-to-end con tests de autorización |
| **F2. Panel web MVP** | 6 semanas | Auth/MFA, selector de org, lista, detalle, gráficos, estados vacíos, notas, alertas, admin básico | 5 terapeutas completan tareas clave; 0 fugas en pruebas |
| **F3. App móvil y transparencia** | 3 semanas | Centro de consentimiento, historial, acceso visible, revocación, deep links, protocolo de seguridad | ≥90% de pacientes comprende el consentimiento en test |
| **F4. Seguridad y preparación de piloto** | 4 semanas | Pentest, DPIA, DPAs, retención, exportación, borrado, break-glass, monitoreo, runbooks, capacitación | Go/no-go con criterios firmados |
| **F5. Piloto** | 8 semanas | 1 centro, 5–8 terapeutas, 30–50 pacientes, iteraciones, métricas, informe | Criterios de éxito cumplidos |
| **F6. Producción y madurez** | Continuo | SSO, resumen IA, analítica de centro, integraciones, certificaciones | Roadmap post-piloto |

### 14.2 Desglose de las primeras 12 semanas

| Semana | Foco | Entregable |
|---|---|---|
| 1 | Descubrimiento | Entrevistas, mapa de datos, riesgos |
| 2 | Diseño | Taxonomía v1, flujos, wireframes |
| 3 | Validación | Test de comprensión, threat model, plan legal |
| 4 | Fundaciones backend | Migraciones, organizaciones, membresías |
| 5 | Cuidado | Vinculación, asignaciones, invitaciones |
| 6 | Consentimiento | Modelo, servicio, versionado, eventos |
| 7 | Auditoría | Access log, guard, denegaciones |
| 8 | Lectura clínica | Check-ins, cravings, medicamentos + tests |
| 9 | Panel base | Next.js, auth, MFA, layout |
| 10 | Panel clínico | Lista, detalle, gráficos, estados vacíos |
| 11 | Admin y alertas | Terapeutas, asignaciones, bandeja de alertas |
| 12 | Revisión | Demo end-to-end, backlog, ajustes |

### 14.3 Equipo mínimo

| Rol | Dedicación |
|---|---|
| Tech lead / backend | 1.0 |
| Frontend / full-stack | 1.0 |
| Diseño UX/UI | 0.5 |
| Legal / DPO | 0.25 |
| Liderazgo clínico | 0.25 |
| DevOps / seguridad | 0.25 |
| QA | 0.25–0.5 |

Si solo hay un desarrollador, reducir el MVP a:

- Check-ins y cravings.
- Panel de lectura.
- Consentimiento y auditoría.
- Sin chatbot, sin notas clínicas, sin exportación avanzada.

---

## 15. Backlog inicial por épicas

| Épica | Historias clave | Criterio de aceptación |
|---|---|---|
| **E1. Organización e identidad** | Crear centro; invitar terapeuta; verificar licencia; MFA; selector de org; suspender miembro | Un terapeuta sin MFA o sin licencia verificada no accede a datos clínicos |
| **E2. Vinculación y cuidado** | Invitar paciente; aceptar deep link; asignar terapeuta; terminar asignación; egreso | El paciente ve quién es su terapeuta; el terapeuta solo ve asignados |
| **E3. Consentimiento** | Configurar categorías; elegir nivel; ventana de historia; revocar; renovar; recibo | Cada cambio genera evento; la revocación surte efecto en la siguiente request |
| **E4. Lectura clínica** | Ver check-ins; cravings; medicamentos; consumo; diario; resumen chatbot; alertas | Cada endpoint devuelve solo campos consentidos o un estado vacío |
| **E5. Panel web** | Login; dashboard; lista; detalle; gráficos; estados vacíos; exportar; notas | 5 terapeutas completan el flujo sin ayuda; axe sin errores críticos |
| **E6. App móvil** | Mi equipo; consentimiento; vista previa; historial; accesos; salir del centro | ≥90% de comprensión en test con pacientes |
| **E7. Alertas y seguridad** | Crear alerta; acknowledge; escalar; SLA; protocolo; break-glass | Toda alerta tiene trazabilidad y el paciente ve quién fue alertado |
| **E8. Auditoría y transparencia** | Ver accesos; exportar auditoría; revisar anomalías | El paciente ve cada acceso; el DPO puede exportar logs |
| **E9. Administración** | Gestionar terapeutas; pacientes; asignaciones; política; métricas | El admin no ve contenido clínico |
| **E10. Cumplimiento** | Exportar datos; borrar; retención; DPIA; DPAs; brechas | Borrado cubre todas las tablas y Neo4j/embeddings |
| **E11. Piloto** | Capacitación; soporte; métricas; entrevistas; informe | Criterios go/no-go cumplidos |

### 15.1 Definición de terminado (DoD)

Cada historia debe cumplir:

- Código revisado por otra persona.
- Tests unitarios e integración.
- Test de autorización (positivo y negativo).
- Auditoría implementada.
- Accesibilidad verificada.
- Sin datos clínicos en logs.
- Documentación de API actualizada.
- Feature flag si aplica.
- Migración reproducible.
- Demo aceptada por producto/diseño.

---

## 16. Estrategia de pruebas

### 16.1 Matriz de autorización

Probar cada endpoint clínico con:

| Dimensión | Casos |
|---|---|
| Rol | paciente, terapeuta, clinical_lead, org_admin, auditor, platform_admin |
| Membresía | activa, invitada, suspendida, removida |
| Asignación | activa, terminada, inexistente, otro terapeuta |
| Organización | misma org, otra org |
| Consentimiento | ausente, granted, revoked, expired |
| Categoría | habilitada, deshabilitada |
| Nivel | aggregate, summary, detailed, full |
| Propósito | treatment, safety, break_glass |
| Paciente | activo, egresado, eliminado |

Resultado esperado: **denegar por defecto** y auditar.

### 16.2 Pruebas específicas

- Revocación en caliente: el terapeuta con la pestaña abierta deja de ver datos en la siguiente request.
- Cross-tenant: cambiar `X-Organization-Id` no permite acceso.
- IDOR: cambiar `patientId` no permite acceso.
- Expiración: consentimiento vencido devuelve `CONSENT_EXPIRED`.
- Nivel insuficiente: `summary` no devuelve notas.
- Admin: `org_admin` no recibe campos clínicos.
- Exportación: enlace expira; descarga auditada.
- Break-glass: requiere justificación; notifica; expira.
- Borrado: no quedan filas en tablas nuevas ni en Neo4j/embeddings.
- Auditoría: cada lectura y denegación genera fila.
- Logs: no contienen nombres, notas ni sustancias.

### 16.3 E2E

- Paciente acepta vínculo → configura consentimiento → terapeuta ve check-ins.
- Paciente revoca → terapeuta ve “no compartido”.
- Paciente consulta accesos → ve al terapeuta.
- Alerta de crisis → terapeuta acknowledge → paciente ve estado.
- Admin invita terapeuta → terapeuta configura MFA → accede.
- Admin intenta ver contenido clínico → 403.

### 16.4 Seguridad

- SAST en CI.
- SCA de dependencias.
- DAST antes del piloto.
- Pentest externo.
- Revisión de CSP y headers.
- Pruebas de rate limiting.
- Pruebas de sesión y CSRF.
- Revisión de logs y backups.

### 16.5 Accesibilidad y usabilidad

- axe-core sin errores críticos.
- Navegación completa por teclado.
- Lectores de pantalla (NVDA/VoiceOver).
- Contraste AA.
- Zoom 200%.
- Test de comprensión del consentimiento con 5–8 pacientes.
- Test de tareas con 5–8 terapeutas.

### 16.6 Rendimiento

- 500 pacientes por centro, 365 días de datos.
- 1M de check-ins.
- p95 de lista < 500 ms.
- p95 de detalle < 1 s.
- Exportación en background con notificación.

---

## 17. Métricas y observabilidad

### 17.1 Métricas de producto

- % de pacientes que comparten al menos una categoría.
- % por categoría (sin metas que presionen).
- Tasa de revocación.
- Tiempo desde vinculación hasta primer consentimiento.
- Terapeutas activos semanales.
- Tiempo medio de revisión de paciente.
- Uso de exportaciones.
- Consultas al historial de accesos por parte del paciente.

### 17.2 Métricas clínicas (con cautela)

- Check-ins completados.
- Adherencia a medicación.
- Episodios de craving.
- Alertas reconocidas en SLA.
- Retención en el programa.
- Satisfacción de pacientes y terapeutas.

No atribuir causalidad sin diseño de estudio.

### 17.3 Métricas de privacidad y seguridad

- Accesos denegados por falta de consentimiento.
- Intentos cross-tenant.
- Accesos fuera de horario.
- Exportaciones por terapeuta.
- Break-glass por mes.
- Tiempo de revocación efectiva.
- Incidentes de privacidad.
- Cobertura de auditoría (requests clínicos con log).

### 17.4 Observabilidad

- Logs estructurados con `request_id`, `actor_id`, `org_id`, `patient_id` (sin contenido).
- Métricas: latencia, errores 5xx, 401/403, denegaciones, exportaciones.
- Alertas operativas: caída de API, aumento de 403 cross-tenant, fallo de worker de alertas, backups fallidos.
- Sentry con scrubbing de PHI.
- Dashboard de auditoría para DPO.
- Retención de logs operativos separada de auditoría clínica.

---

## 18. Riesgos y mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|---|---|---|---|
| Fuga de datos entre centros | Crítico | Media | `organization_id` obligatorio, validación por request, tests cross-org, pentest |
| Bypass de consentimiento en un endpoint nuevo | Crítico | Media | Guard central, tests de contrato, revisión obligatoria, checklist |
| Baja comprensión del consentimiento | Alto | Media | Test con pacientes, lenguaje claro, vista previa, iteración |
| Coerción del terapeuta | Alto | Media | Revocación privada, sin motivo, sin presión, auditoría |
| Baja adopción del panel | Alto | Media | Diseño con terapeutas, flujos reales, capacitación, métricas |
| Fatiga de consentimiento | Medio | Alta | Divulgación progresiva, defaults claros, no pedir todo de una vez |
| Alerta de crisis no atendida | Crítico | Media | SLA, guardia, escalamiento, protocolo, no prometer 24/7 sin cobertura |
| Responsabilidad legal por crisis | Crítico | Media | Legal, protocolo, consentimiento, seguros, documentación |
| Resumen de IA incorrecto | Alto | Media | Citas, revisión humana, etiqueta, no diagnóstico, fase posterior |
| Admin del centro accede a contenido | Alto | Media | Rol sin contenido clínico, auditoría, separación de funciones |
| Exportación filtrada | Alto | Media | Watermark, enlace temporal, rate limit, auditoría |
| Credenciales comprometidas | Alto | Media | MFA, lockout, sesión corta, detección de anomalías |
| Deriva de esquema | Medio | Alta | Migraciones reproducibles, CI, baseline |
| Cambio normativo | Medio | Alta | Workstream legal, DPO, revisión trimestral |
| Alcance excesivo | Alto | Alta | Fases, MVP acotado, gates |
| Dependencia de un solo dev | Alto | Media | Documentación, tests, revisión externa |

---

## 19. Plan de piloto

### 19.1 Diseño

- **Un centro** de salud mental con 5–8 terapeutas.
- **30–50 pacientes** adultos, estables, con capacidad de consentir.
- **8 semanas** de uso real.
- Formación inicial de 2 sesiones y office hours semanales.
- Canal de soporte dedicado.
- Revisión semanal de métricas y incidentes.

### 19.2 Criterios de inclusión

- Pacientes adultos.
- Con smartphone Android compatible.
- En tratamiento activo en el centro.
- Capacidad de consentir.
- Excluir menores, tutela legal y crisis aguda no estabilizada.

### 19.3 Formación

- Terapeutas: flujo, consentimiento, estados vacíos, alertas, exportación, privacidad.
- Pacientes: video corto + guía + explicación en la app.
- Administradores: invitaciones, asignaciones, auditoría, offboarding.
- Soporte: runbook de incidentes y escalamiento.

### 19.4 Métricas de éxito

| Métrica | Meta propuesta |
|---|---|
| Pacientes que comparten al menos una categoría | ≥70% |
| Comprensión del consentimiento | ≥90% |
| Terapeutas que usan el panel semanalmente | ≥80% |
| Tiempo medio de revisión de paciente | <5 min |
| Alertas reconocidas en SLA | ≥95% |
| Accesos no autorizados | 0 |
| Incidentes de privacidad | 0 críticos |
| SUS terapeutas | ≥70 |
| Confianza de pacientes | ≥4/5 |
| Revocaciones sin fricción | 100% efectivas en <1 min |

### 19.5 Go/no-go

**Go** si:

- 0 accesos no autorizados.
- 0 incidentes críticos de privacidad.
- ≥70% de consentimiento al menos en una categoría.
- ≥80% de uso semanal de terapeutas.
- Alertas dentro de SLA.
- DPIA aprobada.
- Pentest sin críticos/altos abiertos.
- Soporte y runbooks probados.

**No-go** si:

- Hay una fuga cross-tenant.
- No se puede garantizar la revocación inmediata.
- El protocolo de crisis no está operativo.
- El consentimiento no se comprende.
- El centro no puede cumplir sus obligaciones legales.

---

## 20. Decisiones abiertas

| # | Decisión | Recomendación | Responsable |
|---|---|---|---|
| 1 | ¿El centro es responsable y la plataforma encargada? | Sí, con DPA | Legal |
| 2 | ¿Consentimiento por organización o por profesional? | Organización por defecto, opción de restringir a profesional | Producto + clínico |
| 3 | ¿Alertas de crisis en MVP? | Sí, con protocolo y cobertura; si no hay cobertura, no prometer monitoreo | Clínico + legal |
| 4 | ¿Transcripción del chatbot en MVP? | No; solo resumen temático en fase 2 | Producto + legal |
| 5 | ¿Admin del centro ve contenido clínico? | No | Seguridad |
| 6 | ¿Notas del terapeuta visibles al paciente? | Metadatos sí; contenido según política y solicitud | Legal + clínico |
| 7 | ¿Menores? | Fuera del MVP | Legal |
| 8 | ¿Resumen IA? | Fase 3, con citas y revisión humana | Clínico + producto |
| 9 | ¿Retención? | 5 años tras egreso, ajustar a normativa | Legal + centro |
| 10 | ¿SSO para centros? | Fase 3 | Producto |
| 11 | ¿Integración FHIR? | Fase 4 | Producto |
| 12 | ¿App móvil para terapeutas? | No en MVP; web responsive | Producto |
| 13 | ¿Multi-centro para un paciente? | Sí, con consentimientos separados por centro | Producto |
| 14 | ¿Break-glass si el paciente no aceptó protocolo? | Prohibido; derivar a emergencias | Legal + clínico |
| 15 | ¿Marca blanca por centro? | Fase 2, solo logo/colores | Producto |

---

## 21. Próximos pasos (2 semanas)

1. **Workshop con el centro piloto:** validar flujos, roles, protocolo de crisis y expectativas.
2. **Entrevistas:** 5–8 terapeutas y 5–8 pacientes; test de comprensión de consentimiento.
3. **Memorándum legal:** roles responsable/encargado, Ley 21.719, DPIA, menores, retención.
4. **Congelar y corregir** la implementación actual de consentimiento; no construir sobre ella.
5. **Definir taxonomía v1** y matriz de consentimiento con el equipo clínico.
6. **Threat model** y revisión de seguridad con el DPO/DevOps.
7. **Prototipo clickable** del panel y de la pantalla móvil; test con usuarios.
8. **Baseline de migraciones** y pipeline de CI con PostgreSQL efímero.
9. **Spikes técnicos:** BFF con cookies, guard de consentimiento, auditoría append-only.
10. **Backlog estimado** y decisión de equipo/fecha de inicio.
11. **Seleccionar centro piloto** y firmar carta de intención.
12. **Definir criterios go/no-go** con dirección clínica y legal.

---

## Apéndice A. Matriz rápida de permisos

| Acción | Paciente | Terapeuta | Clinical lead | Org admin | Auditor | Platform admin |
|---|---|---|---|---|---|---|
| Ver sus datos | ✅ | — | — | — | — | — |
| Ver datos de paciente asignado | — | ✅ si consentido | ✅ si consentido | ❌ | ❌ | ❌ |
| Ver lista de pacientes del centro | — | Solo asignados | ✅ | ✅ (metadatos) | ✅ (metadatos) | ❌ |
| Crear/editar consentimiento | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Revocar consentimiento | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver estado de consentimiento | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver notas clínicas | ❌ | ✅ autor | ✅ | ❌ | ❌ | ❌ |
| Ver auditoría de accesos | ✅ propios | ✅ propios | ✅ del equipo | ✅ agregada | ✅ | ❌ |
| Invitar terapeutas | — | ❌ | ✅ | ✅ | ❌ | ❌ |
| Asignar pacientes | — | ❌ | ✅ | ✅ | ❌ | ❌ |
| Crear organización | — | — | — | — | — | ✅ |
| Break-glass | — | ✅ con justificación | ✅ con justificación | ❌ | ❌ | ❌ |

---

## Apéndice B. Glosario

- **Consentimiento granular:** permiso separado por categoría y nivel de detalle.
- **Categoría:** conjunto de datos clínicos con la misma sensibilidad y finalidad.
- **Nivel de detalle:** agregado, resumen, detallado o completo.
- **Grantee:** destinatario del consentimiento (organización o profesional).
- **Break-glass:** acceso excepcional y auditado para riesgo inminente.
- **DPA:** acuerdo de encargo de tratamiento de datos.
- **DPIA:** evaluación de impacto en protección de datos.
- **PHI:** información de salud protegida.
- **RLS:** Row-Level Security de PostgreSQL.
- **BFF:** Backend for Frontend.
- **SLA:** acuerdo de nivel de servicio.
- **Tenant:** organización aislada dentro de la plataforma.

---

## Apéndice C. Configuración y feature flags

| Variable | Uso |
|---|---|
| `THERAPIST_PANEL_ENABLED` | Activa el panel por organización |
| `CRISIS_ALERTS_ENABLED` | Activa el protocolo de alertas |
| `CHATBOT_SUMMARY_ENABLED` | Habilita resumen de chatbot |
| `CHATBOT_TRANSCRIPT_ENABLED` | Habilita transcripción (fase 2) |
| `AI_CLINICAL_SUMMARY_ENABLED` | Habilita resumen IA (fase 3) |
| `ORG_ADMIN_CLINICAL_ACCESS` | Debe permanecer en `false` |
| `WEB_APP_URL` | URL pública del panel |
| `API_INTERNAL_URL` | URL interna de la API para el BFF |
| `SESSION_SECRET` | Firma de cookies de sesión |
| `MFA_ISSUER` | Nombre mostrado en TOTP |
| `SMTP_*` | Invitaciones y alertas |
| `SMS_*` | Escalamiento de crisis, si aplica |
| `DEFAULT_ORG_TIMEZONE` | `America/Santiago` |
| `EXPORT_URL_TTL_MINUTES` | 1440 (24 h) |
| `ACCESS_LOG_RETENTION_DAYS` | Según política legal |

---

## Apéndice D. Checklist de revisión antes de cada release

- [ ] ¿El endpoint nuevo usa `ClinicalAccessService`?
- [ ] ¿Hay tests positivos y negativos de autorización?
- [ ] ¿Se auditó la lectura/denegación?
- [ ] ¿La respuesta excluye campos no consentidos?
- [ ] ¿El frontend muestra “no compartido” sin filtrar información?
- [ ] ¿Hay datos clínicos en logs, analytics o URLs?
- [ ] ¿La migración es reproducible?
- [ ] ¿La revocación se refleja de inmediato?
- [ ] ¿El estado vacío es neutral?
- [ ] ¿La pantalla pasa axe?
- [ ] ¿El texto de consentimiento está versionado?
- [ ] ¿El flujo funciona sin conexión de forma explícita?
- [ ] ¿El admin del centro sigue sin acceso clínico?
- [ ] ¿El break-glass requiere justificación y notifica?
- [ ] ¿El export tiene watermark y expiración?
- [ ] ¿Se actualizó la documentación de API?
