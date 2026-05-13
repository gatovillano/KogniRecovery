FROM python:3.12-slim

# Instalar dependencias del sistema (espeak-ng para G2P fallback)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    espeak-ng \
    libespeak-ng1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/kokoro

# Instalar dependencias Python
RUN pip install --no-cache-dir \
    kokoro-onnx \
    fastapi \
    "uvicorn[standard]" \
    pydantic \
    soundfile

# Descargar modelo ONNX y voces (~300MB total)
RUN wget -q -O kokoro-v1.0.onnx \
    https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx && \
    wget -q -O voices-v1.0.bin \
    https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

# Copiar servidor
COPY server.py /opt/kokoro/server.py

EXPOSE 8000

CMD ["python3", "server.py"]
