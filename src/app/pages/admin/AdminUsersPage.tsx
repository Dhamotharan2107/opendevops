import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Loader2, ShieldCheck, ShieldOff, Trash2,
  ChevronLeft, ChevronRight, X, RefreshCw,
  UserCog, Globe, Github, Briefcase, Star, MoreVertical, Zap, Crown
} from 'lucide-react';
import { adminApi, type AdminUser } from '../../../lib/adminApi';
import { cn } from '../../../lib/utils';

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionUser, setActionUser] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const LIMIT = 12;
  const totalPages = Math.ceil(total / LIMIT);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.listUsers({ q: debouncedQ, page, limit: LIMIT });
      setUsers(res.users);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedQ(q);
    }, 380);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  const handlePlanChange = async (u: AdminUser, plan: string) => {
    setActionUser(u.id);
    setOpenMenu(null);
    try {
      await adminApi.updateUser(u.id, { plan });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, plan } : x));
      if (selectedUser?.id === u.id) setSelectedUser((prev) => prev ? { ...prev, plan } : null);
    } catch (e: any) {
      alert('Failed: ' + e.message);
    } finally {
      setActionUser(null);
    }
  };

  const handleToggleDisable = async (u: AdminUser) => {
    setActionUser(u.id);
    setOpenMenu(null);
    try {
      await adminApi.updateUser(u.id, { is_disabled: u.is_disabled !== 1 });
      setUsers((prev) =>
        prev.map((x) => x.id === u.id ? { ...x, is_disabled: u.is_disabled === 1 ? 0 : 1 } : x)
      );
      if (selectedUser?.id === u.id) {
        setSelectedUser((prev) => prev ? { ...prev, is_disabled: u.is_disabled === 1 ? 0 : 1 } : null);
      }
    } catch (e: any) {
      alert('Failed: ' + e.message);
    } finally {
      setActionUser(null);
    }
  };

  const handleRoleChange = async (u: AdminUser, role: string) => {
    setActionUser(u.id);
    setOpenMenu(null);
    try {
      await adminApi.updateUser(u.id, { role });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role } : x));
      if (selectedUser?.id === u.id) setSelectedUser((prev) => prev ? { ...prev, role } : null);
    } catch (e: any) {
      alert('Failed: ' + e.message);
    } finally {
      setActionUser(null);
    }
  };

  const handleDelete = async (u: AdminUser) => {
    setOpenMenu(null);
    if (!confirm(`Permanently delete "${u.name}" (@${u.username})? This cannot be undone.`)) return;
    setActionUser(u.id);
    try {
      await adminApi.deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setTotal((t) => t - 1);
      if (selectedUser?.id === u.id) setSelectedUser(null);
    } catch (e: any) {
      alert('Failed: ' + e.message);
    } finally {
      setActionUser(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">User Management</h2>
        <p className="text-sm text-gray-500">{total} total users registered</p>
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, username…"
            className="w-full pl-9 pr-4 h-10 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 h-10 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-5">
        {/* Table */}
        <div className={cn('flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all', selectedUser && 'hidden lg:block')}>
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['User', 'Email', 'Provider', 'Plan', 'Role', 'Status', 'Joined', ''].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr><td colSpan={7} className="py-16 text-center text-gray-600 text-sm">No users found</td></tr>
                    )}
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className={cn('border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer', selectedUser?.id === u.id && 'bg-white/10')}
                        onClick={() => setSelectedUser((prev) => prev?.id === u.id ? null : u)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                              {u.name?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{u.name}</div>
                              <div className="text-xs text-gray-500">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400 whitespace-nowrap">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-gray-500 capitalize bg-white/5 px-2 py-0.5 rounded">{u.auth_provider}</span>
                        </td>
                        <td className="py-3 px-4"><PlanBadge plan={u.plan} /></td>
                        <td className="py-3 px-4"><RoleBadge role={u.role} /></td>
                        <td className="py-3 px-4"><StatusBadge disabled={u.is_disabled === 1} /></td>
                        <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            {actionUser === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                            ) : (
                              <button
                                onClick={() => setOpenMenu((prev) => prev === u.id ? null : u.id)}
                                className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )}
                            <AnimatePresence>
                              {openMenu === u.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 top-7 z-50 w-52 bg-[#18181f] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                                >
                                  {/* Plan */}
                                  <div className="px-3 pt-2 pb-1">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Set Plan</p>
                                    <div className="flex gap-1">
                                      {(['free','pro','enterprise'] as const).map((p) => (
                                        <button
                                          key={p}
                                          onClick={() => handlePlanChange(u, p)}
                                          className={cn(
                                            'flex-1 text-[10px] font-medium py-1 rounded capitalize transition-colors border',
                                            u.plan === p
                                              ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                                              : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20'
                                          )}
                                        >{p}</button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="border-t border-white/5 mt-1" />
                                  {/* Enable/disable */}
                                  <button
                                    onClick={() => handleToggleDisable(u)}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-white/5 transition-colors"
                                  >
                                    {u.is_disabled === 1
                                      ? <><ShieldCheck className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400">Enable Account</span></>
                                      : <><ShieldOff className="w-4 h-4 text-orange-400" /><span className="text-orange-400">Disable Account</span></>
                                    }
                                  </button>
                                  {/* Role */}
                                  {u.role !== 'admin' && (
                                    <button
                                      onClick={() => handleRoleChange(u, 'admin')}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-amber-400 hover:bg-white/5 transition-colors"
                                    >
                                      <Star className="w-4 h-4" /> Promote to Admin
                                    </button>
                                  )}
                                  {u.role === 'admin' && (
                                    <button
                                      onClick={() => handleRoleChange(u, 'user')}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-400 hover:bg-white/5 transition-colors"
                                    >
                                      <UserCog className="w-4 h-4" /> Set as User
                                    </button>
                                  )}
                                  <div className="border-t border-white/5 mt-1" />
                                  <button
                                    onClick={() => handleDelete(u)}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" /> Delete User
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                  <span className="text-xs text-gray-500">
                    Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400">{page} / {totalPages}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* User detail panel */}
        <AnimatePresence>
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 320 }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-shrink-0 w-80 bg-white/5 border border-white/10 rounded-xl overflow-hidden"
            >
              <UserDetailPanel
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
                onToggle={() => handleToggleDisable(selectedUser)}
                onDelete={() => handleDelete(selectedUser)}
                onRoleChange={(role) => handleRoleChange(selectedUser, role)}
                onPlanChange={(plan) => handlePlanChange(selectedUser, plan)}
                loading={actionUser === selectedUser.id}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Close menu on outside click */}
      {openMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  );
}

function UserDetailPanel({
  user, onClose, onToggle, onDelete, onRoleChange, onPlanChange, loading
}: {
  user: AdminUser;
  onClose: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onRoleChange: (role: string) => void;
  onPlanChange: (plan: string) => void;
  loading: boolean;
}) {
  const fields = [
    { label: 'Company',    value: user.company,    icon: Briefcase },
    { label: 'Experience', value: user.experience, icon: Star       },
    { label: 'Website',    value: user.website,    icon: Globe      },
    { label: 'GitHub',     value: user.github,     icon: Github     },
  ].filter((f) => f.value);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <span className="text-sm font-semibold text-white">User Details</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Avatar + name */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl font-bold text-white">
            {user.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <div className="font-semibold text-white">{user.name}</div>
            <div className="text-sm text-gray-500">@{user.username}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <PlanBadge plan={user.plan} />
            <RoleBadge role={user.role} />
            <StatusBadge disabled={user.is_disabled === 1} />
          </div>
        </div>

        {/* Plan selector */}
        <div>
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Subscription Plan</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['free','pro','enterprise'] as const).map((p) => (
              <button
                key={p}
                onClick={() => onPlanChange(p)}
                disabled={loading || user.plan === p}
                className={cn(
                  'py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors',
                  user.plan === p
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300 cursor-default'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-violet-300'
                )}
              >{p}</button>
            ))}
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-2 text-sm">
          <InfoRow label="Email"   value={user.email} />
          <InfoRow label="Auth"    value={user.auth_provider} capitalize />
          <InfoRow label="Joined"  value={new Date(user.created_at).toLocaleDateString()} />
          <InfoRow label="Updated" value={new Date(user.updated_at).toLocaleDateString()} />
        </div>

        {user.bio && (
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Bio</div>
            <p className="text-sm text-gray-300 leading-relaxed">{user.bio}</p>
          </div>
        )}

        {fields.length > 0 && (
          <div className="space-y-2">
            {fields.map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 text-sm text-gray-400">
                <f.icon className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                <span className="text-gray-500 text-xs w-20 flex-shrink-0">{f.label}</span>
                <span className="text-gray-300 truncate">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {user.skills && (
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Skills</div>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-400">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <div className="flex gap-2">
          {user.role !== 'admin' ? (
            <button
              onClick={() => onRoleChange('admin')}
              disabled={loading}
              className="flex-1 h-9 text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              Promote to Admin
            </button>
          ) : (
            <button
              onClick={() => onRoleChange('user')}
              disabled={loading}
              className="flex-1 h-9 text-xs font-medium bg-gray-500/10 border border-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/20 transition-colors disabled:opacity-50"
            >
              Set as User
            </button>
          )}
        </div>
        <button
          onClick={onToggle}
          disabled={loading}
          className={cn(
            'w-full h-9 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 flex items-center justify-center gap-2',
            user.is_disabled === 1
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
          )}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {user.is_disabled === 1 ? 'Enable Account' : 'Disable Account'}
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className="w-full h-9 text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          Delete User
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600 uppercase tracking-wider">{label}</span>
      <span className={cn('text-xs text-gray-300', capitalize && 'capitalize')}>{value}</span>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const cfg: Record<string, { cls: string; icon: any; label: string }> = {
    free:       { cls: 'bg-gray-500/10 border-gray-500/20 text-gray-400',         icon: null,  label: 'Free'       },
    pro:        { cls: 'bg-violet-500/10 border-violet-500/20 text-violet-400',   icon: Zap,   label: 'Pro'        },
    enterprise: { cls: 'bg-amber-500/10 border-amber-500/20 text-amber-400',      icon: Crown, label: 'Enterprise' },
  };
  const c2 = cfg[plan] ?? cfg.free;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border', c2.cls)}>
      {c2.icon && <c2.icon className="w-3 h-3" />}
      {c2.label}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn(
      'text-xs font-medium px-2 py-0.5 rounded-full border',
      role === 'admin'
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
    )}>
      {role}
    </span>
  );
}

function StatusBadge({ disabled }: { disabled: boolean }) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border',
      disabled
        ? 'bg-red-500/10 border-red-500/20 text-red-400'
        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    )}>
      {disabled ? <ShieldOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
      {disabled ? 'Disabled' : 'Active'}
    </div>
  );
}
