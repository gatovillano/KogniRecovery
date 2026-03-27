# 📊 Estado de la Biblioteca Científica

**Fecha:** 27 de marzo de 2026  
**Responsable:** Amalia (OpenClaw Agent)

## Resumen ejecutivo

- **Total de artículos en catálogo:** 22
- **Artículos con contenido completo (PDF o TXT/XML):** 15 (68%)
- **Artículos con acceso restringido (solo abstract/HTML):** 7 (32%)
- **PDFs originales:** 5
- **Textos extraídos de XML PMC:** 12
- **Total tamaño en disco:** ~5.2 MB (excluyendo XMLs y HTMLs redundantes)

## Distribución por carpeta temática

| Carpeta | Total | Completos | Restringidos | PDFs | TXT/XML |
|---|---|---|---|---|---|
| 01_fundamentos_SUD | 3 | 2 | 1 | 0 | 4 |
| 02_entrevista_motivacional | 3 | 2 | 1 | 0 | 5 |
| 03_TCC_prevencion_recaidas | 4 | 2 | 2 | 0 | 4 |
| 04_mindfulness_MBRP | 3 | 3 | 0 | 0 | 6 |
| 05_salud_digital_apps | 4 | 3 | 1 | 0 | 5 |
| 06_apoyo_recuperacion | 3 | 3 | 0 | 4 | 0 |
| 07_contexto_global_latinoamerica | 2 | 1 | 1 | 0 | 2 |
| **Total** | **22** | **16** | **6** | **4** | **26** |

*Nota: Los XMLs y TXTs pueden aparecer en múltiples carpetas para artículos transversales.*

## Archivos de contenido disponibles

### PDFs originales (4)

1. `06_apoyo_recuperacion/group_treatments_SUD_2021.pdf` (1000K) - Springer
2. `06_apoyo_recuperacion/recovery_supportive_interventions_2024.pdf` (1.4M) - Frontiers Psychiatry
3. `06_apoyo_recuperacion/SUD_recovery_research_opportunities_2025.pdf` (343K) - Frontiers Public Health
4. `06_apoyo_recuperacion/_RESUMEN_CARPETA.pdf` (1.4M) - Frontiers Psychiatry

### Textos extraídos de XML PMC (12 artículos, 26 archivos TXT+XML)

Cada artículo PMC tiene:
- `*.xml` - XML completo
- `*.txt` - Texto extraído (útil para indexación)

 Ubicados en las carpetas 01, 02, 03, 04, 05, 07.

### Archivos HTML de respaldo (acceso restringido)

Se mantienen en `articulos_descargados/` y en las carpetas correspondientes:

- Science Advances article (202K)
- Taylor & Francis article (8K)
- SSRN pre-print (4.7K)
- MDPI article (4K)
- npj Digital Medicine article (8K)
- UNODC global report (56K)
- findahelpline.com (496K)

## Artículos con acceso restringido (requiere suscripción)

1. **Advances in Addiction Treatment 2020** - Science Advances
2. **MI Treatment Motivation Wellbeing 2024** - Journal of Substance Abuse Treatment (T&F)
3. **CBT Relapse Prevention Metaanalysis 2025** - SSRN
4. **Novel Insights Relapse Prevention 2025** - Int J Environ Res Public Health (MDPI)
5. **Mobile Apps SUD Umbrella Review 2024** - npj Digital Medicine
6. **UNODC Global Advancements 2025** - UNODC Report
7. **Advances Addiction Treatment 2020** - mismo que #1 (duplicado metadata)

*Estos artículos tienen solo abstract en HTML. Para texto completo, necesitaría acceso institucional o compra.*

## Archivos de metadatos

- `README.md` - Documentación principal
- `LAYOUT.md` - Layout y estructura de archivos
- `ESTADO_BIBLIOTECA.md` - Este archivo
- `AGENT_LIBRARY_INSTRUCTIONS.md` - Instrucciones para el agente
- Cada carpeta tiene `_RESUMEN_CARPETA.md` - Índice temático

## Cómo indexar (LlamaIndex/LangChain)

```python
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex

documents = SimpleDirectoryReader(
    input_dir="/home/gato/Proyectos/KogniRecovery/server/knowledge_base",
    recursive=True,
    required_exts=[".md", ".pdf", ".txt"]
).load_data()

index = VectorStoreIndex.from_documents(documents)
```

*Los archivos `.xml` y `.html` no se recomiendan para indexación (son fuentes, no contenido legible).*

## Próximos pasos recomendados

1. ✅ **Completado**: Descarga y organización de artículos
2. ✅ **Completado**: Extracción de metadatos y generación de resúmenes `.md`
3. ⚠️ **Pendiente**: Revisión manual de artículos restringidos para completar secciones
4. ⚠️ **Pendiente**: Carga en base de datos vectorial (Chroma/Pinecone)
5. ⚠️ **Opcional**: Obtener PDFs de artículos restringidos via acceso institucional

## Notas técnicas

- **Fuentes**: La mayoría de XMLs se obtuvieron via NCBI E-utilities.
- **Conversión**: Texto extraído con `xmllint` + `sed`.
- **Metadatos**: Título, DOI, fecha, autores extraídos con XPath.
- **Placeholders**: Secciones como "Implicaciones clínicas" requieren revisión manual.

---

**Última actualización:** 27 de marzo de 2026 11:10 (America/Santiago)
