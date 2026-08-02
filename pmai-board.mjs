#!/usr/bin/env node
/**
 * Zero-dep CLI for PMAI / Scopecraft shared task board.
 *
 * Usage:
 *   node pmai-board.mjs set T-001 Done --url https://app/s/{token}
 *   node pmai-board.mjs list --url https://app/s/{token}
 *
 * Download:
 *   curl -fsSL https://{APP}/cli/pmai-board.mjs -o /tmp/pmai-board.mjs
 */

function usage(exitCode = 1) {
  console.error(`Usage:
  node pmai-board.mjs set <TASK_ID> <STATUS> --url <shareBaseUrl>
  node pmai-board.mjs list --url <shareBaseUrl>

STATUS: To Do | In Progress | Done | In Review | Blocked
shareBaseUrl: https://host/s/{token}  (not the /download URL)`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    usage(0);
  }

  const urlIdx = args.indexOf('--url');
  if (urlIdx === -1 || !args[urlIdx + 1]) {
    console.error('Missing --url <shareBaseUrl>');
    usage(1);
  }

  const url = args[urlIdx + 1].replace(/\/+$/, '');
  const rest = args.filter((_, i) => i !== urlIdx && i !== urlIdx + 1);
  const cmd = rest[0];

  return { cmd, rest: rest.slice(1), url };
}

function normalizeShareBase(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    console.error('Invalid --url: not a valid URL');
    process.exit(1);
  }

  // Accept .../s/TOKEN, .../s/TOKEN/download, .../s/TOKEN/tasks
  let path = u.pathname.replace(/\/+$/, '');
  path = path.replace(/\/(download|tasks)\/?$/, '');

  const match = path.match(/^\/s\/([A-Za-z0-9]+)$/);
  if (!match) {
    console.error('Invalid --url: path must be /s/{token} (optional /download or /tasks)');
    process.exit(1);
  }

  u.pathname = `/s/${match[1]}`;
  u.search = '';
  u.hash = '';

  return u.toString().replace(/\/+$/, '');
}

async function setStatus(base, taskId, status) {
  const res = await fetch(`${base}/tasks`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ id: taskId, status }),
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    console.error(data.message || `HTTP ${res.status}`);
    process.exit(1);
  }

  console.log(`${data.id} -> ${data.status} (v${data.major_version}.${data.minor_version})`);
}

async function listTasks(base) {
  const res = await fetch(`${base}/download`, {
    headers: { Accept: 'text/markdown, text/plain, */*' },
  });

  if (!res.ok) {
    console.error(`Failed to download: HTTP ${res.status}`);
    process.exit(1);
  }

  const md = await res.text();
  const lines = md.split(/\r?\n/);
  let inTable = false;
  let printed = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) {
      inTable = false;
      continue;
    }
    if (trimmed.includes('---')) {
      continue;
    }

    const cells = trimmed
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());

    if (cells.length < 2) {
      continue;
    }

    const headerish = cells.some((c) => /^id$/i.test(c)) && cells.some((c) => /task|tugas/i.test(c));
    if (headerish) {
      inTable = true;
      continue;
    }

    if (!inTable) {
      continue;
    }

    const id = cells[0];
    if (!id || id.includes('*[')) {
      continue;
    }

    const status = cells[cells.length - 1] ?? '';
    const title = cells[1] ?? '';
    console.log(`${id}\t${status}\t${title}`);
    printed += 1;
  }

  if (printed === 0) {
    console.error('No tasks found in document.');
    process.exit(1);
  }
}

const { cmd, rest, url } = parseArgs(process.argv);
const base = normalizeShareBase(url);

if (cmd === 'set') {
  const taskId = rest[0];
  const status = rest.slice(1).join(' ').trim();
  if (!taskId || !status) {
    console.error('set requires <TASK_ID> <STATUS>');
    usage(1);
  }
  await setStatus(base, taskId, status);
} else if (cmd === 'list') {
  await listTasks(base);
} else {
  console.error(`Unknown command: ${cmd}`);
  usage(1);
}
