# Skill: save_relevant_info (Registro de Informacion Relevante)

## Description

This skill allows the agent (LUA) to proactively save clinically relevant information detected during conversations with the user. When the user shares emotional states, cravings, social interactions, activities, triggers, or coping strategies, LUA automatically records them in the appropriate data models for clinical tracking and analysis.

## Capabilities

### 1. record_craving

- **Purpose**: Record a craving (antojo) experienced by the user.
- **When to use**: When the user mentions an intense desire to consume a substance, describes craving symptoms, or reports having experienced a craving recently.
- **Input**: `userId` (String), `substance_name` (String, required), `intensity` (Number 1-10, required), `triggers` (String[], optional), `coping_strategies` (String[], optional), `notes` (String, optional)
- **Target**: `cravings` table

### 2. record_mood_checkin

- **Purpose**: Record a mood/emotional state check-in for the user.
- **When to use**: When the user describes how they are feeling emotionally, mentions sleep quality, exercise, or shares a general emotional state update outside of the formal check-in screen.
- **Input**: `userId` (String), `mood_score` (Number 1-10), `anxiety_score` (Number 1-10), `energy_score` (Number 1-10), `emotional_tags` (String[], optional), `sleep_hours` (Number, optional), `exercised_today` (Boolean, optional), `exercise_minutes` (Number, optional), `exercise_type` (String, optional), `social_interaction` (String, optional), `notes` (String, optional)
- **Target**: `checkins` table + `mood_history` table

### 3. record_daily_note

- **Purpose**: Save a daily journal note from the user.
- **When to use**: When the user shares a reflection, thought, event, or anything worth documenting from their day.
- **Input**: `userId` (String), `content` (String, required)
- **Target**: `daily_notes` table

### 4. record_social_entry

- **Purpose**: Record a social interaction or social environment observation.
- **When to use**: When the user mentions interactions with people that impact their recovery, describes their social environment, or talks about relationships.
- **Input**: `userId` (String), `people_description` (String, required), `impact_assessment` (String, required: 'positivo', 'negativo', or 'neutral')
- **Target**: `social_entries` table

### 5. record_activity_entry

- **Purpose**: Record an activity the user performed with emotional context.
- **When to use**: When the user describes doing something (exercise, hobbies, work, etc.) and how they felt before, during, or after.
- **Input**: `userId` (String), `activity_name` (String, required), `feeling_before` (String, optional), `feeling_during` (String, optional), `feeling_after` (String, optional)
- **Target**: `activity_entries` table

### 6. record_consumption_analysis

- **Purpose**: Record a consumption analysis entry linking a trigger situation to an action taken.
- **When to use**: When the user describes a situation that led to substance consumption or a risky moment, and what they did about it.
- **Input**: `userId` (String), `trigger_situation` (String, required), `action_taken` (String, required)
- **Target**: `consumption_analysis` table

### 7. save_coping_strategy

- **Purpose**: Save a coping strategy that the user mentions or discovers.
- **When to use**: When the user identifies a technique or strategy that helps them manage cravings, stress, or difficult emotions.
- **Input**: `userId` (String), `name` (String, required), `category` (String, required), `description` (String, optional), `instructions` (String, optional), `when_to_use` (String, optional)
- **Target**: `coping_strategies` table

### 8. save_craving_trigger

- **Purpose**: Save an identified craving trigger.
- **When to use**: When the user identifies something (a place, person, emotion, situation) that provokes cravings.
- **Input**: `userId` (String), `trigger_type` (String, required), `trigger_description` (String, required), `frequency` (String, optional), `context_notes` (String, optional)
- **Target**: `craving_triggers` table

---

**Notes**:

- Always ask for required fields if the user hasn't provided enough information.
- Save proactively when clinical information is clearly detected in conversation.
- Inform the user when data is saved so they know it's being tracked.
- The agent should extract fields naturally from conversation context, not require structured input.
