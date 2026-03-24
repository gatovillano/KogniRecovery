#!/bin/bash

# Script para iniciar el proyecto completo en Docker

echo "🚀 Iniciando KogniRecovery en Docker..."

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker no parece estar corriendo. Por favor, inicia Docker y vuelve a intentarlo."
  exit 1
fi

# Determinar si usar 'docker compose' o 'docker-compose'
if docker compose version > /dev/null 2>&1; then
  DOCKER_CMD="docker compose"
else
  DOCKER_CMD="docker-compose"
fi

# Construir e iniciar los servicios
echo "📦 Construyendo imágenes y levantando contenedores..."
$DOCKER_CMD up --build -d

echo ""
echo "✅ ¡Servicios iniciados!"
echo "-------------------------------------------------------"
echo "🌐 Frontend (Expo Web): http://localhost:19006"
echo "🧠 API Backend:         http://localhost:3003"
echo "📊 pgAdmin:             http://localhost:5050 (Profile: tools)"
echo "💾 Neo4j:               http://localhost:7475"
echo "-------------------------------------------------------"
echo ""
echo "📝 Para ver los logs de un servicio específico:"
echo "   $DOCKER_CMD logs -f api"
echo "   $DOCKER_CMD logs -f frontend"
echo ""
echo "⏹️  Para detener todo:"
echo "   $DOCKER_CMD down"
