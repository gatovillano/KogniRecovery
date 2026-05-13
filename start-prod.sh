#!/bin/bash

set -u

# =====================================================
# KogniRecovery - Inicio en Producción (Backend API)
# Uso:
#   ./start-prod.sh         Iniciar backend en segundo plano
#   ./start-prod.sh run     Iniciar backend en foreground (para systemd)
#   ./start-prod.sh stop    Detener backend
#   ./start-prod.sh status  Ver estado del backend
# =====================================================

# Rutas dentro del worktree (crear logs locales)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"
LOG_DIR="$SCRIPT_DIR/logs"
PID_FILE="$SCRIPT_DIR/.server.pid"
LOG_FILE="$LOG_DIR/server.log"

# Asegurar que el directorio de logs existe
mkdir -p "$LOG_DIR"

detect_docker_cmd() {
  if docker compose version > /dev/null 2>&1; then
    DOCKER_CMD="docker compose"
  else
    DOCKER_CMD="docker-compose"
  fi
}

ensure_docker_running() {
  if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo"
    exit 1
  fi
}

start_databases() {
  echo "🐳 Levantando bases de datos..."
  $DOCKER_CMD up -d postgres redis neo4j

  # Eliminar contenedores api/frontend para evitar conflictos
  $DOCKER_CMD rm -f api 2>/dev/null || true
  $DOCKER_CMD rm -f frontend 2>/dev/null || true
}

cleanup_local_processes() {
  echo "🧹 Liberando puertos..."
  fuser -k 3003/tcp 2>/dev/null || true
  fuser -k 19006/tcp 2>/dev/null || true
  fuser -k 8081/tcp 2>/dev/null || true
  pkill -f "expo start" 2>/dev/null || true
}

wait_for_databases() {
  echo "⏳ Esperando bases de datos..."
  sleep 5

  echo "🔄 Verificando PostgreSQL..."
  until docker exec kognirecovery-postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
  done
  echo "✅ PostgreSQL listo"

  echo "🔄 Verificando Redis..."
  until docker exec kognirecovery-redis redis-cli ping > /dev/null 2>&1; do
    sleep 2
  done
  echo "✅ Redis listo"

  echo "-------------------------------------------------------"
  echo "   🐘 PostgreSQL: localhost:5437"
  echo "   🔴 Redis:      localhost:6380"
  echo "   🔵 Neo4j:      localhost:7688 (Bolt) | localhost:7475 (Web)"
  echo "-------------------------------------------------------"
}

run_migrations() {
  echo "🔄 Ejecutando migraciones..."
  cd "$SERVER_DIR" || exit 1
  npx tsx src/scripts/migrate.ts
  if [ $? -ne 0 ]; then
    echo "⚠️  Migraciones fallaron, continuando..."
  fi
  echo "✅ Migraciones completadas"
}

build_backend() {
  echo "🔨 Compilando backend..."
  cd "$SERVER_DIR" || exit 1
  npm run build
  if [ $? -ne 0 ]; then
    echo "❌ Error de compilación"
    exit 1
  fi
  echo "✅ Compilación completada"
}

prepare_backend() {
  ensure_docker_running
  detect_docker_cmd
  start_databases
  wait_for_databases
  run_migrations
  build_backend
}

case "$1" in
  stop)
    if [ -f "$PID_FILE" ]; then
      SERVER_PID=$(cat "$PID_FILE")
      if kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "🛑 Deteniendo backend (PID $SERVER_PID)..."
        kill "$SERVER_PID"
        sleep 2
        # Forzar kill si sigue vivo
        kill -0 "$SERVER_PID" 2>/dev/null && kill -9 "$SERVER_PID" 2>/dev/null
        rm -f "$PID_FILE"
        echo "✅ Backend detenido"
      else
        echo "⚠️  El proceso $SERVER_PID ya no está corriendo"
        rm -f "$PID_FILE"
      fi
    else
      echo "⚠️  No hay backend corriendo en producción"
    fi
    exit 0
    ;;
  run)
    echo "🚀 Iniciando KogniRecovery Backend (systemd)..."
    prepare_backend
    echo "🧠 Iniciando backend en foreground..."
    cd "$SERVER_DIR" || exit 1
    exec node dist/index.js
    ;;
  status)
    if [ -f "$PID_FILE" ]; then
      SERVER_PID=$(cat "$PID_FILE")
      if kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "✅ Backend corriendo (PID $SERVER_PID)"
        echo "   API: http://localhost:3003"
        echo "   Logs: tail -f $LOG_FILE"
      else
        echo "❌ Backend no está corriendo (PID $SERVER_PID obsoleto)"
      fi
    else
      echo "⚠️  No hay backend configurado en producción"
    fi
    exit 0
    ;;
esac

# Verificar si ya hay un backend corriendo
if [ -f "$PID_FILE" ]; then
  EXISTING_PID=$(cat "$PID_FILE")
  if kill -0 "$EXISTING_PID" 2>/dev/null; then
    echo "⚠️  Ya hay un backend corriendo (PID $EXISTING_PID)"
    echo "   Detenerlo primero: ./start-prod.sh stop"
    exit 1
  fi
  rm -f "$PID_FILE"
fi

echo "🚀 Iniciando KogniRecovery Backend (Producción)..."

cleanup_local_processes
prepare_backend

echo "🧠 Iniciando backend en producción..."
nohup node dist/index.js > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

echo "⏳ Esperando inicio del servidor..."
sleep 5

# Verificar que está corriendo
if kill -0 $SERVER_PID 2>/dev/null; then
  echo ""
  echo "========================================"
  echo "  ✅ Backend en producción (PID $SERVER_PID)"
  echo "========================================"
  echo "  🌐 API:    http://localhost:3003"
  echo "  📋 Logs:   tail -f $LOG_FILE"
  echo "  🛑 Stop:   ./start-prod.sh stop"
  echo "  📊 Status: ./start-prod.sh status"
  echo "========================================"
else
  echo "❌ Backend falló al iniciar. Revisa $LOG_FILE"
  cat "$LOG_FILE"
  rm -f "$PID_FILE"
  exit 1
fi
