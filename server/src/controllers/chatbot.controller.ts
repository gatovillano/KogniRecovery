/**
 * Controlador del Chatbot
 * Maneja las solicitudes HTTP relacionadas con el chatbot NADA
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Request, Response, NextFunction } from 'express';
import * as conversationModel from '../models/conversation.model.js';
import * as messageModel from '../models/message.model.js';
import { AuthRequest } from '../middleware/auth.js';
import * as profileModel from '../models/profile.model.js';
import { langGraphAgent } from '../services/langgraph.service.js';

// =====================================================
// CONVERSACIONES
// =====================================================

/**
 * POST /api/v1/chatbot/conversations
 * Crear una nueva conversación
 */
export const createConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const { title, scenario_type, context } = req.body;

    const conversation = await conversationModel.createConversation(userId, {
      title,
      scenario_type,
      context
    });

    // Crear primer mensaje del sistema
    await messageModel.createMessage(
      conversation.id,
      userId,
      {
        role: 'assistant',
        content: 'Hola, soy LÚA 🌙. Estoy aquí para apoyarte en tu proceso de recuperación. ¿Cómo te sientes hoy?',
        active_scenario: scenario_type || 'apoyo_emocional'
      }
    );

    res.status(201).json({
      success: true,
      data: conversation,
      message: 'Conversación creada'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/chatbot/conversations
 * Obtener conversaciones del usuario
 */
export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { conversations, total } = await conversationModel.getUserConversations(userId, page, limit);

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/chatbot/conversations/active
 * Obtener conversación activa
 */
export const getActiveConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    let conversation = await conversationModel.getActiveConversation(userId);

    if (!conversation) {
      // Crear nueva conversación automáticamente
      conversation = await conversationModel.createConversation(userId, {
        title: 'Nueva conversación',
        scenario_type: 'apoyo_emocional'
      });

      // Agregar mensaje de bienvenida
      await messageModel.createMessage(
        conversation.id,
        userId,
        {
          role: 'assistant',
          content: 'Hola, soy LÚA 🌙. Estoy aquí para apoyarte en tu proceso de recuperación. ¿Cómo te sientes hoy?',
          active_scenario: 'apoyo_emocional'
        }
      );
    }

    // Obtener mensajes
    const messages = await messageModel.getConversationMessages(conversation.id);

    res.json({
      success: true,
      data: {
        ...conversation,
        messages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/chatbot/conversations/:id
 * Obtener una conversación específica
 */
export const getConversationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) throw new Error('ID de conversación requerido');
    const conversation = await conversationModel.getConversationById(id as string);

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversación no encontrada' }
      });
      return;
    }

    // Obtener mensajes
    const messages = await messageModel.getConversationMessages(conversation.id);

    res.json({
      success: true,
      data: {
        ...conversation,
        messages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/chatbot/conversations/:id/close
 * Cerrar una conversación
 */
export const closeConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) throw new Error('ID de conversación requerido');
    const { satisfaction, helpfulness, relevance } = req.body;

    const conversation = await conversationModel.closeConversation(id as string, satisfaction, helpfulness, relevance);

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversación no encontrada' }
      });
      return;
    }

    res.json({
      success: true,
      data: conversation,
      message: 'Conversación cerrada'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// MENSAJES
// =====================================================

/**
 * POST /api/v1/chatbot/conversations/:id/messages
 * Enviar mensaje a la conversación
 */
export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const { id: conversationId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const { content, context } = req.body;

    if (!content) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Contenido del mensaje requerido' }
      });
      return;
    }

    // Verificar que la conversación existe
    const conversation = await conversationModel.getConversationById(conversationId as string);
    if (!conversation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversación no encontrada' }
      });
      return;
    }

    // Detectar emoción
    const emotionResult = await messageModel.detectEmotion(content);

    // Detectar crisis
    const crisisResult = await messageModel.detectCrisis(content);

    // Guardar mensaje del usuario
    const userMessage = await messageModel.createMessage(conversationId as string, userId as string, {
      role: 'user',
      content,
      metadata: {
        emotion_detected: emotionResult.emotion,
        emotion_confidence: emotionResult.confidence,
        is_crisis: crisisResult.isCrisis
      }
    });

    // Actualizar conversación
    await conversationModel.updateConversationActivity(conversationId as string);

    // Guardar intención
    await messageModel.createMessageIntent(userMessage.id, userId, {
      intent: 'general',
      confidence: 0.5,
      emotion_detected: emotionResult.emotion,
      emotion_confidence: emotionResult.confidence,
      is_crisis_indicator: crisisResult.isCrisis,
      is_relapse_risk: false
    });

    // Guardar contexto relevante
    if (emotionResult.emotion !== 'neutral') {
      await messageModel.saveContextHistory(
        userId,
        'emotional_state',
        'last_emotion',
        { emotion: emotionResult.emotion, confidence: emotionResult.confidence },
        userMessage.id,
        7
      );
    }

    // Obtener contexto del usuario para RAG
    const profile = await profileModel.getProfileByUserId(userId);
    const userContext: any = {
      userId,
      profile: profile?.profile_type || 'general',
      etapaCambio: 'contemplacion',
      sustancias: profile?.primary_substance ? [profile.primary_substance] : [],
    };

    // Recuperar información relevante (RAG)
    // const retrievedChunks = await ragService.retrieve(content, userContext);

    // Generar respuesta real usando Agente LangGraph
    const langgraphResult = await langGraphAgent.executeAgent(
      conversationId as string,
      userId as string,
      content,
      { ...userContext, ...context }
    );

    const responseContent = langgraphResult.content;
    const scenario = conversation.scenario_type || 'apoyo_emocional';

    // Generar sugerencias (opcional, puedes mantenerlo o moverlo al Agente)
    const suggestions = ['¿Cómo te sientes ahora?', '¿Quieres hablar más?', '¿Hay otra cosa?'];

    // Guardar respuesta del asistente
    const assistantMessage = await messageModel.createMessage(conversationId as string, userId as string, {
      role: 'assistant',
      content: responseContent,
      active_scenario: scenario,
      metadata: {
        generated_scenario: scenario,
        user_emotion: emotionResult.emotion,
        sources: [langgraphResult.retrievedContext],
        suggestions: suggestions
      }
    });

    // Verificar si es crisis y actualizar conversación
    if (crisisResult.isCrisis) {
      await conversationModel.updateConversation(conversationId as string, {
        contains_crisk: true,
        escalated_to_emergency: crisisResult.crisisType === 'emergency'
      });
    }

    res.json({
      success: true,
      data: {
        user_message: userMessage,
        assistant_message: assistantMessage,
        scenario,
        emotion: emotionResult,
        crisis_detected: crisisResult,
        suggestions: suggestions
      }
    });
  } catch (error: any) {
    console.error('❌ Error en sendMessage:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error?.message || 'Error processing message' }
    });
  }
};

/**
 * POST /api/v1/chatbot/conversations/:id/stream
 * Transmisión de mensaje en tiempo real (Streaming)
 */
export const streamMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const { id: conversationId } = req.params;
    const { content } = req.body;

    if (!userId || !content || !conversationId) {
      res.status(401).json({ success: false, message: 'Falta contenido, usuario o conversación' });
      return;
    }

    // Configuración para Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Desactivar buffer en Nginx/Proxies
    res.flushHeaders();

    // Guardar mensaje del usuario (en segundo plano)
    await messageModel.createMessage(conversationId as string, userId as string, {
      role: 'user',
      content,
    });
    await conversationModel.updateConversationActivity(conversationId as string);

    // Obtener contexto del usuario
    const profile = await profileModel.getProfileByUserId(userId);
    const userContext: any = {
      userId,
      profile: profile?.profile_type || 'general',
      etapaCambio: 'contemplacion',
      sustancias: profile?.primary_substance ? [profile.primary_substance] : [],
    };

    // Iniciar streaming desde el agente
    const stream = langGraphAgent.executeAgentStream(conversationId as string, userId as string, content, userContext);
    
    let completeResponse = '';

    for await (const chunk of stream) {
      completeResponse += chunk;
      // Enviar chunk al cliente en formato SSE
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    // Al finalizar el stream, guardar la respuesta completa en la DB
    await messageModel.createMessage(conversationId as string, userId as string, {
      role: 'assistant',
      content: completeResponse,
      active_scenario: 'apoyo_emocional',
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('❌ Error in streamMessage:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};

// =====================================================
// ESCENARIOS
// =====================================================

/**
 * GET /api/v1/chatbot/scenarios
 * Obtener escenarios disponibles
 */
export const getScenarios = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const scenarios = await conversationModel.getActiveScenarios();

    res.json({
      success: true,
      data: scenarios
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/chatbot/conversations/:id/scenario
 * Cambiar escenario de conversación
 */
export const changeScenario = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { scenario_type } = req.body;

    if (!scenario_type) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Tipo de escenario requerido' }
      });
      return;
    }

    const conversation = await conversationModel.updateConversation(id as string, {
      scenario_type
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversación no encontrada' }
      });
      return;
    }

    // Agregar mensaje del sistema sobre cambio de escenario
    const scenarioMessages: Record<string, string> = {
      'apoyo_emocional': 'Cambiando a modo de apoyo emocional. Estoy aquí para escucharte.',
      'crisis': 'He detectado que quizás necesitas apoyo urgente. Estoy aquí para ayudarte.',
      'motivacion': '¡Vamos a找回 tu motivación! Cuéntame sobre tus metas.',
      'psicoeducacion': '我可以 explicarte más sobre el tema. ¿Qué quieres saber?',
      'prevencion_recaida': 'Hablemos sobre estrategias para prevenir una recaída. ¿Qué situaciones te preocupan?'
    };

    await messageModel.createMessage(id as string, conversation.user_id, {
      role: 'assistant',
      content: scenarioMessages[scenario_type] || 'Cambiando a un nuevo modo de conversación.',
      active_scenario: scenario_type
    });

    res.json({
      success: true,
      data: conversation,
      message: 'Escenario cambiado'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// RESPUESTAS RÁPIDAS
// =====================================================

/**
 * GET /api/v1/chatbot/quick-responses
 * Obtener respuestas rápidas
 */
export const getQuickResponses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const responses = await messageModel.getAllQuickResponses();

    res.json({
      success: true,
      data: responses
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ESTADÍSTICAS
// =====================================================

/**
 * GET /api/v1/chatbot/stats
 * Obtener estadísticas de conversaciones
 */
export const getChatbotStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const stats = await conversationModel.getConversationStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/chatbot/context-history
 * Obtener historial de contexto (insights aprendidos por NADA)
 */
export const getUserContextHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const type = req.query.type as string;
    const history = await messageModel.getContextHistory(userId, type);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};
