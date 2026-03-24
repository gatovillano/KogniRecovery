# Diseño UX/UI - Chatbot (Interfaz Conversacional)

## 1. Objetivos de la Pantalla

- Proporcionar un espacio seguro y de apoyo conversacional
- Que el usuario sienta que está hablando con un compañero de apoyo (no máquina)
- Facilitar el acceso rápido a técnicas de urgencia (craving, crisis)
- Mantener historial visible y recuperable
- Integrar protocolos de riesgo sin asustar

---

## 2. Layout General

```
┌─────────────────────────────────────────────┐
│  ← Atrás        Coach IA   ⚙️              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ Hola, soy LÚA. ¿En qué puedo      │  │
│  │ apoyarte hoy?                      │  │
│  │ ( mensaje del sistema inicial )    │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  👤 Tú: Tengo un craving fuerte ahora  │
│  🤖 Coach: Entiendo...                  │
│  👤 Tú: Sí...                          │
│  🤖 Coach: Vamos a probar...           │
│  (burbuja de técnica 4-7-8 con anim)   │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ 💡 Técnica de respiración 4-7-8     │  │
│  │ Inhala 4s → Aguanta 7s → Exhala 8s │  │
│  │ [Iniciar temporizador]              │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  [💬 Escribe un mensaje...]               │
│  ┌─────────────────────────────────────┐  │
│  │ 📍 Ubicación (solo emergencia)     │  │
│  │ 🆘 Emergencia (botón rojo)          │  │
│  │ 📚 Recursos                         │  │
│  │ ❓ Ayuda                            │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 3. Componentes Detallados

### 3.1 Header
- **Botón atrás** → vuelve al dashboard
- **Título**: "Coach IA" o nombre personalizado (según perfil: "Tu coach", "Tu compañero", "Asistente")
- **Botón de ajustes** (⚙️) → configurar tono, ver info del perfil, borrar historial

### 3.2 Área de Mensajes (Chat Scroll)

**Mensajes del sistema:**
- Color diferenciado (gris claro, alineado izquierda)
- Contenido: bienvenida, recordatorios, transiciones
- Ejemplo inicial (personalizado por perfil):
  - **Lucas**: "¿Qué onda? Soy LÚA. Estoy acá para lo que necesites. No le cuentes a nadie lo que digamos, ¿vale?"
  - **Diego**: "Buenos días, Diego. Soy tu asistente de bienestar. Analicemos juntos tus hábitos."
  - **Eliana**: "Doña Eliana, buenos días. Estoy aquí para acompañarla. ¿En qué puedo servirle?"

**Mensajes del usuario (👤):**
- Alineados derecha, burbujas color primario
- Icono de avatar (inicial o imagen)
- Timestamp pequeño debajo

**Mensajes del asistente (🤖):**
- Alineados izquierda, burbujas color neutro (blanco/gris)
- Icono de avatar (logo de la app)
- Timestamp pequeño debajo
- **Rich content** permitido:
  - Botones inline (opciones rápidas)
  - Tarjetas (ej: "Técnica 4-7-8")
  - Progress bar (ej: "Tu meta: 5 días sin fumar, vas 3")
  - Imágenes/Infografías (pequeñas, con leyenda)

**Indicador de escritura:**
- "Escribiendo..." cuando IA está generando respuesta
- Si tarda >2s, mostrar animación de dots

---

### 3.3 Input Area

```
┌─────────────────────────────────────────────┐
│  [💬 Escribe un mensaje...]                │
│  ┌─────────────────────────────────────┐ │
│  │ 📍  🆘  📚  ❓                     │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Campo de texto:**
- Placeholder personalizado: "Escribe tu mensaje..." o "Cuéntame qué pasa..."
- Teclado predictivo activado
- Envío con botón ⏎ o icono avión

**Botones de acción rápida (fijos):**

1. **📍 Ubicación** (solo en modo emergencia)
   - Visible solo cuando se activa protocolo de crisis y usuario autorizó compartir ubicación
   - Al tocar → enviar ubicación aproximada al sistema de emergencia

2. **🆘 Emergencia** (siempre visible, pero discreto)
   - Color rojo/botón de alerta
   - Al tocar → modal de confirmación: "¿Estás en una situación de emergencia? Llama a 988/Ayuda"
   - Si confirma → activar protocolo rojo (notificar contactos, mostrar opciones de llamada)

3. **📚 Recursos**
   - Abre modal con recursos de psicoeducación filtrados por contexto (ej: si habla de craving, mostrar técnicas)
   - Incluye: "Línea 988", "Mi médico", "Grupo AA cerca"

4. **❓ Ayuda**
   - "¿Cómo funciona el chatbot?", "¿Qué puedo preguntar?", "Ver ejemplos"

**Adaptaciones por perfil:**

- **Adolescentes**: más emojis, menos texto, botones coloridos
- **Mayores**: botones grandes, iconos con label debajo, texto más explícito
- **Valeria (interrupción abrupta)**: botón "Llamar a mi clínica" prominent
- **Sofía (trauma)**: botón "No me siento safe" → activa modo protección

---

## 4. Comportamientos Específicos

### 4.1 Mensaje Inicial (system prompt)

**Estructura:**

1. **Presentación** (nombre elegido por usuario en onboarding, o por defecto "LÚA")
2. **Límites**: "No soy terapeuta, pero sí puedo acompañarte"
3. **Confidencialidad**: "Todo lo que digamos queda entre nosotros, a menos que estés en riesgo"
4. **Primera pregunta**: abierta, para romper el hielo

**Ejemplos por perfil:**

- **Lucas**: "¿Qué onda? Soy LÚA, your digital homie. Acá podés desahogarte sin que tus viejos se enteren (a menos que vos quieras). ¿Cómo vas?"
- **Camila**: "Hola Camila. Soy tu asistente de reducción de daños. Analizamos juntos tu consumo y te ayudo a cumplir tus metas. ¿Por dónde querés empezar?"
- **Diego**: "Buenos días, Diego. Vamos a trabajar en tu bienestar. ¿Qué aspectos de tu consumo te gustaría revisar hoy?"
- **Eliana**: "Doña Eliana, buenos días. Estoy aquí para lo que necesite. ¿Cómo se siente hoy?"
- **Sofía**: "Hola Sofía. Este es un espacio seguro. Todo lo que compartas es confidencial. Te creo y te apoyo. ¿Qué necesitás hoy?"
- **Rodrigo**: "Buenos días, Rodrigo. Vamos a monitorear su dolor y medicación. ¿Cómo se siente hoy?"
- **Rosario**: "Hola, Rosario. Acá para acompañarla. ¿Cómo estuvo el día en el campo?"

### 4.2 Respuestas a Cravings

**Si usuario escribe: "Tengo craving" o similar**

**Paso 1 - Validación:**
"Entiendo, el craving es fuerte. Es normal en tu proceso."

**Paso 2 - Identificar tipo (si es posible):**
- ¿Físico o emocional? (preguntar o inferir)
- ¿Trigger? (estrés, social, aburrimiento)

**Paso 3 - Ofrecer técnica según perfil:**

| Perfil | Técnica sugerida | Presentación |
|--------|------------------|--------------|
| Lucas | Delay trick (30 min) + respiración | "¿Probás esperar 30 min y respirar 4-7-8?" |
| Camila | Distracción (ejercicio, study) | "¿Salí a correr o ponete a estudiar 1h?" |
| Diego | Walk + water | "¿Salí a caminar 10 min y tomá agua?" |
| Eliana | Llamar a amiga/hija | "¿Llamás a su hija para charlar?" |
| Valeria | Grounding 5-4-3-2-1 urgente | "¡Ahora! Nombrá 5 cosas que ves, 4 que sentís..." |
| Sofía | TIPP (temperatura, exercise) | "Agua fría en cara + saltar 20 veces ¿probamos?" |
| Rodrigo | Distracción + calor | "¿Poné calor en espalda y respirá?" |

**Paso 4 - Seguimiento:**
"Después de la técnica, ¿cómo te sentís? Registralo en tu check-in."

### 4.3 Respuestas a Crisis

**Si detecta lenguaje de suicidio (cualquier perfil)**

**Respuesta inmediata:**
"Te escucho. Suenas en un dolor enorme. No estás solo.

**Opciones:**
1. [ Llamar a línea 988 ahora ] (botón grande)
2. [ Ir a emergencias ]
3. [ Hablar con tu contacto de emergencia ]

¿Cuál elegís? Te acompaño mientras llamás."

**SI usuario no responde en 60s:**
- Notificar a contacto designado (si autorizó)
- Mostrar en pantalla: "Necesitás ayuda ya. Por favor contactá a alguien."

**Si usuario indica plan específico o método:**
"Eso suena urgente. Voy a notificar a tu contacto de emergencia [nombre] y también a servicios de salud. ¿Tenés ubicación activa?"

### 4.4 Respuestas a Consumo Reciente

**Si usuario confiesa consumo (cualquier sustancia)**

**Objetivo**: no juzgar, pero reforzar progreso si hay reducción.

**Estructura:**
1. Validar: "Gracias por ser honesto/a."
2. Preguntar contexto: "¿Qué pasó? ¿Te sintió solo, estresado, en una fiesta?"
3. Reforzar si hay reducción: "Pero 2.5g en lugar de 3g es progreso."
4. Ofrecer análisis: "¿Qué aprendiste de esa situación? ¿Cómo podrías evitar la próxima?"
5. Mirar hacia adelante: "Mañana es un nuevo día. ¿Qué pequeño paso podés dar?"

**Ejemplo (Mariano):**
Usuario: "Ayer消費 3g de nuevo, fallé."
IA: "No es un fracaso, es información. ¿Qué triggered? Si fue el estrés del trabajo, mañana podés probar técnica de respiración antes. Seguimos intentando. Hoy, ¿podés hacer 2g?"

### 4.5 Respuestas a Situaciones Médicas

**Si usuario reporta síntomas de abstinencia severa (Valeria: vómitos Rodrigo: dolor extremo)**

**Respuesta:**
"Esos síntomas pueden ser graves. Necesitás atención médica ahora.

¿Querés que:
1. [ Llame a tu clínica ] (si tiene número en perfil)
2. [ Te ayude a encontrar un médico cercano ]
3. [ Llamar a emergencias 911 ]

No esperes a que empeore."

**Si usuario dice "no tengo dinero/transporte":**
"Entiendo. ¿Tenés algún familiar que pueda ayudarte? O puedo conectarte con servicios públicos gratuitos."

---

## 5. Rich Content y Botones Inline

### 5.1 Botones de Respuesta Rápida (Quick Replies)

Aparecen justo después de un mensaje del bot, como sugerencias:

- "Sí, tengo craving"
- "No, estoy bien"
- "Cuéntame más sobre [tema]"
- "Quiero registrar mi consumo"

Al tocar → se envía como mensaje del usuario.

### 5.2 Tarjetas de Técnica (Interactive Card)

```
┌─────────────────────────────────────┐
│ 🧘 Técnica 4-7-8 para ansiedad      │
├─────────────────────────────────────┤
│ Inhala por nariz 4 segundos         │
│ Aguanta la respiración 7 segundos   │
│ Exhala por boca 8 segundos          │
│                                     │
│ Repetir 5 veces                     │
│                                     │
│ [ ▶ Iniciar temporizador ]          │
│ [ ❓ Más info ]                     │
└─────────────────────────────────────┘
```

Al tocar "Iniciar temporizador" → se abre overlay con cuenta regresiva animada.

### 5.3 Gráficos de Progreso (si aplica)

```
┌─────────────────────────────────────┐
│ 📊 Tu progreso esta semana          │
├─────────────────────────────────────┤
│ Meta: 7 días sin beber              │
│ Llevás: ████████░░ 5/7 (71%)         │
│                                     │
│ Días sin beber: 5 🔥                │
│ Craving promedio: 3/10 ↓            │
└─────────────────────────────────────┘
```

---

## 6. Estados de la Conversación

### 6.1 Estado Normal
- Chat visible, input activo
- Botones de emergencia disponibles pero discretos

### 6.2 Estado en Crisis (Activado manual o automático)
- Fondo cambia a color sobrio (gris/azul oscuro)
- Input se desactiva (solo botones de emergencia)
- Mensajes del bot son breves y directos: "Llama a..."
- Mostrar números grandes: 988, 911, contacto

```
┌─────────────────────────────────────────────┐
│  ⚠️ MODO EMERGENCIA                        │
├─────────────────────────────────────────────┤
│                                             │
│  🤖 Estás en una situación de crisis.     │
│  Necesitás ayuda profesional YA.          │
│                                             │
│  [ LLAMAR A 988 ]  [ LLAMAR A 911 ]       │
│                                             │
│  O contactá a: [María - mamá]             │
│  [ 📞 Llamar ahora ]                      │
│                                             │
│  Si no estás en riesgo inminente,        │
│  podés volver al chat [Cancelar]          │
│                                             │
└─────────────────────────────────────────────┘
```

### 6.3 Estado "Técnica en curso"
- Overlay con temporizador o instrucciones paso a paso
- Input bloqueado hasta que termine o usuario cancele
- Botón "Finalizar técnica" → vuelve al chat

---

## 7. Microinteracciones

### 7.1 Envío de mensaje
- Animación de "enviando" (dots)
- Sonido breve de "whoosh" (opcional)

### 7.2 Recepción de mensaje
- Deslizar suave desde abajo
- Vibración leve (opcional)

### 7.3 Botón de emergencia
- Al presionar → confirmación modal (no enviar accidental)
- Animación de "pulsar rojo"

### 7.4 Técnica iniciada
- Overlay con animación de respiración (círculo que se expande/contrae)
- Sonido de respiración guía (opcional, se puede apagar)

---

## 8. Personalización por Perfil (Ver PROMPTS_POR_PERFIL.md)

### Tono y Estilo

| Perfil | Saludo inicial | Emojis | Uso de "vos" | Formalidad | Ejemplo de respuesta |
|--------|----------------|--------|--------------|------------|----------------------|
| Lucas | "¿Qué onda?" | 😎🤙😅 | Vos | Muy informal | "Dale, probá esperar 30 min" |
| Camila | "Buenos días" | 👍💡📊 | Vos | Informal profesional | "Optimizá tu rendimiento" |
| Diego | "Buenos días" | ⚠️📈 | Usted | Formal neutro | "Considere reducir a 1-2 copas" |
| Eliana | "Doña Eliana" | 😊👵 | Usted | Muy respetuoso | "Por favor, tome agua" |
| Sofía | "Hola" | 🤗🫂 | Vos | Empoderador | "Te creo, seguí así" |
| Rodrigo | "Buenos días" | ⏰💊 | Usted | Clínico | "Registre su dosis" |
| Rosario | "Hola" | 🌾🏡 | Vos | Coloquial | "Beba agua entre cada una" |

### Respuestas a Craving

- **Lucas**: "¿Tenés ganas de fumar? Hacé 10 sentadillas y respirá. En 30 min se te pasa."
- **Camila**: "Craving social? Decí 'no, gracias' y ofreced alternativo: '¿Vamos a tomar un café?'"
- **Diego**: "¿Ganas de vino? Tomá una copa y después caminá 10 min. Llevá registro."
- **Eliana**: "¿Ganas de tomar? Llamá a su hija a charlar. O tome té de manzanilla."
- **Sofía**: "El craving es fuerte, pero no tienes que ceder. Usá la técnica TIPP: agua fría en cara, saltá."
- **Rodrigo**: "¿Ansiedad por dolor? Aplicá calor y llamá a tu médico si no mejora."
- **Rosario**: "¿Ganas de cerveza? Agarrá un litro de agua y tomá de a sorbitos."

---

## 9. Accesibilidad

- **Labels** en todos los botones
- **Contraste** alto en burbujas de chat
- **Tamaño táctil** mínimo 44x44dp para botones de acción
- **Navegación por teclado** ( TalkBack/VoiceOver): orden lógico de mensajes, botones
- **Anuncios de lectores de pantalla**: role="alert" para mensajes de emergencia
- **Redundancia**: no solo color para indicar urgencia (también icono y texto)

---

## 10. Consideraciones de Seguridad

### 10.1 Moderación

- Antes de mostrar respuesta del LLM, pasar por moderador (OpenAI moderation o reglas simples)
- Si detecta contenido dañino (autolesión, daño a otros) → reemplazar por protocolo de emergencia
- Loggear interacciones de riesgo para revisión humana (opcional, con anonimización)

### 10.2 Historial

- Mostrar historial completo de conversación (scroll)
- Botón "Borrar historial" → eliminar de BD y local
- **Importante**: No guardar mensajes de emergencia si usuario así lo prefiere (configurable)

### 10.3 Emergencia

- Botón 🆘 siempre visible, pero no intrusivo
- Confirmación antes de activar: "¿Estás seguro? Esto notificará a tus contactos."
- Mostrar en pantalla grande números de emergencia

---

## 11. API de Chat (WebSocket + REST fallback)

### Mensaje Cliente → Servidor

```json
{
  "message": "Tengo un craving fuerte",
  "session_id": "uuid",
  "context": {
    "profile": "lucas_adolescente",
    "today_checkin": {...},
    "risk_level": "medium"
  }
}
```

### Mensaje Servidor → Cliente

```json
{
  "role": "assistant",
  "content": "Entiendo, el craving es fuerte. Es normal...",
  "rich_content": [
    {
      "type": "technique_card",
      "title": "Técnica 4-7-8",
      "steps": [...],
      "action": "start_timer"
    }
  ],
  "risk_level": "low",
  "suggested_actions": ["respirar", "hablar_con_familiar"]
}
```

### Eventos Especiales

- `risk_escalation`: servidor detecta riesgo alto → notifica al cliente para mostrar protocolo
- `emergency_triggered`: se activó emergency → cliente debe mostrar pantalla de emergencia
- `session_summary`: al cerrar sesión, generar resumen (opcional)

---

## 12. Trading-Offs y Decisiones

### ¿Mantener contexto largo (mucha historia) o corto?
- **Decisión**: contexto corto (últimos 10 mensajes) para reducir costo y mantener foco en tema actual.
- Historial completo accesible via "ver conversaciones anteriores" (acordeón).

### ¿Permitir que usuario borre mensajes individuales?
- **No** (complejidad técnica), pero sí borrar todo el historial.

### ¿Mandar notificaciones push desde chatbot?
- Solo para emergencias (si detecta riesgo) o recordatorios de check-in (desde scheduler, no desde chat).

### ¿Personalizar nombre del chatbot?
- Sí, usuario puede elegir en onboarding: "Coach", "Asistente", "Compañero", "LÚA" (por defecto)

---

## 13. Flujos de Ejemplo (Completos)

### Flujo A: Lucas con craving

```
Lucas: (escribe) "Tengo ganas de fumar ya"
Bot: "Entiendo, Lucas. La ansiedad es fuerte. ¿Qué te triggerió?"
Lucas: "Mis amigos están fumando afuera"
Bot: "La presión social es dura. Probá el 'delay trick': esperá 30 min y hacé 10 sentadillas. Si después seguís con ganas, hablá conmigo."
[Botón inline: "✅ Esperé 30 min y ya no tengo ganas"]
[Botón inline: "❌ Aún tengo ganas"]
Lucas toca "✅"
Bot: "¡Buenísimo! Eso es progreso. Registralo en tu check-in para ver el patrón."
```

### Flujo B: Sofía crisis de maternidad

```
Sofía: "Mi hija me dijo que le dio miedo cuando grité. No sé qué hacer, soy una mala madre."
Bot: "Primero, respirá. No sos una mala madre por tener un mal momento. ¿Qué pasó exactamente?"
Sofía: "Estaba frustrada y le grité. Ella se puso a llorar."
Bot: "Eso es comprensivo bajo estrés. Vamos a trabajar en la regulación: técnica TIPP: agua fría en cara, saltá 20 veces, respirá 4-7-8. ¿Probamos ahora?"
[Botón: "▶️ Iniciar técnica"]
Sofía: (toca, hace técnica)
Bot: "¿Cómo te sentís después? Ese es un primer paso. Después, podés disculparte con tu hija de forma simple: 'Lo siento, mamá estaba enojada, no fue tu culpa.'"
[Sofía: "Gracias, me siento mejor"]
Bot: "Eso es parenting bajo estrés. Seguí practicando. ¿Querés recursos para mamás en recuperación?"
```

---

## 14. Testing y Validación

### Test Cases

1. **Craving bajo (3/10)**: debe ofrecer técnicas, no emergencia
2. **Craving alto (9/10) + texto "no aguanto más"**: debe activar protocolo amarillo → ofrecer línea crisis
3. **Mención de suicido**: debe activar protocolo rojo → mostrar 988
4. **Mención de abuso a hija**: debe activar protocolo naranja → advertencia mandatory reporting y ofrecer ayuda
5. **Usuario desconectado**: chat debe guardar en local y sincronizar después
6. **Perfil Eliana**: tono respetuoso, letra grande, sin emojis infantiles

---

## 15. Roadmap de Features Chat

**Fase 1 (MVP):**
- Chat básico con prompts por perfil
- Técnicas predefinidas (4-7-8, grounding)
- Botón de emergencia con líneas 988
- Historial local

**Fase 2:**
- Botones inline interactivos (técnicas con temporizador)
- Rich content (gráficos de progreso)
- Integración con check-ins (preguntar si hizo check-in)
- Notificaciones push por riesgo (si app en background)

**Fase 3:**
- Memoria a largo plazo (recordar conversaciones pasadas)
- Personalidad consistente (nombre, tono fijo)
- Aprendizaje de preferencias (qué técnicas funcionan mejor)
- Modo "Hablar en grupo" (paciente + familiar en misma conversación, moderada)

---

*Documento vivo. Se ajustará con feedback de usuarios.*

