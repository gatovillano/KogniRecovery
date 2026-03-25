-- =====================================================
-- Tabla de Consentimiento de Privacidad
-- Implementa GDPR/CCPA compliance
-- KogniRecovery - Privacidad de datos
-- =====================================================

-- Tabla principal de consentimientos
CREATE TABLE IF NOT EXISTS privacy_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tipos de consentimiento
    consent_type VARCHAR(50) NOT NULL,
    -- 'terms_of_service' - Términos y condiciones
    -- 'privacy_policy' - Política de privacidad
    -- 'data_processing' - Procesamiento de datos
    -- 'marketing' - Comunicaciones de marketing
    -- 'analytics' - Análisis y mejoras
    -- 'third_party_sharing' - Compartir con terceros
    
    consent_status BOOLEAN NOT NULL DEFAULT FALSE,
    -- TRUE = usuario ha aceptado
    -- FALSE = usuario ha rechazado
    
    consent_version VARCHAR(20) NOT NULL,
    -- Versión del documento aceptado
    
    ip_address INET,
    -- IP del usuario al dar el consentimiento
    
    user_agent TEXT,
    -- Navegador/dispositivo del usuario
    
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Cuando se dio el consentimiento
    
    withdrawal_timestamp TIMESTAMPTZ,
    -- Cuando se withdrew el consentimiento (si aplica)
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX idx_privacy_consents_user_id ON privacy_consents(user_id);
CREATE INDEX idx_privacy_consents_type ON privacy_consents(consent_type);
CREATE INDEX idx_privacy_consents_status ON privacy_consents(consent_status);

-- =====================================================
-- Tabla de Preferencias de Privacidad del Usuario
-- =====================================================

CREATE TABLE IF NOT EXISTS user_privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Configuraciones de visibilidad de perfil
    profile_visibility VARCHAR(20) NOT NULL DEFAULT 'private',
    -- 'public' - Visible para todos
    -- 'contacts' - Solo contactos
    -- 'private' - Solo yo
    
    show_online_status BOOLEAN NOT NULL DEFAULT FALSE,
    show_activity_status BOOLEAN NOT NULL DEFAULT FALSE,
    show_progress_to_others BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Configuraciones de comunicación
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Configuraciones de datos
    allow_data_export BOOLEAN NOT NULL DEFAULT TRUE,
    allow_data_deletion BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Compartir con familiares (si aplica)
    share_with_family BOOLEAN NOT NULL DEFAULT FALSE,
    family_member_id UUID REFERENCES users(id),
    
    -- Metadatos
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_privacy_settings_user ON user_privacy_settings(user_id);

-- =====================================================
-- Tabla de Auditoría de Privacidad
-- Log de todas las operaciones de privacidad
-- =====================================================

CREATE TABLE IF NOT EXISTS privacy_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Tipo de operación
    action_type VARCHAR(50) NOT NULL,
    -- 'consent_granted' - Usuario dio consentimiento
    -- 'consent_withdrawn' - Usuario withdrew consentimiento
    -- 'privacy_settings_updated' - Configuración actualizada
    -- 'data_exported' - Datos exportados
    -- 'data_deleted' - Datos eliminados
    -- 'data_accessed' - Datos accedidos
    -- 'profile_viewed' - Perfil visto por otro
    
    target_type VARCHAR(50),
    -- 'consent', 'settings', 'profile', 'data'
    
    target_id UUID,
    -- ID del objeto afectado
    
    ip_address INET,
    user_agent TEXT,
    
    -- Detalles adicionales en JSON
    details JSONB DEFAULT '{}',
    
    -- Resultado de la operación
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_privacy_audit_user ON privacy_audit_log(user_id);
CREATE INDEX idx_privacy_audit_action ON privacy_audit_log(action_type);
CREATE INDEX idx_privacy_audit_created ON privacy_audit_log(created_at);

-- =====================================================
-- Tabla de Retención de Datos
-- Políticas de retención automática
-- =====================================================

CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    data_type VARCHAR(50) NOT NULL UNIQUE,
    -- 'checkin' - Registros de check-in
    -- 'journal' - Entradas del diario
    -- 'chatbot_conversation' - Conversaciones del chatbot
    -- 'mood_log' - Registros de estado de ánimo
    -- 'craving' - Registros de antojos
    -- 'message' - Mensajes
    -- 'notification' - Notificaciones
    
    retention_days INTEGER NOT NULL DEFAULT 365,
    -- Días de retención antes de eliminación
    
    auto_delete BOOLEAN NOT NULL DEFAULT TRUE,
    -- TRUE = eliminar automáticamente después del período
    
    anonymize_instead BOOLEAN NOT NULL DEFAULT FALSE,
    -- TRUE = anonimizar en lugar de eliminar
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar políticas de retención por defecto
INSERT INTO data_retention_policies (data_type, retention_days, auto_delete, anonymize_instead) VALUES
    ('chatbot_conversation', 90, true, false),
    ('checkin', 365, true, false),
    ('journal', 730, true, false),
    ('mood_log', 365, true, false),
    ('craving', 180, true, false),
    ('message', 365, true, false),
    ('notification', 90, true, true)
ON CONFLICT (data_type) DO NOTHING;

-- =====================================================
-- Tabla de Solicitudes de Datos (GDPR/CCPA)
-- =====================================================

CREATE TABLE IF NOT EXISTS data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    request_type VARCHAR(20) NOT NULL,
    -- 'access' - Solicitud de acceso a datos (GDPR Art. 15)
    -- 'export' - Exportar datos (GDPR Art. 20)
    -- 'deletion' - Eliminar datos (GDPR Art. 17 - Right to be forgotten)
    -- 'rectification' - Corregir datos (GDPR Art. 16)
    -- 'restriction' - Restringir procesamiento (GDPR Art. 18)
    -- 'portability' - Portabilidad de datos (GDPR Art. 20)
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- 'pending' - Pendiente de revisión
    -- 'in_progress' - En proceso
    -- 'completed' - Completado
    -- 'rejected' - Rechazado
    -- 'expired' - Expirado (tiempo límite superado)
    
    request_details JSONB DEFAULT '{}',
    -- Detalles específicos de la solicitud
    
    identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    assigned_to UUID REFERENCES users(id),
    -- Admin responsable de procesar la solicitud
    
    review_notes TEXT,
    
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    deadline_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    -- GDPR requiere respuesta en 30 días
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_data_requests_user ON data_requests(user_id);
CREATE INDEX idx_data_requests_status ON data_requests(status);
CREATE INDEX idx_data_requests_type ON data_requests(request_type);
CREATE INDEX idx_data_requests_deadline ON data_requests(deadline_at);

-- =====================================================
-- Función para actualizar timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_privacy_consents_updated_at
    BEFORE UPDATE ON privacy_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_privacy_settings_updated_at
    BEFORE UPDATE ON user_privacy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_data_requests_updated_at
    BEFORE UPDATE ON data_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_data_retention_policies_updated_at
    BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();