/**
 * Configuración de conexión a Neo4j
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 * Sprint 3: Knowledge Graph
 */

import neo4j, { Driver } from 'neo4j-driver';

// =====================================================
// INTERFACES DE CONFIGURACIÓN
// =====================================================

export interface Neo4jConfig {
  uri: string;
  user: string;
  password: string;
  database: string;
  maxConnectionPoolSize: number;
  connectionAcquisitionTimeout: number;
  maxTransactionRetryTime: number;
  initialDefaultAccess: 'READ' | 'WRITE';
}

// =====================================================
// CONFIGURACIÓN
// =====================================================

const getRequired = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getOptional = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

const getOptionalNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

export const neo4jConfig: Neo4jConfig = {
  uri: getOptional('NEO4J_URI', 'bolt://localhost:7687'),
  user: getOptional('NEO4J_USER', 'neo4j'),
  password: getOptional('NEO4J_PASSWORD', 'password'),
  database: getOptional('NEO4J_DATABASE', 'neo4j'),
  maxConnectionPoolSize: getOptionalNumber('NEO4J_POOL_SIZE', 50),
  connectionAcquisitionTimeout: getOptionalNumber('NEO4J_CONNECTION_TIMEOUT', 60000),
  maxTransactionRetryTime: getOptionalNumber('NEO4J_MAX_RETRY_TIME', 30000),
  initialDefaultAccess: 'WRITE',
};

// =====================================================
// DRIVER DE NEO4J
// =====================================================

interface Neo4jConnection {
  driver: Driver | null;
  isConnected: boolean;
}

const connection: Neo4jConnection = {
  driver: null,
  isConnected: false,
};

/**
 * Crea y configura el driver de Neo4j
 */
export const createNeo4jDriver = (): Driver => {
  const driver = neo4j.driver(
    neo4jConfig.uri,
    neo4j.auth.basic(neo4jConfig.user, neo4jConfig.password),
    {
      maxConnectionPoolSize: neo4jConfig.maxConnectionPoolSize,
      connectionAcquisitionTimeout: neo4jConfig.connectionAcquisitionTimeout,
      maxTransactionRetryTime: neo4jConfig.maxTransactionRetryTime,
    }
  );

  // El driver de Neo4j v5 no usa .on('error') directamente
  // Se suele verificar con verifyConnectivity()

  connection.driver = driver;
  return driver;
};

/**
 * Obtiene el driver de Neo4j (Singleton)
 */
export const getNeo4jDriver = (): Driver => {
  if (!connection.driver) {
    connection.driver = createNeo4jDriver();
  }
  return connection.driver;
};

/**
 * Verifica la conexión a Neo4j
 */
export const checkNeo4jConnection = async (): Promise<boolean> => {
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({ database: neo4jConfig.database });

    await session.run('RETURN 1 AS test');
    await session.close();

    connection.isConnected = true;
    return true;
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error);
    connection.isConnected = false;
    return false;
  }
};

/**
 * Cierra la conexión a Neo4j
 */
export const closeNeo4jConnection = async (): Promise<void> => {
  if (connection.driver) {
    await connection.driver.close();
    connection.driver = null;
    connection.isConnected = false;
    console.log('🔌 Neo4j connection closed');
  }
};

/**
 * Obtiene el estado de la conexión
 */
export const isNeo4jConnected = (): boolean => {
  return connection.isConnected;
};

// =====================================================
// EXPORTAR CONFIGURACIÓN ADICIONAL PARA RAG
// =====================================================

export interface VectorStoreConfig {
  provider: 'pinecone' | 'qdrant' | 'weaviate';
  apiKey: string;
  environment?: string;
  indexName: string;
  dimension: number;
}

export interface AIConfig {
  openaiApiKey: string;
  azureEndpoint?: string;
  azureApiKey?: string;
  modelName: string;
  embeddingModel: string;
  maxTokens: number;
  temperature: number;
}

export const vectorStore: VectorStoreConfig = {
  provider: getOptional('VECTOR_STORE_PROVIDER', 'pinecone') as VectorStoreConfig['provider'],
  apiKey: getOptional('VECTOR_STORE_API_KEY', ''),
  environment: getOptional('VECTOR_STORE_ENVIRONMENT', ''),
  indexName: getOptional('VECTOR_STORE_INDEX', 'kognirecovery'),
  dimension: 384, // Local embedding dimension
};

export const ai: AIConfig = {
  openaiApiKey: getOptional('OPENAI_API_KEY', ''),
  azureEndpoint: getOptional('AZURE_OPENAI_ENDPOINT', ''),
  azureApiKey: getOptional('AZURE_OPENAI_KEY', ''),
  modelName: getOptional('OPENAI_MODEL', 'gpt-4-turbo'),
  embeddingModel: getOptional('OPENAI_EMBEDDING_MODEL', 'Xenova/all-MiniLM-L6-v2'),
  maxTokens: getOptionalNumber('OPENAI_MAX_TOKENS', 1000),
  temperature: 0.7,
};

