import { initDatabase, closePool } from '../src/config/database.js';
import { createApp } from '../src/app.js';
import http from 'node:http';
import { once } from 'node:events';

let server: http.Server;
let base = '';
let passed = 0, failed = 0;
const results: string[] = [];
const check = (name: string, cond: boolean, extra = '') => {
  if (cond) { passed++; results.push(`  ✔ ${name}`); } else { failed++; results.push(`  ✘ ${name} ${extra}`); }
  console.log(results[results.length-1]);
};
const api = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  let data: any = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
};

async function main() {
  await initDatabase();
  const app = createApp();
  server = http.createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${(server.address() as any).port}`;
  const suffix = Date.now().toString(36);
  const reg = await api('POST', '/api/v1/auth/register', { email: `p8-${suffix}@test.local`, password: 'Passw0rd!', name: 'P8' });
  const oldRefresh = reg.data.data.tokens.refreshToken;
  const first = await api('POST', '/api/v1/auth/refresh', { refreshToken: oldRefresh });
  check('primer refresh OK', first.status === 200, `→ ${first.status}`);
  const newRefresh = first.data.data.tokens.refreshToken;
  // reuse old token
  const reuse = await api('POST', '/api/v1/auth/refresh', { refreshToken: oldRefresh });
  check('reuso detectado HTTP 401', reuse.status === 401, `→ ${reuse.status}`);
  // new token should be revoked too
  const after = await api('POST', '/api/v1/auth/refresh', { refreshToken: newRefresh });
  check('sesiones revocadas tras reuso', after.status === 401, `→ ${after.status}`);
  console.log(`\nResultado: ${passed} en verde, ${failed} en rojo`);
  process.exitCode = failed > 0 ? 1 : 0;
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{try{server?.close();}catch{};try{await closePool();}catch{};});
