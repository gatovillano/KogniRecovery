import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as journalModel from '../../../../models/journal.model.js';

export const recordSocialEntryTool = tool(
  async ({ userId, people_description, impact_assessment }) => {
    try {
      const entry = await journalModel.createSocialEntry(userId, {
        people_description,
        impact_assessment,
      });

      return `Entrada social registrada exitosamente. Impacto: ${impact_assessment}. ID: ${entry.id}. El usuario podra verla en su bitacora.`;
    } catch (error) {
      console.error('Error in recordSocialEntryTool:', error);
      return 'Error al registrar la entrada social. Por favor, intenta de nuevo.';
    }
  },
  {
    name: 'record_social_entry',
    description:
      'Registra una entrada de entorno social. Usalo cuando el usuario mencione interacciones con personas que impactan su recuperacion, describa su entorno social, o hable de relaciones significativas.',
    schema: z.object({
      userId: z.string(),
      people_description: z
        .string()
        .describe('Descripcion de las personas o interacciones sociales'),
      impact_assessment: z
        .string()
        .describe('Evaluacion del impacto: positivo, negativo, o neutral'),
    }),
  }
);
