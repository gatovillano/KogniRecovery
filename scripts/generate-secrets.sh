#!/usr/bin/env bash
# =============================================================
# KogniRecovery - Generador de Secretos para Producción
# =============================================================
# Ejecución: chmod +x scripts/generate-secrets.sh && ./scripts/generate-secrets.sh
#
# Genera valores seguros para todas las variables críticas de
# producción. Nunca commitear el output de este script.
# =============================================================

set -euo pipefail

echo ""
echo "🔐 KogniRecovery - Generador de Secretos para Producción"
echo "=========================================================="
echo ""
echo "Copia los siguientes valores en tu gestor de secretos"
echo "(Docker Secrets, AWS Secrets Manager, HashiCorp Vault, etc.)"
echo ""
echo "⚠️  NUNCA los dejes en docker-compose.yml ni en repositorios VCS"
echo ""
echo "------------------------------------------------------------"
echo ""

echo "# JWT"
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 64)"
echo ""

echo "# Encriptación de datos de salud"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "ENCRYPTION_SALT=$(openssl rand -hex 32)"
echo ""

echo "# PostgreSQL"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/' | head -c 32)"
echo ""

echo "# Neo4j (formato: usuario/password)"
echo "NEO4J_PASSWORD=$(openssl rand -base64 18 | tr -d '/' | head -c 24)"
echo ""

echo "# pgAdmin (solo para entornos internos)"
echo "PGADMIN_DEFAULT_PASSWORD=$(openssl rand -base64 18 | tr -d '/' | head -c 24)"
echo ""

echo "------------------------------------------------------------"
echo ""
echo "✅ Secretos generados. Guárdalos en un gestor de secretos seguro."
echo ""
echo "Para SSL de base de datos en producción, también necesitarás:"
echo "  DB_SSL_CA_CERT=<contenido del certificado CA de tu proveedor>"
echo ""
