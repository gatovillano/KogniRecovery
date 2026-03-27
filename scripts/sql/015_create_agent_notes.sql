-- =====================================================
-- Migración: Crear tabla de notas (agente + usuario)
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 2026-03-27
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'agent')),
    category VARCHAR(50),
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_notes_user_id ON agent_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_notes_source ON agent_notes(source);
CREATE INDEX IF NOT EXISTS idx_agent_notes_created_at ON agent_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_notes_is_pinned ON agent_notes(is_pinned);

COMMENT ON TABLE agent_notes IS 'Notas guardadas por el usuario o por el agente IA (LÚA).';
