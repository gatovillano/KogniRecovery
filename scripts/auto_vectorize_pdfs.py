import os
import time
import glob
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import pdfplumber

# Configuración
PDF_DIR = os.path.expanduser("~/Proyectos/KogniRecovery/server/knowledge_base/articulos_descargados/")
CHROMA_DB_DIR = os.path.expanduser("~/Proyectos/KogniRecovery/.kogniterm/vector_db/")
COLLECTION_NAME = "kb_papers"
CHUNK_SIZE = 512
CHUNK_OVERLAP = 50
SLEEP_SECONDS = 60  # Para modo daemon
MODEL_NAME = "all-MiniLM-L6-v2"

# Inicializar modelo y DB
model = SentenceTransformer(MODEL_NAME)
client = chromadb.PersistentClient(path=CHROMA_DB_DIR, settings=Settings(allow_reset=True))
collection = client.get_or_create_collection(COLLECTION_NAME)

# Utilidades

def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i:i+chunk_size]
        chunks.append(' '.join(chunk))
        i += chunk_size - overlap
    return chunks

def extract_text_from_pdf(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        return '\n'.join(page.extract_text() or '' for page in pdf.pages)

def already_vectorized(pdf_path):
    # Usa el nombre del archivo como doc_id
    doc_id = os.path.basename(pdf_path)
    results = collection.get(where={"doc_id": doc_id})
    return len(results.get("ids", [])) > 0

def vectorize_pdf(pdf_path):
    doc_id = os.path.basename(pdf_path)
    text = extract_text_from_pdf(pdf_path)
    if not text.strip():
        print(f"[!] Sin texto extraído: {pdf_path}")
        return
    chunks = chunk_text(text)
    embeddings = model.encode(chunks, show_progress_bar=True)
    ids = [f"{doc_id}_chunk{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "chunk": i, "source": pdf_path} for i in range(len(chunks))]
    collection.add(documents=chunks, embeddings=embeddings, ids=ids, metadatas=metadatas)
    print(f"[+] Vectorizado: {pdf_path} ({len(chunks)} chunks)")

def main(daemon=False):
    while True:
        pdfs = glob.glob(os.path.join(PDF_DIR, "*.pdf"))
        for pdf_path in pdfs:
            if not already_vectorized(pdf_path):
                try:
                    vectorize_pdf(pdf_path)
                except Exception as e:
                    print(f"[!] Error procesando {pdf_path}: {e}")
        if not daemon:
            break
        time.sleep(SLEEP_SECONDS)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Auto-vectoriza PDFs nuevos en la carpeta de articulos_descargados/")
    parser.add_argument('--daemon', action='store_true', help='Corre en modo monitoreo continuo')
    args = parser.parse_args()
    main(daemon=args.daemon)
