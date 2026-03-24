import { MemorySaver, StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, BaseMessage, AIMessage } from '@langchain/core/messages';
import * as UserModel from '../models/user.model.js';
import * as messageModel from '../models/message.model.js';
import { decrypt } from '../utils/encryption.js';
import { searchService, SearchResult } from './search.service.js';
import { ai as aiDefaultConfig } from '../config/neo4j.js';
import fs from 'fs/promises';
import path from 'path';
import { embeddingsService, chunkingService, EmbeddingChunk } from './embedding.service.js';

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
    this.initVectorStore().catch(console.error);
  }

  /**
   * Inicializa la base de conocimientos desde la carpeta knowledge_base
   */
  private async initVectorStore() {
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
        const chunks = chunkingService.chunkDocument(doc.pageContent, doc.metadata.source, { file: doc.metadata.source });
        allChunks = allChunks.concat(chunks);
      }

      this.knowledgeBaseChunks = await embeddingsService.embedChunks(allChunks);
      console.log(`✅ Base de conocimientos local inicializada con ${this.knowledgeBaseChunks.length} chunks.`);
    } catch (error) {
      console.error('❌ Error al inicializar el knowledge base:', error);
    }
  }

  /**
   * Obtiene el modelo LLM configurado por el usuario
   */
  private async getUserLLM(userId: string) {
    const user = await UserModel.findById(userId);

    // Prioridad: 1) API key del usuario, 2) OPENAI_API_KEY, 3) LLM_API_KEY genérica
    let apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || aiDefaultConfig.openaiApiKey;
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
        apiKey: apiKey, // Importante para OpenRouter en algunas versiones
        defaultHeaders: {
          'HTTP-Referer': 'https://kognirecovery.com',
          'X-Title': 'KogniRecovery',
        },
      };
    } else if (provider.toLowerCase() !== 'openai' && process.env.LLM_BASE_URL) {
      // Proveedor genérico compatible con OpenAI
      configuration = { 
        baseURL: process.env.LLM_BASE_URL,
        apiKey: apiKey
      };
    }

    if (!apiKey) {
      throw new Error('No API key configured for LLM. Set OPENAI_API_KEY or LLM_API_KEY in server .env');
    }

    console.log(`🤖 Inicializando LLM para usuario ${userId}: Provider=${provider}, Model=${modelName}, BaseURL=${configuration.baseURL || 'default (OpenAI)'}, Key=${apiKey.substring(0, 5)}...`);

    return new ChatOpenAI({
      apiKey: apiKey, 
      openAIApiKey: apiKey, 
      modelName: modelName as string,
      model: modelName as string,
      temperature: 0.7,
      maxTokens: 8192,
      configuration,
      streaming: true 
    });
  }

  /**
   * Nodo: Recuperar información de la base unificada de conocimientos
   */
  private async retrieveNode(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage || !(lastMessage instanceof HumanMessage)) return {};

    const query = lastMessage.content.toString();
    const queryResult = await embeddingsService.generateEmbedding(query);
    const queryEmb = queryResult.embedding;

    // Calcular similitud coseno con todos los chunks
    const scoredChunks = this.knowledgeBaseChunks
      .filter(c => c.embedding)
      .map(chunk => ({
        chunk,
        score: embeddingsService.cosineSimilarity(queryEmb, chunk.embedding!)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // top 3

    const docsStr = scoredChunks.map(r => r.chunk.content).join('\n\n');

    console.log(`[RETRIEVE] Query: "${query}" | Chunks found: ${scoredChunks.length} | Top score: ${scoredChunks[0]?.score?.toFixed(4) || 'N/A'}`);

    return { retrievedDocs: docsStr };
  }

  /**
   * Nodo: Memoria Avanzada
   * Extrae insights del usuario o lee memoria histórica
   */
  private async memoryNode(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    const lastMessage = state.messages[state.messages.length - 1];
    
    // Leer preferencias previas
    const history = await messageModel.getContextHistory(state.userId, 'preference');
    const memoryContext = history.map(h => `- ${h.key}: ${JSON.stringify(h.value)}`).join('\n');

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
        const jsonMatch = contentStr.match(/\\[.*\\]/s) || contentStr.match(/\\{.*\\}/s);
        
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          const data = Array.isArray(extracted) ? extracted : [extracted];
          console.log(`[MEMORY] Extracted ${data.length} new insights:`, JSON.stringify(data, null, 2));
          for (const item of data) {
            if (item.key && item.value) {
              await messageModel.saveContextHistory(
                state.userId,
                'preference',
                item.key,
                item.value,
                undefined,
                5
              );
            }
          }
        }
      } catch (err) {
        // Ignorar falla de extracción
      }
    }

    const fullContext = {
      ...state.userContext,
      historicalMemory: memoryContext
    };

    return { userContext: fullContext };
  }

  /**
   * Nodo: Generación (LLM principal)
   */
  private async generateNode(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    try {
      const llm = await this.getUserLLM(state.userId);
      
      const sysPrompt = `Eres LÚA 🌙, el asistente empático de acompañamiento de KogniRecovery.
Estás diseñado para apoyar a usuarios en recuperación de adicciones.

Contexto del usuario:
${JSON.stringify(state.userContext)}

Información Científica y de Respaldo Recuperada de RAG:
${state.retrievedDocs}

Responde de manera empática, con respaldo científico si aplica, y tomando en cuenta la memoria y contexto del usuario.`;

      const instructions = new SystemMessage(sysPrompt);
      const messages = [instructions, ...state.messages];
      
      const response = await llm.invoke(messages);
      return { messages: [response] };
    } catch (err: any) {
      console.error('❌ Error en generateNode (probablemente falte una API Key):', err);
      // Fallback seguro si no hay LLM configurado o falla OpenAI
      const fallbackResponse = new AIMessage("Soy LÚA 🌙 y estoy aquí para escucharte. (Nota: Hubo un inconveniente al generar la respuesta con la IA. Por favor, verifica tu configuración de modelo o la conexión).");
      return { messages: [fallbackResponse] };
    }
  }

  /**
   * Compila y ejecuta el grafo
   */
  public async executeAgent(
    conversationId: string,
    userId: string,
    messageContent: string,
    userContextParams: any
  ) {
    const workflow = new StateGraph(AgentState)
      .addNode('retrieve', this.retrieveNode.bind(this))
      .addNode('memory', this.memoryNode.bind(this))
      .addNode('generate', this.generateNode.bind(this))
      .addEdge(START, 'retrieve')
      .addEdge('retrieve', 'memory')
      .addEdge('memory', 'generate')
      .addEdge('generate', END);

    const app = workflow.compile({ checkpointer: this.checkpointer });
    
    const threadId = conversationId;
    const config = { configurable: { thread_id: threadId } };

    const initialState = {
      messages: [new HumanMessage(messageContent)],
      userId,
      conversationId,
      userContext: userContextParams
    };

    const finalState = await app.invoke(initialState, config);
    const finalMessages = finalState.messages;
    const lastMsg = finalMessages[finalMessages.length - 1];
    
    // Asegurarse de que el contenido es string (LangChain puede devolver arrays en algunos modelos)
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
   * Ejecuta el agente con soporte de streaming
   */
  public async *executeAgentStream(
    conversationId: string,
    userId: string,
    messageContent: string,
    userContextParams: any
  ) {
    // 1. Cargar Memoria Histórica y Preferencias (Nodo de Memoria Simplificado)
    const history = await messageModel.getContextHistory(userId, 'preference');
    const memoryContext = history.map(h => `- ${h.key}: ${JSON.stringify(h.value)}`).join('\n');
    
    // 2. Recuperar Documentos Médicos (RAG)
    const queryResult = await embeddingsService.generateEmbedding(messageContent);
    const queryEmb = queryResult.embedding;
    const scoredChunks = this.knowledgeBaseChunks
      .filter(c => c.embedding)
      .map(chunk => ({
        chunk,
        score: embeddingsService.cosineSimilarity(queryEmb, chunk.embedding!)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    let docsStr = scoredChunks.map(r => r.chunk.content).join('\n\n');
    console.log(`[STREAMING][RETRIEVE] Query: "${messageContent}" | Top score: ${scoredChunks[0]?.score?.toFixed(4) || 'N/A'}`);

    // 2.5 Búsqueda Web Automática si el RAG es insuficiente o el tema es muy específico
    let webSearchContext = '';
    const shouldSearchWeb = scoredChunks.length === 0 || (scoredChunks.length > 0 && scoredChunks[0].score < 0.35);
    
    if (shouldSearchWeb) {
      console.log(`🔍 RAG insuficiente (score best: ${scoredChunks[0]?.score || 0}). Iniciando búsqueda web científica...`);
      const searchResults = await searchService.searchScientific(messageContent);
      
      if (searchResults.length > 0) {
        // Filtrar solo las más confiables para el prompt principal
        const trustedResults = searchResults.filter(r => r.isTrusted).slice(0, 2);
        const otherResults = searchResults.filter(r => !r.isTrusted).slice(0, 1);
        
        webSearchContext = [...trustedResults, ...otherResults].map(r => 
          `[FUENTE: ${r.isTrusted ? 'VERIFICADA' : 'EXTERNA'}] ${r.title}\nURL: ${r.url}\nResumen: ${r.content}`
        ).join('\n\n');
      }
    }

    // 3. Preparar Prompt con Contexto Completo
    const sysPrompt = `Eres LÚA 🌙, el asistente empático de acompañamiento de KogniRecovery.
Estás diseñado para apoyar a usuarios en recuperación de adicciones con base científica.

Contexto del usuario:
${JSON.stringify(userContextParams)}

Memoria del usuario (lo que sabemos de conversaciones previas):
${memoryContext || 'Aún no tenemos registros históricos de preferencias.'}

Información Científica (Local):
${docsStr || 'No se encontró información específica en la base local.'}

Información de Respaldo Externa (Búsqueda Web):
${webSearchContext || 'No se realizó búsqueda externa.'}

Instrucciones Críticas de Calidad:
- Cita siempre tus fuentes si provienen de la búsqueda externa.
- Da prioridad absoluta a las fuentes marcadas como [VERIFICADA] (NIH, WHO, Mayo Clinic, etc.).
- Si usas fuentes [EXTERNA], menciona que es información complementaria y no sustituye consejo médico.
- Si no encuentras información confiable, admítelo honestamente y ofrece apoyo empático basado en principios generales de recuperación.`;

    const messages = [
      new SystemMessage(sysPrompt),
      new HumanMessage(messageContent)
    ];

    const llm = await this.getUserLLM(userId);
    const stream = await llm.stream(messages);
    
    // 4. Iniciar Stream y simultáneamente extraer nuevos insights (en segundo plano)
    // No esperamos a la extracción para no retrasar los tokens
    this.extractAndSaveInsights(userId, messageContent).catch(err => 
      console.error('Error in background insight extraction:', err)
    );

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  }

  /**
   * Método de utilidad para extraer y guardar insights en segundo plano
   */
  private async extractAndSaveInsights(userId: string, content: string) {
    const llm = await this.getUserLLM(userId);
    const extractionPrompt = `Eres un extractor de memoria clínica. 
Extrae datos relevantes sobre el usuario de su mensaje, si los hay (preferencias, sustancia adictiva principal, nombre, triggers, objetivos).
Devuelve en formato JSON: { "key": "nombre de la preferencia", "value": "valor" } o devuelve [] si no hay datos.
Mensaje: "${content}"`;

    try {
      const response = await llm.invoke([new SystemMessage(extractionPrompt)]);
      const contentStr = response.content.toString();
      const jsonMatch = contentStr.match(/\[.*\]/s) || contentStr.match(/\{.*\}/s);
      
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        const data = Array.isArray(extracted) ? extracted : [extracted];
        console.log(`[STREAMING][MEMORY] Extracted ${data.length} new insights from "${content}":`, JSON.stringify(data, null, 2));
        for (const item of data) {
          if (item.key && item.value) {
            await messageModel.saveContextHistory(userId, 'preference', item.key, item.value, undefined, 5);
          }
        }
      }
    } catch (e) {
      // Silencioso
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
