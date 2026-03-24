# Diseño UX/UI - Pantalla de Emergencia/Crisis

## 1. Objetivos de la Pantalla

- Proporcionar una interfaz clara y directa en situaciones de alto riesgo (suicidio, sobredosis, crisis médica)
- Minimizar la carga cognitiva del usuario (que está en estado de estrés extremo)
- Ofrecer acciones inmediatas: llamar a emergencias, contactar a seres queridos, técnicas de primer auxilio
- No ablutar; ser calmado pero urgente
- Funcionar incluso con conexión limitada (offline-capable)

---

## 2. Triggers de Activación

Esta pantalla se activa automáticamente cuando:

1. **Usuario escribe lenguaje de suicidio** con plan específico: "me voy a matar", "tengo pastillas", "escalera lista"
2. **Usuario reporta síntomas de sobredosis** (respiración lenta, inconsciencia, pupilas pequeñas)
3. **Usuario activa manualmente** botón 🆘 en chat o dashboard
4. **Sistema detecta inactivity prolongada + riesgo** (ej: usuario dice "no aguanto más" y no responde en 60s)

**Modos de riesgo:**

| Nivel | Condición | Pantalla Mostrada |
|-------|-----------|-------------------|
| **Rojo** | Suicidio inminente con plan, sobredosis confirmada, crisis médica grave | Pantalla de emergencia completa (este diseño) |
| **Naranja** | Ideación suicida sin plan, craving intenso con intención de recaer, síntomas abstinencia severa | Chatbot con opciones de ayuda, pero sin bloquear pantalla |
| **Amarillo** | Malestar emocional severo, craving moderado-alto | Chatbot normal, ofrecer líneas de crisis como opción |

---

## 3. Layout de la Pantalla de Emergencia (Modo Rojo)

```
┌─────────────────────────────────────────────┐
│  ⚠️ MODO EMERGENCIA - NO ESTÁS SOLO/A      │
├─────────────────────────────────────────────┤
│                                             │
│  🤖 Hemos detectado que estás en una       │
│     situación de riesgo.                   │
│                                             │
│  **Acciones inmediatas:**                  │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ 📞 LLAMAR A 988 (Suicidio/Crisis)   │  │
│  │    24/7, gratuito, confidencial     │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ 🆘 LLAMAR A EMERGENCIAS (911)       │  │
│  │    Si hay riesgo de vida            │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ 👤 CONTACTAR A [María - Mamá]       │  │
│  │    📞 +56 9 XXXX XXXX              │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  O también:                               │
│  • Ir al hospital más cercano [Ver mapa]  │
│  • Contactar a tu terapeuta [Llamar]     │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │  ¿No estás en riesgo inminente?     │  │
│  │  [Volver al chat]                   │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  📍 Ubicación compartida: ✅ Activada     │
│     (solo se envía a emergencias si       │
│      confirms que estás en peligro)       │
│                                             │
│  ⚠️ Recuerda: Esta app no reemplaza       │
│  atención médica profesional.             │
│                                             │
│  [Cerrar pantalla de emergencia]          │
└─────────────────────────────────────────────┘
```

---

## 4. Estados y Variantes

### 4.1 Estado "Sin contactos configurados"

Si usuario no tiene contacto de emergencia en su perfil:

```
⚠️ MODO EMERGENCIA

No encontramos un contacto de emergencia
en tu perfil. ¿Quieres configurar uno ahora?

[ Configurar contacto de emergencia ]
[ Llamar a 988 ]
[ Ir a 911 ]
[ Volver ]
```

**Lógica:** Priorizar líneas oficiales, luego pedir configurar contacto.

### 4.2 Estado "Solo síntomas médicos, no suicidio"

Ej: Valeria con vómitos constantes, Rodrigo con dolor severo.

```
⚠️ ALERTA MÉDICA

 Tus síntomas pueden ser graves:
 - Vómitos constantes (riesgo de deshidratación)
 - Dolor 9/10 (posible sobredosis)

 **Acciones:**
 [ Llamar a mi clínica (─────) ]
 [ Ir a Urgencias más cercano ]
 [ Contactar a mi familiar [María] ]

 Si no mejoras en 2 horas, busca ayuda YA.
```

### 4.3 Estado "Crisis por maternidad" (Sofía)

```
⚠️ CRISIS DE CRIANZA

 Estás pasando un momento difícil con tu hija.
 Eso es comprensible. Pero su seguridad es prioridad.

 **Pasos:**
 1. Haz una pausa de 5 min (técnica TIPP)
 2. Si sientes que puedes lastimarla, BUSCA AYUDA AHORA:
    [ Línea de protección infantil: 149 (AR) ]
    [ Hablar con trabajadora social ]
    [ Llamar a tu mamá/amiga ]

 **NO** la dejes sola si estás alterada.
```

---

## 5. Componentes Detallados

### 5.1 Botones de Acción Principal (Grandes, coloridos)

**Diseño:**

- Ancho completo o casi (300dp+)
- Altura mínimo 60dp
- Icono grande (48dp) + texto
- Colores:
  - **988/Suicide**: azul (calma pero importante)
  - **911/Emergencia**: rojo (urgencia)
  - **Contacto familiar**: verde (seguro)
  - **Terapia/Clínica**: naranja (atención)

**Comportamiento:**
- Al tocar → acción directa (abre dialer con número, o confirmación antes de llamar)
- Para 911: mostrar confirmación adicional: "¿Estás seguro? Esto llamará a policía/ambulancia."

---

### 5.2 Información de Contexto

**Mostrar claramente:**
- ¿Qué detectó el sistema? (ej: "Suicidio con plan", "Sobredosis de opioides", "Craving intenso + aislamiento")
- ¿Por qué es urgente? (explicación simple, 1-2 líneas)
- **NO** usar jerga clínica

**Ejemplo para sobredosis:**
```
Posible sobredosis de opioides (oxicodona+alcohol).
Los síntomas incluyen respiración lenta, somnolencia extrema.
Puede ser mortal en minutos. Necesitas ayuda médica YA.
```

---

### 5.3 Compartir Ubicación (si autorizado)

- Mostrar estado: "📍 Ubicación compartida: ✅ Activada"
- Texto explicativo: "Si llamas a emergencias, enviaremos tu ubicación aproximada para que te encuentren rápido."
- Permitir desactivar temporalmente (por privacidad) pero con advertencia: "Desactivar puede retrasar ayuda."

---

### 5.4 Opción de "Volver al chat"

**Para casos naranja/amarillo** (no inminente):
- Botón secundario: "Volver al chat" → cierra pantalla de emergencia y vuelve al chatbot
- Al volver, el botón 🆘 sigue visible por si la situación empeora

**Importante:** No ocultar completamente la opción de "no emergencia", porque podría ser falsa alarma o el usuario necesita tiempo para procesar.

---

### 5.5 Información de Contactos Disponibles

**Mostrar lista de contactos relevantes:**

```
Tus contactos disponibles:
• María (Mamá) 📞 +56 9 XXXX XXXX
• Dr. Pérez 📞 +56 9 XXXX XXXX
• Clínica San Martín 📞 +56 2 XXXX XXXX
```

**Orden:** por cercanía emocional + relevancia médica.

---

## 6. Flujo de Decisión y Priorización

### 6.1 Jerarquía de Acciones

1. **Emergencia médica vital** (911) → PRIORIDAD 1
2. **Suicidio inminente** (988) → PRIORIDAD 1
3. **Contacto familiar designado** → PRIORIDAD 2
4. **Médico/Clínica** → PRIORIDAD 2
5. **Terapeuta** → PRIORIDAD 3
6. **Volver al chat** → solo si no hay riesgo inmediato

**Color coding:**
- 🔴 Rojo: 911, 988 (si suicidio)
- 🟠 Naranja: Clínica, médico
- 🟢 Verde: Familiar
- ⚪ Blanco: Volver

---

### 6.2 Confirmaciones antes de Llamar

**Para 911:**
```
¿Llamar a 911?
Este números es para emergencias reales.
Si no es una emergencia, podrías causar que
no llegue ayuda a alguien que sí la necesita.

[ Llamar ahora ] [ Cancelar ]
```

**Para contacto familiar:**
```
¿Llamar a [María] ahora?
Le avisaremos que estás en una situación de riesgo.
```

**Para 988:**
```
¿Llamar a la línea 988?
Te conectarán con un consejero capacitado
en crisis de suicidio. Es confidencial.
```

---

### 6.3 Si Usuario No Responde

**Protocolo de auto-activación (si usuario autorizó previamente):**

1. Pantalla de emergencia se muestra, usuario no toca nada en 30 segundos
2. Sistema envía notificación push: "¿Todo bien? Toca si necesitas ayuda."
3. Si no responde en otros 30 segundos:
   - Notificar a contacto de emergencia designado: "[Nombre] está en crisis. Por favor contáctalo."
   - Si tiene ubicación autorizada → compartir ubicación aproximada con contacto
4. Si hay riesgo de sobredosis confirmada → llamar a 911 automáticamente (solo si usuario dio consentimiento explícito en onboarding)

---

## 7. Casos Específicos por Perfil

### 7.1 Valeria (Interrupción abrupta - síntomas médicos)

```
🚨 EMERGENCIA MÉDICA - ABSTINENCIA SEVERA

Síntomas reportados: vómitos constantes, insomnio, ansiedad extrema.
Esto puede llevar a deshidratación grave y complicaciones cardiacas.

**Acciones:**
[ 🏥 Ir a Urgencias (Clínica X) ]  ← prioridad
[ 📞 Llamar a mi médico Dr. Y ]   ← secundaria
[ 💧 Tomar agua cada 10 min ]      ← consejo mientras

NO tomes más sustancias. Si no retienes líquidos,
ve al hospital AHORA.
```

### 7.2 Rodrigo (Opioides + alcohol - sobredosis)

```
🚨 RIESGO DE SOBREDOSIS

Combinaste oxicodona + whisky. Eso puede causar
depresión respiratoria (respiración lenta o para).

**Señales de alarma:**
• Respiración <8 por minuto
• Somnolencia extrema, no despierta
• Pupilas pequeñas (como puntos)

**Si aparecen这些 síntomas:**
1. Llama a 911 INMEDIATAMENTE
2. Si tienes naloxona, adminístrala
3. No los dejes solos

¿Tienes naloxona? [ Sí ] [ No ]
```

### 7.3 Sofía (Trauma - riesgo de autolesión/madre)

```
⚠️ CRISIS DE SEGURIDAD

Estás experimentando un craving intenso y
pensamientos de autolesión. También mencionaste
un incidente con tu hija.

**Prioridades:**
1. Tu seguridad y la de tu hija.
2. No estás sola, hay ayuda.

**Acciones:**
[ 🆘 Línea de crisis 988 ] - confidencial
[ 👶 Línea de protección infantil 149 ] - si riesgo a hija
[ 👥 Hablar con trabajadora social ]
[ 🏡 Ir a refugio para madres ]

Si sientes que vas a hacerte daño o dañar a tu hija,
llama a emergencias AHORA.
```

### 7.4 Lucas (Adolescente - suicidio)

```
🚨 AYUDA INMEDIATA

Lo que escribiste suena como si estuvieras
pensando en hacerte daño. No estás solo.

**Líneas para tu edad:**
[ 📞 Línea adolescente 111 ] (Chile)
[ 💬 Chat de crisis teen ] (link)
[ 🆘 Llamar a 988 ]

También podés:
• Hablar con tu psicólogo escolar
• Ir a la enfermería del colegio
• Contarle a un adulto de confianza

¿Querés que llamemos a alguien por vos?
```

---

## 8. Diseño para Accesibilidad

### 8.1 Visual
- **Contraste muy alto**: fondo blanco o amarillo pálido, texto negro/rojo
- **Botones grandes**: mínimo 80dp alto, 200dp ancho
- **Iconos gigantes**: 64dp o más
- **Texto base**: 24sp para emergencias (más grande que normal)

### 8.2 Navegación
- Orden de foco: Botón 1 (911/988) → Botón 2 (contacto) → Botón 3 (volver)
- TalkBack/VoiceOver: anunciar "Botón de emergencia, LLAMAR A 911"
- Permitir activación con comando de voz: "Llama a emergencias"

### 8.3 Redundancia
- No solo color para indicar urgencia (también texto "LLAMAR AHORA")
- Símbolos internacionales (teléfono, sirena)

---

## 9. Consideraciones Técnicas

### 9.1 Offline-Capable

- Pantalla de emergencia debe cargarse **sin conexión** (cacheada previamente)
- Números de emergencia almacenados localmente (988, 911, contactos)
- Mapa offline básico (para "hospital más cercano") si es posible

### 9.2 Llamadas telefónicas

- Usar `tel:` links para abrir dialer
- No realizar llamadas automáticas sin confirmación explícita (excepto en protocols pre-autorizados)
- Si el teléfono no puede llamar (tablet sin SIM) → mostrar mensaje: "Por favor, usa un teléfono para llamar."

### 9.3 Ubicación

- Solo se solicita si usuario autorizó en Configuración de Emergencia
- Usar GPS exacto solo si es necesario; aproximada por celda es suficiente
- No almacenar ubicación más allá de la sesión de emergencia (a menos que se envíe a contacto)

### 9.4 Logging y Privacidad

- **Registrar** la activación de pantalla de emergencia (timestamp, nivel, motivo)
- **No registrar** llamadas realizadas (privacidad)
- Si se contacta a un familiar, loggear: " notified contact X at Y" (para auditoría)
- Eliminar logs de emergencia después de 90 días (a menos que required por ley)

---

## 10. Flujos de Ejemplo

### Flujo A: Suicidio inminente (Rojo)

1. Usuario escribe: "Me voy a tirar del edificio, no aguanto más"
2. Sistema detecta keywords + tono desesperanzado → activa pantalla de emergencia Roja
3. Pantalla muestra: 988, 911, contacto principal
4. Si usuario no toca nada en 60s:
   - Envía notificación push
   - Si autorizó, notifica a contacto principal
5. Si usuario toca "988" → abre dialer con 988
6. Si usuario toca "Volver al chat" → cierra pantalla, chatbot pregunta: "¿Todo bien? ¿Quieres seguir hablando?"

### Flujo B: Sobredosis (Rojo)

1. Usuario registra: "Tomé 60mg de oxicodona y 4 whiskies, no puedo mantenerme despierto"
2. Sistema detecta combinación peligrosa → pantalla emergencia médica
3. Prioridad: 911
4. Mostrar: "Respiración lenta? Si es así, llama a 911 YA"
5. Ofrecer también: "Llamar a tu médico"

### Flujo C: Crisis de maternidad (Naranja → Rojo si progresivo)

1. Sofía escribe: "Grité a mi hija y ahora tiene miedo. Soy mala madre."
2. Sistema detecta posible riesgo a menor → pantalla naranja (no roja aún)
3. Mostrar: líneas de protección infantil, sugerir pausa, contactar trabajadora social
4. Si Sofía escribe: "Quiero lastimarla" → subir a Rojo, añadir 911

---

## 11. Testing de la Pantalla de Emergencia

### Test 1: Activación automática
- Escribir "me voy a matar" → debe aparecer pantalla de emergencia sin dilación

### Test 2: Jerarquía de botones
- Orden: 988/911 primero, luego contacto, luego otros

### Test 3: Offline
- Desactivar WiFi/3G → pantalla debe cargarse igual (con datos cacheados)

### Test 4: Accesibilidad
- TalkBack debe leer: "Botón, LLAMAR A EMERGENCIA 911, presiónelo dos veces para llamar"

### Test 5: Falsa alarma
- Usuario activa emergencia por error → puede volver atrás sin llamar

### Test 6: Sin contactos
- Usuario sin contacto configurado → mostrar solo 988/911 y opción de configurar

---

## 12. Roadmap

**Fase 1 (MVP):**
- Pantalla simple con botones grandes (911, 988, contacto)
- Activación solo manual (botón 🆘)
- Offline cache

**Fase 2:**
- Activación automática por detección de lenguaje
- Confirmaciones before llamar
- Preview de contactos

**Fase 3:**
- Integración con servicios de emergencia locales (API de ubicación a 911)
- Modo "Falsa alarma" para training
- Historial de activaciones (con consentimiento)

---

*Documento vivo. Se ajustará con feedback de usuarios y pruebas de estrés.*

