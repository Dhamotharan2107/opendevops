import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Users, UserX, FolderGit2, Rocket, Bug, Building2,
  Loader2, TrendingUp, ArrowRight, ShieldCheck, ShieldOff, Zap, Crown
} from 'lucide-react';
import { adminApi, type AdminUser, type AdminStats } from '../../../lib/adminApi';
import { cn } from '../../../lib/utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, delay: i * 0.07, ease: 'easeOut' }
  }),
};

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      adminApi.stats(),
      adminApi.listUsers({ page: 1, limit: 8 }),
    ])
      .then(([s, u]) => {
        setStats(s);
        setRecentUsers(u.users);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { icon: Users,      label: 'Total Users',     value: stats.users,          color: 'from-violet-500/20 to-fuchsia-500/10', iconColor: 'text-violet-400'  },
    { icon: UserX,      label: 'Disabled',        value: stats.disabled_users, color: 'from-red-500/20 to-orange-500/10',     iconColor: 'text-red-400'     },
    { icon: FolderGit2, label: 'Projects',        value: stats.projects,       color: 'from-blue-500/20 to-cyan-500/10',      iconColor: 'text-blue-400'    },
    { icon: Rocket,     label: 'Deployments',     value: stats.deployments,    color: 'from-emerald-500/20 to-teal-500/10',   iconColor: 'text-emerald-400' },
    { icon: Bug,        label: 'Open Bugs',       value: stats.open_bugs,      color: 'from-orange-500/20 to-red-500/10',     iconColor: 'text-orange-400'  },
    { icon: Building2,  label: 'Companies',       value: stats.companies,      color: 'from-fuchsia-500/20 to-pink-500/10',   iconColor: 'text-fuchsia-400' },
    { icon: Zap,        label: 'Pro Users',       value: stats.plan_pro,       color: 'from-violet-500/20 to-purple-500/10',  iconColor: 'text-violet-300'  },
    { icon: Crown,      label: 'Enterprise',      value: stats.plan_enterprise, color: 'from-amber-500/20 to-yellow-500/10', iconColor: 'text-amber-400'   },
    { icon: Users,      label: 'Free Users',      value: stats.plan_free,      color: 'from-gray-500/20 to-slate-500/10',     iconColor: 'text-gray-400'    },
  ] : [];

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Overview</h2>
        <p className="text-sm text-gray-500">Platform-wide statistics and recent activity</p>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 mb-6">
          Failed to load stats: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={i}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative p-6 bg-white/5 border border-white/10 rounded-xl overflow-hidden"
              >
                <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br', card.color)} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <card.icon className={cn('w-5 h-5', card.iconColor)} />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-full">
                      <TrendingUp className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{card.value}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white font-mono tabular-nums mb-1">{card.value}</div>
                  <div className="text-sm text-gray-400">{card.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent users */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Recent Users</h3>
              <Link to="/admin-prd/users" className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors group">
                View all <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['User', 'Email', 'Provider', 'Role', 'Status', 'Joined'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.length === 0 && (
                    <tr><td colSpan={6} className="py-10 text-center text-gray-600 text-sm">No users yet</td></tr>
                  )}
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                            {u.name?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{u.name}</div>
                            <div className="text-xs text-gray-500">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-500 capitalize bg-white/5 px-2 py-0.5 rounded">{u.auth_provider}</span>
                      </td>
                      <td className="py-3 px-4">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge disabled={u.is_disabled === 1} />
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn(
      'text-xs font-medium px-2 py-0.5 rounded-full border',
      role === 'admin'
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
    )}>
      {role}
    </span>
  );
}

function StatusBadge({ disabled }: { disabled: boolean }) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border',
      disabled
        ? 'bg-red-500/10 border-red-500/20 text-red-400'
        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    )}>
      {disabled ? <ShieldOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
      {disabled ? 'Disabled' : 'Active'}
    </div>
  );
}
