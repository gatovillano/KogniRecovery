import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as journalModel from '../../../../models/journal.model.js';

export const recordActivityEntryTool = tool(
  async ({ userId, activity_name, feeling_before, feeling_during, feeling_after }) => {
    try {
      const entry = await journalModel.createActivityEntry(userId, {
        activity_name,
        feeling_before: feeling_before || 'No registrado',
        feeling_during: feeling_during || 'No registrado',
        feeling_after: feeling_after || 'No registrado',
      });

      return `Actividad registrada exitosamente: ${activity_name}. ID: ${entry.id}. El usuario podra verla en su bitacora.`;
    } catch (error) {
      console.error('Error in recordActivityEntryTool:', error);
      return 'Error al registrar la actividad. Por favor, intenta de nuevo.';
    }
  },
  {
    name: 'record_activity_entry',
    description:
      'Registra una actividad realizada por el usuario con contexto emocional. Usalo cuando el usuario describa haber hecho algo (ejercicio, hobbies, trabajo, etc.) y como se sintio antes, durante o despues.',
    schema: z.object({
      userId: z.string(),
      activity_name: z.string().describe('Nombre de la actividad realizada'),
      feeling_before: z
        .string()
        .optional()
        .nullable()
        .describe('Como se sentia el usuario antes de la actividad'),
      feeling_during: z
        .string()
        .optional()
        .nullable()
        .describe('Como se sentia el usuario durante la actividad'),
      feeling_after: z
        .string()
        .optional()
        .nullable()
        .describe('Como se sentia el usuario despues de la actividad'),
    }),
  }
);
