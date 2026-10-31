-- =====================================================
-- 000_core_compat.sql
-- Compatibilidad del esquema base para el panel de terapeutas.
--
-- El repositorio tiene tres fuentes históricas de esquema
-- (docker/postgres/init.sql, scripts/sql/*.sql y
-- server/src/scripts/migrate.ts). Esta migración no pretende
-- reemplazarlas todavía: solo asegura que `users` tenga las
-- columnas que el backend y las nuevas tablas necesitan.
--
-- Todas las operaciones son idempotentes.
-- =====================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_type VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(20) DEFAULT 'openai';
ALTER TABLE users ADD COLUMN IF NOT EXISTS llm_model VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS llm_api_key VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- La contraseña puede vivir en `password` (migrate.ts) o en
-- `password_hash` (init.sql). El backend acepta ambas, pero
-- ninguna debe ser NOT NULL para permitir inserts compatibles.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password'
  ) THEN
    ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
  END IF;
END $$;

-- Sincronizar credenciales existentes entre ambas columnas.
UPDATE users
SET password_hash = password
WHERE password_hash IS NULL AND password IS NOT NULL;

UPDATE users
SET password = password_hash
WHERE password IS NULL AND password_hash IS NOT NULL;

-- Nombre visible por defecto para filas antiguas.
UPDATE users
SET name = split_part(email, '@', 1)
WHERE name IS NULL OR name = '';

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_risk_level ON users(risk_level);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
