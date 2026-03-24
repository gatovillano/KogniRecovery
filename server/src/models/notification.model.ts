/**
 * Modelo de Notificaciones
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { query } from '../config/database.js';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  read_at: Date | null;
  created_at: Date;
}

/**
 * Obtener notificaciones no leídas de un usuario
 */
export const getUnreadNotifications = async (userId: string): Promise<Notification[]> => {
  const sql = `
    SELECT * FROM notifications 
    WHERE user_id = $1 AND is_read = false 
    ORDER BY created_at DESC
  `;
  const result = await query(sql, [userId]);
  return result.rows as Notification[];
};

/**
 * Contar notificaciones no leídas
 */
export const countUnreadNotifications = async (userId: string): Promise<number> => {
  const sql = `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`;
  const result = await query(sql, [userId]);
  return parseInt((result.rows[0] as any).count);
};

/**
 * Marcar notificación como leída
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  const sql = `UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1`;
  await query(sql, [notificationId]);
};

/**
 * Crear una notificación
 */
export const createNotification = async (userId: string, type: string, title: string, message: string, data: any = {}): Promise<Notification> => {
  const sql = `
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const result = await query(sql, [userId, type, title, message, JSON.stringify(data)]);
  return result.rows[0] as Notification;
};
