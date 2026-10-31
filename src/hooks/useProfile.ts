/**
 * Hook de Perfiles de Usuario
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { useState, useEffect, useCallback } from 'react';

import { api } from '../services/api';
import { ApiResponse } from '../types/api';

export interface Profile {
  id: string;
  user_id: string;
  profile_type: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  age_range?: string;
  gender?: string;
  education_level?: string;
  employment_status?: string;
  primary_substance?: string;
  substance_years_use?: number;
  previous_treatments?: boolean;
  has_relapse_history?: boolean;
  current_status?: string;
  treatment_start_date?: string;
  motivation_level?: number;
  preferred_language?: string;
  notification_preferences?: Record<string, boolean>;
}

export interface ProfileSettings {
  id: string;
  profile_id: string;
  checkin_frequency?: string;
  checkin_reminder_time?: string;
  checkin_reminder_enabled?: boolean;
  data_sharing_enabled?: boolean;
  share_with_family?: boolean;
  share_progress_weekly?: boolean;
  anonymous_analytics?: boolean;
  auto_detect_crisis?: boolean;
  emergency_contacts_notified?: boolean;
  location_sharing_emergency?: boolean;
  chatbot_personality?: string;
  response_detail_level?: string;
  memory_enabled?: boolean;
}

export interface SubstancePreference {
  id: string;
  profile_id: string;
  substance_id?: string;
  substance_name: string;
  current_status?: string;
  use_frequency?: string;
  last_use_date?: string;
  target_cease_date?: string;
}

interface ProfilePayload extends Profile {
  settings?: ProfileSettings;
  substance_preferences?: SubstancePreference[];
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [substances, setSubstances] = useState<SubstancePreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar perfil del usuario
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<ApiResponse<ProfilePayload>>('/profiles/me');

      if (response.success) {
        setProfile(response.data);
        setSettings(response.data.settings ?? null);
        setSubstances(response.data.substance_preferences || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar perfil
  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put<ApiResponse<Profile>>('/profiles/me', data);

      if (response.success) {
        setProfile(response.data);
        return response.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al actualizar perfil');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar configuración
  const loadSettings = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<ProfileSettings>>('/profiles/me/settings');

      if (response.success) {
        setSettings(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al cargar configuración');
    }
  }, []);

  // Actualizar configuración
  const updateSettings = useCallback(async (data: Partial<ProfileSettings>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put<ApiResponse<ProfileSettings>>('/profiles/me/settings', data);

      if (response.success) {
        setSettings(response.data);
        return response.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al actualizar configuración');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Agregar preferencia de sustancia
  const addSubstance = useCallback(
    async (data: {
      substance_name: string;
      substance_id?: string;
      current_status?: string;
      use_frequency?: string;
      target_cease_date?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.post<ApiResponse<SubstancePreference>>(
          '/profiles/me/substances',
          data
        );

        if (response.success) {
          setSubstances((prev) => [...prev, response.data]);
          return response.data;
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Error al agregar sustancia');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Eliminar preferencia de sustancia
  const removeSubstance = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.delete<ApiResponse<null>>(`/profiles/me/substances/${id}`);

      if (response.success) {
        setSubstances((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al eliminar sustancia');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al inicializar
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    settings,
    substances,
    loading,
    error,
    loadProfile,
    updateProfile,
    loadSettings,
    updateSettings,
    addSubstance,
    removeSubstance,
  };
};

export default useProfile;
