/**
 * Controlador de Privacidad
 * Endpoints para GDPR/CCPA compliance
 * KogniRecovery - Privacidad de datos
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as privacyService from '../services/privacy.service.js';
import { exportUserData } from '../services/privacy.service.js';

// =====================================================
// CONSENT MANAGEMENT
// =====================================================

/**
 * POST /api/v1/privacy/consent
 * Registrar consentimiento del usuario
 */
export const recordConsent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
            });
            return;
        }

        const { consent_type, consent_status, consent_version } = req.body;

        if (!consent_type || consent_status === undefined || !consent_version) {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_REQUEST', message: 'Faltan campos requeridos' }
            });
            return;
        }

        const validTypes = ['terms_of_service', 'privacy_policy', 'data_processing', 'marketing', 'analytics', 'third_party_sharing'];
        if (!validTypes.includes(consent_type)) {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_CONSENT_TYPE', message: 'Tipo de consentimiento inválido' }
            });
            return;
        }

        const consent = await privacyService.recordConsent(
            userId,
            consent_type,
            consent_status,
            consent_version,
            req.ip || undefined,
            req.headers['user-agent']
        );

        res.status(200).json({
            success: true,
            data: consent
        });
    } catch (error) {
        console.error('Error recording consent:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error al registrar consentimiento' }
        });
    }
};

/**
 * GET /api/v1/privacy/consents
 * Obtener todos los consentimientos del usuario
 */
export const getUserConsents = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
            });
            return;
        }

        const consents = await privacyService.getUserConsents(userId);

        res.status(200).json({
            success: true,
            data: consents
        });
    } catch (error) {
        console.error('Error getting consents:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error al obtener consentimientos' }
        });
    }
};

/**
 * GET /api/v1/privacy/consents/required
 * Verificar consentimientos requeridos
 */
export const checkRequiredConsents = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
            });
            return;
        }

        const result = await privacyService.hasRequiredConsents(userId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error checking required consents:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error al verificar consentimientos' }
        });
    }
};

// =====================================================
// PRIVACY SETTINGS
// =====================================================

/**
 * GET /api/v1/privacy/settings
 * Obtener configuración de privacidad del usuario
 */
export const getPrivacySettings = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
            });
            return;
        }

        const settings = await privacyService.getUserPrivacySettings(userId);

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error getting privacy settings:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error al obtener configuración de privacidad' }
        });
    }
};

/**
 * PUT /api/v1/privacy/settings
 * Actualizar configuración de privacidad del usuario
 */
export const updatePrivacySettings = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
            });
            return;
        }

        const settings = req.body;

        // Validar campos permitidos
        const allowedFields = [
            'profile_visibility', 'show_online_status', 'show_activity_status',
            'show_progress_to_others', 'email_notifications', 'push_notifications',
            'sms_notifications', 'allow_data_export', 'allow_data_deletion',
            'share_with_family', 'family_member_id'
        ];

        const invalidFields = Object.keys(settings).filter(k => !allowedFields.includes(k));
        if (invalidFields.length > 0) {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_FIELDS', message: `Campos inválidos: ${invalidFields.join(', ')}` }
            });
            return;
        }

        // Validar valores específicos
        if (settings.profile_visibility && !['public', 'contacts', 'private'].includes(settings.profile_visibility)) {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_VALUE', message: 'Valor inválido para profile_visibility' }
            });
            return;
        }

        const updatedSettings = await privacyService.updateUserPrivacySettings(
            userId,
            settings,
            req.ip || undefined,
            req.headers['user-agent']
        );

        res.status(200).json({
            success: true,
            data: updatedSettings
        });
    } catch (error) {
        console.error('Error updating privacy settings:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error al actualizar configuración de privacidad' }
        });
    }
};

// =====================================================
// DATA EXPORT (GDPR)
// =====================================================

/**
 * GET /api/v1/privacy/export
 * Exportar todos los datos del usuario (GDPR Art. 15)
 */
export const exportData = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
            });
            return;
        }

        // Verificar que el usuario tenga habilitada la exportación
        const settings = await privacyService.getUserPrivacySettings(userId);
        if (settings && !settings.allow_data_export) {
            res.status(403).json({
                success: false,
                error: { code: 'EXPORT_DISABLED', message: 'La exportación de datos está deshabilitada' }
            });
            return;
        }

        const data = await exportUserData(userId);

        // Enviar como archivo JSON descargable
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="kognirecovery-data-${userId}.json"`);
        res.status(200).send(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error al exportar datos' }
        });
    }
};

// =====================================================
// DATA DELETION (GDPR - Right to be Forgotten)
// =====================================================

/**
 * POST /api/v1/privacy/delete
 * Solicitar eliminación de datos (GDPR Art. 17)
 */
export const requestDataDeletion = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
            });
            return;
        }

        // Verificar que el usuario tenga habilitada la eliminación
        const settings = await privacyService.getUserPrivacySettings(userId);
        if (settings && !settings.allow_data_deletion) {
            res.status(403).json({
                success: false,
                error: { code: 'DELETION_DISABLED', message: 'La eliminación de datos está deshabilitada' }
            });
            return;
        }

        const deletionRequest = await privacyService.requestDataDeletion(userId);

        res.status(202).json({
            success: true,
            message: 'Solicitud de eliminación creada. El proceso puede tomar hasta 30 días.',
            data: deletionRequest
        });
    } catch (error) {
        console.error('Error requesting data deletion:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error al solicitar eliminación de datos' }
        });
    }
};

// =====================================================
// AUDIT LOG
// =====================================================

/**
 * GET /api/v1/privacy/audit
 * Obtener historial de auditoría de privacidad
 */
export const getAuditLog = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
            });
            return;
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await privacyService.getUserAuditLog(userId, limit, offset);

        res.status(200).json({
            success: true,
            data: result.logs,
            pagination: {
                total: result.total,
                limit,
                offset
            }
        });
    } catch (error) {
        console.error('Error getting audit log:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error al obtener historial de auditoría' }
        });
    }
};

// =====================================================
// RETENTION POLICIES (Admin)
// =====================================================

/**
 * GET /api/v1/privacy/retention-policies
 * Obtener políticas de retención de datos
 */
export const getRetentionPolicies = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const policies = await privacyService.getRetentionPolicies();

        res.status(200).json({
            success: true,
            data: policies
        });
    } catch (error) {
        console.error('Error getting retention policies:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error al obtener políticas de retención' }
        });
    }
};

export default {
    recordConsent,
    getUserConsents,
    checkRequiredConsents,
    getPrivacySettings,
    updatePrivacySettings,
    exportData,
    requestDataDeletion,
    getAuditLog,
    getRetentionPolicies
};