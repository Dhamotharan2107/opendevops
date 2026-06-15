import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Users, UserPlus, UserCheck, UserX, X, MessageCircle, Send
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { apiGetConnections, apiAcceptConnection, apiRejectConnection, apiRemoveConnection } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { Connection } from '../../lib/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 26 },
  },
  exit: {
    opacity: 0, x: 20,
    transition: { duration: 0.15 },
  },
};

const users: Record<string, { name: string; username: string; avatar?: string; skills: string[] }> = {
  '2': { name: 'Alice Johnson', username: 'alicej', skills: ['React', 'Python', 'Docker'] },
  '3': { name: 'Bob Smith', username: 'bobsmith', skills: ['Go', 'Kubernetes', 'Terraform'] },
  '4': { name: 'Carol Williams', username: 'carolw', skills: ['Vue.js', 'Node.js', 'AWS'] },
  '5': { name: 'David Lee', username: 'davidlee', skills: ['Rust', 'TypeScript', 'PostgreSQL'] },
  '6': { name: 'Eva Martinez', username: 'evam', skills: ['Angular', 'Java', 'GCP'] },
};

const tabItems = [
  { value: 'connections', label: 'Connections', icon: UserCheck },
  { value: 'requests', label: 'Requests', icon: UserPlus },
  { value: 'sent', label: 'Sent', icon: Send },
];

export function ConnectionsPage() {
  const { state, dispatch } = useApp();
  const user = state.user!;
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('connections');

  useEffect(() => {
    apiGetConnections().then(({ connections }) => dispatch({ type: 'SET_CONNECTIONS', payload: connections })).catch(() => {});
  }, []);

  const filteredConnections = useMemo(() => {
    const q = search.toLowerCase().trim();
    return state.connections.filter(c => {
      const uid = c.userId === user.id ? c.connectedUserId : c.userId;
      const u = users[uid];
      if (!u) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.skills.some(s => s.toLowerCase().includes(q))
      );
    });
  }, [state.connections, user.id, search]);

  const accepted = useMemo(
    () => filteredConnections.filter(c => c.status === 'accepted'),
    [filteredConnections]
  );

  const pendingReceived = useMemo(
    () => filteredConnections.filter(c => c.status === 'pending' && c.connectedUserId === user.id),
    [filteredConnections, user.id]
  );

  const pendingSent = useMemo(
    () => filteredConnections.filter(c => c.status === 'pending' && c.userId === user.id),
    [filteredConnections, user.id]
  );

  const handleAccept = (conn: Connection) => {
    dispatch({ type: 'UPDATE_CONNECTION', payload: { ...conn, status: 'accepted' } });
    apiAcceptConnection(conn.id).catch(() => {});
  };

  const handleReject = (conn: Connection) => {
    dispatch({ type: 'UPDATE_CONNECTION', payload: { ...conn, status: 'rejected' } });
    apiRejectConnection(conn.id).catch(() => {});
  };

  const handleCancel = (conn: Connection) => {
    dispatch({ type: 'UPDATE_CONNECTION', payload: { ...conn, status: 'rejected' } });
    apiRejectConnection(conn.id).catch(() => {});
  };

  const handleRemove = (conn: Connection) => {
    dispatch({ type: 'UPDATE_CONNECTION', payload: { ...conn, status: 'rejected' } });
    apiRemoveConnection(conn.id).catch(() => {});
  };

  const renderCard = (conn: Connection, type: 'accepted' | 'pending-received' | 'pending-sent') => {
    const uid = conn.userId === user.id ? conn.connectedUserId : conn.userId;
    const u = users[uid];
    if (!u) return null;

    return (
      <motion.div
        key={conn.id}
        layout
        variants={itemVariants}
        exit="exit"
        className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-violet-500/20 transition-all duration-300"
      >
        <div className="relative shrink-0">
          <Avatar className="w-12 h-12 ring-2 ring-white/[0.06] group-hover:ring-violet-500/30 transition-all">
            <AvatarImage src={u.avatar} />
            <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
              {getInitials(u.name)}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0A0A0F]',
            type === 'accepted' ? 'bg-emerald-500' : 'bg-yellow-500'
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white truncate">{u.name}</p>
            <span className="text-xs text-gray-500">@{u.username}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {u.skills.slice(0, 3).map(skill => (
              <Badge
                key={skill}
                variant="outline"
                className="text-[10px] px-2 py-0 text-gray-500 border-white/[0.06] rounded-lg"
              >
                {skill}
              </Badge>
            ))}
            {u.skills.length > 3 && (
              <span className="text-[10px] text-gray-600">+{u.skills.length - 3}</span>
            )}
          </div>
        </div>

        {type === 'accepted' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              className="h-8 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 hover:text-violet-300 rounded-lg border border-violet-500/20"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRemove(conn)}
              className="h-8 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
            >
              <UserX className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {type === 'pending-received' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              onClick={() => handleAccept(conn)}
              className="h-8 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-500/20"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleReject(conn)}
              className="h-8 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {type === 'pending-sent' && (
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-[11px] text-yellow-500 border-yellow-500/20 bg-yellow-500/5 rounded-lg">
              <Send className="w-3 h-3 mr-1" />
              Requested
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCancel(conn)}
              className="h-8 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  const renderEmpty = (icon: typeof Users, title: string, description: string) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
        <icon className="w-7 h-7 text-gray-600" />
      </div>
      <p className="text-base font-medium text-gray-400">{title}</p>
      <p className="text-sm text-gray-600 mt-1 max-w-xs text-center">{description}</p>
    </motion.div>
  );

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDuration: '12s', animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse" style={{ animationDuration: '14s', animationDelay: '6s' }} />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative max-w-3xl mx-auto px-4 py-8"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Connections</h1>
            <p className="text-sm text-gray-500">Manage your network</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <Input
            placeholder="Search by name, username or skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20 rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/5 border border-white/[0.06] p-1 rounded-xl w-full sm:w-auto">
              {tabItems.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 sm:flex-none data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300 text-gray-500 rounded-lg text-sm gap-1.5"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5">
                    {tab.value === 'connections' ? accepted.length :
                     tab.value === 'requests' ? pendingReceived.length :
                     pendingSent.length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <TabsContent value="connections" className="mt-0">
                    {accepted.length === 0 ? (
                      renderEmpty(UserCheck, 'No connections yet', 'Connect with other developers to grow your network')
                    ) : (
                      <div className="space-y-2">
                        <AnimatePresence>
                          {accepted.map(c => renderCard(c, 'accepted'))}
                        </AnimatePresence>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="requests" className="mt-0">
                    {pendingReceived.length === 0 ? (
                      renderEmpty(UserPlus, 'No pending requests', 'Connection requests from others will appear here')
                    ) : (
                      <div className="space-y-2">
                        <AnimatePresence>
                          {pendingReceived.map(c => renderCard(c, 'pending-received'))}
                        </AnimatePresence>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="sent" className="mt-0">
                    {pendingSent.length === 0 ? (
                      renderEmpty(Send, 'No sent requests', 'Requests you send to others will appear here')
                    ) : (
                      <div className="space-y-2">
                        <AnimatePresence>
                          {pendingSent.map(c => renderCard(c, 'pending-sent'))}
                        </AnimatePresence>
                      </div>
                    )}
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}
