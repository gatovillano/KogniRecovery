import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as cravingModel from '../../../../models/craving.model.js';

export const saveCravingTriggerTool = tool(
  async ({ userId, trigger_type, trigger_description, frequency, context_notes }) => {
    try {
      const trigger = await cravingModel.createCravingTrigger(userId, {
        trigger_type,
        trigger_description,
        frequency: frequency || undefined,
        context_notes: context_notes || undefined,
        status: 'active',
      });

      return `Desencadenante de craving guardado exitosamente: "${trigger_type}" - ${trigger_description}. ID: ${trigger.id}. El usuario podra verlo en su historial de desencadenantes.`;
    } catch (error) {
      console.error('Error in saveCravingTriggerTool:', error);
      return 'Error al guardar el desencadenante de craving. Por favor, intenta de nuevo.';
    }
  },
  {
    name: 'save_craving_trigger',
    description:
      'Guarda un desencadenante de craving identificado por el usuario. Usalo cuando el usuario identifique algo (un lugar, persona, emocion, situacion) que le provoca cravings.',
    schema: z.object({
      userId: z.string(),
      trigger_type: z
        .string()
        .describe('Tipo de desencadenante (ej: emocional, social, ambiental, fisico)'),
      trigger_description: z.string().describe('Descripcion especifica del desencadenante'),
      frequency: z
        .string()
        .optional()
        .nullable()
        .describe('Frecuencia del desencadenante (ej: diario, semanal, ocasional)'),
      context_notes: z.string().optional().nullable().describe('Notas de contexto adicionales'),
    }),
  }
);
