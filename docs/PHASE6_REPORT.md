# Fase 6 — Encriptación de datos sensibles en reposo

## Implementación
- `agent_notes`: title/content cifrados en create/update y descifrados en lecturas.
- `profiles`: bio/primary_substance cifrados en create/update y descifrados en lecturas.
- `users`: llm_api_key cifrado en update y descifrado en lecturas.
- Modelos checkin/craving/message/context_history ya cifraban previamente; se mantienen.
- Journal: notas diarias, hábitos, entorno social y análisis de consumo cifrados.

## Pruebas
- `tests/phase6-data-encryption.test.ts`: 6/6 OK.
- `tests/phase2-idor.test.ts`: 71/71 OK.
- TypeScript: OK.

## Riesgos residuales
- Migración de datos existentes en claro requiere script de re-encriptación.
- Campos adicionales (messages metadata, etc.) pueden requerir revisión.
