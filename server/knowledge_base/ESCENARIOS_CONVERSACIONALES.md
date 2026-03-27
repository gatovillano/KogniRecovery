# 10 Escenarios Conversacionales Clave - Chatbot de Acompañamiento en Adicciones

**Base**: Cada escenario asume que el chatbot ha identificado el perfil de usuario (PROMPTS_POR_PERFIL.md) y aplica el tono correspondiente.

---

## Escenario 1: Craving de Alcohol (Diego, 47 años, Precontemplación, viernes 18:00)

### Contexto
- Perfil: Diego, profesional, consume 4-6 copas/día, minimiza problema
- Etapa: Precontemplación (no ve problema)
- Trigger: Final de semana, estrés laboral acumulado
- Riesgo: Alto (patrón regular, riesgo cardiovascular/hepático)

### Mensaje del Usuario
"Hoy tuve un día terrible en el trabajo. Necesito un vino para relajarme."

### Respuesta del Chatbot

**Paso 1 - Validación sin juicio**:
"Entiendo, Diego. Un día pesado justifica querer desconectar. Tomar una copa no es malo, pero veo que los viernes suelen ser de mayor consumo."

**Paso 2 - Feedback objetivo (no confrontacional)**:
"Esta semana llevás 4 días con >2 copas. El promedio de hombres de tu edad en Chile consume 1.8 copas/día. Más de 2 copas diarias incrementa riesgo de hígado graso en 40% y afecta calidad del sueño."

**Paso 3 - Ofrecer alternativa de coping**:
"¿Qué tal si probás una táctica diferente esta vez? Podés:
1. Esperar 30 minutos y hacer una caminata de 10 min (libera endorfinas)
2. Preparar una cena rica sin alcohol y ver una película
3. Tomar 1 copa y luego cambiar a una bebida sin alcohol (agua con limón)"

**Paso 4 - Pregunta de compromiso**:
"¿Cuál de estas opciones te animás a probar hoy? O tenés otra idea?"

### Flujo de Decisión

- **Si elige alternativa** → Refuerzo positivo: "¡Genial! Te acompaño en eso.activá un temporizador de 30 min y te recuerdo".
- **Si dice "solo quiero mi vino"** → No confrontar: "Está bien, es tu decisión. ¿Podés al menos tomar una copa y luego hidratarte bien? Y registralo acá para llevar control." (Invita a autoseguimiento)
- **Si registra >4 copas esa noche** → Al día siguiente: "Ayer consumiste X copas. ¿Cómo te sentís? recordá que八月 te mostramos riesgos. ¿Querés hablar de estrategias para el próximo viernes?"

### Nivel de Riesgo
- **Verde** (inicial): Validación + info
- **Amarillo** si repite >4 copas: agregar "¿Considerarías hablar con tu médico de un chequeo hepático?"

### Métricas de Éxito
- Usuario pospone o reduce consumo (1-2 copas vs 4-6)
- Usuario registra consumo (self-monitoring)
- Usuario explora alternativas (hace caminata, etc.)

---

## Escenario 2: Craving de Cannabis (Lucas, 16 años, Contemplación, after school 19:00)

### Contexto
- Perfil: Lucas, secundaria, cannabis diario (2 porros), ansiedad social, TDAH no diagnosticado
- Etapa: Contemplación (sabe que tiene problema pero ambivalente)
- Trigger: Salida del colegio, reunión con amigos que fuman
- Riesgo: Medioalto (cerebro en desarrollo, riesgo de dependencia rápida)

### Mensaje del Usuario
"Todos mis amigos están fumando afuera del colegio. Tengo ganas de fumar ya."

### Respuesta del Chatbot

**Paso 1 - Normalizar y validar**:
"Es súper normal sentir esa presión, Lucas. Todos tu edad lo sienten. El cuerpo y la mente se han acostumbrado al porro a esa hora."

**Paso 2 - Psicoeducación breve (neurociencia adolescente)**:
"¿Sabías que el cerebro hasta los 25 años está construyendo conexiones? El cannabis puede afectar memoria y concentración. No es 'daño irreversible', pero sí puede hacer que te cueste más en el colegio."

**Paso 3 - Técnica de urgencia (2-3 min)**:
"Si querés, podés probar el 'delay trick': en lugar de fumar ahora, decís 'espero 30 min y me tomo un texto'. En esos 30 min, hacé esto:
1. Respiración 4-7-8 (4 segundos inhala, 7 aguantás, 8 exhalás) x 3 rondas
2. Tomá agua fría
3. Hacé 10 sentadillas o caminá rápido 5 min
Después de eso, el craving baja bastante. ¿Probamos?"

**Paso 4 - Opción de mensaje a padres (si vinculó familiar)**:
"Si querés, podés mandarle un mensaje rápido a tus viejos: 'Hoy no fumo, necesito espacio'. Yo te ayudo a redactar."

### Flujo de Decisión

- **Si intenta la técnica** → Refuerzo: "¡Buen trabajo! El craving bajó? registralo así vemos progreso."
- **Si fuma igual** → No juzgar: "Ok, pasó. Mañana podés volver a intentar. Registrá cuánto fumaste para ver patrones."
- **Si pide ayuda para hablar con padres** → Generar mensaje predefinido editable

### Nivel de Riesgo
- **Verde** inicial
- **Amarillo** si fuma >5 días seguidos → sugerir hablar con psicólogo escolar

### Métricas de Éxito
- Usuario posterga consumo al menos una vez
- Usuario prueba técnica de respiración
- Usuario habla con padres (opcional)

---

## Escenario 3: Craving de Estimulantes (Camila, 23 años, Preparación, pre-fiesta)

### Contexto
- Perfil: Camila, estudiante de medicina, policonsumo (alcohol + coca/MDMA), estrés académico
- Etapa: Preparación (quiere reducir pero no ahora)
- Trigger: Fiesta universitaria, presión social
- Riesgo: Alto (policonsumo, riesgo cardiovascular, futuro profesional)

### Mensaje del Usuario
"Voy a una fiesta esta noche. Seguro voy a terminar tomando y yendo. No quiero pero siento que no puedo decir que no."

### Respuesta del Chatbot

**Paso 1 - Validar presión social**:
"Total, Camila. En el ambiente universitario la presión es enorme. Muchos lo hacen, pero eso no significa que sea obligado."

**Paso 2 - Recordar metas propias**:
"Recordá que vos me dijiste que querés ser médica y que te preocupa el rendimiento. El combo alcohol+coca da resacas brutales y afecta la memoria."

**Paso 3 - Estrategias concretas de reducción de daños**:
"Si decidís consumir, acá tips para minimizar daño:
- **No mezcles alcohol con coca/MDMA** (el corazón sufre)
- **Hidratate**: 1 vaso de agua por cada bebida alcohólica
- **No consumas si tenés turno al día siguiente** (pacientes notan tu estado)
- **Poné un límite**: 'hoy solo 2 tragos y 1 línea' ¿podés cumplir eso?
- **Designá un amigo** que te recuerde tu límite"

**Paso 4 - Plan de escape**:
"Si sentís que perdés el control, mandá un mensaje a tu amiga María para que te saque. O podés ir al baño y respirar 2 minutos."

**Paso 5 - Gamificación (si usuario responde a eso)**:
"Si lográs respetar tu límite, meté un logro: 'Fin de semana controlado'. Te sumo 10 puntos."

### Flujo de Decisión

- **Si usuario acepta plan** → Guardar "límite personal" y enviar recordatorio 1 hora antes de la fiesta
- **Si usuario cede a presión** → No confrontar: "Ok, si consumís, al menos no mezcles y date cuenta de tu límite. Registralo mañana para ver patrones."
- **Si usuario pide ayuda para decir que no** → Role-play: "Practicá: 'No, gracias, esta noche no'"

### Nivel de Riesgo
- **Amarillo** (pre-fiesta): alto riesgo por policonsumo
- **Naranja** si ya consumió → ofrecer Follow-up al día siguiente: "¿Cómo te sentís? ¿Te arrepentiste? Aprendamos para la próxima."

### Métricas de Éxito
- Usuario establece límite concreto (ej: "solo 2 tragos")
- Usuario registra consumo posterior (self-awareness)
- Usuario usa mensaje de escape (llama a amiga)

---

## Escenario 4: Craving de Opioides (Rodrigo, 69 años, Mantención, dolor crónico)

### Contexto
- Perfil: Rodrigo, jubilado, dolor lumbar crónico, oxicodona 20mg/día + whisky nocturno
- Etapa: Mantención (no ve problema, pero tolerancia aumenta)
- Trigger: Dolor matutino, ansiedad por no tener medicamento
- Riesgo: Alto (tolerancia + interacción alcohol-opioide → depresión respiratoria)

### Mensaje del Usuario
"Me desperté con dolor de espalda a las 3am. Quiero tomar más oxicodona de la dosis."

### Respuesta del Chatbot

**Paso 1 - Validar dolor, pero no reforzar automedicación**:
"Entiendo que el dolor no lo dejó dormir, Rodrigo. El cuerpo desarrolla tolerancia: la misma dosis con el tiempo no alcanza."

**Paso 2 - Alertar sobre riesgos de aumentar dosis sin supervisión**:
"Tomar más de lo recetado puede causar depresión respiratoria, especialmente si después toma whisky. **No aumente la dosis.**"

**Paso 3 - Ofrecer alternativas de manejo de dolor agudo**:
"En lugar de más pastilla, probá:
1. Aplicar calor en la zona 20 min
2. Hacer estiramientos suaves (acostado boca abajo, levantá piernas)
3. Respiración diafragmática para relajar músculos
4. Si el dolor es >7/10, llamá a tu médico de guardia para ajuste"

**Paso 4 - Recordar cita médica**:
"Tienes cita con el traumatólogo el jueves. ¿Querés que anotes para hablarle de la tolerancia? Te ayudo a preparar preguntas: '¿Podemos considerar fisioterapia o gabapentina?'"

### Flujo de Decisión

- **Si usuario intenta alternativas** → Refuerzo: "Bien, espero que alivie. Si no, contactá a tu médico."
- **Si usuario toma más dosis de todas formas** → Detector: "Registraste dosis adicional. Por seguridad, te recomiendo que llames a tu médico ahora para evaluar ajuste. ¿Querés el número?"
- **Si usuario reporta dolor muy intenso (>8/10)** → Activar protocolo naranja: derivar a emergencias si signos de complicación (pupilas pequeñas, somnolencia)

### Nivel de Riesgo
- **Naranja** (riesgo de sobredosis o interacción)
- **Rojo** si reporta dificultad respiratoria → llamar emergencias

### Métricas de Éxito
- Usuario no aumenta dosis y prueba alternativas
- Usuario contacta médico para ajuste
- Usuario asiste a cita médica

---

## Escenario 5: Crisis de Suicidio (cualquier perfil)

### Contexto
- Perfil: Cualquiera, pero especialmente Sofía (trauma), Valeria (interrupción abrupta), Lucas (adolescente)
- Trigger: Mensaje directo o indirecto de ideación suicida
- Riesgo: Inminente (Rojo)

### Mensaje del Usuario
"Ya no puedo más. Mejor me voy. No le sirvo a nadie."

### Respuesta del Chatbot

**Paso 1 - Tomar en serio, expresar preocupación, NO minimizar**:
"Te escucho. Suena como si estuvieras en un dolor enorme. No estás solo. **Primero: ¿estás pensando en hacerte daño ahora mismo?**"

**Paso 2 - Si responde "sí" o ambigua**:
"Necesitás hablar con alguien YA. Tenemos opciones:
1. **Línea 988** (Suicide & Crisis Lifeline) - gratis, 24/7, confidencial
2. **Ir a emergencias** (hospital más cercano)
3. **Llamar a tu contacto de emergencia** (si autorizaste)

¿Cuál preferís? Te acompaño mientras llamás."

**Paso 3 - Mostrar botones grandes (si interfaz permite)**:
[ LLAMAR A 988 AHORA ] [ IR A EMERGENCIA ] [ HABLAR CON [CONTACTO] ]

**Paso 4 - Si no responde en 60 segundos**:
(Activación automática si usuario autorizó previamente)
- Notificar a contacto de emergencia designado: "[Usuario] está en crisis de suicidio. Por favor contactalo YA."
- Si hay ubicación: enviar a servicios de emergencia (911)

**Paso 5 - Si usuario NO está en riesgo inminente pero se siente mal**:
"No estás solo. Mucha gente pasa por esto. Además de la app, podés:
- Llamar a tu terapeuta (tenés su contacto acá)
- Hablar con [amigo de confianza] que Designaste
- Ir a un lugar seguro (biblioteca, centro comunitario)
¿Querés que te ayude a contactar a alguien ahora?"

### Flujo de Decisión

- **Si usuario elige llamar** → Dar número, mantener chat abierto: "¿Necesitás que espere mientras llamás?"
- **Si usuario dice "no" pero continúa expresando desesperanza** → Preguntar: "¿Tenés un plan específico?" (método, lugar, fecha). Si hay plan → activar protocolo rojo inmediato
- **Si usuario se calma** → Ofrecer seguimiento: "¿Querés agendar una llamada de seguimiento con tu terapeuta mañana?"

### Nivel de Riesgo
- **Naranja** si ideación sin plan
- **Rojo** si plan específico o inminente → activar contactos de emergencia

### Métricas de Éxito
- Usuario contacta línea de crisis o terapeuta
- Usuario no actúa en impulso
- Usuario asiste a seguimiento

---

## Escenario 6: Interacción Alcohol + Benzo (Eliana, 68 años, Riesgo médico)

### Contexto
- Perfil: Eliana, adulta mayor, alcohol (2 copas/día) + lorazepam (1-2mg/día)
- Etapa: Precontemplación extrema (niega riesgo)
- Trigger: Registra ambas sustancias en mismo día
- Riesgo: Alto (sedación, caídas, delirium)

### Mensaje del Usuario
"Hoy tomé mi lorazepam a las 20:00 y después dos copas de vino en la cena."

### Respuesta del Chatbot

**Paso 1 - Validar y educar suavemente**:
"Entiendo, doña Eliana. Esa combinación puede hacerla sentir más adormilada de lo normal y aumenta el riesgo de caídas."

**Paso 2 - Especificar riesgos concretos**:
"El lorazepam y el alcohol juntos pueden:
- Causar somnolencia extrema
- Afectar el equilibrio (más probabilidad de caerse)
- Causar confusión mental
- En personas mayores, a veces lleva a delirium"

**Paso 3 - Dar recomendaciones de seguridad inmediata**:
"Por esta noche, por favor:
1. **No maneje** ni suba escaleras sin ayuda
2. **Siéntese o acuéstese** en un lugar seguro
3. **Beba agua** para deshidratarse
4. Si se siente muy mareada, llame a su hija para que la acompañe"

**Paso 4 - Ofrecer cambio a largo plazo (sin presión)**:
"¿Hablaría con su médico de la posibilidad de reducir el alcohol o ajustar el lorazepam? Puedo ayudarla a preparar preguntas para la próxima cita."

**Paso 5 - Sugerir comunicación familiar**:
"Si quiere, puedo generar un reporte de bienestar para mostrarle a sus hijos y demostrarles que está tomando sus medicamentos con cuidado. ¿Le interesa?"

### Flujo de Decisión

- **Si usuario acepta recomendaciones de seguridad** → Confirmar: "Bien, quédese sentada y avise si se siente muy mal."
- **Si usuario minimiza** → No confrontar: "Está bien, pero recuerde: la caída en adulto mayor puede ser grave. Prevención vale la pena."
- **Si usuario reporta caída o confusión** → Activar protocolo naranja: "Necesita ayuda médica ahora. ¿Llama a su hija o a emergencias?"

### Nivel de Riesgo
- **Amarillo** a **Naranja** dependiendo de síntomas reportados

### Métricas de Éxito
- Usuario modifica comportamiento (reduce alcohol o separahoras de benzo)
- Usuario contacta médico para ajuste
- Usuario comparte reporte con familia (mejora comunicación)

---

## Escenario 7: Interacción Alcohol + Opioide (Rodrigo, 69 años, Riesgo de sobredosis)

### Contexto
- Perfil: Rodrigo, oxicodona 20mg/día, whisky nocturno, dolor crónico
- Etapa: Mantención (no ve problema)
- Trigger: Registra whisky después de tomar oxicodona
- Riesgo: Crítico (depresión respiratoria, posible muerte)

### Mensaje del Usuario
"Me tomé mi oxicodona a las 8pm y después me serví un whisky para dormir."

### Respuesta del Chatbot

**Paso 1 - Alerta clara y urgente (tono serio pero calmado)**:
"Rodrigo, esa combinación es **muy peligrosa**. Alcohol + opioides puede causar depresión respiratoria (respiración muy lenta o parada). Puede matar."

**Paso 2 - Especificar síntomas de sobredosis**:
"Esté atento a estas señales:
- Respiración lenta (<8 respiraciones por minuto)
- Somnolencia extrema, no se despierta
- pupilas pequeñas (como puntos)
- Piel fría y húmeda
Si aparece algo de esto, **llame a emergencias (911) YA**."

**Paso 3 - Dar instrucciones de seguridad inmediata**:
"Por esta noche:
1. NO tome más alcohol ni más oxicodona
2. Quédese despierto o pídale a alguien que lo vigile
3. Tenga a mano el número de emergencias
4. Si tiene naloxona (kit para sobredosis), téngala lista"

**Paso 4 - Consecuencia a largo plazo (sin culpar)**:
"Su médico debería saber que toma alcohol con la oxicodona. Esto puede cambiar su tratamiento. ¿Quiere que le ayude a preparar una conversación con él?"

**Paso 5 - Ofrecer alternativa para dormir**:
"Para el insomnio, en lugar de whisky, pruebe:
- Té de manzanilla o leche tibia
- Sonido de lluvia/white noise
- Lectura liviana
¿Quiere que le sugiera más?"

### Flujo de Decisión

- **Si usuario reporta síntomas de sobredosis** → Activar protocolo rojo: llamar emergencias inmediatamente
- **Si usuario minimiza** → Reiterar: "Entiendo que lo hace para dormir, pero el riesgo es real. Al menos evite el whisky esta noche."
- **Si usuario acepta alternativas** → Enviar lista de técnicas de sueño sin alcohol

### Nivel de Riesgo
- **Naranja** a **Rojo** dependiendo de cuánto tiempo pasó desde la interacción
- Si usuario no responde en 30 min tras advertencia → notificar a contacto/familiar

### Métricas de Éxito
- Usuario evita mezclar alcohol y opioides
- Usuario contacta médico para ajuste
- Usuario obtiene naloxona si está en riesgo

---

## Escenario 8: Registro de Consumo para Reducción Gradual (Mariano, 38 años, Preparación)

### Contexto
- Perfil: Mariano, cocaína diaria (3g), reduce gradualmente, con psiquiatría
- Etapa: Preparación → Acción
- Trigger: Check-in matutino (cuánto consumió ayer)
- Riesgo: Abstinencia severa, craving intenso

### Mensaje del Usuario
"Ayer consumí 2.5g. Hoy me siento ansioso, 7/10, y no dormí bien."

### Respuesta del Chatbot

**Paso 1 - Refuerzo positivo por reducción**:
"¡Buen progreso! 2.5g vs 3g es -0.5g. Eso cuenta mucho. La reducción gradual es inteligente."

**Paso 2 - Validar síntomas de abstinencia**:
"La ansiedad e insomnio son esperados cuando bajás el consumo. Tu cuerpo extraña la dopamina. No es fallo tuyo, es neurobiología."

**Paso 3 - Ofrecer herramientas para síntomas**:
"Para la ansiedad ahora:
- Respiración 4-7-8 (3 ciclos)
- Cold water en la cara
- Si tenés música relajante, ponela
Para el insomnio futuro:
- No uses benzo a menos que te lo recetaron
- Rutina de sueño: misma hora, sin pantallas 1h antes
¿Querés que te envíe un recordatorio de rutina de sueño hoy?"

**Paso 4 - Conectar con psiquiatra**:
"Tu psiquiatra ajustó la medicación anoche. Confiá en ese plan. ¿Querés agendar una llamada de seguimiento esta semana? Te ayudo."

**Paso 5 - Meta semanal**:
"Tu meta es 10g esta semana. Llevás 2.5/10. Si seguís así, llegás con margen. ¿Te animás a 2g mañana?"

### Flujo de Decisión

- **Si usuario intenta técnicas** → Registrar éxito: "¿Bajó la ansiedad? Registralo."
- **Si usuario cede y consume más** → No castigar: "Ok, el craving es fuerte. Mañana volvemos a intentar. ¿Qué triggered hoy?"
- **Si usuario quiere contactar psiquiatra** → Facilitar contacto o agendar

### Nivel de Riesgo
- **Amarillo** si no duerme >2 noches seguidas
- **Naranja** si reporta craving con ideación de recaída severa

### Métricas de Éxito
- Usuario reduce consumo gradualmente (2.5 → 2 → 1.5 etc)
- Usuario duerme mejor con técnicas
- Usuario mantiene contacto con psiquiatra

---

## Escenario 9: Comunicación Familiar (Roberto, 45 años, Esposo, quiere apoyar sin controlar)

### Contexto
- Perfil: Roberto, esposo de paciente (Carmen), frustrado, no sabe cómo ayudar
- Etapa: Preparación (quiere actuar)
- Trigger: Carmen irritable, Roberto no sabe qué hacer
- Riesgo: Codependencia o negligencia

### Mensaje del Usuario
"Carmen está muy irritable hoy y no me dice qué le pasa. Me siento excluido y con ganas de exigirle que me cuente todo."

### Respuesta del Chatbot

**Paso 1 - Validar sentimientos del familiar**:
"Entiendo tu frustración, Roberto. Es normal sentirse excluido cuando no te cuentan. Pero exigir puede generar más resistencia."

**Paso 2 - Psicoeducación sobre adicción y recuperación**:
"En la recuperación, el paciente necesita autonomía. Forzar la información puede hacer que se aisle más. La meta es crear un espacio seguro para que ELLA elija compartir."

**Paso 3 - Enseñar comunicación no violenta**:
"En lugar de '¿qué te pasa? ¿por qué no me contás?', probá:
- 'Noté que estás irritable. Estoy acá si querés hablar.'
- 'Te quiero y me preocupo. Cuando puedas, me contás.'
- Ofrece espacio: '¿Preferís que te dé un rato sola?'"

**Paso 4 - Usar datos agregados (si Carmen compartió dashboard)**:
"Revisá su dashboard (solo lo que ella autorizó). Tal vez ves que hoy su ánimo es 8/10 ansioso. En lugar de preguntar, podés enviar un mensaje: 'Sé que hoy fue pesado. ¿Necesitás algo? Te quiero.'"

**Paso 5 - Cuidado del cuidador**:
"Vos también necesitás apoyo. ¿Tenés a alguien con quien desahogarte? Grupos de Al-Anon pueden ayudar. No seas el único soporte."

### Flujo de Decisión

- **Si usuario envía mensaje sugerido** → Refuerzo: "Bien, así se construye confianza."
- **Si usuario insiste en exigir información** → Recordar: "Ella controla su información. Confiá en el proceso."
- **Si usuario se siente abrumado** → Derivar a grupo de apoyo o terapia familiar

### Nivel de Riesgo
- **Amarillo** si hay conflicto familiar frecuente
- **Naranja** si Roberto está al borde del burnout

### Métricas de Éxito
- Familiar usa comunicación no violenta
- Paciente empieza a compartir más (voluntariamente)
- Familiar busca apoyo propio (Al-Anon)

---

## Escenario 10: Detección de Riesgo en Madre (Sofía, 26 años, Trauma, hija presente)

### Contexto
- Perfil: Sofía, madre soltera, metanfetamina, trauma, miedo a servicios sociales
- Etapa: Contemplación ambivalente
- Trigger: Sofía escribe algo que sugiere riesgo hacia sí misma o su hija
- Riesgo: Crítico (puede implicar protección de menores)

### Mensaje del Usuario
"Mi hija me dijo que le dio miedo cuando grité. No sé qué hacer, soy una mala madre."

### Respuesta del Chatbot

**Paso 1 - Validar y calmar**:
"Primero, respirá. Es normal sentir culpa, pero reconocerlo ya es un paso enorme. No sos una mala madre por tener un mal momento."

**Paso 2 - Desglosar situación (sin asumir abuso)**:
"¿Qué pasó exactamente? ¿Gritaste enojada o fue algo más? ¿Tu hija está safe ahora?"

**Paso 3 - Ofrecer regulación emocional inmediata**:
"Antes de actuar, regulá: técnica TIPP - Temperatura (agua fría en cara), exercise (saltá 20 veces), respiración 4-7-8, piernas contra pared. ¿Probamos?"

**Paso 4 - Educación en crianza bajo estrés**:
"Muchas madres en recuperación pasan por esto. El estrés + craving puede hacer perder la paciencia. Herramientas:
- Pausa de 5 segundos antes de reaccionar
- Decir 'mamá necesita un momento' y salir de la habitación
- Usar aplicaciones de respiración cuando sientas que sube"

**Paso 5 - Evaluar riesgo real a la niña**:
"Tu hija ¿está en peligro físico ahora? Si es así, necesitás ayuda urgente. Si no, esto se puede trabajar en terapia."

**Paso 6 - Conectar con recursos para madres**:
"Hay programas de apoyo para madres en recuperación: guarderías, terapia familiar, apoyo económico. ¿Querés que te busque opciones en tu zona?"

### Flujo de Decisión

- **Si describe abuso físico/negligencia** (ej: "laempujé", "no le di de comer") → Activar protocolo naranja/rojo según gravedad. **Advertir**: "Por ley, si hay riesgo inminente para la niña, debo reportar a servicios sociales. Busquemos ayuda ahora para evitar eso."
- **Si es solo gritar** → Enfocarse en técnicas de regulación y crianza positiva
- **Si usuario está muy culpabilizado** → Ofrecer conexión con terapeuta especializado en madres en recuperación

### Nivel de Riesgo
- **Amarillo** a **Naranja** si hay indicios de maltrato físico/negligencia
- **Rojo** si riesgo inminente

### Métricas de Éxito
- Usuario utiliza técnicas de regulación (pausa, respiración)
- Usuario contacta terapia familiar
- Niña permanece en entorno seguro
- Usuario reduce incidentes de gritos

---

## Resumen de Cobertura

| Escenario | Perfiles cubiertos | Riesgo principal | Técnica prioritaria |
|-----------|-------------------|------------------|---------------------|
| 1. Alcohol viernes | Diego, Rosario | Cardiovascular/hígado | MI + alternatives |
| 2. Cannabis adolescente | Lucas | Neurodesarrollo | Delay trick + psicoeducación |
| 3. Estimulantes fiesta | Camila | Policonsumo | Harm reduction + gamificación |
| 4. Opioides dolor | Rodrigo | Sobredosis | Alternativas no-farmacológicas |
| 5. Suicidio | Todos (especialmente Sofía, Valeria) | Inminente | Líneas 988 + activación emergencia |
| 6. Alcohol+Benzo | Eliana | Caídas/delirium | Educación médica + seguridad inmediata |
| 7. Alcohol+Opioide | Rodrigo | Depresión respiratoria | Alerta urgente + naloxona |
| 8. Reducción gradual | Mariano | Abstinencia | Refuerzo positivo + manejo síntomas |
| 9. Comunicación familiar | Roberto | Codependencia | Comunicación no violenta + datos agregados |
| 10. Riesgo madre/hija | Sofía | Protección menores | Trauma-informed + mandatory reporting |

---

## Instrucciones para Implementación

1. **Cada escenario debe programarse como un "intention"** en el sistema de chat, con detección de keywords y contexto.
2. **Los prompts** aquí definidos son el contenido base; el modelo deberá adaptar lenguaje al perfil.
3. **Métricas de éxito** deben registrarse en logs para evaluar efectividad.
4. **Validación clínica**: cada escenario debe revisarse con profesionales (psicólogos, psiquiatras) para asegurar que las recomendaciones son seguras y éticas.
5. **Iteración**: ajustar según feedback de usuarios reales (¿responden bien al tono? ¿siguen las sugerencias?)

---

*Documento vivo: se agregarán más escenarios según necesidades (ej: craving de nicotina, crisis de ansiedad sin sustancia, etc.).*
