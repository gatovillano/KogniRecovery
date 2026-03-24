
import { initDatabase, query } from './src/config/database.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await initDatabase();
  const result = await query('SELECT id, email, name FROM users LIMIT 1');
  console.log(JSON.stringify(result.rows[0]));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
