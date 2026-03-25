/**
 * API Client para servicios de privacidad
 * Endpoints GDPR/CCPA
 * KogniRecovery - Privacidad de datos
 */

import { api } from './client';
import { API_URL } from '@env';

// =====================================================
// TIPOS
// =====================================================

export interface PrivacyConsent {
    id: string;
    user_id: string;
    consent_type: string;
    consent_status: boolean;
    consent_version: string;
    consent_timestamp: string;
    withdrawal_timestamp?: string;
}

export interface PrivacySettings {
    id: string;
    user_id: string;
    profile_visibility: 'public' | 'contacts' | 'private';
    show_online_status: boolean;
    show_activity_status: boolean;
    show_progress_to_others: boolean;
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    allow_data_export: boolean;
    allow_data_deletion: boolean;
    share_with_family: boolean;
    family_member_id?: string;
}

export interface PrivacyAuditLog {
    id: string;
    action_type: string;
    target_type?: string;
    details: Record<string, unknown>;
    created_at: string;
}

export interface DataRequest {
    id: string;
    request_type: string;
    status: string;
    requested_at: string;
    deadline_at: string;
}

// =====================================================
// CONSENT MANAGEMENT
// =====================================================

/**
 * Registrar consentimiento del usuario
 */
export const recordConsent = async (
    consentType: string,
    consentStatus: boolean,
    consentVersion: string
): Promise<PrivacyConsent> => {
    const response = await api.post('/privacy/consent', {
        consent_type: consentType,
        consent_status: consentStatus,
        consent_version: consentVersion
    });
    return response.data;
};

/**
 * Obtener todos los consentimientos del usuario
 */
export const getUserConsents = async (): Promise<PrivacyConsent[]> => {
    const response = await api.get('/privacy/consents');
    return response.data;
};

/**
 * Verificar consentimientos requeridos
 */
export const checkRequiredConsents = async (): Promise<{ valid: boolean; missing: string[] }> => {
    const response = await api.get('/privacy/consents/required');
    return response.data;
};

// =====================================================
// PRIVACY SETTINGS
// =====================================================

/**
 * Obtener configuración de privacidad del usuario
 */
export const getPrivacySettings = async (): Promise<PrivacySettings> => {
    const response = await api.get('/privacy/settings');
    return response.data;
};

/**
 * Actualizar configuración de privacidad del usuario
 */
export const updatePrivacySettings = async (
    settings: Partial<PrivacySettings>
): Promise<PrivacySettings> => {
    const response = await api.put('/privacy/settings', settings);
    return response.data;
};

// =====================================================
// DATA EXPORT/DELETION (GDPR)
// =====================================================

/**
 * Exportar todos los datos del usuario
 * Retorna un blob para descargar
 */
export const exportUserData = async (): Promise<Blob> => {
    const response = await api.get('/privacy/export', {
        responseType: 'blob'
    });
    return response.data;
};

/**
 * Descargar datos como archivo JSON
 */
export const downloadUserData = async (): Promise<void> => {
    const blob = await exportUserData();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kognirecovery-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Solicitar eliminación de datos
 */
export const requestDataDeletion = async (): Promise<DataRequest> => {
    const response = await api.post('/privacy/delete');
    return response.data;
};

// =====================================================
// AUDIT LOG
// =====================================================

/**
 * Obtener historial de auditoría de privacidad
 */
export const getAuditLog = async (
    limit = 50,
    offset = 0
): Promise<{ data: PrivacyAuditLog[]; pagination: { total: number } }> => {
    const response = await api.get('/privacy/audit', {
        params: { limit, offset }
    });
    return response.data;
};

// =====================================================
// PUBLIC ENDPOINTS
// =====================================================

/**
 * Obtener políticas de retención de datos
 */
export const getRetentionPolicies = async (): Promise<{
    data_type: string;
    retention_days: number;
    auto_delete: boolean;
}[]> => {
    const response = await api.get('/privacy/retention-policies');
    return response.data;
};

export default {
    recordConsent,
    getUserConsents,
    checkRequiredConsents,
    getPrivacySettings,
    updatePrivacySettings,
    exportUserData,
    downloadUserData,
    requestDataDeletion,
    getAuditLog,
    getRetentionPolicies
};