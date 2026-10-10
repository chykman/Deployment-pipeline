'use strict';
const { Pool } = require('pg');
const { createApp, initDb } = require('./app');

const PORT = Number(process.env.PORT || 3000);
const GIT_SHA = process.env.GIT_SHA || 'dev';

// Connection settings come from PGHOST / PGUSER / PGPASSWORD / PGDATABASE.
const pool = new Pool({ max: 10, idleTimeoutMillis: 30000 });
pool.on('error', (e) => console.error('pg pool error:', e.message));

(async () => {
  await initDb(pool);
  const app = createApp(pool, { gitSha: GIT_SHA });
  const server = app.listen(PORT, () => console.log(`api ${GIT_SHA.slice(0, 7)} listening on :${PORT}`));

  const shutdown = (sig) => {
    console.log(`${sig} received, shutting down`);
    server.close(async () => {
      await pool.end().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})().catch((e) => {
  console.error('fatal:', e);
  process.exit(1);
});
