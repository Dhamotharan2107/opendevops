import asyncio
import json
import os
import uuid
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# Configuration
HTTP_PORT = 8787
WS_PORT = 8787
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

class TerminalMessage:
    def __init__(self, type, data=None, message=None):
        self.type = type
        self.data = data
        self.message = message

    def to_dict(self):
        result = {'type': self.type}
        if self.data is not None:
            result['data'] = self.data
        if self.message is not None:
            result['message'] = self.message
        return result

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
            # Get current user
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
            # Get projects (demo data)
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
            # Return install script
            self.send_response(200)
            self.send_header('Content-Type', 'application/x-sh')
            self.end_headers()
            install_script = """#!/bin/bash
# Opendrap Agent Install Script
# Installation date: $(date)

echo "Installing Opendrap Agent..."
cd ~

# Create workspace
mkdir -p opendrap-agent
cd opendrap-agent

# Create agent.py
cat > agent.py << 'EOF'
#!/usr/bin/env python3
import asyncio
import websockets
import json

async def main():
    print("Opendrap Agent starting...")
    ws_url = "ws://localhost:8787/terminal/ws"
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

# Create requirements.txt
cat > requirements.txt << 'EOF'
websockets
EOF

# Make executable
chmod +x agent.py

echo "Opendrap Agent installed successfully!"
echo "Run: cd ~/opendrap-agent && python3 agent.py"
"""
            self.wfile.write(install_script.encode())

        else:
            self.send_error_response('Not found')

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode() if content_length > 0 else '{}'
            data = json.loads(body)

            if path == '/api/auth/login':
                # Login
                email = data.get('email')
                password = data.get('password')

                if email in users and password == 'demo':
                    user = users[email]
                    token = email  # In real app, generate a JWT
                    return self.send_response_json({'token': token, 'user': user})
                else:
                    return self.send_error_response('Invalid credentials')

            elif path == '/api/auth/register':
                # Register
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
                # Logout
                return self.send_response_json({'message': 'Logged out'})

            elif path == '/api/terminal/session':
                # Create terminal session
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

            elif path == '/api/terminal/ws':
                # WebSocket endpoint for terminal
                # Just accept the connection and send a welcome message
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                ws_response = json.dumps({
                    'type': 'session_ready',
                    'agentConnected': False
                })
                self.wfile.write(ws_response.encode())

            else:
                self.send_error_response(f'Unknown endpoint: {path}')

        except json.JSONDecodeError:
            self.send_error_response('Invalid JSON')

    def log_message(self, format, *args):
        pass  # Disable default logging

if __name__ == '__main__':
    try:
        print(f"Starting Opendrap API Server on port {HTTP_PORT}...")
        print(f"Workspace: {WORKSPACE}")
        server = HTTPServer(('localhost', HTTP_PORT), APIServer)
        print(f"Server running on http://localhost:{HTTP_PORT}")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")
