/**
 * Rutas de Privacidad
 * Endpoints para GDPR/CCPA compliance
 * KogniRecovery - Privacidad de datos
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as privacyController from '../controllers/privacy.controller.js';

const router = Router();

// =====================================================
// Rutas de Consentimiento (requieren autenticación)
// =====================================================

/**
 * POST /api/v1/privacy/consent
 * Registrar consentimiento del usuario
 */
router.post('/consent', authenticate, privacyController.recordConsent);

/**
 * GET /api/v1/privacy/consents
 * Obtener todos los consentimientos del usuario
 */
router.get('/consents', authenticate, privacyController.getUserConsents);

/**
 * GET /api/v1/privacy/consents/required
 * Verificar consentimientos requeridos
 */
router.get('/consents/required', authenticate, privacyController.checkRequiredConsents);

// =====================================================
// Rutas de Configuración de Privacidad (requieren autenticación)
// =====================================================

/**
 * GET /api/v1/privacy/settings
 * Obtener configuración de privacidad del usuario
 */
router.get('/settings', authenticate, privacyController.getPrivacySettings);

/**
 * PUT /api/v1/privacy/settings
 * Actualizar configuración de privacidad del usuario
 */
router.put('/settings', authenticate, privacyController.updatePrivacySettings);

// =====================================================
// Rutas de Datos (requieren autenticación)
// =====================================================

/**
 * GET /api/v1/privacy/export
 * Exportar todos los datos del usuario (GDPR Art. 15)
 */
router.get('/export', authenticate, privacyController.exportData);

/**
 * POST /api/v1/privacy/delete
 * Solicitar eliminación de datos (GDPR Art. 17)
 */
router.delete('/delete', authenticate, privacyController.requestDataDeletion);

// =====================================================
// Rutas de Auditoría (requieren autenticación)
// =====================================================

/**
 * GET /api/v1/privacy/audit
 * Obtener historial de auditoría de privacidad
 */
router.get('/audit', authenticate, privacyController.getAuditLog);

// =====================================================
// Rutas Públicas (no requieren autenticación)
// =====================================================

/**
 * GET /api/v1/privacy/retention-policies
 * Obtener políticas de retención de datos
 */
router.get('/retention-policies', privacyController.getRetentionPolicies);

export default router;