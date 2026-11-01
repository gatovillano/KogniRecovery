/**
 * Servicio de Privacidad y Consentimiento
 * Implementa GDPR/CCPA compliance
 * KogniRecovery - Privacidad de datos
 */

import { query, queryWithTransaction } from '../config/database.js';
import type { PoolClient } from 'pg';

// =====================================================
// INTERFACES
// =====================================================

export interface PrivacyConsent {
    id: string;
    user_id: string;
    consent_type: string;
    consent_status: boolean;
    consent_version: string;
    ip_address?: string;
    user_agent?: string;
    consent_timestamp: Date;
    withdrawal_timestamp?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface UserPrivacySettings {
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
    created_at: Date;
    updated_at: Date;
}

export interface PrivacyAuditLog {
    id: string;
    user_id?: string;
    action_type: string;
    target_type?: string;
    target_id?: string;
    ip_address?: string;
    user_agent?: string;
    details: Record<string, unknown>;
    success: boolean;
    error_message?: string;
    created_at: Date;
}

export interface DataRequest {
    id: string;
    user_id: string;
    request_type: 'access' | 'export' | 'deletion' | 'rectification' | 'restriction' | 'portability';
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'expired';
    request_details: Record<string, unknown>;
    identity_verified: boolean;
    assigned_to?: string;
    review_notes?: string;
    requested_at: Date;
    completed_at?: Date;
    deadline_at: Date;
    created_at: Date;
    updated_at: Date;
}

export interface DataRetentionPolicy {
    id: string;
    data_type: string;
    retention_days: number;
    auto_delete: boolean;
    anonymize_instead: boolean;
    created_at: Date;
    updated_at: Date;
}

// =====================================================
// CONSENT MANAGEMENT
// =====================================================

/**
 * Registra un consentimiento del usuario
 */
export const recordConsent = async (
    userId: string,
    consentType: string,
    status: boolean,
    version: string,
    ipAddress?: string,
    userAgent?: string
): Promise<PrivacyConsent> => {
    // Verificar si ya existe un consentimiento del mismo tipo
    const existing = await query<PrivacyConsent>(
        `SELECT * FROM privacy_consents 
     WHERE user_id = $1 AND consent_type = $2 
     ORDER BY created_at DESC LIMIT 1`,
        [userId, consentType]
    );

    if (existing.rows[0]) {
        // Actualizar consentimiento existente
        const result = await query<PrivacyConsent>(
            `UPDATE privacy_consents 
       SET consent_status = $1, consent_version = $2, consent_timestamp = NOW(),
           withdrawal_timestamp = CASE WHEN $3 = false THEN NOW() ELSE NULL END,
           ip_address = COALESCE($4, ip_address), user_agent = COALESCE($5, user_agent)
       WHERE id = $6 RETURNING *`,
            [status, version, !status, ipAddress || null, userAgent || null, existing.rows[0].id]
        );
        if (!result.rows[0]) {
            throw new Error('Failed to update consent');
        }
        return result.rows[0];
    }

    // Crear nuevo consentimiento
    const result = await query<PrivacyConsent>(
        `INSERT INTO privacy_consents (user_id, consent_type, consent_status, consent_version, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, consentType, status, version, ipAddress || null, userAgent || null]
    );

    if (!result.rows[0]) {
        throw new Error('Failed to create consent');
    }

    // Registrar en auditoría
    await logPrivacyAction(userId, status ? 'consent_granted' : 'consent_withdrawn', 'consent', result.rows[0].id, { consent_type: consentType }, ipAddress, userAgent);

    return result.rows[0];
};

/**
 * Obtiene todos los consentimientos de un usuario
 */
export const getUserConsents = async (userId: string): Promise<PrivacyConsent[]> => {
    const result = await query<PrivacyConsent>(
        `SELECT * FROM privacy_consents WHERE user_id = $1 ORDER BY consent_type, created_at DESC`,
        [userId]
    );
    return result.rows;
};

/**
 * Verifica si el usuario ha aceptado un tipo específico de consentimiento
 */
export const hasConsent = async (userId: string, consentType: string): Promise<boolean> => {
    const result = await query<PrivacyConsent>(
        `SELECT consent_status FROM privacy_consents 
     WHERE user_id = $1 AND consent_type = $2 
     ORDER BY created_at DESC LIMIT 1`,
        [userId, consentType]
    );
    return result.rows[0]?.consent_status ?? false;
};

/**
 * Verifica si el usuario ha aceptado los consentimientos requeridos para usar la app
 */
export const hasRequiredConsents = async (userId: string): Promise<{ valid: boolean; missing: string[] }> => {
    const requiredConsents = ['terms_of_service', 'privacy_policy', 'data_processing'];
    const userConsents = await getUserConsents(userId);

    const acceptedTypes = userConsents
        .filter(c => c.consent_status)
        .map(c => c.consent_type);

    const missing = requiredConsents.filter(c => !acceptedTypes.includes(c));

    return {
        valid: missing.length === 0,
        missing
    };
};

// =====================================================
// PRIVACY SETTINGS
// =====================================================

/**
 * Obtiene la configuración de privacidad del usuario
 */
export const getUserPrivacySettings = async (userId: string): Promise<UserPrivacySettings | null> => {
    const result = await query<UserPrivacySettings>(
        `SELECT * FROM user_privacy_settings WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0] ?? null;
};

/**
 * Crea o actualiza la configuración de privacidad del usuario
 */
export const updateUserPrivacySettings = async (
    userId: string,
    settings: Partial<Omit<UserPrivacySettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
    ipAddress?: string,
    userAgent?: string
): Promise<UserPrivacySettings> => {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const allowedFields = [
        'profile_visibility', 'show_online_status', 'show_activity_status',
        'show_progress_to_others', 'email_notifications', 'push_notifications',
        'sms_notifications', 'allow_data_export', 'allow_data_deletion',
        'share_with_family', 'family_member_id'
    ];

    for (const [key, value] of Object.entries(settings)) {
        if (allowedFields.includes(key) && value !== undefined) {
            fields.push(`${key} = $${paramIndex++}`);
            values.push(value);
        }
    }

    if (fields.length === 0) {
        throw new Error('No valid fields to update');
    }

    values.push(userId);

    // Usar upsert
    const result = await query<UserPrivacySettings>(
        `INSERT INTO user_privacy_settings (user_id, ${fields.join(', ')})
     VALUES ($${paramIndex}, ${fields.map((_, i) => `$${i + 1}`).join(', ')})
     ON CONFLICT (user_id) DO UPDATE SET ${fields.join(', ')}, updated_at = NOW()
     RETURNING *`,
        values
    );

    if (!result.rows[0]) {
        throw new Error('Failed to update privacy settings');
    }

    // Registrar en auditoría
    await logPrivacyAction(userId, 'privacy_settings_updated', 'settings', result.rows[0].id, settings, ipAddress, userAgent);

    return result.rows[0];
};

/**
 * Inicializa la configuración de privacidad por defecto para un nuevo usuario
 */
export const initUserPrivacySettings = async (userId: string): Promise<UserPrivacySettings> => {
    const result = await query<UserPrivacySettings>(
        `INSERT INTO user_privacy_settings (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
        [userId]
    );
    if (!result.rows[0]) {
        throw new Error('Failed to initialize privacy settings');
    }
    return result.rows[0];
};

// =====================================================
// AUDIT LOGGING
// =====================================================

/**
 * Registra una acción de privacidad en el log de auditoría
 */
export const logPrivacyAction = async (
    userId: string | null,
    actionType: string,
    targetType?: string,
    targetId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
    success = true,
    errorMessage?: string
): Promise<PrivacyAuditLog> => {
    const result = await query<PrivacyAuditLog>(
        `INSERT INTO privacy_audit_log (user_id, action_type, target_type, target_id, ip_address, user_agent, details, success, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [userId, actionType, targetType || null, targetId || null, ipAddress || null, userAgent || null, JSON.stringify(details || {}), success, errorMessage || null]
    );
    if (!result.rows[0]) {
        throw new Error('Failed to log privacy action');
    }
    return result.rows[0];
};

/**
 * Obtiene el historial de auditoría de privacidad de un usuario
 */
export const getUserAuditLog = async (
    userId: string,
    limit = 50,
    offset = 0
): Promise<{ logs: PrivacyAuditLog[]; total: number }> => {
    const [logsResult, countResult] = await Promise.all([
        query<PrivacyAuditLog>(
            `SELECT * FROM privacy_audit_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        ),
        query<{ count: string }>(
            `SELECT COUNT(*) as count FROM privacy_audit_log WHERE user_id = $1`,
            [userId]
        )
    ]);

    return {
        logs: logsResult.rows,
        total: parseInt(countResult.rows[0]?.count ?? '0', 10)
    };
};

// =====================================================
// DATA EXPORT (GDPR Right)
// =====================================================

/**
 * Exporta todos los datos de un usuario (GDPR Art. 15)
 */
export const exportUserData = async (userId: string): Promise<Record<string, unknown>> => {
    // Obtener datos del usuario
    const userResult = await query(
        `SELECT id, email, name, role, created_at, updated_at, status, onboarding_completed, profile_type, risk_level
     FROM users WHERE id = $1`,
        [userId]
    );

    // Obtener consentimientos
    const consents = await getUserConsents(userId);

    // Obtener configuración de privacidad
    const privacySettings = await getUserPrivacySettings(userId);

    // Obtener perfil
    const profileResult = await query(
        `SELECT * FROM profiles WHERE user_id = $1`,
        [userId]
    );

    // Obtener check-ins
    const checkinsResult = await query(
        `SELECT * FROM checkins WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );

    // Obtener diario
    const journalResult = await query(
        `SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );

    // Obtener conversaciones
    const conversationsResult = await query(
        `SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );

    // Obtener registros de antojos
    const cravingsResult = await query(
        `SELECT * FROM cravings WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );

    // Compilar datos exportados
    const exportedData = {
        export_metadata: {
            exported_at: new Date().toISOString(),
            user_id: userId,
            data_categories_included: [
                'user_profile', 'consents', 'privacy_settings',
                'checkins', 'journal', 'conversations', 'cravings'
            ]
        },
        user_profile: userResult.rows[0],
        consents: consents.map(c => ({
            type: c.consent_type,
            status: c.consent_status,
            version: c.consent_version,
            granted_at: c.consent_timestamp,
            withdrawn_at: c.withdrawal_timestamp
        })),
        privacy_settings: privacySettings,
        profile: profileResult.rows[0],
        checkins: checkinsResult.rows,
        journal_entries: journalResult.rows,
        conversations: conversationsResult.rows,
        cravings: cravingsResult.rows
    };

    // Registrar en auditoría
    await logPrivacyAction(userId, 'data_exported', 'data', undefined, { categories: Object.keys(exportedData).filter(k => k !== 'export_metadata') });

    return exportedData;
};

// =====================================================
// DATA DELETION (GDPR Right - Right to be Forgotten)
// =====================================================

/**
 * Solicita eliminación de datos de un usuario
 */
export const requestDataDeletion = async (userId: string): Promise<DataRequest> => {
    // Crear solicitud de eliminación
    const result = await query<DataRequest>(
        `INSERT INTO data_requests (user_id, request_type, status, request_details, identity_verified, deadline_at)
     VALUES ($1, 'deletion', 'pending', '{}', false, NOW() + INTERVAL '30 days')
     RETURNING *`,
        [userId]
    );

    if (!result.rows[0]) {
        throw new Error('Failed to create data deletion request');
    }

    // Registrar en auditoría
    await logPrivacyAction(userId, 'data_deletion_requested', 'data', result.rows[0].id, { request_type: 'deletion' });

    return result.rows[0];
};

/**
 * Ejecuta la eliminación COMPLETA de datos del usuario (GDPR Art. 17)
 * PRIV-002 FIX: Ahora elimina TODOS los datos incluyendo los que antes se omitían.
 *
 * Datos eliminados:
 *  - messages y conversations (chatbot)
 *  - agent_notes
 *  - consumption_events y substance_doses
 *  - mood_history
 *  - wall_messages
 *  - notifications
 *  - refresh_tokens
 *  - profile_settings y profiles
 *  - privacy_consents y audit_logs del usuario
 *  - checkins, cravings, journal_entries
 *  - user_privacy_settings
 *  - usuario (soft-delete con anonimización de PII)
 *
 * Nota: El borrado en Neo4j y embeddings se debe disparar
 *       por separado mediante los servicios correspondientes
 *       (ver deleteUserFromNeo4j y deleteUserEmbeddings).
 */
export const executeDataDeletion = async (userId: string): Promise<void> => {
  // Marcar solicitudes existentes como en progreso (si existen).
  try {
    await query(
      `UPDATE data_deletion_requests SET status = 'in_progress', updated_at = NOW()
       WHERE patient_id = $1 AND status IN ('requested', 'in_progress')`,
      [userId]
    );
  } catch {
    // Tabla puede no existir en entornos reducidos; no bloquea el borrado PG.
  }

  await queryWithTransaction(async (client: PoolClient) => {
    // Obtener email actual para limpiar auth_login_attempts (identifier).
    const userRes = await client.query<{ email: string }>(
      `SELECT email FROM users WHERE id = $1`,
      [userId]
    );
    const userEmail = userRes.rows[0]?.email ?? null;

    // Helper para tablas opcionales (no fallar si no existen).
    const tableExists = async (tableName: string): Promise<boolean> => {
      const r = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = $1
         ) AS exists`,
        [tableName]
      );
      return r.rows[0]?.exists === true;
    };
    const safeDelete = async (tableName: string, column: string, value: unknown): Promise<void> => {
      if (await tableExists(tableName)) {
        await client.query(`DELETE FROM ${tableName} WHERE ${column} = $1`, [value]);
      }
    };

    // 1. Mensajes del chatbot (dato más sensible)
    await client.query(
      `DELETE FROM messages WHERE conversation_id IN (
         SELECT id FROM conversations WHERE user_id = $1
       ) OR user_id = $1`,
      [userId]
    );
    await client.query(`DELETE FROM message_intents WHERE user_id = $1`, [userId]);

    // 2. Sesiones y conversaciones
    await client.query(`DELETE FROM conversation_sessions WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM conversations WHERE user_id = $1`, [userId]);

    // 3. Notas del agente
    await client.query(`DELETE FROM agent_notes WHERE user_id = $1`, [userId]);

    // 4. Bitácora modular
    await safeDelete('journal_entries', 'user_id', userId);
    await client.query(`DELETE FROM daily_notes WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM habit_entries WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM social_entries WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM activity_entries WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM consumption_analysis WHERE user_id = $1`, [userId]);

    // 5. Check-ins y estado de ánimo
    await client.query(`DELETE FROM checkins WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM mood_history WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM checkin_streaks WHERE user_id = $1`, [userId]);

    // 6. Cravings y estrategias
    await client.query(`DELETE FROM cravings WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM craving_patterns WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM craving_triggers WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM coping_strategies WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM strategy_usage WHERE user_id = $1`, [userId]);

    // 7. Consumo de sustancias
    await client.query(`DELETE FROM substance_doses WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM consumption_events WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM substance_expenses WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM substance_preferences WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = $1)`, [userId]);
    await client.query(`DELETE FROM habits WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM habit_completions WHERE user_id = $1`, [userId]);

    // 8. Medicamentos
    await client.query(`DELETE FROM medication_logs WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM medications WHERE user_id = $1`, [userId]);

    // 9. Muro comunitario
    await client.query(`DELETE FROM wall_messages WHERE patient_id = $1 OR family_id = $1 OR sender_id = $1`, [userId]);

    // 10. Notificaciones
    await client.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
    await safeDelete('user_push_tokens', 'user_id', userId);

    // 11. Tokens y autenticación
    await client.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [userId]);
    if (userEmail) {
      await client.query(`DELETE FROM auth_login_attempts WHERE identifier = $1`, [userEmail]);
    }

    // 12. Perfil y settings
    await client.query(`DELETE FROM profile_settings WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = $1)`, [userId]);
    await client.query(`DELETE FROM profiles WHERE user_id = $1`, [userId]);

    // 13. Privacidad
    await client.query(`DELETE FROM user_privacy_settings WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM privacy_consents WHERE user_id = $1`, [userId]);

    // 14. Memoria contextual de LÚA
    await client.query(`DELETE FROM context_history WHERE user_id = $1`, [userId]);

    // 15. Sharing consents e invitaciones
    await client.query(`DELETE FROM sharing_consent_categories WHERE consent_id IN (SELECT id FROM sharing_consents WHERE patient_id = $1)`, [userId]);
    await client.query(`DELETE FROM sharing_consents WHERE patient_id = $1`, [userId]);
    await client.query(`DELETE FROM sharing_invitations WHERE patient_id = $1 OR family_id = $1`, [userId]);
    await client.query(`DELETE FROM sharing_consent_events WHERE patient_id = $1`, [userId]);

    // 16. Emergencias
    await client.query(`DELETE FROM emergency_contacts WHERE user_id = $1`, [userId]);
    await safeDelete('emergency_alerts', 'user_id', userId);

    // 17. LLM logs
    await client.query(`DELETE FROM llm_logs WHERE user_id = $1`, [userId]);

    // 18. Relaciones organizacionales: conservar trazabilidad, marcar como removidas/finalizadas.
    await client.query(
      `UPDATE organization_members SET status = 'removed', updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
    await client.query(
      `UPDATE organization_patients SET status = 'left', discharged_at = COALESCE(discharged_at, NOW()), updated_at = NOW()
       WHERE patient_id = $1`,
      [userId]
    );
    await client.query(
      `UPDATE care_assignments SET status = 'ended', ended_at = COALESCE(ended_at, NOW()),
              ended_reason = COALESCE(ended_reason, 'account_deleted'), updated_at = NOW()
       WHERE professional_id = $1
          OR organization_patient_id IN (SELECT id FROM organization_patients WHERE patient_id = $1)`,
      [userId]
    );
    await client.query(`DELETE FROM professional_credentials WHERE user_id = $1`, [userId]);

    // 19. Alertas clínicas operativas (no notas clínicas ni access_log: se conservan).
    await client.query(`DELETE FROM clinical_alerts WHERE patient_id = $1`, [userId]);

    // 20. Invitaciones de terapeutas y pacientes creadas por el usuario
    await client.query(`UPDATE patient_enrollment_invites SET created_by = NULL WHERE created_by = $1`, [userId]);
    await client.query(`UPDATE consent_policy_versions SET created_by = NULL WHERE created_by = $1`, [userId]);
    await client.query(`UPDATE scenario_configs SET created_by = NULL WHERE created_by = $1`, [userId]);

    // 21. Datos de solicitudes genéricas (no data_deletion_requests: se conserva para auditoría)
    await client.query(`DELETE FROM data_requests WHERE user_id = $1`, [userId]);

    // 22. Logs de auditoría propios (excepto el registro de borrado)
    await client.query(
      `DELETE FROM privacy_audit_log WHERE user_id = $1 AND action_type != 'data_deleted'`,
      [userId]
    );

    // 23. Anonimizar y marcar usuario (soft-delete). Conserva la fila para integridad referencial.
    await client.query(
      `UPDATE users SET
         email = $2,
         name = 'Usuario eliminado',
         phone = NULL,
         status = 'deleted',
         password = 'DELETED',
         password_hash = 'DELETED',
         two_factor_enabled = FALSE,
         two_factor_secret = NULL,
         llm_provider = NULL,
         llm_model = NULL,
         llm_api_key = NULL,
         updated_at = NOW()
       WHERE id = $1`,
      [userId, `deleted_${userId}@kognirecovery.invalid`]
    );
  });

  // Marcar solicitudes de borrado como completadas.
  try {
    await query(
      `UPDATE data_deletion_requests SET status = 'completed', completed_at = NOW(), updated_at = NOW()
       WHERE patient_id = $1`,
      [userId]
    );
  } catch {
    // Ignorar si la tabla no existe.
  }

  // Registrar en auditoría (fuera de la transacción para que persista)
  await logPrivacyAction(
    userId,
    'data_deleted',
    'data',
    undefined,
    {
      scope: 'full_user_data',
      note: 'Usuario anonimizado. Borrado en Neo4j y embeddings pend (servicio externo).'
    }
  );
};

/**
 * Elimina el nodo del usuario y sus datos asociados en Neo4j.
 * Se eliminan nodos clínicos propiedad del usuario; los nodos compartidos
 * (sustancias, etiquetas, atributos) se desvinculan sin borrarlos si pueden
 * pertenecer a otros usuarios.
 */
export const deleteUserFromNeo4j = async (
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  neo4jDriver: any
): Promise<void> => {
  if (!neo4jDriver || typeof neo4jDriver.session !== 'function') {
    throw new Error('Driver de Neo4j no disponible');
  }
  const session = neo4jDriver.session();
  try {
    await session.executeWrite(async (tx: any) => {
      // Conversaciones y mensajes
      await tx.run(
        `MATCH (u:Usuario {id: $userId})-[:TIENE]->(conv:Conversacion)
         OPTIONAL MATCH (conv)-[:CONTIENE]->(m:Mensaje)
         DETACH DELETE m, conv`,
        { userId }
      );
      // Check-ins
      await tx.run(
        `MATCH (u:Usuario {id: $userId})-[:REGISTRA]->(c:CheckIn)
         DETACH DELETE c`,
        { userId }
      );
      // Cravings
      await tx.run(
        `MATCH (u:Usuario {id: $userId})-[:EXPERIMENTA]->(cr:Craving)
         DETACH DELETE cr`,
        { userId }
      );
      // Alertas
      await tx.run(
        `MATCH (u:Usuario {id: $userId})-[:TIENE]->(a:Alerta)
         DETACH DELETE a`,
        { userId }
      );
      // Memorias (atributos): desvincular, no borrar nodos compartidos
      await tx.run(
        `MATCH (u:Usuario {id: $userId})-[r]->(attr:Atributo)
         DELETE r`,
        { userId }
      );
      // Sustancias y medicamentos: desvincular nodos compartidos
      await tx.run(
        `MATCH (u:Usuario {id: $userId})-[r:USA|TOMA]->(n)
         DELETE r`,
        { userId }
      );
      // Usuario principal
      await tx.run(
        `MATCH (u:Usuario {id: $userId})
         DETACH DELETE u`,
        { userId }
      );
    });
  } finally {
    await session.close();
  }
};

/**
 * Orquesta el borrado completo entre PostgreSQL y Neo4j.
 * No declara éxito si alguna etapa obligatoria falla.
 */
export const deleteAccountCompletely = async (
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  neo4jDriver: any
): Promise<{ postgres: boolean; neo4j: boolean }> => {
  const result = { postgres: false, neo4j: false };
  const errors: string[] = [];

  try {
    await executeDataDeletion(userId);
    result.postgres = true;
  } catch (error) {
    errors.push(`PostgreSQL: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    await deleteUserFromNeo4j(userId, neo4jDriver);
    result.neo4j = true;
  } catch (error) {
    errors.push(`Neo4j: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (errors.length > 0) {
    throw new Error(`Borrado parcial o fallido: ${errors.join(' | ')}`);
  }
  return result;
};

export const getRetentionPolicies = async (): Promise<DataRetentionPolicy[]> => {
    const result = await query<DataRetentionPolicy>(
        `SELECT * FROM data_retention_policies ORDER BY data_type`
    );
    return result.rows;
};

/**
 * Obtiene la política de retención para un tipo de dato específico
 */
export const getRetentionPolicy = async (dataType: string): Promise<DataRetentionPolicy | null> => {
    const result = await query<DataRetentionPolicy>(
        `SELECT * FROM data_retention_policies WHERE data_type = $1`,
        [dataType]
    );
    return result.rows[0] ?? null;
};

export default {
    recordConsent,
    getUserConsents,
    hasConsent,
    hasRequiredConsents,
    getUserPrivacySettings,
    updateUserPrivacySettings,
    initUserPrivacySettings,
    logPrivacyAction,
    getUserAuditLog,
    exportUserData,
    requestDataDeletion,
    executeDataDeletion,
    deleteUserFromNeo4j,
    deleteAccountCompletely,
    getRetentionPolicies,
    getRetentionPolicy
};