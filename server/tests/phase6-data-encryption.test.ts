import { initDatabase, closePool, query } from '../src/config/database.js';
import * as UserModel from '../src/models/user.model.js';
import * as noteModel from '../src/models/note.model.js';
import * as profileModel from '../src/models/profile.model.js';

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
  const user = await UserModel.create({ email: `p6-${suffix}@test.local`, password: 'x', name: 'P6', role: 'patient' });

  // llm_api_key encrypted at rest
  await UserModel.update(user.id, { llm_api_key: 'sk-secret-123' });
  const rawUser = await query<{ llm_api_key: string }>('SELECT llm_api_key FROM users WHERE id=$1', [user.id]);
  check('llm_api_key no se guarda en claro', rawUser.rows[0].llm_api_key !== 'sk-secret-123');
  const readUser = await UserModel.findById(user.id);
  check('llm_api_key se descifra al leer', readUser?.llm_api_key === 'sk-secret-123');

  // note encrypted at rest
  const note = await noteModel.createNote(user.id, { content: 'nota secreta', title: 'titulo' });
  const rawNote = await query<{ content: string; title: string }>('SELECT content, title FROM agent_notes WHERE id=$1', [note.id]);
  check('note content no se guarda en claro', rawNote.rows[0].content !== 'nota secreta');
  const readNote = await noteModel.getNoteById(note.id, user.id);
  check('note content se descifra al leer', readNote?.content === 'nota secreta');

  // profile encrypted at rest
  const profile = await profileModel.createProfile(user.id, { bio: 'bio secreta', primary_substance: 'alcohol' });
  const rawProfile = await query<{ bio: string; primary_substance: string }>('SELECT bio, primary_substance FROM profiles WHERE id=$1', [profile!.id]);
  check('profile bio no se guarda en claro', rawProfile.rows[0].bio !== 'bio secreta');
  const readProfile = await profileModel.getProfileById(profile!.id);
  check('profile bio se descifra al leer', readProfile?.bio === 'bio secreta');

  console.log('\n── RESUMEN ──');
  console.log(results.join('\n'));
  console.log(`\nResultado: ${passed} en verde, ${failed} en rojo`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main()
  .catch((err) => { console.error('Error fatal:', err); process.exitCode = 1; })
  .finally(async () => { try { await closePool(); } catch {} });
