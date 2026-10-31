-- =====================================================
-- 011_agent_notes.sql
-- Tabla de notas del agente (LÚA) y del usuario.
-- El modelo `note.model.ts` inserta/consulta `agent_notes`.
-- Idempotente.
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  source VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'agent')),
  category VARCHAR(100),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_notes_user ON agent_notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_notes_source_category ON agent_notes(user_id, source, category);
