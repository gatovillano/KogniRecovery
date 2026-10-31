#!/usr/bin/env node
/**
 * SEC-PHASE1: validación de plantillas de entorno para CI.
 *
 * Verifica que los archivos .env.example contengan TODAS las variables
 * obligatorias del servidor y de la infraestructura, y que no incluyan
 * secretos reales (valores largos tipo `openssl rand`).
 *
 * Uso: node scripts/validate-env-examples.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const readKeys = (file) => {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  const keys = new Set();
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=/);
    if (match) keys.add(match[1]);
  }
  return keys;
};

const REQUIRED_SERVER = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'ENCRYPTION_SALT',
  'DATABASE_URL',
  'NEO4J_URI',
  'NEO4J_USER',
  'NEO4J_PASSWORD',
];

const REQUIRED_ROOT = [
  'WEB_SESSION_SECRET',
  'REDIS_PASSWORD',
  'PGADMIN_DEFAULT_EMAIL',
  'PGADMIN_DEFAULT_PASSWORD',
];

let failed = false;

const check = (file, required) => {
  const keys = readKeys(file);
  for (const key of required) {
    if (!keys.has(key)) {
      console.error(`❌ ${file} falta la variable obligatoria: ${key}`);
      failed = true;
    }
  }
};

check('server/.env.example', REQUIRED_SERVER);
check('.env.example', REQUIRED_ROOT);

// Detectar secretos "reales" en las plantillas (valores largos no-placeholder).
// Solo se inspeccionan claves tipo secreto (SECRET/PASSWORD/KEY/TOKEN);
// URLs, URIs y listas (CORS) se ignoran porque pueden ser largas sin ser secretos.
const SECRET_KEY_PATTERN = /(SECRET|PASSWORD|KEY|TOKEN)/i;
const NON_SECRET_PATTERN = /(URL|URI|METHODS|HEADERS|DSN|EMAIL|PHONE)/i;

for (const file of ['server/.env.example', '.env.example']) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2].trim();
    if (!SECRET_KEY_PATTERN.test(key) || NON_SECRET_PATTERN.test(key)) continue;
    // Un valor >= 32 chars que no sea un placeholder tipo "your_..." o
    // "XXX" indica un secreto real filtrado en el repositorio.
    if (value.length >= 32 && !/^(your_|changeme|replace|xxx)/i.test(value)) {
      console.error(`❌ ${file} posible secreto real en ${key} (longitud ${value.length})`);
      failed = true;
    }
  }
}

if (failed) {
  console.error('\n✋ Validación de entornos FALLÓ.');
  process.exit(1);
}
console.log('✅ Plantillas de entorno válidas (variables obligatorias presentes, sin secretos reales).');
