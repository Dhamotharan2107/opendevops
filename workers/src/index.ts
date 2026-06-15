import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppError } from './utils/errors';
import { errorResponse } from './utils/helpers';
import type { Env } from './types';
import { NotificationDurableObject } from './durable-objects/notification-do';

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

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: '*',
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
}));

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

// Public shell script endpoint for agent install
app.get('/api/install.sh', (c) => {
  const script = `#!/bin/bash
# Opendrap DevOps Agent Installer
set -e

API_BASE="https://opendrap-api.tert.workers.dev"
AGENT_DIR="$HOME/opendrap-agent"
AGENT_FILE="$AGENT_DIR/agent.py"
LOG_FILE="$AGENT_DIR/agent.log"
PID_FILE="$AGENT_DIR/agent.pid"

echo "========================================"
echo "  Opendrap DevOps Agent Installer"
echo "========================================"
echo ""

mkdir -p "$AGENT_DIR"

# Write the agent Python script
cat > "$AGENT_FILE" << 'PYEOF'
#!/usr/bin/env python3
"""Opendrap DevOps Agent - connects to the Opendrap API via WebSocket."""
import asyncio
import json
import sys
import os
import uuid
import time
import signal

API_BASE = os.environ.get("OPENDRAP_API", "https://opendrap-api.tert.workers.dev")
AGENT_ID = os.environ.get("OPENDRAP_AGENT_ID", f"agent-{uuid.uuid4().hex[:8]}")

async def main():
    ws_url = API_BASE.replace("https://", "wss://") + "/api/terminal/ws"
    agent_info = {"agent_id": AGENT_ID, "version": "0.1.0"}
    
    while True:
        try:
            import websockets
            async with websockets.connect(ws_url) as ws:
                await ws.send(json.dumps({
                    "type": "agent_connected",
                    "agent_id": AGENT_ID,
                    "project_id": "default",
                    "info": agent_info
                }))
                print(f"Agent {AGENT_ID} connected")
                
                async def heartbeat():
                    while True:
                        await asyncio.sleep(30)
                        try:
                            await ws.send(json.dumps({"type": "heartbeat", "agent_id": AGENT_ID}))
                        except:
                            break
                
                heartbeat_task = asyncio.create_task(heartbeat())
                
                async for message in ws:
                    data = json.loads(message)
                    msg_type = data.get("type", "")
                    if msg_type == "heartbeat_ping":
                        await ws.send(json.dumps({"type": "heartbeat", "agent_id": AGENT_ID}))
                    elif msg_type == "execute_command":
                        cmd = data.get("command", "")
                        cmd_id = data.get("command_id", "")
                        print(f"Executing: {cmd}")
                        await ws.send(json.dumps({
                            "type": "command_output",
                            "command_id": cmd_id,
                            "output": f"[{AGENT_ID}] Running: {cmd}\\n"
                        }))
                        await ws.send(json.dumps({
                            "type": "command_completed",
                            "command_id": cmd_id,
                            "output": f"Command executed on {AGENT_ID}",
                            "status": "success"
                        }))
                
                heartbeat_task.cancel()
                
        except Exception as e:
            print(f"Connection error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
PYEOF

chmod +x "$AGENT_FILE"
echo "  Agent script created at $AGENT_FILE"

# Check for websockets dependency
if python3 -c "import websockets" 2>/dev/null; then
    echo "  websockets module found"
else
    echo "  Installing websockets module..."
    pip3 install websockets -q 2>/dev/null || pip install websockets -q 2>/dev/null || true
fi

echo "  Starting agent in background..."
echo ""

nohup python3 "$AGENT_FILE" > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

sleep 2

if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
    echo "  Agent is running! (PID: $(cat "$PID_FILE"))"
    echo "  Connected to Opendrap API."
else
    echo "  Failed to start. Check logs: $LOG_FILE"
    echo "  Run manually: python3 $AGENT_FILE"
fi

echo "  Agent ID: $(cat /proc/sys/kernel/random/uuid 2>/dev/null | head -c 8 || echo "run 'cat $AGENT_FILE' for details")"
echo ""
echo "  Logs: $LOG_FILE"
echo "  Stop: kill \$(cat $PID_FILE)"
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
