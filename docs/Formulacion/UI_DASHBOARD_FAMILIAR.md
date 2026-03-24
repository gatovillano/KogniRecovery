# Diseño UX/UI - Dashboard del Familiar (Roberto)

## 1. Objetivos de la Pantalla

- Proporcionar una vista **no invasiva** del bienestar del paciente (lo que él/ella autorizó compartir)
- Empoderar al familiar para que ofrezca apoyo **sin controlar**
- Educar sobre la adicción y comunicación efectiva
- Ofrecer canales de acción discretos (enviar mensajes de apoyo, activar alerta si hay riesgo)
- Reducir la ansiedad del familiar ("no sé qué pasa") sin violar privacidad del paciente

---

## 2. Principios de Diseño

### 2.1 Asimetría de Información
- El familiar **NO ve**:
  - Chats privados
  - Notas íntimas del diario
  - Detalles de cravings (solo intensidad agregada)
  - Consumo diario exacto (solo metas alcanzadas)
- El familiar **SÍ ve**:
  - Logros y metas cumplidas (ej: "7 días sin beber")
  - Estado emocional agregado (escala 1-10, sin palabras clave)
  - Asistencia a terapia/grupos
  - Próximas citas (si paciente compartió)
  - Si paciente activó "pedir ayuda" (alerta discreta)

### 2.2 Tonos y Estilo
- **Empático pero no clínico**: "Tu apoyo importa, pero no eres responsable de su recuperación."
- **Educativo**: mini-lecciones sobre adicción y comunicación
- **Descomprimido**: sin datos abrumadores, sin gráficos complejos
- **Discreto**: colores cálidos, no alarmistas

---

## 3. Layout General

```
┌─────────────────────────────────────────────┐
│  ← Atrás        Carmen    ⚙️                │
│  Estado: Vinculado ✅                       │
├─────────────────────────────────────────────┤
│                                             │
│  🫂 ¿CÓMO ESTÁ CARMEN HOY?                  │
│  ┌─────────────────────────────────────┐  │
│  │ 😊 7/10                             │  │
│  │ (Estado emocional agregado)         │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  🎯 PROGRESO RECIENTE                      │
│  ┌─────────────────────────────────────┐  │
│  │ ✅ 5 días sin alcohol               │  │
│  │ 🏥 Asistió a terapia ayer          │  │
│  │ 🔥 Lleva 2 weeks sin recaída       │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ⏰ PRÓXIMAS ACCIONES                       │
│  ┌─────────────────────────────────────┐  │
│  │ 📅 Grupo AA hoy 18:00               │  │
│  │ 💊 Medicación: 20:00 (no vista)    │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  💬 ENVIAR APOYO                            │
│  ┌─────────────────────────────────────┐  │
│  │ [ 🤗 Te quiero ] [ 💪 Fuerza ]      │  │
│  │ [ ☕ ¿Tomamos un café? ]            │  │
│  │ [ 📞 ¿Todo bien? ]                  │  │
│  │ [ ✏️ Personalizar ]                 │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ⚠️ ALERTAS (solo si hay)                  │
│  ┌─────────────────────────────────────┐  │
│  │ Carmen pidió apoyo ahora            │  │
│  │ [ Ver detalles ] [ Responder ]      │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  📚 APRENDE A APOYAR                        │
│  ┌─────────────────────────────────────┐  │
│  │ • Comunicación no violenta          │  │
│  │ • Límites saludables                │  │
│  │ • Cuidado del cuidador              │  │
│  │ [ Ver más artículos ]               │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ 🆘 Emergencia: Si Carmen está en    │  │
│  │    riesgo inmediato, llama a 911   │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 4. Componentes Detallados

### 4.1 Header
- **Botón atrás** → sale del dashboard del paciente
- **Nombre del paciente**: "Carmen" (grande, con estado "Vinculado ✅")
- **Botón de ajustes** (⚙️) → configurar qué notificaciones recibe, silenciar temporalmente

### 4.2 Tarjeta de Estado Emocional (agregado)

**Contenido:**
- Emoji grande (😊, 😐, 😟)
- Escala: "7/10"
- Texto explicativo: "Estado emocional agregado de hoy"
- **NO** muestra etiquetas específicas (ansiedad, estrés) para proteger privacidad

**Actualización:** Se actualiza diariamente después del check-in del paciente (si autorizó compartir estado)

**Adaptaciones:**
- Si estado <4: mostrar en amarillo/naranja, y sugerir: "Parece un día difícil. ¿Quieres enviarle un mensaje de apoyo?"
- Si estado ≥8: verde, celebrar: "¡Buen día! Puedes felicitarla."

### 4.3 Tarjeta de Progreso Reciente

**MOSTRAR solo logros y hechos verificables (no interpretaciones):**

- "✅ 5 días sin alcohol" (si paciente en abstinencia)
- "🏥 Asistió a terapia ayer"
- "🔥 Lleva 2 semanas sin recaída"
- "📉 Consumo reducido 20% esta semana"
- "🎯 Meta cumplida: 7 días sin beber"

**NO mostrar:**
- "Hoy estuvo ansiosa" (eso es estado emocional, va en tarjeta anterior)
- "Cravings altos" (sensibilidad)

### 4.4 Tarjeta de Próximas Acciones

**Muestra citas/eventos que el paciente decidió compartir:**

- "📅 Grupo AA hoy 18:00"
- "💊 Medicación: 20:00 (no vista)" ← ejemplo: sabe que hay medicación pero no ve dosis
- "🗓️ Terapia mañana 16:00"
- "🎯 Objetivo: registrar consumo hoy"

**Si no hay nada programado:**
"Hoy no hay eventos programados. ¿Quieres sugerirle una actividad juntos?"

---

### 4.5 Botones de Envío de Apoyo (Acciones Rápidas)

**Objetivo:** Facilitar el envío de mensajes de apoyo sin tener que escribir (reduce presión, asegura tono apropiado).

**Layout:** 2x2 grid o fila horizontal con scroll.

**Botones predefinidos (customizables por paciente en su perfil):**

1. **🤗 Te quiero** → envía mensaje: "Estoy pensando en ti. Te quiero." (sin preguntas, solo afirmación)
2. **💪 Fuerza** → "¡Tú puedes! Estoy aquí para lo que necesites."
3. **☕ ¿Tomamos un café?** → "¿Te animas a tomar un café esta semana? No hay presión." (propuesta concreta, no confrontacional)
4. **📞 ¿Todo bien?** → "He notado que hasn't hecho check-in hoy. ¿Todo bien? Estoy aquí si necesitas hablar."

**Botón adicional:**
5. **✏️ Personalizar** → abre un mini-chat para escribir mensaje libre (pero con plantillas sugeridas arriba)

**Comportamiento:**
- Al tocar → se envía inmediatamente (no requiere confirmación, pero se puede deshacer en 5s)
- Aparece confirmación: "Mensaje enviado a Carmen"
- El paciente recibe notificación en su app (si está activa)

---

### 4.6 Alertas (Condicional)

**Solo aparecen si el paciente activó "pedir ayuda" o hay riesgo detectado.**

```
⚠️ Carmen pidió apoyo hace 10 minutos
Te enviará un mensaje si necesita algo.
[ Ver detalles ] [ Enviar mensaje ahora ]
```

"Ver detalles" → muestra (sin violar privacidad): "Carmen reportó craving intenso (8/10) y ansiedad. Ella puede verte si desea."

**Si es emergencia médica/suicidio:**
```
🚨 Carmen está en una situación de riesgo.
Te recomendamos:
• Llamarla ahora por teléfono
• Ir a su casa si es seguro
• Contactar a su terapeuta (Dr. Pérez: +56...)
```

---

### 4.7 Sección de Educación (Aprende a Apoyar)

**Contenido rotativo (cada vez que entra, o se actualiza semanalmente):**

- **Artículo breve** (título + 2-3 párrafos) sobre:
  - "Comunicación no violenta: cómo hablar sin controlar"
  - "Límites saludables: no eres responsable de su recuperación"
  - "Cuidado del cuidador: previene el burnout"
  - "Etapas de cambio: por qué a veces no quiere help"

- **Botón:** "Ver más artículos" → lleva a una pantalla con lista de recursos educativos (solo lectura)

**Adaptado por perfil del familiar** (Roberto: esposo; si fuera padre, contenido sobre padres)

---

### 4.8 Botón de Emergencia General

**Siempre visible al final:**

```
🆘 EMERGENCIA
Si Carmen está en riesgo inmediato (suicidio, sobredosis),
llama a 911 o a su contacto de emergencia principal.
```

Al tocar → mismo flujo que la pantalla de emergencia del paciente (ver UI_EMERGENCIA.md)

---

## 5. Flujos de Navegación

```
Dashboard del Familiar
  │
  ├─► Enviar mensaje de apoyo (elige botón predefinido o escribe)
  │      └─► Confirmación "Enviado"
  │
  ├─► Ver progreso detallado (historial de logros)
  │      └─► Pantalla con lista de logros cronológicos
  │
  ├─► Aprende a apoyar (artículo)
  │      └─► Pantalla de artículo (lectura)
  │      └─► Ver más artículos (lista)
  │
  ├─► Emergencia (botón rojo)
  │      └─► Pantalla de emergencia completa
  │
  └─► Ajustes (notificaciones, silenciar)
         └─► Configuración específica de notificaciones
```

---

## 6. Personalización por Perfil del Familiar (si hay más de un tipo)

### 6.1 Esposo/Compañero (Roberto)
- Tono: "Tu apoyo como pareja es crucial, pero no eres su terapeuta."
- Enfasis en comunicación no violenta
- Botones de apoyo: "Te quiero", "¿Todo bien?", "¿Un café?"
- Educación: "Cómo establecer límites sin controlar"

### 6.2 Padre/Madre
- Tono: "Tu hijx necesita tu amor, no tu control."
- Enfasis en no sermonear
- Botones: "Estoy orgulloso/a de ti", "¿Cómo puedo ayudar?"
- Educación: "Padres en recuperación:Cómo no enables"

### 6.3 Hermano/Amigo
- Tono: "Eres un pilar en su red de apoyo."
- Botones: "Cuenta conmigo", "¿Necesitas algo?", "Salgamos a distraernos"
- Educación: "Amistad en recuperación:陪伴 sin presión"

---

## 7. Consideraciones de Privacidad y Psicología

### 7.1 Evitar la Codependencia

**Mensajes anti-codependencia incluidos en el dashboard:**

- "Tu bienestar es igual de importante. No te olvides de cuidarte."
- "No puedes controlar su recuperación, pero sí puedes ofrecer apoyo estable."
- "Si te sientes abrumado, busca ayuda profesional o grupos de apoyo (Al-Anon)."

**Botón oculto (pero accesible):**
- "Necesito apoyo para mí" → enlaza a directorio de grupos para familiares

### 7.2 Transparencia de lo que ve

**Mostrar claramente:**
"Carmen compartió contigo:
- Estado emocional diario
- Logros de abstinencia
- Asistencia a terapia
NO compartió: detalles de cravings, chats privados, notas personales."

Esto evita desconfianza: el familiar sabe que no le están ocultando "lo realmente importante" — más bien, el paciente protege su privacidad.

---

## 8. Notificaciones Push para Familiares

### 8.1 Tipos de Notificación

| Tipo | Cuándo se envía | Contenido | Sonido |
|------|-----------------|-----------|--------|
| Logro compartido | Paciente cumple meta | "¡Carmen logró 7 días sin alcohol!" | Alegre (ding) |
| Estado emocional diario | Paciente hizo check-in | "Carmen reportó estado 8/10 hoy." | Neutro |
| Pedido de apoyo | Paciente activó "pedir ayuda" | "Carmen necesita apoyo. ¿Quieres enviarle un mensaje?" | Suave ( vibrate ) |
| Emergencia | Riesgo rojo detectado | "Carmen está en emergencia. Contacta YA." | Urgente (sirena) |
| Recordatorio semanal | Si no ha interactuado en 7 días | "¿Cómo está Carmen? Revisa su progreso." | Neutro |

### 8.2 Configuración de Notificaciones

En Ajustes del Familiar:
- ¿Qué tipos quieres recibir? (checkboxes)
- Horario silencioso (ej: 22:00-7:00)
- Solo emergencias fuera de horario

---

## 9. Accesibilidad

- **Letra grande**: base 16sp, ajustable
- **Contraste alto**: mínimo 4.5:1
- **Botones grandes**: mínimo 48dp
- **Labels claros**: no solo iconos
- **Navegación por teclado**: orden lógico
- **Redundancia**: usar tanto color como texto para indicar estado (ej: logro verde + ✅)

### 9.1 Para Adultos Mayores (familiar de adulto mayor)

Si el familiar es mayor (ej: hijo adulto de Eliana), permitir:
- Modo "simplificado" (menos elementos, más grandes)
- Vista de "solo logros" (sin estado emocional numérico)
- Botón "Llamar ahora" directo al paciente

---

## 10. Especificaciones para Desarrolladores

### 10.1 API Endpoints

```
GET /api/v1/family/dashboard?patient_id=UUID
Response:
{
  "patient_name": "Carmen",
  "today_mood": { "value": 7, "updated_at": "2025-02-12T09:00:00Z" },
  "recent_achievements": [
    { "text": "5 días sin alcohol", "date": "2025-02-12" },
    { "text": "Asistió a terapia ayer", "date": "2025-02-11" }
  ],
  "upcoming_actions": [
    { "type": "group", "title": "Grupo AA", "time": "2025-02-12T18:00:00Z" }
  ],
  "alerts": [
    { "type": "support_requested", "time": "2025-02-12T15:30:00Z" }
  ]
}

POST /api/v1/family/send-support
Body: {
  "patient_id": "UUID",
  "message_type": "predefined",  // o "custom"
  "predefined_id": "te_quiero",  // si es predefined
  "custom_text": "..."           // si es custom
}
```

### 10.2 Permisos

- Familiar solo ve lo que paciente autorizó en `sharing_permissions`
- Si paciente revocó permiso, Dashboard muestra: "Carmen actualizó su configuración de privacidad. No se muestra información."
- Familiar NO puede acceder a API de chat del paciente directamente

---

## 11. Flujos de Ejemplo

### Flujo A: Roberto ve dashboard y envía apoyo

1. Roberto abre app → dashboard muestra: Carmen, estado 7/10, logro "5 días sin alcohol"
2. Toca botón "🤗 Te quiero" → confirmación "Enviado"
3. Carmen recibe notificación push: "Roberto te envió un 🤗"
4. Carmen sonríe y se siente apoyada

### Flujo B: Crisis detectada

1. Carmen activa "pedir ayuda" en su app (craving 9/10)
2. Dashboard de Roberto muestra alerta naranja: "Carmen pidió apoyo"
3. Roberto ve y toca "Ver detalles" → ve: "Carmen reportó craving intenso. Ella puede verte si desea."
4. Roberto elige "Enviar mensaje ahora" → elige predefinido "¿Todo bien?" y envía
5. Carmen recibe: "¿Todo bien?" → se siente acompañada, no juzgada

### Flujo C: Diego (familiar de paciente adulto) preocupado por falta de datos

- Diego ve: "Carmen no ha hecho check-in en 3 días"
- Dashboard sugiere: "¿Preocupado? Puedes enviarle un mensaje o contactar a su terapeuta (si ella lo autorizó)."
- Diego envía: "¿Todo bien? Te extraño." → no invasivo

---

## 12. Psicología del Mensaje

### 12.1 Qué NO decir al familiar

- "Tu alcoholismo afecta a toda la familia" (acusatorio)
- "Deberías controlar lo que bebe" (imposible, codependencia)
- "¿Por qué no lo deja?" (ignorante)
- "Yo en tu lugar..." (inviable)

### 12.2 Qué SÍ decir

- "Tu apoyo es valioso, pero tu bienestar también"
- "No puedes controlar su consumo, pero sí puedes ofrecer presencia"
- "Celebremos los pequeños logros juntos"
- "Cuídate para poder acompañar"

---

## 13. Roadmap

**Fase 1 (MVP):**
- Dashboard simple con 3 tarjetas (estado, logros, próximos)
- Botones de apoyo predefinidos (4)
- Notificaciones básicas

**Fase 2:**
- Educación integrada (artículos semanales)
- Chat directo familiar-paciente (solo mensajes preaprobados por paciente)
- Reportería avanzada (gráficos de progreso compartido)

**Fase 3:**
- Grupos de apoyo familiar (comunidad)
- Integración con terapia familiar (reports para terapeuta)
- Modo "anónimo" (familiar puede hacerse pasar por "amigo" si paciente prefiere no revelar identidad)

---

## 14. Testing

**Test 1:** Familiar ve solo lo autorizado
- Si paciente solo compartió "logros", dashboard NO muestra estado emocional numérico

**Test 2:** Botón de emergencia funciona
- Tocar "🆘 EMERGENCIA" → abre pantalla de emergencia completa

**Test 3:** Envío de mensaje predefinido
- Tocar "🤗 Te quiero" → se envía, paciente recibe, familiar ve confirmación

**Test 4:** Privacidad respetada
- Familiar intenta acceder a chat del paciente → denied (API 403)

**Test 5:** Adulto mayor usando dashboard
- Letra grande, contraste alto, botones fáciles de tocar

---

*Documento vivo. Se ajustará con feedback de familiares reales.*

