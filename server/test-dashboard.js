const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: 'postgresql://kognito_user:hJxsw8569LJ@localhost:5432/kognito_db'
});

async function run() {
  const result = await pool.query("SELECT id FROM users LIMIT 1");
  const userId = result.rows[0]?.id;
  if (!userId) {
    console.log("No user found");
    process.exit(1);
  }
  
  const token = jwt.sign(
    { userId, email: 'test@example.com', role: 'patient' },
    'dev_jwt_secret_key_min_32_chars_for_development_only',
    { expiresIn: '1h' }
  );
  
  const response = await fetch('http://localhost:3003/api/v1/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const status = response.status;
  const data = await response.json();
  console.log(`Status: ${status}`);
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

run();
