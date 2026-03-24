/**
 * Rutas del Chatbot
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Router } from 'express';
import * as chatbotController from '../controllers/chatbot.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de conversaciones
router.post('/conversations', chatbotController.createConversation);
router.get('/conversations', chatbotController.getConversations);
router.get('/conversations/active', chatbotController.getActiveConversation);
router.get('/conversations/:id', chatbotController.getConversationById);
router.post('/conversations/:id/close', chatbotController.closeConversation);
router.post('/conversations/:id/scenario', chatbotController.changeScenario);

// Rutas de mensajes
router.post('/conversations/:id/messages', chatbotController.sendMessage);
router.post('/conversations/:id/stream', chatbotController.streamMessage);

// Rutas de escenarios
router.get('/scenarios', chatbotController.getScenarios);

// Rutas de respuestas rápidas
router.get('/quick-responses', chatbotController.getQuickResponses);

// Rutas de estadísticas y memoria
router.get('/stats', chatbotController.getChatbotStats);
router.get('/context-history', chatbotController.getUserContextHistory);

export default router;
