/**
 * Controlador para consentimiento de datos clínicos del paciente
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as consentService from '../services/patientConsent.service.js';
import { CONSENT_CATEGORIES } from '../config/consent.js';

/**
 * GET /api/v1/patient/consents
 * Devuelve la lista de consentimientos por categoría
 */
export const listConsents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' } });
      return;
    }
    const consents = await consentService.getUserConsents(userId);
    res.json({ success: true, data: consents });
  } catch (e) {
    console.error('Error listConsents:', e);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al obtener consentimientos' } });
  }
};

/**
 * PUT /api/v1/patient/consents
 * Recibe { consents: [{ category, consent_given }] y los guarda
 */
export const updateConsents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' } });
      return;
    }
    const { consents } = req.body as { consents: Array<{ category: string; consent_given: boolean }> };
    if (!Array.isArray(consents)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'El cuerpo debe contener un array de consentimientos' } });
      return;
    }
    // SEC-PHASE2: validar en contra de la taxonomía oficial.
    const validCategories = new Set<string>(
      Object.values(CONSENT_CATEGORIES).map((def) => def.key)
    );
    if (consents.some((c) => !validCategories.has(c.category))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_CATEGORY', message: 'Categoría de consentimiento inválida' } });
      return;
    }
    // Guardar cada consentimiento
    for (const c of consents) {
      await consentService.upsertConsent(userId, c.category, c.consent_given);
    }
    res.json({ success: true, message: 'Consentimientos actualizados' });
  } catch (e) {
    console.error('Error updateConsents:', e);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al actualizar consentimientos' } });
  }
};
