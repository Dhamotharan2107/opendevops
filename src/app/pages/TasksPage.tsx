import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, X, Calendar, User, Trash2, Clock
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { apiGetTasks, apiCreateTask, apiUpdateTask, apiDeleteTask } from '@/lib/api';
import { cn, getInitials, getPriorityColor, generateId } from '@/lib/utils';
import type { Task } from '@/lib/types';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/components/ui/dialog';

const COLUMNS: { status: Task['status']; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'testing', label: 'Testing' },
  { status: 'done', label: 'Done' },
];

const PRIORITIES: { value: Task['priority']; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUSES: { value: Task['status']; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'testing', label: 'Testing' },
  { value: 'done', label: 'Done' },
];

const EMPTY_STATE_MESSAGES: Record<string, string> = {
  todo: 'No tasks to do',
  'in-progress': 'No tasks in progress',
  testing: 'No tasks in testing',
  done: 'No completed tasks',
};

const EMPTY_STATE_ICONS: Record<string, string> = {
  todo: '📋',
  'in-progress': '⚡',
  testing: '🧪',
  done: '✅',
};

function getInitialsFromId(userMap: Record<string, string>, userId?: string): string {
  if (!userId || !userMap[userId]) return '??';
  return getInitials(userMap[userId]);
}

export function TasksPage() {
  const { state, dispatch } = useApp();

  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    apiGetTasks().then(({ tasks }) => dispatch({ type: 'SET_TASKS', payload: tasks })).catch(() => {});
  }, []);

  const [addForm, setAddForm] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium' as Task['priority'],
    assignee: '',
    dueDate: '',
  });

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (state.user) map[state.user.id] = state.user.name;
    state.tasks.forEach(t => {
      if (t.assignee && !map[t.assignee]) {
        map[t.assignee] = `User ${t.assignee}`;
      }
    });
    return map;
  }, [state.user, state.tasks]);

  const userOptions = useMemo(() => {
    return Object.entries(userMap).map(([id, name]) => ({ id, name }));
  }, [userMap]);

  const filteredTasks = useMemo(() => {
    if (selectedProject === 'all') return state.tasks;
    return state.tasks.filter(t => t.projectId === selectedProject);
  }, [state.tasks, selectedProject]);

  const columns = useMemo(() => {
    return COLUMNS.map(col => ({
      ...col,
      tasks: filteredTasks.filter(t => t.status === col.status),
    }));
  }, [filteredTasks]);

  const handleOpenDetail = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated: Task = { ...task, ...updates };
    dispatch({ type: 'UPDATE_TASK', payload: updated });
    if (selectedTask?.id === taskId) setSelectedTask(updated);
    apiUpdateTask(taskId, updates).catch(() => {});
  };

  const handleDeleteTask = (taskId: string) => {
    dispatch({ type: 'SET_TASKS', payload: state.tasks.filter(t => t.id !== taskId) });
    setSelectedTask(null);
    apiDeleteTask(taskId).catch(() => {});
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    handleUpdateTask(taskId, { status: newStatus });
  };

  const handleAddTask = () => {
    if (!addForm.title.trim()) return;
    const payload = {
      title: addForm.title,
      description: addForm.description || undefined,
      project_id: addForm.projectId || state.projects[0]?.id || '',
      assignee: addForm.assignee || undefined,
      due_date: addForm.dueDate || undefined,
      priority: addForm.priority,
      status: 'todo',
    };
    apiCreateTask(payload).then(({ task }) => {
      dispatch({ type: 'ADD_TASK', payload: task });
    }).catch(() => {
      const newTask: Task = {
        id: generateId(),
        projectId: addForm.projectId || state.projects[0]?.id || '1',
        title: addForm.title,
        description: addForm.description || undefined,
        assignee: addForm.assignee || undefined,
        dueDate: addForm.dueDate || undefined,
        priority: addForm.priority,
        status: 'todo',
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_TASK', payload: newTask });
    });
    setAddForm({ title: '', description: '', projectId: '', priority: 'medium', assignee: '', dueDate: '' });
    setIsAddModalOpen(false);
  };

  const handleSaveDetail = () => {
    if (!selectedTask) return;
    handleUpdateTask(selectedTask.id, {
      title: editTitle,
      description: editDescription || undefined,
    });
  };

  const getProjectName = (projectId: string) => {
    return state.projects.find(p => p.id === projectId)?.name || projectId;
  };

  return (
    <div className="h-full p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Tasks</h1>
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F0F14] border-white/10 text-white">
              <SelectItem value="all">All Projects</SelectItem>
              {state.projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white text-black hover:bg-gray-100 rounded-lg font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-5 h-[calc(100%-60px)] overflow-x-auto pb-4">
        {columns.map(column => (
          <div
            key={column.status}
            className="flex-1 min-w-[280px] bg-white/[0.02] border border-white/5 rounded-xl flex flex-col"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  column.status === 'todo' && 'bg-gray-400',
                  column.status === 'in-progress' && 'bg-blue-400',
                  column.status === 'testing' && 'bg-yellow-400',
                  column.status === 'done' && 'bg-green-400',
                )} />
                <span className="text-sm font-semibold text-white">{column.label}</span>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                {column.tasks.length}
              </span>
            </div>

            {/* Tasks Area */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {column.tasks.map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleOpenDetail(task)}
                    className="bg-white/5 border border-white/10 rounded-lg p-3.5 cursor-pointer hover:bg-white/[0.07] hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <span className={cn(
                        'text-[11px] font-semibold px-2 py-0.5 rounded-full leading-none',
                        getPriorityColor(task.priority),
                      )}>
                        {task.priority}
                      </span>
                    </div>

                    <h3 className="text-sm font-medium text-white leading-snug mb-3 line-clamp-2">
                      {task.title}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {task.assignee && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] text-white font-semibold">
                              {getInitialsFromId(userMap, task.assignee)}
                            </div>
                          </div>
                        )}
                        {!task.assignee && (
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Empty State */}
              {column.tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-2xl mb-2">{EMPTY_STATE_ICONS[column.status]}</span>
                  <p className="text-sm text-gray-500">{EMPTY_STATE_MESSAGES[column.status]}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Detail Panel */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ opacity: 0, x: 380 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 380 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-[420px] bg-[#0F0F14] border-l border-white/10 z-50 flex flex-col shadow-2xl"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <span className="text-sm font-semibold text-white">Task Details</span>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Title</Label>
                  <Input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onBlur={handleSaveDetail}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</Label>
                  <Select
                    value={selectedTask.status}
                    onValueChange={(val: Task['status']) => handleStatusChange(selectedTask.id, val)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F0F14] border-white/10 text-white">
                      {STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority & Project */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Priority</Label>
                    <div className="h-9 flex items-center">
                      <span className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-full',
                        getPriorityColor(selectedTask.priority),
                      )}>
                        {selectedTask.priority}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Project</Label>
                    <p className="text-sm text-white">{getProjectName(selectedTask.projectId)}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Description</Label>
                  <Textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    onBlur={handleSaveDetail}
                    className="bg-white/5 border-white/10 text-white text-sm min-h-[80px]"
                    placeholder="No description"
                  />
                </div>

                {/* Assignee */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Assignee</Label>
                  <Select
                    value={selectedTask.assignee || 'none'}
                    onValueChange={(val: string) => handleUpdateTask(selectedTask.id, { assignee: val === 'none' ? undefined : val })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F0F14] border-white/10 text-white">
                      <SelectItem value="none">Unassigned</SelectItem>
                      {userOptions.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[8px] text-white font-semibold">
                              {getInitials(u.name)}
                            </div>
                            <span>{u.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Due Date</Label>
                  <Input
                    type="date"
                    value={selectedTask.dueDate || ''}
                    onChange={e => handleUpdateTask(selectedTask.id, { dueDate: e.target.value || undefined })}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>

                {/* Created */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Created</Label>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(selectedTask.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}</span>
                  </div>
                </div>
              </div>

              {/* Panel Footer */}
              <div className="px-6 py-4 border-t border-white/5">
                <Button
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-[#0F0F14] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">Add Task</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Create a new task for your project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-300">Title *</Label>
              <Input
                value={addForm.title}
                onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Enter task title"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-300">Description</Label>
              <Textarea
                value={addForm.description}
                onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Enter task description"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 min-h-[80px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-300">Project</Label>
              <Select
                value={addForm.projectId}
                onValueChange={val => setAddForm(f => ({ ...f, projectId: val }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="bg-[#0F0F14] border-white/10 text-white">
                  {state.projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-300">Priority</Label>
                <Select
                  value={addForm.priority}
                  onValueChange={(val: Task['priority']) => setAddForm(f => ({ ...f, priority: val }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F0F14] border-white/10 text-white">
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-gray-300">Assignee</Label>
                <Select
                  value={addForm.assignee || 'none'}
                  onValueChange={val => setAddForm(f => ({ ...f, assignee: val === 'none' ? '' : val }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F0F14] border-white/10 text-white">
                    <SelectItem value="none">Unassigned</SelectItem>
                    {userOptions.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[8px] text-white font-semibold">
                            {getInitials(u.name)}
                          </div>
                          <span>{u.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-300">Due Date</Label>
              <Input
                type="date"
                value={addForm.dueDate}
                onChange={e => setAddForm(f => ({ ...f, dueDate: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsAddModalOpen(false)}
              className="bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              disabled={!addForm.title.trim()}
              className="bg-white text-black hover:bg-gray-100 font-semibold"
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
