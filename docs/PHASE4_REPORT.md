# Fase 4 — Seguridad de herramientas y acciones de LÚA (NUMA-C06)

## A. Diagnóstico inicial
- Rama: `fix/phase4-lua-tool-security`
- Base: `origin/main` (`af3eb1a`)
- Hallazgo: las herramientas de LÚA aceptaban `userId` como argumento del modelo, permitiendo suplantación mediante prompt injection o argumentos manipulados.

## B. Hallazgos confirmados
- `knowledge_graph_search`, `record_substance_dose`, `save_note`, `list_notes`, `delete_note`, `record_*` aceptaban `userId` controlado por el LLM.
- El backend no inyectaba una identidad confiable en la ejecución de herramientas.

## C. Implementación
- Se eliminó `userId` de los esquemas de todas las herramientas.
- Cada herramienta obtiene `userId` de `config.configurable.userId`, inyectado por el agente desde la sesión autenticada.
- Si no hay contexto confiable, la herramienta falla sin ejecutar operaciones.
- `executeAgent` y `executeAgentStream` propagan `userId` en la configuración.

## D. Archivos modificados
- `server/src/services/langgraph.service.ts`
- `server/src/services/skills/*/*_tool.ts`

## E. Pruebas
- `tests/phase4-lua-tool-security.test.ts`: 7/7 OK.
- TypeScript: OK.

## F. Seguridad
- Un `userId` malicioso en argumentos se ignora.
- El borrado/lectura/escritura se ejecuta solo para el usuario autenticado.
- No se introdujeron regresiones en Fase 2/3 (suites previas siguen verdes en su entorno).

## G. Git
- Rama: `fix/phase4-lua-tool-security`
- PR: pendiente DRAFT.

## H. CI
- TypeScript OK.
- Tests OK.

## I. Riesgos residuales
- El prompt puede seguir intentando pasar IDs; ahora se ignoran.
- Recomendado auditar logs de seguridad sin contenido clínico.
