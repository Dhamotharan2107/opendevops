import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  GitBranch, ExternalLink, Play, Settings, Activity,
  Terminal, ScrollText, AlertCircle, Brain, FileCode,
  BarChart3, CheckCircle2, Clock, Code, Zap, Copy,
  RefreshCw, Filter, Search, ChevronRight, Server,
  Globe, Users, Bug, TrendingUp, Download, Plus,
  User, X, Send, Trash2
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useApp } from '../../lib/store';
import { BASE_URL } from '../../lib/api';
import { cn, getStatusColor, getPriorityColor, getInitials } from '../../lib/utils';
import type { Project, Deployment, LogEntry, ErrorRecord, AITestResult, APIRequest } from '../../lib/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, type: 'spring', stiffness: 260, damping: 22 },
  }),
};

const tabVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: 0.12 },
  },
};

const pulseVariants = {
  idle: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.15, 1],
    opacity: [1, 0.6, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

const mockUsers: Record<string, { name: string; avatar?: string }> = {
  '1': { name: 'John Doe' },
  '2': { name: 'Alice Johnson' },
  '3': { name: 'Bob Smith' },
  '4': { name: 'Carol Williams' },
  '5': { name: 'Dave Brown' },
};

function generateTimeSeries(points: number, min: number, max: number, label: string) {
  const data: { time: string; value: number }[] = [];
  for (let i = 0; i < points; i++) {
    const h = Math.floor((i * 24) / points);
    const m = ((i * 24 * 60) / points) % 60;
    data.push({
      time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      value: Math.round((min + Math.random() * (max - min)) * 10) / 10,
    });
  }
  return data;
}

export function ProjectDetails() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [deploying, setDeploying] = useState(false);

  const project = useMemo(
    () => state.projects.find((p) => p.id === id),
    [id, state.projects]
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'deployments', label: 'Deployments', icon: GitBranch },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'logs', label: 'Logs', icon: ScrollText },
    { id: 'errors', label: 'Errors', icon: AlertCircle },
    { id: 'ai-testing', label: 'AI Testing', icon: Brain },
    { id: 'api-lab', label: 'API Lab', icon: FileCode },
    { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0A0A0F]">
        <div className="text-center">
          <Server className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-1">Project not found</h2>
          <p className="text-sm text-white/40">The project with ID "{id}" does not exist.</p>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(project.status);

  const handleDeploy = async (project: Project) => {
    setDeploying(true);
    dispatch({ type: 'ADD_DEPLOYMENT', payload: {
      id: crypto.randomUUID(), projectId: project.id,
      version: `v${Date.now()}`, commit: 'HEAD', branch: project.branch,
      status: 'building', time: new Date().toLocaleString(),
    }});
    const wsUrl = BASE_URL.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const ws = new WebSocket(`${wsUrl}/api/terminal/ws?projectId=${project.id}&token=${token}`);
        await new Promise<void>((resolve, reject) => {
          ws.onopen = () => resolve();
          ws.onerror = () => reject(new Error('WS connection failed'));
        });
        ws.send(JSON.stringify({ type: 'terminal_input', input: `cd ${project.name} && git pull && npm install && npm run build` }));
        setTimeout(() => ws.close(), 30000);
      } catch {}
    }
    setDeploying(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0F]">
      <div className="border-b border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <span className={cn('px-2.5 py-0.5 rounded-lg text-xs font-medium border', statusColor)}>
                  {project.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  <span>{project.repo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  <span>{project.branch}</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 22 }}
            >
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">Open App</span>
              </a>
              <button
                onClick={() => handleDeploy(project)}
                disabled={deploying}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Play className={`w-4 h-4 ${deploying ? 'animate-spin' : ''}`} />
                <span className="text-sm">{deploying ? 'Deploying...' : 'Deploy'}</span>
              </button>
            </motion.div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {activeTab === 'overview' && <OverviewTab project={project} />}
            {activeTab === 'terminal' && <TerminalTab projectId={project.id} />}
            {activeTab === 'logs' && <LogsTab projectId={project.id} />}
            {activeTab === 'errors' && <ErrorsTab projectId={project.id} />}
            {activeTab === 'ai-testing' && <AITestingTab projectId={project.id} />}
            {activeTab === 'api-lab' && <APILabTab />}
            {activeTab === 'monitoring' && <MonitoringTab />}
            {activeTab === 'deployments' && <DeploymentsTab projectId={project.id} />}
            {activeTab === 'settings' && <SettingsTab project={project} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function OverviewTab({ project }: { project: Project }) {
  const { state } = useApp();
  const deployments = useMemo(
    () => state.deployments.filter((d) => d.projectId === project.id),
    [project.id, state.deployments]
  );
  const errors = useMemo(
    () => state.errors.filter((e) => e.projectId === project.id),
    [project.id, state.errors]
  );
  const aiTests = useMemo(
    () => state.aiTestResults.filter((a) => a.projectId === project.id),
    [project.id, state.aiTestResults]
  );

  const deployCount = deployments.length;
  const errorCount = errors.reduce((sum, e) => sum + e.count, 0);
  const testCount = aiTests.reduce((sum, t) => sum + t.results.length, 0);
  const uptime = '99.9%';

  const recentDeploys = deployments.slice(0, 4);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6"
    >
      <div className="grid grid-cols-2 gap-6">
        <motion.div
          variants={itemVariants}
          className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
        >
          <h3 className="font-semibold text-white mb-4">Project Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
              <span className="text-sm text-white/40">Environment</span>
              <div className="flex items-center gap-2">
                <motion.div variants={pulseVariants} animate="pulse">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </motion.div>
                <span className="text-sm font-medium text-white">
                  {project.environment || 'Production'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
              <span className="text-sm text-white/40">Cloud Shell</span>
              <div className="flex items-center gap-2">
                {state.agentConnected ? (
                  <motion.div variants={pulseVariants} animate="pulse">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </motion.div>
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                <span className={cn('text-sm font-medium', state.agentConnected ? 'text-white' : 'text-amber-400')}>
                  {state.agentConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
              <span className="text-sm text-white/40">Tunnel Status</span>
              <div className="flex items-center gap-2">
                {state.agentConnected ? (
                  <motion.div variants={pulseVariants} animate="pulse">
                    <Activity className="w-4 h-4 text-green-500" />
                  </motion.div>
                ) : (
                  <Activity className="w-4 h-4 text-gray-600" />
                )}
                <span className={cn('text-sm font-medium', state.agentConnected ? 'text-white' : 'text-gray-500')}>
                  {state.agentConnected ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-white/40">Last Deployment</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/40" />
                <span className="text-sm font-medium text-white">{project.lastDeploy}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
        >
          <h3 className="font-semibold text-white mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Deployments', value: String(deployCount), icon: GitBranch, color: 'text-purple-400' },
              { label: 'Uptime', value: uptime, icon: Activity, color: 'text-green-400' },
              { label: 'AI Tests', value: String(testCount), icon: Brain, color: 'text-blue-400' },
              { label: 'Errors', value: String(errorCount), icon: AlertCircle, color: 'text-red-400' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={cardVariants}
                custom={i}
                className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors"
                whileHover={{ y: -2 }}
              >
                <stat.icon className={cn('w-5 h-5 mx-auto mb-2', stat.color)} />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/40">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={itemVariants}
        className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Deployment Timeline</h3>
          <span className="text-xs text-white/40">{deployCount} total deployments</span>
        </div>
        <div className="space-y-3">
          {recentDeploys.length > 0 ? (
            recentDeploys.map((deploy, i) => (
              <motion.div
                key={deploy.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ x: 4 }}
                className="flex items-center gap-4 p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
              >
                {deploy.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-white">{deploy.version}</div>
                  <div className="text-xs text-white/40 truncate">{deploy.commit}</div>
                </div>
                <div className="text-xs text-white/40 shrink-0">{deploy.time}</div>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-white/40 text-center py-4">No deployments yet</p>
          )}
        </div>
      </motion.div>

      {(project.members?.length ?? 0) > 0 && (
        <motion.div
          variants={itemVariants}
          className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
        >
          <h3 className="font-semibold text-white mb-4">Team Members</h3>
          <div className="flex flex-wrap gap-4">
            {project.members!.map((member, i) => {
              const user = mockUsers[member.userId];
              return (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -2 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-xs font-medium text-white">
                    {user ? getInitials(user.name) : '?'}
                  </div>
                  <div>
                    <div className="text-sm text-white">{user?.name || member.userId}</div>
                    <div className="text-[10px] text-white/40 capitalize">{member.role}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function DeploymentsTab({ projectId }: { projectId: string }) {
  const { state } = useApp();
  const deployments = useMemo(
    () => state.deployments.filter((d) => d.projectId === projectId),
    [projectId, state.deployments]
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto"
    >
      <motion.div
        variants={itemVariants}
        className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02] backdrop-blur-sm"
      >
        {deployments.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left py-3 px-6 text-sm font-medium text-white/40">Version</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-white/40">Commit</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-white/40">Branch</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-white/40">Status</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-white/40">Time</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((deploy, i) => (
                <motion.tr
                  key={deploy.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-6 font-medium text-white">{deploy.version}</td>
                  <td className="py-4 px-6 text-sm text-white/40">{deploy.commit}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3 h-3 text-white/40" />
                      <span className="text-sm text-white/60">{deploy.branch}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {deploy.status === 'success' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-500">Success</span>
                        </>
                      ) : deploy.status === 'building' ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          >
                            <RefreshCw className="w-4 h-4 text-blue-500" />
                          </motion.div>
                          <span className="text-sm text-blue-500">Building</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-500">Failed</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-white/40">{deploy.time}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center">
            <GitBranch className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">No deployments found</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function TerminalTab({ projectId }: { projectId: string }) {
  const [command, setCommand] = useState('');
  const [lines, setLines] = useState<{ type: string; text: string }[]>([
    { type: 'output', text: 'Opendrap Cloud Terminal v1.0.0' },
    { type: 'output', text: 'Connecting to agent...' },
  ]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wsUrl = BASE_URL.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');
    const token = localStorage.getItem('token');
    if (!token) { setLines((p) => [...p, { type: 'error', text: 'No auth token. Please log in.' }]); return; }

    const ws = new WebSocket(`${wsUrl}/api/terminal/ws?projectId=${projectId}&token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setLines((p) => [...p, { type: 'output', text: 'Terminal connected. Waiting for agent...' }]);
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'terminal_output') {
          setLines((p) => [...p, { type: 'output', text: msg.data }]);
        } else if (msg.type === 'command_output') {
          setLines((p) => [...p, { type: 'output', text: msg.data }]);
        } else if (msg.type === 'error') {
          setLines((p) => [...p, { type: 'error', text: msg.message }]);
        }
      } catch { /* ignore */ }
    };
    ws.onclose = () => {
      setWsConnected(false);
      setLines((p) => [...p, { type: 'error', text: 'Connection closed.' }]);
    };

    return () => ws.close();
  }, [projectId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = command.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setLines((p) => [...p, { type: 'command', text: `$ ${trimmed}` }]);
    wsRef.current.send(JSON.stringify({ type: 'terminal_input', input: trimmed }));
    setCommand('');
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto">
      <motion.div variants={itemVariants} className="border border-white/10 rounded-xl overflow-hidden bg-black">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Terminal className="w-3.5 h-3.5" />
            <span>{wsConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <div className="h-96 overflow-y-auto p-4 font-mono text-sm">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'mb-1 whitespace-pre-wrap',
                line.type === 'command' ? 'text-blue-400' :
                line.type === 'error' ? 'text-red-400' :
                line.type === 'success' ? 'text-green-400' : 'text-gray-300'
              )}
            >
              {line.text}
            </motion.div>
          ))}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
            <span className="text-green-400 shrink-0">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white"
              placeholder={wsConnected ? 'Type command...' : 'Reconnecting...'}
              autoFocus
              disabled={!wsConnected}
            />
          </form>
          <div ref={endRef} />
        </div>
      </motion.div>
    </motion.div>
  );
}

function LogsTab({ projectId }: { projectId: string }) {
  const { state } = useApp();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const filteredLogs = useMemo(() => {
    let logs = state.logs.filter((l) => l.projectId === projectId);
    if (levelFilter !== 'all') {
      logs = logs.filter((l) => l.level === levelFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      logs = logs.filter((l) => l.message.toLowerCase().includes(q));
    }
    return logs;
  }, [projectId, state.logs, search, levelFilter]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-4"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'info', 'warn', 'error'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm transition-colors',
                levelFilter === level
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              )}
            >
              {level.toUpperCase()}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Refresh</span>
        </button>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="border border-white/10 rounded-xl overflow-hidden bg-black"
      >
        <div className="h-96 overflow-y-auto p-4 font-mono text-xs">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.008 }}
                className="mb-1 flex items-start gap-3"
              >
                <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                <span
                  className={cn(
                    'w-12 shrink-0',
                    log.level === 'error'
                      ? 'text-red-400'
                      : log.level === 'warn'
                      ? 'text-yellow-400'
                      : 'text-blue-400'
                  )}
                >
                  {log.level.toUpperCase()}
                </span>
                <span className="text-gray-300 flex-1">{log.message}</span>
              </motion.div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-white/20">
              No logs found
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ErrorsTab({ projectId }: { projectId: string }) {
  const { state } = useApp();
  const errors = useMemo(
    () => state.errors.filter((e) => e.projectId === projectId),
    [projectId, state.errors]
  );

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-500',
    high: 'bg-orange-500/20 text-orange-500',
    medium: 'bg-yellow-500/20 text-yellow-500',
    low: 'bg-blue-500/20 text-blue-500',
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-4"
    >
      {errors.length > 0 ? (
        errors.map((error, i) => (
          <motion.div
            key={error.id}
            variants={cardVariants}
            custom={i}
            whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.15)' }}
            className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-white">{error.title}</h3>
                  <span className={cn('px-2 py-1 rounded text-xs', severityColors[error.severity])}>
                    {error.severity}
                  </span>
                  <span className={cn('px-2 py-1 rounded text-xs',
                    error.status === 'open' ? 'bg-red-500/20 text-red-500'
                    : error.status === 'investigating' ? 'bg-yellow-500/20 text-yellow-500'
                    : 'bg-green-500/20 text-green-500'
                  )}>
                    {error.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/40">
                  <span>{error.count} occurrences</span>
                  <span>•</span>
                  <span>Last seen {error.lastSeen}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/40" />
            </div>
            <div className="p-4 bg-black rounded-lg font-mono text-xs text-gray-400 whitespace-pre-wrap">
              {error.message}
              {'\n'}
              {error.stackTrace}
            </div>
          </motion.div>
        ))
      ) : (
        <motion.div variants={itemVariants} className="text-center py-16">
          <CheckCircle2 className="w-10 h-10 text-green-500/50 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No errors reported</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function AITestingTab({ projectId }: { projectId: string }) {
  const { state } = useApp();
  const [prompt, setPrompt] = useState('');

  const testResults = useMemo(
    () => state.aiTestResults.filter((a) => a.projectId === projectId),
    [projectId, state.aiTestResults]
  );

  const allTests = useMemo(
    () => testResults.flatMap((r) => r.results),
    [testResults]
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
      >
        <h3 className="font-semibold text-white mb-4">Run AI Test</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Test Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/20"
              rows={3}
              placeholder="Test this website like a customer trying to purchase a product..."
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity">
            <Zap className="w-4 h-4" />
            <span>Run AI Test</span>
          </button>
        </div>
      </motion.div>

      {allTests.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-3 gap-4">
            {allTests.map((test, i) => (
              <motion.div
                key={i}
                variants={cardVariants}
                custom={i}
                whileHover={{ y: -2 }}
                className="border border-white/10 rounded-lg p-4 bg-white/[0.02] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">{test.name}</span>
                  {test.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {test.status === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                  {test.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
                <div className="text-xs text-white/40">Completed in {test.duration}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        variants={itemVariants}
        className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
      >
        <h3 className="font-semibold text-white mb-4">Test Results</h3>
        <div className="space-y-4">
          <div className="aspect-video bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg flex items-center justify-center">
            <Brain className="w-16 h-16 text-purple-500/60" />
          </div>
          <p className="text-sm text-white/40">
            {testResults.length > 0
              ? `${allTests.length} tests completed across ${testResults.length} test runs.`
              : 'Run an AI test to see detailed results, screenshots, and bug reports here.'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function APILabTab() {
  const { state } = useApp();
  const [method, setMethod] = useState<APIRequest['method']>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);

  const collections = state.apiCollections;

  const handleSend = () => {
    setResponse({
      status: 200,
      body: JSON.stringify({ status: 'success', data: { id: Date.now(), url, method } }, null, 2),
    });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto"
    >
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <motion.div
            variants={itemVariants}
            className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
          >
            <h3 className="font-semibold text-white mb-4">Request Builder</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as APIRequest['method'])}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/20"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                  <option>PATCH</option>
                </select>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                />
                <button
                  onClick={handleSend}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Headers</label>
                <textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/20"
                  rows={4}
                  placeholder="Content-Type: application/json"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/20"
                  rows={6}
                  placeholder='{"key": "value"}'
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Response</h3>
              <button className="text-sm text-purple-400 hover:underline flex items-center gap-1">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <div className="p-4 bg-black rounded-lg font-mono text-xs text-gray-400 whitespace-pre-wrap">
              {response
                ? `HTTP/1.1 ${response.status} OK\nContent-Type: application/json\n\n${response.body}`
                : 'Send a request to see the response here.'}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            variants={itemVariants}
            className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
          >
            <h3 className="font-semibold text-white mb-4">Collections</h3>
            <div className="space-y-2">
              {collections.length > 0 ? (
                collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => {
                      const req = collection.requests[0];
                      if (req) {
                        setMethod(req.method);
                        setUrl(req.url);
                        setHeaders(
                          Object.entries(req.headers)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join('\n')
                        );
                        setBody(req.body || '');
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-white/60 hover:text-white"
                  >
                    {collection.name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-white/40 text-center py-4">No collections</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function MonitoringTab() {
  const cpuData = useMemo(() => generateTimeSeries(12, 30, 90, 'CPU'), []);
  const memoryData = useMemo(() => generateTimeSeries(12, 1.5, 4.0, 'Memory'), []);
  const requestsData = useMemo(() => generateTimeSeries(12, 800, 2500, 'Requests'), []);
  const latencyData = useMemo(() => generateTimeSeries(12, 50, 400, 'Latency'), []);

  const metrics = [
    { label: 'Response Time', value: `${Math.round(latencyData.reduce((a, b) => a + b.value, 0) / latencyData.length)}ms`, icon: Activity, color: 'text-green-500' },
    { label: 'Requests/min', value: String(Math.round(requestsData.reduce((a, b) => a + b.value, 0) / requestsData.length)), icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Error Rate', value: `${(Math.random() * 0.5).toFixed(2)}%`, icon: AlertCircle, color: 'text-yellow-500' },
    { label: 'Uptime', value: '99.9%', icon: CheckCircle2, color: 'text-green-500' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6"
    >
      <div className="grid grid-cols-2 gap-6">
        <motion.div
          variants={itemVariants}
          className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
        >
          <h3 className="font-semibold text-white mb-4">CPU Usage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cpuData}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 11 }} />
              <YAxis stroke="#555" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#888' }}
              />
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#cpuGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
        >
          <h3 className="font-semibold text-white mb-4">Memory Usage (GB)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={memoryData}>
              <defs>
                <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 11 }} />
              <YAxis stroke="#555" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#888' }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#memGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div
          variants={itemVariants}
          className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
        >
          <h3 className="font-semibold text-white mb-4">Requests</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={requestsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 11 }} />
              <YAxis stroke="#555" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#888' }}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
        >
          <h3 className="font-semibold text-white mb-4">Latency (ms)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 11 }} />
              <YAxis stroke="#555" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#888' }}
              />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            variants={cardVariants}
            custom={i}
            whileHover={{ y: -3 }}
            className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <metric.icon className={cn('w-5 h-5', metric.color)} />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
            <div className="text-sm text-white/40">{metric.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function SettingsTab({ project }: { project: Project }) {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/projects/${project.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      dispatch({ type: 'REMOVE_PROJECT', payload: project.id });
      navigate('/dashboard/projects');
    } catch { /* ignore */ }
    setDeleting(false);
  };

  const settings = [
    { title: 'Git Repository', value: project.repo },
    { title: 'Branch', value: project.branch },
    { title: 'Framework', value: project.framework },
    { title: 'Environment', value: project.environment || 'Production' },
    { title: 'Public URL', value: project.url },
  ];

  const envVars = [
    { key: 'DATABASE_URL', value: 'postgresql://...' },
    { key: 'API_KEY', value: '••••••••••••••••' },
    { key: 'NODE_ENV', value: project.environment?.toLowerCase() || 'production' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-6"
    >
      {settings.map((setting, i) => (
        <motion.div
          key={setting.title}
          variants={itemVariants}
          custom={i}
          className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white mb-1">{setting.title}</h3>
              <p className="text-sm text-white/40 font-mono">{setting.value}</p>
            </div>
            <button className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors text-sm">
              Edit
            </button>
          </div>
        </motion.div>
      ))}

      <motion.div
        variants={itemVariants}
        className="border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
      >
        <h3 className="font-semibold text-white mb-4">Environment Variables</h3>
        <div className="space-y-3">
          {envVars.map((env, i) => (
            <motion.div
              key={env.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 p-3 bg-white/5 rounded-lg"
            >
              <div className="flex-1 font-mono text-sm text-white">
                <span className="text-white/40">{env.key}=</span>
                <span>{env.value}</span>
              </div>
              <button className="text-xs text-purple-400 hover:underline">Edit</button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="border border-red-500/20 rounded-xl p-6 bg-red-500/5">
        <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-white/40 mb-4">Permanently delete this project and all its data.</p>
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteProject}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-white/60 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete Project
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
