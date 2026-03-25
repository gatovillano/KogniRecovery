/**
 * Rutas de Gastos en Sustancias
 * Endpoints para el registro y seguimiento de gastos económicos
 * KogniRecovery - Finanzas y Consumo
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as expenseController from '../controllers/substance_expense.controller.js';

const router = Router();

/**
 * POST /api/v1/substance-expenses
 * Registrar un nuevo gasto
 */
router.post('/', authenticate, expenseController.registerExpense);

/**
 * GET /api/v1/substance-expenses
 * Obtener historial de gastos del usuario
 */
router.get('/', authenticate, expenseController.getUserExpenses);

/**
 * GET /api/v1/substance-expenses/summary
 * Obtener resumen de gastos (total, por período)
 */
router.get('/summary', authenticate, expenseController.getExpenseSummary);

/**
 * PUT /api/v1/substance-expenses/:id
 * Actualizar un gasto existente
 */
router.put('/:id', authenticate, expenseController.updateExpense);

/**
 * DELETE /api/v1/substance-expenses/:id
 * Eliminar un gasto
 */
router.delete('/:id', authenticate, expenseController.deleteExpense);

export default router;
