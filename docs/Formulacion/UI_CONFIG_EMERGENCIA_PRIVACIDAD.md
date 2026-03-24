# Diseño UX/UI - Configuración de Emergencia y Privacidad

## 1. Objetivos de la Pantalla

- Permitir al usuario definir contactos de emergencia y protocolos
- Establecer límites claros de qué datos se comparten con familiares
- Obtener consentimientos informados (ubicación, notificaciones)
- Reforzar mensajes de seguridad y confidencialidad
- Ser accesible y comprensible para todos los perfiles (desde adolescentes hasta adultos mayores)

---

## 2. Estructura General de la Pantalla

La pantalla se divide en **2 secciones principales** (tabs o secciones verticales):

### Sección A: Emergencia (¿A quién contactar si estás en crisis?)
### Sección B: Privacidad (¿Qué compartes con tu sistema de apoyo?)

Cada sección tiene:
- Explicación clara del propósito
- Formulario de configuración
- EJEMPLO visual de qué pasaría si se activa
- Botón de "Guardar cambios"

---

## 3. Sección A: Configuración de Emergencia

### 3.1 Header

**Título:** "Emergencia y Seguridad"
**Subtítulo:** "Configura a quién contactaremos si detectamos que estás en riesgo"

**Advertencia destacada (en amarillo/naranja):**
"⚠️ Esta información solo se usará en situaciones de riesgo grave (suicidio, sobredosis, crisis médica). No se compartirá en otros casos."

---

### 3.2 Contacto Principal de Emergencia

**Pregunta:** "¿Quién es tu contacto de confianza en caso de emergencia?"

**Formulario:**

```
┌─────────────────────────────────────────────┐
│  Nombre: [_______________]                  │
│  Relación: [▼ Padre/Madre/Esposo/Amigo/...]│
│  Teléfono: [_______________]                │
│  Email (opcional): [______________]        │
│                                             │
│  [ ] ¿Autorizas a que le enviemos un       │
│      mensaje o llamemos si estás en riesgo?│
│                                             │
│  [ ] ¿Aceptas compartir tu ubicación       │
│      aproximada solo en emergencia?         │
└─────────────────────────────────────────────┘
```

**Validación:**
- Teléfono requerido si marcó autorización
- Si no autoriza → mostrar: "Sin contacto de emergencia, no podremos ayudarte en crisis. ¿Estás seguro?" → confirmar

---

### 3.3 Contacto Secundario (Opcional)

**Pregunta:** "¿Tienes otro contacto de respaldo?"

```
┌─────────────────────────────────────────────┐
│  Nombre: [_______________]                  │
│  Relación: [▼ ...]                          │
│  Teléfono: [_______________]                │
│  Email (opcional): [______________]        │
│                                             │
│  [ ] ¿Autorizas a que le notifiquemos?     │
└─────────────────────────────────────────────┘
```

---

### 3.4 Línea de Crisis Preferida

**Mostrar líneas por país (auto-detectar o elegir):**

```
¿Qué línea de crisis quieres tener a mano?
(Seleccionamos la de tu país por defecto)

○ 988 (Suicide & Crisis Lifeline) - EEUU
○ 135 (Atención en Adicciones) - Argentina
○ 141 (Salud Responde) - Chile
○ 911 (Emergencias generales) - Varios
○ Personalizada: [______________]
```

**Ayuda:** "Estas líneas son 24/7, gratuitas y confidenciales. Las mostraremos en caso de crisis."

---

### 3.5 Preferencias de Notificación de Emergencia

**Pregunta:** "¿Cuándo debemos contactar a tus emergencias?"

Opciones (radio buttons):
- ○ Solo riesgo CRÍTICO (suicidio inminente, sobredosis)
- ○ Riesgo ALTO (ideación suicida con plan, craving intenso con intención de recaer)
- ○ Cualquier riesgo detectado (incluyendo amarillo: malestar emocional severo)
- ○ Nunca (no recomendado) → mostrar advertencia: "No podremos intervenir si estás en peligro"

**Recomendación por defecto:** "Riesgo CRÍTICO" (solo emergencias reales)

---

### 3.6 Ejemplo "Qué Pasaria Si" (Simulador)

**Mostrar escenario simulado:**

```
Ejemplo: Si mañana escribes
"No aguanto más, me voy a matar"

Este sería nuestro flujo:
1. Te mostraremos botones grandes: Llamar 988, Llamar a [contacto]
2. Si no respondes en 60 segundos:
   - Llamaremos a [contacto principal]
   - Si tienes ubicación, la compartiremos
3. Si hay riesgo inminente, llamaremos a 911

¿Estás de acuerdo con este protocolo?
[ Sí, confirgo ] [ No, quiero ajustarlo ]
```

**Si elige "No, quiero ajustarlo"** → mostrar opciones adicionales:
- "No llamar a contactos automáticamente"
- "Solo enviar mensaje, no llamar"
- "Esperar más tiempo antes de actuar"

---

## 4. Sección B: Privacidad y Compartimiento (Con Familiares)

**Nota:** Esta sección solo aparece si el usuario **tiene o va a vincular un familiar**. Si no, mostrar mensaje: "Puedes invitar a un familiar luego en Ajustes."

### 4.1 Header

**Título:** "Privacidad: ¿Qué compartes con tu sistema de apoyo?"
**Subtítulo:** "Tú controlas qué información ven tus familiares/cuidadores. Puedes cambiarlo en cualquier momento."

---

### 4.2 Permisos de Compartimiento (Checklist)

```
Marca qué类型 de información estás dispuesto/a a compartir:
```

- [ ] **Logros y metas cumplidas**
  - Ej: "7 días sin beber", "Esta semana reduje 20%"
  - Ayuda a familiares a ver progreso sin detalles íntimos

- [ ] **Estado emocional diario** (escala 1-10, sin palabras clave)
  - Ej: "Hoy: 7/10" (no dice "ansiedad")
  - Formato simple

- [ ] **Asistencia a terapia o grupos de apoyo**
  - "Asistió a terapia hoy" / "Fue a AA"
  - No comparte contenido de la sesión

- [ ] **Síntomas de craving** (solo intensidad, sin contexto)
  - "Craving: 8/10 hoy"
  - Sin detalles de qué triggered

- [ ] **Ubicación aproximada** (solo en crisis)
  - "Carmen está en zona centro" (radio 1km)
  - Solo se comparte si activa "pedir ayuda" o emergencia

- [ ] **LÚA, prefiero privacidad total**
  - Si marca esto, se deshabilitan todos los anteriores
  - Mostrar advertencia: "Tu familiar no verá ningún dato. Aún así podrá enviarte mensajes de apoyo."

**Recomendación por defecto:** Marcar solo Logros y Estado emocional (opciones menos invasivas)

---

### 4.3 Contacto de Familiar (Si ya tiene)

**Mostrar actual:**

```
Vinculado con: Roberto (Esposo)
Teléfono: +569XXXXXXX
Estado: Activo

¿Qué permisos tiene actualmente?
✓ Logros y metas
✓ Estado emocional
✗ Craving detallado
✗ Ubicación
```

**Botones:**
- [Editar permisos] → vuelve al checklist anterior
- [Revocar invitación] → desvincular (con confirmación: "¿Seguro? Tu familiar dejará de ver cualquier dato.")

---

### 4.4 Invitar a un Nuevo Familiar (Si no tiene)

```
¿Quieres invitar a alguien a acompañarte?
```

**Formulario:**

```
Nombre: [________________]
Relación: [▼ ...]
Teléfono o Email: [________________]
```

**Mensaje de invitación (editable):**
"Hola [nombre], me uní a [nombre app] para mi proceso de recuperación. Me gustaría que me accompagnaras. Acceptas la invitación? Más info en [enlace]."

**Botón:** "Enviar invitación" (envía SMS/email con enlace único)

**Nota:** "Tu familiar solo verá la información que autorices en la sección anterior."

---

### 4.5 Ejemplo de lo que ve el Familiar

**Mostrar preview:**

```
Así es como verá Roberto tu información:

HOY
Estado: 😊 7/10
Logro: 3 días sin beber ✅

ESTA SEMANA
Consumo: 2 días sin alcohol
Asistencia: 1 terapia, 1 grupo

(No ve detalles de cravings, ni notas, ni chat)
```

---

## 5. Validación y Restricciones

### 5.1 No puede guardar si:
- No tiene contacto principal de emergencia **Y** está en perfil de alto riesgo (Valeria, Rodrigo, Sofía con riesgo)
  - Mostrar: "Para tu seguridad, necesitamos un contacto de emergencia."
- Marcó "LÚA, privacidad total" pero también "invitó a familiar" → conflicto
  - Resolver: o desinvita al familiar, o marca algún permiso

### 5.2 Cambios importantes requieren confirmación

- Si desvincula familiar → "¿Estás seguro? Tu familiar no podrá verte más."
- Si quita todos los permisos → "Tu familiar solo podrá enviarte mensajes de apoyo, no verá tu progreso. ¿Continuar?"

---

## 6. Consideraciones por Perfil

### 6.1 Adolescentes (Lucas)
- Enfatizar confidencialidad: "Tus padres NO verán nada a menos que tú autorices cada dato"
- No requerir contacto de emergencia obligatorio (puede ser un amigo mayor)
- Permitir PIN para app independiente

### 6.2 Adultos Mayores (Eliana, Rodrigo)
- Letra grande
- Pasos simples: primero contacto, luego permisos
- Sugerir configurar por un hijo (opción "Configurar con ayuda")
- Ejemplos con nombres locales ("su hija María")

### 6.3 Pacientes con Trauma (Sofía)
- Enfasis en control: "Tú decides en todo momento"
- Opción de "auto-destrucción de mensajes" (ver Ajustes)
- Permitir bloqueo rápido de familiar (un botón "bloquear ahora" en cualquier pantalla)

### 6.4 Pacientes en Interrupción Abrupta (Valeria)
- Contacto de emergencia **obligatorio** (clínica o roommate)
- Mostrar advertencia fuerte: "Estás en riesgo médico. Necesitas un contacto que sepa de tu situación."
- Sugerir agregar número de clínica/doctor como contacto principal

### 6.5 Rurales (Rosario)
- Explicar contacto de emergencia: "Puede ser el médico rural, su esposo, o un vecino de confianza"
- Si no hay teléfono, permitir solo email
- Considerar que puede no tener internet: guardar config local y sync después

---

## 7. Accesibilidad

- **Tamaño de texto**: base 16sp, ajustable
- **Contraste**: mínimo 4.5:1 en texto, 3:1 en elementos grandes
- **Espaciado**: márgenes amplios para evitar toques accidentales
- **Navegación**: orden lógico (primero contacto principal, luego secundario, luego permisos)
- **Labels claros**: no solo iconos (ej: 📞 = "Teléfono de emergencia")
- **Ayuda en línea**: cada campo con icono "?" que explica en lenguaje simple

---

## 8. Microinteracciones

### 8.1 Al guardar cambios exitosamente
- Snackbar: "Configuración guardada ✅"
- Si hay cambios importantes (ej: desvinculó familiar): "Roberto ya no verá tu información."

### 8.2 Si intenta guardar con datos faltantes
- Resaltar campo faltante en rojo
- Mensaje: "Completa el número de teléfono de tu contacto principal."

### 8.3 Al enviar invitación a familiar
- Mostrar estado: "Invitación enviada a +569XXXX. Cuando acepte, te avisaremos."
- Posibilidad de reenviar o cancelar invitación pendiente

### 8.4 Al cambiar permisos
- Vista previa en tiempo real de lo que el familiar verá (actualizarse al marcar/desmarcar)

---

## 9. Especificaciones para Desarrolladores

### 9.1 Modelo de Datos (ver ESPECIFICACIONES_TECNICAS.md)

**Tablas relevantes:**
- `emergency_contacts` (contactos de emergencia)
- `sharing_invitations` (invitaciones a familiares)
- `sharing_permissions` (qué comparte cada usuario con cada familiar)

### 9.2 API Endpoints

```
GET  /api/v1/settings/emergency        → obtener contactos y preferencias
POST /api/v1/settings/emergency        → guardar contactos
GET  /api/v1/settings/sharing         → obtener permisos de compartimiento
POST /api/v1/settings/sharing         → guardar permisos
POST /api/v1/sharing/invite           → enviar invitación a familiar
DELETE /api/v1/sharing/invite/:token  → revocar invitación
GET  /api/v1/sharing/preview?profile= → obtener preview de lo que ve familiar
```

### 9.3 Lógica de Negocio

**Al guardar emergencia:**
1. Validar que al menos 1 contacto principal existe si `risk_level in ['high','critical']`
2. Enviar SMS/email de confirmación al contacto (opcional, puede Desactivarse)
3. Registrar en `emergency_contacts` con timestamps

**Al guardar sharing permissions:**
1. Revisar que no sea "privacidad total" si hay familiar vinculado (conflicto)
2. Actualizar `sharing_invitations.permissions` para todos los familiares activos
3. Notificar al familiar (push/email) de que los permisos cambiaron (opcional)

---

## 10. Flujo de Navegación

```
Ajustes
  │
  ├─► Emergencia y Seguridad (esta pantalla)
  │     ├─► Contacto principal
  │     ├─► Contacto secundario
  │     ├─► Línea de crisis
  │     ├─► Preferencias de notificación
  │     └─► Guardar
  │
  ├─► Privacidad (sección B de esta pantalla)
  │     ├─► Checklist de permisos
  │     ├─► Preview en tiempo real
  │     └─► Guardar
  │
  └─► (volver)
```

---

## 11. Contenido por Perfil (Strings de Interfaz)

### 11.1 Títulos y Subtítulos

| Perfil | Título | Subtítulo | Tono |
|--------|--------|-----------|------|
| Lucas | "Emergencia" | "¿A quién llamamos si te pasa algo?" | Coloquial, directo |
| Diego | "Seguridad" | "Configura tus contactos de emergencia" | Formal |
| Eliana | "Seguridad y apoyo" | "Para que su familia esté informada" | Respetuoso |
| Valeria | "Emergencia médica" | "IMPORTANTE: riesgos de abstinencia severa" | Urgente |
| Sofía | "Tu seguridad" | "Tú controlas quién sabe qué" | Empoderador |
| Rodrigo | "Monitoreo médico" | "Configura alertas para tu bienestar" | Clínico |
| Rosario | "Apoyo en caso de problema" | "Vecinos o familia pueden ayudarte" | Simple |

### 11.2 Textos de Ayuda (tooltips)

- **Contacto principal**: "Persona de confianza que pueda ayudarte si estás en crisis (familiar, amigo, terapeuta)."
- **Ubicación en emergencia**: "Solo se compartirá si activamos protocolo de riesgo. No se usa en otros casos."
- **Permisos de compartimiento**: "Elige qué información ven tus familiares. Puedes cambiarlo cuando quieras."

---

## 12. Testing y Validación

### Test Cases

1. **Usuario sin contacto de emergencia, perfil alto riesgo** → debe bloquear guardar
2. **Usuario marca "privacidad total" pero tiene familiar** → warning y forzar elección
3. **Usuario cambia permisos de "logros" a "nada"** → preview se actualiza a "Sin datos"
4. **Adulto mayor confundido** → debe tener opción "Configurar con ayuda de un familiar"
5. **Adolescente preocupado por privacidad** → debe ver claramente que los padres NO ven chat ni notas
6. **Valeria (interrupción abrupta)** → contacto de emergencia obligatorio, advertencia médica

---

## 13. Roadmap de Features

**Fase 1 (MVP):**
- Contactos principales/secundarios básicos
- Checklist de permisos simple (3 opciones)
- Preview estático

**Fase 2:**
- Simulador "Qué pasaría si" interactivo
- Permisos granulares (por dato específico)
- History de cambios de permisos (audit trail)

**Fase 3:**
- Integración con wearables (compartir datos de salud con médico familiar)
- API para que familiar configure remotely (con autenticación fuerte)
- Multi-familiar (diferentes permisos por familiar)

---

## 14. Etica y Consideraciones finales

- **Nunca** obligar a compartir más de lo que el usuario quiere
- **Siempre** explicar por qué pedimos datos (ej: "contacto de emergencia para tu seguridad")
- **Ley de protección de datos**: en países con GDPR/leyes locales, incluir checkboxes específicos de consentimiento
- **Derecho al olvido**: al eliminar cuenta, borrar también contactos de emergencia y permisos

---

*Documento vivo. Se ajustará con feedback de usuarios y revisión legal.*

