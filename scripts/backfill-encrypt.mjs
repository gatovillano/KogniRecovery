#!/usr/bin/env node
/**
 * SEC-PHASE1: Backfill idempotente para cifrar en reposo los campos
 * clínicos que quedaron en claro antes de la migración al cifrado.
 *
 * Uso (desde la raíz del repo, con la BD levantada):
 *   npx tsx scripts/backfill-encrypt.mjs
 *
 * Comportamiento:
 *  - Conecta a DATABASE_URL (de .env).
 *  - Para cada (tabla, columna) declara, recorre las filas y cifra con
 *    AES-256-GCM (ENCRYPTION_KEY/ENCRYPTION_SALT) SOLO los valores que
 *    aún no tienen formato de ciphertext (idempotente).
 *  - Las columnas JSONB (context_history.value, conversations.context) se
 *    cifran envolviendo el JSON en una cadena cuyo contenido es el
 *    ciphertext (mismo formato que usa la app).
 *
 * El script NO toca datos ya cifrados y no requiere downtime: la app
 * puede seguir escribiendo mientras corre.
 */

import pg from 'pg';
import { encrypt, tryDecrypt } from '../server/src/utils/encryption.ts';

const { Client } = pg;

// (tabla, columna, esJsonb)
const TABLES = [
  ['messages', 'content', false],
  ['llm_logs', 'response_text', false],
  ['agent_notes', 'title', false],
  ['agent_notes', 'content', false],
  ['checkins', 'notes', false],
  ['checkins', 'risk_description', false],
  ['cravings', 'consequences', false],
  ['cravings', 'notes', false],
  ['craving_triggers', 'context_notes', false],
  ['consumption_events', 'context_notes', false],
  ['substance_doses', 'feelings', false],
  ['substance_doses', 'context_notes', false],
  ['daily_notes', 'content', false],
  ['habit_entries', 'protective_habits', false],
  ['habit_entries', 'risk_habits', false],
  ['social_entries', 'people_description', false],
  ['social_entries', 'impact_assessment', false],
  ['activity_entries', 'activity_name', false],
  ['activity_entries', 'feeling_before', false],
  ['activity_entries', 'feeling_during', false],
  ['activity_entries', 'feeling_after', false],
  ['consumption_analysis', 'trigger_situation', false],
  ['consumption_analysis', 'action_taken', false],
  ['consumption_analysis', 'lesson_learned', false],
  ['clinical_alerts', 'summary', false],
  ['context_history', 'value', true],
  ['conversations', 'context', true],
];

const ALREADY_ENCRYPTED = (value) => value !== tryDecrypt(value);

const main = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('🔌 Conectado a PostgreSQL.');

  let total = 0;

  for (const [table, column, isJsonb] of TABLES) {
    // Verificar que la tabla/columna exista (esquemas desplegados varían)
    const colCheck = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2 LIMIT 1`,
      [table, column]
    );
    if (colCheck.rowCount === 0) {
      console.log(`⏭  ${table}.${column} no existe; omitido.`);
      continue;
    }

    const idCol = (table === 'conversations' || table === 'context_history') ? 'id' : 'id';
    const { rows } = await client.query(`SELECT id, ${column} FROM ${table} WHERE ${column} IS NOT NULL`);
    let updated = 0;

    for (const row of rows) {
      const raw = row[column];
      let plain;
      let newValue;

      if (isJsonb) {
        // JSONB: el driver entrega objeto o string JSON. Trabajamos con el
        // JSON canónico y guardamos JSON.stringify(ciphertext).
        plain = typeof raw === 'string' ? raw : JSON.stringify(raw);
        const inner = tryDecrypt(plain);
        const alreadyEncrypted = inner !== plain;
        if (alreadyEncrypted) continue;
        newValue = JSON.stringify(encrypt(plain));
      } else {
        if (typeof raw !== 'string' || ALREADY_ENCRYPTED(raw)) continue;
        newValue = encrypt(raw);
      }

      await client.query(`UPDATE ${table} SET ${column} = $1 WHERE id = $2`, [newValue, row.id]);
      updated += 1;
    }

    if (updated > 0) {
      console.log(`🔒 ${table}.${column}: ${updated} fila(s) cifrada(s) (de ${rows.length})`);
      total += updated;
    } else {
      console.log(`✓  ${table}.${column}: nada que cifrar (${rows.length} revisadas)`);
    }
  }

  await client.end();
  console.log(`\n✅ Backfill completado. Total de celdas cifradas: ${total}`);
  if (total > 0) {
    console.log('⚠️  Recomendación: tras verificar la app, respaldar la BD y ejecutar una segunda pasada para confirmar 0 celdas pendientes.');
  }
  process.exit(0);
};

main().catch((err) => {
  console.error('❌ Error en backfill:', err);
  process.exit(1);
});
