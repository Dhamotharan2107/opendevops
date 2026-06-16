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

app.use('*', cors({
  origin: '*',
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
}));

// Middleware: log API requests to activity_logs
app.use('/api/*', async (c, next) => {
  await next();
  const path = c.req.path;
  if (c.res.status < 400 && !path.includes('/logs') && !path.includes('/install.sh') && !path.includes('/health')) {
    try {
      const repo = new LogRepository(c.env.DB);
      const user = c.get('user') as any;
      const method = c.req.method;
      const action = method === 'DELETE' ? 'warn' : method === 'PUT' || method === 'PATCH' ? 'info' : 'info';
      const details = `${method} ${path} — ${c.res.status}`;
      await repo.create({
        user_id: user?.id || 'system',
        project_id: 'default',
        action,
        details,
      });
    } catch {}
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
    ? 'OPENDRAP_AGENT_TOKEN="' + queryToken.replace(/[\\"$]/g, '\\$&') + '"'
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
# Opendrap DevOps Agent Installer
API_BASE="https://opendrap-api.tert.workers.dev"
AGENT_DIR="$HOME/opendrap-agent"
AGENT_FILE="$AGENT_DIR/agent.py"
LOG_FILE="$AGENT_DIR/agent.log"
PID_FILE="$AGENT_DIR/agent.pid"

echo "========================================"
echo "  Opendrap DevOps Agent Installer"
echo "========================================"

${tokenLine}
${promptBlock}

mkdir -p "$AGENT_DIR"

# Save token to file for auto-restart
echo "$OPENDRAP_AGENT_TOKEN" > "$AGENT_DIR/token"

cat > "$AGENT_FILE" << 'PYEOF'
#!/usr/bin/env python3
"""Opendrap DevOps Agent - auto-reconnects forever."""
import asyncio, json, os, uuid, subprocess, sys, signal

API_BASE = os.environ.get("OPENDRAP_API", "https://opendrap-api.tert.workers.dev")
AGENT_DIR = os.path.expanduser("~/opendrap-agent")
TOKEN = (os.environ.get("OPENDRAP_AGENT_TOKEN") or
         open(os.path.join(AGENT_DIR, "token")).read().strip() or "")
AGENT_ID = os.environ.get("OPENDRAP_AGENT_ID", f"agent-{uuid.uuid4().hex[:8]}")
SHELL = os.environ.get("SHELL", "/bin/bash")

running = True
def handle_signal(sig, frame):
    global running
    running = False
signal.signal(signal.SIGTERM, handle_signal)
signal.signal(signal.SIGINT, handle_signal)

async def heartbeat(ws):
    while running:
        await asyncio.sleep(30)
        try:
            await ws.send(json.dumps({"type": "heartbeat", "agent_id": AGENT_ID}))
        except: break

async def main():
    if not TOKEN:
        print("ERROR: OPENDRAP_AGENT_TOKEN not set")
        sys.exit(1)
    ws_url = API_BASE.replace("https://", "wss://") + "/api/terminal/ws?sessionId=agent&projectId=default"
    headers = {"Authorization": f"Bearer {TOKEN}"}
    retry = 1
    # Detect websockets API version once
    import websockets
    ws_ver = tuple(int(x) for x in getattr(websockets, '__version__', '0.0').split('.')[:2])
    use_additional = ws_ver >= (10, 0)
    while running:
        try:
            print(f"Connecting to {ws_url} (attempt {retry})...")
            if use_additional:
                cm = websockets.connect(ws_url, additional_headers=headers, ping_interval=20, ping_timeout=10)
            else:
                cm = websockets.connect(ws_url, extra_headers=headers, ping_interval=20, ping_timeout=10)
            async with cm as ws:
                print("Connected!")
                retry = 1
                await ws.send(json.dumps({"type":"agent_connected","agent_id":AGENT_ID,"project_id":"default","info":{"agent_id":AGENT_ID,"version":"0.1.0"}}))
                hb = asyncio.create_task(heartbeat(ws))
                async for msg in ws:
                    if not running: break
                    try:
                        data = json.loads(msg)
                        t = data.get("type","")
                        if t == "heartbeat_ping":
                            await ws.send(json.dumps({"type":"heartbeat","agent_id":AGENT_ID}))
                        elif t == "execute_command":
                            cmd = data.get("command","")
                            cid = data.get("command_id","")
                            try:
                                proc = await asyncio.create_subprocess_shell(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=True, executable=SHELL)
                                while True:
                                    line = await proc.stdout.readline()
                                    if not line: break
                                    await ws.send(json.dumps({"type":"command_output","command_id":cid,"output":line.decode(errors="replace")}))
                                await proc.wait()
                                s = "success" if proc.returncode == 0 else "error"
                            except Exception as e:
                                s = "error"
                                await ws.send(json.dumps({"type":"command_output","command_id":cid,"output":f"Error: {e}\\n"}))
                            await ws.send(json.dumps({"type":"command_completed","command_id":cid,"output":"","status":s}))
                    except json.JSONDecodeError: pass
                hb.cancel()
        except asyncio.CancelledError: break
        except Exception as e:
            print(f"Disconnected: {e}. Reconnecting in {min(retry,30)}s...")
            await asyncio.sleep(min(retry, 30))
            retry = min(retry + 2, 60)

if __name__ == "__main__":
    try: asyncio.run(main())
    except KeyboardInterrupt: pass
PYEOF

chmod +x "$AGENT_FILE" 2>/dev/null || true

if python3 -c "import websockets" 2>/dev/null; then
    echo "  websockets OK"
else
    echo "  Installing websockets..."
    pip3 install websockets -q 2>/dev/null || pip install websockets -q 2>/dev/null || true
fi

# Write restart helper
cat > "$AGENT_DIR/restart.sh" << 'SHEOF'
#!/bin/bash
cd ~/opendrap-agent
kill $(cat agent.pid 2>/dev/null) 2>/dev/null || true
sleep 1
nohup python3 agent.py > agent.log 2>&1 &
echo $! > agent.pid
sleep 2
echo "Agent restarted (PID: $(cat agent.pid))"
SHEOF
chmod +x "$AGENT_DIR/restart.sh" 2>/dev/null || true

# Add to .bashrc for auto-start on Cloud Shell login
BASHRC="$HOME/.bashrc"
START_LINE="cd ~/opendrap-agent && nohup python3 agent.py > agent.log 2>&1 &"
if ! grep -q "opendrap-agent" "$BASHRC" 2>/dev/null; then
    echo "" >> "$BASHRC"
    echo "# Opendrap Agent auto-start" >> "$BASHRC"
    echo "if [ -f ~/opendrap-agent/agent.py ] && [ -f ~/opendrap-agent/token ]; then" >> "$BASHRC"
    echo "  if [ ! -f ~/opendrap-agent/agent.pid ] || ! kill -0 \$(cat ~/opendrap-agent/agent.pid 2>/dev/null) 2>/dev/null; then" >> "$BASHRC"
    echo "    $START_LINE" >> "$BASHRC"
    echo "  fi" >> "$BASHRC"
    echo "fi" >> "$BASHRC"
    echo "  Added auto-start to .bashrc"
fi

echo "  Starting agent..."
nohup python3 "$AGENT_FILE" > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
sleep 2

if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
    echo "  Agent running! (PID: $(cat "$PID_FILE"))"
else
    echo "  Check logs: $LOG_FILE"
    echo "  Manual: python3 $AGENT_FILE"
fi

echo "  File: $AGENT_FILE"
echo "  Logs: $LOG_FILE"
echo "  Stop: kill \$(cat $PID_FILE)"
echo "  Restart: bash ~/opendrap-agent/restart.sh"
echo "  Auto-restarts on disconnect & Cloud Shell login"
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
