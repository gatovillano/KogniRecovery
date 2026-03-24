-- =====================================================
-- Script 012: Crear tabla de mensajes del chatbot
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 21-02-2026
-- =====================================================

-- Tabla principal de mensajes
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Rol
    role VARCHAR(20) NOT NULL,
    -- user: mensaje del usuario
    -- assistant: mensaje de NADA
    -- system: mensaje del sistema
    
    -- Contenido
    content TEXT NOT NULL,
    
    -- Metadatos del mensaje
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Estructura:
    -- {
    --   "intent": "peticion_apoyo",
    --   "emotion_detected": "ansiedad",
    --   "confidence": 0.85,
    --   "language": "es"
    -- }
    
    -- Tokens usados
    tokens_used INTEGER,
    
    -- Escenario activo
    active_scenario VARCHAR(50),
    
    -- Validación de contenido
    content_filter_passed BOOLEAN DEFAULT true,
    inappropriate_content_flags TEXT[],
    
    -- Respuesta con recursos
    resources_included JSONB DEFAULT '[]'::jsonb,
    -- Estructura: [{"type": "article", "title": "...", "url": "..."}]
    
    -- Acciones recomendadas
    recommended_actions JSONB DEFAULT '[]'::jsonb,
    -- Estructura: [{"action": "deep_breathing", "description": "..."}]
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);

-- Tabla deadjunto de mensajes
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    
    -- Tipo de adjunto
    attachment_type VARCHAR(30) NOT NULL,
    -- resource_link, exercise, audio, image, video
    
    -- Contenido
    title VARCHAR(200),
    description TEXT,
    url TEXT,
    content JSONB,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);

-- Tabla de detección de intención
CREATE TABLE IF NOT EXISTS message_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Intención detectada
    intent VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,4) DEFAULT 1.0,
    
    -- Entidades extraídas
    entities JSONB DEFAULT '{}'::jsonb,
    -- Estructura: {"sustancia": "alcohol", "intensidad": "alta"}
    
    -- Estado emocional
    emotion_detected VARCHAR(30),
    emotion_confidence DECIMAL(5,4),
    
    -- Escenario apropiado
    suggested_scenario VARCHAR(50),
    
    -- Flags
    is_crisis_indicator BOOLEAN DEFAULT false,
    is_relapse_risk BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_intents_message_id ON message_intents(message_id);
CREATE INDEX IF NOT EXISTS idx_message_intents_user_id ON message_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_message_intents_intent ON message_intents(intent);

-- Tabla de historial de contexto (para memoria a largo plazo)
CREATE TABLE IF NOT EXISTS context_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tipo de contexto
    context_type VARCHAR(50) NOT NULL,
    -- preference, history, goal, achievement, relationship, trigger, aversion
    
    -- Contenido
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    
    -- Metadatos
    source_message_id UUID REFERENCES messages(id),
    importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
    times_referenced INTEGER DEFAULT 0,
    
    -- Fechas
    first_mentioned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_referenced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_context UNIQUE (user_id, context_type, key)
);

CREATE INDEX IF NOT EXISTS idx_context_history_user_id ON context_history(user_id);
CREATE INDEX IF NOT EXISTS idx_context_history_type ON context_history(context_type);
CREATE INDEX IF NOT EXISTS idx_context_history_expires ON context_history(expires_at);

-- Tabla de quick responses (respuestas rápidas)
CREATE TABLE IF NOT EXISTS quick_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Quick response
    trigger_phrase VARCHAR(100) NOT NULL,
    response_text TEXT NOT NULL,
    
    -- Categoría
    category VARCHAR(30) NOT NULL,
    -- greeting, crisis, encouragement, exercise, resource
    
    -- Escenario aplicable
    applicable_scenarios TEXT[] DEFAULT '{}',
    
    -- Orden de prioridad
    priority INTEGER DEFAULT 0,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    
    -- Idioma
    language VARCHAR(10) DEFAULT 'es',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quick_responses_trigger ON quick_responses(trigger_phrase);
CREATE INDEX IF NOT EXISTS idx_quick_responses_category ON quick_responses(category);

-- Insertar quick responses por defecto
INSERT INTO quick_responses (trigger_phrase, response_text, category, priority, language) VALUES
('hola', '¡Hola! 👋 Soy NADA, tu asistente de apoyo. ¿Cómo te sientes hoy?', 'greeting', 10, 'es'),
('necesito ayuda', 'Estoy aquí para ayudarte. Cuéntame qué está pasando y juntosaremos una solución.', 'crisis', 20, 'es'),
('estoy mal', 'Lamento que te sientas así. Estoy aquí para escucharte. ¿Qué te está pasando?', 'crisis', 20, 'es'),
('gracias', 'De nada 💚 Recuerda que estoy aquí para apoyarte en tu proceso.', 'encouragement', 5, 'es'),
('quiero consumir', 'Entiendo que en este momento sientas ese deseo. Antes de actuar, ¿podemos hablar sobre qué estás sintiendo? Prueba esta técnica de respiración:inhala por 4 segundos, mantén por 4, exhala por 6.', 'crisis', 25, 'es'),
('no puedo más', 'Tu lucha es válida. Esto pasará. ¿Hay alguien con quien puedas hablar ahora mismo? Si sientes que estás en peligro, por favor llama a tu línea de crisis local.', 'crisis', 25, 'es'),
('celebro', '¡Eso es maravilloso! 🎉 Cuéntame más sobre qué lograste.', 'encouragement', 15, 'es'),
('ejercicio', 'Te comparto un ejercicio de respiración: Técnica 4-7-8 - Inhala por 4 segundos, mantén por 7, exhala por 8. Repite 3 veces.', 'exercise', 10, 'es'),
('ayuda', 'Estoy aquí. ¿Qué necesitas en este momento?', 'crisis', 15, 'es');

-- Tabla de logs de LLM
CREATE TABLE IF NOT EXISTS llm_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    
    -- Request
    model VARCHAR(50),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    
    -- Response
    response_text TEXT,
    finish_reason VARCHAR(20),
    
    -- Timing
    latency_ms INTEGER,
    
    -- Cost
    cost_usd DECIMAL(10,6),
    
    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_llm_logs_user_id ON llm_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_logs_conversation_id ON llm_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_llm_logs_created_at ON llm_logs(created_at DESC);

-- Tabla de conocimientos (Knowledge Base para RAG)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contenido
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    
    -- Metadata
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    tags TEXT[] DEFAULT '{}',
    
    -- Fuente
    source VARCHAR(100),
    source_url TEXT,
    
    -- Adaptabilidad
    audience VARCHAR(30) DEFAULT 'general',
    -- general, familiares, profesionales
    
    -- Contenido sensible
    contains_crisis_info BOOLEAN DEFAULT false,
    
    -- Estado
    is_published BOOLEAN DEFAULT false,
    version VARCHAR(20) DEFAULT '1.0',
    
    -- embedding para búsqueda vectorial
    embedding vector(1536),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN(tags);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_context_history_timestamp
    BEFORE UPDATE ON context_history
    FOR EACH ROW
    EXECUTE FUNCTION update_message_timestamp();

CREATE TRIGGER update_quick_responses_timestamp
    BEFORE UPDATE ON quick_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_message_timestamp();

CREATE TRIGGER update_knowledge_base_timestamp
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_message_timestamp();

-- Comentarios
COMMENT ON TABLE messages IS 'Mensajes individuales en las conversaciones con NADA';
COMMENT ON TABLE message_attachments IS 'Adjuntos (recursos, ejercicios) en los mensajes';
COMMENT ON TABLE message_intents IS 'Intenciones detectadas en los mensajes del usuario';
COMMENT ON TABLE context_history IS 'Historial de contexto para memoria a largo plazo';
COMMENT ON TABLE quick_responses IS 'Respuestas rápidas predefinidas';
COMMENT ON TABLE llm_logs IS 'Logs de llamadas al LLM para debugging y billing';
COMMENT ON TABLE knowledge_base IS 'Base de conocimientos para RAG';

-- Verificar creación
SELECT 'Tabla messages creada exitosamente' AS status;
SELECT 'Tabla message_attachments creada exitosamente' AS status;
SELECT 'Tabla message_intents creada exitosamente' AS status;
SELECT 'Tabla context_history creada exitosamente' AS status;
SELECT 'Tabla quick_responses creada exitosamente' AS status;
SELECT 'Tabla llm_logs creada exitosamente' AS status;
SELECT 'Tabla knowledge_base creada exitosamente' AS status;

-- Mostrar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%message%' OR table_name LIKE '%quick%' OR table_name LIKE '%llm%' OR table_name LIKE '%knowledge%' OR table_name LIKE '%context%';
