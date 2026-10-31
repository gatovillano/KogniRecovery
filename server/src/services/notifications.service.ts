/**
 * Notificaciones internas (bandeja por usuario).
 *
 * Se usan para avisos neutrales: nuevo paciente vinculado, cambios de
 * consentimiento, etc. Nunca contienen contenido clínico sensible.
 */

import { query } from '../config/database.js';
import { createError } from '../middleware/error.js';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  is_read: boolean;
  data?: unknown;
  created_at: Date;
}

export const createNotification = async (input: {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  data?: unknown;
}): Promise<Notification> => {
  const result = await query<Notification>(
    `INSERT INTO notifications (user_id, title, body, type, data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.userId,
      input.title,
      input.body,
      input.type ?? 'info',
      input.data === undefined ? null : JSON.stringify(input.data),
    ]
  );
  return result.rows[0]!;
};

export const listNotificationsForUser = async (
  userId: string,
  options: { unreadOnly?: boolean; limit?: number } = {}
): Promise<Notification[]> => {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const params: unknown[] = [userId];
  const where: string[] = ['user_id = $1'];

  if (options.unreadOnly) {
    params.push(false);
    where.push(`is_read = $${params.length}`);
  }
  params.push(limit);
  const limitParam = `$${params.length}`;

  const result = await query<Notification>(
    `SELECT * FROM notifications
     WHERE ${where.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT ${limitParam}`,
    params
  );
  return result.rows;
};

export const markNotificationRead = async (
  notificationId: string,
  userId: string
): Promise<Notification> => {
  const result = await query<Notification>(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  const row = result.rows[0];
  if (!row) {
    throw createError('Notificación no encontrada', 404, 'NOTIFICATION_NOT_FOUND');
  }
  return row;
};

export const countUnread = async (userId: string): Promise<number> => {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return parseInt(result.rows[0]?.count ?? '0', 10);
};

export default {
  createNotification,
  listNotificationsForUser,
  markNotificationRead,
  countUnread,
};
