/**
 * FASE 2 — Pruebas IDOR/BOLA (C01..C04)
 *
 * Simula dos usuarios (A y B) contra una base PostgreSQL aislada y una
 * instancia real de la API Express (createApp). Verifica que B no pueda
 * leer/modificar/eliminar recursos de A, ni insertar en sus
 * conversaciones ni consumir TTS de sus mensajes; y que A conserva
 * acceso normal a sus propios recursos.
 *
 * Ejecución (desde server/):
 *   DATABASE_URL=postgresql://test:test@127.0.0.1:55432/kogni_test \
 *   JWT_SECRET=... JWT_REFRESH_SECRET=... ENCRYPTION_KEY=... \
 *   ENCRYPTION_SALT=... NEO4J_URI=bolt://localhost:7687 \
 *   NEO4J_USER=neo4j NEO4J_PASSWORD=test NODE_ENV=test \
 *   npx tsx tests/phase2-idor.test.ts
 */

import { once } from 'node:events';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { initDatabase, closePool } from '../src/config/database.js';

import * as checkinModel from '../src/models/checkin.model.js';
import * as cravingModel from '../src/models/craving.model.js';
import * as conversationModel from '../src/models/conversation.model.js';
import * as messageModel from '../src/models/message.model.js';

let server: http.Server;
let base = '';
let passed = 0;
let failed = 0;

const results: string[] = [];

const check = (name: string, cond: boolean, extra = ''): void => {
  if (cond) {
    passed += 1;
    results.push(`  ✔ ${name}`);
  } else {
    failed += 1;
    results.push(`  ✘ ${name} ${extra}`);
  }
  console.log(results[results.length - 1]!);
};

const requireData = (resp: ApiResp, what: string): any => {
  if (!resp.data || !resp.data.data) {
    throw new Error(
      `Respuesta sin data en ${what}: HTTP ${resp.status} → ${JSON.stringify(resp.data).slice(0, 500)}`
    );
  }
  return resp.data.data;
};

interface ApiResp {
  status: number;
  data: any;
}

const api = async (
  method: string,
  path: string,
  token?: string,
  body?: unknown
): Promise<ApiResp> => {
  const res = await fetch(base + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, data };
};

const expectStatus = (name: string, got: number, want: number): void =>
  check(`${name} → HTTP ${want} (recibido ${got})`, got === want, `— recibido ${got}`);

async function main(): Promise<void> {
  await initDatabase();
  const app = createApp();
  server = http.createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const addr = server.address() as { port: number };
  base = `http://127.0.0.1:${addr.port}`;

  // ── 0. Alta de dos usuarios (roles patient por defecto) ──────────────
  // Emails únicos por ejecución para permitir re-ejecuciones limpias.
  const suffix = Date.now().toString(36);
  const regA = await api('POST', '/api/v1/auth/register', undefined, {
    email: `user-a-${suffix}@test.local`,
    password: 'Passw0rd!',
    name: 'Usuario A',
  });
  const regB = await api('POST', '/api/v1/auth/register', undefined, {
    email: `user-b-${suffix}@test.local`,
    password: 'Passw0rd!',
    name: 'Usuario B',
  });
  expectStatus('Registro A', regA.status, 201);
  expectStatus('Registro B', regB.status, 201);
  if (regA.status !== 201 || regB.status !== 201) {
    throw new Error(`Registro fallido: A=${regA.status} ${JSON.stringify(regA.data)} B=${regB.status} ${JSON.stringify(regB.data)}`);
  }

  const tokenA = regA.data.data.tokens.accessToken as string;
  const tokenB = regB.data.data.tokens.accessToken as string;
  const idA = regA.data.data.user.id as string;
  const idB = regB.data.data.user.id as string;

  // ══════════════════════════════════════════════════════════════════════
  // C01 — CHECK-INS
  // ══════════════════════════════════════════════════════════════════════
  console.log('\nC01 — Check-ins');
  const ciCreate = await api('POST', '/api/v1/checkins', tokenA, {
    checkin_date: '2026-10-01',
    mood_score: 5,
    anxiety_score: 3,
    notes: 'nota privada de A',
  });
  expectStatus('A crea check-in', ciCreate.status, 201);
  const ciId = requireData(ciCreate, 'crear check-in').id as string;

  expectStatus('A lee su check-in', (await api('GET', `/api/v1/checkins/${ciId}`, tokenA)).status, 200);
  expectStatus('B lee check-in de A (debe 404)', (await api('GET', `/api/v1/checkins/${ciId}`, tokenB)).status, 404);
  expectStatus('B modifica check-in de A (debe 404)', (await api('PUT', `/api/v1/checkins/${ciId}`, tokenB, { mood_score: 1 })).status, 404);
  expectStatus('B elimina check-in de A (debe 404)', (await api('DELETE', `/api/v1/checkins/${ciId}`, tokenB)).status, 404);

  const ciUpd = await api('PUT', `/api/v1/checkins/${ciId}`, tokenA, { mood_score: 8 });
  expectStatus('A actualiza su check-in (funcionalidad intacta)', ciUpd.status, 200);
  check('A conserva el valor actualizado', ciUpd.data.data.mood_score === 8);

  // Nivel modelo: contrato SQL
  check('modelo: getCheckInById(A, B) = null', (await checkinModel.getCheckInById(ciId, idB)) === null);
  check('modelo: getCheckInById(A, A) existe', (await checkinModel.getCheckInById(ciId, idA)) !== null);
  check('modelo: updateCheckIn(A, B) = null', (await checkinModel.updateCheckIn(ciId, idB, { mood_score: 1 })) === null);
  check('modelo: deleteCheckIn(A, B) = false', (await checkinModel.deleteCheckIn(ciId, idB)) === false);

  expectStatus('A elimina su check-in (funcionalidad intacta)', (await api('DELETE', `/api/v1/checkins/${ciId}`, tokenA)).status, 200);

  // ══════════════════════════════════════════════════════════════════════
  // C02 — CRAVINGS / STRATEGIES / TRIGGERS
  // ══════════════════════════════════════════════════════════════════════
  console.log('\nC02 — Cravings / Strategies / Triggers');
  const crCreate = await api('POST', '/api/v1/cravings', tokenA, {
    substance_name: 'Alcohol',
    intensity: 7,
    triggers: ['fiesta'],
  });
  expectStatus('A crea craving', crCreate.status, 201);
  const crId = requireData(crCreate, 'crear craving').id as string;

  expectStatus('A lee su craving', (await api('GET', `/api/v1/cravings/${crId}`, tokenA)).status, 200);
  expectStatus('B lee craving de A (debe 404)', (await api('GET', `/api/v1/cravings/${crId}`, tokenB)).status, 404);
  expectStatus('B modifica craving de A (debe 404)', (await api('PUT', `/api/v1/cravings/${crId}`, tokenB, { status: 'surrendered' })).status, 404);
  expectStatus('B resuelve craving de A (debe 404)', (await api('PUT', `/api/v1/cravings/${crId}/resolve`, tokenB, { status: 'managed' })).status, 404);

  // Nivel modelo
  check('modelo: getCravingById(A, B) = null', (await cravingModel.getCravingById(crId, idB)) === null);
  check('modelo: updateCraving(A, B) = null', (await cravingModel.updateCraving(crId, idB, { intensity: 10 })) === null);
  check('modelo: resolveCraving(A, B) = null', (await cravingModel.resolveCraving(crId, idB, 'managed')) === null);

  // Strategies (montadas bajo /cravings/strategies)
  const stCreate = await api('POST', '/api/v1/cravings/strategies', tokenA, {
    name: 'Respiración profunda',
    category: 'calma',
  });
  expectStatus('A crea estrategia', stCreate.status, 201);
  const stId = requireData(stCreate, 'crear estrategia').id as string;

  expectStatus('B modifica estrategia de A (debe 404)', (await api('PUT', `/api/v1/cravings/strategies/${stId}`, tokenB, { name: 'X' })).status, 404);
  expectStatus('B elimina estrategia de A (debe 404)', (await api('DELETE', `/api/v1/cravings/strategies/${stId}`, tokenB)).status, 404);
  expectStatus('B registra uso de estrategia de A (debe 404)', (await api('POST', `/api/v1/cravings/strategies/${stId}/use`, tokenB, { craving_id: crId, was_effective: true })).status, 404);
  expectStatus('A actualiza su estrategia', (await api('PUT', `/api/v1/cravings/strategies/${stId}`, tokenA, { description: '10 segundos' })).status, 200);

  check('modelo: updateCopingStrategy(A, B) = null', (await cravingModel.updateCopingStrategy(stId, idB, { name: 'X' })) === null);
  check('modelo: deleteCopingStrategy(A, B) = false', (await cravingModel.deleteCopingStrategy(stId, idB)) === false);

  // Triggers (montados bajo /cravings/triggers; sin rutas de update/delete:
  // se valida el contrato del modelo y el aislamiento del listado)
  const tgCreate = await api('POST', '/api/v1/cravings/triggers', tokenA, {
    trigger_type: 'social',
    trigger_description: 'fiesta con amigos',
  });
  expectStatus('A crea trigger', tgCreate.status, 201);
  const tgId = requireData(tgCreate, 'crear trigger').id as string;

  const tgListB = await api('GET', '/api/v1/cravings/triggers', tokenB);
  expectStatus('B lista sus triggers', tgListB.status, 200);
  check('B no ve triggers de A en su listado', Array.isArray(tgListB.data.data) && tgListB.data.data.length === 0);
  expectStatus('A lista sus triggers (contiene el suyo)', (await api('GET', '/api/v1/cravings/triggers', tokenA)).status, 200);

  check('modelo: updateCravingTrigger(A, B) = null', (await cravingModel.updateCravingTrigger(tgId, idB, { frequency: 'diario' })) === null);
  check('modelo: deleteCravingTrigger(A, B) = false', (await cravingModel.deleteCravingTrigger(tgId, idB)) === false);
  check('modelo: updateCravingPattern(A, B) = null', (await cravingModel.updateCravingPattern(tgId, idB, { status: 'archived' })) === null);
  check('modelo: deleteCravingPattern(A, B) = false', (await cravingModel.deleteCravingPattern(tgId, idB)) === false);

  // ══════════════════════════════════════════════════════════════════════
  // C03 — CONVERSACIONES Y MENSAJES
  // ══════════════════════════════════════════════════════════════════════
  console.log('\nC03 — Conversaciones / Mensajes');
  const convCreate = await api('POST', '/api/v1/chatbot/conversations', tokenA, {
    title: 'Conversación de A',
    scenario_type: 'apoyo_emocional',
  });
  expectStatus('A crea conversación', convCreate.status, 201);
  const convId = requireData(convCreate, 'crear conversación').id as string;

  const convA = await api('GET', `/api/v1/chatbot/conversations/${convId}`, tokenA);
  expectStatus('A lee su conversación', convA.status, 200);
  const msgAId = (convA.data.data.messages?.[0]?.id ?? '') as string;
  check('A tiene al menos un mensaje (saludo)', msgAId !== '', '— sin mensajes');

  expectStatus('B lee conversación de A (debe 404)', (await api('GET', `/api/v1/chatbot/conversations/${convId}`, tokenB)).status, 404);
  expectStatus('B cierra conversación de A (debe 404)', (await api('POST', `/api/v1/chatbot/conversations/${convId}/close`, tokenB, { satisfaction: 5 })).status, 404);
  expectStatus('B cambia escenario de A (debe 404)', (await api('POST', `/api/v1/chatbot/conversations/${convId}/scenario`, tokenB, { scenario_type: 'crisis' })).status, 404);
  expectStatus('B inserta mensaje en conversación de A (debe 404)', (await api('POST', `/api/v1/chatbot/conversations/${convId}/messages`, tokenB, { content: 'mensaje intrusivo' })).status, 404);
  expectStatus('B inserta mensaje vía streaming en conversación de A (debe 404)', (await api('POST', `/api/v1/chatbot/conversations/${convId}/stream`, tokenB, { content: 'mensaje intrusivo stream' })).status, 404);

  check('modelo: getConversationById(A, B) = null', (await conversationModel.getConversationById(convId, idB)) === null);
  check('modelo: getConversationById(A, A) existe', (await conversationModel.getConversationById(convId, idA)) !== null);
  check('modelo: getMessageById(msgA, B) = null', (await messageModel.getMessageById(msgAId, idB)) === null);
  check('modelo: getMessageById(msgA, A) existe', (await messageModel.getMessageById(msgAId, idA)) !== null);

  // ══════════════════════════════════════════════════════════════════════
  // C04 — TEXT TO SPEECH
  // ══════════════════════════════════════════════════════════════════════
  console.log('\nC04 — TTS');
  expectStatus('B obtiene TTS de mensaje de A (debe 404)', (await api('GET', `/api/v1/chatbot/messages/${msgAId}/tts`, tokenB)).status, 404);

  const ttsA = await api('GET', `/api/v1/chatbot/messages/${msgAId}/tts`, tokenA);
  check('A conserva acceso normal a TTS de su mensaje (no 404)', ttsA.status !== 404, `— recibido ${ttsA.status}`);

  // ══════════════════════════════════════════════════════════════════════
  // RESUMEN
  // ══════════════════════════════════════════════════════════════════════
  console.log('\n── RESUMEN ──');
  console.log(results.join('\n'));
  console.log(`\nResultado: ${passed} en verde, ${failed} en rojo`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main()
  .catch((err) => {
    console.error('Error fatal en la suite:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      server?.close();
    } catch {
      /* noop */
    }
    try {
      await closePool();
    } catch {
      /* noop */
    }
  });
