/**
 * Controlador de alertas de riesgo.
 */

import type { NextFunction, Request, Response } from 'express';
import * as AlertsService from '../services/alerts.service.js';
import * as ClinicalAccess from '../services/clinicalAccess.service.js';
import { query } from '../config/database.js';
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

export const getPatientAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole, organizationId, patientId, auditContext } =
      await resolvePatientResource(req);

    const status =
      typeof req.query.status === 'string'
        ? (req.query.status as AlertsService.AlertStatus)
        : null;
    const severity =
      typeof req.query.severity === 'string'
        ? (req.query.severity as AlertsService.AlertSeverity)
        : null;

    const result = await AlertsService.listAlertsForTherapist({
      actorId,
      actorRole,
      organizationId,
      patientId,
      options: {
        status,
        severity,
        limit: parseLimit(req.query.limit, 50, 200),
      },
      context: auditContext,
    });

    res.json({
      success: true,
      data: result,
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

const resolveAlertAction = async (req: Request) => {
  const { actorId, actorRole } = getAuthenticatedActor(req);
  const organizationId = await resolveOrganizationId(req, actorId);
  const alertId = req.params.alertId;
  if (!alertId) {
    throw createError('Alerta no indicada', 400, 'ALERT_ID_REQUIRED');
  }

  const alertResult = await query<{ patient_id: string; organization_id: string }>(
    `SELECT patient_id, organization_id FROM clinical_alerts WHERE id = $1 AND organization_id = $2`,
    [alertId, organizationId]
  );

  const alert = alertResult.rows[0];
  if (!alert) {
    throw createError('Alerta no encontrada', 404, 'ALERT_NOT_FOUND');
  }

  return {
    alertId,
    actorId,
    actorRole,
    organizationId,
    patientId: alert.patient_id,
    context: contextFor(req),
  };
};

export const acknowledgeAlertAction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = await resolveAlertAction(req);
    const alert = await AlertsService.acknowledgeAlert(input);

    res.json({
      success: true,
      data: alert,
      message: 'Alerta reconocida',
      meta: { request_id: input.context.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const escalateAlertAction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = await resolveAlertAction(req);
    const alert = await AlertsService.escalateAlert(input);

    res.json({
      success: true,
      data: alert,
      message: 'Alerta escalada',
      meta: { request_id: input.context.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const closeAlertAction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = await resolveAlertAction(req);
    const outcome = req.body?.outcome === 'false_positive' ? 'false_positive' : 'closed';
    const alert = await AlertsService.closeAlert({ ...input, outcome });

    res.json({
      success: true,
      data: alert,
      message: outcome === 'false_positive' ? 'Alerta marcada como falso positivo' : 'Alerta cerrada',
      meta: { request_id: input.context.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const evaluateOrgAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId, actorRole } = getAuthenticatedActor(req);
    const organizationId = await resolveOrganizationId(req, actorId);
    const auditContext = contextFor(req);

    const days = parseLimit(req.query.days, 3, 30);
    const result = await AlertsService.evaluateOrgCheckins(organizationId, days);

    // La evaluación es una operación de plataforma: auditar a nivel org.
    await query(
      `INSERT INTO clinical_access_log
         (actor_id, actor_role, organization_id, action, resource_type, purpose, success, request_id)
       VALUES ($1, $2, $3, 'export', 'clinical_alerts:evaluate', 'safety', TRUE, $4)`,
      [actorId, actorRole, organizationId, auditContext.requestId]
    );

    res.json({
      success: true,
      data: result,
      message: `Evaluación completada: ${result.created} alerta(s) nueva(s)`,
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getPatientAlerts,
  acknowledgeAlertAction,
  escalateAlertAction,
  closeAlertAction,
  evaluateOrgAlerts,
};
