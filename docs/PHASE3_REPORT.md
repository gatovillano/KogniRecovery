# Fase 3 — Ciclo de vida de cuentas y derecho al olvido

## A. Diagnóstico inicial
- Rama: `fix/phase3-account-lifecycle`
- HEAD base: `af3eb1a` (merge PR #3, Fase 2 integrada)
- Estado del árbol: limpio antes de cambios.
- Fase 2 confirmada integrada en `main`.
- Vulnerabilidades confirmadas: A01, C05, A02.

## B. Implementación
### A01
- `authenticate` verifica existencia y estado activo en servidor (no confía en JWT).
- `requireActiveAccount` consulta estado real de la cuenta.
- `refreshTokens` rechaza cuentas no activas con HTTP 401 y revoca tokens.
- `login` y `verifyMfaAndLogin` rechazan cuentas no activas.
- `suspendAccount` y `reactivateAccount` centralizan suspensión/reactivación y revocación.

### C05
- `deleteUserFromNeo4j` ahora elimina CheckIns, Cravings, Conversaciones, Mensajes, Alertas y desvincula Atributos/Sustancias/Medicamentos antes de borrar `:Usuario`.
- Se detecta driver no disponible.

### A02
- `executeDataDeletion` inventaria y elimina memoria contextual, intentos de login, tokens de reset, secretos MFA/LLM, relaciones organizacionales (marcadas, no borradas indiscriminadamente) y demás datos personales/clínicos operativos.
- Secretos se limpian en la fila de usuario.
- `clinical_notes`, `clinical_access_log` y `data_deletion_requests` se conservan por trazabilidad legal/auditoría.
- Fallos parciales se detectan y no se reportan como éxito (`deleteAccountCompletely`).

## C. Archivos modificados
- `server/src/middleware/auth.ts`
- `server/src/services/auth.service.ts`
- `server/src/services/privacy.service.ts`
- `server/src/models/user.model.ts`
- `server/src/scripts/migrate.ts`
- `server/migrations/012_phase3_account_lifecycle.sql`
- `server/tests/phase3-account-lifecycle.test.ts`

## D. Política de eliminación
- Eliminados: datos personales y clínicos operativos, tokens, memoria contextual, secretos.
- Anonimizados: fila de usuario (`status='deleted'`, email anonimizado, PII nula).
- Conservados: `clinical_notes`, `clinical_access_log`, `data_deletion_requests` (trazabilidad legal/auditoría).
- Relaciones organizacionales: marcadas como removidas/finalizadas, no borradas indiscriminadamente.
- Decisiones pendientes: retención exacta de notas clínicas y alertas según normativa local; confirmar con responsable del proyecto.

## E. Pruebas
- `tests/phase3-account-lifecycle.test.ts`: 26/26 OK.
- `tests/phase2-idor.test.ts`: 71/71 OK (sin regresiones).
- TypeScript: sin errores nuevos (preexistentes corregidos en imports no usados).

## F. Seguridad
- Aislamiento entre usuarios verificado por suite Fase 2.
- Revocación efectiva verificada.
- Eliminación verificada en PostgreSQL y Neo4j.
- Riesgos residuales: política de retención clínica pendiente de aprobación.

## G. Git
- Rama: `fix/phase3-account-lifecycle`
- Commit: `dd1725d`
- PR: #4 (DRAFT)

## H. CI
- TypeScript: OK.
- Tests: OK.
- ESLint: configuración de servidor sin config local; no ejecutado.
