import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppError } from './utils/errors';
import { errorResponse, successResponse } from './utils/helpers';
import type { Env } from './types';
import { NotificationDurableObject } from './durable-objects/notification-do';
import { LogRepository } from './repositories/logs';

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import searchRouter from './routes/search';
import connectionsRouter from './routes/connections';
import companiesRouter from './routes/companies';
import projectsRouter from './routes/projects';
import deploymentsRouter from './routes/deployments';
import terminalRouter from './routes/terminal';
import tunnelRouter from './routes/tunnel';
import { chatRouter } from './routes/chat';
import { tasksRouter } from './routes/tasks';
import { bugsRouter } from './routes/bugs';
import { logsRouter } from './routes/logs';
import { aiRouter } from './routes/ai';
import { testsRouter } from './routes/tests';
import { notificationsRouter } from './routes/notifications';
import adminRouter from './routes/admin';
import agentRouter from './routes/agent';
import { dashboardRouter } from './routes/dashboard';

const app = new Hono<{ Bindings: Env }>();

// CORS: reflect only an explicit allowlist of origins (no wildcard-with-credentials).
const STATIC_ALLOWED_ORIGINS = [
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:3000', 'http://127.0.0.1:3000',
];
app.use('*', cors({
  origin: (origin, c) => {
    const allowed = [(c.env as Env).FRONTEND_URL, ...STATIC_ALLOWED_ORIGINS].filter(Boolean);
    if (!origin) return allowed[0] ?? null;        // non-browser clients (curl, agent)
    return allowed.includes(origin) ? origin : null; // disallow everything else
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware: log API requests to activity_logs (fire-and-forget; never blocks the response).
app.use('/api/*', async (c, next) => {
  await next();
  const path = c.req.path;
  const method = c.req.method;
  // Only log authenticated, state-changing requests — avoid a DB write on every GET.
  const isWrite = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
  const user = c.get('user') as any;
  if (c.res.status < 400 && isWrite && user?.id &&
      !path.includes('/logs') && !path.includes('/install.sh') && !path.includes('/health')) {
    const repo = new LogRepository(c.env.DB);
    const action = method === 'DELETE' ? 'warn' : 'info';
    const details = `${method} ${path} — ${c.res.status}`;
    const write = repo.create({ user_id: user.id, project_id: 'default', action, details }).catch(() => {});
    // Run after the response is sent so it adds no latency.
    try { c.executionCtx.waitUntil(write); } catch { await write; }
  }
});

app.route('/api/auth', authRouter);
app.route('/api/users', usersRouter);
app.route('/api/search', searchRouter);
app.route('/api/connections', connectionsRouter);
app.route('/api/companies', companiesRouter);
app.route('/api/projects', projectsRouter);
app.route('/api/chat', chatRouter);
app.route('/api/tasks', tasksRouter);
app.route('/api/bugs', bugsRouter);
app.route('/api/deployments', deploymentsRouter);
app.route('/api/terminal', terminalRouter);
app.route('/api/tunnel', tunnelRouter);
app.route('/api', logsRouter);
app.route('/api', aiRouter);
app.route('/api', testsRouter);
app.route('/api', notificationsRouter);
app.route('/api/admin', adminRouter);
app.route('/api/agent', agentRouter);
app.route('/api', dashboardRouter);

// Public shell script endpoint for agent install
app.get('/api/install.sh', (c) => {
  const queryToken = c.req.query('token') || '';

  const tokenLine = queryToken
    ? 'export OPENDRAP_AGENT_TOKEN="' + queryToken.replace(/[\\"$]/g, '\\$&') + '"'
    : '';

  const promptBlock = queryToken ? '' : `
if [ -z "$OPENDRAP_AGENT_TOKEN" ]; then
  echo "  Sign in to your Opendrap account"
  read -r -p "  Email: " LOGIN_EMAIL </dev/tty
  read -s -p "  Password: " LOGIN_PASS </dev/tty
  echo ""
  LOGIN_RESP=$(curl -s "$API_BASE/api/auth/login" \\
    -H "Content-Type: application/json" \\
    -d "{\\"email\\":\\"$LOGIN_EMAIL\\",\\"password\\":\\"$LOGIN_PASS\\"}")
  unset LOGIN_PASS
  OPENDRAP_AGENT_TOKEN=$(echo "$LOGIN_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
t = d.get('token', '')
if not t:
    print('ERROR: ' + d.get('error', 'Login failed'))
    sys.exit(1)
print(t)
" 2>&1) || { echo "  Login failed."; exit 1; }
  echo "  Signed in successfully"
fi`;


  const script = `#!/bin/bash
# Opendrap DevOps Agent Installer (Node.js v2)
API_BASE="https://opendrap-api.tert.workers.dev"
AGENT_DIR="$HOME/opendrap-agent"
AGENT_FILE="$AGENT_DIR/agent.js"
LOG_FILE="$AGENT_DIR/agent.log"
PID_FILE="$AGENT_DIR/agent.pid"

echo "========================================"
echo "  Opendrap DevOps Agent Installer v2"
echo "========================================"

${tokenLine}
${promptBlock}

mkdir -p "$AGENT_DIR"
echo "$OPENDRAP_AGENT_TOKEN" > "$AGENT_DIR/token"

# Ensure Node.js is available (Google Cloud Shell has it pre-installed)
if ! command -v node &>/dev/null; then
  echo "  Node.js not found — installing via nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install --lts
fi
echo "  Node.js: $(node --version)"

# Install ws WebSocket library
cd "$AGENT_DIR"
if [ ! -f package.json ]; then
  echo '{"name":"opendrap-agent","version":"2.0.0","private":true}' > package.json
fi
if [ ! -d node_modules/ws ]; then
  echo "  Installing ws..."
  npm install ws --save-quiet 2>/dev/null || npm install ws 2>&1 | tail -3
fi
# Verify ws can actually be required, otherwise the agent crashes on startup.
if node -e "require('ws')" 2>/dev/null; then
  echo "  ws: OK"
else
  echo "  ws not loadable — retrying install..."
  rm -rf node_modules package-lock.json
  npm install ws 2>&1 | tail -5
  node -e "require('ws')" 2>/dev/null && echo "  ws: OK" || echo "  ws: STILL FAILING — check 'npm install ws' manually"
fi

cat > "$AGENT_FILE" << 'JSEOF'
'use strict';
const WebSocket = require('ws');
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const API_BASE = process.env.OPENDRAP_API || 'https://opendrap-api.tert.workers.dev';
const AGENT_DIR = path.join(os.homedir(), 'opendrap-agent');
const TOKEN = (() => {
  const e = (process.env.OPENDRAP_AGENT_TOKEN || '').trim();
  if (e) return e;
  try { return fs.readFileSync(path.join(AGENT_DIR, 'token'), 'utf8').trim(); } catch(_) { return ''; }
})();
if (!TOKEN) { console.error('ERROR: No token found — create ~/opendrap-agent/token'); process.exit(1); }

const AGENT_ID = 'agent-' + crypto.randomBytes(4).toString('hex');
const procs = new Map(); // cmdId -> { proc, cmd, cwd, timer }
let cwd = os.homedir();
let ws = null;
let reconnDelay = 2000;

const isWin = process.platform === 'win32';
const SH = isWin ? 'cmd.exe' : (process.env.SHELL || '/bin/bash');
const SF = isWin ? '/c' : '-c';

function send(obj) {
  if (ws && ws.readyState === 1) {
    try { ws.send(JSON.stringify(obj)); } catch(_) {}
  }
}

// Spawn a child process for every command — non-blocking, supports long-running processes.
// stdout + stderr are streamed in real time via 100ms flush intervals.
function runProc(cmdId, command, cmdCwd) {
  let wdir = cmdCwd || cwd;
  // Cloud Shell can recycle directories out from under us; if the tracked cwd no
  // longer exists, spawning there yields 'getcwd: cannot access parent
  // directories'. Fall back to home so commands always run from a valid dir.
  try { if (!fs.statSync(wdir).isDirectory()) { wdir = os.homedir(); cwd = wdir; } }
  catch (_) { wdir = os.homedir(); cwd = wdir; }
  let proc;
  try {
    proc = spawn(SH, [SF, command], {
      cwd: wdir,
      env: Object.assign({}, process.env, { TERM: 'xterm-256color', PYTHONUNBUFFERED: '1' }),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch(e) {
    send({ type: 'command_output', command_id: cmdId, output: 'spawn error: ' + e.message + '\\n' });
    send({ type: 'command_completed', command_id: cmdId, output: '', status: 'error' });
    return;
  }

  let buf = '';
  let timer = setInterval(() => {
    if (buf) { send({ type: 'command_output', command_id: cmdId, output: buf }); buf = ''; }
  }, 100);

  const onChunk = (chunk) => {
    const text = chunk.toString();
    buf += text;
    // Update agent cwd when shell emits __CWD__: marker (from 'cd ... && echo __CWD__:$(pwd)')
    const cwdM = text.match(/__CWD__:([^\\r\\n]+)/);
    if (cwdM) {
      const raw = cwdM[1].trim().replace(/^~/, os.homedir());
      try { if (fs.statSync(raw).isDirectory()) cwd = raw; } catch(_) {}
    }
    // Flush immediately so the browser gets the tunnel URL without waiting 100ms
    if (text.indexOf('trycloudflare.com') >= 0 || text.indexOf('loca.lt') >= 0) {
      clearInterval(timer);
      send({ type: 'command_output', command_id: cmdId, output: buf }); buf = '';
      timer = setInterval(() => {
        if (buf) { send({ type: 'command_output', command_id: cmdId, output: buf }); buf = ''; }
      }, 100);
    }
  };

  proc.stdout.on('data', onChunk);
  proc.stderr.on('data', onChunk);
  procs.set(cmdId, { proc: proc, cmd: command, cwd: wdir, timer: timer });

  proc.on('close', (code) => {
    clearInterval(timer);
    if (buf) { send({ type: 'command_output', command_id: cmdId, output: buf }); buf = ''; }
    procs.delete(cmdId);
    send({ type: 'command_completed', command_id: cmdId, output: '', status: code === 0 ? 'success' : 'error', exit_code: code, cwd: cwd.replace(os.homedir(), '~') });
  });

  proc.on('error', (e) => {
    clearInterval(timer);
    procs.delete(cmdId);
    send({ type: 'command_output', command_id: cmdId, output: 'Error: ' + e.message + '\\n' });
    send({ type: 'command_completed', command_id: cmdId, output: '', status: 'error' });
  });
}

// Resolve a user-supplied path: expand a leading ~, and make relative paths
// resolve against the agent's current dir. No regex (kept template-literal safe).
function resolvePath(p) {
  p = (p || '').trim();
  if (p === '~') return os.homedir();
  if (p.indexOf('~/') === 0) p = path.join(os.homedir(), p.slice(2));
  if (!p) p = cwd;
  if (!path.isAbsolute(p)) p = path.resolve(cwd, p);
  return p;
}

function handleMsg(msg) {
  const t = msg.type;
  if (t === 'execute_command') {
    const cmd = (msg.command || '').trim();
    // Handle standalone 'cd' in Node.js to keep the agent's cwd in sync.
    // Compound commands like 'cd x && echo __CWD__:$(pwd)' go to runProc (shell handles them).
    if (/^cd(\\s+.*)?$/.test(cmd) && cmd.indexOf('&&') < 0 && cmd.indexOf(';') < 0 && cmd.indexOf('|') < 0) {
      const parts = cmd.split(/\\s+/);
      const target = parts.length > 1 ? parts.slice(1).join(' ').replace(/^~/, os.homedir()) : os.homedir();
      const newdir = path.resolve(cwd, target);
      try {
        if (fs.statSync(newdir).isDirectory()) {
          cwd = newdir;
          const cwdShort = cwd.replace(os.homedir(), '~');
          send({ type: 'cwd', data: cwdShort });
          send({ type: 'command_completed', command_id: msg.command_id, output: '', status: 'success', cwd: cwdShort });
          return;
        }
      } catch(_) {}
      send({ type: 'command_output', command_id: msg.command_id, output: 'cd: ' + target + ': No such file or directory\\n' });
      send({ type: 'command_completed', command_id: msg.command_id, output: '', status: 'error', cwd: cwd.replace(os.homedir(), '~') });
      return;
    }
    runProc(msg.command_id, cmd, msg.cwd);
  } else if (t === 'stop_process') {
    const entry = procs.get(msg.process_id);
    if (entry) {
      try { entry.proc.kill('SIGTERM'); } catch(_) {}
      setTimeout(() => { if (procs.has(msg.process_id)) try { entry.proc.kill('SIGKILL'); } catch(_) {} }, 3000);
    }
  } else if (t === 'list_processes') {
    const list = [];
    procs.forEach((e, id) => list.push({ id: id, cmd: e.cmd, pid: e.proc.pid, cwd: e.cwd }));
    send({ type: 'process_list', processes: list });
  } else if (t === 'ctrl_c') {
    // If a specific process_id is given, kill only that one; otherwise kill all running processes
    const target = msg.process_id ? procs.get(msg.process_id) : null;
    if (target) {
      try { target.proc.kill('SIGINT'); } catch(_) {}
    } else {
      procs.forEach((e) => { try { e.proc.kill('SIGINT'); } catch(_) {} });
    }
  } else if (t === 'read_file') {
    const fp = resolvePath(msg.path);
    fs.readFile(fp, 'utf8', (err, data) => {
      send({ type: 'file_content', request_id: msg.request_id, path: msg.path, abs_path: fp, content: err ? '' : data, error: err ? err.message : null });
    });
  } else if (t === 'write_file') {
    const fp = resolvePath(msg.path);
    fs.writeFile(fp, msg.content != null ? String(msg.content) : '', 'utf8', (err) => {
      send({ type: 'file_saved', request_id: msg.request_id, path: msg.path, abs_path: fp, error: err ? err.message : null });
    });
  } else if (t === 'list_dir') {
    const dp = resolvePath(msg.path || cwd);
    fs.readdir(dp, { withFileTypes: true }, (err, ents) => {
      const entries = err ? [] : ents.map((e) => ({ name: e.name, dir: e.isDirectory() }))
        .sort((a, b) => (Number(b.dir) - Number(a.dir)) || a.name.localeCompare(b.name));
      send({ type: 'dir_list', request_id: msg.request_id, path: dp.replace(os.homedir(), '~'), abs_path: dp, entries: entries, error: err ? err.message : null });
    });
  } else if (t === 'heartbeat_ping') {
    send({ type: 'heartbeat', agent_id: AGENT_ID });
  }
}

function connect() {
  const wsUrl = API_BASE.replace('https://', 'wss://') + '/api/terminal/ws?sessionId=agent&projectId=default';
  console.log('Connecting to ' + wsUrl + ' ...');
  ws = new WebSocket(wsUrl, { headers: { Authorization: 'Bearer ' + TOKEN } });
  let hbt = null;

  ws.on('open', () => {
    reconnDelay = 2000;
    console.log('Connected! Agent ID: ' + AGENT_ID);
    ws.send(JSON.stringify({ type: 'agent_connected', agent_id: AGENT_ID, project_id: 'default', info: { hostname: os.hostname(), version: '2.0.0', node: process.version } }));
    // Application-level heartbeat — Cloudflare Workers do not respond to WebSocket ping frames
    hbt = setInterval(() => {
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'heartbeat', agent_id: AGENT_ID }));
    }, 30000);
  });

  ws.on('message', (raw) => { try { handleMsg(JSON.parse(raw.toString())); } catch(_) {} });

  ws.on('close', () => {
    clearInterval(hbt);
    console.log('Disconnected. Retry in ' + (reconnDelay / 1000) + 's...');
    setTimeout(() => { reconnDelay = Math.min(reconnDelay * 2, 30000); connect(); }, reconnDelay);
  });

  ws.on('error', (e) => { console.error('WS error: ' + e.message); });
}

function cleanup() {
  procs.forEach((e) => { try { e.proc.kill('SIGTERM'); } catch(_) {} });
  if (ws) try { ws.close(); } catch(_) {}
}
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

connect();
JSEOF

chmod +x "$AGENT_FILE" 2>/dev/null || true

# Restart helper
cat > "$AGENT_DIR/restart.sh" << 'SHEOF'
#!/bin/bash
cd ~/opendrap-agent
if [ -f agent.pid ]; then
  kill $(cat agent.pid) 2>/dev/null || true
  sleep 1
fi
nohup node agent.js > agent.log 2>&1 &
echo $! > agent.pid
sleep 2
if kill -0 $(cat agent.pid) 2>/dev/null; then
  echo "Agent restarted (PID: $(cat agent.pid))"
else
  echo "Failed. Check: tail -20 ~/opendrap-agent/agent.log"
fi
SHEOF
chmod +x "$AGENT_DIR/restart.sh"

# Auto-start on Cloud Shell login
BASHRC="$HOME/.bashrc"
if ! grep -q "opendrap-agent" "$BASHRC" 2>/dev/null; then
  cat >> "$BASHRC" << 'BASHEOF'

# Opendrap Agent auto-start
if [ -f ~/opendrap-agent/agent.js ] && [ -f ~/opendrap-agent/token ]; then
  if [ ! -f ~/opendrap-agent/agent.pid ] || ! kill -0 $(cat ~/opendrap-agent/agent.pid 2>/dev/null) 2>/dev/null; then
    cd ~/opendrap-agent && nohup node agent.js > agent.log 2>&1 &
    echo $! > ~/opendrap-agent/agent.pid
  fi
fi
BASHEOF
  echo "  Added auto-start to .bashrc"
fi

# Kill old Python agent if running
pkill -f "python.*opendrap" 2>/dev/null || true
kill $(cat "$PID_FILE" 2>/dev/null) 2>/dev/null || true
sleep 1

echo "  Starting Node.js agent..."
cd "$AGENT_DIR"
nohup node "$AGENT_FILE" > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
sleep 2

if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
  echo "  Agent running! (PID: $(cat "$PID_FILE"))"
else
  echo "  Start failed — crash log below:"
  echo "  ----------------------------------------"
  tail -25 "$LOG_FILE" 2>/dev/null | sed 's/^/  | /'
  echo "  ----------------------------------------"
  echo "  Fix the error above, then run: bash ~/opendrap-agent/restart.sh"
fi

echo ""
echo "  File: $AGENT_FILE"
echo "  Logs: tail -f $LOG_FILE"
echo "  Restart: bash ~/opendrap-agent/restart.sh"
echo "========================================"
`;
  return c.newResponse(script, 200, {
    'Content-Type': 'text/x-shellscript',
    'Cache-Control': 'public, max-age=3600',
  });
});

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(errorResponse(err.message, err.status), err.status as any);
  }
  console.error('Unhandled error:', err);
  return c.json(errorResponse('Internal server error', 500), 500);
});

app.notFound((c) => c.json(errorResponse('Not found', 404), 404));

export default app;
export { ChatDurableObject } from './durable-objects/chat-do';
export { AgentDurableObject } from './durable-objects/agent';
export { TerminalDurableObject } from './durable-objects/terminal';
export { NotificationDurableObject };
