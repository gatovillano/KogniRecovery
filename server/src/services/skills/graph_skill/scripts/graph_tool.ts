import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { neo4jService } from '../../../neo4j.service.js';

/**
 * Skill: knowledge_graph_search
 * Query the user's specific Knowledge Graph (Neo4j) context.
 */
export const knowledgeGraphSearchTool = tool(
  async ({ userId }: { userId: string }) => {
    try {
      console.log(`[SKILL: knowledge_graph_search] Querying context for user: ${userId}`);
      
      // Get the full chatbot context from Neo4j
      const contextResults = await neo4jService.getChatbotContext(userId);
      
      if (!contextResults || contextResults.length === 0) {
        return "No historical graph data found for this user.";
      }

      return JSON.stringify(contextResults[0], null, 2);
    } catch (error) {
      console.error('Error in knowledge_graph_search skill:', error);
      return `Error querying knowledge graph: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  {
    name: "knowledge_graph_search",
    description: "Queries the user's personal Knowledge Graph (Neo4j) for profile, drug use, check-ins, and cravings.",
    schema: z.object({
      userId: z.string().describe("The UUID of the user to fetch context for."),
    }) as any, // Cast to any to bypass strict type mismatch if necessary
  }
);
