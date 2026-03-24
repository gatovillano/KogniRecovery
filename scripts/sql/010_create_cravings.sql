-- =====================================================
-- Script 010: Crear tabla de cravings (antojos)
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 21-02-2026
-- =====================================================

-- Tabla principal de cravings
CREATE TABLE IF NOT EXISTS cravings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Sustancia relacionada
    substance_id UUID REFERENCES substances(id),
    substance_name VARCHAR(100) NOT NULL,
    
    -- Intensidad del craving (1-10)
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
    
    -- Estado
    status VARCHAR(30) DEFAULT 'active',
    -- active: craving activo
    -- managed: craving manejado con estrategia
    -- resisted: craving resistido exitosamente
    -- surrendered: ocurrió consumo
    
    -- Desencadenantes (triggers)
    triggers JSONB DEFAULT '[]'::jsonb,
    -- Estructura: [{"type": "emocional", "description": "estrés laboral"}, {"type": "social", "description": "fiesta con amigos"}]
    
    -- Tipos de desencadenantes:
    -- emocional: estrés, ansiedad, aburrimiento, soledad, depresión, emoción
    -- social: fiesta, presión de amigos, celebración
    -- ambiental: lugar específico, hora del día, ver la sustancia
    -- físico: dolor, fatiga, síndrome de abstinencia
    -- cognitivo: pensamiento glorify, racionalización
    
    -- Estrategias usadas
    coping_strategies JSONB DEFAULT '[]'::jsonb,
    -- Estructura: [{"strategy": "respiración", "effective": true}, {"strategy": "llamar a mentor", "effective": true}]
    
    -- Resultado
    outcome VARCHAR(30),
    -- none: no hubo consumo
    -- partial: consumo menor a lo planeado
    -- full: consumo completo
    
    -- Cantidad consumida (si hubo)
    consumed_quantity DECIMAL(10,2),
    consumed_unit VARCHAR(20),
    
    -- Consecuencias reportadas
    consequences TEXT,
    
    -- Ubicación
    location JSONB,
    
    -- Momento
    craving_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    craving_end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    
    -- Notas
    notes TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cravings_user_id ON cravings(user_id);
CREATE INDEX IF NOT EXISTS idx_cravings_substance_id ON cravings(substance_id);
CREATE INDEX IF NOT EXISTS idx_cravings_status ON cravings(status);
CREATE INDEX IF NOT EXISTS idx_cravings_intensity ON cravings(intensity);
CREATE INDEX IF NOT EXISTS idx_cravings_created_at ON cravings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cravings_craving_date ON cravings(craving_start_time DESC);

-- Tabla de patrones de cravings (análisis)
CREATE TABLE IF NOT EXISTS craving_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    substance_id UUID REFERENCES substances(id),
    
    -- Patrón identificado
    pattern_type VARCHAR(50) NOT NULL,
    -- temporal: tiempo específico del día/semana
    -- emocional: asociado a emociones específicas
    -- situacional: asociado a situaciones específicas
    -- social: asociado a contextos sociales
    -- ambiental: asociado a lugares
    
    -- Descripción del patrón
    description TEXT NOT NULL,
    
    -- Frecuencia
    frequency_per_week INTEGER,
    avg_intensity DECIMAL(4,2),
    
    -- Desencadenantes comunes
    common_triggers TEXT[] DEFAULT '{}',
    
    -- Estrategias efectivas
    effective_strategies TEXT[] DEFAULT '{}',
    
    -- Estado
    status VARCHAR(20) DEFAULT 'identified',
    -- identified, monitoring, managed
    
    -- Metadatos
    first_observed DATE,
    last_observed DATE,
    occurrence_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_craving_patterns_user_id ON craving_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_craving_patterns_pattern_type ON craving_patterns(pattern_type);

-- Tabla de estrategias de manejo
CREATE TABLE IF NOT EXISTS coping_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Estrategia
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    -- categor ┌as: cognitiva, conductual, emocional, social, física, espiritual
    
    description TEXT,
    
    -- Efectividad
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
    times_used INTEGER DEFAULT 0,
    times_successful INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    
    -- Instrucciones
    instructions TEXT,
    when_to_use TEXT,
    
    -- Recursos asociados
    resources JSONB DEFAULT '[]'::jsonb,
    -- links a recursos, audios, ejercicios
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    is_favorite BOOLEAN DEFAULT false,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coping_strategies_user_id ON coping_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_coping_strategies_category ON coping_strategies(category);
CREATE INDEX IF NOT EXISTS idx_coping_strategies_is_favorite ON coping_strategies(is_favorite);

-- Tabla de registro de uso de estrategias
CREATE TABLE IF NOT EXISTS strategy_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    craving_id UUID REFERENCES cravings(id) ON DELETE SET NULL,
    strategy_id UUID REFERENCES coping_strategies(id) ON DELETE SET NULL,
    
    -- Uso
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    was_effective BOOLEAN,
    
    -- Detalles
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_strategy_usage_user_id ON strategy_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_usage_craving_id ON strategy_usage(craving_id);
CREATE INDEX IF NOT EXISTS idx_strategy_usage_strategy_id ON strategy_usage(strategy_id);

-- Tabla de antecedentes de cravings
CREATE TABLE IF NOT EXISTS craving_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Trigger
    trigger_type VARCHAR(50) NOT NULL,
    trigger_description VARCHAR(255) NOT NULL,
    
    -- Frecuencia
    frequency VARCHAR(30),
    -- nunca, raramente, ocasionalmente, frecuentemente, muy_frecuente
    
    -- Intensidad promedio cuando se presenta
    avg_intensity_when_triggered DECIMAL(4,2),
    
    -- Probabilidad de consumo cuando se presenta
    consumption_probability DECIMAL(5,2),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'active',
    
    -- Contexto
    context_notes TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_trigger UNIQUE (user_id, trigger_description)
);

CREATE INDEX IF NOT EXISTS idx_craving_triggers_user_id ON craving_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_craving_triggers_trigger_type ON craving_triggers(trigger_type);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_craving_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_cravings_timestamp
    BEFORE UPDATE ON cravings
    FOR EACH ROW
    EXECUTE FUNCTION update_craving_timestamp();

CREATE TRIGGER update_craving_patterns_timestamp
    BEFORE UPDATE ON craving_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_craving_timestamp();

CREATE TRIGGER update_coping_strategies_timestamp
    BEFORE UPDATE ON coping_strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_craving_timestamp();

CREATE TRIGGER update_craving_triggers_timestamp
    BEFORE UPDATE ON craving_triggers
    FOR EACH ROW
    EXECUTE FUNCTION update_craving_timestamp();

-- Comentarios
COMMENT ON TABLE cravings IS 'Registro de antojos/cravings del usuario';
COMMENT ON TABLE craving_patterns IS 'Patrones identificados en los cravings del usuario';
COMMENT ON TABLE coping_strategies IS 'Estrategias de afrontamiento personalizadas';
COMMENT ON TABLE strategy_usage IS 'Registro de uso de estrategias durante cravings';
COMMENT ON TABLE craving_triggers IS 'Catálogo de desencadenantes personalizad

-- Verificar creación
SELECT 'Tabla cravings creada exitosamente' AS status;
SELECT 'Tabla craving_patterns creada exitosamente' AS status;
SELECT 'Tabla coping_strategies creada exitosamente' AS status;
SELECT 'Tabla strategy_usage creada exitosamente' AS status;
SELECT 'Tabla craving_triggers creada exitosamente' AS status;

-- Mostrar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%craving%' OR table_name LIKE '%coping%' OR table_name LIKE '%trigger%';
