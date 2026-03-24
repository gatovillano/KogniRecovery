-- =====================================================
-- Migración 003: Crear tabla emergency_contacts
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 2026-02-20
-- =====================================================
--
-- PROPÓSITO:
-- Crear tabla de contactos de emergencia que serán notificados
-- cuando el usuario active una alerta o cuando el sistema detecte riesgo.
--
-- NOTA DE PRIVACIDAD:
-- Esta tabla contiene información de contacto de terceros.
-- Se requiere consentimiento del usuario para almacenar y usar
-- estos datos para notificaciones de emergencia.
--
-- =====================================================

-- =====================================================
-- 1. Crear tabla emergency_contacts
-- =====================================================

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(320),
    relationship VARCHAR(100),
    notify_on_risk VARCHAR(20) DEFAULT 'high' 
        CHECK (notify_on_risk IN ('none', 'low', 'medium', 'high', 'all')),
    notify_on_crisis BOOLEAN DEFAULT TRUE,
    can_share_location BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Crear índices para emergency_contacts
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id 
    ON emergency_contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_is_primary 
    ON emergency_contacts(user_id, is_primary) 
    WHERE is_primary = TRUE;

-- =====================================================
-- 3. Crear trigger para updated_at
-- =====================================================

CREATE TRIGGER update_emergency_contacts_updated_at 
    BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. Agregar comentarios de documentación
-- =====================================================

COMMENT ON TABLE emergency_contacts IS 'Contactos de emergencia de usuarios para notificaciones y alertas';
COMMENT ON COLUMN emergency_contacts.name IS 'Nombre completo del contacto de emergencia';
COMMENT ON COLUMN emergency_contacts.phone IS 'Teléfono de contacto (preferentemente móvil)';
COMMENT ON COLUMN emergency_contacts.email IS 'Email del contacto (opcional)';
COMMENT ON COLUMN emergency_contacts.relationship IS 'Parentesco o relación: padre, madre, cónyuge, amigo, etc.';
COMMENT ON COLUMN emergency_contacts.notify_on_risk IS 'Nivel de riesgo que dispara notificación: none, low, medium, high, all';
COMMENT ON COLUMN emergency_contacts.notify_on_crisis IS 'Notificar siempre en crisis/emergencia';
COMMENT ON COLUMN emergency_contacts.can_share_location IS 'Permite compartir ubicación con este contacto';
COMMENT ON COLUMN emergency_contacts.is_primary IS 'Indica si es el contacto primario de emergencia';

-- =====================================================
-- FIN DEL SCRIPT 003
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Migración 003: Tabla emergency_contacts creada exitosamente';
END $$;
