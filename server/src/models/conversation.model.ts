/**
 * Modelo de Conversaciones del Chatbot
 * Consultas SQL para las tablas conversations y conversation_sessions
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { query, queryWithTransaction } from '../config/database.js';

// =====================================================
// INTERFACES
// =====================================================

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  scenario_type?: string;
  status: string;
  context?: any;
  message_count: number;
  duration_minutes?: number;
  user_satisfaction?: number;
  helpfulness_rating?: number;
  relevance_rating?: number;
  contains_crisk: boolean;
  escalated_to_emergency: boolean;
  required_human_intervention: boolean;
  scenario_completed: boolean;
  started_at: Date;
  last_message_at: Date;
  ended_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ConversationSession {
  id: string;
  conversation_id: string;
  user_id: string;
  session_number: number;
  session_type?: string;
  context_summary?: string;
  user_mood_before?: string;
  user_mood_after?: string;
  emotional_state?: any;
  topics_discussed?: string[];
  strategies_shared?: string[];
  resources_recommended?: any[];
  duration_seconds?: number;
  messages_in_session: number;
  session_outcome?: string;
  started_at: Date;
  ended_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ScenarioConfig {
  id: string;
  scenario_type: string;
  scenario_name: string;
  description?: string;
  system_prompt: string;
  temperature?: number;
  max_tokens?: number;
  enabled_skills?: string[];
  trigger_conditions?: any;
  is_active: boolean;
  version?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

// =====================================================
// CONVERSACIONES
// =====================================================

/**
 * Crear una nueva conversación
 */
export const createConversation = async (userId: string, data: Partial<Conversation>): Promise<Conversation> => {
  const sql = `
    INSERT INTO conversations (user_id, title, scenario_type, status, context)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`;
  
  const values = [
    userId,
    data.title || 'Nueva conversación',
    data.scenario_type || 'apoyo_emocional',
    data.status || 'active',
    data.context ? JSON.stringify(data.context) : '{}'
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Obtener conversación por ID
 */
export const getConversationById = async (id: string): Promise<Conversation | null> => {
  const sql = `SELECT * FROM conversations WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

/**
 * Obtener conversación activa del usuario
 */
export const getActiveConversation = async (userId: string): Promise<Conversation | null> => {
  const sql = `
    SELECT * FROM conversations 
    WHERE user_id = $1 AND status = 'active'
    ORDER BY last_message_at DESC
    LIMIT 1`;
  const result = await query(sql, [userId]);
  return result.rows[0] || null;
};

/**
 * Obtener conversaciones del usuario
 */
export const getUserConversations = async (
  userId: string, 
  page = 1, 
  limit = 20
): Promise<{ conversations: Conversation[], total: number }> => {
  const offset = (page - 1) * limit;
  
  const countSql = `SELECT COUNT(*) as total FROM conversations WHERE user_id = $1`;
  const countResult = await query(countSql, [userId]);
  const total = parseInt(countResult.rows[0].total);

  const sql = `
    SELECT * FROM conversations 
    WHERE user_id = $1 
    ORDER BY last_message_at DESC 
    LIMIT $2 OFFSET $3`;
  const result = await query(sql, [userId, limit, offset]);

  return { conversations: result.rows, total };
};

/**
 * Actualizar conversación
 */
export const updateConversation = async (id: string, data: Partial<Conversation>): Promise<Conversation | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'title', 'scenario_type', 'status', 'context', 'message_count', 
    'duration_minutes', 'user_satisfaction', 'helpfulness_rating', 
    'relevance_rating', 'contains_crisk', 'escalated_to_emergency',
    'required_human_intervention', 'scenario_completed', 'ended_at'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      if (key === 'context') {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE conversations SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  const result = await query(sql, values);
  return result.rows[0] || null;
};

/**
 * Actualizar timestamp de última actividad
 */
export const updateConversationActivity = async (id: string): Promise<void> => {
  const sql = `
    UPDATE conversations 
    SET last_message_at = CURRENT_TIMESTAMP,
        message_count = message_count + 1
    WHERE id = $1`;
  await query(sql, [id]);
};

/**
 * Cerrar conversación
 */
export const closeConversation = async (
  id: string, 
  satisfaction?: number,
  helpfulness?: number,
  relevance?: number
): Promise<Conversation | null> => {
  const sql = `
    UPDATE conversations 
    SET status = 'completed',
        ended_at = CURRENT_TIMESTAMP,
        user_satisfaction = COALESCE($2, user_satisfaction),
        helpfulness_rating = COALESCE($3, helpfulness_rating),
        relevance_rating = COALESCE($4, relevance_rating),
        duration_minutes = EXTRACT(EPOCH FROM (ended_at - started_at))::integer / 60
    WHERE id = $1
    RETURNING *`;
  
  const result = await query(sql, [id, satisfaction, helpfulness, relevance]);
  return result.rows[0] || null;
};

/**
 * Eliminar conversación
 */
export const deleteConversation = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM conversations WHERE id = $1`;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
};

// =====================================================
// SESIONES
// =====================================================

/**
 * Crear sesión de conversación
 */
export const createConversationSession = async (
  conversationId: string, 
  userId: string,
  sessionNumber: number
): Promise<ConversationSession> => {
  const sql = `
    INSERT INTO conversation_sessions (conversation_id, user_id, session_number)
    VALUES ($1, $2, $3)
    RETURNING *`;
  
  const result = await query(sql, [conversationId, userId, sessionNumber]);
  return result.rows[0];
};

/**
 * Obtener sesión por ID
 */
export const getSessionById = async (id: string): Promise<ConversationSession | null> => {
  const sql = `SELECT * FROM conversation_sessions WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

/**
 * Obtener sesiones de una conversación
 */
export const getConversationSessions = async (conversationId: string): Promise<ConversationSession[]> => {
  const sql = `
    SELECT * FROM conversation_sessions 
    WHERE conversation_id = $1
    ORDER BY session_number ASC`;
  const result = await query(sql, [conversationId]);
  return result.rows;
};

/**
 * Actualizar sesión
 */
export const updateSession = async (id: string, data: Partial<ConversationSession>): Promise<ConversationSession | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'context_summary', 'user_mood_before', 'user_mood_after', 'emotional_state',
    'topics_discussed', 'strategies_shared', 'resources_recommended',
    'duration_seconds', 'messages_in_session', 'session_outcome', 'ended_at'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      if (key === 'emotional_state' || key === 'topics_discussed' || 
          key === 'strategies_shared' || key === 'resources_recommended') {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE conversation_sessions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  const result = await query(sql, values);
  return result.rows[0] || null;
};

/**
 * Cerrar sesión
 */
export const closeSession = async (id: string, outcome: string): Promise<ConversationSession | null> => {
  const sql = `
    UPDATE conversation_sessions 
    SET ended_at = CURRENT_TIMESTAMP,
        session_outcome = $1,
        duration_seconds = EXTRACT(EPOCH FROM (ended_at - started_at))::integer
    WHERE id = $2
    RETURNING *`;
  
  const result = await query(sql, [outcome, id]);
  return result.rows[0] || null;
};

// =====================================================
// ESCENARIOS
// =====================================================

/**
 * Obtener configuración de escenario
 */
export const getScenarioConfig = async (scenarioType: string): Promise<ScenarioConfig | null> => {
  const sql = `
    SELECT * FROM scenario_configs 
    WHERE scenario_type = $1 AND is_active = true`;
  const result = await query(sql, [scenarioType]);
  return result.rows[0] || null;
};

/**
 * Obtener todos los escenarios activos
 */
export const getActiveScenarios = async (): Promise<ScenarioConfig[]> => {
  const sql = `
    SELECT * FROM scenario_configs 
    WHERE is_active = true
    ORDER BY scenario_type ASC`;
  const result = await query(sql, []);
  return result.rows;
};

/**
 * Obtener escenario por defecto
 */
export const getDefaultScenario = async (): Promise<ScenarioConfig | null> => {
  const sql = `
    SELECT * FROM scenario_configs 
    WHERE scenario_type = 'apoyo_emocional' AND is_active = true`;
  const result = await query(sql, []);
  return result.rows[0] || null;
};

/**
 * Detectar escenario apropiado basado en contexto
 */
export const detectAppropriateScenario = async (
  userId: string,
  lastMessage: string,
  context?: any
): Promise<string> => {
  // Por defecto, usar apoyo emocional
  let scenario = 'apoyo_emocional';
  
  const lowerMessage = lastMessage.toLowerCase();
  
  // Detectar crisis
  if (context?.isCrisis || 
      lowerMessage.includes('suicidio') || 
      lowerMessage.includes('morir') ||
      lowerMessage.includes('no puedo más') ||
      lowerMessage.includes('quiero morir')) {
    return 'crisis';
  }
  
  // Detectar ansiedad
  if (lowerMessage.includes('ansiedad') || 
      lowerMessage.includes('ataque de pánico') ||
      lowerMessage.includes('nervios')) {
    return 'manejo_ansiedad';
  }
  
  // Detectar craving
  if (lowerMessage.includes('ganas de consumir') || 
      lowerMessage.includes('antojo') ||
      lowerMessage.includes('quiero usar')) {
    return 'manejo_craving';
  }
  
  // Detectar motivación
  if (lowerMessage.includes('motivación') || 
      lowerMessage.contains('no tengo ganas') ||
      lowerMessage.includes('derrotado')) {
    return 'motivacion';
  }
  
  // Detectar prevención de recaída
  if (lowerMessage.includes('recaída') || 
      lowerMessage.includes('prevenir') ||
      lowerMessage.includes('situación de riesgo')) {
    return 'prevencion_recaida';
  }
  
  // Detectar logro
  if (lowerMessage.includes('logré') || 
      lowerMessage.includes('celebrar') ||
      lowerMessage.includes('progreso')) {
    return 'celebracion_logro';
  }
  
  return scenario;
};

// =====================================================
// ESTADÍSTICAS
// =====================================================

/**
 * Obtener estadísticas de conversaciones
 */
export const getConversationStats = async (userId: string): Promise<{
  totalConversations: number;
  activeConversations: number;
  completedConversations: number;
  averageMessages: number;
  averageDuration: number;
  totalSessions: number;
}> => {
  const sql = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      AVG(message_count) as avg_messages,
      AVG(duration_minutes) as avg_duration
    FROM conversations
    WHERE user_id = $1`;
  
  const result = await query(sql, [userId]);
  const row = result.rows[0];

  const sessionsSql = `
    SELECT COUNT(*) as total 
    FROM conversation_sessions cs
    JOIN conversations c ON cs.conversation_id = c.id
    WHERE c.user_id = $1`;
  const sessionsResult = await query(sessionsSql, [userId]);

  return {
    totalConversations: parseInt(row.total) || 0,
    activeConversations: parseInt(row.active) || 0,
    completedConversations: parseInt(row.completed) || 0,
    averageMessages: parseFloat(row.avg_messages) || 0,
    averageDuration: parseFloat(row.avg_duration) || 0,
    totalSessions: parseInt(sessionsResult.rows[0].total) || 0
  };
};
