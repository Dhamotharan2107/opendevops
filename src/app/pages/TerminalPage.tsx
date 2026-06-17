import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Terminal, Circle, Copy, Trash2, Wifi, WifiOff, Shield } from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { BASE_URL } from '@/lib/api';

const WORKSPACE = '~/opendev';
const PROMPT_USER = 'opendev@workspace';

const BLOCKED_PATTERNS = [
  /^sudo(\s|$)/i,
  /^su(\s|$)/i,
  /^passwd(\s|$)/i,
  /^useradd(\s|$)/i,
  /^usermod(\s|$)/i,
  /^rm\s+-rf\s+\//i,
  /^shutdown(\s|$)/i,
  /^reboot(\s|$)/i,
  /^poweroff(\s|$)/i,
  /^init\s+0/i,
  /^kill\s+-9\s+1/i,
];

const WORKSPACE_FILES: Record<string, string[]> = {
  [WORKSPACE]: ['agent/', 'projects/', 'logs/', 'config/', 'temp/'],
  [`${WORKSPACE}/agent`]: ['agent.py', 'requirements.txt', 'startup.sh'],
  [`${WORKSPACE}/projects`]: ['(run: mkdir -p ~/opendev/projects to create, then git clone your repo here)'],
  [`${WORKSPACE}/logs`]: ['agent.log', 'system.log'],
  [`${WORKSPACE}/config`]: ['settings.json', 'auth.json'],
  [`${WORKSPACE}/temp`]: ['(empty)'],
};

const HELP_TEXT = `Opendrap Workspace Terminal v1.0.0
Workspace: ${WORKSPACE}  |  Isolation: ON  |  Sudo: BLOCKED

Available commands:
  help        Show this help message
  clear       Clear the terminal
  ls [path]   List files in workspace directory
  pwd         Print working directory
  cd [dir]    Change directory (restricted to ${WORKSPACE})
  whoami      Show current user info
  projects    List your projects
  env         Show workspace environment
  cat [file]  Show file contents
  mkdir [dir] Create directory in workspace
  version     Show platform version
  echo [text] Print text
  date        Show current date/time`;

function getWsBaseUrl() {
  const envWs = import.meta.env.VITE_WS_URL;
  if (envWs) return envWs;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787/api';
  if (apiUrl.startsWith('/')) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
  }
  return apiUrl.replace(/\/api\/?$/, '').replace('https://', 'wss://').replace('http://', 'ws://');
}
const WS_URL = getWsBaseUrl();

type Handler = (args: string, user: any, projects: any[], cwd: string) => string;

const RESPONSES: Record<string, Handler> = {
  help: () => HELP_TEXT,
  whoami: (_, user) => user
    ? `User:     ${user.name} (${user.email})\nUsername: ${user.username}\nWorkspace: ${WORKSPACE}\nPrivileges: standard (no root)`
    : 'Not logged in',
  version: () => 'Opendrap DevOps AI Platform v0.1.0\nRuntime: Cloudflare Workers\nAgent SDK: Python 3.11\nWorkspace: ~/opendev (sandboxed)',
  echo: (args) => args || '',
  date: () => new Date().toLocaleString(),
  pwd: (_a, _u, _p, cwd) => cwd,
  env: () => `WORKSPACE=${WORKSPACE}\nSHELL=/bin/bash\nTERM=xterm-256color\nPATH=/usr/bin:/bin\nOPENDRAP_VERSION=0.1.0`,
  projects: (_, _u, projects) => projects.length === 0
    ? `No projects found.\nCreate one at the Projects page or run: mkdir projects/my-new-project`
    : projects.map((p, i) => `${i + 1}. ${p.name}\n   Status: ${p.status}  Repo: ${p.repo}`).join('\n\n'),
  ls: (args, _u, _p, cwd) => {
    const target = args
      ? args.startsWith('~') ? args.replace('~', '~') : `${cwd}/${args}`.replace(/\/+/g, '/')
      : cwd;
    const normalized = target.replace(/\/+$/, '');
    const key = Object.keys(WORKSPACE_FILES).find((k) => k === normalized || `~/${k.split('~/')[1]}` === normalized);
    const entries = key ? WORKSPACE_FILES[key] : null;
    if (!entries) return `ls: cannot access '${args || cwd}': No such file or directory`;
    return entries.join('\n');
  },
  cat: (args) => {
    if (!args) return 'cat: missing file operand';
    if (args.includes('agent.py')) return `#!/usr/bin/env python3\n# Opendrap Agent v0.1.0\nimport asyncio, websockets, json\n\nasync def main():\n    print("Opendrap Agent starting...")\n    # connects to wss://opendrap-api.tert.workers.dev/ws\n    ...\n\nasyncio.run(main())`;
    if (args.includes('settings.json')) return JSON.stringify({ workspace: WORKSPACE, isolation: true, logLevel: 'info', maxProjects: 10 }, null, 2);
    if (args.includes('agent.log')) return `[2024-01-15 10:23:01] Agent started\n[2024-01-15 10:23:02] Connected to Opendrap Cloud\n[2024-01-15 10:23:05] Workspace initialized at ${WORKSPACE}`;
    return `cat: ${args}: No such file or directory`;
  },
  mkdir: (args, _u, _p, cwd) => {
    if (!args) return 'mkdir: missing operand';
    if (args.startsWith('/')) return `mkdir: cannot create directory outside ${WORKSPACE}`;
    return `Directory created: ${cwd}/${args}`;
  },
};

interface TermLine {
  type: 'input' | 'output' | 'error' | 'system' | 'blocked';
  text: string;
}

function getToken() {
  return localStorage.getItem('token');
}

export function TerminalPage() {
  const { state, dispatch } = useApp();
  const { user, projects } = state;

  const [cwd, setCwd] = useState(WORKSPACE);
  const [lines, setLines] = useState<TermLine[]>([
    { type: 'system', text: HELP_TEXT },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const sendToWs = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const projectId = 'default';
    let sessionId = 'default';

    // Poll agent status immediately on mount so UI shows correct state before WS connects
    fetch(`${BASE_URL}/terminal/history?sessionId=agent&projectId=${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then((d: any) => {
      if (d?.data?.agentConnected) {
        dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: true, lastSeen: new Date().toISOString() } });
      }
    }).catch(() => {});

    async function connect() {
      try {
        const wsUrl = `${WS_URL}/api/terminal/ws?sessionId=browser&projectId=${projectId}&token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
          setLines((prev) => [...prev, { type: 'system', text: 'Terminal connected. Waiting for agent...' }]);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'terminal_output') {
              setLines((prev) => [...prev, { type: 'output', text: msg.data }]);
            } else if (msg.type === 'agent_connected') {
              dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: true, lastSeen: new Date().toISOString() } });
              setLines((prev) => [...prev, { type: 'system', text: msg.message || 'Agent connected.' }]);
            } else if (msg.type === 'agent_disconnected') {
              dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: false } });
              setLines((prev) => [...prev, { type: 'system', text: msg.message || 'Agent disconnected.' }]);
            } else if (msg.type === 'session_ready') {
              if (msg.agentConnected) {
                dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: true, lastSeen: new Date().toISOString() } });
              }
            } else if (msg.type === 'error') {
              setLines((prev) => [...prev, { type: 'error', text: msg.message }]);
            }
          } catch {}
        };

        ws.onclose = () => {
          setWsConnected(false);
          dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: false } });
        };

        ws.onerror = () => {
          setWsConnected(false);
        };

        wsRef.current = ws;
      } catch {
        setLines((prev) => [...prev, { type: 'system', text: 'Terminal started in simulation mode. Connect to the agent to enable live terminal.' }]);
      }
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [dispatch]);

  const isBlocked = (cmd: string) => BLOCKED_PATTERNS.some((re) => re.test(cmd));

  const submit = () => {
    const cmd = input.trim();
    if (!cmd) return;
    setHistory((h) => [cmd, ...h]);
    setHistIdx(-1);
    setInput('');

    const prompt = `${PROMPT_USER}:${cwd}$ ${cmd}`;
    const newLines: TermLine[] = [{ type: 'input', text: prompt }];

    if (cmd === 'clear') { setLines([]); return; }

    if (isBlocked(cmd)) {
      newLines.push({
        type: 'blocked',
        text: `Permission denied by Opendrap Workspace Security\nBlocked command: ${cmd.split(' ')[0]}\nReason: Privileged operations are restricted in the ~/opendev sandbox.`,
      });
      setLines((prev) => [...prev, ...newLines]);
      return;
    }

    const [base, ...argParts] = cmd.split(' ');
    const args = argParts.join(' ');

    if (base === 'cd') {
      if (!args || args === '~' || args === WORKSPACE) {
        setCwd(WORKSPACE);
        setLines((prev) => [...prev, ...newLines]);
      } else if (args.startsWith('/')) {
        newLines.push({ type: 'error', text: `cd: ${args}: Access denied — terminal is restricted to ${WORKSPACE}` });
        setLines((prev) => [...prev, ...newLines]);
      } else {
        const target = `${WORKSPACE}/${args}`.replace(/\/+/g, '/');
        setCwd(target);
        setLines((prev) => [...prev, ...newLines]);
      }
      return;
    }

    if (wsConnected) {
      sendToWs({ type: 'terminal_input', input: cmd });
    } else {
      const handler = RESPONSES[base.toLowerCase()];
      if (handler) {
        const out = handler(args, user, projects, cwd);
        if (out) newLines.push({ type: 'output', text: out });
      } else {
        newLines.push({ type: 'error', text: `${base}: command not found. Type 'help' for available commands.` });
      }
    }

    setLines((prev) => [...prev, ...newLines]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { submit(); return; }
    if (e.key === 'ArrowUp') {
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] || '');
    }
    if (e.key === 'ArrowDown') {
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? '' : history[idx]);
    }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(lines.map((l) => l.text).join('\n')).catch(() => {});
  };

  return (
    <div className="p-8 flex-1 flex flex-col min-h-0">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col flex-1 space-y-6" style={{ minHeight: 0 }}>
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Terminal</h1>
            <p className="text-gray-400 text-sm">Sandboxed workspace shell — restricted to {WORKSPACE}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium bg-violet-500/10 border-violet-500/20 text-violet-400">
              <Shield className="w-3 h-3" /> Sandboxed
            </div>
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium',
              wsConnected || state.agentConnected
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-gray-500/10 border-gray-500/20 text-gray-500'
            )}>
              {wsConnected || state.agentConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {wsConnected || state.agentConnected ? 'Agent Connected' : 'Agent Offline'}
            </div>
            <button onClick={copyAll} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => setLines([])} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!wsConnected && !state.agentConnected && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400 flex-shrink-0"
          >
            <strong>Agent not connected.</strong> This terminal runs in simulation mode.
            Install the agent from <strong>Settings → Agent</strong> or run:{' '}
            <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-xs">
              curl -sSL "https://opendrap-api.tert.workers.dev/api/install.sh?token=YOUR_TOKEN" | bash
            </code>
          </motion.div>
        )}

        <div
          className="flex-1 bg-[#060608] border border-white/10 rounded-xl overflow-hidden flex flex-col cursor-text"
          style={{ minHeight: 400 }}
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0F0F14] flex-shrink-0">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <span className="text-xs text-gray-500 font-mono">{PROMPT_USER}:{cwd}</span>
            <div className={cn('flex items-center gap-1.5 text-xs', wsConnected || state.agentConnected ? 'text-emerald-400' : 'text-gray-600')}>
              <Circle className="w-2 h-2 fill-current" />
              {wsConnected || state.agentConnected ? 'Live' : 'Sim'}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 font-mono text-sm space-y-1">
            {lines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'whitespace-pre-wrap leading-relaxed',
                  line.type === 'input'   ? 'text-violet-400' :
                  line.type === 'error'   ? 'text-red-400' :
                  line.type === 'blocked' ? 'text-red-300 bg-red-500/5 border border-red-500/15 rounded px-2 py-1' :
                  line.type === 'system'  ? 'text-gray-500' :
                  'text-gray-200'
                )}
              >
                {line.text}
              </div>
            ))}

            <div className="flex items-center gap-2 text-violet-400">
              <span className="text-gray-600 flex-shrink-0">{PROMPT_USER}:{cwd}$</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                className="flex-1 bg-transparent border-0 outline-none text-white font-mono caret-violet-400"
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
