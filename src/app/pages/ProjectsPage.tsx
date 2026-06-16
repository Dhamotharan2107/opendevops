import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, FolderGit2, GitBranch, Globe, Clock,
  ChevronRight, Loader2, X, Github, Key, Lock, Eye, EyeOff,
  CheckCircle2, AlertCircle, RefreshCw, Star, GitFork, ArrowLeft,
  Terminal, Copy, Check, ExternalLink, Link2, Wifi, WifiOff,
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { cn, getStatusColor } from '../../lib/utils';
import {
  apiGetProjects, apiCreateProject,
  githubFetchRepos, githubFetchBranches, githubFetchUser,
  getGitHubPat, saveGitHubPat, clearGitHubPat, BASE_URL
} from '../../lib/api';

// ── ProjectsPage ─────────────────────────────────────────────────────────────

export function ProjectsPage() {
  const { state, dispatch } = useApp();
  const { projects } = state;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGetProjects()
      .then(({ projects }) => dispatch({ type: 'SET_PROJECTS', payload: projects }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.repo || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Projects</h1>
            <p className="text-gray-400 text-sm">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-violet-500/50"
          >
            <option value="all">All Status</option>
            <option value="deployed">Deployed</option>
            <option value="building">Building</option>
            <option value="failed">Failed</option>
            <option value="stopped">Stopped</option>
          </select>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderGit2 className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {search || statusFilter !== 'all' ? 'No projects match your filters' : 'No projects yet'}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {search || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Import from GitHub or enter a repo URL to get started'}
            </p>
            {!search && statusFilter === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {filtered.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  to={`/dashboard/project/${project.id}`}
                  className="block p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center">
                      <FolderGit2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium', getStatusColor(project.status))}>
                      <div className={cn('w-1.5 h-1.5 rounded-full bg-current', project.status === 'deployed' && 'animate-pulse')} />
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </div>
                  </div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-violet-400 transition-colors">{project.name}</h3>
                  {project.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>}
                  <div className="space-y-2 text-xs text-gray-500 mt-3">
                    {project.repo && (
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-mono truncate">{project.repo}</span>
                      </div>
                    )}
                    {project.url && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{project.url}</span>
                      </div>
                    )}
                    {project.lastDeploy && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{project.lastDeploy}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {project.framework && (
                        <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-400 font-mono">{project.framework}</span>
                      )}
                      {project.visits && <span className="text-xs text-gray-500">{project.visits} visits</span>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <NewProjectModal
            onClose={() => setShowModal(false)}
            onCreated={(project) => {
              dispatch({ type: 'ADD_PROJECT', payload: project });
              setShowModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── NewProjectModal ───────────────────────────────────────────────────────────

type Step = 'source' | 'github-auth' | 'repo-pick' | 'manual' | 'configure';

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  default_branch: string;
  clone_url: string;
  ssh_url: string;
}

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
}

export function NewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: any) => void;
}) {
  const [step, setStep] = useState<Step>('source');

  // GitHub auth state
  const [pat, setPat] = useState(getGitHubPat());
  const [patInput, setPatInput] = useState('');
  const [showPat, setShowPat] = useState(false);
  const [ghUser, setGhUser] = useState<GitHubUser | null>(null);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghError, setGhError] = useState('');

  // Repo state
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  // Branch state
  const [branches, setBranches] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // Config state (step: configure)
  const [form, setForm] = useState({
    name: '',
    description: '',
    repo: '',
    branch: 'main',
    framework: 'nextjs',
    environment: 'production',
    github_token: '',
  });

  // Manual state
  const [manualToken, setManualToken] = useState('');
  const [showManualToken, setShowManualToken] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [cloneCopied, setCloneCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');

  const WS_URL = BASE_URL.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');

  // If PAT already saved, try to verify it on mount
  useEffect(() => {
    if (pat) {
      verifyPat(pat);
    }
  }, []);

  async function verifyPat(token: string) {
    setGhLoading(true);
    setGhError('');
    try {
      const user = await githubFetchUser(token);
      setGhUser(user);
      saveGitHubPat(token);
      setPat(token);
    } catch {
      setGhError('Invalid token. Please check and try again.');
      clearGitHubPat();
      setPat('');
    } finally {
      setGhLoading(false);
    }
  }

  async function connectWithPat() {
    if (!patInput.trim()) return;
    await verifyPat(patInput.trim());
  }

  async function loadRepos() {
    if (!pat) return;
    setReposLoading(true);
    try {
      const list = await githubFetchRepos(pat);
      setRepos(list);
      setStep('repo-pick');
    } catch (e: any) {
      setGhError(e.message);
    } finally {
      setReposLoading(false);
    }
  }

  async function pickRepo(repo: GitHubRepo) {
    setSelectedRepo(repo);
    setBranchesLoading(true);
    setBranches([]);
    try {
      const brs = await githubFetchBranches(pat, repo.full_name);
      setBranches(brs);
    } catch {
      setBranches([repo.default_branch]);
    } finally {
      setBranchesLoading(false);
    }
    setForm((f) => ({
      ...f,
      name: repo.name,
      description: repo.description || '',
      repo: repo.clone_url,
      branch: repo.default_branch,
      framework: detectFramework(repo.language),
      github_token: pat,
    }));
    setStep('configure');
  }

  function goManual() {
    setForm((f) => ({ ...f, github_token: '' }));
    setStep('manual');
  }

  function confirmManual() {
    setForm((f) => ({ ...f, github_token: manualToken }));
    setStep('configure');
  }

  function cloudShellUrl(repo: string) {
    return `https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=${encodeURIComponent(repo)}&cloudshell_open_in_editor=.`;
  }

  function copyCloneCmd() {
    const repoName = form.repo.split('/').pop()?.replace(/\.git$/, '') || 'project';
    const cmd = `cd ~/opendev/projects && git clone ${form.repo} && cd ${repoName}`;
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCloneCopied(true);
    setTimeout(() => setCloneCopied(false), 2500);
  }

  function openInCloudShell() {
    window.open(cloudShellUrl(form.repo), '_blank', 'noopener,noreferrer');
  }

  function copyCloudShellLink() {
    navigator.clipboard.writeText(cloudShellUrl(form.repo)).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  }

  async function runCloneInTerminal() {
    const token = localStorage.getItem('token');
    if (!token) return;
    setRunStatus('running');

    const repoName = form.repo.split('/').pop()?.replace(/\.git$/, '') || 'project';
    const cmd = `cd ~/opendev/projects && git clone ${form.repo} && cd ${repoName}`;

    try {
      const sessionRes = await fetch(`${BASE_URL}/terminal/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId: 'default' }),
      });
      const sessionData = await sessionRes.json();
      const sessionId = sessionData?.data?.sessionId || 'default';

      const wsUrl = `${WS_URL}/api/terminal/ws?sessionId=${sessionId}&projectId=default&token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'terminal_input', input: cmd }));
        setTimeout(() => {
          ws.close();
          setRunStatus('done');
          setTimeout(() => setRunStatus('idle'), 3000);
        }, 2000);
      };

      ws.onerror = () => {
        setRunStatus('error');
        setTimeout(() => setRunStatus('idle'), 3000);
      };
    } catch {
      setRunStatus('error');
      setTimeout(() => setRunStatus('idle'), 3000);
    }
  }

  async function createProject() {
    if (!form.name.trim() || !form.repo.trim()) {
      setCreateError('Project name and repository URL are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const project = await apiCreateProject({
        name: form.name,
        description: form.description,
        repo: form.repo,
        branch: form.branch,
        framework: form.framework,
        environment: form.environment,
        github_token: form.github_token || undefined,
      });
      onCreated(project);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  }

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative bg-[#0F0F14] border border-white/10 rounded-2xl w-full mx-4 shadow-2xl overflow-hidden"
        style={{ maxWidth: step === 'repo-pick' ? 700 : 520, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {step !== 'source' && (
              <button
                onClick={() => {
                  if (step === 'configure') setStep(selectedRepo ? 'repo-pick' : 'manual');
                  else if (step === 'repo-pick' || step === 'manual') setStep('source');
                  else if (step === 'github-auth') setStep('source');
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-base font-semibold text-white">
              {step === 'source' && 'New Project'}
              {step === 'github-auth' && 'Connect GitHub'}
              {step === 'repo-pick' && 'Select Repository'}
              {step === 'manual' && 'Repository Details'}
              {step === 'configure' && 'Configure Project'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 64px)' }}>

          {/* ── Step: source ── */}
          {step === 'source' && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">How do you want to add your project?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    if (pat && ghUser) {
                      loadRepos();
                    } else {
                      setStep('github-auth');
                    }
                  }}
                  className="group p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-violet-500/30 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#161B22] border border-white/10 flex items-center justify-center mb-4 group-hover:border-violet-500/30 transition-colors">
                    <Github className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Import from GitHub</h3>
                  <p className="text-xs text-gray-500">Connect GitHub and browse your repositories</p>
                  {ghUser && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected as @{ghUser.login}
                    </div>
                  )}
                </button>
                <button
                  onClick={goManual}
                  className="group p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-violet-500/30 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:border-violet-500/40 transition-colors">
                    <Key className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Enter URL Manually</h3>
                  <p className="text-xs text-gray-500">Paste any Git repo URL with optional access token</p>
                </button>
              </div>
            </div>
          )}

          {/* ── Step: github-auth ── */}
          {step === 'github-auth' && (
            <div className="p-6 space-y-5">
              <div className="p-4 bg-[#161B22] border border-white/10 rounded-xl text-sm text-gray-400 leading-relaxed">
                Create a GitHub <strong className="text-white">Personal Access Token</strong> (classic) with <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">repo</code> scope to import private and public repositories.
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=Opendrap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-3 text-violet-400 hover:text-violet-300 underline text-xs"
                >
                  Generate token on GitHub →
                </a>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Personal Access Token</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={patInput}
                    onChange={(e) => setPatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && connectWithPat()}
                    type={showPat ? 'text' : 'password'}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-9 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 font-mono focus:outline-none focus:border-violet-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPat((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {ghError && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {ghError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={goManual}
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
                >
                  Skip — Enter URL instead
                </button>
                <button
                  onClick={connectWithPat}
                  disabled={ghLoading || !patInput.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#161B22] border border-white/20 rounded-lg text-sm text-white font-semibold hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {ghLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                  {ghLoading ? 'Connecting...' : 'Connect GitHub'}
                </button>
              </div>

              {/* Verified state */}
              {ghUser && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-400">Connected as @{ghUser.login}</p>
                    <p className="text-xs text-gray-500">{ghUser.name}</p>
                  </div>
                  <button
                    onClick={loadRepos}
                    disabled={reposLoading}
                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-sm text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                  >
                    {reposLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Browse Repos →'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Step: repo-pick ── */}
          {step === 'repo-pick' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                {ghUser && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    @{ghUser.login}
                  </div>
                )}
                <button
                  onClick={() => { clearGitHubPat(); setPat(''); setGhUser(null); setStep('github-auth'); }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Disconnect
                </button>
                <button onClick={loadRepos} disabled={reposLoading} className="ml-auto text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
                  <RefreshCw className={cn('w-3.5 h-3.5', reposLoading && 'animate-spin')} />
                  Refresh
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder="Search repositories..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              {reposLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                </div>
              )}

              {!reposLoading && (
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {filteredRepos.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-8">No repositories found</p>
                  )}
                  {filteredRepos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => pickRepo(repo)}
                      className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-violet-500/20 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#161B22] border border-white/10 flex items-center justify-center flex-shrink-0">
                        <Github className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-white text-sm group-hover:text-violet-400 transition-colors truncate">
                            {repo.name}
                          </span>
                          {repo.private && (
                            <span className="flex-shrink-0 text-xs text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">Private</span>
                          )}
                          {repo.language && (
                            <span className="flex-shrink-0 text-xs text-gray-500 font-mono">{repo.language}</span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-gray-500 truncate">{repo.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
                        {repo.stargazers_count > 0 && (
                          <span className="flex items-center gap-1"><Star className="w-3 h-3" />{repo.stargazers_count}</span>
                        )}
                        <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{repo.forks_count}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step: manual ── */}
          {step === 'manual' && (
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Repository URL *</label>
                <input
                  value={form.repo}
                  onChange={(e) => setForm((f) => ({ ...f, repo: e.target.value }))}
                  placeholder="https://github.com/user/repo.git"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 font-mono focus:outline-none focus:border-violet-500/50"
                />
                <p className="text-xs text-gray-600 mt-1">Supports GitHub, GitLab, Bitbucket HTTPS/SSH URLs</p>
              </div>

              {/* Cloud Shell clone section — appears once URL is entered */}
              {form.repo.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm text-violet-400 font-medium">
                    <Terminal className="w-4 h-4" />
                    Clone in Cloud Shell
                  </div>
                  <p className="text-xs text-gray-500">
                    Run this inside your Google Cloud Shell at{' '}
                    <code className="font-mono text-gray-400">~/opendev/projects</code>:
                  </p>

                  {/* Command box — no $ prefix so it's clean to copy */}
                  <div className="flex items-center gap-2 p-3 bg-[#060608] border border-white/10 rounded-lg">
                    <code className="flex-1 text-emerald-300 font-mono text-xs break-all leading-relaxed">
                      {`cd ~/opendev/projects && git clone ${form.repo}`}
                    </code>
                    <button
                      onClick={copyCloneCmd}
                      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all"
                    >
                      {cloneCopied
                        ? <><Check className="w-3 h-3 text-emerald-400" /> Copied!</>
                        : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={runCloneInTerminal}
                      disabled={runStatus === 'running'}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      {runStatus === 'running' ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...</>
                      ) : runStatus === 'done' ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Sent to Agent</>
                      ) : runStatus === 'error' ? (
                        <><X className="w-3.5 h-3.5" /> Failed</>
                      ) : (
                        <><Wifi className="w-3.5 h-3.5" /> Run in Terminal</>
                      )}
                    </button>
                    <button
                      onClick={openInCloudShell}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 hover:bg-blue-500/20 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in Cloud Shell
                    </button>
                    <button
                      onClick={copyCloudShellLink}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      {linkCopied
                        ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</>
                        : <><Link2 className="w-3.5 h-3.5" /> Generate Link</>}
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-600">
                    The Cloud Shell link opens Google Cloud Shell and auto-clones this repo into your browser.
                  </p>
                </motion.div>
              )}

              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-sm text-amber-400 font-medium">
                  <Lock className="w-4 h-4" />
                  Private Repository? Add Access Token
                </div>
                <p className="text-xs text-gray-500">
                  For private repos, provide a GitHub/GitLab Personal Access Token or deploy key. Stored securely and only used to clone.
                </p>
                <div className="relative">
                  <input
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    type={showManualToken ? 'text' : 'password'}
                    placeholder="ghp_xxxx... or glpat-xxxx..."
                    className="w-full px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 font-mono focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowManualToken((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showManualToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={confirmManual}
                disabled={!form.repo.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg text-sm text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Continue to Configure →
              </button>
            </div>
          )}

          {/* ── Step: configure ── */}
          {step === 'configure' && (
            <div className="p-6 space-y-4">
              {selectedRepo && (
                <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mb-2">
                  <Github className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{selectedRepo.full_name}</p>
                    {selectedRepo.description && <p className="text-xs text-gray-500 truncate">{selectedRepo.description}</p>}
                  </div>
                  {selectedRepo.private && (
                    <span className="ml-auto text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded flex-shrink-0">Private</span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Project Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="my-app"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Branch *</label>
                  {branches.length > 0 ? (
                    <select
                      value={form.branch}
                      onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-violet-500/50"
                    >
                      {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        value={form.branch}
                        onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                        placeholder="main"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
                      />
                      {branchesLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-500" />}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What does this project do?"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Framework</label>
                  <select
                    value={form.framework}
                    onChange={(e) => setForm((f) => ({ ...f, framework: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="nextjs">Next.js</option>
                    <option value="react">React (Vite)</option>
                    <option value="vue">Vue.js</option>
                    <option value="nuxt">Nuxt</option>
                    <option value="svelte">SvelteKit</option>
                    <option value="node">Node.js</option>
                    <option value="python">Python</option>
                    <option value="django">Django</option>
                    <option value="fastapi">FastAPI</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Environment</label>
                  <select
                    value={form.environment}
                    onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>

              {!selectedRepo && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <Lock className="w-3.5 h-3.5" />
                    Repository URL
                  </div>
                  <p className="text-xs font-mono text-gray-300 truncate">{form.repo || '—'}</p>
                  {form.github_token && (
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Access token configured
                    </p>
                  )}
                </div>
              )}

              {createError && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  disabled={creating || !form.name.trim() || !form.repo.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg text-sm text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function detectFramework(language: string | null): string {
  switch (language?.toLowerCase()) {
    case 'typescript':
    case 'javascript': return 'nextjs';
    case 'python': return 'python';
    case 'rust': return 'other';
    case 'go': return 'other';
    case 'java': return 'other';
    default: return 'other';
  }
}
