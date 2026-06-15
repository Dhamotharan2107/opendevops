import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users, UserPlus, Search, X, Crown, Code2, Eye, Trash2, Loader2
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn, getInitials } from '@/lib/utils';
import type { Project } from '@/lib/types';
import { apiGetProjects } from '@/lib/api';

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  developer: { label: 'Developer', icon: Code2, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
};

const MOCK_MEMBERS = [
  { userId: '1', name: 'You', email: 'you@example.com', role: 'owner' as const, avatar: null },
  { userId: '2', name: 'Alice Johnson', email: 'alice@example.com', role: 'developer' as const, avatar: null },
  { userId: '3', name: 'Bob Smith', email: 'bob@example.com', role: 'developer' as const, avatar: null },
  { userId: '4', name: 'Carol Williams', email: 'carol@example.com', role: 'viewer' as const, avatar: null },
];

export function TeamPage() {
  const { state, dispatch } = useApp();
  const { user, projects } = state;
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'developer' | 'viewer'>('developer');
  const [inviting, setInviting] = useState(false);
  const [members, setMembers] = useState(MOCK_MEMBERS);

  useEffect(() => {
    if (projects.length === 0) {
      setLoading(true);
      apiGetProjects()
        .then(({ projects }) => {
          dispatch({ type: 'SET_PROJECTS', payload: projects });
          if (projects.length > 0) setSelectedProject(projects[0].id);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, []);

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await new Promise((r) => setTimeout(r, 1000));
    const name = inviteEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    setMembers((prev) => [...prev, { userId: Date.now().toString(), name, email: inviteEmail, role: inviteRole, avatar: null }]);
    setInviteEmail('');
    setShowInvite(false);
    setInviting(false);
  };

  const removeMe = (userId: string) => {
    if (userId === '1') return;
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const changeRole = (userId: string, role: 'developer' | 'viewer') => {
    setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, role } : m));
  };

  const project = projects.find((p) => p.id === selectedProject);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Team</h1>
            <p className="text-gray-400 text-sm">{members.length} team members</p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition-opacity"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-violet-500/50"
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((member, i) => {
            const roleCfg = ROLE_CONFIG[member.role];
            const isYou = member.userId === '1';
            return (
              <motion.div
                key={member.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {getInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-white text-sm">{member.name}</span>
                    {isYou && <span className="text-xs text-gray-500">(you)</span>}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{member.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {isYou ? (
                    <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium', roleCfg.color)}>
                      <roleCfg.icon className="w-3 h-3" />
                      {roleCfg.label}
                    </div>
                  ) : (
                    <select
                      value={member.role}
                      onChange={(e) => changeRole(member.userId, e.target.value as any)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 focus:outline-none"
                    >
                      <option value="developer">Developer</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  )}
                  {!isYou && (
                    <button
                      onClick={() => removeMe(member.userId)}
                      className="p-1.5 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Invite Modal */}
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
            <div className="relative bg-[#0F0F14] border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Invite Team Member</h2>
                <button onClick={() => setShowInvite(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email Address</label>
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && invite()}
                    placeholder="colleague@company.com"
                    type="email"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none"
                  >
                    <option value="developer">Developer — Can deploy, view logs, run tests</option>
                    <option value="viewer">Viewer — Read-only access</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowInvite(false)}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={invite}
                    disabled={inviting || !inviteEmail.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg text-sm text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {inviting ? 'Inviting...' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
