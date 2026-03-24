-- =====================================================
-- Migración 005: Extender tabla notifications
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: 2026-02-20
-- =====================================================
--
-- PROPÓSITO:
-- Extender la tabla notifications existente con campos adicionales
-- para mejorar el sistema de notificaciones push e in-app.
--
-- NOTA DE PRIVACIDAD:
-- Las notificaciones pueden contener información sensible sobre
-- el estado de salud del usuario. No almacenar contenido
-- clínico en las notificaciones.
--
-- =====================================================

-- =====================================================
-- 1. Agregar columnas adicionales a notifications
-- =====================================================

-- Tipo de notificación extendido
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50);

-- Actualizar constraint de tipo
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (notification_type IN (
    'checkin_reminder', 
    'achievement', 
    'emergency_alert', 
    'sharing_invite',
    'crisis_line',
    'mood_insight',
    'resource_recommendation',
    'streak_reminder',
    'medication_reminder',
    'general'
));

-- Canal de entrega
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'both'
CHECK (channel IN ('push', 'in_app', 'both', 'email', 'sms'));

-- Prioridad
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal'
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Fecha de lectura
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Acción asociada (para deep linking)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_data JSONB;

-- Intent (para analytics)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS intent VARCHAR(100);

-- =====================================================
-- 2. Crear índices adicionales
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notifications_type 
    ON notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_notifications_priority 
    ON notifications(priority);

CREATE INDEX IF NOT EXISTS idx_notifications_channel 
    ON notifications(channel);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
    ON notifications(user_id, is_read) 
    WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_read_at 
    ON notifications(read_at);

-- =====================================================
-- 3. Agregar comentarios de documentación
-- =====================================================

COMMENT ON COLUMN notifications.notification_type IS 'Tipo de notificación: checkin_reminder, achievement, emergency_alert, etc.';
COMMENT ON COLUMN notifications.channel IS 'Canal de entrega: push, in_app, both, email, sms';
COMMENT ON COLUMN notifications.priority IS 'Prioridad: low, normal, high, urgent';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp cuando el usuario leyó la notificación';
COMMENT ON COLUMN notifications.action_type IS 'Tipo de acción al hacer click: navigate, open_url, etc.';
COMMENT ON COLUMN notifications.action_data JSONB IS 'Datos para la acción: {screen: "dashboard", params: {...}}';
COMMENT ON COLUMN notifications.intent IS 'Intención de la notificación para analytics';

-- =====================================================
-- 4. Crear tabla de preferencias de notificaciones
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Preferencias por tipo
    checkin_reminders BOOLEAN DEFAULT TRUE,
    checkin_reminder_time TIME DEFAULT '09:00:00',
    
    achievements BOOLEAN DEFAULT TRUE,
    
    emergency_alerts BOOLEAN DEFAULT TRUE,
    
    sharing_invites BOOLEAN DEFAULT TRUE,
    
    crisis_lines BOOLEAN DEFAULT TRUE,
    
    mood_insights BOOLEAN DEFAULT TRUE,
    
    resource_recommendations BOOLEAN DEFAULT TRUE,
    
    streak_reminders BOOLEAN DEFAULT TRUE,
    streak_reminder_time TIME DEFAULT '20:00:00',
    
    medication_reminders BOOLEAN DEFAULT FALSE,
    
    general_notifications BOOLEAN DEFAULT TRUE,
    
    -- Configuración de silencio
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    
    -- Canales preferidos
    preferred_channel VARCHAR(20) DEFAULT 'push'
        CHECK (preferred_channel IN ('push', 'email', 'sms', 'both')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para preferencias
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
    ON notification_preferences(user_id);

-- Trigger para updated_at
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE notification_preferences IS 'Preferencias de notificaciones por usuario';

-- =====================================================
-- FIN DEL SCRIPT 005
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Migración 005: Extensión de notifications y preferencias completada exitosamente';
END $$;
