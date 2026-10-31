## 🎯 Alternativas de TTS Implementadas

Tres opciones de TTS local disponibles, de menor a mayor calidad:

### 🏆 **Kokoro TTS (Recomendado)**

- **Ventajas**: Mejor calidad de las tres opciones, español nativo con 3 voces, muy ligero (82M params), ONNX runtime
- **Desventajas**: Nuevo en el stack, menos battle-tested que Piper
- **Uso**: `docker compose up -d kokoro-tts` (ahora sube por defecto, sin perfil)
- **Puerto**: 8009
- **Modelo**: Kokoro-82M v1.0 (ONNX)
- **Voces español**: `ef_dora` (femenina, default), `em_alex` (masculino), `em_santa` (masculino)
- **Parámetros**: text, voice, speed, lang

### ☁️ **ElevenLabs (nube, opcional)**

- **Ventajas**: Calidad de voz más natural, muchas voces multilingües
- **Desventajas**: De pago (cuota gratuita limitada); requiere API key
- **Configuración**: Panel de administración → IA / LLM → "Voz del asistente (TTS)"
- **Fallback automático**: si ElevenLabs rechaza la llamada (cuota agotada,
  límite de caracteres o rate limit), el servidor usa **Kokoro** automáticamente
  cuando la opción de fallback está activada (por defecto sí).

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

**Kokoro** es el servicio por defecto y sube con `docker compose up -d`:
(ya no necesita `--profile tts`).

```bash
docker compose up -d kokoro-tts
```

Para usar **Piper** (opcional):

```bash
docker compose --profile tts up -d piper-tts
```

### 🔀 ElevenLabs con fallback a Kokoro

1. Sube los servicios: `docker compose up -d` (incluye kokoro-tts).
2. En el panel de administración (web) → **IA / LLM** → **Voz del asistente (TTS)**:
   - Selecciona **ElevenLabs**, pega tu API key, elige voz y modelo.
   - Deja activada la opción **"Usar Kokoro como respaldo..."**.
   - Pulsa **Probar voz** para validar la configuración antes de guardar.
3. Cuando la cuota gratuita de ElevenLabs se agote (HTTP 402/429), el
   servidor detectará el rechazo y generará el audio con Kokoro sin que el
   usuario note el cambio.

Variables de entorno globales (opcionales): `TTS_KOKORO_URL`,
`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL`.

### 📊 Comparación de Rendimiento

| Servicio | Velocidad | Calidad    | Recursos | Español    | Voces ES |
| -------- | --------- | ---------- | -------- | ---------- | -------- |
| Kokoro   | ⚡ Alta   | ⭐⭐⭐⭐⭐ | 💚 Bajo  | ⭐⭐⭐⭐⭐ | 3        |
| Piper    | ⚡ Alta   | ⭐⭐⭐⭐   | 💚 Bajo  | ⭐⭐⭐⭐   | 1        |
| XTTS v2  | 🐌 Baja   | ⭐⭐⭐⭐⭐ | ❤️ Alto  | ⭐⭐⭐⭐⭐ | ∞ (clon) |

**Recomendación**: Usa **Kokoro TTS** como backend principal. Tiene mejor calidad que Piper,
soporte nativo para español con múltiples voces, y es igual de ligero. Piper queda como fallback.
