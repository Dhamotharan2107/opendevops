import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Circle, Copy, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';

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

interface TermLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

export function TerminalPage() {
  const { state, dispatch } = useApp();

  const [cwd, setCwd] = useState('~');
  const [hostname, setHostname] = useState('cloudshell');
  const [lines, setLines] = useState<TermLine[]>([
    { type: 'system', text: 'Connecting to agent...' },
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
    const token = localStorage.getItem('token');
    if (!token) return;

    async function connect() {
      const wsUrl = `${WS_URL}/api/terminal/ws?sessionId=browser&projectId=default&token=${encodeURIComponent(token!)}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
        dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: true, lastSeen: new Date().toISOString() } });
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const text: string = msg.data || msg.message || '';

          if (msg.type === 'terminal_output' || msg.type === 'command_output') {
            if (text.includes('__CWD__:')) {
              const match = text.match(/__CWD__:(.+)/);
              if (match) setCwd(match[1].trim().replace(/\/home\/[^/]+/, '~').replace(/\/root/, '~'));
              const rest = text.replace(/.*__CWD__:.+\n?/g, '').trim();
              if (rest) setLines((prev) => [...prev, { type: 'output', text: rest }]);
              return;
            }
            if (text.trim()) setLines((prev) => [...prev, { type: 'output', text }]);
          } else if (msg.type === 'cwd') {
            setCwd(msg.data.replace(/\/home\/[^/]+/, '~').replace(/\/root/, '~'));
          } else if (msg.type === 'session_ready') {
            const h = msg.hostname || 'cloudshell';
            setHostname(h);
            if (msg.cwd) setCwd(msg.cwd.replace(/\/home\/[^/]+/, '~').replace(/\/root/, '~'));
            dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: true, lastSeen: new Date().toISOString() } });
            setLines((prev) => [...prev, { type: 'system', text: `Connected to ${h}.` }]);
            // Get real cwd on connect
            ws.send(JSON.stringify({ type: 'terminal_input', input: 'echo __CWD__:$(pwd)' }));
          } else if (msg.type === 'agent_connected') {
            const h = msg.hostname || 'cloudshell';
            setHostname(h);
            dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: true, lastSeen: new Date().toISOString() } });
            setLines((prev) => [...prev, { type: 'system', text: `Agent connected — ${h}` }]);
            ws.send(JSON.stringify({ type: 'terminal_input', input: 'echo __CWD__:$(pwd)' }));
          } else if (msg.type === 'agent_disconnected') {
            dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: false } });
            setLines((prev) => [...prev, { type: 'system', text: 'Agent disconnected.' }]);
          } else if (msg.type === 'error' && text) {
            setLines((prev) => [...prev, { type: 'error', text }]);
          }
        } catch {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: false } });
      };

      ws.onerror = () => setWsConnected(false);

      wsRef.current = ws;
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [dispatch]);

  const prompt = wsConnected || state.agentConnected ? `${hostname}:${cwd}$` : `~$`;

  const submit = () => {
    const cmd = input.trim();
    if (!cmd) return;
    setHistory((h) => [cmd, ...h]);
    setHistIdx(-1);
    setInput('');

    const newLines: TermLine[] = [{ type: 'input', text: `${prompt} ${cmd}` }];

    if (cmd === 'clear') { setLines([]); return; }

    if (wsConnected) {
      // cd: append pwd echo so prompt updates
      const actualCmd = (cmd === 'cd' || cmd.startsWith('cd ') || cmd.startsWith('cd\t'))
        ? `${cmd} && echo __CWD__:$(pwd)`
        : cmd;
      sendToWs({ type: 'terminal_input', input: actualCmd });
      setLines((prev) => [...prev, ...newLines]);
      return;
    }

    // Offline fallback
    newLines.push({ type: 'error', text: 'No agent connected. Install the agent to run commands.' });
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
            <p className="text-gray-400 text-sm">
              {wsConnected ? `${hostname} — full shell access` : 'Connect the agent to enable terminal'}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <strong>Agent offline.</strong> Run the install command in Google Cloud Shell to connect.
            <code className="block mt-2 bg-black/30 px-2 py-1 rounded font-mono text-xs">
              curl -sSL "{WS_URL.replace('wss://', 'https://').replace('ws://', 'http://')}/api/install.sh?token=$(cat ~/opendrap-agent/token)" | bash
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
            <span className="text-xs text-gray-500 font-mono">{prompt}</span>
            <div className={cn('flex items-center gap-1.5 text-xs', wsConnected || state.agentConnected ? 'text-emerald-400' : 'text-gray-600')}>
              <Circle className="w-2 h-2 fill-current" />
              {wsConnected || state.agentConnected ? 'Live' : 'Offline'}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 font-mono text-sm space-y-1">
            {lines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'whitespace-pre-wrap leading-relaxed',
                  line.type === 'input'  ? 'text-violet-400' :
                  line.type === 'error'  ? 'text-red-400' :
                  line.type === 'system' ? 'text-gray-500' :
                  'text-gray-200'
                )}
              >
                {line.text}
              </div>
            ))}

            <div className="flex items-center gap-2">
              <span className="text-gray-600 flex-shrink-0">{prompt}</span>
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
