import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as journalModel from '../../../../models/journal.model.js';

export const recordDailyNoteTool = tool(
  async ({ userId, content }) => {
    try {
      const note = await journalModel.createDailyNote(userId, {
        content,
      });

      return `Nota diaria guardada exitosamente (${note.note_date}). El usuario podra verla en su bitacora.`;
    } catch (error) {
      console.error('Error in recordDailyNoteTool:', error);
      return 'Error al guardar la nota diaria. Por favor, intenta de nuevo.';
    }
  },
  {
    name: 'record_daily_note',
    description:
      'Guarda una entrada de diario/nota diaria del usuario. Usalo cuando el usuario comparta una reflexion, pensamiento, evento del dia, o cualquier cosa que merezca ser documentada en su bitacora personal.',
    schema: z.object({
      userId: z.string(),
      content: z.string().describe('Contenido de la nota/reflexion del usuario'),
    }),
  }
);
