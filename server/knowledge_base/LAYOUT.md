# 🗺️ Layout de la Biblioteca Científica

## Estructura de directorios

```
knowledge_base/
├── README.md                          # Documentación principal
├── ESTADO_BIBLIOTECA.md               # Estado de artículos (completado/pendiente)
├── LAYOUT.md                          # Este archivo
├── AGENT_LIBRARY_INSTRUCTIONS.md      # Instrucciones para el agente
├── articulos_descargados/             # Almacén temporal de descargas
│   ├── MAPPING.md                     # Mapeo URLs -> archivos locales
│   ├── *.xml                          # XMLs de PMC (fuente)
│   ├── *.txt                          # Texto extraído de XMLs
│   ├── *.pdf                          # PDFs originales descargados
│   └── *.html                         # HTMLs de respaldo (paywalls)
│
├── 01_fundamentos_SUD/
│   ├── _RESUMEN_CARPETA.md            # Índice de la carpeta
│   ├── addiction_recovery_systematized_review_2020.md
│   │   └── (XML + TXT)                # PMC7215253
│   ├── advances_addiction_treatment_2020.md
│   │   └── advances_addiction_treatment_2020.html  # Solo HTML (Science, acceso restringido)
│   └── SUD_treatment_outcomes_methodology_2024.md
│       └── (XML + TXT)                # PMC12180564
│
├── 02_entrevista_motivacional/
│   ├── _RESUMEN_CARPETA.md
│   ├── cochrane_MI_substance_use_2022.md
│   │   └── (XML + TXT)                # PMC10714668
│   ├── MI_substance_abuse_PMC.md
│   │   └── (XML + TXT)                # PMC8939890
│   └── MI_treatment_motivation_wellbeing_2024.md
│       └── MI_treatment_motivation_wellbeing_2024.html  # T&F (HTML)
│
├── 03_TCC_prevencion_recaidas/
│   ├── _RESUMEN_CARPETA.md
│   ├── CBT_alcohol_drugs_PMC_2023.md
│   │   └── (XML + TXT)                # PMC9948631
│   ├── CBT_relapse_prevention_metaanalysis_2025.md
│   │   └── CBT_relapse_prevention_metaanalysis_2025.html  # SSRN (HTML)
│   ├── CBT_SUD_systematic_review_2023.md
│   │   └── (XML + TXT)                # PMC10572095
│   └── novel_insights_relapse_prevention_2025.md
│       └── www.mdpi.com_1648-9144_61_4_619.html  # MDPI (HTML)
│
├── 04_mindfulness_MBRP/
│   ├── _RESUMEN_CARPETA.md
│   ├── MBRP_effectiveness_review_2021.md
│   │   └── (XML + TXT)                # PMC8533446
│   ├── MBRP_metaanalysis_PMC.md
│   │   └── (XML + TXT)                # PMC5636047
│   └── mindfulness_latinoamerica_brasil_2024.md
│       └── (XML + TXT)                # PMC11557387
│
├── 05_salud_digital_apps/
│   ├── _RESUMEN_CARPETA.md
│   ├── digital_continuing_care_2022.md
│   │   └── (XML + TXT)                # PMC9260953
│   ├── digital_treatment_paths_2022.md
│   │   └── (XML + TXT)                # PMC9224394
│   ├── mobile_apps_SUD_umbrella_review_2024.md
│   │   └── S2949-7612.html            # npj Digital Medicine (HTML)
│   ├── telehealth_SUD_practical_2022.md
│   │   └── (XML + TXT)                # PMC9352538
│   └── _RESUMEN_CARPETA.md            # (misma fuente que mobile_apps)
│
├── 06_apoyo_recuperacion/
│   ├── _RESUMEN_CARPETA.md
│   ├── group_treatments_SUD_2021.md
│   │   └── PDF (1000K)                # Springer
│   ├── recovery_supportive_interventions_2024.md
│   │   └── PDF (1.4M)                 # Frontiers Psychiatry
│   ├── SUD_recovery_research_opportunities_2025.md
│   │   └── PDF (343K)                 # Frontiers Public Health
│   └── _RESUMEN_CARPETA.md
│       └── PDF (1.4M)                 # Frontiers Psychiatry
│
└── 07_contexto_global_latinoamerica/
    ├── _RESUMEN_CARPETA.md
    ├── mindfulness_latinoamerica_brasil_2024.md
    │   └── (XML + TXT)                # PMC11557387
    ├── UNODC_global_advancements_2025.md
    │   └── UNODC HTML (56K)           # Informe UNODC (HTML)
    └── _RESUMEN_CARPETA.md            # (misma fuente que UNODC)
```

## Convenciones de archivos

| Extensión | Contenido | Uso |
|-----------|-----------|-----|
| `.md` | Resumen estructurado del artículo (auto-generado) | Lectura principal, indexación |
| `.pdf` | PDF original del artículo | Indexación vectorial, referencia |
| `.txt` | Texto plano extraído de XML PMC | Indexación alternativa |
| `.xml` | XML completo de PubMed Central | Fuente primaria, respaldo |
| `.html` | HTML de respaldo (páginas de acceso) | Solo cuando no hay PDF/TXT/XML |

## Notas técnicas

- **Extracción de texto**: Los archivos `.txt` se generaron desde XMLs de PMC usando `xmllint` y `sed`.
- **Metadatos**: Se extrajeron con XPath del XML (título, DOI, fecha, autores).
- **Fallback**: Para artículos sin acceso completo, se generó `.md` a partir del HTML disponible (abstract).
- **Duplicados**: Unos pocos artículos aparecen en dos carpetas temáticas (ej. mindfulness_latinoamerica_brasil_2024). Eso es intencional por temática transversal.

## Acceso restringido

Los siguientes artículos solo tienen HTML (abstract) y están marcados en sus `.md` como acceso restringido:

1. advances_addiction_treatment_2020 (Science Advances)
2. MI_treatment_motivation_wellbeing_2024 (T&F)
3. CBT_relapse_prevention_metaanalysis_2025 (SSRN)
4. novel_insights_relapse_prevention_2025 (MDPI)
5. mobile_apps_SUD_umbrella_review_2024 (npj Digital Med)
6. UNODC_global_advancements_2025 (UNODC report)

Para obtener el texto completo se requiere acceso institucional o compra.

---

**Última actualización:** 27 de marzo de 2026
**Responsable:** Amalia (OpenClaw Agent)
