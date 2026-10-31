/**
 * Runner de migraciones del panel de terapeutas.
 *
 * Aplica los archivos SQL de `server/migrations` en orden alfabético,
 * dentro de una transacción por archivo y con checksum para detectar
 * migraciones ya aplicadas que hayan cambiado.
 *
 * Uso:
 *   npm run db:migrate:panel
 *   npm run db:migrate:panel -- --dry-run
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { initDatabase, getPool, closePool } from '../config/database.js';

interface MigrationRow {
  version: string;
  checksum: string;
}

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

const checksum = (content: string): string =>
  crypto.createHash('sha256').update(content).digest('hex');

const ensureMigrationsTable = async (): Promise<void> => {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      version TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const listMigrationFiles = async (): Promise<string[]> => {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
};

const run = async (): Promise<void> => {
  const dryRun = process.argv.includes('--dry-run');
  await initDatabase();
  await ensureMigrationsTable();

  const appliedResult = await getPool().query<MigrationRow>(
    `SELECT version, checksum FROM ${MIGRATIONS_TABLE}`
  );
  const applied = new Map(appliedResult.rows.map((row) => [row.version, row.checksum]));

  const files = await listMigrationFiles();
  if (files.length === 0) {
    console.log('ℹ️  No hay migraciones para aplicar.');
    return;
  }

  let pending = 0;

  for (const file of files) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    const sql = await fs.readFile(fullPath, 'utf8');
    const fileChecksum = checksum(sql);
    const previousChecksum = applied.get(file);

    if (previousChecksum) {
      if (previousChecksum !== fileChecksum) {
        throw new Error(
          `La migración ${file} ya fue aplicada y su contenido cambió. ` +
            'Las migraciones aplicadas son inmutables: crea una nueva migración.'
        );
      }
      console.log(`⏭️  ${file} ya aplicada.`);
      continue;
    }

    pending += 1;
    if (dryRun) {
      console.log(`🔎 [dry-run] Aplicaría ${file}`);
      continue;
    }

    const client = await getPool().connect();
    try {
      console.log(`🚀 Aplicando ${file}...`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (version, checksum) VALUES ($1, $2)`,
        [file, fileChecksum]
      );
      await client.query('COMMIT');
      console.log(`✅ ${file} aplicada.`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Error aplicando ${file}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  if (dryRun) {
    console.log(`\n🔎 ${pending} migración(es) pendiente(s).`);
  } else {
    console.log(`\n✅ ${pending} migración(es) aplicada(s).`);
  }
};

run()
  .catch((error) => {
    console.error('❌ Migraciones fallidas:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closePool();
    } catch {
      // El pool puede no haberse inicializado.
    }
  });
