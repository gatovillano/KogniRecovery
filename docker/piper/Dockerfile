FROM debian:bookworm-slim

# Instalar dependencias
RUN apt-get update && apt-get install -y \
    wget \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Crear entorno virtual
RUN python3 -m venv /opt/piper
ENV PATH="/opt/piper/bin:$PATH"

# Instalar Piper TTS y dependencias web
RUN pip install --no-cache-dir piper-tts fastapi uvicorn[standard] pydantic pathvalidate

# Descargar modelo de voz femenino en español mexicano (latino)
RUN mkdir -p /opt/piper/models && \
    wget -O /opt/piper/models/es_MX-claude-high.onnx https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_MX/claude/high/es_MX-claude-high.onnx && \
    wget -O /opt/piper/models/es_MX-claude-high.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_MX/claude/high/es_MX-claude-high.onnx.json

# Copiar script del servidor
COPY server.py /opt/piper/server.py

WORKDIR /opt/piper

EXPOSE 8000

CMD ["python3", "server.py"]