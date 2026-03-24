/**
 * Modelo de Pared Compartida
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { query } from '../config/database.js';

export interface WallMessage {
  id: string;
  patient_id: string;
  family_id: string;
  sender_id: string;
  message: string;
  emoji: string | null;
  is_read: boolean;
  created_at: Date;
}

/**
 * Obtener últimos mensajes de la pared para un paciente
 */
export const getLatestWallMessages = async (patientId: string, limit = 5): Promise<WallMessage[]> => {
  const sql = `
    SELECT wm.*, u.name as sender_name 
    FROM wall_messages wm
    JOIN users u ON wm.sender_id = u.id
    WHERE wm.patient_id = $1
    ORDER BY wm.created_at DESC
    LIMIT $2
  `;
  const result = await query(sql, [patientId, limit]);
  return result.rows as WallMessage[];
};

/**
 * Enviar mensaje a la pared
 */
export const sendWallMessage = async (patientId: string, familyId: string, senderId: string, message: string, emoji: string | null = null): Promise<WallMessage> => {
  const sql = `
    INSERT INTO wall_messages (patient_id, family_id, sender_id, message, emoji)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const result = await query(sql, [patientId, familyId, senderId, message, emoji]);
  return result.rows[0] as WallMessage;
};

/**
 * Marcar mensajes como leídos
 */
export const markAsRead = async (patientId: string): Promise<void> => {
  const sql = `UPDATE wall_messages SET is_read = true WHERE patient_id = $1 AND is_read = false`;
  await query(sql, [patientId]);
};
