-- =====================================================
-- Script 011: Crear tabla de conversaciones del chatbot
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 21-02-2026
-- =====================================================

-- Tabla principal de conversaciones
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Información de la conversación
    title VARCHAR(200),
    scenario_type VARCHAR(50),
    -- Tipos de escenario:
    -- apoyo_emocional, crisis, motivacion, psicoeducacion
    -- prevencion_recaida, manejo_ansiedad, manejo_craving
    -- celebracion_logro, conversacion_general, evaluacion
    
    -- Estado
    status VARCHAR(20) DEFAULT 'active',
    -- active: en curso
    -- completed: completada
    -- abandoned: abandonada
    -- escalated: escalada a crisis
    
    -- Contexto
    context JSONB DEFAULT '{}'::jsonb,
    -- Almacena información contextual para la conversación
    -- mood_previous, trigger_active, time_of_day, last_checkin
    
    -- Métricas
    message_count INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    user_satisfaction INTEGER,
    -- survey después de completar
    
    -- Evaluación
    helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 10),
    relevance_rating INTEGER CHECK (relevance_rating >= 1 AND relevance_rating <= 10),
    
    -- Flags
    contains_crisk BOOLEAN DEFAULT false,
    escalated_to_emergency BOOLEAN DEFAULT false,
    required_human_intervention BOOLEAN DEFAULT false,
    
    -- Escenario completado
    scenario_completed BOOLEAN DEFAULT false,
    
    -- Metadatos
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_scenario_type ON conversations(scenario_type);
CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON conversations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Tabla de sesiones de conversación (para mantener contexto)
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Sesión
    session_number INTEGER NOT NULL,
    session_type VARCHAR(30) DEFAULT 'chat',
    -- chat, voice, crisis_intervention
    
    -- Contexto de la sesión
    context_summary TEXT,
    user_mood_before VARCHAR(30),
    user_mood_after VARCHAR(30),
    
    -- Estado emocional durante la sesión
    emotional_state JSONB DEFAULT '{}'::jsonb,
    
    -- Temas discutidos
    topics_discussed TEXT[] DEFAULT '{}',
    
    -- Estrategias compartidas
    strategies_shared TEXT[] DEFAULT '{}',
    
    -- Recursos recomendados
    resources_recommended JSONB DEFAULT '[]'::jsonb,
    
    -- Métricas
    duration_seconds INTEGER,
    messages_in_session INTEGER DEFAULT 0,
    
    -- Resultados
    session_outcome VARCHAR(30),
    -- productive, neutral, escalated, abandoned
    
    -- Metadatos
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_conversation_id ON conversation_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON conversation_sessions(user_id);

-- Tabla de contexto conversacional (para RAG)
CREATE TABLE IF NOT EXISTS conversation_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contexto extraído
    context_type VARCHAR(50) NOT NULL,
    -- user_history, preferences, emotional_state
    -- triggers, goals, achievements, relationships
    
    -- Contenido
    content JSONB NOT NULL,
    
    -- Importancia
    importance_score INTEGER DEFAULT 5 CHECK (importance_score >= 1 AND importance_score <= 10),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_conversation_context_conversation_id ON conversation_context(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_context_user_id ON conversation_context(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_context_expires_at ON conversation_context(expires_at);

-- Tabla de configuración de escenario
CREATE TABLE IF NOT EXISTS scenario_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Escenario
    scenario_type VARCHAR(50) NOT NULL UNIQUE,
    scenario_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Configuración del prompt
    system_prompt TEXT NOT NULL,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 500,
    
    -- Habilidades habilitadas
    enabled_skills TEXT[] DEFAULT '{}',
    
    -- Configuración de respuesta
    response_style VARCHAR(30) DEFAULT 'apoyo',
    -- apoyo, educativo, directo, motivator
    
    -- Triggers
    trigger_conditions JSONB DEFAULT '{}'::jsonb,
    -- condiciones para activar este escenario
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0',
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_scenario_configs_type ON scenario_configs(scenario_type);
CREATE INDEX IF NOT EXISTS idx_scenario_configs_active ON scenario_configs(is_active);

-- Tabla de feedback de conversación
CREATE TABLE IF NOT EXISTS conversation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Feedback
    feedback_type VARCHAR(30) NOT NULL,
    -- helpful, not_helpful, inappropriate, scary, inaccurate
    
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Detalles
    message_id UUID,
    specific_feedback TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversation_feedback_conversation_id ON conversation_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_user_id ON conversation_feedback(user_id);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_conversations_timestamp
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

CREATE TRIGGER update_conversation_sessions_timestamp
    BEFORE UPDATE ON conversation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Insertar escenarios por defecto
INSERT INTO scenario_configs (scenario_type, scenario_name, description, system_prompt, temperature, enabled_skills, response_style) VALUES
(
    'apoyo_emocional',
    'Apoyo Emocional',
    'Conversación de apoyo emocional general',
    'Eres NADA, un asistente de apoyo emocional especializado en adicciones. Tu rol es escuchar sin juzgar, validar emociones y ofrecer apoyo empático. Usa técnicas de escucha activa y refleja los sentimientos del usuario.',
    0.7,
    ARRAY['escucha_activa', 'validacion_emocional', 'empatia'],
    'apoyo'
),
(
    'crisis',
    'Intervención en Crisis',
    'Manejo de situaciones de crisis',
    'Eres NADA en modo de crisis. El usuario está en una situación difícil. Prioriza la seguridad. Usa protocolo de intervención en crisis: evalúa riesgo, proporciona recursos de emergencia, no dejar solo al usuario.',
    0.5,
    ARRAY['evaluacion_riesgo', 'intervencion_crisis', 'recursos_emergencia'],
    'directo'
),
(
    'motivacion',
    'Motivación',
    'Conversación motivacional',
    'Eres NADA, un asistente de motivación en recuperación. Ayuda al usuario a encontrar motivación intrínseca, celebra logros, y ayuda a establecer metas pequeñas y alcanzables.',
    0.8,
    ARRAY['motivacion', 'celebracion_logros', 'establecer_metas'],
    'motivador'
),
(
    'psicoeducacion',
    'Psicoeducación',
    'Información educativa sobre adicciones',
    'Eres NADA, un asistente educativo sobre adicciones. Proporciona información precisa, científica y comprensible sobre adicciones, recuperación, y manejo de cravings.',
    0.6,
    ARRAY['psicoeducacion', 'informacion_cientifica', 'explicaciones'],
    'educativo'
),
(
    'prevencion_recaida',
    'Prevención de Recaída',
    'Estrategias para prevenir recaídas',
    'Eres NADA, especializado en prevención de recaídas. Ayuda al usuario a identificar factores de riesgo, desarrollar estrategias de afrontamiento, y crear planes de acción para momentos difíciles.',
    0.7,
    ARRAY['identificacion_riesgos', 'estrategias_afrontamiento', 'plan_accion'],
    'apoyo'
);

-- Comentarios
COMMENT ON TABLE conversations IS 'Almacena las conversaciones del usuario con el chatbot NADA';
COMMENT ON TABLE conversation_sessions IS 'Sesiones dentro de cada conversación';
COMMENT ON TABLE conversation_context IS 'Contexto extraído para RAG';
COMMENT ON TABLE scenario_configs IS 'Configuración de los diferentes escenarios conversacionales';
COMMENT ON TABLE conversation_feedback IS 'Feedback del usuario sobre la conversación';

-- Verificar creación
SELECT 'Tabla conversations creada exitosamente' AS status;
SELECT 'Tabla conversation_sessions creada exitosamente' AS status;
SELECT 'Tabla conversation_context creada exitosamente' AS status;
SELECT 'Tabla scenario_configs creada exitosamente' AS status;
SELECT 'Tabla conversation_feedback creada exitosamente' AS status;

-- Mostrar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%conversation%' OR table_name LIKE '%scenario%';
