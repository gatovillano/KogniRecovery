/**
 * Configuración y pool de conexiones a PostgreSQL
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import pg, { PoolClient, QueryResult, PoolConfig } from 'pg';
import { database } from './index.js';

const { Pool, types } = pg;

// Configurar parsing de tipos
types.setTypeParser(1700, (value: string) => parseFloat(value));
types.setTypeParser(1114, (value: string) => new Date(value));
types.setTypeParser(1184, (value: string) => new Date(value));
types.setTypeParser(2950, (value: string) => value); // UUID

// =====================================================
// POOL DE CONEXIONES
// =====================================================

interface PoolConnection {
  pool: Pool | null;
  isConnected: boolean;
}

const connection: PoolConnection = {
  pool: null,
  isConnected: false,
};

/**
 * Crea y configura el pool de conexiones
 */
export const createPool = (): Pool => {
  const config: PoolConfig = {
    connectionString: database.url,
    max: database.poolMax,
    min: database.poolMin,
    idleTimeoutMillis: database.poolIdleTimeout,
    allowExitOnIdle: false,
    ssl: database.url.includes('localhost') ? false : { rejectUnauthorized: false },
  };

  const pool = new Pool(config);

  // Evento: error en el pool
  pool.on('error', (err: Error) => {
    console.error('🔥 Unexpected pool error:', err.message);
    connection.isConnected = false;
  });

  // Evento: conexión establecida
  pool.on('connect', () => {
    console.log('✅ Database connection established');
    connection.isConnected = true;
  });

  // Evento: conexión terminada
  pool.on('end', () => {
    console.log('🔌 Database connection closed');
    connection.isConnected = false;
  });

  return pool;
};

/**
 * Inicializa el pool de conexiones
 */
export const initDatabase = async (): Promise<Pool> => {
  if (connection.pool) {
    return connection.pool;
  }

  connection.pool = createPool();

  // Verificar conexión
  try {
    const client = await connection.pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('🗄️  PostgreSQL connected:', {
      time: result.rows[0]?.current_time,
      version: result.rows[0]?.pg_version?.substring(0, 50),
    });
    client.release();
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }

  return connection.pool;
};

/**
 * Obtiene el pool de conexiones
 */
export const getPool = (): Pool => {
  if (!connection.pool) {
    throw new Error('Database pool not initialized. Call initDatabase() first.');
  }
  return connection.pool;
};

/**
 * Verifica el estado de la conexión
 */
export const isConnected = (): boolean => {
  return connection.isConnected;
};

/**
 * Ejecuta una consulta con parámetros
 */
export const query = async <T = unknown>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Query executed:', {
        duration: `${duration}ms`,
        rows: result.rowCount,
        text: text.substring(0, 100)
      });
    }

    return result;
  } catch (error) {
    console.error('❌ Query error:', { text, params, error });
    throw error;
  }
};

/**
 * Ejecuta una consulta en una transacción
 */
export const queryWithTransaction = async <T = unknown>(
  callback: (client: PoolClient) => Promise<QueryResult<T>>
): Promise<QueryResult<T>> => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Obtiene un cliente del pool
 */
export const getClient = async (): Promise<PoolClient> => {
  const pool = getPool();
  return pool.connect();
};

/**
 * Cierra el pool de conexiones
 */
export const closePool = async (): Promise<void> => {
  if (connection.pool) {
    await connection.pool.end();
    connection.pool = null;
    connection.isConnected = false;
    console.log('🔌 Database pool closed');
  }
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default {
  initDatabase,
  getPool,
  isConnected,
  query,
  queryWithTransaction,
  getClient,
  closePool,
};
