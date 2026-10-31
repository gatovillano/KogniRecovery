/**
 * Seed de desarrollo del panel de terapeutas.
 *
 * Crea un centro, un administrador, un terapeuta, un responsable
 * clínico y un paciente con check-ins y consentimiento granular.
 *
 * Idempotente: se puede ejecutar varias veces.
 *
 * Uso:
 *   npm run db:seed:panel
 *   PANEL_SEED_PASSWORD='OtraClave1!' npm run db:seed:panel
 */

import bcrypt from 'bcryptjs';
import { initDatabase, query, closePool } from '../config/database.js';
import * as OrganizationModel from '../models/organization.model.js';
import * as CareModel from '../models/care.model.js';
import * as SharingConsentService from '../services/sharingConsent.service.js';

const PASSWORD = process.env.PANEL_SEED_PASSWORD ?? 'DemoPanel2026!';

interface SeedUser {
  id: string;
  email: string;
}

const upsertUser = async (input: {
  email: string;
  name: string;
  role: 'patient' | 'professional' | 'admin';
}): Promise<SeedUser> => {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const result = await query<SeedUser>(
    `INSERT INTO users
       (email, password, password_hash, name, role, status, is_active, email_verified)
     VALUES ($1, $2, $2, $3, $4, 'active', TRUE, TRUE)
     ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password,
           password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           status = 'active',
           is_active = TRUE,
           updated_at = NOW()
     RETURNING id, email`,
    [input.email.toLowerCase(), passwordHash, input.name, input.role]
  );

  return result.rows[0]!;
};

const findOrCreateOrganization = async (
  name: string,
  _createdBy: string
): Promise<{ id: string; name: string }> => {
  const existing = await query<{ id: string; name: string }>(
    `SELECT id, name FROM organizations WHERE name = $1 LIMIT 1`,
    [name]
  );
  if (existing.rows[0]) return existing.rows[0];

  const created = await OrganizationModel.create({
    name,
    legal_name: `${name} SpA`,
    country: 'CL',
    timezone: 'America/Santiago',
  });

  return { id: created.id, name: created.name };
};

const seedCheckIns = async (patientId: string): Promise<void> => {
  await query(`DELETE FROM checkins WHERE user_id = $1`, [patientId]);

  const rows = [
    { daysAgo: 0, mood: 7, anxiety: 4, energy: 6, sleep: 7.5, exercise: 30, notes: 'Día estable. Caminata y reunión de apoyo.' },
    { daysAgo: 1, mood: 6, anxiety: 5, energy: 5, sleep: 6.5, exercise: 0, notes: 'Tuve un antojo leve después del trabajo; usé respiración.' },
    { daysAgo: 2, mood: 4, anxiety: 8, energy: 3, sleep: 5.0, exercise: 0, notes: 'Noche difícil. Discusión familiar y ansiedad alta.' },
    { daysAgo: 4, mood: 8, anxiety: 3, energy: 7, sleep: 8.0, exercise: 45, notes: 'Buen ánimo, fui al gimnasio y dormí bien.' },
    { daysAgo: 6, mood: 5, anxiety: 6, energy: 4, sleep: 6.0, exercise: 20, notes: 'Fin de semana con más riesgo social.' },
    { daysAgo: 8, mood: 7, anxiety: 4, energy: 6, sleep: 7.0, exercise: 30, notes: 'Retomé la rutina de medicación.' },
  ];

  for (const row of rows) {
    await query(
      `INSERT INTO checkins
         (user_id, checkin_type, mood_score, anxiety_score, energy_score,
          emotional_tags, sleep_hours, exercised_today, exercise_minutes,
          exercise_type, social_interaction, notes, risk_situation,
          checkin_date, checkin_time, completed_at, is_completed)
       VALUES ($1, 'diario', $2, $3, $4, $5, $6, $7, $8,
               $9, $10, $11, $12, CURRENT_DATE - ($13::int * INTERVAL '1 day'),
               '09:30', NOW() - ($13::int * INTERVAL '1 day'), TRUE)`,
      [
        patientId,
        row.mood,
        row.anxiety,
        row.energy,
        row.anxiety >= 7 ? ['ansioso', 'agotado'] : ['tranquilo', 'motivado'],
        row.sleep,
        row.exercise > 0,
        row.exercise,
        row.exercise > 0 ? 'caminata' : null,
        'familia',
        row.notes,
        row.anxiety >= 7,
        row.daysAgo,
      ]
    );
  }
};

const seedClinicalFacts = async (patientId: string): Promise<void> => {
  // Cravings
  await query(`DELETE FROM cravings WHERE user_id = $1`, [patientId]);
  await query(
    `INSERT INTO cravings
       (user_id, substance_name, intensity, status, triggers, coping_strategies,
        outcome, duration_minutes, consequences, craving_start_time, craving_end_time, notes)
     VALUES
       ($1, 'Alcohol', 6, 'resistido', '["estrés laboral"]'::jsonb,
        '["respiración", "llamar a terapeuta"]'::jsonb,
        'superado', 45, 'Ansiedad alta, logré no consumir.',
        NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes',
        'Desencadenante: discusión en el trabajo.'),
       ($1, 'Alcohol', 8, 'cedido', '["reunión social"]'::jsonb,
        '[]'::jsonb, 'consumido', 120, 'Consumo en contexto social.',
        NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '2 hours',
        'Situación de riesgo: celebración familiar.')`,
    [patientId]
  );

  // Consumo
  await query(`DELETE FROM consumption_events WHERE user_id = $1`, [patientId]);
  await query(`DELETE FROM substance_doses WHERE user_id = $1`, [patientId]);
  await query(
    `INSERT INTO consumption_events
       (user_id, substance_name, quantity, unit, consumed_at, craving_intensity, context_notes)
     VALUES ($1, 'Alcohol', 2, 'copas', NOW() - INTERVAL '7 days', 8,
             'Dos copas de vino en reunión familiar.'),
            ($1, 'Alcohol', 1, 'cerveza', NOW() - INTERVAL '21 days', 5,
             'Una cerveza social, sin recaída posterior.')`,
    [patientId]
  );
  await query(
    `INSERT INTO substance_doses
       (user_id, substance_name, quantity, unit, dose_time, craving_intensity, feelings, context_notes)
     VALUES ($1, 'Alcohol', 1, 'copa', NOW() - INTERVAL '14 days', 6,
             'Culpa y vergüenza', 'Contexto: evento de trabajo.')`,
    [patientId]
  );

  // Medicamentos
  await query(`DELETE FROM medication_logs WHERE user_id = $1`, [patientId]);
  await query(`DELETE FROM medications WHERE user_id = $1`, [patientId]);
  const medResult = await query<{ id: string }>(
    `INSERT INTO medications (user_id, name, dosage, schedule_time, is_active)
     VALUES ($1, 'Naltrexona', '50 mg', '09:00', TRUE)
     RETURNING id`,
    [patientId]
  );
  const medId = medResult.rows[0]!.id;
  await query(
    `INSERT INTO medication_logs (medication_id, user_id, taken_at, taken_date, status)
     VALUES ($1, $2, NOW() - INTERVAL '1 day', CURRENT_DATE - 1, 'tomado'),
            ($1, $2, NOW() - INTERVAL '2 days', CURRENT_DATE - 2, 'tomado')`,
    [medId, patientId]
  );

  // Bitácora
  await query(`DELETE FROM daily_notes WHERE user_id = $1`, [patientId]);
  await query(`DELETE FROM habit_entries WHERE user_id = $1`, [patientId]);
  await query(`DELETE FROM social_entries WHERE user_id = $1`, [patientId]);
  await query(`DELETE FROM consumption_analysis WHERE user_id = $1`, [patientId]);
  await query(
    `INSERT INTO daily_notes (user_id, content, note_date) VALUES
       ($1, 'Hoy pude dormir bien y salí a caminar. Sensación de control.', CURRENT_DATE - 1),
       ($1, 'Estoy motivada con el proceso. La medicación ayuda.', CURRENT_DATE - 3)`,
    [patientId]
  );
  await query(
    `INSERT INTO habit_entries (user_id, protective_habits, risk_habits, entry_date) VALUES
       ($1, 'Ejercicio y rutina de sueño', 'Evitar reuniones con alcohol', CURRENT_DATE - 2)`,
    [patientId]
  );
  await query(
    `INSERT INTO social_entries (user_id, people_description, impact_assessment, entry_date) VALUES
       ($1, 'Mi familia apoya el tratamiento', 'El entorno facilita la recuperación', CURRENT_DATE - 4)`,
    [patientId]
  );
  await query(
    `INSERT INTO consumption_analysis (user_id, trigger_situation, action_taken, lesson_learned, entry_date) VALUES
       ($1, 'Celebración familiar con alcohol', 'Limité el consumo y me retiré temprano',
        'Puedo poner límites sin aislarme', CURRENT_DATE - 6)`,
    [patientId]
  );

  // Chatbot (conversaciones de ejemplo)
  await query(`DELETE FROM conversations WHERE user_id = $1`, [patientId]);
  await query(
    `INSERT INTO conversations
       (user_id, title, scenario_type, status, message_count, duration_minutes,
        started_at, last_message_at, user_satisfaction, contains_crisk,
        escalated_to_emergency)
     VALUES
       ($1, 'Manejo de antojo', 'craving', 'completed', 12, 15,
        NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes',
        4, FALSE, FALSE),
       ($1, 'Estrategias para dormir', 'sleep', 'completed', 8, 10,
        NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '10 minutes',
        3, FALSE, FALSE)`,
    [patientId]
  );
};

const seed = async (): Promise<void> => {
  await initDatabase();

  console.log('🌱 Creando usuarios de demostración...');
  const platformAdmin = await upsertUser({
    email: 'plataforma@kognirecovery.demo',
    name: 'Administración Plataforma',
    role: 'admin',
  });
  const orgAdmin = await upsertUser({
    email: 'centro@kognirecovery.demo',
    name: 'Dirección Centro Demo',
    role: 'professional',
  });
  const clinicalLead = await upsertUser({
    email: 'clinica@kognirecovery.demo',
    name: 'Dra. Carolina Rivas',
    role: 'professional',
  });
  const therapist = await upsertUser({
    email: 'terapeuta@kognirecovery.demo',
    name: 'Lic. Ana Soto',
    role: 'professional',
  });
  const patient = await upsertUser({
    email: 'paciente@kognirecovery.demo',
    name: 'María P.',
    role: 'patient',
  });

  console.log('🏥 Creando organización...');
  const organization = await findOrCreateOrganization(
    'Centro Demo KogniRecovery',
    platformAdmin.id
  );

  await OrganizationModel.addMember({
    organizationId: organization.id,
    userId: orgAdmin.id,
    role: 'org_admin',
    invitedBy: platformAdmin.id,
    status: 'active',
  });
  await OrganizationModel.addMember({
    organizationId: organization.id,
    userId: clinicalLead.id,
    role: 'clinical_lead',
    invitedBy: orgAdmin.id,
    status: 'active',
  });
  await OrganizationModel.addMember({
    organizationId: organization.id,
    userId: therapist.id,
    role: 'therapist',
    invitedBy: orgAdmin.id,
    status: 'active',
  });

  console.log('🎓 Verificando credenciales profesionales...');
  for (const member of [
    { userId: clinicalLead.id, license: 'LIC-CL-1001', specialty: 'Psicología clínica' },
    { userId: therapist.id, license: 'LIC-CL-1002', specialty: 'Terapia de adicciones' },
  ]) {
    await query(
      `INSERT INTO professional_credentials
         (organization_id, user_id, license_number, license_country, specialty,
          verification_status, verified_by, verified_at)
       VALUES ($1, $2, $3, 'CL', $4, 'verified', $5, NOW())
       ON CONFLICT (organization_id, user_id, license_number)
       DO UPDATE SET verification_status = 'verified', verified_by = EXCLUDED.verified_by,
                     verified_at = NOW(), updated_at = NOW()`,
      [organization.id, member.userId, member.license, member.specialty, orgAdmin.id]
    );
  }

  console.log('🔗 Vinculando paciente y asignando terapeuta...');
  const link = await CareModel.linkPatient({
    organizationId: organization.id,
    patientId: patient.id,
    status: 'active',
    createdBy: orgAdmin.id,
  });

  await CareModel.assign({
    organizationPatientId: link.id,
    professionalId: therapist.id,
    role: 'primary',
    assignedBy: orgAdmin.id,
  });

  console.log('📝 Creando check-ins...');
  await seedCheckIns(patient.id);
  await seedClinicalFacts(patient.id);

  console.log('🛡️  Otorgando consentimiento granular...');
  const meta = { actorId: patient.id };

  await SharingConsentService.grantConsent(
    patient.id,
    {
      organization_id: organization.id,
      grantee_type: 'professional',
      grantee_id: therapist.id,
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
    meta
  );

  await SharingConsentService.grantConsent(
    patient.id,
    {
      organization_id: organization.id,
      grantee_type: 'organization',
      grantee_id: organization.id,
      purpose: 'safety',
      history_days: 30,
      categories: [
        { category: 'risk_alerts', detail_level: 'summary', enabled: true },
      ],
    },
    meta
  );

  console.log('\n✅ Seed del panel completado.\n');
  console.log('Credenciales de desarrollo (todas usan la misma contraseña):');
  console.log(`  Contraseña: ${PASSWORD}`);
  console.log(`  Plataforma: ${platformAdmin.email}`);
  console.log(`  Centro:     ${orgAdmin.email}`);
  console.log(`  Clínica:    ${clinicalLead.email}`);
  console.log(`  Terapeuta:  ${therapist.email}`);
  console.log(`  Paciente:   ${patient.email}`);
  console.log(`\nOrganización: ${organization.name}`);
  console.log(`  id: ${organization.id}`);
  console.log(`Paciente id: ${patient.id}`);
  console.log(`Terapeuta id: ${therapist.id}`);
  console.log('\nUsa el header X-Organization-Id con el id de la organización.\n');
};

seed()
  .catch((error) => {
    console.error('❌ Seed fallido:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closePool();
    } catch {
      // El pool puede no haberse inicializado.
    }
  });
