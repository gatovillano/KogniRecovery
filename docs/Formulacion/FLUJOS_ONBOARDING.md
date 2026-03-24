# Flujos de Onboarding - App de Acompañamiento en Adicciones

**Objetivo**: Capturar información mínima necesaria para:
- Asignar perfil correcto (tono, estrategias, riesgos)
- Configurar sistema de apoyo (familiar, contacto emergencia)
- Establecer límites de privacidad y compartimiento
- Obtener consentimiento informado
- Personalizar experiencia desde el minuto 1

---

## Flujo General de Onboarding

### Pantalla 1: Bienvenida y Consentimiento

**Contenido:**
- Logo/nombre app (discreto, según perfil: "Bienestar Personal" para adultos, "LÚA" para jóvenes)
- Frase: "Te acompañamos en tu proceso, con respeto y sin juicios. Importante: no sustituimos terapia profesional. En emergencia, contacta a tu médico o línea de crisis."
- Checkbox obligatorio: "Acepto términos de servicio y política de privacidad" (link a documento)
- Botón: "Comenzar"

**Validación:**
- No avanzar sin aceptar
- Edad mínima: 13 años (con consentimiento parental) - si detecta edad <18, mostrar ruta diferente

---

### Pantalla 2: Selección de Rol

**Pregunta:** "¿Quién eres?"

Opciones:
1. **Estoy evaluando mi consumo** (paciente)
2. **Soy familiar/cuidador** (familiar)
3. **Soy profesional de la salud** (terapeuta - flujo separado, no cubierto aquí)

**Lógica:**
- Si elige "familiar" → flujo de onboarding de familiar (ver sección específica)
- Si elige "paciente" → continuar con Pantalla 3

---

### Pantalla 3: Datos Básicos (Paciente)

**Formulario:**

1. **Edad** (number input)
   - Si <18: mostrar advertencia "Necesitas consentimiento de tus padres para ciertas funciones. ¿Tienes su permiso?" → Si no, limitar funcionalidades (no vincular familiar, solo modos de crisis)
   - Si 13-17: ruta "adolescente" específica (lenguaje apropiado, confidencialidad reforzada)
   - Si 18+: continuar normal

2. **Género** (select: Mujer, Hombre, No binario, Prefiero no decir)
   - Para ajustar lenguaje y considerar riesgos diferenciales (ej: mujeres + trauma)

3. **País de residencia** (select con lista priorizada: AR, MX, CL, CO, ES, USA, Otro)
   - Para mostrar líneas de crisis locales, adaptar ejemplos culturales

4. **¿Cuál es tu sustancia principal?** (multi-select con priorización)
   - Alcohol
   - Cannabis (marihuana, porros)
   - Cocaína
   - Metanfetamina
   - Opioides (heroína, oxicodona, morfina)
   - Benzodiacepinas (alprazolam, diazepam)
   - Policonsumo (más de 2)
   - Otra: _______
   - **Nota**: si elige "policonsumo" o "otra", preguntar detalle en pantalla siguiente

5. **¿Consumes actualmente?** (radio: Sí, No pero en el pasado, No consumo)
   - Si "No consumo": asignar perfil "recaída preventiva" (diferente, no cubierto en personas actuales) → flujo de prevención
   - Si "No pero en el pasado": asignar perfil "mantención" (como Carmen)
   - Si "Sí": continuar

6. **¿Cuánto consumes?** (approx)
   - Depende de sustancia:
     - Alcohol: "Número de copas/día (1 copa = 150ml vino, 350ml cerveza, 45ml destilado)"
     - Cannabis: "Porros/día o gramos/semana"
     - Cocaína: "Gramos/día o por fin de semana"
     - Opioides: "mg/día de medicamento recetado o droga ilegal"
   - Rangos: slider o select (0-1, 2-3, 4-6, >6)
   - Importante: normalizar estimación imperfecta

7. **¿Hace cuánto consumes?** (select: <6 meses, 6-12 meses, 1-3 años, 3-5 años, >5 años)
   - Para evaluar tolerancia, riesgos acumulados

---

### Pantalla 4: Etapa de Cambio (Self-report)

**Pregunta:** "¿Cómo te sientes respecto a tu consumo hoy?"

Opciones (basadas en Prochaska):
1. **No veo problema** (Precontemplación)
2. **Estoy pensando en cambiar, pero dudo** (Contemplación)
3. **Quiero cambiar y estoy planeando cómo** (Preparación)
4. **Estoy activamente reduciendo o dejando** (Acción)
5. **Llevo tiempo sin consumir o enlow consumo** (Mantención)

**Ayuda visual:**
- Cada opción con descripción corta (ej: "Acción: ya empecé a reducir, pero me cuesta")
- Permitir cambiar después

**Lógica:** Esta respuesta + datos de Pantalla 3 → asignar perfil específico (ver Matriz de Asignación en PROMPTS_POR_PERFIL.md)

---

### Pantalla 5: Contexto de Vida (Factores de Riesgo/Protección)

**Preguntas (select/multi-select):**

1. **Situación familiar**
   - Vivo solo/a
   - Vivo con mi pareja
   - Vivo con mis padres
   - Vivo con mis hijos
   - Vivo con roommates

2. **¿Tienes diagnóstico de salud mental?** (depresión, ansiedad, TDAH, TEPT, etc.)
   - Sí (especificar si quiere)
   - No
   - Prefiero no decir

3. **¿Tienes trauma pasado significativo?** (abuso, violencia, pérdida)
   - Sí (no forzar detalle)
   - No
   - Prefiero no decir

4. **¿Tienes apoyo terapéutico actual?**
   - Sí (psicólogo/psiquiatra/terapeuta)
   - No, pero me interesaría
   - No, y no quiero ahora

5. **¿Tienes contacto de emergencia?** (persona de confianza)
   - Sí (nombre, teléfono)
   - No

**Nota:** Si elige "No" en contacto de emergencia, insistir suavemente: "Es recomendable tener alguien a quien llamar en crisis. ¿Un familiar, amigo?" pero no forzar.

---

### Pantalla 6: Asignación de Perfil (Automática + Confirmación)

**Sistema calcula perfil** basado en:
- Edad (rango: adolescente, joven adulto, adulto medio, adulto mayor)
- Sustancia + cantidad (riesgo)
- Etapa de cambio
- Contexto familiar (hijos, vive solo)
- Salud mental (sí/no)

**Mostrar al usuario:**
"Basado en lo que nos contaste, vamos a personalizar la app para ti. Creemos que tu perfil es: **'[Nombre de perfil]'**.

Esto significa:
- El tono será: [tono: formal/cercano/coloquial]
- Nos enfocaremos en: [objetivos principales]
- Te mostraremos información relevante a tu situación"

**Botones:**
- "Sí, ese soy yo" (continuar)
- "No, prefiero otro enfoque" → mostrar 2-3 perfiles alternativos para elegir manualmente

**Ejemplo para Diego (47, alcohol, precontemplación):**
"Basado en tu perfil,配置aremos:
- Tono profesional, no moralizante
- Enfoque en salud física y bienestar
- Metas de reducción, no abstinencia
¿Te parece?"

---

### Pantalla 7: Configuración de Emergencia (Opcional pero muy recomendado)

**Objetivo:** Tener contactos de emergencia listos si el usuario entra en crisis.

**Pregunta:** "¿Quién debe contactarse si entras en una situación de riesgo?"

**Formulario:**

1. **Contacto principal de emergencia**
   - Nombre: ______
   - Teléfono/email: ______
   - Relación: (pareja, padre, hijo, amigo, terapeuta)
   - Autorización: "¿Autorizas a que le enviemos un mensaje si detectamos que estás en riesgo? (Sí/No)"

2. **Contacto secundario** (opcional)
   - Same fields

3. **Línea de crisis preferida** (pre-llenada según país, pero editable)
   - Mostrar: "Te recomendamos: [línea local]. ¿Quieres agregar otra?"

4. **Permiso de geoposición en emergencia** (solo si usuario acepta)
   - "¿Permitir que compartamos tu ubicación aproximada con emergencias en caso de riesgo inminente? (Sí/No)"
   - Explicar: "Solo se usará si activamos protocolo de emergencia. No se comparte en otros casos."

**Checkbox final:** "Entiendo que en casos de emergencia real (riesgo de vida), podríamos contactar a estas personas o servicios. Esto es para protegerme."

---

### Pantalla 8: Configuración de Privacidad y Compartimiento (Si el usuario va a vincular familiar)

**Esta pantalla solo aparece si el usuario seleccionó que quiere vincular a un familiar en Pantalla 5 o después.**

**Pregunta:** "¿Qué información estás cómodo/a compartiendo con tu sistema de apoyo (familiar, cuidador)?"

**Opciones (checkboxes):**
- [ ] Logros y metas cumplidas (ej: "7 días sin consumir")
- [ ] Estado emocional (escala diaria, sin detalles)
- [ ] Asistencia a terapia/grupos
- [ ] Síntomas de craving (solo si decides compartirlos)
- [ ] Sesiones de chat (lo que escribas en el chat, NO se comparte por defecto)
- [ ] Ubicación aproximada (solo en crisis)
- [ ] LÚA, prefiero privacidad total (entonces no vincular)

**Leyenda:** "Puedes cambiar esto en cualquier momento en Ajustes."

**Pregunta siguiente:** "¿Quién es tu familiar/cuidador?"

- Nombre: ______
- Teléfono/email: ______
- Relación: ______

**Acción:** Enviar invitación (SMS/email) con enlace de registro para el familiar.

---

### Pantalla 9: Onboarding Específico por Perfil (Condicional)

Dependiendo del perfil asignado, mostrar pantalla personalizada de 1-2 pantallas adicionales:

**Para Adolescentes (Lucas):**
- "Esta app es confidencial. Tus padres NO verán nada a menos que tú autorices."
- "¿Quieres un PIN para abrir la app?" (sí/no)
- "¿Quieres que te avise cuando sea hora de estudiar/dormir?" (notificaciones)

**Para Adultos Mayores (Eliana, Rodrigo):**
- "¿Prefieres que las respuestas se lean en voz alta?" (sí/no)
- "Tamaño de letra: Normal / Grande / Muy grande"
- "¿Tienes alguien que pueda ayudarte a configurar esto?" (opción de invitar a familiar que configure por ella)

**Para Pacientes en Interrupción Abrupta (Valeria):**
- Advertencia fuerte: "Estás en una situación médica grave. Esta app no reemplaza el hospital. Si tienes síntomas severos (vómitos constantes, taquicardia, confusión), llama a tu clínica AHORA."
- Preguntar: "¿Tienes cita con tu médico en las próximas 48h?" (si no, ofrecer buscar una)
- Configurar contacto de emergencia obligatorio (roommate, clínica)

**Para Pacientes con Trauma (Sofía):**
- "Aquí eres libre de saltar cualquier pregunta. Tu seguridad es primero."
- "¿Quieres que los mensajes se borren automáticamente después de 24h?" (sí/no)
- "¿Necesitas un botón rápido para 'no me siento safe'?" (activar)

**Para Pacientes en Reducción Gradual (Mariano):**
- "Vamos a configurar tu meta de reducción. ¿Cuánto consumes ahora y a qué cantidad quieres llegar en 4 semanas?"
- "¿Quieres recordatorios de medicación?" (configurar horarios)

---

### Pantalla 10: Finalización y Primera Acción Guiada

**Resumen:**
"¡Ya está! tu perfil es [perfil]. Has configurado:
- [ ] Emergencia: [contacto]
- [ ] Privacidad: [nivel de compartimiento]
- [ ] [Otra cosa]"

**Llamada a la acción inmediata:**
"Te sugerimos hacer ahora:

**Check-in inicial:**
- ¿Cómo te sientes hoy? (escala 1-10)
- ¿Consumiste hoy? (sí/no, cantidad)
- [Otras preguntas según perfil]

O puedes explorar la app libremente."

**Mostrar botón destacado:** "Hacer mi primer check-in"

**Alternativa:** "Luego, más tarde"

**Si el usuario hace check-in inmediato:**
- Mostrar respuesta del chatbot con tono del perfil (ej: para Diego: "Registro tomado. Tu consumo esta semana: X. ¿Quieres ver cómo compara con el promedio?").
- Celebrar primer uso: "¡Bienvenido/a! Estamos aquí para acompañarte."

---

## Flujo del Familiar (Roberto)

### Pantalla A1: Registro de Familiar

**Llega por enlace de invitación del paciente.**

**Pantalla:**
- "Te invitaron a acompañar a [nombre del paciente] en su proceso. ¿Aceptas?"
- Mostrar nombre del paciente (solo nombre, no más detalles)
- Aceptar / Rechazar

**Si acepta:**
- Crear cuenta (email/teléfono, contraseña)
- Aceptar términos de privacidad (aclarar que solo verá lo que el paciente comparta)

---

### Pantalla A2: Onboarding del Familiar

**Preguntas:**
1. ¿Cuál es tu relación con [paciente]? (pareja, padre, hermano, amigo, otro)
2. ¿Cómo te gustaría ayudar?
   - Recibir actualizaciones de su bienestar
   - Enviar mensajes de apoyo
   - Recibir alertas si está en crisis
   - Educarme sobre la adicción para entender mejor
3. ¿Qué tipo de información te gustaría ver? (mostrar opciones que paciente habilitó)
4. Configurar notificaciones: ¿cuándo quieres que te lleguen alertas?
   - Solo emergencias
   - Logros compartidos
   - Pedidos de apoyo
   - Cambios en estado emocional

---

### Pantalla A3: Primer Vistazo (Dashboard inicial)

**Mostrar:**
- "Bienvenido/a. Aquí verás solo la información que [paciente] decidió compartir."
- Por defecto: nada hasta que paciente comparta algo
- Mostrar "Botones de apoyo" predefinidos que puede enviar (ej: "Estoy aquí para ti", "¿Necesitas algo?", "Te quiero")
- Tutorial rápido: "Así es como funciona..."

---

## Consideraciones Técnicas de Implementación

### Almacenamiento de Perfil
- Guardar en base de datos de usuario: `profile_type` (string, valores: "lucas_adolescente", "camila_universitaria", "diego_profesional", "eliana_mayor", "sofia_trauma", "rodrigo_opioides", "rosario_rural", "roberto_familiar", "base")
- También guardar `risk_level` (bajo/medio/alto/crítico) basado en sustancia y cantidad

### Actualización de Perfil
- Permitir al usuario cambiar manualmente su perfil en Ajustes
- Permitir re-evaluación automática cada 3 meses (etapa de cambio puede evolucionar)

### Asignación Automática (Lógica)

```javascript
function assignProfile(data) {
  const { edad, sustancia, cantidad, etapa, hijos, saludMental, trauma } = data;

  // Adolescentes
  if (edad >= 13 && edad <= 17 && sustancia === 'cannabis') {
    return 'lucas_adolescente';
  }

  // Jóvenes adultos policonsumo
  if (edad >= 21 &&edad <= 25 &&['cocaine','mdma','alcohol'].some(s=> sustancia.includes(s))) {
    return 'camila_universitaria';
  }

  // Adulto medio alcohol precontemplación
  if (edad >= 35 && edad <= 50 && sustancia === 'alcohol' && etapa === 'precontemplacion') {
    return 'diego_profesional';
  }

  // Adulto mayor polifarmacia
  if (edad >= 65 && ['alcohol','benzos','opioides'].some(s=> sustancia.includes(s))) {
    return 'eliana_mayor';
  }

  // Mujer joven trauma + estimulantes
  if (edad >= 25 && edad <= 30 && genero === 'mujer' && trauma === 'si' && ['meth','cocaine'].includes(sustancia)) {
    return 'sofia_trauma';
  }

  // Hombre mayor opioides recetados
  if (edad >= 65 && sustancia === 'opioides' && dosis >= 20) {
    return 'rodrigo_opioides';
  }

  // Rural alcohol
  if (contextoRural === 'si' && sustancia === 'alcohol') {
    return 'rosario_rural';
  }

  // Default
  return 'base';
}
```

---

## Validación y Pruebas del Onboarding

**Test 1:** Usuario Diego (47, alcohol, precontemplación)
- Debe asignarse perfil "diego_profesional"
- Tono resultante: sin palabras "adicción", enfoque en "bienestar"
- Dashboard: solo métricas de salud física, comparación con pares

**Test 2:** Usuario Lucas (16, cannabis)
- Debe asignarse perfil "lucas_adolescente"
- Tono: coloquial, emojis, referencias jóvenes
- Confidencialidad reforzada

**Test 3:** Usuario sin perfil claro (ej: 30 años, alcohol, etapa preparación)
- Debe caer en perfil "base" (neutro)
- Sin adaptaciones específicas

**Test 4:** Familiar (Roberto)
- Flujo separado, solo ve datos que paciente compartió
- Botones de apoyo predefinidos

---

## Errores Comunes a Evitar

1. **Asignar perfil incorrecto por generalizar**
   - Solución: permitir override manual en Ajustes

2. **No capturar etapa de cambio**
   - Solución: Pantalla 4 obligatoria

3. **Obligar a vincular familiar**
   - Solución: hacerlo opcional, no penalizar si no lo hace

4. **No dar opción de "no sé" en preguntas delicadas** (trauma, salud mental)
   - Solución: incluir "Prefiero no decir" en todos los select

5. **Pedir datos muy precisos que el usuario no recuerda** (cantidad exacta de gramos)
   - Solución: usar rangos, permitir "aproximadamente"

6. **No explicar uso de datos de emergencia**
   - Solución: lenguaje claro en Pantalla 7 sobre cuándo y cómo se contactará a emergencias

---

## Próximos Pasos tras Onboarding

1. **Check-in inicial** (pregunta 1-2) → calentar el chatbot
2. **Tour rápido de la app** (dónde está dashboard, chat, configuración)
3. **Sugerir primera acción** según perfil:
   - Lucas: "¿Querés programar un reminder para no fumar a las 19:00?"
   - Diego: "¿Conectás tu Fitbit para ver correlación bebida-sueño?"
   - Roberto: "¿Enviaste un mensaje de apoyo a [paciente] hoy?"

---

*Documento vivo: se ajustará con feedback de usuarios en pruebas.*

