import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Rocket, GitBranch, Clock, CheckCircle2, XCircle, Loader2,
  RefreshCw, Search, Filter, ChevronRight, GitCommit, Cloud
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn, getStatusColor } from '@/lib/utils';
import { apiGetProjects } from '@/lib/api';
import type { Deployment } from '@/lib/types';

const STATUS_ICONS: Record<string, React.ElementType> = {
  success: CheckCircle2,
  failed: XCircle,
  building: Loader2,
};

export function DeploymentsPage() {
  const { state, dispatch } = useApp();
  const { deployments, projects } = state;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  useEffect(() => {
    if (projects.length === 0) {
      setLoading(true);
      apiGetProjects()
        .then(({ projects }) => dispatch({ type: 'SET_PROJECTS', payload: projects }))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []);

  const filtered = deployments.filter((d) => {
    const project = projectMap.get(d.projectId);
    const name = project?.name?.toLowerCase() || '';
    const matchSearch = name.includes(search.toLowerCase()) || d.branch.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: deployments.length,
    success: deployments.filter((d) => d.status === 'success').length,
    failed: deployments.filter((d) => d.status === 'failed').length,
    building: deployments.filter((d) => d.status === 'building').length,
  };

  return (
    <div className="p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Deployments</h1>
            <p className="text-gray-400 text-sm">{deployments.length} total deployments</p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              apiGetProjects().then(({ projects }) => dispatch({ type: 'SET_PROJECTS', payload: projects })).catch(() => {}).finally(() => setLoading(false));
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-white/5' },
            { label: 'Successful', value: stats.success, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
            { label: 'Failed', value: stats.failed, color: 'text-red-400', bg: 'bg-red-500/5' },
            { label: 'Building', value: stats.building, color: 'text-blue-400', bg: 'bg-blue-500/5' },
          ].map((s) => (
            <div key={s.label} className={cn('p-6 border border-white/10 rounded-xl', s.bg)}>
              <div className={cn('text-3xl font-bold mb-1 font-mono', s.color)}>{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deployments..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-violet-500/50"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="building">Building</option>
          </select>
        </div>

        {/* Deployments Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Project</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Branch</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Commit</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Version</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                <th className="py-3 px-6" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400 mx-auto" />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Rocket className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No deployments yet</p>
                    <p className="text-gray-600 text-xs mt-1">Deploy a project to see it here</p>
                  </td>
                </tr>
              )}
              {!loading && filtered.map((dep, i) => {
                const project = projectMap.get(dep.projectId);
                const Icon = STATUS_ICONS[dep.status] || Rocket;
                return (
                  <motion.tr
                    key={dep.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <Link to={`/dashboard/project/${dep.projectId}`} className="flex items-center gap-3 group-hover:text-violet-400 transition-colors">
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border',
                          dep.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                          dep.status === 'failed' ? 'bg-red-500/10 border-red-500/20' :
                          'bg-blue-500/10 border-blue-500/20'
                        )}>
                          <Cloud className={cn('w-4 h-4',
                            dep.status === 'success' ? 'text-emerald-400' :
                            dep.status === 'failed' ? 'text-red-400' : 'text-blue-400'
                          )} />
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{project?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 font-mono">{project?.repo || '—'}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium', getStatusColor(dep.status))}>
                        <Icon className={cn('w-3 h-3', dep.status === 'building' && 'animate-spin')} />
                        {dep.status.charAt(0).toUpperCase() + dep.status.slice(1)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-sm text-gray-400 font-mono">
                        <GitBranch className="w-3.5 h-3.5" />
                        {dep.branch}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                        <GitCommit className="w-3.5 h-3.5" />
                        {dep.commit?.slice(0, 7) || '—'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded">{dep.version}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {dep.time}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Link to={`/dashboard/project/${dep.projectId}`} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
