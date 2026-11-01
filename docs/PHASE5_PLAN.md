# Plan de fases posteriores a Fase 4 — NUMA/KogniRecovery

## Matriz de hallazgos no resueltos

| ID | Severidad | Estado actual | Evidencia/relación | Dependencias | Riesgo residual |
|---|---|---|---|---|---|
| SEC-001 | Crítica | No resuelto | docker-compose con secretos hardcodeados | Infra | Acceso total a BD/tokens |
| SEC-002 | Crítica | No resuelto | salt estático PBKDF2 | Backend | Clave de encriptación débil |
| SEC-003 | Crítica | No resuelto | datos de salud en texto plano | Backend | Confidencialidad en reposo |
| PRIV-001 | Crítica | No resuelto | envío a LLMs sin anonimización/BAA | Backend/servicios | Fuga de datos sensibles |
| PRIV-003 | Crítica | No resuelto | compartición familiar sin permisos granulares | Backend/frontend | Exposición de datos |
| PRIV-004 | Crítica | No resuelto | TTS/Tavily/Neo4j sin DPA | Servicios | Terceros sin contrato |
| SEC-004 | Crítica | No resuelto | XSS en mensajes/campos libres | Backend/frontend | Ejecución de payload |
| SEC-005 | Alta | No resuelto | refresh tokens en texto plano | Backend | Robo de sesión |
| SEC-006 | Alta | No resuelto | sin detección de reutilización | Backend | Token theft silencioso |
| SEC-007 | Alta | No resuelto | CORS wildcard | Infra | CSRF/robo tokens |
| SEC-008 | Alta | No resuelto | SSL rejectUnauthorized false | Backend | MitM |
| SEC-009 | Alta | No resuelto | BD expuestas al host | Infra | Acceso directo |
| SEC-010 | Alta | No resuelto | securityMiddleware no aplicado | Backend | Sin headers de seguridad |
| SEC-011 | Alta | No resuelto | rate limiting no aplicado | Backend | Abuso/DoS |
| SEC-012 | Alta | No resuelto | validación insuficiente en endpoints | Backend | Inyección/abuso |
| SEC-013 | Alta | Resuelto (Fase 2) | IDOR/BOLA corregido | Backend | Regresión a vigilar |
| SEC-014 | Alta | No resuelto | logging de credenciales frontend | Frontend | Robo de credenciales |
| SEC-015 | Alta | No resuelto | encryptUserSensitiveData sin uso | Backend | Encriptación no aplicada |
| PRIV-005 | Alta | Parcial (Fase 3) | eliminación Neo4j corregida; persistencia general sigue | Backend | Datos residuales |
| PRIV-006 | Alta | No resuelto | sin breach notification | Organizacional | Incumplimiento GDPR |
| PRIV-007 | Alta | No resuelto | tabla user_push_tokens inexistente | Backend | Notificaciones fallan |
| SEC-016 | Media | No resuelto | JWT expiración 7 días por defecto | Backend | Tokens larga vida |
| SEC-017 | Media | No resuelto | 2FA sin implementar | Backend/frontend | Cuentas privilegiadas |
| SEC-018 | Media | No resuelto | inconsistencia password/password_hash | Backend | Auth inconsistente |
| PRIV-008 | Media | No resuelto | retención sin jobs | Backend | Datos indefinidos |
| PRIV-009 | Media | No resuelto | logs sensibles | Backend/frontend | Fuga en logs |
| PRIV-010 | Media | No resuelto | sin DPIA | Organizacional | Incumplimiento |
| PRIV-011 | Media | No resuelto | sin auto-logout | Frontend | Sesiones abiertas |
| SEC-019 | Media | No resuelto | endpoint retención sin auth | Backend | Exposición de políticas |
| SEC-020 | Media | No resuelto | tokens en memoria inconsistente | Frontend | Robo de token |
| PRIV-012 | Media | No resuelto | sin política de privacidad formal | Legal | Incumplimiento |
| SEC-021 | Media | No resuelto | llm_api_key sin encriptar | Backend | Fuga de secretos |
| SEC-022 | Media | No resuelto | FKs sin verificación | Backend | Integridad |
| PRIV-013 | Media | No resuelto | sin certificaciones | Organizacional | Confianza/compliance |
| SEC-023 | Media | No resuelto | pgAdmin admin/admin expuesto | Infra | Acceso admin |
| PRIV-014 | Media | No resuelto | sin re-consentimiento | Backend/frontend | Consentimiento desactualizado |
| SEC-024 | Media | No resuelto | sin certificate pinning | Frontend | MitM móvil |

## Propuesta de secuencia de fases (solo planificación)

1. **Fase 5 — Configuración e infraestructura segura**: SEC-001, SEC-002, SEC-007, SEC-008, SEC-009, SEC-010, SEC-011, SEC-023.
2. **Fase 6 — Encriptación de datos sensibles en reposo**: SEC-003, SEC-015, SEC-021.
3. **Fase 7 — Validación, sanitización y seguridad HTTP/frontend**: SEC-004, SEC-012, SEC-014, SEC-016, SEC-019, SEC-020, SEC-024.
4. **Fase 8 — Autenticación y gestión de sesiones**: SEC-005, SEC-006, SEC-017, SEC-018, SEC-022.
5. **Fase 9 — Privacidad, compartición y terceros**: PRIV-001, PRIV-003, PRIV-004, PRIV-005 (completar), PRIV-008, PRIV-009, PRIV-014.
6. **Fase 10 — Legal, organizacional y certificación**: PRIV-006, PRIV-007, PRIV-010, PRIV-012, PRIV-013.

## Decisiones pendientes
- Prioridad entre encriptación en reposo y secretos de infraestructura.
- Alcance de anonimización para LLMs (local vs servicio).
- Granularidad exacta de compartición familiar.
- Jurisdicciones objetivo para DPAs/certificaciones.

Este plan no implementa cambios. Requiere aprobación explícita antes de crear ramas o modificar archivos.
