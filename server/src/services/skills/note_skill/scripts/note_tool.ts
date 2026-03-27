import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as noteModel from '../../../../models/note.model.js';

export const saveNoteTool = tool(
  async ({ userId, title, content, category }) => {
    try {
      const note = await noteModel.createNote(userId, {
        title: title || undefined,
        content,
        source: 'agent',
        category: category || undefined,
      });

      const titleStr = note.title ? ` "${note.title}"` : '';
      return `Nota guardada exitosamente${titleStr}. El usuario podra verla en su seccion de Notas.`;
    } catch (error) {
      console.error('Error in saveNoteTool:', error);
      return 'Lo siento, hubo un error al guardar la nota. Por favor, intenta de nuevo.';
    }
  },
  {
    name: 'save_note',
    description:
      'Guarda una nota personal para el usuario. Usalo cuando el usuario pida que guardes algo, cuando quieras recordarle algo importante, o cuando identifiques un insight valioso durante la conversacion que merezca ser guardado para referencia futura.',
    schema: z.object({
      userId: z.string(),
      title: z.string().optional().nullable(),
      content: z.string(),
      category: z.string().optional().nullable(),
    }),
  }
);

export const listNotesTool = tool(
  async ({ userId, source }) => {
    try {
      const opts: { source?: 'user' | 'agent'; limit?: number } = { limit: 10 };
      if (source) opts.source = source as 'user' | 'agent';
      const notes = await noteModel.getNotes(userId, opts);

      if (notes.length === 0) {
        return 'No hay notas guardadas aun.';
      }

      const formatted = notes
        .map((n, i) => {
          const src = n.source === 'agent' ? '[LUA]' : '[Usuario]';
          const pin = n.is_pinned ? '📌' : '';
          const title = n.title ? n.title : `Nota ${i + 1}`;
          const date = new Date(n.created_at).toLocaleDateString('es-CL');
          return `${src}${pin} ${title} (${date}): ${n.content.substring(0, 100)}${n.content.length > 100 ? '...' : ''}`;
        })
        .join('\n');

      return `Notas guardadas (${notes.length}):\n${formatted}`;
    } catch (error) {
      console.error('Error in listNotesTool:', error);
      return 'Error al obtener las notas.';
    }
  },
  {
    name: 'list_notes',
    description:
      'Lista las notas guardadas del usuario. Usalo cuando el usuario pregunte sobre sus notas o quiera ver que tiene guardado.',
    schema: z.object({
      userId: z.string(),
      source: z.string().optional().nullable(),
    }),
  }
);

export const deleteNoteTool = tool(
  async ({ userId, noteId }) => {
    try {
      const deleted = await noteModel.deleteNote(noteId, userId);
      if (deleted) {
        return 'Nota eliminada exitosamente.';
      }
      return 'No se encontro la nota especificada.';
    } catch (error) {
      console.error('Error in deleteNoteTool:', error);
      return 'Error al eliminar la nota.';
    }
  },
  {
    name: 'delete_note',
    description:
      'Elimina una nota guardada. Usalo cuando el usuario pida eliminar una nota especifica.',
    schema: z.object({
      userId: z.string(),
      noteId: z.string(),
    }),
  }
);
