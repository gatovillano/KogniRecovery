/**
 * Índice de servicios
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

// Servicios de autenticación
export * from './auth.service.js';
export { default as authService } from './auth.service.js';

// Servicios de Neo4j (Sprint 3)
export * from './neo4j.service.js';
export { default as neo4jService } from './neo4j.service.js';

// Servicios de Embeddings (Sprint 3)
export * from './embedding.service.js';
export { default as embeddingsService } from './embedding.service.js';
export { default as chunkingService } from './embedding.service.js';

// Servicios RAG (Sprint 3)
export * from './rag.service.js';
export { default as ragService } from './rag.service.js';

// Servicios de Alertas (Sprint 3)
export * from './alert.service.js';
export { default as alertService } from './alert.service.js';

// Servicio de TTS (Sprint 4)
export * from './tts.service.js';
export { default as ttsService } from './tts.service.js';
