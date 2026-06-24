import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle, CheckCircle2, Search, Filter, RefreshCw,
  ChevronDown, ChevronUp, Clock, TrendingUp, Eye, X
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn, getStatusColor } from '@/lib/utils';
import { apiGetErrors, apiUpdateError, isDemoMode } from '@/lib/api';
import type { ErrorRecord } from '@/lib/types';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

const MOCK_ERRORS: ErrorRecord[] = [
  { id: '1', projectId: '1', title: 'TypeError: Cannot read properties of undefined', message: "Cannot read properties of undefined (reading 'map')", stackTrace: 'at App.tsx:42\nat render (react-dom.js:1234)', count: 47, severity: 'critical', lastSeen: '2 min ago', status: 'open' },
  { id: '2', projectId: '1', title: 'UnhandledPromiseRejectionWarning', message: 'UnhandledPromiseRejectionWarning: Error: Network request failed', stackTrace: 'at fetch (api.ts:12)\nat loadData (hooks.ts:23)', count: 12, severity: 'high', lastSeen: '15 min ago', status: 'investigating' },
  { id: '3', projectId: '2', title: 'RangeError: Maximum call stack size exceeded', message: 'Maximum call stack size exceeded', stackTrace: 'at recursive (utils.ts:88)', count: 3, severity: 'high', lastSeen: '1 hour ago', status: 'open' },
  { id: '4', projectId: '2', title: 'SyntaxError: Unexpected token', message: "SyntaxError: Unexpected token '<'", stackTrace: 'at JSON.parse (<anonymous>)\nat parseResponse (api.ts:55)', count: 8, severity: 'medium', lastSeen: '3 hours ago', status: 'resolved' },
  { id: '5', projectId: '3', title: 'NetworkError: Failed to fetch', message: 'Failed to fetch resource at /api/deployments', stackTrace: 'at fetch (browser)\nat apiGetDeployments (api.ts:67)', count: 2, severity: 'low', lastSeen: '1 day ago', status: 'resolved' },
];

export function ErrorsPage() {
  const { state, dispatch } = useApp();
  const [errors, setErrors] = useState<ErrorRecord[]>(state.errors.length > 0 ? state.errors : MOCK_ERRORS);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<ErrorRecord | null>(null);
  const [fetched, setFetched] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemoMode()) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiGetErrors('default', severityFilter === 'all' ? undefined : severityFilter, statusFilter === 'all' ? undefined : statusFilter);
        setFetched(res.errors || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [severityFilter, statusFilter]);

  const allErrors: ErrorRecord[] = useMemo(() => {
    const local = state.errors.length > 0 ? state.errors : [];
    const backend = fetched.map((item: any) => ({
      id: item.id,
      projectId: item.project_id || 'default',
      title: item.title,
      message: item.message,
      stackTrace: item.stack_trace || '',
      count: item.count || 1,
      severity: item.severity as ErrorRecord['severity'],
      lastSeen: item.updated_at || item.created_at,
      status: item.status as ErrorRecord['status'],
    }));
    return [...local, ...backend];
  }, [state.errors, fetched]);

  const filtered = allErrors.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.message.toLowerCase().includes(search.toLowerCase());
    const matchSev = severityFilter === 'all' || e.severity === severityFilter;
    const matchStat = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchSev && matchStat;
  });

  const resolve = async (id: string) => {
    setErrors((prev) => prev.map((e) => e.id === id ? { ...e, status: 'resolved' as const } : e));
    dispatch({ type: 'UPDATE_ERROR', payload: { ...errors.find((e) => e.id === id)!, status: 'resolved' } });
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status: 'resolved' } : null);
    await apiUpdateError(id, { status: 'resolved' });
  };

  const stats = {
    total: allErrors.length,
    open: allErrors.filter((e) => e.status === 'open').length,
    critical: allErrors.filter((e) => e.severity === 'critical').length,
    resolved: allErrors.filter((e) => e.status === 'resolved').length,
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Error Tracking</h1>
            <p className="text-gray-400 text-sm">{stats.open} open errors</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Total Errors', value: stats.total, color: 'text-white' },
            { label: 'Open', value: stats.open, color: 'text-red-400' },
            { label: 'Critical', value: stats.critical, color: 'text-orange-400' },
            { label: 'Resolved', value: stats.resolved, color: 'text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl">
              <div className={cn('text-2xl md:text-3xl font-bold mb-1 font-mono', s.color)}>{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search errors..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none">
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none">
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Error List */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No errors found</h3>
              <p className="text-gray-600 text-sm">Everything looks good!</p>
            </div>
          )}
          {filtered.map((error, i) => (
            <motion.div
              key={error.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                'bg-white/5 border border-white/10 rounded-xl overflow-hidden',
                error.status === 'resolved' && 'opacity-60'
              )}
            >
              <div className="p-5 flex items-start gap-4">
                <div className={cn('mt-1 flex-shrink-0 px-2.5 py-1 rounded-full border text-xs font-medium', SEVERITY_COLORS[error.severity])}>
                  {error.severity}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-white text-sm mb-1 truncate">{error.title}</h3>
                      <p className="text-xs text-gray-500 truncate">{error.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {error.count}x
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {error.lastSeen}
                      </div>
                      <div className={cn('px-2 py-0.5 rounded-full text-xs border', getStatusColor(error.status))}>
                        {error.status}
                      </div>
                      {error.status !== 'resolved' && (
                        <button
                          onClick={() => resolve(error.id)}
                          className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/20 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => setExpanded(expanded === error.id ? null : error.id)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400"
                      >
                        {expanded === error.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {expanded === error.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10 overflow-hidden"
                  >
                    <div className="p-5 bg-black/20">
                      <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Stack Trace</p>
                      <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap bg-red-500/5 border border-red-500/10 rounded-lg p-4">
                        {error.stackTrace}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
