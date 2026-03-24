-- =====================================================
-- Script 009: Crear tabla de check-ins diarios
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 21-02-2026
-- =====================================================

-- Tabla principal de check-ins
CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tipo de check-in
    checkin_type VARCHAR(30) NOT NULL DEFAULT 'diario',
    -- Tipos: diario, semanal, mensual, personalizado
    
    -- Estado emocional (1-10)
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    anxiety_score INTEGER CHECK (anxiety_score >= 1 AND anxiety_score <= 10),
    energy_score INTEGER CHECK (energy_score >= 1 AND energy_score <= 10),
    
    -- Tags emocionales (multivalor)
    emotional_tags TEXT[] DEFAULT '{}',
    -- Posibles valores: optimista, triste, ansioso, tranquilo, 
    -- irritable, esperanzado, frustrado, motivado, agotado, enamorado
    
    -- Estado de consumo
    consumed_substances JSONB DEFAULT '[]'::jsonb,
    -- Estructura: [{"substance_id": "uuid", "substance": "Alcohol", "quantity": "2", "unit": "copas", "timestamp": "ISO8601"}]
    
    -- Situación de riesgo
    risk_situation BOOLEAN DEFAULT false,
    risk_description TEXT,
    coping_strategy_used VARCHAR(50),
    
    -- Sueño
    sleep_hours DECIMAL(3,1),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    
    -- Ejercicio
    exercised_today BOOLEAN DEFAULT false,
    exercise_minutes INTEGER,
    exercise_type VARCHAR(50),
    
    -- Actividades de recuperación
    activities JSONB DEFAULT '[]'::jsonb,
    -- Estructura: [{"activity": "meditacion", "duration": 30, "notes": "..."}]
    
    -- Actividades sociales
    social_interaction VARCHAR(30) DEFAULT 'ninguna',
    -- ninguna, familia, amigos, grupo_apoyo, profesional
    
    -- Notas adicionales
    notes TEXT,
    
    -- Ubicación (opcional, para contexto)
    location JSONB,
    -- Estructura: {"latitude": number, "longitude": number, "address": "string"}
    
    -- Metadatos
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    checkin_time TIME NOT NULL DEFAULT CURRENT_TIME,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_completed BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT unique_user_checkin_date UNIQUE (user_id, checkin_date)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_checkin_date ON checkins(checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_checkin_type ON checkins(checkin_type);
CREATE INDEX IF NOT EXISTS idx_checkins_created_at ON checkins(completed_at DESC);

-- Tabla de historial de mood (para tracking a largo plazo)
CREATE TABLE IF NOT EXISTS mood_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Datos de mood
    mood_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    anxiety_score INTEGER CHECK (anxiety_score >= 1 AND anxiety_score <= 10),
    energy_score INTEGER CHECK (energy_score >= 1 AND energy_score <= 10),
    
    -- Tags del día
    emotional_tags TEXT[] DEFAULT '{}',
    
    -- Promedio semanal (calculado)
    weekly_average_mood DECIMAL(4,2),
    weekly_average_anxiety DECIMAL(4,2),
    weekly_average_energy DECIMAL(4,2),
    
    -- Tendencia (calculada)
    mood_trend VARCHAR(20),
    -- mejora, estable, empeora
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_mood_date UNIQUE (user_id, mood_date)
);

CREATE INDEX IF NOT EXISTS idx_mood_history_user_id ON mood_history(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_history_mood_date ON mood_history(mood_date DESC);

-- Tabla de objetivos de check-in
CREATE TABLE IF NOT EXISTS checkin_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_id UUID NOT NULL REFERENCES users(id)_uuid(),
    user ON DELETE CASCADE,
    
    -- Objetivo
    goal_type VARCHAR(50) NOT NULL,
    -- sleep_hours, exercise_minutes, mood_target, no_consumo, actividades_saludables
    
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    
    -- Frecuencia
    frequency VARCHAR(20) DEFAULT 'diaria',
    -- diaria, semanal, mensual
    
    -- Estado
    status VARCHAR(20) DEFAULT 'active',
    -- active, paused, completed, failed
    
    -- Fechas
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    completed_date DATE,
    
    -- Notas
    notes TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checkin_goals_user_id ON checkin_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_goals_status ON checkin_goals(status);

-- Tabla de streaks (rachas)
CREATE TABLE IF NOT EXISTS checkin_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tipo de streak
    streak_type VARCHAR(30) NOT NULL,
    -- checkin_completed, no_consumo, ejercicio, metas_completadas
    
    -- Contadores
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    
    -- Fechas
    last_completion_date DATE,
    streak_start_date DATE,
    longest_streak_start_date DATE,
    longest_streak_end_date DATE,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_streak_type UNIQUE (user_id, streak_type)
);

CREATE INDEX IF NOT EXISTS idx_checkin_streaks_user_id ON checkin_streaks(user_id);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_checkin_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_mood_history_timestamp
    BEFORE UPDATE ON mood_history
    FOR EACH ROW
    EXECUTE FUNCTION update_checkin_timestamp();

CREATE TRIGGER update_checkin_goals_timestamp
    BEFORE UPDATE ON checkin_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_checkin_timestamp();

CREATE TRIGGER update_checkin_streaks_timestamp
    BEFORE UPDATE ON checkin_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_checkin_timestamp();

-- Comentarios
COMMENT ON TABLE checkins IS 'Registro de check-ins diarios del usuario';
COMMENT ON TABLE mood_history IS 'Historial de estado emocional para análisis de tendencias';
COMMENT ON TABLE checkin_goals IS 'Objetivos personalizados de check-in';
COMMENT ON TABLE checkin_streaks IS 'Tracking de rachas y motivación';

-- Verificar creación
SELECT 'Tabla checkins creada exitosamente' AS status;
SELECT 'Tabla mood_history creada exitosamente' AS status;
SELECT 'Tabla checkin_goals creada exitosamente' AS status;
SELECT 'Tabla checkin_streaks creada exitosamente' AS status;

-- Mostrar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%checkin%' OR table_name LIKE '%mood%';
