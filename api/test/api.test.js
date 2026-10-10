'use strict';
// Integration tests: real Express app, real PostgreSQL (PG* env vars), no mocks.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const { createApp, initDb } = require('../app');

let pool;
let server;
let base;

before(async () => {
  pool = new Pool();
  await initDb(pool, 5);
  server = createApp(pool, { gitSha: 'test-sha' }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  await pool.end();
});

const api = (path, opts = {}) =>
  fetch(base + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });

test('GET /api/health reports ok when the database is reachable', async () => {
  const res = await api('/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('GET /api/info exposes the commit it was built from', async () => {
  const body = await (await api('/api/info')).json();
  assert.equal(body.gitSha, 'test-sha');
  assert.match(body.dbVersion, /^PostgreSQL \d+/);
});

test('task lifecycle: create, list, toggle, delete', async () => {
  const created = await api('/api/tasks', { method: 'POST', body: JSON.stringify({ title: '  write tests  ' }) });
  assert.equal(created.status, 201);
  const task = await created.json();
  assert.equal(task.title, 'write tests'); // trimmed
  assert.equal(task.done, false);

  const list = await (await api('/api/tasks')).json();
  assert.ok(list.some((t) => t.id === task.id));

  const toggled = await (await api(`/api/tasks/${task.id}`, { method: 'PATCH' })).json();
  assert.equal(toggled.done, true);

  assert.equal((await api(`/api/tasks/${task.id}`, { method: 'DELETE' })).status, 204);
  assert.equal((await api(`/api/tasks/${task.id}`, { method: 'DELETE' })).status, 404);
});

test('rejects invalid input', async () => {
  const post = (body) => api('/api/tasks', { method: 'POST', body });
  assert.equal((await post(JSON.stringify({ title: '' }))).status, 400);
  assert.equal((await post(JSON.stringify({ title: 'x'.repeat(201) }))).status, 400);
  assert.equal((await post(JSON.stringify({ title: 42 }))).status, 400);
  assert.equal((await post('{not json')).status, 400);
  assert.equal((await api('/api/tasks/abc', { method: 'DELETE' })).status, 400);
});

test('unknown API routes return JSON 404', async () => {
  const res = await api('/api/nope');
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'not found' });
});
