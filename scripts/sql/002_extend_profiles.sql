-- =====================================================
-- Migración 002: Extender tabla profiles
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 2026-02-20
-- =====================================================
--
-- PROPÓSITO:
-- Este script extiende la tabla profiles existente con campos adicionales
-- requeridos según las especificaciones técnicas v1.0 para el sistema
-- de acompañamiento en adicciones.
--
-- NOTA DE PRIVACIDAD:
-- Esta tabla contiene información sensible de saludmental y adicciones.
-- Datos como consumo de sustancias, diagnóstico de salud mental y 
-- historial de trauma están protegidos bajo HIPAA/GDPR.
-- Acceso restringido a personal autorizado y el propio usuario.
--
-- =====================================================

-- =====================================================
-- 1. Agregar columnas de información de adicciones
-- =====================================================

-- Edad del usuario
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS age INTEGER;

-- Género
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gender VARCHAR(50);

-- País (código ISO 3166-1 alpha-2)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country CHAR(2);

-- Sustancia principal
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS main_substance VARCHAR(50);

-- Otras sustancias (array JSON)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS other_substances JSONB;

-- Cantidad de consumo aproximada
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS consumption_amount VARCHAR(100);

-- Duración del consumo
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS consumption_duration VARCHAR(50);

-- Etapa de cambio (Modelo de Prochaska)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stage_of_change VARCHAR(50)
CHECK (stage_of_change IN (
    'precontemplacion', 
    'contemplacion', 
    'preparacion', 
    'accion', 
    'mantenimiento', 
    'recaida'
));

-- Diagnóstico de salud mental
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_mental_health_diagnosis BOOLEAN DEFAULT FALSE;

-- Detalles de salud mental (JSON)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS mental_health_details JSONB;

-- Historial de trauma
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_trauma_history BOOLEAN DEFAULT FALSE;

-- Apoyo terapéutico actual
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_therapeutic_support BOOLEAN DEFAULT FALSE;

-- Contacto del terapeuta (JSON)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS therapist_contact JSONB;

-- Preferencias y configuraciones (JSON)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- =====================================================
-- 2. Crear índices para perfiles
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_stage_of_change ON profiles(stage_of_change);
CREATE INDEX IF NOT EXISTS idx_profiles_main_substance ON profiles(main_substance);

-- =====================================================
-- 3. Agregar comentarios de documentación
-- =====================================================

COMMENT ON COLUMN profiles.age IS 'Edad del usuario';
COMMENT ON COLUMN profiles.gender IS 'Género del usuario';
COMMENT ON COLUMN profiles.country IS 'Código de país ISO 3166-1 alpha-2';
COMMENT ON COLUMN profiles.main_substance IS 'Sustancia principal de adicción';
COMMENT ON COLUMN profiles.other_substances JSONB IS 'Array de otras sustancias de consumo';
COMMENT ON COLUMN profiles.consumption_amount VARCHAR IS 'Descripción aproximada de cantidad de consumo';
COMMENT ON COLUMN profiles.consumption_duration IS 'Tiempo de consumo: <6 meses, 1-3 años, etc.';
COMMENT ON COLUMN profiles.stage_of_change IS 'Etapa del modelo de cambio: precontemplacion, contemplacion, preparacion, accion, mantenimiento, recaida';
COMMENT ON COLUMN profiles.has_mental_health_diagnosis IS 'Indica si tiene diagnóstico de salud mental';
COMMENT ON COLUMN profiles.mental_health_details JSONB IS 'Detalles de diagnósticos y tratamientos';
COMMENT ON COLUMN profiles.has_trauma_history IS 'Indica historial de trauma';
COMMENT ON COLUMN profiles.has_therapeutic_support IS 'Indica si tiene apoyo terapéutico actual';
COMMENT ON COLUMN profiles.therapist_contact JSONB IS 'Datos del terapeuta: {name, phone, email}';
COMMENT ON COLUMN profiles.settings JSONB IS 'Preferencias de usuario, notificaciones, configuración de UI';

-- =====================================================
-- FIN DEL SCRIPT 002
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Migración 002: Extensión de tabla profiles completada exitosamente';
END $$;
