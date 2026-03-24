/**
 * Hook de Check-in Diario
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface CheckIn {
  id: string;
  user_id: string;
  checkin_type: string;
  mood_score?: number;
  anxiety_score?: number;
  energy_score?: number;
  emotional_tags?: string[];
  consumed_substances?: any[];
  risk_situation?: boolean;
  risk_description?: string;
  coping_strategy_used?: string;
  sleep_hours?: number;
  sleep_quality?: number;
  exercised_today?: boolean;
  exercise_minutes?: number;
  exercise_type?: string;
  activities?: any[];
  social_interaction?: string;
  notes?: string;
  checkin_date: string;
  checkin_time: string;
  is_completed: boolean;
}

export interface CheckInStats {
  totalCheckIns: number;
  averageMood: number;
  averageAnxiety: number;
  averageEnergy: number;
  averageSleep: number;
  exerciseDays: number;
  riskSituations: number;
}

export interface Streak {
  id: string;
  user_id: string;
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  last_completion_date?: string;
}

export interface MoodHistory {
  id: string;
  user_id: string;
  mood_date: string;
  mood_score?: number;
  anxiety_score?: number;
  energy_score?: number;
  emotional_tags?: string[];
  weekly_average_mood?: number;
  weekly_average_anxiety?: number;
  weekly_average_energy?: number;
  mood_trend?: string;
}

export const useCheckIn = () => {
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar check-in del día
  const loadTodayCheckIn = useCallback(async () => {
    try {
      const response = await api.get<any>('/checkins/today');

      if (response && response.success) {
        setTodayCheckIn(response.data);
      }
    } catch (err: any) {
      console.error('Error loading today check-in:', err);
    }
  }, []);

  // Cargar todos los check-ins
  const loadCheckIns = useCallback(async (page = 1, limit = 30) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<any>('/checkins', { params: { page, limit } });

      if (response && response.success) {
        setCheckIns(response.data.checkIns);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al cargar check-ins');
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear check-in
  const createCheckIn = useCallback(async (data: Partial<CheckIn>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post<any>('/checkins', data);

      if (response && response.success) {
        setTodayCheckIn(response.data);
        await loadCheckIns();
        await loadStreaks();
        return response.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al crear check-in');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadCheckIns]);

  // Actualizar check-in
  const updateCheckIn = useCallback(async (id: string, data: Partial<CheckIn>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put<any>(`/checkins/${id}`, data);

      if (response && response.success) {
        if (todayCheckIn?.id === id) {
          setTodayCheckIn(response.data);
        }
        return response.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al actualizar check-in');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [todayCheckIn]);

  // Cargar rachas
  const loadStreaks = useCallback(async () => {
    try {
      const response = await api.get<any>('/checkins/streaks');

      if (response && response.success) {
        setStreaks(response.data);
      }
    } catch (err: any) {
      console.error('Error loading streaks:', err);
    }
  }, []);

  // Cargar estadísticas
  const loadStats = useCallback(async (days = 30) => {
    try {
      const response = await api.get<any>('/checkins/stats', { params: { days } });

      if (response && response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  }, []);

  // Cargar historial de mood
  const loadMoodHistory = useCallback(async (days = 30) => {
    try {
      const response = await api.get<any>('/checkins/mood-history', { params: { days } });

      if (response && response.success) {
        setMoodHistory(response.data);
      }
    } catch (err: any) {
      console.error('Error loading mood history:', err);
    }
  }, []);

  // Reiniciar racha
  const resetStreak = useCallback(async (streakType: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/checkins/streaks/reset', { streak_type: streakType });

      if (response.data.success) {
        await loadStreaks();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al reiniciar racha');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadStreaks]);

  // Verificar si ha hecho check-in hoy
  const hasCheckedInToday = useCallback(() => {
    return !!todayCheckIn;
  }, [todayCheckIn]);

  // Obtener racha actual
  const getCurrentStreak = useCallback(() => {
    const checkinStreak = streaks.find(s => s.streak_type === 'checkin_completed');
    return checkinStreak?.current_streak || 0;
  }, [streaks]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Cargar secuencialmente lo más crítico primero
        await loadTodayCheckIn();
        await loadStreaks();
        // El resto puede fallar sin bloquear tanto
        await Promise.all([
          loadCheckIns(),
          loadStats(),
          loadMoodHistory()
        ]);
      } catch (err) {
        console.warn('⚠️ [useCheckIn] Algunos datos no pudieron cargarse');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadTodayCheckIn, loadCheckIns, loadStreaks, loadStats, loadMoodHistory]);

  return {
    todayCheckIn,
    checkIns,
    streaks,
    stats,
    moodHistory,
    loading,
    error,
    loadTodayCheckIn,
    loadCheckIns,
    createCheckIn,
    updateCheckIn,
    loadStreaks,
    loadStats,
    loadMoodHistory,
    resetStreak,
    hasCheckedInToday,
    getCurrentStreak,
  };
};

export default useCheckIn;
