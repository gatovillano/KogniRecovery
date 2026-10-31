/**
 * Controlador de notas clínicas del terapeuta.
 */

import type { NextFunction, Request, Response } from 'express';
import * as NotesService from '../services/notes.service.js';
import * as ClinicalAccess from '../services/clinicalAccess.service.js';
import { createError } from '../middleware/error.js';
import { getAuthenticatedActor, parseLimit, resolveOrganizationId } from './clinicalContext.js';

const contextFor = (req: Request): ClinicalAccess.AuditContext =>
  ClinicalAccess.buildAuditContext(req);

const resolvePatientResource = async (
  req: Request
): Promise<{
  actorId: string;
  actorRole: string;
  organizationId: string;
  patientId: string;
  auditContext: ClinicalAccess.AuditContext;
}> => {
  const { actorId, actorRole } = getAuthenticatedActor(req);
  const organizationId = await resolveOrganizationId(req, actorId);
  const patientId = req.params.id;
  if (!patientId) {
    throw createError('Paciente no indicado', 400, 'PATIENT_ID_REQUIRED');
  }
  return { actorId, actorRole, organizationId, patientId, auditContext: contextFor(req) };
};

export const getPatientNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole, organizationId, patientId, auditContext } =
      await resolvePatientResource(req);

    const notes = await NotesService.listNotesForTherapist({
      actorId,
      actorRole,
      organizationId,
      patientId,
      limit: parseLimit(req.query.limit, 50, 200),
      context: auditContext,
    });

    res.json({
      success: true,
      data: { notes },
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const createNoteAction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole, organizationId, patientId, auditContext } =
      await resolvePatientResource(req);

    const body = req.body as { content?: string; visibility?: 'private' | 'care_team' };
    if (!body.content) {
      throw createError('El contenido de la nota es obligatorio', 400, 'INVALID_PAYLOAD');
    }

    const note = await NotesService.createNote({
      actorId,
      actorRole,
      organizationId,
      patientId,
      content: body.content,
      visibility: body.visibility,
      context: auditContext,
    });

    res.status(201).json({
      success: true,
      data: note,
      message: 'Nota creada',
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

const resolveNoteResource = async (req: Request) => {
  const { actorId, actorRole, organizationId, patientId, auditContext } =
    await resolvePatientResource(req);
  const noteId = req.params.noteId;
  if (!noteId) {
    throw createError('Nota no indicada', 400, 'NOTE_ID_REQUIRED');
  }
  return { noteId, actorId, actorRole, organizationId, patientId, context: auditContext };
};

export const updateNoteAction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = await resolveNoteResource(req);
    const body = req.body as { content?: string; visibility?: 'private' | 'care_team' };

    if (!body.content) {
      throw createError('El contenido de la nota es obligatorio', 400, 'INVALID_PAYLOAD');
    }

    const note = await NotesService.updateNote({
      ...input,
      content: body.content,
      visibility: body.visibility,
    });

    res.json({
      success: true,
      data: note,
      message: 'Nota actualizada',
      meta: { request_id: input.context.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNoteAction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = await resolveNoteResource(req);
    const result = await NotesService.deleteNote(input);

    res.json({
      success: true,
      data: result,
      message: 'Nota eliminada (borrado lógico)',
      meta: { request_id: input.context.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getPatientNotes,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
};
