import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { langGraphAgent } from '../../../langgraph.service.js';

/**
 * Skill: rag_search
 * Allows the agent to query the Knowledge Base using semantic search (RAG).
 */
export const ragSearchTool = tool(
  async ({ query }: { query: string }) => {
    try {
      console.log(`[SKILL: rag_search] Searching Knowledge Base for: ${query}`);
      const results = await langGraphAgent.searchKnowledgeBase(query, 3);
      return results;
    } catch (error) {
      console.error('Error in rag_search skill:', error);
      return `Error searching knowledge base: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  {
    name: "rag_search",
    description: "Searches the clinical knowledge base for information about addiction, recovery techniques, and medical guidelines.",
    schema: z.object({
      query: z.string().describe("The semantic search query."),
    }) as any,
  }
);
