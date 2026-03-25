-- =====================================================
-- Migración: Crear tabla de gastos en sustancias
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 2026-03-24
-- =====================================================

CREATE TABLE IF NOT EXISTS substance_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    substance_id UUID REFERENCES substances(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CLP',
    expense_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento en búsquedas
CREATE INDEX IF NOT EXISTS idx_substance_expenses_user_id ON substance_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_substance_expenses_expense_date ON substance_expenses(expense_date);

-- Comentario explicativo
COMMENT ON TABLE substance_expenses IS 'Registra los gastos económicos que el usuario realiza en la compra de sustancias.';
