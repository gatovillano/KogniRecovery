# Skill: journal_skill (Bitácora del Usuario)

## Description

Permite al agente consultar la bitácora completa del usuario por rango de fechas, día específico o semana completa. Útil para análisis temporal de patrones de consumo, detección de progresos, y personalización del acompañamiento.

## Capabilities

### 1. journal_search_by_day

- **Purpose**: Retrieve all journal entries for a specific date.
- **When to use**: When the user asks about a particular day, or the agent needs to review a specific date's events.
- **Input**: `userId` (String), `date` (String, format: YYYY-MM-DD), `types` (optional String array, e.g. ["checkin", "substance_dose"])

### 2. journal_search_by_week

- **Purpose**: Retrieve all journal entries for the week containing a given date.
- **When to use**: To analyze weekly patterns, detect consumption peaks, or compare weeks.
- **Input**: `userId` (String), `date` (String, any date in the target week, format: YYYY-MM-DD)

### 3. journal_search_by_range

- **Purpose**: Retrieve all journal entries within a date range.
- **When to use**: For custom date range analysis, multi-week comparisons, or pattern discovery.
- **Input**: `userId` (String), `startDate` (String, format: YYYY-MM-DD), `endDate` (String, format: YYYY-MM-DD), `types` (optional String array)

## Entry Types

- `checkin` - Check-in diario con mood, ansiedad, energía
- `note` - Notas diarias
- `habit` - Hábitos protectores y de riesgo
- `habit_completion` - Hábitos completados
- `social` - Entradas de entorno social
- `activity` - Actividades registradas
- `analysis` - Análisis de consumo/impulsos
- `substance_dose` - Dosis de sustancias

---

**Note**: All entries include `entry_date` and `entry_time` for temporal analysis. Use time data to identify consumption peaks and daily patterns.
