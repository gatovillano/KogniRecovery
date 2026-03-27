import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

/**
 * Skill: get_document_content
 * Retrieves the full content of a specific document in the knowledge base.
 */
export const getDocumentContentTool = tool(
  async ({ filename }: { filename: string }) => {
    try {
      console.log(`[SKILL: get_document_content] Reading document: ${filename}`);
      
      const kbPath = path.resolve(process.cwd(), 'knowledge_base');
      const filePath = path.join(kbPath, filename);
      
      // Basic security check to prevent directory traversal
      if (!filePath.startsWith(kbPath)) {
        return "Acceso denegado: el archivo debe estar dentro de la base de conocimientos.";
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      console.error('Error in get_document_content skill:', error);
      return `Error retrieving document content: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  {
    name: "get_document_content",
    description: "Reads the FULL context of a specific file from the knowledge base directory.",
    schema: z.object({
      filename: z.string().describe("The relative path or name of the document (e.g., 'ESCENARIOS_CONVERSACIONALES.md')."),
    }) as any,
  }
);
