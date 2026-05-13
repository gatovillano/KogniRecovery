import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getJournalByDateRange, getJournalForWeek } from '../../../../models/journal.model.js';

const formatEntries = (entries: any[]): string => {
  if (entries.length === 0) return 'No se encontraron registros para el período indicado.';

  return entries
    .map((entry) => {
      const typeLabels: Record<string, string> = {
        checkin: '📋 Check-in',
        note: '📝 Nota',
        habit: '🔄 Hábito',
        habit_completion: '✅ Hábito completado',
        social: '👥 Entorno social',
        activity: '🏃 Actividad',
        analysis: '🔍 Análisis consumo',
        substance_dose: '⚠️ Dosis sustancia',
      };
      const label = typeLabels[entry.type] || entry.type;
      const time = entry.entry_time || '00:00:00';
      const data = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data;

      let details = '';
      if (entry.type === 'checkin') {
        details = `Mood: ${data.mood_score}/10, Ansiedad: ${data.anxiety_score}/10, Energía: ${data.energy_score}/10${data.consumed ? ' ⚠️ Consumo detectado' : ''}`;
      } else if (entry.type === 'note') {
        details = data.content?.substring(0, 120) || '';
      } else if (entry.type === 'substance_dose') {
        details = `${data.substance_name}: ${data.quantity} ${data.unit}${data.craving_intensity ? ` (intensidad: ${data.craving_intensity}/10)` : ''}`;
      } else if (entry.type === 'habit') {
        details = `Protectores: ${data.protective_habits?.substring(0, 60) || 'N/A'}`;
      } else if (entry.type === 'habit_completion') {
        details = `${data.habit_name} (${data.habit_type})`;
      } else if (entry.type === 'analysis') {
        details = `Trigger: ${data.trigger_situation?.substring(0, 60) || 'N/A'}`;
      } else if (entry.type === 'social') {
        details = data.people_description?.substring(0, 80) || '';
      } else if (entry.type === 'activity') {
        details = `${data.activity_name} - Antes: ${data.feeling_before?.substring(0, 40) || 'N/A'}`;
      }

      return `${entry.entry_date} ${time} ${label}\n  ${details}`;
    })
    .join('\n\n');
};

export const journalSearchByDayTool = tool(
  async ({ userId, date, types }) => {
    try {
      const typeArray = types && types.length > 0 ? types : undefined;
      const entries = await getJournalByDateRange(userId, {
        startDate: date,
        endDate: date,
        types: typeArray,
      });

      const formatted = formatEntries(entries);
      return `Bitácora del ${date} (${entries.length} registros):\n${formatted}`;
    } catch (error) {
      console.error('Error in journalSearchByDayTool:', error);
      return 'Error al buscar en la bitácora.';
    }
  },
  {
    name: 'journal_search_by_day',
    description:
      'Busca todos los registros de la bitácora del usuario para un día específico. Incluye check-ins, notas, hábitos, actividades, análisis de consumo y dosis. Útil para revisar el historial completo de un día.',
    schema: z.object({
      userId: z.string(),
      date: z.string().describe('Fecha en formato YYYY-MM-DD'),
      types: z
        .array(z.string())
        .optional()
        .nullable()
        .describe(
          'Tipos de entrada a incluir (checkin, note, habit, social, activity, analysis, substance_dose). Si no se especifica, incluye todos.'
        ),
    }),
  }
);

export const journalSearchByWeekTool = tool(
  async ({ userId, date }) => {
    try {
      const entries = await getJournalForWeek(userId, date);

      // Calcular rango de la semana
      const d = new Date(date + 'T00:00:00');
      const dayOfWeek = d.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(d);
      monday.setDate(d.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const mondayStr = monday.toISOString().split('T')[0];
      const sundayStr = sunday.toISOString().split('T')[0];

      const formatted = formatEntries(entries);
      return `Bitácora semana ${mondayStr} al ${sundayStr} (${entries.length} registros):\n${formatted}`;
    } catch (error) {
      console.error('Error in journalSearchByWeekTool:', error);
      return 'Error al buscar la bitácora semanal.';
    }
  },
  {
    name: 'journal_search_by_week',
    description:
      'Busca todos los registros de la bitácora del usuario para una semana completa. La semana comienza el lunes. Útil para detectar patrones semanales de consumo, progreso en hábitos, y cambios en estado de ánimo.',
    schema: z.object({
      userId: z.string(),
      date: z
        .string()
        .describe(
          'Cualquier fecha dentro de la semana a buscar (YYYY-MM-DD). La herramienta calcula automáticamente el lunes a domingo.'
        ),
    }),
  }
);

export const journalSearchByRangeTool = tool(
  async ({ userId, startDate, endDate, types }) => {
    try {
      const typeArray = types && types.length > 0 ? types : undefined;
      const entries = await getJournalByDateRange(userId, {
        startDate,
        endDate,
        types: typeArray,
      });

      // Análisis básico de patrones
      const substanceDoses = entries.filter((e) => e.type === 'substance_dose');
      const checkins = entries.filter((e) => e.type === 'checkin');

      let analysis = '';
      if (substanceDoses.length > 0) {
        // Agrupar por hora para detectar picos
        const hourCounts: Record<string, number> = {};
        substanceDoses.forEach((e) => {
          const hour = e.entry_time?.substring(0, 2) || '00';
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const peakHourEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
        if (peakHourEntry) {
          analysis += `\n📊 Pico de consumo: ${peakHourEntry[0]}:00 (${peakHourEntry[1]} registros)\n`;
        }

        // Agrupar por sustancia
        const substanceCounts: Record<string, number> = {};
        substanceDoses.forEach((e) => {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          const name = data.substance_name || 'Desconocido';
          substanceCounts[name] = (substanceCounts[name] || 0) + 1;
        });
        analysis +=
          '📊 Sustancias registradas: ' +
          Object.entries(substanceCounts)
            .map(([k, v]) => `${k} (${v})`)
            .join(', ') +
          '\n';
      }

      if (checkins.length > 0) {
        const avgMood =
          checkins.reduce((sum, e) => {
            const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            return sum + (data.mood_score || 0);
          }, 0) / checkins.length;
        analysis += `📊 Promedio mood: ${avgMood.toFixed(1)}/10\n`;
      }

      const formatted = formatEntries(entries);
      return `Bitácora ${startDate} al ${endDate} (${entries.length} registros):\n${formatted}${analysis}`;
    } catch (error) {
      console.error('Error in journalSearchByRangeTool:', error);
      return 'Error al buscar en la bitácora.';
    }
  },
  {
    name: 'journal_search_by_range',
    description:
      'Busca registros de la bitácora del usuario en un rango de fechas personalizado. Incluye análisis automático de patrones: picos de consumo por hora, promedio de mood, distribución de sustancias. Útil para análisis extendido y comparaciones temporales.',
    schema: z.object({
      userId: z.string(),
      startDate: z.string().describe('Fecha de inicio en formato YYYY-MM-DD'),
      endDate: z.string().describe('Fecha de fin en formato YYYY-MM-DD'),
      types: z
        .array(z.string())
        .optional()
        .nullable()
        .describe('Tipos de entrada a incluir. Si no se especifica, incluye todos.'),
    }),
  }
);
