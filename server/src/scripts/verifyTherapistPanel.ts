/**
 * Verificación end-to-end del vertical slice del panel.
 *
 * Requiere:
 *   - migraciones aplicadas (npm run db:migrate:panel)
 *   - seed ejecutado (npm run db:seed:panel)
 *
 * Levanta la app Express en un puerto efímero y prueba, con JWT reales:
 *   - lista de pacientes del terapeuta
 *   - lectura de check-ins con y sin notas
 *   - resumen del paciente
 *   - consentimiento y auditoría visibles para el paciente
 *   - revocación inmediata y re-otorgamiento
 *   - aislamiento entre organizaciones
 */

import type { Server } from 'node:http';
import { initDatabase, query, closePool } from '../config/database.js';
import { createApp } from '../app.js';
import { generateAccessToken } from '../middleware/auth.js';

interface SeedIds {
  organizationId: string;
  patientId: string;
  therapistId: string;
  patientEmail: string;
  therapistEmail: string;
  patientRole: string;
  therapistRole: string;
}

let checks = 0;

const assert = (condition: unknown, message: string): void => {
  checks += 1;
  if (!condition) {
    throw new Error(`❌ Verificación fallida: ${message}`);
  }
  console.log(`✅ ${message}`);
};

const request = async (
  baseUrl: string,
  path: string,
  options: {
    token: string;
    organizationId?: string;
    method?: string;
    body?: unknown;
  }
): Promise<{ status: number; json: any }> => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.token}`,
    'Content-Type': 'application/json',
  };
  if (options.organizationId) {
    headers['X-Organization-Id'] = options.organizationId;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const json = await response.json().catch(() => null);
  return { status: response.status, json };
};

const loadSeed = async (): Promise<SeedIds> => {
  const result = await query<{
    organization_id: string;
    patient_id: string;
    therapist_id: string;
    patient_email: string;
    therapist_email: string;
    patient_role: string;
    therapist_role: string;
  }>(
    `SELECT o.id AS organization_id,
            p.id AS patient_id,
            t.id AS therapist_id,
            p.email AS patient_email,
            t.email AS therapist_email,
            p.role AS patient_role,
            t.role AS therapist_role
     FROM organizations o
     JOIN organization_patients op ON op.organization_id = o.id
     JOIN users p ON p.id = op.patient_id
     JOIN care_assignments ca ON ca.organization_patient_id = op.id
       AND ca.status = 'active'
     JOIN users t ON t.id = ca.professional_id
     WHERE o.name = 'Centro Demo KogniRecovery'
       AND p.email = 'paciente@kognirecovery.demo'
       AND t.email = 'terapeuta@kognirecovery.demo'
     LIMIT 1`
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error(
      'No se encontraron datos del seed. Ejecuta primero: npm run db:seed:panel'
    );
  }

  return {
    organizationId: row.organization_id,
    patientId: row.patient_id,
    therapistId: row.therapist_id,
    patientEmail: row.patient_email,
    therapistEmail: row.therapist_email,
    patientRole: row.patient_role,
    therapistRole: row.therapist_role,
  };
};

const listen = (app: ReturnType<typeof createApp>): Promise<{ server: Server; baseUrl: string }> =>
  new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('No se pudo obtener el puerto efímero'));
        return;
      }
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
    server.on('error', reject);
  });

const closeServer = (server: Server): Promise<void> =>
  new Promise((resolve) => server.close(() => resolve()));

const verify = async (): Promise<void> => {
  await initDatabase();
  const seed = await loadSeed();

  const therapistToken = generateAccessToken(
    seed.therapistId,
    seed.therapistEmail,
    seed.therapistRole
  );
  const patientToken = generateAccessToken(
    seed.patientId,
    seed.patientEmail,
    seed.patientRole
  );

  const app = createApp();
  const { server, baseUrl } = await listen(app);

  try {
    // 1. Lista de pacientes
    const list = await request(baseUrl, '/api/v1/therapist/patients', {
      token: therapistToken,
      organizationId: seed.organizationId,
    });
    assert(list.status === 200, 'GET /therapist/patients responde 200');
    assert(
      Array.isArray(list.json?.data?.patients) &&
        list.json.data.patients.some((p: any) => p.id === seed.patientId),
      'El paciente asignado aparece en la lista'
    );

    // 2. Check-ins con notas consentidas
    const checkins = await request(
      baseUrl,
      `/api/v1/therapist/patients/${seed.patientId}/checkins`,
      { token: therapistToken, organizationId: seed.organizationId }
    );
    assert(checkins.status === 200, 'GET checkins responde 200 con consentimiento');
    assert(
      Array.isArray(checkins.json?.data?.items) &&
        checkins.json.data.items.length > 0,
      'Los check-ins consentidos se devuelven'
    );
    assert(
      typeof checkins.json.data.items[0].mood_score === 'number',
      'Los campos estructurados están presentes'
    );
    assert(
      typeof checkins.json.data.items[0].notes === 'string',
      'Las notas se incluyen solo con checkins_notes'
    );

    // 3. Resumen del paciente
    const overview = await request(
      baseUrl,
      `/api/v1/therapist/patients/${seed.patientId}/overview`,
      { token: therapistToken, organizationId: seed.organizationId }
    );
    assert(overview.status === 200, 'GET overview responde 200');
    assert(
      overview.json?.data?.patient?.id === seed.patientId,
      'El overview identifica al paciente correcto'
    );
    assert(
      overview.json?.data?.consent?.sharedCategories?.checkins_summary ===
        'summary',
      'El overview expone el nivel de detalle consentido'
    );

    // 3b. Lecturas clínicas adicionales consentidas
    const cravingRead = await request(
      baseUrl,
      `/api/v1/therapist/patients/${seed.patientId}/cravings`,
      { token: therapistToken, organizationId: seed.organizationId }
    );
    assert(cravingRead.status === 200, 'GET cravings responde 200 con consentimiento');
    assert(
      Array.isArray(cravingRead.json?.data?.items) &&
        cravingRead.json.data.items.length > 0,
      'Los cravings consentidos se devuelven'
    );
    assert(
      typeof cravingRead.json.data.items[0].intensity === 'number',
      'Los cravings incluyen campos estructurados'
    );
    assert(
      typeof cravingRead.json.data.items[0].notes === 'string',
      'Las notas de cravings se incluyen solo con cravings_notes'
    );

    for (const [path, label] of [
      ['consumption', 'consumo'],
      ['medications', 'medicamentos'],
      ['journal', 'bitácora'],
      ['chatbot-summary', 'resumen chatbot'],
    ] as const) {
      const read = await request(
        baseUrl,
        `/api/v1/therapist/patients/${seed.patientId}/${path}`,
        { token: therapistToken, organizationId: seed.organizationId }
      );
      assert(read.status === 200, `GET ${path} responde 200 (${label})`);
      assert(
        Array.isArray(read.json?.data?.items),
        `GET ${path} devuelve items`
      );
    }

    // 3c. Alertas de riesgo (protocolo de seguridad)
    const alertsRead = await request(
      baseUrl,
      `/api/v1/therapist/patients/${seed.patientId}/alerts`,
      { token: therapistToken, organizationId: seed.organizationId }
    );
    assert(alertsRead.status === 200, 'GET alerts responde 200 con consentimiento safety');
    assert(
      alertsRead.json?.data?.consent?.detail_level === 'summary',
      'Las alertas se sirven con nivel summary'
    );

    const openAlert = (alertsRead.json?.data?.items ?? []).find(
      (a: any) => a.status === 'open' || a.status === 'acknowledged'
    );
    if (openAlert) {
      const acknowledged = await request(
        baseUrl,
        `/api/v1/therapist/alerts/${openAlert.id}/acknowledge`,
        { token: therapistToken, organizationId: seed.organizationId, method: 'POST' }
      );
      assert(acknowledged.status === 200, 'Acknowledge de alerta responde 200');
      assert(
        acknowledged.json?.data?.status === 'acknowledged',
        'La alerta queda en estado acknowledged'
      );
    }

    // 3d. Notas del terapeuta (cifradas)
    const noteCreate = await request(
      baseUrl,
      `/api/v1/therapist/patients/${seed.patientId}/notes`,
      {
        token: therapistToken,
        organizationId: seed.organizationId,
        method: 'POST',
        body: { content: 'Nota de verificación automatizada.', visibility: 'care_team' },
      }
    );
    assert(noteCreate.status === 201, 'Crear nota responde 201');
    const noteId = noteCreate.json?.data?.id;
    assert(Boolean(noteId), 'La nota creada tiene id');

    const notesList = await request(
      baseUrl,
      `/api/v1/therapist/patients/${seed.patientId}/notes`,
      { token: therapistToken, organizationId: seed.organizationId }
    );
    assert(notesList.status === 200, 'Listar notas responde 200');
    assert(
      (notesList.json?.data?.notes ?? []).some(
        (n: any) => n.id === noteId && n.content === 'Nota de verificación automatizada.'
      ),
      'La nota se desencripta correctamente al listar'
    );

    const noteUpdate = await request(
      baseUrl,
      `/api/v1/therapist/patients/${seed.patientId}/notes/${noteId}`,
      {
        token: therapistToken,
        organizationId: seed.organizationId,
        method: 'PATCH',
        body: { content: 'Nota actualizada.' },
      }
    );
    assert(noteUpdate.status === 200, 'Actualizar nota responde 200');
    assert(
      noteUpdate.json?.data?.content === 'Nota actualizada.',
      'El contenido actualizado se desencripta'
    );

    const noteDelete = await request(
      baseUrl,
      `/api/v1/therapist/patients/${seed.patientId}/notes/${noteId}`,
      {
        token: therapistToken,
        organizationId: seed.organizationId,
        method: 'DELETE',
      }
    );
    assert(noteDelete.status === 200, 'Eliminar nota responde 200');

    // 3e. Invitaciones de paciente
    const newPatientEmail = `verify.invite.${Date.now()}@demo.cl`;
    const newPatient = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name, role, status)
       VALUES ($1, 'x', 'Invitado Verify', 'patient', 'active')
       RETURNING id`,
      [newPatientEmail]
    );
    const newPatientId = newPatient.rows[0]!.id;
    const newPatientToken = generateAccessToken(newPatientId, newPatientEmail, 'patient');

    const adminRow = await query<{ id: string }>(
      `SELECT id FROM users WHERE email = 'centro@kognirecovery.demo'`
    );
    const adminToken = generateAccessToken(
      adminRow.rows[0]!.id,
      'centro@kognirecovery.demo',
      'professional'
    );

    const inviteCreate = await request(baseUrl, '/api/v1/org/patients/invite', {
      token: adminToken,
      organizationId: seed.organizationId,
      method: 'POST',
      body: {
        patient_email: newPatientEmail,
        professional_id: seed.therapistId,
      },
    });
    assert(inviteCreate.status === 201, 'El centro crea la invitación');
    const inviteId = inviteCreate.json?.data?.id;
    assert(Boolean(inviteId), 'La invitación tiene id');
    assert(
      typeof inviteCreate.json?.data?.token === 'string' &&
        inviteCreate.json.data.token.length >= 32,
      'La invitación genera un token seguro'
    );

    const pending = await request(baseUrl, '/api/v1/patient/invitations/pending', {
      token: newPatientToken,
    });
    assert(pending.status === 200, 'El paciente lista invitaciones pendientes');
    assert(
      (pending.json?.data?.invites ?? []).some((i: any) => i.id === inviteId),
      'La invitación aparece como pendiente para el paciente'
    );

    const acceptById = await request(
      baseUrl,
      `/api/v1/patient/invitations/${inviteId}/accept`,
      { token: newPatientToken, method: 'POST' }
    );
    assert(acceptById.status === 200, 'El paciente acepta la invitación');
    assert(acceptById.json?.data?.assigned === true, 'La aceptación asigna al terapeuta');

    const notifRow = await query<{ id: string }>(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND title = 'Nuevo paciente vinculado'
       ORDER BY created_at DESC LIMIT 1`,
      [seed.therapistId]
    );
    assert(Boolean(notifRow.rows[0]), 'La aceptación notifica al terapeuta');

    const listAfterInvite = await request(baseUrl, '/api/v1/therapist/patients', {
      token: therapistToken,
      organizationId: seed.organizationId,
    });
    assert(
      (listAfterInvite.json?.data?.patients ?? []).some(
        (p: any) => p.id === newPatientId
      ),
      'El terapeuta ve al nuevo paciente invitado'
    );

    // Limpiar paciente de prueba (cascade borra vínculo/asignación).
    await query(`DELETE FROM users WHERE id = $1`, [newPatientId]);

    // 3f. Invitación a terapeuta (alta de personal)
    const newProfEmail = `verify.prof.${Date.now()}@demo.cl`;
    const newProf = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name, role, status)
       VALUES ($1, 'x', 'Profesional Verify', 'professional', 'active')
       RETURNING id`,
      [newProfEmail]
    );
    const newProfId = newProf.rows[0]!.id;
    const newProfToken = generateAccessToken(newProfId, newProfEmail, 'professional');

    const profInvite = await request(baseUrl, '/api/v1/org/therapists/invite', {
      token: adminToken,
      organizationId: seed.organizationId,
      method: 'POST',
      body: { email: newProfEmail, role: 'therapist' },
    });
    assert(profInvite.status === 201, 'El admin crea la invitación de terapeuta');
    const profInviteToken = profInvite.json?.data?.token;
    assert(
      typeof profInviteToken === 'string' && profInviteToken.length >= 32,
      'La invitación de terapeuta genera token seguro'
    );

    const profInvites = await request(baseUrl, '/api/v1/org/therapists/invites', {
      token: adminToken,
      organizationId: seed.organizationId,
    });
    assert(profInvites.status === 200, 'El admin lista invitaciones de personal');
    assert(
      (profInvites.json?.data?.invites ?? []).some(
        (i: any) => i.email === newProfEmail && i.role === 'therapist'
      ),
      'La invitación de personal aparece en el listado'
    );

    const profAccept = await request(baseUrl, '/api/v1/therapist/invitations/accept', {
      token: newProfToken,
      method: 'POST',
      body: { token: profInviteToken },
    });
    assert(profAccept.status === 200, 'El profesional acepta la invitación');
    assert(
      profAccept.json?.data?.role === 'therapist',
      'La membresía queda con el rol therapist'
    );

    const membershipRow = await query<{ role: string; status: string }>(
      `SELECT role, status FROM organization_members
       WHERE organization_id = $1 AND user_id = $2`,
      [seed.organizationId, newProfId]
    );
    assert(
      membershipRow.rows[0]?.role === 'therapist' &&
        membershipRow.rows[0]?.status === 'active',
      'La membresía del nuevo terapeuta está activa en la base'
    );

    // El nuevo terapeuta aún no tiene credencial verificada: el acceso
    // clínico debe estar bloqueado.
    const blockedBeforeCredential = await request(
      baseUrl,
      '/api/v1/therapist/patients',
      { token: newProfToken, organizationId: seed.organizationId }
    );
    assert(
      blockedBeforeCredential.status === 403 &&
        blockedBeforeCredential.json?.error?.code === 'CREDENTIAL_REQUIRED',
      'Acceso clínico bloqueado sin credencial verificada'
    );

    // El admin registra y verifica la credencial.
    const credentialCreate = await request(baseUrl, '/api/v1/org/credentials', {
      token: adminToken,
      organizationId: seed.organizationId,
      method: 'POST',
      body: {
        user_id: newProfId,
        license_number: `LIC-VERIFY-${Date.now()}`,
        specialty: 'Prueba',
      },
    });
    assert(credentialCreate.status === 201, 'El admin registra la credencial');
    const credentialId = credentialCreate.json?.data?.id;
    assert(Boolean(credentialId), 'La credencial tiene id');

    const credentialVerify = await request(
      baseUrl,
      `/api/v1/org/credentials/${credentialId}/verify`,
      {
        token: adminToken,
        organizationId: seed.organizationId,
        method: 'POST',
        body: { decision: 'verified' },
      }
    );
    assert(
      credentialVerify.status === 200 &&
        credentialVerify.json?.data?.verification_status === 'verified',
      'El admin verifica la credencial'
    );

    const allowedAfterCredential = await request(
      baseUrl,
      '/api/v1/therapist/patients',
      { token: newProfToken, organizationId: seed.organizationId }
    );
    assert(
      allowedAfterCredential.status === 200,
      'Acceso clínico habilitado con credencial verificada'
    );

    await query(`DELETE FROM users WHERE id = $1`, [newProfId]);
    await query(`DELETE FROM therapist_invites WHERE email = $1`, [newProfEmail]);

    // 3g. Derechos del paciente: exportación y solicitud de borrado
    const dataExport = await request(baseUrl, '/api/v1/patient/data-export', {
      token: patientToken,
    });
    assert(dataExport.status === 200, 'Exportación del paciente responde 200');
    assert(
      Array.isArray(dataExport.json?.data?.clinical?.checkins) &&
        dataExport.json.data.clinical.checkins.length > 0 &&
        Array.isArray(dataExport.json?.data?.consent?.consents),
      'La exportación incluye datos clínicos y consentimientos'
    );

    const deletionCreate = await request(baseUrl, '/api/v1/patient/data-deletion', {
      token: patientToken,
      method: 'POST',
      body: { reason: 'Verificación automatizada' },
    });
    assert(deletionCreate.status === 201, 'Solicitud de borrado responde 201');
    const deletionId = deletionCreate.json?.data?.id;
    assert(Boolean(deletionId), 'La solicitud de borrado tiene id');

    const orgDeletions = await request(baseUrl, '/api/v1/org/data-deletion', {
      token: adminToken,
      organizationId: seed.organizationId,
    });
    assert(orgDeletions.status === 200, 'El centro lista solicitudes de borrado');
    assert(
      (orgDeletions.json?.data?.requests ?? []).some((r: any) => r.id === deletionId),
      'La solicitud aparece para el centro'
    );

    const deletionReview = await request(
      baseUrl,
      `/api/v1/org/data-deletion/${deletionId}/review`,
      {
        token: adminToken,
        organizationId: seed.organizationId,
        method: 'POST',
        body: { decision: 'in_progress' },
      }
    );
    assert(deletionReview.status === 200, 'El centro puede revisar la solicitud');
    assert(
      deletionReview.json?.data?.status === 'in_progress',
      'La solicitud pasa a in_progress'
    );

    await query(`DELETE FROM data_deletion_requests WHERE id = $1`, [deletionId]);

    // 4. Consentimientos visibles para el paciente
    const consents = await request(baseUrl, '/api/v1/patient/sharing-consents', {
      token: patientToken,
    });
    assert(consents.status === 200, 'GET /patient/sharing-consents responde 200');
    const treatmentConsent = (consents.json?.data?.consents ?? []).find(
      (consent: any) =>
        consent.organization_id === seed.organizationId &&
        consent.purpose === 'treatment' &&
        consent.status === 'granted'
    );
    assert(Boolean(treatmentConsent), 'El paciente ve su consentimiento activo');

    // 5. Auditoría visible para el paciente
    const audit = await request(baseUrl, '/api/v1/patient/access-log', {
      token: patientToken,
    });
    assert(audit.status === 200, 'GET /patient/access-log responde 200');
    assert(
      Array.isArray(audit.json?.data?.entries) &&
        audit.json.data.entries.some(
          (entry: any) => entry.resource_type === 'checkins' && entry.success
        ),
      'La lectura del terapeuta quedó auditada'
    );

    // 6. Revocación inmediata
    const revoked = await request(
      baseUrl,
      `/api/v1/patient/sharing-consents/${treatmentConsent.id}`,
      {
        token: patientToken,
        method: 'DELETE',
        body: { reason: 'Verificación automática' },
      }
    );
    assert(revoked.status === 200, 'El paciente puede revocar el consentimiento');

    const afterRevoke = await request(
      baseUrl,
      `/api/v1/therapist/patients/${seed.patientId}/checkins`,
      { token: therapistToken, organizationId: seed.organizationId }
    );
    assert(
      afterRevoke.status === 403 &&
        afterRevoke.json?.error?.code === 'CONSENT_REQUIRED',
      'Tras revocar, el terapeuta recibe CONSENT_REQUIRED'
    );

    const afterRevokeCravings = await request(
      baseUrl,
      `/api/v1/therapist/patients/${seed.patientId}/cravings`,
      { token: therapistToken, organizationId: seed.organizationId }
    );
    assert(
      afterRevokeCravings.status === 403 &&
        afterRevokeCravings.json?.error?.code === 'CONSENT_REQUIRED',
      'La revocación también corta cravings (403 CONSENT_REQUIRED)'
    );

    const deniedAudit = await request(baseUrl, '/api/v1/patient/access-log', {
      token: patientToken,
    });
    assert(
      (deniedAudit.json?.data?.entries ?? []).some(
        (entry: any) => entry.action === 'denied' && entry.success === false
      ),
      'La denegación también quedó auditada'
    );

    // 7. Re-otorgar el consentimiento
    const regrant = await request(baseUrl, '/api/v1/patient/sharing-consents', {
      token: patientToken,
      method: 'POST',
      body: {
        organization_id: seed.organizationId,
        grantee_type: 'professional',
        grantee_id: seed.therapistId,
        purpose: 'treatment',
        history_days: 90,
        categories: [
          { category: 'checkins_summary', detail_level: 'summary', enabled: true },
          { category: 'checkins_notes', detail_level: 'detailed', enabled: true },
          { category: 'cravings_summary', detail_level: 'summary', enabled: true },
          { category: 'cravings_notes', detail_level: 'detailed', enabled: true },
          { category: 'consumption', detail_level: 'detailed', enabled: true },
          { category: 'medications', detail_level: 'detailed', enabled: true },
          { category: 'journal', detail_level: 'detailed', enabled: true },
          { category: 'chatbot_summary', detail_level: 'summary', enabled: true },
        ],
      },
    });
    assert(regrant.status === 201, 'El paciente puede volver a otorgar el consentimiento');

    const afterRegrant = await request(
      baseUrl,
      `/api/v1/therapist/patients/${seed.patientId}/checkins`,
      { token: therapistToken, organizationId: seed.organizationId }
    );
    assert(afterRegrant.status === 200, 'El acceso se restablece tras re-otorgar');

    const afterRegrantCravings = await request(
      baseUrl,
      `/api/v1/therapist/patients/${seed.patientId}/cravings`,
      { token: therapistToken, organizationId: seed.organizationId }
    );
    assert(
      afterRegrantCravings.status === 200,
      'Cravings se restablece tras re-otorgar'
    );

    // 8. Aislamiento entre organizaciones
    const otherOrg = await query<{ id: string }>(
      `INSERT INTO organizations (name) VALUES ($1) RETURNING id`,
      [`Organización temporal ${Date.now()}`]
    );
    const otherOrgId = otherOrg.rows[0]!.id;

    try {
      const crossOrg = await request(baseUrl, '/api/v1/therapist/patients', {
        token: therapistToken,
        organizationId: otherOrgId,
      });
      assert(
        crossOrg.status === 403 &&
          crossOrg.json?.error?.code === 'NOT_A_MEMBER',
        'Un terapeuta no puede entrar a otra organización'
      );
    } finally {
      await query(`DELETE FROM organizations WHERE id = $1`, [otherOrgId]);
    }

    console.log(`\n✅ ${checks} verificaciones aprobadas.\n`);
  } finally {
    await closeServer(server);
  }
};

verify()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closePool();
    } catch {
      // El pool puede no haberse inicializado.
    }
  });
