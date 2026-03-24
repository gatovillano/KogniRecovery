-- =====================================================
-- KogniRecovery - Inicialización de Base de Datos
-- Sprint 0: Estructura base para desarrollo
-- =====================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: users
-- Información de autenticación de usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'family', 'professional', 'admin')),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- TABLA: profiles
-- Información de perfil de usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  birth_date DATE,
  recovery_start_date DATE,
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- =====================================================
-- TABLA: checkins
-- Registro de check-ins diarios
-- =====================================================
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'daily' CHECK (type IN ('daily', 'weekly', 'monthly')),
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  cravings INTEGER NOT NULL CHECK (cravings >= 0 AND cravings <= 10),
  triggers JSONB, -- Array de strings
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para checkins
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_completed_at ON checkins(completed_at);
CREATE INDEX IF NOT EXISTS idx_checkins_user_completed ON checkins(user_id, completed_at);

-- =====================================================
-- TABLA: notifications
-- Notificaciones del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN DEFAULT false,
  data JSONB, -- Datos adicionales
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- TABLA: emergency_alerts
-- Alertas de emergencia
-- =====================================================
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('emergency', 'relapse', 'help')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  message TEXT,
  contacts_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para emergency_alerts
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_id ON emergency_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON emergency_alerts(created_at);

-- =====================================================
-- FUNCIÓN: update_updated_at_column
-- Trigger para actualizar automáticamente updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de usuarios con perfil completo
CREATE OR REPLACE VIEW users_with_profiles AS
SELECT
  u.id,
  u.email,
  u.role,
  u.is_active,
  u.email_verified,
  u.last_login,
  u.created_at,
  p.first_name,
  p.last_name,
  p.phone,
  p.avatar_url,
  p.birth_date,
  p.recovery_start_date,
  p.emergency_contact_name,
  p.emergency_contact_phone,
  p.emergency_contact_relationship
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id;

-- Vista de estadísticas de check-ins
CREATE OR REPLACE VIEW checkin_stats AS
SELECT
  user_id,
  COUNT(*) as total_checkins,
  COUNT(DISTINCT DATE(completed_at)) as days_checked_in,
  AVG(mood) as avg_mood,
  AVG(cravings) as avg_cravings,
  MAX(completed_at) as last_checkin
FROM checkins
GROUP BY user_id;

-- =====================================================
-- DATOS INICIALES (opcional para desarrollo)
-- =====================================================

-- Insertar usuario de prueba (solo en desarrollo)
-- IMPORTANTE: Cambiar la contraseña en producción
-- INSERT INTO users (email, password_hash, role, email_verified)
-- VALUES (
--   'demo@kognirecovery.com',
--   '$2a$10$YourHashedPasswordHere', -- Generar con bcrypt
--   'patient',
--   true
-- );

-- INSERT INTO profiles (user_id, first_name, last_name)
-- VALUES (
--   (SELECT id FROM users WHERE email = 'demo@kognirecovery.com'),
--   'Juan',
--   'Pérez'
-- );

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE users IS 'Usuarios del sistema con credenciales de autenticación';
COMMENT ON TABLE profiles IS 'Información de perfil extendida de usuarios';
COMMENT ON TABLE checkins IS 'Registro diario/semanal de estado emocional y cravings';
COMMENT ON TABLE notifications IS 'Notificaciones push y en-app para usuarios';
COMMENT ON TABLE emergency_alerts IS 'Alertas de emergencia enviadas por usuarios';

COMMENT ON COLUMN users.email IS 'Email único para login';
COMMENT ON COLUMN users.role IS 'Rol del usuario: patient, family, professional, admin';
COMMENT ON COLUMN checkins.mood IS 'Estado de ánimo 1-5 (1=muy mal, 5=excelente)';
COMMENT ON COLUMN checkins.cravings IS 'Intensidad de cravings 0-10 (0=nada, 10=extremo)';
COMMENT ON COLUMN checkins.triggers IS 'Array JSON de desencadenantes identificados';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
-- Para ejecutar:
-- 1. docker-compose up -d postgres
-- 2. docker-compose exec postgres psql -U postgres -d kognirecovery_dev -f /docker-entrypoint-initdb.d/init.sql
--
-- O simplemente levantar docker-compose y se ejecutará automáticamente