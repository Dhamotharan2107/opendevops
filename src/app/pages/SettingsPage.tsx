import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  User, Lock, Bell, Palette, Key, Fingerprint,
  Save, Check, Eye, EyeOff, Loader2, Shield,
  Terminal, Wifi, WifiOff, Copy, RefreshCw, Download, RotateCcw
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn, getInitials } from '@/lib/utils';
import { apiUpdateProfile } from '@/lib/api';

function getInstallCmd() {
  const token = localStorage.getItem('token');
  if (token) {
    return `curl -sSL "https://opendrap-api.tert.workers.dev/api/install.sh?token=${encodeURIComponent(token)}" | bash`;
  }
  return 'curl -sSL https://opendrap-api.tert.workers.dev/api/install.sh | bash';
}

function getTokenDisplay(token: string) {
  if (token.length <= 20) return token;
  return token.slice(0, 20) + '...' + token.slice(-8);
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'agent', label: 'Agent', icon: Terminal },
];

export function SettingsPage() {
  const { state, dispatch } = useApp();
  const { user } = state;

  // All hooks must come before any conditional return
  const [tab, setTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    website: user?.website || '',
    github: user?.github || '',
    company: user?.company || '',
    skills: Array.isArray(user?.skills) ? user!.skills.join(', ') : (user?.skills as any) || '',
    experience: user?.experience || '',
  });

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState<Record<string, boolean>>({});

  const [notifications, setNotifications] = useState({
    deployments: true,
    bugs: true,
    tasks: true,
    connections: true,
    messages: true,
    email: false,
  });

  const [appearance, setAppearance] = useState({
    density: 'comfortable',
    codeFont: 'monospace',
  });

  // Guard after all hooks
  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
      </div>
    );
  }

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { user: updated } = await apiUpdateProfile(user.id, {
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        website: profile.website,
        github: profile.github,
        company: profile.company,
        skills: profile.skills.split(',').map((s) => s.trim()).filter(Boolean),
        experience: profile.experience,
      });
      dispatch({ type: 'SET_USER', payload: updated });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const saveLocal = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-[900px] mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
          <p className="text-gray-400 text-sm">Manage your account and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar */}
          <nav className="w-full lg:w-48 flex-shrink-0 space-y-1 flex lg:flex-col gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
                  tab === t.id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-6">

            {tab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-5 p-6 bg-white/5 border border-white/10 rounded-xl">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl font-bold text-white">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{user.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{user.email}</p>
                    <button className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors">
                      Change Avatar
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
                  <h3 className="font-semibold text-white">Personal Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', key: 'name', placeholder: 'Your full name' },
                      { label: 'Username', key: 'username', placeholder: 'your_username' },
                      { label: 'Company', key: 'company', placeholder: 'Company name' },
                      { label: 'Experience', key: 'experience', placeholder: 'e.g. 5 years' },
                      { label: 'Website', key: 'website', placeholder: 'https://yoursite.com' },
                      { label: 'GitHub', key: 'github', placeholder: 'github.com/username' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
                        <input
                          value={(profile as any)[key]}
                          onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Skills (comma separated)</label>
                    <input
                      value={profile.skills}
                      onChange={(e) => setProfile((p) => ({ ...p, skills: e.target.value }))}
                      placeholder="React, TypeScript, Docker, Kubernetes"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saved ? <Check className="w-4 h-4" /> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}

            {tab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-violet-400" />
                    <h3 className="font-semibold text-white">Change Password</h3>
                  </div>
                  {(['current', 'new', 'confirm'] as const).map((field) => (
                    <div key={field}>
                      <label className="block text-sm text-gray-400 mb-1.5">
                        {field === 'new' ? 'New Password' : field === 'confirm' ? 'Confirm New Password' : 'Current Password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPwd[field] ? 'text' : 'password'}
                          value={passwords[field]}
                          onChange={(e) => setPasswords((p) => ({ ...p, [field]: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((s) => ({ ...s, [field]: !s[field] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          {showPwd[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={saveLocal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition-opacity"
                  >
                    {saved ? <Check className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                    {saved ? 'Password Updated!' : 'Update Password'}
                  </button>
                </div>
                <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
                  <h3 className="font-semibold text-red-400">Danger Zone</h3>
                  <p className="text-sm text-gray-500">Permanently delete your account and all associated data.</p>
                  <button className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors">
                    Delete Account
                  </button>
                </div>
              </motion.div>
            )}

            {tab === 'notifications' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-5">
                  <h3 className="font-semibold text-white">Notification Preferences</h3>
                  {[
                    { key: 'deployments', label: 'Deployment Updates', desc: 'Get notified when deployments succeed or fail' },
                    { key: 'bugs', label: 'Bug Reports', desc: 'New bugs assigned to you or your project' },
                    { key: 'tasks', label: 'Task Updates', desc: 'Task assignments and status changes' },
                    { key: 'connections', label: 'Connection Requests', desc: 'When someone sends you a connection request' },
                    { key: 'messages', label: 'Chat Messages', desc: 'New messages in chats you belong to' },
                    { key: 'email', label: 'Email Notifications', desc: 'Receive notification summaries via email' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                      </div>
                      <button
                        onClick={() => setNotifications((n) => ({ ...n, [key]: !(n as any)[key] }))}
                        className={cn(
                          'w-11 h-6 rounded-full transition-colors relative',
                          (notifications as any)[key] ? 'bg-violet-500' : 'bg-white/10'
                        )}
                      >
                        <span className={cn(
                          'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                          (notifications as any)[key] ? 'translate-x-6' : 'translate-x-1'
                        )} />
                      </button>
                    </div>
                  ))}
                  <button onClick={saveLocal} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition-opacity">
                    {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : 'Save Preferences'}
                  </button>
                </div>
              </motion.div>
            )}

            {tab === 'appearance' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-5">
                  <h3 className="font-semibold text-white">Appearance</h3>
                  <div>
                    <label className="block text-sm text-gray-400 mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'dark', label: 'Dark', preview: 'bg-[#0A0A0F]' },
                        { value: 'darker', label: 'Darker', preview: 'bg-black' },
                        { value: 'midnight', label: 'Midnight', preview: 'bg-[#060614]' },
                      ].map((t) => (
                        <button
                          key={t.value}
                          className="p-3 bg-white/5 border border-violet-500/30 rounded-lg text-sm text-violet-300 flex flex-col items-center gap-2"
                        >
                          <div className={cn('w-full h-10 rounded', t.preview, 'border border-white/10')} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Interface Density</label>
                    <select
                      value={appearance.density}
                      onChange={(e) => setAppearance((a) => ({ ...a, density: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none"
                    >
                      <option value="compact">Compact</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="spacious">Spacious</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Code Font</label>
                    <select
                      value={appearance.codeFont}
                      onChange={(e) => setAppearance((a) => ({ ...a, codeFont: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none"
                    >
                      <option value="monospace">Monospace</option>
                      <option value="fira-code">Fira Code</option>
                      <option value="jetbrains-mono">JetBrains Mono</option>
                    </select>
                  </div>
                  <button onClick={saveLocal} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition-opacity">
                    {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : 'Save Appearance'}
                  </button>
                </div>
              </motion.div>
            )}
            {tab === 'agent' && <AgentTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentTab() {
  const { state, dispatch } = useApp();
  const [cmdCopied, setCmdCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  const installCmd = useMemo(() => getInstallCmd(), []);
  const token = localStorage.getItem('token') || '';
  const hasToken = token.length > 0;

  const copyCmd = async () => {
    await navigator.clipboard.writeText(installCmd).catch(() => {});
    setCmdCopied(true);
    setTimeout(() => setCmdCopied(false), 2500);
  };

  const copyToken = async () => {
    await navigator.clipboard.writeText(token).catch(() => {});
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2500);
  };

  const reconnect = () => {
    dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: false, lastSeen: new Date().toISOString() } });
  };

  const resetAgent = () => {
    localStorage.removeItem('opendrap_agent_installed');
    localStorage.removeItem('opendrap_agent_id');
    dispatch({ type: 'SET_AGENT_INSTALLED', payload: false });
    dispatch({ type: 'SET_AGENT_STATUS', payload: { connected: false, agentId: null as any } });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Status card */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-violet-400" />
          Agent Status
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: 'Connection',
              value: state.agentConnected ? 'Connected' : 'Offline',
              icon: state.agentConnected ? Wifi : WifiOff,
              color: state.agentConnected ? 'text-emerald-400' : 'text-amber-400',
            },
            {
              label: 'Installed',
              value: state.agentInstalled ? 'Yes' : 'Not installed',
              icon: Shield,
              color: state.agentInstalled ? 'text-emerald-400' : 'text-gray-500',
            },
            {
              label: 'Agent ID',
              value: state.agentId ? state.agentId.slice(0, 20) + '...' : '—',
              icon: Key,
              color: 'text-violet-400',
            },
            {
              label: 'Workspace',
              value: '~/opendrap-agent',
              icon: Terminal,
              color: 'text-blue-400',
            },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-1 p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
              <span className="text-xs text-gray-500">{row.label}</span>
              <div className="flex items-center gap-1.5">
                <row.icon className={cn('w-3.5 h-3.5', row.color)} />
                <span className={cn('text-sm font-mono font-medium', row.color)}>{row.value}</span>
              </div>
            </div>
          ))}
        </div>

        {!state.agentConnected && state.agentInstalled && (
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-300/80 font-mono">
            Agent is offline. Reconnect by running in Cloud Shell:<br />
            <span className="text-white">cd ~/opendrap-agent && python3 agent.py</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={reconnect}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg text-sm text-violet-300 hover:bg-violet-500/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reconnect Agent
          </button>
          <button
            onClick={reconnect}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Restart Agent
          </button>
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Logs
          </button>
        </div>
      </div>

      {/* Install command */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
        <h3 className="font-semibold text-white">Install Command</h3>
        <p className="text-sm text-gray-400">Run this in your terminal to install and start the agent automatically.</p>
        <div className="flex items-center gap-2 p-3.5 bg-[#060608] border border-white/10 rounded-xl">
          <code className="flex-1 text-emerald-300 font-mono text-sm truncate">{installCmd}</code>
          <button
            onClick={copyCmd}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all"
          >
            {cmdCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {cmdCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Token */}
      {hasToken && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-violet-400" />
            API Token
          </h3>
          <p className="text-sm text-gray-400">Your authentication token. Used in the install command above. Keep it secret.</p>
          <div className="flex items-center gap-2 p-3.5 bg-[#060608] border border-white/10 rounded-xl">
            <code className="flex-1 text-amber-300 font-mono text-xs break-all select-all">{getTokenDisplay(token)}</code>
            <button
              onClick={copyToken}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all"
            >
              {tokenCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {tokenCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
        <h3 className="font-semibold text-red-400">Reset Agent</h3>
        <p className="text-sm text-gray-500">Remove agent registration from this dashboard. You will need to reinstall.</p>
        <button
          onClick={resetAgent}
          className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors"
        >
          Reset & Uninstall Agent
        </button>
      </div>
    </motion.div>
  );
}
