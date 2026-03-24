// =====================================================
// KogniRecovery - Neo4j Schema Initialization
// Sprint 3: Knowledge Graph
// =====================================================

// =====================================================
// CREAR CONSTRAINTS (Indices únicos)
// =====================================================

// Constraints para nodos principales
CREATE CONSTRAINT usuario_id_unique IF NOT EXISTS
FOR (u:Usuario) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT sustancia_nombre_unique IF NOT EXISTS
FOR (s:Sustancia) REQUIRE s.nombre IS UNIQUE;

CREATE CONSTRAINT medicamento_nombre_unique IF NOT EXISTS
FOR (m:Medicamento) REQUIRE m.nombre IS UNIQUE;

CREATE CONSTRAINT recurso_id_unique IF NOT EXISTS
FOR (r:Recurso) REQUIRE r.id IS UNIQUE;

CREATE CONSTRAINT conversacion_id_unique IF NOT EXISTS
FOR (c:Conversacion) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT alerta_id_unique IF NOT EXISTS
FOR (a:Alerta) REQUIRE a.id IS UNIQUE;

CREATE CONSTRAINT etiqueta_nombre_unique IF NOT EXISTS
FOR (e:Etiqueta) REQUIRE e.nombre IS UNIQUE;

CREATE CONSTRAINT perfil_id_unique IF NOT EXISTS
FOR (p:Perfil) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT mensaje_id_unique IF NOT EXISTS
FOR (m:Mensaje) REQUIRE m.id IS UNIQUE;

CREATE CONSTRAINT checkin_id_unique IF NOT EXISTS
FOR (c:CheckIn) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT craving_id_unique IF NOT EXISTS
FOR (c:Craving) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT contacto_id_unique IF NOT EXISTS
FOR (c:Contacto) REQUIRE c.id IS UNIQUE;

// =====================================================
// CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
// =====================================================

// Índices para búsquedas frecuentes
CREATE INDEX usuario_pais IF NOT EXISTS FOR (u:Usuario) ON (u.pais);
CREATE INDEX usuario_etapa_cambio IF NOT EXISTS FOR (u:Usuario) ON (u.etapa_cambio);
CREATE INDEX usuario_riesgo IF NOT EXISTS FOR (u:Usuario) ON (u.riesgo);
CREATE INDEX usuario_estado IF NOT EXISTS FOR (u:Usuario) ON (u.estado);

CREATE INDEX checkin_fecha IF NOT EXISTS FOR (c:CheckIn) ON (c.fecha);
CREATE INDEX checkin_consumo IF NOT EXISTS FOR (c:CheckIn) ON (c.consumo);

CREATE INDEX craving_fecha IF NOT EXISTS FOR (c:Craving) ON (c.fecha);
CREATE INDEX craving_intensidad IF NOT EXISTS FOR (c:Craving) ON (c.intensidad);

CREATE INDEX recurso_tipo IF NOT EXISTS FOR (r:Recurso) ON (r.tipo);
CREATE INDEX recurso_paises IF NOT EXISTS FOR (r:Recurso) ON (r.paises);

CREATE INDEX alerta_severidad IF NOT EXISTS FOR (a:Alerta) ON (a.severidad);
CREATE INDEX alerta_reconocida IF NOT EXISTS FOR (a:Alerta) ON (a.reconocida);

CREATE INDEX mensaje_fecha IF NOT EXISTS FOR (m:Mensaje) ON (m.fecha);
CREATE INDEX mensaje_role IF NOT EXISTS FOR (m:Mensaje) ON (m.role);

CREATE INDEX interaccion_severidad IF NOT EXISTS
FOR ()-[i:INTERACTUA_CON]->() ON (i.severidad);

// =====================================================
// CREAR NODOS BASE: SUSTANCIAS
// =====================================================

// Alcohol
CREATE (s:Sustancia {
  id: 'sustancia_alcohol',
  nombre: 'alcohol',
  nombre_comercial: ['Cerveza', 'Vino', 'Whisky', 'Ron', 'Vodka', 'Tequila'],
  categoria: 'alcohol',
  riesgo_abstinencia: 'moderado',
  efectos: ['Euforia inicial', 'Sedación', 'Pérdida de coordinación', 'Depresión'],
  interacciones_conocidas: ['benzodiacepina', 'opioides', 'antidepresivos']
});

// Opioides
CREATE (s:Sustancia {
  id: 'sustancia_opioides',
  nombre: 'opioide',
  nombre_comercial: ['Morfina', 'Oxicodona', 'Heroína', 'Fentanilo', 'Tramadol'],
  categoria: 'opioide',
  riesgo_abstinencia: 'severo',
  efectos: ['Euforia', 'Sedación', 'Analgesia', 'Depresión respiratoria'],
  interacciones_conocidas: ['alcohol', 'benzodiacepina', 'sedantes']
});

// Cocaína
CREATE (s:Sustancia {
  id: 'sustancia_cocaina',
  nombre: 'cocaína',
  nombre_comercial: ['Crack', 'Base libre'],
  categoria: 'estimulante',
  riesgo_abstinencia: 'moderado',
  efectos: ['Euforia', 'Aumento de energía', 'Hipertensión', 'Anorexia'],
  interacciones_conocidas: ['alcohol', 'estimulantes']
});

// Metanfetamina
CREATE (s:Sustancia {
  id: 'sustancia_metanfetamina',
  nombre: 'metanfetamina',
  nombre_comercial: ['Crystal', 'Ice', 'Speed'],
  categoria: 'estimulante',
  riesgo_abstinencia: 'moderado',
  efectos: ['Euforia', 'Hiperactividad', 'Insomnio', 'Psicosis'],
  interacciones_conocidas: ['alcohol']
});

// Cannabis
CREATE (s:Sustancia {
  id: 'sustancia_cannabis',
  nombre: 'cannabis',
  nombre_comercial: ['Marihuana', 'Hashish', 'Aceites'],
  categoria: 'cannabis',
  riesgo_abstinencia: 'leve',
  efectos: ['Relajación', 'Euforia', 'Alteración perceptual', 'Hambre'],
  interacciones_conocidas: ['sedantes', 'anticoagulantes']
});

// Benzodiacepinas (como sustancia de abuso)
CREATE (s:Sustancia {
  id: 'sustancia_benzodiacepina',
  nombre: 'benzodiacepina',
  nombre_comercial: ['Valium', 'Xanax', 'Ativan', 'Klonopin'],
  categoria: 'benzodiacepina',
  riesgo_abstinencia: 'severo',
  efectos: ['Sedación', 'Ansiolisis', 'Relajación muscular', 'Amnesia'],
  interacciones_conocidas: ['alcohol', 'opioides', 'opioide']
});

// =====================================================
// CREAR NODOS BASE: MEDICAMENTOS
// =====================================================

// Analgésicos opioides
CREATE (m:Medicamento {
  id: 'medicamento_oxicodona',
  nombre: 'oxicodona',
  principio_activo: 'oxicodona',
  categoria: 'analgesico',
  interacciones: ['alcohol', 'benzodiacepina', 'sedantes'],
  advertencias: ['Riesgo de dependencia', 'No combinar con alcohol'],
  requiere_receta: true
});

CREATE (m:Medicamento {
  id: 'medicamento_tramadol',
  nombre: 'tramadol',
  principio_activo: 'tramadol',
  categoria: 'analgesico',
  interacciones: ['alcohol', 'benzodiacepina'],
  advertencias: ['Riesgo de convulsiones', 'No combinar con alcohol'],
  requiere_receta: true
});

CREATE (m:Medicamento {
  id: 'medicamento_metadona',
  nombre: 'metadona',
  principio_activo: 'metadona',
  categoria: 'analgesico',
  interacciones: ['alcohol', 'benzodiacepina'],
  advertencias: ['Riesgo de depresión respiratoria'],
  requiere_receta: true
});

// Ansiolíticos
CREATE (m:Medicamento {
  id: 'medicamento_benzodiacepina',
  nombre: 'benzodiacepina',
  principio_activo: 'benzodiacepina',
  categoria: 'ansiolitico',
  interacciones: ['alcohol', 'opioide', 'opioides'],
  advertencias: ['Riesgo de dependencia', 'No combinar con alcohol'],
  requiere_receta: true
});

// Antidepresivos
CREATE (m:Medicamento {
  id: 'medicamento_antidepresivo',
  nombre: 'antidepresivo',
  principio_activo: 'antidepresivo',
  categoria: 'antidepresivo',
  interacciones: ['alcohol'],
  advertencias: ['Potencia efectos sedantes del alcohol'],
  requiere_receta: true
});

// Anticoagulantes
CREATE (m:Medicamento {
  id: 'medicamento_warfarina',
  nombre: 'warfarina',
  principio_activo: 'warfarina',
  categoria: 'anticoagulante',
  interacciones: ['alcohol', 'cannabis'],
  advertencias: ['Riesgo de sangrado', 'Monitoreo de INR'],
  requiere_receta: true
});

// Analgésicos comunes
CREATE (m:Medicamento {
  id: 'medicamento_paracetamol',
  nombre: 'paracetamol',
  principio_activo: 'paracetamol',
  categoria: 'analgesico',
  interacciones: ['alcohol'],
  advertencias: ['Riesgo de daño hepático con alcohol'],
  requiere_receta: false
});

CREATE (m:Medicamento {
  id: 'medicamento_ibuprofeno',
  nombre: 'ibuprofeno',
  principio_activo: 'ibuprofeno',
  categoria: 'analgesico',
  interacciones: ['alcohol'],
  advertencias: ['Riesgo de irritación gástrica'],
  requiere_receta: false
});

// =====================================================
// CREAR RELACIONES DE INTERACCIÓN
// =====================================================

// Interacciones peligrosas alcohol-medicamentos
MATCH (s:Sustancia {nombre: 'alcohol'})
MATCH (m:Medicamento {nombre: 'oxicodona'})
CREATE (s)-[:INTERACTUA_CON {
  severidad: 10,
  riesgo: 'potencialmente letal',
  descripcion: 'La combinación puede causar depresión respiratoria severa y muerte',
  mecanismo: 'Efecto sinérgico sobre el sistema nervioso central',
  sintomas: ['respiración lenta', 'pérdida de conciencia', 'piel fría'],
  recomendaciones: ['Evitar completamente', 'Llamar a emergencias si hay síntomas']
}]->(m);

MATCH (s:Sustancia {nombre: 'alcohol'})
MATCH (m:Medicamento {nombre: 'benzodiacepina'})
CREATE (s)-[:INTERACTUA_CON {
  severidad: 9,
  riesgo: 'potencialmente letal',
  descripcion: 'Aumenta el riesgo de depresión respiratoria y muerte',
  mecanismo: 'Efecto aditivo sobre receptores GABA',
  sintomas: ['sedación extrema', 'confusión', 'coma'],
  recomendaciones: ['Evitar completamente', 'No conducir']
}]->(m);

MATCH (s:Sustancia {nombre: 'alcohol'})
MATCH (m:Medicamento {nombre: 'paracetamol'})
CREATE (s)-[:INTERACTUA_CON {
  severidad: 5,
  riesgo: 'moderada',
  descripcion: 'Aumenta el riesgo de daño hepático',
  mecanismo: 'Metabolismo competitivo',
  sintomas: ['náuseas', 'dolor abdominal', 'ictericia'],
  recomendaciones: ['Dosis máxima limitada', 'Evitar binge drinking']
}]->(m);

MATCH (s:Sustancia {nombre: 'alcohol'})
MATCH (m:Medicamento {nombre: 'warfarina'})
CREATE (s)-[:INTERACTUA_CON {
  severidad: 8,
  riesgo: 'peligrosa',
  descripcion: 'Aumenta el riesgo de sangrado',
  mecanismo: 'Altera metabolismo de warfarina',
  sintomas: ['hematomas', 'sangrado de encías', 'heces oscuras'],
  recomendaciones: ['Evitar o limitar alcohol', 'Monitoreo de INR frecuente']
}]->(m);

// Interacciones cocaína-alcohol
MATCH (s:Sustancia {nombre: 'cocaína'})
MATCH (m:Medicamento {nombre: 'alcohol'})
CREATE (s)-[:INTERACTUA_CON {
  severidad: 7,
  riesgo: 'peligrosa',
  descripcion: 'Formación de cocaetileno, metabolito cardiotóxico',
  mecanismo: 'Metabolismo hepático competitivo',
  sintomas: ['dolor torácico', 'arritmia', 'muerte súbita'],
  recomendaciones: ['Evitar combinación', 'No mezclar en misma sesión']
}]->(m);

// Interacciones metanfetamina-alcohol
MATCH (s:Sustancia {nombre: 'metanfetamina'})
MATCH (m:Medicamento {nombre: 'alcohol'})
CREATE (s)-[:INTERACTUA_CON {
  severidad: 7,
  riesgo: 'peligrosa',
  descripcion: 'Efectos contrapuestos pueden llevar a sobredosis inadvertida',
  mecanismo: 'Deshidrogenación del alcohol',
  sintomas: ['náuseas', 'vómitos', 'mareo', 'psicosis'],
  recomendaciones: ['Evitar combinación', 'Esperar mínimo 6 horas']
}]->(m);

// Interacciones cannabis-warfarina
MATCH (s:Sustancia {nombre: 'cannabis'})
MATCH (m:Medicamento {nombre: 'warfarina'})
CREATE (s)-[:INTERACTUA_CON {
  severidad: 6,
  riesgo: 'moderada',
  descripcion: 'Puede aumentar el efecto anticoagulante',
  mecanismo: 'Inhibición de enzimas hepáticas',
  sintomas: ['aumento de hematomas', 'sangrado'],
  recomendaciones: ['Monitoreo de INR', 'Informar al médico']
}]->(m);

// Interacciones benzodiazepina-alcohol
MATCH (s:Sustancia {nombre: 'benzodiacepina'})
MATCH (m:Medicamento {nombre: 'alcohol'})
CREATE (s)-[:INTERACTUA_CON {
  severidad: 9,
  riesgo: 'potencialmente letal',
  descripcion: 'Efecto sedante相加 extremadamente peligroso',
  mecanismo: 'Efecto aditivo sobre receptors GABA',
  sintomas: ['sedación extrema', 'depresión respiratoria', 'muerte'],
  recomendaciones: ['Evitar completamente']
}]->(m);

// Interacciones benzodiazepina-metadona
MATCH (s:Sustancia {nombre: 'benzodiacepina'})
MATCH (m:Medicamento {nombre: 'metadona'})
CREATE (s)-[:INTERACTUA_CON {
  severidad: 9,
  riesgo: 'potencialmente letal',
  descripcion: 'Riesgo elevado de muerte por depresión respiratoria',
  mecanismo: 'Efecto sinérgico sobre SNC',
  sintomas: ['mareo', 'confusión', 'depresión respiratoria'],
  recomendaciones: ['Evitar si es posible', 'Solo bajo supervisión médica']
}]->(m);

// Interacciones benzodiazepina-oxicodona
MATCH (s:Sustancia {nombre: 'benzodiacepina'})
MATCH (m:Medicamento {nombre: 'oxicodona'})
CREATE (s)-[:INTERACTUA_CON {
  severidad: 10,
  riesgo: 'potencialmente letal',
  descripcion: 'Riesgo extremo de depresión respiratoria y muerte',
  mecanismo: 'Efecto sinérgico sobre SNC',
  sintomas: ['respiración lenta', 'pérdida de conciencia', 'muerte'],
  recomendaciones: ['Evitar combinación']
}]->(m);

// =====================================================
// CREAR INTERACCIONES SUSTANCIA-SUSTANCIA
// =====================================================

MATCH (s1:Sustancia {nombre: 'alcohol'})
MATCH (s2:Sustancia {nombre: 'opioide'})
CREATE (s1)-[:INTERACTUA_CON {
  severidad: 10,
  riesgo: 'potencialmente letal',
  descripcion: 'Combinación extremadamente peligrosa',
  mecanismo: 'Efecto sinérgico',
  recomendaciones: ['Evitar completamente']
}]->(s2);

MATCH (s1:Sustancia {nombre: 'cocaína'})
MATCH (s2:Sustancia {nombre: 'metanfetamina'})
CREATE (s1)-[:INTERACTUA_CON {
  severidad: 8,
  riesgo: 'peligrosa',
  descripcion: 'Riesgo de crisis cardíacas',
  mecanismo: 'Estimulación cardiovascular excesiva',
  recomendaciones: ['Evitar combinación']
}]->(s2);

// =====================================================
// CREAR NODOS BASE: RECURSOS
// =====================================================

// Líneas de crisis por país
CREATE (r:Recurso {
  id: 'recurso_crisis_ar',
  titulo: 'Línea de Atención en Adicciones - Argentina',
  tipo: 'linea_crisis',
  url: 'tel:135',
  paises: ['AR'],
  etiquetas: ['adicciones', 'ayuda', 'emergencia'],
  contenido_resumen: 'Línea gratuita de atención en adicciones'
});

CREATE (r:Recurso {
  id: 'recurso_crisis_cl',
  titulo: 'Línea de Atención en Adicciones - Chile',
  tipo: 'linea_crisis',
  url: 'tel:1450',
  paises: ['CL'],
  etiquetas: ['adicciones', 'ayuda', 'emergencia'],
  contenido_resumen: 'Línea gratuita de atención en adicciones'
});

CREATE (r:Recurso {
  id: 'recurso_crisis_mx',
  titulo: 'Línea de la Vida - México',
  tipo: 'linea_crisis',
  url: 'tel:8009112000',
  paises: ['MX'],
  etiquetas: ['suicidio', 'ayuda', 'emergencia'],
  contenido_resumen: 'Línea de crisis 24 horas'
});

CREATE (r:Recurso {
  id: 'recurso_crisis_es',
  tel: 'tel:024',
  titulo: 'Teléfono de Atención al Suicidio - España',
  tipo: 'linea_crisis',
  url: '024',
  paises: ['ES'],
  etiquetas: ['suicidio', 'ayuda', 'emergencia'],
  contenido_resumen: 'Línea gratuita de atención al suicidio'
});

CREATE (r:Recurso {
  id: 'recurso_crisis_us',
  titulo: 'Suicide & Crisis Lifeline - USA',
  tipo: 'linea_crisis',
  url: 'tel:988',
  paises: ['US'],
  etiquetas: ['suicidio', 'ayuda', 'emergencia'],
  contenido_resumen: 'Línea nacional de crisis 988'
});

// Grupos de apoyo
CREATE (r:Recurso {
  id: 'recurso_aa',
  titulo: 'Alcohólicos Anónimos',
  tipo: 'grupo_apoyo',
  url: 'https://www.aa.org/',
  paises: null,
  etiquetas: ['alcohol', 'grupo', 'apoyo', '12_pasos'],
  contenido_resumen: 'Grupo de apoyo para personas con problemas de alcohol'
});

CREATE (r:Recurso {
  id: 'recurso_na',
  titulo: 'Narcóticos Anónimos',
  tipo: 'grupo_apoyo',
  url: 'https://www.na.org/',
  paises: null,
  etiquetas: ['drogas', 'grupo', 'apoyo', '12_pasos'],
  contenido_resumen: 'Grupo de apoyo para personas con problemas de drogas'
});

// Artículos educativos
CREATE (r:Recurso {
  id: 'recurso_efectos_alcohol',
  titulo: 'Efectos del alcohol en el cuerpo',
  tipo: 'articulo',
  url: 'https://www.niaaa.nih.gov/',
  paises: null,
  etiquetas: ['alcohol', 'educativo', 'salud'],
  contenido_resumen: 'Información sobre los efectos del alcohol en la salud'
});

CREATE (r:Recurso {
  id: 'recurso_tecnica_mindfulness',
  titulo: 'Técnicas de Mindfulness para la recuperación',
  tipo: 'video',
  url: 'https://mindfulness.com/',
  paises: null,
  etiquetas: ['mindfulness', 'tecnica', 'bienestar', 'video'],
  contenido_resumen: 'Videos de meditación y mindfulness'
});

// =====================================================
// CREAR NODOS BASE: ETIQUETAS
// =====================================================

CREATE (e:Etiqueta {nombre: 'ansiedad'});
CREATE (e:Etiqueta {nombre: 'depresión'});
CREATE (e:Etiqueta {nombre: 'estrés'});
CREATE (e:Etiqueta {nombre: 'enojo'});
CREATE (e:Etiqueta {nombre: 'tristeza'});
CREATE (e:Etiqueta {nombre: 'felicidad'});
CREATE (e:Etiqueta {nombre: 'aislamiento'});
CREATE (e:Etiqueta {nombre: 'aburrimiento'});
CREATE (e:Etiqueta {nombre: 'presión social'});
CREATE (e:Etiqueta {nombre: 'conflictos'});
CREATE (e:Etiqueta {nombre: 'problemas laborales'});
CREATE (e:Etiqueta {nombre: 'problemas familiares'});
CREATE (e:Etiqueta {nombre: 'problemas de pareja'});
CREATE (e:Etiqueta {nombre: 'fin de semana'});
CREATE (e:Etiqueta {nombre: 'fiesta'});
CREATE (e:Etiqueta {nombre: 'trabajo'});
CREATE (e:Etiqueta {nombre: 'celebración'});

// =====================================================
// MOSTRAR RESUMEN
// =====================================================

RETURN 'Schema de Neo4j inicializado correctamente' AS mensaje,
  count((:Usuario)) AS usuarios,
  count((:Sustancia)) AS sustancias,
  count((:Medicamento)) AS medicamentos,
  count((:Recurso)) AS recursos,
  count((:Etiqueta)) AS etiquetas;
