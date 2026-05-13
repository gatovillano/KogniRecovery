import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { neo4jService } from '../../../neo4j.service.js';

/**
 * Skill: knowledge_graph_search
 * Query the user's specific Knowledge Graph (Neo4j) context including
 * full profile, memory attributes, substances, check-ins, cravings, and patterns.
 */
export const knowledgeGraphSearchTool = tool(
  async ({ userId, queryType }: { userId: string; queryType?: string }) => {
    try {
      console.log(`[SKILL: knowledge_graph_search] Querying context for user: ${userId}, type: ${queryType || 'full'}`);
      
      const sections: string[] = [];

      // 1. Base context: profile, check-ins, substances, medications
      const contextResults = await neo4jService.getChatbotContext(userId);
      if (contextResults && contextResults.length > 0) {
        sections.push(`## Perfil y Contexto Base\n${JSON.stringify(contextResults[0], null, 2)}`);
      }

      // 2. ALL memory attributes from the graph (triggers, goals, patterns, etc.)
      if (!queryType || queryType === 'full' || queryType === 'memory') {
        const memoryAttributes = await neo4jService.getUserMemoryAttributes(userId);
        if (memoryAttributes && memoryAttributes.length > 0) {
          const grouped: Record<string, any[]> = {};
          for (const attr of memoryAttributes) {
            const rel = attr.relationship || 'OTRO';
            if (!grouped[rel]) grouped[rel] = [];
            grouped[rel].push(attr);
          }
          
          const memorySection = Object.entries(grouped).map(([rel, attrs]) => {
            const items = attrs.map((a: any) => `  - ${a.nombre}: ${a.valor} (importancia: ${a.importancia || 'N/A'}, actualizado: ${a.actualizado || 'N/A'})`).join('\n');
            return `### ${rel}\n${items}`;
          }).join('\n');
          
          sections.push(`## Memoria del Usuario (Grafo)\n${memorySection}`);
        }
      }

      // 3. Recent cravings with triggers
      if (!queryType || queryType === 'full' || queryType === 'cravings') {
        const cravings = await neo4jService.getRecentCravingsWithTriggers(userId);
        if (cravings && cravings.length > 0) {
          sections.push(`## Cravings Recientes\n${JSON.stringify(cravings, null, 2)}`);
        }
      }

      // 4. Drug interactions if applicable
      if (!queryType || queryType === 'full' || queryType === 'interactions') {
        const interactions = await neo4jService.checkDrugInteractions(userId);
        if (interactions && interactions.length > 0) {
          sections.push(`## ⚠️ Interacciones Peligrosas Detectadas\n${JSON.stringify(interactions, null, 2)}`);
        }
      }

      // 5. User's evolution (stage of change, risk level)
      if (!queryType || queryType === 'full' || queryType === 'profile') {
        const evolution = await neo4jService.getUserEvolution(userId);
        if (evolution && evolution.length > 0) {
          sections.push(`## Evolución del Usuario\n${JSON.stringify(evolution[0], null, 2)}`);
        }
      }

      if (sections.length === 0) {
        return "No se encontraron datos en el grafo de conocimiento para este usuario.";
      }

      return sections.join('\n\n---\n\n');
    } catch (error) {
      console.error('Error in knowledge_graph_search skill:', error);
      return `Error querying knowledge graph: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  {
    name: "knowledge_graph_search",
    description: "Consulta el Grafo de Conocimiento personal del usuario (Neo4j). Devuelve perfil completo, memorias almacenadas (triggers, objetivos, patrones emocionales, estrategias de afrontamiento, factores de riesgo, relaciones, patrones de consumo), check-ins recientes, cravings, interacciones medicamentosas peligrosas y evolución del usuario. Usa queryType para filtrar: 'full' (todo), 'memory' (solo memorias), 'cravings', 'interactions', 'profile'.",
    schema: z.object({
      userId: z.string().describe("The UUID of the user to fetch context for."),
      queryType: z.string().optional().describe("Type of query: 'full' (default), 'memory', 'cravings', 'interactions', 'profile'"),
    }) as any,
  }
);
