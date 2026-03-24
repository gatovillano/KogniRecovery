-- =====================================================
-- Script de Seed: Datos iniciales - Sustancias
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 2026-02-20
-- =====================================================
--
-- PROPÓSITO:
-- Insertar sustancias comunes de consumo para selección en perfiles.
-- Estos datos son de referencia para el sistema.
--
-- =====================================================

-- Tabla de sustancias
CREATE TABLE IF NOT EXISTS substances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar sustancias por categoría
INSERT INTO substances (name, name_en, category, description) VALUES
-- Alcohol
('Alcohol', 'Alcohol', 'alcohol', 'Bebidas que contienen etanol: cerveza, vino, licores, destilados'),
('Cerveza', 'Beer', 'alcohol', 'Bebida fermentada de cereal'),
('Vino', 'Wine', 'alcohol', 'Bebida fermentada de uva'),
('Licores', 'Liquor', 'alcohol', 'Bebidas destiladas de alta graduación'),

-- Tabaco
('Tabaco/Cigarrillos', 'Tobacco/Cigarettes', 'tobacco', 'Productos de nicotina fumados'),
('Vapeo', 'Vaping', 'tobacco', 'Cigarrillos electrónicos'),
('Nicotine', 'Nicotine', 'tobacco', 'Productos de nicotina sin humo'),

-- Cannabis
('Cannabis/Marihuana', 'Cannabis/Marijuana', 'cannabis', 'Planta y derivados del cannabis'),
('Hashish', 'Hashish', 'cannabis', 'Resina de cannabis'),
('Concentrados', 'Concentrates', 'cannabis', 'Extracciones de alta potencia'),

-- Estimulantes
('Cocaína', 'Cocaine', 'stimulant', 'Estimulante potente de origen vegetal'),
('Crack', 'Crack', 'stimulant', 'Forma base de cocaína'),
('Anfetaminas', 'Amphetamines', 'stimulant', 'Estimulantes sintéticos'),
('Metanfetamina', 'Methamphetamine', 'stimulant', 'Estimulante altamente adictivo'),
('Éxtasis/MDMA', 'Ecstasy/MDMA', 'stimulant', 'Estimulante empatógeno'),
('Anfetaminas prescritas', 'Prescription Amphetamines', 'stimulant', 'Medicamentos como Ritalin, Adderall'),

-- Opioides
('Heroína', 'Heroin', 'opioid', 'Opioide muy adictivo de origen vegetal'),
('Fentanilo', 'Fentanyl', 'opioid', 'Opioide sintético de alta potencia'),
('Morfina', 'Morphine', 'opioid', 'Analgesico opioide'),
('Oxicodona', 'Oxycodone', 'opioid', 'Opioide prescrito'),
('Codeína', 'Codeine', 'opioid', 'Opioide suave prescrito'),
('Tramadol', 'Tramadol', 'opioid', 'Opioide sintético'),

-- Sedantes
('Benzodiazepinas', 'Benzodiazepines', 'sedative', 'Tranquilizantes como Valium, Xanax'),
('Barbitúricos', 'Barbiturates', 'sedative', 'Sedantes antiguos'),
('GHB', 'GHB', 'sedative', 'Depresor del sistema nervioso'),

-- Drogas emergentes
('Ketamina', 'Ketamine', 'dissociative', 'Anestésico disociativo'),
('LSD', 'LSD', 'hallucinogen', 'Alucinógeno potente'),
('Hongos alucinógenos', 'Psychedelic Mushrooms', 'hallucinogen', 'Psilocibina'),
('DMT', 'DMT', 'hallucinogen', 'Alucinógeno de corta duración'),
('PCP', 'PCP', 'dissociative', 'Fenciclidina'),

-- Otras
('Inhalantes', 'Inhalants', 'other', 'Sustancias volatiles para inhalar'),
('Esteroides', 'Steroids', 'other', 'Hormonas sintéticas')
ON CONFLICT DO NOTHING;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_substances_category ON substances(category);
CREATE INDEX IF NOT EXISTS idx_substances_active ON substances(is_active);

DO $$ 
BEGIN
    RAISE NOTICE 'Seed: Sustancias insertadas exitosamente';
END $$;
