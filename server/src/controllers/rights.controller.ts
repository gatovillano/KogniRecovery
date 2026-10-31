/**
 * Controlador de derechos del paciente (exportación, borrado) y
 * notificaciones de la bandeja.
 */

import type { NextFunction, Request, Response } from 'express';
import * as DataRightsService from '../services/dataRights.service.js';
import * as NotificationsService from '../services/notifications.service.js';
import * as AuditService from '../services/audit.service.js';
import * as ClinicalAccess from '../services/clinicalAccess.service.js';
import * as CareModel from '../models/care.model.js';
import { query } from '../config/database.js';
import { createError } from '../middleware/error.js';
import { getAuthenticatedActor, parseLimit, resolveOrganizationId } from './clinicalContext.js';

const contextFor = (req: Request): ClinicalAccess.AuditContext =>
  ClinicalAccess.buildAuditContext(req);

// =====================================================
// PACIENTE
// =====================================================

export const exportPatientData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const auditContext = contextFor(req);

    const data = await DataRightsService.exportPatientData({
      patientId: actorId,
      context: auditContext,
    });

    // Auditoría de la exportación (derecho del titular).
    await AuditService.logAccess({
      actorId,
      actorRole: 'patient',
      organizationId: '00000000-0000-0000-0000-000000000000',
      patientId: actorId,
      action: 'export',
      resourceType: 'patient_data_export',
      purpose: 'treatment',
      success: true,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      requestId: auditContext.requestId,
    });

    res.json({
      success: true,
      data,
      meta: { request_id: auditContext.requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const createDeletionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const reason =
      typeof (req.body as { reason?: unknown })?.reason === 'string'
        ? ((req.body as { reason: string }).reason)
        : null;

    // Asociar la solicitud a la primera organización activa del paciente.
    const careLinks = await CareModel.listOrganizationsForPatient(actorId);
    const activeOrgId =
      careLinks.find((link) => link.status === 'active')?.organization_id ?? null;

    const deletion = await DataRightsService.createDeletionRequest({
      patientId: actorId,
      organizationId: activeOrgId,
      requestedBy: actorId,
      reason: reason ?? undefined,
    });

    res.status(201).json({
      success: true,
      data: deletion,
      message:
        'Solicitud de borrado registrada. El centro la revisará según la normativa vigente.',
      meta: { request_id: contextFor(req).requestId },
    });
  } catch (error) {
    next(error);
  }
};

export const listMyDeletionRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const requests = await DataRightsService.listPatientDeletionRequests(actorId);
    res.json({ success: true, data: { requests } });
  } catch (error) {
    next(error);
  }
};

export const listNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const notifications = await NotificationsService.listNotificationsForUser(actorId, {
      unreadOnly: req.query.unread === 'true',
      limit: parseLimit(req.query.limit, 50, 200),
    });
    const unread = await NotificationsService.countUnread(actorId);
    res.json({ success: true, data: { notifications, unread } });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actorId } = getAuthenticatedActor(req);
    const notificationId = req.params.id;
    if (!notificationId) {
      throw createError('Notificación no indicada', 400, 'NOTIFICATION_ID_REQUIRED');
    }
    const notification = await NotificationsService.markNotificationRead(notificationId, actorId);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CENTRO (revisión de borrado)
// =====================================================

const requireOrgAdminOrLead = async (
  req: Request
): Promise<{ organizationId: string; actorId: string }> => {
  const { actorId } = getAuthenticatedActor(req);
  const organizationId = await resolveOrganizationId(req, actorId);

  const member = await query<{ role: string }>(
    `SELECT role FROM organization_members
     WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
    [organizationId, actorId]
  );
  const role = member.rows[0]?.role;
  if (!role || !['org_admin', 'clinical_lead'].includes(role)) {
    throw createError('Tu rol no permite revisar solicitudes', 403, 'FORBIDDEN');
  }
  return { organizationId, actorId };
};

export const listOrgDeletionRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = await requireOrgAdminOrLead(req);
    const status =
      typeof req.query.status === 'string'
        ? (req.query.status as DataRightsService.DeletionStatus)
        : null;

    const requests = await DataRightsService.listDeletionRequests(organizationId, {
      status,
      limit: parseLimit(req.query.limit, 50, 200),
    });

    res.json({ success: true, data: { requests } });
  } catch (error) {
    next(error);
  }
};

export const reviewDeletionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId, actorId } = await requireOrgAdminOrLead(req);
    const requestId = req.params.id;
    const decision = req.body?.decision;

    if (!requestId || !['in_progress', 'completed', 'rejected'].includes(decision)) {
      throw createError(
        'id y decision (in_progress/completed/rejected) son obligatorios',
        400,
        'INVALID_PAYLOAD'
      );
    }

    const request = await DataRightsService.reviewDeletionRequest({
      requestId,
      organizationId,
      decision,
      reviewedBy: actorId,
    });

    res.json({
      success: true,
      data: request,
      message: 'Solicitud actualizada',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  exportPatientData,
  createDeletionRequest,
  listMyDeletionRequests,
  listNotifications,
  markNotificationRead,
  listOrgDeletionRequests,
  reviewDeletionRequest,
};
