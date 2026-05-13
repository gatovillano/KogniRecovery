import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as checkinModel from '../../../../models/checkin.model.js';

export const recordMoodCheckinTool = tool(
  async ({
    userId,
    mood_score,
    anxiety_score,
    energy_score,
    emotional_tags,
    sleep_hours,
    exercised_today,
    exercise_minutes,
    exercise_type,
    social_interaction,
    notes,
  }) => {
    try {
      const existing = await checkinModel.getTodayCheckIn(userId);

      const checkinData = {
        checkin_type: 'diario' as const,
        mood_score: mood_score ?? undefined,
        anxiety_score: anxiety_score ?? undefined,
        energy_score: energy_score ?? undefined,
        emotional_tags: emotional_tags || undefined,
        sleep_hours: sleep_hours ?? undefined,
        exercised_today: exercised_today ?? undefined,
        exercise_minutes: exercise_minutes ?? undefined,
        exercise_type: exercise_type || undefined,
        social_interaction: social_interaction || undefined,
        notes: notes || undefined,
      };

      let checkin;
      if (existing) {
        checkin = await checkinModel.updateCheckIn(existing.id, checkinData);
      } else {
        checkin = await checkinModel.createCheckIn(userId, checkinData);
      }

      if (checkin) {
        await checkinModel.createMoodHistory(userId, {
          mood_score: checkinData.mood_score,
          anxiety_score: checkinData.anxiety_score,
          energy_score: checkinData.energy_score,
          emotional_tags: checkinData.emotional_tags,
        });
      }

      const moodStr = mood_score ? `Animo: ${mood_score}/10` : '';
      const anxietyStr = anxiety_score ? `Ansiedad: ${anxiety_score}/10` : '';
      const energyStr = energy_score ? `Energia: ${energy_score}/10` : '';
      const parts = [moodStr, anxietyStr, energyStr].filter(Boolean);

      return `Check-in emocional registrado exitosamente. ${parts.join(', ')}. ${existing ? 'Se actualizo el check-in existente de hoy.' : 'Se creo un nuevo check-in para hoy.'}`;
    } catch (error) {
      console.error('Error in recordMoodCheckinTool:', error);
      return 'Error al registrar el check-in emocional. Por favor, intenta de nuevo.';
    }
  },
  {
    name: 'record_mood_checkin',
    description:
      'Registra un check-in emocional del usuario. Usalo cuando el usuario describa como se siente emocionalmente, mencione calidad de sueno, ejercicio, o comparta una actualizacion general de su estado emocional fuera de la pantalla formal de check-in.',
    schema: z.object({
      userId: z.string(),
      mood_score: z.number().optional().nullable().describe('Estado de animo del 1 al 10'),
      anxiety_score: z.number().optional().nullable().describe('Nivel de ansiedad del 1 al 10'),
      energy_score: z.number().optional().nullable().describe('Nivel de energia del 1 al 10'),
      emotional_tags: z
        .array(z.string())
        .optional()
        .nullable()
        .describe('Etiquetas emocionales (ej: anxious, hopeful, tired, motivated)'),
      sleep_hours: z.number().optional().nullable().describe('Horas de sueno'),
      exercised_today: z.boolean().optional().nullable().describe('Si el usuario se ejercito hoy'),
      exercise_minutes: z.number().optional().nullable().describe('Minutos de ejercicio'),
      exercise_type: z.string().optional().nullable().describe('Tipo de ejercicio realizado'),
      social_interaction: z
        .string()
        .optional()
        .nullable()
        .describe('Tipo de interaccion social (positiva, negativa, neutra, ninguna)'),
      notes: z.string().optional().nullable().describe('Notas adicionales'),
    }),
  }
);
