import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as noteModel from '../models/note.model.js';

const getUser = (req: Request) => (req as AuthRequest).user?.userId;
const unauthorized = (res: Response) =>
  res
    .status(401)
    .json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });

export const createNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) {
      unauthorized(res);
      return;
    }
    const { title, content, category } = req.body;
    if (!content) {
      res
        .status(400)
        .json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'El contenido es requerido' },
        });
      return;
    }
    const createData: {
      title?: string;
      content: string;
      source: 'user' | 'agent';
      category?: string;
    } = {
      content,
      source: 'user',
    };
    if (title) createData.title = title;
    if (category) createData.category = category;
    const note = await noteModel.createNote(userId, createData);
    res.status(201).json({ success: true, data: note, message: 'Nota guardada' });
  } catch (error) {
    next(error);
  }
};

export const getNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) {
      unauthorized(res);
      return;
    }
    const { source, category, limit } = req.query;
    const opts: { source?: 'user' | 'agent'; category?: string; limit?: number } = {
      limit: limit ? parseInt(limit as string) : 50,
    };
    if (source) opts.source = source as 'user' | 'agent';
    if (category) opts.category = category as string;
    const notes = await noteModel.getNotes(userId, opts);
    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
};

export const getNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) {
      unauthorized(res);
      return;
    }
    const noteId = req.params.id;
    const note = await noteModel.getNoteById(noteId, userId);
    if (!note) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Nota no encontrada' } });
      return;
    }
    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) {
      unauthorized(res);
      return;
    }
    const noteId = req.params.id;
    const { title, content, category, is_pinned } = req.body;
    const updateData: { title?: string; content?: string; category?: string; is_pinned?: boolean } =
      {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    const note = await noteModel.updateNote(noteId, userId, updateData);
    if (!note) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Nota no encontrada' } });
      return;
    }
    res.json({ success: true, data: note, message: 'Nota actualizada' });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) {
      unauthorized(res);
      return;
    }
    const noteId = req.params.id;
    const deleted = await noteModel.deleteNote(noteId, userId);
    if (!deleted) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Nota no encontrada' } });
      return;
    }
    res.json({ success: true, message: 'Nota eliminada' });
  } catch (error) {
    next(error);
  }
};

export const togglePin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getUser(req);
    if (!userId) {
      unauthorized(res);
      return;
    }
    const noteId = req.params.id;
    const note = await noteModel.togglePin(noteId, userId);
    if (!note) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Nota no encontrada' } });
      return;
    }
    res.json({
      success: true,
      data: note,
      message: note.is_pinned ? 'Nota fijada' : 'Nota desfijada',
    });
  } catch (error) {
    next(error);
  }
};
