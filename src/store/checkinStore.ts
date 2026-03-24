/**
 * Check-in Store - Maneja el estado de check-ins diarios/semanales
 *
 * Responsabilidades:
 * - Registro de check-ins diarios
 * - Historial de check-ins
 * - Estadísticas y streaks
 * - Gestión de triggers/desencadenantes
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { CheckIn, CheckInFormData, CheckInType } from '@types';

interface CheckInState {
  // Check-ins
  checkIns: CheckIn[];
  lastCheckInDate: string | null; // ISO date string
  currentStreak: number;
  longestStreak: number;

  // Acciones
  addCheckIn: (type: CheckInType, data: CheckInFormData) => CheckIn;
  getCheckInsByDateRange: (startDate: Date, endDate: Date) => CheckIn[];
  getCheckInsByType: (type: CheckInType) => CheckIn[];
  getTodayCheckIn: () => CheckIn | undefined;
  hasCheckedInToday: () => boolean;
  calculateStreaks: () => void;
  deleteCheckIn: (id: string) => void;
  clearCheckIns: () => void;
}

// SecureStore adapter
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.warn('Error storing check-in data:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      // Ignorar errores
    }
  },
};

// Helper para obtener fecha ISO
const getISODate = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

// Helper para calcular streaks
const calculateStreaks = (checkIns: CheckIn[]): { currentStreak: number; longestStreak: number } => {
  if (checkIns.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Ordenar por fecha descendente
  const sorted = [...checkIns]
    .map(c => new Date(c.completedAt))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calcular current streak
  let currentStreak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < sorted.length; i++) {
    const checkInDate = new Date(sorted[i]);
    checkInDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((checkDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0 || diffDays === 1) {
      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays === 0 && i === 0) {
        currentStreak = 1;
      }
      checkDate = new Date(checkInDate);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calcular longest streak
  const dateGroups: { [key: string]: boolean } = {};
  sorted.forEach(date => {
    const iso = getISODate(date);
    dateGroups[iso] = true;
  });

  const uniqueDates = Object.keys(dateGroups).sort();
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
};

export const checkinStore = create<CheckInState>()(
  persist(
    (set, get) => ({
      checkIns: [],
      lastCheckInDate: null,
      currentStreak: 0,
      longestStreak: 0,

      addCheckIn: (type: CheckInType, data: CheckInFormData) => {
        const newCheckIn: CheckIn = {
          id: Date.now().toString(),
          userId: 'current-user', // Se reemplazará con el ID real del usuario
          type,
          mood: data.mood,
          cravings: data.cravings,
          triggers: data.triggers,
          notes: data.notes || undefined,
          completedAt: new Date(),
          createdAt: new Date(),
        };

        set((state) => {
          const updatedCheckIns = [...state.checkIns, newCheckIn];
          const streaks = calculateStreaks(updatedCheckIns);

          return {
            checkIns: updatedCheckIns,
            lastCheckInDate: getISODate(newCheckIn.completedAt),
            ...streaks,
          };
        });

        return newCheckIn;
      },

      getCheckInsByDateRange: (startDate: Date, endDate: Date) => {
        const { checkIns } = get();
        return checkIns.filter(checkIn => {
          const date = new Date(checkIn.completedAt);
          return date >= startDate && date <= endDate;
        });
      },

      getCheckInsByType: (type: CheckInType) => {
        const { checkIns } = get();
        return checkIns.filter(checkIn => checkIn.type === type);
      },

      getTodayCheckIn: () => {
        const { checkIns } = get();
        const today = getISODate();
        return checkIns.find(checkIn => getISODate(checkIn.completedAt) === today);
      },

      hasCheckedInToday: () => {
        const { lastCheckInDate } = get();
        const today = getISODate();
        return lastCheckInDate === today;
      },

      calculateStreaks: () => {
        const { checkIns } = get();
        const streaks = calculateStreaks(checkIns);
        set(streaks);
      },

      deleteCheckIn: (id: string) => {
        set((state) => {
          const updatedCheckIns = state.checkIns.filter(c => c.id !== id);
          const streaks = calculateStreaks(updatedCheckIns);

          return {
            checkIns: updatedCheckIns,
            ...streaks,
          };
        });
      },

      clearCheckIns: () => {
        set({
          checkIns: [],
          lastCheckInDate: null,
          currentStreak: 0,
          longestStreak: 0,
        });
      },
    }),
    {
      name: 'kognirecovery-checkin-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        checkIns: state.checkIns,
        lastCheckInDate: state.lastCheckInDate,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
      }),
    }
  )
);