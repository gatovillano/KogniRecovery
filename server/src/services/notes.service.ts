/**
 * Notas privadas del terapeuta (`clinical_notes`).
 *
 * Son datos del profesional, no del paciente: el acceso se rige por
 * membresía + asignación/rol clínico, NO por consentimiento del paciente.
 * El contenido se cifra con AES-256-GCM antes de persistir.
 */

import crypto from 'node:crypto';
import { query } from '../config/database.js';
import * as ClinicalAccess from './clinicalAccess.service.js';
import type { AuditContext } from './clinicalAccess.service.js';
import * as AuditService from './audit.service.js';
export type NoteVisibility = 'private' | 'care_team';

export interface ClinicalNote {
  id: string;
  organization_id: string;
  patient_id: string;
  author_id: string;
  content_encrypted: Buffer;
  visibility: NoteVisibility;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface ClinicalNoteView {
  id: string;
  patient_id: string;
  author_id: string;
  author_name?: string | null;
  visibility: NoteVisibility;
  content: string;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// CIFRADO LOCAL
// =====================================================

const getEncryptionKey = (): Buffer => {
  const envKey = process.env.ENCRYPTION_KEY;
  const envSalt = process.env.ENCRYPTION_SALT;
  if (envKey && envSalt) {
    return crypto.pbkdf2Sync(envKey, envSalt, 100000, 32, 'sha512');
  }
  const base = process.env.JWT_SECRET ?? 'kognirecovery-dev';
  return crypto.createHash('sha256').update(`${base}:clinical_notes`).digest();
};

const encryptContent = (plain: string): Buffer => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
};

const decryptContent = (buffer: Buffer): string => {
  try {
    const key = getEncryptionKey();
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const data = buffer.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch (error) {
    console.error('❌ No se pudo desencriptar nota clínica:', error);
    throw new Error('Error al desencriptar nota');
  }
};

// =====================================================
// AUTORIZACIÓN
// =====================================================

const authorizeTherapistScope = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  context: AuditContext;
}): Promise<void> => {
  await ClinicalAccess.authorizePatientScope(input, input.context);
};

const resolveMembershipRole = async (organizationId: string, userId: string): Promise<string> => {
  const result = await query<{ role: string }>(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
    [organizationId, userId]
  );
  return result.rows[0]?.role ?? '';
};

const canModifyNote = async (
  note: ClinicalNote,
  actorId: string,
  organizationId: string
): Promise<boolean> => {
  if (note.author_id === actorId) return true;
  const role = await resolveMembershipRole(organizationId, actorId);
  return role === 'clinical_lead' || role === 'org_admin';
};

// =====================================================
// LECTURA
// =====================================================

export const listNotesForTherapist = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  limit?: number;
  context: AuditContext;
}): Promise<ClinicalNoteView[]> => {
  await authorizeTherapistScope(input);

  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  const result = await query<
    ClinicalNote & { author_name?: string | null }
  >(
    `SELECT cn.*,
            COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) AS author_name
     FROM clinical_notes cn
     JOIN users u ON u.id = cn.author_id
     WHERE cn.organization_id = $1 AND cn.patient_id = $2
       AND cn.deleted_at IS NULL
     ORDER BY cn.created_at DESC
     LIMIT $3`,
    [input.organizationId, input.patientId, limit]
  );

  await AuditService.logAccess({
    actorId: input.actorId,
    actorRole: input.actorRole,
    organizationId: input.organizationId,
    patientId: input.patientId,
    action: 'list',
    resourceType: 'clinical_notes',
    resourceIds: result.rows.map((row) => row.id),
    purpose: 'treatment',
    success: true,
    ipAddress: input.context.ipAddress,
    userAgent: input.context.userAgent,
    requestId: input.context.requestId,
  });

  return result.rows.map((note) => ({
    id: note.id,
    patient_id: note.patient_id,
    author_id: note.author_id,
    author_name: note.author_name ?? null,
    visibility: note.visibility,
    content: decryptContent(note.content_encrypted),
    created_at: note.created_at,
    updated_at: note.updated_at,
  }));
};

// =====================================================
// ESCRITURA
// =====================================================

export const createNote = async (input: {
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  content: string;
  visibility?: NoteVisibility;
  context: AuditContext;
}): Promise<ClinicalNoteView> => {
  await authorizeTherapistScope(input);

  const content = input.content?.trim();
  if (!content) {
    throw new ClinicalAccess.ClinicalAccessError(
      400,
      'INVALID_PAYLOAD',
      'El contenido de la nota es obligatorio',
      'empty_note_content'
    );
  }

  const encrypted = encryptContent(content);
  const visibility = input.visibility === 'private' ? 'private' : 'care_team';

  const result = await query<ClinicalNote>(
    `INSERT INTO clinical_notes
       (organization_id, patient_id, author_id, content_encrypted, visibility)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.organizationId, input.patientId, input.actorId, encrypted, visibility]
  );

  const note = result.rows[0]!;

  await AuditService.logAccess({
    actorId: input.actorId,
    actorRole: input.actorRole,
    organizationId: input.organizationId,
    patientId: input.patientId,
    action: 'view',
    resourceType: 'clinical_notes:create',
    resourceIds: [note.id],
    purpose: 'treatment',
    success: true,
    ipAddress: input.context.ipAddress,
    userAgent: input.context.userAgent,
    requestId: input.context.requestId,
  });

  return {
    id: note.id,
    patient_id: note.patient_id,
    author_id: note.author_id,
    visibility: note.visibility,
    content,
    created_at: note.created_at,
    updated_at: note.updated_at,
  };
};

const findNoteInOrg = async (
  noteId: string,
  organizationId: string,
  patientId: string
): Promise<ClinicalNote | null> => {
  const result = await query<ClinicalNote>(
    `SELECT * FROM clinical_notes
     WHERE id = $1 AND organization_id = $2 AND patient_id = $3
       AND deleted_at IS NULL`,
    [noteId, organizationId, patientId]
  );
  return result.rows[0] ?? null;
};

export const updateNote = async (input: {
  noteId: string;
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  content: string;
  visibility?: NoteVisibility;
  context: AuditContext;
}): Promise<ClinicalNoteView> => {
  await authorizeTherapistScope(input);

  const note = await findNoteInOrg(input.noteId, input.organizationId, input.patientId);
  if (!note) {
    throw new ClinicalAccess.ClinicalAccessError(
      404,
      'NOTE_NOT_FOUND',
      'Nota no encontrada',
      'note_not_found'
    );
  }

  if (!(await canModifyNote(note, input.actorId, input.organizationId))) {
    throw new ClinicalAccess.ClinicalAccessError(
      403,
      'FORBIDDEN',
      'Solo el autor o el responsable clínico pueden editar esta nota',
      'note_not_owned'
    );
  }

  const content = input.content?.trim();
  if (!content) {
    throw new ClinicalAccess.ClinicalAccessError(
      400,
      'INVALID_PAYLOAD',
      'El contenido de la nota es obligatorio',
      'empty_note_content'
    );
  }

  const encrypted = encryptContent(content);
  const visibility = input.visibility === 'private' ? 'private' : 'care_team';

  const result = await query<ClinicalNote>(
    `UPDATE clinical_notes
     SET content_encrypted = $2, visibility = $3, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [input.noteId, encrypted, visibility]
  );

  const updated = result.rows[0]!;

  await AuditService.logAccess({
    actorId: input.actorId,
    actorRole: input.actorRole,
    organizationId: input.organizationId,
    patientId: input.patientId,
    action: 'view',
    resourceType: 'clinical_notes:update',
    resourceIds: [updated.id],
    purpose: 'treatment',
    success: true,
    ipAddress: input.context.ipAddress,
    userAgent: input.context.userAgent,
    requestId: input.context.requestId,
  });

  return {
    id: updated.id,
    patient_id: updated.patient_id,
    author_id: updated.author_id,
    visibility: updated.visibility,
    content,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  };
};

export const deleteNote = async (input: {
  noteId: string;
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  context: AuditContext;
}): Promise<{ id: string; deleted: boolean }> => {
  await authorizeTherapistScope(input);

  const note = await findNoteInOrg(input.noteId, input.organizationId, input.patientId);
  if (!note) {
    throw new ClinicalAccess.ClinicalAccessError(
      404,
      'NOTE_NOT_FOUND',
      'Nota no encontrada',
      'note_not_found'
    );
  }

  if (!(await canModifyNote(note, input.actorId, input.organizationId))) {
    throw new ClinicalAccess.ClinicalAccessError(
      403,
      'FORBIDDEN',
      'Solo el autor o el responsable clínico pueden eliminar esta nota',
      'note_not_owned'
    );
  }

  await query(
    `UPDATE clinical_notes SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [input.noteId]
  );

  await AuditService.logAccess({
    actorId: input.actorId,
    actorRole: input.actorRole,
    organizationId: input.organizationId,
    patientId: input.patientId,
    action: 'export',
    resourceType: 'clinical_notes:delete',
    resourceIds: [note.id],
    purpose: 'treatment',
    success: true,
    ipAddress: input.context.ipAddress,
    userAgent: input.context.userAgent,
    requestId: input.context.requestId,
  });

  return { id: note.id, deleted: true };
};

export default {
  listNotesForTherapist,
  createNote,
  updateNote,
  deleteNote,
};
