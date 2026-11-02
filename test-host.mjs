import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-test-'));
process.env.DSH_PROFILE_DIR = tmpProfile;

const routes = new Map();
const ctx = {
  webServer: {
    register(spec) {
      routes.set(spec.path, spec);
      return () => routes.delete(spec.path);
    },
  },
  effect(fn) {
    const dispose = fn();
    return dispose;
  },
};

const mod = await import('./index.js');
mod.apply(ctx);

assert.equal(typeof routes.get('/dsh-todo-board/data').handler, 'function');

function makeResponse() {
  return {
    status: 0,
    headers: null,
    body: '',
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },
    end(body) {
      this.body = body || '';
    },
  };
}

async function request(method, body) {
  const handler = routes.get('/dsh-todo-board/data').handler;
  const chunks = body ? [Buffer.from(JSON.stringify(body))] : [];
  const req = {
    method,
    headers: { host: '127.0.0.1:12162' },
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) yield chunk;
    },
  };
  const res = makeResponse();
  await handler(req, res);
  return { status: res.status, json: res.body ? JSON.parse(res.body) : null };
}

// empty read
let r = await request('GET');
assert.equal(r.status, 200);
assert.deepEqual(r.json.data, { version: 1, projects: [], tasks: [] });

// save
r = await request('POST', {
  data: {
    version: 1,
    projects: [{ id: 'p1', name: 'Alpha', createdAt: 1 }],
    tasks: [
      { id: 't1', projectId: 'p1', title: 'Write tests', tags: ['qa', 'qa', ' '], status: 'doing', createdAt: 2 },
      { id: 't2', projectId: 'ghost', title: 'orphan', tags: [], status: 'todo' },
      { id: 't3', projectId: 'p1', title: 'Done thing', tags: ['ship'], status: 'done', doneAt: 9 },
    ],
  },
});
assert.equal(r.status, 200);
assert.equal(r.json.data.projects.length, 1);
assert.equal(r.json.data.tasks.length, 2, 'task with unknown project is dropped');
assert.deepEqual(r.json.data.tasks[0].tags, ['qa'], 'tags deduped and trimmed');
assert.equal(r.json.data.tasks[1].doneAt, 9);

// persisted on disk
const file = path.join(tmpProfile, 'todo-board', 'board.json');
assert.ok(fs.existsSync(file));
const onDisk = JSON.parse(fs.readFileSync(file, 'utf8'));
assert.equal(onDisk.tasks.length, 2);

// round-trip
r = await request('GET');
assert.equal(r.json.data.projects[0].name, 'Alpha');

// cross-origin rejected
{
  const handler = routes.get('/dsh-todo-board/data').handler;
  const req = {
    method: 'GET',
    headers: { host: '127.0.0.1:12162', origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' },
    async *[Symbol.asyncIterator]() {},
  };
  const res = makeResponse();
  await handler(req, res);
  assert.equal(res.status, 403);
}

// method guard
{
  const handler = routes.get('/dsh-todo-board/data').handler;
  const req = { method: 'DELETE', headers: { host: 'x' }, async *[Symbol.asyncIterator]() {} };
  const res = makeResponse();
  await handler(req, res);
  assert.equal(res.status, 405);
}

console.log('host ok');
