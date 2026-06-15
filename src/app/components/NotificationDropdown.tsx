import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, Users, Rocket, GitBranch, Brain, Bug, MessageSquare, Calendar
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { cn } from '../../lib/utils';
import type { Notification } from '../../lib/types';
import type { FC } from 'react';

const typeIcons: Record<Notification['type'], FC<{ className?: string }>> = {
  connection: Users,
  project: Rocket,
  deployment: GitBranch,
  test: Brain,
  bug: Bug,
  message: MessageSquare,
  task: Calendar,
};

export function NotificationDropdown() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifications = state.notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleMarkAllRead() {
    notifications.forEach(n => {
      if (!n.read) {
        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id });
      }
    });
  }

  function handleNotificationClick(n: Notification) {
    if (!n.read) {
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id });
    }
    if (n.link) {
      navigate(n.link);
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-white/5 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-[10px] font-bold text-white shadow-lg shadow-violet-500/25">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-[380px] bg-[#0F0F14] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcons[n.type] || Bell;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                          n.read
                            ? 'bg-white/5 border border-white/10'
                            : 'bg-violet-500/10 border border-violet-500/20'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-4 h-4',
                            n.read ? 'text-gray-400' : 'text-violet-400'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-sm truncate',
                            n.read ? 'text-gray-300' : 'text-white font-semibold'
                          )}
                        >
                          {n.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {n.message}
                        </div>
                        <div className="text-[11px] text-gray-600 mt-1">
                          {n.createdAt}
                        </div>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
