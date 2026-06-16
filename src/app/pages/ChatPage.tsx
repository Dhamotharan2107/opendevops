import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Search, Plus, Send, Paperclip,
  Users, UserPlus, FolderGit2, X, Clock, ChevronLeft, Check,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { apiGetChats, apiGetChatMessages, apiSendMessage, apiCreateChat } from '@/lib/api';
import { cn, formatRelativeTime, generateId, getInitials } from '@/lib/utils';
import type { Chat, Message } from '@/lib/types';

const mockUsers: Record<string, { id: string; name: string; online?: boolean }> = {
  '1': { id: '1', name: 'John Doe', online: true },
  '2': { id: '2', name: 'Sarah Chen', online: true },
  '3': { id: '3', name: 'Mike Johnson', online: false },
  '4': { id: '4', name: 'Alice Williams', online: true },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

function getChatDisplayName(chat: Chat, userId: string, userLookup: Record<string, { id: string; name: string; online?: boolean }>): string {
  if (chat.type === 'private') {
    const otherId = chat.participants.find((p) => p !== userId);
    return otherId ? (userLookup[otherId]?.name ?? `User ${otherId.slice(0, 6)}`) : 'Unknown';
  }
  return chat.name ?? 'Unnamed Chat';
}

function getChatAvatarInitials(chat: Chat, userId: string, userLookup: Record<string, { id: string; name: string; online?: boolean }>): string {
  const name = getChatDisplayName(chat, userId, userLookup);
  return getInitials(name);
}

function getChatAvatarColor(name: string): string {
  const colors = [
    'from-violet-500 to-fuchsia-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-rose-500',
    'from-pink-500 to-purple-500',
    'from-amber-500 to-orange-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// getOtherParticipants is now inside the component using userLookup

export function ChatPage() {
  const { state, dispatch } = useApp();
  const userId = state.user?.id ?? '1';

  // Build a user lookup that includes the real logged-in user as "online"
  const userLookup = useMemo(() => {
    const map: Record<string, { id: string; name: string; online?: boolean }> = { ...mockUsers };
    if (state.user) {
      map[state.user.id] = { id: state.user.id, name: state.user.name, online: true };
    }
    return map;
  }, [state.user]);

  function resolveUser(id: string) {
    return userLookup[id] ?? { id, name: `User ${id.slice(0, 6)}`, online: false };
  }

  function getOtherParticipants(chat: Chat) {
    return chat.participants.filter((p) => p !== userId).map((p) => resolveUser(p));
  }
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState<'private' | 'group' | 'project' | null>(null);
  const [newChatName, setNewChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiGetChats().then(({ chats }) => dispatch({ type: 'SET_CHATS', payload: chats })).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedChatId) return;
    if (state.messages[selectedChatId]?.length) return;
    apiGetChatMessages(selectedChatId).then(({ messages }) =>
      dispatch({ type: 'SET_MESSAGES', payload: { chatId: selectedChatId, messages } })
    ).catch(() => {});
  }, [selectedChatId]);

  const availableUsers = useMemo(() => {
    return Object.values(mockUsers).filter((u) => u.id !== userId);
  }, [userId]);

  const filteredAvailableUsers = useMemo(() => {
    if (!userSearchQuery) return availableUsers;
    const q = userSearchQuery.toLowerCase();
    return availableUsers.filter((u) => u.name.toLowerCase().includes(q));
  }, [availableUsers, userSearchQuery]);

  const filteredChats = useMemo(() => {
    if (!searchQuery) return state.chats;
    const q = searchQuery.toLowerCase();
    return state.chats.filter((chat) => {
      const name = getChatDisplayName(chat, userId, userLookup).toLowerCase();
      return name.includes(q);
    });
  }, [state.chats, searchQuery, userId]);

  const selectedChat = useMemo(() => {
    if (!selectedChatId) return null;
    return state.chats.find((c) => c.id === selectedChatId) ?? null;
  }, [state.chats, selectedChatId]);

  const chatMessages = useMemo(() => {
    if (!selectedChatId) return [];
    const msgs = state.messages[selectedChatId];
    if (!msgs) return [];
    return [...msgs].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return da - db;
    });
  }, [state.messages, selectedChatId]);

  const groupedMessages = useMemo(() => {
    const groups: { senderId: string; messages: Message[] }[] = [];
    for (const msg of chatMessages) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.senderId === msg.senderId) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ senderId: msg.senderId, messages: [msg] });
      }
    }
    return groups;
  }, [chatMessages]);

  const isCurrentUser = (senderId: string) => senderId === userId;

  function getLastMessagePreview(chat: Chat): { text: string; time: string } | null {
    const msgs = state.messages[chat.id];
    if (!msgs || msgs.length === 0) return null;
    const last = msgs[msgs.length - 1];
    return { text: last.text, time: last.createdAt };
  }

  function getUnreadCount(chat: Chat): number {
    return 0;
  }

  function handleSendMessage() {
    if (!messageText.trim() || !selectedChatId) return;
    const text = messageText.trim();
    setMessageText('');
    apiSendMessage(selectedChatId, text).then(({ message }) =>
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId: selectedChatId, message } })
    ).catch(() => {
      const newMsg: Message = {
        id: generateId(),
        chatId: selectedChatId,
        senderId: userId,
        text,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId: selectedChatId, message: newMsg } });
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length]);

  function handleCreateChat() {
    if (newChatType === 'private' && selectedUsers.length === 1) {
      const otherId = selectedUsers[0];
      const existing = state.chats.find(
        (c) =>
          c.type === 'private' &&
          c.participants.length === 2 &&
          c.participants.includes(userId) &&
          c.participants.includes(otherId)
      );
      if (existing) {
        setSelectedChatId(existing.id);
      } else {
        const newChat: Chat = {
          id: generateId(),
          type: 'private',
          participants: [userId, otherId],
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_CHAT', payload: newChat });
        setSelectedChatId(newChat.id);
      }
      resetNewChatModal();
    } else if (newChatType === 'group' && newChatName.trim() && selectedUsers.length > 0) {
      const newChat: Chat = {
        id: generateId(),
        type: 'group',
        name: newChatName.trim(),
        participants: [userId, ...selectedUsers],
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_CHAT', payload: newChat });
      setSelectedChatId(newChat.id);
      resetNewChatModal();
    } else if (newChatType === 'project' && selectedProjectId) {
      const project = state.projects.find((p) => p.id === selectedProjectId);
      const existing = state.chats.find(
        (c) => c.type === 'project' && c.projectId === selectedProjectId
      );
      if (existing) {
        setSelectedChatId(existing.id);
      } else {
        const newChat: Chat = {
          id: generateId(),
          type: 'project',
          name: project?.name ?? 'Project Chat',
          participants: [userId],
          projectId: selectedProjectId,
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_CHAT', payload: newChat });
        setSelectedChatId(newChat.id);
      }
      resetNewChatModal();
    }
  }

  function resetNewChatModal() {
    setShowNewChatModal(false);
    setNewChatType(null);
    setNewChatName('');
    setSelectedUsers([]);
    setSelectedProjectId(null);
    setUserSearchQuery('');
  }

  function toggleUserSelection(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  const canCreateChat =
    (newChatType === 'private' && selectedUsers.length === 1) ||
    (newChatType === 'group' && newChatName.trim().length > 0 && selectedUsers.length > 0) ||
    (newChatType === 'project' && selectedProjectId !== null);

  return (
    <div className="flex h-full bg-[#0A0A0F]">
      {/* Left Sidebar */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={cn(
          'w-[360px] min-w-[360px] border-r border-white/[0.06] flex flex-col bg-[#0A0A0F]',
          selectedChatId && 'hidden lg:flex'
        )}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between px-5 pt-5 pb-3">
          <h1 className="text-lg font-semibold text-white">Messages</h1>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.06] text-gray-400 hover:text-white transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Search */}
        <motion.div variants={itemVariants} className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all"
            />
          </div>
        </motion.div>

        {/* Chat List */}
        <motion.div variants={itemVariants} className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-8 h-8 text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">No conversations yet</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-3 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                Start a new chat
              </button>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === selectedChatId;
              const lastMsg = getLastMessagePreview(chat);
              const displayName = getChatDisplayName(chat, userId, userLookup);
              const initials = getChatAvatarInitials(chat, userId, userLookup);
              const unread = getUnreadCount(chat);

              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left',
                    isActive
                      ? 'bg-violet-500/10 border border-violet-500/20'
                      : 'hover:bg-white/5 border border-transparent'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-semibold text-white shrink-0',
                      getChatAvatarColor(displayName)
                    )}
                  >
                    {initials}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white truncate">{displayName}</span>
                      {lastMsg && (
                        <span className="text-[11px] text-gray-500 shrink-0 whitespace-nowrap">
                          {formatRelativeTime(lastMsg.time)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 truncate">
                        {lastMsg ? lastMsg.text : (chat.type === 'group' || chat.type === 'project' ? 'Group chat' : 'No messages yet')}
                      </span>
                      {unread > 0 && (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-500 text-[10px] font-semibold text-white shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </motion.div>
      </motion.div>

      {/* Main Chat Area */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={cn(
          'flex-1 flex flex-col bg-[#0A0A0F] relative',
          !selectedChatId && 'hidden lg:flex'
        )}
      >
        {selectedChat ? (
          <>
            {/* Back button for mobile */}
            <div className="lg:hidden absolute top-4 left-4 z-10">
              <button
                onClick={() => setSelectedChatId(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.06] text-gray-400 hover:text-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Header */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0A0A0F]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-semibold text-white shrink-0',
                    getChatAvatarColor(getChatDisplayName(selectedChat, userId, userLookup))
                  )}
                >
                  {getChatAvatarInitials(selectedChat, userId, userLookup)}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    {getChatDisplayName(selectedChat, userId, userLookup)}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {selectedChat.type === 'private' ? (
                      <>
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          getOtherParticipants(selectedChat)[0]?.online
                            ? 'bg-emerald-500'
                            : 'bg-gray-600'
                        )} />
                        <span className="text-[11px] text-gray-500">
                          {getOtherParticipants(selectedChat)[0]?.online ? 'Online' : 'Offline'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-[11px] text-gray-500">
                          {selectedChat.participants.length} members
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
              style={{
                background:
                  'radial-gradient(ellipse at 20% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(236, 72, 153, 0.03) 0%, transparent 50%)',
              }}
            >
              {groupedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-10 h-10 text-gray-700 mb-3" />
                  <p className="text-sm text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-600 mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                groupedMessages.map((group) => {
                  const isMe = isCurrentUser(group.senderId);
                  const sender = resolveUser(group.senderId);
                  const senderName = sender?.name ?? 'Unknown';

                  return (
                    <div
                      key={group.messages[0].id}
                      className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                    >
                      <div className={cn('max-w-[70%] space-y-1', isMe ? 'items-end' : 'items-start')}>
                        {/* Sender label */}
                        {!isMe && (
                          <div className="flex items-center gap-2 px-1 mb-1">
                            <div
                              className={cn(
                                'w-5 h-5 rounded-full bg-gradient-to-br flex items-center justify-center text-[8px] font-semibold text-white',
                                getChatAvatarColor(senderName)
                              )}
                            >
                              {getInitials(senderName)}
                            </div>
                            <span className="text-[11px] text-gray-500 font-medium">{senderName}</span>
                          </div>
                        )}

                        {/* Messages */}
                        {group.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              'px-3.5 py-2.5 text-sm leading-relaxed',
                              isMe
                                ? 'bg-violet-500/20 text-white rounded-2xl rounded-br-md'
                                : 'bg-white/5 text-gray-200 rounded-2xl rounded-bl-md',
                              'break-words'
                            )}
                          >
                            {msg.text}
                            <div className={cn(
                              'flex items-center gap-1 mt-1',
                              isMe ? 'justify-end' : 'justify-start'
                            )}>
                              <span className="text-[10px] text-gray-500">
                                {formatRelativeTime(msg.createdAt)}
                              </span>
                              {isMe && (
                                <Check className="w-3 h-3 text-gray-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <motion.div
              variants={itemVariants}
              className="px-5 py-4 border-t border-white/[0.06] bg-[#0A0A0F]"
            >
              <div className="flex items-center gap-3 bg-white/5 rounded-2xl border border-white/[0.06] px-4 py-2 focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500/40 transition-all">
                <button className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all shrink-0">
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none py-1.5"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-all shrink-0',
                    messageText.trim()
                      ? 'bg-violet-500 text-white hover:bg-violet-400 shadow-lg shadow-violet-500/25'
                      : 'bg-white/5 text-gray-600 cursor-not-allowed'
                  )}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8"
            style={{
              background:
                'radial-gradient(ellipse at 50% 40%, rgba(139, 92, 246, 0.04) 0%, transparent 50%), radial-gradient(ellipse at 50% 60%, rgba(236, 72, 153, 0.03) 0%, transparent 50%)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-white/[0.06] flex items-center justify-center mb-6">
                <MessageSquare className="w-9 h-9 text-violet-400/60" />
              </div>
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-lg font-semibold text-white mb-1.5"
            >
              Select a conversation
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-sm text-gray-500 max-w-xs"
            >
              Choose a chat from the sidebar or start a new conversation
            </motion.p>
          </div>
        )}
      </motion.div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) resetNewChatModal();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0F0F14] shadow-2xl shadow-violet-500/5 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h2 className="text-base font-semibold text-white">
                  {newChatType ? 'New Chat' : 'Create New Chat'}
                </h2>
                <button
                  onClick={resetNewChatModal}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {!newChatType ? (
                  /* Step 1: Choose type */
                  <div className="space-y-3">
                    <button
                      onClick={() => setNewChatType('private')}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white/5 hover:bg-violet-500/10 border border-white/[0.06] hover:border-violet-500/20 transition-all group text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <UserPlus className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-violet-200 transition-colors">Private Chat</p>
                        <p className="text-xs text-gray-500 mt-0.5">Chat one-on-one with a team member</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setNewChatType('group')}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white/5 hover:bg-violet-500/10 border border-white/[0.06] hover:border-violet-500/20 transition-all group text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-violet-200 transition-colors">Group Chat</p>
                        <p className="text-xs text-gray-500 mt-0.5">Create a group conversation</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setNewChatType('project')}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white/5 hover:bg-violet-500/10 border border-white/[0.06] hover:border-violet-500/20 transition-all group text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                        <FolderGit2 className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-violet-200 transition-colors">Project Chat</p>
                        <p className="text-xs text-gray-500 mt-0.5">Discuss a specific project</p>
                      </div>
                    </button>
                  </div>
                ) : newChatType === 'private' ? (
                  /* Private Chat: user selection */
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1.5 block">Select a team member</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search members..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all"
                        />
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {filteredAvailableUsers.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No members found</p>
                      ) : (
                        filteredAvailableUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => setSelectedUsers([user.id])}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                              selectedUsers.includes(user.id)
                                ? 'bg-violet-500/10 border border-violet-500/20'
                                : 'hover:bg-white/5 border border-transparent'
                            )}
                          >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                              {getInitials(user.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-white">{user.name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  user.online ? 'bg-emerald-500' : 'bg-gray-600'
                                )} />
                                <span className="text-[11px] text-gray-500">
                                  {user.online ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </div>
                            {selectedUsers.includes(user.id) && (
                              <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : newChatType === 'group' ? (
                  /* Group Chat: name + user selection */
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1.5 block">Group Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Frontend Team"
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1.5 block">Add Members</label>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search members..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredAvailableUsers.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No members found</p>
                        ) : (
                          filteredAvailableUsers.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => toggleUserSelection(user.id)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                                selectedUsers.includes(user.id)
                                  ? 'bg-violet-500/10 border border-violet-500/20'
                                  : 'hover:bg-white/5 border border-transparent'
                              )}
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
                                {getInitials(user.name)}
                              </div>
                              <span className="flex-1 text-sm font-medium text-white">{user.name}</span>
                              <div className={cn(
                                'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                                selectedUsers.includes(user.id)
                                  ? 'bg-violet-500 border-violet-500'
                                  : 'border-white/20 hover:border-white/40'
                              )}>
                                {selectedUsers.includes(user.id) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map((id) => {
                          const u = userLookup[id];
                          return (
                            <span
                              key={id}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300"
                            >
                              {u?.name ?? id}
                              <button
                                onClick={() => toggleUserSelection(id)}
                                className="hover:text-white transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Project Chat: select project */
                  <div className="space-y-4">
                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">Select a Project</label>
                    <div className="max-h-72 overflow-y-auto space-y-1">
                      {state.projects.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No projects available</p>
                      ) : (
                        state.projects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => setSelectedProjectId(project.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left',
                              selectedProjectId === project.id
                                ? 'bg-violet-500/10 border border-violet-500/20'
                                : 'hover:bg-white/5 border border-transparent'
                            )}
                          >
                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                              <FolderGit2 className="w-4 h-4 text-orange-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-white">{project.name}</span>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{project.repo}</p>
                            </div>
                            {selectedProjectId === project.id && (
                              <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {newChatType && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                  <button
                    onClick={resetNewChatModal}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateChat}
                    disabled={!canCreateChat}
                    className={cn(
                      'px-5 py-2 rounded-xl text-sm font-medium transition-all',
                      canCreateChat
                        ? 'bg-violet-500 text-white hover:bg-violet-400 shadow-lg shadow-violet-500/25'
                        : 'bg-white/5 text-gray-600 cursor-not-allowed'
                    )}
                  >
                    {newChatType === 'private'
                      ? 'Start Chat'
                      : newChatType === 'group'
                        ? 'Create Group'
                        : 'Create Chat'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
