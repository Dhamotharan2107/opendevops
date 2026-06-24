import { useState, useMemo, useRef, useEffect, Component, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  GitBranch, ExternalLink, Play, Settings, Activity,
  Terminal, ScrollText, AlertCircle, Brain, FileCode,
  BarChart3, CheckCircle2, Clock, Code, Zap, Copy,
  RefreshCw, Filter, Search, ChevronRight, Server,
  Globe, Users, Bug, TrendingUp, Download, Plus,
  User, X, Send, Trash2, Square, Link, Loader2,
  CloudLightning, WifiOff, ChevronDown, Check,
  FileEdit, FolderOpen, File as FileIcon, Save, ArrowLeft
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useApp } from '../../lib/store';
import { BASE_URL, githubFetchBranches, getGitHubPat, apiGetProjects, apiGetLogs, apiGetErrors } from '../../lib/api';
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

class ProjectErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ color: '#fff', fontSize: 18, marginBottom: 8 }}>Failed to load project</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24, maxWidth: 400 }}>{this.state.error}</p>
            <button
              onClick={() => window.location.href = '/dashboard/projects'}
              style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
            >
              Back to Projects
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ProjectDetails() {
  return <ProjectErrorBoundary><ProjectDetailsInner /></ProjectErrorBoundary>;
}

function ProjectDetailsInner() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [deploying, setDeploying] = useState(false);
  const [deployPhase, setDeployPhase] = useState('');
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [tunnelRunning, setTunnelRunning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [tunnelPort, setTunnelPort] = useState('8000');
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectFetched, setProjectFetched] = useState(false);
  const deployWsRef = useRef<WebSocket | null>(null);

  // Branch state
  const [branches, setBranches] = useState<string[]>([]);
  const [branchSearch, setBranchSearch] = useState('');
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [activeBranch, setActiveBranch] = useState('');
  const [changingBranch, setChangingBranch] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  const project = useMemo(
    () => state.projects.find((p) => p.id === id),
    [id, state.projects]
  );

  // On direct URL navigation projects list may be empty.
  // Must wait for auth before calling the API.
  useEffect(() => {
    if (project || projectFetched || projectLoading || !state.isAuthenticated) return;
    setProjectLoading(true);
    apiGetProjects()
      .then(({ projects }) => dispatch({ type: 'SET_PROJECTS', payload: projects }))
      .catch(() => {})
      .finally(() => { setProjectLoading(false); setProjectFetched(true); });
  }, [project, projectFetched, projectLoading, state.isAuthenticated]);

  // Restore a previously-started tunnel URL after a page refresh. The tunnel is
  // still running in Cloud Shell (nohup), so its public URL remains valid until
  // the user clicks Stop. Drop entries older than 12h to avoid showing dead URLs.
  useEffect(() => {
    if (!id) return;
    try {
      const saved = localStorage.getItem('opendrap_tunnel_' + id);
      if (!saved) return;
      const { url, ts } = JSON.parse(saved);
      if (url && (!ts || Date.now() - ts < 12 * 60 * 60 * 1000)) {
        setTunnelUrl(url);
        setTunnelRunning(true);
      } else {
        localStorage.removeItem('opendrap_tunnel_' + id);
      }
    } catch {}
  }, [id]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'deployments', label: 'Deployments', icon: GitBranch },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'editor', label: 'Editor', icon: FileEdit },
    { id: 'logs', label: 'Logs', icon: ScrollText },
    { id: 'errors', label: 'Errors', icon: AlertCircle },
    { id: 'ai-testing', label: 'AI Testing', icon: Brain },
    { id: 'api-lab', label: 'API Lab', icon: FileCode },
    { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Sync activeBranch whenever project changes
  useEffect(() => {
    if (project && !activeBranch) setActiveBranch(project.branch || 'main');
  }, [project?.branch]);

  // Fetch branches from GitHub when project loads
  useEffect(() => {
    if (!project?.repo) return;
    const pat = getGitHubPat();
    if (!pat) {
      // No PAT — just show current branch
      setBranches(project.branch ? [project.branch] : ['main']);
      return;
    }
    const match = project.repo.match(/github\.com[:/]([^/]+\/[^/.]+)/);
    if (!match) return;
    const fullName = match[1];
    githubFetchBranches(pat, fullName)
      .then((brs) => { if (brs.length) setBranches(brs); })
      .catch(() => setBranches(project.branch ? [project.branch] : ['main']));
  }, [project?.repo]);

  // Close branch dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
        setBranchSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBranchChange = async (branch: string) => {
    if (!project || branch === activeBranch) { setBranchDropdownOpen(false); return; }
    setBranchDropdownOpen(false);
    setBranchSearch('');
    setChangingBranch(true);

    const wsBase = BASE_URL.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const ws = new WebSocket(`${wsBase}/api/terminal/ws?sessionId=branch-${Date.now()}&projectId=default&token=${encodeURIComponent(token)}`);
        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: 'terminal_input',
            input: `cd ~/opendev/projects/${project.name} && git fetch --all && git checkout ${branch} && git pull origin ${branch} && echo "Switched to ${branch}"`,
          }));
          setTimeout(() => ws.close(), 15000);
        };
      } catch {}
    }

    setActiveBranch(branch);
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...project, branch } });
    setTimeout(() => setChangingBranch(false), 1500);
  };

  const filteredBranches = branches.filter((b) =>
    b.toLowerCase().includes(branchSearch.toLowerCase())
  );

  if (!project) {
    const isLoading = projectLoading || !projectFetched || !state.isAuthenticated;
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          {isLoading ? (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '3px solid rgba(124,58,237,0.3)',
                borderTopColor: '#7c3aed',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading project...</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Project not found</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>No project with ID "{id}" exists in your account.</p>
              <button
                onClick={() => navigate('/dashboard/projects')}
                style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
              >
                View all projects
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(project.status);

  function getStartCommand(framework: string): { cmd: string; port: number } {
    switch (framework) {
      case 'nextjs':  return { cmd: 'npm run start', port: 3000 };
      case 'react':   return { cmd: 'npx serve dist -p 3000 -s', port: 3000 };
      case 'vue':     return { cmd: 'npm run preview -- --port 3000', port: 3000 };
      case 'nuxt':    return { cmd: 'npm run preview', port: 3000 };
      case 'svelte':  return { cmd: 'npm run preview -- --port 3000', port: 3000 };
      case 'python':  return { cmd: 'python app.py', port: 5000 };
      case 'fastapi': return { cmd: 'uvicorn main:app --host 0.0.0.0 --port 3000', port: 3000 };
      case 'django':  return { cmd: 'python manage.py runserver 0.0.0.0:3000', port: 3000 };
      default:        return { cmd: 'npm start', port: 3000 };
    }
  }

  // Deploy = LocalTunnel only (no login).
  // User starts the server themselves in the Terminal tab, then clicks Deploy.
  const handleDeploy = async (project: Project) => {
    if (!state.agentConnected) {
      setDeployLogs(['Agent not connected. Start the agent first.']);
      return;
    }
    setDeploying(true);
    setTunnelUrl(null);
    setDeployLogs([]);
    setDeployPhase('Starting tunnel...');

    const port = parseInt(tunnelPort, 10) || 8000;
    const subdomain = (project.name || 'app').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'app';
    const deploymentId = crypto.randomUUID();
    dispatch({ type: 'ADD_DEPLOYMENT', payload: {
      id: deploymentId, projectId: project.id,
      version: `v${Date.now()}`, commit: 'HEAD', branch: activeBranch || project.branch,
      status: 'building', time: new Date().toLocaleString(),
    }});

    const wsBase = BASE_URL.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');
    const token = localStorage.getItem('token');
    if (!token) { setDeploying(false); return; }

    // LocalTunnel (no login required). Matches "your url is: https://xxx.loca.lt".
    const TUNNEL_REGEX = /https:\/\/[a-z0-9-]+\.loca\.lt/;
    // Uses globally installed `lt` so the subdomain flag is available.
    // If subdomain is taken, LocalTunnel auto-appends a number.
    const tunnelCmd = [
      `cd "$HOME" 2>/dev/null || cd /`,
      `echo "=== Checking port ${port}..."`,
      `if curl -s -o /dev/null --max-time 3 http://localhost:${port}; then echo "=== Port ${port} is serving."; else echo "=== WARNING: nothing is responding on port ${port} yet. Start your server in the Terminal tab first (the URL will still open but 502 until then)."; fi`,
      `echo "=== If the loca.lt page asks for a password, enter this IP:"`,
      `curl -s --max-time 5 https://loca.lt/mytunnelpassword || curl -s --max-time 5 ifconfig.me || echo "(could not fetch IP)"`,
      `echo ""`,
      `echo "=== Starting LocalTunnel on port ${port} as ${subdomain}.loca.lt..."`,
      `lt --port ${port} --subdomain ${subdomain} 2>&1`,
    ].join('; ');

    let urlFound = false;
    let waitTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      const ws = new WebSocket(`${wsBase}/api/terminal/ws?sessionId=tunnel-${deploymentId}&projectId=default&token=${encodeURIComponent(token)}`);
      deployWsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'terminal_input', input: tunnelCmd }));
        // If no URL after 40s, tell the user what to check instead of hanging silently.
        waitTimer = setTimeout(() => {
          if (!urlFound) {
            setDeployLogs((prev) => [...prev,
              '=== Still waiting for a tunnel URL after 40s.',
              `=== Check: (1) is your server running on port ${port}? (2) try the Terminal tab and run: lt --port ${port} --subdomain ${subdomain}`,
            ]);
          }
        }, 40000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const text: string = msg.data || msg.message || '';
          if (!text) return;
          setDeployLogs((prev) => [...prev, text]);
          const match = text.match(TUNNEL_REGEX);
          if (match && !urlFound) {
            urlFound = true;
            if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
            const url = match[0];
            setTunnelUrl(url);
            setTunnelRunning(true);
            setDeployPhase('Live');
            setDeploying(false);
            // Persist so the live URL survives a page refresh (the tunnel keeps
            // running in Cloud Shell via nohup, so the URL stays valid).
            try { localStorage.setItem('opendrap_tunnel_' + project.id, JSON.stringify({ url, ts: Date.now() })); } catch {}
            dispatch({ type: 'UPDATE_PROJECT', payload: { ...project, url, status: 'deployed' } });
          }
        } catch {}
      };

      ws.onclose = () => {
        if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
        if (!urlFound) {
          setDeployLogs((prev) => [...prev, '=== Connection closed before the tunnel came up. Click Publish to retry.']);
          setDeployPhase('');
          setDeploying(false);
        }
      };
      ws.onerror = () => {
        setDeployLogs((prev) => [...prev, 'Connection error. Is agent running?']);
        setDeploying(false);
      };
    } catch {
      setDeploying(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    const wsBase = BASE_URL.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');
    const token = localStorage.getItem('token');
    if (token && project) {
      try {
        const ws = new WebSocket(`${wsBase}/api/terminal/ws?sessionId=stop-${Date.now()}&projectId=default&token=${encodeURIComponent(token)}`);
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'terminal_input', input: 'pkill -f "bin/lt"; pkill -f cloudflared; echo "Stopped."' }));
          setTimeout(() => ws.close(), 5000);
        };
      } catch {}
    }
    if (deployWsRef.current) {
      deployWsRef.current.close();
      deployWsRef.current = null;
    }
    setTunnelUrl(null);
    setTunnelRunning(false);
    setDeployPhase('');
    setDeployLogs([]);
    setStopping(false);
    if (project) {
      try { localStorage.removeItem('opendrap_tunnel_' + project.id); } catch {}
      dispatch({ type: 'UPDATE_PROJECT', payload: { ...project, status: 'stopped' } });
    }
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
                  <span className="truncate max-w-xs">{project.repo}</span>
                </div>

                {/* Branch dropdown — Git Desktop style */}
                <div className="relative" ref={branchDropdownRef}>
                  <button
                    onClick={() => { setBranchDropdownOpen((o) => !o); setBranchSearch(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  >
                    {changingBranch
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                      : <GitBranch className="w-3.5 h-3.5 text-violet-400" />}
                    <span className="text-sm font-medium">{activeBranch || project.branch}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${branchDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {branchDropdownOpen && (
                    <div className="absolute top-full mt-1.5 left-0 z-50 w-64 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      {/* Search */}
                      <div className="p-2 border-b border-white/10">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                          <input
                            autoFocus
                            value={branchSearch}
                            onChange={(e) => setBranchSearch(e.target.value)}
                            placeholder="Filter branches..."
                            className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                          />
                        </div>
                      </div>
                      {/* Branch list */}
                      <div className="max-h-52 overflow-y-auto py-1">
                        {filteredBranches.length === 0 ? (
                          <p className="text-xs text-white/30 text-center py-4">No branches found</p>
                        ) : filteredBranches.map((b) => (
                          <button
                            key={b}
                            onClick={() => handleBranchChange(b)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                          >
                            <GitBranch className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                            <span className={`flex-1 text-sm truncate ${b === activeBranch ? 'text-violet-400 font-medium' : 'text-white/70'}`}>{b}</span>
                            {b === activeBranch && <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            <motion.div
              className="flex items-center gap-3 flex-wrap"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 22 }}
            >
              {tunnelUrl ? (
                <a
                  href={tunnelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors max-w-xs"
                >
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate">{tunnelUrl.replace('https://', '')}</span>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
              ) : project.url ? (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-sm">Open App</span>
                </a>
              ) : null}

              {!state.agentConnected && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs">
                  <WifiOff className="w-3.5 h-3.5" />
                  Agent Offline
                </div>
              )}

              {tunnelRunning ? (
                <button
                  onClick={handleStop}
                  disabled={stopping}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
                >
                  <Square className="w-4 h-4" />
                  <span className="text-sm">{stopping ? 'Stopping...' : 'Stop Tunnel'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 border border-white/10 rounded-lg bg-white/5 overflow-hidden">
                    <span className="pl-3 text-xs text-white/30 select-none">port</span>
                    <input
                      type="number"
                      value={tunnelPort}
                      onChange={(e) => setTunnelPort(e.target.value)}
                      className="w-16 px-2 py-2 bg-transparent text-sm text-white outline-none"
                      placeholder="8000"
                    />
                  </div>
                  <button
                    onClick={() => handleDeploy(project)}
                    disabled={deploying || !state.agentConnected}
                    title={!state.agentConnected ? 'Agent must be connected' : 'Start a public tunnel (LocalTunnel) to your server'}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudLightning className="w-4 h-4" />}
                    <span className="text-sm">{deploying ? (deployPhase || 'Starting...') : 'Publish'}</span>
                  </button>
                </div>
              )}
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
            {activeTab === 'overview' && <OverviewTab project={project} tunnelUrl={tunnelUrl} deployLogs={deployLogs} deployPhase={deployPhase} tunnelRunning={tunnelRunning} onStop={handleStop} stopping={stopping} deploying={deploying} />}
            {activeTab === 'terminal' && <TerminalTab projectId={project.id} projectName={project.name} />}
            {activeTab === 'editor' && <EditorTab projectId={project.id} projectName={project.name} />}
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

function OverviewTab({ project, tunnelUrl, deployLogs, deployPhase, tunnelRunning, onStop, stopping, deploying }: {
  project: Project;
  tunnelUrl: string | null;
  deployLogs: string[];
  deployPhase: string;
  tunnelRunning: boolean;
  onStop: () => void;
  stopping: boolean;
  deploying: boolean;
}) {
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

  const deployLogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    deployLogRef.current?.scrollTo({ top: 9999, behavior: 'smooth' });
  }, [deployLogs]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Live URL banner */}
      {tunnelUrl && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <motion.div variants={pulseVariants} animate="pulse">
              <Globe className="w-5 h-5 text-emerald-400" />
            </motion.div>
            <div>
              <p className="text-xs text-emerald-400/70 mb-0.5">Live via LocalTunnel</p>
              <a href={tunnelUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-300 font-mono text-sm hover:underline flex items-center gap-1">
                {tunnelUrl}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(tunnelUrl).catch(() => {})}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white transition-colors"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
            <button
              onClick={onStop}
              disabled={stopping}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Square className="w-3 h-3" /> {stopping ? 'Stopping...' : 'Stop'}
            </button>
          </div>
        </motion.div>
      )}

      {/* How-to hint when not yet live */}
      {!tunnelUrl && !deploying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl text-sm"
        >
          <CloudLightning className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
          <div className="text-white/50 leading-relaxed">
            <span className="text-violet-300 font-medium">How to publish: </span>
            Open the <strong className="text-white/70">Terminal</strong> tab → start your server (e.g. <code className="bg-white/5 px-1.5 py-0.5 rounded text-xs font-mono text-white/60">python manage.py runserver 0.0.0.0:8000</code>) → come back here and click <strong className="text-white/70">Publish</strong> to create a public LocalTunnel URL. If the <code className="bg-white/5 px-1 rounded text-xs font-mono text-white/60">loca.lt</code> page asks for a password, enter the IP shown in the publish logs.
          </div>
        </motion.div>
      )}

      {/* Deploy / tunnel logs */}
      {(deployLogs.length > 0 || (deployPhase && deployPhase !== 'Live')) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-white/10 rounded-xl overflow-hidden bg-black"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Loader2 className={`w-3.5 h-3.5 ${deployPhase === 'Live' ? 'hidden' : 'animate-spin'}`} />
              <span>{deployPhase || 'Deploying...'}</span>
            </div>
          </div>
          <div ref={deployLogRef} className="h-40 overflow-y-auto p-3 font-mono text-xs space-y-0.5">
            {deployLogs.map((line, i) => (
              <div key={i} className={
                line.includes('===') ? 'text-violet-400 font-semibold' :
                line.toLowerCase().includes('error') ? 'text-red-400' :
                line.includes('loca.lt') ? 'text-emerald-400 font-bold' :
                'text-gray-400'
              }>{line}</div>
            ))}
          </div>
        </motion.div>
      )}

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

function TerminalTab({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [cwd, setCwd] = useState('~');
  const [hostname, setHostname] = useState('cloudshell');
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [lines, setLines] = useState<{ type: string; text: string }[]>([
    { type: 'system', text: `Connecting to agent...` },
  ]);
  const [wsConnected, setWsConnected] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wsBase = BASE_URL.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');
    const token = localStorage.getItem('token');
    if (!token) { setLines((p) => [...p, { type: 'error', text: 'No auth token.' }]); return; }

    let destroyed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 2000;

    function connect() {
      if (destroyed) return;
      const ws = new WebSocket(`${wsBase}/api/terminal/ws?sessionId=project-${projectId}&projectId=default&token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        retryDelay = 2000;
        setWsConnected(true);
        setLines((p) => [...p, { type: 'system', text: 'Connected. Waiting for agent...' }]);
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
              if (rest) setLines((p) => [...p, { type: 'output', text: rest }]);
              return;
            }
            if (text.trim()) setLines((p) => [...p, { type: 'output', text }]);
          } else if (msg.type === 'cwd') {
            setCwd(msg.data.replace(/\/home\/[^/]+/, '~').replace(/\/root/, '~'));
          } else if (msg.type === 'agent_connected' || (msg.type === 'session_ready' && msg.agentConnected)) {
            const h = msg.hostname || 'cloudshell';
            setHostname(h);
            setAgentConnected(true);
            ws.send(JSON.stringify({ type: 'terminal_input', input: 'echo __CWD__:$(pwd)' }));
            setLines((p) => [...p, { type: 'system', text: `Agent connected — ${h}` }]);
          } else if (msg.type === 'session_ready') {
            if (msg.hostname) setHostname(msg.hostname);
            if (msg.cwd) setCwd(msg.cwd.replace(/\/home\/[^/]+/, '~').replace(/\/root/, '~'));
            if (!msg.agentConnected) {
              setLines((p) => [...p, { type: 'system', text: 'Agent offline — run: bash ~/opendrap-agent/restart.sh' }]);
            }
          } else if (msg.type === 'agent_disconnected') {
            setAgentConnected(false);
            setLines((p) => [...p, { type: 'error', text: 'Agent disconnected. Run: bash ~/opendrap-agent/restart.sh' }]);
          } else if (msg.type === 'error' && text) {
            setLines((p) => [...p, { type: 'error', text }]);
          }
        } catch {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        setAgentConnected(false);
        if (!destroyed) {
          setLines((p) => [...p, { type: 'system', text: `Connection lost. Reconnecting in ${retryDelay / 1000}s...` }]);
          retryTimer = setTimeout(() => {
            connect();
            retryDelay = Math.min(retryDelay * 2, 30000);
          }, retryDelay);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    };
  }, [projectId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = command.trim();
    if (!trimmed) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setLines((p) => [...p, { type: 'error', text: 'Not connected. Check your network.' }]);
      return;
    }
    if (!agentConnected) {
      setLines((p) => [
        ...p,
        { type: 'command', text: `${hostname}:${cwd}$ ${trimmed}` },
        { type: 'error', text: 'Agent not connected. Run: bash ~/opendrap-agent/restart.sh' },
      ]);
      setCommand('');
      return;
    }

    setHistory((h) => [trimmed, ...h.slice(0, 99)]);
    setHistIdx(-1);
    setCommand('');

    setLines((p) => [...p, { type: 'command', text: `${hostname}:${cwd}$ ${trimmed}` }]);

    if (trimmed === 'clear') { setLines([]); return; }

    // For cd, append pwd echo so we track cwd in the UI
    const actualCmd = (trimmed === 'cd' || trimmed.startsWith('cd ') || trimmed.startsWith('cd\t'))
      ? `${trimmed} && echo __CWD__:$(pwd)`
      : trimmed;

    wsRef.current.send(JSON.stringify({ type: 'terminal_input', input: actualCmd }));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setCommand((prev) => prev + '\t');
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setLines((p) => [...p, { type: 'command', text: '^C' }]);
      setCommand('');
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ctrl_c' }));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setCommand(history[idx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setCommand(idx < 0 ? '' : history[idx]);
    }
  };

  const prompt = `${hostname}:${cwd}$`;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto">
      <motion.div variants={itemVariants} className="border border-white/10 rounded-xl overflow-hidden bg-[#060608]">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#0F0F14]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs font-mono text-white/30 ml-2">{prompt}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${wsConnected ? 'text-emerald-400' : 'text-red-400/60'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400/60'}`} />
            {wsConnected ? 'Live' : 'Offline'}
          </div>
        </div>

        <div className="h-[520px] overflow-y-auto p-4 font-mono text-sm space-y-0.5" onClick={() => inputRef.current?.focus()}>
          {lines.map((line, i) => (
            <div
              key={i}
              className={cn(
                'whitespace-pre-wrap leading-relaxed',
                line.type === 'command' ? 'text-violet-400' :
                line.type === 'error'   ? 'text-red-400' :
                line.type === 'system'  ? 'text-white/30 text-xs' :
                'text-gray-200'
              )}
            >
              {line.text}
            </div>
          ))}

          <div className="flex items-center gap-2 mt-1">
            <span className="text-white/40 flex-shrink-0 select-none">{prompt}</span>
            <input
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { handleSubmit(e as any); return; }
                onKeyDown(e);
              }}
              className="flex-1 bg-transparent outline-none text-white font-mono caret-violet-400"
              placeholder={wsConnected ? '' : 'agent offline...'}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              disabled={!wsConnected}
            />
          </div>
          <div ref={endRef} />
        </div>
      </motion.div>
    </motion.div>
  );
}

interface DirEntry { name: string; dir: boolean; }

function EditorTab({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [wsConnected, setWsConnected] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const [absPath, setAbsPath] = useState('~');          // current dir (abs path from agent)
  const [pathInput, setPathInput] = useState('~');       // editable path box
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [loadingDir, setLoadingDir] = useState(false);
  const [openFileAbs, setOpenFileAbs] = useState<string | null>(null);
  const [openFileName, setOpenFileName] = useState('');
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const sendMsg = (obj: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(obj));
      return true;
    }
    setStatus('Not connected to agent.');
    return false;
  };

  const listDir = (p: string) => {
    setLoadingDir(true);
    setStatus('');
    sendMsg({ type: 'list_dir', path: p, request_id: crypto.randomUUID() });
  };

  const openFile = (p: string, name: string) => {
    setStatus(`Opening ${name}...`);
    sendMsg({ type: 'read_file', path: p, request_id: crypto.randomUUID() });
    setOpenFileName(name);
  };

  const save = () => {
    if (!openFileAbs) return;
    setSaving(true);
    setStatus('Saving...');
    sendMsg({ type: 'write_file', path: openFileAbs, content, request_id: crypto.randomUUID() });
  };

  const goUp = () => {
    if (!absPath || absPath === '/' || absPath === '~') return;
    const parent = absPath.replace(/\/[^/]+\/?$/, '') || '/';
    listDir(parent);
  };

  useEffect(() => {
    const wsBase = BASE_URL.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');
    const token = localStorage.getItem('token');
    if (!token) { setStatus('No auth token.'); return; }

    let destroyed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (destroyed) return;
      const ws = new WebSocket(`${wsBase}/api/terminal/ws?sessionId=editor-${projectId}&projectId=default&token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'agent_connected' || (msg.type === 'session_ready' && msg.agentConnected)) {
            setAgentConnected(true);
            // Open the project folder by default; fall back to home on error.
            listDir(`~/opendev/projects/${projectName}`);
          } else if (msg.type === 'session_ready' && !msg.agentConnected) {
            setStatus('Agent offline — start it in Cloud Shell first.');
          } else if (msg.type === 'agent_disconnected') {
            setAgentConnected(false);
            setStatus('Agent disconnected.');
          } else if (msg.type === 'dir_list') {
            setLoadingDir(false);
            if (msg.error) {
              // Project folder probably doesn't exist — fall back to home once.
              if (msg.abs_path && msg.abs_path.includes('/opendev/projects/')) { listDir('~'); return; }
              setStatus(`Cannot open folder: ${msg.error}`);
              return;
            }
            setAbsPath(msg.abs_path || msg.path || '~');
            setPathInput(msg.path || msg.abs_path || '~');
            setEntries(Array.isArray(msg.entries) ? msg.entries : []);
          } else if (msg.type === 'file_content') {
            if (msg.error) { setStatus(`Cannot open file: ${msg.error}`); return; }
            setContent(typeof msg.content === 'string' ? msg.content : '');
            setOpenFileAbs(msg.abs_path || msg.path || null);
            setDirty(false);
            setStatus(`Opened ${msg.abs_path || ''}`);
          } else if (msg.type === 'file_saved') {
            setSaving(false);
            if (msg.error) { setStatus(`Save failed: ${msg.error}`); return; }
            setDirty(false);
            setStatus(`Saved ${msg.abs_path || ''} ✓`);
          }
        } catch {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        setAgentConnected(false);
        if (!destroyed) retryTimer = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      destroyed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    };
  }, [projectId, projectName]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto">
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* File browser */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0F0F14] flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
            <FolderOpen className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span className="text-xs font-medium text-white/70">Files</span>
            <div className={`ml-auto flex items-center gap-1.5 text-xs ${agentConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${agentConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {agentConnected ? 'Agent' : wsConnected ? 'No agent' : 'Offline'}
            </div>
          </div>
          {/* Path box */}
          <div className="flex items-center gap-1 p-2 border-b border-white/10">
            <button onClick={goUp} title="Parent folder" className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <input
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') listDir(pathInput); }}
              spellCheck={false}
              className="flex-1 min-w-0 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-violet-500/50"
            />
            <button onClick={() => listDir(pathInput)} className="px-2 py-1.5 rounded-lg bg-violet-600/30 border border-violet-500/30 text-xs text-violet-300 hover:bg-violet-600/40">Go</button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[460px] py-1">
            {loadingDir ? (
              <div className="flex items-center justify-center py-8 text-white/30 text-xs"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...</div>
            ) : entries.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-8">Empty folder</p>
            ) : entries.map((e) => (
              <button
                key={e.name}
                onClick={() => e.dir ? listDir(`${absPath}/${e.name}`) : openFile(`${absPath}/${e.name}`, e.name)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 text-left"
              >
                {e.dir ? <FolderOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> : <FileIcon className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />}
                <span className={`text-xs truncate ${e.dir ? 'text-blue-300' : 'text-white/70'} ${openFileName === e.name && !e.dir ? 'font-semibold text-violet-300' : ''}`}>{e.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#060608] flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 bg-[#0F0F14]">
            <FileEdit className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span className="text-xs font-mono text-white/70 truncate">{openFileAbs || 'No file open'}</span>
            {dirty && <span className="text-[10px] text-amber-400 flex-shrink-0">● unsaved</span>}
            <button
              onClick={save}
              disabled={!openFileAbs || saving || !agentConnected}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs hover:opacity-90 disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving' : 'Save'}
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setDirty(true); }}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } }}
            spellCheck={false}
            placeholder={openFileAbs ? '' : 'Select a file from the left, or type a path and click Go.'}
            className="flex-1 min-h-[460px] w-full p-4 bg-transparent text-sm text-gray-200 font-mono resize-none outline-none leading-relaxed"
          />
          <div className="px-3 py-1.5 border-t border-white/10 text-[11px] text-white/40 font-mono truncate">{status || 'Ctrl/Cmd+S to save'}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LogsTab({ projectId }: { projectId: string }) {
  const { state } = useApp();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [fetched, setFetched] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Pull real activity logs from the backend (the project's in-memory state.logs
  // is only populated in demo flows, so the tab used to look empty).
  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await apiGetLogs(projectId, levelFilter === 'all' ? undefined : levelFilter, search.trim() || undefined, 1, 200);
      const mapped: LogEntry[] = (res.logs || []).map((item: any) => ({
        id: item.id || 'log-' + Math.random().toString(36).slice(2, 10),
        projectId: item.project_id || projectId,
        level: (item.action === 'error' ? 'error' : item.action === 'warn' ? 'warn' : 'info') as LogEntry['level'],
        message: item.details || item.action || 'Log entry',
        timestamp: item.created_at ? new Date(item.created_at).toLocaleString() : new Date().toLocaleString(),
      }));
      setFetched(mapped);
    } catch {
      // keep whatever we have
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const t = setInterval(loadLogs, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, search]);

  const filteredLogs = useMemo(() => {
    // Merge any in-state project logs with the fetched backend logs.
    const local = state.logs.filter((l) => l.projectId === projectId);
    let logs = [...local, ...fetched];
    if (levelFilter !== 'all') logs = logs.filter((l) => l.level === levelFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      logs = logs.filter((l) => l.message.toLowerCase().includes(q));
    }
    return logs;
  }, [projectId, state.logs, fetched, search, levelFilter]);

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
        <button onClick={loadLogs} className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
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
  const [fetched, setFetched] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadErrors = async () => {
    setLoading(true);
    try {
      const res = await apiGetErrors(projectId);
      setFetched(res.errors || []);
    } catch {
      // keep whatever we have
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadErrors();
    const t = setInterval(loadErrors, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const errors = useMemo(() => {
    const local = state.errors.filter((e) => e.projectId === projectId);
    const backend = fetched.map((item: any) => ({
      id: item.id,
      projectId: item.project_id || projectId,
      title: item.title,
      message: item.message,
      stackTrace: item.stack_trace || '',
      count: item.count || 1,
      severity: item.severity as ErrorRecord['severity'],
      lastSeen: item.updated_at || item.created_at,
      status: item.status as ErrorRecord['status'],
    }));
    return [...local, ...backend];
  }, [projectId, state.errors, fetched]);

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
      <div className="flex items-center justify-end">
        <button onClick={loadErrors} className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>
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
                  <span>Last seen {error.lastSeen ? new Date(error.lastSeen).toLocaleString() : 'N/A'}</span>
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
