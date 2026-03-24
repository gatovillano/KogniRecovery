import * as messageModel from './src/models/message.model.js';
import { query } from './src/config/database.js';

async function test() {
  try {
    const result = await query('SELECT count(*) FROM messages');
    console.log('Total messages in DB:', result.rows[0].count);
    
    const lastMessages = await query('SELECT role, content, created_at FROM messages ORDER BY created_at DESC LIMIT 5');
    console.log('Last 5 messages:');
    lastMessages.rows.forEach(m => console.log(`- [${m.role}] ${m.content}`));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

test();
