/**
 * Controlador de Gastos en Sustancias
 * Maneja las peticiones HTTP para el módulo de gastos
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Request, Response } from 'express';
import { 
  create, 
  findByUserId, 
  getTotalSpent, 
  update, 
  remove, 
  findById 
} from '../models/substance_expense.model.js';

/**
 * Registra un nuevo gasto
 */
export const registerExpense = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id || req.body.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { amount, substance_id, expense_date, description, currency = 'CLP' } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'El monto es obligatorio' });
    }

    const expense = await create({
      user_id: String(userId),
      substance_id,
      amount,
      currency,
      expense_date: expense_date ? new Date(expense_date) : new Date(),
      description
    });

    return res.status(201).json({
      success: true,
      message: 'Gasto registrado exitosamente',
      data: expense
    });
  } catch (error) {
    console.error('Error al registrar gasto:', error);
    return res.status(500).json({ success: false, message: 'Error interno al registrar el gasto' });
  }
};

/**
 * Obtiene la lista de gastos del usuario
 */
export const getUserExpenses = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const expenses = await findByUserId(String(userId), limit, offset);
    const totalSpent = await getTotalSpent(String(userId));

    return res.json({
      success: true,
      data: expenses,
      total_spent: totalSpent
    });
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    return res.status(500).json({ success: false, message: 'Error interno al obtener los gastos' });
  }
};

/**
 * Obtiene el total gastado en un período
 */
export const getExpenseSummary = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { start_date, end_date } = req.query;

    const totalSpent = await getTotalSpent(
      String(userId), 
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    return res.json({
      success: true,
      data: {
        total: totalSpent,
        currency: 'CLP'
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen de gastos:', error);
    return res.status(500).json({ success: false, message: 'Error interno al obtener resumen' });
  }
};

/**
 * Actualiza un gasto existente
 */
export const updateExpense = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID de gasto no proporcionado' });
    }
    
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const existingExpense = await findById(id);
    if (!existingExpense) {
      return res.status(404).json({ success: false, message: 'Gasto no encontrado' });
    }

    if (existingExpense.user_id !== String(userId)) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para modificar este gasto' });
    }

    const updatedExpense = await update(id, req.body);

    return res.json({
      success: true,
      message: 'Gasto actualizado exitosamente',
      data: updatedExpense
    });
  } catch (error) {
    console.error('Error al actualizar gasto:', error);
    return res.status(500).json({ success: false, message: 'Error interno al actualizar el gasto' });
  }
};

/**
 * Elimina un gasto
 */
export const deleteExpense = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID de gasto no proporcionado' });
    }

    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const existingExpense = await findById(id);
    if (!existingExpense) {
      return res.status(404).json({ success: false, message: 'Gasto no encontrado' });
    }

    if (existingExpense.user_id !== String(userId)) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este gasto' });
    }

    const success = await remove(id);
    if (success) {
      return res.json({ success: true, message: 'Gasto eliminado exitosamente' });
    } else {
      return res.status(400).json({ success: false, message: 'No se pudo eliminar el gasto' });
    }
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    return res.status(500).json({ success: false, message: 'Error interno al eliminar el gasto' });
  }
};
