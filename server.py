import asyncio
import json
import os
import sys
import uuid
import socket
import subprocess
import threading
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

import websockets

# Configuration
HTTP_PORT = 8787
WS_PORT = 8788
WORKSPACE = os.path.expanduser('~/opendrap-agent')

# Initialize data stores
sessions = {}
users = {
    'opendrap-demo-2024': {
        'id': 'demo-1',
        'username': 'johndoe',
        'name': 'John Doe',
        'email': 'john@example.com',
        'bio': 'Full-stack developer building with Opendrap',
        'skills': ['React', 'Node.js', 'Docker', 'Kubernetes', 'TypeScript'],
        'company': 'Opendrap Inc.',
        'experience': 'senior',
        'website': 'https://johndoe.dev',
        'github': 'johndoe',
        'createdAt': datetime.now().isoformat()
    }
}

HOSTNAME = socket.gethostname()

UNIX_TO_WIN = {
    'ls': 'dir', 'cat': 'type', 'clear': 'cls', 'pwd': 'cd',
    'rm': 'del', 'mv': 'move', 'cp': 'copy', 'whoami': 'whoami',
    'mkdir': 'mkdir', 'touch': 'type nul >', 'grep': 'findstr',
    'head': '', 'tail': '', 'less': 'more',
}

class TerminalSession:
    def __init__(self):
        self.cwd = os.getcwd()
        self._use_powershell = sys.platform == 'win32'

    def _translate_cmd(self, cmd: str) -> str:
        if not self._use_powershell:
            return cmd
        parts = cmd.split()
        if not parts:
            return cmd
        base = parts[0].lower()
        if base in UNIX_TO_WIN:
            rest = cmd[len(parts[0]):]
            alias = UNIX_TO_WIN[base]
            if not alias:
                return f'echo "(command {base} not available on Windows)"'
            return alias + rest
        return cmd

    async def execute(self, cmd: str) -> dict:
        if cmd.startswith('cd '):
            target = cmd[3:].strip().strip('"').strip("'")
            if not target:
                return {'type': 'terminal_output', 'data': ''}
            if target.startswith('~'):
                target = os.path.expanduser(target)
            new_cwd = os.path.abspath(os.path.join(self.cwd, target)) if not os.path.isabs(target) else target
            if os.path.isdir(new_cwd):
                self.cwd = new_cwd
                return {'type': 'cwd', 'data': self.cwd}
            else:
                return {'type': 'terminal_output', 'data': f'cd: {target}: No such directory'}

        if cmd.strip() == 'pwd':
            return {'type': 'terminal_output', 'data': self.cwd}

        translated = self._translate_cmd(cmd)

        try:
            if self._use_powershell:
                process = await asyncio.create_subprocess_exec(
                    'powershell.exe', '-NoProfile', '-Command', '-',
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                ps_in = f'Set-Location "{self.cwd}"; {translated}\n'
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(input=ps_in.encode()), timeout=30
                )
            else:
                full_cmd = f'cd "{self.cwd}" && {translated}'
                process = await asyncio.create_subprocess_shell(
                    full_cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=30)
            output = stdout.decode(errors='replace') + stderr.decode(errors='replace')
            if not output.strip():
                output = f'(exit code: {process.returncode})'
            return {'type': 'terminal_output', 'data': output}
        except asyncio.TimeoutError:
            return {'type': 'terminal_output', 'data': 'Command timed out after 30s'}
        except Exception as e:
            return {'type': 'terminal_output', 'data': f'Error: {e}'}


async def handle_terminal_ws(websocket):
    session = TerminalSession()

    await websocket.send(json.dumps({
        'type': 'session_ready',
        'agentConnected': True,
        'hostname': HOSTNAME,
        'cwd': session.cwd
    }))

    async for message in websocket:
        try:
            data = json.loads(message)
            if data.get('type') == 'terminal_input':
                cmd = data['input']
                result = await session.execute(cmd)
                await websocket.send(json.dumps(result))
        except json.JSONDecodeError:
            await websocket.send(json.dumps({'type': 'terminal_output', 'data': 'Invalid JSON'}))


class APIServer(BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def send_response_json(self, data, status=200):
        self.send_response(status)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        json_response = json.dumps({'success': True, 'data': data})
        self.wfile.write(json_response.encode())

    def send_error_response(self, message, status=400):
        self.send_response(status)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        json_response = json.dumps({'success': False, 'error': message})
        self.wfile.write(json_response.encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == '/api/auth/me':
            token = self.headers.get('Authorization', '')
            if token.startswith('Bearer '):
                token = token[7:]

            if token in users:
                self.send_response_json(users[token])
            else:
                self.send_error_response('Unauthorized')

        elif path == '/api/health':
            self.send_response_json({'status': 'ok'})

        elif path == '/api/projects':
            self.send_response_json({
                'projects': [
                    {
                        'id': 'p1',
                        'name': 'storefront-web',
                        'repo': 'github.com/johndoe/storefront-web',
                        'branch': 'main',
                        'status': 'deployed',
                        'lastDeploy': '2h ago',
                        'url': 'https://storefront.example.io',
                        'framework': 'nextjs',
                        'visits': '12.4K',
                        'description': 'E-commerce storefront built with Next.js',
                        'members': [],
                        'environment': 'production',
                    },
                    {
                        'id': 'p2',
                        'name': 'api-gateway',
                        'repo': 'github.com/johndoe/api-gateway',
                        'branch': 'main',
                        'status': 'deployed',
                        'lastDeploy': '5h ago',
                        'url': 'https://api.example.io',
                        'framework': 'express',
                        'visits': '87.2K',
                        'description': 'RESTful API gateway with rate limiting',
                        'members': [],
                        'environment': 'production',
                    },
                    {
                        'id': 'p3',
                        'name': 'admin-panel',
                        'repo': 'github.com/johndoe/admin-panel',
                        'branch': 'develop',
                        'status': 'building',
                        'lastDeploy': '15m ago',
                        'url': 'https://admin.example.io',
                        'framework': 'react',
                        'visits': '2.1K',
                        'description': 'Internal admin dashboard',
                        'members': [],
                        'environment': 'staging',
                    },
                ],
                'total': 3
            })

        elif path == '/api/terminal/install.sh':
            self.send_response(200)
            self.send_header('Content-Type', 'application/x-sh')
            self.end_headers()
            install_script = """#!/bin/bash
# Opendrap Agent Install Script
echo "Installing Opendrap Agent..."
cd ~
mkdir -p opendrap-agent
cd opendrap-agent
cat > agent.py << 'EOF'
#!/usr/bin/env python3
import asyncio
import websockets
import json

async def main():
    print("Opendrap Agent starting...")
    ws_url = "ws://localhost:8788"
    try:
        async with websockets.connect(ws_url) as websocket:
            print("Connected to Opendrap server")
            while True:
                msg = await websocket.recv()
                print(f"Received: {msg}")
    except Exception as e:
        print(f"Connection error: {e}")
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
EOF
cat > requirements.txt << 'EOF'
websockets
EOF
chmod +x agent.py
echo "Opendrap Agent installed successfully!"
echo "Run: cd ~/opendrap-agent && python3 agent.py"
"""
            self.wfile.write(install_script.encode())

        elif path == '/api/hostname':
            self.send_response_json({'hostname': HOSTNAME, 'cwd': os.getcwd()})

        else:
            self.send_error_response('Not found')

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode() if content_length > 0 else '{}'
            data = json.loads(body)

            if path == '/api/auth/login':
                email = data.get('email')
                password = data.get('password')
                if email in users and password == 'demo':
                    user = users[email]
                    token = email
                    return self.send_response_json({'token': token, 'user': user})
                else:
                    return self.send_error_response('Invalid credentials')

            elif path == '/api/auth/register':
                username = data.get('username')
                name = data.get('name')
                email = data.get('email')
                password = data.get('password')
                if email in users:
                    return self.send_error_response('Email already exists')
                user = {
                    'id': str(uuid.uuid4()),
                    'username': username,
                    'name': name,
                    'email': email,
                    'bio': '',
                    'skills': [],
                    'company': '',
                    'experience': '',
                    'website': '',
                    'github': '',
                    'createdAt': datetime.now().isoformat()
                }
                users[email] = user
                token = email
                return self.send_response_json({'token': token, 'user': user})

            elif path == '/api/auth/logout':
                return self.send_response_json({'message': 'Logged out'})

            elif path == '/api/terminal/session':
                token = self.headers.get('Authorization', '')
                if token.startswith('Bearer '):
                    token = token[7:]
                if token not in users:
                    return self.send_error_response('Unauthorized')
                session_id = str(uuid.uuid4())
                sessions[session_id] = {
                    'userId': token,
                    'projectId': data.get('projectId', 'default'),
                    'created_at': datetime.now().isoformat()
                }
                return self.send_response_json({'sessionId': session_id})

            else:
                self.send_error_response(f'Unknown endpoint: {path}')

        except json.JSONDecodeError:
            self.send_error_response('Invalid JSON')

    def log_message(self, format, *args):
        pass


async def start_ws_server():
    async with websockets.serve(handle_terminal_ws, 'localhost', WS_PORT):
        print(f"WebSocket terminal server running on ws://localhost:{WS_PORT}")
        await asyncio.Future()


def start_http_server():
    server = HTTPServer(('localhost', HTTP_PORT), APIServer)
    print(f"HTTP API server running on http://localhost:{HTTP_PORT}")
    server.serve_forever()


if __name__ == '__main__':
    try:
        print(f"Starting Opendrap Servers...")
        print(f"Hostname: {HOSTNAME}  |  Workspace: {WORKSPACE}")

        http_thread = threading.Thread(target=start_http_server, daemon=True)
        http_thread.start()

        asyncio.run(start_ws_server())
    except KeyboardInterrupt:
        print("\nServers stopped")
