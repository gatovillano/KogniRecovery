#!/bin/bash

# =====================================================
# KogniRecovery - Script de Inicio (Modo Híbrido)
# Bases de datos en Docker + Servicios en el Host
# =====================================================

echo "🚀 Iniciando KogniRecovery..."

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker no está corriendo. Por favor, inícialo y vuelve a intentarlo."
  exit 1
fi

# Determinar el comando de Docker Compose disponible
if docker compose version > /dev/null 2>&1; then
  DOCKER_CMD="docker compose"
else
  DOCKER_CMD="docker-compose"
fi

# =====================================================
# 1. LEVANTAR BASES DE DATOS EN DOCKER
# =====================================================
echo ""
echo "🐳 Levantando bases de datos y servicios de apoyo en Docker..."
$DOCKER_CMD up -d postgres redis neo4j

echo "🛑 Asegurando que el contenedor de la API no esté corriendo en Docker..."
$DOCKER_CMD stop api 2>/dev/null || true
$DOCKER_CMD stop frontend 2>/dev/null || true

echo "🧹 Liberando el puerto 3003 si estuviera ocupado..."
fuser -k 3003/tcp 2>/dev/null || true

echo "⏳ Esperando a que las bases de datos estén listas..."
sleep 5

# Esperar a que Postgres esté listo
echo "🔄 Verificando PostgreSQL (puerto 5437)..."
until docker exec kognirecovery-postgres pg_isready -U postgres > /dev/null 2>&1; do
  echo "   PostgreSQL no está listo aún, esperando..."
  sleep 2
done
echo "   ✅ PostgreSQL listo"

# Esperar a que Redis esté listo
echo "🔄 Verificando Redis (puerto 6380)..."
until docker exec kognirecovery-redis redis-cli ping > /dev/null 2>&1; do
  echo "   Redis no está listo aún, esperando..."
  sleep 2
done
echo "   ✅ Redis listo"

echo ""
echo "✅ Bases de datos listas"
echo "-------------------------------------------------------"
echo "   🐘 PostgreSQL: localhost:5437"
echo "   🔴 Redis:      localhost:6380"
echo "   🔵 Neo4j:      localhost:7688 (Bolt) | localhost:7475 (Web)"
echo "   🎙️  TTS API:    localhost:8006 (externo)"
echo "-------------------------------------------------------"

# =====================================================
# 2. EJECUTAR MIGRACIONES
# =====================================================
echo ""
echo "🔄 Ejecutando migraciones de base de datos..."
cd server && npx tsx src/scripts/migrate.ts
if [ $? -ne 0 ]; then
  echo "⚠️  Las migraciones fallaron, pero continuando..."
fi
cd ..
echo "✅ Migraciones completadas"

# =====================================================
# 3. INICIAR SERVIDOR BACKEND EN EL HOST
# =====================================================
echo ""
echo "🧠 Iniciando el servidor backend (puerto 3003)..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

echo "⏳ Esperando 5 segundos a que el servidor encienda..."
sleep 5

# =====================================================
# 4. INICIAR EXPO EN EL HOST
# =====================================================
echo ""
echo "Iniciando Expo (Expo Go compatible)..."
npx expo start

# =====================================================
# LIMPIEZA AL SALIR
# =====================================================
echo ""
echo "🛑 Apagando servidor backend..."
kill $SERVER_PID 2>/dev/null

echo ""
echo "¿Deseas también detener los contenedores de Docker? (s/n)"
read -r STOP_DOCKER
if [ "$STOP_DOCKER" = "s" ] || [ "$STOP_DOCKER" = "S" ]; then
  echo "🐳 Deteniendo contenedores..."
  $DOCKER_CMD stop postgres redis neo4j
  echo "✅ Contenedores detenidos"
else
  echo "ℹ️  Los contenedores siguen corriendo en segundo plano."
  echo "   Para detenerlos: $DOCKER_CMD down"
fi
