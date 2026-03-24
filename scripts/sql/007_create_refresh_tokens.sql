-- =====================================================
-- Migración 007: Crear tabla refresh_tokens
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 2026-02-20
-- =====================================================
--
-- PROPÓSITO:
-- Crear tabla para gestionar refresh tokens de autenticación JWT.
-- Permite sesiones múltiples y revocación de tokens.
--
-- NOTA DE SEGURIDAD:
-- Los refresh tokens son credenciales de alto valor.
-- Almacenar de forma segura y implementar rotación.
-- Incluir información de dispositivo para auditoría.
--
-- =====================================================

-- =====================================================
-- 1. Crear tabla refresh_tokens
-- =====================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    
    -- Estado
    is_revoked BOOLEAN DEFAULT FALSE,
    is_used BOOLEAN DEFAULT FALSE,
    
    -- Fechas
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    
    -- Metadatos
    issued_from VARCHAR(50) DEFAULT 'mobile_app'
        CHECK (issued_from IN ('mobile_app', 'web_app', 'api')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Crear índices para refresh_tokens
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
    ON refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token 
    ON refresh_tokens(token);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_device_id 
    ON refresh_tokens(user_id, device_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires 
    ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_active 
    ON refresh_tokens(user_id, is_revoked, is_used, expires_at)
    WHERE is_revoked = FALSE AND is_used = FALSE AND expires_at > NOW();

-- =====================================================
-- 3. Agregar comentarios de documentación
-- =====================================================

COMMENT ON TABLE refresh_tokens IS 'Tokens de actualización para autenticación JWT';
COMMENT ON COLUMN refresh_tokens.user_id IS 'Usuario propietario del token';
COMMENT ON COLUMN refresh_tokens.token IS 'Token de actualización (hash en producción)';
COMMENT ON COLUMN refresh_tokens.device_id IS 'Identificador único del dispositivo';
COMMENT ON COLUMN refresh_tokens.device_name IS 'Nombre del dispositivo (ej: iPhone 14)';
COMMENT ON COLUMN refresh_tokens.device_type IS 'Tipo: android, ios, web';
COMMENT ON COLUMN refresh_tokens.ip_address IS 'Dirección IP cuando se emitió el token';
COMMENT ON COLUMN refresh_tokens.user_agent IS 'User agent del cliente';
COMMENT ON COLUMN refresh_tokens.is_revoked IS 'Token revocado (no válido)';
COMMENT ON COLUMN refresh_tokens.is_used IS 'Token ya utilizado (para rotación)';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Fecha de expiración del token';
COMMENT ON COLUMN refresh_tokens.used_at IS 'Fecha cuando fue usado';
COMMENT ON COLUMN refresh_tokens.revoked_at IS 'Fecha de revocación';
COMMENT ON COLUMN refresh_tokens.issued_from IS 'Origen: mobile_app, web_app, api';

-- =====================================================
-- 4. Crear función para limpiar tokens expirados
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() - INTERVAL '30 days';
    
    DELETE FROM refresh_tokens 
    WHERE is_used = TRUE 
    AND used_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. Crear función para revocar todos los tokens de usuario
-- =====================================================

CREATE OR REPLACE FUNCTION revoke_all_user_tokens(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE refresh_tokens 
    SET is_revoked = TRUE, 
        revoked_at = NOW()
    WHERE user_id = p_user_id 
    AND is_revoked = FALSE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DEL SCRIPT 007
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Migración 007: Tabla refresh_tokens creada exitosamente';
END $$;
