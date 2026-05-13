## 🎯 Alternativas de TTS Implementadas

Tres opciones de TTS local disponibles, de menor a mayor calidad:

### 🏆 **Kokoro TTS (Recomendado)**

- **Ventajas**: Mejor calidad de las tres opciones, español nativo con 3 voces, muy ligero (82M params), ONNX runtime
- **Desventajas**: Nuevo en el stack, menos battle-tested que Piper
- **Uso**: `docker compose --profile tts up -d kokoro-tts`
- **Puerto**: 8009
- **Modelo**: Kokoro-82M v1.0 (ONNX)
- **Voces español**: `ef_dora` (femenina, default), `em_alex` (masculino), `em_santa` (masculino)
- **Parámetros**: text, voice, speed, lang

### 🚀 **Piper TTS**

- **Ventajas**: Rápido, estable, bajo uso de recursos
- **Desventajas**: Calidad inferior a Kokoro, voces menos naturales
- **Uso**: `docker compose --profile tts up -d piper-tts`
- **Puerto**: 8008
- **Modelo**: Español (es_MX-claude-high)

### 🐌 **XTTS v2**

- **Ventajas**: Máxima calidad potencial, clonación de voz
- **Desventajas**: Muy lento en CPU (minutos), alto uso de recursos
- **Uso**: `docker compose --profile tts-heavy run xtts-api`
- **Puerto**: 8006

### 🔄 Cómo Cambiar entre Servicios

Para usar **Kokoro** (recomendado):

```bash
# Actualizar configuración
echo "TTS_API_URL=http://localhost:8009" > server/.env

# Levantar servicio
docker compose --profile tts up -d kokoro-tts
```

Para usar **Piper**:

```bash
echo "TTS_API_URL=http://localhost:8008" > server/.env
docker compose --profile tts up -d piper-tts
```

Para volver a **XTTS v2**:

```bash
echo "TTS_API_URL=http://localhost:8006" > server/.env
docker compose --profile tts-heavy up -d xtts-api
```

### 📊 Comparación de Rendimiento

| Servicio | Velocidad | Calidad    | Recursos | Español    | Voces ES |
| -------- | --------- | ---------- | -------- | ---------- | -------- |
| Kokoro   | ⚡ Alta   | ⭐⭐⭐⭐⭐ | 💚 Bajo  | ⭐⭐⭐⭐⭐ | 3        |
| Piper    | ⚡ Alta   | ⭐⭐⭐⭐   | 💚 Bajo  | ⭐⭐⭐⭐   | 1        |
| XTTS v2  | 🐌 Baja   | ⭐⭐⭐⭐⭐ | ❤️ Alto  | ⭐⭐⭐⭐⭐ | ∞ (clon) |

**Recomendación**: Usa **Kokoro TTS** como backend principal. Tiene mejor calidad que Piper,
soporte nativo para español con múltiples voces, y es igual de ligero. Piper queda como fallback.
