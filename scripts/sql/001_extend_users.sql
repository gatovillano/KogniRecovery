-- =====================================================
-- Migración 001: Extender tabla users
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 2026-02-20
-- =====================================================
--
-- PROPÓSITO:
-- Este script extiende la tabla users existente con campos adicionales
-- requeridos según las especificaciones técnicas v1.0.
--
-- NOTA DE PRIVACIDAD:
-- Esta tabla maneja datos sensibles de salud mental.
-- Todos los datos son cifrados en reposo según políticas de HIPAA/GDPR.
-- El acceso está restringido por roles (RBAC).
--
-- =====================================================

-- Verificar que la extensión uuid está habilitada
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
END $$;

-- =====================================================
-- 1. Agregar columnas faltantes a users
-- =====================================================

-- Agregar teléfono único (requiere cifrado)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;

-- Agregar estado de cuenta
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) 
DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'suspended'));

-- Agregar estado de onboarding
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Agregar tipo de perfil (referencia a perfil de usuario)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_type VARCHAR(50);

-- Agregar nivel de riesgo
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20)
CHECK (risk_level IN ('bajo', 'medio', 'alto', 'critico'));

-- Agregar 2FA
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);

-- =====================================================
-- 2. Actualizar constraints existentes
-- =====================================================

-- Ampliar rol para incluir admin
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('patient', 'family', 'professional', 'admin'));

-- =====================================================
-- 3. Crear índices adicionales para users
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_users_risk_level ON users(risk_level);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- =====================================================
-- 4. Agregar función de actualización de timestamp
-- (si no existe)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 5. Agregar comentarios de documentación
-- =====================================================

COMMENT ON COLUMN users.phone IS 'Teléfono único del usuario (cifrado en producción)';
COMMENT ON COLUMN users.status IS 'Estado de la cuenta: active, inactive, suspended';
COMMENT ON COLUMN users.onboarding_completed IS 'Indica si el usuario completó el proceso de onboarding';
COMMENT ON COLUMN users.profile_type IS 'Tipo de perfil asignado: lucas_adolescente, maria_adulta, etc.';
COMMENT ON COLUMN users.risk_level IS 'Nivel de riesgo detectado: bajo, medio, alto, critico';
COMMENT ON COLUMN users.two_factor_enabled IS 'Indica si 2FA está habilitado';
COMMENT ON COLUMN users.two_factor_secret IS 'Secreto TOTP para 2FA (cifrado)';

-- =====================================================
-- FIN DEL SCRIPT 001
-- =====================================================

-- Verificar ejecución
DO $$ 
BEGIN
    RAISE NOTICE 'Migración 001: Extensión de tabla users completada exitosamente';
END $$;
