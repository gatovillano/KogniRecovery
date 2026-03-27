#!/usr/bin/env python3

import os
import io
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import subprocess
import tempfile

app = FastAPI(title="Piper TTS Service")

# Configuración
MODELS_DIR = Path("/opt/piper/models")
DEFAULT_MODEL = "es_MX-claude-high.onnx"

class TTSRequest(BaseModel):
    text: str
    model: str = DEFAULT_MODEL

@app.get("/")
async def root():
    return {"message": "Piper TTS Service funcionando"}

@app.get("/models")
async def list_models():
    models = []
    if MODELS_DIR.exists():
        for file in MODELS_DIR.glob("*.onnx"):
            models.append(file.stem)
    return {"models": models, "default": DEFAULT_MODEL}

@app.get("/speakers")
async def get_speakers():
    # Piper usa modelos específicos, no speakers separados
    return {"speakers": ["default"], "count": 1}

@app.post("/tts")
async def generate_speech(request: TTSRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")

    model_path = MODELS_DIR / request.model
    if not model_path.exists():
        # Intentar con extensión .onnx si no se proporcionó
        model_path = MODELS_DIR / f"{request.model}.onnx"
        if not model_path.exists():
            raise HTTPException(status_code=400, detail=f"Modelo no encontrado: {request.model}")

    try:
        print(f"Generando audio con Piper: {len(request.text)} caracteres")

        # Crear archivo temporal para el texto
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as text_file:
            text_file.write(request.text)
            text_file_path = text_file.name

        # Ejecutar Piper TTS
        cmd = [
            "piper",
            "--model", str(model_path),
            "--output_file", "-"
        ]

        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=False
        )

        # Enviar el texto por stdin (como bytes)
        stdout, stderr = process.communicate(input=request.text.encode('utf-8'))

        if process.returncode != 0:
            error_msg = stderr.decode('utf-8', errors='replace') if stderr else "Unknown error"
            print(f"Error en Piper: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Error en Piper TTS: {error_msg}")

        # El output es WAV raw en stdout
        wav_data = stdout

        # Limpiar archivo temporal
        os.unlink(text_file_path)

        return Response(
            content=wav_data,
            media_type="audio/wav"
        )

    except Exception as e:
        print(f"Error generando audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al generar audio: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "piper-tts"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)