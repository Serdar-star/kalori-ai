import EmbeddedPostgres from 'embedded-postgres';
import { mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.join(__dirname, '..', '.pgdata', 'cluster');
mkdirSync(databaseDir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'postgres',
  password: 'postgres',
  port: 5432,
  persistent: true,
});

const alreadyInit = await import('fs').then((fs) =>
  fs.existsSync(path.join(databaseDir, 'PG_VERSION'))
);

if (!alreadyInit) {
  console.log('Initializing Postgres cluster...');
  await pg.initialise();
}

console.log('Starting Postgres on :5432...');
await pg.start();

try {
  await pg.createDatabase('app_db');
  console.log('Created database app_db');
} catch (e) {
  console.log('Database app_db may already exist:', e?.message?.slice?.(0, 120) || e);
}

console.log('Postgres is ready: postgresql://postgres:postgres@127.0.0.1:5432/app_db');
// Keep process alive
process.on('SIGINT', async () => {
  console.log('Stopping Postgres...');
  await pg.stop();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  console.log('Stopping Postgres...');
  await pg.stop();
  process.exit(0);
});

// Heartbeat so we know it's alive
setInterval(() => {}, 60_000);
