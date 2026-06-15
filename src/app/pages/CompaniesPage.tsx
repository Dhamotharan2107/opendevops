import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, Plus, Globe, X, Search, Users,
  FolderGit2, ExternalLink, ChevronDown, ChevronUp,
  Hash, Sparkles, Loader2, Link, UserPlus,
  Briefcase
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { apiGetCompanies, apiCreateCompany, apiJoinCompany, apiLeaveCompany } from '@/lib/api';
import type { Company } from '@/lib/types';
import { cn, generateId, getInitials } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 22,
      delay: i * 0.05,
    },
  }),
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 26 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } },
};

const detailVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { type: 'spring', stiffness: 200, damping: 24 },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const glowColors = [
  'from-violet-500/20 via-fuchsia-500/10',
  'from-blue-500/20 via-cyan-500/10',
  'from-emerald-500/20 via-teal-500/10',
  'from-amber-500/20 via-orange-500/10',
  'from-rose-500/20 via-pink-500/10',
  'from-indigo-500/20 via-purple-500/10',
];

const avatarColors = [
  'from-violet-500 to-fuchsia-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-purple-500',
];

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20 transition-all min-h-[42px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-500/15 border border-violet-500/25 rounded-lg text-xs text-violet-300"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? (placeholder || 'Add tags...') : ''}
        className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-600 py-0.5"
      />
    </div>
  );
}

function CompanyEmptyState() {
  return (
    <motion.div
      variants={itemVariants}
      className="relative col-span-full flex flex-col items-center justify-center py-24 px-6"
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-pink-500/20 border border-white/10 flex items-center justify-center">
          <Building2 className="w-10 h-10 text-gray-500" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
          <Plus className="w-3.5 h-3.5 text-gray-500" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No companies yet</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
        Create your first company to organize your team and projects in one place.
      </p>
      <div className="flex gap-3">
        <button className="px-5 py-2.5 bg-white text-black rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg shadow-white/10">
          <Plus className="w-4 h-4" />
          Create Company
        </button>
      </div>
    </motion.div>
  );
}

export function CompaniesPage() {
  const { state, dispatch } = useApp();
  const { companies, user, projects } = state;

  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [joinSearch, setJoinSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    website: '',
    techStack: [] as string[],
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    apiGetCompanies().then(({ companies }) => dispatch({ type: 'SET_COMPANIES', payload: companies })).catch(() => {});
  }, []);

  const myCompanyIds = useMemo(
    () => companies.filter((c) => c.members.includes(user?.id || '')).map((c) => c.id),
    [companies, user]
  );

  const explorableCompanies = useMemo(
    () => companies.filter((c) => !myCompanyIds.includes(c.id)),
    [companies, myCompanyIds]
  );

  const filteredExplore = useMemo(
    () =>
      joinSearch.trim()
        ? explorableCompanies.filter(
            (c) =>
              c.name.toLowerCase().includes(joinSearch.toLowerCase()) ||
              c.description?.toLowerCase().includes(joinSearch.toLowerCase()) ||
              c.techStack.some((t) => t.toLowerCase().includes(joinSearch.toLowerCase()))
          )
        : explorableCompanies,
    [explorableCompanies, joinSearch]
  );

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setIsCreating(true);
    try {
      await apiCreateCompany({ name: form.name.trim(), description: form.description.trim(), website: form.website.trim(), tech_stack: form.techStack.join(',') });
      await apiGetCompanies().then(({ companies }) => dispatch({ type: 'SET_COMPANIES', payload: companies }));
    } catch {
      dispatch({ type: 'ADD_COMPANY', payload: { id: generateId(), name: form.name.trim(), description: form.description.trim(), website: form.website.trim(), techStack: form.techStack, members: [user?.id || ''], projects: [], createdAt: new Date().toISOString() } });
    }
    setForm({ name: '', description: '', website: '', techStack: [] });
    setIsCreating(false);
    setShowCreate(false);
  };

  const handleJoin = (company: Company) => {
    apiJoinCompany(company.id).then(() => apiGetCompanies().then(({ companies }) => dispatch({ type: 'SET_COMPANIES', payload: companies }))).catch(() => {
      dispatch({ type: 'ADD_COMPANY', payload: { ...company, members: [...company.members, user?.id || ''] } });
      dispatch({ type: 'SET_COMPANIES', payload: companies.filter((c) => c.id !== company.id) });
    });
  };

  const userCompanies = useMemo(
    () => companies.filter((c) => c.members.includes(user?.id || '')),
    [companies, user]
  );

  const memberCount = (company: Company) => company.members.length;
  const projectCount = (company: Company) =>
    company.projects.filter((pid) => projects.some((p) => p.id === pid)).length;

  return (
    <div className="relative min-h-full bg-[#0A0A0F]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.08] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.08] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.05] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
      </div>

      <div className="relative p-8">
        <div className="max-w-[1400px] mx-auto space-y-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Companies</h1>
                <p className="text-gray-500 text-sm">Manage your teams and organizations</p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="px-5 py-2.5 bg-white text-black rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg shadow-white/10"
              >
                <Plus className="w-4 h-4" />
                Create Company
              </button>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-8">
              {userCompanies.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <CompanyEmptyState />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {userCompanies.map((company, i) => (
                    <motion.div
                      key={company.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      layout
                    >
                      <div
                        onClick={() =>
                          setSelectedId(selectedId === company.id ? null : company.id)
                        }
                        className={cn(
                          'group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm cursor-pointer',
                          'hover:bg-white/[0.06] transition-all duration-300',
                          selectedId === company.id && 'ring-1 ring-violet-500/30 bg-white/[0.06]'
                        )}
                      >
                        <div className={cn(
                          'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
                          'bg-gradient-to-br',
                          glowColors[i % glowColors.length]
                        )} />
                        <div className="relative">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
                                avatarColors[i % avatarColors.length]
                              )}>
                                <Building2 className="w-6 h-6 text-white" strokeWidth={2} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                                  {company.name}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  Created {new Date(company.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className={cn(
                              'p-1.5 rounded-lg transition-all duration-300',
                              selectedId === company.id
                                ? 'bg-violet-500/20 text-violet-400 rotate-180'
                                : 'text-gray-500 group-hover:text-gray-300'
                            )}>
                              {selectedId === company.id
                                ? <ChevronUp className="w-4 h-4" />
                                : <ChevronDown className="w-4 h-4" />
                              }
                            </div>
                          </div>

                          {company.description && (
                            <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-2">
                              {company.description}
                            </p>
                          )}

                          {company.website && (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-400 transition-colors mb-4"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              {new URL(company.website).hostname}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {company.techStack.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {company.techStack.map((tech) => (
                                <span
                                  key={tech}
                                  className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 font-mono"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              {memberCount(company)} {memberCount(company) === 1 ? 'member' : 'members'}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FolderGit2 className="w-3.5 h-3.5" />
                              {projectCount(company)} {projectCount(company) === 1 ? 'project' : 'projects'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {selectedId === company.id && (
                          <motion.div
                            key={`detail-${company.id}`}
                            variants={detailVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="overflow-hidden"
                          >
                            <div className="mt-2 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" />
                                    Members ({company.members.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {company.members.map((memberId) => {
                                      const isYou = memberId === user?.id;
                                      return (
                                        <div
                                          key={memberId}
                                          className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]"
                                        >
                                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] text-white font-semibold shrink-0">
                                            {isYou ? getInitials(user?.name || '') : getInitials(memberId)}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <span className="text-sm text-gray-300 truncate block">
                                              {isYou ? user?.name : `User ${memberId.slice(0, 6)}`}
                                            </span>
                                            {isYou && (
                                              <span className="text-[10px] text-violet-400 font-medium">You</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FolderGit2 className="w-3.5 h-3.5" />
                                    Projects ({company.projects.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {company.projects.length === 0 && (
                                      <p className="text-sm text-gray-600 italic">No projects linked</p>
                                    )}
                                    {company.projects.map((pid) => {
                                      const project = projects.find((p) => p.id === pid);
                                      return (
                                        <div
                                          key={pid}
                                          className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]"
                                        >
                                          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                            <Briefcase className="w-3.5 h-3.5 text-violet-400" />
                                          </div>
                                          <span className="text-sm text-gray-300 truncate">
                                            {project?.name || `Project ${pid.slice(0, 6)}`}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Hash className="w-3.5 h-3.5" />
                                    Tech Stack
                                  </h4>
                                  {company.techStack.length === 0 ? (
                                    <p className="text-sm text-gray-600 italic">No technologies listed</p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {company.techStack.map((tech) => (
                                        <span
                                          key={tech}
                                          className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs text-violet-300 font-mono"
                                        >
                                          {tech}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {explorableCompanies.length > 0 && (
              <motion.div variants={itemVariants} className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-400" />
                      Discover Companies
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Explore and join other organizations</p>
                  </div>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      value={joinSearch}
                      onChange={(e) => setJoinSearch(e.target.value)}
                      placeholder="Search by name, tech..."
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExplore.map((company, i) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
                      className="group relative p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] transition-all duration-300"
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white text-sm">{company.name}</h4>
                              {company.website && (
                                <span className="text-[10px] text-gray-600">
                                  {new URL(company.website).hostname}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {company.description && (
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{company.description}</p>
                        )}
                        {company.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {company.techStack.slice(0, 4).map((tech) => (
                              <span key={tech} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-500 font-mono">
                                {tech}
                              </span>
                            ))}
                            {company.techStack.length > 4 && (
                              <span className="text-[10px] text-gray-600">+{company.techStack.length - 4}</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[10px] text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {company.members.length}
                            </span>
                            <span className="flex items-center gap-1">
                              <FolderGit2 className="w-3 h-3" />
                              {company.projects.length}
                            </span>
                          </div>
                          <button
                            onClick={() => handleJoin(company)}
                            className="px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-lg text-xs text-violet-300 font-medium hover:bg-violet-500/30 transition-all flex items-center gap-1.5"
                          >
                            <UserPlus className="w-3 h-3" />
                            Join
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {filteredExplore.length === 0 && (
                    <div className="col-span-full flex flex-col items-center py-12">
                      <Search className="w-8 h-8 text-gray-600 mb-3" />
                      <p className="text-sm text-gray-500">No companies match your search</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0A0A0F]/90 backdrop-blur-2xl shadow-2xl shadow-violet-500/5 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Building2 className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Create Company</h2>
                    <p className="text-xs text-gray-500">Set up a new organization</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Acme Corp"
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="What does your company do?"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Website</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                      placeholder="https://acme.com"
                      className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Tech Stack</label>
                  <TagInput
                    tags={form.techStack}
                    onChange={(tags) => setForm((f) => ({ ...f, techStack: tags }))}
                    placeholder="Type and press Enter to add..."
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Press Enter or comma to add technologies</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 text-gray-300 font-medium text-sm hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.name.trim() || isCreating}
                  className="flex-1 h-11 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Company
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
