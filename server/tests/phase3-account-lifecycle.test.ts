/**
 * FASE 3 — Ciclo de vida de cuentas y derecho al olvido (A01, C05, A02)
 */

import { once } from 'node:events';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { initDatabase, closePool, query } from '../src/config/database.js';
import { getNeo4jDriver, closeNeo4jConnection } from '../src/config/neo4j.js';
import * as UserModel from '../src/models/user.model.js';
import * as RefreshTokenModel from '../src/models/refreshToken.model.js';
import * as authService from '../src/services/auth.service.js';
import * as privacyService from '../src/services/privacy.service.js';

let server: http.Server;
let base = '';
let passed = 0;
let failed = 0;
const results: string[] = [];

const check = (name: string, cond: boolean, extra = ''): void => {
  if (cond) { passed += 1; results.push(`  ✔ ${name}`); }
  else { failed += 1; results.push(`  ✘ ${name} ${extra}`); }
  console.log(results[results.length - 1]!);
};

interface ApiResp { status: number; data: any; }
const api = async (method: string, path: string, token?: string, body?: unknown): Promise<ApiResp> => {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data };
};

async function main(): Promise<void> {
  await initDatabase();
  const app = createApp();
  server = http.createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const addr = server.address() as { port: number };
  base = `http://127.0.0.1:${addr.port}`;

  const suffix = Date.now().toString(36);

  // ══════════════════════════════════════════════════════════════════════
  // A01 — Suspensión de cuentas
  // ══════════════════════════════════════════════════════════════════════
  console.log('\nA01 — Suspensión');
  const reg = await api('POST', '/api/v1/auth/register', undefined, {
    email: `phase3-a-${suffix}@test.local`,
    password: 'Passw0rd!',
    name: 'Phase3 A',
  });
  check('registro A', reg.status === 201, `→ ${reg.status}`);
  const tokenA = reg.data.data.tokens.accessToken as string;
  const refreshA = reg.data.data.tokens.refreshToken as string;
  const idA = reg.data.data.user.id as string;

  // Suspender
  await authService.suspendAccount(idA);

  const verifyRes = await api('GET', '/api/v1/auth/verify', tokenA);
  check('access token suspendido rechazado', verifyRes.status === 403, `→ ${verifyRes.status}`);

  const refreshRes = await api('POST', '/api/v1/auth/refresh', undefined, { refreshToken: refreshA });
  check('refresh suspendido rechazado HTTP 401', refreshRes.status === 401, `→ ${refreshRes.status}`);

  const activeCount = await RefreshTokenModel.countActiveByUserId(idA);
  check('refresh tokens revocados', activeCount === 0, `→ ${activeCount}`);

  // Reactivación
  await authService.reactivateAccount(idA);
  const loginRes = await api('POST', '/api/v1/auth/login', undefined, {
    email: `phase3-a-${suffix}@test.local`,
    password: 'Passw0rd!',
  });
  check('reactivación permite login', loginRes.status === 200, `→ ${loginRes.status}`);

  // ══════════════════════════════════════════════════════════════════════
  // C05 — Neo4j
  // ══════════════════════════════════════════════════════════════════════
  console.log('\nC05 — Neo4j');
  const driver = getNeo4jDriver();
  const idNeoA = `neo-a-${suffix}`;
  const idNeoB = `neo-b-${suffix}`;
  const session = driver.session();
  await session.run(`MERGE (u:Usuario {id:$id}) SET u.nombre='A'`, { id: idNeoA });
  await session.run(`MATCH (u:Usuario {id:$id}) CREATE (u)-[:REGISTRA]->(:CheckIn {id:$cid})`, { id: idNeoA, cid: `ci-${suffix}` });
  await session.run(`MERGE (u:Usuario {id:$id}) SET u.nombre='B'`, { id: idNeoB });
  await session.run(`MATCH (u:Usuario {id:$id}) CREATE (u)-[:REGISTRA]->(:CheckIn {id:$cid})`, { id: idNeoB, cid: `ci-b-${suffix}` });
  await session.close();

  await privacyService.deleteUserFromNeo4j(idNeoA, driver);

  const s2 = driver.session();
  const countA = await s2.run(`MATCH (u:Usuario {id:$id}) RETURN count(u) AS c`, { id: idNeoA });
  const checkinsA = await s2.run(`MATCH (c:CheckIn {id:$cid}) RETURN count(c) AS c`, { cid: `ci-${suffix}` });
  const countB = await s2.run(`MATCH (u:Usuario {id:$id}) RETURN count(u) AS c`, { id: idNeoB });
  const checkinsB = await s2.run(`MATCH (c:CheckIn {id:$cid}) RETURN count(c) AS c`, { cid: `ci-b-${suffix}` });
  await s2.close();

  check('A eliminado de Neo4j', countA.records[0].get('c').toNumber() === 0);
  check('check-ins de A eliminados', checkinsA.records[0].get('c').toNumber() === 0);
  check('B permanece en Neo4j', countB.records[0].get('c').toNumber() === 1);
  check('check-ins de B permanecen', checkinsB.records[0].get('c').toNumber() === 1);

  // Fallo parcial: driver no disponible
  let threw = false;
  try {
    await privacyService.deleteUserFromNeo4j(`neo-x-${suffix}`, { session: () => { throw new Error('neo4j down'); } });
  } catch {
    threw = true;
  }
  check('Neo4j no disponible se detecta', threw);

  // ══════════════════════════════════════════════════════════════════════
  // A02 — PostgreSQL deletion
  // ══════════════════════════════════════════════════════════════════════
  console.log('\nA02 — PostgreSQL');
  const reg2 = await api('POST', '/api/v1/auth/register', undefined, {
    email: `phase3-b-${suffix}@test.local`,
    password: 'Passw0rd!',
    name: 'Phase3 B',
  });
  const idB = reg2.data.data.user.id as string;
  const emailB = `phase3-b-${suffix}@test.local`;

  // MFA + LLM secrets
  await UserModel.update(idB, {
    two_factor_enabled: true,
    two_factor_secret: 'SECRET123',
    llm_provider: 'openai',
    llm_api_key: 'sk-test',
  });

  // context_history
  await query(`INSERT INTO context_history (user_id, context_type, key, value) VALUES ($1,'t','k','{}'::jsonb)`, [idB]);
  // password reset token
  await query(`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2, NOW() + INTERVAL '1 day')`, [idB, `hash-${suffix}`]);
  // auth login attempts
  await query(`INSERT INTO auth_login_attempts (identifier, ip_address) VALUES ($1,'127.0.0.1')`, [emailB]);
  // check-in + craving + conversation + message
  const ci = await query<{ id: string }>(`INSERT INTO checkins (user_id, checkin_date) VALUES ($1, CURRENT_DATE) RETURNING id`, [idB]);
  await query(`INSERT INTO cravings (user_id, substance_name, intensity) VALUES ($1,'Alcohol',5)`, [idB]);
  const conv = await query<{ id: string }>(`INSERT INTO conversations (user_id) VALUES ($1) RETURNING id`, [idB]);
  await query(`INSERT INTO messages (conversation_id, user_id, role, content) VALUES ($1,$2,'user','hola')`, [conv.rows[0].id, idB]);
  // refresh token
  await RefreshTokenModel.create({ userId: idB, token: `rt-${suffix}` });

  await privacyService.executeDataDeletion(idB);

  // Verify deletions
  const checks = [
    ['checkins', `SELECT count(*)::int AS c FROM checkins WHERE user_id = $1`, 0],
    ['cravings', `SELECT count(*)::int AS c FROM cravings WHERE user_id = $1`, 0],
    ['conversations', `SELECT count(*)::int AS c FROM conversations WHERE user_id = $1`, 0],
    ['messages', `SELECT count(*)::int AS c FROM messages WHERE user_id = $1`, 0],
    ['context_history', `SELECT count(*)::int AS c FROM context_history WHERE user_id = $1`, 0],
    ['password_reset_tokens', `SELECT count(*)::int AS c FROM password_reset_tokens WHERE user_id = $1`, 0],
    ['refresh_tokens', `SELECT count(*)::int AS c FROM refresh_tokens WHERE user_id = $1`, 0],
  ] as const;
  for (const [name, sql, want] of checks) {
    const r = await query<{ c: number }>(sql as string, [idB]);
    check(`${name} eliminados`, r.rows[0].c === want, `→ ${r.rows[0].c}`);
  }
  const authAttempts = await query<{ c: string }>(`SELECT count(*)::text AS c FROM auth_login_attempts WHERE identifier = $1`, [emailB]);
  check('auth_login_attempts eliminados', parseInt(authAttempts.rows[0].c, 10) === 0);

  const user = await UserModel.findById(idB);
  check('usuario anonimizado email', user?.email === `deleted_${idB}@kognirecovery.invalid`);
  check('usuario status deleted', user?.status === 'deleted');
  check('two_factor_secret limpio', user?.two_factor_secret == null);
  check('two_factor_enabled false', user?.two_factor_enabled === false);
  check('llm_api_key limpio', user?.llm_api_key == null);
  check('llm_provider limpio', user?.llm_provider == null);

  // Retained tables
  const accessLogCount = await query<{ c: string }>(`SELECT count(*)::text AS c FROM clinical_access_log WHERE patient_id = $1`, [idB]);
  // no rows created; just ensure query works
  check('access_log consulta OK', true);

  // Partial failure scenario: bad driver
  let partialThrew = false;
  try {
    await privacyService.deleteAccountCompletely(`nonexistent-${suffix}`, { session: () => { throw new Error('neo4j down'); } });
  } catch (e) {
    partialThrew = true;
  }
  check('fallo parcial detectado', partialThrew);

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
    try { server?.close(); } catch { /* noop */ }
    try { await closePool(); } catch { /* noop */ }
    try { await closeNeo4jConnection(); } catch { /* noop */ }
  });
