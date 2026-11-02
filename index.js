/**
 * Host half of the todo board bundle.
 *
 * Owns the durable board file and exposes two JSON endpoints that the Client
 * half uses:
 *
 *   GET  /dsh-todo-board/data  -> { ok, data }
 *   POST /dsh-todo-board/data  <- { data } -> { ok, data }
 *
 * The file lives inside the active DSH profile so every DSH installation
 * (and every profile) keeps its own board.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PREFIX = '/dsh-todo-board';
const MAX_BODY = 4 * 1024 * 1024;

export const name = 'dsh-todo-board';
export const inject = ['webServer'];

const EMPTY = { version: 1, projects: [], tasks: [] };

function profileDir() {
  const explicit = String(process.env.DSH_PROFILE_DIR || '').trim();
  if (explicit) return explicit;
  const home = String(process.env.DSH_HOME || '').trim();
  if (home) return path.join(home, 'profiles', 'desktop');
  return path.join(os.homedir(), '.dsh', 'profiles', 'desktop');
}

function boardFile() {
  return path.join(profileDir(), 'todo-board', 'board.json');
}

function str(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function normalize(raw) {
  const out = { version: 1, projects: [], tasks: [] };
  if (!raw || typeof raw !== 'object') return out;
  const seenProjects = new Set();
  if (Array.isArray(raw.projects)) {
    for (const row of raw.projects) {
      if (!row || typeof row !== 'object') continue;
      const id = str(row.id).trim();
      if (!id || seenProjects.has(id)) continue;
      seenProjects.add(id);
      out.projects.push({
        id,
        name: str(row.name).trim() || id,
        color: str(row.color, ''),
        createdAt: Number(row.createdAt) || Date.now(),
      });
    }
  }
  const seenTasks = new Set();
  const known = new Set(out.projects.map((p) => p.id));
  if (Array.isArray(raw.tasks)) {
    for (const row of raw.tasks) {
      if (!row || typeof row !== 'object') continue;
      const id = str(row.id).trim();
      if (!id || seenTasks.has(id)) continue;
      seenTasks.add(id);
      const status = ['todo', 'doing', 'done'].includes(row.status) ? row.status : 'todo';
      const projectId = known.has(str(row.projectId)) ? str(row.projectId) : '';
      if (!projectId) continue;
      const tags = Array.isArray(row.tags)
        ? [...new Set(row.tags.map((tag) => str(tag).trim()).filter(Boolean))].slice(0, 32)
        : [];
      out.tasks.push({
        id,
        projectId,
        title: str(row.title).slice(0, 500),
        note: str(row.note).slice(0, 20000),
        tags,
        status,
        createdAt: Number(row.createdAt) || Date.now(),
        updatedAt: Number(row.updatedAt) || Date.now(),
        doneAt: Number(row.doneAt) || 0,
      });
    }
  }
  return out;
}

function readBoard() {
  try {
    const raw = fs.readFileSync(boardFile(), 'utf8');
    return normalize(JSON.parse(raw));
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      console.warn('[dsh-todo-board] read failed:', String(error.message || error));
    }
    return normalize(EMPTY);
  }
}

function writeBoard(data) {
  const file = boardFile();
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const payload = JSON.stringify(normalize(data), null, 2);
  const tmp = path.join(dir, `board.json.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, payload, 'utf8');
  fs.renameSync(tmp, file);
  return JSON.parse(payload);
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function headerOf(request, key) {
  const value = request.headers[key];
  return Array.isArray(value) ? value.join(',') : String(value || '');
}

/** Reject cross-site callers so the board cannot be written by another origin. */
function allowRequest(request, response) {
  const site = headerOf(request, 'sec-fetch-site').toLowerCase();
  if (site === 'cross-site') {
    sendJson(response, 403, { ok: false, error: 'cross-origin request refused' });
    return false;
  }
  const origin = headerOf(request, 'origin').trim();
  if (!origin) return true;
  if (origin === 'null') {
    sendJson(response, 403, { ok: false, error: 'cross-origin request refused' });
    return false;
  }
  let originHost = '';
  try {
    originHost = new URL(origin).host;
  } catch {
    sendJson(response, 403, { ok: false, error: 'bad origin' });
    return false;
  }
  const host = headerOf(request, 'host').trim();
  if (!host || originHost.toLowerCase() !== host.toLowerCase()) {
    sendJson(response, 403, { ok: false, error: 'cross-origin request refused' });
    return false;
  }
  return true;
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY) throw new Error('request body too large');
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

export function apply(ctx) {
  ctx.effect(() => {
    const disposers = [];

    const route = (spec) => {
      try {
        const dispose = ctx.webServer.register({
          ...spec,
          handler: async (request, response) => {
            if (!allowRequest(request, response)) return;
            try {
              return await spec.handler(request, response);
            } catch (error) {
              sendJson(response, 500, {
                ok: false,
                error: String((error && error.message) || error || 'internal error'),
              });
            }
          },
        });
        if (typeof dispose === 'function') disposers.push(dispose);
      } catch (error) {
        console.warn('[dsh-todo-board] route failed:', spec.path, String(error && error.message));
      }
    };

    route({
      kind: 'exact',
      path: `${PREFIX}/data`,
      handler: async (request, response) => {
        if (request.method === 'GET') {
          sendJson(response, 200, { ok: true, data: readBoard(), file: boardFile() });
          return;
        }
        if (request.method !== 'POST') {
          response.writeHead(405, { allow: 'GET, POST' });
          response.end();
          return;
        }
        const body = await readBody(request);
        const saved = writeBoard(body && body.data);
        sendJson(response, 200, { ok: true, data: saved, savedAt: Date.now() });
      },
    });

    route({
      kind: 'exact',
      path: `${PREFIX}/health`,
      handler: async (request, response) => {
        sendJson(response, 200, {
          ok: true,
          file: boardFile(),
          exists: fs.existsSync(boardFile()),
        });
      },
    });

    return () => {
      for (const dispose of disposers) {
        try {
          dispose();
        } catch {
          /* already gone */
        }
      }
    };
  }, 'dsh-todo-board: routes');
}
