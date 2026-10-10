import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Edit3, Save, X, Globe, Briefcase, Code, Clock,
  Users, FolderKanban, Building2, Github, Loader2, Rocket,
  CheckCircle2, XCircle, Bug, AlertTriangle, TrendingUp,
  GitBranch, GitCommit, Calendar, Star, Zap, Award,
  Activity, Target, Server, Shield, ChevronRight, ExternalLink,
  Boxes, Cpu, Flame, Trophy, Sparkles
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { getInitials, cn, getStatusColor, formatRelativeTime } from '@/lib/utils';
import { apiGetProjects, apiGetDeployments, apiGetTasks, apiGetBugs, apiGetErrors } from '@/lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

const statVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.4 + i * 0.08, type: 'spring', stiffness: 300, damping: 20 },
  }),
};

const toSkillStr = (s: any): string => Array.isArray(s) ? s.join(', ') : (typeof s === 'string' ? s : '');

// Generate a GitHub-style contribution heatmap from activity timestamps
function useContributionData() {
  const { state } = useApp();
  return useMemo(() => {
    const activities: { date: string; count: number }[] = [];
    const map = new Map<string, number>();

    const add = (iso: string, n = 1) => {
      if (!iso) return;
      const d = new Date(iso);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, (map.get(key) || 0) + n);
    };

    state.deployments.forEach(d => add(d.time?.includes('ago') ? new Date().toISOString() : d.time, 2));
    state.projects.forEach(p => add(p.lastDeploy?.includes('ago') ? new Date().toISOString() : p.lastDeploy, 1));
    state.tasks.forEach(t => add(t.createdAt, 1));
    state.bugs.forEach(b => add(b.createdAt, 1));
    state.errors.forEach(e => add(e.lastSeen, 1));

    // Build last 13 weeks (91 days) like GitHub
    const days: { date: Date; count: number; label: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 90; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const count = map.get(key) || 0;
      days.push({
        date: d,
        count,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }

    const total = days.reduce((s, d) => s + d.count, 0);
    const maxCount = Math.max(1, ...days.map(d => d.count));
    return { days, total, maxCount };
  }, [state.deployments, state.projects, state.tasks, state.bugs, state.errors]);
}

function getHeatColor(count: number, max: number): string {
  if (count === 0) return 'bg-white/[0.04] border-white/[0.06]';
  const ratio = count / max;
  if (ratio < 0.25) return 'bg-emerald-500/20 border-emerald-500/30';
  if (ratio < 0.5) return 'bg-emerald-500/40 border-emerald-500/50';
  if (ratio < 0.75) return 'bg-emerald-500/60 border-emerald-500/70';
  return 'bg-emerald-400/80 border-emerald-300';
}

const connectedUsers: Record<string, { name: string; username: string; avatar?: string; skills: string[] }> = {
  '2': { name: 'Alice Johnson', username: 'alicej', skills: ['React', 'Python', 'Docker'] },
  '3': { name: 'Bob Smith', username: 'bobsmith', skills: ['Go', 'Kubernetes', 'Terraform'] },
};

const PLAN_BADGES: Record<string, { label: string; icon: any; color: string }> = {
  free: { label: 'Free', icon: Star, color: 'from-gray-500 to-gray-600' },
  pro: { label: 'Pro', icon: Zap, color: 'from-violet-500 to-fuchsia-500' },
  enterprise: { label: 'Enterprise', icon: Crown, color: 'from-amber-500 to-orange-500' },
};

function Crown(props: any) {
  return <Award {...props} />;
}

export function ProfilePage() {
  const { state, dispatch } = useApp();
  const user = state.user;
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'activity'>('overview');

  const [editForm, setEditForm] = useState({
    name: user?.name ?? '',
    username: user?.username ?? '',
    bio: user?.bio ?? '',
    skills: toSkillStr(user?.skills),
    company: user?.company ?? '',
    experience: user?.experience ?? '',
    website: user?.website ?? '',
    github: user?.github ?? '',
  });

  // Load data on mount
  useEffect(() => {
    if (state.projects.length === 0) {
      apiGetProjects()
        .then(({ projects }) => dispatch({ type: 'SET_PROJECTS', payload: projects }))
        .catch(() => {});
    }
  }, []);

  const connections = useMemo(
    () => !user ? [] : state.connections.filter(
      c => c.status === 'accepted' && (c.userId === user.id || c.connectedUserId === user.id)
    ),
    [state.connections, user?.id]
  );

  const { days: heatDays, total: heatTotal, maxCount: heatMax } = useContributionData();

  const deployedCount = state.projects.filter(p => p.status === 'deployed').length;
  const buildingCount = state.projects.filter(p => p.status === 'building').length;
  const failedCount = state.projects.filter(p => p.status === 'failed').length;
  const stoppedCount = state.projects.filter(p => p.status === 'stopped').length;

  const successDeployments = state.deployments.filter(d => d.status === 'success').length;
  const failedDeployments = state.deployments.filter(d => d.status === 'failed').length;
  const successRate = state.deployments.length > 0
    ? Math.round((successDeployments / state.deployments.length) * 100)
    : 0;

  const openBugs = state.bugs.filter(b => b.status === 'open' || b.status === 'in-progress').length;
  const openErrors = state.errors.filter(e => e.status === 'open' || e.status === 'investigating').length;
  const doneTasks = state.tasks.filter(t => t.status === 'done').length;
  const totalTasks = state.tasks.length;
  const taskCompletion = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Top/pinned projects (deployed first, then by visits)
  const pinnedProjects = useMemo(() => {
    const visitsNum = (v: string) => {
      if (!v || v === '—') return 0;
      const n = parseFloat(v.replace(/[^0-9.]/g, ''));
      if (v.includes('K')) return n * 1000;
      if (v.includes('M')) return n * 1000000;
      return n || 0;
    };
    return [...state.projects]
      .sort((a, b) => {
        if (a.status === 'deployed' && b.status !== 'deployed') return -1;
        if (b.status === 'deployed' && a.status !== 'deployed') return 1;
        return visitsNum(b.visits) - visitsNum(a.visits);
      })
      .slice(0, 6);
  }, [state.projects]);

  // Recent activity feed (merge deployments, tasks, bugs sorted by time)
  const recentActivity = useMemo(() => {
    const items: { type: 'deployment' | 'task' | 'bug' | 'error' | 'project'; label: string; sub: string; time: string; icon: any; color: string; projectId?: string }[] = [];

    state.deployments.slice(0, 5).forEach(d => {
      const proj = state.projects.find(p => p.id === d.projectId);
      items.push({
        type: 'deployment',
        label: `Deployed ${d.version} to ${proj?.name || 'project'}`,
        sub: `branch ${d.branch} • ${d.commit?.slice(0, 7) || ''}`,
        time: d.time,
        icon: Rocket,
        color: d.status === 'success' ? 'text-emerald-400 bg-emerald-500/10' : d.status === 'failed' ? 'text-red-400 bg-red-500/10' : 'text-blue-400 bg-blue-500/10',
        projectId: d.projectId,
      });
    });

    state.tasks.slice(0, 3).forEach(t => {
      const proj = state.projects.find(p => p.id === t.projectId);
      items.push({
        type: 'task',
        label: t.title,
        sub: `${proj?.name || 'project'} • ${t.status}`,
        time: t.createdAt,
        icon: CheckCircle2,
        color: 'text-violet-400 bg-violet-500/10',
        projectId: t.projectId,
      });
    });

    state.bugs.slice(0, 3).forEach(b => {
      const proj = state.projects.find(p => p.id === b.projectId);
      items.push({
        type: 'bug',
        label: b.title,
        sub: `${proj?.name || 'project'} • ${b.priority} priority`,
        time: b.createdAt,
        icon: Bug,
        color: 'text-orange-400 bg-orange-500/10',
        projectId: b.projectId,
      });
    });

    return items
      .map(i => ({ ...i, sortTime: i.time?.includes('ago') ? Date.now() : new Date(i.time).getTime() || 0 }))
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 8);
  }, [state.deployments, state.tasks, state.bugs, state.projects]);

  // Framework distribution
  const frameworkStats = useMemo(() => {
    const map = new Map<string, number>();
    state.projects.forEach(p => {
      if (p.framework) map.set(p.framework, (map.get(p.framework) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [state.projects]);

  // Achievement badges
  const achievements = useMemo(() => {
    const badges: { icon: any; label: string; desc: string; color: string; unlocked: boolean }[] = [
      { icon: Rocket, label: 'First Deploy', desc: 'Deploy your first project', color: 'from-blue-500 to-cyan-500', unlocked: state.projects.length > 0 },
      { icon: Boxes, label: 'Project Builder', desc: 'Create 3+ projects', color: 'from-violet-500 to-purple-500', unlocked: state.projects.length >= 3 },
      { icon: Flame, label: 'On Fire', desc: '5+ successful deploys', color: 'from-orange-500 to-red-500', unlocked: successDeployments >= 5 },
      { icon: Shield, label: 'Bug Hunter', desc: 'Track 5+ bugs', color: 'from-emerald-500 to-teal-500', unlocked: state.bugs.length >= 5 },
      { icon: Users, label: 'Connector', desc: 'Connect with teammates', color: 'from-pink-500 to-rose-500', unlocked: connections.length >= 1 },
      { icon: Trophy, label: 'Century Club', desc: '100+ deployments', color: 'from-amber-500 to-yellow-500', unlocked: state.deployments.length >= 100 },
    ];
    return badges;
  }, [state.projects, state.deployments, state.bugs, connections, successDeployments]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-white" />
      </div>
    );
  }

  const handleSave = () => {
    if (!user) return;
    dispatch({
      type: 'SET_USER',
      payload: {
        ...user,
        name: editForm.name,
        username: editForm.username,
        bio: editForm.bio,
        skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        company: editForm.company,
        experience: editForm.experience,
        website: editForm.website,
        github: editForm.github,
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      name: user?.name ?? '',
      username: user?.username ?? '',
      bio: user?.bio ?? '',
      skills: toSkillStr(user?.skills),
      company: user?.company ?? '',
      experience: user?.experience ?? '',
      website: user?.website ?? '',
      github: user?.github ?? '',
    });
    setIsEditing(false);
  };

  const planBadge = PLAN_BADGES[user.plan || 'free'];

  // Group heatmap days into weeks (columns)
  const weeks: typeof heatDays[] = [];
  for (let i = 0; i < heatDays.length; i += 7) {
    weeks.push(heatDays.slice(i, i + 7));
  }

  return (
    <div className="relative min-h-full bg-black overflow-x-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-white/[0.05] rounded-full blur-[120px] opacity-15 animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-white/[0.04] rounded-full blur-[120px] opacity-10 animate-pulse" style={{ animationDuration: '12s', animationDelay: '3s' }} />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-white/[0.03] rounded-full blur-[120px] opacity-8 animate-pulse" style={{ animationDuration: '14s', animationDelay: '6s' }} />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative max-w-6xl mx-auto px-4 py-8"
      >
        {/* ── Profile Header Card ──────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-white/5">
          {/* Banner */}
          <div className="relative h-40 md:h-48 bg-gradient-to-br from-white/20 via-white/10 to-white/5 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/[0.06] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-white/[0.05] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
            {/* Decorative grid pattern */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }} />
          </div>

          <div className="relative px-6 md:px-8 pb-6 -mt-16 md:-mt-20">
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-white to-white/80 p-[3px] shadow-xl shadow-white/20">
                  <div className="w-full h-full rounded-full bg-black" />
                </div>
                <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-black">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-white to-white/90 text-black">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {state.agentConnected && (
                  <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 border-4 border-black flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                )}
              </div>

              {/* Name + Actions */}
              <div className="flex-1 min-w-0 pt-2 sm:pt-12">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="text-xl font-bold bg-white/5 border-white/10 text-white h-10 max-w-xs"
                          placeholder="Name"
                        />
                        <Input
                          value={editForm.username}
                          onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                          className="text-sm bg-white/5 border-white/10 text-gray-400 h-8 max-w-[200px]"
                          placeholder="Username"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                          <div className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r text-white border border-white/20', planBadge.color)}>
                            <planBadge.icon className="w-3 h-3" />
                            {planBadge.label}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={handleSave}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-xl"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl shadow-lg shadow-white/5"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Bio */}
                <div className="mt-4 space-y-3">
                  {isEditing ? (
                    <Textarea
                      value={editForm.bio}
                      onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 min-h-[80px] rounded-xl"
                      placeholder="Write something about yourself..."
                    />
                  ) : user.bio && (
                    <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{user.bio}</p>
                  )}

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {isEditing ? (
                      <>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Briefcase className="w-4 h-4 shrink-0" />
                          <Input
                            value={editForm.company}
                            onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white h-8 w-48 rounded-lg"
                            placeholder="Company"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-4 h-4 shrink-0" />
                          <Input
                            value={editForm.experience}
                            onChange={e => setEditForm(f => ({ ...f, experience: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white h-8 w-36 rounded-lg"
                            placeholder="Experience"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Globe className="w-4 h-4 shrink-0" />
                          <Input
                            value={editForm.website}
                            onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white h-8 w-56 rounded-lg"
                            placeholder="Website URL"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Github className="w-4 h-4 shrink-0" />
                          <Input
                            value={editForm.github}
                            onChange={e => setEditForm(f => ({ ...f, github: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white h-8 w-48 rounded-lg"
                            placeholder="GitHub username"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {user.company && (
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <Briefcase className="w-4 h-4 text-white/60" />
                            {user.company}
                          </span>
                        )}
                        {user.experience && (
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <Clock className="w-4 h-4 text-white/60" />
                            {user.experience}
                          </span>
                        )}
                        {user.website && (
                          <a
                            href={user.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-white hover:text-white transition-colors"
                          >
                            <Globe className="w-4 h-4" />
                            {user.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                        {user.github && (
                          <a
                            href={`https://github.com/${user.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
                          >
                            <Github className="w-4 h-4" />
                            {user.github}
                          </a>
                        )}
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <Calendar className="w-4 h-4 text-white/60" />
                          Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Skills */}
            <div className="mt-5 space-y-2">
              {isEditing ? (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Skills (comma separated)</label>
                  <Input
                    value={editForm.skills}
                    onChange={e => setEditForm(f => ({ ...f, skills: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white h-9 max-w-md rounded-xl"
                    placeholder="React, TypeScript, Docker"
                  />
                </div>
              ) : user.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {user.skills.map(skill => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/15 rounded-lg px-3 py-1"
                    >
                      <Code className="w-3 h-3 mr-1" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Key Stats Row (GitHub-style) ─────────────────────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
          {[
            { icon: FolderKanban, label: 'Projects', value: state.projects.length, sub: `${deployedCount} live`, href: '/dashboard/projects', color: 'text-white' },
            { icon: Rocket, label: 'Deployments', value: state.deployments.length, sub: `${successRate}% success`, href: '/dashboard/deployments', color: 'text-emerald-400' },
            { icon: Users, label: 'Connections', value: connections.length, sub: 'teammates', href: '/dashboard/connections', color: 'text-violet-400' },
            { icon: Building2, label: 'Companies', value: state.companies.length, sub: 'orgs', href: '/dashboard/companies', color: 'text-blue-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={statVariants}
            >
              <Link
                to={stat.href}
                className="block p-4 md:p-5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={cn('w-5 h-5 group-hover:scale-110 transition-transform', stat.color)} />
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white font-mono tabular-nums">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
                <div className="text-xs text-gray-600 mt-0.5 font-mono">{stat.sub}</div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Contribution Heatmap ─────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Activity Overview</h2>
            </div>
            <span className="text-xs text-gray-500 font-mono">{heatTotal} contributions in the last 3 months</span>
          </div>

          {/* Heatmap grid */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-1 min-w-max">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={cn('w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm border transition-all hover:ring-2 hover:ring-white/30 cursor-pointer', getHeatColor(day.count, heatMax))}
                      title={`${day.label}: ${day.count} contribution${day.count !== 1 ? 's' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-xs text-gray-600">Less</span>
            <div className="w-2.5 h-2.5 rounded-sm border bg-white/[0.04] border-white/[0.06]" />
            <div className="w-2.5 h-2.5 rounded-sm border bg-emerald-500/20 border-emerald-500/30" />
            <div className="w-2.5 h-2.5 rounded-sm border bg-emerald-500/40 border-emerald-500/50" />
            <div className="w-2.5 h-2.5 rounded-sm border bg-emerald-500/60 border-emerald-500/70" />
            <div className="w-2.5 h-2.5 rounded-sm border bg-emerald-400/80 border-emerald-300" />
            <span className="text-xs text-gray-600">More</span>
          </div>
        </motion.div>

        {/* ── Main Content: Sidebar + Main ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-6">
          {/* ── Left Sidebar ── */}
          <div className="space-y-6">
            {/* Deployment Health */}
            <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Deployment Health</h3>
              </div>
              {/* Success rate ring */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" stroke="url(#gradSuccess)" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(successRate / 100) * 264} 264`}
                    />
                    <defs>
                      <linearGradient id="gradSuccess" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white font-mono">{successRate}%</span>
                    <span className="text-[10px] text-gray-500">success</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-gray-400">{successDeployments} ok</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-500/10">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-gray-400">{failedDeployments} fail</span>
                </div>
              </div>
            </motion.div>

            {/* Task Progress */}
            <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Task Progress</h3>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-white font-mono">{taskCompletion}%</span>
                <span className="text-xs text-gray-500">{doneTasks}/{totalTasks} done</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${taskCompletion}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                />
              </div>
            </motion.div>

            {/* Issue tracker summary */}
            <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white">Issues</h3>
              </div>
              <div className="space-y-3">
                <Link to="/dashboard/bugs" className="flex items-center justify-between hover:bg-white/[0.04] -mx-2 px-2 py-1.5 rounded-lg transition-colors group">
                  <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400 group-hover:text-white">Open Bugs</span>
                  </div>
                  <span className="text-sm font-mono text-white">{openBugs}</span>
                </Link>
                <Link to="/dashboard/errors" className="flex items-center justify-between hover:bg-white/[0.04] -mx-2 px-2 py-1.5 rounded-lg transition-colors group">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-gray-400 group-hover:text-white">Active Errors</span>
                  </div>
                  <span className="text-sm font-mono text-white">{openErrors}</span>
                </Link>
              </div>
            </motion.div>

            {/* Frameworks */}
            {frameworkStats.length > 0 && (
              <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">Tech Stack</h3>
                </div>
                <div className="space-y-2.5">
                  {frameworkStats.map(([fw, count]) => {
                    const pct = state.projects.length > 0 ? (count / state.projects.length) * 100 : 0;
                    return (
                      <div key={fw}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400 font-mono">{fw}</span>
                          <span className="text-gray-600">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Achievements */}
            <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Achievements</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {achievements.map((a) => (
                  <div
                    key={a.label}
                    title={`${a.label} — ${a.desc}`}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all',
                      a.unlocked
                        ? `bg-gradient-to-br ${a.color} border-white/20 opacity-100`
                        : 'bg-white/[0.02] border-white/[0.06] opacity-30 grayscale'
                    )}
                  >
                    <a.icon className={cn('w-5 h-5', a.unlocked ? 'text-white' : 'text-gray-600')} />
                    <span className={cn('text-[9px] font-medium text-center leading-tight', a.unlocked ? 'text-white' : 'text-gray-600')}>{a.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Right Main Content ── */}
          <div className="space-y-6">
            {/* Tabs */}
            <motion.div variants={itemVariants} className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] w-fit">
              {([
                { id: 'overview', label: 'Overview', icon: Sparkles },
                { id: 'projects', label: 'Pinned', icon: FolderKanban },
                { id: 'activity', label: 'Activity', icon: Activity },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </motion.div>

            {/* ── Overview Tab ── */}
            {activeTab === 'overview' && (
              <>
                {/* Pinned Projects (GitHub-style) */}
                <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-5 h-5 text-white" />
                      <h2 className="text-base font-semibold text-white">Pinned Projects</h2>
                    </div>
                    <Link to="/dashboard/projects" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                      View all <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pinnedProjects.map(project => (
                      <Link
                        key={project.id}
                        to={`/dashboard/project/${project.id}`}
                        className="group p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.06] hover:border-white/20 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FolderKanban className="w-4 h-4 text-white/60 shrink-0" />
                            <span className="text-sm font-medium text-white truncate group-hover:text-white">{project.name}</span>
                          </div>
                          <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium shrink-0', getStatusColor(project.status))}>
                            <div className={cn('w-1 h-1 rounded-full bg-current', project.status === 'deployed' && 'animate-pulse')} />
                            {project.status}
                          </div>
                        </div>
                        {project.description && (
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          {project.framework && (
                            <span className="flex items-center gap-1">
                              <Code className="w-3 h-3" />
                              {project.framework}
                            </span>
                          )}
                          {project.visits && project.visits !== '—' && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {project.visits}
                            </span>
                          )}
                          {project.branch && (
                            <span className="flex items-center gap-1 font-mono">
                              <GitBranch className="w-3 h-3" />
                              {project.branch}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                    {pinnedProjects.length === 0 && (
                      <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                        <FolderKanban className="w-10 h-10 text-gray-700 mb-3" />
                        <p className="text-gray-500 text-sm">No projects yet</p>
                        <Link to="/dashboard/projects" className="mt-3 text-xs text-white hover:underline">Create your first project →</Link>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Recent Activity Feed */}
                <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 md:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-white" />
                    <h2 className="text-base font-semibold text-white">Recent Activity</h2>
                  </div>
                  <div className="space-y-1">
                    {recentActivity.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Activity className="w-8 h-8 text-gray-700 mb-2" />
                        <p className="text-gray-500 text-sm">No recent activity</p>
                      </div>
                    )}
                    {recentActivity.map((act, i) => (
                      <Link
                        key={i}
                        to={act.projectId ? `/dashboard/project/${act.projectId}` : '/dashboard/deployments'}
                        className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-white/[0.04] transition-colors group"
                      >
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', act.color)}>
                          <act.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate group-hover:text-white">{act.label}</p>
                          <p className="text-xs text-gray-600 truncate">{act.sub}</p>
                        </div>
                        <span className="text-xs text-gray-600 shrink-0 font-mono">{formatRelativeTime(new Date().toISOString())}</span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

            {/* ── Projects Tab ── */}
            {activeTab === 'projects' && (
              <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-white" />
                    <h2 className="text-base font-semibold text-white">All Projects</h2>
                    <span className="text-xs text-gray-600 font-mono bg-white/5 px-2 py-0.5 rounded-full">{state.projects.length}</span>
                  </div>
                </div>

                {/* Status distribution */}
                <div className="flex gap-2 mb-5 flex-wrap">
                  {[
                    { label: 'Deployed', count: deployedCount, color: 'bg-emerald-500' },
                    { label: 'Building', count: buildingCount, color: 'bg-blue-500' },
                    { label: 'Failed', count: failedCount, color: 'bg-red-500' },
                    { label: 'Stopped', count: stoppedCount, color: 'bg-yellow-500' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className={cn('w-2 h-2 rounded-full', s.color)} />
                      <span className="text-xs text-gray-400">{s.label}</span>
                      <span className="text-xs font-mono text-white">{s.count}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {state.projects.map(project => (
                    <Link
                      key={project.id}
                      to={`/dashboard/project/${project.id}`}
                      className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.06] hover:border-white/20 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                        <FolderKanban className="w-5 h-5 text-white/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{project.name}</span>
                          <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium shrink-0', getStatusColor(project.status))}>
                            {project.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600 mt-0.5">
                          {project.framework && <span className="font-mono">{project.framework}</span>}
                          {project.branch && <span className="flex items-center gap-1 font-mono"><GitBranch className="w-3 h-3" />{project.branch}</span>}
                          {project.visits && project.visits !== '—' && <span>{project.visits} visits</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors shrink-0" />
                    </Link>
                  ))}
                  {state.projects.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FolderKanban className="w-10 h-10 text-gray-700 mb-3" />
                      <p className="text-gray-500 text-sm">No projects yet</p>
                      <Link to="/dashboard/projects" className="mt-3 text-xs text-white hover:underline">Create a project →</Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Activity Tab (Deployments list) ── */}
            {activeTab === 'activity' && (
              <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-white" />
                    <h2 className="text-base font-semibold text-white">Deployment History</h2>
                  </div>
                  <Link to="/dashboard/deployments" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {state.deployments.slice(0, 10).map(dep => {
                    const proj = state.projects.find(p => p.id === dep.projectId);
                    const Icon = dep.status === 'success' ? CheckCircle2 : dep.status === 'failed' ? XCircle : Loader2;
                    return (
                      <Link
                        key={dep.id}
                        to={`/dashboard/project/${dep.projectId}`}
                        className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.06] transition-all group"
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border',
                          dep.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                          dep.status === 'failed' ? 'bg-red-500/10 border-red-500/20' :
                          'bg-blue-500/10 border-blue-500/20'
                        )}>
                          <Icon className={cn('w-4 h-4', dep.status === 'success' ? 'text-emerald-400' : dep.status === 'failed' ? 'text-red-400' : 'text-blue-400 animate-spin')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">{proj?.name || 'Unknown'}</span>
                            <span className="text-xs text-gray-600 font-mono">{dep.version}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 mt-0.5">
                            <span className="flex items-center gap-1 font-mono"><GitBranch className="w-3 h-3" />{dep.branch}</span>
                            <span className="flex items-center gap-1 font-mono"><GitCommit className="w-3 h-3" />{dep.commit?.slice(0, 7)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 shrink-0">{dep.time}</span>
                      </Link>
                    );
                  })}
                  {state.deployments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Rocket className="w-10 h-10 text-gray-700 mb-3" />
                      <p className="text-gray-500 text-sm">No deployments yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Connected Users ── */}
            {connections.length > 0 && (
              <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-white" />
                  <h2 className="text-base font-semibold text-white">Connected Users</h2>
                  <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{connections.length}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {connections.map(conn => {
                    const userId = conn.userId === user.id ? conn.connectedUserId : conn.userId;
                    const connected = connectedUsers[userId];
                    if (!connected) return null;
                    return (
                      <motion.div
                        key={conn.id}
                        variants={itemVariants}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-all duration-300 group"
                      >
                        <Avatar className="w-12 h-12 ring-2 ring-white/[0.06]">
                          <AvatarImage src={connected.avatar} />
                          <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-white to-white/90 text-black">
                            {getInitials(connected.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{connected.name}</p>
                          <p className="text-xs text-gray-500">@{connected.username}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {connected.skills.slice(0, 3).map(skill => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 text-gray-500 border-white/[0.08] rounded"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Link
                          to={`/dashboard/chat`}
                          className="shrink-0 p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <motion.p variants={itemVariants} className="text-center text-xs text-gray-600 mt-8">
          Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </motion.p>
      </motion.div>
    </div>
  );
}
