const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    database: 'postgres'
  });
  await client.connect();
  console.log('Connected to port 5433 successfully!');
  const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'crud_login_db'");
  if (res.rowCount === 0) {
    await client.query('CREATE DATABASE crud_login_db');
    console.log('Database crud_login_db CREATED!');
  } else {
    console.log('Database crud_login_db already exists.');
  }
  await client.query("ALTER USER postgres WITH PASSWORD 'admin'");
  console.log("Password set to 'admin' successfully!");
  await client.end();
}

run().catch((err) => {
  console.error('Error on port 5433:', err.message);
});
