# Diseño UX/UI - Check-in Diario

## 1. Objetivos de la Pantalla

- Capturar diariamente: estado emocional, consumo, cravings, actividades de recuperación
- Ser rápido (menos de 1 minuto) para no generar fricción
- Adaptar preguntas al perfil y sustancia
- Proveer feedback inmediato (refuerzo positivo o alerta)

---

## 2. Flujo de Pantalla

### Variante A: Check-in Rápido (default)
```
┌─────────────────────────────────────────────┐
│  ← Volver                                    │
│  Check-in de hoy                            │
├─────────────────────────────────────────────┤
│  😊 ¿Cómo te sientes?                       │
│  [Emoji grande seleccionable]               │
│  Escala: 1 😞 ... 5 😐 ... 10 😊            │
│                                             │
│  📝 ¿Consumiste hoy?                       │
│  ○ Sí   ○ No                                │
│                                             │
│  [Si Sí → aparece:                         │
│   ¿Qué consumiste? _______________________ │
│   ¿Cuánto? [Slider o select]               │
│   ¿A qué hora? [Time picker]]              │
│                                             │
│  🔥 ¿Tuviste cravings?                    │
│  ○ Sí (intensidad: 1-10) ○ No              │
│  [Si Sí → ¿Qué lo desencadenó? ___________]│
│                                             │
│  ✅ ¿Qué actividades de recuperación       │
│     hiciste hoy? (multi-select)            │
│  [✓] Terapia   [ ] Ejercicio   [ ] Grupo  │
│  [ ] Meditación [ ] Reunión AA [ ] Otro   │
│                                             │
│  📝 Notas (opcional)                       │
│  [____________________________]            │
│                                             │
│  [Guardar] (botón primario)                │
└─────────────────────────────────────────────┘
```

---

### Variante B: Check-in Detallado (accesible desde "Más opciones")
- Incluye todas las opciones de Variante A
- Añade:
  - ¿Cómo dormiste anoche? (escala 1-10)
  - ¿Tomaste tu medicación? (sí/no)
  - ¿Tuviste pensamientos de autolesión? (sí/no) → si sí, activar protocolo emergencia
  - ¿Algo más que quieras destacar? (campo multi-línea)

---

## 3. Componentes Detallados

### 3.1 Selector de Estado Emocional (Mood)

**Diseño:**
- Emoji grande (80x80dp) centrado
- Debajo: "¿Cómo te sientes?"
- Debajo: slider numérico 1-10 (o botones circulares 1-10)
- Debajo: campo de texto "Palabras clave (opcional)" → autocomplete con sugerencias: "ansiedad", "estrés", "triste", "cansado", "motivado", "solo", etc.

**Feedback visual:**
- Al mover slider, cambiar color del emoji (1-3: rojo/amarillo, 4-7: neutral, 8-10: verde/azul)
- Mostrar mensaje breve según rango:
  - 1-3: "Es normal sentirse mal a veces. ¿Quieres hablar con tu coach?"
  - 4-7: "Bien. Seguí así."
  - 8-10: "¡Genial! Celebrá ese estado."

**Adaptaciones por perfil:**
- **Adolescentes**: emojis más animados, colores brillantes
- **Mayores**: emoji más simple, slider grande, evitar colores muy brillantes
- **Sofía (trauma)**: validación siempre: "Lo que sientes es válido"

---

### 3.2 Consumo

**Pregunta 1: "¿Consumiste hoy?"**
- Radio buttons: ○ Sí ○ No ○ Prefiero no decir
- Si "Sí" → mostrar campos adicionales (no obligatorios todos)

**Campos adicionales:**

1. **Sustancia** (select)
   - Opciones filtradas según perfil (ej: para Diego mostrar alcohol, para Mariano cocaína)
   - Opción "Otro" → text input

2. **Cantidad** (depende de sustancia)
   - Alcohol: "¿Cuántas copas?" (slider 0-10 o select: 1-2, 3-4, 5+)
   - Cannabis: "¿Cuántos porros?" o "¿Gramos?" (según perfil)
   - Cocaína: "¿Gramos?" (0.5, 1, 1.5, 2+)
   - Opioides: "¿Dosis en mg?" (number input)
   - Policonsumo: permitir múltiples entradas (lista)

3. **Hora aproximada** (time picker)
   - Default: ahora
   - Si es de madrugada (ej: 3am), sugerir "¿Fue anoche?" → fechar ayer

4. **Contexto** (opcional)
   - "¿Dónde o con quién?" (texto libre)
   - "¿Trigger?" (select: estrés, social, aburrimiento, craving físico, otro)

**Validación:**
- No forzar cantidad exacta; aceptar "aproximadamente"
- Si cantidad muy alta (>umbral según sustancia), mostrar advertencia: "Esa cantidad es peligrosa. Considera buscar ayuda."

---

### 3.3 Cravings

**Pregunta: "¿Tuviste cravings hoy?"**
- Radio: ○ Sí ○ No

**Si Sí:**

1. **Intensidad** (1-10 slider)
   - 1-3: leve
   - 4-6: moderado
   - 7-10: intenso

2. **Sustancia** (select, default = sustancia principal del perfil)
   - Si policonsumo: permitir múltiples

3. **Trigger/Contexto** (texto + autocomplete)
   - Sugerencias: "estrés laboral", "ansiedad social", "aburrimiento", "ver amigos", "hambre", "insomnio"

4. **¿Cómo lo manejaste?** (multi-select)
   - [ ] Usé técnica de respiración
   - [ ] Hablé con alguien
   - [ ] Me distraje con actividad
   - [ ] Cedí y consumí
   - [ ] Otro: _______

---

### 3.4 Actividades de Recuperación

**Multi-select con opciones comunes:**

- [ ] Terapia psicológica
- [ ] Grupo de apoyo (AA, NA, etc.)
- [ ] Ejercicio físico (tipo: ______)
- [ ] Meditación / Mindfulness
- [ ] Llamada a familiar/amigo de apoyo
- [ ] Lectura de autoayuda
- [ ] Reunión con sponsor
- [ ] Otra: _________

**Adaptación por perfil:**
- **Mariano (reducción)**: incluir "Tomé medicación psiquiátrica"
- **Valeria (interrupción abrupta)**: incluir "Contacté a mi médico", "Me hidraté"
- **Rosario (rural)**: "Trabajé en el campo", "Fui a grupo local"

---

### 3.5 Notas Libres

- Textarea placeholder: "¿Algo más que quieras contar hoy? (opcional)"
- Limite: 500 caracteres

---

## 4. Flujo de Decisión y Feedback Inmediato

### Después de Guardar

**Caso 1: Consumo ≤ meta progreso**
- Mostrar mensaje positivo: "¡Buen progreso! Llevas X días reduciendo."
- Sugerir: "¿Quieres compartir este logro con tu sistema de apoyo? (solo si permiso)"
- Animación: confetti sutil

**Caso 2: Consumo > meta o exceso**
- Mostrar mensaje empático: "Entiendo que fue un día difícil. Mañana puedes volver a intentar."
- Ofrecer: "¿Quieres hablar de qué pasó? Abre el chatbot."
- No juzgar, normalizar: "Las recaídas son parte del proceso."

**Caso 3: Cravings altos (8-10)**
- Mostrar advertencia: "El craving fue intenso. Recuerda que tienes técnicas de urgencia en el chatbot."
- Sugerir: "¿Probaste alguna técnica? Si no, te recomiendo la 4-7-8."

**Caso 4: Sin check-in por >3 días**
- Enviar notificación push: "¿Todo bien? Te extrañamos. Haz tu check-in."
- Dashboard mostrará: "Último check-in hace 4 días"

---

## 5. Preguntas Condicionales (Lógica)

### Si usuario = Lucas (adolescente)
- Cambiar "Consumiste" por "Fumaste"
- Sustancias: solo cannabis (ocultar otras)
- Contexto: añadir "presión de amigos", "aburrimiento en escuela"
- Multi-select actividades: "Fui al club", "Jugué videojuegos", "Estudié"

### Si usuario = Diego (adulto medio)
- Cantidad alcohol: "copas" con referencia: "1 copa = 150ml vino, 350ml cerveza"
- Añadir: "¿Cómo afectó tu sueño?" (después de consumo)
- Actividades: "Caminata", "Familia", "Trabajo"

### Si usuario = Eliana (mayor)
- Letra grande
- Sliders simples (1-5 en lugar de 1-10)
- Pregunta abierta: "¿Se sintió mal después de tomar?" (sí/no)
- Actividades: "Llamé a mi hija", "Salí a comprar", "Vi tele"

### Si usuario = Valeria (interrupción abrupta)
- Pregunta obligatoria: "¿Síntomas de abstinencia?" (náuseas, vómitos, insomnio, ansiedad extrema)
- Si reporta vómitos constantes → alerta: "Deshidratación grave. Ve a tu clínica."
- Si reporta craving con ideación de recaída → activar protocolo naranja
- Actividades: "Contacté mi médico", "Me hidraté", "Usé técnica grounding"

### Si usuario = Sofía (trauma)
- Trigger opcional, pero si escribe "hija" + "grité" → activar protocolo madre
- Actividades: "Practiqué pausa antes de reaccionar", "Usé técnica TIPP"
- Nota: "Te creo, lo que sentís es válido"

---

## 6. Validación y Restricciones

### No permitir guardar si:
- No ha seleccionado estado emocional (pero permitir "Prefiero no decir")
- No ha respondido "Consumió" → obligatorio (sí/no/no decir)
- Cantidad de consumo: si ingresa número imposible (ej: 100 copas) → warning: "¿Seguro? Esa cantidad es peligrosa."

### Guardar siempre:
- Timestamp (fecha.checkin_date = hoy, o ayer si fue madrugada)
- user_id
- version del schema (para migraciones futuras)

---

## 7. Interacción con el Chatbot

### Si usuario marca craving alto (≥7)
- Después de guardar, mostrar mensaje: "El craving fue intenso. ¿Quieres que el coach te ayude ahora?"
- Botón: "Hablar con coach" → abre chat con mensaje prefilled: "Tengo un craving de [sustancia] intenso (8/10), necesito ayuda urgente."

### Si usuario reporta síntomas de abstinencia severa (Valeria: vómitos constantes, Rodrigo: dolor 9/10 + sin medicación)
- Mostrar alerta: "Esos síntomas pueden ser graves. ¿Has contactado a tu médico?"
- Botón: "Buscar médico ahora" → abre mapa/contactos

---

## 8. Pantalla de Éxito (Post-checkin)

```
┌─────────────────────────────────────────────┐
│          ✅ ¡Check-in completado!           │
│                                             │
│  Hoy registraste:                          │
│  - Estado: Ansiedad 7/10                   │
│  - Consumo: 0 (¡bien!)                     │
│  - Craving: 3/10, trigger: estrés          │
│  - Actividades: ejercicio, terapia        │
│                                             │
│  ¡Seguí así! Mañana te esperamos aquí.     │
│                                             │
│  [Volver al dashboard]                     │
│  [Hablar con tu coach]                     │
└─────────────────────────────────────────────┘
```

**Si es primer check-in:**
- Celebrar: "¡Bienvenido/a a tu nuevo hábito diario!"
- Invitar a configurar metas o vincular familiar

---

## 9. Recordatorios de Check-in

### Configuración por perfil

- **Todos**: recordatorio diario a hora preferida (configurable)
- **Carmen/Mariano**: recordatorio adicional post-ansiedad (detectar patrones)
- **Rosario (rural)**: recordatorio simple, sin datos, solo "No olvides registrar"

### Contenido de notificación push

"¿Ya hiciste tu check-in de hoy? Te toma 1 minuto y te ayuda a ver tu progreso."

### Si usuario no hace check-in por 3 días
- Notificación más fuerte: "¿Todo bien? Te extrañamos. Haz tu check-in."
- Dashboard mostrará indicador de "desconexión"

---

## 10. Accesibilidad

- **Labels** en todos los inputs
- **Contraste** alto en botones
- **Tamaño táctil** mínimo 44x44dp
- **Navegación por teclado** (TalkBack/VoiceOver): orden lógico
- **Redundancia**: no solo color para intensidad (también número)

---

## 11. Especificaciones Técnicas para Devs

### API Endpoint

```
POST /api/v1/checkins
Body: {
  "checkin_date": "2025-02-12",  // o fecha actual si no se pasa
  "mood": 7,
  "mood_tags": ["ansiedad", "estrés laboral"],
  "consumed": true,
  "substance_used": "alcohol",
  "consumption_amount": "3 copas",
  "consumption_time": "19:30",
  "craving_intensity": 3,
  "craving_triggers": ["estrés laboral"],
  "recovery_activities": ["terapia", "ejercicio"],
  "notes": "Me sentí mejor después de caminar"
}
Response: 201 Created + checkin object
```

### Validación backend

- `mood`: 1-10
- `consumed`: booleano
- Si `consumed=true` → `substance_used` requerido
- `consumption_amount`: string libre, pero podría normalizarse a rangos en análisis
- `craving_intensity`: 1-10 (opcional si consumed=false)
- `checkin_date`: no puede ser > mañana (no futuro)

### Límites

- Solo 1 check-in por día por usuario (UPDATE si existe)
- Editar check-in hasta 24h después de crear

---

## 12. Copy por Perfil (Textos de Pantalla)

| Perfil | Título | Pregunta Estado | Pregunta Consumo | Pregunta Craving | Mensaje Éxito |
|--------|--------|-----------------|------------------|------------------|---------------|
| Lucas | "Check-in diario" | "¿Cómo te sentís hoy?" | "¿Fumaste hoy?" | "¿Tuviste ganas de fumar?" | "¡Buen Firefox! Seguí así." |
| Diego | "Registro diario" | "¿Cuál es tu estado anímico?" | "¿Cuánto bebiste hoy?" | "¿Sentiste craving de alcohol?" | "Buen registro. Tu salud te lo agradece." |
| Eliana | "¿Cómo está hoy?" | "¿Cómo se siente?" | "¿ tomó hoy?" | "¿Tuvo ganas de tomar?" | "Muy bien. Cuide su salud." |
| Valeria | "Check-in médico" | "¿Cómo te sientes físicamente?" | "¿Consumiste hoy?" | "¿Craving intenso?" | "Registrar te ayuda a tu médico." |
| Sofía | "Registro seguro" | "¿Qué estás sintiendo?" | "¿Consumiste hoy?" | "¿Tuviste cravings?" | "Gracias por cuidarte. Eres fuerte." |

---

*Documento vivo: se probará con usuarios reales y se ajustará.*

