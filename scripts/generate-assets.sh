#!/bin/bash

# Script para generar assets placeholder para KogniRecovery
# Ejecutar: bash scripts/generate-assets.sh

set -e

ASSETS_DIR="assets"
mkdir -p "$ASSETS_DIR"

# Crear un PNG de 1x1 pixel transparente usando base64
# Esto crea un archivo PNG válido pero invisible
TRANSPARENT_PNG_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "Generando assets placeholder..."

# Icono de la app (1024x1024 recomendado, usamos 1x1 por ahora)
echo "$TRANSPARENT_PNG_BASE64" | base64 -d > "$ASSETS_DIR/icon.png"
echo "✓ Creado: icon.png"

# Splash screen (1284x2778 recomendado)
echo "$TRANSPARENT_PNG_BASE64" | base64 -d > "$ASSETS_DIR/splash.png"
echo "✓ Creado: splash.png"

# Adaptive icon (foreground) (1024x1024)
echo "$TRANSPARENT_PNG_BASE64" | base64 -d > "$ASSETS_DIR/adaptive-icon.png"
echo "✓ Creado: adaptive-icon.png"

# Favicon para web (48x48)
echo "$TRANSPARENT_PNG_BASE64" | base64 -d > "$ASSETS_DIR/favicon.png"
echo "✓ Creado: favicon.png"

echo ""
echo "⚠️  IMPORTANTE: Estos son assets placeholder transparentes."
echo "   Reemplázalos con assets reales antes de producción."
echo ""
echo "Recomendaciones de tamaño:"
echo "  - icon.png: 1024x1024 px"
echo "  - splash.png: 1284x2778 px (o proporción similar)"
echo "  - adaptive-icon.png: 1024x1024 px"
echo "  - favicon.png: 48x48 px"