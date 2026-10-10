'use strict';
const express = require('express');
const { Pool } = require('pg');

const PORT = Number(process.env.PORT || 3000);
const GIT_SHA = process.env.GIT_SHA || 'dev';
const startedAt = new Date().toISOString();

// Connection settings come from PGHOST / PGUSER / PGPASSWORD / PGDATABASE.
const pool = new Pool({ max: 10, idleTimeoutMillis: 30000 });
pool.on('error', (e) => console.error('pg pool error:', e.message));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function initDb(retries = 30) {
  for (let i = 1; ; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id         SERIAL PRIMARY KEY,
          title      TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
          done       BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`);
      return;
    } catch (e) {
      if (i >= retries) throw e;
      console.log(`db not ready (${i}/${retries}): ${e.message}`);
      await sleep(2000);
    }
  }
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

const parseId = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'invalid id' });
    return null;
  }
  return id;
};

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'db_unavailable' });
  }
});

app.get('/api/info', async (req, res) => {
  const { rows } = await pool.query('SELECT now() AS db_time, version() AS db_version');
  res.json({
    gitSha: GIT_SHA,
    startedAt,
    node: process.version,
    dbTime: rows[0].db_time,
    dbVersion: rows[0].db_version.split(' ').slice(0, 2).join(' '),
  });
});

app.get('/api/tasks', async (req, res) => {
  const { rows } = await pool.query('SELECT id, title, done, created_at FROM tasks ORDER BY id DESC LIMIT 100');
  res.json(rows);
});

app.post('/api/tasks', async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (title.length < 1 || title.length > 200) {
    return res.status(400).json({ error: 'title must be 1-200 characters' });
  }
  const { rows } = await pool.query(
    'INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, done, created_at',
    [title]
  );
  res.status(201).json(rows[0]);
});

app.patch('/api/tasks/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { rows } = await pool.query(
    'UPDATE tasks SET done = NOT done WHERE id = $1 RETURNING id, title, done, created_at',
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

app.delete('/api/tasks/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  if (!rowCount) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status && err.status < 500 ? err.status : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'internal error' : err.message });
});

(async () => {
  await initDb();
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
