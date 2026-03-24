#!/bin/bash
# =====================================================
# Script de Ejecución de Migraciones
# KogniRecovery - Sistema de Acompañamiento en Adicciones
# =====================================================
#
# PROPÓSITO:
# Ejecutar todos los scripts de migración en orden numérico.
#
# USO:
#   ./run_migrations.sh [opciones]
#
# OPCIONES:
#   -h, --help     Mostrar esta ayuda
#   -e, --env      Entorno (development, staging, production)
#   -H, --host     Host de PostgreSQL (default: localhost)
#   -p, --port     Puerto de PostgreSQL (default: 5432)
#   -U, --user     Usuario de PostgreSQL (default: postgres)
#   -d, --dbname   Nombre de la base de datos
#
# EJEMPLOS:
#   # Desarrollo local
#   ./run_migrations.sh -d kognirecovery_dev
#
#   # Con credenciales
#   ./run_migrations.sh -h localhost -U postgres -d kognirecovery_prod
#
#   # Usando variables de entorno
#   export PGHOST=localhost PGPORT=5432 PGUSER=postgres PGDATABASE=kognirecovery_dev
#   ./run_migrations.sh
#
# =====================================================

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Valores por defecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_DIR="${SCRIPT_DIR}/sql"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-kognirecovery_dev}"

# Mostrar ayuda
show_help() {
    cat << EOF
KogniRecovery - Script de Migraciones

Uso: $0 [opciones]

Opciones:
  -h, --help           Mostrar esta ayuda
  -e, --env            Entorno (development, staging, production)
  -H, --host           Host de PostgreSQL (default: localhost)
  -p, --port           Puerto de PostgreSQL (default: 5432)
  -U, --user           Usuario de PostgreSQL (default: postgres)
  -d, --dbname         Nombre de la base de datos (required)
  -f, --force          Forzar ejecución sin confirmación

Ejemplos:
  $0 -d kognirecovery_dev
  $0 -H localhost -U postgres -d kognirecovery_prod
  $0 --env production -d kognirecovery_prod

Entornos predefinidos:
  development   -> kognirecovery_dev
  staging       -> kognirecovery_staging
  production    -> kognirecovery_prod
EOF
    exit 0
}

# Parsear argumentos
FORCE=false
ENV="development"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        -e|--env)
            ENV="$2"
            case $ENV in
                development) PGDATABASE="${PGDATABASE:-kognirecovery_dev}" ;;
                staging) PGDATABASE="${PGDATABASE:-kognirecovery_staging}" ;;
                production) PGDATABASE="${PGDATABASE:-kognirecovery_prod}" ;;
                *) echo -e "${RED}Error: Entorno desconocido: $ENV${NC}" && exit 1 ;;
            esac
            shift 2
            ;;
        -H|--host)
            PGHOST="$2"
            shift 2
            ;;
        -p|--port)
            PGPORT="$2"
            shift 2
            ;;
        -U|--user)
            PGUSER="$2"
            shift 2
            ;;
        -d|--dbname)
            PGDATABASE="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        *)
            echo -e "${RED}Error: Opción desconocida: $1${NC}"
            show_help
            ;;
    esac
done

# Verificar que tenemos database
if [ -z "$PGDATABASE" ]; then
    echo -e "${RED}Error: Debe especificar el nombre de la base de datos (-d, --dbname)${NC}"
    show_help
fi

# Verificar conexión a PostgreSQL
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}KogniRecovery - Ejecución de Migraciones${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Entorno: ${GREEN}$ENV${NC}"
echo -e "Base de datos: ${GREEN}$PGDATABASE${NC}"
echo -e "Host: ${GREEN}$PGHOST:$PGPORT${NC}"
echo -e "Usuario: ${GREEN}$PGUSER${NC}"
echo ""

# Verificar conexión
if ! PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}Error: No se puede conectar a la base de datos${NC}"
    echo "Verifica las credenciales y que PostgreSQL esté ejecutándose"
    exit 1
fi

# Obtener lista de scripts SQL
echo -e "${YELLOW}Buscando scripts de migración en: $SQL_DIR${NC}"
echo ""

# Contar scripts
SCRIPT_COUNT=$(find "$SQL_DIR" -maxdepth 1 -name "*.sql" -type f | wc -l)

if [ "$SCRIPT_COUNT" -eq 0 ]; then
    echo -e "${RED}No se encontraron scripts SQL en $SQL_DIR${NC}"
    exit 1
fi

echo -e "Scripts encontrados: ${GREEN}$SCRIPT_COUNT${NC}"
echo ""

# Confirmar ejecución
if [ "$FORCE" = false ]; then
    echo -e "${YELLOW}¿Deseas continuar con la ejecución? [s/N]${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Ss]$ ]]; then
        echo "Ejecución cancelada"
        exit 0
    fi
fi

# Obtener scripts en orden numérico
SCRIPTS=$(find "$SQL_DIR" -maxdepth 1 -name "*.sql" -type f | sort -V)

# Ejecutar cada script
TOTAL=0
SUCCESS=0
FAILED=0

for SCRIPT in $SCRIPTS; do
    SCRIPT_NAME=$(basename "$SCRIPT")
    TOTAL=$((TOTAL + 1))
    
    echo -e "${BLUE}[$TOTAL/$SCRIPT_COUNT] Ejecutando: ${SCRIPT_NAME}${NC}"
    
    # Ejecutar script
    if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$SCRIPT" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Completado${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "  ${RED}✗ Error${NC}"
        # Mostrar error detallado
        PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$SCRIPT" 2>&1 | tail -20
        FAILED=$((FAILED + 1))
    fi
done

# Resumen
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Resumen de Migraciones${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total de scripts: ${YELLOW}$TOTAL${NC}"
echo -e "Exitosos: ${GREEN}$SUCCESS${NC}"
echo -e "Fallidos: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Advertencia: Algunas migraciones fallaron${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Todas las migraciones completadas exitosamente${NC}"
    exit 0
fi
