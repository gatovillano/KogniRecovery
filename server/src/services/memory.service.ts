/**
 * Memory Service - Sistema de Memoria Avanzada para el Agente NADA
 * Maneja extracción de memoria, resúmenes de conversación y recuperación contextual
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage } from '@langchain/core/messages';
import * as messageModel from '../models/message.model.js';
import * as UserModel from '../models/user.model.js';
import { decrypt } from '../utils/encryption.js';
import { ai as aiDefaultConfig } from '../config/neo4j.js';
import { neo4jService } from './neo4j.service.js';

// =====================================================
// TIPOS DE MEMORIA
// =====================================================

export const MEMORY_TYPES = {
  PREFERENCE: 'preference',
  TRIGGER: 'trigger',
  GOAL: 'goal',
  EMOTIONAL_PATTERN: 'emotional_pattern',
  COPING_STRATEGY: 'coping_strategy',
  RISK_FACTOR: 'risk_factor',
  CONVERSATION_SUMMARY: 'conversation_summary',
  RELATIONSHIP: 'relationship',
  SUBSTANCE_PATTERN: 'substance_pattern',
} as const;

// TTL en días por tipo de memoria
const MEMORY_TTL: Record<string, number> = {
  [MEMORY_TYPES.PREFERENCE]: 30,
  [MEMORY_TYPES.TRIGGER]: 90,
  [MEMORY_TYPES.GOAL]: 60,
  [MEMORY_TYPES.EMOTIONAL_PATTERN]: 14,
  [MEMORY_TYPES.COPING_STRATEGY]: 90,
  [MEMORY_TYPES.RISK_FACTOR]: 90,
  [MEMORY_TYPES.CONVERSATION_SUMMARY]: 180,
  [MEMORY_TYPES.RELATIONSHIP]: 60,
  [MEMORY_TYPES.SUBSTANCE_PATTERN]: 90,
};

// Importancia por tipo (1-10)
const MEMORY_IMPORTANCE: Record<string, number> = {
  [MEMORY_TYPES.PREFERENCE]: 5,
  [MEMORY_TYPES.TRIGGER]: 9,
  [MEMORY_TYPES.GOAL]: 7,
  [MEMORY_TYPES.EMOTIONAL_PATTERN]: 6,
  [MEMORY_TYPES.COPING_STRATEGY]: 8,
  [MEMORY_TYPES.RISK_FACTOR]: 10,
  [MEMORY_TYPES.CONVERSATION_SUMMARY]: 6,
  [MEMORY_TYPES.RELATIONSHIP]: 5,
  [MEMORY_TYPES.SUBSTANCE_PATTERN]: 9,
};

// =====================================================
// SERVICIO DE MEMORIA
// =====================================================

export class MemoryService {
  /**
   * Obtiene el LLM configurado para el usuario
   */
  private async getUserLLM(userId: string) {
    const user = await UserModel.findById(userId);

    let apiKey =
      process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || aiDefaultConfig.openaiApiKey;
    let modelName = process.env.LLM_MODEL || aiDefaultConfig.modelName || 'gpt-4o-mini';
    let provider = process.env.LLM_PROVIDER || 'openai';
    let configuration: any = {};

    if (user && user.llm_api_key) {
      apiKey = decrypt(user.llm_api_key);
      modelName = user.llm_model || modelName;
      provider = user.llm_provider || provider;
    }

    if (provider.toLowerCase() === 'openrouter') {
      configuration = {
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
        defaultHeaders: {
          'HTTP-Referer': 'https://kognirecovery.com',
          'X-Title': 'KogniRecovery',
          Authorization: `Bearer ${apiKey}`,
        },
      };
    } else if (provider.toLowerCase() !== 'openai' && process.env.LLM_BASE_URL) {
      configuration = {
        baseURL: process.env.LLM_BASE_URL,
        apiKey: apiKey,
        defaultHeaders: {
          Authorization: `Bearer ${apiKey}`,
        },
      };
    }

    if (!apiKey) {
      throw new Error('No API key configured for LLM.');
    }

    return new ChatOpenAI({
      apiKey: apiKey,
      openAIApiKey: apiKey,
      modelName: modelName as string,
      model: modelName as string,
      temperature: 0.3,
      maxTokens: 2048,
      configuration: configuration,
    });
  }

  // =====================================================
  // EXTRACCIÓN DE MEMORIA
  // =====================================================

  /**
   * Extrae múltiples tipos de memoria de un mensaje del usuario
   */
  async extractMemories(
    userId: string,
    messageContent: string,
    conversationContext?: string
  ): Promise<Array<{ type: string; key: string; value: any }>> {
    try {
      const llm = await this.getUserLLM(userId);

      const extractionPrompt = `Eres un extractor de memoria clínica especializado en adicciones y salud mental.
Analiza el mensaje del usuario y extrae TODOS los datos relevantes que encuentres.

TIPOS DE MEMORIA PERMITIDOS (usa SOLO estos tipos):
- "preference": Preferencias del usuario (nombre, cómo le gusta que le hablen, horarios, rutinas)
- "trigger": Situaciones, personas, lugares o emociones que disparan craving o consumo
- "goal": Objetivos de recuperación, metas personales, aspiraciones
- "emotional_pattern": Patrones emocionales recurrentes (ej: "siempre triste los domingos")
- "coping_strategy": Estrategias de afrontamiento que el usuario ha usado o le funcionan
- "risk_factor": Factores de riesgo identificados (entorno, personas, sustancias, comorbilidades)
- "relationship": Información sobre relaciones importantes (familia, amigos, terapeuta, sponsor)
- "substance_pattern": Patrones de consumo (sustancia, frecuencia, cantidades, contexto)

REGLAS:
1. Devuelve UN ARRAY JSON de objetos { "type": "...", "key": "...", "value": "..." }
2. Si no hay datos nuevos, devuelve []
3. El "key" debe ser descriptivo y único (ej: "trigger_fiesta_trabajo", "meta_dejar_alcohol")
4. El "value" puede ser string, número u objeto JSON
5. Incluye contexto temporal cuando el usuario lo mencione
6. NO repitas información que ya esté obvia o sea redundante

${conversationContext ? `CONTEXTO DE LA CONVERSACIÓN:\n${conversationContext}\n\n` : ''}

Mensaje del usuario: "${messageContent}"

Responde SOLO con el array JSON, sin texto adicional.`;

      const response = await llm.invoke([new SystemMessage(extractionPrompt)]);
      const contentStr = response.content.toString();
      const jsonMatch = contentStr.match(/\[.*\]/s);

      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        if (Array.isArray(extracted) && extracted.length > 0) {
          console.log(`[MEMORY] Extracted ${extracted.length} memories from message`);
          return extracted.filter((item) => item.type && item.key && item.value !== undefined);
        }
      }

      return [];
    } catch (err) {
      console.error('[MEMORY] Error extracting memories:', err);
      return [];
    }
  }

  /**
   * Persiste memorias extraídas en MySQL y Neo4j
   */
  async persistMemories(
    userId: string,
    memories: Array<{ type: string; key: string; value: any }>,
    sourceMessageId?: string
  ): Promise<void> {
    for (const memory of memories) {
      const memoryType = memory.type in MEMORY_TTL ? memory.type : MEMORY_TYPES.PREFERENCE;
      const ttl = MEMORY_TTL[memoryType] || 30;
      const importance = MEMORY_IMPORTANCE[memoryType] || 5;

      // 1. Persistir en MySQL
      try {
        await messageModel.saveContextHistory(
          userId,
          memoryType,
          memory.key,
          memory.value,
          sourceMessageId,
          importance
        );
        console.log(
          `[MEMORY] Saved ${memoryType}:${memory.key} (TTL: ${ttl}d, importance: ${importance})`
        );
      } catch (err) {
        console.error(`[MEMORY] Error saving to MySQL:`, err);
      }

      // 2. Persistir en Neo4j
      try {
        const relationshipMap: Record<string, string> = {
          [MEMORY_TYPES.PREFERENCE]: 'TIENE_PREFERENCIA',
          [MEMORY_TYPES.TRIGGER]: 'TIENE_TRIGGER',
          [MEMORY_TYPES.GOAL]: 'TIENE_OBJETIVO',
          [MEMORY_TYPES.EMOTIONAL_PATTERN]: 'TIENE_PATRON_EMOCIONAL',
          [MEMORY_TYPES.COPING_STRATEGY]: 'USA_ESTRATEGIA',
          [MEMORY_TYPES.RISK_FACTOR]: 'TIENE_FACTOR_RIESGO',
          [MEMORY_TYPES.RELATIONSHIP]: 'TIENE_RELACION',
          [MEMORY_TYPES.SUBSTANCE_PATTERN]: 'TIENE_PATRON_CONSUMO',
        };

        const relationship = relationshipMap[memoryType] || 'TIENE_ATRIBUTO';

        console.log(
          `[MEMORY-NEO4J] Guardando atributo para usuario ${userId}: tipo=${memoryType}, key=${memory.key}, relationship=${relationship}`
        );

        const query = `
          MATCH (u:Usuario {id: $userId})
          MERGE (attr:Atributo {nombre: $key, tipo: $type})
          SET attr.valor = $value, attr.actualizado = datetime(), attr.importancia = $importance
          MERGE (u)-[r:${relationship}]->(attr)
          SET r.actualizado = datetime()
        `;

        await neo4jService.executeWrite(query, {
          userId,
          key: memory.key,
          type: memoryType,
          value: JSON.stringify(memory.value),
          importance,
        });

        console.log(`[MEMORY-NEO4J] ✓ Atributo guardado exitosamente`);
      } catch (err) {
        console.error(`[MEMORY-NEO4J] ❌ Error guardando atributo:`, err);
      }
    }
  }

  // =====================================================
  // RESUMEN DE CONVERSACIÓN
  // =====================================================

  /**
   * Genera un resumen de una conversación a partir de sus mensajes
   */
  async generateConversationSummary(
    userId: string,
    conversationId: string
  ): Promise<string | null> {
    try {
      const messages = await messageModel.getMessageHistory(conversationId, 30);

      if (messages.length < 4) return null;

      const conversationText = messages
        .map((m) => `${m.role === 'user' ? 'Usuario' : 'LÚA'}: ${m.content}`)
        .join('\n');

      const llm = await this.getUserLLM(userId);

      const summaryPrompt = `Eres un analista clínico. Genera un resumen conciso de esta conversación entre un usuario y LÚA (asistente de recuperación de adicciones).

El resumen debe capturar:
1. Temas principales discutidos
2. Estado emocional del usuario
3. Eventos significativos o triggers mencionados
4. Estrategias o herramientas sugeridas
5. Progreso o retrocesos observados
6. Acuerdos o compromisos establecidos

Máximo 200 palabras. Tono clínico, objetivo.

Conversación:
${conversationText}

Responde SOLO con el resumen, sin preámbulos.`;

      const response = await llm.invoke([new SystemMessage(summaryPrompt)]);
      const summary = response.content.toString().trim();

      if (summary) {
        // Guardar el resumen en context_history
        await messageModel.saveContextHistory(
          userId,
          MEMORY_TYPES.CONVERSATION_SUMMARY,
          `summary_${conversationId}`,
          {
            summary,
            message_count: messages.length,
            conversation_id: conversationId,
            generated_at: new Date().toISOString(),
          },
          undefined,
          MEMORY_IMPORTANCE[MEMORY_TYPES.CONVERSATION_SUMMARY]
        );

        console.log(`[MEMORY] Generated conversation summary for ${conversationId}`);
        return summary;
      }

      return null;
    } catch (err) {
      console.error('[MEMORY] Error generating summary:', err);
      return null;
    }
  }

  /**
   * Obtiene el resumen más reciente de una conversación
   */
  async getConversationSummary(userId: string, conversationId: string): Promise<string | null> {
    try {
      const history = await messageModel.getContextHistory(
        userId,
        MEMORY_TYPES.CONVERSATION_SUMMARY
      );
      const summary = history.find((h) => h.key === `summary_${conversationId}`);
      return summary?.value?.summary || null;
    } catch (err) {
      console.error('[MEMORY] Error getting summary:', err);
      return null;
    }
  }

  /**
   * Genera un resumen acumulativo de TODAS las conversaciones previas del usuario
   */
  async generateLongTermSummary(userId: string): Promise<string | null> {
    try {
      const summaries = await messageModel.getContextHistory(
        userId,
        MEMORY_TYPES.CONVERSATION_SUMMARY
      );

      if (summaries.length === 0) return null;

      const allSummaries = summaries
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((s) => `- ${s.value?.summary || ''}`)
        .join('\n');

      const llm = await this.getUserLLM(userId);

      const metaPrompt = `Eres un analista clínico. Sintetiza estos resúmenes de conversaciones previas con un paciente en recuperación de adicciones en un ÚNICO resumen consolidado.

El resumen debe ser:
- Conciso (máximo 300 palabras)
- Organizado por temas/patrones recurrentes
- Enfocado en información clínicamente relevante para continuidad terapéutica
- Incluir evolución del paciente a lo largo del tiempo

Resúmenes de conversaciones:
${allSummaries}

Responde SOLO con el resumen consolidado.`;

      const response = await llm.invoke([new SystemMessage(metaPrompt)]);
      const consolidated = response.content.toString().trim();

      if (consolidated) {
        // Guardar como memoria de largo plazo
        await messageModel.saveContextHistory(
          userId,
          MEMORY_TYPES.CONVERSATION_SUMMARY,
          'long_term_summary',
          {
            summary: consolidated,
            source_conversations: summaries.length,
            generated_at: new Date().toISOString(),
          },
          undefined,
          MEMORY_IMPORTANCE[MEMORY_TYPES.CONVERSATION_SUMMARY]
        );

        console.log(`[MEMORY] Generated long-term summary from ${summaries.length} conversations`);
        return consolidated;
      }

      return null;
    } catch (err) {
      console.error('[MEMORY] Error generating long-term summary:', err);
      return null;
    }
  }

  // =====================================================
  // RECUPERACIÓN DE MEMORIA
  // =====================================================

  /**
   * Recupera TODA la memoria relevante del usuario para inyectar en el prompt
   */
  async retrieveMemoryContext(userId: string): Promise<string> {
    try {
      const sections: string[] = [];

      // 1. Preferencias del usuario
      const preferences = await messageModel.getContextHistory(userId, MEMORY_TYPES.PREFERENCE);
      if (preferences.length > 0) {
        const prefsText = preferences
          .map((p) => `  - ${p.key}: ${JSON.stringify(p.value)}`)
          .join('\n');
        sections.push(`**Preferencias del usuario:**\n${prefsText}`);
      }

      // 2. Triggers identificados
      const triggers = await messageModel.getContextHistory(userId, MEMORY_TYPES.TRIGGER);
      if (triggers.length > 0) {
        const triggersText = triggers
          .map((t) => `  - ${t.key}: ${JSON.stringify(t.value)}`)
          .join('\n');
        sections.push(`**Triggers conocidos:**\n${triggersText}`);
      }

      // 3. Objetivos del usuario
      const goals = await messageModel.getContextHistory(userId, MEMORY_TYPES.GOAL);
      if (goals.length > 0) {
        const goalsText = goals.map((g) => `  - ${g.key}: ${JSON.stringify(g.value)}`).join('\n');
        sections.push(`**Objetivos y metas:**\n${goalsText}`);
      }

      // 4. Patrones emocionales
      const emotionalPatterns = await messageModel.getContextHistory(
        userId,
        MEMORY_TYPES.EMOTIONAL_PATTERN
      );
      if (emotionalPatterns.length > 0) {
        const patternsText = emotionalPatterns
          .map((e) => `  - ${e.key}: ${JSON.stringify(e.value)}`)
          .join('\n');
        sections.push(`**Patrones emocionales:**\n${patternsText}`);
      }

      // 5. Estrategias de afrontamiento
      const copingStrategies = await messageModel.getContextHistory(
        userId,
        MEMORY_TYPES.COPING_STRATEGY
      );
      if (copingStrategies.length > 0) {
        const copingText = copingStrategies
          .map((c) => `  - ${c.key}: ${JSON.stringify(c.value)}`)
          .join('\n');
        sections.push(`**Estrategias de afrontamiento efectivas:**\n${copingText}`);
      }

      // 6. Factores de riesgo
      const riskFactors = await messageModel.getContextHistory(userId, MEMORY_TYPES.RISK_FACTOR);
      if (riskFactors.length > 0) {
        const riskText = riskFactors
          .map((r) => `  - ${r.key}: ${JSON.stringify(r.value)}`)
          .join('\n');
        sections.push(`**Factores de riesgo:**\n${riskText}`);
      }

      // 7. Patrones de sustancia
      const substancePatterns = await messageModel.getContextHistory(
        userId,
        MEMORY_TYPES.SUBSTANCE_PATTERN
      );
      if (substancePatterns.length > 0) {
        const substanceText = substancePatterns
          .map((s) => `  - ${s.key}: ${JSON.stringify(s.value)}`)
          .join('\n');
        sections.push(`**Patrones de consumo:**\n${substanceText}`);
      }

      // 8. Relaciones importantes
      const relationships = await messageModel.getContextHistory(userId, MEMORY_TYPES.RELATIONSHIP);
      if (relationships.length > 0) {
        const relText = relationships
          .map((r) => `  - ${r.key}: ${JSON.stringify(r.value)}`)
          .join('\n');
        sections.push(`**Relaciones importantes:**\n${relText}`);
      }

      // 9. Resumen de conversaciones previas
      const summaries = await messageModel.getContextHistory(
        userId,
        MEMORY_TYPES.CONVERSATION_SUMMARY
      );
      const longTermSummary = summaries.find((s) => s.key === 'long_term_summary');
      if (longTermSummary?.value?.summary) {
        sections.push(`**Resumen de conversaciones previas:**\n  ${longTermSummary.value.summary}`);
      }

      if (sections.length === 0) {
        return 'No hay registros históricos de memoria para este usuario aún.';
      }

      return sections.join('\n\n');
    } catch (err) {
      console.error('[MEMORY] Error retrieving memory context:', err);
      return 'Error al recuperar memoria del usuario.';
    }
  }

  // =====================================================
  // PIPELINE COMPLETO DE MEMORIA POR TURNO
  // =====================================================

  /**
   * Ejecuta el pipeline completo de memoria para un turno de conversación:
   * 1. Extrae memorias del mensaje
   * 2. Persiste las memorias
   * 3. Genera resumen si corresponde
   * 4. Retorna contexto de memoria para el prompt
   */
  async processTurn(
    userId: string,
    conversationId: string,
    userMessage: string,
    sourceMessageId?: string,
    messageCount?: number
  ): Promise<string> {
    // 1. Extraer memorias del mensaje del usuario
    const memories = await this.extractMemories(userId, userMessage);

    // 2. Persistir memorias extraídas
    if (memories.length > 0) {
      await this.persistMemories(userId, memories, sourceMessageId);
    }

    // 3. Generar resumen de conversación cada 10 mensajes
    if (messageCount && messageCount % 10 === 0) {
      await this.generateConversationSummary(userId, conversationId);
    }

    // 4. Recuperar contexto de memoria para el prompt
    return this.retrieveMemoryContext(userId);
  }

  // =====================================================
  // LIMPIEZA DE MEMORIAS EXPIRADAS
  // =====================================================

  /**
   * Limpia memorias expiradas (debe ejecutarse periódicamente)
   */
  async cleanExpiredMemories(): Promise<number> {
    try {
      const { query } = await import('../config/database.js');

      // Primero actualizar expires_at para memorias sin TTL asignado
      for (const [memoryType, ttlDays] of Object.entries(MEMORY_TTL)) {
        await query(
          `UPDATE context_history 
           SET expires_at = created_at + INTERVAL '${ttlDays} days'
           WHERE context_type = $1 AND expires_at IS NULL`,
          [memoryType]
        );
      }

      // Eliminar memorias expiradas
      const result = await query(
        `DELETE FROM context_history 
         WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP`
      );

      const deleted = result.rowCount ?? 0;
      if (deleted > 0) {
        console.log(`[MEMORY] Cleaned ${deleted} expired memories`);
      }
      return deleted;
    } catch (err) {
      console.error('[MEMORY] Error cleaning expired memories:', err);
      return 0;
    }
  }
}

export const memoryService = new MemoryService();
