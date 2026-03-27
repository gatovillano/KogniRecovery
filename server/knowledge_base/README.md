# 🧠 Biblioteca Científica — Agente de Acompañamiento en Adicciones

Esta biblioteca contiene la evidencia científica que respalda las intervenciones del agente.

## 📦 Estado actual

**Total de artículos curados:** 22

- ✅ **PDFs completos:** 5 (Springer, Frontiers ×2, Minsal)
- ✅ **Texto completo (PMC XML/TXT):** 13
- ⚠️ **Acceso restringido (solo metadata/abstract):** 4 (Science, T&F, MDPI, SSRN, mcpdigitalhealth, UNODC)

## Estructura

| Carpeta | Tema | Artículos (completos) |
|---|---|---|
| `01_fundamentos_SUD/` | Neurociencia y modelos de recuperación | 2/3 (1 con acceso restringido) |
| `02_entrevista_motivacional/` | Entrevista Motivacional (EM) | 2/3 (1 con acceso restringido) |
| `03_TCC_prevencion_recaidas/` | TCC y Prevención de Recaídas | 2/4 (2 con acceso restringido) |
| `04_mindfulness_MBRP/` | Mindfulness y MBRP | 3/3 ✅ |
| `05_salud_digital_apps/` | Salud digital y apps móviles | 3/4 (1 con acceso restringido) |
| `06_apoyo_recuperacion/` | Redes de apoyo y grupos | 3/3 ✅ (PDFs) |
| `07_contexto_global_latinoamerica/` | Contexto global y LATAM | 1/2 (1 con acceso restringido) |

**Disponibles localmente:** 18/22 artículos con contenido completo o parcial.

## Archivo clave para el agente

→ Lee primero: [`AGENT_LIBRARY_INSTRUCTIONS.md`](./AGENT_LIBRARY_INSTRUCTIONS.md)

## Convenciones de archivos

Cada artículo está organizado en su carpeta temática:

- `nombre_articulo.md` — Resumen estructurado con metadatos (generado automáticamente desde fuente)
- `*.pdf` — PDF original del artículo (cuando está disponible)
- `*.txt` — Texto extraído de XML de PMC (cuando no hay PDF)
- `*.xml` — XML completo de PubMed Central (fuente primaria)
- `_RESUMEN_CARPETA.md` — Índice de la carpeta (cuándo buscar aquí)

## 📄 Cómo indexar con LangChain / LlamaIndex

```python
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex

# Cargar todos los .md, .pdf y .txt de la biblioteca
documents = SimpleDirectoryReader(
    input_dir="./knowledge_base",
    recursive=True,
    required_exts=[".md", ".pdf", ".txt"]  # .xml opcional
).load_data()

# Crear índice vectorial
index = VectorStoreIndex.from_documents(documents)
```

## 🔍 Acceso restringido

4 artículos no se pudieron descargar en PDF/texto completo debido a paywalls:

| Artículo | Revista | Estado |
|---|---|---|
| Advances in Addiction Treatment 2020 | *Science Advances* | Solo abstract/HTML |
| MI Treatment Motivation Wellbeing 2024 | *Journal of Substance Abuse Treatment* (T&F) | Solo abstract/HTML |
| CBT Relapse Prevention Metaanalysis 2025 | *SSRN* | Solo abstract/HTML |
| Novel Insights Relapse Prevention 2025 | *Int J Environ Res Public Health* (MDPI) | Solo abstract/HTML |
| Mobile Apps SUD Umbrella Review 2024 | *npj Digital Medicine* | Solo abstract/HTML |
| UNODC Global Advancements 2025 | *UNODC Report* | HTML del informe |

**Para acceder al texto completo** de estos artículos, se requiere:
- Suscripción institucional
- Compra directa en la editorial
- Solicitar通过 préstamo interbibliotecario

Se recomienda marcar estos como "pendientes de acceso" en el agente y sugerir al usuario que consulte via academia.edu, ResearchGate, o contacte a los autores.

## 📋 Política de actualización

- **Frecuencia:** Cada 6 meses
- **Fuentes:** PubMed/PMC, Cochrane, NIDA, UNODC
- **Criterio mínimo:** Revisiones sistemáticas, metaanálisis o RCTs con n > 50, últimos 5 años

## 🗂️ Organización de archivos

Los archivos se organizan automáticamente en carpetas temáticas según el campo `**URL:**` en cada `.md`. Los archivos fuente (PDF, XML, TXT) se copian a la misma carpeta que su artículo correspondiente para mantener todo junto.

**Fecha de última actualización:** 27 de marzo de 2026
