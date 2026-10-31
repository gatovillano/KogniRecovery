-- =====================================================
-- 010_profiles_compat.sql
-- Compatibilidad de la tabla `profiles`.
--
-- `docker/postgres/init.sql` creó una versión mínima de
-- `profiles` (first_name, last_name, phone, avatar_url, birth_date,
-- recovery_start_date, emergency_*). El backend actual
-- (`profile.model.ts` y `auth.service.ts`) espera el esquema
-- ampliado de `server/src/scripts/migrate.ts`: profile_type,
-- display_name, bio, etc.
--
-- Esta migración reconcilia ambas sin destruir datos:
-- - añade las columnas que usa el backend;
-- - relaja el NOT NULL del esquema antiguo (first_name/last_name)
--   porque los registros nuevos usan display_name;
-- - garantiza un único perfil por usuario.
--
-- Idempotente.
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_type VARCHAR(50) NOT NULL DEFAULT 'estandar';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_range VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_level VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_status VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_substance VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS substance_years_use INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS previous_treatments BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_relapse_history BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_status VARCHAR(50) DEFAULT 'activo';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS treatment_start_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'es';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"checkin": true, "chatbot": true, "emergency": true}'::jsonb;

-- El esquema antiguo exige first_name/last_name. El modelo nuevo usa
-- display_name y no los envía.
ALTER TABLE profiles ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN last_name DROP NOT NULL;

-- Un solo perfil por usuario (idempotente y seguro: no hay duplicados).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_profiles_user_id ON profiles(user_id);
