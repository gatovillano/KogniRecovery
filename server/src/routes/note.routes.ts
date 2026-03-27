import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as noteController from '../controllers/note.controller.js';

const router = Router();
router.use(authenticate);

router.route('/').get(noteController.getNotes).post(noteController.createNote);

router
  .route('/:id')
  .get(noteController.getNote)
  .patch(noteController.updateNote)
  .delete(noteController.deleteNote);

router.patch('/:id/pin', noteController.togglePin);

export default router;
