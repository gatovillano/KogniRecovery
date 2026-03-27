import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as doseModel from '../models/substance_dose.model.js';
import { neo4jService } from '../services/neo4j.service.js';

export const getDoses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const doses = await doseModel.getSubstanceDoses(userId, limit, offset);
    res.json({ success: true, count: doses.length, data: doses });
  } catch (error) {
    console.error('Error fetching substance doses:', error);
    res.status(500).json({ success: false, error: 'Error al obtener dosis de sustancias' });
  }
};

export const createDose = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { substance_name, quantity, unit, dose_time, craving_intensity, feelings, context_notes } = req.body;
    
    if (!substance_name) {
      res.status(400).json({ success: false, error: 'Substance name is required' });
      return;
    }

    const dose = await doseModel.createSubstanceDose(userId, {
      substance_name,
      quantity,
      unit,
      dose_time: dose_time ? new Date(dose_time) : new Date(),
      craving_intensity,
      feelings,
      context_notes
    });

    // Sincronizar con Neo4j para el Grafo de Memoria
    try {
      const query = `
        MATCH (u:Usuario {id: $userId})
        CREATE (d:DosisSustancia {
          id: $id,
          substance: $substance,
          quantity: $quantity,
          unit: $unit,
          timestamp: datetime($timestamp),
          intensity: $intensity,
          feelings: $feelings
        })
        CREATE (u)-[:REGISTRA_DOSIS]->(d)
        WITH u, d
        MERGE (s:Sustancia {nombre: $substance})
        MERGE (d)-[:DE_SUSTANCIA]->(s)
        RETURN d
      `;
      await neo4jService.executeWrite(query, {
        userId,
        id: dose.id,
        substance: dose.substance_name,
        quantity: dose.quantity,
        unit: dose.unit,
        timestamp: dose.dose_time.toISOString(),
        intensity: dose.craving_intensity || 0,
        feelings: dose.feelings || ''
      });
      console.log(`[NEO4J] Dosis registrada en el grafo: ${dose.substance_name}`);
    } catch (err) {
      console.error('⚠️ [NEO4J] Error al sincronizar dosis:', err);
    }

    res.status(201).json({ success: true, data: dose });
  } catch (error) {
    console.error('Error creating substance dose:', error);
    res.status(500).json({ success: false, error: 'Error al registrar dosis' });
  }
};

export const deleteDose = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    
    const success = await doseModel.deleteSubstanceDose(id, userId);
    
    if (!success) {
      res.status(404).json({ success: false, error: 'Dosis no encontrada' });
      return;
    }

    // Opcional: Eliminar de Neo4j también
    try {
      await neo4jService.executeWrite('MATCH (d:DosisSustancia {id: $id}) DETACH DELETE d', { id });
    } catch (err) {
      console.error('⚠️ [NEO4J] Error al eliminar dosis del grafo:', err);
    }
    
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting substance dose:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar dosis' });
  }
};
