import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bug,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  Filter,
  Grid3X3,
  List,
  Camera,
  Video,
  MessageSquare,
  User,
  Trash2,
  Edit3,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { apiGetBugs, apiCreateBug, apiUpdateBug, apiDeleteBug } from '../../lib/api';
import type { Bug as BugType } from '../../lib/types';
import { cn, getInitials, getPriorityColor, getStatusColor, generateId, formatRelativeTime } from '../../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';

type ViewMode = 'grid' | 'list';

interface Comment {
  id: string;
  bugId: string;
  author: string;
  text: string;
  createdAt: string;
}

const priorityOptions = [
  { value: 'critical', label: 'Critical', color: 'text-red-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
  { value: 'low', label: 'Low', color: 'text-blue-400' },
];

const statusFlow: BugType['status'][] = ['open', 'in-progress', 'testing', 'fixed', 'closed'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
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

const panelVariants = {
  hidden: { opacity: 0, x: 320 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    x: 320,
    transition: { duration: 0.2 },
  },
};

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } },
};

function StatusBadge({ status }: { status: BugType['status'] }) {
  const labels: Record<string, string> = {
    open: 'Open',
    'in-progress': 'In Progress',
    testing: 'Testing',
    fixed: 'Fixed',
    closed: 'Closed',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', getStatusColor(status))}>
      {status === 'open' && <AlertCircle className="w-3 h-3" />}
      {status === 'in-progress' && <div className="w-2 h-2 rounded-full bg-current animate-pulse" />}
      {status === 'testing' && <div className="w-2 h-2 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {status === 'fixed' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'closed' && <CheckCircle2 className="w-3 h-3" />}
      {labels[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: BugType['priority'] }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', getPriorityColor(priority))}>
      {priority}
    </span>
  );
}

function AssigneeCircle({ name }: { name?: string }) {
  if (!name) {
    return (
      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
        <User className="w-4 h-4 text-gray-500" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-violet-500/20">
      {getInitials(name)}
    </div>
  );
}

export function BugsPage() {
  const { state, dispatch } = useApp();
  const user = state.user;
  const bugs = state.bugs;
  const projects = state.projects;

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedBug, setSelectedBug] = useState<BugType | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [filterProject, setFilterProject] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState('');
  const [editingBug, setEditingBug] = useState<BugType | null>(null);

  useEffect(() => {
    apiGetBugs().then(({ bugs }) => dispatch({ type: 'SET_BUGS', payload: bugs })).catch(() => {});
  }, []);

  const [newBug, setNewBug] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium' as BugType['priority'],
    assignedTo: '',
  });

  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      if (filterProject !== 'all' && bug.projectId !== filterProject) return false;
      if (filterPriority !== 'all' && bug.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && bug.status !== filterStatus) return false;
      return true;
    });
  }, [bugs, filterProject, filterPriority, filterStatus]);

  const stats = useMemo(() => {
    return {
      open: bugs.filter((b) => b.status === 'open').length,
      'in-progress': bugs.filter((b) => b.status === 'in-progress').length,
      testing: bugs.filter((b) => b.status === 'testing').length,
      fixed: bugs.filter((b) => b.status === 'fixed').length,
      closed: bugs.filter((b) => b.status === 'closed').length,
    };
  }, [bugs]);

  function getProjectName(id: string) {
    return projects.find((p) => p.id === id)?.name ?? 'Unknown Project';
  }

  function getAssigneeName(bug: BugType) {
    if (!bug.assignedTo) return undefined;
    return bug.assignedTo === user?.id ? user.name : `User ${bug.assignedTo}`;
  }

  function handleStatusChange(bug: BugType, newStatus: BugType['status']) {
    dispatch({ type: 'UPDATE_BUG', payload: { ...bug, status: newStatus } });
    apiUpdateBug(bug.id, { status: newStatus }).catch(() => {});
  }

  function handleAddComment(bugId: string) {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: generateId(),
      bugId,
      author: user?.name ?? 'Unknown',
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => ({
      ...prev,
      [bugId]: [...(prev[bugId] || []), newComment],
    }));
    setCommentText('');
  }

  function handleDeleteBug(bug: BugType) {
    dispatch({ type: 'SET_BUGS', payload: bugs.filter((b) => b.id !== bug.id) });
    if (selectedBug?.id === bug.id) setSelectedBug(null);
    apiDeleteBug(bug.id).catch(() => {});
  }

  function handleEditBug(bug: BugType) {
    setEditingBug(bug);
    setNewBug({
      title: bug.title,
      description: bug.description,
      projectId: bug.projectId,
      priority: bug.priority,
      assignedTo: bug.assignedTo ?? '',
    });
    setShowReportModal(true);
  }

  function handleSaveBug() {
    if (!newBug.title.trim()) return;

    if (editingBug) {
      const updated = { ...editingBug, title: newBug.title, description: newBug.description, projectId: newBug.projectId, priority: newBug.priority, assignedTo: newBug.assignedTo || undefined };
      dispatch({ type: 'UPDATE_BUG', payload: updated });
      apiUpdateBug(editingBug.id, { title: newBug.title, description: newBug.description, priority: newBug.priority, assigned_to: newBug.assignedTo || undefined }).catch(() => {});
    } else {
      const payload = { title: newBug.title, description: newBug.description, project_id: newBug.projectId || projects[0]?.id || '', priority: newBug.priority, assigned_to: newBug.assignedTo || undefined };
      apiCreateBug(payload).then(({ bug }) => dispatch({ type: 'ADD_BUG', payload: bug })).catch(() => {
        dispatch({ type: 'ADD_BUG', payload: { id: generateId(), projectId: newBug.projectId || projects[0]?.id || '', title: newBug.title, description: newBug.description, priority: newBug.priority, status: 'open', assignedTo: newBug.assignedTo || undefined, createdAt: new Date().toISOString() } });
      });
    }

    setNewBug({ title: '', description: '', projectId: '', priority: 'medium', assignedTo: '' });
    setEditingBug(null);
    setShowReportModal(false);
  }

  const statCards = [
    { label: 'Open', value: stats.open, color: 'from-red-500/20 to-red-600/10', border: 'border-red-500/20', textColor: 'text-red-400', icon: AlertCircle },
    { label: 'In Progress', value: stats['in-progress'], color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', textColor: 'text-blue-400', icon: null },
    { label: 'Testing', value: stats.testing, color: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/20', textColor: 'text-yellow-400', icon: null },
    { label: 'Fixed', value: stats.fixed, color: 'from-green-500/20 to-green-600/10', border: 'border-green-500/20', textColor: 'text-green-400', icon: CheckCircle2 },
    { label: 'Closed', value: stats.closed, color: 'from-gray-500/20 to-gray-600/10', border: 'border-gray-500/20', textColor: 'text-gray-400', icon: CheckCircle2 },
  ];

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] p-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.03] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.03] animate-pulse" style={{ animationDuration: '10s', animationDelay: '3s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
              Bug Tracker
            </h1>
            <p className="text-sm text-gray-500 mt-1">Track, manage, and resolve bugs across your projects</p>
          </div>
          <Button
            onClick={() => {
              setEditingBug(null);
              setNewBug({ title: '', description: '', projectId: '', priority: 'medium', assignedTo: '' });
              setShowReportModal(true);
            }}
            className="h-10 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold shadow-lg shadow-white/10"
          >
            <Plus className="w-4 h-4" />
            Report Bug
          </Button>
        </div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-5 gap-4 mb-8"
        >
          {statCards.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-white/5 backdrop-blur-xl p-5',
                stat.border,
              )}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-30', stat.color)} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</span>
                  {stat.icon && <stat.icon className={cn('w-4 h-4', stat.textColor)} />}
                </div>
                <div className={cn('text-3xl font-bold', stat.textColor)}>{stat.value}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters & View Toggle */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500 font-medium">Filters</span>
          </div>

          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            {priorityOptions.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {statusFlow.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'grid' ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'list' ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bug List/Grid + Detail Panel Layout */}
        <div className="flex gap-6">
          <div className={cn('flex-1 min-w-0', selectedBug && 'w-[calc(100%-380px)]')}>
            {filteredBugs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Bug className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-400 mb-1">No bugs found</h3>
                <p className="text-sm text-gray-600">Try adjusting your filters or report a new bug</p>
              </motion.div>
            ) : viewMode === 'grid' ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filteredBugs.map((bug) => (
                  <BugCard
                    key={bug.id}
                    bug={bug}
                    projectName={getProjectName(bug.projectId)}
                    assigneeName={getAssigneeName(bug)}
                    isSelected={selectedBug?.id === bug.id}
                    onSelect={setSelectedBug}
                    commentCount={(comments[bug.id] || []).length}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
              >
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bug</th>
                      <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignee</th>
                      <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBugs.map((bug) => (
                      <motion.tr
                        key={bug.id}
                        variants={itemVariants}
                        onClick={() => setSelectedBug(selectedBug?.id === bug.id ? null : bug)}
                        className={cn(
                          'border-b border-white/[0.04] last:border-0 cursor-pointer transition-all duration-200',
                          selectedBug?.id === bug.id
                            ? 'bg-violet-500/10'
                            : 'hover:bg-white/[0.03]',
                        )}
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center">
                              <Bug className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                              <div className="font-medium text-sm text-white">{bug.title}</div>
                              {bug.description && (
                                <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{bug.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-sm text-gray-400">{getProjectName(bug.projectId)}</span>
                        </td>
                        <td className="py-4 px-5">
                          <PriorityBadge priority={bug.priority} />
                        </td>
                        <td className="py-4 px-5">
                          <StatusBadge status={bug.status} />
                        </td>
                        <td className="py-4 px-5">
                          <AssigneeCircle name={getAssigneeName(bug)} />
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(bug.createdAt)}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>

          {/* Detail Panel */}
          <AnimatePresence>
            {selectedBug && (
              <BugDetailPanel
                bug={selectedBug}
                projectName={getProjectName(selectedBug.projectId)}
                assigneeName={getAssigneeName(selectedBug)}
                comments={comments[selectedBug.id] || []}
                commentText={commentText}
                onCommentTextChange={setCommentText}
                onAddComment={handleAddComment}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteBug}
                onEdit={handleEditBug}
                onClose={() => setSelectedBug(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Report Bug Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalOverlayVariants}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowReportModal(false);
            }}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0A0A0F] shadow-2xl shadow-violet-500/5 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">
                  {editingBug ? 'Edit Bug' : 'Report a Bug'}
                </h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="bug-title" className="text-sm font-medium text-gray-300">Title</Label>
                  <Input
                    id="bug-title"
                    placeholder="Brief description of the bug..."
                    value={newBug.title}
                    onChange={(e) => setNewBug((prev) => ({ ...prev, title: e.target.value }))}
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bug-desc" className="text-sm font-medium text-gray-300">Description</Label>
                  <Textarea
                    id="bug-desc"
                    placeholder="Detailed steps to reproduce, expected vs actual behavior..."
                    value={newBug.description}
                    onChange={(e) => setNewBug((prev) => ({ ...prev, description: e.target.value }))}
                    className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bug-project" className="text-sm font-medium text-gray-300">Project</Label>
                    <select
                      id="bug-project"
                      value={newBug.projectId}
                      onChange={(e) => setNewBug((prev) => ({ ...prev, projectId: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
                    >
                      <option value="">Select project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bug-priority" className="text-sm font-medium text-gray-300">Priority</Label>
                    <select
                      id="bug-priority"
                      value={newBug.priority}
                      onChange={(e) => setNewBug((prev) => ({ ...prev, priority: e.target.value as BugType['priority'] }))}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
                    >
                      {priorityOptions.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">Screenshot (optional)</Label>
                  <div className="relative rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] p-6 text-center hover:border-violet-500/30 transition-colors cursor-pointer group">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-gray-600 group-hover:text-violet-400 transition-colors" />
                    <p className="text-xs text-gray-600 group-hover:text-gray-500 transition-colors">Drop a screenshot or click to browse</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">Video Recording (optional)</Label>
                  <div className="relative rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] p-6 text-center hover:border-violet-500/30 transition-colors cursor-pointer group">
                    <Video className="w-8 h-8 mx-auto mb-2 text-gray-600 group-hover:text-violet-400 transition-colors" />
                    <p className="text-xs text-gray-600 group-hover:text-gray-500 transition-colors">Drop a video recording or click to browse</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bug-assign" className="text-sm font-medium text-gray-300">Assign To</Label>
                  <select
                    id="bug-assign"
                    value={newBug.assignedTo}
                    onChange={(e) => setNewBug((prev) => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {user && <option value={user.id}>{user.name} (me)</option>}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveBug}
                  disabled={!newBug.title.trim() || !newBug.projectId}
                  className="bg-white text-black hover:bg-gray-100 rounded-xl font-semibold shadow-lg shadow-white/10"
                >
                  {editingBug ? 'Save Changes' : 'Report Bug'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BugCard({
  bug,
  projectName,
  assigneeName,
  isSelected,
  onSelect,
  commentCount,
}: {
  bug: BugType;
  projectName: string;
  assigneeName?: string;
  isSelected: boolean;
  onSelect: (bug: BugType | null) => void;
  commentCount: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      layout
      onClick={() => onSelect(isSelected ? null : bug)}
      className={cn(
        'relative rounded-2xl border p-5 cursor-pointer transition-all duration-200 group',
        isSelected
          ? 'border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10'
          : 'border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-white/20',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center">
            <Bug className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white leading-tight">{bug.title}</h3>
            <span className="text-[11px] text-gray-500">{projectName}</span>
          </div>
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 text-gray-600 transition-all duration-200',
          isSelected ? 'text-violet-400 rotate-90' : 'opacity-0 group-hover:opacity-100',
        )} />
      </div>

      {bug.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{bug.description}</p>
      )}

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <PriorityBadge priority={bug.priority} />
        <StatusBadge status={bug.status} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AssigneeCircle name={assigneeName} />
          {bug.screenshot && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
              <Camera className="w-3 h-3 text-gray-500" />
            </div>
          )}
          {bug.video && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
              <Video className="w-3 h-3 text-gray-500" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-600">
          {commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {commentCount}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(bug.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function BugDetailPanel({
  bug,
  projectName,
  assigneeName,
  comments,
  commentText,
  onCommentTextChange,
  onAddComment,
  onStatusChange,
  onDelete,
  onEdit,
  onClose,
}: {
  bug: BugType;
  projectName: string;
  assigneeName?: string;
  comments: Comment[];
  commentText: string;
  onCommentTextChange: (v: string) => void;
  onAddComment: (bugId: string) => void;
  onStatusChange: (bug: BugType, status: BugType['status']) => void;
  onDelete: (bug: BugType) => void;
  onEdit: (bug: BugType) => void;
  onClose: () => void;
}) {
  const currentIdx = statusFlow.indexOf(bug.status);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={panelVariants}
      className="w-[360px] shrink-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-violet-500/5 overflow-hidden flex flex-col max-h-[calc(100vh-180px)]"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white truncate">{bug.title}</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-5">
          {/* Status Flow */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Status</Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {statusFlow.map((s, i) => {
                const isActive = i === currentIdx;
                const isPast = i < currentIdx;
                const isFuture = i > currentIdx;
                const labels: Record<string, string> = {
                  open: 'Open',
                  'in-progress': 'In Prog',
                  testing: 'Testing',
                  fixed: 'Fixed',
                  closed: 'Closed',
                };

                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <button
                      onClick={() => onStatusChange(bug, s)}
                      disabled={isActive}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                        isActive && 'bg-violet-500/20 text-violet-400 border-violet-500/30 shadow-sm shadow-violet-500/10',
                        isPast && 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20',
                        isFuture && 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-300',
                      )}
                    >
                      {labels[s]}
                    </button>
                    {i < statusFlow.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-gray-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 block mb-1">Project</Label>
              <p className="text-sm text-gray-300">{projectName}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500 block mb-1">Assignee</Label>
              <div className="flex items-center gap-2">
                <AssigneeCircle name={assigneeName} />
                <span className="text-sm text-gray-300">{assigneeName ?? 'Unassigned'}</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 block mb-1">Priority</Label>
              <PriorityBadge priority={bug.priority} />
            </div>
            <div>
              <Label className="text-xs text-gray-500 block mb-1">Created</Label>
              <p className="text-sm text-gray-300">{formatRelativeTime(bug.createdAt)}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Description</Label>
            <p className="text-sm text-gray-300 leading-relaxed">{bug.description}</p>
          </div>

          {/* Screenshot Placeholder */}
          {bug.screenshot && (
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Screenshot</Label>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                <Camera className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <p className="text-xs text-gray-600">Screenshot attached</p>
              </div>
            </div>
          )}

          {/* Video Placeholder */}
          {bug.video && (
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Video</Label>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                <Video className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <p className="text-xs text-gray-600">Video recording attached</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(bug)}
              className="text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(bug)}
              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>

          {/* Comments */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">
              Comments ({comments.length})
            </Label>

            <div className="space-y-3 mb-3">
              {comments.length === 0 && (
                <p className="text-xs text-gray-600">No comments yet</p>
              )}
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[9px] font-bold text-white">
                      {getInitials(comment.author)}
                    </div>
                    <span className="text-xs font-medium text-gray-400">{comment.author}</span>
                    <span className="text-[10px] text-gray-600 ml-auto">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{comment.text}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => onCommentTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onAddComment(bug.id);
                  }
                }}
                className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl flex-1"
              />
              <Button
                size="sm"
                disabled={!commentText.trim()}
                onClick={() => onAddComment(bug.id)}
                className="h-9 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
