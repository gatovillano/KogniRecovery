import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as journalModel from '../../../../models/journal.model.js';

export const recordConsumptionAnalysisTool = tool(
  async ({ userId, trigger_situation, action_taken }) => {
    try {
      const entry = await journalModel.createConsumptionAnalysis(userId, {
        trigger_situation,
        action_taken,
      });

      return `Analisis de consumo registrado exitosamente. Trigger: "${trigger_situation.substring(0, 60)}...". ID: ${entry.id}. El usuario podra verlo en su bitacora.`;
    } catch (error) {
      console.error('Error in recordConsumptionAnalysisTool:', error);
      return 'Error al registrar el analisis de consumo. Por favor, intenta de nuevo.';
    }
  },
  {
    name: 'record_consumption_analysis',
    description:
      'Registra un analisis de consumo que vincula una situacion desencadenante con la accion tomada. Usalo cuando el usuario describa una situacion que llevo al consumo de sustancias o a un momento de riesgo, y lo que hizo al respecto.',
    schema: z.object({
      userId: z.string(),
      trigger_situation: z
        .string()
        .describe('Descripcion de la situacion que desencadeno el impulso o consumo'),
      action_taken: z.string().describe('Que hizo el usuario en respuesta a la situacion'),
    }),
  }
);
