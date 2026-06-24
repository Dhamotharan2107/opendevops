import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ScrollText, Search, Download, Pause, Play, Trash2, Filter, Wifi, WifiOff
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { apiGetLogs, isDemoMode } from '@/lib/api';
import type { LogEntry } from '@/lib/types';

const LEVEL_COLORS: Record<string, string> = {
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
};

const LEVEL_BG: Record<string, string> = {
  info: 'bg-blue-500/10 border-blue-500/20',
  warn: 'bg-yellow-500/10 border-yellow-500/20',
  error: 'bg-red-500/10 border-red-500/20',
};

const MOCK_MESSAGES: Pick<LogEntry, 'level' | 'message'>[] = [
  { level: 'info', message: 'Server started on port 3000' },
  { level: 'info', message: 'Database connection established' },
  { level: 'info', message: 'GET /api/health 200 OK (12ms)' },
  { level: 'warn', message: 'Memory usage above 80%' },
  { level: 'info', message: 'POST /api/auth/login 200 OK (45ms)' },
  { level: 'error', message: 'Unhandled promise rejection: TypeError: Cannot read property' },
  { level: 'info', message: 'GET /api/projects 200 OK (23ms)' },
  { level: 'warn', message: 'Deprecated API endpoint /api/v1 called' },
  { level: 'info', message: 'Background job completed: cleanup_old_sessions' },
  { level: 'error', message: 'Database query timeout after 5000ms' },
];

let mockIdx = 0;

function mapBackendLog(item: any): LogEntry {
  return {
    id: item.id || 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    projectId: item.project_id || 'default',
    level: (item.action === 'error' ? 'error' : item.action === 'warn' ? 'warn' : 'info') as LogEntry['level'],
    message: item.details || item.action || 'Unknown log',
    timestamp: item.created_at || new Date().toISOString(),
  };
}

export function LogsPage() {
  const { state } = useApp();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const demoMode = isDemoMode();

  // Debounce the search box so server fetches (and the polling restart) only happen
  // ~350ms after the user stops typing, not on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    try {
      const result = await apiGetLogs('default', levelFilter === 'all' ? undefined : levelFilter, debouncedSearch || undefined);
      if (result.logs) {
        const mapped = result.logs.map(mapBackendLog);
        setLogs(mapped);
        setConnected(mapped.length > 0);
      }
    } catch {
      setConnected(false);
    }
  }, [levelFilter, debouncedSearch]);

  useEffect(() => {
    if (demoMode) {
      setConnected(false);
      if (paused) return;
      intervalRef.current = setInterval(() => {
        const mock = MOCK_MESSAGES[mockIdx % MOCK_MESSAGES.length];
        mockIdx++;
        const newLog: LogEntry = {
          id: Date.now().toString(),
          projectId: 'live',
          level: mock.level as LogEntry['level'],
          message: mock.message,
          timestamp: new Date().toISOString(),
        };
        setLogs((prev) => [...prev.slice(-499), newLog]);
      }, 1500);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }

    fetchLogs();
    if (paused) return;
    intervalRef.current = setInterval(fetchLogs, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, demoMode, fetchLogs]);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filtered = demoMode
    ? logs.filter((l) => {
        const matchLevel = levelFilter === 'all' || l.level === levelFilter;
        const matchSearch = l.message.toLowerCase().includes(search.toLowerCase());
        return matchLevel && matchSearch;
      })
    : logs;

  const counts = {
    info: logs.filter((l) => l.level === 'info').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    error: logs.filter((l) => l.level === 'error').length,
  };

  const downloadLogs = () => {
    const text = filtered.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opendrap-logs.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 flex-1 flex flex-col min-h-0">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col flex-1 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Logs</h1>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              {logs.length} entries —
              {!demoMode ? (
                connected
                  ? <span className="flex items-center gap-1 text-emerald-400"><Wifi className="w-3 h-3" /> Live stream</span>
                  : <span className="flex items-center gap-1 text-amber-400"><WifiOff className="w-3 h-3" /> Offline</span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400">Demo mode (simulated)</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setPaused((p) => !p)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                paused
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
              )}
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={downloadLogs}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setLogs([])}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {(['all', 'info', 'warn', 'error'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={cn(
                'flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm border transition-colors',
                levelFilter === lvl
                  ? lvl === 'all' ? 'bg-white/10 border-white/20 text-white' : `${LEVEL_BG[lvl]} ${LEVEL_COLORS[lvl]}`
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              )}
            >
              {lvl === 'all' ? (
                <><Filter className="w-3.5 h-3.5" /> All ({logs.length})</>
              ) : (
                <><span className={cn('w-2 h-2 rounded-full bg-current')} /> {lvl.toUpperCase()} ({counts[lvl]})</>
              )}
            </button>
          ))}
          <div className="hidden sm:block flex-1" />
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
        </div>

        <div className="flex-1 bg-[#0A0A0F] border border-white/10 rounded-xl overflow-hidden flex flex-col min-h-[300px] md:min-h-[400px]">
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-red-500/70" />
              <div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-green-500/70" />
            </div>
            <span className="text-xs text-gray-500 font-mono ml-2">opendrap — logs</span>
            {!paused && !demoMode && connected && (
              <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
            )}
            {!paused && demoMode && (
              <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Demo
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1" style={{ maxHeight: 520 }}>
            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-600">
                <ScrollText className="w-8 h-8 mr-3" />
                {!demoMode && !connected ? 'Waiting for activity...' : 'No logs to display'}
              </div>
            )}
            {filtered.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 hover:bg-white/[0.02] rounded px-2 py-0.5 group"
              >
                <span className="text-gray-600 text-xs mt-0.5 flex-shrink-0 tabular-nums">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={cn(
                  'text-xs font-semibold uppercase px-1.5 py-0.5 rounded flex-shrink-0 border',
                  LEVEL_BG[log.level], LEVEL_COLORS[log.level]
                )}>
                  {log.level}
                </span>
                <span className={cn('flex-1 break-all', LEVEL_COLORS[log.level] === 'text-red-400' ? 'text-red-300' : 'text-gray-300')}>
                  {log.message}
                </span>
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}