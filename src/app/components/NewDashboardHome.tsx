import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Rocket, AlertTriangle, CheckCircle2, Activity,
  GitBranch, Clock, TrendingUp, ArrowRight, Bot,
  BarChart3, Users, Cloud, Bell, Bug, MessageSquare,
  FolderKanban, ChevronRight, Loader2, Plus
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { cn, formatRelativeTime, getStatusColor } from '../../lib/utils';
import { apiGetProjects, apiGetNotifications } from '../../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

const statCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' }
  })
};

function StatusBadge({ status }: { status: string }) {
  const colorClass = getStatusColor(status);
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full border', colorClass)}>
      <div className={cn('w-1.5 h-1.5 rounded-full', status === 'success' || status === 'deployed' ? 'bg-current animate-pulse' : 'bg-current')} />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'deployment': return Rocket;
    case 'connection': return Users;
    case 'test': return Bot;
    case 'bug': return Bug;
    case 'message': return MessageSquare;
    case 'task': return CheckCircle2;
    case 'project': return FolderKanban;
    default: return Bell;
  }
}

export function NewDashboardHome() {
  const { state, dispatch } = useApp();
  const { user, projects, deployments, errors, aiTestResults, notifications, bugs } = state;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiGetProjects().then(({ projects }) =>
        dispatch({ type: 'SET_PROJECTS', payload: projects })
      ).catch(() => {}),
      apiGetNotifications().then(({ notifications }) =>
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications })
      ).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalProjects = projects.length;
  const activeDeployments = projects.filter((p) => p.status === 'deployed').length;
  const openErrors = errors.filter((e) => e.status !== 'resolved').length;
  const aiTestsRun = aiTestResults.reduce((sum, r) => sum + r.results.length, 0);

  const recentDeployments = deployments.slice(0, 5);

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const recentActivity = [...notifications].slice(0, 5);

  const totalDeployments = deployments.length;
  const successCount = deployments.filter((d) => d.status === 'success').length;
  const successRate = totalDeployments > 0 ? Math.round((successCount / totalDeployments) * 100) : 0;
  const openBugCount = bugs.filter((b) => b.status === 'open').length;

  const statsCards = [
    {
      icon: FolderKanban,
      label: 'Total Projects',
      value: totalProjects,
      change: `${totalProjects > 0 ? '+' : ''}${totalProjects}`,
      trend: totalProjects > 0 ? 'up' : 'neutral' as const,
      gradient: 'bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/5'
    },
    {
      icon: Activity,
      label: 'Active Deployments',
      value: activeDeployments,
      change: `${activeDeployments} live`,
      trend: activeDeployments > 0 ? 'up' : 'neutral' as const,
      gradient: 'bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/5'
    },
    {
      icon: AlertTriangle,
      label: 'Open Errors',
      value: openErrors,
      change: `${openErrors > 0 ? '+' : ''}${openErrors}`,
      trend: openErrors > 0 ? 'down' : 'neutral' as const,
      gradient: 'bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/5'
    },
    {
      icon: Bot,
      label: 'AI Tests Run',
      value: aiTestsRun,
      change: `+${aiTestsRun}`,
      trend: 'up' as const,
      gradient: 'bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/5'
    }
  ];

  const performanceCards = [
    {
      icon: Rocket,
      label: 'Total Deployments',
      value: totalDeployments,
      trend: `${totalDeployments}`,
      gradient: 'from-violet-500/20 to-fuchsia-500/10',
      badgeClass: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
    },
    {
      icon: CheckCircle2,
      label: 'Success Rate',
      value: `${successRate}%`,
      trend: `${successRate}%`,
      gradient: 'from-emerald-500/20 to-green-500/10',
      badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      icon: Bug,
      label: 'Open Bugs',
      value: openBugCount,
      trend: `${openBugCount}`,
      gradient: 'from-red-500/20 to-orange-500/10',
      badgeClass: openBugCount > 0
        ? 'text-red-400 bg-red-500/10 border-red-500/20'
        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  return (
    <motion.div
      className="p-4 md:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      )}
      {!loading && (
        <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
              {greeting}, {user?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              {dateStr} &middot; {timeStr}
            </p>
          </div>
          <Link
            to="/dashboard/projects"
            className="group relative px-5 py-2.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-sm overflow-hidden"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <Rocket className="w-4 h-4 relative z-10" />
            <span className="relative z-10 text-white">New Project</span>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {statsCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={statCardVariants}
              custom={i}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl overflow-hidden cursor-default"
            >
              <div
                className={cn(
                  'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                  stat.gradient
                )}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  {stat.trend === 'up' && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">{stat.change}</span>
                    </div>
                  )}
                  {stat.trend === 'down' && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                      <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                      <span className="text-xs text-red-400 font-medium">{stat.change}</span>
                    </div>
                  )}
                  {stat.trend === 'neutral' && (
                    <span className="text-xs text-gray-500">{stat.change}</span>
                  )}
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-1 font-mono tabular-nums">
                  <AnimatedNumber value={stat.value} />
                </div>
                <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Deployments Table */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Deployments</h2>
            <Link
              to="/dashboard/projects"
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 md:px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Project</th>
                  <th className="text-left py-3 px-4 md:px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 md:px-6 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Branch</th>
                  <th className="text-left py-3 px-4 md:px-6 text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Last Deploy</th>
                  <th className="text-left py-3 px-4 md:px-6 text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Visits</th>
                  <th className="text-left py-3 px-4 md:px-6 text-xs font-medium text-gray-400 uppercase tracking-wider" />
                </tr>
              </thead>
              <tbody>
                {recentDeployments.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="py-16 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center">
                          <Rocket className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium mb-1">No deployments yet</p>
                          <p className="text-gray-500 text-sm">Create your first project and deploy in minutes</p>
                        </div>
                        <Link
                          to="/dashboard/projects"
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                        >
                          <Plus className="w-4 h-4" />
                          Create your first project
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
                {recentDeployments.map((deployment, i) => {
                  const project = projectMap.get(deployment.projectId);
                  return (
                    <motion.tr
                      key={deployment.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group/cursor"
                    >
                      <td className="py-3 md:py-4 px-4 md:px-6">
                        <Link
                          to={`/dashboard/project/${deployment.projectId}`}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={cn(
                              'w-8 md:w-10 h-8 md:h-10 rounded-lg flex items-center justify-center border transition-colors flex-shrink-0',
                              deployment.status === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/20 group-hover/cursor:bg-emerald-500/20'
                                : deployment.status === 'failed'
                                  ? 'bg-red-500/10 border-red-500/20 group-hover/cursor:bg-red-500/20'
                                  : 'bg-blue-500/10 border-blue-500/20 group-hover/cursor:bg-blue-500/20'
                            )}
                          >
                            <Cloud
                              className={cn(
                                'w-4 md:w-5 h-4 md:h-5',
                                deployment.status === 'success'
                                  ? 'text-emerald-400'
                                  : deployment.status === 'failed'
                                    ? 'text-red-400'
                                    : 'text-blue-400'
                              )}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white group-hover/cursor:text-violet-400 transition-colors text-sm md:text-base truncate">
                              {project?.name || 'Unknown Project'}
                            </div>
                            <div className="text-xs text-gray-500 font-mono truncate">
                              {project?.repo || '—'}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6">
                        <StatusBadge status={deployment.status} />
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                          <GitBranch className="w-3.5 h-3.5" />
                          {deployment.branch}
                        </div>
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          {deployment.time}
                        </div>
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6 hidden sm:table-cell">
                        <span className="text-sm text-gray-400 font-mono">
                          {project?.visits || '—'}
                        </span>
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6">
                        <Link
                          to={`/dashboard/project/${deployment.projectId}`}
                          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-500 group-hover/cursor:text-white transition-colors" />
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Bottom Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Activity */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-6">No recent activity</p>
              )}
              {recentActivity.map((notification, i) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-3 p-3 bg-white/5 rounded-lg group hover:bg-white/10 transition-colors cursor-default"
                  >
                    <div className="relative mt-1">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center border',
                          notification.read
                            ? 'bg-white/5 border-white/10'
                            : 'bg-violet-500/10 border-violet-500/20'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-4 h-4',
                            notification.read ? 'text-gray-500' : 'text-violet-400'
                          )}
                        />
                      </div>
                      {!notification.read && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-violet-500 rounded-full border-2 border-[#0A0A0F]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">
                        {notification.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {notification.message}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {notification.createdAt}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Performance Stats */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              Performance
            </h3>
            <div className="space-y-4">
              {performanceCards.map((metric, i) => (
                <motion.div
                  key={metric.label}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ x: 4 }}
                  className="group relative flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors overflow-hidden"
                >
                  <div
                    className={cn(
                      'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r',
                      metric.gradient
                    )}
                  />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                      <metric.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">{metric.label}</div>
                      <div className="text-xl font-bold text-white">{metric.value}</div>
                    </div>
                  </div>
                  <div className={cn('relative z-10 text-xs font-medium px-2 py-1 rounded-full border', metric.badgeClass)}>
                    {metric.trend}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let startTime: number;
    let raf: number;
    const duration = 1200;
    const startValue = display;
    const delta = value - startValue;

    if (delta === 0) {
      setDisplay(value);
      return;
    }

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(startValue + eased * delta));
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setDisplay(value);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}
