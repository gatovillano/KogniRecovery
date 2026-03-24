# Diseño UX/UI - Dashboard Principal (Paciente)

## 1. Objetivos de la Pantalla

- Proporcionar una vista rápida del estado emocional y de consumo del día
- Mostrar progreso hacia metas (abstinencia, reducción)
- Ofrecer acciones rápidas (check-in, chatbot, ayuda)
- Ser adaptativo al perfil (tono, colores, foco)

---

## 2. Layout General

### Estados: Sin datos aún (primer uso)
**Mostrar:**
- Estado vacío: "Aún no has hecho tu check-in de hoy"
- Botón prominente: "Hacer check-in ahora" (color primario)
- Mini tutorial: " completing your check-in helps you track progress"
- Debajo: "O también puedes" → botones secundarios:
  - "Hablar con tu coach IA" (chatbot)
  - "Ver recursos" (psicoeducación)

### Estado: Con check-in del día
**Layout en tarjetas:**

```
┌─────────────────────────────────────────────┐
│  [Avatar o inicial]  Hola, [Nombre]        │
│  Hoy es [Fecha]                             │
├─────────────────────────────────────────────┤
│  💡 ESTADO ACTUAL                           │
│  ┌─────────────────────────────────────┐  │
│  │ 😊 7/10                             │  │
│  │ Ansiedad, algo de estrés            │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  🎯 CONSUMO HOY                            │
│  ┌─────────────────────────────────────┐  │
│  │ ✅ 0 días sin beber                  │  │
│  │ Meta: 7 días                        │  │
│  │ [Barra de progreso: ████░░ 4/7]     │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ⚠️ CRAVINGS                                │
│  ┌─────────────────────────────────────┐  │
│  │ Intensidad: 3/10                    │  │
│  │ Trigger: Estrés laboral             │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ⏱️ PRÓXIMA ACCIÓN                          │
│  ┌─────────────────────────────────────┐  │
│  │ 🕒 Terapia en 2 horas (16:00)       │  │
│  │ [Botón: Prepararme]                │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ 💬 Hablar con tu coach              │  │
│  │ 📝 Registrar consumo               │  │
│  │ 🎉 Ver logros                      │  │
│  │ ⚙️ Ajustes                         │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 3. Componentes Detallados

### 3.1 Encabezado (Header)
- Saludo personalizado: "Hola, [Nombre]" o "Buenos días/tardes"
- Fecha actual formateada: "Viernes 12 de febrero"
- Icono de notificaciones (badge si hay alertas sin leer)
- Menu hamburguesa (ajustes, perfil, cerrar sesión)

### 3.2 Tarjeta de Estado Emocional (Mood)
**Contenido:**
- Emoji grande que refleja estado (😊, 😐, 😟, 😞)
- Escala numérica: "7/10"
- Tags de palabras clave: "Ansiedad, estrés laboral"
- Pequeña leyenda: "¿Cómo te sientes hoy? (toca para editar)"

**Interacción:**
- Tocar → abre modal de check-in rápido (ver pantalla check-in)
- Si no ha hecho check-in hoy: mostrar "?/?", emoji gris, texto "Toca para registrar"

**Adaptaciones por perfil:**
- **Lucas (adolescente)**: emojis más vibrantes, tags como "bajón", "estresado"
- **Diego (adulto)**: tono serio: "Estado: Moderada ansiedad (7/10)"
- **Eliana (mayor)**: letra grande, emoji simple, sin tags

### 3.3 Tarjeta de Consumo / Meta
**Variantes según sustancia y etapa:**

**Para abstinencia (Carmen):**
```
✅ 5 días sin alcohol
Meta: 30 días
[Barra: ████████░░ 5/30]
```

**Para reducción gradual (Mariano):**
```
📉 Esta semana: 6.5g / 10g
Dosis ayer: 2.5g (↓0.5g)
[Barra: ████░░░░░░ 65%]
```

**Para consumo activo pero controlado (Rosario):**
```
🍺 Hoy: 2 litros de cerveza
Límite personal: 3 litros
[Barra: ██░░░░░░░░ 67%]
```

**Interacción:**
- Tocar → abre detalle de progreso semanal/mensual
- Botón secundario: "Registrar consumo ahora"

### 3.4 Tarjeta de Cravings
**Contenido:**
- Intensidad: "3/10"
- Trigger/contexto: "Estrés laboral" (tag)
- Hora del último craving (si hay): "Último: hoy 15:30"
- Tendencia: "↑ vs ayer" o "↓ vs ayer"

**Interacción:**
- Tocar → abre chatbot con mensaje prefilled: "Tengo un craving de [sustancia] ahora, ayúdame"

**Adaptaciones:**
- **Valeria (interrupción abrupta)**: esta tarjeta muestra "Sin cravings en últimas 24h" o "¡Cuidado! Craving alto (8/10) - usa técnicas ya"
- **Camila (universitaria)**: craving "social" vs "estrés"

### 3.5 Tarjeta de Próximas Acciones (Upcoming)
**Contenido:**
- Cita próxima: "Terapia hoy 16:00" (con icono 📅)
- Recordatorio de medicación: "Lorazepam 20:00" (con icono 💊)
- Grupo de apoyo: "AA mañana 18:00"
- Tarea terapéutica: "Escribir diario de gratitud"

**Interacción:**
- Tocar → acción directa (marcar como completado, posponer, ver detalles)

### 3.6 Acciones Rápidas (Grid de iconos)
**Iconos (4-6):**

1. 💬 **Chatbot** - "Hablar con tu coach"
2. 📝 **Check-in** - "Registrar estado"
3. 🎯 **Metas** - "Ver progreso"
4. 📚 **Recursos** - "Aprender"
5. 🆘 **Emergencia** - "Pedir ayuda" (solo si perfil de alto riesgo)
6. 👥 **Familia** - "Ver apoyo" (si vinculó familiar)

**Estilo:** iconos grandes, con label debajo.

---

## 4. Adaptaciones por Perfil

### 4.1 Lucas (16 años, cannabis)
- Colores: oscuro, neon accents
- Emojis: más expresivos
- Tono: "¿Cómo vas? 👀"
- Foco: mostrar días sin fumar, logros cortos
- Tarjeta de consumo: "🔥 Hoy: 0 porros" (celebración)

### 4.2 Camila (23 años, policonsumo)
- Colores: vibrante, moderno
- Dashboard con gráficos de "daño acumulado" semanal
- Gamificación: puntos, streaks, badges
- Acciones rápidas: "Planificar fin de semana", "Modo fiesta"

### 4.3 Diego (47 años, alcohol)
- Colores: neutros, profesionales (azul, gris)
- Enfoque en salud: "Presión arterial", "Sueño", "Hígado"
- Gráfico de consumo vs promedio de pares
- Sin emojis infantiles
- Meta: "Reducir a 1-2 copas/día"

### 4.4 Eliana (68 años)
- Letra: grande (18-20sp)
- Contraste alto
- Iconos simples
- Menos elementos: solo 3-4 tarjetas
- Voz: "Su estado hoy: tranquila (8/10)"
- Sin gráficos complicados, solo números claros

### 4.5 Rodrigo (69 años, opioides)
- Tarjeta principal: "Dosis actual" y "Próxima dosis"
- Advertencias destacadas si interacciona con alcohol
- Integración con recordatorios de medicación
- Dashboard de dolor: "Dolor 3/10" vs "Dosis 20mg"

### 4.6 Sofía (26 años, trauma)
- Dashboard calmado, colores suaves
- Tarjeta de "Seguridad": "Tu espacio está seguro"
- Acción rápida: "Técnica de grounding ahora" (botón grande)
- No mostrar datos que puedan triggerear (ej: consumo detallado en timeline)

### 4.7 Rosario (45 años, rural)
- Diseño offline-first: funciona sin internet
- Texto simple, iconos reconocibles
- Sin animaciones pesadas
- Conexión a recursos locales (grupo AA a 20km)
- Estadísticas simples: "Esta semana: 12 bebidas"

---

## 5. Estados y Variantes

### 5.1 Estado "Sin check-in hoy"
- Tarjeta de estado: "¿Cómo te sientes?" (emoji gris)
- Tarjeta de consumo: "Sin datos"
- CTA principal: "Hacer check-in ahora" (color primario, grande)
- Acciones rápidas: atenuadas (solo chatbot activo)

### 5.2 Estado "Consumo reciente" (esta madrugada)
- Tarjeta de consumo: "Anoche: 4 copas" (rojo si excede meta)
- Mensaje de refuerzo/concern: "¿Todo bien? ¿Quieres hablar?"
- Botón: "Registrar ya" para completar día anterior

### 5.3 Estado "Craving activo" (reportado en últimos 60 min)
- Tarjeta de cravings resaltada (borde naranja)
- Mensaje: "Detectamos un craving reciente. ¿Necesitas ayuda ahora?"
- Botón grande: "Usar técnica de urgencia" → lleva a chatbot con técnica pre-seleccionada
- Notificación push opcional: "¿Todo bien? Toca si necesitas apoyo"

### 5.4 Estado "Crisis detectada" (nivel naranja/rojo)
- Dashboard se simplifica a pantalla de crisis (ver pantalla de emergencia)
- Todos los elementos se ocultan, se muestra protocolo
- Botones grandes: "Llamar 988", "Contactar [familiar]"

---

## 6. Accesibilidad

### 6.1 Visual
- Contraste AA (4.5:1) mínimo
- Tamaño de texto base: 16sp, ajustable hasta 200% sin quiebre
- Iconos con label (siempre)
- Colores no como único canal de información (ej: usar también iconos y texto para riesgo)

### 6.2 Navegación
- Navegación por teclado/accesibilidad completa (TalkBack, VoiceOver)
- Orden lógico de focos
- Saltar a contenido principal

### 6.3 Redacción
- Lenguaje claro, frases cortas
- Evitar jerga médica innecesaria
- Definir siglas primera vez

### 6.4 Internacionalización
- Todas las strings en archivos de i18n
- Soporte RTL no requerido inicialmente (solo español)
- Formato de fecha/número localizado

---

## 7. Microinteracciones

### 7.1 Al completar check-in
- Animación de confeti sutil (para logro diario)
- Sonido breve positivo (opcional)
- Mensaje: "¡Bien hecho! Ya llevas 3 días seguidos."

### 7.2 Al tocar tarjeta de craving
- Efecto de "pulsar" y transición suave al chatbot
- Pre-cargar técnica relevante

### 7.3 Al alcanzar meta semanal
- Badge appear en header: "🎉 Semanal cumplida"
- Posibilidad de compartir (opcional) en redes (solo texto, sin detalles)

### 7.4 Al recibir mensaje de familiar
- Notificación dentro de app: "Roberto te envió un 💙"
- Animación de aparición suave

---

## 8. Diseño Responsivo

### Teléfonos (pantalla principal)
- Layout de una columna
- Tarjetas apiladas verticalmente
- Acciones rápidas en grid 2x2 o scroll horizontal

### Tablets (opcional Fase 2)
- Dashboard en dos columnas: izquierda (estado, check-in rápido), derecha (chatbot mini, próximas acciones)
- Aprovechar ancho para gráficos más amplios

---

## 9. Copy y Tono por Perfil (ver tabla en PROMPTS_POR_PERFIL.md)

Resumen:

| Perfil | Tono | Ejemplo de Saludo | Terminología Consumo |
|--------|------|-------------------|----------------------|
| Lucas | Coloquial, emojis | "¿Qué onda, Lucas?" | "fumar", "porro", "bajón" |
| Camila | Profesional, datos | "Buenos días, Camila" | "consumo", "sustancia", "resaca" |
| Diego | Ejecutivo | "Buenos días" | "hábitos de bebida", "copas" |
| Eliana | Respetuoso, pausado | "Doña Eliana, buenos días" | "tomar", "bebida" |
| Sofía | Empoderador, seguro | "Hola, Sofía. Estás en un espacio seguro" | "consumo", "metanfetamina" (pero validar) |
| Rodrigo | Clínico | "Buenos días, Rodrigo" | "oxicodona", "dolor", "tolerancia" |
| Rosario | Rural, simple | "Hola, Rosario" | "tomar", "cerveza", "pata" |

---

## 10. Especificaciones para Desarrolladores

### 10.1 Componentes Reutilizables

- `DashboardCard` - tarjeta base con header, contenido,footer actions
- `MoodDisplay` - emoji + número + tags
- `ProgressBar` - barra horizontal customizable
- `QuickActionGrid` - grid de iconos con labels
- `CheckInButton` - botón principal variable por estado
- `EmergencyBanner` - banner rojo emergencia (mostrado condicional)

### 10.2 Estados de Componentes

- `isLoading`: skeleton
- `isEmpty`: empty state con CTA
- `isError`: mensaje de error + retry
- `hasData`: normal

### 10.3 Propiedades (props) principales

```tsx
interface DashboardProps {
  profile: UserProfile; // objeto con perfil asignado
  todayCheckIn: CheckIn | null;
  cravings: Craving[];
  upcomingActions: UpcomingAction[];
  onCheckInPress: () => void;
  onChatPress: () => void;
  onEmergency: () => void;
}
```

---

## 11. Flujo de Navegación

```
Dashboard Principal
   │
   ├─► Check-in (pantalla check-in)
   │      └─► vuelve a dashboard actualizado
   │
   ├─► Chatbot (pantalla chat)
   │      └─► vuelve a dashboard (y viceversa)
   │
   ├─► Metas/Progreso (pantalla detalle progreso)
   │
   ├─► Recursos (lista de artículos/videos)
   │
   ├─► Emergencia (pantalla de protocolo)
   │
   └─► Ajustes (configuración)
```

---

## 12. Contenido Dinámico (según datos)

- Mostrar "X días sin [sustancia]" si hay racha
- Mostrar "Llevas Y% de tu meta semanal" si hay meta
- Mostrar "Último craving: 2h atrás" si hay registro
- Mostrar "Próxima terapia en Z" si hay cita

---

*Documento vivo: se ajustará con feedback de usuarios y testing.*

