import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as cravingModel from '../../../../models/craving.model.js';

export const recordCravingTool = tool(
  async ({ userId, substance_name, intensity, triggers, coping_strategies, notes }) => {
    try {
      const craving = await cravingModel.createCraving(userId, {
        substance_name,
        intensity,
        triggers: triggers || [],
        coping_strategies: coping_strategies || [],
        status: 'active',
        craving_start_time: new Date(),
        notes: notes || undefined,
      });

      return `Craving registrado exitosamente: ${substance_name} con intensidad ${intensity}/10. ID: ${craving.id}. El usuario podra verlo en su historial de cravings.`;
    } catch (error) {
      console.error('Error in recordCravingTool:', error);
      return 'Error al registrar el craving. Por favor, intenta de nuevo.';
    }
  },
  {
    name: 'record_craving',
    description:
      'Registra un craving (antojo) experimentado por el usuario. Usalo cuando el usuario mencione un deseo intenso de consumir una sustancia, describa sintomas de craving, o reporte haber tenido un craving recientemente.',
    schema: z.object({
      userId: z.string(),
      substance_name: z.string().describe('Nombre de la sustancia asociada al craving'),
      intensity: z.number().describe('Intensidad del craving del 1 al 10'),
      triggers: z
        .array(z.string())
        .optional()
        .nullable()
        .describe('Factores desencadenantes del craving'),
      coping_strategies: z
        .array(z.string())
        .optional()
        .nullable()
        .describe('Estrategias usadas para manejar el craving'),
      notes: z.string().optional().nullable().describe('Notas adicionales sobre el craving'),
    }),
  }
);
