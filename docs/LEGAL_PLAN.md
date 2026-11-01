# Plan legal por punto — NUMA/KogniRecovery

## 1. Política de privacidad formal (PRIV-012)
- Inventario de datos reales procesados (salud mental, consumo, cravings, chat IA, notas, contactos).
- Redacción por secciones: finalidades, bases legales, compartición, retención, derechos, contacto.
- Revisión legal por jurisdicción (Chile, UE, EE.UU., Brasil).
- Publicación y versionado; enlace en app y panel.

## 2. Re-consentimiento (PRIV-014)
- Definir versión de política y cambios que lo disparan.
- Registrar consentimiento versionado (ya existe tabla).
- Endpoint/UI para verificar consentimiento vigente y solicitar re-aceptación.
- Bloquear funcionalidades hasta re-aceptación si aplica.

## 3. Procedimiento de brechas (PRIV-006)
- Definir detección y escalamiento.
- Plantillas de notificación (72h GDPR / 60 días HIPAA).
- Roles responsables y registro de incidentes.
- Simulacro anual.

## 4. DPIA (PRIV-010)
- Mapear flujos de datos sensibles.
- Evaluar riesgos y medidas.
- Documentar aceptación residual y plan de mitigación.

## 5. DPAs/BAAs con terceros (PRIV-004)
- Listar proveedores que reciben datos.
- Solicitar acuerdos estándar.
- Revisar cláusulas de salud y residencia de datos.
- Firmar y archivar; actualizar política.

## 6. DPO/Encargado
- Designar responsable.
- Definir funciones y canal de contacto.

## 7. Certificaciones (PRIV-013)
- Evaluar ISO 27001 / SOC 2 / HITRUST según mercado.
- Definir hoja de ruta y presupuesto.

## 8. Anonimización para LLMs (PRIV-001) — técnico
- Diseñar anonimización/pseudonimización previa al envío.
- Validar calidad clínica y seguridad.
- Implementar y probar.

## 9. Sanitización de logs (PRIV-009) — técnico
- Definir campos sensibles a redactar.
- Implementar logger seguro.
- Revisar console.error existentes.

## 10. Jobs de retención (PRIV-008) — técnico
- Definir políticas por tipo de dato.
- Implementar scheduler y monitoreo.
- Probar idempotencia y auditoría.
