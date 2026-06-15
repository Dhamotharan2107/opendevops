import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    deployed: 'text-green-400 bg-green-500/10 border-green-500/20',
    building: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    failed: 'text-red-400 bg-red-500/10 border-red-500/20',
    stopped: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    success: 'text-green-400 bg-green-500/10 border-green-500/20',
    pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    todo: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    'in-progress': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    testing: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    done: 'text-green-400 bg-green-500/10 border-green-500/20',
    open: 'text-red-400 bg-red-500/10 border-red-500/20',
    fixed: 'text-green-400 bg-green-500/10 border-green-500/20',
    closed: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    urgent: 'text-red-400 bg-red-500/10 border-red-500/20',
    critical: 'text-red-400 bg-red-500/10 border-red-500/20',
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
  };
  return colors[status] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-blue-500/20 text-blue-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-orange-500/20 text-orange-400',
    urgent: 'bg-red-500/20 text-red-400',
    critical: 'bg-red-500/20 text-red-400',
  };
  return colors[priority] || 'bg-gray-500/20 text-gray-400';
}
