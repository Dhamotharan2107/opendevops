import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Edit3, Save, X, Globe, Briefcase, Code, Clock,
  Users, FolderKanban, Building2, Github, Loader2
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { getInitials } from '@/lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
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

const statVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.4 + i * 0.1, type: 'spring', stiffness: 300, damping: 20 },
  }),
};

const toSkillStr = (s: any): string => Array.isArray(s) ? s.join(', ') : (typeof s === 'string' ? s : '');

const connectedUsers: Record<string, { name: string; username: string; avatar?: string; skills: string[] }> = {
  '2': { name: 'Alice Johnson', username: 'alicej', skills: ['React', 'Python', 'Docker'] },
  '3': { name: 'Bob Smith', username: 'bobsmith', skills: ['Go', 'Kubernetes', 'Terraform'] },
};

export function ProfilePage() {
  const { state, dispatch } = useApp();
  const user = state.user;
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    name: user?.name ?? '',
    username: user?.username ?? '',
    bio: user?.bio ?? '',
    skills: toSkillStr(user?.skills),
    company: user?.company ?? '',
    experience: user?.experience ?? '',
    website: user?.website ?? '',
    github: user?.github ?? '',
  });

  const connections = useMemo(
    () => !user ? [] : state.connections.filter(
      c => c.status === 'accepted' && (c.userId === user.id || c.connectedUserId === user.id)
    ),
    [state.connections, user?.id]
  );

  const stats = useMemo(() => [
    { icon: FolderKanban, label: 'Projects', value: state.projects.length },
    { icon: Users, label: 'Connections', value: connections.length },
    { icon: Building2, label: 'Companies', value: state.companies.length },
  ], [state.projects.length, connections.length, state.companies.length]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
      </div>
    );
  }

  const handleSave = () => {
    if (!user) return;
    dispatch({
      type: 'SET_USER',
      payload: {
        ...user,
        name: editForm.name,
        username: editForm.username,
        bio: editForm.bio,
        skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        company: editForm.company,
        experience: editForm.experience,
        website: editForm.website,
        github: editForm.github,
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      name: user?.name ?? '',
      username: user?.username ?? '',
      bio: user?.bio ?? '',
      skills: toSkillStr(user?.skills),
      company: user?.company ?? '',
      experience: user?.experience ?? '',
      website: user?.website ?? '',
      github: user?.github ?? '',
    });
    setIsEditing(false);
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDuration: '12s', animationDelay: '3s' }} />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-8 animate-pulse" style={{ animationDuration: '14s', animationDelay: '6s' }} />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative max-w-4xl mx-auto px-4 py-8"
      >
        <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-violet-500/5">
          <div className="relative h-48 bg-gradient-to-br from-violet-600/30 via-fuchsia-500/20 to-pink-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-fuchsia-500/15 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
          </div>

          <div className="relative px-8 pb-8 -mt-20">
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start gap-6">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 p-[3px] shadow-xl shadow-violet-500/20">
                  <div className="w-full h-full rounded-full bg-[#0A0A0F]" />
                </div>
                <Avatar className="w-32 h-32 border-4 border-[#0A0A0F]">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 min-w-0 pt-4 sm:pt-14">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="text-xl font-bold bg-white/5 border-white/10 text-white h-10 max-w-xs"
                          placeholder="Name"
                        />
                        <Input
                          value={editForm.username}
                          onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                          className="text-sm bg-white/5 border-white/10 text-gray-400 h-8 max-w-[200px]"
                          placeholder="Username"
                        />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={handleSave}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-xl"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl shadow-lg shadow-violet-500/5"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {isEditing ? (
                    <Textarea
                      value={editForm.bio}
                      onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 min-h-[80px] rounded-xl"
                      placeholder="Write something about yourself..."
                    />
                  ) : user.bio && (
                    <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{user.bio}</p>
                  )}

                  <div className="space-y-2">
                    {isEditing ? (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Skills (comma separated)</label>
                        <Input
                          value={editForm.skills}
                          onChange={e => setEditForm(f => ({ ...f, skills: e.target.value }))}
                          className="bg-white/5 border-white/10 text-white h-9 max-w-md rounded-xl"
                          placeholder="React, TypeScript, Docker"
                        />
                      </div>
                    ) : user.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {user.skills.map(skill => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/20 rounded-lg px-3 py-1"
                          >
                            <Code className="w-3 h-3 mr-1" />
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {isEditing ? (
                      <>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Briefcase className="w-4 h-4 shrink-0" />
                          <Input
                            value={editForm.company}
                            onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white h-8 w-48 rounded-lg"
                            placeholder="Company"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-4 h-4 shrink-0" />
                          <Input
                            value={editForm.experience}
                            onChange={e => setEditForm(f => ({ ...f, experience: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white h-8 w-36 rounded-lg"
                            placeholder="Experience"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Globe className="w-4 h-4 shrink-0" />
                          <Input
                            value={editForm.website}
                            onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white h-8 w-56 rounded-lg"
                            placeholder="Website URL"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Github className="w-4 h-4 shrink-0" />
                          <Input
                            value={editForm.github}
                            onChange={e => setEditForm(f => ({ ...f, github: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white h-8 w-48 rounded-lg"
                            placeholder="GitHub username"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {user.company && (
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <Briefcase className="w-4 h-4 text-violet-400" />
                            {user.company}
                          </span>
                        )}
                        {user.experience && (
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <Clock className="w-4 h-4 text-fuchsia-400" />
                            {user.experience}
                          </span>
                        )}
                        {user.website && (
                          <a
                            href={user.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            <Globe className="w-4 h-4" />
                            {user.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                        {user.github && (
                          <a
                            href={`https://github.com/${user.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
                          >
                            <Github className="w-4 h-4" />
                            {user.github}
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <Separator className="my-6 bg-white/[0.06]" />

            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  variants={statVariants}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-300 group"
                >
                  <stat.icon className="w-5 h-5 text-violet-400 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                  <span className="text-xs text-gray-500">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {connections.length > 0 && (
          <motion.div variants={itemVariants} className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-white">Connected Users</h2>
              <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{connections.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {connections.map(conn => {
                const userId = conn.userId === user.id ? conn.connectedUserId : conn.userId;
                const connected = connectedUsers[userId];
                if (!connected) return null;
                return (
                  <motion.div
                    key={conn.id}
                    variants={itemVariants}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-300 group"
                  >
                    <Avatar className="w-12 h-12 ring-2 ring-white/[0.06]">
                      <AvatarImage src={connected.avatar} />
                      <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
                        {getInitials(connected.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{connected.name}</p>
                      <p className="text-xs text-gray-500">@{connected.username}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {connected.skills.slice(0, 3).map(skill => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 text-gray-500 border-white/[0.06] rounded"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {connected.skills.length > 3 && (
                          <span className="text-[10px] text-gray-600">+{connected.skills.length - 3}</span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/dashboard/chat`}
                      className="shrink-0 p-2 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.p variants={itemVariants} className="text-center text-xs text-gray-600 mt-8">
          Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </motion.p>
      </motion.div>
    </div>
  );
}
