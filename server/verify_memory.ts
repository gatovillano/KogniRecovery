
import { initDatabase, query } from './src/config/database.ts';
import dotenv from 'dotenv';
dotenv.config();

const userId = 'b6a9d1c1-a419-427a-9697-301269df6f8a';

async function main() {
  await initDatabase();
  const result = await query('SELECT * FROM context_history WHERE user_id = $1', [userId]);
  console.log(JSON.stringify(result.rows, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
