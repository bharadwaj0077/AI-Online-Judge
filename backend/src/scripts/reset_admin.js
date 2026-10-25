const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Bada%401946@localhost:5432/online_judge_db?schema=public'
  });
  await client.connect();
  const hash = await bcrypt.hash('AdminPassword123!', 12);
  await client.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash, 'coder_77']);
  console.log('Admin password updated for coder_77 to AdminPassword123!');
  await client.end();
}

main().catch(console.error);
