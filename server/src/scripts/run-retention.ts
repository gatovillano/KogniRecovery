/**
 * Worker de retención de datos (SEC-PHASE2).
 *
 * Ejecuta:
 *  1. Limpieza de memorias expiradas (context_history con TTL).
 *  2. Purga de refresh tokens expirados/usados.
 *  3. Purga de tokens de reset de contraseña.
 *  4. Aplicación de data_retention_policies (auto_delete) para las
 *     tablas clínicas mapeadas.
 *
 * Uso: npm run db:retention  (o: npx tsx src/scripts/run-retention.ts)
 * Recomendado: cron diario (p.ej. systemd timer o crontab).
 */

import { query } from '../config/database.js';
import * as RefreshTokenModel from '../models/refreshToken.model.js';
import * as PasswordResetTokenModel from '../models/passwordResetToken.model.js';
import { memoryService } from '../services/memory.service.js';

const TABLE_MAP: Record<string, { table: string; dateColumn: string }> = {
  messages: { table: 'messages', dateColumn: 'created_at' },
  conversations: { table: 'conversations', dateColumn: 'created_at' },
  llm_logs: { table: 'llm_logs', dateColumn: 'created_at' },
  context_history: { table: 'context_history', dateColumn: 'created_at' },
  checkins: { table: 'checkins', dateColumn: 'created_at' },
  cravings: { table: 'cravings', dateColumn: 'created_at' },
};

const run = async (): Promise<void> => {
  console.log('🧹 Worker de retención iniciado.');

  // 1. Memorias expiradas (TTL por tipo).
  const cleanedMemories = await memoryService.cleanExpiredMemories();
  console.log(`  1. context_history: ${cleanedMemories} filas eliminadas por TTL.`);

  // 2. Refresh tokens.
  const cleanedTokens = await RefreshTokenModel.cleanupExpired();
  console.log(`  2. refresh_tokens: ${cleanedTokens} filas purgadas.`);

  // 3. Tokens de reset.
  const cleanedReset = await PasswordResetTokenModel.deleteExpired();
  console.log(`  3. password_reset_tokens: ${cleanedReset} filas purgadas.`);

  // 4. Políticas de retención.
  const policies = await query<{
    data_type: string;
    retention_days: number;
    auto_delete: boolean;
  }>(`SELECT data_type, retention_days, auto_delete FROM data_retention_policies`);

  let totalByPolicy = 0;
  for (const policy of policies.rows) {
    if (!policy.auto_delete) continue;
    const mapping = TABLE_MAP[policy.data_type];
    if (!mapping) continue;
    try {
      const result = await query(
        `DELETE FROM ${mapping.table}
         WHERE ${mapping.dateColumn} < NOW() - ($1::int * INTERVAL '1 day')`,
        [policy.retention_days]
      );
      const deleted = result.rowCount ?? 0;
      totalByPolicy += deleted;
      if (deleted > 0) {
        console.log(`  4. ${mapping.table}: ${deleted} filas eliminadas (política ${policy.retention_days}d).`);
      }
    } catch (err) {
      console.warn(`  ⚠️  Error aplicando retención a ${mapping.table}:`, err);
    }
  }
  console.log(`  Retención por política: ${totalByPolicy} filas eliminadas.`);

  console.log('✅ Worker de retención finalizado.');
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error en worker de retención:', err);
    process.exit(1);
  });
