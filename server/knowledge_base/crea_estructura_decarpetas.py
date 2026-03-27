#!/usr/bin/env python3
"""
Genera la estructura de carpetas de la biblioteca científica
para el agente de acompañamiento en adicciones.
"""

import os

BASE = "/home/claude/knowledge_base"

# Estructura: (carpeta, título, descripción, artículos, cuándo buscar aquí)
FOLDERS = [
    {
        "name": "01_fundamentos_SUD",
        "title": "Fundamentos del Trastorno por Uso de Sustancias",
        "description": "Conceptos nucleares sobre la neurociencia de la adicción, definiciones de recuperación, prevalencia global y modelos explicativos del SUD.",
        "when_to_search": [
            "El usuario pregunta qué es la adicción o si 'es una enfermedad'",
            "Necesitas explicar por qué ocurren los antojos (craving)",
            "El usuario pregunta si la recuperación es posible",
            "Quieres ofrecer psicoeducación sobre el proceso de cambio",
            "El usuario duda si su experiencia es 'normal'",
        ],
        "articles": [
            {
                "file": "advances_addiction_treatment_2020.md",
                "title": "Advances in Understanding Addiction Treatment and Recovery",
                "journal": "Science Advances, 2020",
                "url": "https://www.science.org/doi/10.1126/sciadv.aaz6596",
                "key_finding": "El tratamiento exitoso del SUD depende de soporte profesional, comunitario y político —no solo de la voluntad individual. Articula la naturaleza biopsicosocial de la adicción.",
                "use_for": "Psicoeducación sobre por qué la adicción no es 'falta de voluntad'",
            },
            {
                "file": "addiction_recovery_systematized_review_2020.md",
                "title": "Addiction Recovery: A Systematized Review",
                "journal": "Iranian Journal of Psychiatry, 2020",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7215253/",
                "key_finding": "Revisión sistemática de definiciones de recuperación. No existe consenso único; la recuperación incluye abstinencia, remisión, reintegración social y bienestar.",
                "use_for": "Cuando el usuario pregunta qué significa 'estar recuperado'",
            },
            {
                "file": "SUD_treatment_outcomes_methodology_2024.md",
                "title": "Substance Use Disorder Treatment Outcomes: Methodological Overview",
                "journal": "PMC, 2024",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12180564/",
                "key_finding": "~64 millones de personas en el mundo padecen un SUD (2022). Describe metodologías para medir resultados de tratamiento.",
                "use_for": "Contextualizar la magnitud del problema; hablar de resultados esperados",
            },
        ],
    },
    {
        "name": "02_entrevista_motivacional",
        "title": "Entrevista Motivacional (EM)",
        "description": "Evidencia sobre la efectividad de la entrevista motivacional para reducir el uso de sustancias y aumentar la motivación para el cambio. Base del estilo conversacional del agente.",
        "when_to_search": [
            "Vas a hacer preguntas exploratorias sobre las razones del usuario para cambiar",
            "El usuario está ambivalente sobre continuar el tratamiento",
            "Quieres fundamentar por qué no presionas ni das consejos directivos",
            "El usuario pregunta 'por qué me haces tantas preguntas'",
            "Necesitas respaldar el enfoque centrado en la autonomía",
        ],
        "articles": [
            {
                "file": "cochrane_MI_substance_use_2022.md",
                "title": "Motivational Interviewing for Substance Use Reduction (Cochrane)",
                "journal": "Cochrane / PMC, 2022-2023",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10714668/",
                "key_finding": "93 estudios, 22.776 participantes. La EM reduce el uso de sustancias de forma moderada vs ninguna intervención (SMD=0.48). Es la revisión más robusta disponible.",
                "use_for": "Respaldo principal de todo el estilo conversacional del agente",
            },
            {
                "file": "MI_substance_abuse_PMC.md",
                "title": "Motivational Interviewing for Substance Abuse",
                "journal": "PMC",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8939890/",
                "key_finding": "La EM no requiere ser psicólogo para aplicarse. Puede ser administrada por distintos agentes con entrenamiento. Incluye estándares de calidad medibles (escala MITI).",
                "use_for": "Fundamentar que el agente puede aplicar principios de EM de forma válida",
            },
            {
                "file": "MI_treatment_motivation_wellbeing_2024.md",
                "title": "Evaluation of MI on Treatment Motivation and Psychological Well-being in SUD",
                "journal": "Journal of Substance Use, 2024",
                "url": "https://www.tandfonline.com/doi/abs/10.1080/14659891.2024.2374797",
                "key_finding": "RCT (n=74) que muestra que la EM mejora significativamente la motivación para el tratamiento y el bienestar psicológico en personas con SUD.",
                "use_for": "Citar cuando el usuario pregunta si 'hablar' realmente sirve",
            },
        ],
    },
    {
        "name": "03_TCC_prevencion_recaidas",
        "title": "Terapia Cognitivo-Conductual y Prevención de Recaídas",
        "description": "Evidencia sobre TCC aplicada a SUD, modelos de prevención de recaídas, identificación de triggers y estrategias de afrontamiento.",
        "when_to_search": [
            "El usuario identifica situaciones de alto riesgo",
            "Vas a proponer identificar pensamientos automáticos",
            "El usuario tuvo una recaída y necesitas enmarcarla correctamente",
            "Quieres proponer un ejercicio de registro de pensamientos o emociones",
            "El usuario pregunta por qué el tratamiento incluye 'hablar de cosas del pasado'",
        ],
        "articles": [
            {
                "file": "CBT_SUD_systematic_review_2023.md",
                "title": "An Evaluation of CBT for SUD: A Systematic Review",
                "journal": "Clinical Psychology / PMC, 2023",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10572095/",
                "key_finding": "La TCC es eficaz para una variedad de SUD como monoterapia o complemento, con tamaños de efecto de pequeños a grandes según la sustancia.",
                "use_for": "Respaldo general de intervenciones cognitivo-conductuales",
            },
            {
                "file": "CBT_relapse_prevention_metaanalysis_2025.md",
                "title": "CBT for Resilience and Relapse Prevention: A Multilevel Meta-Analysis",
                "journal": "SSRN, 2025",
                "url": "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5228728",
                "key_finding": "Metaanálisis de 53 ensayos (n=5.873). La TCC reduce significativamente las recaídas (SMD=-0.227). Mayor efecto en los primeros 3 meses post-intervención.",
                "use_for": "Hablar sobre la importancia del acompañamiento en los primeros meses",
            },
            {
                "file": "CBT_alcohol_drugs_PMC_2023.md",
                "title": "Efficacy of CBT for Alcohol and Other Drug Use Disorders",
                "journal": "PMC, 2023",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9948631/",
                "key_finding": "El 96% de los centros de tratamiento en EE.UU. usan prevención de recaídas. TCC incluida en guías clínicas del NIDA, NICE (UK) y Dpto. de Salud de EE.UU.",
                "use_for": "Contextualizar la TCC como estándar de la industria",
            },
            {
                "file": "novel_insights_relapse_prevention_2025.md",
                "title": "Novel Insights into Addiction Management: A Meta-Analysis on Relapse Prevention",
                "journal": "MDPI / Medicina, 2025",
                "url": "https://www.mdpi.com/1648-9144/61/4/619",
                "key_finding": "Metaanálisis comparando TCC, EM, manejo de contingencias, MBRP, yoga y realidad virtual para prevención de recaídas. Útil para comparar enfoques.",
                "use_for": "Cuando el usuario pregunta qué funciona mejor para prevenir recaídas",
            },
        ],
    },
    {
        "name": "04_mindfulness_MBRP",
        "title": "Mindfulness y Prevención de Recaídas Basada en Mindfulness (MBRP)",
        "description": "Evidencia sobre intervenciones de mindfulness aplicadas a SUD, con énfasis en MBRP (Mindfulness-Based Relapse Prevention), manejo del craving y regulación emocional.",
        "when_to_search": [
            "Vas a guiar un ejercicio de respiración o atención plena",
            "El usuario describe un momento de craving intenso",
            "Quieres proponer observar pensamientos sin actuar sobre ellos",
            "El usuario pregunta si la meditación puede ayudar en su recuperación",
            "Vas a hablar sobre 'surfear' el impulso (urge surfing)",
        ],
        "articles": [
            {
                "file": "MBRP_effectiveness_review_2021.md",
                "title": "Effectiveness of MBRP in Individuals with SUD: A Systematic Review",
                "journal": "PMC, 2021",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8533446/",
                "key_finding": "Revisión de 13 estudios. MBRP reduce craving, frecuencia de uso y síntomas depresivos. Resultados consistentes a pesar de heterogeneidad metodológica.",
                "use_for": "Respaldo general de ejercicios de mindfulness con usuarios",
            },
            {
                "file": "MBRP_metaanalysis_PMC.md",
                "title": "Mindfulness-Based Relapse Prevention: Systematic Review and Meta-Analysis",
                "journal": "PMC",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5636047/",
                "key_finding": "Metaanálisis de 9 RCTs (n=901). MBRP mejora síntomas de craving y abstinencia (SMD=-0.13) y reduce consecuencias negativas del uso (SMD=-0.23).",
                "use_for": "Cuando el usuario duda si el mindfulness es 'real' o efectivo",
            },
            {
                "file": "mindfulness_latinoamerica_brasil_2024.md",
                "title": "A Mindfulness-Based Intervention for SUD in a Brazilian Vulnerable Population",
                "journal": "Frontiers in Public Health, 2024",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11557387/",
                "key_finding": "n=108 pacientes desintoxicados en Brasil. Demuestra viabilidad y efectividad del MBRP en población latinoamericana socialmente vulnerable.",
                "use_for": "Contexto cultural latinoamericano; relevante para usuarios de la región",
            },
        ],
    },
    {
        "name": "05_salud_digital_apps",
        "title": "Salud Digital y Apps de Acompañamiento en Recuperación",
        "description": "Evidencia sobre intervenciones digitales, apps móviles y telesalud para el tratamiento y acompañamiento del SUD. Fundamenta la propia existencia y diseño de este agente.",
        "when_to_search": [
            "El usuario pregunta si una app puede ayudarle en su recuperación",
            "Necesitas justificar el valor de este tipo de acompañamiento digital",
            "El usuario quiere saber qué hace diferente a esta herramienta",
            "Vas a hablar sobre el seguimiento continuo del tratamiento",
            "El usuario pregunta sobre telemedicina o atención remota",
        ],
        "articles": [
            {
                "file": "mobile_apps_SUD_umbrella_review_2024.md",
                "title": "Therapeutic Content of Mobile Apps for SUD: An Umbrella Review",
                "journal": "Mayo Clinic Proceedings: Digital Health, 2024",
                "url": "https://www.mcpdigitalhealth.org/article/S2949-7612(24)00021-X/fulltext",
                "key_finding": "Apps con manejo de contingencias, apoyo a la recuperación y TCC son las más efectivas. Apps sin paradigma basado en evidencia no muestran efectos significativos.",
                "use_for": "Fundamentar por qué el diseño de esta app sigue protocolos basados en evidencia",
            },
            {
                "file": "digital_continuing_care_2022.md",
                "title": "Digital Approaches to Continuing Care",
                "journal": "Current Opinion in Psychiatry / PMC, 2022",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9260953/",
                "key_finding": "Las intervenciones de seguimiento remoto más efectivas (A-CHESS, TMC) funcionan aumentando la participación en actividades orientadas a la recuperación.",
                "use_for": "Hablar sobre la importancia de la continuidad del acompañamiento",
            },
            {
                "file": "telehealth_SUD_practical_2022.md",
                "title": "Practical Technology for Expanding SUD Treatment: Telehealth and Digital Interventions",
                "journal": "Psychiatric Clinics of North America / PMC, 2022",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9352538/",
                "key_finding": "La telesalud expande el acceso al tratamiento SUD, especialmente en zonas rurales o con barreras de acceso. Efectiva para continuidad del cuidado.",
                "use_for": "Cuando el usuario vive lejos de servicios o tiene dificultad de acceso",
            },
            {
                "file": "digital_treatment_paths_2022.md",
                "title": "Digital Treatment Paths for Substance Use Disorders",
                "journal": "PMC, 2022",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9224394/",
                "key_finding": "Mapeo de rutas de tratamiento digital para SUD, incluyendo intervenciones escalonadas y combinadas.",
                "use_for": "Explicar cómo el acompañamiento digital complementa el tratamiento presencial",
            },
        ],
    },
    {
        "name": "06_apoyo_recuperacion",
        "title": "Intervenciones de Apoyo a la Recuperación",
        "description": "Evidencia sobre redes de apoyo, grupos, apoyo entre pares y servicios comunitarios que complementan el tratamiento formal del SUD.",
        "when_to_search": [
            "El usuario se siente solo en su proceso de recuperación",
            "Vas a hablar sobre la importancia del apoyo social",
            "El usuario pregunta por grupos de ayuda mutua o grupos terapéuticos",
            "El usuario quiere saber qué puede hacer además de la terapia individual",
            "Quieres reforzar la importancia de la red de soporte",
        ],
        "articles": [
            {
                "file": "recovery_supportive_interventions_2024.md",
                "title": "Recovery-Supportive Interventions for People with SUD: A Scoping Review",
                "journal": "Frontiers in Psychiatry, 2024",
                "url": "https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2024.1352818/full",
                "key_finding": "Las intervenciones de apoyo mejoran múltiples resultados: uso de sustancias, relaciones de soporte, funcionamiento social y bienestar general.",
                "use_for": "Hablar sobre el valor del apoyo más allá del tratamiento clínico",
            },
            {
                "file": "group_treatments_SUD_2021.md",
                "title": "A Review of Research-Supported Group Treatments for Drug Use Disorders",
                "journal": "Substance Abuse Treatment, Prevention, and Policy, 2021",
                "url": "https://link.springer.com/article/10.1186/s13011-021-00371-0",
                "key_finding": "TCC grupal y manejo de contingencias son más efectivos que el tratamiento habitual para cocaína. EM, prevención de recaídas y grupos de apoyo social son efectivos para marihuana.",
                "use_for": "Cuando el usuario pregunta sobre la efectividad de los grupos",
            },
            {
                "file": "SUD_recovery_research_opportunities_2025.md",
                "title": "Substance Use Disorder Recovery Research Opportunities",
                "journal": "Frontiers in Public Health, 2025",
                "url": "https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2025.1585533/full",
                "key_finding": "Identifica brechas actuales en la investigación de recuperación de SUD: cuatro áreas temáticas y tres ejes transversales prioritarios.",
                "use_for": "Para reconocer con honestidad dónde la ciencia aún está en desarrollo",
            },
        ],
    },
    {
        "name": "07_contexto_global_latinoamerica",
        "title": "Contexto Global y Perspectiva Latinoamericana",
        "description": "Documentos sobre el estado global del tratamiento de adicciones, políticas internacionales y estudios con poblaciones latinoamericanas.",
        "when_to_search": [
            "El usuario menciona barreras de acceso a tratamiento en su región",
            "Necesitas contexto sobre disponibilidad de servicios en Latinoamérica",
            "El usuario pregunta sobre enfoques culturalmente adaptados",
            "Quieres hablar sobre el contexto de políticas de salud pública",
        ],
        "articles": [
            {
                "file": "UNODC_global_advancements_2025.md",
                "title": "Global Advancements in Effective Drug Use Disorder Treatment and Care in 2024",
                "journal": "UNODC, 2025",
                "url": "https://www.unodc.org/unodc/drug-prevention-and-treatment/news-and-events/2025/April/global-advancements-in-effective-drug-use-disorder-treatment-and-care-in-2024.html",
                "key_finding": "En 2024, UNODC entrenó a más de 870 profesionales en 10 países. Se adoptó resolución CND 67/1 enfatizando tratamiento basado en evidencia y reintegración social.",
                "use_for": "Contextualizar el movimiento global hacia tratamiento basado en evidencia",
            },
            {
                "file": "mindfulness_latinoamerica_brasil_2024.md",
                "title": "A Mindfulness-Based Intervention for SUD in a Brazilian Vulnerable Population",
                "journal": "Frontiers in Public Health, 2024",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11557387/",
                "key_finding": "n=108 pacientes en Brasil. MBRP adaptado culturalmente es viable y efectivo en población latinoamericana en contexto de vulnerabilidad social.",
                "use_for": "Mostrar que las intervenciones basadas en evidencia funcionan en contexto latinoamericano",
            },
        ],
    },
]


def create_folder_readme(folder_info):
    lines = [
        f"# {folder_info['title']}",
        "",
        f"> {folder_info['description']}",
        "",
        "---",
        "",
        "## ¿Cuándo buscar en esta carpeta?",
        "",
    ]
    for item in folder_info["when_to_search"]:
        lines.append(f"- {item}")

    lines += [
        "",
        "---",
        "",
        "## Artículos disponibles",
        "",
    ]

    for i, art in enumerate(folder_info["articles"], 1):
        lines += [
            f"### {i}. {art['title']}",
            f"**Fuente:** {art['journal']}  ",
            f"**URL:** {art['url']}  ",
            f"**Archivo local:** `{art['file']}`",
            "",
            f"**Hallazgo clave:** {art['key_finding']}",
            "",
            f"**Úsalo cuando:** {art['use_for']}",
            "",
        ]

    return "\n".join(lines)


def create_article_stub(article, folder_name):
    return f"""# {article['title']}

**Fuente:** {article['journal']}  
**URL:** {article['url']}  
**Carpeta:** `{folder_name}`

---

## Hallazgo clave

{article['key_finding']}

---

## Cuándo usar este artículo

{article['use_for']}

---

## Resumen estructurado

> ⚠️ *Este archivo es una plantilla. Completa las secciones a continuación con el resumen del artículo original.*

### Objetivo del estudio
_[Describe el objetivo principal del artículo]_

### Muestra y metodología
_[n=?, diseño del estudio, población, país]_

### Resultados principales
_[Lista los resultados con datos cuantitativos si están disponibles]_

### Limitaciones reportadas
_[Qué reconocen los autores como limitaciones]_

### Implicaciones clínicas
_[Qué significa esto para la práctica del acompañamiento]_

### Citas textuales útiles (traducidas)
_[2-3 citas directas del abstract o conclusiones que puedes usar adaptadas]_

---

## Notas del equipo
_[Espacio para notas internas sobre cómo usar este artículo en el agente]_
"""


def main():
    os.makedirs(BASE, exist_ok=True)

    for folder in FOLDERS:
        folder_path = os.path.join(BASE, folder["name"])
        os.makedirs(folder_path, exist_ok=True)

        # Crear README de carpeta
        readme_content = create_folder_readme(folder)
        with open(os.path.join(folder_path, "_RESUMEN_CARPETA.md"), "w") as f:
            f.write(readme_content)

        # Crear stub de artículo para cada artículo
        for article in folder["articles"]:
            art_content = create_article_stub(article, folder["name"])
            with open(os.path.join(folder_path, article["file"]), "w") as f:
                f.write(art_content)

        print(f"✅ {folder['name']} — {len(folder['articles'])} artículos")

    print(f"\n📁 Estructura creada en: {BASE}")
    print(f"📄 Total carpetas: {len(FOLDERS)}")
    total_articles = sum(len(f['articles']) for f in FOLDERS)
    print(f"📝 Total archivos de artículos: {total_articles}")


if __name__ == "__main__":
    main()
