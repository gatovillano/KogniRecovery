/**
 * Servicio de Neo4j - Knowledge Graph
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 * Sprint 3: Knowledge Graph Queries
 */

import { getNeo4jDriver, neo4jConfig } from '../config/neo4j.js';
import neo4j from 'neo4j-driver';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface UserContextData {
  id: string;
  nombre?: string;
  edad?: number;
  genero?: string;
  pais: string;
  etapaCambio: string;
  riesgo: string;
  fechaRegistro?: Date;
  ultimoCheckin?: Date;
  estado: string;
}

export interface CheckInData {
  id: string;
  fecha: Date;
  consumo: boolean;
  sustancia?: string;
  cantidad?: number;
  emociones: string[];
  notas?: string;
}

export interface CravingData {
  id: string;
  fecha: Date;
  intensidad: number;
  trigger: string[];
  sustancias: string[];
}

export interface InteractionData {
  sustancia: string;
  medicamento: string;
  severity: number;
  risk: string;
  description: string;
}

export interface DashboardData {
  checkinsSemana: number;
  promedioConsumo: number;
  cravingsSemana: number;
  promedioCraving: number;
  sustanciasActivas: string[];
  recursosRecomendados: any[];
}

// =====================================================
// SERVICIO DE NEO4J
// =====================================================

class Neo4jService {
  private driver: neo4j.Driver;

  constructor() {
    this.driver = getNeo4jDriver();
  }

  /**
   * Ejecuta una consulta Cypher y retorna los resultados
   */
  async executeQuery<T>(
    query: string,
    params: Record<string, any> = {}
  ): Promise<T[]> {
    const session = this.driver.session({ database: neo4jConfig.database });

    try {
      const result = await session.run(query, params);

      return result.records.map((record) => {
        const obj: any = {};
        record.keys.forEach((key) => {
          const value = record.get(key);

          // Convertir nodos a objetos
          if (value instanceof neo4j.types.Node) {
            obj[key] = this.nodeToObject(value);
          }
          // Convertir relaciones a objetos
          else if (value instanceof neo4j.types.Relationship) {
            obj[key] = this.relationToObject(value);
          }
          // Convertir fechas
          else if (value instanceof neo4j.types.DateTime) {
            obj[key] = value.toString();
          }
          else if (value instanceof neo4j.types.Date) {
            obj[key] = value.toString();
          }
          // Manejar arrays
          else if (Array.isArray(value)) {
            obj[key] = value.map((item) => {
              if (item instanceof neo4j.types.Node) {
                return this.nodeToObject(item);
              }
              return item;
            });
          }
          else {
            obj[key] = value;
          }
        });

        return obj as T;
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Ejecuta una transacción de escritura (Compatible con Driver v5)
   */
  async executeWrite(
    query: string,
    params: Record<string, any> = {}
  ): Promise<neo4j.types.Record[]> {
    const session = this.driver.session({ database: neo4jConfig.database });

    try {
      const result = await session.executeWrite(async (tx) => {
        return await tx.run(query, params);
      });

      return result.records;
    } finally {
      await session.close();
    }
  }

  /**
   * Convierte un nodo Neo4j a objeto JavaScript
   */
  private nodeToObject(node: neo4j.types.Node): any {
    return {
      id: node.identity.toString(),
      labels: node.labels,
      ...node.properties,
    };
  }

  /**
   * Convierte una relación Neo4j a objeto JavaScript
   */
  private relationToObject(relation: neo4j.types.Relationship): any {
    return {
      id: relation.identity.toString(),
      type: relation.type,
      ...relation.properties,
    };
  }

  // =====================================================
  // QUERIES DE CONTEXTO DEL CHATBOT
  // =====================================================

  /**
   * Obtiene el contexto relevante para el chatbot
   */
  async getChatbotContext(userId: string): Promise<any[]> {
    const query = `
      MATCH (u:Usuario {id: $userId})
      OPTIONAL MATCH (u)-[:TIENE_PERFIL]->(p:Perfil)
      OPTIONAL MATCH (u)-[:REGISTRA]->(c:CheckIn)
      WHERE c.fecha >= datetime() - duration({days: 7})
      OPTIONAL MATCH (c)-[:TIENE_ETIQUETA]->(e:Etiqueta)
      OPTIONAL MATCH (s:Sustancia)<-[:USA]-u
      OPTIONAL MATCH (s)-[i:INTERACTUA_CON]->(m:Medicamento)
      RETURN u, p, 
             collect(DISTINCT c) as checkins_recientes, 
             collect(DISTINCT e) as etiquetas,
             collect(DISTINCT s) as sustancias,
             collect(DISTINCT m) as medicamentos
      LIMIT 1
    `;

    return this.executeQuery(query, { userId });
  }

  /**
   * Obtiene el perfil del usuario
   */
  async getUserProfile(userId: string): Promise<any[]> {
    const query = `
      MATCH (u:Usuario {id: $userId})
      OPTIONAL MATCH (u)-[:TIENE_PERFIL]->(p:Perfil)
      RETURN u, p
      LIMIT 1
    `;

    return this.executeQuery(query, { userId });
  }

  /**
   * Obtiene las sustancias del usuario
   */
  async getUserSubstances(userId: string): Promise<any[]> {
    const query = `
      MATCH (u:Usuario {id: $userId})-[:USA]->(s:Sustancia)
      RETURN collect(DISTINCT s) as sustancias
    `;

    return this.executeQuery(query, { userId });
  }

  /**
   * Obtiene los medicamentos del usuario
   */
  async getUserMedications(userId: string): Promise<any[]> {
    const query = `
      MATCH (u:Usuario {id: $userId})-[:TOMA]->(m:Medicamento)
      RETURN collect(DISTINCT m) as medicamentos
    `;

    return this.executeQuery(query, { userId });
  }

  // =====================================================
  // QUERIES DE INTERACCIONES
  // =====================================================

  /**
   * Detecta interacciones peligrosas entre sustancias y medicamentos
   */
  async checkDrugInteractions(userId: string): Promise<InteractionData[]> {
    const query = `
      MATCH (s1:Sustancia)<-[:USA]-(u:Usuario {id: $userId})
      MATCH (m:Medicamento)<-[:TOMA]-(u)
      MATCH (s1)-[i:INTERACTUA_CON]->(m)
      WHERE i.severidad >= 7
      RETURN s1.nombre as sustancia, m.nombre as medicamento, 
             i.severidad as severity, i.riesgo as risk, 
             i.descripcion as description
      ORDER BY i.severidad DESC
    `;

    return this.executeQuery<InteractionData>(query, { userId });
  }

  /**
   * Detecta interacciones entre sustancias
   */
  async checkSubstanceInteractions(userId: string): Promise<any[]> {
    const query = `
      MATCH (s1:Sustancia)<-[:USA]-(u:Usuario {id: $userId})
      MATCH (s2:Sustancia)<-[:USA]-(u)
      WHERE s1 <> s2
      MATCH (s1)-[i:INTERACTUA_CON]->(s2)
      RETURN s1.nombre as sustancia1, s2.nombre as sustancia2,
             i.severidad as severity, i.riesgo as risk,
             i.descripcion as description
      ORDER BY i.severidad DESC
    `;

    return this.executeQuery(query, { userId });
  }

  // =====================================================
  // QUERIES DE INSIGHTS
  // =====================================================

  /**
   * Genera insights basados en patrones de check-in
   */
  async getCheckInInsights(userId: string): Promise<any[]> {
    const query = `
      MATCH (u:Usuario {id: $userId})-[:REGISTRA]->(c:CheckIn)
      WHERE c.fecha >= datetime() - duration({days: 30})
      MATCH (c)-[:TIENE_ETIQUETA]->(e:Etiqueta)
      WITH u, c, e, count(c) as frecuencia
      WHERE frecuencia > 3
      OPTIONAL MATCH (craving:Craving)<-[:EXPERIMENTA]-(u)
      WHERE craving.fecha >= datetime() - duration({days: 7})
      RETURN u,
             collect(DISTINCT e) as patrones_emocionales,
             collect(DISTINCT {fecha: craving.fecha, intensidad: craving.intensidad}) as cravings_recientes,
             frecuencia
      LIMIT 1
    `;

    return this.executeQuery(query, { userId });
  }

  /**
   * Obtiene estadísticas de cravings
   */
  async getCravingsStats(userId: string, days: number = 7): Promise<any[]> {
    const query = `
      MATCH (u:Usuario {id: $userId})-[:EXPERIMENTA]->(craving:Craving)
      WHERE craving.fecha >= datetime() - duration({days: $days})
      RETURN count(craving) as total_cravings,
             avg(craving.intensidad) as promedio_intensidad,
             max(craving.intensidad) as intensidad_maxima,
             collect(DISTINCT craving.trigger) as triggers_comunes
    `;

    return this.executeQuery(query, { userId, days });
  }

  // =====================================================
  // QUERIES DEL DASHBOARD
  // =====================================================

  /**
   * Obtiene datos para widgets del dashboard
   */
  async getDashboardData(userId: string): Promise<DashboardData[]> {
    const query = `
      MATCH (u:Usuario {id: $userId})
      OPTIONAL MATCH (u)-[:REGISTRA]->(c:CheckIn)
      WHERE c.fecha >= datetime() - duration({days: 7})
      OPTIONAL MATCH (u)-[:EXPERIMENTA]->(cr:Craving)
      WHERE cr.fecha >= datetime() - duration({days: 7})
      OPTIONAL MATCH (u)-[:USA]->(s:Sustancia)
      OPTIONAL MATCH (u)-[:ACCEDE_A]->(r:Recurso)
      WHERE r.tipo IN ['articulo', 'video']
      RETURN count(c) as checkinsSemana,
             avg(c.consumo_cantidad) as promedioConsumo,
             count(cr) as cravingsSemana,
             avg(cr.intensidad) as promedioCraving,
             collect(DISTINCT s.nombre) as sustanciasActivas,
             collect(DISTINCT r) as recursosRecomendados
      LIMIT 1
    `;

    return this.executeQuery<DashboardData>(query, { userId });
  }

  /**
   * Obtiene el resumen de actividad semanal
   */
  async getWeeklySummary(userId: string): Promise<any[]> {
    const query = `
      MATCH (u:Usuario {id: $userId})
      OPTIONAL MATCH (u)-[:REGISTRA]->(c:CheckIn)
      WHERE c.fecha >= datetime() - duration({days: 7})
      OPTIONAL MATCH (u)-[:EXPERIMENTA]->(cr:Craving)
      WHERE cr.fecha >= datetime() - duration({days: 7})
      RETURN count(DISTINCT c) as dias_activos,
             count(cr) as total_cravings,
             collect(DISTINCT date(c.fecha)) as dias_checkin
    `;

    return this.executeQuery(query, { userId });
  }

  // =====================================================
  // QUERIES DE RECURSOS
  // =====================================================

  /**
   * Obtiene recursos recomendados según el perfil del usuario
   */
  async getRecommendedResources(
    userId: string,
    types: string[] = ['articulo', 'video']
  ): Promise<any[]> {
    const query = `
      MATCH (u:Usuario {id: $userId})-[:USA]->(s:Sustancia)
      MATCH (r:Recurso)
      WHERE r.tipo IN $types
      AND (r.paises IS NULL OR u.pais IN r.paises)
      AND (r.etiquetas IS NULL OR ANY(tag IN r.etiquetas WHERE tag IN s.categoria))
      RETURN DISTINCT r
      ORDER BY r.tipo
      LIMIT 20
    `;

    return this.executeQuery(query, { userId, types });
  }

  /**
   * Obtiene líneas de crisis por país
   */
  async getCrisisLines(pais: string): Promise<any[]> {
    const query = `
      MATCH (r:Recurso {tipo: 'linea_crisis'})
      WHERE r.paises IS NULL OR $pais IN r.paises
      RETURN r
      LIMIT 5
    `;

    return this.executeQuery(query, { pais });
  }

  // =====================================================
  // QUERIES DE GESTIÓN DE USUARIOS
  // =====================================================

  /**
   * Crea o actualiza un usuario en el grafo
   */
  async upsertUser(userData: {
    id: string;
    nombre?: string;
    edad?: number;
    genero?: string;
    pais: string;
    etapaCambio?: string;
    riesgo?: string;
  }): Promise<void> {
    const query = `
      MERGE (u:Usuario {id: $id})
      SET u.nombre = $nombre,
          u.edad = $edad,
          u.genero = $genero,
          u.pais = $pais,
          u.etapa_cambio = COALESCE($etapaCambio, 'contemplacion'),
          u.riesgo = COALESCE($riesgo, 'bajo'),
          u.fecha_registro = COALESCE(u.fecha_registro, datetime()),
          u.estado = 'activo'
    `;

    await this.executeWrite(query, userData);
  }

  /**
   * Registra un check-in del usuario
   */
  async recordCheckIn(userId: string, checkInData: {
    id: string;
    fecha: Date;
    consumo: boolean;
    sustancia?: string;
    cantidad?: number;
    emociones: string[];
    notas?: string;
  }): Promise<void> {
    const query = `
      MATCH (u:Usuario {id: $userId})
      CREATE (c:CheckIn {
        id: $id,
        fecha: datetime($fecha),
        consumo: $consumo,
        cantidad: $cantidad,
        notas: $notas
      })
      CREATE (u)-[:REGISTRA]->(c)
      WITH c
      UNWIND $emociones AS emocion
      MERGE (e:Etiqueta {nombre: emocion})
      CREATE (c)-[:TIENE_ETIQUETA]->(e)
    `;

    await this.executeWrite(query, {
      userId,
      ...checkInData,
      fecha: checkInData.fecha.toISOString(),
    });
  }

  /**
   * Registra un craving del usuario
   */
  async recordCraving(userId: string, cravingData: {
    id: string;
    fecha: Date;
    intensidad: number;
    trigger: string[];
    sustancias: string[];
  }): Promise<void> {
    const query = `
      MATCH (u:Usuario {id: $userId})
      CREATE (cr:Craving {
        id: $id,
        fecha: datetime($fecha),
        intensidad: $intensidad
      })
      CREATE (u)-[:EXPERIMENTA]->(cr)
      WITH cr
      UNWIND $trigger AS trigger
      MERGE (e:Etiqueta {nombre: trigger})
      CREATE (cr)-[:TIENE_TRIGGER]->(e)
    `;

    await this.executeWrite(query, {
      userId,
      ...cravingData,
      fecha: cravingData.fecha.toISOString(),
    });
  }

  // =====================================================
  // QUERIES DE CONVERSACIONES
  // =====================================================

  /**
   * Obtiene el historial de conversación
   */
  async getConversationHistory(
    userId: string,
    sessionId: string,
    limit: number = 20
  ): Promise<any[]> {
    const query = `
      MATCH (u:Usuario {id: $userId})-[:TIENE]->(conv:Conversacion {id: $sessionId})-[:CONTIENE]->(m:Mensaje)
      RETURN m.id as id, m.role as role, m.contenido as content, m.fecha as timestamp
      ORDER BY m.fecha DESC
      LIMIT $limit
    `;

    return this.executeQuery(query, { userId, sessionId, limit });
  }

  /**
   * Agrega un mensaje al historial
   */
  async addMessageToHistory(
    userId: string,
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const query = `
      MATCH (u:Usuario {id: $userId})-[:TIENE]->(conv:Conversacion {id: $sessionId})
      CREATE (conv)-[:CONTIENE]->(m:Mensaje {
        id: randomUUID(),
        role: $role,
        contenido: $content,
        fecha: datetime()
      })
    `;

    await this.executeWrite(query, { userId, sessionId, role, content });
  }

  // =====================================================
  // QUERIES DE ALERTAS
  // =====================================================

  /**
   * Guarda una alerta en el grafo
   */
  async saveAlert(alert: {
    userId: string;
    id: string;
    tipo: string;
    severidad: number;
    riesgo: string;
    titulo: string;
    descripcion: string;
    recomendaciones: string[];
  }): Promise<void> {
    const query = `
      MATCH (u:Usuario {id: $userId})
      CREATE (a:Alerta {
        id: $id,
        tipo: $tipo,
        severidad: $severidad,
        riesgo: $riesgo,
        titulo: $titulo,
        descripcion: $descripcion,
        recomendaciones: $recomendaciones,
        fecha: datetime(),
        reconocida: false
      })
      CREATE (u)-[:TIENE]->(a)
    `;

    await this.executeWrite(query, alert);
  }

  /**
   * Obtiene las alertas no reconocidas del usuario
   */
  async getUnacknowledgedAlerts(userId: string): Promise<any[]> {
    const query = `
      MATCH (u:Usuario {id: $userId})-[:TIENE]->(a:Alerta)
      WHERE a.reconocida = false
      RETURN a
      ORDER BY a.fecha DESC
    `;

    return this.executeQuery(query, { userId });
  }

  /**
   * Reconoce una alerta
   */
  async acknowledgeAlert(userId: string, alertId: string): Promise<void> {
    const query = `
      MATCH (u:Usuario {id: $userId})-[:TIENE]->(a:Alerta {id: $alertId})
      SET a.reconocida = true,
          a.fecha_reconocimiento = datetime()
    `;

    await this.executeWrite(query, { userId, alertId });
  }
}

// =====================================================
// EXPORTAR INSTANCIA SINGLETON
// =====================================================

export const neo4jService = new Neo4jService();
export default neo4jService;
