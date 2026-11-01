# Fase 9 (técnica) — Privacidad, logs y retención

## Implementación
- Sanitización de logs: `src/utils/redact.ts` redacta claves sensibles y tokens; aplicado en `createApp`.
- Retención: job periódico (24h) limpia refresh tokens expirados (PRIV-008 parcial).
- PRIV-001 (anonimización para LLMs) queda pendiente de diseño específico.

## Pruebas
- `phase2-idor.test.ts`: 71/71 OK.
- TypeScript: OK.

## Riesgos residuales
- Anonimización de datos antes de LLMs requiere validación clínica.
- Retención completa requiere políticas aprobadas.
