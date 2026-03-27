import { Request, Response } from 'express';
import * as consumptionModel from '../models/consumption.model.js';
import { AuthRequest } from '../middleware/auth.js';

export const addConsumption = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const data = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    if (!data.substance_name || !data.quantity) {
      res.status(400).json({ success: false, message: 'Faltan campos requeridos (substance_name, quantity)' });
      return;
    }

    const event = await consumptionModel.createConsumptionEvent(userId, {
      ...data,
      consumed_at: data.consumed_at ? new Date(data.consumed_at) : new Date()
    });

    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    console.error('Error al registrar consumo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const getConsumptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const events = await consumptionModel.getConsumptionEvents(userId, limit, offset);
    res.json({ success: true, data: events });
  } catch (error: any) {
    console.error('Error al obtener consumos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const getWeeklyVariation = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const days = parseInt(req.query.days as string) || 7;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const stats = await consumptionModel.getWeeklyVariationStats(userId, days);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error al obtener variación semanal:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const getDailyVariation = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const stats = await consumptionModel.getDailyQuantityVariationStats(userId, dateStr);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error al obtener variación diaria:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
