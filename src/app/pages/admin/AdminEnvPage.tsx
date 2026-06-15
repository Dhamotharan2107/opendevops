import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Copy, Check,
  Loader2, Key, Lock, RefreshCw, X, Save, AlertCircle
} from 'lucide-react';
import { adminApi, type EnvVar } from '../../../lib/adminApi';
import { cn } from '../../../lib/utils';

export function AdminEnvPage() {
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showValues, setShowValues] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EnvVar | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.env.list();
      setVars(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleDelete = async (v: EnvVar) => {
    if (!confirm(`Delete "${v.key}"?`)) return;
    setDeleting(v.key);
    try {
      await adminApi.env.delete(v.key);
      setVars((prev) => prev.filter((x) => x.key !== v.key));
    } catch (e: any) {
      alert('Failed: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSaved = (saved: EnvVar) => {
    setVars((prev) => {
      const exists = prev.find((x) => x.key === saved.key);
      return exists
        ? prev.map((x) => x.key === saved.key ? saved : x)
        : [...prev, saved].sort((a, b) => a.key.localeCompare(b.key));
    });
    setShowForm(false);
    setEditTarget(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Environment Variables</h2>
        <p className="text-sm text-gray-500">Manage app-level config stored in the D1 database</p>
      </motion.div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 h-10 bg-violet-500/20 border border-violet-500/30 rounded-xl text-sm text-violet-300 hover:bg-violet-500/30 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> Add Variable
        </button>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 h-10 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
        </button>
        <button
          onClick={() => setShowValues((v) => !v)}
          className="flex items-center gap-2 px-4 h-10 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-colors ml-auto"
        >
          {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showValues ? 'Hide values' : 'Show values'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Add / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-5"
          >
            <EnvVarForm
              initial={editTarget}
              existingKeys={vars.map((v) => v.key)}
              onSaved={handleSaved}
              onCancel={() => { setShowForm(false); setEditTarget(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {vars.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <Key className="w-10 h-10 text-gray-700" />
              <p className="text-gray-500 text-sm">No environment variables yet</p>
              <button
                onClick={() => { setEditTarget(null); setShowForm(true); }}
                className="text-xs text-violet-400 hover:text-violet-300 underline"
              >
                Add your first variable
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Key', 'Value', 'Description', 'Type', 'Updated', ''].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vars.map((v) => (
                  <tr key={v.key} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                    {/* Key */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {v.is_secret ? (
                          <Lock className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        ) : (
                          <Key className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        )}
                        <code className="text-sm font-mono text-white">{v.key}</code>
                      </div>
                    </td>
                    {/* Value */}
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-gray-300 truncate block max-w-[150px]">
                          {showValues
                            ? (v.value || <span className="text-gray-600 italic">empty</span>)
                            : (v.is_secret ? '••••••••••••' : (v.value || <span className="text-gray-600 italic">empty</span>))
                          }
                        </code>
                        {v.value && (
                          <button
                            onClick={() => copy(v.value, v.key)}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-white transition-all"
                          >
                            {copied === v.key ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </td>
                    {/* Description */}
                    <td className="py-3 px-4 text-sm text-gray-500 max-w-[200px] truncate">
                      {v.description || <span className="text-gray-700 italic">—</span>}
                    </td>
                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full border font-medium',
                        v.is_secret
                          ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                          : 'bg-gray-500/10 border-gray-500/20 text-gray-500'
                      )}>
                        {v.is_secret ? 'Secret' : 'Plain'}
                      </span>
                    </td>
                    {/* Updated */}
                    <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(v.updated_at).toLocaleDateString()}
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditTarget(v); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {deleting === v.key ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500 mx-1.5" />
                        ) : (
                          <button
                            onClick={() => handleDelete(v)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-600">
        {vars.length} variable{vars.length !== 1 ? 's' : ''} stored in D1 database
      </div>
    </div>
  );
}

// ── Add / Edit form ────────────────────────────────────────────────────────────

interface FormState {
  key: string;
  value: string;
  description: string;
  is_secret: boolean;
}

function EnvVarForm({
  initial, existingKeys, onSaved, onCancel
}: {
  initial: EnvVar | null;
  existingKeys: string[];
  onSaved: (v: EnvVar) => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<FormState>({
    key:         initial?.key ?? '',
    value:       initial?.value ?? '',
    description: initial?.description ?? '',
    is_secret:   (initial?.is_secret ?? 0) === 1,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [showVal, setShowVal] = useState(!initial?.is_secret);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    const key = form.key.trim().toUpperCase().replace(/\s+/g, '_');
    if (!key) { setErr('Key is required'); return; }
    if (!isEdit && existingKeys.includes(key)) { setErr('Key already exists'); return; }
    setSaving(true);
    try {
      const saved = await adminApi.env.upsert(key, {
        value: form.value,
        description: form.description,
        is_secret: form.is_secret,
      });
      onSaved(saved);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/5 border border-violet-500/20 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{isEdit ? `Edit: ${initial!.key}` : 'Add Variable'}</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {err && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Key *</label>
            <input
              type="text"
              value={form.key}
              onChange={set('key')}
              placeholder="MY_API_KEY"
              disabled={isEdit}
              className="w-full px-3 h-10 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
              onInput={(e) => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toUpperCase(); }}
              required
            />
            <p className="text-[11px] text-gray-600">Uppercase letters, digits, underscores only</p>
          </div>

          {/* Value */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Value</label>
            <div className="relative">
              <input
                type={showVal ? 'text' : 'password'}
                value={form.value}
                onChange={set('value')}
                placeholder="Enter value…"
                className="w-full pl-3 pr-9 h-10 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowVal((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showVal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={set('description')}
            placeholder="What is this variable used for?"
            className="w-full px-3 h-10 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>

        {/* Secret toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
          <div
            onClick={() => setForm((f) => ({ ...f, is_secret: !f.is_secret }))}
            className={cn(
              'relative w-10 h-5.5 rounded-full border transition-colors',
              form.is_secret
                ? 'bg-violet-500 border-violet-500'
                : 'bg-white/10 border-white/20'
            )}
          >
            <div className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
              form.is_secret ? 'translate-x-5' : 'translate-x-0.5'
            )} />
          </div>
          <div>
            <span className="text-sm text-white">Mark as secret</span>
            <p className="text-xs text-gray-500">Value will be masked in the UI</p>
          </div>
        </label>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 h-9 bg-violet-500 hover:bg-violet-600 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Update' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 h-9 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
