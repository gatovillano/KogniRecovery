/**
 * Servicio RAG (Retrieval-Augmented Generation)
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 * Sprint 3: Pipeline RAG
 */

import OpenAI from 'openai';
import { embeddingsService, chunkingService, EmbeddingChunk } from './embedding.service.js';
import { neo4jService } from './neo4j.service.js';
import * as UserModel from '../models/user.model.js';
import { decrypt } from '../utils/encryption.js';
import { ai as aiDefaultConfig } from '../config/neo4j.js';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface RetrievedChunk {
  chunk: EmbeddingChunk;
  score: number;
  source: 'vector' | 'kg' | 'keyword';
}

export interface RAGResult {
  content: string;
  sources: string[];
  suggestions: string[];
}

export interface ChatContext {
  userId: string;
  profile: string;
  etapaCambio: string;
  sustancias: string[];
  pais: string;
  riskLevel: 'bajo' | 'medio' | 'alto' | 'critico';
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// =====================================================
// CONSTANTES
// =====================================================

// Pesos para el ensamble de resultados
const WEIGHTS = {
  vector: 0.4,
  kg: 0.4,
  keyword: 0.2,
};

// Palabras clave de riesgo crítico
const CRITICAL_KEYWORDS = [
  'suicidio', 'quitarme la vida', 'morir', 'no quiero vivir',
  'overdose', 'sobredosis', 'me voy a morir', 'matarme',
];

// Palabras clave de riesgo alto
const HIGH_RISK_KEYWORDS = [
  'no aguanto', 'no puedo más', 'mejor muerto', 'no vale la pena',
  'autolesión', 'cortarme', 'hacerme daño', 'herirme',
];

// =====================================================
// SERVICIO RAG
// =====================================================

class RAGService {
  /**
   * Obtiene el cliente de IA configurado para el usuario
   */
  private async getAIClient(userId: string) {
    try {
      const user = await UserModel.findById(userId);

      // Si el usuario tiene configuración personalizada
      if (user && user.llm_api_key) {
        const config: any = {
          apiKey: decrypt(user.llm_api_key),
        };

        if (user.llm_provider === 'openrouter') {
          config.baseURL = 'https://openrouter.ai/api/v1';
          config.defaultHeaders = {
            'HTTP-Referer': 'https://kognirecovery.com', // Opcional, para OpenRouter ranking
            'X-Title': 'KogniRecovery',
          };
        }

        return {
          client: new OpenAI(config),
          model: user.llm_model || aiDefaultConfig.modelName,
          maxTokens: aiDefaultConfig.maxTokens,
          temperature: aiDefaultConfig.temperature
        };
      }

      // Default: Usar configuración del sistema si hay API KEY global
      const systemKey = process.env.OPENAI_API_KEY || aiDefaultConfig.openaiApiKey;
      const systemProvider = process.env.LLM_PROVIDER || 'openai';
      
      if (!systemKey) {
        throw new Error('No se encontró configuración de IA para el usuario ni para el sistema.');
      }

      const systemConfig: any = {
        apiKey: systemKey,
      };

      if (systemProvider === 'openrouter') {
        systemConfig.baseURL = 'https://openrouter.ai/api/v1';
      }

      return {
        client: new OpenAI(systemConfig),
        model: aiDefaultConfig.modelName,
        maxTokens: aiDefaultConfig.maxTokens,
        temperature: aiDefaultConfig.temperature
      };
    } catch (error) {
      console.error('❌ Error al obtener el cliente de IA:', error);
      throw error;
    }
  }

  /**
   * Realiza búsqueda vectorial en Neo4j
   */
  async vectorSearch(
    query: string,
    context: ChatContext,
    limit: number = 5
  ): Promise<RetrievedChunk[]> {
    try {
      // 1. Generar embedding de la consulta con contexto
      const { embedding } = await embeddingsService.generateContextualEmbedding(query, {
        profile: context.profile,
        etapaCambio: context.etapaCambio,
        sustancias: context.sustancias,
        pais: context.pais
      });

      // 2. Ejecutar búsqueda vectorial en Neo4j
      // Nota: Usamos el índice vectorial 'chunk_vector_index'
      const cypher = `
        CALL db.index.vector.queryNodes('chunk_vector_index', $limit, $embedding)
        YIELD node, score
        RETURN node.content as content, node.source as source,
               node.sourceType as sourceType, node.metadata as metadata,
               score
      `;

      const results = await neo4jService.executeQuery<{
        content: string;
        source: string;
        sourceType: string;
        metadata: any;
        score: number;
      }>(cypher, {
        embedding,
        limit
      });

      // 3. Mapear resultados
      return results.map(r => ({
        chunk: {
          id: '', // No necesario para el prompt
          content: r.content,
          source: r.source,
          sourceType: r.sourceType as any,
          metadata: r.metadata
        },
        score: r.score,
        source: 'vector'
      }));
    } catch (error) {
      console.error('❌ Error in vector search:', error);
      return [];
    }
  }

  /**
   * Ejecuta el pipeline RAG completo
   */
  async retrieve(
    query: string,
    userContext: ChatContext,
    topK: number = 5
  ): Promise<RetrievedChunk[]> {
    try {
      // 1. Generar embedding de la consulta
      // This is no longer needed here as vectorSearch generates its own embedding
      // const queryEmbedding = await embeddingsService.generateContextualEmbedding(
      //   query,
      //   {
      //     userId: userContext.userId,
      //     profile: userContext.profile,
      //     etapaCambio: userContext.etapaCambio,
      //     sustancias: userContext.sustancias,
      //     pais: userContext.pais,
      //   }
      // );

      // 2. Búsqueda vectorial (simulada - en producción usar Pinecone/Weaviate)
      const vectorResults = await this.vectorSearch(query, userContext, topK * 2);

      // 3. Búsqueda en Knowledge Graph
      const kgResults = await this.knowledgeGraphSearch(userContext);

      // 4. Búsqueda por palabras clave
      const keywordResults = await this.keywordSearch(query, topK);

      // 5. Ensamble de resultados
      const combinedResults = this.combineResults(
        vectorResults,
        kgResults,
        keywordResults,
        userContext
      );

      // 6. Filtrar por relevancia y contexto
      return this.filterByContext(combinedResults, userContext, topK);
    } catch (error) {
      console.error('❌ Error in RAG retrieve:', error);
      return [];
    }
  }

  /**
   * Búsqueda en Knowledge Graph
   */
  private async knowledgeGraphSearch(
    userContext: ChatContext
  ): Promise<RetrievedChunk[]> {
    try {
      // Obtener contexto del usuario desde Neo4j
      const contextResults = await neo4jService.getChatbotContext(userContext.userId);

      if (!contextResults || contextResults.length === 0) {
        return [];
      }

      const contextData = contextResults[0];

      // Convertir resultados a formato de chunks
      const chunks: RetrievedChunk[] = [];

      // Agregar información del usuario
      if (contextData.u) {
        chunks.push({
          chunk: {
            id: `kg_user_${contextData.u.id}`,
            content: `Información del usuario: ${JSON.stringify(contextData.u)}`,
            source: 'knowledge_graph',
            sourceType: 'kg',
            metadata: { type: 'user_context' },
          },
          score: 0.95,
          source: 'kg',
        });
      }

      // Agregar check-ins recientes
      if (contextData.checkins_recientes && contextData.checkins_recientes.length > 0) {
        chunks.push({
          chunk: {
            id: 'kg_checkins',
            content: `Check-ins recientes: ${JSON.stringify(contextData.checkins_recientes)}`,
            source: 'knowledge_graph',
            sourceType: 'kg',
            metadata: { type: 'checkins' },
          },
          score: 0.9,
          source: 'kg',
        });
      }

      // Agregar sustancias
      if (contextData.sustancias && contextData.sustancias.length > 0) {
        chunks.push({
          chunk: {
            id: 'kg_sustancias',
            content: `Sustancias del usuario: ${JSON.stringify(contextData.sustancias)}`,
            source: 'knowledge_graph',
            sourceType: 'kg',
            metadata: { type: 'sustancias' },
          },
          score: 0.85,
          source: 'kg',
        });
      }

      return chunks;
    } catch (error) {
      console.error('❌ Error in KG search:', error);
      return [];
    }
  }

  /**
   * Búsqueda por palabras clave
   */
  private async keywordSearch(
    query: string,
    topK: number
  ): Promise<RetrievedChunk[]> {
    // Implementación básica de búsqueda por palabras clave
    // En producción, usar Elasticsearch osimilar
    const keywords = query.toLowerCase().split(/\s+/);

    // Simulación - en producción implementar con BM25
    return [];
  }

  /**
   * Combina resultados de múltiples fuentes
   */
  private combineResults(
    vectorResults: RetrievedChunk[],
    kgResults: RetrievedChunk[],
    keywordResults: RetrievedChunk[],
    userContext: ChatContext
  ): RetrievedChunk[] {
    const seen = new Map<string, RetrievedChunk>();

    // Ponderar resultados vectoriales
    for (const result of vectorResults) {
      const key = result.chunk.id;
      if (!seen.has(key) || seen.get(key)!.score < result.score * WEIGHTS.vector) {
        seen.set(key, { ...result, score: result.score * WEIGHTS.vector });
      }
    }

    // Ponderar resultados del KG
    for (const result of kgResults) {
      const key = result.chunk.id;
      if (!seen.has(key) || seen.get(key)!.score < result.score * WEIGHTS.kg) {
        seen.set(key, { ...result, score: result.score * WEIGHTS.kg });
      }
    }

    // Ponderar resultados por keywords
    for (const result of keywordResults) {
      const key = result.chunk.id;
      if (!seen.has(key) || seen.get(key)!.score < result.score * WEIGHTS.keyword) {
        seen.set(key, { ...result, score: result.score * WEIGHTS.keyword });
      }
    }

    return Array.from(seen.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Filtra resultados por contexto del usuario
   */
  private filterByContext(
    results: RetrievedChunk[],
    userContext: ChatContext,
    topK: number
  ): RetrievedChunk[] {
    return results
      .filter((result) => {
        const metadata = result.chunk.metadata;

        // Filtrar por audiencia
        if (metadata.audience && metadata.audience.length > 0) {
          const matchesAudience = metadata.audience.some((a: string) =>
            userContext.profile.toLowerCase().includes(a.toLowerCase())
          );
          if (!matchesAudience && metadata.audience[0] !== 'all') {
            return false;
          }
        }

        // Filtrar por país
        if (metadata.country && metadata.country.length > 0) {
          if (!metadata.country.includes(userContext.pais)) {
            return false;
          }
        }

        return true;
      })
      .slice(0, topK);
  }

  /**
   * Re-ranke resultados usando Cross-Encoder
   */
  async rerank(
    query: string,
    chunks: RetrievedChunk[],
    topK: number = 3
  ): Promise<RetrievedChunk[]> {
    if (chunks.length <= topK) {
      return chunks;
    }

    // Usar GPT para re-ranking con el cliente del usuario
    const { client, model } = await this.getAIClient(chunks[0].chunk.id.includes('kg') ? '' : 'system');
    // Nota: El re-ranking debería usar el cliente del sistema por estabilidad o del usuario si es necesario

    // Mejor para re-ranking usar el contexto del primer chunk o un userId global
    // Simplificado por ahora
    const scoredChunks = await Promise.all(
      chunks.map(async (chunk) => {
        const relevance = await this.computeRelevance(query, chunk.chunk.content, 'system');
        return { ...chunk, score: relevance };
      })
    );

    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Calcula relevancia usando el LLM
   */
  private async computeRelevance(query: string, chunkContent: string, userId: string = 'system'): Promise<number> {
    try {
      const { client, model } = await this.getAIClient(userId === 'system' ? '' : userId);

      const response = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Eres un evaluador de relevancia. Del 0 al 1, ¿qué tan relevante es el siguiente chunk para la consulta? Responde solo con un número.',
          },
          {
            role: 'user',
            content: `Consulta: "${query}"\n\nChunk: "${chunkContent.substring(0, 500)}"`,
          },
        ],
        max_tokens: 5,
        temperature: 0,
      });

      const score = parseFloat(response.choices[0]?.message?.content || '0');
      return isNaN(score) ? 0 : score;
    } catch (error) {
      console.error('❌ Error computing relevance:', error);
      return 0;
    }
  }

  /**
   * Analiza el riesgo del mensaje
   */
  analyzeRisk(
    message: string,
    context: ChatContext
  ): { level: 'bajo' | 'medio' | 'alto' | 'critico'; reasons: string[] } {
    const lowerMessage = message.toLowerCase();

    // Verificar crítico
    if (CRITICAL_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
      return { level: 'critico', reasons: ['Palabras clave de suicidio/sobredosis detectadas'] };
    }

    // Verificar alto
    if (HIGH_RISK_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
      return { level: 'alto', reasons: ['Palabras clave de autolesión detectadas'] };
    }

    // Verificar historial de riesgo del usuario
    if (context.riskLevel === 'alto' || context.riskLevel === 'critico') {
      return { level: 'medio', reasons: ['Usuario en seguimiento de riesgo'] };
    }

    return { level: 'bajo', reasons: [] };
  }

  /**
   * Genera respuesta usando el LLM
   */
  async generate(
    query: string,
    retrievedChunks: RetrievedChunk[],
    userContext: ChatContext,
    conversationHistory: ChatMessage[]
  ): Promise<RAGResult> {
    // Construir contexto desde los chunks recuperados
    const context = retrievedChunks
      .map((c, i) => `[${i + 1}] ${c.chunk.content}`)
      .join('\n\n');

    // Construir historial de conversación
    const history = conversationHistory
      .slice(-10)
      .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
      .join('\n');

    // Construir mensajes
    const messages: any[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(userContext.profile, userContext.etapaCambio),
      },
      {
        role: 'system',
        content: `Información de contexto:\n${context}`,
      },
    ];

    if (history) {
      messages.push({
        role: 'system',
        content: `Historial de conversación:\n${history}`,
      });
    }

    messages.push({ role: 'user', content: query });

    // Generar respuesta con el cliente del usuario
    const { client, model, maxTokens, temperature } = await this.getAIClient(userContext.userId);

    const response = await client.chat.completions.create({
      model: model,
      messages,
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: 0.9,
    });

    const content = response.choices[0]?.message?.content || '';

    // Extraer fuentes
    const sources = [...new Set(retrievedChunks.map((c) => c.chunk.source))];

    // Generar sugerencias
    const suggestions = await this.generateSuggestions(query, content, userContext.userId);

    return { content, sources, suggestions };
  }

  /**
   * Genera preguntas de seguimiento
   */
  private async generateSuggestions(query: string, response: string, userId: string = 'system'): Promise<string[]> {
    try {
      const { client, model } = await this.getAIClient(userId === 'system' ? '' : userId);

      const responseAI = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Genera 3 preguntas de seguimiento breves que el usuario podría hacer sobre el tema. Una por línea. Solo las preguntas, sin números.',
          },
          {
            role: 'user',
            content: `Consulta: ${query}\nRespuesta: ${response.substring(0, 500)}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      return (responseAI.choices[0]?.message?.content || '')
        .split('\n')
        .filter((s) => s.trim())
        .slice(0, 3);
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtiene el prompt del sistema basado en arquetipos, etapa de cambio y contexto.
   * Los perfiles de ejemplo (Lucas, Camila, etc.) se mapean a arquetipos de comportamiento.
   */
  private getSystemPrompt(profileType: string, etapaCambio: string): string {
    const basePrompt = `Eres LÚA 🌙, el asistente de acompañamiento de KogniRecovery. 
Eres empático, no juzgas y estás aquí para apoyar al usuario en su proceso de recuperación.
Respondes en español de manera clara y accesible. Tu objetivo es ser un apoyo constante, seguro y motivador.`;

    // Mapeo de perfiles de ejemplo a Arquetipos (para flexibilidad)
    const getArchetype = (type: string): string => {
      const t = type?.toLowerCase() || 'general';
      if (t.includes('lucas') || t.includes('adolescente')) return 'adolescente';
      if (t.includes('camila') || t.includes('universitario') || t.includes('joven')) return 'joven_adulto';
      if (t.includes('diego') || t.includes('profesional')) return 'profesional_adulto';
      if (t.includes('eliana') || t.includes('senior') || t.includes('mayor')) return 'senior_alcohol';
      if (t.includes('sofia') || t.includes('trauma') || t.includes('madre')) return 'trauma_care';
      if (t.includes('rodrigo') || t.includes('opioide')) return 'senior_opioides';
      if (t.includes('rosario') || t.includes('rural')) return 'rural';
      return 'general';
    };

    const arquetipo = getArchetype(profileType);

    const arquetipoPrompts: Record<string, string> = {
      adolescente: `Tu audiencia: adolescentes de 15-17 años que evalúan su relación con sustancias.
Tono: Coloquial, informal pero respetuoso. Como un "hermano mayor" o mentor joven.
Estrategias: Entrevista motivacional suave, psicoeducación sobre el cerebro adolescente (neurociencia básica), alternativas de coping rápidas (2-3 min).
Límites: Enfatiza la confidencialidad absoluta (PIN). Metas realistas: reducir es un logro. Evita lenguaje de regaño o médico.`,

      joven_adulto: `Tu audiencia: jóvenes adultos universitarios de 21-25 años preocupados por su futuro profesional.
Tono: Directo, basado en datos, nada moralizante. Como un mentor académico o profesional cercano.
Estrategias: Reducción de daños concreta, gestión del estrés académico/laboral, alertas de interacciones droga-medicamento. 
Énfasis: Rendimiento, claridad mental y futuro profesional. Usa conceptos como "consumo responsable" y "daño reducido".`,

      profesional_adulto: `Tu audiencia: adultos profesionales de 40-50 años que priorizan salud, familia y trabajo.
Tono: Sobrio, profesional, discreto. Como un asesor de salud ejecutivo.
Estrategias: Feedback objetivo con datos de salud (OMS), correlación entre consumo y métricas (sueño, energía, TA).
Énfasis: Optimización personal y bienestar familiar. Evita etiquetas estigmatizantes ("adicto", "enfermo").`,

      senior_alcohol: `Tu audiencia: adultos mayores independientes (65+ años).
Tono: Respetuoso, pausado, claro. Como una enfermera o hijo adulto responsable.
Estrategias: Prevención de caídas, detección de interacciones peligrosas, refuerzo de la autonomía ("usted decide"). 
Accesibilidad: Frases cortas, vocabulario simple y tono de seguridad.`,

      trauma_care: `Tu audiencia: personas (especialmente mujeres/madres) con historial de trauma y estresores graves.
Tono: Extremadamente cálido, validador, libre de juicio. Espacio de seguridad absoluta ("te creo", "no estás solo/a").
Estrategias: Trauma-informed care, regulación emocional inmediata (técnicas de relajación), validación de la fortaleza personal.
Privacidad: Garantiza que el usuario tiene el control total sobre lo que comparte.`,

      senior_opioides: `Tu audiencia: adultos mayores con dolor crónico y uso de analgésicos potentes.
Tono: Clínico pero amable. Como un farmacéutico o médico de cabecera de confianza.
Estrategias: Monitoreo de dosis y horarios, detección de tolerancia/abstinencia, sugerencia de alternativas no farmacológicas para el dolor.
Enfoque: Mejor manejo del dolor con máxima seguridad.`,

      rural: `Tu audiencia: personas en zonas rurales con acceso limitado a recursos y tecnología.
Tono: Simple, respetuoso, directo. Coloquial sin ser infantil ni clínico.
Estrategias: Recomendaciones prácticas de salud, conexión con recursos comunitarios simples (médico rural, grupos locales).
Accesibilidad: Mensajes breves y claros adaptados a la vida cotidiana local.`,

      general: `Tu audiencia: personas buscando apoyo en su proceso de recuperación.
Tono: Empático, profesional y compasivo.
Estrategias: Escucha activa, validación emocional y entrega de herramientas basadas en evidencia (TCC, Entrevista Motivacional).
Enfoque: Bienestar, reducción de riesgos y apoyo constante.`
    };

    const etapaPrompts: Record<string, string> = {
      precontemplacion: 'Estado: El usuario aún no reconoce el problema. Estrategia: Sembrar dudas sanas, feedback objetivo, evitar confrontación.',
      contemplacion: 'Estado: El usuario evalúa pros y contras. Estrategia: Explorar ambivalencia, balance decisional.',
      preparacion: 'Estado: El usuario planea el cambio. Estrategia: Planes de acción SMART, recursos concretos.',
      accion: 'Estado: El usuario está cambiando. Estrategia: Refuerzo positivo diario, manejo de recaídas repentinas.',
      mantencion: 'Estado: El usuario mantiene el cambio. Estrategia: Prevención de triggers, mantenimiento de hábitos saludables.',
    };

    const perfilPrompt = arquetipoPrompts[arquetipo];
    const etapaPrompt = etapaPrompts[etapaCambio] || etapaPrompts.contemplacion;

    return `${basePrompt}\n\nARQUETIPO DE USUARIO:\n${perfilPrompt}\n\nESTADO PSICOLÓGICO ACTUAL:\n${etapaPrompt}\n\nInstrucción final: Mantente siempre en tu personaje de LÚA 🌙. Si detectas riesgo inminente de vida o crisis severa, prioriza la activación del protocolo de emergencia y muestra el contacto de crisis del país del usuario.`;
  }

  /**
   * Obtiene la respuesta de crisis según el país
   */
  getCrisisResponse(pais: string): string {
    const crisisLines: Record<string, string> = {
      'AR': '135 (Atención en Adicciones), 911 (emergencias)',
      'MX': 'Línea de la Vida 800 911 2000, 911',
      'CL': '141 (Fono Vida - Prevención Suicidio), 1450 (Fono Drogas)',
      'ES': '024 (Prevención del Suicidio), 112 (emergencias)',
      'US': '988 (Suicide & Crisis Lifeline), 911',
      'CO': '123 (emergencias), 106 (Línea de la Felicidad)',
      'PE': '113 (SAMU), Opción 5 (Salud Mental)',
    };

    const line = crisisLines[pais] || '911';

    return `
⚠️ **Estás en un momento difícil y quiero ayudarte.**

Te escucho. No estás solo/a. Hay personas que pueden ayudarte ahora mismo:

**📞 Llama inmediatamente a:**
- **${line}**

**🏥 También puedes:**
- Ir a tu sala de emergencias más cercana
- Contactar a tu contacto de emergencia

**💙 Recuerda:**
- Esto es temporal
- Hay personas que quieren ayudarte
- No tienes que pasar por esto solo/a

¿Te acompaño mientras contactas a alguien? ¿O prefieres que te muestre los números de ayuda?
`.trim();
  }
}

// =====================================================
// EXPORTAR INSTANCIA
// =====================================================

export const ragService = new RAGService();
export default ragService;
