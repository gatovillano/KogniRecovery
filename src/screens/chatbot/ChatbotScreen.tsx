import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/ThemeContext';
import { Header } from '@components';
import { useChatbot, Message } from '@hooks/useChatbot';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';

const TOOL_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  knowledge_graph_search: {
    icon: 'git-network-outline',
    label: 'Consultando tu historial',
    color: '#8BAFD4',
  },
  rag_search: {
    icon: 'document-search-outline',
    label: 'Buscando en base de conocimiento',
    color: '#6B8BB2',
  },
  web_search: {
    icon: 'globe-outline',
    label: 'Buscando en la web',
    color: '#3B82F6',
  },
  list_documents: {
    icon: 'folder-open-outline',
    label: 'Explorando archivos',
    color: '#64748B',
  },
  get_document_content: {
    icon: 'reader-outline',
    label: 'Leyendo documento',
    color: '#8BAFD4',
  },
};

export const ChatbotScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    messages,
    sendMessage,
    quickResponses,
    activeConversation,
    conversations,
    loadConversations,
    loading,
    sending,
    createConversation,
    loadConversation,
    deleteConversation,
    playSpeech,
    playingMessageId,
    loadingTtsId,
  } = useChatbot();
  const [inputText, setInputText] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);

  const activeTool = useMemo(() => {
    const thinkingMsg = messages.find((m) => m.role === 'assistant' && m.content === 'Pensando...');
    return thinkingMsg?.metadata?.active_tool || null;
  }, [messages]);

  const toolInfo = activeTool ? TOOL_CONFIG[activeTool] || null : null;

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText('');

    try {
      await sendMessage(text);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar el mensaje. Verifica tu conexión.');
      setInputText(text);
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
    const isThinking = !isUser && item.content === 'Pensando...';
    const msgTool = item.metadata?.active_tool;

    const msgToolInfo = msgTool ? TOOL_CONFIG[msgTool] : null;

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser
              ? {
                  backgroundColor: theme.colors.primary,
                  maxWidth: '85%',
                  borderRadius: 22,
                  borderBottomRightRadius: 4,
                }
              : {
                  backgroundColor: 'transparent',
                  maxWidth: '100%',
                  paddingHorizontal: 0,
                  paddingVertical: 8,
                },
          ]}
        >
          {isUser ? (
            <Text selectable style={[styles.messageText, { color: '#FFFFFF' }]}>
              {item.content}
            </Text>
          ) : (
            <View>
              {isThinking ? (
                <View style={styles.thinkingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={[styles.thinkingText, { color: theme.colors.textSecondary }]}>
                    {msgToolInfo ? msgToolInfo.label + '...' : 'LÚA está pensando...'}
                  </Text>
                </View>
              ) : (
                <>
                  <Markdown
                    style={{
                      body: {
                        color: theme.colors.text,
                        fontSize: 15,
                        lineHeight: 22,
                      },
                      paragraph: { marginBottom: 8, color: theme.colors.text },
                      bullet_list: { marginBottom: 8 },
                      ordered_list: { marginBottom: 8 },
                      bullet_list_icon: { color: theme.colors.text },
                      ordered_list_icon: { color: theme.colors.text },
                      code_block: {
                        backgroundColor: theme.colors.background,
                        padding: 10,
                        borderRadius: 10,
                        color: theme.colors.primary,
                      },
                      fence: {
                        backgroundColor: theme.colors.background,
                        padding: 10,
                        borderRadius: 10,
                        color: theme.colors.primary,
                      },
                      strong: { fontWeight: 'bold', color: theme.colors.text },
                      em: { fontStyle: 'italic', color: theme.colors.text },
                      heading1: {
                        color: theme.colors.text,
                        fontSize: 22,
                        fontWeight: 'bold',
                        marginVertical: 10,
                      },
                      heading2: {
                        color: theme.colors.text,
                        fontSize: 18,
                        fontWeight: 'bold',
                        marginVertical: 8,
                      },
                      heading3: {
                        color: theme.colors.text,
                        fontSize: 16,
                        fontWeight: 'bold',
                        marginVertical: 6,
                      },
                      text: { color: theme.colors.text },
                      link: { color: theme.colors.primary, textDecorationLine: 'underline' },
                      blockquote: {
                        backgroundColor: theme.colors.primary + '08',
                        borderLeftColor: theme.colors.primary,
                        borderLeftWidth: 3,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        marginVertical: 8,
                        borderRadius: 6,
                      },
                      code_inline: {
                        backgroundColor: theme.colors.background,
                        color: theme.colors.secondary,
                        paddingHorizontal: 4,
                        borderRadius: 4,
                      },
                      hr: {
                        backgroundColor: theme.colors.border,
                        height: StyleSheet.hairlineWidth,
                        marginVertical: 12,
                      },
                    }}
                  >
                    {item.content || '...'}
                  </Markdown>
                  {msgTool && msgToolInfo && (
                    <View
                      style={[
                        styles.activeToolBadge,
                        { backgroundColor: msgToolInfo.color + '12' },
                      ]}
                    >
                      <ActivityIndicator size="small" color={msgToolInfo.color} />
                      <Text style={[styles.activeToolText, { color: msgToolInfo.color }]}>
                        {msgToolInfo.label}...
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
          <Text
            selectable
            style={[
              styles.messageTime,
              { color: isUser ? 'rgba(255,255,255,0.6)' : theme.colors.textSecondary },
            ]}
          >
            {new Date(item.created_at).toLocaleTimeString('es-CL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>

          {!isUser && !isThinking && (
            <TouchableOpacity
              style={[styles.ttsButton, { backgroundColor: theme.colors.background }]}
              onPress={() => playSpeech(item.id)}
              activeOpacity={0.7}
              disabled={loadingTtsId === item.id}
            >
              {loadingTtsId === item.id ? (
                <>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={[styles.ttsText, { color: theme.colors.primary }]}>Cargando</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name={playingMessageId === item.id ? 'stop-circle' : 'volume-medium'}
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.ttsText, { color: theme.colors.primary }]}>
                    {playingMessageId === item.id ? 'Detener' : 'Escuchar'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderQuickResponse = ({
    item,
  }: {
    item: { trigger_phrase: string; response_text: string };
  }) => (
    <TouchableOpacity
      style={[styles.quickResponseButton, { backgroundColor: theme.colors.primary + '08' }]}
      onPress={() => handleQuickResponse(item.trigger_phrase)}
      activeOpacity={0.7}
    >
      <Text style={[styles.quickResponseText, { color: theme.colors.primary }]}>
        {item.trigger_phrase}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* LÚA Identity Header */}
      <View
        style={[
          styles.luaHeader,
          { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background },
        ]}
      >
        <View style={[styles.luaHeaderAvatar, { backgroundColor: theme.colors.primary + '15' }]}>
          <Ionicons name="moon" size={22} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.luaHeaderName, { color: theme.colors.text }]}>LÚA</Text>
          <Text style={[styles.luaHeaderSub, { color: theme.colors.textSecondary }]}>
            Tu acompañante de recuperación
          </Text>
        </View>
        <TouchableOpacity
          style={styles.luaHeaderBtn}
          onPress={() => {
            loadConversations();
            setHistoryVisible(true);
          }}
          activeOpacity={0.6}
        >
          <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.luaHeaderBtn}
          onPress={() => createConversation('Nuevo chat', 'apoyo_emocional')}
          activeOpacity={0.6}
        >
          <Ionicons name="add" size={22} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <FlatList
          inverted
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View
                  style={[styles.welcomeIcon, { backgroundColor: theme.colors.primary + '12' }]}
                >
                  <Ionicons name="moon" size={30} color={theme.colors.primary} />
                </View>
                <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
                  Hola, soy LÚA
                </Text>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  Estoy aquí para acompañarte en tu proceso de recuperación.{`\n`}¿Cómo te sientes
                  hoy?
                </Text>
              </View>
            ) : null
          }
        />

        {/* Quick responses */}
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

        {/* Activity indicator */}
        {activeTool && toolInfo && (
          <View style={[styles.activityBar, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.activityDot, { backgroundColor: toolInfo.color }]} />
            <Ionicons name={toolInfo.icon as any} size={16} color={toolInfo.color} />
            <Text style={[styles.activityText, { color: toolInfo.color }]}>
              {toolInfo.label}...
            </Text>
            <ActivityIndicator size="small" color={toolInfo.color} style={{ marginLeft: 'auto' }} />
          </View>
        )}

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 6,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Escribe tu mensaje..."
              placeholderTextColor={theme.colors.textSecondary + '80'}
              value={inputText}
              onChangeText={setInputText}
              multiline
              onSubmitEditing={handleSend}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Conversation History Modal */}
      {historyVisible && (
        <View style={[styles.historyOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.historyContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { color: theme.colors.text }]}>
                Tus hilos de chat
              </Text>
              <TouchableOpacity
                onPress={() => setHistoryVisible(false)}
                style={[styles.historyCloseBtn, { backgroundColor: theme.colors.background }]}
              >
                <Ionicons name="close" size={18} color={theme.colors.text} />
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
                    activeConversation?.id === item.id && {
                      backgroundColor: theme.colors.primary + '08',
                    },
                  ]}
                  onPress={async () => {
                    setHistoryVisible(false);
                    await loadConversation(item.id);
                  }}
                  activeOpacity={0.6}
                >
                  <View style={styles.historyItemContent}>
                    <Text style={[styles.historyItemText, { color: theme.colors.text }]}>
                      {item.title || 'Conversación sin título'}
                    </Text>
                    <Text style={[styles.historyItemDate, { color: theme.colors.textSecondary }]}>
                      {new Date(item.last_message_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: theme.colors.error + '10' }]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      Alert.alert('Eliminar chat', '¿Estás seguro de eliminar esta conversación?', [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Eliminar',
                          style: 'destructive',
                          onPress: async () => {
                            await deleteConversation(item.id);
                          },
                        },
                      ]);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgPattern: {
    display: 'none',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 10,
  },
  messageContainer: {
    marginVertical: 2,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'stretch',
    width: '100%',
  },
  messageBubble: {
    padding: 14,
    borderRadius: 20,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#8BAFD4',
    borderTopRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: 4,
  },
  darkAssistantMessage: {
    backgroundColor: '#1E293B',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFF',
  },
  assistantMessageText: {
    color: '#1E293B',
  },
  darkAssistantMessageText: {
    color: '#F1F5F9',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 6,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  historyBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '300',
  },
  luaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  luaHeaderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  luaHeaderName: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  luaHeaderSub: {
    fontSize: 12,
    marginTop: 1,
  },
  luaHeaderBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickResponsesContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  quickResponsesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickResponseButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginRight: 8,
  },
  quickResponseText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    minHeight: 42,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    lineHeight: 20,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  historyCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyItemDate: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  thinkingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  activeToolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  activeToolText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ttsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  ttsText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ChatbotScreen;
