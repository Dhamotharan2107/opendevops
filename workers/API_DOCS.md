# Opendrap DevOps AI Platform — API Documentation

Base URL: `https://opendrap-api.<your-subdomain>.workers.dev/api`

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## Auth (Phase 3)

### POST /auth/register
Register a new user.

**Body**
```json
{ "username": "john_doe", "email": "john@example.com", "password": "password123", "name": "John Doe" }
```
**Response 201**
```json
{ "success": true, "data": { "token": "<jwt>", "user": { "id": "...", "username": "john_doe", "email": "john@example.com" } } }
```
**Errors**: 400 email/username already in use, 400 validation failed

---

### POST /auth/login
**Body**
```json
{ "email": "john@example.com", "password": "password123" }
```
**Response 200**
```json
{ "success": true, "data": { "token": "<jwt>", "user": { ... } } }
```
**Errors**: 401 invalid credentials

---

### POST /auth/logout
Protected. Invalidates session client-side.

**Response 200**
```json
{ "success": true, "data": { "message": "Logged out successfully" } }
```

---

### GET /auth/me
Protected. Returns current user.

**Response 200**
```json
{ "success": true, "data": { "user": { "id": "...", "username": "...", "email": "..." } } }
```

---

### GET /auth/google
Redirects to Google OAuth consent screen.

### GET /auth/google/callback?code=
Exchanges code for token, redirects to `FRONTEND_URL/auth/callback?token=<jwt>`

### GET /auth/github
Redirects to GitHub OAuth consent screen.

### GET /auth/github/callback?code=
Exchanges code for token, redirects to `FRONTEND_URL/auth/callback?token=<jwt>`

---

## Users (Phase 4)

### GET /users
Protected. List/search users.

**Query**: `q` (search), `page`, `limit`

**Response 200**
```json
{ "success": true, "data": { "users": [...], "total": 100, "page": 1, "limit": 10 } }
```

---

### GET /users/:id
Protected. Get user by ID.

**Response 200**
```json
{ "success": true, "data": { "user": { "id": "...", "username": "...", "skills": "...", "bio": "..." } } }
```
**Errors**: 404 user not found

---

### PATCH /users/:id
Protected. Update own profile only.

**Body** (all optional)
```json
{ "name": "John", "bio": "Developer", "skills": "TypeScript, React", "website": "https://john.dev", "github": "johndoe" }
```
**Response 200**
```json
{ "success": true, "data": { "user": { ... } } }
```
**Errors**: 401 can only update own profile, 400 validation

---

### DELETE /users/:id
Protected. Delete own account only.

**Response 200**
```json
{ "success": true, "data": { "message": "User deleted successfully" } }
```

---

## Search (Phase 5)

### GET /search?q=<query>
Protected. Global search across users, companies, projects.

**Query**: `q` (required), `page`, `limit`

**Response 200**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "companies": [...],
    "projects": [...],
    "page": 1,
    "limit": 10
  }
}
```

---

## Connections (Phase 6)

### POST /connections/request
Protected.

**Body**
```json
{ "receiverId": "<user-uuid>" }
```
**Response 201**
```json
{ "success": true, "data": { "id": "...", "status": "pending" } }
```
**Errors**: 400 cannot self-request, 400 connection exists

---

### POST /connections/accept
Protected.

**Body**
```json
{ "connectionId": "<uuid>" }
```
**Response 200**
```json
{ "success": true, "data": { "id": "...", "status": "accepted" } }
```

---

### POST /connections/reject
Protected.

**Body**
```json
{ "connectionId": "<uuid>" }
```
**Response 200**
```json
{ "success": true, "data": { "id": "...", "status": "rejected" } }
```

---

### DELETE /connections/:id
Protected. Remove an existing connection.

**Response 200**
```json
{ "success": true, "data": { "message": "Connection removed" } }
```

---

## Companies (Phase 7)

### POST /companies
Protected.

**Body**
```json
{ "name": "Acme Corp", "description": "...", "website": "https://acme.com", "tech_stack": "React, Node.js" }
```
**Response 201**
```json
{ "success": true, "data": { "id": "...", "name": "Acme Corp", ... } }
```

---

### GET /companies
Protected. List or search companies.

**Query**: `search`, `page`, `limit`

**Response 200**
```json
{ "success": true, "data": { "companies": [...], "total": 50 } }
```

---

### GET /companies/:id
Protected. Get company with members.

**Response 200**
```json
{ "success": true, "data": { "id": "...", "name": "...", "members": [...] } }
```

---

### POST /companies/:id/join
Protected.

**Response 201**
```json
{ "success": true, "data": { "message": "Joined company" } }
```

---

### POST /companies/:id/leave
Protected.

**Response 200**
```json
{ "success": true, "data": { "message": "Left company" } }
```

---

## Projects (Phase 8)

### POST /projects
Protected.

**Body**
```json
{
  "name": "My App",
  "description": "...",
  "repo_url": "https://github.com/user/repo",
  "repo_provider": "github",
  "branch": "main",
  "framework": "nextjs",
  "build_command": "npm run build",
  "start_command": "npm start",
  "environment": "NODE_ENV=production",
  "company_id": "<optional-uuid>"
}
```
**Response 201**
```json
{ "success": true, "data": { "id": "...", "status": "creating", ... } }
```

---

### GET /projects
Protected. List projects the user is a member of.

**Query**: `page`, `limit`

---

### GET /projects/:id
Protected. Get project with members.

---

### PATCH /projects/:id
Protected. Owner/developer only.

**Body** (all optional): same fields as create, plus `status`, `tunnel_url`

---

### DELETE /projects/:id
Protected. Owner only.

---

### POST /projects/:id/members
Protected. Owner/developer only.

**Body**
```json
{ "userId": "<uuid>", "role": "developer", "permissions": "read,write" }
```

---

### DELETE /projects/:id/members/:userId
Protected. Owner/developer only.

---

### PATCH /projects/:id/members/:userId
Protected. Owner only.

**Body**
```json
{ "role": "viewer" }
```

---

## Chat — REST (Phase 9)

### POST /chat
Protected. Create a chat.

**Body**
```json
{ "type": "private", "member_ids": ["<uuid>"] }
```
or
```json
{ "type": "group", "name": "Team Chat", "member_ids": ["<uuid1>", "<uuid2>"] }
```

---

### GET /chat
Protected. List user's chats.

---

### GET /chat/:id
Protected. Get chat with members.

---

### GET /chat/:id/messages
Protected. Paginated messages.

---

### POST /chat/:id/messages
Protected. Send a message.

**Body**
```json
{ "text": "Hello!", "file_url": "", "file_type": "", "file_name": "" }
```

---

### WebSocket: GET /chat/:id/ws
Upgrade to WebSocket. Real-time chat via `ChatDurableObject`.

**Client sends:**
```json
{ "type": "ping" }
```
**Server sends:**
```json
{ "type": "new_message", "message": { ... } }
{ "type": "user_left" }
{ "type": "pong" }
```

---

## Tasks (Phase 10)

### POST /tasks
Protected.

**Body**
```json
{ "project_id": "<uuid>", "title": "Fix login bug", "priority": "high", "status": "todo", "assignee_id": "<uuid>", "due_date": "2025-12-31T00:00:00.000Z" }
```

---

### GET /tasks?project_id=<uuid>
Protected.

**Query**: `project_id` (required), `status`, `priority`, `assignee_id`, `page`, `limit`

---

### GET /tasks/:id
Protected. Returns task + comments.

---

### PATCH /tasks/:id
Protected. Update any field.

---

### DELETE /tasks/:id
Protected.

---

### POST /tasks/:id/comments
Protected.

**Body**
```json
{ "text": "Looking into this." }
```

---

### GET /tasks/:id/comments
Protected.

---

## Bugs (Phase 11)

### POST /bugs
Protected.

**Body**
```json
{
  "project_id": "<uuid>",
  "title": "Crash on login",
  "description": "App crashes when...",
  "priority": "critical",
  "screenshot_url": "https://...",
  "video_url": "https://...",
  "assigned_to": "<uuid>"
}
```

---

### GET /bugs?project_id=<uuid>
Protected.

**Query**: `project_id` (required), `status`, `priority`, `page`, `limit`

---

### GET /bugs/:id
Protected. Returns bug + comments.

---

### PATCH /bugs/:id
Protected.

**Body** (all optional): `title`, `description`, `status`, `priority`, `assigned_to`, `screenshot_url`, `video_url`

**Status values**: `open` | `in-progress` | `testing` | `fixed` | `closed`

---

### POST /bugs/:id/comments
Protected.

**Body**
```json
{ "text": "Reproduced on v2.1." }
```

---

## Agent (Phase 12)

### WebSocket: GET /agent/:projectId/ws
Agent (Python) connects here. Messages via `AgentDurableObject`.

**Agent sends:**
```json
{ "type": "agent_connected", "project_id": "<uuid>" }
{ "type": "heartbeat" }
{ "type": "log_received", "project_id": "<uuid>", "log": "..." }
{ "type": "command_completed", "command_id": "<uuid>", "output": "...", "status": "success" }
```

**Server sends:**
```json
{ "type": "heartbeat_ping" }
{ "type": "execute_command", "command_id": "<uuid>", "command": "npm install" }
```

---

## Terminal (Phase 13)

### POST /terminal/session
Protected.

**Body**
```json
{ "projectId": "<uuid>" }
```
**Response 201**
```json
{ "success": true, "data": { "sessionId": "<uuid>" } }
```

---

### WebSocket: GET /terminal/:sessionId/ws?projectId=<uuid>
Upgrade to WebSocket. Real-time terminal via `TerminalDurableObject`.

**Client sends:**
```json
{ "type": "terminal_input", "input": "ls -la" }
{ "type": "terminal_resize", "cols": 80, "rows": 24 }
{ "type": "keepalive" }
```
**Server sends:**
```json
{ "type": "terminal_output", "data": "total 32\n..." }
{ "type": "keepalive_ack" }
```

---

## Deployments (Phase 14)

### POST /deployments
Protected.

**Body**
```json
{ "project_id": "<uuid>", "branch": "main", "commit_hash": "abc123", "commit_message": "fix: login" }
```
**Response 201**
```json
{ "success": true, "data": { "id": "...", "version": "v1.0.1", "status": "pending" } }
```

---

### GET /deployments?projectId=<uuid>
Protected.

**Query**: `projectId` (required), `page`, `limit`

---

### GET /deployments/:id
Protected.

---

### PATCH /deployments/:id
Protected. Update status/logs.

**Body**
```json
{ "status": "success", "logs": "Build output..." }
```

---

## Tunnel (Phase 15)

### POST /tunnel/start
Protected.

**Body**
```json
{ "projectId": "<uuid>", "port": 3000 }
```
**Response 200**
```json
{ "success": true, "data": { "tunnel_url": "https://opendrap-xxxx.trycloudflare.com", "port": 3000 } }
```

---

### POST /tunnel/stop
Protected.

**Body**
```json
{ "projectId": "<uuid>" }
```
**Response 200**
```json
{ "success": true, "data": { "tunnel_url": null } }
```

---

### GET /tunnel/status?projectId=<uuid>
Protected.

**Response 200**
```json
{ "success": true, "data": { "active": true, "tunnel_url": "https://..." } }
```

---

## Logs & Monitoring (Phase 16)

### GET /logs?projectId=<uuid>
Protected.

**Query**: `projectId` (required), `level`, `search`, `page`, `limit`

**Response 200**
```json
{ "success": true, "data": { "logs": [...], "total": 200 } }
```

---

### GET /errors?projectId=<uuid>
Protected.

**Query**: `projectId` (required), `severity`, `status`, `page`, `limit`

**Response 200**
```json
{ "success": true, "data": { "errors": [...], "total": 10 } }
```

---

### PATCH /errors/:id
Protected.

**Body**
```json
{ "status": "resolved" }
```

---

## AI Testing (Phase 17)

### POST /ai/analyze-log
Protected.

**Body**
```json
{ "log": "Error: Cannot read property..." }
```
**Response 200**
```json
{ "success": true, "data": { "rootCause": "...", "suggestedFix": "...", "confidenceScore": 0.92 } }
```

---

### POST /ai/analyze-bug
Protected.

**Body**
```json
{ "logs": "...", "traceback": "...", "screenshot": "description" }
```
**Response 200**
```json
{ "success": true, "data": { "summary": "...", "possibleCauses": [...], "suggestedFix": "...", "priority": "high" } }
```

---

### POST /ai/generate-tests
Protected.

**Body**
```json
{ "prompt": "Test the login flow of my app at https://..." }
```
**Response 200**
```json
{ "success": true, "data": { "testCases": [{ "name": "...", "steps": [...], "expectedResults": [...] }] } }
```

---

## Playwright Tests (Phase 18)

### POST /tests/run
Protected.

**Body**
```json
{ "projectId": "<uuid>", "config": "{ \"url\": \"https://...\" }" }
```
**Response 201**
```json
{ "success": true, "data": { "id": "...", "status": "pending" } }
```

---

### GET /tests/:id
Protected.

**Response 200**
```json
{ "success": true, "data": { "id": "...", "status": "completed", "test_results": "...", "screenshots": "..." } }
```

---

## Notifications (Phase 19)

### GET /notifications
Protected.

**Query**: `page`, `limit`

**Response 200**
```json
{ "success": true, "data": { "notifications": [...], "total": 50 } }
```

---

### PATCH /notifications/:id/read
Protected.

**Response 200**
```json
{ "success": true, "data": null }
```

---

### PATCH /notifications/read-all
Protected. Mark all as read.

---

### GET /notifications/unread-count
Protected.

**Response 200**
```json
{ "success": true, "data": { "count": 3 } }
```

---

### WebSocket: GET /notifications/ws
Protected. Real-time notifications via `NotificationDurableObject`.

**Server sends:**
```json
{
  "type": "notification",
  "title": "Task Assigned",
  "message": "You have been assigned a task.",
  "notificationType": "task",
  "link": "/tasks/uuid",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## Error Responses

All errors follow this format:
```json
{ "success": false, "error": "Error message here", "code": "ERROR_CODE" }
```

| Code | HTTP | Meaning |
|------|------|---------|
| UNAUTHORIZED | 401 | Missing/invalid/expired token |
| FORBIDDEN | 403 | Not allowed to perform action |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request body |
| — | 500 | Internal server error |

---

## TypeScript Types

See `workers/src/types/index.ts` for all interfaces:
`User`, `Company`, `Connection`, `Project`, `ProjectMember`, `Deployment`, `AgentSession`, `Task`, `TaskComment`, `Bug`, `BugComment`, `Chat`, `ChatMember`, `Message`, `Notification`, `ActivityLog`, `APICollection`, `APIRequest`, `AITestRun`, `ErrorLog`

See `workers/src/validators/index.ts` for all Zod schemas.
