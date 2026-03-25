import { Router } from 'express';
import { 
  getMedications, 
  createMedication, 
  updateMedication, 
  deleteMedication, 
  toggleMedicationTaken, 
  getDailyStatus 
} from '../controllers/medication.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.route('/')
  .get(getMedications)
  .post(createMedication);

router.get('/daily-status', getDailyStatus);

router.route('/:id')
  .put(updateMedication)
  .delete(deleteMedication);

router.post('/:id/toggle-taken', toggleMedicationTaken);

export default router;
