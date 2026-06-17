import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, FolderGit2, Rocket, Brain, FileCode,
  ScrollText, AlertCircle, Terminal, BarChart3, Users,
  Settings, ChevronDown, Cloud, Plus, Bug, CheckSquare,
  MessageSquare, UserPlus, Building2, User, LogOut,
  Wifi, WifiOff, Menu, X
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { GlobalSearch } from './GlobalSearch';
import { useApp } from '../../lib/store';
import { getInitials } from '../../lib/utils';
import { apiLogout, BASE_URL } from '../../lib/api';
import { NewProjectModal } from '../pages/ProjectsPage';
import { AgentInstallModal } from './AgentInstallModal';

function useAgentStatusMonitor() {
  const { state, dispatch } = useApp();
  const wsRef = useRef<WebSocket | null>(null);
  const wsRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const missRef = useRef(0); // consecutive poll misses before declaring offline

  useEffect(() => {
    if (!state.isAuthenticated) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsBase = BASE_URL.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');

    // ── HTTP polling (primary source of truth) ───────────────────────────────
    async function poll() {
      try {
        const r = await fetch(`${BASE_URL}/terminal/history?sessionId=agent&projectId=default`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json() as any;
        if (d?.data?.agentConnected) {
          missRef.current = 0;
          dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: true, lastSeen: new Date().toISOString() } });
        } else {
          missRef.current += 1;
          // Only declare offline after 3 consecutive misses (30 s) to avoid flapping
          if (missRef.current >= 3) {
            dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: false } });
          }
        }
      } catch {
        missRef.current += 1;
        if (missRef.current >= 3) {
          dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: false } });
        }
      }
    }

    poll(); // immediate check on mount
    pollRef.current = setInterval(poll, 10000); // then every 10 s

    // ── WebSocket (real-time bonus — updates instantly when agent connects) ──
    function connectWs() {
      if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

      try {
        const ws = new WebSocket(`${wsBase}/api/terminal/ws?sessionId=status-monitor&projectId=default&token=${encodeURIComponent(token)}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'agent_connected') {
              missRef.current = 0;
              dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: true, lastSeen: new Date().toISOString() } });
            } else if (msg.type === 'agent_disconnected') {
              // Let the poll confirm before declaring offline
              missRef.current += 1;
            } else if (msg.type === 'session_ready' && msg.agentConnected) {
              missRef.current = 0;
              dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: true, lastSeen: new Date().toISOString() } });
            }
          } catch {}
        };

        // WS close: do NOT flip to offline here — Cloudflare Workers WS has a
        // short idle TTL and closes legitimately. Let the HTTP poll decide.
        ws.onclose = () => {
          wsRetryRef.current = setTimeout(connectWs, 10000);
        };

        ws.onerror = () => ws.close();
      } catch {}
    }

    connectWs();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      if (wsRetryRef.current) clearTimeout(wsRetryRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [state.isAuthenticated]);
}

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [showNewProject, setShowNewProject] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useAgentStatusMonitor();

  const handleLogout = async () => {
    await apiLogout();
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  const mainNav = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: FolderGit2, label: 'Projects', path: '/dashboard/projects' },
    { icon: Rocket, label: 'Deployments', path: '/dashboard/deployments' },
  ];

  const devTools = [
    { icon: Terminal, label: 'Terminal', path: '/dashboard/terminal' },
    { icon: ScrollText, label: 'Logs', path: '/dashboard/logs' },
    { icon: AlertCircle, label: 'Errors', path: '/dashboard/errors' },
    { icon: FileCode, label: 'API Lab', path: '/dashboard/api-lab' },
    { icon: Brain, label: 'AI Testing', path: '/dashboard/ai-testing' },
  ];

  const management = [
    { icon: CheckSquare, label: 'Tasks', path: '/dashboard/tasks' },
    { icon: Bug, label: 'Bugs', path: '/dashboard/bugs' },
    { icon: BarChart3, label: 'Monitoring', path: '/dashboard/monitoring' },
  ];

  const collaboration = [
    { icon: MessageSquare, label: 'Chat', path: '/dashboard/chat' },
    { icon: UserPlus, label: 'Connections', path: '/dashboard/connections' },
    { icon: Building2, label: 'Companies', path: '/dashboard/companies' },
    { icon: Users, label: 'Team', path: '/dashboard/team' },
  ];

  const userNav = [
    { icon: User, label: 'Profile', path: '/dashboard/profile' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const NavSection = ({ items }: { items: typeof mainNav }) => (
    <div className="space-y-0.5">
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
            isActive(item.path)
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <item.icon className="w-[18px] h-[18px]" />
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0A0A0F] text-white">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-50 h-full w-[240px] border-r border-white/5 bg-[#0F0F14] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <Link to="/dashboard" className="h-[72px] border-b border-white/5 flex items-center gap-3 px-6 hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Cloud className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-white leading-none">Opendrap</span>
            <span className="text-[10px] text-gray-500 leading-none mt-0.5">DevOps Platform</span>
          </div>
        </Link>

        {/* New Project Button */}
        <div className="p-4 border-b border-white/5">
          <button
            onClick={() => setShowNewProject(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg hover:bg-gray-100 transition-all font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">Main</div>
            <NavSection items={mainNav} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">Dev Tools</div>
            <NavSection items={devTools} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">Management</div>
            <NavSection items={management} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">Collaboration</div>
            <NavSection items={collaboration} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">Account</div>
            <NavSection items={userNav} />
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5">
          <Link to="/dashboard/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs text-white font-semibold">
              {state.user ? getInitials(state.user.name) : '?'}
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-white">{state.user?.name || 'User'}</div>
              <div className="text-xs text-gray-500">{state.user?.email || ''}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0 ml-0">
        {/* Top Header */}
        <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#0A0A0F]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setSidebarOpen((o) => !o)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-3">
            {/* Agent status badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
              state.agentConnected
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : state.agentInstalled
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-gray-500/10 border-gray-500/20 text-gray-500'
            }`}>
              {state.agentConnected
                ? <><Wifi className="w-3 h-3" /> Agent Connected</>
                : state.agentInstalled
                  ? <><WifiOff className="w-3 h-3" /> Agent Offline</>
                  : <><WifiOff className="w-3 h-3" /> No Agent</>
              }
            </div>
            <NotificationDropdown />
            <Link to="/dashboard/profile">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm text-white font-semibold hover:opacity-80 transition-opacity cursor-pointer">
                {state.user ? getInitials(state.user.name) : '?'}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#0A0A0F] flex flex-col">
          <Outlet />
        </main>
      </div>

      {/* Agent install modal — shown when user is authenticated but hasn't installed agent */}
      {state.isAuthenticated && !state.agentInstalled && <AgentInstallModal />}

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={(project) => {
            dispatch({ type: 'ADD_PROJECT', payload: project });
            setShowNewProject(false);
          }}
        />
      )}
    </div>
  );
}
