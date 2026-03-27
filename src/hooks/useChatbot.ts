/**
 * Hook del Chatbot NADA
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { Audio } from 'expo-av';

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  active_scenario?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  scenario_type?: string;
  status: string;
  message_count: number;
  started_at: string;
  last_message_at: string;
  messages?: Message[];
}

export interface Scenario {
  id: string;
  scenario_type: string;
  scenario_name: string;
  description?: string;
  system_prompt: string;
  is_active: boolean;
}

export interface QuickResponse {
  id: string;
  trigger_phrase: string;
  response_text: string;
  category: string;
}

export const useChatbot = () => {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextHistory, setContextHistory] = useState<any[]>([]);

  // Cargar una conversación específica por ID
  const loadConversation = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get<any>(`/chatbot/conversations/${id}`);
      
      if (response && (response as any).success) {
        setActiveConversation((response as any).data);
        setMessages((response as any).data.messages || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al cargar conversación');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar conversación activa (la última)
  const loadActiveConversation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get<any>('/chatbot/conversations/active');
      
      if (response && (response as any).success) {
        setActiveConversation((response as any).data);
        setMessages((response as any).data.messages || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al cargar conversación');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar historial de conversaciones
  const loadConversations = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get<any>('/chatbot/conversations', { 
        params: { page, limit } 
      } as any);
      
      if (response && (response as any).success) {
        setConversations((response as any).data.conversations);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al cargar conversaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar escenarios disponibles
  const loadScenarios = useCallback(async () => {
    try {
      const response = await api.get<any>('/chatbot/scenarios');
      
      if (response && (response as any).success) {
        setScenarios((response as any).data);
      }
    } catch (err: any) {
      console.error('Error loading scenarios:', err);
    }
  }, []);

  // Cargar respuestas rápidas
  const loadQuickResponses = useCallback(async () => {
    try {
      const response = await api.get<any>('/chatbot/quick-responses');
      
      if (response && (response as any).success) {
        setQuickResponses((response as any).data);
      }
    } catch (err: any) {
      console.error('Error loading quick responses:', err);
    }
  }, []);

  // Cargar historial de contexto (insights)
  const loadContextHistory = useCallback(async (type?: string) => {
    try {
      setLoading(true);
      const url = type ? `/chatbot/context-history?type=${type}` : '/chatbot/context-history';
      const response = await api.get<any>(url);
      
      if (response && (response as any).success) {
        setContextHistory((response as any).data);
      }
    } catch (err: any) {
      console.error('Error loading context history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar mensaje con soporte de streaming y fallback
  const sendMessage = useCallback(async (content: string, context?: any) => {
    if (!activeConversation) {
      setError('No hay conversación activa');
      return;
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    const userMessage: Message = {
      id: userMsgId,
      conversation_id: activeConversation.id,
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };

    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      conversation_id: activeConversation.id,
      role: 'assistant',
      content: 'Pensando...', // Feedback inicial
      created_at: new Date().toISOString()
    };

    try {
      setSending(true);
      setError(null);
      
      // Actualización optimista
      setMessages(prev => [assistantPlaceholder, userMessage, ...prev]);

      const baseUrl = api.getApiConfig().baseUrl;
      const tokens = api.getAuthTokens();
      
      // Intentar streaming con XMLHttpRequest (más robusto para streaming en React Native)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let streamedContent = '';
        let buffer = '';
        let lastLength = 0;

        const processLine = (line: string) => {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') return;

          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.replace('data: ', '');
            try {
              const event = JSON.parse(dataStr);
              
              if (event.type === 'token') {
                streamedContent += event.content;
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? { ...m, content: streamedContent } : m
                ));
              } else if (event.type === 'tool_start') {
                // Agregar información de herramienta al metadata
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? { 
                    ...m, 
                    metadata: { ...m.metadata, active_tool: event.tool } 
                  } : m
                ));
              } else if (event.type === 'tool_end') {
                // Limpiar herramienta activa al terminar
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? { 
                    ...m, 
                    metadata: { ...m.metadata, active_tool: null } 
                  } : m
                ));
              }
            } catch (e) {
              // Ignorar errores de parseo de chunks parciales
            }
          }
        };

        xhr.open('POST', `${baseUrl}/chatbot/conversations/${activeConversation.id}/stream`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', tokens ? `Bearer ${tokens.accessToken}` : '');

        xhr.onprogress = () => {
          const responseText = xhr.responseText;
          const newText = responseText.substring(lastLength);
          lastLength = responseText.length;
          
          buffer += newText;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            processLine(line);
          }
        };

        xhr.onload = () => {
          if (buffer.trim()) {
            processLine(buffer);
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Server error: ${xhr.status}`));
          }
        };

        xhr.onerror = (e) => {
          console.error('XHR Error:', e);
          reject(new Error('Error de conexión en el stream'));
        };

        xhr.send(JSON.stringify({ content, context }));
      });

      loadActiveConversation();

    } catch (err: any) {
      console.warn('Streaming failed, falling back to standard message:', err);
      
      // Fallback a modo standard si el streaming falla
      try {
        const response: any = await api.post(`/chatbot/conversations/${activeConversation.id}/messages`, {
          content,
          context
        });
        
        if (response && response.success) {
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== userMsgId && m.id !== assistantMsgId);
            return [
              response.data.assistant_message,
              response.data.user_message,
              ...filtered
            ];
          });
        }
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || 'Error al enviar mensaje');
        setMessages(prev => prev.filter(m => m.id !== userMsgId && m.id !== assistantMsgId));
      }
    } finally {
      setSending(false);
    }
  }, [activeConversation, loadActiveConversation]);

  // Cambiar escenario
  const changeScenario = useCallback(async (scenarioType: string) => {
    if (!activeConversation) {
      setError('No hay conversación activa');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post<any>(
        `/chatbot/conversations/${activeConversation.id}/scenario`,
        { scenario_type: scenarioType }
      );
      
      if (response && (response as any).success) {
        setActiveConversation(prev => prev ? {
          ...prev,
          scenario_type: scenarioType
        } : null);
        
        // Recargar mensajes
        await loadActiveConversation();
        
        return (response as any).data;
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al cambiar escenario');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeConversation, loadActiveConversation]);

  // Cerrar conversación
  const closeConversation = useCallback(async (
    satisfaction?: number,
    helpfulness?: number,
    relevance?: number
  ) => {
    if (!activeConversation) {
      setError('No hay conversación activa');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post<any>(
        `/chatbot/conversations/${activeConversation.id}/close`,
        { satisfaction, helpfulness, relevance }
      );
      
      if (response && (response as any).success) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al cerrar conversación');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeConversation]);

  // Crear nueva conversación
  const createConversation = useCallback(async (title?: string, scenarioType?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post<any>('/chatbot/conversations', {
        title,
        scenario_type: scenarioType
      });
      
      if (response && (response as any).success) {
        setActiveConversation((response as any).data);
        await loadActiveConversation();
        return (response as any).data;
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al crear conversación');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadActiveConversation]);

  // Usar respuesta rápida
  const useQuickResponse = useCallback(async (quickResponse: QuickResponse) => {
    return sendMessage(quickResponse.trigger_phrase);
  }, [sendMessage]);

  // --- TTS ---
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const playSpeech = useCallback(async (messageId: string) => {
    try {
      // Si ya está sonando este mensaje, detenerlo
      if (playingMessageId === messageId) {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
          setPlayingMessageId(null);
        }
        return;
      }

      // Detener cualquier sonido actual
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setPlayingMessageId(messageId);

      const baseUrl = api.getApiConfig().baseUrl;
      const tokens = api.getAuthTokens();
      
      const audioUrl = `${baseUrl}/chatbot/messages/${messageId}/tts`;

      const { sound } = await Audio.Sound.createAsync(
        { 
          uri: audioUrl, 
          headers: { 
            'Authorization': tokens ? `Bearer ${tokens.accessToken}` : '',
            'Content-Type': 'application/json' 
          } 
        },
        { shouldPlay: true }
      );

      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingMessageId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });

    } catch (err) {
      console.error('Error playing speech:', err);
      setPlayingMessageId(null);
    }
  }, [playingMessageId]);

  // Limpiar sonido al desmontar
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadActiveConversation(),
        loadScenarios(),
        loadQuickResponses()
      ]);
    };
    
    loadData();
  }, [loadActiveConversation, loadScenarios, loadQuickResponses]);

  return {
    activeConversation,
    conversations,
    messages,
    scenarios,
    quickResponses,
    loading,
    sending,
    error,
    loadActiveConversation,
    loadConversation,
    loadConversations,
    sendMessage,
    changeScenario,
    closeConversation,
    createConversation,
    useQuickResponse,
    contextHistory,
    loadContextHistory,
    playSpeech,
    isPlaying: !!playingMessageId,
    playingMessageId,
  };
};

export default useChatbot;
