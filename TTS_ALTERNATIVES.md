## 🎯 Alternativas de TTS Implementadas

He configurado **Piper TTS** como alternativa rápida al lento XTTS v2. Aquí están las opciones disponibles:

### 🚀 **Piper TTS (Recomendado)**

- **Ventajas**: Muy rápido (segundos), buena calidad, bajo uso de recursos
- **Desventajas**: Menos opciones de voz que XTTS
- **Uso**: `docker compose --profile tts run piper-tts`
- **Puerto**: 8007
- **Modelo**: Español (es_ES-davefx-medium)

### 🐌 **XTTS v2 (Actual)**

- **Ventajas**: Más voces disponibles, mejor calidad potencial
- **Desventajas**: Muy lento en CPU (minutos), alto uso de recursos
- **Uso**: `docker compose --profile tts-heavy run xtts-api`
- **Puerto**: 8006

### 🔄 **Cómo Cambiar entre Servicios**

Para usar **Piper** (recomendado):

```bash
# Actualizar configuración
echo "TTS_API_URL=http://localhost:8007" > server/.env.new
mv server/.env.new server/.env

# Levantar servicio
docker compose --profile tts up -d piper-tts
```

Para volver a **XTTS v2**:

```bash
echo "TTS_API_URL=http://localhost:8006" > server/.env
docker compose --profile tts-heavy up -d xtts-api
```

### 📊 **Comparación de Rendimiento**

| Servicio | Velocidad | Calidad    | Recursos | Idiomas    |
| -------- | --------- | ---------- | -------- | ---------- |
| Piper    | ⚡ Alta   | ⭐⭐⭐⭐   | 💚 Bajo  | ⭐⭐⭐⭐   |
| XTTS v2  | 🐌 Baja   | ⭐⭐⭐⭐⭐ | ❤️ Alto  | ⭐⭐⭐⭐⭐ |

**Recomendación**: Usa **Piper TTS** para producción. Es significativamente más rápido y tiene calidad de voz excelente para español.</content>
<parameter name="filePath">TTS_ALTERNATIVES.md
