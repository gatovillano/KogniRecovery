/**
 * FASE 4 — Seguridad de herramientas de LÚA (NUMA-C06)
 */

import { initDatabase, closePool, query } from '../src/config/database.js';
import * as UserModel from '../src/models/user.model.js';
import * as noteModel from '../src/models/note.model.js';
import { saveNoteTool } from '../src/services/skills/note_skill/scripts/note_tool.js';
import { deleteNoteTool } from '../src/services/skills/note_skill/scripts/note_tool.js';
import { recordCravingTool } from '../src/services/skills/save_relevant_info/scripts/save_craving_tool.js';

let passed = 0;
let failed = 0;
const results: string[] = [];
const check = (name: string, cond: boolean, extra = ''): void => {
  if (cond) { passed += 1; results.push(`  ✔ ${name}`); }
  else { failed += 1; results.push(`  ✘ ${name} ${extra}`); }
  console.log(results[results.length - 1]!);
};

async function main(): Promise<void> {
  await initDatabase();
  const suffix = Date.now().toString(36);
  const userA = await UserModel.create({ email: `p4-a-${suffix}@test.local`, password: 'x', name: 'A', role: 'patient' });
  const userB = await UserModel.create({ email: `p4-b-${suffix}@test.local`, password: 'x', name: 'B', role: 'patient' });

  // 1. Tool sin contexto confiable debe fallar.
  const noCtx = await (saveNoteTool as any).invoke({ title: 'x', content: 'y' });
  check('sin contexto confiable se rechaza', String(noCtx).includes('contexto de usuario'), `→ ${noCtx}`);

  // 2. userId malicioso en args se ignora; se usa el confiable.
  const res = await (saveNoteTool as any).invoke(
    { userId: userB.id, title: 'inyectada', content: 'nota' },
    { configurable: { userId: userA.id } }
  );
  check('tool ejecuta con contexto confiable', String(res).includes('guardada'), `→ ${res}`);
  const rows = await query<{ user_id: string }>('SELECT user_id FROM agent_notes WHERE content=$1', ['nota']);
  check('nota pertenece al usuario confiable', rows.rows[0]?.user_id === userA.id, `→ ${rows.rows[0]?.user_id}`);

  // 3. deleteNote no puede borrar notas de otro usuario aunque el modelo pase su id.
  const noteB = await noteModel.createNote(userB.id, { content: 'nota de B', source: 'user' });
  const del = await (deleteNoteTool as any).invoke(
    { userId: userB.id, noteId: noteB.id },
    { configurable: { userId: userA.id } }
  );
  check('borrado cruzado rechazado', String(del).includes('No se encontro') || String(del).includes('Error'), `→ ${del}`);
  const stillThere = await noteModel.getNoteById(noteB.id, userB.id);
  check('nota de B permanece', stillThere !== null);

  // 4. recordCraving usa usuario confiable.
  const cravingRes = await (recordCravingTool as any).invoke(
    { userId: userB.id, substance_name: 'Alcohol', intensity: 5 },
    { configurable: { userId: userA.id } }
  );
  check('craving registrado', String(cravingRes).includes('registrado'), `→ ${cravingRes}`);
  const cr = await query<{ c: string }>('SELECT count(*)::text AS c FROM cravings WHERE user_id=$1', [userA.id]);
  check('craving pertenece a usuario confiable', parseInt(cr.rows[0].c, 10) > 0);

  console.log('\n── RESUMEN ──');
  console.log(results.join('\n'));
  console.log(`\nResultado: ${passed} en verde, ${failed} en rojo`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main()
  .catch((err) => { console.error('Error fatal:', err); process.exitCode = 1; })
  .finally(async () => { try { await closePool(); } catch {} });
