-- =====================================================
-- Script 008: Crear tabla de perfiles de usuario
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 21-02-2026
-- =====================================================

-- Tabla principal de perfiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Información del perfil
    profile_type VARCHAR(50) NOT NULL DEFAULT 'estandar',
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    
    -- Características del paciente
    age_range VARCHAR(20),
    gender VARCHAR(20),
    education_level VARCHAR(50),
    employment_status VARCHAR(50),
    
    -- Información de adicción
    primary_substance VARCHAR(100),
    substance_years_use INTEGER,
    previous_treatments BOOLEAN DEFAULT false,
    has_relapse_history BOOLEAN DEFAULT false,
    
    -- Situación actual
    current_status VARCHAR(50) DEFAULT 'activo', -- activo, en_tratamiento, recuperacion
    treatment_start_date DATE,
    motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10),
    
    -- Preferencias
    preferred_language VARCHAR(10) DEFAULT 'es',
    notification_preferences JSONB DEFAULT '{"checkin": true, "chatbot": true, "emergency": true}'::jsonb,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_user_profile UNIQUE (user_id),
    CONSTRAINT valid_profile_type CHECK (profile_type IN (
        'estandar', 'adaptado', 'intensivo', 'mantencion', 
        'familiar', 'profesional', 'administrador'
    ))
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_type ON profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Tabla de configuración de perfil
CREATE TABLE IF NOT EXISTS profile_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Configuración de check-in
    checkin_frequency VARCHAR(20) DEFAULT 'diaria', -- diaria, semanal
    checkin_reminder_time TIME DEFAULT '09:00',
    checkin_reminder_enabled BOOLEAN DEFAULT true,
    
    -- Configuración de privacidad
    data_sharing_enabled BOOLEAN DEFAULT false,
    share_with_family BOOLEAN DEFAULT false,
    share_progress_weekly BOOLEAN DEFAULT true,
    anonymous_analytics BOOLEAN DEFAULT true,
    
    -- Configuración de emergencia
    auto_detect_crisis BOOLEAN DEFAULT true,
    emergency_contacts_notified BOOLEAN DEFAULT true,
    location_sharing_emergency BOOLEAN DEFAULT false,
    
    -- Configuración de chatbot
    chatbot_personality VARCHAR(50) DEFAULT 'apoyo',
    response_detail_level VARCHAR(20) DEFAULT 'balanceado',
    memory_enabled BOOLEAN DEFAULT true,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_profile_settings UNIQUE (profile_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_settings_profile_id ON profile_settings(profile_id);

-- Tabla de preferencias de sustancias
CREATE TABLE IF NOT EXISTS substance_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    substance_id UUID REFERENCES substances(id),
    substance_name VARCHAR(100) NOT NULL,
    
    -- Estado de uso
    current_status VARCHAR(30) DEFAULT 'activo', -- activo, en_cese, recuperado
    use_frequency VARCHAR(30),
    last_use_date DATE,
    target_cease_date DATE,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_substance_preferences_profile_id ON substance_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_substance_preferences_substance_id ON substance_preferences(substance_id);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_settings_updated_at
    BEFORE UPDATE ON profile_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_substance_preferences_updated_at
    BEFORE UPDATE ON substance_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE profiles IS 'Almacena información de perfil de usuarioextendida para personalizacióndel tratamiento';
COMMENT ON TABLE profile_settings IS 'Configuración de preferencias yaplicación del perfil de usuario';
COMMENT ON TABLE substance_preferences IS 'Preferencias y estado de cada sustancia para el usuario';

-- Verificar creación
SELECT 'Tabla profiles creada exitosamente' AS status;
SELECT 'Tabla profile_settings creada exitosamente' AS status;
SELECT 'Tabla substance_preferences creada exitosamente' AS status;

-- Mostrar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'profile%';
