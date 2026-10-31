-- =====================================================
-- 006_clinical_read_compat.sql
-- Compatibilidad del esquema clínico existente.
--
-- `docker/postgres/init.sql` creó una versión mínima de
-- `checkins` (type, mood, cravings, triggers, notes) mientras
-- que `checkin.model.ts` y `scripts/sql/009_create_checkins.sql`
-- esperan la versión ampliada (mood_score, anxiety_score, ...).
--
-- Esta migración reconcilia ambas sin destruir datos:
-- - añade las columnas que usa el backend;
-- - relaja los NOT NULL/CHECK del esquema antiguo;
-- - traduce los valores antiguos a las columnas nuevas;
-- - crea las tablas auxiliares que usa el controlador.
--
-- Idempotente.
-- =====================================================

ALTER TABLE checkins ADD COLUMN IF NOT EXISTS checkin_type VARCHAR(30) DEFAULT 'diario';
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS mood_score INTEGER;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS anxiety_score INTEGER;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS energy_score INTEGER;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS emotional_tags TEXT[] DEFAULT '{}';
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS consumed_substances JSONB DEFAULT '[]'::jsonb;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS risk_situation BOOLEAN DEFAULT FALSE;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS risk_description TEXT;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS coping_strategy_used VARCHAR(50);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS sleep_hours DECIMAL(4,1);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS sleep_quality INTEGER;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS exercised_today BOOLEAN DEFAULT FALSE;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS exercise_minutes INTEGER;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS exercise_type VARCHAR(50);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS activities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS social_interaction VARCHAR(30) DEFAULT 'ninguna';
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS checkin_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS checkin_time TIME DEFAULT CURRENT_TIME;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT TRUE;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- El esquema antiguo exige mood/cravings. El modelo nuevo no los envía.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'checkins' AND column_name = 'mood'
  ) THEN
    ALTER TABLE checkins ALTER COLUMN mood DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'checkins' AND column_name = 'cravings'
  ) THEN
    ALTER TABLE checkins ALTER COLUMN cravings DROP NOT NULL;
  END IF;
END $$;

-- El CHECK antiguo limita mood a 1..5; la app nueva usa 1..10.
ALTER TABLE checkins DROP CONSTRAINT IF EXISTS checkins_mood_check;
ALTER TABLE checkins DROP CONSTRAINT IF EXISTS checkins_cravings_check;
ALTER TABLE checkins DROP CONSTRAINT IF EXISTS checkins_type_check;

-- Traducir filas antiguas.
UPDATE checkins
SET mood_score = LEAST(10, GREATEST(1, mood * 2))
WHERE mood_score IS NULL AND mood IS NOT NULL;

UPDATE checkins
SET anxiety_score = LEAST(10, GREATEST(1, cravings))
WHERE anxiety_score IS NULL AND cravings IS NOT NULL;

UPDATE checkins
SET checkin_type = CASE type
    WHEN 'weekly' THEN 'semanal'
    WHEN 'monthly' THEN 'mensual'
    ELSE 'diario'
  END
WHERE (checkin_type IS NULL OR checkin_type = 'diario') AND type IS NOT NULL;

UPDATE checkins
SET checkin_date = completed_at::date
WHERE checkin_date IS NULL AND completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_checkins_user_date
  ON checkins(user_id, checkin_date DESC);

-- Tablas auxiliares usadas por checkin.model.ts.
CREATE TABLE IF NOT EXISTS mood_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    anxiety_score INTEGER CHECK (anxiety_score >= 1 AND anxiety_score <= 10),
    energy_score INTEGER CHECK (energy_score >= 1 AND energy_score <= 10),
    emotional_tags TEXT[] DEFAULT '{}',
    weekly_average_mood DECIMAL(4,2),
    weekly_average_anxiety DECIMAL(4,2),
    weekly_average_energy DECIMAL(4,2),
    mood_trend VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_mood_date UNIQUE (user_id, mood_date)
);

CREATE INDEX IF NOT EXISTS idx_mood_history_user_id ON mood_history(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_history_mood_date ON mood_history(mood_date DESC);

CREATE TABLE IF NOT EXISTS checkin_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_type VARCHAR(30) NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    last_completion_date DATE,
    streak_start_date DATE,
    longest_streak_start_date DATE,
    longest_streak_end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_streak_type UNIQUE (user_id, streak_type)
);

CREATE INDEX IF NOT EXISTS idx_checkin_streaks_user_id ON checkin_streaks(user_id);

CREATE TABLE IF NOT EXISTS checkin_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    frequency VARCHAR(20) DEFAULT 'diaria',
    status VARCHAR(20) DEFAULT 'active',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    completed_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checkin_goals_user_id ON checkin_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_goals_status ON checkin_goals(status);
