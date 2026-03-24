# Documentación de Migraciones - KogniRecovery

## 📋 Descripción

Este directorio contiene los scripts de migración de base de datos PostgreSQL para el sistema KogniRecovery, una aplicación de acompañamiento en adicciones.

> **⚠️ Nota de Privacidad**: Este sistema maneja datos sensibles de salud mental. Todos los scripts cumplen con consideraciones de HIPAA/GDPR para proteger la información de los usuarios.

---

## 📁 Estructura de Archivos

### Scripts de Migración (001-007)

| Archivo | Descripción |
|---------|-------------|
| `001_extend_users.sql` | Extiende la tabla `users` con campos adicionales (2FA, risk_level, profile_type, etc.) |
| `002_extend_profiles.sql` | Extiende la tabla `profiles` con campos de adicciones (sustancias, etapas de cambio, etc.) |
| `003_create_emergency_contacts.sql` | Crea tabla de contactos de emergencia |
| `004_create_sharing_invitations.sql` | Crea tabla de invitaciones para familiares |
| `005_extend_notifications.sql` | Extiende notificaciones y crea tabla de preferencias |
| `006_create_resources.sql` | Crea tablas de recursos psicoeducativos y líneas de crisis |
| `007_create_refresh_tokens.sql` | Crea tabla de tokens de actualización para JWT |

### Scripts de Seed (010-012)

| Archivo | Descripción |
|---------|-------------|
| `010_seed_substances.sql` | Inserta sustancias comunes de referencia |
| `011_seed_countries_crisis_lines.sql` | Inserta países y líneas de crisis por país |
| `012_seed_resources.sql` | Inserta recursos educativos psicoeducativos iniciales |

---

## 🚀 Cómo Ejecutar las Migraciones

### Prerrequisitos

- PostgreSQL 14+ instalado
- Acceso a una base de datos PostgreSQL
- Cliente `psql` instalado

### Método 1: Usando el Script Automático

```bash
# Desde la raíz del proyecto
cd scripts

# Ejecutar todas las migraciones
./run_migrations.sh -d kognirecovery_dev

# Con opciones adicionales
./run_migrations.sh -H localhost -U postgres -d kognirecovery_prod --force

# Usando entornos predefinidos
./run_migrations.sh --env development -d kognirecovery_dev
./run_migrations.sh --env staging -d kognirecovery_staging
./run_migrations.sh --env production -d kognirecovery_prod
```

### Método 2: Ejecución Manual

```bash
# Conectarse a PostgreSQL
psql -h localhost -U postgres -d kognirecovery_dev

# Ejecutar scripts en orden
\i scripts/sql/001_extend_users.sql
\i scripts/sql/002_extend_profiles.sql
\i scripts/sql/003_create_emergency_contacts.sql
\i scripts/sql/004_create_sharing_invitations.sql
\i scripts/sql/005_extend_notifications.sql
\i scripts/sql/006_create_resources.sql
\i scripts/sql/007_create_refresh_tokens.sql
\i scripts/sql/010_seed_substances.sql
\i scripts/sql/011_seed_countries_crisis_lines.sql
\i scripts/sql/012_seed_resources.sql
```

### Método 3: Con Docker Compose

```bash
# Asegurarse que PostgreSQL esté corriendo
docker-compose up -d postgres

# Copiar scripts al contenedor
docker cp scripts/sql/ postgres_container:/docker-entrypoint-initdb.d/

# O ejecutar directamente
docker exec -i postgres_container psql -U postgres -d kognirecovery_dev < scripts/sql/001_extend_users.sql
```

---

## 📊 Orden de Ejecución

El sistema está diseñado para ejecutarse en orden numérico:

1. **001-007**: Esquema de base de datos
2. **010-012**: Datos iniciales (seeds)

> ⚠️ **Importante**: Los scripts 001-007 asumen que ya existe la estructura base del archivo `docker/postgres/init.sql`.

---

## 🔒 Consideraciones de Seguridad

### Datos Sensibles

- Los scripts incluyen comentarios sobre privacidad de datos de salud
- Los campos de información sensible están marcados para cifrado en producción
- Se implementa RBAC (Control de acceso basado en roles)

### Producción

1. **Cifrado en reposo**: Usar pgcrypto para campos sensibles
2. **Backups**: Configurar backups automáticos diarios
3. **Auditoría**: Habilitar logs de auditoría para accesos
4. **Permisos**: Crear roles específicos para aplicaciones

---

## 🔧 Entornos

| Entorno | Base de datos | Propósito |
|---------|---------------|-----------|
| development | kognirecovery_dev | Desarrollo local |
| staging | kognirecovery_staging | Pruebas pre-producción |
| production | kognirecovery_prod | Producción |

---

## 📝 Agregar Nuevas Migraciones

Para agregar una nueva migración:

1. Crear archivo con siguiente número secuencial (ej: `008_*.sql`)
2. Incluir comentarios con:
   - Propósito de la migración
   - Consideraciones de privacidad
   - Fecha
3. Agregar al final del archivo un mensaje de verificación
4. Actualizar este README con la nueva tabla/funcionalidad

### Plantilla de Nueva Migración

```sql
-- =====================================================
-- Migración 008: Nombre de la migración
-- KogniRecovery - Sistema de Acompañamiento en Adicciones
-- Fecha: YYYY-MM-DD
-- =====================================================
--
-- PROPÓSITO:
-- Descripción de qué hace esta migración
--
-- NOTA DE PRIVACIDAD:
-- Consideraciones de privacidad si aplica
--
-- =====================================================

-- Tu SQL aquí

DO $$ 
BEGIN
    RAISE NOTICE 'Migración 008: Descripción completada exitosamente';
END $$;
```

---

## 📞 Soporte

Para preguntas o problemas con las migraciones:

1. Verificar compatibilidad con PostgreSQL 14+
2. Revisar que el init.sql base esté ejecutado
3. Verificar credenciales de acceso a la base de datos

---

## 📄 Licencia

Este proyecto es parte de KogniRecovery - Sistema de Acompañamiento en Adicciones
