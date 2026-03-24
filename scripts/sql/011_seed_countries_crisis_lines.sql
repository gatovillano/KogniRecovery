-- =====================================================
-- Script de Seed: Datos iniciales - Países y Líneas de Crisis
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 2026-02-20
-- =====================================================
--
-- PROPÓSITO:
-- Insertar países disponibles y líneas de crisis por país.
-- Datos críticos para funcionalidad de emergencia.
--
-- =====================================================

-- Tabla de países
CREATE TABLE IF NOT EXISTS countries (
    code CHAR(2) PRIMARY KEY,
    name_es VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    phone_code VARCHAR(5),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar países de LATAM y España (principales)
INSERT INTO countries (code, name_es, name_en, phone_code, is_active) VALUES
('AR', 'Argentina', 'Argentina', '+54', true),
('BO', 'Bolivia', 'Bolivia', '+591', true),
('BR', 'Brasil', 'Brazil', '+55', true),
('CL', 'Chile', 'Chile', '+56', true),
('CO', 'Colombia', 'Colombia', '+57', true),
('CR', 'Costa Rica', 'Costa Rica', '+506', true),
('CU', 'Cuba', 'Cuba', '+53', true),
('DO', 'República Dominicana', 'Dominican Republic', '+1', true),
('EC', 'Ecuador', 'Ecuador', '+593', true),
('ES', 'España', 'Spain', '+34', true),
('GT', 'Guatemala', 'Guatemala', '+502', true),
('HN', 'Honduras', 'Honduras', '+504', true),
('MX', 'México', 'Mexico', '+52', true),
('NI', 'Nicaragua', 'Nicaragua', '+505', true),
('PA', 'Panamá', 'Panama', '+507', true),
('PY', 'Paraguay', 'Paraguay', '+595', true),
('PE', 'Perú', 'Peru', '+51', true),
('PR', 'Puerto Rico', 'Puerto Rico', '+1', true),
('SV', 'El Salvador', 'El Salvador', '+503', true),
('UY', 'Uruguay', 'Uruguay', '+598', true),
('VE', 'Venezuela', 'Venezuela', '+58', true),
-- Países adicionales
('US', 'Estados Unidos', 'United States', '+1', true),
('CA', 'Canadá', 'Canada', '+1', true),
('PT', 'Portugal', 'Portugal', '+351', true)
ON CONFLICT (code) DO NOTHING;

-- Insertar líneas de crisis
INSERT INTO crisis_lines (country, name, phone, is_free, availability, language, notes) VALUES
-- Argentina
('AR', 'Línea de Vida', '141', true, '24/7', 'es', 'Atención nacional 24 horas'),
('AR', 'Centro de Atención SA', '0800-345-2942', true, 'Lun-Vie 8-20h', 'es', 'Servicio de Adicciones'),

-- Chile
('CL', 'Fundación Día', '141', true, '24/7', 'es', 'Línea de crisis en adicciones'),
('CL', 'Fono Niño', '147', true, '24/7', 'es', 'Para niños y adolescentes'),

-- Colombia
('CO', 'Línea de la Esperanza', '018000-112274', true, '24/7', 'es', 'Apoyo en crisis'),
('CO', 'Fundación Simón Bolívar', '018000-930930', true, '24/7', 'es', 'Línea de atención a víctimas'),

-- España
('ES', 'Teléfono de la Esperanza', '717-001717', true, '24/7', 'es', 'Apoyo emocional'),
('ES', 'FEDRA', '900 100 399', true, '24/7', 'es', 'Drogodependencias'),

-- México
('MX', 'Centros de Integración Juvenil', '01800-911-2000', true, '24/7', 'es', 'Atención en adicciones'),
('MX', 'Línea de la Vida', '01800-911-2000', true, '24/7', 'es', 'Prevención del suicidio'),

-- Estados Unidos (908 para español)
('US', '988 Suicide & Crisis Lifeline', '988', true, '24/7', 'en', 'Línea nacional de crisis (ingles)'),
('US', '988 Suicide & Crisis Lifeline (Español)', '1-888-628-9454', true, '24/7', 'es', 'Línea en español'),
('US', 'SAMHSA National Helpline', '1-800-662-4357', true, '24/7', 'es', 'Ayuda para adicciones'),

-- Brasil
('BR', 'CVV - Centro de Valorização da Vida', '188', true, '24/7', 'pt', 'Prevenção ao suicídio'),
('BR', 'CAPS - Centro de Atenção Psicossocial', '1320', true, '24h (variable)', 'pt', 'Atención en drogodependencias'),

-- Perú
('PE', 'Línea 113 Salud', '113', true, '24/7', 'es', 'Salud mental y adicciones'),
('PE', 'Cora', '106', true, '24/7', 'es', 'Prevención del suicidio'),

-- Uruguay
('UY', 'Línea de la Esperanza Uruguay', '0800-4242', true, '24/7', 'es', 'Apoyo emocional'),
('UY', 'Hospitalpsiquiátrico', '1934-4000', true, '24/7', 'es', 'Emergencias psiquiátricas'),

-- Puerto Rico
('PR', 'ASAP Puerto Rico', '1-800-981-5242', true, '24/7', 'es', 'Servicios de adicciones'),

-- Internacional de crisis
('INT', 'Crisis Text Line', 'Text HOME to 741741', true, '24/7', 'en', 'Por mensaje de texto'),
('INT', 'International Association for Suicide Prevention', 'https://www.iasp.info/resources/Crisis_Centres/', true, 'Directorio', 'es', 'Directorio mundial de líneas de crisis')
ON CONFLICT DO NOTHING;

DO $$ 
BEGIN
    RAISE NOTICE 'Seed: Países y líneas de crisis insertados exitosamente';
END $$;
