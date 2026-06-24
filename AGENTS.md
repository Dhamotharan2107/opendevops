# AGENTS.md

## Overview

Opendrap DevOps AI Platform is a full-stack development platform combining a React frontend with a Cloudflare Workers backend. It provides:

- **Frontend**: React + TypeScript + Vite, uses MUI (Material UI) + Radix UI components, styled with Tailwind CSS v4
- **Backend**: Cloudflare Workers API using Hono framework, D1 database, Durable Objects
- **Agent**: JavaScript-based agent that connects via WebSocket to execute shell commands (Node.js)
- **Terminal**: Real-time shell execution with support for both local and remote agents

## Project Structure

```
.
├── src/                      # Frontend React application
│   ├── app/                  # Main app pages
│   │   ├── pages/            # Individual pages (Login, Projects, Admin, etc.)
│   │   ├── components/       # Reusable UI components (dashboard, modals, etc.)
│   │   └── ui/               # Radix UI component wrappers
│   ├── lib/
│   │   ├── store.tsx         # Global state management (useReducer)
│   │   ├── types.ts          # TypeScript interfaces (User, Project, Task, etc.)
│   │   ├── api.ts            # API client functions
│   │   └── adminApi.ts       # Admin-specific API calls
│   ├── styles/               # CSS files (animations, fonts, themes)
│   ├── main.tsx              # Entry point
│   └── App.tsx               # Root component
├── workers/                  # Cloudflare Workers backend
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   │   ├── auth.ts
│   │   │   ├── projects.ts
│   │   │   ├── deployments.ts
│   │   │   ├── terminal.ts
│   │   │   ├── ai.ts
│   │   │   ├── bugs.ts
│   │   │   └── ... (20+ route files)
│   │   ├── controllers/      # Business logic (validates, calls repositories)
│   │   ├── repositories/     # Data access layer
│   │   ├── durable-objects/  # Stateful background actors (Chat, Terminal, Agent, Notification)
│   │   ├── middleware/       # Auth and admin middleware
│   │   ├── ai/               # AI-related services
│   │   ├── utils/            # Helpers (errors, validation, access control)
│   │   ├── types/            # Worker types (Env, request/response)
│   │   ├── validators/       # Zod validation schemas
│   │   └── index.ts          # Main worker entry point
│   ├── migrations/           # SQL database migrations
│   ├── wrangler.toml         # Worker configuration
│   └── package.json
├── package.json              # Root frontend dependencies
├── server.py                 # Standalone Python server (local dev, WebSocket terminal)
├── ecosystem.config.cjs      # PM2 configuration for local dev
├── start.bat                 # Start both frontend and worker locally
└── live.bat                  # Start local dev with multiple windows
```

## Essential Commands

### Frontend (root)
```bash
npm install          # Install dependencies (uses pnpm workspace)
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Build for production (dist/)
```

### Workers (workers/ directory)
```bash
cd workers
npm install          # Install worker dependencies
npm run dev          # Start local Workers dev server (http://localhost:8787)
npm run deploy       # Deploy to Cloudflare Workers
npm run migrate      # Apply D1 database migrations
npm run types        # Generate TypeScript types from schema
```

### Local Development
```bash
# Option 1: Single window with both services (live.bat)
live.bat

# Option 2: PM2 managed process (ecosystem.config.cjs)
pm2 start ecosystem.config.cjs

# Option 3: Manual (see below)
# Terminal 1: cd workers && npm run dev
# Terminal 2: npm run dev
```

### Database
```bash
cd workers
wrangler d1 migrations apply opendrap-db --local
wrangler d1 migrations apply opendrap-db
```

## Architecture & Control Flow

### Frontend Architecture
- **State Management**: Global `AppContext` using `useReducer` with typed actions
- **API Layer**: `src/lib/api.ts` - wraps fetch calls with error handling and auth
- **Routing**: React Router 7, client-side routing with page components in `src/app/pages/`
- **UI Components**: Material UI + Radix UI primitives, styled with Tailwind CSS v4
- **Build Tool**: Vite 6 with custom plugin for Figma asset resolution

**Key patterns**:
- Pages in `app/pages/` are route-specific components
- `components/` contains shared UI (DashboardLayout, GlobalSearch, etc.)
- `ui/` contains wrapper components for Radix primitives
- All pages use `AppProvider` from `store.tsx`

### Backend Architecture
- **Framework**: Hono (Cloudflare Workers HTTP router)
- **Routing**: Route groups in `src/routes/` (auth, projects, terminal, etc.)
- **Controllers**: Business logic in `src/controllers/` (validates input, calls repos)
- **Repositories**: Data access layer in `src/repositories/`
- **Validation**: Zod schemas in `src/validators/`
- **Error Handling**: Custom error classes (ValidationError, NotFoundError, UnauthorizedError)
- **Middleware**: Auth and admin middleware in `src/middleware/`

**Request flow**:
```
HTTP Request → Route Handler (routes/) → Controller (business logic)
  → Repository (DB operations) → D1 Database (or Durable Object)
  → Response (success/error)
```

### Durable Objects
- **ChatDurableObject**: Persistent chat state with WebSocket support
- **AgentDurableObject**: Manages agent sessions and authentication
- **TerminalDurableObject**: Manages terminal sessions, buffers, and agent heartbeat
- **NotificationDurableObject**: Manages push notifications

**Terminal Flow**:
1. Browser opens WebSocket connection to `/ws` endpoint
2. `TerminalDurableObject` creates session and stores in `sessions` Map
3. If agent connected, forwards messages to agent session
4. Agent executes commands and streams output back via WebSocket
5. Output is buffered and sent to all connected clients

**Agent Heartbeat**:
- Agent sends `agent_connected` message with hostname info
- Durable Object stores session ID and last heartbeat timestamp
- Heartbeat checked on cold starts (90s timeout, 3min validity)
- Agent disconnects automatically if heartbeat stops

### Data Flow
```
Frontend (React) → API Client → Cloudflare Workers
                                      ↓
                                    Repositories
                                      ↓
                                    D1 Database
                                      ↓
                                Durable Objects (for stateful ops)
```

## Naming Conventions

### File Structure
- **Components**: PascalCase (e.g., `ProjectDetails.tsx`, `DashboardLayout.tsx`)
- **Utility files**: camelCase (e.g., `api.ts`, `utils.ts`, `helpers.ts`)
- **Pages**: PascalCase with "Page" suffix (e.g., `ProjectsPage.tsx`)
- **Controllers**: noun-based (e.g., `projects.ts`, `auth.ts`)
- **Repositories**: noun-based with "Repository" suffix (e.g., `project.ts`)
- **Validators**: verb-based or noun-based (e.g., `index.ts`, `project.ts`)
- **Routes**: noun-based (e.g., `auth.ts`, `projects.ts`)
- **Durable Objects**: DO suffix (e.g., `chat-do.ts`, `terminal.ts`)

### Code Patterns
- **Controllers**: Export functions that accept `Context<{ Bindings: Env }>` and return `Response`
- **Repositories**: Export classes with methods like `create()`, `findAll()`, `findById()`, `update()`, `delete()`
- **Error handling**: Always use typed error classes, throw with descriptive messages
- **API responses**: Use `successResponse()` and `errorResponse()` helpers from `utils/helpers.ts`
- **Validation**: Use Zod schemas with `.safeParse()` and throw `ValidationError` on failure
- **Auth**: Use `c.get('userId')` middleware to get authenticated user ID
- **Admin check**: Use `checkAdmin()` middleware for admin-only routes

### TypeScript
- Use `interface` for public contracts (User, Project, etc. in `lib/types.ts` and `workers/src/types/`)
- Use `type` for unions and literals where appropriate
- Strict mode enabled in both tsconfigs
- No implicit any types

## Key Gotchas & Non-Obvious Patterns

### Authentication Flow
- **Frontend**: Uses JWT-like tokens (email or token in `users` dict for demo, JWT in production)
- **Worker**: Token comes from `Authorization` header (Bearer prefix stripped)
- **Auth Middleware**: `c.get('userId')` extracts user ID from token, sets on context
- **Demo Mode**: `server.py` has hardcoded demo user (`johndoe@example.com` / `demo`)
- **Local Dev**: Frontend proxy to `localhost:8787` (Vite config), no CORS issues

### Terminal & Agent
- **Two terminal modes**:
  1. **Local**: Python server on port 8787 with `ThreadingHTTPServer`, connects via WebSocket
  2. **Remote Agent**: Agent script on Cloud Shell, connects to Durable Object via WebSocket
- **Command translation**: Windows commands translated (e.g., `ls` → `dir`, `cat` → `type`) in Python server
- **Session persistence**: Terminal sessions stored in Durable Object's `sessions` Map
- **Buffer**: Command output is buffered and replayed to new WebSocket connections
- **Agent ID**: Special session ID `'agent'` reserved for agent connections

### Database
- **D1 Database**: SQLite-based, migrations in `workers/migrations/`
- **Default project**: `default` project ID used for logging when not specified
- **Column naming**: Snake_case in database (e.g., `user_id`, `created_at`), PascalCase in TypeScript
- **Migrations**: Apply with `wrangler d1 migrations apply opendrap-db [--local]`

### CORS Configuration
- **Strict origins**: Only whitelisted origins allowed, no wildcards (except `*` for public endpoints)
- **Worker**: CORS middleware checks `FRONTEND_URL` env var plus hardcoded localhost origins
- **Python server**: Allows localhost origins in `ALLOWED_ORIGINS` list

### Error Handling Patterns
- **404**: Throw `NotFoundError` (includes 404 status)
- **Validation**: Throw `ValidationError` (includes 400 status)
- **Unauthorized**: Throw `UnauthorizedError` (includes 403 status)
- **Not found in data**: Throw `NotFoundError` with custom message
- **Response helpers**: Use `successResponse()` and `errorResponse()` helpers

### API Response Format
All successful responses: `{ success: true, data: T }`
All error responses: `{ success: false, error: string }`
Controller methods should use these helpers for consistency

### Hono Specifics
- **Route groups**: Use `app.route('/api/feature', router)` where `router` is Hono instance
- **Context**: `Context<{ Bindings: Env }>` provides `env` for D1 and Durable Object bindings
- **Async/await**: All DB and Durable Object calls are async
- **Worker types**: Need `@cloudflare/workers-types` for type checking

### Frontend Build
- **Figma assets**: Custom Vite plugin resolves `figma:asset/` imports to local files in `src/assets/`
- **Tailwind v4**: Uses `@tailwindcss/vite` plugin (enabled even if not actively used)
- **No separate CSS build**: Tailwind runs in dev mode, static build uses pre-built CSS

### Development Server Configuration
- **Vite proxy**: `/api` requests proxied to `http://localhost:8787` (Workers dev server)
- **Workers dev**: Runs on port 8787, exposes same routes to frontend
- **Hot reload**: Both Vite and Wrangler support hot reload during development

## Testing
- **No test files found** in current state
- Test infrastructure not configured
- Manual testing recommended for changes
- Use browser DevTools and `server.py` terminal for debugging

## Environment Variables
- **Workers**: Configured in `wrangler.toml` [vars] section, secrets via `wrangler secret put`
- **Frontend**: `.env` file for build-time variables (currently only VITE_API_URL)
- **Agent install**: Script fetches `https://opendrap-api.tert.workers.dev/api/install.sh`

## Important Paths & URLs
- **Frontend dev**: `http://localhost:5173`
- **Workers dev**: `http://localhost:8787`
- **Production API**: `https://opendrap-api.tert.workers.dev`
- **Frontend production**: `https://openddevops.pages.dev`
- **D1 DB name**: `opendrap-db`, binding: `DB`
- **Agent install script**: `/api/install.sh` with optional `?token=...` query param

## Common Workflows

### Adding a New API Route
1. Create controller in `workers/src/controllers/` with business logic
2. Create validator in `workers/src/validators/` (Zod schema)
3. Create repository in `workers/src/repositories/` for DB ops
4. Create route handler in `workers/src/routes/` using controller
5. Register route in `workers/src/index.ts` with `app.route('/api/feature', router)`
6. Create corresponding page in `src/app/pages/` or update existing

### Modifying Terminal/Agent Behavior
1. Update `TerminalDurableObject` in `workers/src/durable-objects/terminal.ts`
2. If adding new features, update agent script or communication protocol
3. Consider persistence: Durable Objects persist state, check cold start handling
4. Test both local (Python server) and remote (agent) modes

### Database Schema Changes
1. Create migration in `workers/migrations/` (000X_description.sql)
2. Add SQL ALTER TABLE statements
3. Update TypeScript interfaces in both:
   - `src/lib/types.ts`
   - `workers/src/types/`
4. Update repositories if column names change
5. Run `npm run migrate` to apply

### Frontend State Updates
1. Add action to `Action` union type in `store.tsx`
2. Add case to `appReducer` switch statement
3. Dispatch action from components via `useContext(AppContext)`
4. All state changes go through reducer (no direct mutations)
5. Persist agent state to localStorage in reducer

## Dependencies & Versions
- **Frontend**: React 18.3.1, React Router 7.13.0, Material UI 7.3.5, Tailwind CSS 4.1.12
- **Backend**: Hono 4.7.0, Zod 3.24.0, Wrangler 3.107.0
- **Build**: Vite 6.3.5, TypeScript 5.7.0
- **Runtime**: Node.js (agent), Python 3 (local terminal server)
- **Package manager**: pnpm workspace configuration in `pnpm-workspace.yaml`

## Troubleshooting
- **Terminal not working**: Check agent is installed and connected, verify WebSocket URL
- **Auth failing**: Check token in Authorization header, verify user exists in database
- **DB errors**: Check migration status, verify D1 binding in worker config
- **CORS errors**: Verify origin is whitelisted in CORS middleware
- **Build errors**: Check TypeScript strict mode, verify all imports are valid
