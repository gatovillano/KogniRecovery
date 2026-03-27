/**
 * Modelo de Mensajes del Chatbot
 * Consultas SQL para la tabla messages
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { query, queryWithTransaction } from '../config/database.js';

// =====================================================
// INTERFACES
// =====================================================

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  tokens_used?: number;
  active_scenario?: string;
  content_filter_passed: boolean;
  inappropriate_content_flags?: string[];
  resources_included?: any[];
  recommended_actions?: any[];
  created_at: Date;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  attachment_type: string;
  title?: string;
  description?: string;
  url?: string;
  content?: any;
  created_at: Date;
}

export interface MessageIntent {
  id: string;
  message_id: string;
  user_id: string;
  intent: string;
  confidence?: number;
  entities?: any;
  emotion_detected?: string;
  emotion_confidence?: number;
  suggested_scenario?: string;
  is_crisis_indicator?: boolean;
  is_relapse_risk?: boolean;
  created_at: Date;
}

export interface QuickResponse {
  id: string;
  trigger_phrase: string;
  response_text: string;
  category: string;
  applicable_scenarios?: string[];
  priority?: number;
  is_active?: boolean;
  language?: string;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// MENSAJES
// =====================================================

/**
 * Crear un nuevo mensaje
 */
export const createMessage = async (
  conversationId: string,
  userId: string,
  data: Partial<Message>
): Promise<Message> => {
  const sql = `
    INSERT INTO messages (conversation_id, user_id, role, content, metadata,
      tokens_used, active_scenario, content_filter_passed, inappropriate_content_flags,
      resources_included, recommended_actions)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`;

  const values = [
    conversationId,
    userId,
    data.role,
    data.content,
    data.metadata ? JSON.stringify(data.metadata) : '{}',
    data.tokens_used || null,
    data.active_scenario || null,
    data.content_filter_passed ?? true,
    data.inappropriate_content_flags || [],
    JSON.stringify(data.resources_included || []),
    JSON.stringify(data.recommended_actions || []),
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Obtener mensaje por ID
 */
export const getMessageById = async (id: string): Promise<Message | null> => {
  const sql = `SELECT * FROM messages WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

/**
 * Obtener mensajes de una conversación
 */
export const getConversationMessages = async (
  conversationId: string,
  limit = 50,
  beforeId?: string
): Promise<Message[]> => {
  let sql = `
    SELECT * FROM messages 
    WHERE conversation_id = $1`;

  if (beforeId) {
    sql += ` AND id < $2`;
  }

  sql += ` ORDER BY created_at DESC LIMIT $${beforeId ? 3 : 2}`;

  const result = beforeId
    ? await query(sql, [conversationId, beforeId, limit])
    : await query(sql, [conversationId, limit]);

  return result.rows;
};

/**
 * Obtener último mensaje de una conversación
 */
export const getLastMessage = async (conversationId: string): Promise<Message | null> => {
  const sql = `
    SELECT * FROM messages 
    WHERE conversation_id = $1
    ORDER BY created_at DESC
    LIMIT 1`;
  const result = await query(sql, [conversationId]);
  return result.rows[0] || null;
};

/**
 * Obtener historial de mensajes para contexto
 */
export const getMessageHistory = async (conversationId: string, limit = 10): Promise<Message[]> => {
  const sql = `
    SELECT * FROM messages 
    WHERE conversation_id = $1
    ORDER BY created_at DESC
    LIMIT $2`;
  const result = await query(sql, [conversationId, limit]);
  return result.rows.reverse(); // Reversed to get chronological order
};

/**
 * Contar mensajes de una conversación
 */
export const countConversationMessages = async (conversationId: string): Promise<number> => {
  const sql = `SELECT COUNT(*) as count FROM messages WHERE conversation_id = $1`;
  const result = await query(sql, [conversationId]);
  return parseInt(result.rows[0].count);
};

/**
 * Eliminar mensaje
 */
export const deleteMessage = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM messages WHERE id = $1`;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// ADJUNTOS
// =====================================================

/**
 * Crear adjunto de mensaje
 */
export const createMessageAttachment = async (
  messageId: string,
  data: Partial<MessageAttachment>
): Promise<MessageAttachment> => {
  const sql = `
    INSERT INTO message_attachments (message_id, attachment_type, title, description, url, content)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`;

  const values = [
    messageId,
    data.attachment_type,
    data.title || null,
    data.description || null,
    data.url || null,
    data.content ? JSON.stringify(data.content) : null,
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Obtener adjuntos de un mensaje
 */
export const getMessageAttachments = async (messageId: string): Promise<MessageAttachment[]> => {
  const sql = `SELECT * FROM message_attachments WHERE message_id = $1`;
  const result = await query(sql, [messageId]);
  return result.rows;
};

// =====================================================
// INTENCIONES
// =====================================================

/**
 * Crear registro de intención
 */
export const createMessageIntent = async (
  messageId: string,
  userId: string,
  data: Partial<MessageIntent>
): Promise<MessageIntent> => {
  const sql = `
    INSERT INTO message_intents (message_id, user_id, intent, confidence, entities,
      emotion_detected, emotion_confidence, suggested_scenario, is_crisis_indicator, is_relapse_risk)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`;

  const values = [
    messageId,
    userId,
    data.intent,
    data.confidence || null,
    data.entities ? JSON.stringify(data.entities) : '{}',
    data.emotion_detected || null,
    data.emotion_confidence || null,
    data.suggested_scenario || null,
    data.is_crisis_indicator ?? false,
    data.is_relapse_risk ?? false,
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Obtener intención de un mensaje
 */
export const getMessageIntent = async (messageId: string): Promise<MessageIntent | null> => {
  const sql = `SELECT * FROM message_intents WHERE message_id = $1`;
  const result = await query(sql, [messageId]);
  return result.rows[0] || null;
};

/**
 * Obtener historial de intenciones del usuario
 */
export const getUserIntentHistory = async (
  userId: string,
  limit = 50
): Promise<MessageIntent[]> => {
  const sql = `
    SELECT mi.* FROM message_intents mi
    JOIN messages m ON mi.message_id = m.id
    WHERE mi.user_id = $1
    ORDER BY mi.created_at DESC
    LIMIT $2`;
  const result = await query(sql, [userId, limit]);
  return result.rows;
};

// =====================================================
// RESPUESTAS RÁPIDAS
// =====================================================

/**
 * Buscar respuesta rápida por trigger
 */
export const findQuickResponse = async (trigger: string): Promise<QuickResponse | null> => {
  const sql = `
    SELECT * FROM quick_responses 
    WHERE is_active = true AND trigger_phrase = $1
    ORDER BY priority DESC
    LIMIT 1`;
  const result = await query(sql, [trigger.toLowerCase()]);
  return result.rows[0] || null;
};

/**
 * Obtener todas las respuestas rápidas
 */
export const getAllQuickResponses = async (): Promise<QuickResponse[]> => {
  const sql = `
    SELECT * FROM quick_responses 
    WHERE is_active = true
    ORDER BY priority DESC, category ASC`;
  const result = await query(sql, []);
  return result.rows;
};

/**
 * Obtener respuestas rápidas por categoría
 */
export const getQuickResponsesByCategory = async (category: string): Promise<QuickResponse[]> => {
  const sql = `
    SELECT * FROM quick_responses 
    WHERE is_active = true AND category = $1
    ORDER BY priority DESC`;
  const result = await query(sql, [category]);
  return result.rows;
};

// =====================================================
// CONTEXTO HISTÓRICO
// =====================================================

/**
 * Guardar contexto histórico
 */
export const saveContextHistory = async (
  userId: string,
  contextType: string,
  key: string,
  value: any,
  sourceMessageId?: string,
  importance = 5
): Promise<void> => {
  const valueWithTimestamp = {
    ...value,
    recorded_at: new Date().toISOString(),
  };
  const sql = `
    INSERT INTO context_history (user_id, context_type, key, value, source_message_id, importance)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id, context_type, key) 
    DO UPDATE SET 
      value = EXCLUDED.value,
      times_referenced = context_history.times_referenced + 1,
      last_referenced_at = CURRENT_TIMESTAMP`;

  await query(sql, [
    userId,
    contextType,
    key,
    JSON.stringify(valueWithTimestamp),
    sourceMessageId,
    importance,
  ]);
};

/**
 * Obtener contexto histórico
 */
export const getContextHistory = async (userId: string, contextType?: string): Promise<any[]> => {
  let sql = `
    SELECT * FROM context_history 
    WHERE user_id = $1 
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`;

  if (contextType) {
    sql += ` AND context_type = $2`;
  }

  sql += ` ORDER BY importance DESC, last_referenced_at DESC`;

  const result = contextType ? await query(sql, [userId, contextType]) : await query(sql, [userId]);

  return result.rows;
};

/**
 * Obtener preferencias del usuario
 */
export const getUserPreferences = async (userId: string): Promise<any> => {
  const sql = `
    SELECT value FROM context_history 
    WHERE user_id = $1 AND context_type = 'preference'`;
  const result = await query(sql, [userId]);
  return result.rows;
};

/**
 * Obtener historial del usuario
 */
export const getUserHistory = async (userId: string): Promise<any> => {
  const sql = `
    SELECT value FROM context_history 
    WHERE user_id = $1 AND context_type = 'history'`;
  const result = await query(sql, [userId]);
  return result.rows;
};

/**
 * Obtener objetivos del usuario
 */
export const getUserGoals = async (userId: string): Promise<any> => {
  const sql = `
    SELECT value FROM context_history 
    WHERE user_id = $1 AND context_type = 'goal'`;
  const result = await query(sql, [userId]);
  return result.rows;
};

// =====================================================
// LOGS DE LLM
// =====================================================

/**
 * Registrar llamada al LLM
 */
export const logLLMCall = async (
  userId: string | null,
  conversationId: string | null,
  data: {
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    responseText?: string;
    finishReason?: string;
    latencyMs?: number;
    costUsd?: number;
    metadata?: any;
  }
): Promise<void> => {
  const sql = `
    INSERT INTO llm_logs (user_id, conversation_id, model, prompt_tokens, completion_tokens,
      total_tokens, response_text, finish_reason, latency_ms, cost_usd, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

  await query(sql, [
    userId,
    conversationId,
    data.model || 'gpt-4',
    data.promptTokens || null,
    data.completionTokens || null,
    data.totalTokens || null,
    data.responseText || null,
    data.finishReason || null,
    data.latencyMs || null,
    data.costUsd || null,
    data.metadata ? JSON.stringify(data.metadata) : '{}',
  ]);
};

/**
 * Obtener logs de LLM
 */
export const getLLMLogs = async (userId: string, limit = 20): Promise<any[]> => {
  const sql = `
    SELECT * FROM llm_logs 
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2`;
  const result = await query(sql, [userId, limit]);
  return result.rows;
};

// =====================================================
// DETECCIÓN DE PATRONES
// =====================================================

/**
 * Detectar emociones en mensaje
 */
export const detectEmotion = async (
  content: string
): Promise<{
  emotion: string;
  confidence: number;
}> => {
  const lowerContent = content.toLowerCase();

  // Emociones básicas con palabras clave
  const emotionPatterns: Record<string, string[]> = {
    miedo: [
      'miedo',
      'ansioso',
      'nervioso',
      'preocupado',
      'pánico',
      'agobiado',
      'abrumado',
      'inseguro',
      'vulnerable',
    ],
    tristeza: [
      'triste',
      'deprimido',
      'solo',
      'melancólico',
      'vacío',
      'cansado',
      'agotado',
      'fatigado',
      'sin energía',
      'culpable',
      'arrepentido',
    ],
    ira: [
      'enojado',
      'furioso',
      'frustrado',
      'molesto',
      'rabia',
      'estrés',
      'presionado',
      'tenso',
      'resentido',
    ],
    felicidad: [
      'feliz',
      'contento',
      'alegre',
      'emocionado',
      'esperanzado',
      'optimista',
      'motivado',
      'orgulloso',
      'agradecido',
    ],
    sorpresa: ['sorprendido', 'asombrado', 'confundido', 'curioso', 'entusiasmado'],
    asco: ['asco', 'repugnancia', 'decepcionado', 'horrible', 'abstinencia', 'odio'],
  };

  for (const [emotion, keywords] of Object.entries(emotionPatterns)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        return { emotion, confidence: 0.7 };
      }
    }
  }

  return { emotion: 'neutral', confidence: 0.5 };
};

/**
 * Detectar indicadores de crisis
 */
export const detectCrisis = async (
  content: string
): Promise<{
  isCrisis: boolean;
  crisisType: string | null;
}> => {
  const lowerContent = content.toLowerCase();

  const crisisPatterns = [
    { pattern: /suicid|suicidio|quitarme la vida|morir/i, type: 'suicidal' },
    { pattern: /autolesi|cortarme|hurtarme/i, type: 'self_harm' },
    { pattern: /no puedo más|no vale la pena|nadie me import/i, type: 'hopelessness' },
    { pattern: /emergencia|ayuda inmediata|peor imposi/i, type: 'emergency' },
  ];

  for (const { pattern, type } of crisisPatterns) {
    if (pattern.test(lowerContent)) {
      return { isCrisis: true, crisisType: type };
    }
  }

  return { isCrisis: false, crisisType: null };
};
