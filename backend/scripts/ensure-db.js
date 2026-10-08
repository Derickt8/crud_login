const net = require('net');
const { execSync } = require('child_process');
const path = require('path');

const socket = new net.Socket();

socket.setTimeout(1000);

socket.on('connect', () => {
  socket.destroy();
});

socket.on('error', () => {
  console.log('⚡ Iniciando automáticamente PostgreSQL en puerto 5433...');
  const dataDir = path.resolve(__dirname, '../postgres-data');
  const logFile = path.resolve(__dirname, '../postgres.log');
  try {
    execSync(
      `"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe" -D "${dataDir}" -l "${logFile}" start`,
      { stdio: 'inherit' },
    );
  } catch (err) {
    // Si ya estaba en arranque
  }
});

socket.on('timeout', () => {
  socket.destroy();
});

socket.connect(5433, '127.0.0.1');
