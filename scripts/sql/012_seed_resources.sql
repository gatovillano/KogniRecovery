-- =====================================================
-- Script de Seed: Datos iniciales - Recursos Educativos
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 2026-02-20
-- =====================================================
--
-- PROPÓSITO:
-- Insertar recursos educativos psicoeducativos iniciales.
-- Contenido de referencia para usuarios.
--
-- =====================================================

-- Recursos educativos
INSERT INTO resources (
    title,
    description,
    content_type,
    language,
    target_profiles,
    target_substances,
    tags,
    content,
    author,
    is_featured,
    is_active,
    sort_order
) VALUES
-- Artículos - Comprensión de la adicción
(
    '¿Qué es la adicción?',
    'Comprende los mecanismos cerebrales detrás de la adicción y por qué es considerada una enfermedad crónica.',
    'article',
    'es',
    '["general", "lucas_adolescente", "maria_adulta"]',
    '["alcohol", "cannabis", "cocaina", "tabaco"]',
    '["adiccion", "neurociencia", "enfermedad", "comprension"]',
    '# ¿Qué es la adicción?

La adicción es una enfermedad crónica del cerebro que se caracteriza por la búsqueda compulsiva de una sustancia o comportamiento, a pesar de sus consecuencias negativas.

## ¿Por qué ocurre?

Cuando una persona consume una sustancia adictiva, el cerebro libera dopamina, creando una sensación de placer. Con el tiempo, el cerebro se adapta y necesita más sustancia para lograr el mismo efecto (tolerancia).

## Mitos comunes

- **"La adicción es falta de voluntad"**: Falso. Es una enfermedad que afecta el cerebro.
- **"Solo afecta a ciertos tipos de personas"**: Falso. Puede afectar a cualquier persona.
- **"Una vez adicto, siempre adicto"**: Parcialmente cierto. Es una condición crónica, pero manejable.

## La buena noticia

La recuperación es posible. Con tratamiento adecuado y apoyo, las personas pueden llevar vidas plenas y libres de adicción.',
    'Equipo KogniRecovery',
    true,
    true,
    1
),
(
    'El Modelo de Cambio: Etapas de la Recuperación',
    'Aprende sobre las 6 etapas del cambio y cómo aplicarlas en tu proceso de recuperación.',
    'article',
    'es',
    '["general", "lucas_adolescente", "maria_adulta"]',
    '[]',
    '["modelo_cambio", "prochaska", "recuperacion", "autogestion"]',
    '# El Modelo de Cambio de Prochaska

El Modelo de Cambio describe las etapas por las que pasa una persona cuando busca cambiar un comportamiento, incluido el consumo de sustancias.

## Las 6 Etapas

### 1. Precontemplación
Aún no se considera cambiar. "No tengo problema con mi consumo."

### 2. Contemplación
Se reconoce el problema pero hay ambivalencia. "Debería cambiar, pero..."

### 3. Preparación
Se tiene la intención de cambiar pronto. "Voy a empezar la próxima semana."

### 4. Acción
Se implementan activamente los cambios. "He reducido mi consumo."

### 5. Mantenimiento
Se consolidan los cambios logrados. " Llevo 30 días sin consumir."

### 6. Recaída (parte del proceso)
Vuelta al consumo después de un período de abstinencia. No es un fracaso, sino una oportunidad de aprendizaje.

## ¿En qué etapa estás?

Reconocer tu etapa te ayuda a establecer metas realistas.',
    'Equipo KogniRecovery',
    true,
    true,
    2
),
(
    'Manejo de Craving: Estrategias Prácticas',
    'Técnicas efectivas para controlar los antojos o cravings cuando surgen.',
    'article',
    'es',
    '["general", "lucas_adolescente", "maria_adulta"]',
    '["alcohol", "cannabis", "cocaina", "tabaco"]',
    '["craving", "antojo", "manejo_impulsos", "tecnicas"]',
    '# Cómo Manejar los Cravings

Los cravings (antojos) son normales en la recuperación. Aquí te enseñamos a manejarlos.

## La regla de los 15 minutos

Cuando sientas un craving intenso:
1. **Detente** y reconoce que está pasando
2. **Respira** profundamente 3 veces
3. **Distráete** con alguna actividad durante 15 minutos
4. **Evalúa** si el craving ha disminuido

## Técnicas efectivas

### 1. Cambia tu entorno
- Sal a caminar
- Abre una ventana
- Cambia de habitación

### 2. Actividad física
- Ejercicio suave
- Estiramientos
- Bailar

### 3. Conecta con alguien
- Llama a un amigo
- Habla con tu grupo de apoyo
- Escribe en tu diario

### 4. Autocuidado
- Toma un baño caliente
- Come algo saludable
- Descansa

## Recuerda

Los cravings son temporales. Pasan si no actúas sobre ellos.',
    'Equipo KogniRecovery',
    true,
    true,
    3
),
-- Artículos para jóvenes
(
    'Adolescencia y sustancias: ¿Por qué es diferente?',
    'Entiende cómo el cerebro adolescente procesa las sustancias y los riesgos específicos.',
    'article',
    'es',
    '["lucas_adolescente"]',
    '["alcohol", "cannabis", "tabaco"]',
    '["adolescentes", "cerebro", "desarrollo", "riesgos"]',
    '# Tu cerebro y las sustancias

Durante la adolescencia (12-19 años), tu cerebro está en construcción. Las áreas responsables de la toma de decisiones y el control de impulsos aún se están desarrollando.

## ¿Por qué los jóvenes son más vulnerables?

- El sistema de recompensa cerebral está más activo
- La capacidad de evaluar riesgos está en desarrollo
- La presión de grupo tiene mayor impacto

## Efectos específicos

### Alcohol
- Afecta la memoria
- Dificulta el aprendizaje
- Puede causar daños cerebrales permanentes

### Cannabis
- Puede afectar el desarrollo cerebral
- Problemas de concentración
- Ansiedad y depresión

## Decidir es tu poder

Entender los riesgos te da el poder de elegir.',
    'Equipo KogniRecovery',
    false,
    true,
    10
),
-- Ejercicios
(
    'Ejercicio: Identifica tus disparadores',
    'Aprende a reconocer las situaciones, emociones y personas que aumentan tu deseo de consumir.',
    'exercise',
    'es',
    '["general", "lucas_adolescente", "maria_adulta"]',
    '["alcohol", "cannabis", "cocaina", "tabaco"]',
    '["disparadores", "autoconocimiento", "ejercicio", "prevencion"]',
    '# Ejercicio: Mi Mapa de Disparadores

## ¿Qué son los disparadores?

Los disparadores son situaciones, emociones, lugares o personas que aumentan tu deseo de consumir.

## Paso 1: Identifica tus emociones
¿Qué emociones sueles sentir antes de consumir?
- Ansiedad
- Tristeza
- Enojo
- Aburrimiento
- Soledad
- Estrés

## Paso 2: Identifica situaciones
¿En qué situaciones sueles consumir?
- Fiestas
- Estar solo
- Problemas familiares
- Después del trabajo
- Fin de semana

## Paso 3: Identifica lugares
¿Dónde sueles consumir?
- Casa
- Casa de amigos
- Bares
- Fiestas

## Paso 4: Crea tu plan

| Disparador | Señal de alerta | Estrategia de afrontamiento |
|------------|-----------------|----------------------------|
| Ejemplo: Estar triste | "Quiero consumir para sentirme mejor" | "Voy a llamar a mi amigo o hacer ejercicio" |

## Tu turno
Completa tu propia tabla de disparadores en tu diario.',
    'Equipo KogniRecovery',
    true,
    true,
    20
),
-- Información sobre tratamiento
(
    'Opciones de tratamiento: ¿Cuál es适合 tú?',
    'Explora las diferentes modalidades de tratamiento disponibles para la adicción.',
    'article',
    'es',
    '["general", "lucas_adolescente", "maria_adulta"]',
    '["alcohol", "cannabis", "cocaina", "tabaco"]',
    '["tratamiento", "opciones", "terapia", "ayuda_profesional"]',
    '# Opciones de Tratamiento

No existe un único tratamiento que funcione para todos. Aquí te presentamos las opciones más comunes.

## Tratamientos conductuales

### Terapia cognitivo-conductual (TCC)
Aprende a identificar y cambiar pensamientos y comportamientos problemáticos.

### Terapia motivacional
Ayuda a resolver la ambivalencia hacia el cambio.

### Entrevista motivacional
Técnica para aumentar la motivación intrínseca.

## Grupos de apoyo

### Alcohólicos Anónimos (AA)
Grupos de autoayuda basados en los 12 pasos.

### Narcóticos Anónimos (NA)
Similar a AA, para todo tipo de sustancias.

## Tratamientos especializados

### Centros de tratamiento residencial
Programa intensivo en entorno controlado.

### Tratamiento ambulatorio
Terapias mientras vives en casa.

### Tratamiento farmacológico
Medicamentos para ayudarte en la recuperación (bajo supervisión médica).

## ¿Cómo elegir?

Considera:
- Tu situación personal
- El tipo de sustancia
- Tu historial de tratamientos
- Tu red de apoyo

**El mejor tratamiento es el que funciona para ti.**',
    'Equipo KogniRecovery',
    false,
    true,
    30
)
ON CONFLICT DO NOTHING;

DO $$ 
BEGIN
    RAISE NOTICE 'Seed: Recursos educativos insertados exitosamente';
END $$;
