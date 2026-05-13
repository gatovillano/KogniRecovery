# Análisis de Brechas - Base de Conocimientos de LÚA

## Fecha: 26-04-2026

Este documento analiza qué documentación falta en la base de conocimientos de LÚA, cruzando lo que el prompt del sistema referencia con lo que realmente existe en `server/knowledge_base/`.

---

## Estado Actual por Carpeta

| Carpeta | Artículos | Estado | Notas |
|---------|-----------|--------|-------|
| 01_fundamentos_SUD | 3 | 67% | 1 artículo corrupto (paywall) |
| 02_entrevista_motivacional | 3 | 67% | 1 artículo solo abstract |
| 03_TCC_prevencion_recaidas | 4 | 50% | 2 artículos solo abstract |
| 04_mindfulness_MBRP | 3 | 100% ✅ | Completa |
| 05_salud_digital_apps | 4 | 75% | _RESUMEN corrupto |
| 06_apoyo_recuperacion | 3 | 75% | _RESUMEN corrupto |
| 07_contexto_global_latinoamerica | 2 | 0% ❌ | Ambos archivos corruptos |
| faqs | 1 | Limitada | Solo CRAFFT |
| psicoeducacion | 4 | 75% | 1 descarga incompleta |
| tecnicas | 2 | Parcial | 1 PDF sin revisar |
| recursos_locales | 1/3 países | 33% | AR y MX vacíos |

---

## Brechas Críticas Identificadas

### 🔴 PRIORIDAD ALTA — Temas referenciados en el prompt del sistema sin documentación

#### 1. Reducción de Daños (Harm Reduction)
**Referencia en prompt**: Sección 1 - Marco teórico fundamental
**Estado actual**: NO existe carpeta ni artículo dedicado
**Por qué importa**: Es uno de los 4 pilares del enfoque de LÚA. Sin documentación, el agente improvisa respuestas sobre reducción de daños.

**Artículos recomendados para agregar** (Open Access en PubMed):
- Mathias H et al. (2025) "Defining a public health approach to substance use: insights from a systematic scoping review and conceptual framework" - BMC Public Health. PMID: 41469960. **PMC Free**
- Khalili M et al. (2025) "Management of Amphetamine and Methamphetamine Use Disorders: A Systematic Review and Network Meta-analysis" - Int J Ment Health Addict. PMID: 41394525. **PMC Free**
- Zhang A et al. (2025) "Vending machines for reducing harm associated with substance use: systematic review" - Harm Reduct J. PMID: 40437578. **PMC Free**
- Gariépy G et al. (2025) "Supervised consumption sites and population-level overdose mortality: systematic review 2016-2024" - HPCDP. PMID: 40960731. **PMC Free**

#### 2. Cuidado Informado por Trauma (Trauma-Informed Care)
**Referencia en prompt**: Sección 2.2 - Sensibilidad al trauma
**Estado actual**: NO existe documentación específica
**Por qué importa**: LÚA debe reconocer y responder apropiadamente a usuarios con historiales traumáticos (ACEs, violencia, abuso).

**Artículos recomendados**:
- Modlin NL et al. (2024) "Trauma-Informed Care in Psychedelic Therapy Research: A Qualitative Literature Review" - Neuropsychiatr Dis Treat. PMID: 38268571. **PMC Free**
- Meyerson BE et al. (2024) "Methadone clinic staff perceptions of trauma-informed and patient-centered care" - Addict Sci Clin Pract. PMID: 39616394. **PMC Free**
- Stocchero BA et al. (2024) "Consequences of childhood maltreatment on dual-diagnosis in SUD: systematic review and meta-analysis" - Child Abuse Negl. PMID: 39418865

#### 3. Modelo Transteórico / Etapas de Cambio (Prochaska & DiClemente)
**Referencia en prompt**: Sección 3 - Core del comportamiento del agente según etapa
**Estado actual**: Mencionado brevemente en psicoeducacion/documento_para_agente.md, pero NO hay artículos de revisión
**Por qué importa**: TODO el comportamiento de LÚA se adapta según la etapa de cambio del usuario. Es la columna vertebral del sistema.

**Artículos recomendados**:
- Krebs P et al. (2018) "Stages of change and psychotherapy outcomes: A review and meta-analysis" - J Clin Psychol. PMID: 30335193. Efecto moderado (d=0.41) para SUD y alcohol
- Levesque D et al. (2018) "Stage-Based Mobile Intervention for Substance Use Disorders in Primary Care" - JMIR Med Inform. PMID: 29295811. **PMC Free** — Muy relevante: app móvil + TTM + SUD
- DiClemente CC et al. (2004) "Readiness and stages of change in addiction treatment" - Am J Addict. PMID: 15204662. Artículo seminal
- Migneault JP et al. (2005) "Application of the Transtheoretical Model to substance abuse: historical development and future directions" - Drug Alcohol Rev. PMID: 16298839

#### 4. Teoría de la Autodeterminación (Self-Determination Theory)
**Referencia en prompt**: Citada como base teórica (Ryan & Deci, 2017)
**Estado actual**: NO existe ningún artículo
**Por qué importa**: Fundamenta cómo LÚA promueve autonomía, competencia y relación.

**Recursos recomendados**:
- Buscar directamente: Ryan RM, Deci EL (2017) "Self-determination theory: Basic psychological needs in motivation, development, and wellness" - Guilford Press
- Artículo de OA cercano: Gideonse R et al. (2025) "Beat the Kick: autonomous motivation for substance-use treatment in adults with intellectual disabilities" - Trials. PMID: 41310781. **PMC Free** — Usa SDT aplicada a SUD

### 🟡 PRIORIDAD MEDIA — Temas con cobertura insuficiente

#### 5. IA Conversacional para Salud Mental / Adicciones
**Carpeta existente**: 05_salud_digital_apps (parcialmente)
**Estado**: 3 artículos sobre telehealth/digital pero NINGUNO sobre chatbots IA específicamente

**Artículos recomendados**:
- Huynh AL et al. (2026) "Applications of AI-based conversational agents in healthcare: systematic umbrella review" - Int J Med Inform. PMID: 41337874. 44 reviews incluidos
- Hawke LD et al. (2025) "Digital Conversational Agents for the Mental Health of Treatment-Seeking Youth: Scoping Review" - JMIR Ment Health. PMID: 41202292. **PMC Free**

#### 6. Tratamiento Asistido con Medicamentos (MAT)
**Estado actual**: Existe info sobre interacciones medicamentosas en Neo4j pero NO hay guías clínicas sobre MAT
**Por qué importa**: LÚA necesita informar correctamente sobre buprenorfina, metadona, naltrexona cuando los usuarios preguntan.

**Artículos recomendados**:
- Yakovenko I et al. (2024) "Management of opioid use disorder: 2024 update to the national clinical practice guideline" - CMAJ. PMID: 39532476. **PMC Free**
- Hestevik CH et al. (2024) "Association between benzodiazepine co-prescription, OAT and mortality: systematic review" - BMC Psychiatry. PMID: 39468492. **PMC Free**

#### 7. Perspectiva de Género en Adicciones
**Referencia en prompt**: Sección 5 - Adaptación por género
**Estado actual**: NO existe documentación

**Artículos recomendados**:
- Smith E et al. (2025) "Meeting the needs of women in the perinatal period who use drugs: mixed-methods systematic review" - Health Soc Care. PMID: 40844508. **Free**
- Camacho-Ruiz JA et al. (2024) "Patterns and Challenges in Help-Seeking for Addiction among Men: Systematic Review" - J Clin Med. PMID: 39458039. **PMC Free**
- Mammadli T et al. (2025) "Substance use among transgender and gender nonconforming youth: systematic review" - Soc Sci Med. PMID: 40811954. **Free**
- Nedjat S et al. (2024) "Disparity in medications for OUD based on race/ethnicity and gender: systematic review and meta-analysis" - Res Social Adm Pharm. PMID: 38101952

#### 8. Apoyo Familiar / Redes de Soporte
**Carpeta existente**: 06_apoyo_recuperacion (3 artículos)
**Estado**: Artículos existen pero _RESUMEN corrupto, y no hay contenido específico sobre intervención familiar

**Artículos recomendados**:
- Goldsborough EJ et al. (2026) "Building the Evidence for Family Treatment Courts: Reunification and Permanency" - Fam Court Rev. PMID: 41940320. **PMC Free**
- Hibbard PF et al. (2025) "Recovery housing and on-the-ground research priorities: community based participatory research" - Front Public Health. PMID: 40475204. **PMC Free**

#### 9. Riesgo Suicida + TUS
**Estado actual**: Solo contactos en recursos_locales/cl/, NO hay protocolos clínicos
**Por qué importa**: LÚA usa el algoritmo C-SSRS. Necesita documentación sobre factores de riesgo específicos en SUD.

**Artículos recomendados**:
- Padmanathan P et al. (2020) "Prevention of suicide and self-harm among people with SUD: systematic review and meta-analysis of RCTs" - Compr Psychiatry. PMID: 31810026
- McEvoy D et al. (2023) "Risk and protective factors for self-harm in adolescents: umbrella review" - J Psychiatr Res. PMID: 37972513. **Free**
- Dunne N et al. (2025) "Risk factors of non-fatal overdose among opioid users: systematic review and meta-analysis" - J Subst Use Addict Treat. PMID: 39890023. **Free**

### 🟠 PROBLEMAS TÉCNICOS

#### 10. Archivos _RESUMEN_CARPETA.md Corruptos
Los siguientes archivos necesitan ser regenerados:
- `05_salud_digital_apps/_RESUMEN_CARPETA.md` → HTML Cloudflare en vez de markdown
- `06_apoyo_recuperacion/_RESUMEN_CARPETA.md` → Template vacío sin contenido real
- `07_contexto_global_latinoamerica/_RESUMEN_CARPETA.md` → HTML Google Analytics/UNODC

#### 11. Artículos Corruptos
- `01_fundamentos_SUD/advances_addiction_treatment_2020.md` → HTML paywall de Science Advances
- `07_contexto_global_latinoamerica/UNODC_global_advancements_2025.md` → HTML UNODC website dump
- `psicoeducacion/Sin confirmar 8999.crdownload` → Descarga incompleta

---

## Plan de Acción Recomendado

### Fase 1: Corrección inmediata (sin internet)
1. ✅ Regenerar 3 archivos `_RESUMEN_CARPETA.md` corruptos
2. ✅ Eliminar archivo `Sin confirmar 8999.crdownload`
3. ✅ Crear nueva carpeta `08_reduccion_danos/` con documento de síntesis
4. ✅ Crear nueva carpeta `09_modelo_transteorico/` con documento de síntesis
5. ✅ Crear nueva carpeta `10_trauma_informed_care/` con documento de síntesis

### Fase 2: Descarga de artículos (requiere acceso web manual)
6. Descargar artículos PMC Free listados arriba (usar PMIDs)
7. Convertir PDFs a markdown para indexación
8. Actualizar _RESUMEN_CARPETA.md de cada carpeta

### Fase 3: Expansión
9. Agregar recursos locales para Argentina y México
10. Expandir FAQs con preguntas frecuentes sobre síntomas, abstinencia, recaída
11. Agregar documentación sobre MAT y perspectiva de género
