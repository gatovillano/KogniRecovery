# Fase 8 — Autenticación y gestión de sesiones

## Implementación
- Refresh tokens almacenados como hash SHA-256 (SEC-005).
- Detección de reutilización revoca todas las sesiones del usuario (SEC-006).
- MFA TOTP ya implementado para profesionales/admin (SEC-017).
- 2FA, schema y FKs se mantienen.

## Pruebas
- `tests/phase8-refresh-token.test.ts`: 3/3 OK.
- `tests/phase2-idor.test.ts`: 71/71 OK.
- TypeScript: OK.

## Riesgos residuales
- Tokens existentes en claro en entornos antiguos requieren migración/rotación.
