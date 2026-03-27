import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as doseModel from '../../../../models/substance_dose.model.js';
import { neo4jService } from '../../../neo4j.service.js';

export const substanceDoseTool = tool(
  async ({ userId, substance, quantity, unit, intensity, feelings, notes }) => {
    try {
      const dose = await doseModel.createSubstanceDose(userId, {
        substance_name: substance,
        quantity,
        unit,
        craving_intensity: intensity,
        feelings,
        context_notes: notes
      });

      // Sincronizar con Neo4j para el Grafo de Memoria
      const query = `
        MATCH (u:Usuario {id: $userId})
        CREATE (d:DosisSustancia {
          id: $id,
          substance: $substance,
          quantity: $quantity,
          unit: $unit,
          timestamp: datetime($timestamp),
          intensity: $intensity,
          feelings: $feelings
        })
        CREATE (u)-[:REGISTRA_DOSIS]->(d)
        WITH u, d
        MERGE (s:Sustancia {nombre: $substance})
        MERGE (d)-[:DE_SUSTANCIA]->(s)
        RETURN d
      `;
      await neo4jService.executeWrite(query, {
        userId,
        id: dose.id,
        substance: dose.substance_name,
        quantity: dose.quantity,
        unit: dose.unit,
        timestamp: dose.dose_time.toISOString(),
        intensity: dose.craving_intensity || 0,
        feelings: dose.feelings || ''
      });

      return `✅ Dosis de ${substance} registrada exitosamente (${quantity} ${unit}). He guardado esta información en tu historial clínico.`;
    } catch (error) {
      console.error('Error in substanceDoseTool:', error);
      return '❌ Lo siento, hubo un error al registrar la dosis. Por favor, intenta de nuevo.';
    }
  },
  {
    name: 'record_substance_dose',
    description: 'Registra una dosis individual de una sustancia (alcohol, tabaco, drogas, etc.) consumida por el usuario. Úsalo cuando el usuario mencione haber consumido algo.',
    schema: z.object({
      userId: z.string(),
      substance: z.string(),
      quantity: z.number(),
      unit: z.string(),
      intensity: z.number().optional().nullable(),
      feelings: z.string().optional().nullable(),
      notes: z.string().optional().nullable()
    }),
  }
);
