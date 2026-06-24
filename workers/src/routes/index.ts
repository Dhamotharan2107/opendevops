import { Hono } from 'hono';
import { chatRouter as chat } from './chat';
import { tasksRouter as tasks } from './tasks';
import { bugsRouter as bugs } from './bugs';
import users from './users';
import auth from './auth';
import projects from './projects';
import deployments from './deployments';
import companies from './companies';
import connections from './connections';
import search from './search';
import terminal from './terminal';
import tunnel from './tunnel';
import { aiRouter } from './ai';
import { logsRouter } from './logs';
import { notificationsRouter } from './notifications';
import { testsRouter } from './tests';
import type { Env } from '../types';

const apiRoutes = new Hono<{ Bindings: Env }>();

apiRoutes.get('/install.sh', (c) => {
  const token = c.req.query('token') ?? '';
  const wsUrl = 'wss://opendrap-api.tert.workers.dev/api/terminal/ws';
  const script = `#!/bin/bash
set -e
echo "========================================"
echo "  Opendrap DevOps Agent Installer"
echo "========================================"

# Upgrade websockets to compatible version
pip3 install --upgrade websockets --quiet 2>/dev/null || pip install --upgrade websockets --quiet 2>/dev/null || true

mkdir -p ~/opendrap-agent

cat > ~/opendrap-agent/agent.py << 'PYEOF'
import asyncio
import json
import os
import subprocess
import sys
import signal

try:
    import websockets
except ImportError:
    os.system('pip3 install websockets --quiet')
    import websockets

WS_URL = '${wsUrl}?sessionId=agent&projectId=default&token=${token}'
MAX_RECONNECT_DELAY = 30

# Track running processes + their streaming tasks so we never get GC'd and can
# stop them on ctrl_c / stop_process.
RUNNING = {}
TASKS = set()

async def run_command(ws, command, command_id):
    # Stream output line-by-line as it arrives. Long-running commands such as a
    # cloudflared tunnel never exit, so buffering until completion would print
    # nothing at all. Streaming surfaces progress (and the tunnel URL) live.
    proc = None
    code = 0
    try:
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            shell=True
        )
        RUNNING[command_id] = proc
        async for line in proc.stdout:
            text = line.decode('utf-8', errors='replace')
            try:
                await ws.send(json.dumps({
                    'type': 'command_output',
                    'command_id': command_id,
                    'output': text
                }))
            except Exception:
                break
        await proc.wait()
        code = proc.returncode if proc.returncode is not None else 0
    except Exception as e:
        try:
            await ws.send(json.dumps({
                'type': 'command_output',
                'command_id': command_id,
                'output': str(e) + '\\n'
            }))
        except Exception:
            pass
        code = 1
    finally:
        RUNNING.pop(command_id, None)
    try:
        await ws.send(json.dumps({
            'type': 'command_completed',
            'command_id': command_id,
            'output': '',
            'status': 'success' if code == 0 else 'error'
        }))
    except Exception:
        pass

def stop_all():
    for cid, proc in list(RUNNING.items()):
        try:
            proc.terminate()
        except Exception:
            pass
        RUNNING.pop(cid, None)

async def heartbeat_loop(ws):
    # Proactively report in every 25s so the server never times us out,
    # even if it doesn't send heartbeat_ping. The server's timeout is 90s.
    while True:
        await asyncio.sleep(25)
        try:
            await ws.send(json.dumps({'type': 'heartbeat'}))
        except Exception:
            return

async def connect():
    attempt = 0
    delay = 1
    while True:
        attempt += 1
        print(f'Connecting to Opendrap (attempt {attempt})...', flush=True)
        try:
            async with websockets.connect(WS_URL) as ws:
                print('Connected!', flush=True)
                delay = 1
                await ws.send(json.dumps({'type': 'agent_connected', 'project_id': 'default'}))
                hb_task = asyncio.create_task(heartbeat_loop(ws))
                try:
                    async for message in ws:
                        try:
                            data = json.loads(message)
                            msg_type = data.get('type', '')
                            if msg_type == 'execute_command':
                                command = data.get('command', '')
                                command_id = data.get('command_id', '')
                                # Run as a background task so long-running commands
                                # (tunnels, dev servers) never block the message loop.
                                t = asyncio.create_task(run_command(ws, command, command_id))
                                TASKS.add(t)
                                t.add_done_callback(TASKS.discard)
                            elif msg_type in ('ctrl_c', 'stop_process'):
                                stop_all()
                            elif msg_type == 'heartbeat_ping':
                                await ws.send(json.dumps({'type': 'heartbeat'}))
                        except Exception as e:
                            print(f'Message error: {e}', flush=True)
                finally:
                    hb_task.cancel()
        except Exception as e:
            print(f'Disconnected: {e}. Reconnecting in {delay}s...', flush=True)
            await asyncio.sleep(delay)
            delay = min(delay * 2, MAX_RECONNECT_DELAY)

if __name__ == '__main__':
    asyncio.run(connect())
PYEOF

cat > ~/opendrap-agent/restart.sh << 'EOF'
#!/bin/bash
pkill -f agent.py 2>/dev/null || true
sleep 1
nohup python3 ~/opendrap-agent/agent.py > ~/opendrap-agent/agent.log 2>&1 &
echo "Agent restarted (PID: $!)"
EOF
chmod +x ~/opendrap-agent/restart.sh

# Remove old auto-start and add fresh one
grep -v 'opendrap-agent' ~/.bashrc > ~/.bashrc.tmp && mv ~/.bashrc.tmp ~/.bashrc
echo 'pgrep -f agent.py > /dev/null || (cd ~/opendrap-agent && nohup python3 agent.py > ~/opendrap-agent/agent.log 2>&1 &)' >> ~/.bashrc

echo "  websockets OK"

pkill -f agent.py 2>/dev/null || true
sleep 1
nohup python3 ~/opendrap-agent/agent.py > ~/opendrap-agent/agent.log 2>&1 &
PID=$!
echo "  Added auto-start to .bashrc"
echo "  Starting agent..."
echo "  Agent running! (PID: $PID)"
echo "  File: ~/opendrap-agent/agent.py"
echo "  Logs: ~/opendrap-agent/agent.log"
echo "  Stop: kill $PID"
echo "  Restart: bash ~/opendrap-agent/restart.sh"
echo "  Auto-restarts on disconnect & Cloud Shell login"
echo "========================================"
`;
  return c.text(script, 200, { 'Content-Type': 'text/plain' });
});

apiRoutes.route('/chat', chat);
apiRoutes.route('/tasks', tasks);
apiRoutes.route('/bugs', bugs);
apiRoutes.route('/users', users);
apiRoutes.route('/auth', auth);
apiRoutes.route('/projects', projects);
apiRoutes.route('/deployments', deployments);
apiRoutes.route('/companies', companies);
apiRoutes.route('/connections', connections);
apiRoutes.route('/search', search);
apiRoutes.route('/terminal', terminal);
apiRoutes.route('/tunnel', tunnel);
apiRoutes.route('/', aiRouter);
apiRoutes.route('/', logsRouter);
apiRoutes.route('/', notificationsRouter);
apiRoutes.route('/', testsRouter);

export default apiRoutes;
