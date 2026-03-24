# Especificaciones Técnicas - KogniRecovery - App de Acompañamiento en Adicciones

## 1. Arquitectura General

### Diagrama de Alto Nivel

```
┌─────────────────┐    ┌─────────────────────────────────────────────┐
│   Clientes      │    │                                             │
│ (Mobile App)    │◄──►│         API Gateway (REST/WebSocket)       │
│  iOS/Android    │    │                                             │
│  React Native   │    └─────────────────┬─────────────────────────┘
│  o Flutter      │                      │
└─────────────────┘                      │
                                         │
                    ┌────────────────────▼──────────────────────┐
                    │           Backend Services                 │
                    │  (Node.js + TypeScript / Python FastAPI)  │
                    ├──────────────────────────────────────────┤
                    │ • Auth Service                             │
                    │ • User Profile Service                     │
                    │ • Chatbot Service (IA)                     │
                    │ • Emergency Protocol Service               │
                    │ • Notification Service                     │
                    │ • Data Analytics Service                   │
                    └─────────────────┬─────────────────────────┘
                                      │
                    ┌─────────────────▼─────────────────────────┐
                    │              Database                     │
                    │   PostgreSQL (cifrado en reposo)          │
                    │   + Redis para cache/sesiones             │
                    └─────────────────┬─────────────────────────┘
                                      │
                    ┌─────────────────▼─────────────────────────┐
                    │          External Services                │
                    │  • LLM API (OpenAI/Claude/Step)           │
                    │  • SMS/Twilio para emergencias            │
                    │  911/112 API (ubicación)                  │
                    │  • Email (SendGrid) para invitaciones     │
                    └───────────────────────────────────────────┘
```

---

## 2. Stack Tecnológico Recomendado

### Frontend Móvil
- **React Native** (iOS + Android) con Expo para despliegue rápido
  - Ventaja: un solo código base, acceso a APIs nativas
  - Alternativa: Flutter (Dart) si se prefiere rendimiento
- **Estado global**: Redux Toolkit o Zustand
- **Navegación**: React Navigation v6
- **UI Kit**: React Native Paper (Material Design) o NativeBase
- **Offline-first**: WatermelonDB o Realm para almacenamiento local
- **Cifrado local**: react-native-sensitive-info o expo-secure-store
- **Notificaciones push**: expo-notifications + Firebase Cloud Messaging (FCM) / Apple Push Notification Service (APNS)
- **Mapas**: react-native-maps para directorio de recursos locales
- **Gráficos**: react-native-chart-kit para dashboard
- **Video/Audio**: expo-av para contenido psicoeducativo

### Backend
- **Node.js + TypeScript** con Express o Fastify
  - Alternativa: Python FastAPI (mejor para integración con modelos de IA)
- **Autenticación**: JWT + refresh tokens, 2FA opcional
- **Validación**: Joi o Zod
- **Logging**: Winston + Morgan
- **Monitorización**: Prometheus + Grafana o Sentry

### Base de Datos
- **PostgreSQL** (cifrado en reposo con pgcrypto)
  - Tablas principales: users, profiles, checkins, messages, emergency_contacts, shared_data, notifications
- **Redis** para cache de sesiones y rate limiting
- **Backups**: diarios automatizados, cifrados, retention 30 días

### IA / Chatbot
- **LLM API**: OpenAI GPT-4o / Anthropic Claude / StepFun Step (según disponibilidad y costo)
- **Prompt management**: sistema de plantillas por perfil (ver PROMPTS_POR_PERFIL.md)
- **Vector store** (opcional): Pinecone o pgvector para retrieval de psicoeducación específica
- **Moderación**: OpenAI moderation endpoint o similar para filtrar contenido peligroso
- **RAG** (Retrieval-Augmented Generation): para acceder a knowledge base de líneas de crisis, recursos locales

### Infraestructura y DevOps
- **Hosting**: VPS (DigitalOcean, Linode) o cloud (AWS/GCP)
- **Containerización**: Docker + docker-compose
- **Orquestación**: Kubernetes (si escala) o simple PM2
- **CI/CD**: GitHub Actions o GitLab CI
- **Dominio + SSL**: Let's Encrypt gratuito
- **CDN**: Cloudflare para assets estáticos

### Monitorización y Seguridad
- **Firewall**: UFW (Linux) + fail2ban
- **Auditoría**: logs de acceso, detección de intrusiones (OSSEC)
- **Vulnerabilidades**: dependabot, escaneo Snyk
- **Backup offsite**: cifrado y almacenamiento externo (Backblaze B2)

---

## 3. APIs y Endpoints Principales

### 3.1 Auth
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/2fa/enable
POST /api/v1/auth/2fa/verify
```

### 3.2 Users
```
GET  /api/v1/users/me           → perfil propio
PUT  /api/v1/users/me           → actualizar perfil
GET  /api/v1/users/me/profile   → obtener perfil asignado
POST /api/v1/users/me/emergency-contacts
PUT  /api/v1/users/me/emergency-contacts/:id
DELETE /api/v1/users/me/emergency-contacts/:id
POST /api/v1/users/me/recover   → solicitar recuperación cuenta (email)
```

### 3.3 Onboarding
```
POST /api/v1/onboarding/complete   → marcar onboarding como completado
GET  /api/v1/onboarding/status    → si incomplete, devolver paso faltante
POST /api/v1/onboarding/profile-assign  → (interno) asignar perfil automáticamente
```

### 3.4 Check-ins (Registros diarios)
```
POST /api/v1/checkins            → crear check-in diario (estado, consumo, cravings)
GET  /api/v1/checkins?date=...   → obtener check-in de fecha
GET  /api/v1/checkins/stats      → estadísticas (7 días, 30 días)
PUT  /api/v1/checkins/:id        → editar (límite: 24h)
```

### 3.5 Chatbot (Conversaciones)
```
WebSocket /ws/chat               → conexión en tiempo real
POST /api/v1/chat/messages       → enviar mensaje (no-WS fallback)
GET  /api/v1/chat/history        → historial de conversación
DELETE /api/v1/chat/history      → borrar historial (solicitud usuario)
POST /api/v1/chat/emergency      → activar protocolo de emergencia manual
```

### 3.6 Emergency
```
POST /api/v1/emergency/trigger   → activar protocolo (automático o manual)
GET  /api/v1/emergency/contacts  → obtener contactos de emergencia
POST /api/v1/emergency/notify    → enviar notificación a contacto (interno)
POST /api/v1/emergency/location  → compartir ubicación (si autorizado)
```

### 3.7 Sharing (Compartir con familiar)
```
POST /api/v1/sharing/invite      → enviar invitación a familiar (email/SMS)
GET  /api/v1/sharing/status      → estado de vinculación
PUT  /api/v1/sharing/permissions → actualizar qué datos se comparten
POST /api/v1/sharing/revoke      → revocar acceso
```

### 3.8 Notifications
```
POST /api/v1/notifications/send  → enviar notificación push (interno)
GET  /api/v1/notifications/history → historial
PUT  /api/v1/notifications/prefs → preferencias (horario silencio)
```

### 3.9 Resources (Psicoeducación, líneas de crisis)
```
GET  /api/v1/resources/education?topic=...  → contenido educativo
GET  /api/v1/resources/crisis-lines?country=... → líneas locales
GET  /api/v1/resources/emergency-numbers → 911, etc.
```

### 3.10 Analytics (Métricas, solo admin)
```
GET  /api/v1/analytics/users     → metrics de retención, engagement
GET  /api/v1/analytics/risks     → detección de riesgos agregados (sin PII)
GET  /api/v1/analytics/checkins  → datos anónimos de consumo
```

---

## 4. Modelo de Datos (PostgreSQL)

### Tabla `users`
```sql
 CREATE TABLE users (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   email VARCHAR(320) UNIQUE NOT NULL,
   phone VARCHAR(20) UNIQUE,
   password_hash VARCHAR(255) NOT NULL,
   role VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient','family','professional')),
   status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
   onboarding_completed BOOLEAN DEFAULT FALSE,
   profile_type VARCHAR(50), -- referencia a perfil (lucas_adolescente, etc.)
   risk_level VARCHAR(20), -- bajo, medio, alto, critico
   two_factor_enabled BOOLEAN DEFAULT FALSE,
   two_factor_secret VARCHAR(255),
   last_login TIMESTAMPTZ,
   created_at TIMESTAMPTZ DEFAULT NOW(),
   updated_at TIMESTAMPTZ DEFAULT NOW()
 );
```

### Tabla `profiles` (detalle específico por usuario)
```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age INTEGER NOT NULL,
  gender VARCHAR(50),
  country CHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
  main_substance VARCHAR(50) NOT NULL,
  other_substances JSONB, -- array de strings
  consumption_amount VARCHAR(100), -- descripción aproximada (ej: "2-3 copas/día")
  consumption_duration VARCHAR(50), -- "<6 meses", "1-3 años", etc.
  stage_of_change VARCHAR(50) NOT NULL, -- precontemplacion, contemplacion, etc.
  has_mental_health_diagnosis BOOLEAN DEFAULT FALSE,
  mental_health_details JSONB,
  has_trauma_history BOOLEAN DEFAULT FALSE,
  has_therapeutic_support BOOLEAN DEFAULT FALSE,
  therapist_contact JSONB, -- {name, phone, email}
  settings JSONB, -- preferencias UI, notificaciones, etc.
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla `checkins`
```sql
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  mood_tags JSONB, -- array de palabras clave: "ansiedad", "soledad", etc.
  consumed BOOLEAN DEFAULT FALSE,
  substance_used VARCHAR(50),
  consumption_amount VARCHAR(100),
  craving_intensity INTEGER CHECK (craving_intensity >= 1 AND craving_intensity <= 10),
  recovery_activities JSONB, -- array: "terapia", "grupo", "ejercicio"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);
```

### Tabla `chat_messages`
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  tokens_used INTEGER,
  risk_level_detected VARCHAR(20), -- verde, amarillo, naranja, rojo
  emergency_triggered BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- {intent, techniques_used, etc.}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Índice para búsqueda rápida por usuario y fecha
CREATE INDEX idx_chat_messages_user_created ON chat_messages(user_id, created_at DESC);
```

### Tabla `emergency_contacts`
```sql
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(320),
  relationship VARCHAR(100),
  notify_on_risk ENUM('none','low','medium','high','all') DEFAULT 'high',
  notify_on_crisis BOOLEAN DEFAULT TRUE,
  can_share_location BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla `sharing_invitations` (para vincular familiar)
```sql
CREATE TABLE sharing_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES users(id) ON DELETE SET NULL, -- se llena cuando familiar acepta
  token VARCHAR(64) UNIQUE NOT NULL, -- para enlace de invitación
  status ENUM('pending','accepted','rejected','revoked') DEFAULT 'pending',
  permissions JSONB NOT NULL DEFAULT '{}', -- {mood: true, achievements: true, ...}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ --通常 7 días
);
```

### Tabla `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'checkin_reminder', 'emergency_alert', 'achievement', etc.
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- datos extra (ej: {checkin_id: ..., emergency_level: ...})
  delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla `resources` (contenido psicoeducativo)
```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content_type ENUM('article','video','audio','exercise') NOT NULL,
  language VARCHAR(10) DEFAULT 'es',
  target_profiles JSONB, -- array de perfiles a los que aplica
  tags JSONB, -- ["cannabis","adolescentes","ansiedad"]
  content TEXT, -- markdown o texto plano
  media_url VARCHAR(500), -- para videos/audios
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Seguridad y Privacidad

### 5.1 Cifrado

- **En tránsito**: TLS 1.3 (HTTPS) obligatorio para todas las comunicaciones
- **En reposo**:
  - Base de datos: cifrado a nivel de disco (AWS RDS encryption o similar)
  - Campos sensibles (teléfonos, emails) en BD: cifrados con claves AES-256 (usar pgcrypto)
  - Archivos subidos (ej: audio): cifrados en storage
- **En cliente**: almacenamiento local con react-native-sensitive-info (Keychain/Keystore)

### 5.2 Autenticación y Autorización

- JWT con expiración corta (15 min) + refresh token (7 días)
- Refresh tokens almacenados en BD, asociados a dispositivo
- Rate limiting por IP y por usuario (ej: 100 req/min)
- 2FA opcional (TOTP via Google Authenticator) para usuarios que quieran mayor seguridad

### 5.3 Privacidad de Datos de Salud

- **Regulaciones**: Diseñar para cumplir potencialmente con HIPAA (EEUU) o GDPR (Europa) aunque la app se lance en LATAM inicialmente.
- **Consentimiento informado**: registrar en logs cuándo usuario acepta términos y políticas
- **Derecho al olvido**: endpoint para eliminar cuenta y todos sus datos (incluyendo logs anonimizados en 30 días)
- **Data minimization**: solo recopilar datos estrictamente necesarios
- **Anonimización para analytics**: separar datos personales de métricas agregadas

### 5.4 Seguridad de API

- Validación estricta de entrada (Joi/Zod)
- Sanitización de contenido (XSS prevention)
- CSRF tokens (aunque en móvil no es crítico)
- Headers de seguridad: CSP, HSTS, X-Frame-Options
- Logging de errores sin exponer datos sensibles

### 5.5 Protección contra Abuso

- Moderación automática de mensajes de chat (OpenAI moderation)
- Detección de self-harm/suicide language → activar protocolos de emergencia
- Rate limit para mensajes de chat (evitar spam)
- Bloqueo de cuentas por comportamiento malicioso (reportes multiples)

### 5.6 Backup y Recuperación

- Backups automáticos diarios de BD (pg_dump cifrado)
- Backups retenidos por 30 días
- Retención de logs por 90 días (para auditoría)
- Procedimiento documentado de restore en caso de incidente

---

## 6. Escalabilidad y Rendimiento

### 6.1 Carga Esperada (Fase 1)

- Usuarios activos mensuales (MAU): 500 - 1000
- Check-ins diarios: ~2000
- Mensajes de chat: ~5000/día
- Notificaciones push: ~2000/día

### 6.2 Escalabilidad

- **Stateless backend**: correr múltiples instancias detrás de balanceador (PM2 cluster o Kubernetes)
- **Cache**: Redis para sesiones, respuestas de LLM frecuentemente idénticas, recursos estáticos
- **Base de datos**: connection pooling (pgbouncer), índices adecuados
- **CDN**: para assets estáticos (imágenes, videos educativos)

### 6.3 Rendimiento

- Latencia objetivo API: <200ms para endpoints simples
- Latencia chatbot: <2s total (útil para conversaciones)
- Tiempo de carga app fría: <5s en 3G
- Notificaciones push: entrega <5s

---

## 7. Integraciones Externas

### 7.1 LLM (Large Language Model)

- Proveedor: OpenAI GPT-4o (balance calidad-costo) o Claude (más seguro)
- Rate limiting: 30 RPM por usuario (para control de costo)
- Sistema de prompts por perfil (PROMPTS_POR_PERFIL.md)
- Cache de respuestas idénticas (Redis, 24h TTL) para ahorrar costos
- Moderación: OpenAI moderation endpoint antes de mostrar respuesta

### 7.2 SMS / Comunicaciones

- **Twilio** para SMS de emergencia e invitaciones
- Costo considerado: ~$0.01-0.05 por SMS
- Webhook para confirmación de entrega

### 7.3 Líneas de Crisis

- Directorio estático (JSON) actualizable manualmente por admin
- Botones de llamada directa: `tel:` links en móvil
- Para 988 (EEUU) y equivalentes locales

### 7.4 Mapas y Recursos Locales

- Google Maps API o Mapbox para mostrar grupos AA, clínicas
- Geocoding inverso para obtener ciudad desde GPS (solo en emergencia)
- Considerar OpenStreetMap para reducir costos

### 7.5 Wearables (Opcional Fase 2)

- Apple HealthKit (iOS) y Google Fit (Android)
- Leer: sueño, frecuencia cardíaca, pasos
- Usar para correlacionar consumo con métricas (ej: alcohol → sueño fragmentado)

---

## 8. Monitorización y Alertas

### 8.1 Métricas Clave

- **Sistema**: CPU, memoria, disco, red
- **API**: latencia P95, tasa de error, throughput
- **BD**: conexiones activas, tamaño, deadlocks
- **LLM**: costos diarios, tokens usados, errores
- **App**: usuarios activos, retención D1/D7/D30, checkins completados

### 8.2 Logging

- Formato estructurado (JSON) con campos: timestamp, level, message, userId (cuando aplica), riskLevel
- Centralización: Elastic Stack (ELK) o Loki
- Retención: 90 días

### 8.3 Alertas

- **Críticas**: API caída, BD no accesible, costo LLM > X en 24h
- **Advertencia**: Errores 5xx > 1%, latencia P95 > 1s
- **Seguridad**: intentos de login fallidos masivos, violación de rate limit
- Envío por email/Slack a equipo técnico

---

## 9. Despliegue y CI/CD

### 9.1 Entornos

- **Desarrollo**: local (Docker compose)
- **Staging**: servidor de prueba (similar a producción)
- **Producción**: VPS o cloud con redundancy

### 9.2 CI/CD Pipeline (GitHub Actions)

1. **Push a main**:
   - Ejecutar tests unitarios e integración
   - Linting (ESLint/Prettier)
   - Build Docker image
   - Push a registry
   - Deploy a staging
   - Esperar approval manual

2. **Manual approval** → Deploy a producción (blue-green o rolling update)

3. **Post-deploy**:
   - Run smoke tests
   - Notificar canal Slack

### 9.3 Secrets Management

- Nunca commitear credenciales
- Usar variables de entorno o HashiCorp Vault
- Rotar claves periódicamente

---

## 10. Consideraciones de Compliance y Ética

### 10.1 Política de Privacidad

- Explicar claramente qué datos se recogen, cómo se usan, quién los ve
- Especificar retención: datos personales se borran tras cuenta eliminada; logs anónimos se mantienen 90 días
- Compartición con terceros: solo LLM API (OpenAI) bajo API agreement; no vender datos
- Derechos del usuario: acceso, rectificación, eliminación

### 10.2 Términos de Servicio

- Usar solo para apoyo, no para emergencias médicas
- Descargo de responsabilidad: "No somos terapeutas"
- Restricciones de uso: no usar para acosar, dañar, etc.

### 10.3 Reportes de Incidentes

- Procedimiento interno para responder a:
  - Brecha de datos
  - Usuario en crisis que resultó en daño
  - Error de la app que causa confusión
- Notificación a autoridades si requiere (según legislación local)

---

## 11. Roadmap Técnico

### Fase 1 (MVP, 3-4 meses) de **KogniRecovery**
- Auth básico (email/password)
- Onboarding completo
- Chatbot con prompts simples (base) + 3 perfiles (Diego, Lucas, Camila)
- Checkins diarios
- Configuración de emergencia (contactos)
- Dashboard simple
- Notificaciones push recordatorios
- Despliegue en VPS simple

### Fase 2 (6 meses)
- 7 perfiles completos (PROMPTS_POR_PERFIL.md)
- Escenarios conversacionales avanzados (ESCENARIOS_CONVERSACIONALES.md)
- Integración wearables (HealthKit/Google Fit)
- Gamificación (puntos, streaks)
- Comunidad anónima (foros moderados)
- APK/IPA distribuibles

### Fase 3 (12 meses)
- Integración con terapeutas (API de scheduling)
- Reportes para profesionales (PDF/CSV)
- Modo familiar mejorado (dashboard enriquecido)
- Telemedicina integrada (vídeo llamadas)
- Soporte multiidioma (inglés, portugués)

### Fase 4 (Escalado)
- Microservicios separados (chat, checkins, notifications)
- Kubernetes en cloud
- ML personalizado (fine-tuning de modelo con datos anónimos)
- API pública para investigadores (datos agregados)

---

## 12. Supuestos y Riesgos Técnicos

### 12.1 Supuestos

- Usuarios tienen smartphone (Android/iOS) con acceso a internet (aunque sea intermitente en zonas rurales)
- Pueden pagar por LLM API (costo ~$0.002-0.02 por conversación) o conseguir subsidio
- Equipo de desarrollo (2-3 personas) puede mantener la app por 2+ años

### 12.2 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|----------|------------|
| Costo de LLM se dispara | Media | Alto | Implementar cache, límites de tokens, usar modelos más baratos (Step, Claude Haiku) |
| Brecha de datos de salud | Baja | Crítico | Cifrado, auditorías, bug bounty |
| Regulaciones cambian (HIPAA) | Media | Alto | Diseñarflexible para cumplir; consultar abogado |
| Baja adopción por estigma | Alta | Medio | Marketing careful, tono no-clínico, partnering con ONGs |
| Dependencia de APIs externas (Twilio, LLM) | Media | Alto | Fallbacks, múltiples proveedores opcionales |

---

*Documento vivo. Se actualizará con decisiones de arquitectura durante desarrollo.*

