import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as medicationModel from '../models/medication.model.js';

export const getMedications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const medications = await medicationModel.getUserMedications(userId);
    res.json({ success: true, count: medications.length, data: medications });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ success: false, error: 'Error al obtener medicamentos' });
  }
};

export const createMedication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, dosage, schedule_time } = req.body;
    
    if (!name || !dosage || !schedule_time) {
      res.status(400).json({ success: false, error: 'Name, dosage, and schedule_time are required' });
      return;
    }

    const medication = await medicationModel.createMedication(userId, { name, dosage, schedule_time });
    res.status(201).json({ success: true, data: medication });
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(500).json({ success: false, error: 'Error al crear medicamento' });
  }
};

export const updateMedication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    
    if (!id) {
      res.status(400).json({ success: false, error: 'ID is required' });
      return;
    }

    const medication = await medicationModel.updateMedication(id, userId, req.body);
    
    if (!medication) {
      res.status(404).json({ success: false, error: 'Medicamento no encontrado' });
      return;
    }
    
    res.json({ success: true, data: medication });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar medicamento' });
  }
};

export const deleteMedication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    
    if (!id) {
      res.status(400).json({ success: false, error: 'ID is required' });
      return;
    }

    const success = await medicationModel.deleteMedication(id, userId);
    
    if (!success) {
      res.status(404).json({ success: false, error: 'Medicamento no encontrado' });
      return;
    }
    
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar medicamento' });
  }
};

export const toggleMedicationTaken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { date } = req.body; // YYYY-MM-DD
    
    if (!id || !date) {
      res.status(400).json({ success: false, error: 'ID and Date are required (YYYY-MM-DD)' });
      return;
    }

    const result = await medicationModel.toggleMedicationLog(id, userId, date);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error toggling medication log:', error);
    res.status(500).json({ success: false, error: 'Error al registrar toma de medicamento' });
  }
};

export const getDailyStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    
    const statusVars = await medicationModel.getDailyMedicationStatus(userId, date);
    
    res.json({ success: true, data: statusVars });
  } catch (error) {
    console.error('Error getting daily medication status:', error);
    res.status(500).json({ success: false, error: 'Error al obtener estado de los medicamentos' });
  }
};
