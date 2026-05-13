#!/usr/bin/env python3

import io
import re
import wave
import numpy as np
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from kokoro_onnx import Kokoro

app = FastAPI(title="Kokoro TTS Service")

# Configuracion
MODELS_DIR = Path("/opt/kokoro")
MODEL_PATH = MODELS_DIR / "kokoro-v1.0.onnx"
VOICES_PATH = MODELS_DIR / "voices-v1.0.bin"

# Voces espanolas disponibles
# ef_dora: femenina, em_alex: masculino, em_santa: masculino
DEFAULT_VOICE = "ef_dora"
DEFAULT_LANG = "es"  # espanol (espeak-ng code)
DEFAULT_SPEED = 1.0

# Inicializar modelo Kokoro
print("Cargando modelo Kokoro ONNX...")
kokoro = Kokoro(str(MODEL_PATH), str(VOICES_PATH))
print("Modelo Kokoro cargado correctamente")

# Listar voces disponibles
available_voices = kokoro.get_voices()
print(f"Voces disponibles: {available_voices}")


class TTSRequest(BaseModel):
    text: str
    voice: str = DEFAULT_VOICE
    speed: float = DEFAULT_SPEED
    lang: str = DEFAULT_LANG


@app.get("/")
async def root():
    return {"message": "Kokoro TTS Service funcionando"}


@app.get("/models")
async def list_models():
    return {
        "models": ["kokoro-v1.0"],
        "default": "kokoro-v1.0",
        "voices": available_voices,
    }


@app.get("/speakers")
async def get_speakers():
    return {"speakers": available_voices, "default": DEFAULT_VOICE}


@app.get("/voices")
async def list_voices():
    return {"voices": available_voices}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "kokoro-tts"}


@app.post("/tts")
async def generate_speech(request: TTSRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="El texto no puede estar vacio")

    # Validar longitud del texto (Kokoro funciona mejor con ~100-200 tokens)
    if len(request.text) > 10000:
        raise HTTPException(
            status_code=400,
            detail="Texto demasiado largo. Maximo 10000 caracteres.",
        )

    try:
        print(
            f"Generando audio con Kokoro ({'PROCESADO POR TROZOS' if len(request.text) > 800 else 'DIRECTO'}): "
            f"{len(request.text)} caracteres, voz={request.voice}, velocidad={request.speed}"
        )

        # Si el texto es corto, procesar directamente para menor latencia
        if len(request.text) < 800:
            samples, sample_rate = kokoro.create(
                request.text,
                voice=request.voice,
                speed=request.speed,
                lang=request.lang,
            )
        else:
            # Dividir texto por oraciones para evitar sobrecarga
            # Separamos por ., !, ? seguidos de espacio o salto de linea
            sentences = re.split(r'([.!?]+[\s\n]+)', request.text)
            text_chunks = []
            current_chunk = ""
            
            # Re-combinar el delimitador con la oracion previa
            for i in range(0, len(sentences), 2):
                sentence = sentences[i]
                delimiter = sentences[i+1] if i+1 < len(sentences) else ""
                full_sentence = (sentence + delimiter).strip()
                
                if not full_sentence:
                    continue
                    
                # Limite de ~800 caracteres por trozo (ideal para Kokoro)
                if len(current_chunk) + len(full_sentence) < 800:
                    current_chunk += (" " if current_chunk else "") + full_sentence
                else:
                    if current_chunk:
                        text_chunks.append(current_chunk)
                    current_chunk = full_sentence
            
            if current_chunk:
                text_chunks.append(current_chunk)

            print(f"Texto dividido en {len(text_chunks)} fragmentos.")
            
            all_samples = []
            sample_rate = 24000 # Default Kokoro

            for i, chunk in enumerate(text_chunks):
                print(f"  -> Fragmento {i+1}/{len(text_chunks)}: {len(chunk)} caracteres")
                samples, chunk_rate = kokoro.create(
                    chunk,
                    voice=request.voice,
                    speed=request.speed,
                    lang=request.lang
                )
                all_samples.append(samples)
                sample_rate = chunk_rate
            
            # Combinar todos los fragmentos
            samples = np.concatenate(all_samples)

        # Convertir a WAV en memoria
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wav_file:
            wav_file.setnchannels(1)  # mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            # Convertir float32 a int16
            audio_int16 = (samples * 32767).astype(np.int16)
            wav_file.writeframes(audio_int16.tobytes())

        wav_data = wav_buffer.getvalue()

        return Response(content=wav_data, media_type="audio/wav")

    except Exception as e:
        print(f"Error generando audio: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error al generar audio: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
