/**
 * ChatbotScreen - Pantalla del Chatbot NADA
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { Button } from '@components';
import { useChatbot, Message } from '@hooks/useChatbot';
import Markdown from 'react-native-markdown-display';

export const ChatbotScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { 
    messages, 
    sendMessage, 
    quickResponses, 
    scenarios, 
    activeConversation, 
    conversations,
    loadConversations,
    loading,
    sending, 
    createConversation,
    loadActiveConversation,
    loadConversation
  } = useChatbot();
  const [inputText, setInputText] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);
  // El scroll se maneja automáticamente al usar inverted en FlatList

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText('');

    try {
      await sendMessage(text);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar el mensaje. Verifica tu conexión.');
      setInputText(text); // Restaurar el texto si falló
    }
  };

  const handleQuickResponse = async (trigger: string) => {
    try {
      await sendMessage(trigger);
    } catch (error) {
      console.error('Error with quick response:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser 
            ? { backgroundColor: theme.colors.primary, maxWidth: '85%', borderRadius: 16 }
            : { backgroundColor: 'transparent', maxWidth: '100%', paddingHorizontal: 0 }
        ]}>
          {isUser ? (
            <Text style={[
              styles.messageText,
              { color: '#FFFFFF' }
            ]}>
              {item.content}
            </Text>
          ) : (
            <Markdown 
              style={{
                body: { color: theme.colors.text, fontSize: 16, lineHeight: 24 },
                paragraph: { marginBottom: 12, color: theme.colors.text },
                bullet_list: { marginBottom: 12 },
                ordered_list: { marginBottom: 12 },
                bullet_list_icon: { color: theme.colors.text },
                ordered_list_icon: { color: theme.colors.text },
                code_block: { backgroundColor: theme.colors.surface, padding: 10, borderRadius: 8, color: theme.colors.primary },
                fence: { backgroundColor: theme.colors.surface, padding: 10, borderRadius: 8, color: theme.colors.primary },
                strong: { fontWeight: 'bold', color: theme.colors.text },
                em: { fontStyle: 'italic', color: theme.colors.text },
                heading1: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold', marginVertical: 12 },
                heading2: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
                heading3: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
                text: { color: theme.colors.text },
                link: { color: theme.colors.primary, textDecorationLine: 'underline' },
              }}
            >
              {item.content || '...'}
            </Markdown>
          )}
          <Text style={[
            styles.messageTime,
            { color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }
          ]}>
            {new Date(item.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderQuickResponse = ({ item }: { item: { trigger_phrase: string; response_text: string } }) => (
    <TouchableOpacity
      style={[styles.quickResponseButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => handleQuickResponse(item.trigger_phrase)}
    >
      <Text style={[styles.quickResponseText, { color: theme.colors.text }]}>
        {item.trigger_phrase}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.border,
        paddingTop: Math.max(insets.top, 16),
      }]}>
        <TouchableOpacity 
          onPress={() => {
            loadConversations();
            setHistoryVisible(true);
          }}
          style={styles.headerButton}
        >
          <Text style={{ fontSize: 24 }}>📜</Text>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            🌙 LÚA
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Tu asistente de apoyo
          </Text>
        </View>

        <TouchableOpacity 
          onPress={() => createConversation('Nuevo chat', 'apoyo_emocional')}
          style={styles.headerButton}
        >
          <Text style={{ fontSize: 24 }}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Mensajes */}
      <FlatList
        inverted
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={null}
        ListFooterComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              ¡Hola! Soy LÚA 🌙, estoy aquí para apoyarte en tu proceso de recuperación. 
              ¿Cómo te sientes hoy?
            </Text>
          </View>
        }
      />

      {/* Respuestas rápidas */}
      {quickResponses.length > 0 && messages.length <= 2 && (
        <View style={[styles.quickResponsesContainer, { backgroundColor: theme.colors.surface }]}>
          <FlatList
            data={quickResponses.slice(0, 4)}
            renderItem={renderQuickResponse}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickResponsesList}
          />
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Escribe tu mensaje..."
          placeholderTextColor={theme.colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim() ? theme.colors.primary : theme.colors.border }
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          <Text style={styles.sendButtonText}>
            {sending ? '...' : '➤'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Historial de Conversaciones (Modal) */}
      {historyVisible && (
        <View style={[styles.historyOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.historyContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { color: theme.colors.text }]}>Tus hilos de chat</Text>
              <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                <Text style={{ fontSize: 24, color: theme.colors.text }}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.historyItem, 
                    { borderBottomColor: theme.colors.border },
                    activeConversation?.id === item.id && { backgroundColor: theme.colors.primary + '10' }
                  ]}
                  onPress={async () => {
                    setHistoryVisible(false);
                    await loadConversation(item.id);
                  }}
                >
                  <Text style={[styles.historyItemText, { color: theme.colors.text }]}>
                    {item.title || 'Conversación sin título'}
                  </Text>
                  <Text style={[styles.historyItemDate, { color: theme.colors.textSecondary }]}>
                    {new Date(item.last_message_at).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInfo: {},
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  scenarioBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scenarioText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 24, // Padding extra en la parte inferior de la lista (arriba del input)
    gap: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  quickResponsesContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  quickResponsesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickResponseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  quickResponseText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  headerButton: {
    padding: 8,
  },
  historyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  historyContainer: {
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyItem: {
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  historyItemDate: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default ChatbotScreen;
