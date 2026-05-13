import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as cravingModel from '../../../../models/craving.model.js';

export const saveCopingStrategyTool = tool(
  async ({ userId, name, category, description, instructions, when_to_use }) => {
    try {
      const strategy = await cravingModel.createCopingStrategy(userId, {
        name,
        category,
        description: description || undefined,
        instructions: instructions || undefined,
        when_to_use: when_to_use || undefined,
        is_active: true,
      });

      return `Estrategia de afrontamiento guardada exitosamente: "${name}" (categoria: ${category}). ID: ${strategy.id}. El usuario podra verla en su seccion de estrategias.`;
    } catch (error) {
      console.error('Error in saveCopingStrategyTool:', error);
      return 'Error al guardar la estrategia de afrontamiento. Por favor, intenta de nuevo.';
    }
  },
  {
    name: 'save_coping_strategy',
    description:
      'Guarda una estrategia de afrontamiento que el usuario menciona o descubre. Usalo cuando el usuario identifique una tecnica o estrategia que le ayuda a manejar cravings, estres o emociones dificiles.',
    schema: z.object({
      userId: z.string(),
      name: z.string().describe('Nombre corto de la estrategia'),
      category: z
        .string()
        .describe(
          'Categoria de la estrategia (ej: respiracion, ejercicio, social, cognitiva, creativa)'
        ),
      description: z.string().optional().nullable().describe('Descripcion de la estrategia'),
      instructions: z.string().optional().nullable().describe('Instrucciones paso a paso'),
      when_to_use: z
        .string()
        .optional()
        .nullable()
        .describe('Cuando es mas efectiva esta estrategia'),
    }),
  }
);
