/**
 * Controlador de Perfiles
 * Maneja las solicitudes HTTP relacionadas con perfiles de usuario
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Request, Response, NextFunction } from 'express';
import * as profileModel from '../models/profile.model.js';
import * as userModel from '../models/user.model.js';
import { AuthRequest } from '../middleware/auth.js';
import { encrypt } from '../utils/encryption.js';

// =====================================================
// CREAR PERFIL
// =====================================================

/**
 * POST /api/v1/profiles
 * Crear un nuevo perfil para el usuario
 */
export const createProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    // Verificar si ya existe un perfil
    const existingProfile = await profileModel.getProfileByUserId(userId);
    if (existingProfile) {
      res.status(409).json({
        success: false,
        error: { code: 'PROFILE_EXISTS', message: 'El usuario ya tiene un perfil' }
      });
      return;
    }

    const profile = await profileModel.createProfile(userId, req.body);

    // Crear configuración de perfil por defecto
    await profileModel.createProfileSettings(profile.id, {});

    res.status(201).json({
      success: true,
      data: profile,
      message: 'Perfil creado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// OBTENER PERFIL
// =====================================================

/**
 * GET /api/v1/profiles/me
 * Obtener el perfil del usuario actual
 */
export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const userEmail = authReq.user?.email;
    const userRole = authReq.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    let profile = await profileModel.getProfileByUserId(userId);

    // Auto-crear perfil si no existe (upsert pattern - producción)
    if (!profile) {
      profile = await profileModel.createProfile(userId, {
        profile_type: userRole === 'patient' ? 'estandar' : userRole || 'estandar',
        display_name: userEmail?.split('@')[0] || 'Usuario',
        current_status: 'activo',
        preferred_language: 'es',
      });
      // Crear configuración por defecto
      await profileModel.createProfileSettings(profile.id, {});
    }

    // Obtener configuración de perfil
    let settings = await profileModel.getProfileSettings(profile.id);
    // Auto-crear settings si no existe
    if (!settings) {
      settings = await profileModel.createProfileSettings(profile.id, {});
    }

    // Obtener preferencias de sustancias
    const substances = await profileModel.getSubstancePreferences(profile.id);

    res.json({
      success: true,
      data: {
        ...profile,
        settings,
        substance_preferences: substances
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/profiles/:id
 * Obtener un perfil por ID
 */
export const getProfileById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const profile = await profileModel.getProfileById(id as string);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'Perfil no encontrado' }
      });
      return;
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ACTUALIZAR PERFIL
// =====================================================

/**
 * PUT /api/v1/profiles/me
 * Actualizar el perfil del usuario actual
 */
export const updateMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const profile = await profileModel.getProfileByUserId(userId);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'Perfil no encontrado' }
      });
      return;
    }

    const updatedProfile = await profileModel.updateProfile(profile.id, req.body);

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Perfil actualizado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CONFIGURACIÓN DE PERFIL
// =====================================================

/**
 * GET /api/v1/profiles/me/settings
 * Obtener la configuración del perfil
 */
export const getProfileSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const profile = await profileModel.getProfileByUserId(userId);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'Perfil no encontrado' }
      });
      return;
    }

    const settings = await profileModel.getProfileSettings(profile.id);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/profiles/me/settings
 * Actualizar la configuración del perfil
 */
export const updateProfileSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const profile = await profileModel.getProfileByUserId(userId);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'Perfil no encontrado' }
      });
      return;
    }

    let settings = await profileModel.getProfileSettings(profile.id);

    if (!settings) {
      settings = await profileModel.createProfileSettings(profile.id, req.body);
    } else {
      settings = await profileModel.updateProfileSettings(profile.id, req.body);
    }

    res.json({
      success: true,
      data: settings,
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// PREFERENCIAS DE SUSTANCIAS
// =====================================================

/**
 * POST /api/v1/profiles/me/substances
 * Agregar preferencia de sustancia
 */
export const addSubstancePreference = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const profile = await profileModel.getProfileByUserId(userId);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'Perfil no encontrado' }
      });
      return;
    }

    const { substance_name, substance_id, current_status, use_frequency, target_cease_date } = req.body;

    if (!substance_name) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Nombre de sustancia requerido' }
      });
      return;
    }

    const preference = await profileModel.createSubstancePreference(profile.id, {
      substance_name,
      substance_id,
      current_status,
      use_frequency,
      target_cease_date
    });

    res.status(201).json({
      success: true,
      data: preference,
      message: 'Preferencia de sustancia agregada'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/profiles/me/substances
 * Obtener preferencias de sustancias
 */
export const getSubstancePreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const profile = await profileModel.getProfileByUserId(userId);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'Perfil no encontrado' }
      });
      return;
    }

    const preferences = await profileModel.getSubstancePreferences(profile.id);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/profiles/me/substances/:id
 * Actualizar preferencia de sustancia
 */
export const updateSubstancePreference = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const preference = await profileModel.updateSubstancePreference(id as string, req.body);

    if (!preference) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Preferencia de sustancia no encontrada' }
      });
      return;
    }

    res.json({
      success: true,
      data: preference,
      message: 'Preferencia actualizada'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/profiles/me/substances/:id
 * Eliminar preferencia de sustancia
 */
export const deleteSubstancePreference = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await profileModel.deleteSubstancePreference(id as string);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Preferencia de sustancia no encontrada' }
      });
      return;
    }

    res.json({
      success: true,
      message: 'Preferencia eliminada'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DETERMINAR TIPO DE PERFIL
// =====================================================

/**
 * POST /api/v1/profiles/determine-type
 * Determinar tipo de perfil basado en características
 */
export const determineProfileType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const profileType = profileModel.determineProfileType(req.body);

    res.json({
      success: true,
      data: { profile_type: profileType }
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CONFIGURACIÓN DE IA (DINÁMICA)
// =====================================================

/**
 * PUT /api/v1/profiles/me/ai-settings
 * Actualizar la configuración de IA del usuario
 */
export const updateAISettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const { llm_provider, llm_model, llm_api_key } = req.body;

    // Validaciones básicas
    if (!llm_provider || !llm_model) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Proveedor y modelo son requeridos' }
      });
      return;
    }

    // Preparar objeto de actualización
    const updateData: any = {
      llm_provider,
      llm_model
    };

    // Encriptar API Key si se proporciona una nueva
    if (llm_api_key) {
      updateData.llm_api_key = encrypt(llm_api_key);
    }

    const updatedUser = await userModel.update(userId, updateData);

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' }
      });
      return;
    }

    res.json({
      success: true,
      message: 'Configuración de IA actualizada exitosamente',
      data: {
        provider: updatedUser.llm_provider,
        model: updatedUser.llm_model
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/profiles/ai-models
 * Obtener lista de modelos disponibles según el proveedor
 */
export const getAIModels = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { provider } = req.query;

    if (provider === 'openai') {
      res.json({
        success: true,
        data: [
          { id: 'gpt-4o', name: 'GPT-4o (Más inteligente)' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Más rápido)' },
          { id: 'o1-preview', name: 'OpenAI o1 Preview' },
          { id: 'o1-mini', name: 'OpenAI o1 Mini' }
        ]
      });
      return;
    }

    if (provider === 'openrouter') {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json();
        
        if (data && data.data) {
          const models = data.data.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            context_length: m.context_length,
            pricing: m.pricing
          }));
          
          res.json({
            success: true,
            data: models
          });
          return;
        }
      } catch (error) {
        console.error('Error fetching OpenRouter models:', error);
      }
    }

    // Default o fallback
    res.json({
      success: true,
      data: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
      ]
    });
  } catch (error) {
    next(error);
  }
};
