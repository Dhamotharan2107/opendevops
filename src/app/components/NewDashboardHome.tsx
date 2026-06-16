import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Rocket, AlertTriangle, CheckCircle2, Activity,
  GitBranch, Clock, TrendingUp, ArrowRight, Bot,
  BarChart3, Users, Bell, Bug, MessageSquare,
  FolderKanban, ChevronRight, Loader2, Plus, Globe,
  Server, Shield, Terminal, Cloud, Code,
  Layers, MapPin, ScrollText
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { cn, getStatusColor } from '../../lib/utils';
import { apiGetDashboard } from '../../lib/api';

interface DashboardData {
  user: any;
  stats: { totalProjects: number; totalDeployments: number; totalErrors: number; openBugs: number };
  recentProjects: any[];
  recentDeployments: any[];
  recentActivity: any[];
  notifications: any[];
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function StatCard({ icon: Icon, label, value, sub, gradient, href }: {
  icon: any; label: string; value: string | number; sub?: string;
  gradient: string; href?: string;
}) {
  const inner = (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      className="group relative p-5 bg-white/[0.04] border border-white/[0.07] rounded-xl overflow-hidden cursor-default"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-white/[0.07] border border-white/[0.08] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
        </div>
        <div className="text-2xl font-bold text-white font-mono tabular-nums mb-0.5">{value}</div>
        <div className="text-sm text-white/50 group-hover:text-white/70 transition-colors">{label}</div>
        {sub && <div className="text-xs text-white/30 mt-1 font-mono">{sub}</div>}
      </div>
    </motion.div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

function ResourceCard({ icon: Icon, label, desc, href, badge }: {
  icon: any; label: string; desc: string; href: string; badge?: string;
}) {
  return (
    <motion.div variants={fadeUp}>
      <Link
        to={href}
        className="group flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] hover:border-violet-500/20 transition-all"
      >
        <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">{label}</div>
          <div className="text-xs text-white/40 mt-0.5 truncate">{desc}</div>
        </div>
        {badge && (
          <div className="text-xs text-white/40 font-mono bg-white/5 px-2 py-1 rounded-md border border-white/10">
            {badge}
          </div>
        )}
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-all group-hover:translate-x-0.5 flex-shrink-0" />
      </Link>
    </motion.div>
  );
}

function DeploymentRow({ d }: { d: any }) {
  const statusColor = d.status === 'success' || d.status === 'deployed'
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : d.status === 'failed'
    ? 'text-red-400 bg-red-500/10 border-red-500/20'
    : 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  const pulseDot = d.status === 'success' || d.status === 'deployed';
  return (
    <div className="flex items-center gap-4 py-3 px-4 hover:bg-white/[0.03] rounded-lg transition-colors group">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pulseDot ? 'bg-emerald-400 animate-pulse' : d.status === 'failed' ? 'bg-red-400' : 'bg-blue-400'}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white font-medium truncate">{d.project_name || 'Unknown Project'}</div>
        <div className="text-xs text-white/40 font-mono truncate">{d.commit ? d.commit.slice(0, 12) : '—'}</div>
      </div>
      <div className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${statusColor}`}>
        {pulseDot && <span className="w-1.5 h-1.5 inline-block rounded-full bg-current mr-1.5" />}
        {(d.status || 'unknown').charAt(0).toUpperCase() + (d.status || 'unknown').slice(1)}
      </div>
      <div className="text-xs text-white/30 flex-shrink-0 hidden sm:block">{d.time || '—'}</div>
    </div>
  );
}

export function NewDashboardHome() {
  const { state, dispatch } = useApp();
  const { user } = state;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    apiGetDashboard()
      .then((d: any) => {
        setData(d);
        if (d.recentProjects) dispatch({ type: 'SET_PROJECTS', payload: d.recentProjects });
      })
      .catch((e: any) => setError(e.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-white font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-300 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || { totalProjects: 0, totalDeployments: 0, totalErrors: 0, openBugs: 0 };
  const recentProjects = data?.recentProjects || [];
  const recentDeployments = data?.recentDeployments || [];
  const notifications = data?.notifications || [];

  return (
    <motion.div className="p-6 flex-1 min-h-0 overflow-y-auto" variants={container} initial="hidden" animate="visible">
      <div className="max-w-[1440px] mx-auto space-y-7">

        {/* === Top Bar — AWS Console Style === */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-white/30 font-mono">
              <MapPin className="w-3 h-3" />
              <span>us-east-1</span>
              <span className="text-white/10">|</span>
              <span>{user?.name || 'Console'}</span>
              <span className="text-white/10">|</span>
              <span className="text-emerald-400/70">{user?.plan || 'Free'}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {greeting}, {user?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-sm text-white/40">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/projects"
              className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create project
            </Link>
          </div>
        </motion.div>

        {/* === Resource Summary — Like AWS Console === */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-white/40" />
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Resources</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={FolderKanban} label="Projects" value={stats.totalProjects}
              gradient="bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/5"
              href="/dashboard/projects"
            />
            <StatCard
              icon={Cloud} label="Deployments" value={stats.totalDeployments}
              gradient="bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/5"
              href="/dashboard/deployments"
            />
            <StatCard
              icon={Bug} label="Open Bugs" value={stats.openBugs}
              gradient="bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5"
              href="/dashboard/bugs"
            />
            <StatCard
              icon={AlertTriangle} label="Errors" value={stats.totalErrors}
              gradient="bg-gradient-to-br from-red-500/10 via-transparent to-rose-500/5"
              href="/dashboard/errors"
            />
          </div>
        </motion.div>

        {/* === Services — Like AWS Management Console === */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-white/40" />
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Services</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            <ResourceCard icon={Terminal} label="Terminal" desc="Cloud shell workspace" href="/dashboard/terminal" />
            <ResourceCard icon={Activity} label="Monitoring" desc="Metrics & alerts" href="/dashboard/monitoring" />
            <ResourceCard icon={ScrollText} label="Logs" desc="Activity log stream" href="/dashboard/logs" />
            <ResourceCard icon={Bug} label="Errors" desc="Error tracking" href="/dashboard/errors" />
            <ResourceCard icon={Bot} label="AI Testing" desc="Run AI test suites" href="/dashboard/ai-testing" />
            <ResourceCard icon={Code} label="API Lab" desc="Test API endpoints" href="/dashboard/api-lab" />
            <ResourceCard icon={Users} label="Team" desc="Manage team members" href="/dashboard/team" />
            <ResourceCard icon={MessageSquare} label="Chat" desc="Team communication" href="/dashboard/chat" />
            <ResourceCard icon={FolderKanban} label="Tasks" desc="Project management" href="/dashboard/tasks" />
            <ResourceCard icon={Shield} label="Settings" desc="Configure workspace" href="/dashboard/settings" />
          </div>
        </motion.div>

        {/* === Bottom: Deployments + Activity === */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Deployments */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Recent Deployments</h3>
              </div>
              <Link to="/dashboard/deployments" className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {recentDeployments.length === 0 ? (
                <div className="py-10 text-center">
                  <Cloud className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-sm text-white/30">No deployments yet</p>
                </div>
              ) : recentDeployments.map((d: any, i: number) => (
                <DeploymentRow key={d.id || i} d={d} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Activity className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-sm text-white/30">No recent activity</p>
                </div>
              ) : notifications.slice(0, 6).map((n: any, i: number) => (
                <div key={n.id || i} className="flex items-start gap-3 py-3 px-5 hover:bg-white/[0.03] transition-colors">
                  <div className="w-2 h-2 rounded-full bg-violet-400/50 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 truncate">{n.title || 'Activity'}</div>
                    <div className="text-xs text-white/40 mt-0.5">{n.message || n.details || ''}</div>
                  </div>
                  <div className="text-xs text-white/30 flex-shrink-0">{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</div>
                </div>
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
}


