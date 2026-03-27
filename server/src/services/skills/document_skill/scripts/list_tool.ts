import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { langGraphAgent } from '../../../langgraph.service.js';

/**
 * Skill: list_documents
 * Lists all documents available in the Knowledge Base.
 */
export const listDocumentsTool = tool(
  async () => {
    try {
      console.log(`[SKILL: list_documents] Listing available documents.`);
      const documents = await langGraphAgent.listKnowledgeBaseDocuments();
      return documents.length > 0 
        ? `Documentos disponibles:\n${documents.join('\n')}`
        : "No se encontraron documentos en la base de conocimientos.";
    } catch (error) {
      console.error('Error in list_documents skill:', error);
      return `Error listing documents: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  {
    name: "list_documents",
    description: "Lists all files available in the knowledge base directory.",
    schema: z.object({}) as any, // No inputs needed
  }
);
