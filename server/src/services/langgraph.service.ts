import { MemorySaver, StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, BaseMessage, AIMessage } from '@langchain/core/messages';
import * as UserModel from '../models/user.model.js';
import * as messageModel from '../models/message.model.js';
import { decrypt } from '../utils/encryption.js';
import { ai as aiDefaultConfig } from '../config/neo4j.js';
import fs from 'fs/promises';
import path from 'path';
import { embeddingsService, chunkingService, EmbeddingChunk } from './embedding.service.js';
import { getLUAProSystemPrompt } from '../config/prompts.js';
import { knowledgeGraphSearchTool } from './skills/graph_skill/scripts/graph_tool.js';
import { ragSearchTool } from './skills/document_skill/scripts/rag_tool.js';
import { listDocumentsTool } from './skills/document_skill/scripts/list_tool.js';
import { getDocumentContentTool } from './skills/document_skill/scripts/document_tool.js';
import { substanceDoseTool } from './skills/substance_skill/scripts/dose_tool.js';
import {
  saveNoteTool,
  listNotesTool,
  deleteNoteTool,
} from './skills/note_skill/scripts/note_tool.js';
import { neo4jService } from './neo4j.service.js';

// Herramientas (Skills) del Agente
const TOOLS = [
  knowledgeGraphSearchTool,
  ragSearchTool,
  listDocumentsTool,
  getDocumentContentTool,
  substanceDoseTool,
  saveNoteTool,
  listNotesTool,
  deleteNoteTool,
];

// Estado del Agente
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  userId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  conversationId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  retrievedDocs: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  userContext: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => ({}),
  }),
});

export class LangGraphAgentService {
  private knowledgeBaseChunks: EmbeddingChunk[] = [];
  private checkpointer = new MemorySaver();

  constructor() {
    // Inicialización diferida - solo cuando se necesite
    // this.initVectorStore().catch(console.error);
  }

  /**
   * Inicializa la base de conocimientos desde la carpeta knowledge_base
   */
  public async initVectorStore() {
    try {
      const kbPath = path.resolve(process.cwd(), 'knowledge_base');

      const loadFiles = async (dir: string): Promise<{ pageContent: string; metadata: any }[]> => {
        let results: { pageContent: string; metadata: any }[] = [];
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          if (file.isDirectory()) {
            results = results.concat(await loadFiles(fullPath));
          } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
            const content = await fs.readFile(fullPath, 'utf8');
            results.push({ pageContent: content, metadata: { source: file.name } });
          }
        }
        return results;
      };

      const docs = await loadFiles(kbPath);
      let allChunks: EmbeddingChunk[] = [];

      for (const doc of docs) {
        const chunks = chunkingService.chunkDocument(doc.pageContent, doc.metadata.source, {
          file: doc.metadata.source,
        });
        allChunks = allChunks.concat(chunks);
      }

      this.knowledgeBaseChunks = await embeddingsService.embedChunks(allChunks);
      console.log(
        `✅ Base de conocimientos local inicializada con ${this.knowledgeBaseChunks.length} chunks.`
      );
    } catch (error) {
      console.error('❌ Error al inicializar el knowledge base:', error);
    }
  }

  /**
   * Realiza una búsqueda semántica en la base de conocimientos local
   */
  public async searchKnowledgeBase(query: string, topK: number = 3): Promise<string> {
    // Inicialización diferida deshabilitada - usar initVectorStore() manualmente si es necesario
    // if (this.knowledgeBaseChunks.length === 0) {
    //   await this.initVectorStore();
    // }

    if (this.knowledgeBaseChunks.length === 0) {
      return 'Base de conocimientos no inicializada. Use initVectorStore() primero.';
    }

    const queryResult = await embeddingsService.generateEmbedding(query);
    const queryEmb = queryResult.embedding;

    const scoredChunks = this.knowledgeBaseChunks
      .filter((c) => c.embedding)
      .map((chunk) => ({
        chunk,
        score: embeddingsService.cosineSimilarity(queryEmb, chunk.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    if (scoredChunks.length === 0) return 'No se encontraron resultados relevantes.';

    return scoredChunks
      .map((r) => `[FUENTE: ${r.chunk.source}] (Score: ${r.score.toFixed(4)})\n${r.chunk.content}`)
      .join('\n\n---\n\n');
  }

  /**
   * Lista todos los documentos disponibles
   */
  public async listKnowledgeBaseDocuments(): Promise<string[]> {
    const kbPath = path.resolve(process.cwd(), 'knowledge_base');
    const getFiles = async (dir: string): Promise<string[]> => {
      let results: string[] = [];
      const files = await fs.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        const relPath = path.relative(kbPath, fullPath);
        if (file.isDirectory()) {
          results = results.concat(await getFiles(fullPath));
        } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
          results.push(relPath);
        }
      }
      return results;
    };
    return getFiles(kbPath);
  }

  /**
   * Obtiene el modelo LLM configurado por el usuario
   */
  private async getUserLLM(userId: string) {
    const user = await UserModel.findById(userId);

    // Prioridad: 1) API key del usuario, 2) OPENAI_API_KEY, 3) LLM_API_KEY genérica
    let apiKey =
      process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || aiDefaultConfig.openaiApiKey;
    let modelName = process.env.LLM_MODEL || aiDefaultConfig.modelName || 'gpt-4o-mini';
    let provider = process.env.LLM_PROVIDER || 'openai';
    let configuration: any = {};

    // Si el usuario tiene configuración propia, tiene prioridad
    if (user && user.llm_api_key) {
      apiKey = decrypt(user.llm_api_key);
      modelName = user.llm_model || modelName;
      provider = user.llm_provider || provider;
    }

    // Configurar el cliente según el proveedor
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
      // Proveedor genérico compatible con OpenAI
      configuration = {
        baseURL: process.env.LLM_BASE_URL,
        apiKey: apiKey,
        defaultHeaders: {
          Authorization: `Bearer ${apiKey}`,
        },
      };
    }

    if (!apiKey) {
      throw new Error(
        'No API key configured for LLM. Set OPENAI_API_KEY or LLM_API_KEY in server .env'
      );
    }

    console.log(
      `🤖 Inicializando LLM para usuario ${userId}: Provider=${provider}, Model=${modelName}, BaseURL=${configuration.baseURL || 'default (OpenAI)'}, Key=${apiKey.substring(0, 5)}...`
    );

    const llmConfig: any = {
      apiKey: apiKey,
      openAIApiKey: apiKey,
      modelName: modelName as string,
      model: modelName as string,
      temperature: 0.7,
      maxTokens: 8192,
      streaming: true,
      configuration: configuration,
    };

    return new ChatOpenAI(llmConfig);
  }

  /**
   * Nodo: Agente Inteligente (Decide si usar herramientas o responder)
   */
  private async agentNode(
    state: typeof AgentState.State
  ): Promise<Partial<typeof AgentState.State>> {
    const llm = await this.getUserLLM(state.userId);
    const llmWithTools = llm.bindTools(TOOLS);

    // Asegurar que el usuario existe en el Grafo (Neo4j)
    try {
      await neo4jService.upsertUser({
        id: state.userId,
        pais: state.userContext?.pais || 'Chile',
        nombre: state.userContext?.nombre || 'Paciente',
      });
    } catch (err) {
      console.error('⚠️ [NEO4J] Falló upsertUser:', err);
    }

    // Leer historial y preferencias para el prompt
    const history = await messageModel.getContextHistory(state.userId, 'preference');
    const memoryContext = history.map((h) => `- ${h.key}: ${JSON.stringify(h.value)}`).join('\n');

    const sysPrompt = getLUAProSystemPrompt({
      userContext: state.userContext,
      retrievedDocs: state.retrievedDocs || '',
      memoryContext: memoryContext,
      webSearchContext: '',
    });

    const messages = [new SystemMessage(sysPrompt), ...state.messages];

    const response = await llmWithTools.invoke(messages);
    return { messages: [response] };
  }

  /**
   * Nodo: Memoria Avanzada
   * Extrae insights del usuario o lee memoria histórica
   */
  private async memoryNode(
    state: typeof AgentState.State
  ): Promise<Partial<typeof AgentState.State>> {
    const lastMessage = state.messages[state.messages.length - 1];

    // Leer preferencias previas
    const history = await messageModel.getContextHistory(state.userId, 'preference');
    const memoryContext = history.map((h) => `- ${h.key}: ${JSON.stringify(h.value)}`).join('\n');

    // Extraer nueva memoria del usuario si es posible
    if (lastMessage && lastMessage instanceof HumanMessage) {
      const llm = await this.getUserLLM(state.userId);
      const extractionPrompt = `Eres un extractor de memoria clínica. 
Extrae datos relevantes sobre el usuario de su mensaje, si los hay (e.g. preferencias, nombre, estados de ánimo prolongados, triggers, objetivos).
Devuelve en formato JSON: { "key": "nombre de la preferencia", "value": "valor detectado" } o devuelve un array vacío [] si no hay datos nuevos.
Mensaje: "${lastMessage.content}"`;

      try {
        const response = await llm.invoke([new SystemMessage(extractionPrompt)]);
        const contentStr = response.content.toString();
        const jsonMatch = contentStr.match(/\[.*\]/s) || contentStr.match(/\{.*\}/s);

        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          const data = Array.isArray(extracted) ? extracted : [extracted];
          console.log(
            `[MEMORY] Extracted ${data.length} new insights:`,
            JSON.stringify(data, null, 2)
          );
          for (const item of data) {
            if (item.key && item.value) {
              // 1. Persistir en MySQL (Contexto inmediato)
              await messageModel.saveContextHistory(
                state.userId,
                'preference',
                item.key,
                item.value,
                undefined,
                5
              );

              // 2. Persistir en Neo4j (Exploración de conocimiento)
              try {
                const query = `
                  MATCH (u:Usuario {id: $userId})
                  MERGE (attr:Atributo {nombre: $key})
                  MERGE (u)-[r:TIENE_PREFERENCIA]->(attr)
                  SET r.valor = $value, r.actualizado = datetime()
                `;
                await neo4jService.executeWrite(query, {
                  userId: state.userId,
                  key: item.key,
                  value: item.value,
                });
                console.log(`[NEO4J] Insight guardado: ${item.key}=${item.value}`);
              } catch (err) {
                console.error('⚠️ [NEO4J] Error persistiendo insight:', err);
              }
            }
          }
        }
      } catch (err) {
        // Ignorar falla de extracción
      }
    }

    const fullContext = {
      ...state.userContext,
      historicalMemory: memoryContext,
    };

    return { userContext: fullContext };
  }

  /**
   * Compila y ejecuta el grafo basado en herramientas
   */
  public async executeAgent(
    conversationId: string,
    userId: string,
    messageContent: string,
    userContextParams: any
  ) {
    const toolNode = new ToolNode(TOOLS);

    const workflow = new StateGraph(AgentState)
      .addNode('agent', this.agentNode.bind(this))
      .addNode('tools', toolNode)
      .addNode('memory', this.memoryNode.bind(this))
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', toolsCondition)
      .addEdge('tools', 'agent')
      .addEdge('agent', 'memory')
      .addEdge('memory', END);

    const app = workflow.compile({ checkpointer: this.checkpointer });

    const threadId = conversationId;
    const config = { configurable: { thread_id: threadId } };

    const historyMessages = await this.getHistoryMessages(conversationId);
    const initialState = {
      messages: [...historyMessages, new HumanMessage(messageContent)],
      userId,
      conversationId,
      userContext: userContextParams,
    };

    const finalState = await app.invoke(initialState, config);
    const finalMessages = finalState.messages;
    const lastMsg = finalMessages[finalMessages.length - 1];

    // Asegurarse de que el contenido es string
    let contentStr = '';
    if (lastMsg && typeof lastMsg.content === 'string') {
      contentStr = lastMsg.content;
    } else if (lastMsg && Array.isArray(lastMsg.content)) {
      contentStr = lastMsg.content.map((c: any) => c.text || JSON.stringify(c)).join('');
    }

    return {
      content: contentStr || '...',
      retrievedContext: finalState.retrievedDocs,
    };
  }

  /**
   * Ejecuta el agente con soporte de streaming y eventos de herramientas
   */
  public async *executeAgentStream(
    conversationId: string,
    userId: string,
    messageContent: string,
    userContextParams: any
  ) {
    const toolNode = new ToolNode(TOOLS);

    const workflow = new StateGraph(AgentState)
      .addNode('agent', this.agentNode.bind(this))
      .addNode('tools', toolNode)
      .addNode('memory', this.memoryNode.bind(this))
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', toolsCondition)
      .addEdge('tools', 'agent')
      .addEdge('agent', 'memory')
      .addEdge('memory', END);

    const app = workflow.compile({ checkpointer: this.checkpointer });

    const config = {
      configurable: { thread_id: conversationId },
      recursionLimit: 25,
    };

    const historyMessages = await this.getHistoryMessages(conversationId);
    const initialState = {
      messages: [...historyMessages, new HumanMessage(messageContent)],
      userId,
      conversationId,
      userContext: userContextParams,
    };

    console.log(`🚀 Iniciando stream de eventos para usuario ${userId}...`);

    const eventStream = app.streamEvents(initialState, {
      version: 'v2',
      ...config,
    });

    for await (const event of eventStream) {
      const eventType = event.event;

      // Token del modelo de chat
      if (eventType === 'on_chat_model_stream') {
        const content = event.data?.chunk?.content;
        if (content) {
          yield { type: 'token', content };
        }
      }

      // Inicio de herramienta
      else if (eventType === 'on_tool_start') {
        yield {
          type: 'tool_start',
          tool: event.name,
          input: event.data?.input,
        };
      }

      // Fin de herramienta
      else if (eventType === 'on_tool_end') {
        yield {
          type: 'tool_end',
          tool: event.name,
          output: event.data?.output,
        };
      }
    }
  }

  /**
   * Recupera el historial de la conversación desde la DB para contexto
   */
  private async getHistoryMessages(conversationId: string, limit = 10): Promise<BaseMessage[]> {
    try {
      const dbMessages = await messageModel.getMessageHistory(conversationId, limit);
      return dbMessages.map((m) => {
        if (m.role === 'assistant') {
          return new AIMessage(m.content);
        } else {
          return new HumanMessage(m.content);
        }
      });
    } catch (error) {
      console.error('❌ Error al cargar historial:', error);
      return [];
    }
  }

  /**
   * Genera un título corto para la conversación basado en el mensaje inicial
   */
  public async generateConversationTitle(userId: string, firstMessage: string): Promise<string> {
    try {
      const llm = await this.getUserLLM(userId);
      const prompt = `Genera un título muy corto (máximo 4 palabras) y descriptivo para una sesión de chat basada en este mensaje del usuario: "${firstMessage}". 
Responde ÚNICAMENTE con el título en español, sin comillas, sin puntos finales y sin preámbulos.`;

      const response = await llm.invoke([new HumanMessage(prompt)]);
      let title = response.content.toString().trim();

      // Limpiar por si acaso el LLM ignora las instrucciones
      title = title.replace(/["'./]/g, '');
      if (title.length > 50) title = title.substring(0, 47) + '...';

      return title;
    } catch (error) {
      console.error('❌ Error al generar título de conversación:', error);
      return 'Conversación de apoyo';
    }
  }
}

export const langGraphAgent = new LangGraphAgentService();
