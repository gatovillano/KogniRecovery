-- =====================================================
-- Migración 006: Crear tabla resources
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 2026-02-20
-- =====================================================
--
-- PROPÓSITO:
-- Crear tabla de recursos psicoeducativos incluyendo artículos,
-- videos, ejercicios y líneas de crisis por país.
--
-- NOTA:
-- Los recursos educativos son públicos y no contienen datos
-- personales de usuarios. Esta tabla es de solo lectura para
-- los usuarios (escritura solo para admins).
--
-- =====================================================

-- =====================================================
-- 1. Crear tipo enum para contenido
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE content_type AS ENUM (
            'article', 
            'video', 
            'audio', 
            'exercise',
            'infographic',
            'podcast'
        );
    END IF;
END $$;

-- =====================================================
-- 2. Crear tabla resources
-- =====================================================

CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    language VARCHAR(10) DEFAULT 'es',
    
    -- Targeting
    target_profiles JSONB DEFAULT '[]',
    target_age_min INTEGER,
    target_age_max INTEGER,
    target_substances JSONB DEFAULT '[]',
    
    -- Tags para búsqueda
    tags JSONB DEFAULT '[]',
    
    -- Contenido
    content TEXT,
    media_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    duration_minutes INTEGER,
    
    -- Metadatos
    author VARCHAR(255),
    source VARCHAR(255),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    --排序
    sort_order INTEGER DEFAULT 0,
    
    -- Estadísticas (para analytics)
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. Crear índices para resources
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_resources_type 
    ON resources(content_type);

CREATE INDEX IF NOT EXISTS idx_resources_language 
    ON resources(language);

CREATE INDEX IF NOT EXISTS idx_resources_is_active 
    ON resources(is_active);

CREATE INDEX IF NOT EXISTS idx_resources_is_featured 
    ON resources(is_featured) 
    WHERE is_featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_resources_tags 
    ON resources USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_resources_target_profiles 
    ON resources USING GIN(target_profiles);

CREATE INDEX IF NOT EXISTS idx_resources_target_substances 
    ON resources USING GIN(target_substances);

CREATE INDEX IF NOT EXISTS idx_resources_sort_order 
    ON resources(sort_order);

-- Búsqueda full-text
CREATE INDEX IF NOT EXISTS idx_resources_search 
    ON resources 
    USING GIN(to_tsvector('spanish', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(array_to_string(tags, ' '), '')));

-- =====================================================
-- 4. Crear tabla de líneas de crisis por país
-- =====================================================

CREATE TABLE IF NOT EXISTS crisis_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country CHAR(2) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_free BOOLEAN DEFAULT TRUE,
    availability VARCHAR(100),
    language VARCHAR(10) DEFAULT 'es',
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para crisis_lines
CREATE INDEX IF NOT EXISTS idx_crisis_lines_country 
    ON crisis_lines(country);

CREATE INDEX IF NOT EXISTS idx_crisis_lines_active 
    ON crisis_lines(is_active);

-- Trigger para updated_at
CREATE TRIGGER update_crisis_lines_updated_at 
    BEFORE UPDATE ON crisis_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Crear trigger para updated_at en resources
-- =====================================================

CREATE TRIGGER update_resources_updated_at 
    BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. Agregar comentarios de documentación
-- =====================================================

COMMENT ON TABLE resources IS 'Recursos psicoeducativos: artículos, videos, ejercicios';
COMMENT ON COLUMN resources.title IS 'Título del recurso';
COMMENT ON COLUMN resources.description IS 'Descripción breve del contenido';
COMMENT ON COLUMN resources.content_type IS 'Tipo: article, video, audio, exercise, infographic, podcast';
COMMENT ON COLUMN resources.language IS 'Código de idioma (es, en, pt)';
COMMENT ON COLUMN resources.target_profiles JSONB IS 'Perfiles objetivo: ["lucas_adolescente", "maria_adulta"]';
COMMENT ON COLUMN resources.target_substances JSONB IS 'Sustancias objetivo: ["alcohol", "cannabis"]';
COMMENT ON COLUMN resources.tags JSONB IS 'Tags de búsqueda: ["ansiedad", "prevención", "relaps"]';
COMMENT ON COLUMN resources.content IS 'Contenido en Markdown o texto plano';
COMMENT ON COLUMN resources.media_url IS 'URL del video/audio (YouTube, Vimeo, etc.)';
COMMENT ON COLUMN resources.thumbnail_url IS 'URL de miniatura';
COMMENT ON COLUMN resources.duration_minutes IS 'Duración aproximada en minutos';
COMMENT ON COLUMN resources.author IS 'Autor del contenido';
COMMENT ON COLUMN resources.source IS 'Fuente/origen del contenido';
COMMENT ON COLUMN resources.is_featured IS 'Mostrar en sección destacados';
COMMENT ON COLUMN resources.is_active IS 'Recurso activo (visible para usuarios)';
COMMENT ON COLUMN resources.sort_order IS 'Orden de visualización';

COMMENT ON TABLE crisis_lines IS 'Líneas de crisis y emergencia por país';
COMMENT ON COLUMN crisis_lines.country IS 'Código de país ISO 3166-1 alpha-2';
COMMENT ON COLUMN crisis_lines.name IS 'Nombre de la línea de crisis';
COMMENT ON COLUMN crisis_lines.phone IS 'Número de teléfono';
COMMENT ON COLUMN crisis_lines.is_free IS 'Indica si es línea gratuita';
COMMENT ON COLUMN crisis_lines.availability IS 'Disponibilidad: 24/7, horario laboral, etc.';
COMMENT ON COLUMN crisis_lines.notes IS 'Notas adicionales';

-- =====================================================
-- FIN DEL SCRIPT 006
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Migración 006: Tablas resources y crisis_lines creadas exitosamente';
END $$;
