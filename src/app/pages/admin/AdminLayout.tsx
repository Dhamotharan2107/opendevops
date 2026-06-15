import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Cloud, LayoutDashboard, Users, Settings2, LogOut,
  ShieldAlert, Menu, X, ExternalLink
} from 'lucide-react';

const nav = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin-prd/dashboard' },
  { icon: Users,           label: 'Users',     path: '/admin-prd/users'     },
  { icon: Settings2,       label: 'Environment', path: '/admin-prd/env'     },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = () => {
    localStorage.removeItem('opendrap_admin_session');
    navigate('/admin-prd');
  };

  return (
    <div className="flex h-screen bg-[#0A0A0F] text-white">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-50 h-full w-[240px] bg-[#0F0F14] border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo + admin badge */}
        <div className="h-[72px] border-b border-white/5 flex items-center gap-3 px-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center">
            <Cloud className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-sm text-white leading-none">Opendrap</span>
            <span className="text-[10px] text-gray-500 leading-none mt-0.5">DevOps Platform</span>
          </div>
        </div>

        {/* Admin badge */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Admin Panel</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive(item.path)
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Go to App
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Exit Admin
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#0A0A0F]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setSidebarOpen((o) => !o)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-sm font-semibold text-white">
                {nav.find((n) => isActive(n.path))?.label ?? 'Admin'}
              </h1>
              <p className="text-xs text-gray-500">opendevops@admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span className="text-xs font-medium text-red-400">Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#0A0A0F]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
