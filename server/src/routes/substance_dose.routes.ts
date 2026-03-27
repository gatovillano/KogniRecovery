import { Router } from 'express';
import { 
  getDoses, 
  createDose, 
  deleteDose 
} from '../controllers/substance_dose.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.route('/')
  .get(getDoses)
  .post(createDose);

router.delete('/:id', deleteDose);

export default router;
