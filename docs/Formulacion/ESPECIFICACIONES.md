# Especificaciones: KogniRecovery - App de Acompañamiento en Adicciones

## 1. Problema Central
Brindar acompañamiento continuo y personalizado **tanto a personas en situación de adicción como a sus familiares**, facilitando:
- Apoyo emocional guiado por IA
- Comunicación segura entre miembros del sistema de apoyo
- Seguimiento de metas y rutinas de recuperación
- Detección temprana de crisis o recaídas

**KogniRecovery** es intervención y sostenibilidad en el proceso de recuperación.

---

## 2. Usuarios Objetivo

### Perfil A: Persona en recuperación (PACIENTE)
- Puede estar en cualquier etapa (uso, reconocimiento, tratamiento, mantenimiento)
- Necesita: espacio seguro, motivación, herramientas de autogestión, evitar el aislamiento

### Perfil B: Familiar/Cuidador (FAMILIAR)
- Esposo/a, padre/madre, hermano/a, amigo cercano
- Necesita: entender la adicción, comunicarse sin codependencia,支持 emocional, no sentirse solo

---

## 3. Funcionalidades Clave

### 3.1 Módulo de IA Conversacional (terapeuta virtual)
- **Para el paciente**: Chatbot empático que aplica técnicas CBT, motivacional interviewing, mindfulness. Detecta emociones y riesgos.
- **Para el familiar**: Guía educativa,如何 comunicarse efectivamente, manejar la ansiedad, boundary-setting.
- **Para ambos**: Sugerencias de interacción sana (ej: "Hoy podrías preguntarle cómo se siente sin juzgar").

### 3.2 Espacio Compartido Seguro
- Pared compartida con mensajes de apoyo, logros, recordatorios (tipo foro privado 1:1 o en grupo familiar)
- Opción de enviar "señales de apoyo" rápidas (emojis, mensajes predefinidos) para momentos de cravings o estrés
- **Privacidad**: El paciente controla qué comparte y cuándo; los familiares ven solo lo autorizado

### 3.3 Seguimiento de Hábitos y Estados
- Paciente registra diariamente:
  - Estado emocional (escala + palabras clave)
  - Uso/abstinencia (honest tracking, no punitivo)
  - Actividades de recuperación (terapia, grupos, ejercicio)
  - Cravings: triggers, intensidad, duración
- Familiares pueden ver un dashboard **anónimo/agregado** (ej: "Hoy hubo 3 cravings, el más común fue estrés"), pero NO el diario íntimo salvo que el paciente lo comparta explícitamente.

### 3.4 Alertas y Protocolos de Crisis
- IA detecta lenguaje de riesgo (suicidio, recaída planeada, autolesión) → activa protocolo:
  1. Ofrece contacto inmediato con línea de crisis local
  2. Notifica a contacto de emergencia designado (solo si el paciente lo autorizó previamente)
  3. Sugiere acciones concretas (ejercicio de grounding, llamar a sponsor)
- Detección de patrones: aumento de cravings en ciertos días/horas → sugiere ajustes a la rutina

### 3.5 Educación y Psicoeducación
- Biblioteca breve: artículos, videos, audios sobre adicción, neurociencia, recuperación, codependencia
- Recomendaciones personalizadas según etapa y perfil
- Mini-cursos cortos (ej: "Cómo establecer límites saludables")

### 3.6 Integración con Tratamiento Formal
- Opción de conectar con terapeuta externo (via compartir resúmenes semanales generados por IA, con consentimiento)
- Recordatorios de citas, tareas terapéuticas
- Seguimiento de objetivos del plan de tratamiento

---

## 4. Consideraciones Críticas

### 4.1 Privacidad y Seguridad
- Datos de salud mental: cifrado E2E, almacenamiento local siempre que sea posible, opción de borrado automático
- Cumplimiento: HIPAA (si EEUU) o GDPR + leyes locales de protección de datos sensibles
- No vender datos, no usar para publicidad
- Consentimiento claro para cada tipo de dato compartido

### 4.2 Límites de la IA
- **KogniRecovery** debe advertir claramente: "No soy un terapeuta, soy una herramienta de apoyo. En crisis, contacta a profesionales."
- Saber redirigir a líneas de crisis (911, 988 en EEUU, teléfonos locales)
- No diagnosticar, no prescribir

### 4.3 Ética y Responsabilidad
- Evitar lenguaje estigmatizante
- Incluir perspectivas de personas en recuperación en el diseño de **KogniRecovery**
- Posibilidad de "modo de baja tecnología" (SMS, llamadas) para quienes no tienen smartphone
- Costos: ¿Freemium? ¿Gratis con subsidios? Evitar barreras económicas para poblaciones vulnerables
- **KogniRecovery** priorizará neutralidad y accesibilidad.

### 4.4 Accesibilidad
- Accesibilidad: **KogniRecovery** será simple, legible, con opciones de aumento de texto
- Soporte de idiomas (español prioritario, luego inglés)
- Compatibilidad con lectores de pantalla

---

## 5. Arquitectura Técnica Sugerida (MVP)

- **Frontend**: React Native (iOS/Android) o Flutter
- **Backend**: Node.js/Express o Firebase para prototipo rápido
- **Base de datos**: PostgreSQL con cifrado en reposo
- **IA**: API de modelo conversacional (OpenAI GPT-4/Claude/disponible) con prompts específicos por perfil y reglas estrictas de safety
- **Notificaciones**: Push + SMS para emergencias (Twilio)
- **Autenticación**: OAuth + 2FA opcional

**KogniRecovery (MVP Scope)**:
1. Registro de pacientes y familiares vinculados
2. Chatbot básico por perfil (sin historial compartido complejo)
3. Registro diario emocional simple
4. Pared compartida básica (mensajes de texto + emojis)
5. Alertas manuales (botón "pedir ayuda ahora") y automáticas (palabras clave)

---

## 6. Roadmap de Producto

### Fase 1 (MVP, 3-4 meses)
- Autenticación y linking familiar-paciente para **KogniRecovery**
- Chatbot con 5-10 respuestas predefinidas + IA simple
- Dashboard emocional (paciente)
- Pared compartida 1:1 (paciente ↔ familiar designado)
- Botón de emergencia con lista de recursos

### Fase 2 (6 meses)
- IA conversacional más avanzada (personalidad consistente)
- Detección de cravings y patrones
- Compartir logros selectivos
- Psicoeducación básica

### Fase 3 (12 meses)
- Módulo de familiares completo (educación, guías)
- Integración con grupos de apoyo externos (AA, NA, etc.)
- Reportes para terapeutas (con permiso)
- Modo sin aplicación (SMS/call)

### Fase 4 (Escalado)
- Aspectos de comunidad segura (foros moderados)
- Programas de patrocinio (donaciones para cubrir costos)
- Investigación y validación clínica

---

## 7. Preguntas Abiertas a Resolver

1. ¿Cómo se vincula un familiar al paciente? ¿Invitación del paciente? ¿Autonomía total del paciente?
2. ¿Qué datos específicos del paciente pueden ver los familiares? (¿Solo agregados? ¿Logros compartidos explícitamente?)
3. ¿Cómo se maneja la salida de un familiar del sistema (ej: ruptura de relación)?
4. ¿Incluir medicación? (Quizás fuera de scope inicial por responsabilidad)
5. ¿Suscripción? ¿Gratis con patrocinio de ONGs? ¿Modelo B2B (clínicas)?

---

## 8. Riesgos Principales

- **Responsabilidad legal**: La IA da consejo que sea malinterpretado o cause daño → cobertura legal robusta + advertencias
- **Brechas de privacidad**: filtración de datos sensibles → auditorías de seguridad, bug bounty
- **Dependencia emocional de la app**: fomentar uso saludable, ofrecer recursos humanos reales
- **Abuso por parte de familiares controladores**: paciente debe tener control total sobre qué comparte; possibility de bloquear temporalmente a familiar

---

## 9. Métricas de éxito (MVP)

- Retención: % de pacientes activos después de 30 días
- Satisfacción: NPS tanto de pacientes como de familiares
- Uso del chatbot: interacciones/semana por usuario
- Crisis atendidas: cuántas veces se usó el botón de emergencia y cuál fue el resultado (seguidamente contactaron línea humana)
- Engagement familiar: % de pacientes que invitaron al menos a 1 familiar y % de familiares activos semanalmente

---

## 10. Próximos Pasos Inmediatos

1. Definir **personas de usuario** detalladas (2-3 escenarios de uso)
2. Diseñar **flujos de onboarding** para ambos roles
3. Bocetar **pantallas principales** (registro, chat, pared compartida, dashboard)
4. Escribir **prompts de IA** para los primeros 10 escenarios conversacionales
5. Buscar validación con **un puñado de usuarios reales** (2-3 pacientes en recuperación, 2-3 familiares) antes de codificar

---

*Documento vivo. Actualizar conforme avancemos.*
