-- =====================================================
-- Migración 004: Crear tabla sharing_invitations
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 2026-02-20
-- =====================================================
--
-- PROPÓSITO:
-- Crear tabla para gestionar invitaciones de familiares/acompañantes
-- que desean recibir actualizaciones sobre el progreso del paciente.
--
-- NOTA DE PRIVACIDAD:
-- Los datos compartidos con familiares están sujetos al control
-- del paciente. El paciente puede revocar el acceso en cualquier momento.
-- Se registran todos los permisos y cambios para auditoría.
--
-- =====================================================

-- =====================================================
-- 1. Crear tipo enum para estados de invitación
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
        CREATE TYPE invitation_status AS ENUM (
            'pending', 
            'accepted', 
            'rejected', 
            'revoked',
            'expired'
        );
    END IF;
END $$;

-- =====================================================
-- 2. Crear tabla sharing_invitations
-- =====================================================

CREATE TABLE IF NOT EXISTS sharing_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES users(id) ON DELETE SET NULL,
    invitee_email VARCHAR(320) NOT NULL,
    invitee_name VARCHAR(255),
    token VARCHAR(64) UNIQUE NOT NULL,
    status invitation_status DEFAULT 'pending',
    permissions JSONB NOT NULL DEFAULT '{
        "mood": true,
        "checkins": true,
        "achievements": true,
        "progress": true,
        "alerts": true,
        "resources": false
    }',
    message TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. Crear índices para sharing_invitations
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sharing_invitations_patient_id 
    ON sharing_invitations(patient_id);

CREATE INDEX IF NOT EXISTS idx_sharing_invitations_family_id 
    ON sharing_invitations(family_id);

CREATE INDEX IF NOT EXISTS idx_sharing_invitations_token 
    ON sharing_invitations(token);

CREATE INDEX IF NOT EXISTS idx_sharing_invitations_status 
    ON sharing_invitations(status);

CREATE INDEX IF NOT EXISTS idx_sharing_invitations_expires 
    ON sharing_invitations(expires_at);

-- =====================================================
-- 4. Crear trigger para updated_at
-- =====================================================

CREATE TRIGGER update_sharing_invitations_updated_at 
    BEFORE UPDATE ON sharing_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Crear función para limpiar invitaciones expiradas
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    UPDATE sharing_invitations 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Agregar comentarios de documentación
-- =====================================================

COMMENT ON TABLE sharing_invitations IS 'Invitaciones para vincular familiares/acompañantes al seguimiento del paciente';
COMMENT ON COLUMN sharing_invitations.patient_id IS 'ID del paciente que envía la invitación';
COMMENT ON COLUMN sharing_invitations.family_id IS 'ID del familiar cuando acepta la invitación';
COMMENT ON COLUMN sharing_invitations.invitee_email IS 'Email del familiar invitar';
COMMENT ON COLUMN sharing_invitations.invitee_name IS 'Nombre del familiar (opcional)';
COMMENT ON COLUMN sharing_invitations.token IS 'Token único para el enlace de aceptación';
COMMENT ON COLUMN sharing_invitations.status IS 'Estado: pending, accepted, rejected, revoked, expired';
COMMENT ON COLUMN sharing_invitations.permissions JSONB IS 'Permisos concedidos: mood, checkins, achievements, progress, alerts, resources';
COMMENT ON COLUMN sharing_invitations.message IS 'Mensaje personalizado del paciente al familiar';
COMMENT ON COLUMN sharing_invitations.expires_at IS 'Fecha de expiración de la invitación (por defecto 7 días)';
COMMENT ON COLUMN sharing_invitations.responded_at IS 'Fecha cuando el familiar respondió a la invitación';

-- =====================================================
-- FIN DEL SCRIPT 004
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Migración 004: Tabla sharing_invitations creada exitosamente';
END $$;
