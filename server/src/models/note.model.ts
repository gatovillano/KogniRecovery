import { query } from '../config/database.js';

export interface AgentNote {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  source: 'user' | 'agent';
  category: string | null;
  is_pinned: boolean;
  created_at: Date;
  updated_at: Date;
}

export const createNote = async (
  userId: string,
  data: { title?: string; content: string; source?: 'user' | 'agent'; category?: string }
): Promise<AgentNote> => {
  const sql = `
    INSERT INTO agent_notes (user_id, title, content, source, category)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`;
  const result = await query(sql, [
    userId,
    data.title || null,
    data.content,
    data.source || 'user',
    data.category || null,
  ]);
  return result.rows[0] as AgentNote;
};

export const getNotes = async (
  userId: string,
  options: { source?: 'user' | 'agent'; category?: string; limit?: number } = {}
): Promise<AgentNote[]> => {
  const conditions = ['user_id = $1'];
  const params: any[] = [userId];
  let paramIndex = 2;

  if (options.source) {
    conditions.push(`source = $${paramIndex}`);
    params.push(options.source);
    paramIndex++;
  }
  if (options.category) {
    conditions.push(`category = $${paramIndex}`);
    params.push(options.category);
    paramIndex++;
  }

  const limit = options.limit || 50;
  const sql = `
    SELECT * FROM agent_notes
    WHERE ${conditions.join(' AND ')}
    ORDER BY is_pinned DESC, created_at DESC
    LIMIT $${paramIndex}`;
  params.push(limit);

  const result = await query(sql, params);
  return result.rows as AgentNote[];
};

export const getNoteById = async (id: string, userId: string): Promise<AgentNote | null> => {
  const result = await query(`SELECT * FROM agent_notes WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
  return (result.rows[0] as AgentNote) || null;
};

export const updateNote = async (
  id: string,
  userId: string,
  data: { title?: string; content?: string; category?: string; is_pinned?: boolean }
): Promise<AgentNote | null> => {
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex}`);
    params.push(data.title);
    paramIndex++;
  }
  if (data.content !== undefined) {
    fields.push(`content = $${paramIndex}`);
    params.push(data.content);
    paramIndex++;
  }
  if (data.category !== undefined) {
    fields.push(`category = $${paramIndex}`);
    params.push(data.category);
    paramIndex++;
  }
  if (data.is_pinned !== undefined) {
    fields.push(`is_pinned = $${paramIndex}`);
    params.push(data.is_pinned);
    paramIndex++;
  }

  if (fields.length === 0) return getNoteById(id, userId);

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const sql = `
    UPDATE agent_notes
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
    RETURNING *`;
  params.push(id, userId);

  const result = await query(sql, params);
  return (result.rows[0] as AgentNote) || null;
};

export const deleteNote = async (id: string, userId: string): Promise<boolean> => {
  const result = await query(`DELETE FROM agent_notes WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
  return (result.rowCount ?? 0) > 0;
};

export const togglePin = async (id: string, userId: string): Promise<AgentNote | null> => {
  const sql = `
    UPDATE agent_notes
    SET is_pinned = NOT is_pinned, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *`;
  const result = await query(sql, [id, userId]);
  return (result.rows[0] as AgentNote) || null;
};
