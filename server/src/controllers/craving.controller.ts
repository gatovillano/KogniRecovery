/**
 * Controlador de Cravings
 * Maneja las solicitudes HTTP relacionadas con antojos y estrategias de afrontamiento
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Request, Response, NextFunction } from 'express';
import * as cravingModel from '../models/craving.model.js';
import { AuthRequest } from '../middleware/auth.js';

// =====================================================
// CRAVINGS
// =====================================================

/**
 * POST /api/v1/cravings
 * Crear un nuevo craving
 */
export const createCraving = async (
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

    const { substance_name, substance_id, intensity, triggers } = req.body;
    
    if (!substance_name || !intensity) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Nombre de sustancia e intensidad requeridos' }
      });
      return;
    }

    if (intensity < 1 || intensity > 10) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Intensidad debe estar entre 1 y 10' }
      });
      return;
    }

    const craving = await cravingModel.createCraving(userId, {
      substance_name,
      substance_id,
      intensity,
      triggers,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      data: craving,
      message: 'Craving registrado'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/cravings
 * Obtener cravings del usuario
 */
export const getCravings = async (
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { cravings, total } = await cravingModel.getUserCravings(userId, page, limit);

    res.json({
      success: true,
      data: {
        cravings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/cravings/active
 * Obtener cravings activos
 */
export const getActiveCravings = async (
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

    const cravings = await cravingModel.getActiveCravings(userId);

    res.json({
      success: true,
      data: cravings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/cravings/recent
 * Obtener cravings recientes
 */
export const getRecentCravings = async (
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

    const days = parseInt(req.query.days as string) || 30;
    const cravings = await cravingModel.getRecentCravings(userId, days);

    res.json({
      success: true,
      data: cravings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/cravings/:id
 * Obtener un craving específico
 */
export const getCravingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const craving = await cravingModel.getCravingById(id);

    if (!craving) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Craving no encontrado' }
      });
      return;
    }

    res.json({
      success: true,
      data: craving
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/cravings/:id/resolve
 * Resolver un craving
 */
export const resolveCraving = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, strategies, outcome } = req.body;

    if (!status || !['managed', 'resisted', 'surrendered'].includes(status)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Estado inválido' }
      });
      return;
    }

    const craving = await cravingModel.resolveCraving(id, status, strategies, outcome);

    if (!craving) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Craving no encontrado' }
      });
      return;
    }

    res.json({
      success: true,
      data: craving,
      message: status === 'resisted' ? '¡Felicidades por resistir!' : 
              status === 'managed' ? 'Craving manejado exitosamente' : 
              'Craving registrado'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ESTRATEGIAS DE AFRONTAMIENTO
// =====================================================

/**
 * POST /api/v1/strategies
 * Crear estrategia de afrontamiento
 */
export const createStrategy = async (
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

    const { name, category, description, instructions, when_to_use } = req.body;
    
    if (!name || !category) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Nombre y categoría requeridos' }
      });
      return;
    }

    const strategy = await cravingModel.createCopingStrategy(userId, {
      name,
      category,
      description,
      instructions,
      when_to_use
    });

    res.status(201).json({
      success: true,
      data: strategy,
      message: 'Estrategia creada'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/strategies
 * Obtener estrategias del usuario
 */
export const getStrategies = async (
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

    const strategies = await cravingModel.getUserCopingStrategies(userId);

    res.json({
      success: true,
      data: strategies
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/strategies/category/:category
 * Obtener estrategias por categoría
 */
export const getStrategiesByCategory = async (
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

    const { category } = req.params;
    const strategies = await cravingModel.getStrategiesByCategory(userId, category);

    res.json({
      success: true,
      data: strategies
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/strategies/:id
 * Actualizar estrategia
 */
export const updateStrategy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const strategy = await cravingModel.updateCopingStrategy(id, req.body);

    if (!strategy) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Estrategia no encontrada' }
      });
      return;
    }

    res.json({
      success: true,
      data: strategy,
      message: 'Estrategia actualizada'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/strategies/:id
 * Eliminar estrategia
 */
export const deleteStrategy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await cravingModel.deleteCopingStrategy(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Estrategia no encontrada' }
      });
      return;
    }

    res.json({
      success: true,
      message: 'Estrategia eliminada'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/strategies/:id/use
 * Registrar uso de estrategia
 */
export const recordStrategyUsage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const { id } = req.params;
    const { craving_id, was_effective } = req.body;

    await cravingModel.recordStrategyUsage(userId, id, craving_id, was_effective);

    res.json({
      success: true,
      message: was_effective ? '¡Qué bien funcionó!' : 'La próxima vez será'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DESENCADENANTES
// =====================================================

/**
 * GET /api/v1/triggers
 * Obtener desencadenantes del usuario
 */
export const getTriggers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const triggers = await cravingModel.getUserCravingTriggers(userId);

    res.json({
      success: true,
      data: triggers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/triggers
 * Crear desencadenante
 */
export const createTrigger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const { trigger_type, trigger_description, frequency, consumption_probability } = req.body;
    
    if (!trigger_type || !trigger_description) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Tipo y descripción requeridos' }
      });
      return;
    }

    const trigger = await cravingModel.createCravingTrigger(userId, {
      trigger_type,
      trigger_description,
      frequency,
      consumption_probability
    });

    res.status(201).json({
      success: true,
      data: trigger,
      message: 'Desencadenante creado'
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ESTADÍSTICAS
// =====================================================

/**
 * GET /api/v1/cravings/stats
 * Obtener estadísticas de cravings
 */
export const getCravingStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const days = parseInt(req.query.days as string) || 30;
    const stats = await cravingModel.getCravingStats(userId, days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// PATRONES
// =====================================================

/**
 * GET /api/v1/cravings/patterns
 * Obtener patrones de cravings
 */
export const getCravingPatterns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
      return;
    }

    const patterns = await cravingModel.getUserCravingPatterns(userId);

    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    next(error);
  }
};
