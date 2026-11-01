-- =====================================================
-- 013_user_push_tokens.sql
-- Tabla faltante para tokens push (PRIV-007).
-- =====================================================
CREATE TABLE IF NOT EXISTS user_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    push_token TEXT NOT NULL,
    device_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_push_token UNIQUE (user_id, push_token)
);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user ON user_push_tokens(user_id);
