/**
 * Servicio de Embeddings
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 * Sprint 3: Pipeline RAG
 */

import { pipeline } from '@xenova/transformers';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

export interface EmbeddingChunk {
  id: string;
  content: string;
  source: string;
  sourceType: 'document' | 'faq' | 'technique' | 'resource' | 'kg' | 'conversation';
  metadata: {
    title?: string;
    category?: string;
    tags?: string[];
    country?: string[];
    audience?: string[];
    language?: string;
    [key: string]: any;
  };
  embedding?: number[];
}

export interface ContextualEmbeddingOptions {
  userId?: string;
  profile?: string;
  etapaCambio?: string;
  sustancias?: string[];
  pais?: string;
}

// =====================================================
// SERVICIO DE EMBEDDINGS
// =====================================================

class EmbeddingsService {
  private extractor: any = null;
  private modelName: string;
  private dimension: number;

  constructor() {
    this.modelName = 'Xenova/paraphrase-MiniLM-L3-v2';
    this.dimension = 384; // Dimensión para paraphrase-MiniLM-L3-v2
  }

  /**
   * Inicializa el modelo extractor de forma perezosa
   */
  private async getExtractor() {
    if (!this.extractor) {
      this.extractor = await pipeline('feature-extraction', this.modelName);
    }
    return this.extractor;
  }

  /**
   * Genera un embedding para un texto con fallback a Mock si falla la red
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const extractor = await this.getExtractor();
      const output = await extractor(text, { pooling: 'mean', normalize: true });

      const embedding = Array.from(output.data) as number[];

      return {
        embedding,
        tokens: text.length / 4,
      };
    } catch (error) {
      console.warn(
        '⚠️ Falló el embedding local (posible error de red). Usando Mock embedding por ahora...'
      );

      // Fallback: Generar un vector determinista basado en el texto
      const mockEmbedding = new Array(this.dimension).fill(0).map((_, i) => {
        const charCode = text.charCodeAt(i % text.length) || 0;
        return (charCode / 255) * (i % 2 === 0 ? 1 : -1);
      });

      return {
        embedding: mockEmbedding,
        tokens: text.length / 4,
      };
    }
  }

  /**
   * Genera embeddings para múltiples textos en batches paralelos
   */
  async generateEmbeddings(texts: string[], batchSize: number = 4): Promise<EmbeddingResult[]> {
    try {
      const results: EmbeddingResult[] = [];

      // Procesar en batches paralelos para aprovechar mejor la CPU
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map((text) => this.generateEmbedding(text)));
        results.push(...batchResults);

        if (i % (batchSize * 5) === 0 && i > 0) {
          console.log(`   📊 Embeddings progreso: ${results.length}/${texts.length}`);
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Error generating embeddings local:', error);
      throw new Error(`Failed to generate embeddings: ${error}`);
    }
  }

  /**
   * Genera un embedding con contexto adicional del usuario
   * Esto mejora la relevancia de las búsquedas
   */
  async generateContextualEmbedding(
    text: string,
    context: ContextualEmbeddingOptions
  ): Promise<EmbeddingResult> {
    const contextualParts: string[] = [];

    // Agregar contexto del usuario si está disponible
    if (context.profile) {
      contextualParts.push(`Perfil: ${context.profile}`);
    }

    if (context.etapaCambio) {
      contextualParts.push(`Etapa de cambio: ${context.etapaCambio}`);
    }

    if (context.sustancias && context.sustancias.length > 0) {
      contextualParts.push(`Sustancias: ${context.sustancias.join(', ')}`);
    }

    if (context.pais) {
      contextualParts.push(`País: ${context.pais}`);
    }

    // Construir texto con contexto
    const contextualText =
      contextualParts.length > 0 ? `[Contexto: ${contextualParts.join(' | ')}] ${text}` : text;

    return this.generateEmbedding(contextualText);
  }

  /**
   * Genera embedding para un chunk
   */
  async embedChunk(chunk: EmbeddingChunk): Promise<EmbeddingChunk> {
    const result = await this.generateEmbedding(chunk.content);

    return {
      ...chunk,
      embedding: result.embedding,
    };
  }

  /**
   * Genera embeddings para múltiples chunks
   */
  async embedChunks(chunks: EmbeddingChunk[]): Promise<EmbeddingChunk[]> {
    const texts = chunks.map((chunk) => chunk.content);
    const results = await this.generateEmbeddings(texts);

    return chunks.map((chunk, index) => {
      const result = results[index];
      return {
        ...chunk,
        embedding: result ? result.embedding : undefined,
      };
    });
  }

  /**
   * Calcula la similitud coseno entre dos vectores
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calcula la distancia euclidiana entre dos vectores
   */
  euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }

    return Math.sqrt(sum);
  }

  /**
   * Obtiene la dimensión de los embeddings
   */
  getDimension(): number {
    return this.dimension;
  }

  /**
   * Obtiene el nombre del modelo de embedding
   */
  getModelName(): string {
    return this.modelName;
  }
}

// =====================================================
// SERVICIO DE CHUNKING
// =====================================================

class ChunkingService {
  private readonly CHUNK_SIZE = 512;
  private readonly CHUNK_OVERLAP = 50;

  /**
   * Divide un documento en chunks
   */
  chunkDocument(
    text: string,
    source: string,
    metadata: Record<string, any> = {}
  ): EmbeddingChunk[] {
    const chunks: EmbeddingChunk[] = [];
    const sentences = this.splitIntoSentences(text);

    let currentChunk = '';
    let chunkId = 0;

    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length > this.CHUNK_SIZE) {
        if (currentChunk.trim()) {
          chunks.push({
            id: `${source}_${chunkId++}`,
            content: currentChunk.trim(),
            source,
            sourceType: 'document',
            metadata,
          });
        }

        // Mantener overlap
        const words = currentChunk.split(' ');
        currentChunk = words.slice(-this.CHUNK_OVERLAP).join(' ') + ' ' + sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        id: `${source}_${chunkId}`,
        content: currentChunk.trim(),
        source,
        sourceType: 'document',
        metadata,
      });
    }

    return chunks;
  }

  /**
   * Divide un texto en oraciones
   */
  private splitIntoSentences(text: string): string[] {
    // Considerar español e inglés
    const matches = text.match(/[^.!?]+[.!?]+/g);
    return matches ? matches.map((s) => s.trim()) : [text];
  }

  /**
   * Chunk de FAQs
   */
  chunkFAQs(
    faqs: Array<{
      question: string;
      answer: string;
      category?: string;
      tags?: string[];
      audience?: string[];
    }>
  ): EmbeddingChunk[] {
    return faqs.map((faq, index) => ({
      id: `faq_${index}`,
      content: `Pregunta: ${faq.question}\nRespuesta: ${faq.answer}`,
      source: 'faq',
      sourceType: 'faq',
      metadata: {
        category: faq.category || 'general',
        tags: faq.tags || [],
        audience: faq.audience || [],
      },
    }));
  }

  /**
   * Chunk de técnicas terapéuticas
   */
  chunkTechniques(
    techniques: Array<{
      name: string;
      description: string;
      steps: string[];
      category: string;
      tags?: string[];
      audience?: string[];
    }>
  ): EmbeddingChunk[] {
    return techniques.map((technique, index) => ({
      id: `technique_${index}`,
      content: `Técnica: ${technique.name}\n${technique.description}\nPasos: ${technique.steps.join(', ')}`,
      source: 'techniques',
      sourceType: 'technique',
      metadata: {
        category: technique.category,
        tags: technique.tags || [],
        audience: technique.audience || [],
      },
    }));
  }

  /**
   * Chunk de recursos
   */
  chunkResources(
    resources: Array<{
      id: string;
      title: string;
      content: string;
      type: string;
      paises?: string[];
      etiquetas?: string[];
    }>
  ): EmbeddingChunk[] {
    return resources.map((resource) => ({
      id: `resource_${resource.id}`,
      content: `${resource.title}\n${resource.content}`,
      source: 'resources',
      sourceType: 'resource',
      metadata: {
        title: resource.title,
        category: resource.type,
        country: resource.paises || [],
        tags: resource.etiquetas || [],
      },
    }));
  }
}

// =====================================================
// EXPORTAR INSTANCIAS
// =====================================================

export const embeddingsService = new EmbeddingsService();
export const chunkingService = new ChunkingService();

export default embeddingsService;
