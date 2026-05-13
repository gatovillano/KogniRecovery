/**
 * Script para reparar memorias corruptas (descompuestas en caracteres)
 * KogniRecovery
 */

import { initDatabase, query, closePool } from '../config/database.js';

async function fixMemories() {
  try {
    console.log('🔄 Iniciando reparación de memorias...');
    await initDatabase();

    // Buscar memorias que tengan la estructura {"0": "...", "1": "..."}
    const result = await query('SELECT id, value FROM context_history');
    let fixedCount = 0;

    for (const row of result.rows) {
      const { id, value } = row;
      
      // Verificar si es un objeto con la clave "0" y "recorded_at"
      if (typeof value === 'object' && value !== null && '0' in value && 'recorded_at' in value) {
        // Verificar si las claves son mayoritariamente numéricas
        const keys = Object.keys(value).filter(k => k !== 'recorded_at');
        const isNumeric = keys.every(k => !isNaN(parseInt(k)));
        
        if (isNumeric && keys.length > 0) {
          // Reconstruir el string
          const sortedKeys = keys.sort((a, b) => parseInt(a) - parseInt(b));
          const reconstructed = sortedKeys.map(k => value[k]).join('');
          
          console.log(`✨ Reparando memoria ${id}: "${reconstructed.substring(0, 30)}..."`);
          
          // Actualizar en la base de datos (guardar como string)
          await query(
            'UPDATE context_history SET value = $1 WHERE id = $2',
            [JSON.stringify(reconstructed), id]
          );
          
          fixedCount++;
        }
      }
    }

    console.log(`✅ Reparación completada. Se arreglaron ${fixedCount} memorias.`);
  } catch (error) {
    console.error('❌ Error durante la reparación:', error);
  } finally {
    await closePool();
  }
}

fixMemories();
